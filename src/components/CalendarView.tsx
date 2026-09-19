import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatPersianDate,
  toPersianDigits,
  PERSIAN_MONTHS,
  getTodayISO,
} from '../utils/persianDate';
import { TaskCard } from './TaskCard';
import { ChevronRight, ChevronLeft, Plus, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, selectedDate, setSelectedDate, openCreateModal } = useTask();

  const today = new Date();
  const [currentJy, currentJm] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [viewYear, setViewYear] = useState(currentJy);
  const [viewMonth, setViewMonth] = useState(currentJm); // 1 to 12

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Determine number of days in this Jalali month
  const daysInMonth = viewMonth <= 6 ? 31 : viewMonth <= 11 ? 30 : 29;

  // First day of month weekday
  const [gYear, gMonth, gDay] = jalaliToGregorian(viewYear, viewMonth, 1);
  const firstDayDate = new Date(gYear, gMonth - 1, gDay);
  // Saturday in Persian is 6 in JS getDay() or mapped:
  // Saturday = 6 -> Persian index 0
  // Sunday = 0 -> Persian index 1
  // Monday = 1 -> Persian index 2
  // Tuesday = 2 -> Persian index 3
  // Wednesday = 3 -> Persian index 4
  // Thursday = 4 -> Persian index 5
  // Friday = 5 -> Persian index 6
  const jsDay = firstDayDate.getDay();
  const persianFirstDayOffset = (jsDay + 1) % 7;

  // Selected date tasks
  const selectedDayTasks = tasks.filter((t) => t.date === selectedDate);
  const todayISO = getTodayISO();

  // Days array
  const monthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, d);
    const iso = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
    const dayTasks = tasks.filter((t) => t.date === iso);
    monthDays.push({
      day: d,
      iso,
      tasksCount: dayTasks.length,
      allDone: dayTasks.length > 0 && dayTasks.every((t) => t.completed),
      isToday: iso === todayISO,
      isSelected: iso === selectedDate,
    });
  }

  return (
    <div className="flex-1 p-4 pb-24 overflow-y-auto space-y-4">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="ماه بعد"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            {PERSIAN_MONTHS[viewMonth - 1]} {toPersianDigits(viewYear)}
          </span>
        </div>

        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="ماه قبل"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Persian Calendar Grid */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        {/* Weekday headers: ش، ۱ش، ۲ش، ۳ش، ۴ش، ۵ش، ج */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['ش', '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج'].map((wd, i) => (
            <span
              key={i}
              className={`text-[11px] font-bold ${
                i === 6 ? 'text-rose-500' : 'text-slate-400'
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month start */}
          {Array.from({ length: persianFirstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Month day buttons */}
          {monthDays.map((item) => (
            <button
              key={item.iso}
              onClick={() => setSelectedDate(item.iso)}
              className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 ${
                item.isSelected
                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm scale-105 z-10'
                  : item.isToday
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'
              }`}
            >
              <span className="text-xs">{toPersianDigits(item.day)}</span>

              {/* Task dot indicator */}
              {item.tasksCount > 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    item.isSelected
                      ? 'bg-white'
                      : item.allDone
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              تسک‌های {formatPersianDate(selectedDate, 'full')}
            </h3>
          </div>

          <button
            onClick={() => openCreateModal(selectedDate)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            تسک جدید در این روز
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-400">
            هیچ تسکی برای این روز برنامه‌ریزی نشده است.
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
