// Solara Nights — world.js
// Procedural generation of Kota Solara: a road grid, city blocks full of
// buildings, a central park, and a sandy beach with sea along the south edge.

import { CFG, COLORS } from './config.js';

export function generateCity(rng) {
  const roadsX = [];
  const roadsY = [];
  for (let x = 200; x <= 3000; x += 400) roadsX.push(x);
  for (let y = 200; y <= 1800; y += 400) roadsY.push(y);

  const buildings = [];
  const trees = [];
  // One or two buildings per city block, kept off the roads and the park.
  for (let ix = 0; ix < roadsX.length - 1; ix++) {
    for (let iy = 0; iy < roadsY.length - 1; iy++) {
      const bx = roadsX[ix] + 70;
      const by = roadsY[iy] + 70;
      const bw = 400 - 140;
      const bh = 400 - 140;
      const parkHere = bx < 1700 && bx + bw > 1200 && by < 1650 && by + bh > 1200;
      if (parkHere) continue;
      if (rng.chance(0.72)) {
        buildings.push({
          x: bx + rng.range(0, 40),
          y: by + rng.range(0, 40),
          w: bw - rng.range(0, 80),
          h: bh - rng.range(0, 80),
          color: rng.pick(COLORS.buildingRoof),
        });
      } else {
        buildings.push({
          x: bx + 10, y: by + 10, w: 120, h: 110,
          color: rng.pick(COLORS.buildingRoof),
        });
        buildings.push({
          x: bx + 150, y: by + 130, w: 110, h: 120,
          color: rng.pick(COLORS.buildingRoof),
        });
      }
    }
  }

  // Park trees in Taman Mentari.
  for (let i = 0; i < 26; i++) {
    trees.push({ x: rng.range(1230, 1680), y: rng.range(1230, 1620), r: rng.range(10, 18) });
  }
  // Palm trees along the beach.
  for (let i = 0; i < 30; i++) {
    trees.push({ x: rng.range(120, 3080), y: rng.range(2130, 2210), r: rng.range(9, 15), palm: true });
  }

  return {
    roadsX,
    roadsY,
    buildings,
    trees,
    beachY: 2120,
    waterY: 2300,
    park: { x: 1200, y: 1200, w: 500, h: 450 },
  };
}

export function isOnRoad(world, x, y) {
  const half = CFG.ROAD_W / 2;
  for (const rx of world.roadsX) if (Math.abs(x - rx) < half) return true;
  for (const ry of world.roadsY) if (Math.abs(y - ry) < half) return true;
  return false;
}

// Push a circle out of every building it overlaps. Returns true on a hit.
export function collideBuildings(world, body, r) {
  let hit = false;
  for (const b of world.buildings) {
    const cx = Math.max(b.x, Math.min(body.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(body.y, b.y + b.h));
    const dx = body.x - cx;
    const dy = body.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 0.001) {
        const d = Math.sqrt(d2);
        body.x = cx + (dx / d) * r;
        body.y = cy + (dy / d) * r;
      } else {
        body.y = b.y - r;
      }
    }
  }
  return hit;
}

export function clampToWorld(body, margin) {
  body.x = Math.max(margin, Math.min(CFG.WORLD_W - margin, body.x));
  body.y = Math.max(margin, Math.min(CFG.WORLD_H - margin, body.y));
}

export function nearestRoadPoint(world, x, y) {
  // The closest road-centre crossing to a point: used for spawning traffic
  // and for placing the player on a street instead of inside a building.
  let bestX = world.roadsX[0];
  let bestY = world.roadsY[0];
  for (const rx of world.roadsX) if (Math.abs(x - rx) < Math.abs(x - bestX)) bestX = rx;
  for (const ry of world.roadsY) if (Math.abs(y - ry) < Math.abs(y - bestY)) bestY = ry;
  return { x: bestX, y: bestY };
}
