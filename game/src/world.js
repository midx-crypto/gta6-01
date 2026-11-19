// The island itself: sea, two landmasses, bridges, roads, buildings, palms,
// lamps, harbour cranes, the volcano, ramps and signs. All geometry is built
// from primitives with canvas textures; nothing is loaded from the network.
import * as THREE from 'three';
import { DISTRICTS, AVENUES, STREETS, BRIDGES, CAUSEWAY, PALETTE } from './config.js';
import { buildingTexture, roadTexture, groundTexture, signTexture, containerTexture, neonSignTexture, sandTexture } from './textures.js';
import { range, rangeInt, pick } from './random.js';

const SIGN_SPOTS = [
  { text: 'KAFE SENJA', x: -100, z: -24, bg: '#7a2e5a', fg: '#ffd98a' },
  { text: 'BENGKEL HENDRA', x: -190, z: 132, bg: '#1e4a6e', fg: '#ffffff' },
  { text: 'HOTEL BARA', x: 60, z: -80, bg: '#8a5a1e', fg: '#ffe9b8' },
  { text: 'PASAR MALAM', x: -160, z: 36, bg: '#2e6e4a', fg: '#e8ffd8' },
  { text: 'BANK BARA', x: 80, z: -64, bg: '#3a3a5a', fg: '#ffd98a' },
  { text: 'DERMAGA 7', x: 235, z: 96, bg: '#5a2e2e', fg: '#ffffff' },
  { text: 'FESTIVAL BAHARI', x: 20, z: -104, bg: '#0e6e7a', fg: '#ffe9b8' },
];

function box(w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

export function buildWorld(state, rng) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.fog, 300, 950);
  state.scene = scene;
  state.colliders = [];

  const hemi = new THREE.HemisphereLight(0xffe9c4, 0x5a4a3a, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9b8, 1.6);
  sun.position.set(180, 220, 120);
  scene.add(sun);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(26, 24), new THREE.MeshBasicMaterial({ color: 0xfff2c8, fog: false }));
  sunDisc.position.set(300, 190, -260);
  sunDisc.lookAt(0, 60, 0);
  scene.add(sunDisc);
  for (let i = 0; i < 8; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(range(rng, 14, 26), 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.85, fog: false }));
    cloud.scale.y = 0.35;
    cloud.position.set(range(rng, -320, 320), range(rng, 120, 170), range(rng, -420, 100));
    scene.add(cloud);
  }

  // Sea and islands.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({ color: PALETTE.sea }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6;
  scene.add(sea);
  const mainGround = box(520, 4, 420, new THREE.MeshLambertMaterial({ map: groundTexture('#9a8a6a', '#8a7a5a') }), 0, -2, 10);
  scene.add(mainGround);
  const northGround = box(320, 4, 180, new THREE.MeshLambertMaterial({ map: sandTexture() }), 0, -2, -330);
  scene.add(northGround);
  for (const b of BRIDGES) {
    const bridge = box(16, 2, 44, new THREE.MeshLambertMaterial({ color: 0x6a6a72 }), b.x, -0.4, -220);
    scene.add(bridge);
    const rail = box(1, 1.2, 44, new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }), b.x - 8, 1, -220);
    scene.add(rail);
    const rail2 = box(1, 1.2, 44, new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }), b.x + 8, 1, -220);
    scene.add(rail2);
  }
  const causeway = box(10, 2, 44, new THREE.MeshLambertMaterial({ color: 0x8a7a5a }), CAUSEWAY.x, -0.4, -220);
  scene.add(causeway);

  // Roads: dark strips with dashed centre lines.
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTexture() });
  roadMat.map.wrapS = THREE.RepeatWrapping; roadMat.map.wrapT = THREE.RepeatWrapping;
  for (const ax of AVENUES) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 420), roadMat.clone());
    road.material.map = roadTexture(); road.material.map.repeat.set(1, 12);
    road.rotation.x = -Math.PI / 2; road.position.set(ax, 0.05, 10);
    scene.add(road);
  }
  for (const sz of STREETS) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(520, 12), roadMat.clone());
    road.material.map = roadTexture(); road.material.map.repeat.set(14, 1);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.05, sz);
    scene.add(road);
  }
  const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 180), roadMat.clone());
  northRoad.material.map = roadTexture(); northRoad.material.map.repeat.set(1, 5);
  northRoad.rotation.x = -Math.PI / 2; northRoad.position.set(-80, 0.05, -330);
  scene.add(northRoad);
  const northRoad2 = northRoad.clone(); northRoad2.position.set(80, 0.05, -330); scene.add(northRoad2);
  const northStreet = new THREE.Mesh(new THREE.PlaneGeometry(320, 12), roadMat.clone());
  northStreet.material.map = roadTexture(); northStreet.material.map.repeat.set(9, 1);
  northStreet.rotation.x = -Math.PI / 2; northStreet.position.set(0, 0.05, -330);
  scene.add(northStreet);

  buildBuildings(state, rng, scene);
  buildHarbour(state, rng, scene);
  buildNature(state, rng, scene);
  buildSigns(state, scene);
  buildRamps(state, scene);
  buildBeacon(state, scene);
  return scene;
}

