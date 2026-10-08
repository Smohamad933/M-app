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
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

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

  const activeTask = tasks.find((t) => t.id === activeFocusTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const timerRef = useRef<number | null>(null);
  const elapsedSecondsRef = useRef<number>(0);

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
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
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
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const circleRadius = 115;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 px-1 sm:px-0 overflow-hidden" dir="rtl">
      {/* Top Main Mode Switcher: Solo vs Group Focus Room */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setFocusType('solo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              focusType === 'solo'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>تمرکز انفرادی</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusType('group')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              focusType === 'group'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>تمرکز گروهی (اتاق زنده)</span>
            {activeRoom && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {focusType === 'group' ? (
        <GroupFocusRoom />
      ) : (
        <div className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-7 shadow-xl flex flex-col items-center space-y-5 relative overflow-hidden animate-in fade-in w-full max-w-full">
          {/* Subtle Glow Backgrounds */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {/* Mode segmented control */}
          <div className="w-full flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner z-10 gap-1">
            <button
              onClick={() => handleModeChange('focus')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'focus'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-emerald-400 shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>تمرکز<span className="hidden sm:inline"> عمیق</span></span>
              <span className="text-[10px] opacity-75 font-mono">({toPersianDigits(focusDurationMin)}د)</span>
            </button>

            <button
              onClick={() => handleModeChange('shortBreak')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3 h-3 flex-shrink-0" />
              <span>استراحت<span className="hidden sm:inline"> کوتاه</span></span>
              <span className="text-[10px] opacity-75 font-mono">({toPersianDigits(shortBreakDurationMin)}د)</span>
            </button>

            <button
              onClick={() => handleModeChange('longBreak')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-purple-400 shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span><span className="hidden sm:inline">استراحت </span>بلند</span>
              <span className="text-[10px] opacity-75 font-mono">({toPersianDigits(longBreakDurationMin)}د)</span>
            </button>
          </div>

          {/* Quick Time Customizer Toggle & Presets */}
          <div className="w-full z-10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span>تنظیم سریع زمان ({mode === 'focus' ? 'تمرکز' : 'استراحت'}):</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => mode === 'focus' ? adjustFocusMinutes(-5) : adjustBreakMinutes(-1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                  title="کاهش زمان"
                >
                  <Minus className="w-3 h-3" />
                  <span>{mode === 'focus' ? '۵ د' : '۱ د'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => mode === 'focus' ? adjustFocusMinutes(5) : adjustBreakMinutes(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                  title="افزایش زمان"
                >
                  <Plus className="w-3 h-3" />
                  <span>{mode === 'focus' ? '۵ د' : '۱ د'}</span>
                </button>
              </div>
            </div>

            {/* Presets Chips */}
            {mode === 'focus' ? (
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap w-full">
                {[15, 20, 25, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCustomFocusMinutes(mins)}
                    className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      focusDurationMin === mins
                        ? 'bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-400/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      (mode === 'shortBreak' ? shortBreakDurationMin : longBreakDurationMin) === mins
                        ? 'bg-amber-600 text-white shadow-xs font-black ring-2 ring-amber-400/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {toPersianDigits(mins)} دقیقه
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task selector */}
          <div className="w-full z-10 text-right">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>تسک در حال انجام (ذخیره مستقیم زمان روی تسک):</span>
            </label>
            <select
              value={activeFocusTaskId || ''}
              onChange={(e) => {
                sounds.playPop();
                setActiveFocusTaskId(e.target.value || null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="">تمرکز عمومی (آزاد — بدون اتصال به تسک)</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Big Sleek Circular Countdown Display */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2 z-10">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 270 270">
              <circle
                cx="135"
                cy="135"
                r={circleRadius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="135"
                cy="135"
                r={circleRadius}
                className={`transition-all duration-700 ease-linear ${
                  mode === 'focus'
                    ? 'stroke-emerald-500'
                    : mode === 'shortBreak'
                    ? 'stroke-amber-500'
                    : 'stroke-purple-500'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-wider font-mono">
                {toPersianDigits(formattedTime)}
              </span>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'focus'
                  ? isRunning
                    ? 'تمرکز عمیق و کار پیوسته ⚡'
                    : 'آماده برای شروع تمرکز'
                  : 'وقت استراحت و تنفس عمیق ☕'}
              </span>

              {/* Live Saving Badge */}
              {isRunning && mode === 'focus' && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-black animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>در حال ذخیره در گزارش‌ها</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Large, High-End UI) */}
          <div className="flex items-center gap-3 z-10 w-full max-w-xs">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'border-slate-200 text-slate-400 opacity-50'
              }`}
              title={soundEnabled ? 'صدای زنگ فعال' : 'بی‌صدا'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleTimer}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                  : 'bg-slate-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>توقف موقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>شروع تمرکز</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="شروع مجدد تایمر"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Live Stats & Progress Card */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center z-10">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono block">
                {toPersianDigits(completedSessions)}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                پومودوروهای تکمیل شده
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {toPersianDigits(liveSavedMinutes + (activeTask?.focusMinutesSpent || 0))}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                دقیقه تمرکز عمیق ثبت‌شده
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
