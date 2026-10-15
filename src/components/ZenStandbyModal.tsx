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
} from 'lucide-react';

interface ZenStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type AmbientSoundType = 'none' | 'clock' | 'river' | 'fireplace' | 'rain' | 'waves';

export const ZenStandbyModal: React.FC<ZenStandbyModalProps> = ({ isOpen, onClose }) => {
  const { tasks, updateTask, toggleTaskComplete, selectedDate } = useTask();

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
  const [theme, setTheme] = useState<'obsidian' | 'emerald' | 'amber' | 'indigo'>('obsidian');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);

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

        // Periodic crackles for wood fire
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

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  // Time formatting (pad zero)
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getThemeGradient = () => {
    switch (theme) {
      case 'emerald':
        return 'from-emerald-950 via-zinc-950 to-black text-emerald-400';
      case 'amber':
        return 'from-amber-950 via-zinc-950 to-black text-amber-400';
      case 'indigo':
        return 'from-indigo-950 via-zinc-950 to-black text-indigo-400';
      default:
        return 'from-zinc-950 via-black to-zinc-950 text-white';
    }
  };

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
      className={`fixed inset-0 z-[100] bg-gradient-to-b ${getThemeGradient()} flex flex-col justify-between p-4 sm:p-8 select-none transition-colors duration-700 overflow-hidden`}
      dir="rtl"
    >
      {/* 1. TOP BAR: STATUS & TOOLS */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-zinc-200">
            میز کار رومیزی و تمرکز عمیق (Zen Mode)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
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
              className={`p-1.5 px-3 rounded-2xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeSound !== 'none'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-black/50 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="انتخاب صدای محیطی آرامش‌بخش"
            >
              {activeSound === 'none' ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />}
              <span className="text-[11px] font-bold">
                {soundOptions.find((s) => s.id === activeSound)?.label || 'صدا'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {soundMenuOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95">
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
              const themes: Array<'obsidian' | 'emerald' | 'amber' | 'indigo'> = ['obsidian', 'emerald', 'amber', 'indigo'];
              const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[nextIndex]);
              sounds.playPop();
            }}
            className="p-2 rounded-2xl bg-black/50 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="تغییر تم رنگی"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-black/50 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="حالت تمام صفحه"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-2 rounded-2xl bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 text-zinc-300 border border-white/10 transition-all cursor-pointer"
            title="خروج از حالت ذن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTERPIECE: 16:9 DESK CLOCK & TIMER CONTROLS */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col landscape:flex-row items-center justify-center gap-6 sm:gap-14 my-auto z-10 py-4">
        
        {/* Left Side (or Top on Portrait): THE DIGITAL DESK CLOCK */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            dir="ltr"
            className="font-mono font-black tracking-wider text-5xl sm:text-7xl md:text-8xl lg:text-9xl drop-shadow-[0_0_35px_rgba(255,255,255,0.18)] flex items-baseline justify-center select-all whitespace-nowrap tabular-nums leading-none"
          >
            <span className="w-[1.25ch] text-center inline-block">{hours}</span>
            <span className="opacity-70 animate-pulse mx-1">:</span>
            <span className="w-[1.25ch] text-center inline-block">{minutes}</span>
            <span className="text-3xl sm:text-5xl md:text-6xl text-zinc-400/80 font-normal ml-2">
              <span className="opacity-50">:</span>
              <span className="w-[1.25ch] text-center inline-block">{seconds}</span>
            </span>
          </div>

          <div className="mt-3 text-xs sm:text-sm font-bold text-zinc-400 flex items-center gap-2">
            <span>ساعت رسمی ایران</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            <span className="text-zinc-500 font-mono">
              {currentTime.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        {/* Divider for Landscape Mode */}
        <div className="hidden landscape:block w-px h-64 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Right Side: POMODORO TIMER & STEPPERS */}
        <div className="flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl w-full max-w-sm space-y-4">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>تایمر تمرکز عمیق (Focus Timer)</span>
          </div>

          {/* Stepper + Timer Digits Display */}
          <div className="flex items-center justify-center gap-3 w-full" dir="ltr">
            {/* -5 Minutes Button */}
            <button
              type="button"
              onClick={() => handleAdjustTimer(-5)}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-200 font-mono font-bold text-xs transition-all cursor-pointer active:scale-95"
              title="کاهش ۵ دقیقه"
            >
              -۵د
            </button>

            {/* Countdown Digits */}
            <div className="font-mono font-black text-4xl sm:text-5xl text-white tracking-wider tabular-nums px-3 py-1 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
              {timerMin}:{timerSec}
            </div>

            {/* +5 Minutes Button */}
            <button
              type="button"
              onClick={() => handleAdjustTimer(+5)}
              className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-200 font-mono font-bold text-xs transition-all cursor-pointer active:scale-95"
              title="افزایش ۵ دقیقه"
            >
              +۵د
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center justify-between w-full pt-1 px-1">
            <span className="text-[10px] text-zinc-500 font-bold">زمان‌های آماده:</span>
            <div className="flex items-center gap-1">
              {[15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsRunning(false);
                    setInitialSeconds(mins * 60);
                    setTimerSeconds(mins * 60);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    initialSeconds === mins * 60 ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {toPersianDigits(mins)}د
                </button>
              ))}
            </div>
          </div>

          {/* Main Controls (Play / Pause / Reset) */}
          <div className="flex items-center gap-2.5 w-full pt-1">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsRunning(!isRunning);
              }}
              className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/40'
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
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-all cursor-pointer"
              title="شروع مجدد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR: ACTIVE TASK & DIRECT FOCUS SYNC */}
      <div className="w-full max-w-xl mx-auto z-20 shrink-0">
        {currentTask ? (
          <div className="p-3 sm:p-4 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
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
                <div className="text-xs sm:text-sm font-black text-white truncate">{currentTask.title}</div>
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
                  <span>ثبت {toPersianDigits(Math.max(1, Math.round(elapsedFocusSeconds / 60)))} دقیقه تمرکز</span>
                </button>
              )}

              {isSavedNotice && (
                <span className="text-[11px] text-emerald-400 font-bold animate-in fade-in">
                  ✓ در تسک ذخیره شد
                </span>
              )}

              {/* Quick switch task */}
              {activeTasks.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      setSelectedTaskId(e.target.value);
                      sounds.playPop();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-zinc-300 outline-none cursor-pointer"
                  >
                    {activeTasks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 text-center rounded-2xl bg-black/40 border border-white/10 text-xs text-zinc-400">
            برای ثبت هوشمند دقایق تمرکز، یک تسک فعال در امروز ایجاد نمایید.
          </div>
        )}
      </div>
    </div>
  );
};
