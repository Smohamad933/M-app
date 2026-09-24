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
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

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

  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeTask = tasks.find((t) => t.id === activeFocusTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const timerRef = useRef<number | null>(null);

  const handleModeChange = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

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
      setMode('shortBreak');
      setTimeLeft(MODE_DURATIONS.shortBreak);
    } else {
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
    <div className="w-full space-y-6">
      {/* Top Main Mode Switcher: Solo vs Group Focus Room */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1.5 bg-white rounded-2xl border border-slate-200/90 text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setFocusType('solo')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              focusType === 'solo'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900'
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
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900'
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
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-sm mx-auto space-y-6 animate-in fade-in">
          {/* Mode segmented control */}
          <div className="w-full flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
            <button
              onClick={() => handleModeChange('focus')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'focus'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              تمرکز (۲۵ دقیقه)
            </button>
            <button
              onClick={() => handleModeChange('shortBreak')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'shortBreak'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              استراحت کوتاه
            </button>
            <button
              onClick={() => handleModeChange('longBreak')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'longBreak'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              استراحت بلند
            </button>
          </div>

          {/* Task selector */}
          <div className="w-full">
            <label className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-500" />
              تسک در حال تمرکز:
            </label>
            <select
              value={activeFocusTaskId || ''}
              onChange={(e) => setActiveFocusTaskId(e.target.value || null)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 focus:border-slate-800 outline-none shadow-xs"
            >
              <option value="">تمرکز عمومی (بدون اتصال به تسک خاص)</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {activeTask && (
              <div className="mt-1 text-[11px] text-slate-700 font-bold truncate">
                🎯 {activeTask.title}
              </div>
            )}
          </div>

          {/* Big Circular Countdown Display */}
          <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                className="stroke-slate-200"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                className="stroke-slate-900 transition-all duration-700 ease-linear"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-wider font-mono">
                {toPersianDigits(formattedTime)}
              </span>
              <span className="text-xs font-bold text-slate-500 mt-2">
                {mode === 'focus' ? 'تمرکز عمیق روی کار' : 'زمان استراحت'}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              aria-label="بازنشانی زمان"
              className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title="بازنشانی"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className="px-8 py-3.5 rounded-2xl font-black text-white text-base shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 bg-slate-900 hover:bg-black cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
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
              className={`p-3.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'صدا روشن' : 'صدا خاموش'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Summary stats */}
          <div className="w-full p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-around text-xs">
            <div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {toPersianDigits(completedSessions)}
              </div>
              <div className="text-[11px] font-bold text-slate-500">پومودوروهای تکمیل‌شده</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {toPersianDigits(completedSessions * 25)}
              </div>
              <div className="text-[11px] font-bold text-slate-500">دقیقه تمرکز عمیق</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
