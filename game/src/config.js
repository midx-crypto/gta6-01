// Aruna Bay — configuration: world size, tuning, story missions, palette.
// Kota Aruna is an original sun-soaked coastal city. Nothing here is copied
// from any commercial game: all names, places and characters are invented.

export const CONFIG = {
  seed: 1,
  cityHalf: 180, // playable city extends x,z in [-180, 180]
  roadGap: 50, // distance between road centrelines
  roadWidth: 12,
  blockSize: 38,
  beachX: 185, // sand starts here
  waterX: 215, // sea starts here
  playerWalkSpeed: 9,
  playerRunSpeed: 14,
  carMaxSpeed: 42,
  carAccel: 26,
  carBrake: 40,
  carTurn: 1.9,
  maxWanted: 5,
  startMoney: 250,
  startHealth: 100,
  pistolDamage: 34,
  pistolAmmo: 120,
  saveKey: 'aruna-bay-save-v1',
};

// Palette for the dusk-lit coastal city: warm sand, teal sea, neon pink.
export const PALETTE = {
  skyTop: 0x2a3a6e,
  skyMid: 0xff8f5e,
  skyLow: 0xffc46b,
  fog: 0xe8906a,
  sea: 0x1e6f8e,
  sand: 0xe8c98f,
  asphalt: 0x2c2f36,
  sidewalk: 0x8a8578,
  grass: 0x4d8a4a,
  building: [0xe8dcc8, 0xd8c2a0, 0xc9b8a8, 0xb8c4d0, 0xe0a878, 0x9fb8a8, 0xd8a0a0, 0xf0e0c0],
  neon: [0xff2e88, 0x00e5ff, 0xffe14d, 0x7cff5e, 0xff6a00, 0xb46bff],
  carPaint: [0xc22e2e, 0x2e6fc2, 0xe8c832, 0x2ec28a, 0xe8e8e8, 0x222226, 0xc26a2e, 0x7a2ec2],
};

