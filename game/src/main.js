// Pulau Bara — boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there.
// ?seed=N fixes the island. ?shot=start|chase|mission|race|garage|end
// (with &seed=N) stages that scene, paints it twice and sets __shotReady.
import { STEP, SAVE_KEY } from './config.js';
import { createRandom } from './random.js';
import { createGameState, resetRunState } from './state.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_WHEEL, ACTION_RADIO, ACTION_GARAGE, ACTION_JOB, ACTION_WEAPON1, ACTION_WEAPON2, ACTION_WEAPON3 } from './input.js';
import { buildWorld } from './world.js';
import { createTraffic, createParkedCars, createOwnedCars, makeCarMesh } from './vehicles.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { makePlayerMesh, updatePlayerOnFoot, tryEnterCar, exitCar, posePlayerMesh } from './player.js';
import { updateDriving, isBoosting } from './driving.js';
import { updatePolice, setWanted, maybeRoadblock, clearRoadblock } from './police.js';
import { createHelicopter, updateHelicopter } from './helicopter.js';
import { fireWeapon, updateEnemies } from './combat.js';
import { startMission, updateMission, startNextMission, retryMission } from './missions.js';
import { showDayCard, updateDayCard } from './days.js';
import { openGarage, closeGarage, nearGarage, buyUpgrade, repairCar, switchActiveCar } from './garage.js';
import { updateRace } from './races.js';
import { startTaxiJob, startDeliveryJob, updateJob } from './jobs.js';
import { createCoins, updateCoins } from './collectibles.js';
import { createParticles, updateParticles, spawnBurst, spawnNitroFlame } from './particles.js';
import { buildHUD, updateHUD } from './hud.js';
import { saveGame, loadGame, hasSave } from './savegame.js';
import { createRenderer, createCamera, updateCamera, resizeRenderer } from './render.js';
import { stageShot } from './shots.js';
import { ensureAudio, engineSound, setRadioStation, setRadioOn, setMuted } from './audio.js';
import { nextStationIndex, stationName } from './radio.js';
import { selectWeapon, reloadWeapon, buyWeapon, buyAmmo } from './weapons.js';
import { updateTraffic } from './vehicles.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const state = createGameState(seed);
const rng = createRandom(seed);
state.time = 0;

buildWorld(state, rng);
createTraffic(state, rng, 18);
createParkedCars(state, rng, 10);
createOwnedCars(state);
createPedestrians(state, rng, 36);
createCoins(state);
createParticles(state);
createHelicopter(state);

const playerMesh = makePlayerMesh();
playerMesh.position.set(state.player.x, 0, state.player.z);
state.scene.add(playerMesh);
const rivalMesh = makeCarMesh(0xd81e2e);
rivalMesh.visible = false;
state.scene.add(rivalMesh);

const renderer = createRenderer(canvas);
const camera = createCamera();
state.renderer = renderer;
state.camera = camera;
const input = createInput(canvas);

const actions = {
  onStart(withSave) {
    ensureAudio();
    setRadioStation(state.radioStation);
    if (withSave && hasSave()) loadGame(state);
    else resetRunState(state);
    state.mode = 'play';
    state.cameraYaw = state.player.angle;
    startMission(state, state.missionIndex);
    announce('Bermain. Misi 1: ' + (state.mission ? state.mission.title : ''));
  },
  onResume() { state.mode = 'play'; },
  onSaveQuit() { saveGame(state); state.mode = 'title'; showScreen(); },
  onNextMission() { startNextMission(state); showScreen(); },
  onRetryMission() { retryMission(state); state.mode = 'play'; showScreen(); },
  onRespawn() {
    state.health = state.maxHealth;
    state.wanted = 0;
    state.money = Math.max(0, state.money - 100);
    state.player.x = -228; state.player.z = 188; state.player.onFoot = true;
    state.car = null;
    state.mode = 'play';
    state.message = 'Kamu bangun di safehouse. -$100.';
    state.messageTimer = 3;
    showScreen();
  },
  onCloseGarage() { closeGarage(state); showScreen(); },
  onBuyUpgrade(i, kind) { buyUpgrade(state, i, kind); renderGarageMenu(); },
  onRepair() { repairCar(state); renderGarageMenu(); },
  onBuyWeapon(id) { buyWeapon(state, id); renderGarageMenu(); },
  onBuyAmmo(id) { buyAmmo(state, id); renderGarageMenu(); },
  onSwitchCar(i) { switchActiveCar(state, i); renderGarageMenu(); },
  onSelectWeapon(id) { selectWeapon(state, id); state.mode = 'play'; showScreen(); },
};
const hud = buildHUD(state, actions);
window.addEventListener('resize', () => resizeRenderer(renderer, camera));
window.addEventListener('pointerdown', () => ensureAudio(), { once: true });
window.addEventListener('keydown', () => ensureAudio(), { once: true });