// Buildings, harbour, nature, signs, ramps and the mission beacon.
function buildBuildings(state, rng, scene) {
  const facadeCache = {};
  function facade(base, lit) {
    const key = base + lit;
    if (!facadeCache[key]) facadeCache[key] = buildingTexture(base, lit, Math.floor(rng() * 9000) + 7);
    return facadeCache[key];
  }
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a42 });
  const EXCLUDE = [
    { x: -190, z: 140, r: 26 }, { x: -228, z: 188, r: 16 },
    { x: 20, z: -100, r: 24 }, { x: 60, z: -120, r: 20 },
    { x: 90, z: -330, r: 18 }, { x: -70, z: -310, r: 18 }, { x: 205, z: 60, r: 18 },
  ];
  for (const d of DISTRICTS) {
    const cols = Math.floor((d.x1 - d.x0) / 34);
    const rows = Math.floor((d.z1 - d.z0) / 34);
    for (let ci = 0; ci < cols; ci += 1) {
      for (let ri = 0; ri < rows; ri += 1) {
        const cx = d.x0 + 17 + ci * 34 + range(rng, -4, 4);
        const cz = d.z0 + 17 + ri * 34 + range(rng, -4, 4);
        if (AVENUES.some((ax) => Math.abs(cx - ax) < 13)) continue;
        if (STREETS.some((sz) => Math.abs(cz - sz) < 13)) continue;
        if (EXCLUDE.some((e) => Math.hypot(cx - e.x, cz - e.z) < e.r)) continue;
        if (rng() < 0.08) continue;
        const w = range(rng, 14, 24);
        const dep = range(rng, 14, 24);
        const h = range(rng, d.minH, d.maxH);
        const base = d.id === 'menara' ? '#5a6a8a' : d.id === 'kotalama' ? '#a87a52' : d.id === 'pelabuhan' ? '#7a6a52' : d.id === 'pantai' ? '#c9a86a' : '#6a7a52';
        const mat = new THREE.MeshLambertMaterial({ map: facade(base, 0.55) });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), mat);
        mesh.position.set(cx, h / 2, cz);
        scene.add(mesh);
        state.colliders.push({ x: cx, z: cz, hx: w / 2, hz: dep / 2 });
        if (d.id === 'menara' && h > 60) {
          const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 10, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
          antenna.position.set(cx, h + 5, cz);
          scene.add(antenna);
          const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
          beaconLight.position.set(cx, h + 10, cz);
          scene.add(beaconLight);
        }
      }
    }
  }
}

function buildHarbour(state, rng, scene) {
  const colors = ['#c94a2e', '#2e7ac9', '#3a9e4a', '#c9a02e', '#7a4ac9'];
  for (let i = 0; i < 14; i += 1) {
    const cx = range(rng, 170, 250);
    const cz = range(rng, -180, 180);
    if (Math.abs(cz - 0) < 12 || Math.abs(cz - 80) < 12 || Math.abs(cz + 80) < 12) continue;
    if (Math.hypot(cx - 205, cz - 60) < 16) continue;
    const stack = rangeInt(rng, 1, 3);
    for (let s = 0; s < stack; s += 1) {
      const cont = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 2.6), new THREE.MeshLambertMaterial({ map: containerTexture(colors[i % colors.length]) }));
      cont.position.set(cx, 1.3 + s * 2.6, cz);
      cont.rotation.y = (i % 2 === 0) ? 0 : Math.PI / 2;
      scene.add(cont);
    }
    state.colliders.push({ x: cx, z: cz, hx: 6, hz: 6 });
  }
  for (const cz of [-120, 60]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(3, 34, 3), new THREE.MeshLambertMaterial({ color: 0xc9a02e }));
    leg.position.set(240, 17, cz); scene.add(leg);
    const leg2 = leg.clone(); leg2.position.set(252, 17, cz); scene.add(leg2);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(26, 2.5, 2.5), new THREE.MeshLambertMaterial({ color: 0xc9a02e }));
    arm.position.set(246, 33, cz); scene.add(arm);
    state.colliders.push({ x: 246, z: cz, hx: 8, hz: 3 });
  }
  const pier = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 14), new THREE.MeshLambertMaterial({ color: 0x8a6a4a }));
  pier.position.set(280, 0.2, 100); scene.add(pier);
}