// The seven story missions: a fixer arc for Dimas in Kota Aruna.
export const MISSIONS = [
  {
    id: 1, title: 'Pesan dari Raka', giver: 'Raka',
    brief: 'Raka, fixer lama di Kota Aruna, memanggilmu ke bengkelnya di Jalan Merpati. Datangi penanda kuning itu.',
    reward: 500,
    steps: [
      { type: 'goto', label: 'Pergi ke Bengkel Raka', pos: [-75, 0, -75], radius: 8 },
    ],
  },
  {
    id: 2, title: 'Titipan Panas', giver: 'Raka',
    brief: 'Sebuah sedan hitam membawa paket untuk Sari. Ikuti mobil itu sampai ke gudang, jangan sampai kehilangan jejaknya.',
    reward: 800,
    steps: [
      { type: 'chase', label: 'Ikuti sedan hitam itu', radius: 60, loseRadius: 90, target: 'sedan' },
      { type: 'goto', label: 'Masuk ke gudang pelabuhan', pos: [150, 0, 125], radius: 10 },
    ],
  },
  {
    id: 3, title: 'Gudang Pelabuhan', giver: 'Sari',
    brief: 'Geng Pelabuhan menguasai gudang itu. Sari butuh gudang kembali. Habisi keempat penjaga gudang.',
    reward: 1200,
    steps: [
      { type: 'kill', label: 'Habisi penjaga gudang (0/4)', pos: [150, 0, 125], count: 4, radius: 30 },
    ],
  },
  {
    id: 4, title: 'Antar Paket', giver: 'Sari',
    brief: 'Tiga paket harus sampai sebelum matahari terbenam. Antar ke tiga titik di kota, secepat mungkin.',
    reward: 1000,
    steps: [
      { type: 'goto', label: 'Antar paket 1/3: Kafe Senja', pos: [-125, 0, 75], radius: 8 },
      { type: 'goto', label: 'Antar paket 2/3: Taman Aruna', pos: [25, 0, -125], radius: 8 },
      { type: 'goto', label: 'Antar paket 3/3: Dermaga', pos: [195, 0, 25], radius: 8 },
    ],
  },
  {
    id: 5, title: 'Kabur dari Razia', giver: 'Raka',
    brief: 'Razia besar-besaran di pusat kota. Polisi sudah mengincarmu. Kabur ke rumah aman di Jalan Kenanga dan hilangkan kejaran.',
    reward: 1500,
    steps: [
      { type: 'escape', label: 'Kabur ke rumah aman, hilangkan polisi', pos: [-125, 0, 125], radius: 10, wanted: 3 },
    ],
  },
  {
    id: 6, title: 'Balap Pantai', giver: 'Dimas',
    brief: 'Balapan liar di jalan pantai. Lewati kelima gerbang balap sebelum pembalap lain, buktikan siapa raja jalanan Aruna.',
    reward: 2000,
    steps: [
      { type: 'race', label: 'Gerbang balap 1/5', pos: [195, 0, -125], radius: 10 },
      { type: 'race', label: 'Gerbang balap 2/5', pos: [195, 0, -25], radius: 10 },
      { type: 'race', label: 'Gerbang balap 3/5', pos: [195, 0, 75], radius: 10 },
      { type: 'race', label: 'Gerbang balap 4/5', pos: [150, 0, 150], radius: 10 },
      { type: 'race', label: 'Gerbang balap 5/5: garis finis', pos: [75, 0, 150], radius: 10 },
    ],
  },
  {
    id: 7, title: 'Perampokan Bank Aruna', giver: 'Raka',
    brief: 'Aksi terakhir: Bank Aruna. Masuk, ambil uangnya, dan kabur ke dermaga sebelum seluruh kota mengejarmu.',
    reward: 5000,
    steps: [
      { type: 'goto', label: 'Masuk ke Bank Aruna', pos: [25, 0, 25], radius: 10 },
      { type: 'kill', label: 'Lumpuhkan pengawal bank (0/3)', pos: [25, 0, 25], count: 3, radius: 25 },
      { type: 'grab', label: 'Ambil uang dari brankas', pos: [25, 0, 25], radius: 6, holdSeconds: 3 },
      { type: 'escape', label: 'Kabur ke dermaga! Polisi mengejar', pos: [205, 0, -25], radius: 10, wanted: 4 },
    ],
  },
];

export const STORY_CAST = [
  { name: 'Dimas', role: 'Protagonis: sopir dan fixer jalanan Kota Aruna' },
  { name: 'Raka', role: 'Fixer tua, pemilik Bengkel Raka di Jalan Merpati' },
  { name: 'Sari', role: 'Pemilik Kafe Senja, otak di balik banyak rencana' },
  { name: 'Bimo', role: 'Pembalap liar jalan pantai, rival Dimas' },
  { name: 'Kapten Laras', role: 'Kepala polisi Kota Aruna yang mengejar Dimas' },
];

// Wanted-level tuning: how many police units answer each star level.
export const WANTED_RESPONSE = {
  1: { policeCars: 1, footCops: 0, chaseSpeed: 24 },
  2: { policeCars: 2, footCops: 1, chaseSpeed: 27 },
  3: { policeCars: 3, footCops: 2, chaseSpeed: 30 },
  4: { policeCars: 4, footCops: 3, chaseSpeed: 33 },
  5: { policeCars: 5, footCops: 4, chaseSpeed: 36 },
};

// How fast heat cools when no crime is committed and no police can see you.
export const HEAT_COOLDOWN_SECONDS = 25;
export const DISTRICTS = [
  'Pusat Kota', 'Jalan Merpati', 'Pelabuhan', 'Pantai Aruna',
  'Taman Aruna', 'Kafe Senja', 'Dermaga', 'Jalan Kenanga',
];
