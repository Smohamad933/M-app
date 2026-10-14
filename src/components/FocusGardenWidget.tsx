import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sprout,
  Droplets,
  Sparkles,
} from 'lucide-react';

interface FocusGardenState {
  xp: number;
  gems: number;
  lastWateredDate: string;
}

export const FocusGardenWidget: React.FC = () => {
  const { tasks, currentUser } = useTask();
  const userKey = currentUser?.id || 'guest';
  const storageKey = `taskrooz_garden_${userKey}`;

  const todayISO = new Date().toISOString().split('T')[0];

  // Calculate stats from tasks
  const completedTasks = tasks.filter((t) => t.completed);
  const totalFocusMins = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);

  // Focus garden state
  const [garden, setGarden] = useState<FocusGardenState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      xp: 120,
      gems: 15,
      lastWateredDate: '',
    };
  });

  // Calculate dynamic XP based on tasks + manual watering
  const baseTaskXP = completedTasks.length * 40;
  const focusXP = totalFocusMins * 5;
  const currentTotalXP = garden.xp + baseTaskXP + focusXP;

  // Level thresholds: each level is 250 XP
  const level = Math.floor(currentTotalXP / 250) + 1;
  const xpInCurrentLevel = currentTotalXP % 250;
  const levelProgress = Math.round((xpInCurrentLevel / 250) * 100);

  // Level titles
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 10) return 'اسطوره استمرار و خرد 👑';
    if (lvl >= 7) return 'باغبان زمردین طبیعت 🌿';
    if (lvl >= 5) return 'درخت پربار دانایی 🌳';
    if (lvl >= 3) return 'نهال استوار تمرکز 🌱';
    return 'بذر پرامید تلاش 🌾';
  };

  const isWateredToday = garden.lastWateredDate === todayISO;

  const handleWater = () => {
    if (isWateredToday) return;
    sounds.playComplete();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#34d399', '#facc15'],
      });
    } catch {}

    const updated: FocusGardenState = {
      ...garden,
      xp: garden.xp + 50,
      gems: garden.gems + 5,
      lastWateredDate: todayISO,
    };
    setGarden(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div
      className="p-5 sm:p-6 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 dark:from-zinc-900 dark:via-emerald-950/20 dark:to-zinc-900 rounded-3xl border border-emerald-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full select-none"
      dir="rtl"
    >
      {/* Background Decorative Rings */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header & Level Badge */}
      <div className="flex items-center justify-between pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                باغچه تمرکز و پیشرفت
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                سطح {toPersianDigits(level)}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {getLevelTitle(level)}
            </p>
          </div>
        </div>

        {/* Gems & XP */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{toPersianDigits(garden.gems)} الماس</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Plant Stage (SVG) */}
      <div className="my-auto py-2 flex flex-col items-center justify-center text-center relative z-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Plant Glow */}
          <div className="absolute inset-2 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />

          {/* Dynamic Plant Graphic */}
          <svg viewBox="0 0 100 100" className="w-24 h-24 relative z-10 transition-transform duration-500 hover:scale-110">
            {/* Soil Pot */}
            <path d="M 30 75 L 70 75 L 65 92 L 35 92 Z" fill="#78350f" opacity="0.85" />
            <rect x="28" y="72" width="44" height="6" rx="3" fill="#92400e" />

            {/* Plant Stem */}
            <path
              d={level >= 5 ? "M 50 72 Q 48 45 50 25" : "M 50 72 Q 48 55 50 40"}
              stroke="#059669"
              strokeWidth={level >= 5 ? "5" : "3.5"}
              strokeLinecap="round"
              fill="none"
            />

            {/* Leaves */}
            {level >= 1 && (
              <path d="M 50 60 Q 35 55 40 45 Q 48 55 50 60" fill="#10b981" />
            )}
            {level >= 2 && (
              <path d="M 50 55 Q 65 50 60 40 Q 52 50 50 55" fill="#34d399" />
            )}
            {level >= 4 && (
              <>
                <path d="M 50 45 Q 30 38 35 25 Q 45 35 50 45" fill="#059669" />
                <path d="M 50 40 Q 70 33 65 20 Q 55 30 50 40" fill="#10b981" />
              </>
            )}

            {/* Crown Flower or Fruit for Level 5+ */}
            {level >= 5 && (
              <>
                <circle cx="50" cy="22" r="7" fill="#f59e0b" />
                <circle cx="45" cy="18" r="4" fill="#fbbf24" />
                <circle cx="55" cy="18" r="4" fill="#fbbf24" />
                <circle cx="50" cy="14" r="4" fill="#fde047" />
              </>
            )}
          </svg>
        </div>

        <div className="text-xs text-slate-600 dark:text-zinc-300 font-medium pt-1">
          {isWateredToday
            ? 'باغچه امروز آبیاری شد و با انرژی در حال رشد است ✨'
            : 'با تمرکز و آبیاری روزانه، باغچه شما پربارتر می‌شود'}
        </div>
      </div>

      {/* 3. XP Progress Bar & Daily Watering Action */}
      <div className="space-y-3 pt-2 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
            <span>پیشرفت تا سطح بعدی ({toPersianDigits(level + 1)}):</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(xpInCurrentLevel)} / ۲۵۰ XP
            </span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(levelProgress, 5)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWater}
            disabled={isWateredToday}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-default ${
              isWateredToday
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
            }`}
          >
            <Droplets className={`w-4 h-4 ${isWateredToday ? 'text-emerald-500' : 'animate-bounce text-sky-200'}`} />
            <span>{isWateredToday ? 'آبیاری امروز انجام شد ✔' : 'آبیاری و دریافت ۵۰ XP 💧'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
