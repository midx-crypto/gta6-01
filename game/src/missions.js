// The story: 12 missions over 3 days to the Festival Bahari. Mira, getaway
// driver, with Pak Hendra, Lila, Doni and Komisaris Ratna. Each mission is a
// list of steps; the engine advances them and pays out on completion.
import { MISSION_MONEY, MISSION_RESPECT } from './config.js';
import { spawnEnemy } from './combat.js';
import { missionJingleSound } from './audio.js';
import { startRace } from './races.js';
import { startTaxiJob } from './jobs.js';

export const MISSIONS = [
  { id: 1, day: 1, title: 'Kenalan dengan Kota', difficulty: 'easy', briefing: 'Pak Hendra menunggumu di garasi. Datang dan kenalan dengan kru.', steps: [{ type: 'goto', x: -190, z: 140, radius: 6, text: 'Temui Pak Hendra di garasi' }] },
  { id: 2, day: 1, title: 'Antar Paket Lila', difficulty: 'easy', briefing: 'Lila punya 3 paket untuk diantar ke seluruh kota. Jangan sampai telat.', steps: [
    { type: 'goto', x: 20, z: -100, radius: 6, text: 'Antar paket 1/3: Balai Kota' },
    { type: 'goto', x: -160, z: 40, radius: 6, text: 'Antar paket 2/3: Pasar Malam' },
    { type: 'goto', x: 235, z: 100, radius: 6, text: 'Antar paket 3/3: Dermaga 7' },
  ] },
  { id: 3, day: 1, title: 'Balapan Pertama', difficulty: 'medium', briefing: 'Doni menantangmu balapan di Pantai. Kalahkan dia dan buktikan kamu pembalap tercepat.', steps: [{ type: 'race', x: -90, z: -300, radius: 8, text: 'Kalahkan Doni di balapan jalanan' }] },
  { id: 4, day: 1, title: 'Maling Mobil', difficulty: 'medium', briefing: 'Kru butuh mobil cepat. Curi satu dari jalanan, lalu lolos dari polisi.', steps: [
    { type: 'steal', x: -114, z: -120, radius: 6, text: 'Curi mobil yang terparkir' },
    { type: 'escape', x: -228, z: 188, radius: 8, text: 'Lolos dari polisi, kembali ke safehouse' },
  ] },
  { id: 5, day: 2, title: 'Taksi Kilat', difficulty: 'medium', briefing: 'Tiga penumpang menunggu taksi di Menara. Antar semuanya sebelum waktu habis.', steps: [{ type: 'jobtaxi', x: 20, z: -120, radius: 8, text: 'Antar 3 penumpang taksi', time: 180 }] },
  { id: 6, day: 2, title: 'Gudang Pelabuhan', difficulty: 'hard', briefing: 'Geng Dermaga menahan kiriman Lila. Bersihkan gudang itu.', steps: [{ type: 'kill', x: 210, z: -40, radius: 10, count: 6, text: 'Habisi 6 penjaga gudang' }] },
  { id: 7, day: 2, title: 'Rampok Truk Uang', difficulty: 'hard', briefing: 'Truk uang festival lewat Pelabuhan. Kejar, rampok, dan kabur.', steps: [
    { type: 'goto', x: 200, z: 40, radius: 8, text: 'Kejar truk uang di Pelabuhan' },
    { type: 'kill', x: 200, z: 40, radius: 12, count: 4, text: 'Habisi pengawal truk' },
    { type: 'goto', x: -228, z: 188, radius: 8, text: 'Bawa uangnya ke safehouse' },
  ] },
  { id: 8, day: 2, title: 'Kabur dari Razia', difficulty: 'hard', briefing: 'Komisaris Ratna menggelar razia besar. Wanted 4 — kabur dan hilangkan jejakmu.', steps: [{ type: 'escape', x: 90, z: -380, radius: 10, text: 'Kabur ke Viewpoint Bukit dan hilangkan wanted', wanted: 4 }] },
  { id: 9, day: 3, title: 'Rencana Heist', difficulty: 'medium', briefing: 'Hari festival. Kumpulkan 3 peralatan heist: kunci brankas, jammer, dan topeng.', steps: [
    { type: 'goto', x: -190, z: 140, radius: 6, text: 'Ambil kunci brankas di garasi' },
    { type: 'goto', x: -100, z: -20, radius: 6, text: 'Ambil jammer dari Lila di Kafe Senja' },
    { type: 'goto', x: -160, z: 40, radius: 6, text: 'Ambil topeng di Pasar Malam' },
  ] },
  { id: 10, day: 3, title: 'Masuk ke Balai Kota', difficulty: 'hard', briefing: 'Masuk ke Balai Kota lewat Plaza Menara. Polisi menjaga ketat.', steps: [
    { type: 'kill', x: 60, z: -120, radius: 12, count: 8, text: 'Habisi 8 penjaga Plaza Menara' },
    { type: 'goto', x: 20, z: -100, radius: 6, text: 'Masuk ke Balai Kota' },
  ] },
  { id: 11, day: 3, title: 'Brankas Festival', difficulty: 'hard', briefing: 'Dana festival ada di brankas Bank Bara. Bobol sebelum alarm berbunyi.', steps: [{ type: 'kill', x: 80, z: -60, radius: 12, count: 5, text: 'Habisi 5 penjaga Bank Bara', time: 150 }, { type: 'goto', x: 80, z: -60, radius: 5, text: 'Bobol brankas festival' }] },
  { id: 12, day: 3, title: 'Pelarian Terakhir', difficulty: 'finale', briefing: 'Dana festival di tangan. Wanted 5, helikopter di atas. Lari ke Bukit — lompat dan hilang!', steps: [
    { type: 'escape', x: 120, z: -220, radius: 10, text: 'Melintasi Jembatan Bara dengan wanted 5', wanted: 5 },
    { type: 'stunt', x: 90, z: -330, radius: 8, text: 'Lompat dari ramp Bukit untuk kabur' },
    { type: 'goto', x: 90, z: -380, radius: 10, text: 'Sampai di Viewpoint Bukit — kamu bebas!' },
  ] },
];

