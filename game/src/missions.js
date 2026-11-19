// Aruna Bay — missions: the seven-mission story arc. A state machine with
// steps (goto, chase, kill, deliver, escape, race, grab) driving a 3D beacon,
// HUD objective text and minimap blips, and paying out on completion.

import * as THREE from 'three';
import { MISSIONS } from './config.js';
import { spawnEnemies, clearEnemies, aliveEnemies } from './combat.js';
import { spawnTargetCar } from './traffic.js';
import { raiseWanted } from './police.js';

export function createMissionState() {
  return {
    index: 0, // current mission in MISSIONS
    step: 0,
    active: false,
    done: false, // all seven finished
    beacon: null,
    beaconLight: null,
    targetCar: null,
    killsNeeded: 0,
    killsAtStart: 0,
    holdTimer: 0,
    chaseTimer: 0,
    followTime: 0,
    message: '',
    messageTimer: 0,
  };
}

export function currentMission(ms) {
  return MISSIONS[ms.index] || null;
}

export function currentStep(ms) {
  const m = currentMission(ms);
  return m ? m.steps[ms.step] : null;
}

function makeBeacon(scene) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3, 0.35, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd94d }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.4;
  group.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 2.4, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd94d, transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  beam.position.y = 30;
  group.add(beam);
  const light = new THREE.PointLight(0xffd94d, 40, 40, 1.6);
  light.position.y = 4;
  group.add(light);
  scene.add(group);
  return { group, light };
}

function placeBeacon(scene, ms, x, z) {
  removeBeacon(scene, ms);
  const b = makeBeacon(scene);
  b.group.position.set(x, 0, z);
  ms.beacon = b.group;
  ms.beaconLight = b.light;
}

export function removeBeacon(scene, ms) {
  if (ms.beacon) {
    scene.remove(ms.beacon);
    ms.beacon = null;
    ms.beaconLight = null;
  }
}

export function startMission(scene, ms, combat, police, index) {
  ms.index = index;
  ms.step = 0;
  ms.active = true;
  ms.holdTimer = 0;
  ms.chaseTimer = 0;
  ms.followTime = 0;
  const m = currentMission(ms);
  showMessage(ms, `${m.title} — ${m.giver}: ${m.brief}`);
  enterStep(scene, ms, combat, police);
}

function enterStep(scene, ms, combat, police) {
  const step = currentStep(ms);
  if (!step) return;
  if (step.type === 'goto' || step.type === 'race' || step.type === 'grab' || step.type === 'escape') {
    placeBeacon(scene, ms, step.pos[0], step.pos[2]);
  } else if (step.type === 'kill') {
    placeBeacon(scene, ms, step.pos[0], step.pos[2]);
    clearEnemies(scene, combat);
    spawnEnemies(scene, combat, step.pos[0], step.pos[2], step.count, 100 + ms.index * 10);
    ms.killsAtStart = combat.kills;
  } else if (step.type === 'chase') {
    if (ms.targetCar) scene.remove(ms.targetCar.mesh);
    ms.targetCar = spawnTargetCar(scene, -100, -100);
    ms.chaseTimer = 0;
  }
  if (step.wanted) raiseWanted(police, step.wanted);
}

export function showMessage(ms, text) {
  ms.message = text;
  ms.messageTimer = 7;
}

function advanceStep(scene, ms, combat, police, player) {
  ms.step += 1;
  const m = currentMission(ms);
  if (ms.step >= m.steps.length) {
    completeMission(scene, ms, combat, player);
    return;
  }
  enterStep(scene, ms, combat, police);
}

function completeMission(scene, ms, combat, player) {
  const m = currentMission(ms);
  player.money += m.reward;
  removeBeacon(scene, ms);
  clearEnemies(scene, combat);
  if (ms.targetCar) {
    scene.remove(ms.targetCar.mesh);
    ms.targetCar = null;
  }
  ms.active = false;
  showMessage(ms, `Misi selesai: ${m.title}! +$${m.reward}`);
  ms.justCompleted = m;
  ms.index += 1;
  if (ms.index >= MISSIONS.length) ms.done = true;
}

