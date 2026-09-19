import React from 'react';
import { useTask } from '../context/TaskContext';
import { getGreeting, formatPersianDate, toPersianDigits, getTodayISO } from '../utils/persianDate';
import {
  Flame,
  Share2,
  RotateCcw,
  Sun,
  Moon,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface HeaderProps {
  onToggleSearch: () => void;
  isSearchActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSearch, isSearchActive }) => {
  const { tasks, streak, selectedDate, settings, updateSettings, setIsShareModalOpen, resetToSampleData } = useTask();

  const greeting = getGreeting();
  const todayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const isViewingToday = selectedDate === getTodayISO();

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <header className="px-5 pt-4 pb-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-20">
      {/* Top row: Status, streak, and quick tool actions */}
      <div className="flex items-center justify-between mb-3">
        {/* Streak badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold font-sans">
              {toPersianDigits(streak.currentStreak)} روز استریک
            </span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSearch}
            aria-label="جستجو"
            className={`p-2 rounded-xl transition-all ${
              isSearchActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="جستجو در تسک‌ها"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            aria-label="اشتراک‌گذاری گزارش روزانه"
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="اشتراک‌گذاری و خروجی"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            aria-label="تغییر تم"
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title={settings.theme === 'dark' ? 'تم روشن' : 'تم تاریک'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <button
            onClick={() => {
              if (window.confirm('آیا می‌خواهید تسک‌ها به نمونه‌های اولیه بازنشانی شوند؟')) {
                resetToSampleData();
              }
            }}
            aria-label="بازنشانی اطلاعات نمونه"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="بازنشانی اطلاعات نمونه"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Greeting and selected date */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            {greeting.text}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatPersianDate(selectedDate, 'full')}
            {!isViewingToday && (
              <span className="mr-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium">
                مشاهده روز دیگر
              </span>
            )}
          </p>
        </div>

        {/* Daily progress mini widget */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {toPersianDigits(progressPercent)}٪
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {toPersianDigits(completedToday)} از {toPersianDigits(totalToday)}
            </div>
          </div>

          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-700 ease-out"
                strokeWidth="3.5"
                strokeDasharray={88}
                strokeDashoffset={88 - (88 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 absolute" />
          </div>
        </div>
      </div>
    </header>
  );
};