function announce(message) { statusEl.textContent = message; }

function showScreen() {
  const modes = ['title', 'pause', 'missiondone', 'missionfail', 'busted', 'wasted', 'daycard'];
  for (const m of modes) {
    const el = document.getElementById('screen-' + m);
    if (el) el.style.display = state.mode === m || (m === 'pause' && state.mode === 'paused') ? 'flex' : 'none';
  }
  document.getElementById('garage-menu').style.display = state.mode === 'garage' ? 'block' : 'none';
  document.getElementById('weapon-wheel').style.display = state.mode === 'wheel' ? 'flex' : 'none';
  if (state.mode === 'missiondone' && state.flags.lastReward) {
    document.getElementById('missiondone-title').textContent = 'MISI SELESAI: ' + state.flags.lastReward.title;
    document.getElementById('missiondone-reward').textContent = '+$' + state.flags.lastReward.money + '  •  +' + state.flags.lastReward.respect + ' respect' + (state.flags.gameComplete ? '  •  CERITA TAMAT — Pulau Bara bebas!' : '');
  }
  if (state.mode === 'missionfail') {
    document.getElementById('missionfail-reason').textContent = state.flags.failReason || 'Misi gagal.';
  }
  if (state.mode === 'daycard') {
    const intro = { 1: ['HARI 1 — KEDATANGAN', 'Mira tiba di Pulau Bara. Tiga hari menuju Festival Bahari.'], 2: ['HARI 2 — PERSIAPAN', 'Kru makin solid. Komisaris Ratna mulai mencium rencana.'], 3: ['HARI 3 — FESTIVAL BAHARI', 'Hari H. Brankas Bank Bara menyimpan dana festival yang dicuri.'] }[state.day] || ['HARI 1', ''];
    document.getElementById('daycard-title').textContent = intro[0];
    document.getElementById('daycard-text').textContent = intro[1];
  }
  if (state.mode === 'garage') renderGarageMenu();
  document.getElementById('btn-continue').style.display = hasSave() ? 'inline-block' : 'none';
}

function renderGarageMenu() {
  const el = document.getElementById('garage-rows');
  const priceLabel = (prices, level) => (level >= prices.length ? 'MAX' : '$' + prices[level]);
  let html = '<p>Uang: $' + Math.round(state.money) + ' &nbsp;•&nbsp; Respect: ' + state.respect + '</p>';
  state.owned.forEach((car, i) => {
    html += '<div class="garage-car' + (i === state.activeOwned ? ' active' : '') + '"><b>' + car.name + '</b> '
      + '<button data-buy="car:' + i + '">Pakai</button><br>'
      + 'Mesin Lv' + car.engine + ' <button data-buy="engine:' + i + '">Upgrade ' + priceLabel([250, 500, 900], car.engine) + '</button> '
      + 'Nitro Lv' + car.nitro + ' <button data-buy="nitro:' + i + '">Upgrade ' + priceLabel([200, 400, 700], car.nitro) + '</button> '
      + 'Armor Lv' + car.armor + ' <button data-buy="armor:' + i + '">Upgrade ' + priceLabel([200, 400, 700], car.armor) + '</button></div>';
  });
  html += '<div class="garage-shop"><b>Toko Senjata</b><br>'
    + '<button data-buy="weapon" data-weapon="smg">Beli SMG $400</button> '
    + '<button data-buy="weapon" data-weapon="shotgun">Beli Shotgun $600</button><br>'
    + '<button data-buy="ammo" data-weapon="pistol">Amunisi Pistol $40</button> '
    + '<button data-buy="ammo" data-weapon="smg">Amunisi SMG $80</button> '
    + '<button data-buy="ammo" data-weapon="shotgun">Amunisi Shotgun $100</button><br>'
    + '<button data-buy="repair">Servis + Isi Nitro $50</button></div>';
  el.innerHTML = html;
}

