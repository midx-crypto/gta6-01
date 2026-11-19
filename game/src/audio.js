// Aruna Bay — audio: all sounds are synthesized with WebAudio oscillators
// and noise buffers. No audio files, no network. Created lazily on the first
// user gesture so browsers allow it.

export function createAudio() {
  return {
    ctx: null,
    master: null,
    engineOsc: null,
    engineGain: null,
    sirenOsc: null,
    sirenGain: null,
    muted: false,
    started: false,
  };
}

export function ensureAudio(audio) {
  if (audio.started) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    // engine hum: low sawtooth whose pitch follows speed
    audio.engineOsc = audio.ctx.createOscillator();
    audio.engineOsc.type = 'sawtooth';
    audio.engineOsc.frequency.value = 55;
    audio.engineGain = audio.ctx.createGain();
    audio.engineGain.gain.value = 0;
    const engineFilter = audio.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 320;
    audio.engineOsc.connect(engineFilter);
    engineFilter.connect(audio.engineGain);
    audio.engineGain.connect(audio.master);
    audio.engineOsc.start();
    // police siren: two-tone triangle, slow LFO between the tones
    audio.sirenOsc = audio.ctx.createOscillator();
    audio.sirenOsc.type = 'triangle';
    audio.sirenOsc.frequency.value = 700;
    audio.sirenGain = audio.ctx.createGain();
    audio.sirenGain.gain.value = 0;
    audio.sirenOsc.connect(audio.sirenGain);
    audio.sirenGain.connect(audio.master);
    audio.sirenOsc.start();
    audio.started = true;
  } catch {
    audio.started = false;
  }
}

function noiseBuffer(ctx, seconds) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function playGunshot(audio) {
  if (!audio.started || audio.muted) return;
  const ctx = audio.ctx;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.18);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.9, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  src.start();
}

export function playBlip(audio, freq, seconds = 0.12, type = 'sine', volume = 0.4) {
  if (!audio.started || audio.muted) return;
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + seconds);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

export function playMissionComplete(audio) {
  if (!audio.started) return;
  playBlip(audio, 523, 0.14);
  setTimeout(() => playBlip(audio, 659, 0.14), 130);
  setTimeout(() => playBlip(audio, 784, 0.22), 260);
}

export function playMissionFail(audio) {
  if (!audio.started) return;
  playBlip(audio, 330, 0.2, 'sawtooth', 0.25);
  setTimeout(() => playBlip(audio, 220, 0.3, 'sawtooth', 0.25), 180);
}

// Mute / unmute everything (M key is missions; use U for mute).
export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
  return audio.muted;
}

// Per-frame: engine pitch follows speed, siren wails while wanted.
export function updateAudio(audio, speedKmh, wanted, dt) {
  if (!audio.started) return;
  const target = speedKmh > 1 ? 0.05 + Math.min(0.12, speedKmh / 900) : 0;
  audio.engineGain.gain.setTargetAtTime(target, audio.ctx.currentTime, 0.1);
  audio.engineOsc.frequency.setTargetAtTime(55 + speedKmh * 1.6, audio.ctx.currentTime, 0.1);
  if (wanted > 0) {
    audio.sirenGain.gain.setTargetAtTime(0.05, audio.ctx.currentTime, 0.2);
    const t = audio.ctx.currentTime;
    audio.sirenOsc.frequency.setTargetAtTime(700 + Math.sin(t * 3.2) * 220, t, 0.05);
  } else {
    audio.sirenGain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.2);
  }
}
