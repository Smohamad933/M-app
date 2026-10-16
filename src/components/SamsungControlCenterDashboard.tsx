import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { WeeklyStrip } from './WeeklyStrip';
import { ZenStandbyModal } from './ZenStandbyModal';
import { CalendarSyncModal } from './CalendarSyncModal';
import { TribeChallengesModal } from './TribeChallengesModal';
import { MonthlyReportCardModal } from './MonthlyReportCardModal';
import { DataBackupModal } from './DataBackupModal';
import { FocusGardenShopModal } from './FocusGardenShopModal';
import { FocusGardenWidget } from './FocusGardenWidget';
import { MicroHabitsWidget } from './MicroHabitsWidget';
import { getUserGems } from '../utils/gemManager';
import type { Priority } from '../types';
import {
  Check,
  Clock,
  Sparkles,
  Flame,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Share2,
  Calendar,
  CalendarDays,
  Database,
  Trophy,
  Star,
  Trash2,
  ChevronDown,
  Timer,
  Feather,
  TrendingUp,
} from 'lucide-react';

interface SamsungControlCenterDashboardProps {
  onOpenCreateTask?: (date?: string) => void;
  onOpenNewspaperStory: () => void;
  onOpenDailyStory?: () => void;
  onOpenPublicProfile: (user: any) => void;
  onStartDirectChat: (friend: any) => void;
  setActiveTab: (tab: any) => void;
  interfaceMode?: 'simple' | 'advanced';
}

