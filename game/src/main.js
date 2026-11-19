// Aruna Bay — main: builds the whole game, runs the loop, wires input,
// missions, police, combat and HUD together. Original open-world crime game
// in the fictional coastal city of Kota Aruna.

import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';
import { makeRng, pick } from './random.js';
import { buildWorld, updateWorld } from './world.js';
import { createCar, driveCar, nearestCar, parkedSpots } from './vehicles.js';
import { spawnTraffic, updateTraffic, updateTargetCar } from './traffic.js';
import { spawnPedestrians, updatePedestrians, scatterPedestrians } from './pedestrians.js';
import {
  createPoliceState, raiseWanted, updatePolice, resetPoliceAfterBusted,
} from './police.js';
import {
  createPlayer, updatePlayerOnFoot, tryEnterCar, exitCar,
  damagePlayer, saveGame, loadGame,
} from './player.js';
import {
  createCombatState, shoot, updateCombat, spawnAmmoPickup,
  updatePickup, clearEnemies,
} from './combat.js';
import {
  createMissionState, startMission, updateMissions, retryMission,
  currentMission,
} from './missions.js';
import { buildHud, updateHud, showStart, showPause, showEnd, hideEnd, flashHint, tickHint } from './hud.js';
import { createAudio, ensureAudio, playGunshot, playMissionComplete, playMissionFail, updateAudio, toggleMute } from './audio.js';
import { createEffects, burstSparks, burstSmoke, burstMuzzle, burstConfetti, updateEffects } from './effects.js';
import { createCameraState, updateCamera, addShake, snapCameraBehind } from './camera.js';
import { createInput, bindInput, endFrameInput, drivingInput } from './input.js';
import { parseShotMode, applyShotMode } from './shots.js';

const params = new URLSearchParams(window.location.search);
const SEED = Number(params.get('seed') || CONFIG.seed) || 1;
const rng = makeRng(SEED);

// --- renderer, scene, camera ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-60, 20, 40);

// --- world and systems ---
const world = buildWorld(scene, SEED);
const G = {
  scene, camera, renderer, world,
  mode: 'menu', // menu | playing | paused | busted | wasted | complete
  cinematic: false,
  time: 0,
  player: null,
  cars: [],
  traffic: [],
  peds: [],
  police: createPoliceState(),
  combat: createCombatState(),
  missions: createMissionState(),
  hud: buildHud(),
  audio: createAudio(),
  effects: createEffects(scene),
  cam: createCameraState(),
  input: createInput(),
  raycaster: new THREE.Raycaster(),
  gunshotFlash: null,
};

// parked cars the player can steal, plus a few traffic cars
const spots = parkedSpots(makeRng(SEED + 31));
for (const s of spots.slice(0, 10)) {
  const car = createCar(scene, s.x, s.z, s.yaw, pick(makeRng(SEED + s.x), PALETTE.carPaint), { parked: true });
  G.cars.push(car);
}
G.traffic = spawnTraffic(scene, SEED, 12);
G.cars.push(...G.traffic);
G.peds = spawnPedestrians(scene, SEED, 26, world.colliders);

// the player, Dimas, spawns near the cafe strip
G.player = createPlayer(scene, world.places.spawn);
G.cam.yaw = Math.PI * 0.2;
G.player.camYaw = G.cam.yaw;

// ammo pickup near the spawn so the player finds it early
G.combat.pickup = spawnAmmoPickup(scene, -60, 10);

// start-mission helper used by the HUD, keys and screenshot modes
G.startMission = (index) => {
  startMission(scene, G.missions, G.combat, G.police, index);
  playMissionComplete(G.audio);
  saveGame(G.player, G.missions.index);
};

