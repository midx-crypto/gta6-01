// Respect: the progression ladder. Earn it from missions, jobs, races,
// stunts and coins; ranks gate the best garage upgrades and the finale.
import { RESPECT_RANKS, respectRank } from './config.js';

export function addRespect(state, points) {
  const before = respectRank(state.respect);
  state.respect += points;
  const after = respectRank(state.respect);
  if (after.name !== before.name) {
    state.message = 'RANK NAIK: ' + after.name + '! Upgrade baru terbuka di garasi.';
    state.messageTimer = 4;
  }
  return after;
}

export function rankName(state) { return respectRank(state.respect).name; }

export function progressToNextRank(state) {
  const current = respectRank(state.respect);
  const idx = RESPECT_RANKS.indexOf(current);
  if (idx >= RESPECT_RANKS.length - 1) return { current: current.name, next: null, progress: 1 };
  const next = RESPECT_RANKS[idx + 1];
  const progress = (state.respect - current.min) / (next.min - current.min);
  return { current: current.name, next: next.name, need: next.min - state.respect, progress };
}

export function respectForKill() { return 2; }
export function respectForJob() { return 10; }
export function respectForRaceWin() { return 40; }

// Respect needed before the finale unlocks (shown on the mission menu).
export function respectNeededForFinale() { return 150; }
export function canStartFinale(state) { return state.respect >= respectNeededForFinale(); }
