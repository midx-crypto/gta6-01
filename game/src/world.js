// Aruna Bay — the world: dusk sky, sea, beach, pier, park, city grid of
// buildings, roads, sidewalks, palms, streetlights and neon signs.
// Builds the whole scene procedurally and returns colliders, road lines and
// named places the gameplay systems use.

import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';
import { makeRng, pick, range, rangeInt } from './random.js';
import {
  makeBuildingTexture, makeRoadTexture, makeSandTexture,
  makeNeonSignTexture, makeFoamTexture,
} from './textures.js';

function css(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

export function buildWorld(scene, seed) {
  const rng = makeRng(seed);
  const colliders = []; // {minX,maxX,minZ,maxZ}
  const roadsX = [];
  const roadsZ = [];
  for (let v = -150; v <= 150; v += CONFIG.roadGap) {
    roadsX.push(v);
    roadsZ.push(v);
  }

  // --- sky: big gradient dome, sun disc, drifting clouds, dusk fog ---
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(PALETTE.skyTop) },
      mid: { value: new THREE.Color(PALETTE.skyMid) },
      low: { value: new THREE.Color(PALETTE.skyLow) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP;
      uniform vec3 top; uniform vec3 mid; uniform vec3 low;
      void main(){
        float h = normalize(vP).y;
        vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.8, h)) : mix(low, mid, smoothstep(-0.05, 0.25, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  scene.fog = new THREE.Fog(PALETTE.fog, 180, 620);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(34, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false }),
  );
  sun.position.set(-420, 130, -620);
  sun.lookAt(0, 40, 0);
  scene.add(sun);

  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffc9a8, transparent: true, opacity: 0.55, fog: false });
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Mesh(new THREE.SphereGeometry(range(rng, 18, 42), 8, 6), cloudMat);
    cl.scale.y = 0.35;
    cl.position.set(range(rng, -500, 500), range(rng, 120, 220), range(rng, -500, 300));
    scene.add(cl);
    clouds.push(cl);
  }

  // --- lights: warm low sun + cool ambient fill ---
  const hemi = new THREE.HemisphereLight(0xffb98a, 0x2a3550, 0.75);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xff9a5e, 1.6);
  sunLight.position.set(-180, 140, -120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -220;
  sunLight.shadow.camera.right = 220;
  sunLight.shadow.camera.top = 220;
  sunLight.shadow.camera.bottom = -220;
  sunLight.shadow.camera.far = 700;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // --- ground: grass base, city slab, sand, animated sea ---
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshLambertMaterial({ color: PALETTE.grass }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(60, -0.05, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const citySlab = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 380),
    new THREE.MeshLambertMaterial({ color: 0x6f6a5e }),
  );
  citySlab.rotation.x = -Math.PI / 2;
  citySlab.position.y = 0;
  citySlab.receiveShadow = true;
  scene.add(citySlab);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 400),
    new THREE.MeshLambertMaterial({ map: makeSandTexture() }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(205, 0.02, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  const seaMat = new THREE.MeshPhongMaterial({
    color: PALETTE.sea, shininess: 120, specular: 0xffc890,
    transparent: true, opacity: 0.94,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 40, 40), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(470, 0.15, 0);
  scene.add(sea);
  const seaBase = sea.geometry.attributes.position.array.slice();

  // --- roads: dark strips with lane markings, plus sidewalks ---
  const roadTex = makeRoadTexture();
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
  for (const x of roadsX) {
    const tex = roadTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1, 30);
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.roadWidth, 380),
      new THREE.MeshLambertMaterial({ map: tex }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.03, 0);
    strip.receiveShadow = true;
    scene.add(strip);
  }
  for (const z of roadsZ) {
    const tex = roadTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1, 30);
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.roadWidth, 380),
      new THREE.MeshLambertMaterial({ map: tex }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = Math.PI / 2;
    strip.position.set(0, 0.03, z);
    strip.receiveShadow = true;
    scene.add(strip);
  }
  // beach road along the sand
  const beachRoad = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.roadWidth, 380),
    new THREE.MeshLambertMaterial({ map: roadTex }),
  );
  beachRoad.rotation.x = -Math.PI / 2;
  beachRoad.position.set(186, 0.03, 0);
  scene.add(beachRoad);

  // --- buildings: one or two per block, taller toward the centre ---
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const facadeTextures = [];
  for (let i = 0; i < 5; i++) {
    facadeTextures.push(makeBuildingTexture(
      css(pick(rng, PALETTE.building)), 0.55, makeRng(seed + i * 7),
    ));
  }
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a40 });
  const buildings = [];
  for (let bx = -150; bx < 150; bx += CONFIG.roadGap) {
    for (let bz = -150; bz < 150; bz += CONFIG.roadGap) {
      const cx = bx + CONFIG.roadGap / 2;
      const cz = bz + CONFIG.roadGap / 2;
      // park block stays open
      if (Math.abs(cx - 25) < 26 && Math.abs(cz + 125) < 26) continue;
      const distCentre = Math.sqrt(cx * cx + cz * cz);
      const tall = distCentre < 80;
      const count = tall && rng() < 0.5 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const w = range(rng, 16, 26);
        const d = range(rng, 16, 26);
        const h = tall ? range(rng, 22, 62) : range(rng, 8, 26);
        const ox = count === 2 ? (k === 0 ? -9 : 9) : 0;
        const oz = count === 2 ? (k === 0 ? -9 : 9) : 0;
        const mat = new THREE.MeshLambertMaterial({
          map: facadeTextures[Math.floor(rng() * facadeTextures.length)],
        });
        const b = new THREE.Mesh(boxGeo, mat);
        b.scale.set(w, h, d);
        b.position.set(cx + ox, h / 2, cz + oz);
        b.castShadow = true;
        b.receiveShadow = true;
        scene.add(b);
        const roof = new THREE.Mesh(boxGeo, roofMat);
        roof.scale.set(w + 0.6, 0.8, d + 0.6);
        roof.position.set(cx + ox, h + 0.4, cz + oz);
        scene.add(roof);
        // rooftop antenna on tall towers
        if (h > 40) {
          const ant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.3, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x888888 }),
          );
          ant.position.set(cx + ox, h + 4.5, cz + oz);
          scene.add(ant);
        }
        colliders.push({
          minX: cx + ox - w / 2, maxX: cx + ox + w / 2,
          minZ: cz + oz - d / 2, maxZ: cz + oz + d / 2,
        });
        buildings.push(b);
      }
    }
  }

  // --- Bank Aruna: the finale target, a wide marble building with columns ---
  const bankMat = new THREE.MeshLambertMaterial({ color: 0xe8ddc0 });
  const bank = new THREE.Mesh(boxGeo, bankMat);
  bank.scale.set(34, 20, 24);
  bank.position.set(25, 10, 25);
  bank.castShadow = true;
  scene.add(bank);
  colliders.push({ minX: 8, maxX: 42, minZ: 13, maxZ: 37 });
  for (let i = 0; i < 5; i++) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.2, 14, 10),
      new THREE.MeshLambertMaterial({ color: 0xf4ecd8 }),
    );
    col.position.set(10 + i * 7.5, 7, 11.5);
    scene.add(col);
  }
  const bankSign = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 6.5),
    new THREE.MeshBasicMaterial({ map: makeNeonSignTexture('BANK ARUNA', '#ffd94d') }),
  );
  bankSign.position.set(25, 17, 12.6);
  bankSign.rotation.y = Math.PI; // face the street south of the bank
  scene.add(bankSign);

  // --- neon signs on the main strip (mounted on the street-facing side of
  // their buildings, so they read from the road, not from inside a wall) ---
  const signDefs = [
    { text: 'KAFE SENJA', color: '#ff2e88', x: -125, z: 61, ry: Math.PI },
    { text: 'BENGKEL RAKA', color: '#00e5ff', x: -78, z: -61, ry: Math.PI },
    { text: 'HOTEL ARUNA', color: '#ffe14d', x: 75, z: -61, ry: Math.PI },
    { text: 'PASAR MALAM', color: '#7cff5e', x: -75, z: 139, ry: 0 },
    { text: 'DERMAGA 7', color: '#b46bff', x: 196, z: 28, ry: -Math.PI / 2 },
  ];
  for (const s of signDefs) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 5.5),
      new THREE.MeshBasicMaterial({ map: makeNeonSignTexture(s.text, s.color) }),
    );
    sign.position.set(s.x, 9, s.z);
    sign.rotation.y = s.ry;
    scene.add(sign);
  }

  // --- palm trees along the beach road and the park ---
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f8a3a });
  const palmSpots = [];
  for (let z = -170; z <= 170; z += 28) {
    palmSpots.push([178, z + range(rng, -6, 6)]);
    palmSpots.push([196, z + range(rng, -6, 6)]);
  }
  for (let i = 0; i < 10; i++) palmSpots.push([range(rng, 0, 50), range(rng, -150, -100)]);
  for (const [px, pz] of palmSpots) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 9, 7), trunkMat);
    trunk.position.set(px, 4.5, pz);
    trunk.rotation.z = range(rng, -0.08, 0.08);
    trunk.castShadow = true;
    scene.add(trunk);
    for (let f = 0; f < 6; f++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.5, 4), leafMat);
      const a = (f / 6) * Math.PI * 2;
      leaf.position.set(px + Math.cos(a) * 2.2, 9.4, pz + Math.sin(a) * 2.2);
      leaf.rotation.z = Math.cos(a) * 1.1;
      leaf.rotation.x = -Math.sin(a) * 1.1;
      leaf.scale.set(1, 1, 0.25);
      scene.add(leaf);
    }
    colliders.push({ minX: px - 0.6, maxX: px + 0.6, minZ: pz - 0.6, maxZ: pz + 0.6 });
  }

  // --- streetlights: pole + warm glowing head, a few real point lights ---
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a30 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
  const lampLights = [];
  for (const x of roadsX) {
    for (const z of [-125, -25, 75]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 7, 6), poleMat);
      pole.position.set(x + 7, 3.5, z);
      scene.add(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lampMat);
      head.position.set(x + 7, 7.1, z);
      scene.add(head);
    }
  }
  for (const [lx, lz] of [[-75, -75], [25, 25], [150, 125], [195, -25], [-125, 75]]) {
    const pl = new THREE.PointLight(0xffc070, 60, 55, 1.8);
    pl.position.set(lx, 9, lz);
    scene.add(pl);
    lampLights.push(pl);
  }

  // --- Taman Aruna park: lawn, paths, benches, fountain ---
  const park = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshLambertMaterial({ color: 0x3f7a3e }),
  );
  park.rotation.x = -Math.PI / 2;
  park.position.set(25, 0.04, -125);
  park.receiveShadow = true;
  scene.add(park);
  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 7, 1.6, 16),
    new THREE.MeshPhongMaterial({ color: 0x9fb8c8, shininess: 80 }),
  );
  fountain.position.set(25, 0.8, -125);
  scene.add(fountain);
  const fountainWater = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 0.4, 16),
    new THREE.MeshPhongMaterial({ color: 0x2e8fb8, shininess: 140 }),
  );
  fountainWater.position.set(25, 1.7, -125);
  scene.add(fountainWater);
  colliders.push({ minX: 18, maxX: 32, minZ: -132, maxZ: -118 });

  // --- pier: wooden deck into the sea with lamps ---
  const pierMat = new THREE.MeshLambertMaterial({ color: 0x8a6a44 });
  const pier = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 60), pierMat);
  pier.position.set(232, 0.8, -25);
  pier.castShadow = true;
  scene.add(pier);
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 6), pierMat);
    post.position.set(228 + (i % 2) * 8, -0.5, -50 + i * 16);
    scene.add(post);
  }

  const places = {
    garage: new THREE.Vector3(-75, 0, -75),
    cafe: new THREE.Vector3(-125, 0, 75),
    warehouse: new THREE.Vector3(150, 0, 125),
    park: new THREE.Vector3(25, 0, -125),
    bank: new THREE.Vector3(25, 0, 25),
    pier: new THREE.Vector3(205, 0, -25),
    safehouse: new THREE.Vector3(-125, 0, 125),
    beachStart: new THREE.Vector3(195, 0, -125),
    spawn: new THREE.Vector3(-50, 0, 0),
  };

  return {
    colliders, roadsX, roadsZ, places, clouds, sea, seaBase,
    lampLights, bounds: CONFIG.cityHalf,
  };
}

// Animate the sea vertices and drift the clouds.
export function updateWorld(world, time) {
  const pos = world.sea.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const bx = world.seaBase[i * 3];
    const by = world.seaBase[i * 3 + 1];
    pos.setZ(i, Math.sin(bx * 0.08 + time * 1.2) * 0.5 + Math.cos(by * 0.06 + time * 0.9) * 0.5);
  }
  pos.needsUpdate = true;
  world.sea.geometry.computeVertexNormals();
  for (let i = 0; i < world.clouds.length; i++) {
    world.clouds[i].position.x += 0.02;
    if (world.clouds[i].position.x > 560) world.clouds[i].position.x = -560;
  }
}

// Point-in-AABB test used by cars, player and pedestrians.
export function hitsCollider(colliders, x, z, margin) {
  for (const c of colliders) {
    if (x > c.minX - margin && x < c.maxX + margin && z > c.minZ - margin && z < c.maxZ + margin) return c;
  }
  return null;
}

export function clampToCity(x, z, half) {
  return {
    x: Math.max(-half, Math.min(half + 40, x)),
    z: Math.max(-half, Math.min(half, z)),
  };
}
