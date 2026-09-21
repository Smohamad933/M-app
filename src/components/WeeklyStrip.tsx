import React, { useRef, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { getDaysAround, getTodayISO, toPersianDigits, formatPersianDate } from '../utils/persianDate';
import { Calendar as CalendarIcon } from 'lucide-react';

export const WeeklyStrip: React.FC = () => {
  const { selectedDate, setSelectedDate, tasks } = useTask();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayISO = getTodayISO();

  // Generate 21 days
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
    <div className="w-full min-w-0 max-w-full overflow-hidden py-2 px-1">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>{formatPersianDate(selectedDate, 'monthYear')}</span>
          <span className="text-[11px] font-normal text-zinc-400 mr-1">
            ({formatPersianDate(selectedDate, 'weekday')})
          </span>
        </span>
        {selectedDate !== todayISO && (
          <button
            onClick={() => setSelectedDate(todayISO)}
            className="text-[11px] font-bold text-zinc-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-700/50"
          >
            <span>برو به امروز</span>
          </button>
        )}
      </div>

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
              onClick={() => setSelectedDate(day.iso)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-zinc-950 shadow-md font-bold scale-105'
                  : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span
                className={`text-[10px] font-medium ${
                  isSelected
                    ? 'text-zinc-700'
                    : isToday
                    ? 'text-white font-bold'
                    : 'text-zinc-500'
                }`}
              >
                {day.weekdayShort}
              </span>

              <span
                className={`text-base font-extrabold my-0.5 ${
                  isSelected
                    ? 'text-zinc-950'
                    : isToday
                    ? 'text-white'
                    : 'text-zinc-300'
                }`}
              >
                {toPersianDigits(day.jalaliDay)}
              </span>

              <div className="flex items-center justify-center h-2">
                {hasTasks ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-zinc-950'
                        : allCompleted
                        ? 'bg-emerald-500'
                        : 'bg-zinc-400'
                    }`}
                  />
                ) : isToday ? (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isSelected ? 'bg-zinc-700' : 'bg-zinc-500'
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
