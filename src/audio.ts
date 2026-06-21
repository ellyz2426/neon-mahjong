// Neon Mahjong VR - Procedural Audio Manager

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicPlaying = false;

  masterVol = 1.0;
  sfxVol = 1.0;
  musicVol = 0.5;

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.15;
      this.musicGain.connect(this.masterGain);
    } catch { /* no audio */ }
  }

  private ensureCtx(): boolean {
    if (!this.ctx || !this.sfxGain) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  updateVolumes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.masterVol;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVol;
    if (this.musicGain) this.musicGain.gain.value = this.musicVol * 0.15;
  }

  // ── SFX ───────────────────────────────────────────────────
  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3): void {
    if (!this.ensureCtx()) return;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start();
    osc.stop(this.ctx!.currentTime + dur);
  }

  playSelect(): void {
    this.playTone(800, 0.1, 'sine', 0.2);
  }

  playDeselect(): void {
    this.playTone(400, 0.08, 'sine', 0.15);
  }

  playMatch(): void {
    this.playTone(523, 0.15, 'sine', 0.25);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.25), 80);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.3), 160);
  }

  playCombo(level: number): void {
    const baseFreq = 523 + (level - 1) * 50;
    this.playTone(baseFreq, 0.12, 'square', 0.15);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.12, 'square', 0.15), 60);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.15, 'square', 0.2), 120);
  }

  playInvalid(): void {
    this.playTone(200, 0.15, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(180, 0.15, 'sawtooth', 0.15), 100);
  }

  playHint(): void {
    this.playTone(600, 0.1, 'triangle', 0.2);
    setTimeout(() => this.playTone(800, 0.15, 'triangle', 0.2), 100);
  }

  playShuffle(): void {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(300 + Math.random() * 400, 0.05, 'sine', 0.1), i * 40);
    }
  }

  playWin(): void {
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.25), i * 120);
    });
  }

  playLose(): void {
    const notes = [440, 392, 349, 311];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.4, 'sawtooth', 0.15), i * 200);
    });
  }

  playAchievement(): void {
    this.playTone(880, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(1047, 0.15, 'sine', 0.25), 100);
    setTimeout(() => this.playTone(1319, 0.2, 'sine', 0.3), 200);
  }

  playClick(): void {
    this.playTone(600, 0.05, 'sine', 0.15);
  }

  playCountdown(): void {
    this.playTone(440, 0.2, 'square', 0.2);
  }

  playCountdownGo(): void {
    this.playTone(880, 0.4, 'sine', 0.3);
  }

  // ── Ambient music ─────────────────────────────────────────
  private musicChordIdx = 0;
  private static CHORD_PROGRESSION = [
    [130.81, 164.81, 196.00, 246.94], // C3 major
    [110.00, 138.59, 164.81, 220.00], // Am
    [146.83, 174.61, 220.00, 293.66], // Dm
    [130.81, 164.81, 196.00, 261.63], // C3 (higher voicing)
    [116.54, 146.83, 174.61, 233.08], // Bb
    [98.00, 123.47, 146.83, 196.00],  // G (lower)
  ];

  startMusic(): void {
    if (!this.ensureCtx() || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicChordIdx = 0;
    this.playAmbientLoop();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicOsc) {
      try { this.musicOsc.stop(); } catch { /* ignore */ }
      this.musicOsc = null;
    }
  }

  private playAmbientLoop(): void {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

    const chords = AudioManager.CHORD_PROGRESSION;
    const notes = chords[this.musicChordIdx % chords.length];
    this.musicChordIdx++;

    // Each chord plays for ~5s with volume envelope
    for (const freq of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.5);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 3.5);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 5);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 5);
    }

    // Add subtle high pad on every other chord
    if (this.musicChordIdx % 2 === 0) {
      const padFreq = notes[notes.length - 1] * 2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = padFreq;
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 2);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 5);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 5);
    }

    // Loop
    setTimeout(() => this.playAmbientLoop(), 4500);
  }
}