function buildNature(state, rng, scene) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8a3a });
  function palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 6, 6), trunkMat);
    trunk.position.y = 3; g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.6, 7), leafMat);
    leaves.position.y = 6.6;
    leaves.scale.y = 0.55;
    g.add(leaves);
    g.position.set(x, 0, z);
    scene.add(g);
  }
  for (let i = 0; i < 16; i += 1) palm(range(rng, -150, 150), range(rng, -410, -250));
  for (let i = 0; i < 6; i += 1) palm(range(rng, -250, 250), range(rng, -190, 210));
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9b8 });
  for (const ax of AVENUES) for (const sz of [-160, 0, 160]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), lampMat);
    pole.position.set(ax + 7, 3.5, sz); scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), bulbMat);
    bulb.position.set(ax + 7, 7, sz); scene.add(bulb);
  }
  const volcano = new THREE.Mesh(new THREE.ConeGeometry(46, 58, 20), new THREE.MeshLambertMaterial({ color: 0x4a3a32 }));
  volcano.position.set(120, 29, -385);
  scene.add(volcano);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(13, 16), new THREE.MeshBasicMaterial({ color: 0xff6a1e }));
  lava.rotation.x = -Math.PI / 2; lava.position.set(120, 58.2, -385);
  scene.add(lava);
  state.colliders.push({ x: 120, z: -385, hx: 34, hz: 34 });
  const hill = new THREE.Mesh(new THREE.ConeGeometry(60, 18, 12), new THREE.MeshLambertMaterial({ color: 0x6a8a4a }));
  hill.position.set(60, 9, -390);
  hill.scale.z = 0.7;
  scene.add(hill);
}

function buildSigns(state, scene) {
  for (const s of SIGN_SPOTS) {
    const tex = signTexture(s.text, s.bg, s.fg);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: tex }));
    mesh.position.set(s.x, 9, s.z);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);
  }
  const festival = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: neonSignTexture('FESTIVAL', 'BAHARI', '#0e3a4a', '#ffd98a') }));
  festival.position.set(20, 12, -108);
  festival.rotation.y = Math.PI;
  scene.add(festival);
}

function buildRamps(state, scene) {
  state.ramps = [];
  for (const r of [{ x: 90, z: -330, angle: Math.PI }, { x: -70, z: -310, angle: Math.PI / 2 }, { x: 205, z: 60, angle: -Math.PI / 2 }]) {
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, 10), new THREE.MeshLambertMaterial({ color: 0xe86a1e }));
    ramp.position.set(r.x, 1.1, r.z);
    ramp.rotation.x = -0.42;
    ramp.rotation.y = r.angle;
    scene.add(ramp);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshBasicMaterial({ map: signTexture('LOMPAT!', '#e86a1e', '#ffffff') }));
    stripe.position.set(r.x, 2.6, r.z);
    stripe.rotation.y = r.angle;
    scene.add(stripe);
    state.ramps.push(r);
  }
}

function buildBeacon(state, scene) {
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 60, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.set(-190, 30, 140);
  scene.add(beam);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.35, 20),
    new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.85 }),
  );
  ring.position.set(-190, 0.2, 140);
  scene.add(ring);
  state.markers.beacon = ring;
  state.markers.beam = beam;
}

// Push a circle (player or car) out of every building/container AABB it
// overlaps. Returns true when a collision happened.
export function resolveCircleCollision(state, pos, radius) {
  let hit = false;
  for (const c of state.colliders) {
    const nx = Math.max(c.x - c.hx, Math.min(pos.x, c.x + c.hx));
    const nz = Math.max(c.z - c.hz, Math.min(pos.z, c.z + c.hz));
    const dx = pos.x - nx;
    const dz = pos.z - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    hit = true;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      pos.x = nx + (dx / d) * radius;
      pos.z = nz + (dz / d) * radius;
    } else {
      pos.x += radius;
    }
  }
  return hit;
}
