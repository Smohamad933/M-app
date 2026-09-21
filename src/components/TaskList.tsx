import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits } from '../utils/persianDate';
import { CheckCircle, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSubtasks = task.subtasks?.some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSubtasks) return false;
    } else {
      if (task.date !== selectedDate) return false;
    }

    if (filterCategory && task.categoryId !== filterCategory) return false;

    if (filterStatus === 'pending' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterStatus === 'starred' && !task.isPinned) return false;
    if (filterStatus === 'urgent' && task.priority !== 'high') return false;

    return true;
  });

  // Sort
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

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        {searchQuery ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto text-sm">
              🔍
            </div>
            <h3 className="text-sm font-bold text-zinc-200">
              تسک مورد نظر پیدا نشد
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              عبارت دیگری را جستجو کنید یا فیلترهای فعال را تغییر دهید.
            </p>
          </div>
        ) : tasks.filter((t) => t.date === selectedDate).length > 0 ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">
              تسکی با این فیلتر وجود ندارد
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              فیلترهای انتخابی را تغییر دهید تا تسک‌های دیگر نمایش داده شوند.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-zinc-800 text-zinc-200 border border-zinc-700/60 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                هیچ تسکی برای این روز ثبت نشده
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                برای شروع برنامه‌ریزی، اولین تسک خود را به سادگی اضافه کنید.
              </p>
            </div>
            <button
              onClick={() => openCreateModal(selectedDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              افزودن تسک برای این روز
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending tasks section */}
      {sortedPending.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <span>در انتظار انجام</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
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
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>کارهای انجام‌شده</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
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
