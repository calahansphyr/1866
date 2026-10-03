// The town of Abilene, Kansas, drawn top-down in three-quarter view.
// Everything here is in tile units: the engine scales one tile to however many
// pixels fit the screen. Ground is baked once; buildings and props are baked
// to their own small canvases and drawn sorted by their feet.

export const INK = '#3A2A20';
const LW = 0.055;

// ------------------------------------------------------------------ color

function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); }
export function mix(a, b, t) {
  const x = hex(a), y = hex(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const lite = (c, t = 0.2) => mix(c, '#FFFFFF', t);
const dark = (c, t = 0.2) => mix(c, '#1A0E08', t);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ drawing helpers

function path(ctx, pts, close = true) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function inked(ctx, fill, w = LW) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
function shade(ctx, x, y, w, h, base) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
  g.addColorStop(0, lite(base, 0.12)); g.addColorStop(1, dark(base, 0.1));
  return g;
}
function line(ctx, x1, y1, x2, y2, color, w) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
}
function text(ctx, s, x, y, size, color, maxW) {
  ctx.save();
  ctx.font = `${size}px 'IM Fell English SC', 'Iowan Old Style', Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  // Canvas text at tiny sizes renders badly; draw large and scale down.
  const k = 40;
  ctx.translate(x, y); ctx.scale(1 / k, 1 / k);
  ctx.font = `${size * k}px 'IM Fell English SC', 'Iowan Old Style', Georgia, serif`;
  ctx.fillText(s, 0, 0, maxW ? maxW * k : undefined);
  ctx.restore();
}
function shadow(ctx, cx, cy, rx, ry, a = 0.18) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(42,36,32,${a})`; ctx.fill();
}
function windowPane(ctx, x, y, w, h, opts = {}) {
  rr(ctx, x, y, w, h, 0.04); inked(ctx, opts.frame || '#F2E6CC', 0.045);
  ctx.fillStyle = opts.glass || '#5F7F93';
  ctx.fillRect(x + 0.06, y + 0.06, w - 0.12, h - 0.12);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  path(ctx, [[x + 0.08, y + h * 0.55], [x + w * 0.45, y + 0.08], [x + w * 0.62, y + 0.08], [x + 0.08, y + h * 0.8]]); ctx.fill();
  line(ctx, x + w / 2, y + 0.06, x + w / 2, y + h - 0.06, opts.frame || '#F2E6CC', 0.045);
  line(ctx, x + 0.06, y + h / 2, x + w - 0.06, y + h / 2, opts.frame || '#F2E6CC', 0.045);
}
function door(ctx, x, y, w, h, color, opts = {}) {
  rr(ctx, x, y, w, h, 0.03); inked(ctx, shade(ctx, x, y, w, h, color), 0.05);
  for (let i = 1; i < 3; i++) line(ctx, x + (w * i) / 3, y + 0.08, x + (w * i) / 3, y + h - 0.04, dark(color, 0.25), 0.03);
  if (opts.glass) { ctx.fillStyle = '#5F7F93'; ctx.fillRect(x + 0.12, y + 0.14, w - 0.24, h * 0.32); }
  ctx.beginPath(); ctx.arc(x + w * 0.8, y + h * 0.55, 0.045, 0, Math.PI * 2); ctx.fillStyle = '#D8B04A'; ctx.fill();
}
function clapboard(ctx, x, y, w, h, color, step = 0.22) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let yy = y + step; yy < y + h; yy += step) line(ctx, x, yy, x + w, yy, dark(color, 0.14), 0.025);
  ctx.restore();
}
function bricks(ctx, x, y, w, h, color) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const bh = 0.16, bw = 0.38;
  for (let r = 0, yy = y; yy < y + h; r++, yy += bh) {
    line(ctx, x, yy, x + w, yy, mix(color, '#E8D8C0', 0.45), 0.022);
    for (let xx = x + (r % 2 ? bw / 2 : 0); xx < x + w; xx += bw) line(ctx, xx, yy, xx, yy + bh, mix(color, '#E8D8C0', 0.45), 0.022);
  }
  ctx.restore();
}
function shingles(ctx, pts, color, bounds) {
  path(ctx, pts); inked(ctx, shade(ctx, bounds[0], bounds[1], bounds[2], bounds[3], color));
  ctx.save(); path(ctx, pts); ctx.clip();
  const [x, y, w, h] = bounds;
  for (let r = 0, yy = y + 0.2; yy < y + h; r++, yy += 0.24) {
    line(ctx, x, yy, x + w, yy, dark(color, 0.22), 0.025);
    for (let xx = x + (r % 2 ? 0.15 : 0); xx < x + w; xx += 0.3) line(ctx, xx, yy, xx, yy + 0.24, dark(color, 0.16), 0.02);
  }
  ctx.restore();
  path(ctx, pts); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
}
function signBoard(ctx, s, x, y, w, h, bg = '#F2E6CC', fg = '#3A2A20', size = 0.42) {
  rr(ctx, x, y, w, h, 0.05); inked(ctx, bg, 0.05);
  ctx.strokeStyle = mix(bg, fg, 0.35); ctx.lineWidth = 0.025; rr(ctx, x + 0.07, y + 0.07, w - 0.14, h - 0.14, 0.03); ctx.stroke();
  text(ctx, s, x + w / 2, y + h / 2 + 0.02, size, fg, w - 0.25);
}

// ------------------------------------------------------------------ buildings

// Each building is baked to a canvas spanning [x, y - rise] .. [x + w, y + h].
// The footprint (x, y, w, h) is what blocks walking. Windows listed in `lit`
// glow at dusk.
export const BUILDINGS = [
  { id: 'wire', kind: 'telegraph', x: 2, y: 10, w: 4, h: 3, rise: 1.9, door: [3, 12], enter: 'wire', name: 'Telegraph office' },
  { id: 'store', kind: 'store', x: 8, y: 9, w: 6, h: 4, rise: 1.3, door: [10, 12], enter: 'store', name: "Pruitt's store" },
  { id: 'bank', kind: 'bank', x: 15, y: 9, w: 5, h: 4, rise: 1.3, door: [17, 12], enter: 'bank', name: 'The bank' },
  { id: 'saloon', kind: 'saloon', x: 21, y: 9, w: 5, h: 4, rise: 1.3, door: [23, 12], name: 'The saloon' },
  { id: 'church', kind: 'church', x: 21, y: 17, w: 5, h: 4, rise: 4.2, door: [23, 20], name: 'The church' },
  { id: 'ames', kind: 'cabin', x: 2, y: 18, w: 4, h: 3, rise: 1.2, door: [3, 20], name: "Widow Ames's cabin" },
  { id: 'brandt', kind: 'frame', x: 21, y: 27, w: 4, h: 3, rise: 1.9, door: [22, 29], name: "Brandt's house" },
  { id: 'barn', kind: 'barn', x: 25, y: 26, w: 3, h: 4, rise: 1.6, door: [26, 29], name: "Brandt's barn" },
  { id: 'home', kind: 'soddy', x: 5, y: 39, w: 5, h: 3, rise: 0.9, door: [7, 41], enter: 'home', name: 'Home' },
];

