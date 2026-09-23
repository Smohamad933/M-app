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
    <div className="space-y-5 animate-in fade-in pb-16">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="ماه قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#00b884]" />
          <span className="text-sm sm:text-base font-black text-slate-900">
            {PERSIAN_MONTHS[viewMonth - 1]} {toPersianDigits(viewYear)}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(todayISO)}
            className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors mr-2 cursor-pointer"
          >
            امروز
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="ماه بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Persian Calendar Grid */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {['ش', '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج'].map((wd, i) => (
            <span
              key={i}
              className={`text-xs font-black ${
                i === 6 ? 'text-[#f95738]' : 'text-slate-400'
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: persianFirstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12" />
          ))}

          {monthDays.map((item) => (
            <button
              key={item.iso}
              onClick={() => setSelectedDate(item.iso)}
              className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                item.isSelected
                  ? 'bg-[#121212] text-white font-black shadow-md scale-105 z-10'
                  : item.isToday
                  ? 'bg-[#00b884]/10 text-slate-900 font-black border-2 border-[#00b884]'
                  : 'hover:bg-slate-100 text-slate-700 font-bold bg-[#f8fafc] border border-slate-200/60'
              }`}
            >
              <span className="text-xs sm:text-sm font-extrabold">{toPersianDigits(item.day)}</span>

              {item.tasksCount > 0 && (
                <div className="flex items-center gap-0.5 mt-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.isSelected
                        ? 'bg-white'
                        : item.allDone
                        ? 'bg-[#00b884]'
                        : 'bg-[#f95738]'
                    }`}
                  />
                  {item.tasksCount > 1 && (
                    <span
                      className={`text-[8px] font-mono leading-none ${
                        item.isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {toPersianDigits(item.tasksCount)}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <span>تسک‌های {formatPersianDate(selectedDate, 'full')}</span>
          </h3>

          <button
            onClick={() => openCreateModal(selectedDate)}
            className="flex items-center gap-1.5 text-xs font-black text-white bg-[#121212] hover:bg-black px-4 py-2 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>تسک جدید برای این روز</span>
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400 font-bold space-y-1">
            <p>هیچ تسکی برای این روز تعریف نشده است.</p>
            <p className="text-[11px] text-slate-400">با دکمه بالا می‌توانید اولین تسک این روز را برنامه‌ریزی کنید.</p>
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
