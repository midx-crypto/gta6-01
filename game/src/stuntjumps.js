// Stunt jumps: the three ramps of Pulau Bara, air-time scoring and the
// all-time best jumps board (kept in the save).
import { RAMPS, STUNT_MONEY_PER_SECOND } from './config.js';

export const RAMP_LIST = RAMPS;

export function nearestRamp(state, maxDist) {
  let best = null; let bestD = maxDist;
  for (const r of RAMPS) {
    const d = Math.hypot(state.player.x - r.x, state.player.z - r.z);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

export function stuntReward(airTime) {
  const points = Math.round(airTime * 100);
  const money = Math.round(airTime * STUNT_MONEY_PER_SECOND);
  return { points, money };
}

export function recordStunt(state, airTime) {
  const reward = stuntReward(airTime);
  state.airScore += reward.points;
  state.money += reward.money;
  state.stats.stunts += 1;
  if (!state.flags.bestStunt || airTime > state.flags.bestStunt) state.flags.bestStunt = airTime;
  state.message = 'STUNT JUMP! ' + airTime.toFixed(1) + ' detik di udara: +' + reward.points + ' poin, +$' + reward.money;
  state.messageTimer = 3;
  return reward;
}

export function bestStuntSeconds(state) {
  return state.flags.bestStunt || 0;
}

// Ramp approach helper: points the objective arrow at the nearest ramp.
export function rampObjective(state) {
  const ramp = nearestRamp(state, 500);
  if (!ramp) return null;
  return { text: ramp.name, x: ramp.x, z: ramp.z, kind: 'stunt' };
}
