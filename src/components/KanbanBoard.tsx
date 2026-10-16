import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits } from '../utils/persianDate';
import { CircleDot, Clock, CheckCircle2, Plus, Layers } from 'lucide-react';
import { sounds } from '../utils/sound';

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
  const doneTasks = filtered.filter((t) => t.completed);

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in select-none" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Todo */}
        <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[30px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col min-h-[480px] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06] px-1">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                در صف انجام (To Do)
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06] font-mono">
              {toPersianDigits(todoTasks.length)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal(selectedDate);
            }}
            className="w-full py-2.5 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.12] hover:border-black/30 dark:hover:border-white/30 text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-zinc-800/20 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسک جدید</span>
          </button>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pt-1">
            {todoTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {todoTasks.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs border border-dashed border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-1">
                <Layers className="w-5 h-5 opacity-40" />
                <span>تسکی در صف نیست</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Urgent / Priority */}
        <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[30px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col min-h-[480px] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06] px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-black text-rose-600 dark:text-rose-400">
                فوری و اولویت‌دار (Urgent)
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
              {toPersianDigits(urgentTasks.length)}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pt-1">
            {urgentTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {urgentTasks.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs border border-dashed border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-1">
                <Clock className="w-5 h-5 opacity-40" />
                <span>تسک فوری وجود ندارد</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[30px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col min-h-[480px] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06] px-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                تکمیل‌شده (Done)
              </h4>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              {toPersianDigits(doneTasks.length)}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pt-1">
            {doneTasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {doneTasks.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs border border-dashed border-black/[0.06] dark:border-white/[0.08] rounded-2xl space-y-1">
                <CheckCircle2 className="w-5 h-5 opacity-40" />
                <span>هنوز تسکی تکمیل نشده است</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