// --- input ---
bindInput(G.input, renderer.domElement, {
  onWheel: (dy) => {
    G.cam.targetDistance = Math.max(5, Math.min(22, G.cam.targetDistance + dy * 0.01));
  },
  onFirstGesture: () => ensureAudio(G.audio),
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- menus ---
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const missionBtn = document.getElementById('mission-btn');

function beginPlay() {
  ensureAudio(G.audio);
  G.mode = 'playing';
  G.cinematic = false;
  showStart(G.hud, false);
  hideEnd(G.hud);
  flashHint(G.hud, 'WASD jalan / nyetir • E masuk mobil • Klik tembak • M misi • P jeda', 6);
  const save = loadGame();
  if (save && save.mission > 0) {
    G.player.money = save.money;
    G.player.health = save.health;
    G.player.ammo = save.ammo;
    G.missions.index = Math.min(save.mission, 6);
  }
}
startBtn.addEventListener('click', beginPlay);
resumeBtn.addEventListener('click', () => {
  G.mode = 'playing';
  showPause(G.hud, false);
});
restartBtn.addEventListener('click', () => {
  hideEnd(G.hud);
  respawnPlayer();
  G.mode = 'playing';
});
missionBtn.addEventListener('click', () => {
  if (!G.missions.active && !G.missions.done) G.startMission(G.missions.index);
});

function respawnPlayer() {
  resetPoliceAfterBusted(scene, G.police);
  clearEnemies(scene, G.combat);
  G.player.health = CONFIG.startHealth;
  G.player.money = Math.max(0, G.player.money - 500);
  if (G.player.inCar) exitCar(G.player);
  G.player.pos.set(world.places.spawn.x, 0, world.places.spawn.z);
  G.player.mesh.position.copy(G.player.pos);
  G.player.mesh.visible = true;
  G.cam.yaw = Math.PI * 0.2;
  G.missions.messageTimer = 0;
}

function gameOver(kind) {
  G.mode = kind;
  if (kind === 'busted') {
    resetPoliceAfterBusted(scene, G.police);
    showEnd(G.hud, 'TERTANGKAP!', 'Kapten Laras menangkapmu. Denda $500, mobil disita. Tekan R untuk kembali ke jalanan.');
  } else {
    showEnd(G.hud, 'TEWAS', 'Dimas tumbang di jalanan Aruna. Rumah sakit menagih $500. Tekan R untuk bangkit lagi.');
  }
  playMissionFail(G.audio);
}

// --- shooting ---
function fireWeapon() {
  const player = G.player;
  const result = shoot(camera, player, G.combat, scene, G.raycaster, (hitPoint, hitEnemy) => {
    playGunshot(G.audio);
    addShake(G.cam, 0.12);
    if (hitPoint) burstSparks(G.effects, hitPoint, hitEnemy ? 18 : 8);
    // gunfire in the open draws the police
    if (G.police.wanted < 2) raiseWanted(G.police, 1);
    scatterPedestrians(G.peds, player.pos.x, player.pos.z);
    G.gunshotPos = player.pos.clone();
  });
  if (result) {
    // muzzle flash at the player's hand, forward from the camera
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone().add(dir.clone().multiplyScalar(1.2));
    origin.y = Math.max(1.2, player.pos.y + 1.4);
    burstMuzzle(G.effects, origin, dir);
  }
}

// --- the frame loop ---
const clock = new THREE.Clock();
let lastSave = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  G.time += dt;
  const input = G.input;
  const player = G.player;

  // camera orbit from mouse drag
  if (input.mouseDX !== 0 || input.mouseDY !== 0) {
    G.cam.yaw -= input.mouseDX * 0.005;
    G.cam.pitch = Math.max(0.05, Math.min(1.1, G.cam.pitch + input.mouseDY * 0.004));
  }
  // in a car, ease the camera behind the car when the player is not orbiting
  // (not in deterministic shot modes: the shot fixes the camera angle)
  if (player.inCar && player.car && input.mouseDX === 0 && !G.shotMode) {
    let diff = player.car.yaw - G.cam.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    G.cam.yaw += diff * Math.min(1, dt * 1.2);
  }

  // --- keys that work in menus too ---
  if (input.pressed['enter'] && G.mode === 'menu') beginPlay();
  if (input.pressed['p'] || input.pressed['escape']) {
    if (G.mode === 'playing') {
      G.mode = 'paused';
      showPause(G.hud, true);
      saveGame(player, G.missions.index);
    } else if (G.mode === 'paused') {
      G.mode = 'playing';
      showPause(G.hud, false);
    }
  }
  if (input.pressed['r'] && (G.mode === 'busted' || G.mode === 'wasted' || G.mode === 'complete')) {
    hideEnd(G.hud);
    respawnPlayer();
    G.mode = 'playing';
  }
  if (input.pressed['u']) toggleMute(G.audio);

  if (G.mode === 'playing') {
    // start / retry mission
    if (input.pressed['m'] && !G.missions.active && !G.missions.done) {
      G.startMission(G.missions.index);
    }
    // enter / exit car
    if (input.pressed['e']) {
      if (player.inCar) {
        exitCar(player);
        snapCameraBehind(player, G.cam);
      } else {
        const car = tryEnterCar(player, G.cars);
        if (car) {
          if (car.parked && !car.stolen) {
            car.stolen = true;
            raiseWanted(G.police, 1); // stealing a parked car is a crime
            flashHint(G.hud, 'Mobil dicuri! Polisi mengincarmu ★', 3);
          } else {
            flashHint(G.hud, 'Kamu masuk mobil. W jalan, S rem, Spasi rem tangan.', 3);
          }
          car.parked = false;
          snapCameraBehind(player, G.cam);
          playGunshot(G.audio);
        }
      }
    }
    // shooting (mouse click) on foot
    if (input.clicked && !player.inCar) fireWeapon();

    // --- movement ---
    if (player.inCar && player.car) {
      const di = drivingInput(input);
      driveCar(player.car, di, dt, world.colliders, G.cars);
      player.pos.copy(player.car.mesh.position);
      player.yaw = player.car.yaw;
      // tire smoke when the handbrake is on at speed
      if (input.keys[' '] && Math.abs(player.car.speed) > 8 && Math.random() < 0.4) {
        burstSmoke(G.effects, player.car.mesh.position);
      }
    } else {
      updatePlayerOnFoot(player, input, dt, world.colliders);
    }

    // --- world systems ---
    updateTraffic(G.traffic, dt, world.colliders, player.car);
    if (G.missions.targetCar) updateTargetCar(G.missions.targetCar, dt, world.colliders);
    updatePedestrians(G.peds, dt, player.pos, G.gunshotPos, world.colliders);
    G.gunshotPos = null;
    const busted = updatePolice(scene, G.police, dt, player, world.colliders, G.cars);
    if (busted === 'busted') {
      gameOver('busted');
    }
    updateCombat(G.combat, dt, player, G.police, scene, (enemy) => {
      if (damagePlayer(player, 12)) {
        gameOver('wasted');
      } else {
        playGunshot(G.audio);
        addShake(G.cam, 0.08);
      }
    });
    updatePickup(G.combat, player, dt);
    const missionEvent = updateMissions(scene, G.missions, G.combat, G.police, player, dt, G);
    if (missionEvent === 'complete') {
      playMissionComplete(G.audio);
      burstConfetti(G.effects, player.pos);
      saveGame(player, G.missions.index);
      if (G.missions.done) {
        G.mode = 'complete';
        showEnd(G.hud, 'LEGEND ARUNA!', 'Tujuh misi selesai. Bank Aruna dirampok, Dimas kini legenda Kota Aruna. Terima kasih sudah bermain!');
      }
    } else if (missionEvent === 'fail') {
      playMissionFail(G.audio);
      G.mode = 'complete';
      showEnd(G.hud, 'MISI GAGAL', G.missions.justFailed || 'Misi gagal. Tekan R untuk mengulang.');
    }
    // engine + siren follow the action
    const kmh = player.inCar && player.car ? Math.abs(player.car.speed) * 3.6 : 0;
    updateAudio(G.audio, kmh, G.police.wanted, dt);
    // autosave every 30 seconds of play
    if (G.time - lastSave > 30) {
      lastSave = G.time;
      saveGame(player, G.missions.index);
    }
  }

  // --- always animate the world, even on menus ---
  updateWorld(world, G.time);
  updateEffects(G.effects, dt);
  if (G.cinematic) {
    G.cam.yaw += dt * 0.05;
    G.cam.targetDistance = 26;
    G.cam.pitch = 0.22;
  }
  updateCamera(camera, player, G.cam, dt, world.colliders);
  // the HUD stays hidden on the start screen
  G.hud.root.style.display = G.mode === 'menu' ? 'none' : 'block';
  if (G.mode !== 'menu') updateHud(G.hud, G, dt);
  tickHint(G.hud);

  renderer.render(scene, camera);
  endFrameInput(input);
}

// expose the game for headless play-testing and debugging
window.__aruna = G;

// screenshot modes run before the first frame
const shotMode = parseShotMode();
if (shotMode) {
  applyShotMode(G, shotMode);
  showStart(G.hud, G.mode === 'menu');
} else {
  showStart(G.hud, true);
}

frame();
