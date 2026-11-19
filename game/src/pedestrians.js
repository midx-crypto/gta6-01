// Pedestrians: 36 islanders wandering the sidewalks, fleeing gunfire and
// high wanted levels. Simple capsule people with varied shirt colours.
import * as THREE from 'three';
import { range, pick } from './random.js';
import { isOnRoad, nearestRoadPoint } from './districts.js';

const SHIRTS = [0xd84a4a, 0x4a7ad8, 0x4ad87a, 0xd8c84a, 0xd84ad8, 0x4ad8d8, 0xe8e8e8, 0x7a4ad8];
const SKINS = [0xc98a5a, 0x8a5a3a, 0xe8b88a, 0x6a4a2a];

export function makePedMesh(shirt, skin) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.0, 8), new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 0.95;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshLambertMaterial({ color: skin }));
  head.position.y = 1.68;
  group.add(head);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a3a }));
  legs.position.y = 0.25;
  group.add(legs);
  return group;
}

export function createPedestrians(state, rng, count) {
  state.peds = [];
  for (let i = 0; i < count; i += 1) {
    const mesh = makePedMesh(pick(rng, SHIRTS), pick(rng, SKINS));
    let x = range(rng, -240, 240);
    let z = range(rng, -190, 210);
    if (isOnRoad(x, z)) { const p = nearestRoadPoint(x, z); x = p.x + 9; z = p.z; }
    if (i >= count - 8) { x = range(rng, -150, 150); z = range(rng, -410, -250); }
    mesh.position.set(x, 0, z);
    state.scene.add(mesh);
    state.peds.push({
      mesh, x, z, angle: range(rng, 0, Math.PI * 2), speed: range(rng, 1.2, 2.4),
      targetX: x, targetZ: z, wait: range(rng, 0, 4), walkPhase: rng() * 6,
    });
  }
}

export function updatePedestrians(state, dt) {
  const fleeing = state.wanted >= 3;
  for (const ped of state.peds) {
    ped.wait -= dt;
    const dx = ped.targetX - ped.x;
    const dz = ped.targetZ - ped.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.5 || ped.wait <= 0) {
      if (ped.wait <= 0) {
        ped.targetX = ped.x + range(Math.random, -40, 40);
        ped.targetZ = ped.z + range(Math.random, -40, 40);
        ped.targetX = Math.max(-250, Math.min(250, ped.targetX));
        ped.targetZ = Math.max(-410, Math.min(210, ped.targetZ));
        ped.wait = range(Math.random, 2, 7);
      }
      continue;
    }
    const speed = fleeing ? ped.speed * 2.2 : ped.speed;
    const wantAngle = Math.atan2(dx, dz);
    let diff = wantAngle - ped.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ped.angle += Math.max(-3 * dt, Math.min(3 * dt, diff));
    ped.x += Math.sin(ped.angle) * speed * dt;
    ped.z += Math.cos(ped.angle) * speed * dt;
    ped.walkPhase += dt * speed * 4;
    ped.mesh.position.set(ped.x, Math.abs(Math.sin(ped.walkPhase)) * 0.06, ped.z);
    ped.mesh.rotation.y = ped.angle;
  }
}

// A pedestrian panics and runs away from a point (gunfire, a crash).
export function panicPedestrians(state, x, z, radius) {
  for (const ped of state.peds) {
    const d = Math.hypot(ped.x - x, ped.z - z);
    if (d < radius) {
      const a = Math.atan2(ped.x - x, ped.z - z);
      ped.targetX = ped.x + Math.sin(a) * 50;
      ped.targetZ = ped.z + Math.cos(a) * 50;
      ped.wait = 5;
    }
  }
}
