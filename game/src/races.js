// Street races vs Doni: five checkpoints around the Pantai ring. Doni's
// car follows the same checkpoints; first to the last one wins.
import { addRespect, respectForRaceWin } from './respect.js';

const RACE_POINTS = [
  { x: -90, z: -300 },
  { x: -140, z: -380 },
  { x: -40, z: -400 },
  { x: 60, z: -380 },
  { x: 120, z: -320 },
  { x: 60, z: -280 },
  { x: -90, z: -300 },
];

export function startRace(state) {
  state.race = {
    checkpoints: RACE_POINTS,
    index: 0,
    rivalIndex: 0,
    rivalX: -86, rivalZ: -296,
    rivalAngle: 0,
    rivalSpeed: 15,
    finished: false,
    won: false,
    time: 0,
  };
  state.objective = { text: 'Balapan! Lewati semua checkpoint', x: RACE_POINTS[0].x, z: RACE_POINTS[0].z, kind: 'race' };
  state.message = 'BALAPAN! Kalahkan Doni — 7 checkpoint.';
  state.messageTimer = 3;
  return state.race;
}

export function updateRace(state, dt) {
  const race = state.race;
  if (!race || race.finished) return;
  race.time += dt;
  const cp = race.checkpoints[race.index];
  const d = Math.hypot(state.player.x - cp.x, state.player.z - cp.z);
  if (d < 9) {
    race.index += 1;
    if (race.index >= race.checkpoints.length) {
      finishRace(state, true);
      return;
    }
    const next = race.checkpoints[race.index];
    state.objective = { text: 'Checkpoint ' + (race.index + 1) + '/' + race.checkpoints.length, x: next.x, z: next.z, kind: 'race' };
  }
  const rcp = race.checkpoints[race.rivalIndex];
  const rdx = rcp.x - race.rivalX;
  const rdz = rcp.z - race.rivalZ;
  const rd = Math.hypot(rdx, rdz);
  if (rd < 9) {
    race.rivalIndex += 1;
    if (race.rivalIndex >= race.checkpoints.length) {
      finishRace(state, false);
      return;
    }
  } else {
    const wantAngle = Math.atan2(rdx, rdz);
    let diff = wantAngle - race.rivalAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    race.rivalAngle += Math.max(-2 * dt, Math.min(2 * dt, diff));
    race.rivalX += Math.sin(race.rivalAngle) * race.rivalSpeed * dt;
    race.rivalZ += Math.cos(race.rivalAngle) * race.rivalSpeed * dt;
  }
}

function finishRace(state, won) {
  const race = state.race;
  race.finished = true;
  race.won = won;
  state.flags.raceWon = won;
  state.flags.raceJustFinished = true;
  if (won) {
    state.money += 300;
    addRespect(state, respectForRaceWin());
    state.stats.racesWon += 1;
    state.message = 'MENANG! +$300, +40 respect. Doni mengakui kamu.';
    state.messageTimer = 4;
  } else {
    state.message = 'Doni menang. Coba lagi — latihan bikin sempurna.';
    state.messageTimer = 4;
  }
  state.race = null;
}

// Doni's rival car mesh position, for the renderer and minimap.
export function rivalPosition(state) {
  if (!state.race) return null;
  return { x: state.race.rivalX, z: state.race.rivalZ, angle: state.race.rivalAngle };
}
export function raceCheckpoint(state) {
  if (!state.race) return null;
  return state.race.checkpoints[state.race.index];
}
