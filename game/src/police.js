// Aruna Bay — police: the wanted system. Crimes raise stars; police cars
// and foot cops chase the player; get caught on foot and you are busted,
// lose all health and you are wasted. Hide or outrun them to cool down.

import * as THREE from 'three';
import { WANTED_RESPONSE, HEAT_COOLDOWN_SECONDS } from './config.js';
import { makeRng } from './random.js';
import { createCar, driveCar } from './vehicles.js';
import { makePersonMesh } from './pedestrians.js';

export function createPoliceState() {
  return {
    wanted: 0,
    heatTimer: 0, // seconds since the last crime
    cars: [],
    cops: [],
    bustedTimer: 0,
    sirenPhase: 0,
  };
}

export function raiseWanted(police, amount) {
  police.wanted = Math.min(5, police.wanted + amount);
  police.heatTimer = 0;
}

export function clearWanted(police) {
  police.wanted = 0;
  police.heatTimer = 0;
}

// Spawn / despawn police units to match the current wanted level.
export function syncPoliceUnits(scene, police, playerPos) {
  const want = WANTED_RESPONSE[police.wanted];
  if (!want) {
    // remove all units
    for (const c of police.cars) scene.remove(c.mesh);
    for (const c of police.cops) scene.remove(c.mesh);
    police.cars = [];
    police.cops = [];
    return;
  }
  const rng = makeRng(1234 + police.wanted);
  while (police.cars.length < want.policeCars) {
    const a = rng() * Math.PI * 2;
    const car = createCar(
      scene,
      playerPos.x + Math.cos(a) * 45,
      playerPos.z + Math.sin(a) * 45,
      rng() * Math.PI * 2, 0xffffff, { police: true },
    );
    police.cars.push(car);
  }
  while (police.cops.length < want.footCops) {
    const mesh = makePersonMesh(makeRng(777 + police.cops.length));
    // dark blue uniform on torso, arms and legs only (head stays skin tone)
    const uniform = new THREE.Color(0x1a2a5a);
    mesh.children[0].material.color.copy(uniform);
    mesh.children[2].material.color.copy(uniform);
    mesh.children[3].material.color.copy(uniform);
    mesh.children[4].material.color.copy(uniform);
    mesh.children[5].material.color.copy(uniform);
    const a = rng() * Math.PI * 2;
    mesh.position.set(playerPos.x + Math.cos(a) * 18, 0, playerPos.z + Math.sin(a) * 18);
    scene.add(mesh);
    police.cops.push({ mesh, yaw: 0, speed: 5.2, walkPhase: 0 });
  }
  while (police.cars.length > want.policeCars) {
    const c = police.cars.pop();
    scene.remove(c.mesh);
  }
  while (police.cops.length > want.footCops) {
    const c = police.cops.pop();
    scene.remove(c.mesh);
  }
}

function turnToward(current, target) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// Returns 'busted' when a cop catches the player on foot, else null.
export function updatePolice(scene, police, dt, player, colliders, allCars) {
  if (police.wanted === 0) {
    syncPoliceUnits(scene, police, player.pos);
    return null;
  }
  police.heatTimer += dt;
  police.sirenPhase += dt;
  // heat cools down if the player stays out of sight for a while
  if (police.heatTimer > HEAT_COOLDOWN_SECONDS && police.wanted > 0) {
    police.wanted -= 1;
    police.heatTimer = 0;
  }
  syncPoliceUnits(scene, police, player.pos);
  const want = WANTED_RESPONSE[police.wanted];
  if (!want) return null;

  const target = player.inCar ? player.car.mesh.position : player.pos;
  for (const car of police.cars) {
    const dx = target.x - car.mesh.position.x;
    const dz = target.z - car.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const wantYaw = Math.atan2(dx, dz);
    const diff = turnToward(car.yaw, wantYaw);
    const steer = Math.max(-1, Math.min(1, diff * 2.4));
    const throttle = dist > 6 ? 0.85 : 0.2;
    driveCar(car, { throttle, steer }, dt, colliders, allCars);
    car.speed = Math.min(car.speed, want.chaseSpeed);
    // flash the light bar
    if (car.mesh.userData.lightBar) {
      const on = Math.floor(police.sirenPhase * 4) % 2 === 0;
      car.mesh.userData.lightBar.material.color.set(on ? 0xff2233 : 0x2255ff);
    }
    // ram the player car
    if (player.inCar && dist < 4) {
      player.car.speed *= 0.94;
    }
  }
  // foot cops run at the player; catching means busted
  for (const cop of police.cops) {
    const dx = player.pos.x - cop.mesh.position.x;
    const dz = player.pos.z - cop.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.6 && !player.inCar) {
      police.bustedTimer += dt;
      if (police.bustedTimer > 1.2) return 'busted';
    } else {
      police.bustedTimer = Math.max(0, police.bustedTimer - dt);
    }
    cop.yaw = Math.atan2(dx, dz);
    const step = Math.min(dist, cop.speed * dt);
    cop.mesh.position.x += Math.sin(cop.yaw) * step;
    cop.mesh.position.z += Math.cos(cop.yaw) * step;
    cop.walkPhase += dt * 8;
    const swing = Math.sin(cop.walkPhase) * 0.5;
    cop.mesh.userData.legL.rotation.x = swing;
    cop.mesh.userData.legR.rotation.x = -swing;
    cop.mesh.rotation.y = cop.yaw;
  }
  return null;
}

export function resetPoliceAfterBusted(scene, police) {
  for (const c of police.cars) scene.remove(c.mesh);
  for (const c of police.cops) scene.remove(c.mesh);
  police.cars = [];
  police.cops = [];
  police.wanted = 0;
  police.heatTimer = 0;
  police.bustedTimer = 0;
}
