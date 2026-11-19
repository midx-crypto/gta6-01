// Save / load: localStorage keeps money, respect, day, missions, owned-car
// upgrades, weapons and collected coins. Live traffic and police never save.
import { SAVE_KEY } from './config.js';
import { snapshotForSave } from './state.js';
import { applyCollectedCoins } from './collectibles.js';

export function saveGame(state) {
  try {
    const data = snapshotForSave(state);
    data.coinsCollected = state.flags.coinsCollected || [];
    data.savedAt = new Date().toISOString();
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function hasSave() {
  try { return window.localStorage.getItem(SAVE_KEY) !== null; } catch { return false; }
}

export function loadGame(state) {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.money = data.money ?? 250;
    state.respect = data.respect ?? 0;
    state.day = data.day ?? 1;
    state.missionIndex = data.missionIndex ?? 0;
    state.health = data.health ?? 100;
    state.radioStation = data.radioStation ?? 0;
    state.stats = { ...state.stats, ...(data.stats || {}) };
    if (Array.isArray(data.owned)) {
      data.owned.forEach((saved, i) => {
        if (state.owned[i]) Object.assign(state.owned[i], saved);
      });
    }
    state.activeOwned = data.activeOwned ?? 0;
    if (data.weapons) {
      for (const id of Object.keys(data.weapons)) {
        if (state.weapons[id]) Object.assign(state.weapons[id], data.weapons[id]);
      }
    }
    state.currentWeapon = data.currentWeapon || 'pistol';
    applyCollectedCoins(state, data.coinsCollected || []);
    state.maxHealth = 100 + (state.owned[state.activeOwned]?.armor || 0) * 25;
    return true;
  } catch { return false; }
}

export function clearSave() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