// ---- The loop ----
let accumulator = 0;
let last = performance.now();
let prevWanted = 0;
let painted = 0;
let lastShownMode = null;

function handleActions() {
  let a = input.takeActions();
  if (a & ACTION_CONFIRM) {
    if (state.mode === 'title') { actions.onStart(hasSave()); showScreen(); }
    else if (state.mode === 'missiondone') { actions.onNextMission(); }
    else if (state.mode === 'missionfail') { actions.onRetryMission(); }
    else if (state.mode === 'busted' || state.mode === 'wasted') { actions.onRespawn(); }
  }
  if (a & ACTION_PAUSE) {
    if (state.mode === 'play') { state.mode = 'paused'; showScreen(); announce('Jeda.'); }
    else if (state.mode === 'paused') { state.mode = 'play'; showScreen(); }
    else if (state.mode === 'garage') { actions.onCloseGarage(); }
    else if (state.mode === 'wheel') { state.mode = 'play'; showScreen(); }
  }
  if (a & ACTION_GARAGE && state.mode === 'garage') { actions.onCloseGarage(); a &= ~ACTION_GARAGE; }
  if (state.mode !== 'play' && state.mode !== 'wheel') return;
  if (a & ACTION_ENTER) {
    ensureAudio();
    if (state.player.onFoot) { if (tryEnterCar(state)) { state.cameraYaw = state.player.angle; } }
    else exitCar(state);
    showScreen();
  }
  if (a & ACTION_WHEEL) {
    state.mode = state.mode === 'wheel' ? 'play' : 'wheel';
    showScreen();
  }
  if (a & ACTION_RADIO) {
    state.radioStation = nextStationIndex(state.radioStation);
    setRadioStation(state.radioStation);
    state.message = 'Radio: ' + stationName(state.radioStation);
    state.messageTimer = 2;
  }
  if (a & ACTION_GARAGE) {
    if (state.mode === 'garage') actions.onCloseGarage();
    else if (nearGarage(state)) { openGarage(state); showScreen(); }
  }
  if (a & ACTION_JOB) {
    if (!state.job) {
      const nearTaxi = Math.hypot(state.player.x - 20, state.player.z + 120) < 14;
      const nearRace = Math.hypot(state.player.x + 90, state.player.z + 300) < 14;
      if (nearRace && !state.race) startRace(state);
      else if (nearTaxi) startTaxiJob(state, 3);
      else startDeliveryJob(state);
    }
  }
  if (a & ACTION_WEAPON1) selectWeapon(state, 'pistol');
  if (a & ACTION_WEAPON2) selectWeapon(state, 'smg');
  if (a & ACTION_WEAPON3) selectWeapon(state, 'shotgun');
}

