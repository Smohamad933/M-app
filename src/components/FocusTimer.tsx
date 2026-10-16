import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { GroupFocusRoom } from './GroupFocusRoom';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  User,
  Users,
  Plus,
  Minus,
  Coffee,
  Sliders,
  Sparkles,
  Zap,
  Waves,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'focus' | 'shortBreak' | 'longBreak';
type AmbientSound = 'none' | 'white' | 'rain' | 'waves';

export const FocusTimer: React.FC = () => {
  const {
    tasks,
    activeFocusTaskId,
    setActiveFocusTaskId,
    addFocusMinutes,
    activeRoom,
    activeRoomId,
  } = useTask();

  // Switch between Solo focus and Group focus room
  const [focusType, setFocusType] = useState<'solo' | 'group'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return activeRoom || activeRoomId || urlParams.has('room') || urlParams.has('room_id') ? 'group' : 'solo';
    } catch {
      return activeRoom || activeRoomId ? 'group' : 'solo';
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (activeRoom || activeRoomId || urlParams.has('room') || urlParams.has('room_id')) {
      setFocusType('group');
    }
  }, [activeRoom, activeRoomId]);

  // Customizable Durations (in minutes) saved to localStorage
  const [focusDurationMin, setFocusDurationMin] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('bagtime_focus_duration')) || 25;
    } catch {
      return 25;
    }
  });

  const [shortBreakDurationMin, setShortBreakDurationMin] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('bagtime_short_break_duration')) || 5;
    } catch {
      return 5;
    }
  });

  const [longBreakDurationMin, setLongBreakDurationMin] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('bagtime_long_break_duration')) || 15;
    } catch {
      return 15;
    }
  });

  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(() => focusDurationMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveSavedMinutes, setLiveSavedMinutes] = useState(0);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');

  const activeTask = tasks.find((t) => t.id === activeFocusTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const timerRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Web Audio API Ambient Noise Generator
  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
      } catch {}
      noiseNodeRef.current = null;
    }
  };

  const playAmbientSound = (type: AmbientSound) => {
    stopAmbientSound();
    if (type === 'none') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'white') {
          data[i] = white * 0.04;
        } else if (type === 'rain') {
          // Pink noise filter for rain
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 0.12;
        } else if (type === 'waves') {
          // Brown noise filter for deep waves
          lastOut = (lastOut + 0.015 * white) / 1.015;
          data[i] = lastOut * 0.2;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noiseNodeRef.current = noise;
    } catch {}
  };

  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      playAmbientSound(ambientSound);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isRunning, ambientSound]);

  // Get current active duration in seconds
  const getCurrentModeDurationSeconds = (m: Mode) => {
    switch (m) {
      case 'focus':
        return focusDurationMin * 60;
      case 'shortBreak':
        return shortBreakDurationMin * 60;
      case 'longBreak':
        return longBreakDurationMin * 60;
    }
  };

  const handleModeChange = (newMode: Mode) => {
    sounds.playPop();
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getCurrentModeDurationSeconds(newMode));
    elapsedSecondsRef.current = 0;
  };

  // Adjust Focus duration
  const adjustFocusMinutes = (delta: number) => {
    sounds.playPop();
    const next = Math.max(1, Math.min(180, focusDurationMin + delta));
    setFocusDurationMin(next);
    try {
      localStorage.setItem('bagtime_focus_duration', String(next));
    } catch {}
    if (mode === 'focus' && !isRunning) {
      setTimeLeft(next * 60);
    }
  };

  const setCustomFocusMinutes = (val: number) => {
    sounds.playPop();
    setFocusDurationMin(val);
    try {
      localStorage.setItem('bagtime_focus_duration', String(val));
    } catch {}
    if (mode === 'focus' && !isRunning) {
      setTimeLeft(val * 60);
    }
  };

  // Adjust Break duration
  const adjustBreakMinutes = (delta: number) => {
    sounds.playPop();
    if (mode === 'shortBreak') {
      const next = Math.max(1, Math.min(60, shortBreakDurationMin + delta));
      setShortBreakDurationMin(next);
      try {
        localStorage.setItem('bagtime_short_break_duration', String(next));
      } catch {}
      if (!isRunning) setTimeLeft(next * 60);
    } else {
      const next = Math.max(1, Math.min(60, longBreakDurationMin + delta));
      setLongBreakDurationMin(next);
      try {
        localStorage.setItem('bagtime_long_break_duration', String(next));
      } catch {}
      if (!isRunning) setTimeLeft(next * 60);
    }
  };

  // Live periodic save while timer is running (every 60 seconds)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });

        // Track live seconds spent in focus mode to auto-save to reports
        if (mode === 'focus') {
          elapsedSecondsRef.current += 1;
          // Every 60 seconds of real focus, save 1 minute to report
          if (elapsedSecondsRef.current >= 60) {
            elapsedSecondsRef.current = 0;
            setLiveSavedMinutes((prev) => prev + 1);
            if (activeFocusTaskId) {
              addFocusMinutes(activeFocusTaskId, 1);
            }
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, activeFocusTaskId, focusDurationMin]);

  const onTimerComplete = () => {
    if (soundEnabled) sounds.playTimerFinish();
    try {
      confetti({ particleCount: 80, spread: 85, origin: { y: 0.6 } });
    } catch {}

    if (mode === 'focus') {
      setCompletedSessions((c) => c + 1);
      // Auto-switch to break
      setMode('shortBreak');
      setTimeLeft(shortBreakDurationMin * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusDurationMin * 60);
    }
    elapsedSecondsRef.current = 0;
  };

  const toggleTimer = () => {
    sounds.playPop();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    sounds.playPop();
    setIsRunning(false);
    setTimeLeft(getCurrentModeDurationSeconds(mode));
    elapsedSecondsRef.current = 0;
  };

  const totalDuration = getCurrentModeDurationSeconds(mode);
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-1 sm:px-0 select-none animate-in fade-in pb-20" dir="rtl">
      {/* 1. TOP MODE SWITCHER: SOLO VS GROUP LIVE ROOM */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1.5 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setFocusType('solo');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all cursor-pointer ${
              focusType === 'solo'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-xs">تمرکز انفرادی</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setFocusType('group');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all cursor-pointer ${
              focusType === 'group'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-xs">اتاق زنده تمرکز گروهی</span>
            {activeRoom && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {focusType === 'group' ? (
        <GroupFocusRoom />
      ) : (
        <div className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col items-center space-y-5 sm:space-y-6 relative overflow-hidden">
          {/* Subtle Aurora Ambient Lights */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />

          {/* Mode Switcher Pills: Focus, Short Break, Long Break */}
          <div className="w-full flex items-center p-1 sm:p-1.5 bg-slate-100 dark:bg-[#252528] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] gap-1 z-10">
            <button
              onClick={() => handleModeChange('focus')}
              className={`flex-1 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                mode === 'focus'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
              <span>تمرکز عمیق</span>
              <span className="text-[10px] font-mono opacity-80">({toPersianDigits(focusDurationMin)}د)</span>
            </button>

            <button
              onClick={() => handleModeChange('shortBreak')}
              className={`flex-1 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
              <span>استراحت کوتاه</span>
              <span className="text-[10px] font-mono opacity-80">({toPersianDigits(shortBreakDurationMin)}د)</span>
            </button>

            <button
              onClick={() => handleModeChange('longBreak')}
              className={`flex-1 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-purple-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 shrink-0" />
              <span>استراحت بلند</span>
              <span className="text-[10px] font-mono opacity-80">({toPersianDigits(longBreakDurationMin)}د)</span>
            </button>
          </div>

          {/* Quick Stepper & Presets Chips */}
          <div className="w-full z-10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span>تنظیم سریع زمان ({mode === 'focus' ? 'تمرکز' : 'استراحت'}):</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mode === 'focus' ? adjustFocusMinutes(-5) : adjustBreakMinutes(-1)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-black text-xs cursor-pointer flex items-center gap-0.5"
                  title="کاهش ۵ دقیقه"
                >
                  <Minus className="w-3 h-3" />
                  <span>{mode === 'focus' ? '۵ د' : '۱ د'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => mode === 'focus' ? adjustFocusMinutes(5) : adjustBreakMinutes(1)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-black text-xs cursor-pointer flex items-center gap-0.5"
                  title="افزایش ۵ دقیقه"
                >
                  <Plus className="w-3 h-3" />
                  <span>{mode === 'focus' ? '۵ د' : '۱ د'}</span>
                </button>
              </div>
            </div>

            {/* Presets Chips */}
            {mode === 'focus' ? (
              <div className="flex items-center justify-center gap-1.5 flex-wrap w-full">
                {[15, 20, 25, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCustomFocusMinutes(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      focusDurationMin === mins
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm ring-2 ring-emerald-500/40'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#252528] dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06]'
                    }`}
                  >
                    {toPersianDigits(mins)} د
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {[3, 5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      if (mode === 'shortBreak') {
                        setShortBreakDurationMin(mins);
                        if (!isRunning) setTimeLeft(mins * 60);
                      } else {
                        setLongBreakDurationMin(mins);
                        if (!isRunning) setTimeLeft(mins * 60);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      (mode === 'shortBreak' ? shortBreakDurationMin : longBreakDurationMin) === mins
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#252528] dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06]'
                    }`}
                  >
                    {toPersianDigits(mins)} دقیقه
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Task Selector */}
          <div className="w-full z-10 text-right">
            <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>تسک متصل به این بازه تمرکز (ذخیره مستقیم دقایق روی تسک):</span>
            </label>
            <select
              value={activeFocusTaskId || ''}
              onChange={(e) => {
                sounds.playPop();
                setActiveFocusTaskId(e.target.value || null);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer"
            >
              <option value="">تمرکز عمومی (آزاد — بدون اتصال به تسک)</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.focusMinutesSpent ? `(${toPersianDigits(t.focusMinutesSpent)} دقیقه ثبت‌شده)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* High-End Circular Radial Chronometer */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center my-2 sm:my-3 z-10">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={circleRadius}
                className="stroke-slate-100 dark:stroke-[#252528]"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="140"
                cy="140"
                r={circleRadius}
                className={`transition-all duration-700 ease-linear ${
                  mode === 'focus'
                    ? 'stroke-emerald-500'
                    : mode === 'shortBreak'
                    ? 'stroke-amber-500'
                    : 'stroke-purple-500'
                }`}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-wider font-mono">
                {toPersianDigits(formattedTime)}
              </span>

              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1 sm:mt-1.5">
                {mode === 'focus'
                  ? isRunning
                    ? 'تمرکز عمیق و پربازده ⚡'
                    : 'آماده برای شروع'
                  : 'وقت استراحت و تنفس عمیق ☕'}
              </span>

              {isRunning && mode === 'focus' && (
                <div className="mt-2 sm:mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>در حال ثبت لحظه‌ای زمان</span>
                </div>
              )}
            </div>
          </div>

          {/* Ambient White Noise Selector */}
          <div className="z-10 flex items-center gap-1.5 bg-slate-50 dark:bg-[#252528] p-1.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-xs font-bold text-slate-600 dark:text-zinc-300 flex-wrap justify-center">
            <span className="flex items-center gap-1 pl-1.5 text-slate-400">
              <Waves className="w-3.5 h-3.5" />
              <span>صدا:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setAmbientSound('none');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                ambientSound === 'none' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black' : 'hover:bg-slate-200'
              }`}
            >
              خاموش
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setAmbientSound('rain');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                ambientSound === 'rain' ? 'bg-cyan-600 text-white font-black' : 'hover:bg-slate-200'
              }`}
            >
              🌧️ باران
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setAmbientSound('waves');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                ambientSound === 'waves' ? 'bg-indigo-600 text-white font-black' : 'hover:bg-slate-200'
              }`}
            >
              🌊 امواج
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setAmbientSound('white');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer ${
                ambientSound === 'white' ? 'bg-purple-600 text-white font-black' : 'hover:bg-slate-200'
              }`}
            >
              📻 نویز
            </button>
          </div>

          {/* Action Buttons: Play/Pause, Reset, Mute */}
          <div className="flex items-center gap-2.5 sm:gap-3 z-10 w-full max-w-sm">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setSoundEnabled(!soundEnabled);
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                soundEnabled
                  ? 'border-black/[0.08] dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  : 'border-black/[0.04] text-slate-400 opacity-50'
              }`}
              title={soundEnabled ? 'زنگ هشدار فعال' : 'بی‌صدا'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleTimer}
              className={`flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                  : 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-slate-900 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>توقف موقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>شروع تمرکز</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="p-3 sm:p-3.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
              title="شروع مجدد تایمر"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Bento Stats Card */}
          <div className="w-full pt-4 border-t border-black/[0.06] dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center z-10">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06]">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono block">
                {toPersianDigits(completedSessions)}
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-400 truncate block">
                پومودورو
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {toPersianDigits(liveSavedMinutes + (activeTask?.focusMinutesSpent || 0))} د
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate block">
                دقایق تمرکز
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono block">
                {toPersianDigits(completedSessions * 10)} 💎
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate block">
                الماس کسب‌شده
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono block">
                {completedSessions > 0 ? '۱۰۰٪' : '۰٪'}
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-300 truncate block">
                نرخ موفقیت
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