function drawBuilding(ctx, b, opts = {}) {
  const { x, y, w, h } = b;
  const base = y + h; // the ground line of the front wall
  if (b.kind === 'store' || b.kind === 'bank' || b.kind === 'saloon') {
    const wall = { store: '#C9A06A', bank: '#B8553E', saloon: '#B98352' }[b.kind];
    const roof = { store: '#7A5A3E', bank: '#5A4A44', saloon: '#6B4A32' }[b.kind];
    shadow(ctx, x + w / 2 + 0.2, base, w / 2 + 0.3, 0.35);
    // Roof seen from above, behind the false front.
    shingles(ctx, [[x + 0.15, y - 0.4], [x + w - 0.15, y - 0.4], [x + w - 0.15, base - 2.4], [x + 0.15, base - 2.4]], roof, [x, y - 0.6, w, h]);
    const ft = base - 3.25; // top of the false front
    const facade = b.kind === 'saloon'
      ? [[x, base], [x, ft + 0.3], [x + w * 0.3, ft + 0.3], [x + w * 0.3, ft], [x + w * 0.7, ft], [x + w * 0.7, ft + 0.3], [x + w, ft + 0.3], [x + w, base]]
      : [[x, base], [x, ft + 0.15], [x + w, ft + 0.15], [x + w, base]];
    path(ctx, facade); inked(ctx, shade(ctx, x, ft, w, 3.2, wall));
    if (b.kind === 'bank') bricks(ctx, x + 0.05, ft + 0.2, w - 0.1, 3.0, wall); else clapboard(ctx, x, ft + 0.2, w, 3.0, wall);
    // Cornice
    rr(ctx, x - 0.12, ft - 0.02, w + 0.24, 0.26, 0.04); inked(ctx, dark(wall, 0.3));
    if (b.kind === 'bank') {
      for (let i = 0; i < 7; i++) { ctx.fillStyle = '#E8D8C0'; ctx.fillRect(x + 0.3 + i * (w - 0.6) / 6.5, ft + 0.26, 0.14, 0.12); }
    }
    // Sign
    const label = { store: "PRUITT'S", bank: 'BANK', saloon: 'SALOON' }[b.kind];
    const sub = { store: 'GENERAL STORE', bank: '', saloon: '' }[b.kind];
    signBoard(ctx, label, x + 0.45, ft + 0.36, w - 0.9, 0.62, b.kind === 'bank' ? '#2E2A28' : '#F2E6CC', b.kind === 'bank' ? '#E8C86A' : '#3A2A20', 0.46);
    if (sub) text(ctx, sub, x + w / 2, ft + 1.17, 0.2, b.kind === 'bank' ? '#F2E6CC' : '#3A2A20', w - 1);
    // Windows and door
    const dw = 0.86, dx = b.door[0] + 0.5 - dw / 2;
    if (b.kind === 'store') {
      windowPane(ctx, x + 0.35, base - 1.75, 1.7, 1.25, { frame: '#F2E6CC' });
      windowPane(ctx, x + w - 2.05, base - 1.75, 1.7, 1.25, { frame: '#F2E6CC' });
      // goods in the windows
      for (let i = 0; i < 4; i++) { rr(ctx, x + 0.5 + i * 0.36, base - 0.85, 0.26, 0.32, 0.04); inked(ctx, ['#B5532E', '#D8B04A', '#6E8F4E', '#3E6C9A'][i], 0.03); }
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + w - 1.7 + i * 0.5, base - 0.7, 0.18, 0.2, 0, 0, Math.PI * 2); inked(ctx, ['#C9A06A', '#E8DCC0', '#8A6A4A'][i], 0.03); }
      door(ctx, dx, base - 1.55, dw, 1.55, '#6B4226', { glass: true });
    } else if (b.kind === 'bank') {
      for (const wx of [x + 0.45, x + w - 1.35]) {
        ctx.beginPath(); ctx.moveTo(wx, base - 0.55); ctx.lineTo(wx, base - 1.5); ctx.arc(wx + 0.45, base - 1.5, 0.45, Math.PI, 0); ctx.lineTo(wx + 0.9, base - 0.55); ctx.closePath();
        inked(ctx, '#F2E6CC', 0.05);
        ctx.fillStyle = '#4F6A7C'; ctx.fillRect(wx + 0.1, base - 1.5, 0.7, 0.85);
        line(ctx, wx + 0.45, base - 1.85, wx + 0.45, base - 0.65, '#F2E6CC', 0.04);
      }
      door(ctx, dx - 0.05, base - 1.6, dw + 0.1, 1.6, '#2E2A28', { glass: true });
      ctx.beginPath(); ctx.arc(dx + dw / 2, base - 1.6, (dw + 0.1) / 2, Math.PI, 0); inked(ctx, '#5F7F93', 0.05);
    } else {
      windowPane(ctx, x + 0.35, base - 1.6, 1.1, 1.0);
      windowPane(ctx, x + w - 1.45, base - 1.6, 1.1, 1.0);
      // swinging doors
      rr(ctx, dx, base - 1.5, dw, 1.5, 0.02); inked(ctx, '#2A1E16', 0.04);
      rr(ctx, dx, base - 1.15, dw / 2 - 0.02, 0.75, 0.04); inked(ctx, '#9A6A3E', 0.04);
      rr(ctx, dx + dw / 2 + 0.02, base - 1.15, dw / 2 - 0.02, 0.75, 0.04); inked(ctx, '#9A6A3E', 0.04);
      // balcony rail
      line(ctx, x + 0.2, base - 2.15, x + w - 0.2, base - 2.15, INK, 0.07);
      for (let i = 0; i <= 10; i++) line(ctx, x + 0.25 + i * (w - 0.5) / 10, base - 2.15, x + 0.25 + i * (w - 0.5) / 10, base - 1.85, INK, 0.04);
      line(ctx, x + 0.2, base - 1.85, x + w - 0.2, base - 1.85, INK, 0.06);
    }
    b.lit = b.kind === 'store' ? [[x + 0.35, base - 1.75, 1.7, 1.25], [x + w - 2.05, base - 1.75, 1.7, 1.25]] : b.kind === 'saloon' ? [[x + 0.35, base - 1.6, 1.1, 1.0], [x + w - 1.45, base - 1.6, 1.1, 1.0]] : [];
    // a step of shadow at the foot of the wall
    ctx.fillStyle = 'rgba(42,36,32,.18)'; ctx.fillRect(x, base - 0.08, w, 0.08);
    return;
  }

  if (b.kind === 'telegraph' || b.kind === 'frame' || b.kind === 'church') {
    const wall = { telegraph: '#E8DCC0', frame: '#D9C9A0', church: '#F4EEE0' }[b.kind];
    const roof = { telegraph: '#4A5468', frame: '#7A4A32', church: '#6E6A66' }[b.kind];
    const wallH = b.kind === 'church' ? 2.2 : 1.9;
    const top = base - wallH;
    const cx = x + w / 2;
    const peak = top - (b.kind === 'church' ? 1.25 : 1.0);
    const back = b.kind === 'church' ? 1.9 : 1.5; // how far the ridge recedes up the screen
    shadow(ctx, cx + 0.25, base, w / 2 + 0.35, 0.35);
    // Roof slopes receding behind the gable.
    shingles(ctx, [[x - 0.18, top + 0.06], [cx, peak], [cx, peak - back], [x - 0.18, top + 0.06 - back]], dark(roof, 0.08), [x - 0.2, peak - back, w / 2 + 0.2, top - peak + back + 0.1]);
    shingles(ctx, [[x + w + 0.18, top + 0.06], [cx, peak], [cx, peak - back], [x + w + 0.18, top + 0.06 - back]], lite(roof, 0.06), [cx, peak - back, w / 2 + 0.2, top - peak + back + 0.1]);
    // Front wall and gable end.
    path(ctx, [[x, base], [x, top], [cx, peak + 0.12], [x + w, top], [x + w, base]]);
    inked(ctx, shade(ctx, x, peak, w, base - peak, wall));
    clapboard(ctx, x + 0.02, top + 0.02, w - 0.04, wallH - 0.04, wall, 0.2);
    // Trim along the gable
    path(ctx, [[x - 0.2, top + 0.1], [cx, peak], [x + w + 0.2, top + 0.1]], false); ctx.strokeStyle = INK; ctx.lineWidth = 0.13; ctx.stroke();
    path(ctx, [[x - 0.2, top + 0.1], [cx, peak], [x + w + 0.2, top + 0.1]], false); ctx.strokeStyle = dark(roof, 0.05); ctx.lineWidth = 0.07; ctx.stroke();
    const dw = 0.82, dx = b.door[0] + 0.5 - dw / 2;
    if (b.kind === 'telegraph') {
      signBoard(ctx, 'TELEGRAPH', x + 0.35, top + 0.12, w - 0.7, 0.5, '#2F3A4E', '#F2E6CC', 0.34);
      windowPane(ctx, x + w - 1.35, base - 1.25, 0.95, 0.8);
      door(ctx, dx, base - 1.3, dw, 1.3, '#3E4A5E');
      // insulators on the gable
      ctx.beginPath(); ctx.arc(cx, peak + 0.45, 0.13, 0, Math.PI * 2); inked(ctx, '#7FB2C8', 0.04);
      b.lit = [[x + w - 1.35, base - 1.25, 0.95, 0.8]];
    } else if (b.kind === 'frame') {
      windowPane(ctx, x + 0.25, base - 1.4, 0.7, 0.8);
      windowPane(ctx, x + w - 0.95, base - 1.4, 0.7, 0.8);
      ctx.beginPath(); ctx.arc(cx, peak + 0.55, 0.22, 0, Math.PI * 2); inked(ctx, '#5F7F93', 0.04);
      door(ctx, dx, base - 1.3, dw, 1.3, '#5A6B4A');
      b.lit = [[x + 0.25, base - 1.4, 0.7, 0.8], [x + w - 0.95, base - 1.4, 0.7, 0.8]];
    } else {
      // church: tall windows, double door, and a steeple standing on the ridge
      for (const wx of [x + 0.45, x + w - 1.05]) {
        ctx.beginPath(); ctx.moveTo(wx, base - 0.5); ctx.lineTo(wx, base - 1.55); ctx.arc(wx + 0.3, base - 1.55, 0.3, Math.PI, 0); ctx.lineTo(wx + 0.6, base - 0.5); ctx.closePath();
        inked(ctx, '#7FA6C0', 0.05);
        line(ctx, wx + 0.3, base - 1.8, wx + 0.3, base - 0.55, '#F4EEE0', 0.04);
      }
      door(ctx, dx - 0.1, base - 1.45, dw + 0.2, 1.45, '#8A3A2A');
      ctx.beginPath(); ctx.arc(dx + dw / 2, base - 1.45, (dw + 0.2) / 2, Math.PI, 0); inked(ctx, '#8A3A2A', 0.05);
      // Steeple: tower base on the front of the ridge, belfry, spire, cross.
      const tw = 1.0, tx = cx - tw / 2, tb = peak + 0.35, tt = peak - 1.0;
      path(ctx, [[tx, tb], [tx, tt], [tx + tw, tt], [tx + tw, tb]]); inked(ctx, shade(ctx, tx, tt, tw, tb - tt, wall));
      clapboard(ctx, tx, tt, tw, tb - tt, wall, 0.18);
      ctx.beginPath(); ctx.moveTo(tx + 0.28, tt + 0.95); ctx.lineTo(tx + 0.28, tt + 0.45); ctx.arc(cx, tt + 0.45, 0.22, Math.PI, 0); ctx.lineTo(tx + 0.72, tt + 0.95); ctx.closePath();
      inked(ctx, '#3A2A20', 0.04);
      ctx.beginPath(); ctx.arc(cx, tt + 0.62, 0.13, 0, Math.PI); ctx.fillStyle = '#D8B04A'; ctx.fill();
      rr(ctx, tx - 0.1, tt - 0.12, tw + 0.2, 0.16, 0.03); inked(ctx, dark(wall, 0.25), 0.04);
      path(ctx, [[tx - 0.05, tt - 0.1], [cx, tt - 1.25], [tx + tw + 0.05, tt - 0.1]]); inked(ctx, shade(ctx, tx, tt - 1.2, tw, 1.2, roof));
      line(ctx, cx, tt - 1.25, cx, tt - 1.6, INK, 0.07); line(ctx, cx - 0.12, tt - 1.48, cx + 0.12, tt - 1.48, INK, 0.07);
      b.lit = [];
    }
    ctx.fillStyle = 'rgba(42,36,32,.18)'; ctx.fillRect(x, base - 0.08, w, 0.08);
    return;
  }

  if (b.kind === 'cabin') {
    const top = base - 1.6;
    shadow(ctx, x + w / 2 + 0.2, base, w / 2 + 0.3, 0.32);
    // side-gable roof seen from the front: one big slope above the logs
    shingles(ctx, [[x - 0.3, top + 0.12], [x + 0.25, y - 0.9], [x + w - 0.25, y - 0.9], [x + w + 0.3, top + 0.12]], '#7A5A3E', [x - 0.3, y - 0.9, w + 0.6, top - y + 1.1]);
    rr(ctx, x, top, w, 1.6, 0.05); inked(ctx, '#9A7A52');
    for (let i = 0; i < 6; i++) {
      const yy = top + 0.06 + i * 0.26;
      rr(ctx, x - 0.08, yy, w + 0.16, 0.24, 0.12); inked(ctx, i % 2 ? '#A88A5E' : '#957650', 0.03);
      ctx.beginPath(); ctx.arc(x - 0.02, yy + 0.12, 0.09, 0, Math.PI * 2); inked(ctx, '#C9AE7E', 0.025);
      ctx.beginPath(); ctx.arc(x + w + 0.02, yy + 0.12, 0.09, 0, Math.PI * 2); inked(ctx, '#C9AE7E', 0.025);
    }
    windowPane(ctx, x + w - 1.3, top + 0.35, 0.8, 0.7, { frame: '#E8DCC0' });
    door(ctx, b.door[0] + 0.1, base - 1.3, 0.8, 1.3, '#6B4A2E');
    // chimney
    rr(ctx, x + w - 0.9, y - 1.3, 0.45, 0.8, 0.04); inked(ctx, '#9A8A7A');
    b.lit = [[x + w - 1.3, top + 0.35, 0.8, 0.7]];
    return;
  }

  if (b.kind === 'barn') {
    const top = base - 2.2;
    shadow(ctx, x + w / 2 + 0.2, base, w / 2 + 0.3, 0.32);
    shingles(ctx, [[x - 0.12, top + 0.05], [x + 0.3, top - 0.8], [x + w / 2, top - 1.35], [x + w / 2, top - 2.6], [x + 0.3, top - 2.05], [x - 0.12, top - 1.2]], '#5A4A44', [x - 0.2, top - 2.6, w / 2 + 0.2, 2.7]);
    shingles(ctx, [[x + w + 0.12, top + 0.05], [x + w - 0.3, top - 0.8], [x + w / 2, top - 1.35], [x + w / 2, top - 2.6], [x + w - 0.3, top - 2.05], [x + w + 0.12, top - 1.2]], '#6E5E58', [x + w / 2, top - 2.6, w / 2 + 0.2, 2.7]);
    path(ctx, [[x, base], [x, top], [x + 0.35, top - 0.75], [x + w / 2, top - 1.2], [x + w - 0.35, top - 0.75], [x + w, top], [x + w, base]]);
    inked(ctx, shade(ctx, x, top - 1.2, w, 3.4, '#A8462E'));
    for (let xx = x + 0.25; xx < x + w; xx += 0.25) line(ctx, xx, top - 0.6, xx, base, dark('#A8462E', 0.18), 0.02);
    rr(ctx, x + 0.5, base - 1.6, w - 1, 1.6, 0.03); inked(ctx, '#8A3424', 0.05);
    line(ctx, x + 0.5, base - 1.6, x + w - 0.5, base, '#F2E6CC', 0.07); line(ctx, x + w - 0.5, base - 1.6, x + 0.5, base, '#F2E6CC', 0.07);
    rr(ctx, x + 0.5, base - 1.6, w - 1, 1.6, 0.03); ctx.strokeStyle = '#F2E6CC'; ctx.lineWidth = 0.07; ctx.stroke();
    rr(ctx, x + w / 2 - 0.3, top - 0.75, 0.6, 0.5, 0.03); inked(ctx, '#3A2A20', 0.04);
    b.lit = [];
    return;
  }

  if (b.kind === 'soddy') {
    const top = base - 1.35;
    shadow(ctx, x + w / 2 + 0.2, base, w / 2 + 0.35, 0.34);
    // Sod roof seen from above, grassy, with a lip over the wall.
    rr(ctx, x - 0.2, y - 0.85, w + 0.4, top - y + 1.0, 0.25); inked(ctx, shade(ctx, x, y - 0.8, w, 2, '#86A85A'));
    const r = rng(7);
    for (let i = 0; i < 46; i++) {
      const gx = x + r() * w, gy = y - 0.7 + r() * (top - y + 0.6);
      line(ctx, gx, gy, gx + 0.05, gy - 0.14, '#5E8040', 0.03);
      if (i % 7 === 0) { ctx.beginPath(); ctx.arc(gx + 0.1, gy - 0.05, 0.05, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? '#F2D27A' : '#E9A0B4'; ctx.fill(); }
    }
    // Sod-block wall
    rr(ctx, x, top, w, 1.35, 0.06); inked(ctx, '#8A6A44');
    ctx.save(); rr(ctx, x, top, w, 1.35, 0.06); ctx.clip();
    for (let rrw = 0; rrw < 5; rrw++) {
      const yy = top + rrw * 0.28;
      for (let xx = x + (rrw % 2 ? -0.3 : 0); xx < x + w; xx += 0.6) {
        rr(ctx, xx + 0.02, yy + 0.02, 0.56, 0.24, 0.06);
        ctx.fillStyle = rrw % 2 ? '#94744C' : '#8A6A44'; ctx.fill();
        ctx.strokeStyle = '#6A4E30'; ctx.lineWidth = 0.025; ctx.stroke();
        line(ctx, xx + 0.08, yy + 0.05, xx + 0.4, yy + 0.05, '#7E9A50', 0.03);
      }
    }
    ctx.restore();
    rr(ctx, x, top, w, 1.35, 0.06); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
    windowPane(ctx, x + 0.45, top + 0.3, 0.75, 0.6, { frame: '#C9A06A' });
    windowPane(ctx, x + w - 1.2, top + 0.3, 0.75, 0.6, { frame: '#C9A06A' });
    door(ctx, b.door[0] + 0.1, base - 1.2, 0.8, 1.2, '#7A5A3A');
    // stovepipe
    rr(ctx, x + w - 1.0, y - 1.35, 0.22, 0.75, 0.03); inked(ctx, '#4A4440', 0.045);
    rr(ctx, x + w - 1.06, y - 1.42, 0.34, 0.12, 0.02); inked(ctx, '#4A4440', 0.04);
    b.lit = [[x + 0.45, top + 0.3, 0.75, 0.6], [x + w - 1.2, top + 0.3, 0.75, 0.6]];
    b.smoke = [x + w - 0.89, y - 1.45];
  }
}

// ------------------------------------------------------------------ props

function tree(ctx, x, y, s = 1, kind = 'cottonwood') {
  shadow(ctx, x + 0.15 * s, y, 0.75 * s, 0.26 * s, 0.2);
  rr(ctx, x - 0.12 * s, y - 0.9 * s, 0.24 * s, 0.95 * s, 0.08 * s); inked(ctx, '#7A4A2A');
  const g = kind === 'cottonwood' ? ['#6E9E4A', '#86B85A', '#A2CC72'] : ['#5E8A44', '#74A052', '#90BC66'];
  const blobs = [[-0.42, -1.25, 0.5], [0.4, -1.3, 0.48], [0, -1.75, 0.58], [-0.15, -1.05, 0.45], [0.25, -1.0, 0.42]];
  ctx.beginPath();
  for (const [bx, by, br] of blobs) { ctx.moveTo(x + (bx + br) * s, y + by * s); ctx.arc(x + bx * s, y + by * s, br * s, 0, Math.PI * 2); }
  ctx.strokeStyle = INK; ctx.lineWidth = LW * 2.2; ctx.stroke();
  ctx.fillStyle = g[0]; ctx.fill();
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(x + (bx - 0.08) * s, y + (by - 0.08) * s, br * 0.72 * s, 0, Math.PI * 2); ctx.fillStyle = g[1]; ctx.fill(); }
  for (const [bx, by, br] of blobs.slice(0, 3)) { ctx.beginPath(); ctx.arc(x + (bx - 0.16) * s, y + (by - 0.16) * s, br * 0.35 * s, 0, Math.PI * 2); ctx.fillStyle = g[2]; ctx.fill(); }
}

