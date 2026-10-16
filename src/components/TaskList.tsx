import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits, formatAppDate } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Clock,
  Layers,
  Flame,
  Star,
  CheckCheck,
} from 'lucide-react';

export const TaskList: React.FC = () => {
  const {
    tasks,
    selectedDate,
    filterStatus,
    setFilterStatus,
    filterCategory,
    searchQuery,
    openCreateModal,
    calendarType,
  } = useTask();

  const [showCompletedSection, setShowCompletedSection] = useState(true);
  const [showUncompletedSection, setShowUncompletedSection] = useState(true);

  const todayISO = new Date().toISOString().slice(0, 10);

  // All tasks for the selected date (unfiltered by status)
  const allDateTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const dateStats = useMemo(() => {
    const total = allDateTasks.length;
    const completed = allDateTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [allDateTasks]);

  // Filter tasks based on all active criteria
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'overdue') {
      if (task.completed || task.date >= todayISO) return false;
    } else if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSubtasks = task.subtasks?.some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSubtasks) return false;
    } else {
      if (task.date !== selectedDate) return false;
    }

    if (filterCategory && task.categoryId !== filterCategory) return false;

    if (filterStatus === 'pending' && (task.completed || task.reasonUncompleted)) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterStatus === 'starred' && !task.isPinned) return false;
    if (filterStatus === 'urgent' && task.priority !== 'high') return false;

    return true;
  });

  // Sort Pending
  const sortedPending = filteredTasks
    .filter((t) => !t.completed && !t.reasonUncompleted)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aOrder = priorityOrder[a.priority] ?? 2;
      const bOrder = priorityOrder[b.priority] ?? 2;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Sort Uncompleted with reason
  const sortedUncompleted = filteredTasks
    .filter((t) => !t.completed && Boolean(t.reasonUncompleted))
    .sort((a, b) => {
      const aTime = a.uncompletedAt ? new Date(a.uncompletedAt).getTime() : 0;
      const bTime = b.uncompletedAt ? new Date(b.uncompletedAt).getTime() : 0;
      return bTime - aTime;
    });

  // Sort Completed
  const sortedCompleted = filteredTasks
    .filter((t) => t.completed)
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div className="space-y-4 animate-in fade-in select-none w-full" dir="rtl">
      {/* 1. TOP SUMMARY CARD WITH PROGRESS BAR (APPLE GLASS STYLE) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                برنامه کارهای {formatAppDate(selectedDate, calendarType, 'full')}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                {dateStats.total === 0
                  ? 'هنوز کاری برای این روز تعریف نشده است'
                  : `${toPersianDigits(dateStats.completed)} از ${toPersianDigits(dateStats.total)} کار به سرانجام رسیده است`}
              </p>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setFilterStatus('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#252528] text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              همه ({toPersianDigits(dateStats.total)})
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setFilterStatus(filterStatus === 'urgent' ? 'all' : 'urgent');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'urgent'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>مهم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setFilterStatus(filterStatus === 'starred' ? 'all' : 'starred');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'starred'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>ستاره‌دار</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Track */}
        {dateStats.total > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>میزان پیشرفت کارهای روز</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                {toPersianDigits(dateStats.rate)}٪
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${dateStats.rate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. TASKS LIST CONTENT */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-dashed border-black/[0.08] dark:border-white/[0.1] shadow-2xs">
          {searchQuery ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#252528] text-slate-400 dark:text-zinc-400 flex items-center justify-center mx-auto text-base">
                🔍
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                تسکی با عنوان «{searchQuery}» پیدا نشد
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mx-auto">
                عبارت دیگری را جستجو کنید یا فیلترهای فعال را تغییر دهید.
              </p>
            </div>
          ) : dateStats.total > 0 ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                تسکی با فیلتر انتخابی وجود ندارد
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mx-auto">
                فیلترهای انتخابی را روی «همه» تنظیم کنید تا بقیه تسک‌ها نمایان شوند.
              </p>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setFilterStatus('all');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 text-slate-800 dark:text-zinc-200 text-xs font-black rounded-xl transition-all cursor-pointer"
              >
                نمایش همه کارهای امروز
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  هیچ تسکی برای این روز برنامه‌ریزی نشده است
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  با فشردن دکمه زیر می‌توانید اولین کار روز خود را ثبت و برنامه‌ریزی کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  openCreateModal(selectedDate);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن اولین تسک</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Tasks Section */}
          {sortedPending.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-xs font-black text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>در انتظار انجام</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-zinc-300 font-mono font-black border border-black/[0.04] dark:border-white/[0.06]">
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

          {/* Uncompleted with reason section */}
          {sortedUncompleted.length > 0 && (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setShowUncompletedSection(!showUncompletedSection);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 text-xs font-black text-amber-800 dark:text-amber-300 hover:bg-amber-500/[0.12] transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>کارهای انجام‌نشده (با ذکر دلیل)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold font-mono">
                    {toPersianDigits(sortedUncompleted.length)}
                  </span>
                </div>
                {showUncompletedSection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showUncompletedSection && (
                <div className="space-y-2.5 pt-1">
                  {sortedUncompleted.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed tasks section */}
          {sortedCompleted.length > 0 && (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setShowCompletedSection(!showCompletedSection);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 text-xs font-black text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/[0.12] transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>کارهای انجام‌شده</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold font-mono">
                    {toPersianDigits(sortedCompleted.length)}
                  </span>
                </div>
                {showCompletedSection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
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
      )}
    </div>
  );
};
