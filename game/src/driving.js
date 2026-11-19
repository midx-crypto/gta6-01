// Driving: arcade car physics with acceleration, steering, nitro boost,
// handbrake, building collision, ramps and air-time detection.
import { CAR, WANTED_DECAY_SECONDS } from './config.js';
import { resolveCircleCollision } from './world.js';
import { isOnLand, isOnRoad } from './districts.js';
import { crashSound } from './audio.js';
import { carTopSpeed } from './vehicles.js';

export function updateDriving(state, input, dt) {
  const car = state.car;
  if (!car) return;
  const fwd = input.forward();
  const steer = input.strafe();
  const topSpeed = carTopSpeed(car);
  const offRoad = !isOnRoad(car.x, car.z);
  const gripTop = offRoad ? topSpeed * 0.62 : topSpeed;

  if (fwd > 0) car.speed += CAR.accel * dt * (car.speed < 0 ? 2.2 : 1);
  else if (fwd < 0) car.speed -= (car.speed > 0.5 ? CAR.brake : CAR.accel * 0.6) * dt;
  else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 9 * dt);
  if (input.brake()) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 26 * dt);

  const wantNitro = input.nitro() && state.nitro > 0 && car.speed > 8;
  state.nitroActive = wantNitro;
  if (wantNitro) {
    state.nitro = Math.max(0, state.nitro - CAR.nitroDrain * dt);
    car.speed += CAR.nitroBoost * dt;
  } else {
    state.nitro = Math.min(CAR.nitroMax, state.nitro + CAR.nitroRegen * dt);
  }

  car.speed = Math.max(-CAR.maxReverse, Math.min(gripTop + (wantNitro ? CAR.nitroBoost : 0), car.speed));
  const speedFactor = Math.min(1, Math.abs(car.speed) / 14);
  car.angle += steer * CAR.turn * speedFactor * dt * (car.speed >= 0 ? 1 : -1) * (fwd < 0 && car.speed > 0 ? -1 : 1);

  const prevX = car.x; const prevZ = car.z;
  car.x += Math.sin(car.angle) * car.speed * dt;
  car.z += Math.cos(car.angle) * car.speed * dt;
  const hit = resolveCircleCollision(state, car, 1.6);
  if (hit) {
    if (Math.abs(car.speed) > 12) crashSound(Math.abs(car.speed) / 20);
    car.speed *= 0.45;
  }
  if (!isOnLand(car.x, car.z)) { car.x = prevX; car.z = prevZ; car.speed *= 0.4; }

  // Ramps: launching off a ramp gives vertical velocity and air-time.
  for (const ramp of state.ramps || []) {
    const d = Math.hypot(car.x - ramp.x, car.z - ramp.z);
    if (d < 5 && car.speed > 16 && !state.airborne && car.y <= 0.01) {
      car.vy = 7 + car.speed * 0.12;
      state.airborne = true;
      state.airTime = 0;
    }
  }
  if (state.airborne) {
    car.vy -= 22 * dt;
    car.y = (car.y || 0) + car.vy * dt;
    state.airTime += dt;
    if (car.y <= 0) {
      car.y = 0; car.vy = 0;
      if (state.airTime > 0.55) {
        const score = Math.round(state.airTime * 100);
        state.airScore += score;
        state.stats.stunts += 1;
        const bonus = Math.round(state.airTime * 120);
        state.money += bonus;
        state.message = 'STUNT JUMP! +' + score + ' poin, +$' + bonus;
        state.messageTimer = 3;
      }
      state.airborne = false;
      state.airTime = 0;
    }
  }

  car.mesh.position.set(car.x, car.y || 0, car.z);
  car.mesh.rotation.y = car.angle;
  car.mesh.rotation.z = -steer * speedFactor * 0.06;
  car.mesh.rotation.x = state.airborne ? -0.12 : 0;
  for (const wheel of car.mesh.userData.wheels) wheel.rotation.x += car.speed * dt * 2;
  state.player.x = car.x; state.player.z = car.z; state.player.angle = car.angle;
  state.player.speed = Math.abs(car.speed);
  state.stats.distance += Math.abs(car.speed) * dt;
  return hit;
}

// Nitro flame state for the particle system: true while boosting.
export function isBoosting(state) { return state.nitroActive && state.car !== null; }
export function currentSpeedKmh(state) {
  if (state.car) return Math.round(Math.abs(state.car.speed) * 3.6);
  return Math.round((state.player.speed || 0) * 3.6);
}
