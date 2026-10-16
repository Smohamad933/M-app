import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatAppDate,
  toPersianDigits,
  PERSIAN_MONTHS,
  GREGORIAN_MONTHS,
  GREGORIAN_MONTHS_FA,
  getTodayISO,
  parseISODate,
} from '../utils/persianDate';
import { TaskCard } from './TaskCard';
import { sounds } from '../utils/sound';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  CalendarDays,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    openCreateModal,
    calendarType,
    toggleCalendarType,
  } = useTask();

  const isGregorian = calendarType === 'gregorian';
  const today = new Date();
  const [currentJy, currentJm] = gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  const [viewYear, setViewYear] = useState(() => (isGregorian ? today.getFullYear() : currentJy));
  const [viewMonth, setViewMonth] = useState(() => (isGregorian ? today.getMonth() + 1 : currentJm));

  // Sync year and month view when calendar system switches or selectedDate changes
  useEffect(() => {
    const sel = parseISODate(selectedDate || getTodayISO());
    if (calendarType === 'gregorian') {
      setViewYear(sel.getFullYear());
      setViewMonth(sel.getMonth() + 1);
    } else {
      const [jy, jm] = gregorianToJalali(sel.getFullYear(), sel.getMonth() + 1, sel.getDate());
      setViewYear(jy);
      setViewMonth(jm);
    }
  }, [calendarType, selectedDate]);

  const handlePrevMonth = () => {
    sounds.playPop();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    sounds.playPop();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = isGregorian
    ? new Date(viewYear, viewMonth, 0).getDate()
    : viewMonth <= 6
    ? 31
    : viewMonth <= 11
    ? 30
    : 29;

  const firstDayOffset = isGregorian
    ? new Date(viewYear, viewMonth - 1, 1).getDay()
    : (() => {
        const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, 1);
        const jsDay = new Date(gy, gm - 1, gd).getDay();
        return (jsDay + 1) % 7;
      })();

  const weekdayHeaders = isGregorian
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];

  const todayISO = getTodayISO();

  // Generate days in month
  const monthDays = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = isGregorian
        ? `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        : (() => {
            const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, d);
            return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
          })();

      const dayTasks = tasks.filter((t) => t.date === iso);
      const completedCount = dayTasks.filter((t) => t.completed).length;

      list.push({
        day: d,
        displayDay: isGregorian ? String(d) : toPersianDigits(d),
        iso,
        tasks: dayTasks,
        tasksCount: dayTasks.length,
        completedCount,
        allDone: dayTasks.length > 0 && completedCount === dayTasks.length,
        isToday: iso === todayISO,
        isSelected: iso === selectedDate,
      });
    }
    return list;
  }, [daysInMonth, isGregorian, viewYear, viewMonth, tasks, todayISO, selectedDate]);

  // Month Statistics
  const monthStats = useMemo(() => {
    const allMonthTasks = monthDays.flatMap((d) => d.tasks);
    const total = allMonthTasks.length;
    const done = allMonthTasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, rate };
  }, [monthDays]);

  const selectedDayTasks = tasks.filter((t) => t.date === selectedDate);

  return (
    <div className="space-y-5 animate-in fade-in pb-20 w-full select-none" dir="rtl">
      {/* 1. TOP BENTO MONTH SELECTOR & CALENDAR CONTROLS */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Month Title & Steppers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#252528] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isGregorian
                  ? `${GREGORIAN_MONTHS[viewMonth - 1]} (${GREGORIAN_MONTHS_FA[viewMonth - 1]}) ${viewYear}`
                  : `${PERSIAN_MONTHS[viewMonth - 1]} ${toPersianDigits(viewYear)}`}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
              نمای تعاملی تقویم کاری، شمارنده وظایف و برنامه‌ریزی ماهانه
            </p>
          </div>
        </div>

        {/* Action Buttons & Calendar Toggle */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Month KPI Pills */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-xs font-bold text-slate-600 dark:text-zinc-300">
            <span>کل: <span className="font-mono font-black text-slate-900 dark:text-white">{toPersianDigits(monthStats.total)}</span></span>
            <span className="text-slate-300 dark:text-zinc-600">•</span>
            <span>انجام‌شده: <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{toPersianDigits(monthStats.done)}</span></span>
            <span className="text-slate-300 dark:text-zinc-600">•</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{toPersianDigits(monthStats.rate)}٪</span>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setSelectedDate(todayISO);
            }}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {isGregorian ? 'Today' : 'امروز'}
          </button>

          {/* Calendar Type Switcher (Jalali vs Gregorian) */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              toggleCalendarType();
            }}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="سوئیچ بین تقویم شمسی و میلادی"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
            <span>{isGregorian ? 'میلادی 🌐' : 'شمسی 📅'}</span>
          </button>

          {/* New Task for this day */}
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal(selectedDate);
            }}
            className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">ثبت تسک</span>
          </button>
        </div>
      </div>

      {/* 2. CALENDAR MONTH GRID (APPLE BENTO TILES) */}
      <div
        dir={isGregorian ? 'ltr' : 'rtl'}
        className="p-3 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] sm:rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_14px_rgba(0,0,0,0.02)] transition-all overflow-hidden"
      >
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
          {weekdayHeaders.map((wd, i) => (
            <span
              key={i}
              className={`text-[11px] sm:text-xs font-black tracking-normal truncate ${
                (isGregorian ? i === 0 : i === 6)
                  ? 'text-rose-500 dark:text-rose-400 font-black'
                  : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {/* Empty Offset Slots */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-13 sm:h-20 rounded-xl sm:rounded-2xl bg-transparent opacity-0 pointer-events-none" />
          ))}

          {/* Month Days Tiles */}
          {monthDays.map((item) => {
            const hasTasks = item.tasksCount > 0;

            return (
              <button
                key={item.iso}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedDate(item.iso);
                }}
                className={`h-13 sm:h-20 rounded-xl sm:rounded-[22px] flex flex-col items-center justify-between p-1 sm:p-2.5 relative transition-all cursor-pointer ${
                  item.isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-lg scale-102 z-10 ring-2 ring-emerald-500/40'
                    : item.isToday
                    ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-black border-2 border-emerald-500 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-[#252528] dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-black/[0.04] dark:border-white/[0.06]'
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className="text-xs sm:text-sm font-black font-mono">
                    {item.displayDay}
                  </span>

                  {/* Task Indicator Dot */}
                  {hasTasks && (
                    <span
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                        item.isSelected
                          ? 'bg-emerald-400 ring-2 ring-white/30'
                          : item.allDone
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  )}
                </div>

                {/* Mini Task Pill */}
                {hasTasks && (
                  <div
                    className={`w-full text-center py-0.5 rounded-md sm:rounded-lg text-[8.5px] sm:text-[10px] font-mono font-bold truncate transition-colors ${
                      item.isSelected
                        ? 'bg-white/15 dark:bg-black/10 text-white dark:text-slate-900'
                        : item.allDone
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <span>{toPersianDigits(item.completedCount)}/{toPersianDigits(item.tasksCount)}</span>
                    <span className="hidden sm:inline mr-0.5">کار</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTED DAY AGENDA (AMIE & APPLE STYLE STREAM) */}
      <div className="space-y-4 pt-1">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                برنامه {formatAppDate(selectedDate, calendarType, 'full')}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                {toPersianDigits(selectedDayTasks.length)} کار برای این روز ثبت شده است
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal(selectedDate);
            }}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>افزودن تسک برای این تاریخ</span>
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-dashed border-black/[0.08] dark:border-white/[0.1] text-xs text-slate-400 dark:text-zinc-500 font-bold space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-800 dark:text-zinc-200 font-black">
              هیچ کاری برای این روز در تقویم برنامه‌ریزی نشده است.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-medium">
              با زدن دکمه «افزودن تسک» می‌توانید اولین برنامه هدفمند این روز را ثبت کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
