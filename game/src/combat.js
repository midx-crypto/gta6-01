// Solara Nights — combat.js
// Shooting: mouse aim, click to fire the pistol, bullets, reloads, hits on
// pedestrians, guards and cars, and the wanted heat that follows.

import { CFG } from './config.js';
import { addWanted } from './police.js';
import { damageCar, spawnSparks } from './vehicles.js';
import { scareNearbyPeds } from './pedestrians.js';
import { wasPressed } from './input.js';

export function updateCombat(S, dt) {
  const p = S.player;
  const input = S.input;
  if (S.state !== 'play') return;

  // Aim from the player toward the mouse in world space.
  const wx = S.cam.x + input.mouseX;
  const wy = S.cam.y + input.mouseY;
  const aim = Math.atan2(wy - p.y, wx - p.x);
  p.aimAngle = aim;

  // R reloads from the reserve.
  if (wasPressed(input, 'r')) reload(S);

  // Click (or hold) to shoot, on foot or leaning out of the car.
  S.shootCooldown -= dt;
  if (input.mouseDown && S.shootCooldown <= 0) {
    if (p.ammo > 0) {
      fireBullet(S, aim);
    } else if (p.reserveAmmo > 0) {
      reload(S);
    } else {
      S.shootCooldown = 0.3;
    }
  }

  // Move bullets and test hits.
  for (const b of S.bullets) {
    b.x += Math.cos(b.angle) * CFG.BULLET_SPEED * dt;
    b.y += Math.sin(b.angle) * CFG.BULLET_SPEED * dt;
    b.life -= dt;
    // Hit a pedestrian or guard.
    for (const ped of S.peds) {
      if (ped.dead) continue;
      if (Math.hypot(ped.x - b.x, ped.y - b.y) < 14) {
        ped.hp -= CFG.PISTOL_DAMAGE;
        b.life = 0;
        spawnSparks(S, b.x, b.y, 5);
        if (ped.hp <= 0) {
          ped.dead = true;
          if (ped.hostile) {
            S.missionKills += 1;
            S.message = `Penjaga dilumpuhkan! ${S.missionKills}/3`;
            S.msgT = 2;
          } else {
            addWanted(S, 1);
          }
        } else if (!ped.hostile) {
          ped.fleeing = true;
          ped.fleeT = 4;
        }
        break;
      }
    }
    if (b.life <= 0) continue;
    // Hit a car (not the player's own).
    for (const car of S.cars) {
      if (car.dead) continue;
      if (p.inCar === car) continue;
      const dx = Math.cos(car.angle);
      const dy = Math.sin(car.angle);
      const lx = b.x - car.x;
      const ly = b.y - car.y;
      const along = lx * dx + ly * dy;
      const across = Math.abs(lx * -dy + ly * dx);
      if (Math.abs(along) < 26 && across < 14) {
        damageCar(S, car, CFG.PISTOL_DAMAGE);
        b.life = 0;
        if (car.kind === 'police') addWanted(S, 1);
        break;
      }
    }
  }
  S.bullets = S.bullets.filter((b) => b.life > 0);
}

function fireBullet(S, angle) {
  const p = S.player;
  p.ammo -= 1;
  S.shootCooldown = 0.22;
  const ox = p.x + Math.cos(angle) * 22;
  const oy = p.y + Math.sin(angle) * 22;
  S.bullets.push({ x: ox, y: oy, angle, life: 1.1 });
  S.audio.shot();
  scareNearbyPeds(S, p.x, p.y, 320);
  // Muzzle flash particle plus a short tracer streak.
  S.particles.push({ x: ox, y: oy, vx: 0, vy: 0, life: 0.07, maxLife: 0.07, color: '#ffe9a3', size: 7 });
  S.particles.push({ x: ox + Math.cos(angle) * 12, y: oy + Math.sin(angle) * 12, vx: 0, vy: 0, life: 0.05, maxLife: 0.05, color: '#fff', size: 3 });
  // Firing in public draws the police.
  if (S.wanted < 1) addWanted(S, 1);
}

function reload(S) {
  const p = S.player;
  if (p.ammo >= CFG.PISTOL_MAG || p.reserveAmmo <= 0) return;
  const need = CFG.PISTOL_MAG - p.ammo;
  const take = Math.min(need, p.reserveAmmo);
  p.ammo += take;
  p.reserveAmmo -= take;
  S.audio.click();
  S.message = 'Pistol diisi ulang.';
  S.msgT = 1.5;
}
