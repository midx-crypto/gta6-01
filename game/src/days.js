// Day cards: the three-day story arc to the Festival Bahari, shown as a
// full-screen card when a new day begins.
export const DAY_INTROS = [
  {
    day: 1, title: 'HARI 1 — KEDATANGAN',
    text: 'Mira tiba di Pulau Bara. Tiga hari menuju Festival Bahari — dan dana festival itu dikorupsi. Pak Hendra punya rencana.',
  },
  {
    day: 2, title: 'HARI 2 — PERSIAPAN',
    text: 'Kru makin solid. Komisaris Ratna mulai mencium bau rencana. Hari ini: uang, senjata, dan jalan kabur.',
  },
  {
    day: 3, title: 'HARI 3 — FESTIVAL BAHARI',
    text: 'Hari H. Brankas Bank Bara menyimpan dana festival yang dicuri. Malam ini, kru mengambil kembali apa yang jadi hak rakyat.',
  },
];

export function dayIntro(day) {
  return DAY_INTROS.find((d) => d.day === day) || DAY_INTROS[0];
}

export function showDayCard(state, day) {
  state.day = day;
  state.mode = 'daycard';
  state.dayCardTimer = 4;
}

export function updateDayCard(state, dt) {
  state.dayCardTimer -= dt;
  if (state.dayCardTimer <= 0) {
    state.mode = 'play';
    const next = state.missionIndex;
    if (state.missionIndex < 12 && !state.missionActive) startMissionFromDays(state, next);
  }
}

// Imported lazily through the missions module to avoid a cycle at load time.
import { startMission } from './missions.js';
function startMissionFromDays(state, index) { startMission(state, index); }

// Day-card helpers: what the card shows and when the next mission opens.
export function dayCardText(day) {
  const intro = dayIntro(day);
  return intro.title + ' — ' + intro.text;
}
export function isFinalDay(state) { return state.day >= 3; }
