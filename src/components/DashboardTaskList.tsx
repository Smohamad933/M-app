import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { toPersianDigits, getTodayISO, formatAppDate } from '../utils/persianDate';
import {
  Sparkles,
  Plus,
  MapPin,
  CalendarClock,
  Bell,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  CalendarX,
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface DashboardTaskListProps {
  onNavigateToTasks?: () => void;
}

/**
 * لیست داشبورد و تسک‌ها — نسخه بهینه‌شده طبق دستور کاربر:
 * ۱. کارهای گذشته (سررسید گذشته) از لیست امروز تفکیک شده و به بخش کارهای انجام‌نشده می‌روند
 * ۲. در داشبورد حداکثر ۵ کار (پین‌شده‌ها و سریع‌ترین زمان‌ها) نمایش داده می‌شود
 * ۳. افکت فید و دکمه ارجاع به صفحه مخصوص کارهای من
 */
export const DashboardTaskList: React.FC<DashboardTaskListProps> = ({ onNavigateToTasks }) => {
  const {
    tasks,
    openCreateModal,
    selectedDate,
    calendarType,
    reminders,
    setIsRemindersModalOpen,
    updateTask,
    toggleTaskComplete,
  } = useTask();

  const [isOverdueSectionExpanded, setIsOverdueSectionExpanded] = useState(false);

  const todayISO = getTodayISO();
  const activeDate = selectedDate || todayISO;

  // Uncompleted tasks from previous days (Overdue / Incomplete)
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < todayISO);

  // Pending tasks for today (or selected date if viewing another day)
  const todayPending = tasks.filter((t) => !t.completed && t.date === activeDate);

  // Sort today's tasks: 1. Pinned first, 2. Earliest time first, 3. Priority
  const sortedToday = [...todayPending].sort((a, b) => {
    // 1. Pinned tasks always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. Earliest time first
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;

    // 3. Final tie-break: priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Limit display to max 5 tasks on Dashboard
  const MAX_DASHBOARD_TASKS = 5;
  const displayedTasks = sortedToday.slice(0, MAX_DASHBOARD_TASKS);
  const remainingCount = sortedToday.length - displayedTasks.length;

  const activeReminders = reminders.filter((r) => r.active);

  // Quick 1-click move overdue task to today
  const handleRescheduleToToday = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    await updateTask({
      ...task,
      date: todayISO,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Reminders Bar */}
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
                : 'هنوز یادآوری ثبت نکرده‌اید. برای ثبت هشدار روزانه کلیک کنید.'}
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

      {/* 2. DEDICATED INCOMPLETE / OVERDUE TASKS SECTION (کارهای انجام‌نشده از روزهای گذشته) */}
      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 overflow-hidden shadow-2xs transition-all">
          <div
            onClick={() => setIsOverdueSectionExpanded(!isOverdueSectionExpanded)}
            className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <CalendarX className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-rose-950 dark:text-rose-200">
                    کارهای انجام‌نشده از روزهای گذشته
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-black">
                    {toPersianDigits(overdueTasks.length)} کار عقب‌افتاده
                  </span>
                </div>
                <p className="text-[10px] text-rose-800/80 dark:text-rose-400/80 mt-0.5 truncate">
                  این کارها از برنامه روز خارج شده‌اند. می‌توانید با ۱ کلیک به امروز منتقل یا تکمیل کنید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 text-xs font-bold shrink-0">
              <span>{isOverdueSectionExpanded ? 'بستن' : 'مشاهده و انتقال'}</span>
              {isOverdueSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* Expanded Overdue List */}
          {isOverdueSectionExpanded && (
            <div className="p-3 pt-0 space-y-2 border-t border-rose-200/60 dark:border-rose-900/40">
              <div className="text-[11px] font-bold text-rose-900/70 dark:text-rose-300/70 pt-2 pb-1">
                تعیین تکلیف کارهای عقب‌افتاده:
              </div>
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold shrink-0">
                        {formatAppDate(task.date, calendarType, 'short')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleRescheduleToToday(task, e)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      title="انتقال تاریخ این تسک به امروز"
                    >
                      <CalendarCheck className="w-3 h-3" />
                      <span>انتقال به امروز</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleTaskComplete(task.id)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                      title="ثبت به عنوان انجام‌شده"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>انجام شد</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Empty State for Today */}
      {sortedToday.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800">
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
              onClick={() => openCreateModal(activeDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کار جدید</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 relative">
          {/* Header count badge */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 px-1">
              <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                برنامه کارهای پیش‌رو
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                {toPersianDigits(displayedTasks.length)} از {toPersianDigits(sortedToday.length)} کار
              </span>
            </div>

            {sortedToday.some((t) => t.isPinned) && (
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>پین‌شده‌ها در صدر</span>
              </span>
            )}
          </div>

          {/* Render Max 5 Tasks */}
          <div className="space-y-2.5">
            {displayedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {/* 4. SLEEK BOTTOM FADE & NAVIGATION TO FULL TASKS VIEW (هنگامی که بیش از ۵ تسک وجود دارد) */}
          {remainingCount > 0 && (
            <div className="relative pt-3 pb-1">
              {/* Soft gradient fade overlay */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-white/70 via-slate-50/90 to-slate-100/95 dark:from-slate-900/70 dark:via-slate-900/90 dark:to-slate-950/95 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping inline-block" />
                    <span>{toPersianDigits(remainingCount)} کار دیگر برای امروز در برنامه دارید</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    داشبورد فقط ۵ کار اولویت‌دار و نزدیک‌تر را نشان می‌دهد.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (onNavigateToTasks) {
                      onNavigateToTasks();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 active:scale-95"
                >
                  <span>مشاهده همه کارهای امروز</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