export function missionByIndex(index) { return MISSIONS[index] || null; }

export function startMission(state, index) {
  const mission = MISSIONS[index];
  if (!mission) return false;
  state.mission = mission;
  state.missionIndex = index;
  state.missionStep = 0;
  state.missionActive = true;
  state.missionTimer = 0;
  state.mode = 'play';
  state.day = mission.day;
  state.flags.missionKills = 0;
  applyStep(state);
  state.message = 'MISI ' + mission.id + ': ' + mission.title;
  state.messageTimer = 4;
  return true;
}

function applyStep(state) {
  const step = state.mission.steps[state.missionStep];
  if (!step) return;
  state.objective = { text: step.text, x: step.x, z: step.z, kind: step.type };
  if (state.markers.beacon) { state.markers.beacon.position.set(step.x, 0.2, step.z); }
  if (state.markers.beam) { state.markers.beam.position.set(step.x, 30, step.z); }
  if (step.type === 'kill') {
    for (let i = 0; i < step.count; i += 1) {
      spawnEnemy(state, step.x + (Math.random() - 0.5) * 18, step.z + (Math.random() - 0.5) * 18, 100);
    }
    state.flags.stepKills = 0;
    state.flags.stepTotal = step.count;
  }
  if (step.type === 'escape' && step.wanted) {
    state.wanted = Math.max(state.wanted, step.wanted);
  }
  if (step.type === 'race') startRace(state);
  if (step.type === 'stunt') state.flags.stuntsBefore = state.stats.stunts;
  if (step.type === 'jobtaxi') {
    state.flags.taxiDone = false;
    state.flags.taxiFailed = false;
    startTaxiJob(state, 3);
  }
  if (step.time) state.missionTimer = step.time;
}

// Mission engine: advance steps, pay out, and move to the next day.
export function updateMission(state, dt) {
  if (!state.missionActive || !state.mission) return;
  const step = state.mission.steps[state.missionStep];
  if (!step) { completeMission(state); return; }
  if (step.time) {
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) { failMission(state, 'Waktu habis!'); return; }
  }
  const d = Math.hypot(state.player.x - step.x, state.player.z - step.z);
  if (step.type === 'goto' || step.type === 'drive') {
    if (d < step.radius) advanceStep(state);
  } else if (step.type === 'kill') {
    const alive = state.enemies.filter((e) => e.alive).length;
    if (alive === 0 && state.flags.stepTotal > 0) advanceStep(state);
  } else if (step.type === 'steal') {
    if (!state.player.onFoot) advanceStep(state);
  } else if (step.type === 'escape') {
    if (state.wanted === 0 && d < step.radius) advanceStep(state);
    else if (state.wanted === 0 && step.wanted) {
      state.objective = { text: step.text, x: step.x, z: step.z, kind: step.type };
      if (d < step.radius) advanceStep(state);
    }
  } else if (step.type === 'stunt') {
    if (state.stats.stunts > (state.flags.stuntsBefore || 0)) advanceStep(state);
  } else if (step.type === 'race') {
    if (!state.race) {
      if (state.flags.raceWon) advanceStep(state);
      else failMission(state, 'Doni memenangkan balapan.');
    }
  } else if (step.type === 'jobtaxi') {
    if (!state.job && state.flags.taxiDone) advanceStep(state);
    else if (!state.job && state.flags.taxiFailed) failMission(state, 'Job taksi gagal.');
  }
}

function advanceStep(state) {
  state.missionStep += 1;
  if (state.missionStep >= state.mission.steps.length) { completeMission(state); return; }
  applyStep(state);
  state.message = state.objective.text;
  state.messageTimer = 3;
}

export function completeMission(state) {
  const mission = state.mission;
  const money = MISSION_MONEY[mission.difficulty] || 150;
  const respect = MISSION_RESPECT[mission.difficulty] || 25;
  state.money += money;
  state.respect += respect;
  missionJingleSound();
  state.missionActive = false;
  state.mission = null;
  state.flags.lastReward = { money, respect, title: mission.title };
  state.mode = 'missiondone';
  state.objective = { text: 'Misi selesai! Pilih misi berikutnya di menu.', x: state.player.x, z: state.player.z, kind: 'goto' };
  const nextIndex = state.missionIndex + 1;
  if (nextIndex < MISSIONS.length) {
    const next = MISSIONS[nextIndex];
    if (next.day !== mission.day) state.flags.pendingDay = next.day;
  } else {
    state.flags.gameComplete = true;
  }
}

export function failMission(state, reason) {
  state.missionActive = false;
  state.mission = null;
  state.mode = 'missionfail';
  state.flags.failReason = reason;
}

export function startNextMission(state) {
  const nextIndex = state.missionIndex + 1;
  if (nextIndex >= MISSIONS.length) return false;
  if (state.flags.pendingDay) {
    const day = state.flags.pendingDay;
    state.flags.pendingDay = 0;
    state.missionIndex = nextIndex;
    import('./days.js').then((days) => days.showDayCard(state, day));
    return true;
  }
  return startMission(state, nextIndex);
}

export function retryMission(state) {
  return startMission(state, state.missionIndex);
}
