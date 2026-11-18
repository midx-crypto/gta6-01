// Solara Nights — pedestrians.js
// Solara's residents: they stroll the sidewalks, cross at corners, flee
// from gunfire, and a few hostile guards appear during the final mission.

import { CFG } from './config.js';
import { collideBuildings, clampToWorld } from './world.js';

const SHIRT_COLORS = ['#e86a6a', '#6aa5e8', '#7fd07f', '#e8c86a', '#c98ae8', '#e8e8e8', '#8a6a4a'];

export function spawnPedestrians(S, count) {
  for (let i = 0; i < count; i++) {
    S.peds.push(makePed(S, false));
  }
}

export function makePed(S, hostile) {
  const rng = S.rng;
  const vertical = rng.chance(0.5);
  let x;
  let y;
  if (vertical) {
    x = rng.pick(S.world.roadsX) + rng.range(-70, 70);
    y = rng.range(150, 2050);
  } else {
    x = rng.range(150, 3050);
    y = rng.pick(S.world.roadsY) + rng.range(-70, 70);
  }
  return {
    x, y,
    angle: rng.next() * Math.PI * 2,
    speed: rng.range(45, 75),
    color: rng.pick(SHIRT_COLORS),
    hostile: !!hostile,
    hp: hostile ? 100 : 50,
    dead: false,
    fleeing: false,
    fleeT: 0,
    walkPhase: rng.next() * 6,
    targetX: x,
    targetY: y,
  };
}

export function spawnGuards(S, count, cx, cy) {
  for (let i = 0; i < count; i++) {
    const g = makePed(S, true);
    g.x = cx + S.rng.range(-120, 120);
    g.y = cy + S.rng.range(-120, 120);
    g.color = '#22242a';
    g.speed = 90;
    S.peds.push(g);
  }
}

export function updatePedestrians(S, dt) {
  for (const ped of S.peds) {
    if (ped.dead) continue;
    const p = S.player;
    const dPlayer = Math.hypot(ped.x - p.x, ped.y - p.y);
    if (ped.hostile) {
      // Guards hunt the player when close, otherwise patrol.
      if (dPlayer < 420) {
        ped.angle = Math.atan2(p.y - ped.y, p.x - ped.x);
        ped.x += Math.cos(ped.angle) * ped.speed * dt;
        ped.y += Math.sin(ped.angle) * ped.speed * dt;
        // Guard shoots back rarely.
        ped.shootT = (ped.shootT || 0) - dt;
        if (dPlayer < 320 && ped.shootT <= 0) {
          ped.shootT = 1.4;
          p.hp -= 8;
          S.particles.push({ x: ped.x, y: ped.y, vx: 0, vy: 0, life: 0.15, maxLife: 0.15, color: '#ffd23d', size: 4 });
          if (p.hp <= 0) S.state = 'wasted';
        }
      } else {
        wander(S, ped, dt);
      }
    } else if (ped.fleeing) {
      ped.fleeT -= dt;
      if (ped.fleeT <= 0) ped.fleeing = false;
      const away = Math.atan2(ped.y - p.y, ped.x - p.x);
      ped.angle = away;
      ped.x += Math.cos(away) * 150 * dt;
      ped.y += Math.sin(away) * 150 * dt;
    } else {
      wander(S, ped, dt);
    }
    ped.walkPhase += dt * 8;
    collideBuildings(S.world, ped, 12);
    clampToWorld(ped, 20);
  }
  // Fallen pedestrians fade out of the street; guards stay down as proof.
  S.peds = S.peds.filter((ped) => !ped.dead || ped.hostile);
}

function wander(S, ped, dt) {
  const d = Math.hypot(ped.targetX - ped.x, ped.targetY - ped.y);
  if (d < 12) {
    const world = S.world;
    if (S.rng.chance(0.5)) {
      ped.targetX = S.rng.pick(world.roadsX) + S.rng.range(-70, 70);
      ped.targetY = ped.y + S.rng.range(-300, 300);
    } else {
      ped.targetY = S.rng.pick(world.roadsY) + S.rng.range(-70, 70);
      ped.targetX = ped.x + S.rng.range(-300, 300);
    }
    ped.targetX = Math.max(120, Math.min(3080, ped.targetX));
    ped.targetY = Math.max(120, Math.min(2080, ped.targetY));
  }
  ped.angle = Math.atan2(ped.targetY - ped.y, ped.targetX - ped.x);
  ped.x += Math.cos(ped.angle) * ped.speed * dt;
  ped.y += Math.sin(ped.angle) * ped.speed * dt;
}

export function scareNearbyPeds(S, x, y, radius) {
  for (const ped of S.peds) {
    if (ped.dead || ped.hostile) continue;
    if (Math.hypot(ped.x - x, ped.y - y) < radius) {
      ped.fleeing = true;
      ped.fleeT = 3;
    }
  }
}
