import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits } from '../utils/persianDate';
import { CircleDot, Clock, CheckCircle2, Plus } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    selectedDate,
    searchQuery,
    filterCategory,
    openCreateModal,
  } = useTask();

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      if (!match) return false;
    } else {
      if (t.date !== selectedDate) return false;
    }
    if (filterCategory && t.categoryId !== filterCategory) return false;
    return true;
  });

  const todoTasks = filtered.filter((t) => !t.completed && t.priority !== 'high');
  const urgentTasks = filtered.filter((t) => !t.completed && t.priority === 'high');
  const doneTasks = filtered.filter((t) => t.completed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
      {/* Column 1: Todo */}
      <div className="bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              کارهای در صف انجام
            </h4>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {toPersianDigits(todoTasks.length)}
          </span>
        </div>

        <button
          onClick={() => openCreateModal(selectedDate)}
          className="w-full py-2 mb-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          تسک جدید
        </button>

        <div className="space-y-2.5 flex-1 overflow-y-auto">
          {todoTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
          {todoTasks.length === 0 && (
            <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              موردی در این ستون نیست
            </div>
          )}
        </div>
      </div>

      {/* Column 2: In Progress / High Priority */}
      <div className="bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-3xl border border-amber-200/60 dark:border-amber-900/40 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
              فوری و اولویت بالا
            </h4>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
            {toPersianDigits(urgentTasks.length)}
          </span>
        </div>

        <div className="space-y-2.5 flex-1 overflow-y-auto pt-1">
          {urgentTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
          {urgentTasks.length === 0 && (
            <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-amber-200/50 dark:border-amber-900/30 rounded-2xl">
              تسک فوری وجود ندارد
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Done */}
      <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              تکمیل‌شده‌ها
            </h4>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
            {toPersianDigits(doneTasks.length)}
          </span>
        </div>

        <div className="space-y-2.5 flex-1 overflow-y-auto pt-1">
          {doneTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
          {doneTasks.length === 0 && (
            <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl">
              هنوز تسکی تکمیل نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
