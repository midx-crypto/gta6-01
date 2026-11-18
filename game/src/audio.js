// Solara Nights — audio.js
// All sound is synthesized with the WebAudio API (oscillators only, no audio
// assets). Engine hum, gunshots, sirens, pickups and UI blips.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    sirenTimer: 0,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, vol, slideTo) {
      if (this.muted) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    shot() {
      this.tone(220, 0.12, 'square', 0.16, 55);
    },
    pickup() {
      this.tone(660, 0.09, 'sine', 0.12);
      setTimeout(() => this.tone(880, 0.12, 'sine', 0.12), 70);
    },
    missionDone() {
      this.tone(523, 0.14, 'triangle', 0.14);
      setTimeout(() => this.tone(659, 0.14, 'triangle', 0.14), 120);
      setTimeout(() => this.tone(784, 0.22, 'triangle', 0.14), 240);
    },
    crash() {
      this.tone(90, 0.25, 'sawtooth', 0.18, 40);
    },
    busted() {
      this.tone(440, 0.4, 'sawtooth', 0.14, 220);
    },
    click() {
      this.tone(700, 0.05, 'sine', 0.08);
    },
    horn() {
      this.tone(330, 0.18, 'square', 0.1);
      setTimeout(() => this.tone(415, 0.18, 'square', 0.1), 30);
    },
    siren(dt) {
      if (this.muted) return;
      this.sirenTimer -= dt;
      if (this.sirenTimer <= 0) {
        this.sirenTimer = 0.9;
        this.tone(750, 0.42, 'sine', 0.045, 1050);
        setTimeout(() => this.tone(1050, 0.42, 'sine', 0.045, 750), 450);
      }
    },
  };
  return audio;
}
