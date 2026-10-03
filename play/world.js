// The toy town: a small Three.js diorama with ink-outlined toy figures.
// It knows nothing about money; main.js tells it what to show.

import * as THREE from 'three';

const INK = 0x2a2018;

function mat(color) { return new THREE.MeshLambertMaterial({ color }); }
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

// Inverted-hull outline so every toy reads like the ink drawings.
function outlined(geo, color, k = 1.07) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true;
  const o = new THREE.Mesh(geo, inkMat);
  o.scale.setScalar(k);
  g.add(o, m);
  return g;
}

function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

// ------------------------------------------------------------------ figures

export function makeFigure(look) {
  const f = new THREE.Group();
  const skin = look.skin, shirt = look.shirt || '#7F9F6E';
  const legsC = look.pants || '#4F5D73', boots = look.boots || '#4A3222';
  const dress = look.dress;
  if (dress) {
    const skirt = outlined(new THREE.CylinderGeometry(0.34, 0.62, 0.95, 20), dress);
    f.add(at(skirt, 0, 0.5, 0));
  } else {
    for (const x of [-0.17, 0.17]) {
      f.add(at(outlined(new THREE.CapsuleGeometry(0.13, 0.42, 4, 10), legsC), x, 0.38, 0));
      f.add(at(outlined(new THREE.BoxGeometry(0.24, 0.14, 0.34), boots), x, 0.08, 0.04));
    }
  }
  const torso = outlined(new THREE.CapsuleGeometry(0.34, 0.42, 6, 16), dress || shirt);
  f.add(at(torso, 0, 1.12, 0));
  if (look.coat) {
    const coat = outlined(new THREE.CylinderGeometry(0.38, 0.44, 0.78, 16, 1, true, -Math.PI * 0.82, Math.PI * 1.64), look.coat, 1.04);
    f.add(at(coat, 0, 1.08, 0));
  }
  if (look.apron) f.add(at(outlined(new THREE.BoxGeometry(0.46, 0.72, 0.06), look.apron, 1.1), 0, 0.98, 0.33));
  if (look.shawl) f.add(at(outlined(new THREE.ConeGeometry(0.52, 0.42, 18), look.shawl), 0, 1.36, 0));
  if (look.suspenders) for (const x of [-0.15, 0.15]) f.add(at(outlined(new THREE.BoxGeometry(0.07, 0.62, 0.05), look.suspenders, 1.15), x, 1.16, 0.33));
  for (const s of [-1, 1]) {
    const arm = outlined(new THREE.CapsuleGeometry(0.1, 0.42, 4, 10), look.sleeve || look.coat || shirt);
    arm.position.set(s * 0.45, 1.08, 0); arm.rotation.z = s * 0.18;
    f.add(arm);
    f.add(at(outlined(new THREE.SphereGeometry(0.11, 12, 10), skin), s * 0.52, 0.76, 0));
  }
  const head = new THREE.Group();
  head.add(outlined(new THREE.SphereGeometry(0.52, 24, 18), skin, 1.05));
  for (const s of [-1, 1]) head.add(at(outlined(new THREE.SphereGeometry(0.1, 10, 8), skin, 1.15), s * 0.52, -0.02, 0));
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), new THREE.MeshBasicMaterial({ color: 0x2a1e16 }));
    eye.scale.set(1, 1.3, 0.6); head.add(at(eye, s * 0.19, 0.04, 0.48));
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    head.add(at(glint, s * 0.19 + 0.02, 0.08, 0.53));
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(new THREE.Color(skin).multiplyScalar(0.82)));
  head.add(at(nose, 0, -0.08, 0.52));
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: 0xe07a62, transparent: true, opacity: 0.35 }));
    cheek.position.set(s * 0.3, -0.14, 0.44); cheek.rotation.y = s * 0.55; head.add(cheek);
  }
  if (look.hair && look.hairStyle !== 'bald') {
    const hair = outlined(new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI * (look.hairStyle === 'bun' ? 0.42 : 0.36)), look.hair, 1.04);
    hair.rotation.x = -0.25; head.add(hair);
    if (look.hairStyle === 'bun') head.add(at(outlined(new THREE.SphereGeometry(0.2, 14, 10), look.hair), 0, 0.58, -0.12));
  }
  if (look.hairStyle === 'bald') for (const s of [-1, 1]) head.add(at(outlined(new THREE.SphereGeometry(0.16, 10, 8), look.hair), s * 0.45, 0.12, -0.05));
  if (look.beard) head.add(at(outlined(new THREE.SphereGeometry(0.4, 18, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), look.beard, 1.04), 0, 0.02, 0.12));
  if (look.mustache) { const m = outlined(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), look.mustache, 1.2); m.rotation.z = Math.PI / 2; head.add(at(m, 0, -0.17, 0.5)); }
  if (look.glasses) for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 6, 18), new THREE.MeshBasicMaterial({ color: 0x6a5440 })); head.add(at(g, s * 0.19, 0.04, 0.5)); }
  const hat = look.hat;
  if (hat === 'bowler' || hat === 'boater' || hat === 'cap' || hat === 'straw') {
    const c = look.hatColor;
    const brimR = hat === 'straw' ? 0.85 : hat === 'cap' ? 0.56 : 0.66;
    if (hat !== 'cap') head.add(at(outlined(new THREE.CylinderGeometry(brimR, brimR, 0.05, 24), c), 0, 0.36, 0));
    else head.add(at(outlined(new THREE.BoxGeometry(0.5, 0.05, 0.36), c), 0, 0.33, 0.42));
    const crown = hat === 'bowler' ? new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
      : hat === 'cap' ? new THREE.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.3)
        : new THREE.CylinderGeometry(0.4, 0.42, 0.26, 20);
    head.add(at(outlined(crown, c), 0, hat === 'bowler' ? 0.36 : hat === 'cap' ? 0.05 : 0.5, 0));
    if (hat === 'boater') head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.425, 0.08, 20), mat('#B5322A')), 0, 0.44, 0));
  }
  if (hat === 'bonnet') {
    const b = outlined(new THREE.SphereGeometry(0.62, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), look.hatColor, 1.03);
    b.rotation.x = -0.55; head.add(at(b, 0, 0.02, -0.06));
  }
  if (hat === 'eyeshade') {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.56, 0.05, 20, 1, false, -Math.PI * 0.35, Math.PI * 0.7), new THREE.MeshLambertMaterial({ color: look.hatColor, transparent: true, opacity: 0.85 }));
    head.add(at(v, 0, 0.26, 0.08));
  }
  head.position.y = 1.95;
  f.add(head);
  f.userData.head = head;
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0x2a2420, transparent: true, opacity: 0.18 }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; f.add(sh);
  f.scale.setScalar(0.8);
  return f;
}

