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

  // Sync daily note from backend or state
  useEffect(() => {
    setNoteText(dailyNotes[selectedDate] || '');
  }, [selectedDate, dailyNotes]);

  // Keep live current hour updated every minute
  useEffect(() => {
    const tick = () => setCurrentHour(new Date().getHours());
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  // Smooth auto-scroll to current hour when viewing today
  useEffect(() => {
    const todayISO = getTodayISO();
    if (selectedDate === todayISO && scrollRef.current) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`hpln-hour-${currentHour}`);
        if (el && scrollRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, currentHour]);

  // Habits save
  const toggleHabit = (key: string) => {
    const updated = { ...habits, [key]: !habits[key] };
    setHabits(updated);
    try {
      localStorage.setItem(`taskrooz_habits_${selectedDate}`, JSON.stringify(updated));
    } catch {}
    sounds.playPop();
  };

  // Note auto-save
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    saveDailyNote(selectedDate, val);
  };

  // Jump to Now action
  const jumpToNow = () => {
    sounds.playPop();
    const el = document.getElementById(`hpln-hour-${currentHour}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Date navigation
  const navigateDay = (offsetDays: number) => {
    sounds.playPop();
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + offsetDays);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const goToToday = () => {
    sounds.playPop();
    setSelectedDate(getTodayISO());
  };

  const todayISO = getTodayISO();
  const isToday = selectedDate === todayISO;

  // Day tasks
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                دیلی پلنر ساعتی
              </h2>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00b884]/15 text-[#00895f] border border-[#00b884]/30 font-bold">
                  امروز
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              تایم‌بلاک‌بندی ۲۴ ساعته — ببین دقیقاً الان چه کار باید بکنی
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200 transition-colors cursor-pointer"
            title="روز بعد"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatPersianDate(selectedDate, 'full')}</span>
          </button>

          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200 transition-colors cursor-pointer"
            title="روز قبل"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Progress meters: day elapsed + tasks completed */}
        <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-slate-200/70 shadow-2xs">
          <div className="text-left">
            <div className="text-sm font-black text-slate-900">
              {toPersianDigits(progressPercent)}٪
            </div>
            <div className="text-[10px] text-slate-500 font-bold">
              {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} کار
            </div>
          </div>
          <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="bg-[#00b884] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {dayElapsedPercent !== null && (
            <div className="w-px h-8 bg-slate-200" />
          )}
          {dayElapsedPercent !== null && (
            <div className="text-left">
              <div className="text-sm font-black text-[#f95738]">
                {toPersianDigits(dayElapsedPercent)}٪
              </div>
              <div className="text-[10px] text-slate-500 font-bold">از روز گذشته</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): 24-Hour Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-4 relative min-w-0">
          {/* "Do this now" spotlight */}
          {isToday && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                nowTask
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : nextTask
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-50 border-slate-200 border-dashed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {nowTask ? (
                  <span className="w-8 h-8 rounded-xl bg-[#00b884]/20 text-[#00895f] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-500">
                    {nowTask ? 'همین الان باید انجام شود' : nextTask ? 'سپس، بعدی' : 'ساعت خالی است'}
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate">
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
                className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-black text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              تایم‌لاین ساعتی شبانه‌روز
            </span>
            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
              برای افزودن تسک روی هر ساعت کلیک کنید
            </span>
          </div>

          {/* Unassigned time tasks if any */}
          {unassignedTasks.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                کارهای بدون ساعت مشخص این روز ({toPersianDigits(unassignedTasks.length)})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unassignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <button
                      onClick={() => toggleTaskComplete(t.id)}
                      className="flex items-center gap-2 text-right min-w-0 flex-1 cursor-pointer"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00b884] flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs truncate ${t.completed ? 'line-through text-slate-400' : 'text-slate-800 font-bold'}`}>
                        {t.title}
                      </span>
                    </button>
                    {!t.completed && (
                      <button
                        onClick={() => openIncompleteModal(t)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 text-[10px] flex items-center gap-1 cursor-pointer"
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
            className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto pr-1"
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
                      ? 'bg-rose-50/40 border-r-2 border-r-[#f95738]'
                      : isPast
                        ? 'opacity-50'
                        : work
                          ? 'bg-slate-50/50 hover:bg-slate-50'
                          : 'hover:bg-slate-50'
                  }`}
                >
                  {/* NOW line for the current hour */}
                  {isCurrent && (
                    <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
                      <div className="h-px bg-[#f95738]" />
                      <span className="absolute top-0.5 right-2 inline-flex items-center gap-1 text-[9px] font-black text-[#f95738]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f95738] animate-pulse" />
                        الان
                      </span>
                    </div>
                  )}

                  {/* Hour badge */}
                  <div className="w-16 flex-shrink-0 pt-0.5">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        isCurrent
                          ? 'bg-[#121212] text-white border-black font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {hourChip(hour)}
                    </span>
                    {isCurrent && (
                      <span className="block text-[9px] text-[#f95738] font-black mt-0.5">
                        ساعت فعلی
                      </span>
                    )}
                    {work && !isCurrent && !isPast && (
                      <span className="block text-[9px] text-slate-400 font-bold mt-0.5">
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
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                          style={!t.completed && cat ? { borderInlineStart: `3px solid ${cat.color}` } : undefined}
                        >
                          <button
                            onClick={() => toggleTaskComplete(t.id)}
                            className="flex items-center gap-2.5 text-right min-w-0 flex-1 cursor-pointer"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00b884] flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  t.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {t.title}
                              </span>
                              {cat && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                  {cat.name}
                                </span>
                              )}
                              {t.reasonUncompleted && (
                                <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5 font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  علت تعویق: {t.reasonUncompleted}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {t.priority === 'high' && (
                              <span className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200" title="فوری">
                                <Flame className="w-3 h-3" />
                              </span>
                            )}
                            {t.priority === 'medium' && (
                              <span className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-200" title="مهم">
                                <Zap className="w-3 h-3" />
                              </span>
                            )}

                            {!t.completed && (
                              <button
                                onClick={() => openIncompleteModal(t)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-[10px] font-bold transition-colors cursor-pointer"
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400 hover:text-slate-900 flex items-center gap-1 py-1 cursor-pointer font-bold"
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

          {/* Jump-to-now floating button */}
          {isToday && hasScrolled && (
            <button
              onClick={jumpToNow}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#f95738] hover:bg-[#e04526] text-white text-[11px] font-black shadow-lg shadow-[#f95738]/30 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>برگرد به الان</span>
            </button>
          )}
        </div>

        {/* Right Column (1 Col): Daily Notes & Habits */}
        <div className="space-y-6">
          {/* Daily Notes Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                یادداشت‌ها و ارزیابی روزانه
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">ذخیره خودکار</span>
            </div>
            <textarea
              value={noteText}
              onChange={handleNoteChange}
              placeholder="نکات کلیدی امروز، ایده‌ها، درس‌آموخته‌ها و دستاوردهای روز خود را اینجا یادداشت کنید..."
              rows={6}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden focus:border-slate-400 placeholder:text-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Daily Habits Tracker Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00b884]" />
                عادت‌های کلیدی امروز
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                {toPersianDigits(Object.values(habits).filter(Boolean).length)} از ۵
              </span>
            </div>

            <div className="space-y-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => toggleHabit('water')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.water
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <span>نوشیدن ۸ لیوان آب</span>
                </div>
                {habits.water ? <CheckCircle2 className="w-4 h-4 text-sky-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('study')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.study
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>۳۰ دقیقه مطالعه تخصصی</span>
                </div>
                {habits.study ? <CheckCircle2 className="w-4 h-4 text-amber-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('exercise')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.exercise
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>ورزش، پیاده‌روی یا کشش</span>
                </div>
                {habits.exercise ? <CheckCircle2 className="w-4 h-4 text-rose-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('focus')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.focus
                    ? 'bg-purple-50 border-purple-200 text-purple-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>حداقل یک سشن پومودورو عمیق</span>
                </div>
                {habits.focus ? <CheckCircle2 className="w-4 h-4 text-purple-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                type="button"
                onClick={() => toggleHabit('sleep')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  habits.sleep
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>خواب باکیفیت و سر وقت (۷-۸ ساعت)</span>
                </div>
                {habits.sleep ? <CheckCircle2 className="w-4 h-4 text-indigo-500" /> : <Circle className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
