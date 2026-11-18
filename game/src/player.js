// Solara Nights — player.js
// Raka on foot: movement, health, money, ammo and the steal/enter-car action.

import { CFG } from './config.js';
import { collideBuildings, clampToWorld } from './world.js';
import { isDown, wasPressed } from './input.js';

export function createPlayer(x, y) {
  return {
    x, y,
    angle: -Math.PI / 2,
    hp: CFG.PLAYER_HP,
    money: 0,
    ammo: CFG.PISTOL_MAG,
    reserveAmmo: 48,
    inCar: null,
    speed: 0,
    walkPhase: 0,
  };
}

export function updatePlayerOnFoot(S, dt) {
  const p = S.player;
  const input = S.input;
  let mx = 0;
  let my = 0;
  if (isDown(input, 'w', 'arrowup')) my -= 1;
  if (isDown(input, 's', 'arrowdown')) my += 1;
  if (isDown(input, 'a', 'arrowleft')) mx -= 1;
  if (isDown(input, 'd', 'arrowright')) mx += 1;
  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
    p.x += mx * CFG.PLAYER_SPEED * dt;
    p.y += my * CFG.PLAYER_SPEED * dt;
    p.angle = Math.atan2(my, mx);
    p.walkPhase += dt * 10;
    p.speed = CFG.PLAYER_SPEED;
  } else {
    p.speed = 0;
  }
  collideBuildings(S.world, p, 14);
  clampToWorld(p, 20);

  // Aim with the mouse (screen space -> world space).
  const wx = S.cam.x + input.mouseX;
  const wy = S.cam.y + input.mouseY;
  p.aimAngle = Math.atan2(wy - p.y, wx - p.x);

  // E: steal / enter the nearest car.
  if (wasPressed(input, 'e')) {
    const car = nearestCar(S, p.x, p.y, 70);
    if (car) stealCar(S, car);
  }
  // F also exits/enters for convenience.
  if (wasPressed(input, 'f') && p.inCar) exitCar(S);
}

export function nearestCar(S, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const car of S.cars) {
    if (car.dead) continue;
    const d = Math.hypot(car.x - x, car.y - y);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

export function stealCar(S, car) {
  const p = S.player;
  if (car.kind === 'police') {
    S.wanted = Math.min(CFG.WANTED_MAX, S.wanted + 1);
    S.message = 'Mencuri mobil polisi! Wanted naik!';
    S.msgT = 3;
  } else if (car.kind === 'traffic') {
    S.wanted = Math.min(CFG.WANTED_MAX, S.wanted + 1);
    S.message = 'Mobil dicuri! Warga melapor ke polisi.';
    S.msgT = 3;
    S.audio.pickup();
  }
  car.kind = 'player';
  car.driver = 'player';
  p.inCar = car;
  p.x = car.x;
  p.y = car.y;
}

export function exitCar(S) {
  const p = S.player;
  const car = p.inCar;
  if (!car) return;
  p.inCar = null;
  car.driver = 'parked';
  // Step out to the side of the car.
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  car.speed = 0;
  collideBuildings(S.world, p, 14);
}

// Mission cash: adds money and flashes a short message.
export function giveCash(S, amount, reason) {
  S.player.money += amount;
  S.message = `+$${amount} — ${reason}`;
  S.msgT = 2.5;
  S.audio.pickup();
}
