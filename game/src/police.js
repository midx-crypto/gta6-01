// Solara Nights — police.js
// Wanted level 0-5 and the Solara police response: patrol cars spawn, chase
// the player, ram the car, and bust Raka on foot when they catch him.

import { CFG, COLORS } from './config.js';
import { makeCar } from './vehicles.js';
import { collideBuildings, clampToWorld } from './world.js';

export function addWanted(S, amount) {
  S.wanted = Math.max(0, Math.min(CFG.WANTED_MAX, S.wanted + amount));
  S.wantedTimer = 0;
}

export function updatePolice(S, dt) {
  // Wanted slowly cools off when the player stays out of trouble.
  if (S.wanted > 0) {
    S.wantedTimer += dt;
    if (S.wantedTimer > 25) {
      S.wanted -= 1;
      S.wantedTimer = 0;
      S.message = 'Polisi kehilangan jejakmu. Wanted turun.';
      S.msgT = 2.5;
    }
  }
  if (S.wanted > 0) S.audio.siren(dt);

  // Spawn police cars up to the wanted level.
  const want = S.wanted;
  const current = S.cars.filter((c) => c.kind === 'police' && !c.dead).length;
  if (current < want && S.spawnTimer <= 0) {
    spawnPoliceCar(S);
    S.spawnTimer = 1.2;
  }
  S.spawnTimer -= dt;

  for (const car of S.cars) {
    if (car.kind !== 'police' || car.dead) continue;
    chasePlayer(S, car, dt);
  }

  // Busted: a police car catches Raka on foot.
  if (!S.player.inCar && S.wanted > 0) {
    let caught = false;
    for (const car of S.cars) {
      if (car.kind !== 'police' || car.dead) continue;
      const d = Math.hypot(car.x - S.player.x, car.y - S.player.y);
      if (d < 46) {
        caught = true;
        S.bustedT += dt;
        if (S.bustedT > 1.2) bustPlayer(S);
        break;
      }
    }
    // The catch timer only cools down when no police car is touching Raka.
    if (!caught && S.bustedT > 0) S.bustedT = Math.max(0, S.bustedT - dt * 0.4);
  } else {
    S.bustedT = 0;
  }
}

function spawnPoliceCar(S) {
  const p = S.player;
  const angle = S.rng.next() * Math.PI * 2;
  const dist = 700;
  let x = p.x + Math.cos(angle) * dist;
  let y = p.y + Math.sin(angle) * dist;
  x = Math.max(140, Math.min(3060, x));
  y = Math.max(140, Math.min(1960, y));
  const car = makeCar(x, y, Math.atan2(p.y - y, p.x - x), COLORS.policeCar, 'police');
  car.driver = 'police';
  car.speed = CFG.POLICE_SPEED * 0.7;
  S.cars.push(car);
}

function chasePlayer(S, car, dt) {
  const p = S.player;
  const targetAngle = Math.atan2(p.y - car.y, p.x - car.x);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
  car.speed += (CFG.POLICE_SPEED - car.speed) * Math.min(1, dt * 1.4);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const probe = { x: nx, y: ny };
  if (!collideBuildings(S.world, probe, 20)) {
    car.x = nx;
    car.y = ny;
  } else {
    car.speed *= 0.5;
    car.angle += 0.6 * dt * 10;
  }
  // Keep a little distance from other police cars so they do not pile up.
  for (const other of S.cars) {
    if (other === car || other.kind !== 'police' || other.dead) continue;
    const dx = car.x - other.x;
    const dy = car.y - other.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.01 && d < 70) {
      car.x += (dx / d) * 60 * dt;
      car.y += (dy / d) * 60 * dt;
    }
  }
  clampToWorld(car, 30);

  // Ram the player's car.
  if (p.inCar) {
    const d = Math.hypot(car.x - p.inCar.x, car.y - p.inCar.y);
    if (d < 44) {
      p.inCar.hp -= 22 * dt;
      car.speed *= 0.92;
      if (p.inCar.hp <= 0) {
        p.inCar.dead = true;
        p.inCar = null;
        p.x = car.x + 60;
        p.y = car.y + 60;
        S.message = 'Mobilmu dihancurkan polisi!';
        S.msgT = 3;
      }
    }
  }
}

export function bustPlayer(S) {
  S.state = 'busted';
  S.audio.busted();
  S.player.hp = Math.max(S.player.hp, 40);
}

export function wastePlayer(S) {
  S.state = 'wasted';
  S.audio.busted();
}
