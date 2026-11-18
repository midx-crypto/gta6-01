// Solara Nights — main.js
// Game entry point: builds the state, runs the fixed-timestep loop, wires
// menus, saving and the deterministic ?shot modes, and draws every frame.

import { CFG, GAME_NAME } from './config.js';
import { makeRng } from './random.js';
import { generateCity } from './world.js';
import { createInput, endFrame, wasPressed, isDown } from './input.js';
import { createAudio } from './audio.js';
import { createPlayer, updatePlayerOnFoot } from './player.js';
import { spawnTraffic, spawnParkedCars, updateVehicles } from './vehicles.js';
import { updatePolice } from './police.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { updateMissions, startMission, saveProgress, loadProgress, clearSave } from './missions.js';
import { updateCombat } from './combat.js';
import { drawWorld } from './render.js';
import { drawHud, drawTitleScreen, drawEndScreen, drawPauseScreen } from './hud.js';
import { applyShotMode } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot') || '';

const S = {
  rng: makeRng(seed),
  world: null,
  player: createPlayer(1000, 1000),
  cars: [],
  peds: [],
  bullets: [],
  particles: [],
  skids: [],
  wanted: 0,
  wantedTimer: 0,
  spawnTimer: 0,
  bustedT: 0,
  state: 'title', // title | play | pause | busted | wasted | done
  missionIdx: 0,
  missionKills: 0,
  message: '',
  msgT: 0,
  time: 0,
  shootCooldown: 0,
  saveTimer: 0,
  cam: { x: 0, y: 0 },
  input: createInput(canvas),
  audio: createAudio(),
  shot,
};

