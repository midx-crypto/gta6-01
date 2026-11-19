// Mira on foot: third-person walking and running, camera-relative movement,
// building collision, and entering / stealing cars with E.
import * as THREE from 'three';
import { PLAYER } from './config.js';
import { resolveCircleCollision } from './world.js';
import { isOnLand } from './districts.js';

export function makePlayerMesh() {
  const group = new THREE.Group();
  const jacket = new THREE.MeshLambertMaterial({ color: 0x2e8a7a });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.05, 10), jacket);
  body.position.y = 1.0;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), new THREE.MeshLambertMaterial({ color: 0xc98a5a }));
  head.position.y = 1.78;
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
  hair.position.y = 1.84;
  group.add(hair);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.32), new THREE.MeshLambertMaterial({ color: 0x2a2a3a }));
  legs.position.y = 0.28;
  group.add(legs);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), jacket);
  arm.position.set(0.45, 1.05, 0.25);
  arm.rotation.x = -0.9;
  group.add(arm);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), new THREE.MeshLambertMaterial({ color: 0x181818 }));
  gun.position.set(0.45, 1.05, 0.55);
  group.add(gun);
  group.userData.arm = arm;
  group.userData.gun = gun;
  return group;
}

export function updatePlayerOnFoot(state, input, dt, playerMesh) {
  const p = state.player;
  const fwd = input.forward();
  const strafe = input.strafe();
  const running = input.sprint();
  if (fwd === 0 && strafe === 0) { p.moving = false; p.speed = 0; return; }
  const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
  const yaw = state.cameraYaw;
  const mx = Math.sin(yaw) * fwd + Math.cos(yaw) * strafe;
  const mz = Math.cos(yaw) * fwd - Math.sin(yaw) * strafe;
  const len = Math.hypot(mx, mz) || 1;
  p.x += (mx / len) * speed * dt;
  p.z += (mz / len) * speed * dt;
  resolveCircleCollision(state, p, PLAYER.radius);
  if (!isOnLand(p.x, p.z)) {
    p.x -= (mx / len) * speed * dt;
    p.z -= (mz / len) * speed * dt;
  }
  p.angle = Math.atan2(mx, mz);
  p.moving = true;
  p.speed = speed;
  p.walkPhase = (p.walkPhase || 0) + dt * speed * 1.6;
  playerMesh.position.set(p.x, Math.abs(Math.sin(p.walkPhase)) * 0.05, p.z);
  playerMesh.rotation.y = p.angle;
  state.stats.distance += speed * dt;
}

export function nearestCar(state, maxDist) {
  let best = null; let bestD = maxDist;
  for (const car of state.cars) {
    if (car.police) continue;
    const d = Math.hypot(car.x - state.player.x, car.z - state.player.z);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

export function tryEnterCar(state) {
  if (!state.player.onFoot) return false;
  const car = nearestCar(state, 4.2);
  if (!car) return false;
  state.player.onFoot = false;
  state.car = car;
  car.speed = 0;
  if (car.traffic || car.parked) {
    car.traffic = false;
    car.parked = false;
    state.traffic = state.traffic.filter((c) => c !== car);
    state.wanted = Math.max(1, state.wanted);
    state.wantedTimer = 0;
    state.message = 'Mobil dicuri! Polisi mengejarmu.';
    state.messageTimer = 3;
  } else if (car.owned) {
    state.message = car.ownedRef.name + ' — mobilmu.';
    state.messageTimer = 2;
  }
  return true;
}

export function exitCar(state) {
  if (state.player.onFoot || !state.car) return;
  const car = state.car;
  const side = Math.cos(car.angle);
  const sideX = Math.sin(car.angle);
  state.player.x = car.x + sideX * 2.2;
  state.player.z = car.z + side * 2.2;
  state.player.angle = car.angle;
  state.player.onFoot = true;
  state.car = null;
}

// Mira's idle breathing and gun-aim pose helpers for the renderer.
export function posePlayerMesh(mesh, aiming, time) {
  if (!mesh) return;
  mesh.userData.arm.rotation.x = aiming ? -1.5 : -0.9 + Math.sin(time * 2) * 0.05;
  mesh.userData.gun.visible = aiming;
}
