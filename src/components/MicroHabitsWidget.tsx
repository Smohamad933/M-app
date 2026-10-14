import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Plus,
  Flame,
  BookOpen,
  Activity,
  Droplets,
  Code2,
  Brain,
  Trash2,
} from 'lucide-react';

export interface MicroHabit {
  id: string;
  title: string;
  iconName: 'book' | 'sport' | 'water' | 'code' | 'brain';
  history: Record<string, boolean>; // 'YYYY-MM-DD': true
}

const DEFAULT_HABITS: MicroHabit[] = [
  {
    id: 'habit_read',
    title: 'مطالعه ۱۵ دقیقه کتاب',
    iconName: 'book',
    history: {},
  },
  {
    id: 'habit_sport',
    title: 'ورزش و تحرک روزانه',
    iconName: 'sport',
    history: {},
  },
  {
    id: 'habit_water',
    title: 'نوشیدن ۸ لیوان آب',
    iconName: 'water',
    history: {},
  },
  {
    id: 'habit_code',
    title: 'کدنویسی یا یادگیری مهارت',
    iconName: 'code',
    history: {},
  },
];

export const MicroHabitsWidget: React.FC = () => {
  const { currentUser } = useTask();
  const userKey = currentUser?.id || 'guest';
  const storageKey = `taskrooz_micro_habits_${userKey}`;

  const todayISO = new Date().toISOString().split('T')[0];

  const [habits, setHabits] = useState<MicroHabit[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HABITS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState<'book' | 'sport' | 'water' | 'code' | 'brain'>('brain');

  const saveHabits = (updated: MicroHabit[]) => {
    setHabits(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // Toggle habit for today
  const toggleHabitToday = (id: string) => {
    const next = habits.map((h) => {
      if (h.id === id) {
        const current = !!h.history[todayISO];
        const nextState = !current;
        if (nextState) {
          sounds.playComplete();
          try {
            confetti({
              particleCount: 40,
              spread: 50,
              origin: { y: 0.7 },
              colors: ['#10b981', '#6366f1', '#f59e0b'],
            });
          } catch {}
        } else {
          sounds.playPop();
        }
        return {
          ...h,
          history: {
            ...h.history,
            [todayISO]: nextState,
          },
        };
      }
      return h;
    });
    saveHabits(next);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newH: MicroHabit = {
      id: `h_${Date.now()}`,
      title: newTitle.trim(),
      iconName: newIcon,
      history: {},
    };
    saveHabits([...habits, newH]);
    setNewTitle('');
    setIsAdding(false);
    sounds.playPop();
  };

  const handleDelete = (id: string) => {
    saveHabits(habits.filter((h) => h.id !== id));
    sounds.playPop();
  };

  // Generate last 28 days for the heatmap
  const pastDays = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  // Calculate overall heatmap intensity for each day (0 to 4 based on total completed habits)
  const getDayIntensity = (dateStr: string) => {
    const count = habits.filter((h) => h.history[dateStr]).length;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  };

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 1:
        return 'bg-emerald-300 dark:bg-emerald-900/60 border-emerald-400/40';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500/50';
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-400/60';
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
      default:
        return 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700/50';
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case 'sport':
        return <Activity className="w-4 h-4 text-rose-500" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-indigo-500" />;
      default:
        return <Brain className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div
      className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-full select-none"
      dir="rtl"
    >
      {/* 1. Header & Quick Add */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-indigo-500/30" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
              هاب عادات روزانه و استمرار
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              زنجیره عملکرد در ۲۸ روز گذشته
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddHabit} className="py-2.5 space-y-2 animate-in fade-in">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="عنوان عادت (مثلاً: ۱۰ صفحه مطالعه)..."
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(['book', 'sport', 'water', 'code', 'brain'] as const).map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewIcon(ic)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    newIcon === ic ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {renderIcon(ic)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                افزودن
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. Habits Checklist */}
      <div className="space-y-2 py-3 max-h-48 overflow-y-auto no-scrollbar">
        {habits.map((habit) => {
          const isDone = !!habit.history[todayISO];
          return (
            <div
              key={habit.id}
              className={`p-2.5 px-3 rounded-2xl border transition-all flex items-center justify-between gap-2 group ${
                isDone
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                  : 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleHabitToday(habit.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'border-2 border-slate-300 dark:border-zinc-600 hover:border-emerald-500'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                </button>
                <div className="flex items-center gap-2 truncate">
                  {renderIcon(habit.iconName)}
                  <span className={`text-xs font-bold truncate ${isDone ? 'line-through opacity-75' : ''}`}>
                    {habit.title}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(habit.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                title="حذف عادت"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Contribution Heatmap (28 Days) */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
          <span>نقشه حرارتی استمرار (۴ هفته گذشته):</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px]">کمتر</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <span key={lvl} className={`w-2.5 h-2.5 rounded-xs border ${getHeatmapColor(lvl)}`} />
            ))}
            <span className="text-[9px]">بیشتر</span>
          </div>
        </div>

        {/* 4 rows x 7 columns grid */}
        <div className="grid grid-cols-7 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60">
          {pastDays.map((d) => {
            const intensity = getDayIntensity(d);
            const isToday = d === todayISO;
            return (
              <div
                key={d}
                title={`تاریخ: ${d} - انجام‌شده: ${intensity}`}
                className={`w-full aspect-square rounded-md border transition-all ${getHeatmapColor(
                  intensity
                )} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
