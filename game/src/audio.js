// WebAudio sound: engine hum, sirens, rotor, gunshots and the radio music.
// Everything is synthesized, no audio files. The context starts on the first
// user gesture, so headless play-tests stay silent but error-free.
import { RADIO_STATIONS } from './radio.js';

let ctx = null;
let master = null;
let muted = false;
let engineOsc = null;
let engineGain = null;
let engineFilter = null;
let sirenOscA = null;
let sirenOscB = null;
let sirenGain = null;
let rotorSrc = null;
let rotorGain = null;
let radioTimer = null;
let radioStep = 0;
let radioStation = 0;
let radioOn = true;

function noiseBuffer(seconds) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return true;
  } catch { return false; }
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}
export function isMuted() { return muted; }

export function engineSound(speed01, active) {
  if (!ctx || muted) return;
  try {
    if (!engineOsc) {
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 700;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
    }
    engineOsc.frequency.value = 55 + speed01 * 165;
    engineFilter.frequency.value = 420 + speed01 * 1600;
    engineGain.gain.value = active ? 0.045 + speed01 * 0.05 : 0.0;
  } catch { /* audio is best-effort */ }
}

export function sirenSound(active) {
  if (!ctx || muted) return;
  try {
    if (!sirenOscA) {
      sirenOscA = ctx.createOscillator(); sirenOscA.type = 'sine'; sirenOscA.frequency.value = 720;
      sirenOscB = ctx.createOscillator(); sirenOscB.type = 'sine'; sirenOscB.frequency.value = 960;
      sirenGain = ctx.createGain(); sirenGain.gain.value = 0;
      sirenOscA.connect(sirenGain); sirenOscB.connect(sirenGain); sirenGain.connect(master);
      sirenOscA.start(); sirenOscB.start();
    }
    const t = ctx.currentTime;
    sirenGain.gain.setTargetAtTime(active ? 0.035 : 0, t, 0.2);
    if (active) {
      sirenOscA.frequency.setTargetAtTime(720 + 180 * Math.sin(t * 4), t, 0.05);
      sirenOscB.frequency.setTargetAtTime(960 - 180 * Math.sin(t * 4), t, 0.05);
    }
  } catch { /* best-effort */ }
}

export function rotorSound(active) {
  if (!ctx || muted) return;
  try {
    if (!rotorSrc) {
      rotorSrc = ctx.createBufferSource();
      rotorSrc.buffer = noiseBuffer(1);
      rotorSrc.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 320;
      rotorGain = ctx.createGain(); rotorGain.gain.value = 0;
      rotorSrc.connect(filter); filter.connect(rotorGain); rotorGain.connect(master);
      rotorSrc.start();
    }
    rotorGain.gain.setTargetAtTime(active ? 0.06 : 0, ctx.currentTime, 0.3);
  } catch { /* best-effort */ }
}

export function gunshotSound(kind) {
  if (!ctx || muted) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(kind === 'shotgun' ? 0.28 : 0.12);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(kind === 'shotgun' ? 0.5 : 0.32, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === 'shotgun' ? 0.28 : 0.12));
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start();
  } catch { /* best-effort */ }
}

// Radio sequencer: one step per beat, lead note from the station pattern
// plus a bass note every four steps. Called once per frame from main.js.
export function startRadio(stationIndex) {
  radioStation = stationIndex;
  radioStep = 0;
  if (radioTimer) { clearInterval(radioTimer); radioTimer = null; }
  if (!ensureAudio() || !radioOn) return;
  const station = RADIO_STATIONS[stationIndex % RADIO_STATIONS.length];
  const stepMs = 60000 / station.tempo / 2;
  radioTimer = setInterval(() => {
    if (muted || !radioOn || !ctx) return;
    try {
      const step = radioStep;
      radioStep += 1;
      const note = station.pattern[step % station.pattern.length];
      if (note >= 0) playNote(station.scale[note % station.scale.length] * 2, stepMs / 1000 * 0.9, 'square', 0.05);
      if (step % 4 === 0) playNote(station.bass[(step / 4) % station.bass.length], stepMs / 1000 * 1.8, 'triangle', 0.09);
      if (step % 8 === 4) playNote(station.scale[0] * 4, stepMs / 1000 * 0.4, 'sine', 0.03);
    } catch { /* best-effort */ }
  }, stepMs);
}

function playNote(freq, seconds, type, volume) {
  const osc = ctx.createOscillator();
  osc.type = type; osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(gain); gain.connect(master);
  osc.start(); osc.stop(ctx.currentTime + seconds);
}

export function setRadioStation(index) {
  radioStation = index;
  startRadio(index);
}
export function setRadioOn(value) {
  radioOn = value;
  if (!value && radioTimer) { clearInterval(radioTimer); radioTimer = null; }
  else if (value) startRadio(radioStation);
}
export function pickupSound() {
  if (!ctx || muted) return;
  try {
    playNote(880, 0.12, 'sine', 0.12);
    setTimeout(() => { try { playNote(1318.5, 0.18, 'sine', 0.12); } catch {} }, 90);
  } catch { /* best-effort */ }
}
export function crashSound(strength) {
  if (!ctx || muted) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.3);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.5, 0.1 + strength * 0.2), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    src.connect(filter); filter.connect(gain); gain.connect(master);
    src.start();
  } catch { /* best-effort */ }
}
export function missionJingleSound() {
  if (!ctx || muted) return;
  try {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => { try { playNote(freq, 0.25, 'triangle', 0.12); } catch {} }, i * 120);
    });
  } catch { /* best-effort */ }
}
