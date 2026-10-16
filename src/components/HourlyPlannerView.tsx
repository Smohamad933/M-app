import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import {
  toPersianDigits,
  getTodayISO,
  formatAppDate,
  parseISODate,
} from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Clock,
  Check,
  Plus,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  CheckCircle2,
  Zap,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Layers,
} from 'lucide-react';
import type { Task } from '../types';

export const HourlyPlannerView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    toggleTaskComplete,
    openCreateModal,
    calendarType,
    toggleCalendarType,
  } = useTask();

  const todayISO = getTodayISO();
  const activeDate = selectedDate || todayISO;

  // Real live ticking clock (every second for high fidelity)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  // Mode: Gantt timeline view vs 24h Blocks vs Sequential Agenda
  const [viewMode, setViewMode] = useState<'gantt' | 'blocks' | 'agenda'>('gantt');

  // Active Daytime filter for Blocks view (all, morning, noon, evening, night)
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'morning' | 'noon' | 'evening' | 'night'>('all');

  // Tasks for the selected date
  const dayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === activeDate);
  }, [tasks, activeDate]);

  // Navigate date safely across months and calendars
  const changeDate = (days: number) => {
    sounds.playPop();
    const cur = parseISODate(activeDate);
    cur.setDate(cur.getDate() + days);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Full day planning hours: 06:00 to 24:00 (19 hours total)
  const HOURS = useMemo(() => {
    return Array.from({ length: 19 }, (_, i) => i + 6); // 6, 7, 8 ... 24
  }, []);

  // Map tasks to their scheduled start hour
  const tasksByHour = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (const h of HOURS) {
      map[h] = [];
    }

    for (const task of dayTasks) {
      if (task.time) {
        const hourNum = parseInt(task.time.split(':')[0], 10);
        if (map[hourNum]) {
          map[hourNum].push(task);
        } else {
          const slot = Math.max(6, Math.min(24, hourNum));
          if (!map[slot]) map[slot] = [];
          map[slot].push(task);
        }
      }
    }
    return map;
  }, [dayTasks, HOURS]);

  const totalDayTasks = dayTasks.length;
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;
  const completionRate = totalDayTasks > 0 ? Math.round((completedDayTasks / totalDayTasks) * 100) : 0;

  const timedTasks = useMemo(() => {
    return dayTasks.filter((t) => t.time).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [dayTasks]);

  // Live marker position across 06:00 to 24:00 (18 hours = 1080 minutes)
  const totalMinutesFrom6 = (currentHour - 6) * 60 + currentMinute;
  const markerPercent = Math.max(0, Math.min(100, Math.round((totalMinutesFrom6 / 1080) * 100)));

  // Daytime phases task counts
  const phaseCounts = useMemo(() => {
    let morning = 0; // 6 to 11
    let noon = 0;    // 12 to 15
    let evening = 0; // 16 to 19
    let night = 0;   // 20 to 24

    for (const t of timedTasks) {
      if (!t.time) continue;
      const h = parseInt(t.time.split(':')[0], 10);
      if (h >= 6 && h < 12) morning++;
      else if (h >= 12 && h < 16) noon++;
      else if (h >= 16 && h < 20) evening++;
      else if (h >= 20) night++;
    }

    return { morning, noon, evening, night };
  }, [timedTasks]);

  // Color schemes for Gantt & Block tasks
  const getTaskStyle = (index: number, priority?: string, completed?: boolean) => {
    if (completed) {
      return 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700';
    }
    if (priority === 'high') {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
    }
    const palettes = [
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    ];
    return palettes[index % palettes.length];
  };

  const getPhaseForHour = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 16) return 'noon';
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  };

  const filteredHours = useMemo(() => {
    if (phaseFilter === 'all') return HOURS;
    return HOURS.filter((h) => getPhaseForHour(h) === phaseFilter);
  }, [HOURS, phaseFilter]);

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in pb-20 select-none" dir="rtl">
      {/* 1. LUXURY HEADER & DATE NAVIGATOR */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title and Clock */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs shrink-0">
            <Clock className="w-6 h-6 text-emerald-400 dark:text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                دیلی پلنر ساعتی (Hourly Day Planner)
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                برنامه‌ریزی دقیق ۲۴ ساعته
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
              مدیریت بلوک‌های زمانی روز، خط زمانی تعاملی و همگام‌سازی لحظه‌ای کارها
            </p>
          </div>
        </div>

        {/* Date Stepper & Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Date Navigator */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#252528] p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
              title="روز بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 dark:text-white px-2.5 flex items-center gap-1.5">
              <span>{formatAppDate(activeDate, calendarType, 'dayMonth')}</span>
              {activeDate === todayISO && (
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black bg-emerald-500/15 px-1.5 py-0.2 rounded-md">
                  امروز
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
              title="روز قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick "Today" Jump */}
          {activeDate !== todayISO && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setSelectedDate(todayISO);
              }}
              className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-black text-xs transition-colors cursor-pointer shadow-2xs"
            >
              امروز
            </button>
          )}

          {/* Calendar System Switcher */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              toggleCalendarType();
            }}
            className="text-xs font-bold px-3 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{calendarType === 'jalali' ? 'شمسی' : 'میلادی'}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#252528] p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setViewMode('gantt');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              گانت
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setViewMode('blocks');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'blocks'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              بلوک‌ها
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setViewMode('agenda');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              فهرست
            </button>
          </div>

          {/* New Task */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal(activeDate);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">ثبت تسک</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-3.5 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-zinc-400 font-bold block truncate">کل تسک‌های روز</span>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 block font-mono">
              {toPersianDigits(totalDayTasks)}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 dark:bg-[#252528] flex items-center justify-center text-slate-700 dark:text-zinc-300 shrink-0 mr-1">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-3.5 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-zinc-400 font-bold block truncate">زمان‌بندی‌شده</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 block font-mono">
              {toPersianDigits(timedTasks.length)}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mr-1">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-3.5 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-zinc-400 font-bold block truncate">پیشرفت و بازدهی</span>
            <span className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 sm:mt-1 block font-mono">
              {toPersianDigits(completionRate)}٪
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mr-1">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-3.5 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-zinc-400 font-bold block truncate">ساعت رسمی ایران</span>
            <span className="text-sm sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1 block font-mono truncate" dir="ltr">
              {toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))}:{toPersianDigits(String(currentSecond).padStart(2, '0'))}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mr-1">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 3. DAYLIGHT PHASES CAPSULES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setPhaseFilter(phaseFilter === 'morning' ? 'all' : 'morning');
          }}
          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
            phaseFilter === 'morning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-sm'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Sunrise className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-right min-w-0">
              <span className="text-xs font-black block truncate">صبحگاه</span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono block">۰۶ تا ۱۲</span>
            </div>
          </div>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[11px] sm:text-xs font-black shrink-0">
            {toPersianDigits(phaseCounts.morning)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setPhaseFilter(phaseFilter === 'noon' ? 'all' : 'noon');
          }}
          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
            phaseFilter === 'noon'
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-900 dark:text-orange-200 shadow-sm'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-orange-400/50'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Sun className="w-4 h-4 text-orange-500 shrink-0" />
            <div className="text-right min-w-0">
              <span className="text-xs font-black block truncate">نیمروز</span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono block">۱۲ تا ۱۶</span>
            </div>
          </div>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-700 dark:text-orange-300 font-mono text-[11px] sm:text-xs font-black shrink-0">
            {toPersianDigits(phaseCounts.noon)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setPhaseFilter(phaseFilter === 'evening' ? 'all' : 'evening');
          }}
          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
            phaseFilter === 'evening'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200 shadow-sm'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-rose-400/50'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Sunset className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="text-right min-w-0">
              <span className="text-xs font-black block truncate">عصرگاه</span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono block">۱۶ تا ۲۰</span>
            </div>
          </div>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-[11px] sm:text-xs font-black shrink-0">
            {toPersianDigits(phaseCounts.evening)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setPhaseFilter(phaseFilter === 'night' ? 'all' : 'night');
          }}
          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
            phaseFilter === 'night'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-indigo-400/50'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="text-right min-w-0">
              <span className="text-xs font-black block truncate">شبانگاه</span>
              <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono block">۲۰ تا ۲۴</span>
            </div>
          </div>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] sm:text-xs font-black shrink-0">
            {toPersianDigits(phaseCounts.night)}
          </span>
        </button>
      </div>

      {/* 4. VIEW 1: SIGNATURE HORIZONTAL GANTT TIMELINE */}
      {viewMode === 'gantt' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 sm:p-7 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                خط زمانی افقی تسک‌ها (Visual Gantt Track)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                تایم‌لاین پیوسته ۱۸ ساعته (۰۶:۰۰ تا ۲۴:۰۰) همراه با خط شناور زمان اکنون
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>
                اکنون {toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))}
              </span>
            </div>
          </div>

          {/* Interactive Gantt Canvas */}
          <div className="relative border border-black/[0.06] dark:border-white/[0.08] rounded-3xl bg-slate-50/50 dark:bg-[#151516] p-6 overflow-x-auto min-w-0">
            {/* Live Vertical Current Time Pin */}
            {activeDate === todayISO && currentHour >= 6 && currentHour <= 24 && (
              <div
                className="absolute top-0 bottom-12 w-[2px] bg-rose-500 z-30 pointer-events-none transition-all duration-1000 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                style={{ right: `${markerPercent}%` }}
              >
                <div className="w-4 h-4 rounded-full border-2 border-rose-500 bg-white dark:bg-[#1c1c1e] -mt-1 -mr-2 shadow-md flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md -mr-6 mt-1 shadow-sm font-mono whitespace-nowrap">
                  اکنون {toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))}
                </div>
              </div>
            )}

            {/* Horizontal Timeline Track */}
            <div className="min-w-[950px] space-y-6 pt-2 pb-6">
              {/* Tasks Gantt Lanes */}
              {timedTasks.length > 0 ? (
                <div className="space-y-4">
                  {timedTasks.map((task, idx) => {
                    const taskHour = parseInt((task.time || '12:00').split(':')[0], 10);
                    const taskMinute = parseInt((task.time || '12:00').split(':')[1] || '0', 10);
                    const minutesFrom6 = Math.max(0, (taskHour - 6) * 60 + taskMinute);
                    const leftOffsetPercent = Math.min(85, Math.max(2, Math.round((minutesFrom6 / 1080) * 100)));
                    const taskStyle = getTaskStyle(idx, task.priority, task.completed);

                    return (
                      <div key={task.id} className="relative h-12 flex items-center">
                        {/* Guideline line */}
                        <div className="absolute inset-x-0 h-[1px] bg-black/[0.04] dark:border-white/[0.04]" />

                        {/* Floating Task Bar */}
                        <div
                          onClick={() => {
                            sounds.playPop();
                            toggleTaskComplete(task.id);
                          }}
                          className={`absolute ${taskStyle} px-4 py-2 rounded-2xl shadow-sm cursor-pointer hover:scale-102 active:scale-95 transition-all flex items-center gap-2.5 max-w-xs z-10 backdrop-blur-xs`}
                          style={{ right: `${leftOffsetPercent}%` }}
                          title={`کلیک برای تغییر وضعیت: ${task.title}`}
                        >
                          <span className="font-mono text-[11px] font-black opacity-90 shrink-0">
                            {task.time ? toPersianDigits(task.time) : ''}
                          </span>
                          <span className={`text-xs font-black truncate ${task.completed ? 'line-through opacity-70' : ''}`}>
                            {task.title}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0 ${
                              task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent'
                            }`}
                          >
                            {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed border-black/[0.08] dark:border-white/[0.1] bg-white/40 dark:bg-zinc-800/20 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                  <span className="text-sm font-black text-slate-700 dark:text-zinc-300">
                    هنوز تسک زمان‌داری برای این روز ثبت نشده است
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm">
                    با ثبت ساعت برای تسک‌ها، چیدمان گانت روز به صورت خودکار شکل خواهد گرفت.
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreateModal(activeDate)}
                    className="mt-2 px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    + افزودن اولین کار ساعت‌دار
                  </button>
                </div>
              )}

              {/* X-Axis Hour Marks Ruler (06:00 to 24:00) */}
              <div className="flex items-center justify-between text-xs font-black text-slate-400 dark:text-zinc-500 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                {HOURS.filter((h) => h % 2 === 0).map((hour) => {
                  const hourStr = `${String(hour).padStart(2, '0')}:۰۰`;
                  const isCurrentHour = activeDate === todayISO && hour === currentHour;

                  return (
                    <span
                      key={hour}
                      className={`font-mono text-xs ${
                        isCurrentHour ? 'text-rose-500 dark:text-rose-400 font-black scale-110' : ''
                      }`}
                    >
                      {toPersianDigits(hourStr)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW 2: INTERACTIVE TIME BLOCKS (APPLE & AMIE TIME BLOCKING) */}
      {viewMode === 'blocks' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 sm:p-7 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                بلوک‌های ساعتی روز (Time Blocking Grid)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                کلیک روی هر ساعت برای ثبت فوری یا تکمیل وظایف
              </p>
            </div>
            {phaseFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setPhaseFilter('all')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                نمایش تمام ۲۴ ساعت
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredHours.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:۰۰`;
              const hourTasks = tasksByHour[hour] || [];
              const isCurrent = activeDate === todayISO && hour === currentHour;

              return (
                <div
                  key={hour}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] shadow-xs'
                      : 'border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 hover:bg-white dark:bg-[#252528] dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <span
                      className={`font-mono text-xs font-black ${
                        isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-200'
                      }`}
                    >
                      ساعت {toPersianDigits(hourStr)}
                    </span>

                    <button
                      type="button"
                      onClick={() => openCreateModal(activeDate)}
                      className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg cursor-pointer"
                      title="افزودن تسک در این ساعت"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2.5 space-y-2 min-h-[48px]">
                    {hourTasks.length > 0 ? (
                      hourTasks.map((t, idx) => {
                        const style = getTaskStyle(idx, t.priority, t.completed);

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              sounds.playPop();
                              toggleTaskComplete(t.id);
                            }}
                            className={`${style} p-2 rounded-xl flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:opacity-90`}
                          >
                            <span className={`text-xs font-black truncate ${t.completed ? 'line-through opacity-75' : ''}`}>
                              {t.title}
                            </span>
                            {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        onClick={() => openCreateModal(activeDate)}
                        className="py-2.5 text-center text-slate-300 dark:text-zinc-600 hover:text-slate-500 dark:hover:text-zinc-400 font-bold text-xs cursor-pointer rounded-xl border border-dashed border-black/[0.04] dark:border-white/[0.06]"
                      >
                        زمان آزاد • افزودن کار
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. VIEW 3: SEQUENTIAL HOURLY AGENDA (CHRONOLOGICAL STREAM) */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 sm:p-7 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                برنامه منظم روز به ترتیب ساعت (Daily Agenda Stream)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                فهرست زمانی کارهای تعیین‌شده از اول صبح تا پایان شب
              </p>
            </div>
          </div>

          {timedTasks.length > 0 ? (
            <div className="space-y-3">
              {timedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-zinc-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        toggleTaskComplete(task.id);
                      }}
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-black text-slate-900 dark:text-white ${task.completed ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium truncate max-w-md mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-zinc-700/60 text-slate-700 dark:text-zinc-200 font-mono text-xs font-black">
                      {task.time ? toPersianDigits(task.time) : '--:--'}
                    </span>
                    {task.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                        مهم
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-bold space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
              <p className="text-sm font-black text-slate-700 dark:text-zinc-300">
                هیچ تسک زمان‌بندی‌شده‌ای برای این روز موجود نیست.
              </p>
              <button
                type="button"
                onClick={() => openCreateModal(activeDate)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                + ثبت اولین تسک زمان‌دار
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