export const SamsungControlCenterDashboard: React.FC<SamsungControlCenterDashboardProps> = ({
  onOpenCreateTask,
  onOpenNewspaperStory,
  onOpenDailyStory,
  setActiveTab,
}) => {
  const {
    tasks,
    currentUser,
    selectedDate,
    streak,
    calendarType,
    categories,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    togglePin,
    openCreateModal,
  } = useTask();

  // Modals state
  const [isZenOpen, setIsZenOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isTribeModalOpen, setIsTribeModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [isGardenShopOpen, setIsGardenShopOpen] = useState(false);
  const [isHeroToolsOpen, setIsHeroToolsOpen] = useState(false);

  // Gems synchronization
  const userKey = currentUser?.id || 'guest';
  const [dashboardGems, setDashboardGems] = useState<number>(() => getUserGems(userKey));

  useEffect(() => {
    setDashboardGems(getUserGems(userKey));
    const handleUpdate = () => setDashboardGems(getUserGems(userKey));
    window.addEventListener('taskrooz_garden_updated', handleUpdate);
    return () => window.removeEventListener('taskrooz_garden_updated', handleUpdate);
  }, [userKey]);

  // Focus Station state (Minimal in-dashboard timer synced with selected task)
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusSeconds, setFocusSeconds] = useState<number>(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);

  // Task filter tabs
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'starred'>('all');

  // Quick Add input state (Amie-style fast input)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickDuration, setQuickDuration] = useState<number>(25);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Selected date ISO
  const activeDate = selectedDate || getTodayISO();

  // Tasks for current selected date
  const dateTasks = useMemo(() => {
    return tasks.filter((t) => t.date === activeDate);
  }, [tasks, activeDate]);

  // Filtered task stream
  const filteredTasks = useMemo(() => {
    let list = [...dateTasks];

    if (taskFilter === 'pending') {
      list = list.filter((t) => !t.completed);
    } else if (taskFilter === 'completed') {
      list = list.filter((t) => t.completed);
    } else if (taskFilter === 'starred') {
      list = list.filter((t) => t.isPinned);
    }

    // Sort: Pinned first, then incomplete first, then by time
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      return (a.time || '99:99').localeCompare(b.time || '99:99');
    });
  }, [dateTasks, taskFilter]);

  // Daily statistics
  const totalCount = dateTasks.length;
  const completedCount = dateTasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const starredCount = dateTasks.filter((t) => t.isPinned).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Active focus task object
  const activeFocusTask = useMemo(() => {
    return tasks.find((t) => t.id === focusTaskId) || null;
  }, [tasks, focusTaskId]);

  // Focus station timer countdown loop
  useEffect(() => {
    if (!isFocusRunning) return;
    const interval = setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          setIsFocusRunning(false);
          sounds.playComplete();
          if (activeFocusTask) {
            updateTask({
              ...activeFocusTask,
              focusMinutesSpent: (activeFocusTask.focusMinutesSpent || 0) + 25,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFocusRunning, activeFocusTask, updateTask]);

  // Adjust station timer by +/- 5 minutes
  const handleAdjustStationTimer = (minutes: number) => {
    sounds.playPop();
    setFocusSeconds((prev) => Math.max(60, prev + minutes * 60));
  };

  // Quick add task submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed || isSubmittingTask) return;

    setIsSubmittingTask(true);
    sounds.playPop();

    try {
      const defaultCat = categories[0]?.id || 'cat-work';
      await addTask({
        title: trimmed,
        date: activeDate,
        priority: quickPriority,
        categoryId: defaultCat,
        durationMinutes: quickDuration,
        completed: false,
        subtasks: [],
      });
      setQuickTitle('');
      sounds.playComplete();
    } catch (err) {
      console.error('Failed to quick-add task', err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Greeting based on time of day
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'صبح بخیر ☀️';
    if (hour < 16) return 'ظهر بخیر 🌤️';
    if (hour < 19) return 'عصر بخیر 🌅';
    return 'شب بخیر 🌙';
  }, []);

  // Format station timer display
  const stationMin = Math.floor(focusSeconds / 60).toString().padStart(2, '0');
  const stationSec = (focusSeconds % 60).toString().padStart(2, '0');

  const handleOpenDetailedModal = () => {
    if (onOpenCreateTask) {
      onOpenCreateTask(activeDate);
    } else {
      openCreateModal(activeDate);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 select-none pb-12 animate-in fade-in duration-300" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. ULTRA-PREMIUM APPLE & AMIE HERO CARD (Momentum & Status)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white shadow-2xl border border-white/10 backdrop-blur-2xl">
        {/* Soft luxury ambient aura in background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Right/Hero side: Greeting & Day Progress */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{greetingText}</span>
              </span>

              <span className="text-xs font-mono font-medium text-zinc-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {formatAppDate(activeDate, calendarType, 'full')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
              سلام {currentUser?.name || 'همراه گرامی'}، روز پرانرژی و موفقی داشته باشی ✨
            </h1>

            {/* Apple-style Progress Capsule */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} تسک امروز انجام شده
                  </span>
                </span>
                <span className="font-mono text-emerald-400 font-black">{toPersianDigits(completionRate)}٪</span>
              </div>

              {/* Smooth progress bar */}
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Left side: Luxury Action Pills */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            {/* Live Gems Pill */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsGardenShopOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-amber-400/40 text-amber-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 group"
              title="موجودی الماس‌های شما و ورود به فروشگاه باغچه"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse group-hover:rotate-12 transition-transform" />
              <span className="font-mono">{toPersianDigits(dashboardGems)}</span>
              <span>الماس</span>
            </button>

            {/* Daily Streak Pill */}
            <div
              className="px-3.5 py-2 rounded-2xl bg-white/10 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center gap-1.5 shadow-sm"
              title={`زنجیره استمرار: ${toPersianDigits(streak.currentStreak)} روز`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="font-mono">{toPersianDigits(streak.currentStreak)}</span>
              <span>روز استریک</span>
            </div>

            {/* Zen Standby Fullscreen Launcher */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsZenOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="ساعت رومیزی ۱۶:۹ تمام صفحه و تایمر تمرکز"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>ساعت رومیزی ۱۶:۹</span>
            </button>

            {/* Tribe Challenges Pill */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsTribeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="چالش‌های گروهی و هفتگی با دوستان"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>چالش‌های قبیله</span>
            </button>

            {/* Secondary Tools Menu in Hero */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeroToolsOpen(!isHeroToolsOpen)}
                className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="سایر امکانات و ابزارها"
              >
                <span>امکانات بیشتر</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isHeroToolsOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-zinc-900 border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 text-zinc-200 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                  onClick={() => setIsHeroToolsOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onOpenNewspaperStory();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>استوری پیشرفت و روزنامه</span>
                  </button>

                  {onOpenDailyStory && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        onOpenDailyStory();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                    >
                      <Feather className="w-4 h-4 text-amber-400" />
                      <span>داستان روز و خاطره‌نگاری</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsReportCardOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                  >
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span>کارنامه ماهانه (استوری ۹:۱۶)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActiveTab('hourly');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                  >
                    <CalendarDays className="w-4 h-4 text-sky-400" />
                    <span>بلاک‌بندی ۲۴ ساعته</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsDataBackupOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                  >
                    <Database className="w-4 h-4 text-teal-400" />
                    <span>پشتیبان‌گیری و بازیابی داده</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsCalendarSyncOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer text-right"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>خروجی و همگام‌سازی تقویم</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. TWO-COLUMN TASK-FOCUSED WORKSPACE ARCHITECTURE
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═══════════════════════════════════════════════════════════
            MAIN COLUMN: TASK STREAM & WORKFLOW (Col Span 8 on Desktop)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">
          {/* A. Amie-Style Calendar Strip */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-3.5 shadow-sm">
            <WeeklyStrip />
          </div>

          {/* B. Amie-Style Smart Quick Add Bar */}
          <form
            onSubmit={handleQuickAdd}
            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-3xl p-4 shadow-sm space-y-3 transition-all focus-within:shadow-md focus-within:border-emerald-500/50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="افزودن کار جدید برای امروز... (کلید Enter برای ثبت سریع)"
                className="flex-1 bg-transparent text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none font-bold"
              />

              <button
                type="submit"
                disabled={!quickTitle.trim() || isSubmittingTask}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <span>ثبت</span>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Quick selectors: Priority & Duration pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">اولویت:</span>
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const isSel = quickPriority === p;
                  const label = p === 'high' ? 'فوری 🔴' : p === 'medium' ? 'مهم 🟡' : 'عادی 🟢';
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuickPriority(p)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">زمان تخمینی:</span>
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setQuickDuration(mins)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      quickDuration === mins
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {toPersianDigits(mins)} دقیقه
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* C. Filter Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  taskFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                همه ({toPersianDigits(totalCount)})
              </button>

              <button
                type="button"
                onClick={() => setTaskFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  taskFilter === 'pending'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                در انتظار انجام ({toPersianDigits(pendingCount)})
              </button>

              <button
                type="button"
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  taskFilter === 'completed'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                تکمیل‌شده ({toPersianDigits(completedCount)})
              </button>

              <button
                type="button"
                onClick={() => setTaskFilter('starred')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  taskFilter === 'starred'
                    ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                ستاره‌دار ({toPersianDigits(starredCount)})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>مشاهده در بخش تسک‌ها</span>
              <span>←</span>
            </button>
          </div>

          {/* D. Task Item Stream */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-white/10 text-center space-y-3 backdrop-blur-xl">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                  {taskFilter === 'completed'
                    ? 'هنوز تسکی تکمیل نشده است'
                    : 'هیچ تسکی برای این بخش وجود ندارد!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  با ثبت کارهای روزانه از فرم بالا یا کلیک روی افزودن کار جدید، برنامه امروزتان را مشخص کنید.
                </p>
                <button
                  type="button"
                  onClick={handleOpenDetailedModal}
                  className="px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن کار با جزئیات</span>
                </button>
              </div>
            ) : (
              filteredTasks.map((t) => {
                const category = categories.find((c) => c.id === t.categoryId);
                const isSelectedForFocus = focusTaskId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      t.completed
                        ? 'bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/60 opacity-75'
                        : isSelectedForFocus
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-400/80 dark:border-emerald-500/40 shadow-sm'
                        : 'bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    {/* Checkbox + Title + Badges */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Apple-style circular fluid checkbox */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playComplete();
                          toggleTaskComplete(t.id);
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 ${
                          t.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-slate-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                        }`}
                        title={t.completed ? 'علامت‌گذاری به عنوان انجام‌نشده' : 'تکمیل تسک'}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm font-black truncate transition-all ${
                              t.completed
                                ? 'line-through text-slate-400 dark:text-zinc-500'
                                : 'text-slate-900 dark:text-zinc-100'
                            }`}
                          >
                            {t.title}
                          </span>

                          {t.isPinned && (
                            <span className="text-[10px] text-amber-500 font-bold inline-flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500" />
                              <span>پین</span>
                            </span>
                          )}
                        </div>

                        {/* Secondary Pills */}
                        <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px]">
                          {category && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                              {category.name}
                            </span>
                          )}

                          {t.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black border border-rose-200/50">
                              فوری
                            </span>
                          )}

                          {t.time && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono">
                              {toPersianDigits(t.time)}
                            </span>
                          )}

                          {t.durationMinutes && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono">
                              {toPersianDigits(t.durationMinutes)} دقیقه
                            </span>
                          )}

                          {(t.focusMinutesSpent || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                              ⏱️ {toPersianDigits(t.focusMinutesSpent || 0)}د تمرکز
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Dock */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Start Focus with this task */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setFocusTaskId(t.id);
                          setFocusSeconds((t.durationMinutes || 25) * 60);
                          setIsFocusRunning(true);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                          isSelectedForFocus
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                        }`}
                        title="اتصال این تسک به تایمر تمرکز"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تمرکز</span>
                      </button>

                      {/* Pin Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          togglePin(t.id);
                        }}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          t.isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
                        }`}
                        title={t.isPinned ? 'حذف پین' : 'پین کردن در بالا'}
                      >
                        <Star className={`w-3.5 h-3.5 ${t.isPinned ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          deleteTask(t.id);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                        title="حذف تسک"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECONDARY SIDEBAR DOCK (Col Span 4 on Desktop)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Minimal In-Dashboard Focus Station */}
          <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-5 border border-white/10 shadow-xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>ایستگاه تمرکز عمیق (Focus)</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsZenOpen(true);
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="باز کردن ساعت رومیزی تمام‌صفحه"
              >
                <span>ساعت رومیزی</span>
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Currently targeted task */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-zinc-400 block mb-0.5">تسک فعال برای تمرکز:</span>
              <span className="font-bold text-white truncate block">
                {activeFocusTask ? activeFocusTask.title : 'جلسه تمرکز آزاد (انتخاب نشده)'}
              </span>
            </div>

            {/* Live Digits & Steppers */}
            <div className="flex items-center justify-center gap-3 py-2" dir="ltr">
              <button
                type="button"
                onClick={() => handleAdjustStationTimer(-5)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="کاهش ۵ دقیقه"
              >
                -۵د
              </button>

              <div className="font-mono font-black text-4xl text-white tracking-widest tabular-nums px-4 py-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                {stationMin}:{stationSec}
              </div>

              <button
                type="button"
                onClick={() => handleAdjustStationTimer(+5)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="افزایش ۵ دقیقه"
              >
                +۵د
              </button>
            </div>

            {/* Play / Pause / Reset Action Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsFocusRunning(!isFocusRunning);
                }}
                className={`flex-1 py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                  isFocusRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-950/40'
                }`}
              >
                {isFocusRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isFocusRunning ? 'توقف موقت' : 'شروع تمرکز'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsFocusRunning(false);
                  setFocusSeconds(25 * 60);
                }}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-all cursor-pointer"
                title="شروع مجدد تایمر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Micro-Habits Widget (عادت‌های ریز روزانه) */}
          <div className="rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
            <MicroHabitsWidget />
          </div>

          {/* 3. Focus Garden Terrarium & Shop Shortcut */}
          <div className="rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
            <FocusGardenWidget />
          </div>

          {/* 4. Luxury Tools Capsule */}
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2 backdrop-blur-xl">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-2 block">
              دسترسی سریع به ابزارها:
            </span>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onOpenNewspaperStory();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-slate-800 dark:text-zinc-200 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>استوری پیشرفت و روزنامه</span>
              </div>
              <span className="text-[10px] text-slate-400">مشاهده →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsReportCardOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-slate-800 dark:text-zinc-200 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-500" />
                <span>کارنامه تصویری ماهانه (۹:۱۶)</span>
              </div>
              <span className="text-[10px] text-slate-400">دانلود →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsDataBackupOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-slate-800 dark:text-zinc-200 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-500" />
                <span>پشتیبان‌گیری و بازیابی داده</span>
              </div>
              <span className="text-[10px] text-slate-400">JSON →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsCalendarSyncOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-slate-800 dark:text-zinc-200 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>خروجی و همگام‌سازی تقویم</span>
              </div>
              <span className="text-[10px] text-slate-400">iCal →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODALS (All Features Fully Preserved & Functional)
      ───────────────────────────────────────────────────────────── */}
      <ZenStandbyModal isOpen={isZenOpen} onClose={() => setIsZenOpen(false)} />
      <CalendarSyncModal isOpen={isCalendarSyncOpen} onClose={() => setIsCalendarSyncOpen(false)} />
      <TribeChallengesModal isOpen={isTribeModalOpen} onClose={() => setIsTribeModalOpen(false)} />
      <MonthlyReportCardModal isOpen={isReportCardOpen} onClose={() => setIsReportCardOpen(false)} />
      <DataBackupModal isOpen={isDataBackupOpen} onClose={() => setIsDataBackupOpen(false)} />

      {/* Focus Garden Shop Modal */}
      <FocusGardenShopModal
        isOpen={isGardenShopOpen}
        onClose={() => setIsGardenShopOpen(false)}
        gardenGems={dashboardGems}
        onUpdateGems={(g) => setDashboardGems(g)}
        customization={{ species: 'clover', pot: 'terracotta', aura: 'none' }}
        onUpdateCustomization={() => {}}
      />
    </div>
  );
};
