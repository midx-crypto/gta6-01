// Districts and the street grid: the map data every system reads — roads,
// bridges, the causeway, spawn points and the five district rectangles.
import { DISTRICTS, AVENUES, STREETS, BRIDGES, CAUSEWAY, GARAGE_POS, SAFEHOUSE_POS, TAXI_STAND, RACE_START, RAMPS } from './config.js';

export const DISTRICT_LIST = DISTRICTS;
export const AVENUE_LIST = AVENUES;
export const STREET_LIST = STREETS;
export const BRIDGE_LIST = BRIDGES;
export const CAUSEWAY_SPAN = CAUSEWAY;
export const GARAGE_SPOT = GARAGE_POS;
export const SAFEHOUSE_SPOT = SAFEHOUSE_POS;
export const TAXI_SPOT = TAXI_STAND;
export const RACE_SPOT = RACE_START;
export const RAMP_LIST = RAMPS;

export function districtNameAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d.name;
  }
  if (z > -240 && z < -200) return 'Jembatan Bara';
  return 'Laut Bara';
}

export function isOnLand(x, z) {
  if (x >= -260 && x <= 260 && z >= -200 && z <= 220) return true;
  if (x >= -160 && x <= 160 && z >= -420 && z <= -240) return true;
  for (const b of BRIDGES) if (Math.abs(x - b.x) <= 8 && z >= -240 && z <= -200) return true;
  if (Math.abs(x - CAUSEWAY.x) <= 5 && z >= -240 && z <= -200) return true;
  return false;
}

export function isOnRoad(x, z) {
  const onAvenue = AVENUES.some((ax) => Math.abs(x - ax) <= 6);
  const onStreet = STREETS.some((sz) => Math.abs(z - sz) <= 6);
  const northRing = z >= -420 && z <= -240 && (Math.abs(x + 80) <= 6 || Math.abs(x - 80) <= 6 || Math.abs(z + 330) <= 6);
  const bridge = BRIDGES.some((b) => Math.abs(x - b.x) <= 7 && z >= -245 && z <= -195);
  return (onAvenue && z >= -200 && z <= 220) || (onStreet && x >= -260 && x <= 260) || northRing || bridge;
}

export function nearestRoadPoint(x, z) {
  let best = null; let bestD = Infinity;
  const candidates = [];
  for (const ax of AVENUES) candidates.push([ax, Math.max(-195, Math.min(215, z))]);
  for (const sz of STREETS) candidates.push([Math.max(-255, Math.min(255, x)), sz]);
  candidates.push([-80, Math.max(-415, Math.min(-245, z))]);
  candidates.push([80, Math.max(-415, Math.min(-245, z))]);
  for (const [cx, cz] of candidates) {
    const d = Math.hypot(cx - x, cz - z);
    if (d < bestD) { bestD = d; best = { x: cx, z: cz }; }
  }
  return best;
}

export const SPAWNS = {
  start: { x: -180, z: 120, angle: Math.PI / 2 },
  garage: { x: -182, z: 132, angle: 0 },
  menara: { x: 20, z: -100, angle: 0 },
  pantai: { x: -80, z: -330, angle: Math.PI },
  bukit: { x: 90, z: -330, angle: Math.PI },
  pelabuhan: { x: 200, z: 40, angle: Math.PI / 2 },
};

// Landmark positions used by missions, jobs and collectibles.
export const LANDMARKS = {
  garage: { x: -190, z: 140, label: 'Garasi Pak Hendra' },
  safehouse: { x: -228, z: 188, label: 'Safehouse Mira' },
  balaiKota: { x: 20, z: -100, label: 'Balai Kota Bara' },
  bankBara: { x: 80, z: -60, label: 'Bank Bara' },
  dermaga: { x: 235, z: 100, label: 'Dermaga 7' },
  gudang: { x: 210, z: -40, label: 'Gudang Pelabuhan' },
  boardwalk: { x: -80, z: -300, label: 'Boardwalk Pantai' },
  resort: { x: -120, z: -360, label: 'Resort Ombak' },
  viewpoint: { x: 90, z: -380, label: 'Viewpoint Bukit' },
  pasarMalam: { x: -160, z: 40, label: 'Pasar Malam' },
  menaraPlaza: { x: 60, z: -120, label: 'Plaza Menara' },
  kafeSenja: { x: -100, z: -20, label: 'Kafe Senja' },
};
export function landmark(id) { return LANDMARKS[id]; }
