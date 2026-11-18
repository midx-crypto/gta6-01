// Solara Nights — config.js
// Single source of truth for tuning, names, colours and story data.
// Everything here is original: the city of Solara, its people and its story
// belong to this game only and borrow nothing from any commercial title.

export const CFG = {
  WORLD_W: 3200,
  WORLD_H: 2400,
  ROAD_W: 92,
  BLOCK: 400,
  PLAYER_SPEED: 235,
  PLAYER_HP: 100,
  CAR_ACCEL: 420,
  CAR_MAX_SPEED: 520,
  CAR_REVERSE_MAX: 180,
  CAR_TURN: 2.6,
  TRAFFIC_SPEED: 150,
  POLICE_SPEED: 560,
  BULLET_SPEED: 900,
  PISTOL_DAMAGE: 34,
  PISTOL_MAG: 12,
  WANTED_MAX: 5,
  SAVE_KEY: 'solara-nights-save-v1',
  // How long (seconds) the auto-save checkpoint waits between saves.
  AUTOSAVE_SECONDS: 30,
};

export const COLORS = {
  grass: '#7fae5a',
  grassDark: '#74a24f',
  road: '#3a3f47',
  roadEdge: '#2c3038',
  lane: '#e8d44d',
  sidewalk: '#b9b3a4',
  sand: '#e8d29a',
  water: '#2f7fb8',
  waterDeep: '#256a9e',
  park: '#5d9b4a',
  buildingRoof: ['#c96f4a', '#4a7fa5', '#a55a7d', '#5a8a6a', '#b08a3e', '#7a6aa5'],
  buildingWall: '#8a7f72',
  carPalette: ['#d94f3d', '#3d7bd9', '#e8c33d', '#3da56a', '#e8e8e8', '#22242a', '#c77fd9', '#e88a2d'],
  policeCar: '#1c2f4a',
  player: '#ffd23d',
};

export const CITY_NAME = 'Kota Solara';
export const GAME_NAME = 'Solara Nights';
export const HERO_NAME = 'Raka';

// Story missions, in order. Each one is a short job for Raka in Solara.
export const MISSIONS = [
  {
    id: 'm1',
    title: 'Kenalan di Dermaga',
    giver: 'Sari',
    brief: 'Sari menunggumu di dermaga selatan. Jalan kaki atau naik mobil, sampai ke penanda kuning.',
    objective: { type: 'goto', x: 1600, y: 2050, label: 'Dermaga Selatan' },
    reward: 150,
  },
  {
    id: 'm2',
    title: 'Mobil Pesanan',
    giver: 'Sari',
    brief: 'Bos butuh mobil cepat. Curi mobil apa saja dengan tombol E, lalu antar ke bengkel Bayu di timur kota.',
    objective: { type: 'deliver', x: 2850, y: 600, label: 'Bengkel Bayu', needCar: true },
    reward: 350,
  },
  {
    id: 'm3',
    title: 'Tagihan Terakhir',
    giver: 'Bayu',
    brief: 'Tiga penjaga gudang menghalangi jalan. Lumpuhkan ketiganya, lalu kabur ke tempat persembunyian di barat.',
    objective: { type: 'eliminate', count: 3, x: 350, y: 1400, label: 'Tempat Persembunyian' },
    reward: 800,
  },
];

export const LANDMARKS = [
  { name: 'Dermaga Selatan', x: 1600, y: 2050 },
  { name: 'Bengkel Bayu', x: 2850, y: 600 },
  { name: 'Tempat Persembunyian', x: 350, y: 1400 },
  { name: 'Taman Mentari', x: 1400, y: 1350 },
  { name: 'Pantai Solara', x: 1600, y: 2280 },
];
