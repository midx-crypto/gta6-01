// Aruna Bay — vehicles: builds a low-poly car mesh and drives it with simple
// arcade physics (accelerate, brake, steer, building and car collision).

import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';
import { hitsCollider } from './world.js';

let carId = 0;

export function makeCarMesh(color, isPolice) {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhongMaterial({
    color: isPolice ? 0xf2f2f2 : color, shininess: 90, specular: 0x888888,
  });
  const dark = new THREE.MeshPhongMaterial({ color: 0x181c22, shininess: 40 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.6), paint);
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 2.3), dark);
  cabin.position.set(0, 1.3, -0.25);
  cabin.castShadow = true;
  group.add(cabin);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const sx of [-0.7, 0.7]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), lightMat);
    hl.position.set(sx, 0.7, 2.32);
    group.add(hl);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  for (const sx of [-0.7, 0.7]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), tailMat);
    tl.position.set(sx, 0.7, -2.32);
    group.add(tl);
  }
  if (isPolice) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.12, 0.3, 4.62),
      new THREE.MeshLambertMaterial({ color: 0x1a3a8a }),
    );
    stripe.position.y = 0.65;
    group.add(stripe);
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.16, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xff2233 }),
    );
    bar.position.set(0, 1.72, -0.25);
    group.add(bar);
    group.userData.lightBar = bar;
    const blue = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.16, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x2255ff }),
    );
    blue.position.set(0.55, 1.72, -0.25);
    group.add(blue);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheels = [];
  for (const [wx, wz] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    group.add(wheel);
    wheels.push(wheel);
  }
  group.userData.wheels = wheels;
  return group;
}

// A drivable car: mesh + arcade state. forward is +Z rotated by yaw.
export function createCar(scene, x, z, yaw, color, opts = {}) {
  const mesh = makeCarMesh(color, !!opts.police);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = yaw;
  scene.add(mesh);
  const car = {
    id: ++carId,
    mesh, yaw, speed: 0,
    isPolice: !!opts.police,
    isPlayerCar: !!opts.player,
    parked: !!opts.parked,
    stolen: false,
    color,
    health: 100,
    steerVisual: 0,
  };
  return car;
}

export function removeCar(scene, car) {
  scene.remove(car.mesh);
}

// Arcade driving step. input: {throttle (-1..1), steer (-1..1)}.
export function driveCar(car, input, dt, colliders, otherCars) {
  const accel = input.throttle > 0 ? CONFIG.carAccel : CONFIG.carBrake;
  car.speed += input.throttle * accel * dt;
  // drag + rolling resistance
  car.speed -= car.speed * 0.6 * dt;
  if (Math.abs(car.speed) < 0.05 && input.throttle === 0) car.speed = 0;
  const maxSpeed = car.isPolice ? 38 : CONFIG.carMaxSpeed;
  car.speed = Math.max(-12, Math.min(maxSpeed, car.speed));
  const steerAmount = input.steer * CONFIG.carTurn * dt * Math.sign(car.speed || 1)
    * Math.min(1, Math.abs(car.speed) / 8 + 0.25);
  car.yaw += steerAmount;
  car.steerVisual += (input.steer * 0.5 - car.steerVisual) * Math.min(1, dt * 8);

  const nx = car.mesh.position.x + Math.sin(car.yaw) * car.speed * dt;
  const nz = car.mesh.position.z + Math.cos(car.yaw) * car.speed * dt;
  const blocked = hitsCollider(colliders, nx, nz, 1.6);
  if (blocked) {
    car.speed *= -0.25; // bounce off the wall
  } else {
    car.mesh.position.x = nx;
    car.mesh.position.z = nz;
  }
  // soft push against other cars
  for (const other of otherCars) {
    if (other === car) continue;
    const dx = car.mesh.position.x - other.mesh.position.x;
    const dz = car.mesh.position.z - other.mesh.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 3.4 && d > 0.01) {
      const push = (3.4 - d) * 0.5;
      car.mesh.position.x += (dx / d) * push;
      car.mesh.position.z += (dz / d) * push;
      car.speed *= 0.9;
    }
  }
  const clampedX = Math.max(-185, Math.min(235, car.mesh.position.x));
  const clampedZ = Math.max(-185, Math.min(185, car.mesh.position.z));
  car.mesh.position.x = clampedX;
  car.mesh.position.z = clampedZ;
  car.mesh.rotation.y = car.yaw;
  for (const wheel of car.mesh.userData.wheels) {
    wheel.rotation.x += car.speed * dt * 2;
  }
  return car;
}

export function carForward(car) {
  return { x: Math.sin(car.yaw), z: Math.cos(car.yaw) };
}

// Parked-car spots along the roads, used by the spawn step in main.js.
export function parkedSpots(rng) {
  const spots = [];
  for (const x of [-150, -100, -50, 0, 50, 100, 150]) {
    for (const z of [-125, -25, 75, 125]) {
      if (rng() < 0.45) spots.push({ x: x + 4.5, z, yaw: Math.PI / 2 });
      if (rng() < 0.35) spots.push({ x: x - 4.5, z: z + 20, yaw: -Math.PI / 2 });
    }
  }
  return spots;
}

export function nearestCar(cars, x, z, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const car of cars) {
    const dx = car.mesh.position.x - x;
    const dz = car.mesh.position.z - z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}
