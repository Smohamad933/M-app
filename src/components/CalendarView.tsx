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
  const [viewMonth, setViewMonth] = useState(currentJm);

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

  const daysInMonth = viewMonth <= 6 ? 31 : viewMonth <= 11 ? 30 : 29;
  const [gYear, gMonth, gDay] = jalaliToGregorian(viewYear, viewMonth, 1);
  const firstDayDate = new Date(gYear, gMonth - 1, gDay);
  const jsDay = firstDayDate.getDay();
  const persianFirstDayOffset = (jsDay + 1) % 7;

  const selectedDayTasks = tasks.filter((t) => t.date === selectedDate);
  const todayISO = getTodayISO();

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
    <div className="space-y-4">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-zinc-900/70 p-3.5 rounded-2xl border border-zinc-800">
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          title="ماه بعد"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-sm font-extrabold text-white">
            {PERSIAN_MONTHS[viewMonth - 1]} {toPersianDigits(viewYear)}
          </span>
        </div>

        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          title="ماه قبل"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Persian Calendar Grid */}
      <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['ش', '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج'].map((wd, i) => (
            <span
              key={i}
              className={`text-[11px] font-bold ${
                i === 6 ? 'text-rose-400' : 'text-zinc-500'
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: persianFirstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {monthDays.map((item) => (
            <button
              key={item.iso}
              onClick={() => setSelectedDate(item.iso)}
              className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                item.isSelected
                  ? 'bg-white text-zinc-950 font-black shadow-md scale-105 z-10'
                  : item.isToday
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                  : 'hover:bg-zinc-800 text-zinc-300 font-medium'
              }`}
            >
              <span className="text-xs">{toPersianDigits(item.day)}</span>

              {item.tasksCount > 0 && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    item.isSelected
                      ? 'bg-zinc-950'
                      : item.allDone
                      ? 'bg-emerald-500'
                      : 'bg-zinc-400'
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
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
            تسک‌های {formatPersianDate(selectedDate, 'full')}
          </h3>

          <button
            onClick={() => openCreateModal(selectedDate)}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            تسک جدید برای این روز
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="p-6 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-xs text-zinc-500">
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