function well(ctx, x, y) {
  shadow(ctx, x + 0.1, y + 0.05, 0.6, 0.22);
  ctx.beginPath(); ctx.ellipse(x, y - 0.35, 0.48, 0.2, 0, 0, Math.PI * 2); inked(ctx, '#3A4A55');
  rr(ctx, x - 0.48, y - 0.35, 0.96, 0.42, 0.06); inked(ctx, '#9A8A7A');
  for (let i = 0; i < 3; i++) line(ctx, x - 0.48, y - 0.22 + i * 0.12, x + 0.48, y - 0.22 + i * 0.12, '#7A6A5A', 0.025);
  ctx.beginPath(); ctx.ellipse(x, y - 0.35, 0.48, 0.2, 0, Math.PI, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
  line(ctx, x - 0.42, y - 0.3, x - 0.42, y - 1.25, INK, 0.11); line(ctx, x + 0.42, y - 0.3, x + 0.42, y - 1.25, INK, 0.11);
  line(ctx, x - 0.42, y - 0.3, x - 0.42, y - 1.25, '#8A5A33', 0.06); line(ctx, x + 0.42, y - 0.3, x + 0.42, y - 1.25, '#8A5A33', 0.06);
  path(ctx, [[x - 0.66, y - 1.12], [x, y - 1.5], [x + 0.66, y - 1.12]]); inked(ctx, '#7A4A32', 0.05);
  line(ctx, x - 0.42, y - 0.95, x + 0.42, y - 0.95, INK, 0.05);
  line(ctx, x, y - 0.95, x, y - 0.6, '#5A4A3A', 0.025);
  rr(ctx, x - 0.12, y - 0.62, 0.24, 0.2, 0.03); inked(ctx, '#8A6A4A', 0.035);
  line(ctx, x + 0.42, y - 0.95, x + 0.62, y - 0.8, INK, 0.05);
}
function pump(ctx, x, y) {
  shadow(ctx, x + 0.05, y, 0.4, 0.15);
  rr(ctx, x - 0.13, y - 0.95, 0.26, 0.95, 0.06); inked(ctx, '#4A5A52');
  line(ctx, x + 0.1, y - 0.7, x + 0.42, y - 0.62, INK, 0.08);
  line(ctx, x, y - 0.95, x - 0.45, y - 1.2, INK, 0.07);
  rr(ctx, x - 0.32, y - 0.1, 0.64, 0.2, 0.05); inked(ctx, '#7A5A3A', 0.04);
}
function barrel(ctx, x, y) {
  shadow(ctx, x + 0.05, y, 0.32, 0.12);
  rr(ctx, x - 0.28, y - 0.62, 0.56, 0.62, 0.12); inked(ctx, shade(ctx, x - 0.3, y - 0.6, 0.6, 0.6, '#9A6A3E'));
  line(ctx, x - 0.28, y - 0.48, x + 0.28, y - 0.48, '#4A4440', 0.05); line(ctx, x - 0.28, y - 0.14, x + 0.28, y - 0.14, '#4A4440', 0.05);
  ctx.beginPath(); ctx.ellipse(x, y - 0.6, 0.26, 0.09, 0, 0, Math.PI * 2); inked(ctx, '#B58A5A', 0.04);
}
function crate(ctx, x, y) {
  shadow(ctx, x + 0.05, y, 0.36, 0.12);
  rr(ctx, x - 0.32, y - 0.55, 0.64, 0.55, 0.04); inked(ctx, '#C9A06A');
  line(ctx, x - 0.3, y - 0.5, x + 0.3, y - 0.05, '#8A6A44', 0.04); line(ctx, x + 0.3, y - 0.5, x - 0.3, y - 0.05, '#8A6A44', 0.04);
}
function woodpile(ctx, x, y) {
  shadow(ctx, x + 0.1, y, 0.7, 0.18);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) {
    ctx.beginPath(); ctx.arc(x - 0.45 + i * 0.3 + r * 0.15, y - 0.14 - r * 0.24, 0.14, 0, Math.PI * 2); inked(ctx, '#C9A06A', 0.035);
    ctx.beginPath(); ctx.arc(x - 0.45 + i * 0.3 + r * 0.15, y - 0.14 - r * 0.24, 0.06, 0, Math.PI * 2); ctx.strokeStyle = '#8A6A44'; ctx.lineWidth = 0.02; ctx.stroke();
  }
}
function tent(ctx, x, y) {
  shadow(ctx, x + 0.1, y, 0.95, 0.24);
  path(ctx, [[x - 0.9, y], [x, y - 1.25], [x + 0.9, y]]); inked(ctx, shade(ctx, x - 0.9, y - 1.2, 1.8, 1.2, '#EDE3CC'));
  path(ctx, [[x - 0.25, y], [x, y - 0.75], [x + 0.25, y]]); inked(ctx, '#5A4A3A', 0.04);
  line(ctx, x, y - 1.25, x, y - 1.5, INK, 0.05);
}
function handcar(ctx, x, y) {
  shadow(ctx, x, y, 0.8, 0.16);
  rr(ctx, x - 0.75, y - 0.55, 1.5, 0.35, 0.04); inked(ctx, '#8A5A33');
  for (const wx of [x - 0.5, x + 0.5]) { ctx.beginPath(); ctx.arc(wx, y - 0.18, 0.17, 0, Math.PI * 2); inked(ctx, '#4A4440', 0.04); }
  line(ctx, x, y - 0.55, x, y - 1.0, INK, 0.07); line(ctx, x - 0.45, y - 1.12, x + 0.45, y - 0.88, INK, 0.07);
}
function ties(ctx, x, y) {
  shadow(ctx, x + 0.1, y, 0.75, 0.15);
  for (let r = 0; r < 3; r++) { rr(ctx, x - 0.7 + r * 0.06, y - 0.2 - r * 0.18, 1.4, 0.18, 0.03); inked(ctx, r % 2 ? '#6B4A32' : '#5A3E2A', 0.035); }
}
function signpost(ctx, x, y, lines, w = 1.9) {
  shadow(ctx, x + 0.05, y, 0.3, 0.1);
  line(ctx, x, y, x, y - 1.3, INK, 0.12); line(ctx, x, y, x, y - 1.3, '#8A5A33', 0.07);
  const h = 0.32 * lines.length + 0.16;
  rr(ctx, x - w / 2, y - 1.3 - h, w, h, 0.05); inked(ctx, '#F2E6CC', 0.05);
  lines.forEach((s, i) => text(ctx, s, x, y - 1.3 - h + 0.24 + i * 0.32, 0.22, INK, w - 0.15));
}
// A fingerpost: one board per line, each with an arrow for the way it points.
function fingerpost(ctx, x, y, boards, w = 2.3) {
  shadow(ctx, x + 0.05, y, 0.3, 0.1);
  const h = 0.36, top = y - 1.2 - boards.length * (h + 0.06);
  line(ctx, x, y, x, top - 0.1, INK, 0.13); line(ctx, x, y, x, top - 0.1, '#8A5A33', 0.08);
  boards.forEach(([s, dir], i) => {
    const by = top + i * (h + 0.06);
    const pts = dir === 'right' ? [[x - w / 2, by], [x + w / 2 - 0.2, by], [x + w / 2, by + h / 2], [x + w / 2 - 0.2, by + h], [x - w / 2, by + h]]
      : dir === 'left' ? [[x - w / 2 + 0.2, by], [x + w / 2, by], [x + w / 2, by + h], [x - w / 2 + 0.2, by + h], [x - w / 2, by + h / 2]]
        : [[x - w / 2, by], [x + w / 2, by], [x + w / 2, by + h], [x - w / 2, by + h]];
    path(ctx, pts); inked(ctx, '#F2E6CC', 0.05);
    const ax = x - w / 2 + 0.24, ay = by + h / 2;
    if (dir === 'up' || dir === 'down') {
      const d = dir === 'up' ? -1 : 1;
      path(ctx, [[ax - 0.1, ay - d * 0.06], [ax + 0.1, ay - d * 0.06], [ax, ay + d * 0.12]]); ctx.fillStyle = '#8A3A2A'; ctx.fill();
      text(ctx, s, x + 0.12, ay + 0.02, 0.22, INK, w - 0.5);
    } else text(ctx, s, x, ay + 0.02, 0.22, INK, w - 0.45);
  });
}
function trough(ctx, x, y) {
  shadow(ctx, x, y, 0.75, 0.14);
  rr(ctx, x - 0.7, y - 0.4, 1.4, 0.4, 0.05); inked(ctx, '#8A5A33');
  rr(ctx, x - 0.6, y - 0.36, 1.2, 0.12, 0.03); ctx.fillStyle = '#6FB3D6'; ctx.fill();
}
function hitchRail(ctx, x, y, w = 1.8) {
  line(ctx, x, y, x, y - 0.55, INK, 0.1); line(ctx, x + w, y, x + w, y - 0.55, INK, 0.1);
  line(ctx, x - 0.08, y - 0.5, x + w + 0.08, y - 0.5, INK, 0.1);
  line(ctx, x - 0.08, y - 0.5, x + w + 0.08, y - 0.5, '#8A5A33', 0.05);
}
function pole(ctx, x, y) {
  line(ctx, x, y, x, y - 2.4, INK, 0.12); line(ctx, x, y, x, y - 2.4, '#7A4A2A', 0.07);
  line(ctx, x - 0.4, y - 2.2, x + 0.4, y - 2.2, INK, 0.08);
  for (const dx of [-0.32, 0.32]) { ctx.beginPath(); ctx.arc(x + dx, y - 2.3, 0.05, 0, Math.PI * 2); ctx.fillStyle = '#7FB2C8'; ctx.fill(); }
}
export function wagon(ctx, x, y, sign = 'PATENT GOODS') {
  shadow(ctx, x + 0.1, y, 1.3, 0.25);
  // canvas bonnet
  ctx.beginPath(); ctx.moveTo(x - 1.05, y - 0.85); ctx.bezierCurveTo(x - 1.1, y - 2.0, x + 1.1, y - 2.0, x + 1.05, y - 0.85); ctx.closePath();
  inked(ctx, shade(ctx, x - 1, y - 2, 2, 1.2, '#EDE3CC'));
  for (const dx of [-0.5, 0, 0.5]) line(ctx, x + dx, y - 1.75 + Math.abs(dx) * 0.15, x + dx * 1.15, y - 0.9, '#C9BC9C', 0.03);
  rr(ctx, x - 1.15, y - 0.95, 2.3, 0.6, 0.05); inked(ctx, '#B5532E');
  signBoard(ctx, sign, x - 0.95, y - 0.88, 1.9, 0.42, '#E6C77A', '#3A2A20', 0.22);
  for (const wx of [x - 0.75, x + 0.75]) {
    ctx.beginPath(); ctx.arc(wx, y - 0.25, 0.3, 0, Math.PI * 2); inked(ctx, '#7A4A2A', 0.06);
    ctx.beginPath(); ctx.arc(wx, y - 0.25, 0.08, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; line(ctx, wx - Math.cos(a) * 0.26, y - 0.25 - Math.sin(a) * 0.26, wx + Math.cos(a) * 0.26, y - 0.25 + Math.sin(a) * 0.26, INK, 0.03); }
  }
}
function bench(ctx, x, y) {
  shadow(ctx, x, y, 0.6, 0.1);
  rr(ctx, x - 0.55, y - 0.38, 1.1, 0.14, 0.03); inked(ctx, '#9A6A3E', 0.04);
  line(ctx, x - 0.45, y - 0.24, x - 0.45, y, INK, 0.06); line(ctx, x + 0.45, y - 0.24, x + 0.45, y, INK, 0.06);
}
function hay(ctx, x, y) {
  shadow(ctx, x + 0.1, y, 0.85, 0.22);
  ctx.beginPath(); ctx.moveTo(x - 0.85, y); ctx.bezierCurveTo(x - 0.9, y - 1.3, x + 0.9, y - 1.3, x + 0.85, y); ctx.closePath();
  inked(ctx, shade(ctx, x - 0.8, y - 1.2, 1.6, 1.2, '#D9B45A'));
  for (let i = 0; i < 6; i++) line(ctx, x - 0.6 + i * 0.24, y - 0.15, x - 0.5 + i * 0.2, y - 0.75 + Math.abs(i - 2.5) * 0.08, '#B08A30', 0.03);
}
function shock(ctx, x, y) {
  // a stook of cut wheat sheaves
  shadow(ctx, x + 0.05, y, 0.28, 0.08);
  path(ctx, [[x - 0.24, y], [x - 0.06, y - 0.6], [x + 0.06, y - 0.6], [x + 0.24, y]]); inked(ctx, '#D9B45A', 0.035);
  line(ctx, x - 0.13, y - 0.3, x + 0.13, y - 0.3, '#8A6A2A', 0.03);
}

// Props: [kind, x, y, solid tiles]
export const PROPS = [
  ['well', 11.2, 40.6], ['woodpile', 3.4, 41.7], ['bench', 4.4, 43.3], ['hay', 21.5, 39.5], ['hay', 23.2, 40.4],
  ['pump', 12.5, 18.4], ['trough', 12.2, 13.9], ['hitch', 19.6, 13.95], ['barrel', 7.5, 12.9], ['barrel', 14.5, 12.9], ['crate', 20.6, 12.9],
  ['tent', 18.5, 5.6], ['tent', 21.3, 5.2], ['handcar', 25, 2.95], ['ties', 23.6, 6.3], ['sign', 16.2, 7.2, ['KANSAS PACIFIC RY.', 'HANDS WANTED']],
  ['pole', 1.2, 3.85], ['pole', 7.2, 3.85], ['pole', 13.2, 3.85], ['pole', 19.2, 3.85], ['pole', 25.2, 3.85], ['pole', 6.6, 12.6],
  ['sign', 12.4, 33.6, ['THE CLAIM']],
  ['post', 16.9, 29.5, [['ABILENE · 1 HOUR', 'up'], ['YOUR CLAIM', 'down'], ['BRANDT', 'right']]],
  ['post', 16.3, 22.5, [['CLAIMS · 1 HOUR', 'down'], ['MAIN STREET', 'up']]],
];
const TREES = [
  [0.8, 23.6, 1.1], [6.4, 27.2, 1], [10.6, 23.8, 0.9], [18.2, 23.4, 1.05], [26.8, 23.8, 1.15], [27.4, 32.6, 1], [1.2, 28.5, 0.9],
  [1, 8.5, 1], [26.9, 7.6, 1.1], [3.6, 6.6, 0.85], [0.8, 16.6, 0.9], [7.4, 19.4, 0.8],
  [1.1, 39.5, 1.1], [2.2, 44.4, 1], [10.6, 44.6, 1.05], [12.9, 38.8, 0.85], [24.6, 43.6, 1.1], [26.8, 39.2, 1], [26.6, 35.6, 0.9], [18.4, 44.4, 0.9], [17.6, 39.4, 1], [20.4, 42.6, 1.1],
];

