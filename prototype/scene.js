// The diorama: your claim and the town as a small isometric world. The
// diorama is the progress bar: sod becomes field, the soddy becomes a frame
// house, the rail grade appears at the edge, the seasons repaint the ground.

import * as THREE from 'three';

const PAL = {
  sky: 0xDCEBF5, ink: 0x2B3A4E, grass: [0xA9D18E, 0x9CC77A, 0xD8C27A, 0xEEF2F5],
  drought: 0xC9B47A, dirt: 0x9C7450, dirtSide: 0x8A6544, sod: 0x7FAF66,
  plowed: 0x8A5A3A, corn: 0x6E9F45, wheat: 0xE3C065, stubble: 0xC9A66B,
  roof: 0xE07A5F, wall: 0xB58A5E, frame: 0xF4EEE2, hog: 0xF2A7A0, stake: 0x6B5B44,
};

export class Diorama {
  constructor(canvas, labelsEl, onTapBuilding) {
    this.canvas = canvas;
    this.labelsEl = labelsEl;
    this.onTapBuilding = onTapBuilding;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PAL.sky);
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    this.azimuth = Math.PI / 4;
    this.zoom = 1;
    this.focusX = 0;
    this.clock = new THREE.Clock();
    this.buildings = [];
    this.hogs = [];
    this.highlight = false;
    this.#lights();
    this.#world();
    this.labelsEl.classList.add('hidden');
    this.#input();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.renderer.setAnimationLoop(() => this.#frame());
  }

  #lights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8FA8C8, 1.6));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sun.position.set(-8, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
    this.scene.add(sun);
  }

  #mat(color) { return new THREE.MeshLambertMaterial({ color }); }
  #box(w, h, d, color, x, y, z, parent = this.scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.#mat(color));
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  #roof(w, h, d, color, x, y, z, parent = this.scene) {
    // A gable roof: a triangular prism.
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 0.1, 0); shape.lineTo(w / 2 + 0.1, 0); shape.lineTo(0, h); shape.lineTo(-w / 2 - 0.1, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.2, bevelEnabled: false });
    geo.translate(0, 0, -(d + 0.2) / 2);
    const m = new THREE.Mesh(geo, this.#mat(color));
    m.position.set(x, y, z); m.castShadow = true;
    parent.add(m);
    return m;
  }

  #world() {
    const S = this.scene;
    // The slab.
    const slab = new THREE.Group();
    this.ground = this.#box(26, 0.4, 16, PAL.grass[0], 0, -0.4, 0, slab);
    this.#box(26, 1.4, 16, PAL.dirtSide, 0, -1.8, 0, slab);
    S.add(slab);

    // The claim: fields as 4-acre plots, ten of them.
    this.plots = [];
    for (let i = 0; i < 10; i++) {
      const px = -11 + (i % 5) * 1.75, pz = 1.2 + Math.floor(i / 5) * 1.9;
      const plot = this.#box(1.55, 0.08, 1.7, PAL.plowed, px, 0, pz);
      plot.visible = false;
      const crop = new THREE.Group();
      for (let k = 0; k < 6; k++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 5), this.#mat(PAL.corn));
        c.position.set(px - 0.5 + (k % 3) * 0.5, 0.3, pz - 0.45 + Math.floor(k / 3) * 0.9);
        c.castShadow = true;
        crop.add(c);
      }
      crop.visible = false;
      S.add(crop);
      this.plots.push({ plot, crop });
    }

    // The homestead.
    this.soddy = new THREE.Group();
    this.#box(1.8, 0.9, 1.4, 0x8A6A4A, 0, 0, 0, this.soddy);
    this.#box(2.0, 0.18, 1.6, PAL.sod, 0, 0.9, 0, this.soddy);
    this.#box(0.35, 0.6, 0.05, 0x3D2E24, 0.2, 0, 0.71, this.soddy);
    this.soddy.position.set(-7.5, 0, -3);
    S.add(this.soddy);

    this.frameHouse = new THREE.Group();
    this.#box(2.2, 1.4, 1.6, PAL.frame, 0, 0, 0, this.frameHouse);
    this.#roof(2.2, 1.0, 1.6, PAL.roof, 0, 1.4, 0, this.frameHouse);
    this.#box(0.4, 0.8, 0.05, 0x5A4636, 0.3, 0, 0.81, this.frameHouse);
    this.#box(0.25, 0.9, 0.25, 0x8A8A8A, -0.6, 1.5, -0.3, this.frameHouse);
    this.frameHouse.position.set(-7.5, 0, -3);
    this.frameHouse.visible = false;
    S.add(this.frameHouse);

    this.barn = new THREE.Group();
    this.#box(1.8, 1.3, 1.5, 0xB5654A, 0, 0, 0, this.barn);
    this.#roof(1.8, 0.8, 1.5, 0x7A3E2E, 0, 1.3, 0, this.barn);
    this.barn.position.set(-10.2, 0, -3.2);
    this.barn.visible = false;
    S.add(this.barn);

    // The cellar: a mound that grows with what you put up.
    this.cellar = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.#mat(PAL.sod));
    this.cellar.position.set(-5.6, 0, -3.4);
    this.cellar.castShadow = true;
    S.add(this.cellar);
    this.#box(0.4, 0.35, 0.05, 0x3D2E24, -5.6, 0, -2.6);

    // The plow.
    this.plow = this.#box(0.7, 0.25, 0.3, 0x5A5A5A, -9.4, 0, -1.4);
    this.plow.visible = false;

    // The hog pen.
    const pen = new THREE.Group();
    for (let i = 0; i <= 6; i++) {
      this.#box(0.08, 0.45, 0.08, PAL.stake, -4.2 + i * 0.4, 0, -6.2, pen);
      this.#box(0.08, 0.45, 0.08, PAL.stake, -4.2 + i * 0.4, 0, -4.4, pen);
    }
    this.#box(2.5, 0.06, 0.05, PAL.stake, -3.0, 0.3, -6.2, pen);
    this.#box(2.5, 0.06, 0.05, PAL.stake, -3.0, 0.3, -4.4, pen);
    S.add(pen);
    for (let i = 0; i < 8; i++) {
      const h = new THREE.Group();
      this.#box(0.5, 0.3, 0.3, PAL.hog, 0, 0.05, 0, h);
      this.#box(0.18, 0.18, 0.2, PAL.hog, 0.3, 0.15, 0, h);
      h.position.set(-3.6 + (i % 4) * 0.6, 0, -5.8 + Math.floor(i / 4) * 0.8);
      h.visible = false;
      h.userData = { phase: Math.random() * 6, home: h.position.clone() };
      S.add(h);
      this.hogs.push(h);
    }

    // Trees by the creek.
    for (const [x, z] of [[-12, -6.5], [-11, -7.2], [-0.5, 6.5], [0.6, 7], [12, 6.6], [-12.2, 6.8]]) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 7), this.#mat(0x5E8F4E));
      t.position.set(x, 0.9, z); t.castShadow = true; S.add(t);
    }

    // The town: seven buildings on one street.
    const spots = [
      ['store', 3.2, -2.6], ['bank', 5.6, -2.6], ['land', 8.0, -2.6], ['wire', 10.6, -2.6],
      ['paper', 3.6, 2.2], ['yards', 7.0, 2.4], ['saloon', 10.4, 2.2],
    ];
    this.#box(10, 0.06, 1.6, 0xC9B48F, 7, 0, -0.2); // the street
    for (const [id, x, z] of spots) {
      const g = new THREE.Group();
      const def = Diorama.buildingDefs[id];
      const body = this.#box(def.w, def.h, def.d, def.color, 0, 0, 0, g);
      if (def.roof) this.#roof(def.w, 0.8, def.d, def.roof, 0, def.h, 0, g);
      else this.#box(def.w + 0.2, 0.3, def.d + 0.1, def.trim, 0, def.h, 0.05, g); // false front
      if (id === 'yards') for (let i = 0; i < 5; i++) this.#box(0.08, 0.5, 0.08, PAL.stake, -1.4 + i * 0.7, 0, 1.2, g);
      if (id === 'wire') this.#box(0.1, 2.8, 0.1, PAL.stake, 0.9, 0, -0.6, g);
      g.position.set(x, 0, z);
      g.rotation.y = z < 0 ? 0 : Math.PI;
      g.userData = { id, baseY: 0 };
      body.userData.buildingId = id;
      g.traverse((o) => { o.userData.buildingId = id; });
      S.add(g);
      const label = document.createElement('div');
      label.className = 'blabel';
      label.textContent = def.name;
      this.labelsEl.appendChild(label);
      this.buildings.push({ id, group: g, label, anchor: new THREE.Vector3(x, def.h + 1.2, z) });
    }
    // Telegraph poles running east.
    for (let i = 0; i < 4; i++) this.#box(0.08, 2.2, 0.08, PAL.stake, 12.4, 0, -6 + i * 3.5);

    // The rail grade: stakes first, then rails if the depot comes.
    this.stakes = new THREE.Group();
    for (let i = 0; i < 14; i++) this.#box(0.08, 0.4, 0.08, PAL.stake, -12 + i * 1.85, 0, -7.2 + i * 0.12, this.stakes);
    this.stakes.visible = false;
    S.add(this.stakes);
    this.rails = new THREE.Group();
    for (let i = 0; i < 26; i++) this.#box(0.25, 0.06, 0.9, 0x7A5A3A, -12.5 + i, 0, -6.6, this.rails);
    this.#box(26, 0.08, 0.08, 0x777777, 0, 0.06, -6.9, this.rails);
    this.#box(26, 0.08, 0.08, 0x777777, 0, 0.06, -6.3, this.rails);
    this.rails.visible = false;
    S.add(this.rails);

    // A flag on your town lot.
    this.lotFlag = new THREE.Group();
    this.#box(0.06, 1.2, 0.06, PAL.stake, 0, 0, 0, this.lotFlag);
    this.#box(0.5, 0.3, 0.03, PAL.roof, 0.28, 0.85, 0, this.lotFlag);
    this.lotFlag.position.set(12, 0, -0.2);
    this.lotFlag.visible = false;
    S.add(this.lotFlag);

    // Snow.
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 28; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.5) * 18; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }));
    this.snow.visible = false;
    S.add(this.snow);
  }

  static buildingDefs = {
    store: { name: 'General Store', w: 2.0, h: 1.4, d: 1.6, color: 0xE8D9BC, trim: 0xE07A5F },
    bank: { name: 'Bank', w: 1.8, h: 1.8, d: 1.6, color: 0xC9D4E2, trim: 0x4A6FA5 },
    land: { name: 'Land Office', w: 1.8, h: 1.2, d: 1.4, color: 0xD9B48F, roof: 0x8A5A3A },
    wire: { name: 'Telegraph', w: 1.4, h: 1.2, d: 1.2, color: 0xE8E2D4, roof: 0x4A6FA5 },
    paper: { name: 'Newspaper', w: 1.8, h: 1.5, d: 1.4, color: 0xF4EEE2, trim: 0x2B3A4E },
    yards: { name: 'Stockyard', w: 2.4, h: 1.1, d: 1.4, color: 0xA8734A, roof: 0x7A5A3A },
    saloon: { name: 'Saloon', w: 2.0, h: 1.7, d: 1.6, color: 0xB5654A, trim: 0x7A3E2E },
  };

  #input() {
    const ray = new THREE.Raycaster();
    const ptr = new Map();
    let downAt = null, moved = 0, pinch0 = null;
    const el = this.canvas;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 1) { downAt = { x: e.clientX, y: e.clientY, az: this.azimuth, fx: this.focusX }; moved = 0; }
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom }; }
    });
    el.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId)) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 2 && pinch0) {
        const [a, b] = [...ptr.values()];
        this.zoom = this.targetZoom = Math.min(2.6, Math.max(0.7, pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d));
        moved = 99; this.resize();
      } else if (ptr.size === 1 && downAt) {
        const dx = e.clientX - downAt.x;
        moved = Math.max(moved, Math.abs(dx), Math.abs(e.clientY - downAt.y));
        this.azimuth = Math.min(Math.PI / 4 + 0.6, Math.max(Math.PI / 4 - 0.6, downAt.az - dx * 0.006));
      }
    });
    const up = (e) => {
      if (ptr.size === 1 && moved < 8 && downAt) {
        const r = el.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
        const hit = ray.intersectObjects(this.buildings.map((b) => b.group), true)[0];
        if (hit) this.onTapBuilding(hit.object.userData.buildingId);
      }
      ptr.delete(e.pointerId);
      if (ptr.size < 2) pinch0 = null;
      if (!ptr.size) downAt = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom = this.targetZoom = Math.min(2.6, Math.max(0.7, this.zoom * (e.deltaY < 0 ? 1.1 : 0.9))); this.resize(); }, { passive: false });
    this.labelsEl.addEventListener('click', (e) => { const id = e.target.dataset?.id; if (id) this.onTapBuilding(id); });
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    // Fit the slab's width on a phone; more room on a wide screen.
    const halfW = (aspect < 1 ? 15 : 13 * aspect * 0.75) / this.zoom;
    const halfH = halfW / aspect;
    // Keep the diorama in the part of the screen the panel doesn't cover:
    // the top on a phone, the left on a wide screen.
    const offY = aspect < 1 ? halfH * 0.42 : 0;
    const offX = w >= 860 ? halfW * Math.min(0.6, 470 / w) : 0;
    Object.assign(this.camera, { left: -halfW + offX, right: halfW + offX, top: halfH - offY, bottom: -halfH - offY });
    this.camera.updateProjectionMatrix();
  }

  // Point the camera at part of the world: 'claim', 'town', or 'all'.
  focus(where) {
    this.targetFocus = where === 'town' ? 7 : where === 'claim' ? -5 : 0;
    this.targetZoom = where === 'town' ? 1.7 : where === 'claim' ? 1.3 : 1;
  }

  setTownActive(on) {
    this.highlight = on;
    for (const b of this.buildings) b.label.classList.toggle('active', on);
    this.labelsEl.classList.toggle('hidden', !on);
  }

  // Repaint the world from the ledger.
  update(s, view) {
    const season = view.season;
    const groundColor = view.drought && season === 1 ? PAL.drought : PAL.grass[season];
    this.ground.material.color.setHex(groundColor);
    this.snow.visible = season === 3;
    const plotsBroken = Math.min(10, Math.ceil(s.acres / 4));
    const planted = s.planted.corn + s.planted.wheat;
    const cornPlots = planted ? Math.round(plotsBroken * s.planted.corn / Math.max(planted, 1)) : 0;
    this.plots.forEach(({ plot, crop }, i) => {
      plot.visible = i < plotsBroken;
      const isCorn = i < cornPlots, isPlanted = planted > 0 && i < plotsBroken;
      let col = PAL.plowed;
      if (season === 3) col = 0xE6E9EC;
      else if (isPlanted && season >= 1) col = isCorn ? 0x7FA857 : PAL.wheat;
      else if (season === 2 && !isPlanted) col = PAL.stubble;
      plot.material.color.setHex(col);
      crop.visible = isPlanted && season >= 1 && isCorn;
      crop.children.forEach((c) => { c.scale.setScalar(season === 0 ? 0.4 : 1); });
    });
    const nw = view.netWorth;
    this.soddy.visible = nw < 450;
    this.frameHouse.visible = nw >= 450;
    this.barn.visible = nw >= 900 || s.hogs + s.piglets >= 4;
    this.plow.visible = s.plow;
    const fill = Math.min(1, s.cellar / 45);
    this.cellar.scale.set(0.6 + fill * 0.8, 0.25 + fill * 1.0, 0.6 + fill * 0.8);
    const head = s.hogs + s.piglets;
    this.hogs.forEach((h, i) => {
      h.visible = i < Math.min(8, head);
      h.scale.setScalar(i < s.hogs ? 1 : 0.65);
    });
    this.stakes.visible = view.turn >= 5 && !view.depot;
    this.rails.visible = !!view.depot;
    this.lotFlag.visible = !!s.lot;
  }

  pulse() { this.pulseT = 1; }

  #frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    if (this.targetFocus !== undefined) this.focusX += (this.targetFocus - this.focusX) * Math.min(1, dt * 3);
    if (this.targetZoom !== undefined && Math.abs(this.targetZoom - this.zoom) > 0.002) {
      this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 3);
      this.resize();
    }
    const r = 30;
    const target = new THREE.Vector3(this.focusX, 0, 0);
    this.camera.position.set(target.x + Math.sin(this.azimuth) * r, 22, Math.cos(this.azimuth) * r);
    this.camera.lookAt(target);

    for (const h of this.hogs) {
      if (!h.visible) continue;
      const p = h.userData.phase += dt * 0.7;
      h.position.x = h.userData.home.x + Math.sin(p) * 0.25;
      h.position.z = h.userData.home.z + Math.cos(p * 0.7) * 0.15;
      h.rotation.y = Math.cos(p) > 0 ? 0 : Math.PI;
    }
    for (const b of this.buildings) {
      b.group.position.y = this.highlight ? Math.max(0, Math.sin(t * 3 + b.anchor.x)) * 0.12 : 0;
    }
    if (this.snow.visible) {
      const a = this.snow.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) - dt * 1.2;
        if (y < 0) y = 12;
        a.setY(i, y);
      }
      a.needsUpdate = true;
    }
    if (this.pulseT > 0) {
      this.pulseT -= dt;
      this.scene.background.setHex(PAL.sky).lerp(new THREE.Color(0xffffff), Math.max(0, this.pulseT) * 0.6);
    }
    this.renderer.render(this.scene, this.camera);

    // Pin building labels to the 3D positions.
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    for (const b of this.buildings) {
      const v = b.anchor.clone(); v.y += b.group.position.y;
      v.project(this.camera);
      b.label.style.transform = `translate(-50%, -100%) translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
      b.label.dataset.id = b.id;
    }
  }
}
