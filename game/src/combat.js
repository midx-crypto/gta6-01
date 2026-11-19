// Aruna Bay — combat: pistol shooting with mouse aim, enemies with health,
// a weapon pickup, muzzle flash and hit sparks. Shooting in public raises
// the wanted level.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeRng, pick } from './random.js';
import { makePersonMesh } from './pedestrians.js';
import { raiseWanted } from './police.js';

export function createCombatState() {
  return {
    enemies: [],
    pickup: null,
    cooldown: 0,
    lastShotAt: null,
    kills: 0,
  };
}

export function spawnEnemies(scene, combat, x, z, count, seed) {
  const rng = makeRng(seed);
  for (let i = 0; i < count; i++) {
    const mesh = makePersonMesh(rng);
    mesh.children[0].material.color.set(0x8a2a2a);
    mesh.children[4].material.color.set(0x8a2a2a);
    mesh.children[5].material.color.set(0x8a2a2a);
    const ex = x + (rng() - 0.5) * 20;
    const ez = z + (rng() - 0.5) * 20;
    mesh.position.set(ex, 0, ez);
    scene.add(mesh);
    combat.enemies.push({
      mesh, health: 100, yaw: 0, shootTimer: 1 + rng() * 2,
      speed: 3.2, walkPhase: rng() * 5, alive: true,
    });
  }
}

export function clearEnemies(scene, combat) {
  for (const e of combat.enemies) scene.remove(e.mesh);
  combat.enemies = [];
}

// Fire the pistol from the camera centre. Returns a shot record or null.
export function shoot(camera, player, combat, scene, raycaster, onShot) {
  if (combat.cooldown > 0 || player.ammo <= 0 || player.inCar) return null;
  combat.cooldown = 0.22;
  player.ammo -= 1;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const targets = combat.enemies.filter((e) => e.alive).map((e) => e.mesh);
  const hits = raycaster.intersectObjects(targets, true);
  let hitEnemy = null;
  let hitPoint = null;
  if (hits.length > 0) {
    hitPoint = hits[0].point.clone();
    // find which enemy owns the hit mesh
    let obj = hits[0].object;
    while (obj && !combat.enemies.some((e) => e.mesh === obj)) obj = obj.parent;
    hitEnemy = combat.enemies.find((e) => e.mesh === obj) || null;
    if (hitEnemy) {
      hitEnemy.health -= CONFIG.pistolDamage;
      if (hitEnemy.health <= 0) {
        hitEnemy.alive = false;
        hitEnemy.mesh.visible = false;
        combat.kills += 1;
      }
    }
  } else {
    hitPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(60));
  }
  combat.lastShotAt = player.pos.clone();
  if (onShot) onShot(hitPoint, !!hitEnemy);
  return { hitEnemy, hitPoint };
}

export function updateCombat(combat, dt, player, police, scene, onEnemyShot) {
  combat.cooldown = Math.max(0, combat.cooldown - dt);
  for (const e of combat.enemies) {
    if (!e.alive) continue;
    const dx = player.pos.x - e.mesh.position.x;
    const dz = player.pos.z - e.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 45) continue;
    e.yaw = Math.atan2(dx, dz);
    e.mesh.rotation.y = e.yaw;
    if (dist > 10) {
      const step = e.speed * dt;
      e.mesh.position.x += Math.sin(e.yaw) * step;
      e.mesh.position.z += Math.cos(e.yaw) * step;
      e.walkPhase += dt * 6;
      const swing = Math.sin(e.walkPhase) * 0.5;
      e.mesh.userData.legL.rotation.x = swing;
      e.mesh.userData.legR.rotation.x = -swing;
    } else {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.4 + Math.random() * 1.2;
        // enemy fires: 35% chance to hit
        if (Math.random() < 0.35 && onEnemyShot) onEnemyShot(e);
      }
    }
  }
}

// Count how many mission enemies are still alive.
export function aliveEnemies(combat) {
  return combat.enemies.filter((e) => e.alive).length;
}

// A floating ammo pickup: walk over it to refill.
export function spawnAmmoPickup(scene, x, z) {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.25, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 60 }),
  );
  group.add(box);
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.06, 0.6),
    new THREE.MeshBasicMaterial({ color: 0xffe14d }),
  );
  glow.position.y = 0.2;
  group.add(glow);
  group.position.set(x, 0.6, z);
  scene.add(group);
  return { mesh: group, taken: false };
}

export function updatePickup(combat, player, dt) {
  const p = combat.pickup;
  if (!p || p.taken) return;
  p.mesh.rotation.y += dt * 1.5;
  p.mesh.position.y = 0.6 + Math.sin(performance.now() * 0.003) * 0.15;
  const dx = player.pos.x - p.mesh.position.x;
  const dz = player.pos.z - p.mesh.position.z;
  if (Math.sqrt(dx * dx + dz * dz) < 2) {
    p.taken = true;
    p.mesh.visible = false;
    player.ammo = Math.min(240, player.ammo + 60);
  }
}
