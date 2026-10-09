import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits, getTodayISO } from '../utils/persianDate';
import { Sparkles, Plus, MapPin, CalendarClock, Bell, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { sounds } from '../utils/sound';

/**
 * لیست داشبورد و تسک‌ها — نسخه بهینه‌شده با تفکیک واضح کارهای در انتظار و انجام‌شده
 */
export const DashboardTaskList: React.FC = () => {
  const {
    tasks,
    openCreateModal,
    selectedDate,
    interfaceMode,
    reminders,
    setIsRemindersModalOpen,
  } = useTask();

  const [showCompleted, setShowCompleted] = useState(true);

  const todayISO = getTodayISO();
  const pending = tasks.filter((t) => !t.completed || (t.completed as any) === '0');
  const completedToday = tasks.filter((t) => {
    const isDone = Boolean(t.completed && (t.completed as any) !== '0');
    if (!isDone) return false;
    return t.date === selectedDate || t.completedAt?.startsWith(selectedDate) || !selectedDate;
  });

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
  const activeReminders = reminders.filter((r) => r.active);

  return (
    <div className="space-y-5">
      {/* 1. Quick Reminders Bar (یادآورهای روزانه ۳۰ روزه) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 fill-amber-500/20" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-amber-950 dark:text-amber-200">
                یادآورهای روزانه (هشدار ۳۰ روزه):
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 font-black">
                {toPersianDigits(activeReminders.length)} فعال
              </span>
            </div>
            <p className="text-[11px] font-normal text-amber-800/80 dark:text-amber-400/80 mt-0.5 truncate">
              {activeReminders.length > 0
                ? activeReminders.map((r) => `${r.title} (ساعت ${toPersianDigits(r.time)})`).join(' • ')
                : 'هنوز یادآوری ثبت نکرده‌اید. با دکمه روبرو یادآور اختصاصی خود را تعریف کنید.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setIsRemindersModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تنظیم یادآور 🔔</span>
        </button>
      </div>

      {/* 2. Empty State when no pending and no completed */}
      {sorted.length === 0 && completedToday.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7 text-[#00b884]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                هیچ کاری در انتظار انجام نیست! 🎉
              </h3>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                تمام کارهای این روز تکمیل شده‌اند یا هنوز کاری ثبت نکرده‌اید. با دکمه زیر می‌توانید تسک عادی یا روتین هفتگی/ماهانه اضافه کنید.
              </p>
            </div>
            <button
              onClick={() => openCreateModal(selectedDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کار جدید</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Simple Mode High-Contrast Heading */}
          {interfaceMode === 'simple' && (
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="font-black text-sm text-slate-900 dark:text-white">
                  کارهای من (امروز)
                </h2>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  — عنوان‌ها <b className="font-black text-slate-900 dark:text-white">بولد</b> و جزئیات <span className="font-normal">عادی</span>
                </span>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                {toPersianDigits(sorted.length)} کار در انتظار
              </span>
            </div>
          )}

          {/* 3. Pinned group */}
          {pinnedTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <MapPin className="w-3.5 h-3.5 text-[#f95738]" />
                <span className="text-xs font-black text-[#f95738]">کارهای پین‌شده (مهم‌ترین‌ها در صدر)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f95738]/10 text-[#f95738] border border-[#f95738]/30 font-bold">
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

          {/* 4. Rest of the tasks, ordered by day */}
          {dayTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1 flex-wrap">
                <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-black text-slate-900 dark:text-white">کارهای روزانه و روتین‌ها</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                  {toPersianDigits(dayTasks.length)} کار
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-bold">
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

          {/* 5. Completed Tasks Group (کارهای انجام‌شده امروز) */}
          {completedToday.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between px-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00b884]" />
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                    کارهای تکمیل‌شده ({toPersianDigits(completedToday.length)})
                  </span>
                </div>
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompleted && (
                <div className="space-y-2.5 animate-in fade-in">
                  {completedToday.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