function stepWorld(dt) {
  state.time += dt;
  state.weaponCooldown = Math.max(0, state.weaponCooldown - dt);
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.player.invulnerable > 0) state.player.invulnerable -= dt;

  const drag = input.takeDrag();
  if (drag.dx !== 0) state.cameraYaw -= drag.dx * 0.004;
  if (drag.dy !== 0) state.cameraPitch = Math.max(0.12, Math.min(0.7, state.cameraPitch + drag.dy * 0.002));

  if (state.mode === 'daycard') { updateDayCard(state, dt); return; }
  if (state.mode !== 'play' && state.mode !== 'wheel') return;

  if (state.player.onFoot) updatePlayerOnFoot(state, input, dt, playerMesh);
  else {
    const hit = updateDriving(state, input, dt);
    if (hit) spawnBurst(state, state.car.x, 0.8, state.car.z, 0xffa020, 8, 3, 0.4, 0.8);
    if (isBoosting(state)) spawnNitroFlame(state, state.car);
    playerMesh.visible = false;
  }
  if (state.player.onFoot) playerMesh.visible = true;
  posePlayerMesh(playerMesh, input.shooting() && state.player.onFoot, state.time);

  // Camera auto-aligns behind the heading while moving.
  if (state.player.speed > 2) {
    const target = state.player.angle;
    let diff = target - state.cameraYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    state.cameraYaw += diff * Math.min(1, dt * (state.player.onFoot ? 2.2 : 1.1));
  }

  updateTraffic(state, dt);
  updatePedestrians(state, dt);
  updatePolice(state, dt);
  updateHelicopter(state, dt);
  updateEnemies(state, dt);
  updateMission(state, dt);
  updateRace(state, dt);
  updateJob(state, dt);
  updateCoins(state, dt);
  updateParticles(state, dt);

  if (state.race) {
    const rp = state.race;
    rivalMesh.visible = true;
    rivalMesh.position.set(rp.rivalX, 0, rp.rivalZ);
    rivalMesh.rotation.y = rp.rivalAngle;
  } else rivalMesh.visible = false;

  if (state.wanted === 5 && prevWanted < 5) maybeRoadblock(state);
  if (state.wanted < 5 && prevWanted >= 5) clearRoadblock(state);
  prevWanted = state.wanted;

  if (input.shooting() && state.player.onFoot && state.mode === 'play') {
    const hit = fireWeapon(state, camera);
    const gx = state.player.x + Math.sin(state.player.angle) * 1.2;
    const gz = state.player.z + Math.cos(state.player.angle) * 1.2;
    spawnBurst(state, gx, 1.2, gz, 0xffe9a0, 3, 2, 0.12, 0.5);
    if (hit) spawnBurst(state, hit.x, 1.2, hit.z, 0xff4444, 6, 2, 0.4, 0.8);
  }
  const speed01 = state.car ? Math.abs(state.car.speed) / 46 : (state.player.speed || 0) / 14;
  engineSound(speed01, state.mode === 'play');

  if (state.markers.beacon) {
    const s = 1 + Math.sin(state.time * 4) * 0.25;
    state.markers.beacon.scale.set(s, 1, s);
  }
  if (state.mode === 'busted' || state.mode === 'wasted') showScreen();
}

function frame(now) {
  requestAnimationFrame(frame);
  accumulator += Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  handleActions();
  while (accumulator >= STEP) {
    stepWorld(STEP);
    accumulator -= STEP;
    if (state.mode === 'title') {
      state.time += STEP;
      updateTraffic(state, STEP);
      updatePedestrians(state, STEP);
      state.cameraYaw += STEP * 0.03;
      updateCamera(state, camera, STEP);
    }
  }
  if (state.mode !== 'title') updateCamera(state, camera, Math.min(0.05, (now - last) / 1000 + 0.016));
  updateHUD(state, hud, 0);
  renderer.render(state.scene, camera);
  if (state.mode !== lastShownMode) { showScreen(); lastShownMode = state.mode; }
}

function runShot(name) {
  const ctx = { state, playerMesh, rivalMesh };
  stageShot(name, ctx);
  updatePolice(state, 0.1);
  updateHelicopter(state, 0.1);
  showScreen();
  updateHUD(state, hud, 0);
  let painted = 0;
  function paint() {
    updateCamera(state, camera, 1.0);
    renderer.render(state.scene, camera);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

// Debug handle for headless play-tests (never used by the game itself).
window.__pb = {
  state, startMission,
  setWanted: (n) => setWanted(state, n),
  saveGame, loadGame,
  giveWeapon: (id, ammo, reserve) => { const w = state.weapons[id]; if (w) { w.ammo += ammo; w.reserve += reserve; } },
  teleport: (x, z) => { state.player.x = x; state.player.z = z; if (state.player.onFoot) playerMesh.position.set(x, 0, z); },
  start: () => actions.onStart(false),
};

if (shot) runShot(shot);
else {
  showScreen();
  announce('Pulau Bara. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}