// ------------------------------------------------------------------ buildings

function signTexture(text, bg = '#F6EEDB') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = '#2A2420'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 88);
  g.fillStyle = '#2A2420'; g.font = '44px "IM Fell English SC", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function building({ w, d, h, wall, roof, roofKind = 'gable', sign, door = '#3A2A1E', windows = '#F2D27A', falseFront }) {
  const b = new THREE.Group();
  const body = outlined(new THREE.BoxGeometry(w, h, d), wall, 1.02);
  b.add(at(body, 0, h / 2, 0));
  if (falseFront) b.add(at(outlined(new THREE.BoxGeometry(w + 0.2, 1.3, 0.25), falseFront, 1.03), 0, h + 0.55, d / 2 - 0.1));
  if (roofKind === 'gable') {
    const r = outlined(new THREE.CylinderGeometry(0.01, w * 0.62, d + 0.4, 4, 1), roof, 1.03);
    r.rotation.x = Math.PI / 2; r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.55);
    b.add(at(r, 0, h + 0.55, 0));
  } else if (roofKind === 'sod') {
    b.add(at(outlined(new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5), roof, 1.03), 0, h + 0.2, 0));
  } else {
    b.add(at(outlined(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), roof, 1.03), 0, h + 0.1, 0));
  }
  const dr = outlined(new THREE.BoxGeometry(0.9, 1.6, 0.1), door, 1.05);
  b.add(at(dr, 0, 0.8, d / 2 + 0.02));
  for (const x of [-w / 2 + 0.9, w / 2 - 0.9]) {
    if (w < 3.2) continue;
    const win = outlined(new THREE.BoxGeometry(0.8, 0.7, 0.08), windows, 1.08);
    b.add(at(win, x, Math.min(h - 0.8, 1.5), d / 2 + 0.03));
  }
  if (sign) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w + 0.1, 4.6), 0.86), new THREE.MeshBasicMaterial({ map: signTexture(sign) }));
    b.add(at(s, 0, falseFront ? h + 0.6 : h - 0.35, d / 2 + (falseFront ? 0.04 : 0.06)));
  }
  return b;
}

