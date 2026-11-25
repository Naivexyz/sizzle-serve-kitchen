// audio.js — a tiny WebAudio sound bank. Every sound is synthesised from
// oscillators and filtered noise, so the game ships no audio files at all.
// The context is created lazily on the first user gesture (browsers refuse
// sound before one) and every method is a no-op while muted or unavailable.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Call from any click or keypress: creates/resumes the context once.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) this.ctx = new Ctor();
  }

  tone(freq, seconds, { type = 'sine', gain = 0.12, delay = 0, slideTo = null } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noiseBurst(seconds, { gain = 0.05, delay = 0, freq = 3000 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(this.ctx.destination);
    src.start(t0);
  }

  click()  { this.tone(660, 0.06, { type: 'triangle', gain: 0.08 }); }
  pop()    { this.tone(320, 0.09, { type: 'sine', gain: 0.12, slideTo: 540 }); }
  sizzle() { this.noiseBurst(0.35, { gain: 0.035, freq: 3800 }); }
  ready()  { this.tone(880, 0.1, { type: 'sine', gain: 0.1 }); this.tone(1318, 0.14, { delay: 0.09, gain: 0.1 }); }
  coin()   { this.tone(988, 0.09, { type: 'square', gain: 0.05 }); this.tone(1319, 0.16, { type: 'square', gain: 0.05, delay: 0.08 }); }
  perfect() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.12, { gain: 0.07, delay: i * 0.06 })); }
  buzz()   { this.tone(160, 0.22, { type: 'sawtooth', gain: 0.07, slideTo: 110 }); }
  alarm()  { this.tone(1180, 0.12, { type: 'square', gain: 0.05 }); this.tone(1180, 0.12, { type: 'square', gain: 0.05, delay: 0.16 }); }
  thud()   { this.tone(120, 0.12, { type: 'sine', gain: 0.14, slideTo: 60 }); }
}
