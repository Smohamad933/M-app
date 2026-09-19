import React, { useRef, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { getDaysAround, getTodayISO, toPersianDigits } from '../utils/persianDate';
import { Calendar as CalendarIcon } from 'lucide-react';

export const WeeklyStrip: React.FC = () => {
  const { selectedDate, setSelectedDate, tasks } = useTask();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayISO = getTodayISO();

  // Generate 21 days (5 days before, 15 days ahead)
  const days = getDaysAround(todayISO, 4, 16);

  // Auto scroll active day into view
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="py-2.5 px-3 bg-white/40 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          تقویم روزانه
        </span>
        {selectedDate !== todayISO && (
          <button
            onClick={() => setSelectedDate(todayISO)}
            className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            <CalendarIcon className="w-3 h-3" />
            بازگشت به امروز
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 -mx-1"
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
              onClick={() => setSelectedDate(day.iso)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <span
                className={`text-[10px] font-medium ${
                  isSelected
                    ? 'text-indigo-100'
                    : isToday
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                {day.weekdayShort}
              </span>

              <span
                className={`text-base font-extrabold my-0.5 ${
                  isSelected
                    ? 'text-white'
                    : isToday
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {toPersianDigits(day.jalaliDay)}
              </span>

              {/* Status dot indicator */}
              <div className="flex items-center justify-center h-2">
                {hasTasks ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : allCompleted
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500 dark:bg-indigo-400'
                    }`}
                  />
                ) : isToday ? (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isSelected ? 'bg-indigo-200' : 'bg-indigo-400'
                    }`}
                  />
                ) : (
                  <span className="w-1 h-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
