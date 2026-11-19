// Aruna Bay — the player: Dimas on foot (WASD, mouse orbit camera) and in a
// car (E to enter/exit, steal parked and traffic cars). Health, money, ammo.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeRng } from './random.js';
import { hitsCollider } from './world.js';
import { makePersonMesh } from './pedestrians.js';
import { nearestCar } from './vehicles.js';

export function createPlayer(scene, spawn) {
  const mesh = makePersonMesh(makeRng(42));
  // Dimas: red jacket so he is easy to spot in screenshots
  mesh.children[0].material.color.set(0xc22e2e);
  mesh.children[4].material.color.set(0xc22e2e);
  mesh.children[5].material.color.set(0xc22e2e);
  mesh.position.copy(spawn);
  scene.add(mesh);
  return {
    mesh,
    pos: mesh.position,
    yaw: 0,
    camYaw: 0,
    camPitch: 0.32,
    health: CONFIG.startHealth,
    money: CONFIG.startMoney,
    ammo: CONFIG.pistolAmmo,
    hasGun: true,
    inCar: false,
    car: null,
    walkPhase: 0,
    speed: 0,
    moving: false,
  };
}

// On-foot movement, camera-relative. Returns nothing; mutates player.
export function updatePlayerOnFoot(player, input, dt, colliders) {
  const run = input.keys['shift'] ? CONFIG.playerRunSpeed : CONFIG.playerWalkSpeed;
  let mx = 0;
  let mz = 0;
  if (input.keys['w']) mz += 1;
  if (input.keys['s']) mz -= 1;
  if (input.keys['a']) mx -= 1;
  if (input.keys['d']) mx += 1;
  const len = Math.sqrt(mx * mx + mz * mz);
  player.moving = len > 0;
  if (!player.moving) {
    player.speed = 0;
    return;
  }
  mx /= len;
  mz /= len;
  // camera-relative: forward is where the camera looks
  const cy = player.camYaw;
  const fx = Math.sin(cy);
  const fz = Math.cos(cy);
  const rx = Math.cos(cy);
  const rz = -Math.sin(cy);
  const wx = fx * mz + rx * mx;
  const wz = fz * mz + rz * mx;
  player.speed = run;
  const nx = player.pos.x + wx * run * dt;
  const nz = player.pos.z + wz * run * dt;
  if (!hitsCollider(colliders, nx, player.pos.z, 0.7)) player.pos.x = nx;
  if (!hitsCollider(colliders, player.pos.x, nz, 0.7)) player.pos.z = nz;
  player.yaw = Math.atan2(wx, wz);
  player.mesh.rotation.y = player.yaw;
  player.walkPhase += dt * run * 1.6;
  const swing = Math.sin(player.walkPhase) * 0.55;
  player.mesh.userData.legL.rotation.x = swing;
  player.mesh.userData.legR.rotation.x = -swing;
  player.mesh.userData.armL.rotation.x = -swing * 0.8;
  player.mesh.userData.armR.rotation.x = swing * 0.8;
}

// Try to enter the nearest car (E). Returns the car or null.
// Note: does not clear car.parked — the caller checks it first to tell a
// stolen parked car from a carjacked traffic car, then clears it.
export function tryEnterCar(player, cars) {
  const car = nearestCar(cars, player.pos.x, player.pos.z, 5);
  if (!car) return null;
  player.inCar = true;
  player.car = car;
  car.isPlayerCar = true;
  player.mesh.visible = false;
  return car;
}

export function exitCar(player) {
  if (!player.car) return;
  const car = player.car;
  player.inCar = false;
  player.car = null;
  car.isPlayerCar = false;
  // step out to the driver's side
  player.pos.set(
    car.mesh.position.x - Math.cos(car.yaw) * 2.2,
    0,
    car.mesh.position.z + Math.sin(car.yaw) * 2.2,
  );
  player.mesh.visible = true;
  player.mesh.position.copy(player.pos);
}

export function damagePlayer(player, amount) {
  player.health = Math.max(0, player.health - amount);
  return player.health <= 0;
}

export function healPlayer(player, amount) {
  player.health = Math.min(CONFIG.startHealth, player.health + amount);
}

// Save / load progress in localStorage.
export function saveGame(player, missionIndex) {
  try {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify({
      money: player.money,
      health: player.health,
      ammo: player.ammo,
      mission: missionIndex,
      x: player.pos.x,
      z: player.pos.z,
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(CONFIG.saveKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