// ------------------------------------------------------------------ the outdoor map

export const W = 28, H = 46;

// Field plots: one tile is one acre. Your claim first, then Brandt's forty if you buy it.
export const CLAIM = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) CLAIM.push([3 + c, 31 + r]);
export const FORTY = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) FORTY.push([19 + c, 32 + r]);

const CREEK = [[-1, 25.4], [4, 24.9], [9, 25.9], [13.8, 25.5], [18, 24.9], [22, 25.6], [26, 25.1], [29, 25.4]];
const ROADS = [
  { w: 2.2, pts: [[-1, 15], [29, 15]] }, // Main Street
  { w: 1.5, pts: [[14.5, 16], [14.6, 22], [14.4, 28], [14.5, 34], [14.5, 42.5]] },
  { w: 1.2, pts: [[14.5, 42.5], [7.5, 42.5]] },
  { w: 0.9, pts: [[7.5, 42.5], [7.5, 37.4]] },
  { w: 1.0, pts: [[14.5, 31], [18.5, 30.6], [22.5, 30.2]] },
  { w: 1.0, pts: [[14.5, 34.5], [11.6, 34.5]] },
  { w: 1.0, pts: [[24.5, 14], [24.4, 9.4], [24.8, 7.6], [24, 6]] },
  { w: 1.0, pts: [[9, 16.5], [6, 19.2], [3.5, 21.2]] },
  { w: 0.8, pts: [[22.5, 15], [23.5, 21]] },
];
const BRIDGE = { x1: 13.3, x2: 15.7 };

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distToPoly(px, py, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, ...pts[i], ...pts[i + 1]));
  return d;
}

// Fences around the claim and Brandt's field; gates are gaps.
const FENCES = [
  [[2.5, 30.5], [11.5, 30.5]], [[2.5, 37.5], [6.5, 37.5]], [[8.5, 37.5], [11.5, 37.5]], [[2.5, 30.5], [2.5, 37.5]], [[11.5, 30.5], [11.5, 34]], [[11.5, 35], [11.5, 37.5]],
  [[18.5, 31.5], [18.5, 36.5]], [[18.5, 36.5], [24.5, 36.5]], [[24.5, 31.5], [24.5, 36.5]], [[18.5, 31.5], [20.5, 31.5]], [[22.5, 31.5], [24.5, 31.5]],
];

export function buildTown() {
  const solid = Array.from({ length: H }, () => new Uint8Array(W));
  const block = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) solid[y][x] = 1; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cx = x + 0.5, cy = y + 0.5;
    if (distToPoly(cx, cy, CREEK) < 0.95 && !(cx > BRIDGE.x1 && cx < BRIDGE.x2)) solid[y][x] = 1;
  }
  for (const b of BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) block(x, y);
  for (const [x, y] of TREES) block(Math.floor(x), Math.floor(y - 0.2));
  for (const [k, x, y] of PROPS) if (!['pole', 'hitch'].includes(k)) block(Math.floor(x), Math.floor(y - 0.2));
  for (const [[x1, y1], [x2, y2]] of FENCES) {
    if (y1 === y2) for (let x = Math.ceil(x1 - 0.5); x <= Math.floor(x2 - 0.5); x++) block(x, Math.floor(y1));
    else for (let y = Math.ceil(y1 - 0.5); y <= Math.floor(y2 - 0.5); y++) block(Math.floor(x1), y);
  }
  // Map edge
  for (let x = 0; x < W; x++) { block(x, 0); block(x, H - 1); }
  for (let y = 0; y < H; y++) { block(0, y); block(W - 1, y); }
  return solid;
}

// Ground: grass, roads, creek, rail line, field plots. Baked once per season or field change.
export function drawGround(ctx, season, field) {
  const harvest = season === 'harvest';
  const grass = harvest ? '#C4C67C' : '#A6D07A';
  ctx.fillStyle = grass; ctx.fillRect(0, 0, W, H);
  const r = rng(11);
  // soft mottling
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H, rad = 0.6 + r() * 1.6;
    ctx.beginPath(); ctx.ellipse(x, y, rad, rad * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = mix(grass, r() < 0.5 ? '#FFFFFF' : '#2A4A10', 0.05 + r() * 0.04); ctx.fill();
  }
  // Rail line along the top
  ctx.fillStyle = '#B9A88A'; ctx.fillRect(0, 2.1, W, 1.3);
  for (let x = 0.2; x < W; x += 0.5) { ctx.fillStyle = '#6B4A32'; ctx.fillRect(x, 2.15, 0.2, 1.2); }
  line(ctx, 0, 2.45, W, 2.45, '#5A5A62', 0.09); line(ctx, 0, 3.05, W, 3.05, '#5A5A62', 0.09);
  line(ctx, 0, 2.42, W, 2.42, '#A8A8B0', 0.03); line(ctx, 0, 3.02, W, 3.02, '#A8A8B0', 0.03);
  // Creek: bank, water, light.
  const stroke = (pts, w, color) => { path(ctx, pts, false); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  stroke(CREEK, 2.1, '#8A7A52');
  stroke(CREEK, 1.75, '#5E9EC4');
  stroke(CREEK, 1.25, '#74B4D8');
  stroke(CREEK.map(([x, y]) => [x, y - 0.18]), 0.35, '#A8D8EE');
  for (let i = 0; i < 40; i++) { const x = r() * W; const y = 25.3 + Math.sin(x * 0.7) * 0.3 + (r() - 0.5) * 0.6; line(ctx, x, y, x + 0.3, y, 'rgba(255,255,255,.5)', 0.04); }
  // reeds along the banks
  for (let i = 0; i < 60; i++) {
    const x = r() * W; if (x > BRIDGE.x1 - 0.4 && x < BRIDGE.x2 + 0.4) continue;
    const y = 25.3 + (r() < 0.5 ? -1.05 : 0.95) + Math.sin(x) * 0.2;
    line(ctx, x, y, x - 0.05, y - 0.32, '#5E8040', 0.04); line(ctx, x + 0.08, y, x + 0.12, y - 0.26, '#6E9A48', 0.04);
  }
  // Roads: an ink edge, then the dirt, then a lighter crown.
  for (const rd of ROADS) stroke(rd.pts, rd.w + 0.14, mix(grass, '#6A5A30', 0.45));
  for (const rd of ROADS) stroke(rd.pts, rd.w, '#E2C994');
  for (const rd of ROADS) stroke(rd.pts, rd.w * 0.45, '#EBD6A6');
  // Market square
  rr(ctx, 9, 16, 11.5, 4.6, 1.2); ctx.fillStyle = mix(grass, '#6A5A30', 0.45); ctx.fill();
  rr(ctx, 9.08, 16.08, 11.34, 4.44, 1.15); ctx.fillStyle = '#E2C994'; ctx.fill();
  for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(9.6 + r() * 10.3, 16.4 + r() * 3.8, 0.03 + r() * 0.04, 0, Math.PI * 2); ctx.fillStyle = '#C9AE7A'; ctx.fill(); }
  // Boardwalk in front of the shops
  ctx.fillStyle = '#B98A55'; ctx.fillRect(2, 13, 24, 0.95);
  for (let x = 2; x < 26; x += 0.3) line(ctx, x, 13, x, 13.95, '#8A5E36', 0.02);
  line(ctx, 2, 13.95, 26, 13.95, INK, 0.05);
  // Bridge
  rr(ctx, BRIDGE.x1, 23.8, BRIDGE.x2 - BRIDGE.x1, 3.2, 0.05); inked(ctx, '#A8774A');
  for (let y = 23.9; y < 27; y += 0.25) line(ctx, BRIDGE.x1 + 0.05, y, BRIDGE.x2 - 0.05, y, '#7A5434', 0.025);
  line(ctx, BRIDGE.x1, 23.8, BRIDGE.x1, 27, INK, 0.1); line(ctx, BRIDGE.x2, 23.8, BRIDGE.x2, 27, INK, 0.1);
  // Ames's kitchen garden
  for (let i = 0; i < 3; i++) { rr(ctx, 4.6, 21.9 + i * 0.5, 2.6, 0.36, 0.15); ctx.fillStyle = '#8A6440'; ctx.fill(); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(4.85 + k * 0.42, 22.05 + i * 0.5, 0.11, 0, Math.PI * 2); ctx.fillStyle = '#6E9E4A'; ctx.fill(); } }
  // Tall prairie grass in the far corners
  for (let i = 0; i < 520; i++) {
    const x = r() * W, y = r() * H;
    const edge = x < 1.5 || x > W - 1.5 || y > H - 2 || (y < 2 && true);
    const tuft = edge || r() < 0.25;
    if (!tuft) continue;
    const c = edge ? mix(grass, '#3A5A20', 0.35) : mix(grass, '#3A5A20', 0.2);
    line(ctx, x, y, x - 0.06, y - (edge ? 0.34 : 0.18), c, 0.035); line(ctx, x + 0.06, y, x + 0.1, y - (edge ? 0.28 : 0.14), c, 0.035);
  }
  if (!harvest) for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(r() * W, r() * H, 0.045, 0, Math.PI * 2); ctx.fillStyle = ['#F2D27A', '#F4F0E4', '#E9A0B4', '#B9A2E0'][i % 4]; ctx.fill(); }
  drawField(ctx, field, harvest);
}

// field: array of { x, y, state } — prairie, broken, sown, ripe, cut, theirs
function drawField(ctx, field, harvest) {
  const r = rng(5);
  for (const t of field) {
    const { x, y, state } = t;
    if (state === 'prairie') {
      ctx.fillStyle = harvest ? '#B7AE62' : '#8DBA62'; ctx.fillRect(x, y, 1, 1);
      for (let k = 0; k < 7; k++) { const gx = x + r(), gy = y + 0.2 + r() * 0.8; line(ctx, gx, gy, gx - 0.07, gy - 0.32, harvest ? '#8E8440' : '#5E8A40', 0.04); line(ctx, gx + 0.06, gy, gx + 0.12, gy - 0.26, harvest ? '#9E9450' : '#6E9A48', 0.04); }
      continue;
    }
    const soil = state === 'theirs' ? '#9A7A52' : '#8A6440';
    ctx.fillStyle = soil; ctx.fillRect(x, y, 1, 1);
    for (let k = 0; k < 4; k++) line(ctx, x + 0.04, y + 0.15 + k * 0.24, x + 0.96, y + 0.15 + k * 0.24, dark(soil, 0.2), 0.05);
    if (state === 'sown') for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) { const gx = x + 0.12 + j * 0.19, gy = y + 0.13 + k * 0.24; line(ctx, gx, gy, gx - 0.03, gy - 0.1, '#7EBE4E', 0.04); line(ctx, gx, gy, gx + 0.04, gy - 0.09, '#9AD06A', 0.035); }
    if (state === 'ripe' || state === 'theirs-ripe') {
      ctx.fillStyle = '#D9B24E'; ctx.fillRect(x, y, 1, 1);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) {
        const gx = x + 0.1 + j * 0.2 + (r() - 0.5) * 0.05, gy = y + 0.22 + k * 0.24;
        line(ctx, gx, gy, gx + 0.02, gy - 0.2, '#B08A30', 0.03);
        ctx.beginPath(); ctx.ellipse(gx + 0.02, gy - 0.22, 0.035, 0.07, 0.2, 0, Math.PI * 2); ctx.fillStyle = '#EED07A'; ctx.fill();
      }
    }
    if (state === 'cut') { ctx.fillStyle = '#C9AE6A'; ctx.fillRect(x, y, 1, 1); for (let k = 0; k < 6; k++) line(ctx, x + 0.05, y + 0.1 + k * 0.16, x + 0.95, y + 0.1 + k * 0.16, '#A88E4A', 0.025); }
  }
  // Ink grid between plots so the acres are countable.
  ctx.strokeStyle = 'rgba(58,42,32,.22)'; ctx.lineWidth = 0.02;
  for (const t of field) if (t.state !== 'prairie') { ctx.strokeRect(t.x, t.y, 1, 1); }
}

export function townProps(state) {
  // Things drawn sorted with the people, each with a foot y and a draw function.
  const list = [];
  for (const b of BUILDINGS) list.push({ y: b.y + b.h, building: b });
  for (const [x, y, s] of TREES) list.push({ y, draw: (ctx) => tree(ctx, x, y, s, y > 30 ? 'oak' : 'cottonwood') });
  const fns = { well, woodpile, bench, pump, trough, barrel, crate, tent, handcar, ties, pole, hay };
  for (const p of PROPS) {
    const [k, x, y, extra] = p;
    if (k === 'sign') list.push({ y, draw: (ctx) => signpost(ctx, x, y, extra, extra.length > 1 ? 2.5 : 1.5) });
    else if (k === 'post') list.push({ y, draw: (ctx) => fingerpost(ctx, x, y, extra) });
    else if (k === 'hitch') list.push({ y, draw: (ctx) => hitchRail(ctx, x, y) });
    else list.push({ y, draw: (ctx) => fns[k](ctx, x, y) });
  }
  for (const [[x1, y1], [x2, y2]] of FENCES) list.push({ y: Math.max(y1, y2) + (y1 === y2 ? 0.3 : 0), draw: (ctx) => fence(ctx, x1, y1, x2, y2) });
  // Telegraph wire along the rail line
  list.push({ y: 4, draw: (ctx) => { line(ctx, 0, 1.5, W, 1.5, INK, 0.025); line(ctx, 6.6, 10.2, 7.2, 1.5, INK, 0.025); } });
  if (state && state.shocks) for (const [x, y] of state.shocks) list.push({ y: y + 0.7, draw: (ctx) => shock(ctx, x + 0.5, y + 0.7) });
  return list;
}

function fence(ctx, x1, y1, x2, y2) {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1)));
  for (let i = 0; i <= n; i++) {
    const x = x1 + ((x2 - x1) * i) / n, y = y1 + ((y2 - y1) * i) / n;
    line(ctx, x, y + 0.3, x, y - 0.35, INK, 0.1); line(ctx, x, y + 0.3, x, y - 0.35, '#8A6A44', 0.05);
  }
  for (const h of [-0.2, 0.08]) { line(ctx, x1, y1 + h, x2, y2 + h, INK, 0.08); line(ctx, x1, y1 + h, x2, y2 + h, '#A8865A', 0.04); }
}