// Per-frame mission logic. Returns 'complete' on the frame a mission ends.
export function updateMissions(scene, ms, combat, police, player, dt, G) {
  if (ms.messageTimer > 0) ms.messageTimer -= dt;
  if (ms.beacon) {
    ms.beacon.rotation.y += dt * 0.8;
    const s = 1 + Math.sin(performance.now() * 0.005) * 0.12;
    ms.beacon.scale.set(s, 1, s);
  }
  if (!ms.active) return null;
  const step = currentStep(ms);
  if (!step) return null;
  const px = player.pos.x;
  const pz = player.pos.z;
  const distTo = (x, z) => Math.sqrt((px - x) * (px - x) + (pz - z) * (pz - z));

  if (step.type === 'goto' || step.type === 'race') {
    if (distTo(step.pos[0], step.pos[2]) < step.radius) {
      advanceStep(scene, ms, combat, police, player);
      return ms.justCompleted ? 'complete' : 'step';
    }
  } else if (step.type === 'chase') {
    if (!ms.targetCar) return null;
    const t = ms.targetCar.mesh.position;
    const d = Math.sqrt((px - t.x) * (px - t.x) + (pz - t.z) * (pz - t.z));
    if (d < step.radius) ms.followTime += dt;
    else ms.followTime = Math.max(0, ms.followTime - dt * 0.5);
    ms.chaseTimer += dt;
    if (ms.followTime > 8) {
      advanceStep(scene, ms, combat, police, player);
      return 'step';
    }
    if (d > step.loseRadius && ms.chaseTimer > 10) {
      failMission(scene, ms, combat, 'Kehilangan jejak sedan hitam itu.');
      return 'fail';
    }
  } else if (step.type === 'kill') {
    const killed = combat.kills - ms.killsAtStart;
    step.label = step.label.replace(/\(\d+\/\d+\)/, `(${killed}/${step.count})`);
    if (aliveEnemies(combat) === 0 && killed >= step.count) {
      advanceStep(scene, ms, combat, police, player);
      return ms.justCompleted ? 'complete' : 'step';
    }
  } else if (step.type === 'grab') {
    if (distTo(step.pos[0], step.pos[2]) < step.radius) {
      ms.holdTimer += dt;
      if (ms.holdTimer >= (step.holdSeconds || 3)) {
        advanceStep(scene, ms, combat, police, player);
        return ms.justCompleted ? 'complete' : 'step';
      }
    } else {
      ms.holdTimer = 0;
    }
  } else if (step.type === 'escape') {
    if (distTo(step.pos[0], step.pos[2]) < step.radius && police.wanted === 0) {
      advanceStep(scene, ms, combat, police, player);
      return ms.justCompleted ? 'complete' : 'step';
    }
  }
  return null;
}

export function failMission(scene, ms, combat, reason) {
  removeBeacon(scene, ms);
  clearEnemies(scene, combat);
  if (ms.targetCar) {
    scene.remove(ms.targetCar.mesh);
    ms.targetCar = null;
  }
  ms.active = false;
  showMessage(ms, `Misi gagal: ${reason} Bicara lagi dengan Raka untuk mengulang.`);
  ms.justFailed = reason;
}

// Text for the HUD objective line and the mission list on the start screen.
export function missionObjectiveText(ms) {
  if (ms.done) return 'Semua misi selesai! Kamu legenda Kota Aruna.';
  const m = currentMission(ms);
  if (!m) return '';
  if (!ms.active) return `Misi berikutnya: ${m.title} — tekan M untuk mulai`;
  const step = currentStep(ms);
  return step ? `${m.title}: ${step.label}` : m.title;
}

export function missionListText() {
  return MISSIONS.map((m) => `${m.id}. ${m.title} — ${m.giver} ($${m.reward})`).join('\n');
}

// Restart the current mission from its first step.
export function retryMission(scene, ms, combat, police) {
  startMission(scene, ms, combat, police, ms.index);
}
