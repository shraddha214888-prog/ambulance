class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;
  private lastSpokenDistance: number = 0;
  private lastSpokenTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * High-priority acoustic pre-alert chime (2 distinct melodic pings with resonant reverb tail)
   * Designed to grab the driver's attention before siren frequency is acoustically audible.
   */
  public playPreAlertChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Primary tone
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // E6

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Second harmonic confirmation ping
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.14); // A6
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.26);

      gain2.gain.setValueAtTime(0.001, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.55);
    } catch {
      // AudioContext could fail gracefully if backgrounded
    }
  }

  /**
   * Spoken synthetic navigation advisory
   */
  public speakAlert(text: string, distanceMeters?: number) {
    if (this.isMuted || !this.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    // Throttle voice alerts to prevent speech queue buildup
    if (now - this.lastSpokenTime < 4500) {
      return;
    }

    if (distanceMeters !== undefined) {
      if (Math.abs(distanceMeters - this.lastSpokenDistance) < 70 && now - this.lastSpokenTime < 10000) {
        return;
      }
      this.lastSpokenDistance = distanceMeters;
    }

    this.lastSpokenTime = now;
    window.speechSynthesis.cancel(); // Cancel stale queued phrases

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.08;
    utterance.pitch = 1.05;
    utterance.volume = 0.85;

    // Pick crisp English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Optional siren tone synthesis for ambulance cockpit preview
   */
  public startSiren(mode: 'wail' | 'yelp' | 'hi_lo' = 'wail') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;
      if (this.sirenOscillator) return; // Already running

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

      // Low pass filter to soften the harshness of sawtooth wave
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      const startTime = this.audioCtx.currentTime;
      let step = 0;

      if (mode === 'yelp') {
        // Fast modulating siren
        const cycle = 0.35;
        for (let i = 0; i < 40; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(650, t);
          osc.frequency.linearRampToValueAtTime(1300, t + cycle * 0.7);
          osc.frequency.linearRampToValueAtTime(650, t + cycle);
        }
      } else if (mode === 'hi_lo') {
        // European 2-tone
        const cycle = 0.6;
        for (let i = 0; i < 30; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.setValueAtTime(600, t + cycle * 0.5);
        }
      } else {
        // Classic wail
        const cycle = 1.8;
        for (let i = 0; i < 20; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.linearRampToValueAtTime(1100, t + cycle * 0.5);
          osc.frequency.linearRampToValueAtTime(500, t + cycle);
        }
      }

      osc.start(startTime);
      this.sirenOscillator = osc;
      this.sirenGain = gain;
    } catch {
      // AudioContext fallback
    }
  }

  public stopSiren() {
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {
        // Ignore stop error
      }
      this.sirenOscillator = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {
        // Ignore
      }
      this.sirenGain = null;
    }
    if (this.sirenTimer) {
      window.clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
  }
}

export const audioAlertService = new AudioAlertService();
