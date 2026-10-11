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

  const todoTasks = filtered.filter(
    (t) => !t.completed && !t.reasonUncompleted && t.priority !== 'high' && !t.isPinned
  );
  const urgentTasks = filtered.filter(
    (t) => !t.completed && !t.reasonUncompleted && (t.priority === 'high' || t.isPinned)
  );
  const uncompletedTasks = filtered.filter((t) => !t.completed && !!t.reasonUncompleted);
  const doneTasks = filtered.filter((t) => t.completed);

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Todo */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-black text-slate-800">
                در صف انجام
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {toPersianDigits(todoTasks.length)}
            </span>
          </div>

          <button
            onClick={() => openCreateModal(selectedDate)}
            className="w-full py-2.5 mb-3 rounded-2xl border border-dashed border-slate-300 hover:border-slate-500 text-slate-500 hover:text-black text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            تسک جدید
          </button>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {todoTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {todoTasks.length === 0 && (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                تسک در صف وجود ندارد
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Urgent / Important */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f95738]" />
              <h4 className="text-xs font-black text-[#f95738]">
                فوری و اولویت بالا
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              {toPersianDigits(urgentTasks.length)}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pt-1">
            {urgentTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {urgentTasks.length === 0 && (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                تسک فوری وجود ندارد
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00b884]" />
              <h4 className="text-xs font-black text-[#00895f]">
                تکمیل‌شده‌ها
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {toPersianDigits(doneTasks.length)}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pt-1">
            {doneTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {doneTasks.length === 0 && (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                تسکی تکمیل نشده است
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uncompleted / Distracted tasks section */}
      {uncompletedTasks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 sm:p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h4 className="text-xs font-black text-amber-900">
                کارهای انجام‌نشده / حواس‌پرتی (با ذکر دلیل)
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {toPersianDigits(uncompletedTasks.length)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {uncompletedTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