export function bakeBuilding(b, scale) {
  const pad = 0.6;
  const cw = b.w + pad * 2, ch = b.h + b.rise + pad + 0.6;
  const c = document.createElement('canvas');
  c.width = Math.ceil(cw * scale); c.height = Math.ceil(ch * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale); ctx.translate(-(b.x - pad), -(b.y - b.rise - pad));
  drawBuilding(ctx, b);
  return { canvas: c, x: b.x - pad, y: b.y - b.rise - pad, w: cw, h: ch };
}

// ------------------------------------------------------------------ interiors

// Rooms are 9 x 9. Row 0-1 is the back wall, row 8 the front wall with the door at (4, 8).
// Things have no walk-to spot: tapping one looks at it from wherever you stand.
export const ROOMS = {
  store: {
    floor: '#C9A06A', wall: '#E2CFA6', name: "Pruitt's store",
    solid: ['1-4', '2-4', '3-4', '4-4', '5-4', '6-4', '3-3', '7-3', '1-5', '7-5', '7-6', '2-6', '6-6', '1-7', '6-7', '7-7'],
    npc: { id: 'pruitt', x: 3.5, y: 3.6, at: [3, 5] },
    things: [
      { id: 'book', hit: [3.95, 3.05, 1.3, 0.8] },
      { id: 'preserves', hit: [5.3, 2.95, 0.95, 1.6] },
      { id: 'shelves', hit: [0.65, -0.35, 5.1, 1.85] },
      { id: 'tools', hit: [5.9, -0.35, 2.5, 1.9] },
      { id: 'stove', hit: [0.95, 4.75, 1.2, 1.3] },
      { id: 'checkers', hit: [2.05, 5.95, 0.95, 0.95] },
      { id: 'seed', hit: [0.8, 6.85, 1.45, 1.15] },
      { id: 'plow', hit: [5.55, 5.35, 1.45, 1.35] },
      { id: 'reaper', hit: [5.55, 6.75, 2.7, 1.25] },
      { id: 'barrels', hit: [7.05, 4.9, 1.0, 1.95] },
    ],
  },
  bank: {
    floor: '#A8835A', wall: '#D9CBB0', name: 'The bank',
    solid: ['1-4', '2-4', '3-4', '4-4', '5-4', '6-4', '4-3', '6-1', '7-1', '6-2', '7-2', '1-7', '2-7', '7-6', '7-7'],
    npc: { id: 'cole', x: 4.5, y: 3.6, at: [4, 5] },
    things: [
      { id: 'vault', hit: [6.6, -0.1, 1.8, 2.4] },
      { id: 'notice', hit: [1.0, -0.05, 2.0, 1.15] },
      { id: 'bankclock', hit: [3.95, -0.35, 1.1, 1.45] },
      { id: 'slips', hit: [6.95, 5.4, 1.1, 1.0] },
    ],
  },
  wire: {
    floor: '#B99568', wall: '#DCD6C6', name: 'Telegraph office',
    solid: ['3-4', '4-4', '5-4', '6-4', '7-4', '5-3', '1-6', '2-6', '7-6', '1-4'],
    npc: { id: 'clerk', x: 5.5, y: 3.6, at: [5, 5] },
    things: [
      { id: 'board', hit: [0.75, 0.0, 1.8, 1.3] },
      { id: 'pigeonholes', hit: [5.3, 0.1, 1.7, 1.2] },
      { id: 'batteries', hit: [7.05, 0.2, 1.4, 1.3] },
      { id: 'key', hit: [6.2, 3.1, 1.1, 0.75] },
      { id: 'blanks', hit: [0.9, 3.6, 1.2, 1.2] },
    ],
  },
  home: {
    floor: '#A8875E', wall: '#9A7A52', name: 'Home', earth: true,
    solid: ['1-2', '2-2', '6-2', '7-2', '5-3', '2-5', '3-5', '1-3', '7-3', '7-5'],
    npc: { id: 'ruth', x: 5.5, y: 3.6, at: [5, 4] },
    things: [
      { id: 'bed', hit: [0.75, 1.5, 2.4, 1.4], at: [2, 3] },
      { id: 'jars', hit: [3.3, 0.0, 2.2, 1.3] },
      { id: 'almanac', hit: [2.4, 4.85, 1.2, 0.8] },
      { id: 'calendar', hit: [7.5, -0.05, 0.95, 1.2] },
      { id: 'bible', hit: [2.1, -0.1, 1.05, 1.0] },
      { id: 'trunk', hit: [0.95, 3.0, 1.2, 0.95] },
    ],
  },
};

export function roomSolid(room) {
  const s = Array.from({ length: 9 }, () => new Uint8Array(9));
  for (let i = 0; i < 9; i++) { s[0][i] = 1; s[1][i] = 1; s[8][i] = 1; s[i][0] = 1; s[i][8] = 1; }
  s[8][4] = 0; // the door
  for (const k of room.solid) { const [x, y] = k.split('-').map(Number); s[y][x] = 1; }
  return s;
}

// ---- small goods, all drawn standing on a baseline y and centered on x

