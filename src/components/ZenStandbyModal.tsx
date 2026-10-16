import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  CloudRain,
  Wind,
  Sparkles,
  CheckCircle2,
  Check,
  ChevronDown,
  Palette,
  Clock,
  Droplets,
  Flame,
  Calendar,
  Smartphone,
} from 'lucide-react';

interface ZenStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AmbientSoundType = 'none' | 'clock' | 'river' | 'fireplace' | 'rain' | 'waves';

export const ZenStandbyModal: React.FC<ZenStandbyModalProps> = ({ isOpen, onClose }) => {
  const { tasks, updateTask, toggleTaskComplete, selectedDate } = useTask();

  const containerRef = useRef<HTMLDivElement>(null);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Focus Timer state
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState(0);

  // Ambience & Theme
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('none');
  const [theme, setTheme] = useState<'emerald' | 'obsidian' | 'amber' | 'indigo'>('emerald');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [isPortraitOnMobile, setIsPortraitOnMobile] = useState(false);

  // Active task selection
  const todayISO = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter((t) => (t.date === (selectedDate || todayISO)) && !t.completed);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || tasks[0]?.id || '');

  // Web Audio Context for native sound generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const crackleIntervalRef = useRef<number | null>(null);

  // Update clock every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Check orientation on mobile
  useEffect(() => {
    if (!isOpen) return;
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitOnMobile(isMobile && isPortrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isOpen]);

  // Handle countdown timer & elapsed focus tracking
  useEffect(() => {
    if (!isRunning || !isOpen) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          sounds.playComplete();
          setSessionCount((c) => c + 1);
          return 0;
        }
        return prev - 1;
      });
      setElapsedFocusSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isOpen]);

  // Clean all sound generators
  const stopAllSounds = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (crackleIntervalRef.current) {
      clearInterval(crackleIntervalRef.current);
      crackleIntervalRef.current = null;
    }
    if (ambientNodeRef.current) {
      try {
        (ambientNodeRef.current as any).stop?.();
        (ambientNodeRef.current as any).disconnect?.();
      } catch {}
      ambientNodeRef.current = null;
    }
  };

  // Handle ambient sound synthesis using Web Audio API
  useEffect(() => {
    if (!isOpen || activeSound === 'none') {
      stopAllSounds();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopAllSounds();

      // 1. MECHANICAL CLOCK TICK-TOCK
      if (activeSound === 'clock') {
        let isTick = true;
        const playTick = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(isTick ? 1400 : 950, ctx.currentTime);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.035);
          isTick = !isTick;
        };
        playTick();
        tickIntervalRef.current = window.setInterval(playTick, 1000);
        return;
      }

      // 2. CONTINUOUS NOISE GENERATORS (Rain, River, Waves, Fireplace)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
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

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (activeSound === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
      } else if (activeSound === 'river') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
      } else if (activeSound === 'waves') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.6, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
      } else if (activeSound === 'fireplace') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);

        const playCrackle = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const osc = ctx.createOscillator();
          const cGain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(250 + Math.random() * 800, ctx.currentTime);
          cGain.gain.setValueAtTime(0.04 + Math.random() * 0.05, ctx.currentTime);
          cGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02 + Math.random() * 0.03);
          osc.connect(cGain);
          cGain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.06);
        };
        crackleIntervalRef.current = window.setInterval(playCrackle, 350);
      }

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start();

      ambientNodeRef.current = noiseSource;
    } catch (e) {
      console.warn('Audio synthesis unavailable', e);
    }

    return () => {
      stopAllSounds();
    };
  }, [activeSound, isOpen]);

  // Fullscreen & Orientation Listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  // Time formatting
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  const timerMin = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const timerSec = (timerSeconds % 60).toString().padStart(2, '0');

  // Adjust timer by +/- 5 minutes
  const handleAdjustTimer = (deltaMinutes: number) => {
    sounds.playPop();
    const newSeconds = Math.max(60, timerSeconds + deltaMinutes * 60);
    setTimerSeconds(newSeconds);
    if (!isRunning) {
      setInitialSeconds(newSeconds);
    }
  };

  // Sync / Save elapsed focus minutes to selected task
  const handleSaveFocusToTask = () => {
    if (!currentTask || elapsedFocusSeconds < 30) return;
    const spentMinutes = Math.max(1, Math.round(elapsedFocusSeconds / 60));
    sounds.playComplete();
    updateTask({
      ...currentTask,
      focusMinutesSpent: (currentTask.focusMinutesSpent || 0) + spentMinutes,
    });
    setElapsedFocusSeconds(0);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Toggle Fullscreen with Landscape Lock for Mobile
  const toggleFullscreen = async () => {
    sounds.playPop();
    try {
      if (!document.fullscreenElement) {
        const elem = containerRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Lock to landscape on mobile devices supporting Screen Orientation API
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            console.log('Orientation lock unavailable or denied:', e);
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);

        if (screen.orientation && screen.orientation.unlock) {
          try {
            screen.orientation.unlock();
          } catch {}
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  const handleClose = () => {
    sounds.playPop();
    if (document.fullscreenElement) {
      try {
        document.exitFullscreen?.();
      } catch {}
    }
    if (screen.orientation && screen.orientation.unlock) {
      try {
        screen.orientation.unlock();
      } catch {}
    }
    onClose();
  };

  // Dynamic Theme Configs with 2 Moving Blurred Blobs
  const getThemeConfig = () => {
    switch (theme) {
      case 'emerald':
        return {
          bg: 'bg-[#03130d]',
          blob1: 'bg-emerald-500/40',
          blob2: 'bg-teal-400/35',
          accent: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60',
          pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'amber':
        return {
          bg: 'bg-[#150a02]',
          blob1: 'bg-amber-500/40',
          blob2: 'bg-orange-500/35',
          accent: 'text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60',
          pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'indigo':
        return {
          bg: 'bg-[#09061a]',
          blob1: 'bg-indigo-500/40',
          blob2: 'bg-purple-500/35',
          accent: 'text-indigo-400',
          button: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60',
          pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      default: // obsidian
        return {
          bg: 'bg-[#05070d]',
          blob1: 'bg-blue-600/35',
          blob2: 'bg-violet-600/35',
          accent: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/60',
          pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
    }
  };

  const currentTheme = getThemeConfig();

  const soundOptions = [
    { id: 'none' as const, label: 'خاموش', icon: VolumeX },
    { id: 'clock' as const, label: 'تیک‌تاک آنتیک', icon: Clock },
    { id: 'river' as const, label: 'جویبار آب', icon: Droplets },
    { id: 'fireplace' as const, label: 'آتش شومینه', icon: Flame },
    { id: 'rain' as const, label: 'باران آرام', icon: CloudRain },
    { id: 'waves' as const, label: 'امواج اقیانوس', icon: Wind },
  ];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] ${currentTheme.bg} text-white flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none transition-colors duration-700 overflow-hidden w-full h-full`}
      dir="rtl"
    >
      {/* CSS KEYFRAMES FOR THE 2 SMOOTH BLURRED FLOATING MESH BLOBS */}
      <style>{`
        @keyframes zenBlobOne {
          0% {
            transform: translate(-10%, -10%) scale(1) rotate(0deg);
          }
          30% {
            transform: translate(25vw, 15vh) scale(1.3) rotate(60deg);
          }
          60% {
            transform: translate(-10vw, 30vh) scale(0.9) rotate(120deg);
          }
          100% {
            transform: translate(15vw, -5vh) scale(1.15) rotate(180deg);
          }
        }

        @keyframes zenBlobTwo {
          0% {
            transform: translate(15%, 20%) scale(1.1) rotate(0deg);
          }
          30% {
            transform: translate(-25vw, -20vh) scale(0.85) rotate(-60deg);
          }
          60% {
            transform: translate(20vw, -25vh) scale(1.25) rotate(-120deg);
          }
          100% {
            transform: translate(-15vw, 20vh) scale(1) rotate(-180deg);
          }
        }

        .zen-blob-1 {
          animation: zenBlobOne 22s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
        }

        .zen-blob-2 {
          animation: zenBlobTwo 28s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
        }
      `}</style>

      {/* 2 LIVING ANIMATED BLURRED MESH BLOBS FLOATING BEHIND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute top-1/4 right-1/4 w-[42vw] h-[42vw] max-w-[650px] max-h-[650px] min-w-[280px] min-h-[280px] rounded-full blur-[100px] sm:blur-[140px] opacity-75 zen-blob-1 ${currentTheme.blob1}`}
        />
        <div
          className={`absolute bottom-1/4 left-1/4 w-[46vw] h-[46vw] max-w-[700px] max-h-[700px] min-w-[300px] min-h-[300px] rounded-full blur-[110px] sm:blur-[150px] opacity-75 zen-blob-2 ${currentTheme.blob2}`}
        />
      </div>

      {/* 1. TOP BAR: STATUS, AUDIO & SCREEN CONTROLS */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,199,89,0.8)]" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-zinc-100">
            میز کار رومیزی (Zen StandBy)
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono font-bold border border-white/10">
            نوبت {toPersianDigits(sessionCount)}
          </span>
        </div>

        {/* Ambient Sound Selector & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSoundMenuOpen(!soundMenuOpen)}
              className={`p-1.5 px-3 rounded-2xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer backdrop-blur-md ${
                activeSound !== 'none'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg'
                  : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
              }`}
              title="انتخاب صدای محیطی آرامش‌بخش"
            >
              {activeSound === 'none' ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              )}
              <span className="text-[11px] font-bold">
                {soundOptions.find((s) => s.id === activeSound)?.label || 'صدا'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {soundMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-black/80 border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 border-b border-white/10">
                  اصوات آرامش‌بخش رومیزی:
                </div>
                {soundOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = activeSound === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setActiveSound(opt.id);
                        setSoundMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => {
              const themes: Array<'emerald' | 'obsidian' | 'amber' | 'indigo'> = [
                'emerald',
                'obsidian',
                'amber',
                'indigo',
              ];
              const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[nextIndex]);
              sounds.playPop();
            }}
            className="p-2 rounded-2xl bg-black/40 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            title="تغییر پالت رنگی هاله متحرک"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle (Rotates to Landscape on Mobile) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
              isFullscreen
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="حالت تمام صفحه و چرخش افقی"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 text-zinc-300 border border-white/10 transition-all cursor-pointer backdrop-blur-md"
            title="خروج از حالت ذن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTERPIECE: 16:9 APPLE STANDBY CLOCK & FOCUS TIMER */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col landscape:flex-row items-stretch justify-center gap-5 sm:gap-8 lg:gap-10 my-auto z-10 py-3 sm:py-6">
        {/* RIGHT SIDE (IN RTL): THE DIGITAL APPLE STANDBY CLOCK */}
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 lg:p-12 rounded-[36px] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex-1 w-full min-h-[300px] sm:min-h-[360px] lg:min-h-[400px]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* LTR Digital Clock Numbers with Glow - Balanced Apple Standby Layout */}
          <div
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
            className="flex items-center justify-center select-none w-full tabular-nums my-auto"
          >
            {/* Hours */}
            <span className="font-mono font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.25)] leading-none inline-block">
              {toPersianDigits(hours)}
            </span>

            {/* Blinking Colon with Theme Accent */}
            <span className={`font-mono font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl ${currentTheme.accent} animate-pulse mx-2 sm:mx-3 lg:mx-4 leading-none inline-block drop-shadow-[0_0_20px_currentColor] opacity-90`}>
              :
            </span>

            {/* Minutes */}
            <span className="font-mono font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.25)] leading-none inline-block">
              {toPersianDigits(minutes)}
            </span>

            {/* Seconds Frosted Pill Badge */}
            <div className="ml-2.5 sm:ml-4 lg:ml-5 flex flex-col items-start justify-center">
              <div className={`px-2 sm:px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-0.5 ${currentTheme.accent} font-mono font-bold text-xs sm:text-sm md:text-base tabular-nums shadow-sm`}>
                <span className="opacity-50 text-[10px] sm:text-xs">:</span>
                <span>{toPersianDigits(seconds)}</span>
              </div>
            </div>
          </div>

          {/* Persian Date Capsule */}
          <div className="mt-5 sm:mt-6 px-4 sm:px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-300 shadow-sm">
            <Calendar className={`w-4 h-4 ${currentTheme.accent}`} />
            <span className="font-sans">
              {currentTime.toLocaleDateString('fa-IR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* LEFT SIDE (IN RTL): FOCUS TIMER CONTROLS */}
        <div className="flex flex-col items-center justify-between p-6 sm:p-8 lg:p-10 rounded-[36px] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl flex-1 w-full min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black tracking-wide text-zinc-200">
                تایمر تمرکز عمیق (Focus Timer)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono font-bold">
              جلسه {toPersianDigits(sessionCount)}
            </span>
          </div>

          {/* Countdown Display with Steppers */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-5 w-full my-auto" dir="ltr">
            <button
              type="button"
              onClick={() => handleAdjustTimer(-5)}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center border border-white/10 shadow-sm cursor-pointer"
              title="کاهش ۵ دقیقه"
            >
              -۵د
            </button>

            <div
              style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
              className="font-mono font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-widest tabular-nums px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner drop-shadow-md select-none"
            >
              {toPersianDigits(timerMin)}:{toPersianDigits(timerSec)}
            </div>

            <button
              type="button"
              onClick={() => handleAdjustTimer(+5)}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center border border-white/10 shadow-sm cursor-pointer"
              title="افزایش ۵ دقیقه"
            >
              +۵د
            </button>
          </div>

          {/* Preset Pills */}
          <div className="flex items-center justify-between w-full pt-1">
            <span className="text-[11px] text-zinc-400 font-bold">زمان‌های آماده:</span>
            <div className="flex items-center gap-1.5">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsRunning(false);
                    setInitialSeconds(mins * 60);
                    setTimerSeconds(mins * 60);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    initialSeconds === mins * 60
                      ? 'bg-white/20 text-white border border-white/30 shadow-xs'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {toPersianDigits(mins)}د
                </button>
              ))}
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-3 w-full pt-1">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsRunning(!isRunning);
              }}
              className={`flex-1 py-3 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl active:scale-95 ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : currentTheme.button
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'توقف موقت' : 'شروع تمرکز'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsRunning(false);
                setTimerSeconds(initialSeconds);
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
              title="شروع مجدد تایمر"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR: DYNAMIC ISLAND TASK CAPSULE */}
      <div className="w-full max-w-xl mx-auto z-20 shrink-0">
        {currentTask ? (
          <div className="p-3 sm:p-4 rounded-3xl bg-black/50 border border-white/15 backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  sounds.playComplete();
                  toggleTaskComplete(currentTask.id);
                }}
                className="w-7 h-7 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
                title="تکمیل تسک"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-emerald-400">تسک متصل به تایمر تمرکز:</div>
                <div className="text-xs sm:text-sm font-black text-white truncate">
                  {currentTask.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {elapsedFocusSeconds >= 30 && (
                <button
                  type="button"
                  onClick={handleSaveFocusToTask}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ثبت {toPersianDigits(Math.max(1, Math.round(elapsedFocusSeconds / 60)))} دقیقه</span>
                </button>
              )}

              {isSavedNotice && (
                <span className="text-[11px] text-emerald-400 font-bold animate-in fade-in">
                  ✓ در تسک ذخیره شد
                </span>
              )}

              {/* Task Switcher */}
              {activeTasks.length > 1 && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    sounds.playPop();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-zinc-300 outline-none cursor-pointer max-w-[130px] truncate"
                >
                  {activeTasks.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                      {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 text-center rounded-2xl bg-black/40 border border-white/10 text-xs text-zinc-400 backdrop-blur-md">
            برای ثبت هوشمند دقایق تمرکز، یک تسک فعال در امروز ایجاد نمایید.
          </div>
        )}

        {/* Subtle Orientation Hint for Mobile Portrait */}
        {isPortraitOnMobile && (
          <div className="mt-2 text-center text-[11px] font-bold text-zinc-400/80 flex items-center justify-center gap-1.5 animate-pulse">
            <Smartphone className="w-3.5 h-3.5 rotate-90" />
            <span>برای تجربه کامل ساعت رومیزی ۱۶:۹، گوشی را افقی بگیرید</span>
          </div>
        )}
      </div>
    </div>
  );
};
