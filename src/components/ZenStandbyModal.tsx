import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Flame,
  Sparkles,
  CloudRain,
  Wind,
  Plus,
  Minus,
  Save,
  Check,
} from 'lucide-react';

interface ZenStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AmbientSoundType = 'none' | 'rain' | 'waves' | 'cafe' | 'forest';

export const ZenStandbyModal: React.FC<ZenStandbyModalProps> = ({ isOpen, onClose }) => {
  const { tasks, toggleTaskComplete, updateTask, selectedDate } = useTask();

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Focus Timer (in seconds)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [elapsedFocusSeconds, setElapsedFocusSeconds] = useState(0);

  // Ambience & Theme
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('none');
  const [theme, setTheme] = useState<'obsidian' | 'emerald' | 'amber' | 'indigo'>('obsidian');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Active task selection
  const todayISO = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter((t) => (t.date === (selectedDate || todayISO)) && !t.completed);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || tasks[0]?.id || '');

  // Web Audio Context for native sound generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);

  // Update clock every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Pomodoro countdown & elapsed focus counter
  useEffect(() => {
    if (!isRunning || !isOpen) return;
    const interval = setInterval(() => {
      setElapsedFocusSeconds((prev) => prev + 1);
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          sounds.playComplete();
          setIsRunning(false);
          setSessionCount((s) => s + 1);
          try {
            confetti({
              particleCount: 70,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isOpen]);

  // Handle ambient sound synthesis using Web Audio API
  useEffect(() => {
    if (!isOpen || activeSound === 'none') {
      if (ambientNodeRef.current) {
        try {
          (ambientNodeRef.current as any).stop?.();
          (ambientNodeRef.current as any).disconnect?.();
        } catch {}
        ambientNodeRef.current = null;
      }
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

      if (ambientNodeRef.current) {
        try {
          (ambientNodeRef.current as any).stop?.();
          (ambientNodeRef.current as any).disconnect?.();
        } catch {}
      }

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

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (activeSound === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      } else if (activeSound === 'waves') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      ambientNodeRef.current = whiteNoise;
    } catch (e) {
      console.warn('Audio synthesis unavailable', e);
    }

    return () => {
      if (ambientNodeRef.current) {
        try {
          (ambientNodeRef.current as any).stop?.();
          (ambientNodeRef.current as any).disconnect?.();
        } catch {}
        ambientNodeRef.current = null;
      }
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
  const timerProgress = initialSeconds > 0 ? ((initialSeconds - timerSeconds) / initialSeconds) * 100 : 0;

  // Time adjusters
  const addFiveMinutes = () => {
    sounds.playPop();
    setTimerSeconds((prev) => prev + 300);
    setInitialSeconds((prev) => prev + 300);
  };

  const subtractFiveMinutes = () => {
    sounds.playPop();
    setTimerSeconds((prev) => Math.max(prev - 300, 60));
    setInitialSeconds((prev) => Math.max(prev - 300, 60));
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
      try {
        document.documentElement.requestFullscreen?.().catch(() => {});
        (window.screen?.orientation as any)?.lock?.('landscape').catch(() => {});
      } catch {}
      setIsFullscreen(true);
    } else {
      try {
        document.exitFullscreen?.().catch(() => {});
      } catch {}
      setIsFullscreen(false);
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'emerald':
        return 'from-[#02100a] via-[#051c14] to-[#010805] text-emerald-400 border-emerald-900/40';
      case 'amber':
        return 'from-[#140b02] via-[#211404] to-[#0a0501] text-amber-400 border-amber-900/40';
      case 'indigo':
        return 'from-[#060918] via-[#0d1330] to-[#03050c] text-indigo-400 border-indigo-900/40';
      default:
        return 'from-[#05070a] via-[#090d14] to-[#020305] text-white border-white/10';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between p-3 sm:p-6 bg-gradient-to-b ${getThemeClass()} select-none transition-colors duration-700 overflow-hidden font-sans`}
      dir="rtl"
    >
      {/* 1. TOP CONTROLS BAR */}
      <div className="flex items-center justify-between w-full z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-wide text-zinc-200">
            حالت رومیزی و تمرکز ذهن
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
            نوبت {toPersianDigits(sessionCount)}
          </span>
        </div>

        {/* Ambient Sound Selector & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Presets */}
          <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setActiveSound(activeSound === 'rain' ? 'none' : 'rain')}
              className={`p-1.5 px-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
                activeSound === 'rain' ? 'bg-sky-500/30 text-sky-300 border border-sky-400/30' : 'text-zinc-400 hover:text-white'
              }`}
              title="صدای باران"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">باران</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSound(activeSound === 'waves' ? 'none' : 'waves')}
              className={`p-1.5 px-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
                activeSound === 'waves' ? 'bg-teal-500/30 text-teal-300 border border-teal-400/30' : 'text-zinc-400 hover:text-white'
              }`}
              title="صدای امواج و باد"
            >
              <Wind className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">امواج</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSound('none')}
              className={`p-1.5 rounded-xl text-xs transition-all ${
                activeSound === 'none' ? 'text-zinc-500' : 'text-amber-400'
              }`}
              title="قطع صدا"
            >
              {activeSound === 'none' ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => {
              const themes: Array<'obsidian' | 'emerald' | 'amber' | 'indigo'> = ['obsidian', 'emerald', 'amber', 'indigo'];
              const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
              setTheme(themes[nextIndex]);
            }}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
            title="تغییر تم"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Fullscreen / 16:9 Landscape Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
            title="حالت تمام‌صفحه ۱۶:۹ افقی"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-2xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
            title="خروج"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER STAGE: RESPONSIVE 16:9 / WIDESCREEN DESK CLOCK & TIMER */}
      <div className="my-auto py-2 flex flex-col landscape:flex-row items-center justify-center gap-6 sm:gap-10 z-10 w-full max-w-4xl mx-auto">
        {/* Giant Digital Clock (STRICT LTR, ZERO WEIRD WRAPPING) */}
        <div className="text-center flex flex-col items-center justify-center">
          <div
            dir="ltr"
            className="flex items-baseline justify-center gap-1.5 sm:gap-3 font-mono font-black text-white/95 select-none drop-shadow-[0_0_50px_rgba(255,255,255,0.18)]"
          >
            <span className="text-5xl sm:text-7xl md:text-8xl tracking-tight">
              {toPersianDigits(hours)}
            </span>
            <span className="text-3xl sm:text-5xl md:text-6xl text-zinc-500 animate-pulse">:</span>
            <span className="text-5xl sm:text-7xl md:text-8xl tracking-tight">
              {toPersianDigits(minutes)}
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl text-zinc-400 font-normal pl-1">
              :{toPersianDigits(seconds)}
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-medium pt-2">
            ساعت رسمی رومیزی
          </div>
        </div>

        {/* Minimal Focus Timer Box with +/- 5 min adjusters and Task Sync */}
        <div className="p-4 sm:p-5 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-md flex flex-col items-center gap-3 w-full max-w-sm shadow-2xl">
          <div className="flex items-center justify-between w-full text-xs text-zinc-400">
            <span className="font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/40" />
              <span>تایمر تمرکز عمیق</span>
            </span>
            <div dir="ltr" className="font-mono font-black text-sm text-white">
              {toPersianDigits(timerMin)}:{toPersianDigits(timerSec)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${timerProgress}%` }}
            />
          </div>

          {/* Timer Adjusters (+/- 5 min) */}
          <div className="flex items-center justify-between w-full pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={subtractFiveMinutes}
                className="p-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="کاهش ۵ دقیقه"
              >
                <Minus className="w-3 h-3" />
                <span>۵- د</span>
              </button>

              <button
                type="button"
                onClick={addFiveMinutes}
                className="p-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="افزایش ۵ دقیقه"
              >
                <Plus className="w-3 h-3" />
                <span>۵+ د</span>
              </button>
            </div>

            {/* Presets */}
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
              {/* Log Focus Button */}
              {elapsedFocusSeconds >= 30 && (
                <button
                  type="button"
                  onClick={handleSaveFocusToTask}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  title="ثبت دقایق تمرکز انجام‌شده برای این تسک"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ثبت {toPersianDigits(Math.round(elapsedFocusSeconds / 60))} دقیقه</span>
                </button>
              )}

              {isSavedNotice && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> ثبت شد!
                </span>
              )}

              {/* Task Switcher */}
              {activeTasks.length > 1 && (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="bg-white/10 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 border border-white/15 outline-none cursor-pointer max-w-[130px] truncate"
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
          <div className="p-3 text-center text-xs text-zinc-400 bg-black/40 rounded-2xl border border-white/10">
            تمامی تسک‌های زمان‌دار امروز انجام شده‌اند. از لحظات آرامش لذت ببرید 🌱
          </div>
        )}
      </div>
    </div>
  );
};
