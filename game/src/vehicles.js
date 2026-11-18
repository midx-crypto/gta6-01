// Solara Nights — vehicles.js
// Cars: traffic that drives the road grid, the player's stolen car with
// arcade driving physics, skid marks and crash sparks.

import { CFG, COLORS } from './config.js';
import { collideBuildings, clampToWorld } from './world.js';
import { isDown } from './input.js';

let carId = 0;

export function makeCar(x, y, angle, color, kind) {
  return {
    id: carId++,
    x, y, angle,
    speed: 0,
    color: color || '#d94f3d',
    kind: kind || 'traffic', // traffic | player | police | parked
    driver: kind === 'traffic' ? 'traffic' : 'parked',
    axis: 'x',
    dir: 1,
    road: y,
    hp: 100,
    dead: false,
    brakeLight: false,
  };
}

export function spawnTraffic(S, count) {
  const rng = S.rng;
  for (let i = 0; i < count; i++) {
    const vertical = rng.chance(0.5);
    let x;
    let y;
    let angle;
    if (vertical) {
      x = rng.pick(S.world.roadsX) + rng.range(-18, 18);
      y = rng.range(150, 1850);
      angle = rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2;
    } else {
      x = rng.range(150, 3050);
      y = rng.pick(S.world.roadsY) + rng.range(-18, 18);
      angle = rng.chance(0.5) ? 0 : Math.PI;
    }
    const car = makeCar(x, y, angle, rng.pick(COLORS.carPalette), 'traffic');
    car.speed = CFG.TRAFFIC_SPEED * rng.range(0.7, 1.1);
    car.axis = vertical ? 'y' : 'x';
    car.dir = Math.cos(angle) >= 0 ? 1 : -1;
    if (vertical) car.dir = Math.sin(angle) >= 0 ? 1 : -1;
    car.road = vertical ? x : y;
    S.cars.push(car);
  }
}

export function spawnParkedCars(S, count) {
  const rng = S.rng;
  for (let i = 0; i < count; i++) {
    const vertical = rng.chance(0.5);
    let x;
    let y;
    let angle;
    if (vertical) {
      x = rng.pick(S.world.roadsX) + 62;
      y = rng.range(200, 1800);
      angle = Math.PI / 2;
    } else {
      x = rng.range(200, 3000);
      y = rng.pick(S.world.roadsY) + 62;
      angle = 0;
    }
    const car = makeCar(x, y, angle, rng.pick(COLORS.carPalette), 'parked');
    car.driver = 'parked';
    S.cars.push(car);
  }
}

function turnAtIntersection(S, car, dt) {
  // At a crossing, sometimes switch road axis for believable traffic.
  const world = S.world;
  const nearX = world.roadsX.some((rx) => Math.abs(car.x - rx) < 12);
  const nearY = world.roadsY.some((ry) => Math.abs(car.y - ry) < 12);
  if (nearX && nearY && S.rng.chance(dt * 0.9)) {
    if (car.axis === 'x') {
      car.axis = 'y';
      car.road = car.x;
      car.dir = S.rng.chance(0.5) ? 1 : -1;
      car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      car.axis = 'x';
      car.road = car.y;
      car.dir = S.rng.chance(0.5) ? 1 : -1;
      car.angle = car.dir > 0 ? 0 : Math.PI;
    }
  }
}

export function updateVehicles(S, dt) {
  for (const car of S.cars) {
    if (car.dead) continue;
    if (car.driver === 'traffic') {
      // Slow down for the car ahead on the same road.
      let ahead = null;
      let aheadD = 120;
      for (const other of S.cars) {
        if (other === car || other.dead) continue;
        const d = Math.hypot(other.x - car.x, other.y - car.y);
        if (d < aheadD) {
          const ang = Math.atan2(other.y - car.y, other.x - car.x);
          let diff = Math.abs(ang - car.angle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < 0.6) { ahead = other; aheadD = d; }
        }
      }
      const target = ahead ? 0 : CFG.TRAFFIC_SPEED;
      car.speed += (target - car.speed) * Math.min(1, dt * 2);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      turnAtIntersection(S, car, dt);
      if (car.x < 120 || car.x > 3080 || car.y < 120 || car.y > 1900) {
        car.angle += Math.PI;
        car.dir *= -1;
      }
      clampToWorld(car, 40);
    } else if (car.driver === 'player') {
      updatePlayerCar(S, car, dt);
    }
  }
  // Remove burnt-out wrecks far from the player.
  S.cars = S.cars.filter((c) => !c.dead || Math.hypot(c.x - S.player.x, c.y - S.player.y) < 900);
}

export function updatePlayerCar(S, car, dt) {
  const input = S.input;
  const forward = isDown(input, 'w', 'arrowup');
  const back = isDown(input, 's', 'arrowdown');
  const left = isDown(input, 'a', 'arrowleft');
  const right = isDown(input, 'd', 'arrowright');
  if (forward) car.speed += CFG.CAR_ACCEL * dt;
  if (back) car.speed -= CFG.CAR_ACCEL * 0.8 * dt;
  if (!forward && !back) car.speed *= Math.pow(0.4, dt);
  car.speed = Math.max(-CFG.CAR_REVERSE_MAX, Math.min(CFG.CAR_MAX_SPEED, car.speed));
  car.brakeLight = back && car.speed > 20;
  const steer = (left ? -1 : 0) + (right ? 1 : 0);
  if (steer !== 0 && Math.abs(car.speed) > 20) {
    car.angle += steer * CFG.CAR_TURN * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 200);
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const probe = { x: nx, y: ny };
  if (collideBuildings(S.world, probe, 20)) {
    if (Math.abs(car.speed) > 260) {
      S.audio.crash();
      spawnSparks(S, car.x, car.y, 10);
      car.hp -= 12;
      if (car.hp <= 0) {
        car.dead = true;
        S.player.inCar = null;
        S.player.x = car.x + 40;
        S.player.y = car.y + 40;
        S.message = 'Mobilmu hancur! Keluar dan cari mobil lain.';
        S.msgT = 3;
      }
    }
    car.speed *= 0.35;
  } else {
    car.x = nx;
    car.y = ny;
  }
  clampToWorld(car, 30);
  if (steer !== 0 && Math.abs(car.speed) > 300) {
    S.skids.push({ x: car.x, y: car.y, angle: car.angle, life: 6 });
    if (S.skids.length > 220) S.skids.shift();
  }
  // Keep the player glued to the car.
  S.player.x = car.x;
  S.player.y = car.y;
  S.player.angle = car.angle;
  // Exiting the car (E/F) is handled by main.js before this runs.
}

export function spawnSparks(S, x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = S.rng.next() * Math.PI * 2;
    const sp = S.rng.range(60, 240);
    S.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: S.rng.range(0.2, 0.6),
      maxLife: 0.6,
      color: '#ffcf3d',
      size: 3,
    });
  }
}

export function damageCar(S, car, amount) {
  car.hp -= amount;
  spawnSparks(S, car.x, car.y, 6);
  if (car.hp <= 0 && !car.dead) {
    car.dead = true;
    spawnSparks(S, car.x, car.y, 24);
    S.audio.crash();
    if (car.driver === 'player') {
      S.player.inCar = null;
      S.player.x = car.x + 40;
      S.player.y = car.y;
    }
  }
}
