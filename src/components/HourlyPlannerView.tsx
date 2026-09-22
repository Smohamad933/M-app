import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { formatPersianDate, toPersianDigits, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  CalendarDays,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Droplets,
  Activity,
  Moon,
  Sparkles,
  Flame,
  Zap,
  LocateFixed,
} from 'lucide-react';

export const HourlyPlannerView: React.FC = () => {
  const {
    tasks,
    categories,
    globalSettings,
    selectedDate,
    setSelectedDate,
    toggleTaskComplete,
    openCreateModal,
    openIncompleteModal,
    dailyNotes,
    saveDailyNote,
  } = useTask();

  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [noteText, setNoteText] = useState<string>('');
  const [habits, setHabits] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`taskrooz_habits_${selectedDate}`);
      return raw ? JSON.parse(raw) : { water: false, study: false, exercise: false, focus: false, sleep: false };
    } catch {
      return { water: false, study: false, exercise: false, focus: false, sleep: false };
    }
  });
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track live current hour
  useEffect(() => {
    const tick = () => setCurrentHour(new Date().getHours());
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Sync daily note with selected date
  useEffect(() => {
    setNoteText(dailyNotes[selectedDate] || '');
    try {
      const raw = localStorage.getItem(`taskrooz_habits_${selectedDate}`);
      setHabits(raw ? JSON.parse(raw) : { water: false, study: false, exercise: false, focus: false, sleep: false });
    } catch {}
  }, [selectedDate, dailyNotes]);

  // Auto-scroll to the current hour on load (today only)
  useEffect(() => {
    if (selectedDate !== getTodayISO()) return;
    const id = setTimeout(() => {
      const el = document.getElementById(`hpln-hour-${new Date().getHours()}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(id);
  }, [selectedDate]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    saveDailyNote(selectedDate, val);
  };

  const toggleHabit = (key: string) => {
    sounds.playPop();
    const updated = { ...habits, [key]: !habits[key] };
    setHabits(updated);
    try {
      localStorage.setItem(`taskrooz_habits_${selectedDate}`, JSON.stringify(updated));
    } catch {}
  };

  // Day navigation
  const navigateDay = (offset: number) => {
    sounds.playPop();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const goToToday = () => {
    sounds.playPop();
    setSelectedDate(getTodayISO());
  };

  const jumpToNow = () => {
    sounds.playPop();
    const el = document.getElementById(`hpln-hour-${currentHour}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  // Filter tasks for this day
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isToday = selectedDate === getTodayISO();

  // Day elapsed percentage (today only)
  const now = new Date();
  const dayElapsedPercent = isToday
    ? Math.min(100, Math.round(((now.getHours() * 60 + now.getMinutes()) / 1440) * 100))
    : null;

  // Admin work-hours policy (subtle highlight of working hours)
  const ws = (globalSettings?.workHoursPolicy?.start || '08:30').split(':');
  const we = (globalSettings?.workHoursPolicy?.end || '17:00').split(':');
  const workStart = parseInt(ws[0], 10) || 0;
  const workEnd = parseInt(we[0], 10) || 24;
  const isWorkHour = (h: number) => h >= workStart && h < workEnd;

  // Category lookup for color coding
  const categoryMap: Record<string, { color: string; name: string }> = {};
  categories.forEach((c) => {
    categoryMap[c.id] = { color: c.color, name: c.name };
  });

  // 24-hour slots
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Group tasks by hour
  const tasksByHour: Record<number, typeof dayTasks> = {};
  hours.forEach((h) => {
    tasksByHour[h] = [];
  });

  const unassignedTasks: typeof dayTasks = [];

  dayTasks.forEach((t) => {
    if (t.time) {
      const parts = t.time.split(':');
      const h = parseInt(parts[0], 10);
      if (!isNaN(h) && tasksByHour[h]) {
        tasksByHour[h].push(t);
        return;
      }
    }
    unassignedTasks.push(t);
  });

  // "What to do right now" — current hour pending task, else the next upcoming one
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const nowPending = (tasksByHour[currentHour] || [])
    .filter((t) => !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const nowTask = nowPending[0] || null;
  const nextTask = !nowTask
    ? dayTasks
        .filter((t) => !t.completed && t.time && parseInt(t.time.split(':')[0], 10) > currentHour)
        .sort((a, b) => a.time!.localeCompare(b.time!))[0]
    : null;

  const hourChip = (h: number) => toPersianDigits(`${h.toString().padStart(2, '0')}:۰۰`);

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* 1. Header Bar: Date Switcher & Daily Progress */}
      <div className="bg-zinc-900/70 p-4 sm:p-5 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                دیلی پلنر ساعتی
              </h2>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  امروز
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              تایم‌بلاک‌بندی ۲۴ ساعته — ببین دقیقاً الان چه کار باید بکنی
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            title="روز بعد"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700/60 text-xs font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatPersianDate(selectedDate, 'full')}</span>
          </button>

          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            title="روز قبل"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Progress meters: day elapsed + tasks completed */}
        <div className="flex items-center gap-3 bg-zinc-950/60 px-4 py-2 rounded-2xl border border-zinc-800">
          <div className="text-left">
            <div className="text-sm font-black text-white">
              {toPersianDigits(progressPercent)}٪
            </div>
            <div className="text-[10px] text-zinc-400">
              {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} کار
            </div>
          </div>
          <div className="w-16 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {dayElapsedPercent !== null && (
            <div className="w-px h-8 bg-zinc-800" />
          )}
          {dayElapsedPercent !== null && (
            <div className="text-left">
              <div className="text-sm font-black text-amber-400">
                {toPersianDigits(dayElapsedPercent)}٪
              </div>
              <div className="text-[10px] text-zinc-400">از روز گذشته</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): 24-Hour Timeline */}
        <div className="lg:col-span-2 bg-zinc-900/60 rounded-3xl border border-zinc-800 p-4 sm:p-5 backdrop-blur-md space-y-4 relative min-w-0">
          {/* "Do this now" spotlight */}
          {isToday && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                nowTask
                  ? 'bg-indigo-950/30 border-indigo-800/60'
                  : nextTask
                    ? 'bg-zinc-950/60 border-zinc-800'
                    : 'bg-zinc-950/60 border-zinc-800 border-dashed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {nowTask ? (
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-zinc-400">
                    {nowTask ? 'همین الان باید انجام شود' : nextTask ? 'سپس، بعدی' : 'ساعت خالی است'}
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    {nowTask
                      ? nowTask.title
                      : nextTask
                        ? `${nextTask.title} — ساعت ${toPersianDigits(nextTask.time!)}`
                        : 'زمان مناسب برای برنامه‌ریزی کار جدید'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => openCreateModal(selectedDate)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-400" />
              تایم‌لاین ساعتی شبانه‌روز
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              برای افزودن تسک روی هر ساعت کلیک کنید
            </span>
          </div>

          {/* Unassigned time tasks if any */}
          {unassignedTasks.length > 0 && (
            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                کارهای بدون ساعت مشخص این روز ({toPersianDigits(unassignedTasks.length)})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unassignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <button
                      onClick={() => toggleTaskComplete(t.id)}
                      className="flex items-center gap-2 text-right min-w-0 flex-1 cursor-pointer"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      )}
                      <span className={`text-xs truncate ${t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {t.title}
                      </span>
                    </button>
                    {!t.completed && (
                      <button
                        onClick={() => openIncompleteModal(t)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 text-[10px] flex items-center gap-1 cursor-pointer"
                        title="ثبت دلیل عدم انجام"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Slots List */}
          <div
            ref={scrollRef}
            onScroll={(e) => setHasScrolled((e.target as HTMLDivElement).scrollTop > 240)}
            className="divide-y divide-zinc-800/60 max-h-[700px] overflow-y-auto pr-1"
          >
            {hours.map((hour) => {
              const isCurrent = isToday && currentHour === hour;
              const isPast = isToday && hour < currentHour;
              const slotTasks = tasksByHour[hour] || [];
              const work = isWorkHour(hour);

              return (
                <div
                  key={hour}
                  id={`hpln-hour-${hour}`}
                  className={`py-2.5 px-2 flex items-start gap-3 rounded-2xl transition-colors group relative ${
                    isCurrent
                      ? 'bg-indigo-950/20 border-r-2 border-r-indigo-500'
                      : isPast
                        ? 'opacity-45'
                        : work
                          ? 'bg-indigo-950/10 hover:bg-indigo-950/20'
                          : 'hover:bg-zinc-850/40'
                  }`}
                >
                  {/* NOW line for the current hour */}
                  {isCurrent && (
                    <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
                      <div className="h-px bg-rose-500/80" />
                      <span className="absolute top-0.5 right-2 inline-flex items-center gap-1 text-[9px] font-black text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        الان
                      </span>
                    </div>
                  )}

                  {/* Hour badge */}
                  <div className="w-16 flex-shrink-0 pt-0.5">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        isCurrent
                          ? 'bg-indigo-500 text-white border-indigo-400 font-black shadow-xs'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
                      }`}
                    >
                      {hourChip(hour)}
                    </span>
                    {isCurrent && (
                      <span className="block text-[9px] text-indigo-400 font-bold mt-0.5">
                        ساعت فعلی
                      </span>
                    )}
                    {work && !isCurrent && !isPast && (
                      <span className="block text-[9px] text-indigo-300/70 font-bold mt-0.5">
                        ساعت کاری
                      </span>
                    )}
                  </div>

                  {/* Tasks in this hour */}
                  <div className="flex-1 min-w-0 space-y-1.5 pt-1.5">
                    {slotTasks.map((t) => {
                      const cat = categoryMap[t.categoryId];
                      return (
                        <div
                          key={t.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                            t.completed
                              ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                              : 'bg-zinc-800/80 border-zinc-700/60 hover:border-zinc-500'
                          }`}
                          style={!t.completed && cat ? { borderInlineStart: `3px solid ${cat.color}` } : undefined}
                        >
                          <button
                            onClick={() => toggleTaskComplete(t.id)}
                            className="flex items-center gap-2.5 text-right min-w-0 flex-1 cursor-pointer"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  t.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                                }`}
                              >
                                {t.title}
                              </span>
                              {cat && (
                                <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                  {cat.name}
                                </span>
                              )}
                              {t.reasonUncompleted && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  علت تعویق: {t.reasonUncompleted}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {t.priority === 'high' && (
                              <span className="p-1 rounded bg-rose-500/20 text-rose-400" title="فوری">
                                <Flame className="w-3 h-3" />
                              </span>
                            )}
                            {t.priority === 'medium' && (
                              <span className="p-1 rounded bg-amber-500/20 text-amber-400" title="مهم">
                                <Zap className="w-3 h-3" />
                              </span>
                            )}

                            {!t.completed && (
                              <button
                                onClick={() => openIncompleteModal(t)}
                                className="px-2 py-1 rounded-lg bg-zinc-700/60 hover:bg-amber-950/40 text-zinc-300 hover:text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
                                title="چرا این کار انجام نشد؟"
                              >
                                ثبت مانع
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Button for this hour (hidden for past hours) */}
                    {slotTasks.length === 0 && !isPast && (
                      <button
                        onClick={() => openCreateModal(selectedDate)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-zinc-500 hover:text-zinc-200 flex items-center gap-1 py-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>افزودن کار در ساعت {hourChip(hour)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Jump-to-now floating button (today, after scrolling away) */}
          {isToday && hasScrolled && (
            <button
              onClick={jumpToNow}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-black shadow-lg shadow-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>برگرد به الان</span>
            </button>
          )}
        </div>

        {/* Right Column (1 Col): Daily Notes & Habits */}
        <div className="space-y-6">
          {/* Daily Notes Card */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                یادداشت‌ها و ارزیابی روزانه
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">ذخیره خودکار</span>
            </div>
            <textarea
              value={noteText}
              onChange={handleNoteChange}
              placeholder="نکات کلیدی امروز، ایده‌ها، درس‌آموخته‌ها و دستاوردهای روز خود را اینجا یادداشت کنید..."
              rows={6}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-zinc-200 text-xs outline-hidden focus:border-zinc-500 placeholder:text-zinc-600 resize-none leading-relaxed"
            />
          </div>

          {/* Daily Habits Tracker Card */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 backdrop-blur-md space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                عادت‌های کلیدی امروز
              </span>
              <span className="text-[10px] text-zinc-400">
                {toPersianDigits(Object.values(habits).filter(Boolean).length)} از ۵
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => toggleHabit('water')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.water
                    ? 'bg-sky-950/30 border-sky-800/60 text-sky-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <span>نوشیدن ۸ لیوان آب</span>
                </div>
                {habits.water ? <CheckCircle2 className="w-4 h-4 text-sky-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('study')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.study
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>۳۰ دقیقه مطالعه تخصصی</span>
                </div>
                {habits.study ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('exercise')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.exercise
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>ورزش، پیاده‌روی یا کشش</span>
                </div>
                {habits.exercise ? <CheckCircle2 className="w-4 h-4 text-rose-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('focus')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.focus
                    ? 'bg-purple-950/30 border-purple-800/60 text-purple-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>حداقل یک سشن پومودورو عمیق</span>
                </div>
                {habits.focus ? <CheckCircle2 className="w-4 h-4 text-purple-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('sleep')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.sleep
                    ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-300'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>خواب باکیفیت و سر وقت (۷-۸ ساعت)</span>
                </div>
                {habits.sleep ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <Circle className="w-4 h-4 text-zinc-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
