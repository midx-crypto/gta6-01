// Aruna Bay — traffic: AI cars that cruise the road grid on rectangular
// loops, stop for nothing, and honk (visually) when the player blocks them.

import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';
import { makeRng, pick } from './random.js';
import { createCar, driveCar } from './vehicles.js';

export function makeTrafficLoops() {
  // Each loop is a rectangle of waypoints around one city block ring.
  const loops = [];
  for (const cx of [-100, 0, 100]) {
    for (const cz of [-100, 0, 100]) {
      const r = 25;
      loops.push([
        [cx - r, cz - r], [cx + r, cz - r], [cx + r, cz + r], [cx - r, cz + r],
      ]);
    }
  }
  // a long beach-road loop for the race vibe
  loops.push([[186, -150], [186, 150], [150, 150], [150, -150]]);
  return loops;
}

export function spawnTraffic(scene, seed, count) {
  const rng = makeRng(seed + 900);
  const loops = makeTrafficLoops();
  const cars = [];
  for (let i = 0; i < count; i++) {
    const loop = loops[i % loops.length];
    const wp = Math.floor(rng() * loop.length);
    const [x, z] = loop[wp];
    const car = createCar(
      scene, x + (rng() - 0.5) * 4, z + (rng() - 0.5) * 4,
      rng() * Math.PI * 2, pick(rng, PALETTE.carPaint), {},
    );
    car.traffic = {
      loop, wp, speed: 9 + rng() * 7, targetSpeed: 9 + rng() * 7,
    };
    cars.push(car);
  }
  return cars;
}

function turnToward(current, target) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function updateTraffic(cars, dt, colliders, playerCar) {
  const all = cars.concat(playerCar ? [playerCar] : []);
  for (const car of cars) {
    const t = car.traffic;
    const [tx, tz] = t.loop[t.wp];
    const dx = tx - car.mesh.position.x;
    const dz = tz - car.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 4) {
      t.wp = (t.wp + 1) % t.loop.length;
      continue;
    }
    const wantYaw = Math.atan2(dx, dz);
    const diff = turnToward(car.yaw, wantYaw);
    const steer = Math.max(-1, Math.min(1, diff * 2.2));
    // ease toward cruising speed
    const throttle = car.speed < t.targetSpeed ? 0.55 : 0;
    driveCar(car, { throttle, steer }, dt, colliders, all);
  }
}

// Remove a traffic car from the scene (used when the chase target is caught).
export function removeTrafficCar(scene, cars, car) {
  scene.remove(car.mesh);
  const i = cars.indexOf(car);
  if (i >= 0) cars.splice(i, 1);
}

// A single target car for the tail/chase mission: follows a fixed route
// around the city and never stops.
export function spawnTargetCar(scene, x, z) {
  const car = createCar(scene, x, z, 0, 0x181818, {});
  car.traffic = {
    loop: [[-100, -100], [100, -100], [100, 100], [-100, 100]],
    wp: 0, speed: 14, targetSpeed: 14,
  };
  return car;
}

export function updateTargetCar(car, dt, colliders) {
  const t = car.traffic;
  const [tx, tz] = t.loop[t.wp];
  const dx = tx - car.mesh.position.x;
  const dz = tz - car.mesh.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 5) {
    t.wp = (t.wp + 1) % t.loop.length;
    return;
  }
  const wantYaw = Math.atan2(dx, dz);
  const diff = turnToward(car.yaw, wantYaw);
  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  driveCar(car, { throttle: 0.6, steer }, dt, colliders, []);
}
