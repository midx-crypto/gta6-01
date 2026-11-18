// Solara Nights — render.js
// All drawing of the world: sun-soaked streets, buildings, park, beach and
// sea, then cars, people, bullets, particles and skid marks, under a camera
// that follows Raka.

import { CFG, COLORS } from './config.js';
import { missionObjective } from './missions.js';

export function drawWorld(S, ctx, w, h) {
  const cam = S.cam;
  ctx.save();
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  // Ground: grass, park, beach sand and sea.
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(cam.x - 20, cam.y - 20, w + 40, h + 40);
  const world = S.world;
  ctx.fillStyle = COLORS.park;
  ctx.fillRect(world.park.x, world.park.y, world.park.w, world.park.h);
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(0, world.beachY, CFG.WORLD_W, CFG.WORLD_H - world.beachY);
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(0, world.waterY, CFG.WORLD_W, CFG.WORLD_H - world.waterY);
  ctx.fillStyle = COLORS.waterDeep;
  for (let i = 0; i < 12; i++) {
    const wx = ((i * 277 + S.time * 12) % CFG.WORLD_W);
    ctx.fillRect(wx, world.waterY + 30 + (i % 4) * 18, 90, 3);
  }

  drawRoads(S, ctx);
  drawBuildings(S, ctx);
  drawTrees(S, ctx);
  drawObjectiveMarker(S, ctx);
  drawSkids(S, ctx);
  drawCars(S, ctx);
  drawPeds(S, ctx);
  drawPlayer(S, ctx);
  drawBullets(S, ctx);
  drawParticles(S, ctx);

  // Day glow: warm sun-soaked light over everything.
  const glow = ctx.createRadialGradient(
    S.player.x, S.player.y, 100,
    S.player.x, S.player.y, 900,
  );
  glow.addColorStop(0, 'rgba(255, 220, 130, 0.05)');
  glow.addColorStop(1, 'rgba(255, 160, 60, 0.10)');
  ctx.fillStyle = glow;
  ctx.fillRect(cam.x - 20, cam.y - 20, w + 40, h + 40);

  ctx.restore();
}

function drawRoads(S, ctx) {
  const world = S.world;
  const half = CFG.ROAD_W / 2;
  ctx.fillStyle = COLORS.sidewalk;
  for (const rx of world.roadsX) ctx.fillRect(rx - half - 10, 0, CFG.ROAD_W + 20, 2100);
  for (const ry of world.roadsY) ctx.fillRect(0, ry - half - 10, CFG.WORLD_W, CFG.ROAD_W + 20);
  ctx.fillStyle = COLORS.road;
  for (const rx of world.roadsX) ctx.fillRect(rx - half, 0, CFG.ROAD_W, 2100);
  for (const ry of world.roadsY) ctx.fillRect(0, ry - half, CFG.WORLD_W, CFG.ROAD_W);
  // Centre lane dashes.
  ctx.fillStyle = COLORS.lane;
  for (const rx of world.roadsX) {
    for (let y = 0; y < 2100; y += 56) ctx.fillRect(rx - 2, y, 4, 28);
  }
  for (const ry of world.roadsY) {
    for (let x = 0; x < CFG.WORLD_W; x += 56) ctx.fillRect(x, ry - 2, 28, 4);
  }
  // Crosswalk stripes at every intersection.
  ctx.fillStyle = 'rgba(240, 240, 230, 0.75)';
  for (const rx of world.roadsX) {
    for (const ry of world.roadsY) {
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(rx + i * 12 - 4, ry - half + 8, 8, 14);
        ctx.fillRect(rx + i * 12 - 4, ry + half - 22, 8, 14);
      }
    }
  }
}

function drawBuildings(S, ctx) {
  for (const b of S.world.buildings) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, 8);
    // Windows.
    ctx.fillStyle = 'rgba(20, 30, 50, 0.55)';
    const cols = Math.max(1, Math.floor(b.w / 34));
    const rows = Math.max(1, Math.floor(b.h / 34));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        ctx.fillRect(b.x + 10 + i * 34, b.y + 12 + j * 34, 16, 12);
      }
    }
  }
}

