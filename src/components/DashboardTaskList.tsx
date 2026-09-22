import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits, getTodayISO } from '../utils/persianDate';
import { Sparkles, Plus, MapPin, CalendarClock } from 'lucide-react';

/**
 * لیست داشبورد — تسک‌های در انتظار به ترتیب روز:
 * ۱) اول همهٔ تسک‌های پین‌شده
 * ۲) سپس بقیه به ترتیب تاریخ (زودترها اول — سررسیدها در بالاترین جایگاه)
 * ۳) داخل هر روز: تسک‌های دارای ساعت زودتر، بعد اولویت بالا
 */
export const DashboardTaskList: React.FC = () => {
  const { tasks, openCreateModal, selectedDate } = useTask();

  const todayISO = getTodayISO();
  const pending = tasks.filter((t) => !t.completed);

  const sorted = [...pending].sort((a, b) => {
    // 1. Pinned tasks always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. By day — the sooner day comes first (overdue days at the very top)
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;

    // 3. Within the same day: timed tasks first, earliest time first
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;

    // 4. Final tie-break: priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const pinnedTasks = sorted.filter((t) => t.isPinned);
  const dayTasks = sorted.filter((t) => !t.isPinned);
  const overdueCount = dayTasks.filter((t) => t.date < todayISO).length;

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[260px]">
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-zinc-800 text-zinc-200 border border-zinc-700/60 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">هنوز تسک در انتظاری نداری</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              اولین تسک را اضافه کن تا به ترتیب روز و با پین‌شده‌ها در صدر، اینجا برنامه‌ی تو شکل بگیرد.
            </p>
          </div>
          <button
            onClick={() => openCreateModal(selectedDate)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            افزودن تسک
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Pinned group */}
      {pinnedTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-bold text-rose-300">پین‌شده — در صدر لیست</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
              {toPersianDigits(pinnedTasks.length)}
            </span>
          </div>
          <div className="space-y-2.5">
            {pinnedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* 2. Rest of the tasks, ordered by day (sooner first) */}
      {dayTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-1 flex-wrap">
            <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-zinc-400">به ترتیب روز — زودترها اول</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              {toPersianDigits(dayTasks.length)}
            </span>
            {overdueCount > 0 && (
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                {toPersianDigits(overdueCount)} سررسید گذشته
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {dayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