function tree(x, z, s = 1) {
  const t = new THREE.Group();
  t.add(at(outlined(new THREE.CylinderGeometry(0.16, 0.22, 1.2, 8), '#7A4A2A'), 0, 0.6, 0));
  t.add(at(outlined(new THREE.SphereGeometry(0.95, 14, 10), '#6E9E52', 1.04), 0, 1.75, 0));
  t.add(at(outlined(new THREE.SphereGeometry(0.65, 12, 8), '#7FB060', 1.05), 0.45, 2.25, 0.2));
  t.position.set(x, 0, z); t.scale.setScalar(s);
  return t;
}

function fence(x1, z1, x2, z2) {
  const g = new THREE.Group();
  const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(2, Math.round(len / 1.4));
  for (let i = 0; i <= n; i++) {
    const p = outlined(new THREE.BoxGeometry(0.14, 0.8, 0.14), '#8A5A33');
    g.add(at(p, x1 + (x2 - x1) * i / n, 0.4, z1 + (z2 - z1) * i / n));
  }
  for (const y of [0.35, 0.65]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.06), mat('#A8794E'));
    r.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); r.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    g.add(r);
  }
  return g;
}

// ------------------------------------------------------------------ world

export function createWorld(canvas, labelsEl) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#BFE0F0');
  scene.fog = new THREE.Fog('#BFE0F0', 38, 70);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xfff6e0, 0x7a8f5a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
  sun.position.set(-14, 22, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(48, 64), mat('#8FCB6B'));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const road = (x, z, w, d) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat('#E2C994')); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.01, z); r.receiveShadow = true; scene.add(r); };
  road(7, 0, 38, 4.2); road(0, -3, 3.2, 26); road(-12.5, -3.4, 3, 2.6);

  // Places. Doors face +z (toward the camera).
  const places = {};
  const put = (key, obj, x, z, label, doorZ) => {
    obj.position.set(x, 0, z); scene.add(obj);
    places[key] = { x, z: z + doorZ, label, obj };
  };
  put('home', building({ w: 4.2, d: 3.4, h: 2.2, wall: '#A8794E', roof: '#7FA35A', roofKind: 'sod', windows: '#F2D27A' }), -15, -7, 'Home', 2.3);
  put('store', building({ w: 5.6, d: 4.2, h: 3, wall: '#C9A06A', roof: '#7A4A2A', roofKind: 'flat', sign: "PRUITT'S", falseFront: '#B98A55' }), 3, -6.5, "Pruitt's store", 2.7);
  put('bank', building({ w: 4.6, d: 4, h: 3.2, wall: '#C9674E', roof: '#5A3A2A', roofKind: 'flat', sign: 'BANK', falseFront: '#A8503A', door: '#2E2A28' }), 11, -6.5, 'The bank', 2.6);
  put('wire', building({ w: 3.4, d: 3, h: 2.6, wall: '#E8DCC0', roof: '#4A5468', roofKind: 'gable', sign: 'TELEGRAPH' }), -5, -7.5, 'Telegraph office', 2.2);
  const saloon = building({ w: 5, d: 4, h: 3, wall: '#B98352', roof: '#6B4226', roofKind: 'flat', sign: 'SALOON', falseFront: '#9A6A3E' });
  saloon.position.set(12, 0, 7); saloon.rotation.y = Math.PI; scene.add(saloon);
  const church = building({ w: 3.6, d: 4.6, h: 3, wall: '#F2EBDD', roof: '#8A8A8A', roofKind: 'gable' });
  church.position.set(-6, 0, 8); church.rotation.y = Math.PI; scene.add(church);
  const steeple = outlined(new THREE.ConeGeometry(0.7, 2.2, 4), '#8A8A8A'); steeple.position.set(-6, 5.2, 8); scene.add(steeple);
  const amesHouse = building({ w: 3.4, d: 3, h: 2.2, wall: '#9E8A6E', roof: '#6B4226', roofKind: 'gable' });
  amesHouse.position.set(20, 0, -3); amesHouse.rotation.y = -Math.PI / 2; scene.add(amesHouse);

  // Telegraph poles along the road.
  for (let x = -20; x <= 24; x += 8) {
    const p = outlined(new THREE.CylinderGeometry(0.1, 0.12, 4, 6), '#7A4A2A'); p.position.set(x, 2, -2.6); scene.add(p);
    const bar = outlined(new THREE.BoxGeometry(1, 0.1, 0.1), '#7A4A2A'); bar.position.set(x, 3.7, -2.6); scene.add(bar);
  }
  const wire = new THREE.Mesh(new THREE.BoxGeometry(44, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: INK }));
  wire.position.set(2, 3.75, -2.6); scene.add(wire);

  // The claim: fields beside the soddy that change with the season.
  const field = new THREE.Group();
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.6), mat('#8A6440'));
    r.position.set(-15, 0.15, 0 + i * 0.95); r.receiveShadow = true; r.castShadow = true;
    field.add(r); rows.push(r);
  }
  scene.add(field);
  scene.add(fence(-18.6, -0.8, -11.4, -0.8), fence(-18.6, 6.8, -11.4, 6.8), fence(-18.6, -0.8, -18.6, 6.8));

  for (const [x, z, s] of [[-22, -12, 1.2], [-9, -14, 1], [18, -12, 1.1], [24, 6, 1.3], [-23, 8, 1], [6, 14, 1.2], [-14, 14, 0.9], [26, -6, 1]]) scene.add(tree(x, z, s));
  const well = outlined(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 14), '#9A9A9A'); well.position.set(-10.5, 0.4, -3.5); scene.add(well);
  const wagon = new THREE.Group();
  wagon.add(at(outlined(new THREE.BoxGeometry(2.4, 0.7, 1.3), '#B5532E'), 0, 0.9, 0));
  for (const [x, z] of [[-0.8, 0.7], [0.8, 0.7], [-0.8, -0.7], [0.8, -0.7]]) { const w = outlined(new THREE.TorusGeometry(0.42, 0.08, 6, 14), '#5A3A22'); w.position.set(x, 0.45, z); wagon.add(w); }
  const sgn = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshBasicMaterial({ map: signTexture('PATENT GOODS', '#E6C77A') }));
  wagon.add(at(sgn, 0, 0.95, 0.67));
  wagon.position.set(1, 0, 5.2); scene.add(wagon);

  // People.
  const npcs = {};
  const addNpc = (key, look, x, z, label, ry = 0) => {
    const f = makeFigure(look); f.position.set(x, 0, z); f.rotation.y = ry; scene.add(f);
    npcs[key] = { obj: f, x, z, label };
    places[key] = { x, z: z + 1.4, label, obj: f, npc: true };
  };
  addNpc('brandt', { skin: '#F2C9A2', hair: '#B58A4A', shirt: '#E8DCC0', coat: '#6B7A5E', pants: '#5A4A3A', boots: '#3A2A20', beard: '#C49A58', mustache: '#B58A4A', hat: 'cap', hatColor: '#8A7A62' }, -7, 2.6, 'Herr Brandt', 0.3);
  addNpc('ames', { skin: '#7A4A2A', hair: '#2A1E16', dress: '#3E6C9A', apron: '#EFE6D2', boots: '#3A2A20', hat: 'bonnet', hatColor: '#E8DCC0' }, 18, -0.6, 'Widow Ames', -0.4);
  addNpc('drummer', { skin: '#EBC09A', hair: '#A8461F', shirt: '#F6F2EA', coat: '#B88A3A', pants: '#B88A3A', boots: '#5A3A22', mustache: '#A8461F', hat: 'boater', hatColor: '#E6C77A' }, 3.2, 5.6, 'Mr. Valentine', -0.2);

  let player = null;
  const target = new THREE.Vector3(-12.5, 0, -2.5);
  function setPlayer(look) {
    if (player) scene.remove(player);
    player = makeFigure(look);
    player.position.copy(target); scene.add(player);
  }

  // Labels as DOM so they stay crisp and readable.
  const labelEls = {};
  for (const [k, p] of Object.entries(places)) {
    const el = document.createElement('button'); el.className = 'blabel'; el.type = 'button'; el.textContent = p.label;
    el.addEventListener('click', () => { if (!enabled) return; target.set(places[k].x, 0, places[k].z); });
    labelsEl.appendChild(el); labelEls[k] = el;
  }

  function setSeason(season, crop) {
    const col = season === 0 ? (crop ? '#7FB060' : '#8A6440') : season === 1 ? '#D9B54A' : season === 2 ? '#A88A5A' : '#E8E4DA';
    rows.forEach((r) => { r.material.color.set(col); r.scale.y = crop && season < 2 ? 1.6 : 1; });
    ground.material.color.set(season === 3 ? '#DCE3D8' : season === 1 ? '#A8C86A' : '#8FCB6B');
    scene.background.set(season === 3 ? '#D5DEE6' : '#BFE0F0'); scene.fog.color.copy(scene.background);
  }
  function setVisible(key, v) { if (npcs[key]) { npcs[key].obj.visible = v; places[key].hidden = !v; } if (key === 'drummer') wagon.visible = v; }

  // Input: tap the ground to walk; keys also work.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let tapCb = null; let enabled = true;
  canvas.addEventListener('pointerup', (e) => {
    if (!enabled) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // A tap on a labeled place walks to its door.
    let best = null, bd = 1e9;
    for (const [k, p] of Object.entries(places)) {
      if (p.hidden) continue;
      const v = new THREE.Vector3(p.x, 1, p.z - (p.npc ? 1.4 : 1)).project(camera);
      const dx = (v.x - ndc.x) * r.width / 2, dy = (v.y - ndc.y) * r.height / 2;
      const dd = Math.hypot(dx, dy);
      if (dd < 46 && dd < bd) { bd = dd; best = k; }
    }
    if (best) { target.set(places[best].x, 0, places[best].z); tapCb && tapCb(best); return; }
    const hit = ray.intersectObject(ground)[0];
    if (hit) { target.set(Math.max(-26, Math.min(28, hit.point.x)), 0, Math.max(-12, Math.min(14, hit.point.z))); }
  });
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let nearCb = null, lastNear = undefined;
  const camOff = new THREE.Vector3(0, 13, 15);
  const camK = () => (camera.aspect < 0.8 ? 1.75 : camera.aspect < 1.2 ? 1.35 : 1.1);
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    if (player) {
      if (enabled) {
        const kx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
        const kz = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
        if (kx || kz) target.set(player.position.x + kx * 1.2, 0, player.position.z + kz * 1.2);
      }
      const d = new THREE.Vector3().subVectors(target, player.position); d.y = 0;
      const dist = d.length();
      const t = clock.elapsedTime;
      if (dist > 0.05) {
        const step = Math.min(dist, dt * 6.5);
        player.position.addScaledVector(d.normalize(), step);
        player.rotation.y = Math.atan2(d.x, d.z);
        player.position.y = Math.abs(Math.sin(t * 12)) * 0.12;
      } else player.position.y = 0;
      const want = player.position.clone().addScaledVector(camOff, camK());
      camera.position.lerp(want, 1 - Math.pow(0.001, dt));
      camera.lookAt(player.position.x, 1.2, player.position.z - 1);
      // Nearest place within reach.
      let near = null, nd = 2.4;
      for (const [k, p] of Object.entries(places)) {
        if (p.hidden) continue;
        const dd = Math.hypot(p.x - player.position.x, p.z - player.position.z);
        if (dd < nd) { nd = dd; near = k; }
      }
      if (near !== lastNear) { lastNear = near; nearCb && nearCb(near); }
      for (const n of Object.values(npcs)) n.obj.userData.head.rotation.z = Math.sin(t * 1.5 + n.x) * 0.05;
    }
    // Labels follow their places; ones that drift off screen pin to the edge without piling up.
    const w = window.innerWidth, h = window.innerHeight;
    const placed = [];
    for (const [k, p] of Object.entries(places)) {
      const el = labelEls[k];
      if (p.hidden) { el.style.display = 'none'; continue; }
      const v = new THREE.Vector3(p.x, p.npc ? 2.6 : 4.3, p.z - (p.npc ? 1.4 : 2.4)).project(camera);
      const behind = v.z > 1;
      if (behind) { v.x = -v.x; v.y = -v.y; }
      el.style.display = '';
      let sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h;
      const half = el.offsetWidth / 2 + 8;
      const off = behind || sx < half || sx > w - half || sy < 150 || sy > h - 150;
      sx = Math.max(half, Math.min(w - half, sx)); sy = Math.max(150, Math.min(h - 150, sy));
      placed.push({ el, k, sx, sy, half, off });
    }
    placed.sort((a, b) => a.sy - b.sy);
    for (let i = 0; i < placed.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = placed[j], b = placed[i];
        if (Math.abs(a.sx - b.sx) < a.half + b.half - 12 && b.sy - a.sy < 28) b.sy = a.sy + 28;
      }
    }
    for (const q of placed) {
      q.el.style.left = q.sx + 'px'; q.el.style.top = q.sy + 'px';
      q.el.classList.toggle('edge', q.off);
      q.el.classList.toggle('near', q.k === lastNear);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setPlayer, setSeason, setVisible,
    onNear(cb) { nearCb = cb; }, onTap(cb) { tapCb = cb; },
    enable(v) { enabled = v; labelsEl.style.visibility = v ? 'visible' : 'hidden'; },
    walkTo(k) { target.set(places[k].x, 0, places[k].z); },
    goHome() { target.set(-12.5, 0, -2.5); if (player) player.position.copy(target); },
    places,
  };
}
