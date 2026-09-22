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

  // 18-hour planning window: 06:00 to 24:00 (18 hours)
  const HOURS = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => i + 6); // 6, 7, 8 ... 23
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
          // If outside 6-23, put into closest slot
          const slot = Math.max(6, Math.min(23, hourNum));
          if (!map[slot]) map[slot] = [];
          map[slot].push(task);
        }
      }
    }
    return map;
  }, [dayTasks, HOURS]);

  const totalDayTasks = dayTasks.length;
  const completedDayTasks = dayTasks.filter((t) => t.completed).length;
  const timedTasksCount = dayTasks.filter((t) => t.time).length;

  // Live marker position across 06:00 to 24:00 (18 hours total = 1080 minutes)
  const totalMinutesFrom6 = (currentHour - 6) * 60 + currentMinute;
  const markerPercent = Math.max(0, Math.min(100, Math.round((totalMinutesFrom6 / 1080) * 100)));

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in pb-12">
      {/* 1. Header Toolbar with Date Navigator */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6 text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                دیلی پلنر ساعتی (Task Timeline Planner)
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f95738]/10 text-[#f95738]">
                تایم‌لاین تعاملی
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              زمان‌بندی دقیق کارهای روز روی نوار ۲۴ ساعته با نشانگر زمان واقعی سیستم
            </p>
          </div>
        </div>

        {/* Date Navigator & Quick Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="روز بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 px-3">
              {formatPersianDate(activeDate, 'dayMonth')}
              {activeDate === todayISO && (
                <span className="text-[#00895f] mr-1.5 text-[10px] font-extrabold bg-[#00b884]/15 px-1.5 py-0.2 rounded-md">
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

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              window.dispatchEvent(new CustomEvent('open-ai-agent-modal'));
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثبت هوشمند با AI</span>
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
              {toPersianDigits(timedTasksCount)}
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

      {/* 3. Main Interactive 24-Hour Timeline Canvas (Expanded TaskMaster Gantt) */}
      <div className="bg-white rounded-[28px] p-5 sm:p-7 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900">
              خط زمانی و گانت تسک‌ها (Gantt Timeline)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              برای ثبت سریع تسک در هر ساعت، روی سطر یا ستون مربوط به آن ساعت کلیک کنید
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f95738]" />
              نشانگر زمان اکنون
            </span>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="relative border border-slate-200/80 rounded-2xl bg-[#f8fafc] p-4 overflow-x-auto min-w-0">
          {/* Live Current Time Vertical Pin (if selected date is today) */}
          {activeDate === todayISO && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#f95738] z-20 pointer-events-none transition-all duration-1000"
              style={{ right: `${markerPercent}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#f95738] bg-white -mt-1 -mr-1.5 shadow-md flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f95738]" />
              </div>
              <div className="bg-[#f95738] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md -mr-4 mt-1 shadow-xs font-mono">
                {toPersianDigits(String(currentHour).padStart(2, '0'))}:{toPersianDigits(String(currentMinute).padStart(2, '0'))}
              </div>
            </div>
          )}

          {/* Hourly Timeline Rows */}
          <div className="space-y-3 divide-y divide-slate-100 min-w-[700px]">
            {HOURS.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:۰۰`;
              const hourTasks = tasksByHour[hour] || [];
              const isPast = activeDate === todayISO && hour < currentHour;
              const isCurrent = activeDate === todayISO && hour === currentHour;

              return (
                <div
                  key={hour}
                  className={`pt-3 first:pt-0 flex items-start gap-4 transition-colors rounded-xl px-2.5 py-1.5 ${
                    isCurrent ? 'bg-orange-50/50' : 'hover:bg-white'
                  }`}
                >
                  {/* Hour Label */}
                  <div className="w-14 flex-shrink-0 text-left sm:text-right pt-1">
                    <span
                      className={`font-mono text-xs font-black ${
                        isCurrent
                          ? 'text-[#f95738]'
                          : isPast
                          ? 'text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {toPersianDigits(hourStr)}
                    </span>
                  </div>

                  {/* Tasks Container for this Hour */}
                  <div className="flex-1 flex items-center gap-2.5 flex-wrap min-h-[38px]">
                    {hourTasks.length > 0 ? (
                      hourTasks.map((t, idx) => {
                        const colors = [
                          'bg-[#f95738]',
                          'bg-[#00b884]',
                          'bg-[#6366f1]',
                          'bg-[#121212]',
                        ];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              sounds.playPop();
                              toggleTaskComplete(t.id);
                            }}
                            className={`${barColor} text-white px-4 py-2 rounded-2xl shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 max-w-sm`}
                            title="کلیک برای تغییر وضعیت تکمیل"
                          >
                            <span className="font-mono text-[10px] font-black opacity-90">
                              {t.time ? toPersianDigits(t.time) : toPersianDigits(hourStr)}
                            </span>
                            <span
                              className={`text-xs font-black truncate ${
                                t.completed ? 'line-through opacity-75' : ''
                              }`}
                            >
                              {t.title}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-md border border-white/40 flex items-center justify-center flex-shrink-0 ${
                                t.completed ? 'bg-white text-slate-900' : 'bg-transparent'
                              }`}
                            >
                              {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Empty slot placeholder */
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          openCreateModal(activeDate);
                        }}
                        className="h-8 flex-1 rounded-xl border border-dashed border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-start px-3 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all group"
                      >
                        <Plus className="w-3.5 h-3.5 ml-1.5 opacity-40 group-hover:opacity-100" />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          افزودن تسک برای ساعت {toPersianDigits(hourStr)}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
