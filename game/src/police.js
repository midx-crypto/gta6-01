// Wanted system: stars 0-5, police cars that chase and ram, foot cops that
// chase on foot, roadblocks at 5 stars, decay when the player hides, and the
// busted / wasted endings.
import * as THREE from 'three';
import { WANTED_DECAY_SECONDS } from './config.js';
import { makeCarMesh } from './vehicles.js';
import { makePedMesh } from './pedestrians.js';
import { sirenSound } from './audio.js';

export function setWanted(state, level) {
  state.wanted = Math.max(0, Math.min(5, level));
  state.wantedTimer = 0;
}

export function addWanted(state, amount) {
  setWanted(state, state.wanted + amount);
}

export function placePoliceCar(state, x, z, angle) {
  const car = spawnPoliceCar(state, x, z);
  car.angle = angle;
  car.mesh.rotation.y = angle;
  return car;
}

function spawnPoliceCar(state, x, z) {
  const mesh = makeCarMesh(0x1a1a2e, { police: true });
  mesh.position.set(x, 0, z);
  state.scene.add(mesh);
  const car = { mesh, x, z, angle: 0, speed: 0, targetSpeed: 30, traffic: false, owned: false, police: true, y: 0, vy: 0 };
  state.policeCars.push(car);
  state.cars.push(car);
  return car;
}

function spawnFootCop(state, x, z) {
  const mesh = makePedMesh(0x1a2e5a, 0xc98a5a);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.14, 10), new THREE.MeshLambertMaterial({ color: 0x101020 }));
  hat.position.y = 1.92;
  mesh.add(hat);
  mesh.position.set(x, 0, z);
  state.scene.add(mesh);
  const cop = { mesh, x, z, angle: 0, speed: 6.5, holdTimer: 0 };
  state.cops.push(cop);
  return cop;
}

export function updatePolice(state, dt) {
  const wanted = state.wanted;
  sirenSound(wanted > 0);
  const wantCars = wanted === 0 ? 0 : wanted <= 2 ? 1 : wanted <= 3 ? 2 : 3;
  const wantCops = wanted === 0 ? 0 : wanted <= 1 ? 1 : wanted <= 3 ? 2 : 4;

  while (state.policeCars.length < wantCars) {
    const a = Math.random() * Math.PI * 2;
    spawnPoliceCar(state, state.player.x + Math.cos(a) * 55, state.player.z + Math.sin(a) * 55);
  }
  while (state.policeCars.length > wantCars) {
    const car = state.policeCars.pop();
    state.scene.remove(car.mesh);
    state.cars = state.cars.filter((c) => c !== car);
  }
  while (state.cops.length < wantCops) {
    const a = Math.random() * Math.PI * 2;
    spawnFootCop(state, state.player.x + Math.cos(a) * 22, state.player.z + Math.sin(a) * 22);
  }
  while (state.cops.length > wantCops) {
    const cop = state.cops.pop();
    state.scene.remove(cop.mesh);
  }

  for (const car of state.policeCars) {
    const dx = state.player.x - car.x;
    const dz = state.player.z - car.z;
    const d = Math.hypot(dx, dz);
    const wantAngle = Math.atan2(dx, dz);
    let diff = wantAngle - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const target = d > 6 ? 30 + wanted * 2 : 12;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
    car.x += Math.sin(car.angle) * car.speed * dt;
    car.z += Math.cos(car.angle) * car.speed * dt;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;
    if (d < 2.6 && !state.player.onFoot) {
      state.car.speed *= 0.92;
      if (Math.abs(state.car.speed) < 3 && wanted >= 3) state.health -= 4 * dt;
    }
  }

  for (const cop of state.cops) {
    const dx = state.player.x - cop.x;
    const dz = state.player.z - cop.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.4 && state.player.onFoot) {
      cop.holdTimer += dt;
      if (cop.holdTimer > 1.2) { state.mode = 'busted'; return; }
    } else cop.holdTimer = 0;
    const wantAngle = Math.atan2(dx, dz);
    cop.angle = wantAngle;
    cop.x += Math.sin(cop.angle) * cop.speed * dt;
    cop.z += Math.cos(cop.angle) * cop.speed * dt;
    cop.mesh.position.set(cop.x, 0, cop.z);
    cop.mesh.rotation.y = cop.angle;
  }

  if (wanted > 0) {
    const nearest = Math.min(
      ...state.policeCars.map((c) => Math.hypot(c.x - state.player.x, c.z - state.player.z)),
      ...state.cops.map((c) => Math.hypot(c.x - state.player.x, c.z - state.player.z)),
      Infinity,
    );
    if (nearest > 45) {
      state.wantedTimer += dt;
      if (state.wantedTimer > WANTED_DECAY_SECONDS) {
        state.wantedTimer = 0;
        state.wanted -= 1;
        state.message = state.wanted === 0 ? 'Kamu lolos dari polisi.' : 'Bintang wanted berkurang.';
        state.messageTimer = 2.5;
      }
    } else state.wantedTimer = 0;
  }
  if (state.health <= 0) state.mode = 'wasted';
}

// Roadblock: at wanted 5 two police cars park across the road ahead of the
// player, forcing a detour or a smash-through.
export function maybeRoadblock(state) {
  if (state.wanted < 5 || state.roadblock) return;
  state.roadblock = true;
  const px = state.player.x; const pz = state.player.z;
  const ahead = state.player.onFoot ? state.player.angle : (state.car ? state.car.angle : 0);
  const bx = px + Math.sin(ahead) * 45;
  const bz = pz + Math.cos(ahead) * 45;
  for (const off of [-4, 4]) {
    const mesh = makeCarMesh(0x1a1a2e, { police: true });
    mesh.position.set(bx + Math.cos(ahead) * off, 0, bz - Math.sin(ahead) * off);
    mesh.rotation.y = ahead + Math.PI / 2;
    state.scene.add(mesh);
    const car = { mesh, x: mesh.position.x, z: mesh.position.z, angle: ahead + Math.PI / 2, speed: 0, targetSpeed: 0, traffic: false, owned: false, police: true, roadblock: true, y: 0, vy: 0 };
    state.policeCars.push(car);
    state.cars.push(car);
  }
  state.message = 'ROADBLOCK di depan! Cari jalan lain.';
  state.messageTimer = 3;
}
export function clearRoadblock(state) {
  if (!state.roadblock) return;
  state.roadblock = false;
  const blocked = state.policeCars.filter((c) => c.roadblock);
  for (const car of blocked) {
    state.scene.remove(car.mesh);
    state.cars = state.cars.filter((c) => c !== car);
  }
  state.policeCars = state.policeCars.filter((c) => !c.roadblock);
}
