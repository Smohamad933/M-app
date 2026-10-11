/**
 * Web Audio API ambient sound generator & audio stream player for Pomodoro Focus Rooms.
 * Supports 3 built-in ambient synthesis tracks + custom external audio URLs.
 * 100% reliable, zero external network dependency for presets, works offline in PWA and APK.
 */

export interface FocusTrack {
  id: string;
  title: string;
  artist: string;
  type: 'lofi' | 'alpha' | 'rain' | 'custom';
  url?: string;
  tag: string;
}

export const DEFAULT_FOCUS_TRACKS: FocusTrack[] = [
  {
    id: 'track-lofi',
    title: 'بیت‌های ملایم لوفای (Cozy Lofi Study)',
    artist: 'رادیو تمرکز عمیق بگ تایم',
    type: 'lofi',
    tag: 'لوفای 🎵',
  },
  {
    id: 'track-alpha',
    title: 'امواج آلفا ۵۲۸ هرتز (Deep Focus Alpha Waves)',
    artist: 'فرکانس تقویت تمرکز و یادگیری',
    type: 'alpha',
    tag: 'امواج مغزی 🧘',
  },
  {
    id: 'track-rain',
    title: 'صدای باران ملایم و کافه آرام (Peaceful Rain)',
    artist: 'طبیعت و وایت‌نویز تمرکز',
    type: 'rain',
    tag: 'صدای طبیعت 🌧️',
  },
];

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: FocusTrack = DEFAULT_FOCUS_TRACKS[0];
  private isPlaying = false;
  private volume = 0.6;
  private masterGain: GainNode | null = null;
  private timerId: any = null;
  private activeNodes: any[] = [];
  private customAudio: HTMLAudioElement | null = null;
  private listeners: Set<(playing: boolean, track: FocusTrack, vol: number) => void> = new Set();

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public subscribe(cb: (playing: boolean, track: FocusTrack, vol: number) => void) {
    this.listeners.add(cb);
    cb(this.isPlaying, this.currentTrack, this.volume);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isPlaying, this.currentTrack, this.volume));
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
    this.notify();
  }

  public getVolume() {
    return this.volume;
  }

  public getCurrentTrack() {
    return this.currentTrack;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public setTrack(track: FocusTrack) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.currentTrack = track;
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public play() {
    this.initContext();
    if (this.isPlaying) this.stop();

    this.isPlaying = true;

    if (this.currentTrack.type === 'custom' && this.currentTrack.url) {
      try {
        if (!this.customAudio) {
          this.customAudio = new Audio();
          this.customAudio.loop = true;
        }
        this.customAudio.src = this.currentTrack.url;
        this.customAudio.volume = this.volume;
        this.customAudio.play().catch(() => {});
      } catch {}
    } else if (this.currentTrack.type === 'alpha') {
      this.startAlphaWaves();
    } else if (this.currentTrack.type === 'rain') {
      this.startRainSound();
    } else {
      this.startLofiSynthesis();
    }

    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
    }
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
    this.notify();
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  /** Ambient Binaural Alpha Drone (528Hz Harmonic) */
  private startAlphaWaves() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const baseFreq = 528;
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(baseFreq, now);

    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(baseFreq + 10, now); // 10Hz alpha difference

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq / 4, now); // Warm bass foundation

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, now);

    oscL.connect(filter);
    oscR.connect(filter);
    subOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscL.start();
    oscR.start();
    subOsc.start();

    this.activeNodes.push(oscL, oscR, subOsc, filter, gainNode);
  }

  /** Ambient Rainfall & Pink Noise Filter Sweep */
  private startRainSound() {
    if (!this.ctx || !this.masterGain) return;

    // Buffer of pink-ish noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, gain);
  }

  /** Cozy Lofi Rhodes chords & warm vinyl pulse */
  private startLofiSynthesis() {
    if (!this.ctx || !this.masterGain) return;

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.ctx || !this.isPlaying || !this.masterGain) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      const now = this.ctx.currentTime;
      notes.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 4);
      });
    };

    playNextChord();
    this.timerId = setInterval(playNextChord, 4000);
  }
}

export const focusAudio = new FocusAudioEngine();