function drawTrees(S, ctx) {
  for (const t of S.world.trees) {
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(t.x - 2, t.y - 2, 4, 8);
    ctx.fillStyle = t.palm ? '#3f9e4d' : '#2f7d3a';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 4, t.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObjectiveMarker(S, ctx) {
  const obj = missionObjective(S);
  if (!obj || S.state !== 'play') return;
  const pulse = 1 + 0.18 * Math.sin(S.time * 4);
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.strokeStyle = '#ffd23d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 210, 61, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Beacon column.
  ctx.fillStyle = 'rgba(255, 210, 61, 0.18)';
  ctx.fillRect(-14, -220, 28, 220);
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(obj.label, 0, -46);
  ctx.restore();
}

function drawSkids(S, ctx) {
  ctx.strokeStyle = 'rgba(20, 20, 24, 0.45)';
  ctx.lineWidth = 5;
  for (const s of S.skids) {
    ctx.beginPath();
    ctx.moveTo(s.x - Math.cos(s.angle) * 14, s.y - Math.sin(s.angle) * 14);
    ctx.lineTo(s.x + Math.cos(s.angle) * 14, s.y + Math.sin(s.angle) * 14);
    ctx.stroke();
  }
}

function drawCars(S, ctx) {
  for (const car of S.cars) {
    if (car.dead) {
      // Burnt wreck.
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = '#1a1a1c';
      ctx.fillRect(-24, -12, 48, 24);
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-22, -10, 48, 26);
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.arc(-20, -11, 5, 0, Math.PI * 2);
    ctx.arc(20, -11, 5, 0, Math.PI * 2);
    ctx.arc(-20, 11, 5, 0, Math.PI * 2);
    ctx.arc(20, 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-24, -12, 48, 24);
    ctx.fillStyle = 'rgba(180, 220, 255, 0.85)';
    ctx.fillRect(-4, -10, 12, 20);
    ctx.fillStyle = 'rgba(20, 30, 50, 0.8)';
    ctx.fillRect(12, -10, 8, 20);
    // Headlights.
    ctx.fillStyle = '#ffe9a3';
    ctx.fillRect(23, -9, 3, 5);
    ctx.fillRect(23, 4, 3, 5);
    if (car.brakeLight) {
      ctx.fillStyle = '#ff2d2d';
      ctx.fillRect(-25, -9, 3, 5);
      ctx.fillRect(-25, 4, 3, 5);
    }
    if (car.kind === 'police') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POLISI', 0, 3);
      // Flashing light bar.
      const on = Math.floor(S.time * 6) % 2 === 0;
      ctx.fillStyle = on ? '#ff2d2d' : '#2d7dff';
      ctx.fillRect(-8, -15, 7, 5);
      ctx.fillStyle = on ? '#2d7dff' : '#ff2d2d';
      ctx.fillRect(1, -15, 7, 5);
    }
    if (car.kind === 'player') {
      ctx.strokeStyle = '#ffd23d';
      ctx.lineWidth = 2;
      ctx.strokeRect(-26, -14, 52, 28);
    }
    ctx.restore();
  }
}

function drawPeds(S, ctx) {
  for (const ped of S.peds) {
    if (ped.dead) continue;
    ctx.save();
    ctx.translate(ped.x, ped.y);
    const bob = Math.sin(ped.walkPhase) * 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body and head.
    ctx.fillStyle = ped.color;
    ctx.beginPath();
    ctx.arc(0, bob * 0.4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(Math.cos(ped.angle) * 3, Math.sin(ped.angle) * 3 + bob * 0.4, 5, 0, Math.PI * 2);
    ctx.fill();
    if (ped.hostile) {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -14);
    }
    ctx.restore();
  }
}

function drawPlayer(S, ctx) {
  const p = S.player;
  if (p.inCar) return; // The car drawing shows Raka's car.
  ctx.save();
  ctx.translate(p.x, p.y);
  const bob = p.speed > 0 ? Math.sin(p.walkPhase) * 2 : 0;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(p.aimAngle || p.angle);
  // Pistol arm.
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();
  ctx.rotate(-(p.aimAngle || p.angle));
  // Raka: bright yellow jacket with a white ring so he reads at a glance.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, bob * 0.3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, bob * 0.3, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(0, bob * 0.3 - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullets(S, ctx) {
  ctx.fillStyle = '#ffe9a3';
  for (const b of S.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(S, ctx) {
  for (const pt of S.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
