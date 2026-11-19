// Pulau Bara — tuning numbers, palette, districts and story constants.
// Golden-hour volcanic island: two islands joined by two bridges and a causeway.
export const STEP = 1 / 60;
export const SAVE_KEY = 'pulau-bara.save.v1';

export const WORLD = { minX: -260, maxX: 260, minZ: -420, maxZ: 220, waterY: -0.6 };

export const DISTRICTS = [
  { id: 'kotalama', name: 'Kota Lama', x0: -260, z0: -60, x1: -60, z1: 220, color: '#c98a4b', minH: 8, maxH: 22 },
  { id: 'menara', name: 'Menara', x0: -60, z0: -200, x1: 140, z1: -20, color: '#4b7ac9', minH: 38, maxH: 92 },
  { id: 'pelabuhan', name: 'Pelabuhan', x0: 140, z0: -200, x1: 260, z1: 220, color: '#8a7a4b', minH: 10, maxH: 26 },
  { id: 'pantai', name: 'Pantai', x0: -160, z0: -420, x1: 0, z1: -240, color: '#e8c96a', minH: 6, maxH: 16 },
  { id: 'bukit', name: 'Bukit', x0: 0, z0: -420, x1: 160, z1: -240, color: '#5a9e5a', minH: 8, maxH: 20 },
];

export const PALETTE = {
  sky: 0xffd9a0, sun: 0xffe9b8, fog: 0xf2c98f, sea: 0x2e7f9e,
  ground: 0x9a8a6a, sand: 0xe8d194, road: 0x3a3a40, roadLine: 0xf2e6a0,
  grass: 0x6a9e4a, hill: 0x7a8a4a, buildingGlass: 0x8fc4e8,
};

export const AVENUES = [-200, -120, -40, 40, 120, 200];
export const STREETS = [-160, -80, 0, 80, 160];
export const BRIDGES = [{ x: -120 }, { x: 120 }];
export const CAUSEWAY = { x: 0, z0: -240, z1: -200, width: 10 };

export const PLAYER = { walkSpeed: 9, runSpeed: 14, radius: 0.7, health: 100 };
export const CAR = {
  accel: 24, brake: 36, maxSpeed: 46, maxReverse: 12, turn: 2.0,
  nitroBoost: 28, nitroDrain: 32, nitroRegen: 7, nitroMax: 100,
};
export const WANTED_DECAY_SECONDS = 9;
export const RESPECT_RANKS = [
  { name: 'Pemula', min: 0 },
  { name: 'Jalanan', min: 150 },
  { name: 'Legenda', min: 500 },
];

export const GARAGE_POS = { x: -190, z: 140 };
export const SAFEHOUSE_POS = { x: -228, z: 188 };
export const TAXI_STAND = { x: 20, z: -120 };
export const RACE_START = { x: -90, z: -300 };
export const RAMPS = [
  { x: 90, z: -330, angle: Math.PI, name: 'Lompat Bukit' },
  { x: -70, z: -310, angle: Math.PI / 2, name: 'Lompat Boardwalk' },
  { x: 205, z: 60, angle: -Math.PI / 2, name: 'Lompat Kontainer' },
];

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist2d(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }
export function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d;
  }
  return null;
}
export function respectRank(points) {
  let rank = RESPECT_RANKS[0];
  for (const r of RESPECT_RANKS) if (points >= r.min) rank = r;
  return rank;
}

// Mission tuning shared by missions.js and the HUD.
export const MISSION_MONEY = { easy: 150, medium: 300, hard: 600, finale: 1500 };
export const MISSION_RESPECT = { easy: 25, medium: 50, hard: 90, finale: 200 };
export const JOB_PAY = { taxi: 80, delivery: 60 };
export const COIN_VALUE = 25;
export const STUNT_MONEY_PER_SECOND = 120;
export function wantedStars(wanted) { return '★'.repeat(wanted) + '☆'.repeat(5 - wanted); }
export function formatMoney(amount) { return '$' + Math.round(amount).toLocaleString('en-US'); }
