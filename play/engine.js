// The walking world: camera, input, collision, pathfinding, sprites and daylight.
// It knows nothing about money. main.js tells it what is where and where the
// player should head next, and gets told what the player walked to.

import { BUILDINGS, ROOMS, W, H, CLAIM, FORTY, buildTown, drawGround, townProps, bakeBuilding, drawRoom, roomProps, roomSolid, wagon, INK } from './scenery.js';
import { ART } from './art.js';

const SPEED = 4.4; // tiles a second
const SPRITE_H = 1.62, SPRITE_W = SPRITE_H * 0.6;

function svgImage(svg) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export function createEngine(canvas, hooks) {
  const ctx = canvas.getContext('2d');
  let T = 36, Ttown = 36, Troom = 60, dpr = 1, vw = 0, vh = 0;
  let bakedScale = 0;
  let scene = 'town';
  let solid = buildTown();
  let townSolid = solid;
  let ground = null, groundDirty = true;
  let baked = {};
  let props = [];
  let field = []; let season = 'spring';
  let extras = []; // wagon, crowd
  let enabled = false;
  let minute = 360;
  let insets = { top: 96, bottom: 90 };
  const sprites = {};
  const cam = { x: 14, y: 40 };
  const player = { x: 18.5, y: 40.6, dir: 'down', moving: false, path: [], target: null, look: null, bob: 0 };
  const npcs = {}; // id -> { id, x, y, scene, dir, path, name, onArrive }
  let marker = null;
  let near = null;
  let goal = null; // { kind, id } of the next place to go; drawn as a pin, or an arrow at the screen edge
  let floats = []; // short notes that rise off the player's head
  let fade = 0, fadeDir = 0, fadeCb = null;
  const keys = {};
  let steer = null;

  // ---------------------------------------------------------------- sprites

  async function loadSprites() {
    const jobs = [];
    for (const [k, svg] of Object.entries(ART.front)) jobs.push(svgImage(svg).then((i) => { (sprites[k] ||= {}).front = i; }));
    for (const [k, svg] of Object.entries(ART.back)) jobs.push(svgImage(svg).then((i) => { (sprites[k] ||= {}).back = i; }));
    await Promise.all(jobs);
  }
  async function setPlayerLook(key) {
    const [front, back] = await Promise.all([svgImage(ART.playerFront[key]), svgImage(ART.playerBack[key])]);
    sprites.player = { front, back };
  }

  // ---------------------------------------------------------------- layout

  function resize() {
    vw = window.innerWidth; vh = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    insets = hooks.insets ? hooks.insets() : insets;
    const usable = vh - insets.top - insets.bottom;
    Ttown = Math.max(28, Math.min(60, Math.min(vw / 10.5, usable / 13.5)));
    Troom = Math.max(36, Math.min(84, Math.min(vw / 9.3, usable / 9.6)));
    T = scene === 'town' ? Ttown : Troom;
    baked = {}; groundDirty = true;
  }
  window.addEventListener('resize', resize);

  function bakeGround() {
    if (!groundDirty && ground) return;
    groundDirty = false;
    const s = T * dpr;
    const c = document.createElement('canvas');
    if (scene === 'town') {
      c.width = Math.ceil(W * s); c.height = Math.ceil(H * s);
      const g = c.getContext('2d'); g.scale(s, s);
      drawGround(g, season, field);
      ground = { canvas: c, x: 0, y: 0, w: W, h: H };
    } else {
      // Rooms are drawn with a dark margin so they sit in the middle of the screen.
      c.width = Math.ceil(13 * s); c.height = Math.ceil(13 * s);
      const g = c.getContext('2d'); g.scale(s, s); g.translate(2, 2);
      drawRoom(g, scene, hooks.roomState ? hooks.roomState() : {});
      ground = { canvas: c, x: -2, y: -2, w: 13, h: 13 };
    }
  }

  function rebuildProps() {
    if (scene === 'town') {
      const shocks = field.filter((t) => t.state === 'cut' && (t.x + t.y) % 2 === 0).map((t) => [t.x, t.y]);
      props = townProps({ shocks });
      for (const e of extras) {
        if (e.kind === 'wagon') props.push({ y: e.y, draw: (c) => wagon(c, e.x, e.y, e.sign) });
      }
    } else props = roomProps(scene, hooks.roomState ? hooks.roomState() : {});
  }

  // ---------------------------------------------------------------- collision and paths

  function blocked(tx, ty) {
    const gw = scene === 'town' ? W : 9, gh = scene === 'town' ? H : 9;
    if (tx < 0 || ty < 0 || tx >= gw || ty >= gh) return true;
    if (solid[ty][tx]) return true;
    for (const n of Object.values(npcs)) if (n.scene === scene && !n.path.length && Math.floor(n.x) === tx && Math.floor(n.y - 0.2) === ty) return true;
    for (const e of extras) if (scene === 'town' && e.solid && e.solid.some(([x, y]) => x === tx && y === ty)) return true;
    return false;
  }
  function boxFree(x, y) {
    const r = 0.26;
    for (const [px, py] of [[x - r, y - 0.22], [x + r, y - 0.22], [x - r, y + 0.02], [x + r, y + 0.02]]) if (blocked(Math.floor(px), Math.floor(py))) return false;
    return true;
  }
  function los(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay); const n = Math.ceil(d / 0.2);
    for (let i = 1; i <= n; i++) if (!boxFree(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
    return true;
  }
  function astar(sx, sy, goals, ignoreSelf) {
    const gw = scene === 'town' ? W : 9;
    const key = (x, y) => y * gw + x;
    const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
    if (goalSet.has(key(sx, sy))) return [[sx, sy]];
    const h = (x, y) => Math.min(...goals.map(([gx, gy]) => Math.hypot(gx - x, gy - y)));
    const open = [{ x: sx, y: sy, g: 0, f: h(sx, sy) }];
    const came = new Map(); const gs = new Map([[key(sx, sy), 0]]);
    let guard = 0;
    while (open.length && guard++ < 4000) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (goalSet.has(key(cur.x, cur.y))) {
        const out = [[cur.x, cur.y]]; let k = key(cur.x, cur.y);
        while (came.has(k)) { k = came.get(k); out.unshift([k % gw, Math.floor(k / gw)]); }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (blocked(nx, ny) && !(ignoreSelf && goalSet.has(key(nx, ny)))) continue;
        if (dx && dy && (blocked(cur.x + dx, cur.y) || blocked(cur.x, cur.y + dy))) continue;
        const g = cur.g + (dx && dy ? 1.414 : 1);
        const k = key(nx, ny);
        if (g < (gs.get(k) ?? Infinity)) { gs.set(k, g); came.set(k, key(cur.x, cur.y)); open.push({ x: nx, y: ny, g, f: g + h(nx, ny) }); }
      }
    }
    return null;
  }
  function nearestFree(tx, ty, max = 4) {
    if (!blocked(tx, ty)) return [tx, ty];
    for (let r = 1; r <= max; r++) {
      let best = null, bd = Infinity;
      for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
        if (blocked(x, y)) continue; const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) return best;
    }
    return null;
  }
  function smooth(fromX, fromY, tiles) {
    const pts = tiles.map(([x, y]) => [x + 0.5, y + 0.6]);
    const out = []; let ax = fromX, ay = fromY, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !los(ax, ay, pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); [ax, ay] = pts[j]; i = j + 1;
    }
    return out;
  }
  function walkTo(goals, target) {
    const sx = Math.floor(player.x), sy = Math.floor(player.y - 0.2);
    const tiles = astar(sx, sy, goals);
    if (!tiles) { hooks.onBlocked && hooks.onBlocked(target); return false; }
    player.path = smooth(player.x, player.y, tiles.slice(1));
    player.target = target;
    if (!player.path.length) arrive();
    return true;
  }
  function arrive() {
    const t = player.target; player.target = null; marker = null;
    if (t && t.kind !== 'ground') hooks.onArrive(t);
  }

  // ---------------------------------------------------------------- what is where

  function targetsHere() {
    const list = [];
    if (scene === 'town') {
      for (const b of BUILDINGS) list.push({ kind: 'door', id: b.id, enter: b.enter, name: b.name, hit: [b.x, b.y - b.rise, b.w, b.h + b.rise], at: [b.door[0], b.door[1] + 1], reach: 0.7 });
    } else {
      const room = ROOMS[scene];
      for (const t of room.things) list.push({ kind: 'thing', id: t.id, hit: t.hit, at: t.at, reach: t.at ? 0.8 : Infinity });
      list.push({ kind: 'exit', id: 'exit', hit: [4, 7.9, 1, 1.1], at: [4, 8], reach: 0.6 });
    }
    for (const n of Object.values(npcs)) {
      if (n.scene !== scene || n.hidden) continue;
      const room = scene !== 'town' && ROOMS[scene].npc.id === n.id ? ROOMS[scene].npc : null;
      list.push({ kind: 'npc', id: n.id, name: n.name, hit: [n.x - 0.5, n.y - SPRITE_H, 1, SPRITE_H + 0.1], at: room ? room.at : null, npc: n, reach: room ? 2.3 : 1.6 });
    }
    if (scene === 'town') for (const t of field) if (t.mine) list.push({ kind: 'field', id: `${t.x},${t.y}`, tile: t, hit: [t.x, t.y, 1, 1], at: [t.x, t.y], reach: 0.75 });
    return list;
  }

  function goalsFor(t) {
    if (t.at) return [t.at];
    if (t.kind === 'npc') {
      const tx = Math.floor(t.npc.x), ty = Math.floor(t.npc.y - 0.2);
      const out = [];
      for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) if (!blocked(tx + dx, ty + dy)) out.push([tx + dx, ty + dy]);
      return out;
    }
    return [];
  }

  function distTo(t) {
    if (t.reach === Infinity) return 0;
    if (t.kind === 'npc') return Math.hypot(t.npc.x - player.x, t.npc.y - player.y);
    if (t.kind === 'field') return player.x >= t.tile.x && player.x < t.tile.x + 1 && player.y >= t.tile.y && player.y < t.tile.y + 1.2 ? 0 : 9;
    if (t.at) return Math.hypot(t.at[0] + 0.5 - player.x, t.at[1] + 0.6 - player.y);
    return 9;
  }

  function updateNear() {
    let best = null, bd = Infinity;
    for (const t of targetsHere()) {
      if (t.reach === Infinity) continue;
      const d = distTo(t);
      if (d <= t.reach && d < bd) { bd = d; best = t; }
    }
    const k = best ? best.kind + best.id : '';
    const nk = near ? near.kind + near.id : '';
    if (k !== nk) { near = best; hooks.onNear && hooks.onNear(best); }
  }

  // The point a goal pin hangs over, in tile units.
  function resolveGoal() {
    if (!goal) return null;
    return targetsHere().find((t) => t.kind === goal.kind && (goal.kind === 'exit' || t.id === goal.id)) || null;
  }
  function anchor(t) {
    if (t.kind === 'door') { const b = BUILDINGS.find((x) => x.id === t.id); return [b.door[0] + 0.5, b.y + b.h - 2.15]; }
    if (t.kind === 'npc') return [t.npc.x, t.npc.y - SPRITE_H - (t.npc.name ? 0.75 : 0.25)];
    if (t.kind === 'field') return [t.tile.x + 0.5, t.tile.y + 0.15];
    if (t.kind === 'exit') return [4.5, 9.3];
    return [t.hit[0] + t.hit[2] / 2, t.hit[1] - 0.05];
  }

  // ---------------------------------------------------------------- input

  function toWorld(sx, sy) { return [sx / T + cam.x - vw / 2 / T, sy / T + cam.y - viewMidY() / T]; }
  function viewMidY() { return insets.top + (vh - insets.top - insets.bottom) / 2; }

  function tapAt(sx, sy) {
    if (!enabled) return;
    const [wx, wy] = toWorld(sx, sy);
    // People and things first (topmost drawn wins), then buildings, then the ground.
    const ts = targetsHere().sort((a, b) => (a.kind === 'npc' ? -1 : 0) - (b.kind === 'npc' ? -1 : 0));
    for (const t of ts) {
      const [x, y, w, h] = t.hit;
      if (wx >= x && wx <= x + w && wy >= y && wy <= y + h) {
        if (t.kind === 'field') break;
        if (distTo(t) <= t.reach) { player.path = []; hooks.onArrive(t); return; }
        const goals = goalsFor(t);
        if (!goals.length) { hooks.onArrive(t); return; }
        marker = { x: goals[0][0] + 0.5, y: goals[0][1] + 0.6, t: 0 };
        walkTo(goals, t);
        return;
      }
    }
    const tx = Math.floor(wx), ty = Math.floor(wy);
    const f = targetsHere().find((t) => t.kind === 'field' && t.tile.x === tx && t.tile.y === ty);
    if (f) { marker = { x: tx + 0.5, y: ty + 0.6, t: 0 }; if (distTo(f) === 0) { hooks.onArrive(f); return; } walkTo([[tx, ty]], f); return; }
    const g = nearestFree(tx, ty);
    if (!g) return;
    marker = { x: g[0] + 0.5, y: g[1] + 0.6, t: 0 };
    walkTo([g], { kind: 'ground' });
  }

  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (!enabled) return;
    canvas.setPointerCapture(e.pointerId);
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    clearTimeout(down.timer);
    down.timer = setTimeout(() => { if (down) { steer = { x: down.x, y: down.y }; player.path = []; player.target = null; } }, 260);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    if (steer) { steer.x = e.clientX; steer.y = e.clientY; return; }
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) { clearTimeout(down.timer); steer = { x: e.clientX, y: e.clientY }; player.path = []; player.target = null; }
  });
  const up = (e) => {
    if (!down) return;
    clearTimeout(down.timer);
    if (!steer && e.type === 'pointerup') tapAt(e.clientX, e.clientY);
    steer = null; down = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      if (e.target.tagName === 'INPUT') return;
      keys[k] = true; if (enabled) { player.path = []; player.target = null; } e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // ---------------------------------------------------------------- the loop

  let last = performance.now();
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    let moved = 0;
    if (enabled) {
      // Direct control: keys or a held finger.
      let vx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
      let vy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
      if (steer) {
        const [wx, wy] = toWorld(steer.x, steer.y);
        const dx = wx - player.x, dy = wy - (player.y - 0.6);
        if (Math.hypot(dx, dy) > 0.3) { vx = dx; vy = dy; }
      }
      if (vx || vy) {
        const l = Math.hypot(vx, vy); vx /= l; vy /= l;
        const s = SPEED * dt;
        const nx = player.x + vx * s, ny = player.y + vy * s;
        const ox = player.x, oy = player.y;
        if (boxFree(nx, player.y)) player.x = nx;
        if (boxFree(player.x, ny)) player.y = ny;
        moved = Math.hypot(player.x - ox, player.y - oy);
        if (Math.abs(vy) > Math.abs(vx) * 0.6) player.dir = vy < 0 ? 'up' : 'down';
        // Pushing up into a doorway goes inside.
        if (vy < -0.5 && near && (near.kind === 'door' || near.kind === 'exit') && moved < 0.002) hooks.onArrive(near);
        if (vy > 0.5 && scene !== 'town' && player.y > 8.3) hooks.onArrive({ kind: 'exit', id: 'exit' });
      }
    }
    if (player.path.length) {
      const [px, py] = player.path[0];
      const dx = px - player.x, dy = py - player.y; const d = Math.hypot(dx, dy);
      const s = SPEED * dt;
      if (d <= s) { player.x = px; player.y = py; player.path.shift(); moved += d; if (!player.path.length) arrive(); }
      else { player.x += (dx / d) * s; player.y += (dy / d) * s; moved += s; }
      if (Math.abs(dy) > Math.abs(dx) * 0.6) player.dir = dy < 0 ? 'up' : 'down';
    }
    player.moving = moved > 0;
    if (moved > 0) { player.bob += dt * 13; if (hooks.onStep && hooks.onStep(moved) === false) { player.path = []; player.target = null; marker = null; } }
    else player.bob = 0;
    // NPCs walking on errands
    for (const n of Object.values(npcs)) {
      if (!n.path.length) { n.moving = false; continue; }
      const [px, py] = n.path[0];
      const dx = px - n.x, dy = py - n.y; const d = Math.hypot(dx, dy); const s = SPEED * 0.8 * dt;
      if (d <= s) { n.x = px; n.y = py; n.path.shift(); if (!n.path.length) { n.dir = 'down'; const cb = n.onArrive; n.onArrive = null; cb && cb(); } }
      else { n.x += (dx / d) * s; n.y += (dy / d) * s; n.dir = dy < -Math.abs(dx) * 0.6 ? 'up' : 'down'; }
      n.moving = true; n.bob = (n.bob || 0) + dt * 12;
    }
    updateNear();
    // camera
    const gw = scene === 'town' ? W : 9, gh = scene === 'town' ? H : 9;
    const halfW = vw / 2 / T, top = viewMidY() / T, bottom = (vh - viewMidY()) / T;
    let cx = player.x, cy = player.y - 0.6;
    if (scene === 'town') {
      cx = Math.max(halfW, Math.min(gw - halfW, cx)); cy = Math.max(top - insets.top / T + 0.2, Math.min(gh - bottom + insets.bottom / T - 0.2, cy));
      if (gw < halfW * 2) cx = gw / 2;
    } else { cx = 4.5; cy = 4.3; }
    const k = 1 - Math.pow(0.0005, dt);
    if (cam.snap) { cam.x = cx; cam.y = cy; cam.snap = false; } else { cam.x += (cx - cam.x) * k; cam.y += (cy - cam.y) * k; }
    if (fadeDir) {
      fade = Math.max(0, Math.min(1, fade + fadeDir * dt * 5));
      if (fade >= 1 && fadeDir > 0) { fadeDir = 0; const cb = fadeCb; fadeCb = null; cb && cb(); }
      else if (fade <= 0 && fadeDir < 0) fadeDir = 0;
    }
    draw(t);
    requestAnimationFrame(step);
  }

  function drawSprite(img, x, y, bob, moving, alpha = 1) {
    if (!img) return;
    const lift = moving ? Math.abs(Math.sin(bob)) * 0.09 : 0;
    const tilt = moving ? Math.sin(bob) * 0.06 : 0;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(x, y - lift); ctx.rotate(tilt);
    ctx.drawImage(img, -SPRITE_W / 2, -SPRITE_H * 0.955, SPRITE_W, SPRITE_H);
    ctx.restore();
  }

  function daylight() {
    // Multiply tint by time of day, from dawn to dusk.
    const stops = [[300, [200, 190, 220]], [360, [255, 222, 200]], [450, [255, 248, 238]], [600, [255, 255, 255]], [930, [255, 255, 255]], [1050, [255, 228, 186]], [1140, [236, 168, 140]], [1200, [120, 118, 170]], [1260, [80, 80, 130]]];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (minute >= stops[i][0] && minute <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    const f = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (minute - a[0]) / (b[0] - a[0])));
    const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
    const dusk = Math.max(0, Math.min(1, (minute - 1080) / 120));
    return { color: `rgb(${c.join(',')})`, dusk };
  }

  function draw(t) {
    if (!vw) return;
    bakeGround();
    const s = T * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = scene === 'town' ? '#8FB866' : '#2A2420';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, (vw / 2 - cam.x * T) * dpr, (viewMidY() - cam.y * T) * dpr);
    ctx.drawImage(ground.canvas, ground.x, ground.y, ground.w, ground.h);
    if (marker) {
      marker.t += 0.016;
      const r = 0.22 + Math.sin(marker.t * 8) * 0.03;
      ctx.beginPath(); ctx.ellipse(marker.x, marker.y, r * 1.4, r * 0.7, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(138,58,42,.8)'; ctx.lineWidth = 0.06; ctx.stroke();
    }
    // Everything that stands up, sorted by its feet.
    const items = props.map((p) => p);
    if (scene === 'town') {
      if (bakedScale !== s) { baked = {}; bakedScale = s; }
      for (const it of items) if (it.building && !baked[it.building.id]) baked[it.building.id] = bakeBuilding(it.building, s);
    }
    for (const n of Object.values(npcs)) if (n.scene === scene && !n.hidden) items.push({ y: n.y, npc: n });
    if (sprites.player) items.push({ y: player.y, player: true });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.building) { const bk = baked[it.building.id]; ctx.drawImage(bk.canvas, bk.x, bk.y, bk.w, bk.h); }
      else if (it.npc) { const n = it.npc; const sp = sprites[n.sprite || n.id]; if (sp) drawSprite(n.dir === 'up' ? sp.back : sp.front, n.x, n.y, n.bob || 0, n.moving); }
      else if (it.player) drawSprite(player.dir === 'up' ? sprites.player.back : sprites.player.front, player.x, player.y, player.bob, player.moving);
      else it.draw(ctx);
    }
    // chimney smoke from home
    if (scene === 'town') {
      const home = BUILDINGS.find((b) => b.id === 'home');
      if (home.smoke) for (let i = 0; i < 4; i++) {
        const p = ((t * 0.35 + i / 4) % 1);
        ctx.beginPath(); ctx.arc(home.smoke[0] + Math.sin(p * 6 + i) * 0.15 + p * 0.4, home.smoke[1] - p * 1.6, 0.12 + p * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,236,228,${0.55 * (1 - p)})`; ctx.fill();
      }
    }
    // Daylight
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (scene === 'town') {
      const { color, dusk } = daylight();
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      if (dusk > 0.05) {
        ctx.setTransform(s, 0, 0, s, (vw / 2 - cam.x * T) * dpr, (viewMidY() - cam.y * T) * dpr);
        for (const b of BUILDINGS) for (const [x, y, w, h] of b.lit || []) {
          ctx.fillStyle = `rgba(255,206,110,${0.75 * dusk})`; ctx.fillRect(x + 0.06, y + 0.06, w - 0.12, h - 0.12);
          const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h));
          g.addColorStop(0, `rgba(255,200,110,${0.35 * dusk})`); g.addColorStop(1, 'rgba(255,200,110,0)');
          ctx.fillStyle = g; ctx.fillRect(x - w, y - h, w * 3, h * 3);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    // Name tags over people, in screen space so they stay crisp.
    ctx.font = `600 ${12 * dpr}px Spectral, Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of Object.values(npcs)) {
      if (n.scene !== scene || n.hidden || !n.name) continue;
      const sx = (vw / 2 + (n.x - cam.x) * T) * dpr, sy = (viewMidY() + (n.y - SPRITE_H - 0.08 - cam.y) * T) * dpr;
      const w = ctx.measureText(n.name).width + 14 * dpr, h = 18 * dpr;
      const isNear = near && near.kind === 'npc' && near.id === n.id;
      ctx.fillStyle = isNear ? '#2A2420' : 'rgba(246,238,219,.94)';
      ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx - w / 2, sy - h, w, h, 6 * dpr) : ctx.rect(sx - w / 2, sy - h, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isNear ? '#F6EEDB' : '#2A2420'; ctx.fillText(n.name, sx, sy - h / 2 + 0.5 * dpr);
    }
    drawGoal(t);
    drawFloats(t);
    if (fade > 0) { ctx.fillStyle = `rgba(42,36,32,${fade})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  }

  // The next place to go: a red pin bobbing over it, or a round arrow at the
  // edge of the screen pointing the way when it is out of sight.
  function drawGoal(t) {
    const g = enabled ? resolveGoal() : null;
    if (!g) return;
    if (near && near.kind === g.kind && near.id === g.id) return;
    const [ax, ay] = anchor(g);
    const sx = vw / 2 + (ax - cam.x) * T, sy = viewMidY() + (ay - cam.y) * T;
    const m = 30, top = insets.top + m, bot = vh - insets.bottom - m;
    ctx.save(); ctx.scale(dpr, dpr);
    const out = g.kind === 'exit';
    if (!out && sx > m && sx < vw - m && sy > top - 10 && sy < bot + 10) {
      const bob = Math.sin(t * 4) * 4;
      ctx.translate(sx, sy + bob);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-4, -8, -11, -12, -11, -21); ctx.arc(0, -21, 11, Math.PI, 0); ctx.bezierCurveTo(11, -12, 4, -8, 0, 0); ctx.closePath();
      ctx.fillStyle = '#A8321F'; ctx.fill(); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -21, 4.5, 0, Math.PI * 2); ctx.fillStyle = '#F6EEDB'; ctx.fill();
    } else {
      // where the line from the middle of the view to the goal leaves the visible box
      // (the way out of a room is always an arrow under the door)
      const cx = vw / 2, cy = viewMidY();
      const dx = out ? 0 : sx - cx, dy = out ? 1 : sy - cy;
      const k = out ? 1 : Math.min(dx ? (dx > 0 ? vw - m - cx : m - cx) / dx : Infinity, dy ? (dy > 0 ? bot - cy : top - cy) / dy : Infinity);
      const ex = out ? sx : cx + dx * k, ey = out ? Math.min(sy + Math.sin(t * 4) * 3, bot) : cy + dy * k;
      const a = Math.atan2(dy, dx);
      const pulse = 1 + Math.sin(t * 4) * 0.06;
      ctx.translate(ex, ey); ctx.scale(pulse, pulse);
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fillStyle = '#F6EEDB'; ctx.fill(); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 2; ctx.stroke();
      ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -8); ctx.lineTo(-1, 0); ctx.lineTo(-4, 8); ctx.closePath();
      ctx.fillStyle = '#A8321F'; ctx.fill(); ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats(t) {
    floats = floats.filter((f) => t - f.t0 < 2.6);
    if (!floats.length) return;
    ctx.save(); ctx.scale(dpr, dpr);
    ctx.font = 'italic 600 14px Spectral, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of floats) {
      const age = t - f.t0;
      const sx = vw / 2 + (player.x - cam.x) * T, sy = viewMidY() + (player.y - SPRITE_H - 0.35 - cam.y) * T - age * 14;
      const w = ctx.measureText(f.text).width + 20;
      ctx.globalAlpha = Math.min(1, age * 5, (2.6 - age) * 1.5);
      ctx.fillStyle = '#2A2420';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx - w / 2, sy - 13, w, 26, 13) : ctx.rect(sx - w / 2, sy - 13, w, 26); ctx.fill();
      ctx.fillStyle = '#F6EEDB'; ctx.fillText(f.text, sx, sy + 1);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- the API

  function setScene(next, spawn) {
    scene = next;
    T = scene === 'town' ? Ttown : Troom;
    solid = next === 'town' ? townSolid : roomSolid(ROOMS[next]);
    groundDirty = true; rebuildProps();
    if (spawn) { player.x = spawn[0]; player.y = spawn[1]; }
    player.path = []; player.target = null; marker = null; near = null;
    cam.snap = true;
    hooks.onNear && hooks.onNear(null);
    hooks.onScene && hooks.onScene(scene);
  }

  resize();
  requestAnimationFrame(step);

  return {
    ready: loadSprites(),
    setPlayerLook,
    get scene() { return scene; },
    get player() { return player; },
    get near() { return near; },
    T: () => T,
    enable(v) { enabled = v; if (!v) { steer = null; down = null; player.path = []; for (const k in keys) keys[k] = false; } },
    setTime(m) { minute = m; },
    setSeason(s) { if (s !== season) { season = s; groundDirty = true; } },
    setField(tiles) { field = tiles; groundDirty = true; if (scene === 'town') rebuildProps(); },
    setExtras(list) { extras = list; if (scene === 'town') rebuildProps(); },
    refreshRoom() { groundDirty = true; rebuildProps(); },
    resize,
    // Fade to dark, do something, and fade back when told to.
    blackout(fn) { fadeDir = 1; fadeCb = () => fn(() => { fadeDir = -1; }); },
    // Fade out, swap, fade in.
    go(next, spawn, cb) {
      fadeDir = 1; fadeCb = () => { setScene(next, spawn); cb && cb(); fadeDir = -1; };
    },
    place(next, spawn) { setScene(next, spawn); },
    setNpc(id, opts) {
      if (opts === null) { delete npcs[id]; return; }
      const n = npcs[id] || (npcs[id] = { id, x: 0, y: 0, scene: 'town', dir: 'down', path: [] });
      Object.assign(n, opts);
      if (opts.x != null && !opts.keepPath) n.path = [];
    },
    // Walk an NPC to somewhere near the player and call back on arrival.
    npcVisit(id, cb) {
      const n = npcs[id]; if (!n) return cb && cb();
      const px = Math.floor(player.x), py = Math.floor(player.y - 0.2);
      const goals = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [0, -1]]) if (!blocked(px + dx, py + dy)) goals.push([px + dx, py + dy]);
      const saved = scene; // pathfind on the town grid
      const tiles = astar(Math.floor(n.x), Math.floor(n.y - 0.2), goals.length ? goals : [[px, py + 1]], true);
      if (!tiles) { n.x = goals[0][0] + 0.5; n.y = goals[0][1] + 0.6; return cb && cb(); }
      n.path = tiles.slice(1).map(([x, y]) => [x + 0.5, y + 0.6]);
      n.onArrive = () => { n.dir = 'down'; cb && cb(); };
      void saved;
      if (!n.path.length) n.onArrive();
    },
    npcWalk(id, to, cb) {
      const n = npcs[id]; if (!n) return cb && cb();
      const tiles = astar(Math.floor(n.x), Math.floor(n.y - 0.2), [to], true);
      if (!tiles) { n.x = to[0] + 0.5; n.y = to[1] + 0.6; return cb && cb(); }
      n.path = tiles.slice(1).map(([x, y]) => [x + 0.5, y + 0.6]);
      n.onArrive = cb;
      if (!n.path.length) { n.onArrive = null; cb && cb(); }
    },
    stop() { player.path = []; player.target = null; marker = null; },
    setGoal(g) { goal = g; },
    // Walk to the goal, or act on it if already there. Returns false if it isn't in this scene.
    walkToGoal() {
      const t = resolveGoal(); if (!t) return false;
      if (distTo(t) <= t.reach) { player.path = []; hooks.onArrive(t); return true; }
      const g = goalsFor(t); if (!g.length) { hooks.onArrive(t); return true; }
      marker = { x: g[0][0] + 0.5, y: g[0][1] + 0.6, t: 0 };
      walkTo(g, t); return true;
    },
    floatText(text) { floats.push({ text, t0: performance.now() / 1000 }); },
    toScreen(x, y) { return [vw / 2 + (x - cam.x) * T, viewMidY() + (y - cam.y) * T]; },
    walkToTarget(t) { const g = goalsFor(t); if (g.length) walkTo(g, t); },
    fieldTiles: { CLAIM, FORTY },
    INK,
  };
}