S.world = generateCity(S.rng);
spawnTraffic(S, 14);
spawnParkedCars(S, 8);
spawnPedestrians(S, 22);
startMission(S, 0);
applyShotMode(S, shot);
if (shot === 'play' || shot === 'chase') {
  // Extra life around the camera for the screenshots.
  spawnPedestrians(S, 6);
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function startNewGame() {
  clearSave();
  S.player = createPlayer(1000, 1000);
  S.cars = [];
  S.peds = [];
  S.bullets = [];
  S.particles = [];
  S.skids = [];
  S.wanted = 0;
  S.wantedTimer = 0;
  S.bustedT = 0;
  S.missionIdx = 0;
  S.missionKills = 0;
  S.rng = makeRng(seed);
  S.world = generateCity(S.rng);
  spawnTraffic(S, 14);
  spawnParkedCars(S, 8);
  spawnPedestrians(S, 22);
  startMission(S, 0);
  S.state = 'play';
  S.audio.click();
  setStatus(`${GAME_NAME}: misi 1 dimulai.`);
}

function continueGame() {
  const save = loadProgress();
  if (!save) {
    startNewGame();
    return;
  }
  S.player = createPlayer(save.x || 1000, save.y || 1000);
  S.player.money = save.money || 0;
  S.player.hp = save.hp || CFG.PLAYER_HP;
  S.cars = [];
  S.peds = [];
  S.bullets = [];
  S.particles = [];
  S.skids = [];
  S.wanted = 0;
  S.rng = makeRng(seed);
  S.world = generateCity(S.rng);
  spawnTraffic(S, 14);
  spawnParkedCars(S, 8);
  spawnPedestrians(S, 22);
  startMission(S, Math.min(save.missionIdx || 0, 2));
  S.state = 'play';
  S.message = 'Progres dimuat. Lanjutkan misimu, Raka.';
  S.msgT = 4;
}

function update(dt) {
  S.time += dt;
  if (S.msgT > 0) S.msgT -= dt;
  if (S.state !== 'play') return;

  const p = S.player;
  // Pause / mute / save keys.
  if (wasPressed(S.input, 'p') || wasPressed(S.input, 'escape')) {
    S.state = 'pause';
    return;
  }
  if (wasPressed(S.input, 'm')) {
    S.audio.muted = !S.audio.muted;
    S.message = S.audio.muted ? 'Suara dimatikan.' : 'Suara dinyalakan.';
    S.msgT = 1.5;
  }
  if (wasPressed(S.input, 's') && S.input.keys.has('control')) {
    saveProgress(S);
    S.message = 'Progres disimpan.';
    S.msgT = 2;
  }

  if (p.inCar) {
    // Driving is handled inside updateVehicles; E/F exits the car.
    if (wasPressed(S.input, 'e') || wasPressed(S.input, 'f')) {
      const car = p.inCar;
      p.inCar = null;
      car.driver = 'parked';
      car.speed = 0;
      p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
      p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
    }
  } else {
    updatePlayerOnFoot(S, dt);
  }
  updateVehicles(S, dt);
  updatePolice(S, dt);
  updatePedestrians(S, dt);
  updateCombat(S, dt);
  updateMissions(S, dt);

  // Particles and skid fade.
  for (const pt of S.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  S.particles = S.particles.filter((pt) => pt.life > 0);
  for (const s of S.skids) s.life -= dt;
  S.skids = S.skids.filter((s) => s.life > 0);

  // Camera follows the player, clamped to the world.
  const w = canvas.width;
  const h = canvas.height;
  S.cam.x = Math.max(0, Math.min(CFG.WORLD_W - w, p.x - w / 2));
  S.cam.y = Math.max(0, Math.min(CFG.WORLD_H - h, p.y - h / 2));

  // Auto-save every mission completion is handled in missions.js; also
  // checkpoint quietly on a fixed interval of play.
  S.saveTimer += dt;
  if (S.saveTimer > CFG.AUTOSAVE_SECONDS) {
    S.saveTimer = 0;
    saveProgress(S);
  }

  if (p.hp <= 0 && S.state === 'play') {
    S.state = 'wasted';
    S.audio.busted();
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (S.state === 'title') {
    drawTitleScreen(S, ctx, w, h);
    return;
  }
  drawWorld(S, ctx, w, h);
  if (S.state === 'play' || S.state === 'pause') drawHud(S, ctx, w, h);
  if (S.state === 'pause') drawPauseScreen(S, ctx, w, h);
  if (S.state === 'busted') drawEndScreen(S, ctx, w, h, 'busted');
  if (S.state === 'wasted') drawEndScreen(S, ctx, w, h, 'wasted');
  if (S.state === 'done') drawEndScreen(S, ctx, w, h, 'done');
}

function handleMenuKeys() {
  const input = S.input;
  if (S.state === 'title') {
    if (wasPressed(input, 'enter')) startNewGame();
    if (wasPressed(input, 'c')) continueGame();
    if (input.mouseClicked) startNewGame();
  } else if (S.state === 'pause') {
    if (wasPressed(input, 'p') || wasPressed(input, 'escape')) S.state = 'play';
    if (wasPressed(input, 's')) {
      saveProgress(S);
      S.message = 'Progres disimpan.';
      S.msgT = 2;
      S.state = 'play';
    }
    if (wasPressed(input, 't')) S.state = 'title';
    if (wasPressed(input, 'm')) S.audio.muted = !S.audio.muted;
  } else if (S.state === 'busted' || S.state === 'wasted' || S.state === 'done') {
    if (wasPressed(input, 'enter')) startNewGame();
    if (wasPressed(input, 't')) S.state = 'title';
    if (S.state === 'busted' && wasPressed(input, 'enter')) {
      S.player.money = Math.floor(S.player.money * 0.7);
    }
  }
}

// Fixed timestep loop: 60 updates a second, rendering every frame.
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  handleMenuKeys();
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 5) {
    update(STEP);
    acc -= STEP;
    steps += 1;
  }
  draw();
  endFrame(S.input);
  requestAnimationFrame(frame);
}

setStatus(`${GAME_NAME} — open-world crime di ${'Kota Solara'}. Tekan Enter untuk mulai.`);
requestAnimationFrame(frame);
