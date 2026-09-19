import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits } from '../utils/persianDate';
import { CheckCircle, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export const TaskList: React.FC = () => {
  const {
    tasks,
    selectedDate,
    filterStatus,
    filterCategory,
    searchQuery,
    openCreateModal,
  } = useTask();

  const [showCompletedSection, setShowCompletedSection] = useState(true);

  // Filter tasks based on all active criteria
  const filteredTasks = tasks.filter((task) => {
    // If search query is present, search across all or current date
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSubtasks = task.subtasks?.some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSubtasks) return false;
    } else {
      // Must match selected date
      if (task.date !== selectedDate) return false;
    }

    // Category filter
    if (filterCategory && task.categoryId !== filterCategory) return false;

    // Status filter
    if (filterStatus === 'pending' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterStatus === 'starred' && !task.isPinned) return false;
    if (filterStatus === 'urgent' && task.priority !== 'high') return false;

    return true;
  });

  // Sort: pinned first, then high priority, then by time, then creation
  const sortedPending = filteredTasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const sortedCompleted = filteredTasks
    .filter((t) => t.completed)
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  // Empty state handling
  if (filteredTasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[360px]">
        {searchQuery ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              تسک مورد نظر پیدا نشد
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              عبارت دیگری را جستجو کنید یا فیلترهای فعال را پاک نمایید.
            </p>
          </div>
        ) : tasks.filter((t) => t.date === selectedDate).length > 0 ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              تسکی با این فیلتر وجود ندارد
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              فیلترهای انتخابی را تغییر دهید تا تسک‌های دیگر نمایش داده شوند.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-20 h-20 rounded-3xl bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                برنامه‌ای برای این روز ثبت نشده
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                با اضافه کردن اولین تسک، روزت رو با انگیزه و هدفمند شروع کن!
              </p>
            </div>
            <button
              onClick={() => openCreateModal(selectedDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              افزودن اولین تسک امروز
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Pending tasks section */}
      {sortedPending.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>در انتظار انجام</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {toPersianDigits(sortedPending.length)}
              </span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {sortedPending.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks section */}
      {sortedCompleted.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowCompletedSection(!showCompletedSection)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>انجام‌شده‌ها</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {toPersianDigits(sortedCompleted.length)}
              </span>
            </div>
            {showCompletedSection ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showCompletedSection && (
            <div className="space-y-2.5 pt-1">
              {sortedCompleted.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
