// Cars: box-built meshes with spinning wheels, traffic AI that loops the
// road grid, and the player's three owned cars parked at the garage.
import * as THREE from 'three';
import { CAR } from './config.js';
import { range, pick } from './random.js';

const TRAFFIC_COLORS = [0xc0c0c0, 0x3a3a3a, 0xd8d8d8, 0x7a2e2e, 0x2e5a7a, 0x7a6a2e, 0x4a7a3a, 0x8a4a7a];
const LOOPS = [
  [[-120, -160], [40, -160], [40, 0], [-120, 0]],
  [[-200, -80], [200, -80], [200, 80], [-200, 80]],
  [[-40, -160], [120, -160], [120, -20], [-40, -20]],
  [[-80, -420], [80, -420], [80, -330], [-80, -330]],
  [[-200, 160], [200, 160], [200, -160], [-200, -160]],
];

export function makeCarMesh(color, opts = {}) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 4.4), bodyMat);
  body.position.y = 0.55;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2), opts.police ? bodyMat : glassMat);
  cabin.position.set(0, 1.1, -0.2);
  group.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x181818 });
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.36, wz);
    group.add(wheel);
    wheels.push(wheel);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b8 });
  for (const lx of [-0.6, 0.6]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), lightMat);
    light.position.set(lx, 0.6, 2.22);
    group.add(light);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.4), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    bar.position.set(0, 1.5, -0.2);
    group.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.4), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    bar2.position.set(0.7, 1.5, -0.2);
    group.add(bar2);
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    sign.position.set(0, 1.5, -0.2);
    group.add(sign);
  }
  group.userData.wheels = wheels;
  return group;
}

export function createTraffic(state, rng, count) {
  state.traffic = [];
  for (let i = 0; i < count; i += 1) {
    const loop = LOOPS[i % LOOPS.length];
    const start = loop[i % loop.length];
    const mesh = makeCarMesh(pick(rng, TRAFFIC_COLORS));
    mesh.position.set(start[0] + range(rng, -2, 2), 0, start[1] + range(rng, -2, 2));
    state.scene.add(mesh);
    const car = {
      mesh, x: mesh.position.x, z: mesh.position.z, angle: 0, speed: range(rng, 7, 12),
      targetSpeed: range(rng, 8, 13), traffic: true, owned: false, police: false,
      loop, loopIndex: (i + 1) % loop.length, y: 0, vy: 0, color: mesh.children[0].material.color.getHex(),
    };
    state.traffic.push(car);
    state.cars.push(car);
  }
}

export function createOwnedCars(state) {
  for (const owned of state.owned) {
    const mesh = makeCarMesh(owned.color);
    mesh.position.set(owned.x, 0, owned.z);
    mesh.rotation.y = Math.PI / 2;
    state.scene.add(mesh);
    const car = {
      mesh, x: owned.x, z: owned.z, angle: Math.PI / 2, speed: 0, targetSpeed: 0,
      traffic: false, owned: true, police: false, y: 0, vy: 0, ownedRef: owned,
    };
    state.cars.push(car);
  }
}

export function updateTraffic(state, dt) {
  for (const car of state.traffic) {
    const target = car.loop[car.loopIndex];
    const dx = target[0] - car.x;
    const dz = target[1] - car.z;
    const d = Math.hypot(dx, dz);
    if (d < 4) { car.loopIndex = (car.loopIndex + 1) % car.loop.length; continue; }
    const wantAngle = Math.atan2(dx, dz);
    let diff = wantAngle - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += Math.max(-1.6 * dt, Math.min(1.6 * dt, diff));
    let speed = car.targetSpeed;
    const px = state.player.x - car.x;
    const pz = state.player.z - car.z;
    const pDist = Math.hypot(px, pz);
    if (pDist < 10) {
      const ahead = Math.cos(car.angle) * pz + Math.sin(car.angle) * px;
      if (ahead > 0) speed = Math.min(speed, Math.max(0, (pDist - 4) * 0.8));
    }
    car.speed += (speed - car.speed) * Math.min(1, dt * 2);
    car.x += Math.sin(car.angle) * car.speed * dt;
    car.z += Math.cos(car.angle) * car.speed * dt;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;
    for (const wheel of car.mesh.userData.wheels) wheel.rotation.x += car.speed * dt * 2;
  }
}

export function carTopSpeed(car) {
  const base = CAR.maxSpeed;
  if (!car.ownedRef) return base;
  return base + car.ownedRef.engine * 4 + car.ownedRef.nitro * 1.5;
}

// Parked cars the player can steal, placed along the avenues.
export function createParkedCars(state, rng, count) {
  const spots = [];
  for (let i = 0; i < count; i += 1) {
    const ax = AVENUE_SPOTS[i % AVENUE_SPOTS.length];
    const mesh = makeCarMesh(pick(rng, TRAFFIC_COLORS));
    mesh.position.set(ax.x, 0, ax.z);
    mesh.rotation.y = ax.angle;
    state.scene.add(mesh);
    const car = {
      mesh, x: ax.x, z: ax.z, angle: ax.angle, speed: 0, targetSpeed: 0,
      traffic: false, owned: false, police: false, parked: true, y: 0, vy: 0,
    };
    state.cars.push(car);
    spots.push(car);
  }
  return spots;
}
const AVENUE_SPOTS = [
  { x: -114, z: -120, angle: 0 }, { x: -34, z: -40, angle: 0 }, { x: 46, z: 40, angle: 0 },
  { x: 126, z: 120, angle: 0 }, { x: -194, z: 80, angle: Math.PI }, { x: 206, z: -120, angle: Math.PI },
  { x: -114, z: 40, angle: Math.PI }, { x: 46, z: -120, angle: Math.PI }, { x: -74, z: -320, angle: 0 },
  { x: 86, z: -350, angle: Math.PI },
];