function crock(ctx, x, y, w, h, body, band) {
  rr(ctx, x - w / 2, y - h, w, h, w * 0.32); inked(ctx, shade(ctx, x - w / 2, y - h, w, h, body), 0.03);
  if (band) { ctx.fillStyle = band; ctx.fillRect(x - w / 2 + 0.03, y - h * 0.64, w - 0.06, h * 0.14); }
  rr(ctx, x - w * 0.3, y - h - 0.05, w * 0.6, 0.08, 0.02); inked(ctx, dark(body, 0.18), 0.025);
}
function tin(ctx, x, y, w, h, body, label) {
  rr(ctx, x - w / 2, y - h, w, h, 0.025); inked(ctx, shade(ctx, x - w / 2, y - h, w, h, body), 0.03);
  if (label) { ctx.fillStyle = label; ctx.fillRect(x - w / 2 + 0.025, y - h * 0.7, w - 0.05, h * 0.36); }
  line(ctx, x - w / 2 + 0.02, y - h + 0.05, x + w / 2 - 0.02, y - h + 0.05, dark(body, 0.3), 0.02);
}
function bottle(ctx, x, y, h, body) {
  const w = 0.14;
  rr(ctx, x - w / 2, y - h * 0.68, w, h * 0.68, 0.035); inked(ctx, body, 0.025);
  rr(ctx, x - 0.028, y - h, 0.056, h * 0.36, 0.012); inked(ctx, body, 0.022);
  line(ctx, x - 0.03, y - h * 0.58, x - 0.03, y - h * 0.14, 'rgba(255,255,255,.45)', 0.022);
}
function sack(ctx, x, y, w, h, body, label, size = 0.13) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y);
  ctx.bezierCurveTo(x - w / 2 - 0.05, y - h * 0.7, x - w * 0.32, y - h, x - w * 0.12, y - h);
  ctx.lineTo(x + w * 0.12, y - h);
  ctx.bezierCurveTo(x + w * 0.32, y - h, x + w / 2 + 0.05, y - h * 0.7, x + w / 2, y); ctx.closePath();
  inked(ctx, shade(ctx, x - w / 2, y - h, w, h, body), 0.032);
  line(ctx, x - w * 0.17, y - h * 0.84, x + w * 0.17, y - h * 0.84, dark(body, 0.4), 0.03);
  if (label) text(ctx, label, x, y - h * 0.42, size, '#6A3A24', w * 0.86);
}
function bolt(ctx, x, y, w, h, body, stripe) {
  rr(ctx, x - w / 2, y - h, w, h, 0.03); inked(ctx, body, 0.03);
  ctx.save(); rr(ctx, x - w / 2, y - h, w, h, 0.03); ctx.clip();
  for (let k = 1; k < 4; k++) line(ctx, x - w / 2, y - (h * k) / 4, x + w / 2, y - (h * k) / 4, stripe, 0.035);
  for (let k = 1; k < 3; k++) line(ctx, x - w / 2 + (w * k) / 3, y - h, x - w / 2 + (w * k) / 3, y, stripe, 0.035);
  ctx.restore();
  rr(ctx, x - w / 2, y - h, w, h, 0.03); ctx.strokeStyle = INK; ctx.lineWidth = 0.03; ctx.stroke();
}
function lamp(ctx, x, y, s = 1) {
  rr(ctx, x - 0.12 * s, y - 0.08 * s, 0.24 * s, 0.08 * s, 0.02); inked(ctx, '#C9A14A', 0.025);
  ctx.beginPath(); ctx.ellipse(x, y - 0.18 * s, 0.13 * s, 0.1 * s, 0, 0, Math.PI * 2); inked(ctx, '#B5D3D8', 0.025);
  rr(ctx, x - 0.055 * s, y - 0.5 * s, 0.11 * s, 0.24 * s, 0.035 * s); inked(ctx, 'rgba(244,250,250,.92)', 0.022);
  ctx.beginPath(); ctx.ellipse(x, y - 0.34 * s, 0.025 * s, 0.05 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#F2B84A'; ctx.fill();
}
function boots(ctx, x, y) {
  for (const dx of [-0.1, 0.1]) {
    path(ctx, [[x + dx - 0.07, y - 0.42], [x + dx + 0.06, y - 0.42], [x + dx + 0.06, y - 0.1], [x + dx + 0.16, y - 0.06], [x + dx + 0.16, y], [x + dx - 0.07, y]]);
    inked(ctx, '#5A3A26', 0.028);
  }
}
function keg(ctx, x, y, s = 1) {
  shadow(ctx, x + 0.04, y, 0.24 * s, 0.08 * s);
  rr(ctx, x - 0.2 * s, y - 0.42 * s, 0.4 * s, 0.42 * s, 0.09 * s); inked(ctx, shade(ctx, x - 0.2, y - 0.4, 0.4, 0.4, '#A8774A'), 0.035);
  line(ctx, x - 0.2 * s, y - 0.32 * s, x + 0.2 * s, y - 0.32 * s, '#4A4440', 0.035); line(ctx, x - 0.2 * s, y - 0.1 * s, x + 0.2 * s, y - 0.1 * s, '#4A4440', 0.035);
  ctx.beginPath(); ctx.ellipse(x, y - 0.42 * s, 0.18 * s, 0.06 * s, 0, 0, Math.PI * 2); inked(ctx, '#7A7A80', 0.03);
}
// A paper price tag, centered at x, y. The first line is the thing, the second the price.
function tag(ctx, lines, x, y, rot = -0.06) {
  const fs = 0.23, lh = 0.27;
  const width = Math.max(...lines.map((s) => s.length)) * fs * 0.6 + 0.26;
  const h = lines.length * lh + 0.1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  line(ctx, 0, -h / 2, 0, -h / 2 - 0.16, INK, 0.02);
  rr(ctx, -width / 2 + 0.03, -h / 2 + 0.04, width, h, 0.05); ctx.fillStyle = 'rgba(42,36,32,.22)'; ctx.fill();
  rr(ctx, -width / 2, -h / 2, width, h, 0.05); inked(ctx, '#FBF5E6', 0.035);
  lines.forEach((s, i) => text(ctx, s, 0, -h / 2 + 0.05 + lh * (i + 0.5), fs, i ? '#8A3A2A' : INK, width - 0.12));
  ctx.restore();
}
function wallClock(ctx, x, y, minute) {
  // A regulator clock: wooden case, a face, a pendulum window.
  rr(ctx, x - 0.36, y - 0.36, 0.72, 1.3, 0.12); inked(ctx, shade(ctx, x - 0.36, y - 0.36, 0.72, 1.3, '#6B4226'), 0.04);
  ctx.beginPath(); ctx.arc(x, y, 0.28, 0, Math.PI * 2); inked(ctx, '#F6EEDB', 0.035);
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; line(ctx, x + Math.cos(a) * 0.22, y + Math.sin(a) * 0.22, x + Math.cos(a) * 0.25, y + Math.sin(a) * 0.25, INK, 0.02); }
  const m = minute == null ? 600 : minute;
  const ha = ((m / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (m % 60) / 60 * Math.PI * 2 - Math.PI / 2;
  line(ctx, x, y, x + Math.cos(ha) * 0.13, y + Math.sin(ha) * 0.13, INK, 0.035);
  line(ctx, x, y, x + Math.cos(ma) * 0.2, y + Math.sin(ma) * 0.2, INK, 0.025);
  rr(ctx, x - 0.2, y + 0.36, 0.4, 0.5, 0.04); inked(ctx, '#3A3028', 0.03);
  line(ctx, x, y + 0.38, x, y + 0.72, '#C9A14A', 0.02);
  ctx.beginPath(); ctx.arc(x, y + 0.74, 0.07, 0, Math.PI * 2); ctx.fillStyle = '#D8B04A'; ctx.fill();
}

// ---- the back walls and floors, baked once per visit (and again when what they show changes)

export function drawRoom(ctx, key, S) {
  const room = ROOMS[key];
  ctx.fillStyle = '#2A2420'; ctx.fillRect(-6, -6, 21, 21);
  ctx.fillStyle = room.floor; ctx.fillRect(0.5, 1.5, 8, 7);
  if (room.earth) {
    const r = rng(3);
    for (let i = 0; i < 80; i++) { ctx.beginPath(); ctx.arc(0.6 + r() * 7.8, 1.6 + r() * 6.8, 0.03 + r() * 0.05, 0, Math.PI * 2); ctx.fillStyle = dark(room.floor, 0.15); ctx.fill(); }
    // a braided rag rug
    for (const [rx, ry, c] of [[1.7, 1.0, '#B5532E'], [1.45, 0.82, '#E6C77A'], [1.2, 0.64, '#5F7F93'], [0.9, 0.44, '#B5532E']]) {
      ctx.beginPath(); ctx.ellipse(4.5, 6.6, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(4.5, 6.6, 1.7, 1.0, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(42,36,32,.4)'; ctx.lineWidth = 0.03; ctx.stroke();
  } else for (let y = 1.5; y < 8.5; y += 0.36) line(ctx, 0.5, y, 8.5, y, dark(room.floor, 0.18), 0.025);
  if (key === 'bank') {
    // a runner from the door to the teller's window
    rr(ctx, 3.85, 4.75, 1.3, 3.8, 0.04); ctx.fillStyle = '#8A2E24'; ctx.fill();
    rr(ctx, 3.95, 4.85, 1.1, 3.6, 0.03); ctx.strokeStyle = '#D8B04A'; ctx.lineWidth = 0.04; ctx.stroke();
  }
  // back wall
  ctx.fillStyle = shade(ctx, 0.5, 0, 8, 1.8, room.wall); ctx.fillRect(0.5, -0.4, 8, 1.95);
  if (key === 'home') {
    ctx.save(); ctx.beginPath(); ctx.rect(0.5, -0.4, 8, 1.95); ctx.clip();
    for (let r2 = 0; r2 < 6; r2++) for (let xx = 0.5 + (r2 % 2 ? -0.3 : 0); xx < 8.5; xx += 0.6) { rr(ctx, xx + 0.02, -0.38 + r2 * 0.32, 0.56, 0.28, 0.06); ctx.fillStyle = r2 % 2 ? '#94744C' : '#8A6A44'; ctx.fill(); }
    ctx.restore();
  } else if (key === 'bank') bricks(ctx, 0.5, -0.4, 8, 1.95, '#B8553E');
  else clapboard(ctx, 0.5, -0.4, 8, 1.95, room.wall, 0.24);
  line(ctx, 0.5, 1.55, 8.5, 1.55, INK, 0.06);
  ctx.fillStyle = dark(room.wall, 0.35); ctx.fillRect(0.2, -0.4, 0.3, 9.2); ctx.fillRect(8.5, -0.4, 0.3, 9.2);
  ctx.fillRect(0.2, 8.5, 3.8, 0.35); ctx.fillRect(5, 8.5, 3.8, 0.35);
  rr(ctx, 4.05, 8.0, 0.9, 0.55, 0.06); inked(ctx, '#8A5A33', 0.04);
  for (let i = 0; i < 4; i++) line(ctx, 4.15, 8.1 + i * 0.12, 4.85, 8.1 + i * 0.12, '#B5863A', 0.03);

  // the room's name, hung over the door you came in by
  text(ctx, { store: "PRUITT'S GOODS", bank: 'J. COLE & CO., BANKERS', wire: 'WESTERN UNION TELEGRAPH', home: S.family ? `THE ${S.family.toUpperCase()} PLACE` : 'HOME' }[key], 4.5, -1.05, 0.42, '#E8DCC0', 8.6);
  if (key === 'store') storeWall(ctx);
  if (key === 'bank') {
    rr(ctx, 1.0, -0.05, 2.0, 1.15, 0.04); inked(ctx, '#F2E6CC', 0.04);
    text(ctx, 'FIVE PER CENT', 2.0, 0.24, 0.2, INK); text(ctx, 'ON DEPOSITS', 2.0, 0.52, 0.17, INK); text(ctx, 'J. COLE, PRES.', 2.0, 0.82, 0.13, '#5A4A3A');
    wallClock(ctx, 4.5, 0.05, S.minute);
    windowPane(ctx, 5.2, -0.2, 1.1, 1.15, { frame: '#E8DCC0' });
    rr(ctx, 6.6, -0.1, 1.8, 2.4, 0.08); inked(ctx, '#4A4A52');
    rr(ctx, 6.75, 0.0, 1.5, 2.15, 0.06); ctx.strokeStyle = '#6A6A74'; ctx.lineWidth = 0.04; ctx.stroke();
    ctx.beginPath(); ctx.arc(7.5, 1.0, 0.62, 0, Math.PI * 2); inked(ctx, '#6A6A74', 0.05);
    ctx.beginPath(); ctx.arc(7.5, 1.0, 0.18, 0, Math.PI * 2); inked(ctx, '#C9A14A', 0.04);
    for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; line(ctx, 7.5 + Math.cos(a) * 0.2, 1 + Math.sin(a) * 0.2, 7.5 + Math.cos(a) * 0.5, 1 + Math.sin(a) * 0.5, '#C9A14A', 0.05); }
    text(ctx, 'DIEBOLD', 7.5, 0.22, 0.13, '#C9A14A');
    if (S.bankClosed) { line(ctx, 6.5, 0.0, 8.5, 2.2, '#C9A06A', 0.25); line(ctx, 8.5, 0.0, 6.5, 2.2, '#C9A06A', 0.25); }
  }
  if (key === 'wire') {
    rr(ctx, 0.75, 0.0, 1.8, 1.3, 0.05); inked(ctx, '#2E3A34', 0.06);
    text(ctx, 'CHICAGO', 1.65, 0.28, 0.2, '#F2E6CC');
    text(ctx, S.boardPrice || 'WHEAT  $ ?', 1.65, 0.62, 0.22, '#F2E6CC');
    text(ctx, S.boardNote || 'a dollar to read', 1.65, 0.98, 0.15, '#C9D2C2');
    wallClock(ctx, 3.9, 0.0, S.minute);
    signBoard(ctx, 'TELEGRAPH', 5.25, -0.34, 3.05, 0.4, '#2F3A4E', '#F2E6CC', 0.24);
    // pigeonholes with telegrams waiting to be fetched
    rr(ctx, 5.3, 0.15, 1.65, 1.1, 0.03); inked(ctx, '#7A5434', 0.04);
    for (let r2 = 0; r2 < 3; r2++) for (let c = 0; c < 4; c++) {
      const cx = 5.38 + c * 0.39, cy = 0.22 + r2 * 0.34;
      ctx.fillStyle = '#4A3424'; ctx.fillRect(cx, cy, 0.33, 0.28);
      if ((r2 * 4 + c) % 3 !== 1) { ctx.save(); ctx.translate(cx + 0.16, cy + 0.2); ctx.rotate(((r2 + c) % 2 ? 0.12 : -0.08)); ctx.fillStyle = (r2 + c) % 4 ? '#F2E6CC' : '#E8D27A'; ctx.fillRect(-0.12, -0.1, 0.24, 0.12); ctx.restore(); }
    }
    // a shelf of battery jars that drive the line
    rr(ctx, 7.05, 1.12, 1.35, 0.09, 0.02); inked(ctx, '#7A5434', 0.03);
    for (let i = 0; i < 4; i++) {
      const bx = 7.22 + i * 0.33;
      rr(ctx, bx - 0.13, 0.68, 0.26, 0.44, 0.04); inked(ctx, 'rgba(210,230,236,.9)', 0.025);
      ctx.fillStyle = '#4F8FB8'; ctx.fillRect(bx - 0.11, 0.84, 0.22, 0.26);
      line(ctx, bx, 0.6, bx, 0.95, '#8A8A90', 0.035);
      if (i < 3) line(ctx, bx, 0.6, bx + 0.33, 0.6, '#8A3A2A', 0.018);
    }
    line(ctx, 8.21, 0.6, 8.3, -0.4, '#8A3A2A', 0.02); line(ctx, 7.22, 0.6, 7.05, 0.3, INK, 0.02); line(ctx, 7.05, 0.3, 7.05, -0.4, INK, 0.02);
  }
  if (key === 'home') {
    // a small deep-set window with a curtain
    rr(ctx, 0.85, -0.15, 1.05, 0.95, 0.06); inked(ctx, '#6A4E30', 0.04);
    windowPane(ctx, 0.95, -0.07, 0.85, 0.75, { frame: '#C9A06A' });
    path(ctx, [[0.9, -0.12], [1.3, -0.12], [1.05, 0.75], [0.9, 0.75]]); inked(ctx, '#E8C9B0', 0.03);
    // the family Bible and a tintype on a little shelf
    rr(ctx, 2.15, 0.62, 0.95, 0.08, 0.02); inked(ctx, '#7A5434', 0.03);
    rr(ctx, 2.25, 0.36, 0.42, 0.27, 0.03); inked(ctx, '#3A2A20', 0.03); line(ctx, 2.3, 0.4, 2.3, 0.6, '#C9A14A', 0.02);
    rr(ctx, 2.75, 0.18, 0.28, 0.42, 0.03); inked(ctx, '#C9A14A', 0.03); rr(ctx, 2.8, 0.23, 0.18, 0.32, 0.02); ctx.fillStyle = '#6A6A64'; ctx.fill();
    ctx.beginPath(); ctx.arc(2.89, 0.33, 0.05, 0, Math.PI * 2); ctx.fillStyle = '#B8B0A0'; ctx.fill();
    // dried herbs hanging from a peg
    for (let i = 0; i < 3; i++) { line(ctx, 2.3 + i * 0.3, -0.3, 2.3 + i * 0.3, -0.05, '#6A4E30', 0.02); ctx.beginPath(); ctx.ellipse(2.3 + i * 0.3, 0.02, 0.08, 0.12, 0, 0, Math.PI * 2); ctx.fillStyle = ['#7E9A50', '#9A8A50', '#6E8A48'][i]; ctx.fill(); }
    // the cellar shelf: you can see the jars you've put up
    rr(ctx, 3.3, 0.0, 2.2, 1.3, 0.04); inked(ctx, '#7A5434');
    for (let row = 0; row < 2; row++) {
      line(ctx, 3.35, 0.6 + row * 0.6, 5.45, 0.6 + row * 0.6, INK, 0.05);
      for (let i = 0; i < 9; i++) {
        const n = row * 9 + i;
        rr(ctx, 3.42 + i * 0.228, 0.24 + row * 0.6, 0.17, 0.32, 0.04);
        if (n < (S.jars || 0)) inked(ctx, '#D99A4E', 0.03);
        else { ctx.setLineDash([0.05, 0.05]); ctx.strokeStyle = 'rgba(58,42,32,.5)'; ctx.lineWidth = 0.025; ctx.stroke(); ctx.setLineDash([]); }
      }
    }
    line(ctx, 6.75, 1.2, 6.75, -0.4, INK, 0.16); line(ctx, 6.75, 1.2, 6.75, -0.4, '#4A4A50', 0.1);
    // Ruth's calendar, with her pencil sums down the margin
    rr(ctx, 7.55, 0.0, 0.85, 1.1, 0.03); inked(ctx, '#F4F0E4', 0.035);
    ctx.fillStyle = '#8A3A2A'; ctx.fillRect(7.6, 0.05, 0.75, 0.2);
    text(ctx, String(S.year || 1866), 7.97, 0.15, 0.14, '#F4F0E4');
    ctx.strokeStyle = 'rgba(58,42,32,.35)'; ctx.lineWidth = 0.012;
    for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 5; c++) ctx.strokeRect(7.62 + c * 0.1, 0.32 + r2 * 0.12, 0.1, 0.12);
    for (let i = 0; i < 4; i++) line(ctx, 8.15, 0.36 + i * 0.13, 8.32, 0.36 + i * 0.13, '#5A5A62', 0.018);
    line(ctx, 8.12, 0.86, 8.34, 0.86, '#5A5A62', 0.02);
  }
}

function storeWall(ctx) {
  // The goods cabinet: two shelves over a row of drawers.
  rr(ctx, 0.62, -0.38, 5.16, 1.9, 0.04); inked(ctx, '#7A5434', 0.045);
  ctx.fillStyle = '#B98352'; ctx.fillRect(0.72, -0.3, 4.96, 1.24);
  const shelf = (yb) => { rr(ctx, 0.66, yb, 5.08, 0.09, 0.02); inked(ctx, '#7A5434', 0.03); };
  const row = (items, yb) => {
    let x = 0.84;
    for (const it of items) {
      const w = it.w;
      const cx = x + w / 2;
      if (it.k === 'crock') crock(ctx, cx, yb, w, it.h, it.c, it.b);
      if (it.k === 'tin') tin(ctx, cx, yb, w, it.h, it.c, it.b);
      if (it.k === 'bottle') bottle(ctx, cx, yb, it.h, it.c);
      if (it.k === 'lamp') lamp(ctx, cx, yb, 0.95);
      if (it.k === 'sack') sack(ctx, cx, yb, w, it.h, it.c, it.l, 0.1);
      if (it.k === 'bolt') bolt(ctx, cx, yb, w, it.h, it.c, it.b);
      if (it.k === 'boots') boots(ctx, cx, yb);
      x += w + 0.06;
    }
  };
  row([
    { k: 'crock', w: 0.34, h: 0.4, c: '#E6D3A0', b: '#3E6C9A' }, { k: 'crock', w: 0.3, h: 0.34, c: '#E6D3A0', b: '#3E6C9A' },
    { k: 'tin', w: 0.24, h: 0.36, c: '#B5532E', b: '#E8DCC0' }, { k: 'tin', w: 0.24, h: 0.36, c: '#B5532E', b: '#E8DCC0' },
    { k: 'bottle', w: 0.14, h: 0.46, c: '#5E7F4E' }, { k: 'bottle', w: 0.14, h: 0.42, c: '#7A4A2A' }, { k: 'bottle', w: 0.14, h: 0.46, c: '#5E7F4E' },
    { k: 'tin', w: 0.3, h: 0.3, c: '#3E6C9A', b: '#D8B04A' }, { k: 'tin', w: 0.3, h: 0.3, c: '#3E6C9A', b: '#D8B04A' },
    { k: 'lamp', w: 0.26 }, { k: 'crock', w: 0.34, h: 0.38, c: '#9A9A96', b: '#5A5A62' },
    { k: 'tin', w: 0.22, h: 0.4, c: '#D8B04A', b: '#8A3A2A' }, { k: 'tin', w: 0.22, h: 0.4, c: '#D8B04A', b: '#8A3A2A' },
    { k: 'bottle', w: 0.14, h: 0.4, c: '#8A3A2A' },
  ], 0.26);
  shelf(0.26);
  row([
    { k: 'sack', w: 0.5, h: 0.5, c: '#F2EAD6', l: 'FLOUR' }, { k: 'sack', w: 0.46, h: 0.46, c: '#F2EAD6', l: 'FLOUR' },
    { k: 'bolt', w: 0.4, h: 0.38, c: '#C9674E', b: '#F2E0D0' }, { k: 'bolt', w: 0.4, h: 0.38, c: '#5F7F93', b: '#DCE6EC' }, { k: 'bolt', w: 0.4, h: 0.38, c: '#D8B04A', b: '#F6EAC8' },
    { k: 'sack', w: 0.48, h: 0.44, c: '#B98352', l: 'COFFEE' }, { k: 'boots', w: 0.42 },
    { k: 'crock', w: 0.36, h: 0.4, c: '#E6D3A0', b: '#8A3A2A' }, { k: 'tin', w: 0.32, h: 0.28, c: '#6E8F4E', b: '#F2E6CC' },
  ], 0.92);
  shelf(0.92);
  // drawers
  for (let i = 0; i < 6; i++) {
    rr(ctx, 0.74 + i * 0.82, 1.06, 0.76, 0.38, 0.03); inked(ctx, '#9A6A3E', 0.03);
    ctx.beginPath(); ctx.arc(1.12 + i * 0.82, 1.25, 0.04, 0, Math.PI * 2); ctx.fillStyle = '#D8B04A'; ctx.fill();
  }
  // Tools hung on pegs: a grain cradle, a fork, a shovel, rope and a lantern.
  line(ctx, 5.95, -0.18, 8.35, -0.18, '#7A5434', 0.08);
  for (const px of [6.2, 6.95, 7.45, 7.8, 8.15]) { ctx.beginPath(); ctx.arc(px, -0.18, 0.04, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
  // cradle scythe
  line(ctx, 6.05, -0.12, 6.55, 1.42, INK, 0.08); line(ctx, 6.05, -0.12, 6.55, 1.42, '#B98352', 0.045);
  ctx.beginPath(); ctx.moveTo(6.5, 1.36); ctx.quadraticCurveTo(6.1, 1.5, 5.98, 1.18); ctx.lineTo(6.04, 1.2); ctx.quadraticCurveTo(6.16, 1.4, 6.5, 1.3); ctx.closePath(); inked(ctx, '#B8BCC4', 0.03);
  for (let i = 0; i < 4; i++) { const y0 = 0.5 + i * 0.18; ctx.beginPath(); ctx.moveTo(6.24 + i * 0.06, y0); ctx.quadraticCurveTo(6.0 + i * 0.05, y0 + 0.2, 6.0 + i * 0.03, y0 + 0.48); ctx.strokeStyle = '#8A6A44'; ctx.lineWidth = 0.025; ctx.stroke(); }
  // hay fork
  line(ctx, 6.95, -0.12, 6.95, 1.0, INK, 0.07); line(ctx, 6.95, -0.12, 6.95, 1.0, '#B98352', 0.04);
  for (const dx of [-0.1, 0, 0.1]) line(ctx, 6.95 + dx, 1.0, 6.95 + dx * 1.2, 1.4, '#8A8A90', 0.03);
  line(ctx, 6.85, 1.0, 7.05, 1.0, '#8A8A90', 0.04);
  // shovel
  line(ctx, 7.45, -0.12, 7.45, 0.85, INK, 0.07); line(ctx, 7.45, -0.12, 7.45, 0.85, '#B98352', 0.04);
  path(ctx, [[7.3, 0.85], [7.6, 0.85], [7.58, 1.25], [7.45, 1.38], [7.32, 1.25]]); inked(ctx, '#9A9EA6', 0.03);
  // coil of rope
  for (const r2 of [0.2, 0.14, 0.08]) { ctx.beginPath(); ctx.ellipse(7.8, 0.15, r2 * 0.9, r2, 0, 0, Math.PI * 2); ctx.strokeStyle = '#C9A06A'; ctx.lineWidth = 0.05; ctx.stroke(); }
  // lantern
  line(ctx, 8.15, -0.18, 8.15, 0.05, INK, 0.02);
  rr(ctx, 8.03, 0.05, 0.24, 0.36, 0.05); inked(ctx, 'rgba(240,226,180,.9)', 0.03);
  line(ctx, 8.03, 0.23, 8.27, 0.23, INK, 0.02); rr(ctx, 8.0, 0.4, 0.3, 0.07, 0.02); inked(ctx, '#5A5A62', 0.02);
}

// ---- furniture sorted with the people, so a counter hides the shopkeeper's legs but not yours

export function roomProps(key, S) {
  const L = [];
  const counter = (x, w, wood, top) => L.push({ y: 4.7, draw: (ctx) => {
    rr(ctx, x, 3.85, w, 0.85, 0.06); inked(ctx, shade(ctx, x, 3.8, w, 0.9, wood));
    for (let px = x + 0.9; px < x + w - 0.3; px += 1.0) line(ctx, px, 3.95, px, 4.62, dark(wood, 0.22), 0.03);
    rr(ctx, x - 0.05, 3.7, w + 0.1, 0.3, 0.05); inked(ctx, top);
  } });
  const P = S.prices || {};
  if (key === 'store') {
    counter(0.9, 6.05, '#8A5A33', '#A8774A');
    // crates of stock behind the far end of the counter
    L.push({ y: 3.95, draw: (ctx) => { crate(ctx, 7.5, 3.95); crate(ctx, 7.45, 3.42); } });
    L.push({ y: 4.71, draw: (ctx) => {
      // coffee mill
      rr(ctx, 1.05, 3.42, 0.34, 0.36, 0.03); inked(ctx, '#B5322A', 0.03);
      ctx.beginPath(); ctx.arc(1.22, 3.34, 0.17, Math.PI, 0); inked(ctx, '#5A5A62', 0.03);
      line(ctx, 1.22, 3.3, 1.42, 3.18, INK, 0.03);
      // a brass scale
      line(ctx, 1.85, 3.8, 1.85, 3.38, INK, 0.04);
      line(ctx, 1.6, 3.4, 2.1, 3.4, '#C9A14A', 0.04);
      for (const sx of [1.62, 2.08]) { ctx.beginPath(); ctx.ellipse(sx, 3.55, 0.14, 0.05, 0, 0, Math.PI * 2); inked(ctx, '#D8B04A', 0.025); line(ctx, sx, 3.4, sx, 3.52, INK, 0.015); }
      // candy jars
      for (const [cx, c] of [[2.42, '#D96A5A'], [2.74, '#E8C84A'], [3.04, '#7FB27A']]) {
        rr(ctx, cx - 0.12, 3.44, 0.24, 0.34, 0.05); inked(ctx, 'rgba(230,240,240,.75)', 0.025);
        ctx.fillStyle = c; ctx.fillRect(cx - 0.09, 3.58, 0.18, 0.17);
        rr(ctx, cx - 0.08, 3.38, 0.16, 0.07, 0.02); inked(ctx, '#7A7A80', 0.02);
      }
      ledgerBook(ctx, 4.6, 3.47, S);
      // preserves for sale at the end of the counter
      for (let i = 0; i < 3; i++) { rr(ctx, 5.42 + i * 0.26, 3.42, 0.2, 0.32, 0.04); inked(ctx, '#D99A4E', 0.025); rr(ctx, 5.45 + i * 0.26, 3.37, 0.14, 0.07, 0.02); inked(ctx, '#8A6A4A', 0.02); }
      tag(ctx, ['PRESERVES', P.jar || '$4'], 5.75, 4.32, 0.05);
    } });
    // pot-bellied stove where the old men sit in winter
    L.push({ y: 5.95, draw: (ctx) => {
      shadow(ctx, 1.55, 5.95, 0.45, 0.12);
      line(ctx, 1.55, 5.15, 1.55, 4.55, INK, 0.16); line(ctx, 1.55, 5.15, 1.55, 4.55, '#3A3A40', 0.1);
      for (const lx of [1.3, 1.8]) line(ctx, lx, 5.95, lx - (lx < 1.55 ? 0.05 : -0.05), 5.75, INK, 0.06);
      ctx.beginPath(); ctx.ellipse(1.55, 5.48, 0.38, 0.36, 0, 0, Math.PI * 2); inked(ctx, shade(ctx, 1.2, 5.1, 0.7, 0.7, '#3E3A3A'), 0.05);
      rr(ctx, 1.3, 5.12, 0.5, 0.1, 0.03); inked(ctx, '#2E2A2A', 0.03);
      rr(ctx, 1.42, 5.42, 0.26, 0.2, 0.04); inked(ctx, '#2A2420', 0.03);
      ctx.fillStyle = '#E8853A'; ctx.fillRect(1.46, 5.5, 0.18, 0.08);
    } });
    // a cracker barrel with a checkers game under way
    L.push({ y: 6.85, draw: (ctx) => {
      barrel(ctx, 2.55, 6.85);
      ctx.save(); ctx.translate(2.55, 6.25); ctx.scale(1, 0.42);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i + j) % 2 ? '#2A2420' : '#C9674E'; ctx.fillRect(-0.24 + i * 0.12, -0.24 + j * 0.12, 0.12, 0.12); }
      ctx.restore();
      for (const [px, py, c] of [[2.43, 6.2, '#F2E6CC'], [2.62, 6.28, '#2A2420'], [2.68, 6.18, '#F2E6CC']]) { ctx.beginPath(); ctx.ellipse(px, py, 0.045, 0.025, 0, 0, Math.PI * 2); inked(ctx, c, 0.015); }
    } });
    // pickle and cracker barrels
    L.push({ y: 5.95, draw: (ctx) => { barrel(ctx, 7.55, 5.95); line(ctx, 7.5, 5.35, 7.75, 5.05, INK, 0.035); } });
    L.push({ y: 6.9, draw: (ctx) => barrel(ctx, 7.55, 6.9) });
    // seed sacks by the door, with a price tag
    L.push({ y: 7.95, draw: (ctx) => {
      sack(ctx, 1.2, 7.95, 0.5, 0.62, '#E2D2A8', 'SEED', 0.12);
      sack(ctx, 1.75, 7.98, 0.5, 0.58, '#E2D2A8', 'SEED', 0.12);
      sack(ctx, 1.5, 7.62, 0.46, 0.5, '#D9C79A', '', 0.12);
      tag(ctx, ['SEED WHEAT', `${P.seed || '$1.50'} AN ACRE`], 1.55, 6.85, -0.05);
    } });
    // the steel plow on show, or a keg once yours is out on the claim
    L.push({ y: 6.6, draw: (ctx) => {
      if (S.plow) { keg(ctx, 6.4, 6.6); return; }
      shadow(ctx, 6.35, 6.6, 0.55, 0.12);
      line(ctx, 5.85, 6.45, 6.75, 6.3, INK, 0.1); line(ctx, 5.85, 6.45, 6.75, 6.3, '#8A5A33', 0.06);
      line(ctx, 6.45, 6.36, 6.9, 5.7, INK, 0.07); line(ctx, 6.6, 6.33, 7.0, 5.82, INK, 0.07);
      line(ctx, 6.45, 6.36, 6.9, 5.7, '#A8774A', 0.04); line(ctx, 6.6, 6.33, 7.0, 5.82, '#A8774A', 0.04);
      ctx.beginPath(); ctx.moveTo(5.7, 6.62); ctx.quadraticCurveTo(5.85, 6.2, 6.25, 6.28); ctx.lineTo(6.2, 6.58); ctx.closePath(); inked(ctx, '#C4C8D0', 0.035);
      line(ctx, 5.7, 6.62, 6.22, 6.6, '#E8ECF0', 0.03);
      tag(ctx, ['STEEL PLOW', P.plow || '$20 CASH'], 6.3, 5.55, 0.06);
    } });
    // the reaper on show from 1868; kegs of nails before that
    L.push({ y: 7.9, draw: (ctx) => {
      if (!(S.year >= 1868) || S.reaper) { keg(ctx, 6.35, 7.85); keg(ctx, 6.9, 7.9); keg(ctx, 7.5, 7.85); return; }
      shadow(ctx, 6.9, 7.9, 1.1, 0.16);
      rr(ctx, 5.85, 7.45, 1.65, 0.32, 0.03); inked(ctx, '#C9A06A', 0.035);            // platform
      line(ctx, 5.8, 7.82, 7.55, 7.82, INK, 0.05);
      for (let x = 5.85; x < 7.5; x += 0.11) { path(ctx, [[x, 7.8], [x + 0.05, 7.9], [x + 0.1, 7.8]]); inked(ctx, '#C4C8D0', 0.015); } // cutter bar
      ctx.beginPath(); ctx.arc(7.7, 7.5, 0.4, 0, Math.PI * 2); inked(ctx, '#B5532E', 0.05);  // drive wheel
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; line(ctx, 7.7, 7.5, 7.7 + Math.cos(a) * 0.36, 7.5 + Math.sin(a) * 0.36, INK, 0.03); }
      ctx.beginPath(); ctx.arc(7.7, 7.5, 0.08, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
      // the reel
      for (let k = 0; k < 5; k++) { const a = (k * Math.PI * 2) / 5 + 0.3; line(ctx, 6.6, 6.95, 6.6 + Math.cos(a) * 0.5, 6.95 + Math.sin(a) * 0.32, '#8A5A33', 0.05); }
      ctx.beginPath(); ctx.ellipse(6.6, 6.95, 0.5, 0.32, 0, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 0.03; ctx.stroke();
      line(ctx, 7.3, 7.45, 7.55, 6.95, INK, 0.05); rr(ctx, 7.4, 6.82, 0.32, 0.14, 0.04); inked(ctx, '#5A5A62', 0.03); // seat
      tag(ctx, ['REAPER', P.reaper || '$35 CASH'], 6.3, 7.32, -0.04);
    } });
  }
  if (key === 'bank') {
    L.push({ y: 4.7, draw: (ctx) => {
      rr(ctx, 0.9, 3.85, 6.2, 0.85, 0.06); inked(ctx, shade(ctx, 0.9, 3.8, 6.2, 0.9, '#5A3A2A'));
      for (let px = 1.6; px < 7; px += 1.0) { rr(ctx, px - 0.32, 4.0, 0.64, 0.55, 0.03); ctx.strokeStyle = dark('#5A3A2A', 0.3); ctx.lineWidth = 0.03; ctx.stroke(); }
      rr(ctx, 0.85, 3.7, 6.3, 0.3, 0.05); inked(ctx, '#7A4A32');
      // the teller's cage, with a window at Cole's place
      for (let x = 1.1; x < 7; x += 0.3) if (x < 3.9 || x > 5.1) line(ctx, x, 3.75, x, 2.95, INK, 0.035);
      line(ctx, 0.9, 2.95, 7.1, 2.95, '#C9A14A', 0.06);
      path(ctx, [[3.9, 3.75], [3.9, 3.25], [4.5, 2.98], [5.1, 3.25], [5.1, 3.75]], false); ctx.strokeStyle = '#C9A14A'; ctx.lineWidth = 0.05; ctx.stroke();
      // a green-shaded lamp, a ledger and the day's cash
      line(ctx, 2.0, 3.75, 2.0, 3.35, '#C9A14A', 0.04);
      ctx.beginPath(); ctx.moveTo(1.75, 3.4); ctx.lineTo(2.25, 3.4); ctx.lineTo(2.12, 3.22); ctx.lineTo(1.88, 3.22); ctx.closePath(); inked(ctx, '#3E6B4A', 0.03);
      rr(ctx, 2.6, 3.55, 0.75, 0.2, 0.02); inked(ctx, '#7A2A1E', 0.03); line(ctx, 2.97, 3.55, 2.97, 3.75, '#E6C77A', 0.02);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(4.28, 3.72 - i * 0.05, 0.1, 0.035, 0, 0, Math.PI * 2); inked(ctx, '#E8C84A', 0.015); }
      rr(ctx, 4.5, 3.6, 0.3, 0.14, 0.02); inked(ctx, '#B8C8A8', 0.02);
      ctx.beginPath(); ctx.arc(5.9, 3.66, 0.08, 0, Math.PI * 2); inked(ctx, '#2A2420', 0.02); line(ctx, 5.9, 3.62, 6.05, 3.4, INK, 0.02);
    } });
    L.push({ y: 7.4, draw: (ctx) => bench(ctx, 1.6, 7.4) });
    // a stand of deposit slips
    L.push({ y: 6.5, draw: (ctx) => {
      shadow(ctx, 7.5, 6.5, 0.4, 0.1);
      line(ctx, 7.25, 6.5, 7.25, 5.95, INK, 0.06); line(ctx, 7.75, 6.5, 7.75, 5.95, INK, 0.06);
      path(ctx, [[7.05, 5.95], [7.95, 5.95], [7.9, 5.6], [7.1, 5.6]]); inked(ctx, '#6B4226', 0.035);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(7.3 + i * 0.2, 5.78); ctx.rotate(-0.1 + i * 0.08); ctx.fillStyle = '#F6EEDB'; ctx.fillRect(-0.09, -0.07, 0.18, 0.13); ctx.restore(); }
      ctx.beginPath(); ctx.arc(7.8, 5.72, 0.05, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    } });
    // a potted fern and a brass spittoon
    L.push({ y: 7.7, draw: (ctx) => {
      rr(ctx, 7.3, 7.35, 0.4, 0.35, 0.06); inked(ctx, '#B5532E', 0.03);
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.38; ctx.beginPath(); ctx.ellipse(7.5 + Math.cos(a) * 0.3, 7.25 + Math.sin(a) * 0.3, 0.26, 0.07, a, 0, Math.PI * 2); ctx.fillStyle = k % 2 ? '#5E8A44' : '#74A052'; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(6.3, 7.75, 0.16, 0.1, 0, 0, Math.PI * 2); inked(ctx, '#D8B04A', 0.025);
    } });
  }
  if (key === 'wire') {
    counter(2.9, 5.2, '#6B4A32', '#8A6A44');
    L.push({ y: 4.71, draw: (ctx) => {
      // the key and the sounder
      rr(ctx, 6.35, 3.5, 0.5, 0.24, 0.03); inked(ctx, '#2E2A2A', 0.03);
      line(ctx, 6.42, 3.5, 6.78, 3.42, '#C9A14A', 0.05);
      ctx.beginPath(); ctx.arc(6.8, 3.42, 0.06, 0, Math.PI * 2); inked(ctx, '#2A2420', 0.02);
      rr(ctx, 6.95, 3.35, 0.3, 0.4, 0.03); inked(ctx, '#3A3A44', 0.03);
      for (const dx of [0.05, 0.17]) { rr(ctx, 6.95 + dx, 3.42, 0.08, 0.2, 0.02); inked(ctx, '#8A3A2A', 0.02); }
      line(ctx, 7.25, 3.5, 7.4, 2.9, INK, 0.02);
      // telegram blanks and a pencil
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(3.6 + i * 0.12, 3.62 - i * 0.03); ctx.rotate(-0.06 + i * 0.05); ctx.fillStyle = i === 2 ? '#F2DE8A' : '#F6EEDB'; ctx.fillRect(-0.24, -0.11, 0.48, 0.22); ctx.strokeStyle = 'rgba(42,36,32,.4)'; ctx.lineWidth = 0.015; ctx.strokeRect(-0.24, -0.11, 0.48, 0.22); ctx.restore(); }
      line(ctx, 4.25, 3.7, 4.6, 3.6, '#D8B04A', 0.035);
      lamp(ctx, 5.0, 3.78, 0.9);
    } });
    // a writing shelf for customers, with blanks
    L.push({ y: 4.75, draw: (ctx) => {
      line(ctx, 1.15, 4.75, 1.15, 4.2, INK, 0.06); line(ctx, 1.85, 4.75, 1.85, 4.2, INK, 0.06);
      path(ctx, [[0.95, 4.2], [2.05, 4.2], [2.0, 3.85], [1.0, 3.85]]); inked(ctx, '#8A6A44', 0.035);
      ctx.save(); ctx.translate(1.4, 4.02); ctx.rotate(0.05); ctx.fillStyle = '#F2DE8A'; ctx.fillRect(-0.22, -0.1, 0.44, 0.2); ctx.restore();
      line(ctx, 1.7, 4.08, 1.9, 3.95, INK, 0.025);
    } });
    L.push({ y: 6.9, draw: (ctx) => bench(ctx, 1.5, 6.9) });
    // stove
    L.push({ y: 6.95, draw: (ctx) => {
      shadow(ctx, 7.5, 6.95, 0.4, 0.1);
      line(ctx, 7.5, 6.2, 7.5, 5.5, INK, 0.14); line(ctx, 7.5, 6.2, 7.5, 5.5, '#3A3A40', 0.09);
      ctx.beginPath(); ctx.ellipse(7.5, 6.55, 0.32, 0.36, 0, 0, Math.PI * 2); inked(ctx, '#3E3A3A', 0.045);
      ctx.fillStyle = '#E8853A'; ctx.fillRect(7.4, 6.6, 0.2, 0.07);
    } });
    // a wastebasket of crumpled drafts
    L.push({ y: 7.7, draw: (ctx) => {
      path(ctx, [[2.75, 7.35], [3.15, 7.35], [3.08, 7.7], [2.82, 7.7]]); inked(ctx, '#A8865A', 0.03);
      for (const [px, py] of [[2.86, 7.3], [3.0, 7.26], [3.08, 7.33]]) { ctx.beginPath(); ctx.arc(px, py, 0.07, 0, Math.PI * 2); inked(ctx, '#F2E6CC', 0.015); }
    } });
  }
  if (key === 'home') {
    L.push({ y: 2.9, draw: (ctx) => {
      rr(ctx, 0.75, 1.6, 2.4, 1.3, 0.08); inked(ctx, '#7A5434');
      rr(ctx, 0.85, 1.65, 0.7, 0.5, 0.1); inked(ctx, '#F4F0E4', 0.035);
      rr(ctx, 1.4, 1.7, 1.65, 1.1, 0.06); inked(ctx, '#B5532E', 0.04);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#E6C77A' : '#3E6C9A'; ctx.fillRect(1.5 + i * 0.5, 1.8 + j * 0.45, 0.3, 0.3); }
    } });
    // the trunk that came from back East
    L.push({ y: 3.9, draw: (ctx) => {
      shadow(ctx, 1.55, 3.9, 0.5, 0.1);
      rr(ctx, 1.05, 3.35, 1.0, 0.55, 0.06); inked(ctx, shade(ctx, 1.05, 3.3, 1, 0.6, '#6B4A2E'), 0.04);
      rr(ctx, 1.05, 3.28, 1.0, 0.18, 0.08); inked(ctx, '#7A5A3A', 0.035);
      for (const sx of [1.3, 1.8]) line(ctx, sx, 3.3, sx, 3.88, '#4A3424', 0.05);
      rr(ctx, 1.5, 3.48, 0.1, 0.12, 0.02); inked(ctx, '#C9A14A', 0.02);
    } });
    // the cookstove, a kettle on it and a woodbox beside
    L.push({ y: 2.5, draw: (ctx) => {
      rr(ctx, 6.1, 1.25, 1.3, 1.25, 0.08); inked(ctx, '#3A3A40');
      rr(ctx, 6.3, 1.75, 0.9, 0.5, 0.05); inked(ctx, '#B5532E', 0.035);
      ctx.beginPath(); ctx.ellipse(6.75, 1.2, 0.35, 0.14, 0, 0, Math.PI * 2); inked(ctx, '#6A6A74', 0.035);
      ctx.beginPath(); ctx.ellipse(7.12, 1.12, 0.17, 0.13, 0, 0, Math.PI * 2); inked(ctx, '#5A6A70', 0.03);
      line(ctx, 7.26, 1.08, 7.38, 0.98, INK, 0.03);
    } });
    L.push({ y: 3.95, draw: (ctx) => {
      rr(ctx, 7.15, 3.45, 0.75, 0.5, 0.04); inked(ctx, '#8A6A44', 0.035);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(7.3 + i * 0.15, 3.45, 0.08, 0, Math.PI * 2); inked(ctx, '#C9A06A', 0.02); }
    } });
    // Ruth's rocking chair
    L.push({ y: 3.45, draw: (ctx) => {
      ctx.beginPath(); ctx.moveTo(5.0, 3.45); ctx.quadraticCurveTo(5.5, 3.62, 6.0, 3.45); ctx.strokeStyle = INK; ctx.lineWidth = 0.06; ctx.stroke();
      rr(ctx, 5.1, 2.35, 0.8, 0.95, 0.12); inked(ctx, '#8A5A33', 0.04);
      for (let i = 0; i < 3; i++) line(ctx, 5.3 + i * 0.2, 2.45, 5.3 + i * 0.2, 3.2, dark('#8A5A33', 0.3), 0.03);
    } });
    L.push({ y: 5.9, draw: (ctx) => {
      rr(ctx, 1.8, 4.9, 2.4, 1.0, 0.08); inked(ctx, '#9A6A3E');
      line(ctx, 2.0, 5.9, 2.0, 6.1, INK, 0.08); line(ctx, 4.0, 5.9, 4.0, 6.1, INK, 0.08);
      rr(ctx, 2.5, 5.05, 0.8, 0.55, 0.04); inked(ctx, '#3E5A3A', 0.04);
      text(ctx, 'ALMANAC', 2.9, 5.32, 0.12, '#E6C77A');
      lamp(ctx, 3.75, 5.5, 0.9);
      ctx.beginPath(); ctx.arc(2.1, 5.25, 0.15, 0, Math.PI * 2); inked(ctx, '#F4F0E4', 0.03);
    } });
    // stools at the table
    L.push({ y: 6.45, draw: (ctx) => { for (const sx of [2.3, 3.7]) { ctx.beginPath(); ctx.ellipse(sx, 6.25, 0.2, 0.1, 0, 0, Math.PI * 2); inked(ctx, '#A8774A', 0.03); line(ctx, sx - 0.12, 6.3, sx - 0.14, 6.45, INK, 0.04); line(ctx, sx + 0.12, 6.3, sx + 0.14, 6.45, INK, 0.04); } } });
    // a washstand with basin and pitcher
    L.push({ y: 5.95, draw: (ctx) => {
      rr(ctx, 7.1, 5.3, 0.8, 0.65, 0.04); inked(ctx, '#9A6A3E', 0.035);
      ctx.beginPath(); ctx.ellipse(7.45, 5.28, 0.28, 0.1, 0, 0, Math.PI * 2); inked(ctx, '#F4F0E4', 0.03);
      rr(ctx, 7.62, 4.95, 0.2, 0.32, 0.06); inked(ctx, '#F4F0E4', 0.03);
    } });
    // a water bucket with a dipper, and a broom by the door
    L.push({ y: 7.75, draw: (ctx) => {
      path(ctx, [[2.2, 7.4], [2.6, 7.4], [2.55, 7.75], [2.25, 7.75]]); inked(ctx, '#A8865A', 0.03);
      ctx.beginPath(); ctx.ellipse(2.4, 7.4, 0.2, 0.06, 0, 0, Math.PI * 2); inked(ctx, '#6FA8C8', 0.02);
      line(ctx, 2.45, 7.38, 2.75, 7.1, INK, 0.03);
      line(ctx, 6.4, 7.95, 6.8, 6.9, INK, 0.05); line(ctx, 6.4, 7.95, 6.8, 6.9, '#B98352', 0.03);
      path(ctx, [[6.25, 7.95], [6.55, 7.95], [6.5, 7.6], [6.33, 7.62]]); inked(ctx, '#D9B45A', 0.025);
    } });
  }
  return L;
}

// Pruitt's account book, open on the counter. The more lines on your page, the
// longer it gets; interest lines are written in red.
function ledgerBook(ctx, cx, cy, S) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.05);
  const w = 1.25, h = 0.62;
  rr(ctx, -w / 2 - 0.05, -h / 2 + 0.03, w + 0.1, h + 0.04, 0.04); inked(ctx, '#5A2A1E', 0.03);
  rr(ctx, -w / 2, -h / 2, w / 2, h, 0.02); inked(ctx, '#FBF5E6', 0.025);
  rr(ctx, 0, -h / 2, w / 2, h, 0.02); inked(ctx, '#FBF5E6', 0.025);
  line(ctx, 0, -h / 2, 0, h / 2, INK, 0.02);
  const log = (S.bookLog || []).slice(-10);
  log.forEach((e, i) => {
    const col = i < 5 ? -1 : 1, rowY = -h / 2 + 0.1 + (i % 5) * 0.1;
    const x0 = col < 0 ? -w / 2 + 0.06 : 0.06;
    line(ctx, x0, rowY, x0 + 0.3 + ((i * 7) % 3) * 0.05, rowY, e.red ? '#B5322A' : e.paid ? '#3E6B2E' : '#3A3A44', 0.018);
    line(ctx, x0 + 0.44, rowY, x0 + 0.54, rowY, e.red ? '#B5322A' : '#3A3A44', 0.018);
  });
  if (S.tab > 0.5) text(ctx, '$' + Math.round(S.tab), w / 4, h / 2 - 0.07, 0.12, '#B5322A', w / 2 - 0.1);
  ctx.restore();
}
