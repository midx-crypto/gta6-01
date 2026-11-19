// The shared game state: one plain object every system reads and writes.
// main.js creates it, fills in the three.js objects, then hands it to the
// systems. Nothing here imports three.js, so the rules stay testable alone.
import { PLAYER } from './config.js';

export function createGameState(seed) {
  return {
    seed,
    mode: 'title', // title | play | paused | busted | wasted | garage | wheel | daycard | missiondone | missionfail
    previousMode: 'play',
    time: 0,
    day: 1,
    money: 250,
    respect: 0,
    wanted: 0,
    wantedTimer: 0,
    health: PLAYER.health,
    maxHealth: 100,
    player: { x: -180, z: 120, angle: Math.PI / 2, speed: 0, onFoot: true, moving: false, invulnerable: 0 },
    car: null,
    cars: [],
    traffic: [],
    peds: [],
    cops: [],
    policeCars: [],
    heli: null,
    enemies: [],
    weapons: {
      pistol: { name: 'Pistol', ammo: 48, reserve: 120, damage: 34, rate: 0.28, spread: 0.02, range: 60 },
      smg: { name: 'SMG', ammo: 0, reserve: 0, damage: 16, rate: 0.09, spread: 0.05, range: 48 },
      shotgun: { name: 'Shotgun', ammo: 0, reserve: 0, damage: 22, rate: 0.8, spread: 0.12, range: 26 },
    },
    currentWeapon: 'pistol',
    weaponCooldown: 0,
    nitro: 100,
    nitroActive: false,
    radioStation: 0,
    radioOn: true,
    missionIndex: 0,
    missionStep: 0,
    missionActive: false,
    missionTimer: 0,
    mission: null,
    objective: { text: 'Temui Pak Hendra di garasi', x: -190, z: 140, kind: 'goto' },
    coins: [],
    coinsGot: 0,
    coinsTotal: 20,
    owned: [
      { name: 'Bara Sedan', color: 0xd8402e, engine: 0, nitro: 0, armor: 0, x: -182, z: 132 },
      { name: 'Ombak Coupe', color: 0x2e7fd8, engine: 0, nitro: 0, armor: 0, x: -176, z: 132 },
      { name: 'Gunung Pickup', color: 0xe8a020, engine: 0, nitro: 0, armor: 0, x: -170, z: 132 },
    ],
    activeOwned: 0,
    race: null,
    job: null,
    airTime: 0,
    airScore: 0,
    airborne: false,
    stats: { shots: 0, hits: 0, kills: 0, stunts: 0, jobsDone: 0, racesWon: 0, distance: 0 },
    cameraYaw: 0,
    cameraPitch: 0.32,
    cameraDistance: 11,
    flags: {},
    message: '',
    messageTimer: 0,
    dayCardTimer: 0,
    shotMode: null,
    scene: null,
    camera: null,
    renderer: null,
    colliders: [],
    markers: {},
  };
}

export function resetRunState(state) {
  state.money = 250;
  state.respect = 0;
  state.wanted = 0;
  state.wantedTimer = 0;
  state.health = state.maxHealth;
  state.day = 1;
  state.missionIndex = 0;
  state.missionStep = 0;
  state.missionActive = false;
  state.mission = null;
  state.coinsGot = 0;
  state.nitro = 100;
  state.currentWeapon = 'pistol';
  state.weapons.pistol.ammo = 48;
  state.weapons.pistol.reserve = 120;
  state.weapons.smg.ammo = 0;
  state.weapons.smg.reserve = 0;
  state.weapons.shotgun.ammo = 0;
  state.weapons.shotgun.reserve = 0;
  state.player.x = -180; state.player.z = 120; state.player.angle = Math.PI / 2;
  state.player.onFoot = true; state.player.speed = 0;
  state.car = null;
  if (state.scene) {
    for (const e of state.enemies) state.scene.remove(e.mesh);
    for (const c of state.cops) state.scene.remove(c.mesh);
    for (const c of state.policeCars) state.scene.remove(c.mesh);
  }
  state.enemies = [];
  state.cops = [];
  state.policeCars = [];
  if (state.heli) { state.heli.active = false; state.heli.mesh.visible = false; }
  state.race = null;
  state.job = null;
  state.flags = {};
  state.stats = { shots: 0, hits: 0, kills: 0, stunts: 0, jobsDone: 0, racesWon: 0, distance: 0 };
  state.objective = { text: 'Temui Pak Hendra di garasi', x: -190, z: 140, kind: 'goto' };
}

// Save-shaped snapshot: only the durable progression, never live positions
// of traffic or police, so a loaded save always starts in a sane place.
export function snapshotForSave(state) {
  return {
    money: state.money, respect: state.respect, day: state.day,
    missionIndex: state.missionIndex, coinsGot: state.coinsGot,
    health: state.health, radioStation: state.radioStation,
    owned: state.owned.map((c) => ({ name: c.name, color: c.color, engine: c.engine, nitro: c.nitro, armor: c.armor })),
    activeOwned: state.activeOwned,
    weapons: {
      pistol: { ammo: state.weapons.pistol.ammo, reserve: state.weapons.pistol.reserve },
      smg: { ammo: state.weapons.smg.ammo, reserve: state.weapons.smg.reserve },
      shotgun: { ammo: state.weapons.shotgun.ammo, reserve: state.weapons.shotgun.reserve },
    },
    currentWeapon: state.currentWeapon,
    stats: state.stats,
  };
}
