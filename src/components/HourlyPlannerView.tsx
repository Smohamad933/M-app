import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import {
  toPersianDigits,
  getTodayISO,
  formatPersianDate,
  isoToJalali,
  jalaliToISO,
} from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Clock,
  Check,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { Task } from '../types';

export const HourlyPlannerView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    toggleTaskComplete,
    openCreateModal,
  } = useTask();

  const todayISO = getTodayISO();
  const activeDate = selectedDate || todayISO;

  // Real live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Mode: Gantt timeline view vs 24h Blocks
  const [viewMode, setViewMode] = useState<'gantt' | 'blocks'>('gantt');

  // Tasks for the selected date
  const dayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === activeDate);
  }, [tasks, activeDate]);

  // Navigate date
  const changeDate = (days: number) => {
    sounds.playPop();
    const [y, m, d] = isoToJalali(activeDate);
    const newISO = jalaliToISO(y, m, d + days);
    setSelectedDate(newISO);
  };

  // Full day planning hours: 06:00 to 24:00 (18 hours)
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
  const timedTasks = useMemo(() => {
    return dayTasks.filter((t) => t.time).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [dayTasks]);

  // Live marker position across 06:00 to 24:00 (18 hours = 1080 minutes)
  const totalMinutesFrom6 = (currentHour - 6) * 60 + currentMinute;
  const markerPercent = Math.max(0, Math.min(100, Math.round((totalMinutesFrom6 / 1080) * 100)));

  // Color schemes for Gantt tasks
  const getTaskColor = (index: number, priority?: string) => {
    if (priority === 'high') return 'bg-[#f95738] text-white';
    const palette = [
      'bg-[#00b884] text-white',
      'bg-[#6366f1] text-white',
      'bg-[#121212] text-white',
      'bg-[#f95738] text-white',
      'bg-[#0ea5e9] text-white',
    ];
    return palette[index % palette.length];
  };

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in pb-16">
      {/* 1. Header Toolbar with Date Navigator & View Switcher */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6 text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                تایم‌لاین زمانی و دیلی پلنر (Task Timeline Planner)
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/20">
                گانت ۲۴ ساعته
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              زمان‌بندی بصری کارهای روزانه روی خط زمانی با نشانگر زنده ساعت جاری
            </p>
          </div>
        </div>

        {/* Date Navigator & Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="روز بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 px-3 flex items-center gap-1.5">
              <span>{formatPersianDate(activeDate, 'dayMonth')}</span>
              {activeDate === todayISO && (
                <span className="text-[#00895f] text-[10px] font-extrabold bg-[#00b884]/20 px-1.5 py-0.2 rounded-md">
                  امروز
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="روز قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'gantt' ? 'bg-[#121212] text-white shadow-xs' : 'text-slate-600 hover:text-black'
              }`}
            >
              نمودار گانت
            </button>
            <button
              type="button"
              onClick={() => setViewMode('blocks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'blocks' ? 'bg-[#121212] text-white shadow-xs' : 'text-slate-600 hover:text-black'
              }`}
            >
              بلوک‌های ساعتی
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              window.dispatchEvent(new CustomEvent('open-ai-agent-modal'));
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00b884]" />
            <span>ثبت با AI</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block">کل تسک‌های روز</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
              {toPersianDigits(totalDayTasks)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block">کارهای زمان‌بندی‌شده</span>
            <span className="text-xl sm:text-2xl font-black text-[#00b884] mt-1 block">
              {toPersianDigits(timedTasks.length)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00895f] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block">کارهای تکمیل‌شده</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
              {toPersianDigits(completedDayTasks)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block">ساعت جاری سیستم</span>
            <span className="text-xl sm:text-2xl font-black text-[#f95738] mt-1 block font-mono">
              {toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f95738] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. VIEW 1: SIGNATURE HORIZONTAL GANTT TIMELINE (TaskMaster Style) */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-[28px] p-5 sm:p-7 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                خط زمانی افقی تسک‌ها (Horizontal Gantt Timeline)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                نمودار شناور زمان‌بندی روز بر روی بازه ۱۸ ساعته (۰۶:۰۰ تا ۲۴:۰۰) همراه با پین نارنجی زمان اکنون
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f95738] animate-pulse" />
                ساعت اکنون ({toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))})
              </span>
            </div>
          </div>

          {/* Interactive Gantt Canvas */}
          <div className="relative border border-slate-200/80 rounded-3xl bg-[#f8fafc] p-6 overflow-x-auto min-w-0">
            {/* Background texture zones */}
            <div className="absolute top-4 bottom-14 right-16 w-48 pattern-hatched rounded-2xl opacity-40 pointer-events-none" />
            <div className="absolute top-4 bottom-14 left-24 w-64 pattern-hatched rounded-2xl opacity-40 pointer-events-none" />

            {/* Live Vertical Current Time Pin */}
            {activeDate === todayISO && currentHour >= 6 && currentHour <= 24 && (
              <div
                className="absolute top-0 bottom-10 w-[2px] bg-[#f95738] z-30 pointer-events-none transition-all duration-1000"
                style={{ right: `${markerPercent}%` }}
              >
                <div className="w-4 h-4 rounded-full border-2 border-[#f95738] bg-white -mt-1 -mr-2 shadow-md flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#f95738]" />
                </div>
                <div className="bg-[#f95738] text-white text-[9px] font-black px-2 py-0.5 rounded-md -mr-5 mt-1 shadow-sm font-mono whitespace-nowrap">
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
                    const barColor = getTaskColor(idx, task.priority);

                    return (
                      <div key={task.id} className="relative h-12 flex items-center">
                        {/* Guideline line */}
                        <div className="absolute inset-x-0 h-[1px] bg-slate-200/60" />

                        {/* Floating Task Bar */}
                        <div
                          onClick={() => {
                            sounds.playPop();
                            toggleTaskComplete(task.id);
                          }}
                          className={`absolute ${barColor} px-5 py-2.5 rounded-full shadow-md cursor-pointer hover:scale-102 active:scale-95 transition-all flex items-center gap-2.5 max-w-xs z-10`}
                          style={{ right: `${leftOffsetPercent}%` }}
                          title={`کلیک برای تغییر وضعیت: ${task.title}`}
                        >
                          <span className="font-mono text-[10px] font-black opacity-90">
                            {task.time ? toPersianDigits(task.time) : ''}
                          </span>
                          <span className={`text-xs font-black truncate ${task.completed ? 'line-through opacity-75' : ''}`}>
                            {task.title}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border border-white/50 flex items-center justify-center flex-shrink-0 ${
                              task.completed ? 'bg-white text-slate-900' : 'bg-transparent'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed border-slate-200 bg-white/70 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300" />
                  <span className="text-sm font-black text-slate-700">هنوز تسک ساعت‌داری برای این روز ثبت نشده است</span>
                  <span className="text-xs text-slate-400 max-w-sm">
                    با زدن روی دکمه «ثبت با AI» یا فرم دستی، کارهای امروز خود را ساعت‌بندی کنید تا در نوار گانت قرار گیرند.
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreateModal(activeDate)}
                    className="mt-2 px-4 py-2 bg-[#121212] hover:bg-black text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                  >
                    + افزودن اولین تسک ساعت‌دار
                  </button>
                </div>
              )}

              {/* X-Axis Hour Marks Ruler (06:00 to 24:00) */}
              <div className="flex items-center justify-between text-xs font-black text-slate-400 pt-4 border-t border-slate-200/90">
                {HOURS.filter((h) => h % 2 === 0).map((hour) => {
                  const hourStr = `${String(hour).padStart(2, '0')}:۰۰`;
                  const isCurrentHour = activeDate === todayISO && hour === currentHour;

                  return (
                    <span
                      key={hour}
                      className={`font-mono text-xs ${
                        isCurrentHour ? 'text-[#f95738] font-black scale-110' : ''
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

      {/* 4. VIEW 2: 24-HOUR INTERACTIVE TIME BLOCKS */}
      {viewMode === 'blocks' && (
        <div className="bg-white rounded-[28px] p-5 sm:p-7 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm sm:text-base text-slate-900">
              بلوک‌های ساعتی روز (Time Blocking)
            </h3>
            <span className="text-xs text-slate-400 font-bold">کلیک روی هر بلوک برای افزودن یا تکمیل تسک</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOURS.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:۰۰`;
              const hourTasks = tasksByHour[hour] || [];
              const isCurrent = activeDate === todayISO && hour === currentHour;

              return (
                <div
                  key={hour}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-[#f95738] bg-orange-50/20 shadow-xs'
                      : 'border-slate-200/90 bg-[#f8fafc] hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span
                      className={`font-mono text-xs font-black ${
                        isCurrent ? 'text-[#f95738]' : 'text-slate-800'
                      }`}
                    >
                      ساعت {toPersianDigits(hourStr)}
                    </span>

                    <button
                      type="button"
                      onClick={() => openCreateModal(activeDate)}
                      className="text-slate-400 hover:text-black p-1 rounded-lg"
                      title="افزودن تسک در این ساعت"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2.5 space-y-2 min-h-[48px]">
                    {hourTasks.length > 0 ? (
                      hourTasks.map((t, idx) => {
                        const barColor = getTaskColor(idx, t.priority);

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              sounds.playPop();
                              toggleTaskComplete(t.id);
                            }}
                            className={`${barColor} p-2 rounded-xl flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:opacity-90`}
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
                        className="py-2 text-center text-slate-300 hover:text-slate-500 font-bold text-xs cursor-pointer"
                      >
                        زمان آزاد • کلیک برای ثبت کار
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
