import React, { useRef, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { getDaysAround, getTodayISO, toPersianDigits, formatAppDate } from '../utils/persianDate';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { sounds } from '../utils/sound';

export const WeeklyStrip: React.FC = () => {
  const { selectedDate, setSelectedDate, tasks, calendarType, toggleCalendarType } = useTask();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayISO = getTodayISO();

  // Generate 21 days window around today
  const days = getDaysAround(todayISO, 4, 16);

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden select-none" dir="rtl">
      {/* Month Year & System Switcher */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {formatAppDate(selectedDate, calendarType, 'monthYear')}
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
            ({formatAppDate(selectedDate, calendarType, 'weekday')})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              toggleCalendarType();
            }}
            className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 px-2.5 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="تغییر سیستم تقویم (شمسی / میلادی)"
          >
            <RefreshCw className="w-3 h-3 text-indigo-500" />
            <span>{calendarType === 'jalali' ? 'شمسی 📅' : 'میلادی 🌐'}</span>
          </button>

          {selectedDate !== todayISO && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setSelectedDate(todayISO);
              }}
              className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer transition-all bg-slate-100 dark:bg-[#252528] px-2.5 py-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06]"
            >
              <span>امروز</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Days Strip */}
      <div
        ref={scrollRef}
        className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day) => {
          const isSelected = day.iso === selectedDate;
          const isToday = day.iso === todayISO;

          const dayTasks = tasks.filter((t) => t.date === day.iso);
          const hasTasks = dayTasks.length > 0;
          const allCompleted = hasTasks && dayTasks.every((t) => t.completed);

          return (
            <button
              key={day.iso}
              data-selected={isSelected}
              onClick={() => {
                sounds.playPop();
                setSelectedDate(day.iso);
              }}
              className={`flex-shrink-0 flex flex-col items-center justify-between py-2 w-12 h-18 rounded-2xl transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105 ring-2 ring-emerald-500/40 font-black'
                  : isToday
                  ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#252528] dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-black/[0.04] dark:border-white/[0.06]'
              }`}
            >
              {/* Day Name */}
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  isSelected
                    ? 'text-white/80 dark:text-slate-900/80'
                    : isToday
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-slate-400 dark:text-zinc-400'
                }`}
              >
                {calendarType === 'gregorian'
                  ? day.date.toLocaleDateString('en-US', { weekday: 'short' })
                  : day.weekdayShort}
              </span>

              {/* Day Number */}
              <span
                className={`text-sm sm:text-base font-black font-mono my-0.5 ${
                  isSelected
                    ? 'text-white dark:text-slate-900'
                    : isToday
                    ? 'text-slate-900 dark:text-white font-black'
                    : 'text-slate-800 dark:text-zinc-200'
                }`}
              >
                {calendarType === 'gregorian' ? day.date.getDate() : toPersianDigits(day.jalaliDay)}
              </span>

              {/* Task Indicator Dot */}
              <div className="flex items-center justify-center h-2">
                {hasTasks ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-400 ring-1 ring-white/50'
                        : allCompleted
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                ) : isToday ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-rose-500'
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 opacity-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
