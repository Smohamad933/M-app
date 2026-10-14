import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sprout,
  Droplets,
  ShoppingBag,
} from 'lucide-react';
import { FocusGardenShopModal, type PlantCustomization } from './FocusGardenShopModal';

interface FocusGardenState {
  xp: number;
  gems: number;
  lastWateredDate: string;
}

export const FocusGardenWidget: React.FC = () => {
  const { tasks, currentUser } = useTask();
  const userKey = currentUser?.id || 'guest';
  const storageKey = `taskrooz_garden_${userKey}`;
  const customKey = `taskrooz_garden_custom_${userKey}`;

  const todayISO = new Date().toISOString().split('T')[0];
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Customization state
  const [customization, setCustomization] = useState<PlantCustomization>(() => {
    try {
      const saved = localStorage.getItem(customKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      species: 'clover',
      pot: 'terracotta',
      aura: 'none',
    };
  });

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
      gems: 40,
      lastWateredDate: '',
    };
  });

  const baseTaskXP = completedTasks.length * 40;
  const focusXP = totalFocusMins * 5;
  const currentTotalXP = garden.xp + baseTaskXP + focusXP;

  // Level thresholds: each level is 250 XP
  const level = Math.floor(currentTotalXP / 250) + 1;
  const xpInCurrentLevel = currentTotalXP % 250;
  const levelProgress = Math.round((xpInCurrentLevel / 250) * 100);

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

  const handleUpdateGems = (newGems: number) => {
    const updated = { ...garden, gems: newGems };
    setGarden(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleUpdateCustomization = (c: PlantCustomization) => {
    setCustomization(c);
    try {
      localStorage.setItem(customKey, JSON.stringify(c));
    } catch {}
  };

  // Pot Color
  const getPotColor = () => {
    switch (customization.pot) {
      case 'whiteCeramic':
        return '#f1f5f9';
      case 'turquoise':
        return '#06b6d4';
      case 'marble':
        return '#cbd5e1';
      case 'gold':
        return '#eab308';
      default:
        return '#78350f';
    }
  };

  return (
    <div
      className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] h-full min-h-[350px] flex flex-col justify-between select-none relative overflow-hidden"
      dir="rtl"
    >
      {/* 1. Header & Level Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 relative z-10">
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

        {/* Gems & Shop Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsShopOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-black transition-all cursor-pointer shadow-2xs active:scale-95"
            title="فروشگاه گلدان و گونه‌های گیاهی"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            <span>{toPersianDigits(garden.gems)} الماس</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Boxed Terrarium Bed */}
      <div className="my-auto py-3 px-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col items-center justify-center text-center relative z-10 space-y-2">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Aura Effects */}
          {customization.aura === 'neonGlow' && (
            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse" />
          )}
          {customization.aura === 'galaxy' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-amber-500/30 rounded-full blur-xl animate-spin" />
          )}
          {customization.aura === 'butterflies' && (
            <>
              <span className="absolute -top-2 left-2 text-xs animate-bounce">🦋</span>
              <span className="absolute top-4 -right-1 text-xs animate-pulse">🦋</span>
            </>
          )}

          {/* Dynamic Plant Graphic with Custom Species & Pot */}
          <svg viewBox="0 0 100 100" className="w-24 h-24 relative z-10 transition-transform duration-500 hover:scale-110">
            {/* Custom Pot */}
            <path d="M 30 75 L 70 75 L 65 92 L 35 92 Z" fill={getPotColor()} />
            <rect x="28" y="72" width="44" height="6" rx="3" fill={getPotColor()} opacity="0.8" />

            {/* Plant Species Rendering */}
            {customization.species === 'cactus' ? (
              // Cactus
              <g>
                <rect x="44" y="42" width="12" height="32" rx="6" fill="#15803d" />
                <path d="M 44 55 H 34 V 45" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 56 50 H 66 V 40" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="38" r="4" fill="#f43f5e" />
              </g>
            ) : customization.species === 'bamboo' ? (
              // Bamboo
              <g>
                <rect x="42" y="30" width="5" height="44" fill="#16a34a" />
                <rect x="52" y="24" width="6" height="50" fill="#22c55e" />
                <line x1="40" y1="45" x2="49" y2="45" stroke="#14532d" strokeWidth="2" />
                <line x1="50" y1="40" x2="60" y2="40" stroke="#14532d" strokeWidth="2" />
                <path d="M 42 35 Q 32 30 35 25" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 58 30 Q 68 25 65 20" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            ) : customization.species === 'bonsai' ? (
              // Bonsai
              <g>
                <path d="M 50 72 Q 40 55 52 48 Q 62 42 48 35" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="42" cy="32" r="10" fill="#15803d" />
                <circle cx="56" cy="34" r="8" fill="#16a34a" />
                <circle cx="48" cy="24" r="7" fill="#22c55e" />
              </g>
            ) : customization.species === 'sunflower' ? (
              // Sunflower
              <g>
                <path d="M 50 72 Q 48 50 50 35" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="30" r="12" fill="#facc15" />
                <circle cx="50" cy="30" r="7" fill="#78350f" />
                <path d="M 50 55 Q 38 48 42 40 Q 48 50 50 55" fill="#16a34a" />
              </g>
            ) : customization.species === 'magicTree' ? (
              // Magic Ancient Tree
              <g>
                <path d="M 50 72 L 50 40" stroke="#581c87" strokeWidth="7" strokeLinecap="round" />
                <circle cx="50" cy="28" r="16" fill="#9333ea" />
                <circle cx="40" cy="32" r="12" fill="#a855f7" />
                <circle cx="60" cy="32" r="12" fill="#c084fc" />
                <circle cx="50" cy="22" r="5" fill="#facc15" />
              </g>
            ) : (
              // Clover (Default)
              <g>
                <path
                  d={level >= 5 ? "M 50 72 Q 48 45 50 25" : "M 50 72 Q 48 55 50 40"}
                  stroke="#059669"
                  strokeWidth={level >= 5 ? "5" : "3.5"}
                  strokeLinecap="round"
                  fill="none"
                />
                <path d="M 50 60 Q 35 55 40 45 Q 48 55 50 60" fill="#10b981" />
                <path d="M 50 55 Q 65 50 60 40 Q 52 50 50 55" fill="#34d399" />
                {level >= 4 && (
                  <>
                    <path d="M 50 45 Q 30 38 35 25 Q 45 35 50 45" fill="#059669" />
                    <path d="M 50 40 Q 70 33 65 20 Q 55 30 50 40" fill="#10b981" />
                  </>
                )}
                {level >= 5 && (
                  <>
                    <circle cx="50" cy="22" r="7" fill="#f59e0b" />
                    <circle cx="45" cy="18" r="4" fill="#fbbf24" />
                    <circle cx="55" cy="18" r="4" fill="#fbbf24" />
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
          {isWateredToday
            ? 'باغچه امروز آبیاری شد و با انرژی در حال رشد است ✨'
            : 'با تمرکز و آبیاری روزانه، باغچه شما پربارتر می‌شود'}
        </p>
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
          <div className="w-full bg-slate-200/80 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
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

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsShopOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
            title="فروشگاه گلدان و گونه‌های گیاهی"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>فروشگاه</span>
          </button>
        </div>
      </div>

      {/* Focus Garden Shop Modal */}
      <FocusGardenShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        gardenGems={garden.gems}
        onUpdateGems={handleUpdateGems}
        customization={customization}
        onUpdateCustomization={handleUpdateCustomization}
      />
    </div>
  );
};
