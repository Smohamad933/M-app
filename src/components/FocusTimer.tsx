import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const FocusTimer: React.FC = () => {
  const { tasks, activeFocusTaskId, setActiveFocusTaskId, addFocusMinutes } = useTask();

  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeTask = tasks.find((t) => t.id === activeFocusTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const timerRef = useRef<number | null>(null);

  // Switch mode
  const handleModeChange = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  // Timer tick
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
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, activeFocusTaskId]);

  const onTimerComplete = () => {
    sounds.playTimerFinish();
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    if (mode === 'focus') {
      const minutesCompleted = Math.round(MODE_DURATIONS.focus / 60);
      setCompletedSessions((c) => c + 1);
      if (activeFocusTaskId) {
        addFocusMinutes(activeFocusTaskId, minutesCompleted);
      }
      // Offer break
      setMode('shortBreak');
      setTimeLeft(MODE_DURATIONS.shortBreak);
    } else {
      // Back to focus
      setMode('focus');
      setTimeLeft(MODE_DURATIONS.focus);
    }
  };

  const toggleTimer = () => {
    sounds.playPop();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    sounds.playPop();
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const totalDuration = MODE_DURATIONS[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 pb-24 text-center">
      {/* Top mode segmented pill */}
      <div className="w-full max-w-xs flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <button
          onClick={() => handleModeChange('focus')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'focus'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          تمرکز (۲۵ دقیقه)
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'shortBreak'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          استراحت (۵ دقیقه)
        </button>
        <button
          onClick={() => handleModeChange('longBreak')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'longBreak'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          استراحت طولانی
        </button>
      </div>

      {/* Task selector chip */}
      <div className="w-full max-w-xs mt-3">
        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
          <Target className="w-3.5 h-3.5 text-indigo-500" />
          تسک در حال تمرکز:
        </label>
        <select
          value={activeFocusTaskId || ''}
          onChange={(e) => setActiveFocusTaskId(e.target.value || null)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">تمرکز عمومی (بدون اتصال به تسک خاص)</option>
          {pendingTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        {activeTask && (
          <div className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
            🎯 {activeTask.title}
          </div>
        )}
      </div>

      {/* Big Circular Countdown Display */}
      <div className="relative my-6 w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
          <circle
            cx="130"
            cy="130"
            r={circleRadius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="130"
            cy="130"
            r={circleRadius}
            className={`transition-all duration-700 ease-linear ${
              mode === 'focus'
                ? 'stroke-indigo-600 dark:stroke-indigo-500'
                : mode === 'shortBreak'
                ? 'stroke-emerald-500'
                : 'stroke-sky-500'
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-slate-900 dark:text-white tracking-wider font-mono">
            {toPersianDigits(formattedTime)}
          </span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 mt-2">
            {mode === 'focus'
              ? 'تمرکز عمیق روی کار'
              : mode === 'shortBreak'
              ? 'استراحت و کشش بدن'
              : 'استراحت تجدید قوا'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          aria-label="بازنشانی زمان"
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
          title="بازنشانی"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-2xl font-extrabold text-white text-base shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
              : mode === 'focus'
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              توقف
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              شروع تمرکز
            </>
          )}
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label="تنظیم صدا"
          className={`p-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
            soundEnabled
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
          title={soundEnabled ? 'صدا روشن' : 'صدا خاموش'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Focus Session summary stats */}
      <div className="mt-6 w-full max-w-xs p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-around">
        <div className="text-center">
          <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            {toPersianDigits(completedSessions)}
          </div>
          <div className="text-[10px] text-slate-500">پومودوروهای امروز</div>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            {toPersianDigits(completedSessions * 25)}
          </div>
          <div className="text-[10px] text-slate-500">دقیقه تمرکز عمیق</div>
        </div>
      </div>
    </div>
  );
};
