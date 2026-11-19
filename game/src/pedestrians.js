// Aruna Bay — pedestrians: simple townsfolk who stroll the sidewalks,
// cross at corners, and scatter when a gun goes off or a car comes close.

import * as THREE from 'three';
import { makeRng, pick, range } from './random.js';
import { hitsCollider } from './world.js';

const SHIRT_COLORS = [0xd84a4a, 0x4a7ad8, 0x4ad87a, 0xd8c84a, 0xd84ab8, 0xeeeeee, 0x333333, 0x4ad8d0];
const SKIN_COLORS = [0xe8b88a, 0xc98a5a, 0x8a5a34, 0xf0c8a0];

export function makePersonMesh(rng) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: pick(rng, SHIRT_COLORS) });
  const skin = new THREE.MeshLambertMaterial({ color: pick(rng, SKIN_COLORS) });
  const pants = new THREE.MeshLambertMaterial({ color: pick(rng, [0x2a2a3a, 0x3a3a2a, 0x222222]) });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.3), shirt);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skin);
  head.position.y = 1.72;
  head.castShadow = true;
  group.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.22), pants);
  legL.position.set(-0.15, 0.42, 0);
  group.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.22), pants);
  legR.position.set(0.15, 0.42, 0);
  group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), shirt);
  armL.position.set(-0.36, 1.15, 0);
  group.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), shirt);
  armR.position.set(0.36, 1.15, 0);
  group.add(armR);
  group.userData = { legL, legR, armL, armR };
  return group;
}

export function spawnPedestrians(scene, seed, count, colliders) {
  const rng = makeRng(seed + 500);
  const peds = [];
  const roadLines = [];
  for (let v = -150; v <= 150; v += 50) roadLines.push(v);
  for (let i = 0; i < count; i++) {
    const mesh = makePersonMesh(rng);
    // stand on a sidewalk next to a road
    const alongRoad = rng() < 0.5;
    const line = pick(rng, roadLines);
    const t = range(rng, -170, 170);
    const off = pick(rng, [-9, 9]);
    const x = alongRoad ? t : line + off;
    const z = alongRoad ? line + off : t;
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    peds.push({
      mesh,
      yaw: rng() * Math.PI * 2,
      speed: range(rng, 1.2, 2.4),
      walkPhase: rng() * 10,
      panic: 0,
      axis: alongRoad ? 'x' : 'z',
      dir: rng() < 0.5 ? 1 : -1,
      base: alongRoad ? z : x,
    });
  }
  return peds;
}

// Scatter every pedestrian away from a point (used on big explosions / busts).
export function scatterPedestrians(peds, x, z) {
  for (const p of peds) {
    const dx = p.mesh.position.x - x;
    const dz = p.mesh.position.z - z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 50) {
      p.panic = 4;
      p.yaw = Math.atan2(dx, dz);
    }
  }
}

export function updatePedestrians(peds, dt, playerPos, gunshotPos, colliders) {
  for (const p of peds) {
    // panic: run away from a gunshot or a fast car
    if (gunshotPos) {
      const dx = p.mesh.position.x - gunshotPos.x;
      const dz = p.mesh.position.z - gunshotPos.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < 40) {
        p.panic = 3;
        p.yaw = Math.atan2(dx, dz);
      }
    }
    if (p.panic > 0) p.panic -= dt;
    const speed = p.panic > 0 ? 6 : p.speed;
    const nx = p.mesh.position.x + Math.sin(p.yaw) * speed * dt;
    const nz = p.mesh.position.z + Math.cos(p.yaw) * speed * dt;
    if (p.panic > 0) {
      if (!hitsCollider(colliders, nx, nz, 0.6)) {
        p.mesh.position.x = nx;
        p.mesh.position.z = nz;
      } else {
        p.yaw += Math.PI / 2; // turn away from the wall
      }
    } else {
      // stroll along the sidewalk line, turn at the city edge
      const along = p.axis === 'x' ? p.mesh.position.x : p.mesh.position.z;
      if (along > 175 || along < -175) p.dir *= -1;
      p.yaw = p.axis === 'x' ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (p.dir > 0 ? 0 : Math.PI);
      const step = speed * dt * p.dir;
      if (p.axis === 'x') p.mesh.position.x += step;
      else p.mesh.position.z += step;
      // keep on the sidewalk offset
      if (p.axis === 'x') p.mesh.position.z = p.base;
      else p.mesh.position.x = p.base;
    }
    p.walkPhase += dt * speed * 3;
    const swing = Math.sin(p.walkPhase) * 0.45;
    p.mesh.userData.legL.rotation.x = swing;
    p.mesh.userData.legR.rotation.x = -swing;
    p.mesh.userData.armL.rotation.x = -swing * 0.7;
    p.mesh.userData.armR.rotation.x = swing * 0.7;
    p.mesh.rotation.y = p.yaw;
  }
}
