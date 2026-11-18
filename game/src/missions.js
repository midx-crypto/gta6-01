// Solara Nights — missions.js
// The story arc: three jobs for Raka, given by Sari and Bayu, tracked with a
// live objective marker, progress text and cash rewards.

import { MISSIONS, CFG } from './config.js';
import { spawnGuards } from './pedestrians.js';

export function currentMission(S) {
  if (S.missionIdx >= MISSIONS.length) return null;
  return MISSIONS[S.missionIdx];
}

export function missionObjective(S) {
  const m = currentMission(S);
  return m ? m.objective : null;
}

export function startMission(S, idx) {
  S.missionIdx = idx;
  S.missionKills = 0;
  const m = MISSIONS[idx];
  if (!m) return;
  S.message = `Misi ${idx + 1}: ${m.title} — ${m.brief}`;
  S.msgT = 6;
  if (m.objective.type === 'eliminate') {
    spawnGuards(S, m.objective.count, 1000, 1000);
  }
}

export function updateMissions(S, dt) {
  const m = currentMission(S);
  if (!m) return;
  const p = S.player;
  const obj = m.objective;
  if (obj.type === 'goto') {
    if (Math.hypot(p.x - obj.x, p.y - obj.y) < 70) completeMission(S);
  } else if (obj.type === 'deliver') {
    if (p.inCar && Math.hypot(p.x - obj.x, p.y - obj.y) < 80) completeMission(S);
  } else if (obj.type === 'eliminate') {
    if (S.missionKills >= obj.count) {
      if (Math.hypot(p.x - obj.x, p.y - obj.y) < 80) completeMission(S);
    }
  }
  void dt;
}

export function completeMission(S) {
  const m = currentMission(S);
  if (!m) return;
  S.player.money += m.reward;
  S.audio.missionDone();
  S.message = `Misi selesai: ${m.title}! +$${m.reward}`;
  S.msgT = 4;
  S.missionIdx += 1;
  if (S.missionIdx >= MISSIONS.length) {
    S.state = 'done';
    S.wanted = 0;
    saveProgress(S);
    return;
  }
  startMission(S, S.missionIdx);
}

export function missionProgressText(S) {
  const m = currentMission(S);
  if (!m) return 'Semua misi selesai! Solara milikmu, Raka.';
  const obj = m.objective;
  if (obj.type === 'eliminate') {
    return `${m.title}: lumpuhkan penjaga ${S.missionKills}/${obj.count}, lalu ke ${obj.label}`;
  }
  if (obj.type === 'deliver') {
    return S.player.inCar
      ? `${m.title}: antar mobil ke ${obj.label}`
      : `${m.title}: curi mobil dulu (E), lalu antar ke ${obj.label}`;
  }
  return `${m.title}: pergi ke ${obj.label}`;
}

export function saveProgress(S) {
  try {
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({
      missionIdx: S.missionIdx,
      money: S.player.money,
      hp: S.player.hp,
      x: S.player.x,
      y: S.player.y,
      savedAt: Date.now(),
    }));
  } catch {
    // Storage unavailable (private mode): progress simply is not saved.
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(CFG.SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(CFG.SAVE_KEY);
  } catch {
    // Nothing to clear.
  }
}
