// Combat: shooting from the camera aim, enemy gunmen who shoot back, and
// the ammo pickups they sometimes drop.
import * as THREE from 'three';
import { makePedMesh } from './pedestrians.js';
import { gunshotSound } from './audio.js';
import { panicPedestrians } from './pedestrians.js';

export function spawnEnemy(state, x, z, hp) {
  const mesh = makePedMesh(0x1a1a1a, 0x8a5a3a);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.35), new THREE.MeshLambertMaterial({ color: 0x3a3a3a }));
  vest.position.y = 1.05;
  mesh.add(vest);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), new THREE.MeshLambertMaterial({ color: 0x181818 }));
  gun.position.set(0.4, 1.1, 0.4);
  mesh.add(gun);
  mesh.position.set(x, 0, z);
  state.scene.add(mesh);
  const enemy = { mesh, x, z, angle: 0, hp: hp || 100, shootTimer: 1 + Math.random(), alive: true, speed: 4 };
  state.enemies.push(enemy);
  return enemy;
}

export function updateEnemies(state, dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dx = state.player.x - enemy.x;
    const dz = state.player.z - enemy.z;
    const d = Math.hypot(dx, dz);
    enemy.angle = Math.atan2(dx, dz);
    enemy.mesh.rotation.y = enemy.angle;
    if (d > 26) {
      enemy.x += Math.sin(enemy.angle) * enemy.speed * dt;
      enemy.z += Math.cos(enemy.angle) * enemy.speed * dt;
    } else if (d < 10) {
      enemy.x -= Math.sin(enemy.angle) * enemy.speed * 0.5 * dt;
      enemy.z -= Math.cos(enemy.angle) * enemy.speed * 0.5 * dt;
    }
    enemy.mesh.position.set(enemy.x, 0, enemy.z);
    enemy.shootTimer -= dt;
    if (d < 30 && enemy.shootTimer <= 0) {
      enemy.shootTimer = 1.4 + Math.random() * 0.8;
      if (Math.random() < 0.55) {
        state.health -= 4;
        state.message = 'Kamu tertembak!';
        state.messageTimer = 1.2;
        if (state.health <= 0) state.mode = 'wasted';
      }
    }
  }
  state.enemies = state.enemies.filter((e) => e.alive);
}

function nearestTargetInCone(state, origin, dir, maxRange, maxCos) {
  let best = null; let bestD = maxRange;
  const targets = [];
  for (const e of state.enemies) if (e.alive) targets.push({ x: e.x, z: e.z, ref: e, kind: 'enemy' });
  for (const c of state.cops) targets.push({ x: c.x, z: c.z, ref: c, kind: 'cop' });
  for (const car of state.policeCars) targets.push({ x: car.x, z: car.z, ref: car, kind: 'policecar' });
  for (const t of targets) {
    const dx = t.x - origin.x;
    const dz = t.z - origin.z;
    const d = Math.hypot(dx, dz);
    if (d > maxRange || d < 0.5) continue;
    const cos = (dx * dir.x + dz * dir.z) / d;
    if (cos < maxCos) continue;
    if (d < bestD) { bestD = d; best = { ...t, dist: d }; }
  }
  return best;
}

export function fireWeapon(state, camera) {
  const w = state.weapons[state.currentWeapon];
  if (!w || state.weaponCooldown > 0) return null;
  if (w.ammo <= 0) {
    state.message = 'Amunisi habis! Tekan R untuk isi ulang.';
    state.messageTimer = 1.5;
    state.weaponCooldown = 0.3;
    return null;
  }
  w.ammo -= 1;
  state.weaponCooldown = w.rate;
  state.stats.shots += 1;
  gunshotSound(state.currentWeapon);
  const origin = { x: state.player.x, z: state.player.z };
  const dir = { x: Math.sin(state.player.angle), z: Math.cos(state.player.angle) };
  const shots = state.currentWeapon === 'shotgun' ? 5 : 1;
  let hitAny = null;
  for (let i = 0; i < shots; i += 1) {
    const spread = (Math.random() - 0.5) * w.spread * 2;
    const d2 = { x: dir.x + Math.cos(state.player.angle) * spread, z: dir.z - Math.sin(state.player.angle) * spread };
    const hit = nearestTargetInCone(state, origin, d2, w.range, 0.92);
    if (hit) {
      hitAny = hit;
      state.stats.hits += 1;
      if (hit.kind === 'enemy') {
        hit.ref.hp -= w.damage;
        if (hit.ref.hp <= 0) {
          hit.ref.alive = false;
          state.scene.remove(hit.ref.mesh);
          state.stats.kills += 1;
          state.money += 20;
          state.respect += 2;
          if (Math.random() < 0.4) {
            state.weapons[state.currentWeapon].reserve += 12;
            state.message = '+$20, +2 respect, +12 amunisi';
            state.messageTimer = 2;
          }
        }
      } else if (hit.kind === 'cop') {
        state.scene.remove(hit.ref.mesh);
        state.cops = state.cops.filter((c) => c !== hit.ref);
        state.wanted = Math.min(5, state.wanted + 1);
        state.stats.kills += 1;
      } else if (hit.kind === 'policecar') {
        hit.ref.speed *= 0.5;
        state.wanted = Math.min(5, state.wanted + 1);
      }
    }
  }
  panicPedestrians(state, origin.x, origin.z, 30);
  if (!state.player.onFoot) state.wanted = Math.min(5, state.wanted);
  return hitAny;
}

// Ammo drops and enemy cleanup helpers.
export function clearEnemies(state) {
  for (const e of state.enemies) state.scene.remove(e.mesh);
  state.enemies = [];
}
export function enemiesAlive(state) {
  return state.enemies.filter((e) => e.alive).length;
}
