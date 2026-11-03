// 8-Bit Web Audio API Chiptune Synthesizer (Zero external assets needed)

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.step = 0;
    this.tempo = 148; // BPM
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    }
    return this.enabled;
  }

  playTone(freq, type, duration, vol = 0.12, slideTo = null, delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration, vol = 0.1, delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Soft 8-bit ball tap/juggle sound
  playKick(pitchOffset = 0) {
    const base = 170 + pitchOffset * 25;
    this.playTone(base, 'triangle', 0.06, 0.14, base * 1.6);
  }

  // Referee kickoff whistle
  playWhistle() {
    this.playTone(2600, 'square', 0.08, 0.1, 2750, 0);
    this.playTone(2750, 'square', 0.25, 0.12, 2650, 0.09);
  }

  // Coin / Trophy pickup
  playCoin(combo = 0) {
    const boost = Math.min(combo, 8) * 45;
    this.playTone(987.77 + boost, 'square', 0.07, 0.1);
    this.playTone(1318.51 + boost, 'square', 0.18, 0.12, null, 0.06);
  }

  // Near miss "OLÉ!" chime
  playNearMiss() {
    this.playTone(587.33, 'square', 0.06, 0.1);
    this.playTone(880.0, 'square', 0.06, 0.1, null, 0.06);
    this.playTone(1174.66, 'square', 0.14, 0.12, null, 0.12);
  }

  // Golden Ball / Fever pickup
  playPowerup() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 'square', 0.08, 0.11, null, idx * 0.055);
    });
  }

  // Speed Level Up
  playSpeedUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.playTone(n, 'triangle', 0.09, 0.14, null, idx * 0.065);
    });
  }

  // Tackle hit / Lose life
  playDamage() {
    this.playNoise(0.22, 0.2);
    this.playTone(240, 'sawtooth', 0.25, 0.15, 70);
  }

  // Game Over long whistle + retro descend
  playGameOver() {
    this.stopBGM();
    this.playTone(2650, 'square', 0.12, 0.1, 2700, 0);
    this.playTone(2650, 'square', 0.12, 0.1, 2700, 0.15);
    this.playTone(2700, 'square', 0.45, 0.12, 2400, 0.30);

    const sad = [392.0, 369.99, 349.23, 329.63];
    sad.forEach((freq, i) => {
      this.playTone(freq, 'square', 0.22, 0.09, null, 0.8 + i * 0.2);
    });
  }

  // Upbeat 8-bit chiptune loop
  startBGM() {
    if (!this.enabled) return;
    this.init();
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.step = 0;

    // Energetic arcade melody (16-step phrases)
    const melody = [
      659.25, 0, 783.99, 880.0, 659.25, 0, 587.33, 523.25,
      587.33, 659.25, 783.99, 659.25, 587.33, 0, 493.88, 0,
      659.25, 0, 783.99, 880.0, 1046.5, 0, 987.77, 880.0,
      783.99, 659.25, 587.33, 659.25, 523.25, 0, 523.25, 0
    ];

    const bass = [
      164.81, 164.81, 220.0, 220.0, 146.83, 146.83, 196.0, 196.0,
      130.81, 130.81, 164.81, 164.81, 146.83, 146.83, 196.0, 196.0,
      164.81, 164.81, 220.0, 220.0, 174.61, 174.61, 220.0, 220.0,
      196.0, 196.0, 146.83, 146.83, 130.81, 196.0, 130.81, 0
    ];

    const tick = () => {
      if (!this.bgmPlaying || !this.enabled) return;

      const stepDur = (60 / this.tempo) / 2; // 8th notes
      const mNote = melody[this.step % melody.length];
      const bNote = bass[this.step % bass.length];

      if (mNote > 0) {
        this.playTone(mNote, 'square', stepDur * 0.75, 0.045);
      }
      if (bNote > 0) {
        this.playTone(bNote, 'triangle', stepDur * 0.85, 0.065);
      }
      // Subtle hi-hat noise every off-beat
      if (this.step % 2 === 1) {
        this.playNoise(0.03, 0.02);
      }

      this.step++;
      this.bgmTimer = setTimeout(tick, stepDur * 1000);
    };

    tick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.retroAudio = new RetroAudio();
