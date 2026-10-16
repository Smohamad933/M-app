import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { TaskMasterBentoWidgets } from './TaskMasterBentoWidgets';
import { QuickAddBar } from './QuickAddBar';
import { DashboardTaskList } from './DashboardTaskList';
import { WeeklyStrip } from './WeeklyStrip';
import { UserAvatar } from './UserAvatar';
import { ZenStandbyModal } from './ZenStandbyModal';
import { CalendarSyncModal } from './CalendarSyncModal';
import { TribeChallengesModal } from './TribeChallengesModal';
import { MonthlyReportCardModal } from './MonthlyReportCardModal';
import { DataBackupModal } from './DataBackupModal';
import { DailyBriefingModal } from './DailyBriefingModal';
import { TaskTemplatesModal } from './TaskTemplatesModal';
import { FocusGardenWidget } from './FocusGardenWidget';
import { MicroHabitsWidget } from './MicroHabitsWidget';
import { getUserGems } from '../utils/gemManager';
import {
  SlidersHorizontal,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Check,
  GripVertical,
  CheckSquare,
  Clock,
  TrendingUp,
  Flame,
  Newspaper,
  Feather,
  CheckCircle2,
  MessageSquare,
  ArrowUpRight,
  CalendarDays,
  Calendar,
  Sparkles,
  Download,
  Trophy,
  Database,
  Share2,
  ChevronDown,
  Sun,
} from 'lucide-react';

export interface SamsungWidgetConfig {
  id: string;
  title: string;
  subtitle: string;
  colSpan: 12 | 8 | 6 | 4 | 3;
  visible: boolean;
  category: 'kpi' | 'tasks' | 'calendar' | 'tools' | 'chat';
}

export const DEFAULT_SAMSUNG_WIDGETS: SamsungWidgetConfig[] = [
  {
    id: 'kpi_cards',
    title: 'کارت‌های شاخص عملکرد اپل (KPI Activity)',
    subtitle: 'آمار تسک‌های امروز، نرخ پیشرفت، تمرکز عمیق و زنجیره استریک',
    colSpan: 12,
    visible: true,
    category: 'kpi',
  },
  {
    id: 'upcoming_tasks',
    title: 'برنامه و کارهای امروز (Apple Reminders)',
    subtitle: 'تسک‌های اولویت‌دار روز، پین‌شده‌ها و نوار ثبت سریع',
    colSpan: 8,
    visible: true,
    category: 'tasks',
  },
  {
    id: 'zen_standby',
    title: 'ساعت رومیزی و تمرکز ذهن (Apple StandBy)',
    subtitle: 'نمای بزرگ ساعت رومیزی، تایمر و اصوات باران و آرامش',
    colSpan: 4,
    visible: true,
    category: 'tools',
  },
  {
    id: 'focus_garden',
    title: 'باغچه تمرکز و پیشرفت (Focus Terrarium)',
    subtitle: 'پرورش گیاه مجازی با دقایق تمرکز و انجام تسک‌ها',
    colSpan: 6,
    visible: true,
    category: 'tools',
  },
  {
    id: 'micro_habits',
    title: 'هاب عادات روزانه و استمرار (Habits Matrix)',
    subtitle: 'پیگیری عادات کوچک و نقشه حرارتی ۲۸ روزه',
    colSpan: 6,
    visible: true,
    category: 'tools',
  },
  {
    id: 'apple_shortcuts',
    title: 'میانبرها و ابزارهای پرمیوم اپل (Control Center)',
    subtitle: 'کارنامه ماهانه، بلاک‌بندی ۲۴ساعته، تقویم و پشتیبان‌گیری',
    colSpan: 12,
    visible: true,
    category: 'tools',
  },
  {
    id: 'calendar_sync',
    title: 'خروجی تقویم و همگام‌سازی ابری',
    subtitle: 'خروجی استاندارد تقویم (.ics)، گوگل کلندر و اوت‌لوک',
    colSpan: 6,
    visible: false,
    category: 'tools',
  },
  {
    id: 'tribe_challenges',
    title: 'چالش‌های گروهی و قبیله',
    subtitle: 'همکاری جمعی برای فتح اهداف، دریافت الماس و جوایز نایاب',
    colSpan: 6,
    visible: false,
    category: 'tools',
  },
  {
    id: 'monthly_report_card',
    title: 'کارت وضعیت و کارنامه ماهانه',
    subtitle: 'استاتوس تصویری عملکرد ماهانه مناسب برای اشتراک‌گذاری',
    colSpan: 6,
    visible: false,
    category: 'tools',
  },
  {
    id: 'data_backup',
    title: 'پشتیبان‌گیری محلی و بازیابی اطلاعات',
    subtitle: 'دانلود نسخه پشتیبان آفلاین JSON و بازیابی آسان',
    colSpan: 6,
    visible: false,
    category: 'tools',
  },
  {
    id: 'bento_tasks',
    title: 'کارهای امروز و پیام امیدبخش',
    subtitle: 'فهرست کارهای فردی و تیمی به همراه نوار پیشرفت',
    colSpan: 6,
    visible: false,
    category: 'tasks',
  },
  {
    id: 'bento_calendar',
    title: 'تقویم تعاملی ماهانه',
    subtitle: 'نمای ماه با شمارنده تسک‌ها و پشتیبانی شمسی/میلادی',
    colSpan: 6,
    visible: false,
    category: 'calendar',
  },
  {
    id: 'bento_progress',
    title: 'پیشرفت واقعی تسک‌ها در ۷ روز',
    subtitle: 'نمودار میله‌ای مقایسه‌ای انجام کارها در طول هفته',
    colSpan: 6,
    visible: false,
    category: 'kpi',
  },
  {
    id: 'bento_timeline',
    title: 'زمان‌بندی گانت تسک‌های امروز',
    subtitle: 'خط زمان زنده و تقسیم‌بندی ساعتی کارهای زمان‌دار',
    colSpan: 6,
    visible: false,
    category: 'tasks',
  },
  {
    id: 'story_newspaper',
    title: 'استوری روزنامه و داستان روز',
    subtitle: 'مقایسه عملکرد با مفاخر و ثبت ژورنال روزانه',
    colSpan: 4,
    visible: false,
    category: 'tools',
  },
  {
    id: 'weekly_strip',
    title: 'تقویم روزهای هفته',
    subtitle: 'نوار افقی انتخاب و مرور سریع روزهای هفته جاری',
    colSpan: 6,
    visible: false,
    category: 'calendar',
  },
  {
    id: 'productivity_tip',
    title: 'تکنیک بهره‌وری روز و پومودورو',
    subtitle: 'نکات روزانه مدیریت زمان و دکمه شروع سریع تمرکز',
    colSpan: 6,
    visible: false,
    category: 'tools',
  },
  {
    id: 'bento_notes',
    title: 'یادداشت‌های روزانه و ایده‌ها',
    subtitle: 'همگام‌سازی بلادرنگ با افزونه نیوتَب مرورگر',
    colSpan: 12,
    visible: false,
    category: 'tools',
  },
  {
    id: 'colleagues_chat',
    title: 'پیام‌ها و گفتگوی مستقیم با همکاران',
    subtitle: 'مکالمه سریع و پیام‌رسانی کاری با اعضای تیم',
    colSpan: 12,
    visible: false,
    category: 'chat',
  },
];

interface SamsungControlCenterDashboardProps {
  onOpenCreateTask: (date?: string) => void;
  onOpenNewspaperStory: () => void;
  onOpenDailyStory: () => void;
  onOpenPublicProfile: (user: any) => void;
  onStartDirectChat: (friend: any) => void;
  setActiveTab: (tab: any) => void;
  interfaceMode?: 'simple' | 'advanced';
}

export const SamsungControlCenterDashboard: React.FC<SamsungControlCenterDashboardProps> = ({
  onOpenCreateTask,
  onOpenNewspaperStory,
  onOpenDailyStory,
  onOpenPublicProfile,
  onStartDirectChat,
  setActiveTab,
  interfaceMode = 'advanced',
}) => {
  const { tasks, currentUser, selectedDate, streak, getText, friends, calendarType } = useTask();

  // Modals
  const [isZenOpen, setIsZenOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isTribeModalOpen, setIsTribeModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);
  const [isTaskTemplatesOpen, setIsTaskTemplatesOpen] = useState(false);
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

  // Simple Mode is directly controlled by the sidebar interfaceMode toggle!
  const isSimpleMode = interfaceMode === 'simple';

  // Modular Layout Persistence - Apple HIG v5
  const storageKey = `taskrooz_apple_hig_v5_${userKey}`;

  const [widgets, setWidgets] = useState<SamsungWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: SamsungWidgetConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((w) => w.id));
          const missing = DEFAULT_SAMSUNG_WIDGETS.filter((w) => !existingIds.has(w.id));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return DEFAULT_SAMSUNG_WIDGETS;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showHiddenTray, setShowHiddenTray] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: SamsungWidgetConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((w) => w.id));
          const missing = DEFAULT_SAMSUNG_WIDGETS.filter((w) => !existingIds.has(w.id));
          setWidgets([...parsed, ...missing]);
          return;
        }
      }
    } catch {}
    setWidgets(DEFAULT_SAMSUNG_WIDGETS);
  }, [userKey]);

  // Persist widgets layout
  const saveLayout = (updated: SamsungWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // Movement operations
  const moveUp = (index: number) => {
    if (index <= 0) return;
    sounds.playPop();
    const next = [...widgets];
    const target = index >= 2 ? index - 2 : index - 1;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    saveLayout(next);
  };

  const moveDown = (index: number) => {
    if (index >= widgets.length - 1) return;
    sounds.playPop();
    const next = [...widgets];
    const target = index + 2 < next.length ? index + 2 : index + 1;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    saveLayout(next);
  };

  const moveLeft = (index: number) => {
    if (index >= widgets.length - 1) return;
    sounds.playPop();
    const next = [...widgets];
    const [item] = next.splice(index, 1);
    next.splice(index + 1, 0, item);
    saveLayout(next);
  };

  const moveRight = (index: number) => {
    if (index <= 0) return;
    sounds.playPop();
    const next = [...widgets];
    const [item] = next.splice(index, 1);
    next.splice(index - 1, 0, item);
    saveLayout(next);
  };

  const setWidgetWidth = (index: number, span: 12 | 8 | 6 | 4) => {
    sounds.playPop();
    const next = [...widgets];
    next[index].colSpan = span;
    saveLayout(next);
  };

  const toggleVisibility = (index: number) => {
    sounds.playPop();
    const next = [...widgets];
    next[index].visible = !next[index].visible;
    saveLayout(next);
  };

  const unhideWidget = (id: string) => {
    sounds.playComplete();
    const next = widgets.map((w) => (w.id === id ? { ...w, visible: true } : w));
    saveLayout(next);
  };

  const handleReset = () => {
    sounds.playPop();
    saveLayout(DEFAULT_SAMSUNG_WIDGETS);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    sounds.playComplete();
    const next = [...widgets];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    saveLayout(next);
  };

  // Stats calculation
  const todayTasks = tasks.filter((t) => t.date === (selectedDate || new Date().toISOString().split('T')[0]));
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);

  const hiddenWidgets = widgets.filter((w) => !w.visible);

  // Component Renderer for each modular widget
  const renderWidgetContent = (id: string, colSpan: number = 12) => {
    switch (id) {
      case 'kpi_cards': {
        const isHalf = colSpan <= 8;
        return (
          <div className={`grid gap-2.5 sm:gap-4 w-full h-full ${isHalf ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
            <div className="p-3.5 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[22px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:shadow-md transition-all min-w-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 truncate">تسک‌های امروز</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#34c759]/10 text-[#34c759] shrink-0">
                  <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {toPersianDigits(todayTotal)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-bold truncate">
                {toPersianDigits(todayCompleted)} تسک انجام شد
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[22px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:shadow-md transition-all min-w-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 truncate">نرخ پیشرفت</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#007aff]/10 text-[#007aff] shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {toPersianDigits(todayRate)}٪
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 sm:h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#007aff] h-full rounded-full transition-all duration-500"
                  style={{ width: `${todayRate}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[22px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:shadow-md transition-all min-w-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 truncate">تمرکز عمیق</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#ff9500]/10 text-[#ff9500] shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {toPersianDigits(totalFocusMinutes)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-bold truncate">
                دقیقه پومودورو
              </div>
            </div>

            <div className="p-3.5 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[22px] sm:rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:shadow-md transition-all min-w-0">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-zinc-400 truncate">استمرار روزانه</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-[#ff3b30]/10 text-[#ff3b30] shrink-0">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono truncate">
                {toPersianDigits(streak.currentStreak)} {getText('streakLabel')}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-bold truncate">
                رکورد: {toPersianDigits(streak.bestStreak)} {getText('streakLabel')}
              </div>
            </div>
          </div>
        );
      }

      case 'focus_garden':
        return <FocusGardenWidget />;

      case 'micro_habits':
        return <MicroHabitsWidget />;

      case 'zen_standby':
        return (
          <div className="p-5 sm:p-6 bg-gradient-to-br from-[#1c1c1e] via-[#242426] to-[#121214] text-white rounded-[26px] border border-white/10 shadow-md flex flex-col justify-between h-full select-none relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34c759] animate-pulse" />
                <h3 className="text-xs sm:text-sm font-black text-white">
                  ساعت رومیزی و تمرکز ذهن (StandBy)
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold border border-white/10">
                Zen Mode
              </span>
            </div>

            <div className="my-auto py-3 text-center space-y-1">
              <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest" dir="ltr">
                {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-xs text-zinc-400">
                مناسب استند میز کار با اصوات طبیعت و پس‌زمینه بدون حواس‌پرتی
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsZenOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 cursor-pointer active:scale-95"
            >
              <Maximize2 className="w-4 h-4" />
              <span>ورود به حالت تمام‌صفحه رومیزی ۱۶:۹</span>
            </button>
          </div>
        );

      case 'apple_shortcuts':
        return (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between w-full select-none">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007aff]" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  میانبرها و ابزارهای پرمیوم اپل
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#007aff]/10 text-[#007aff] font-bold">
                دسترسی سریع
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsDailyBriefingOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">مرور روز و شب</span>
                <span className="text-[10px] text-slate-400 font-mono">تمرکز و جمع‌بندی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsTaskTemplatesOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">قالب‌های آماده</span>
                <span className="text-[10px] text-slate-400 font-mono">چک‌لیست سریع</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsReportCardOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-[#5856d6]/15 text-[#5856d6] group-hover:scale-110 transition-transform">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">کارنامه ماهانه</span>
                <span className="text-[10px] text-slate-400 font-mono">استوری ۹:۱۶</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('planner');
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-[#007aff]/15 text-[#007aff] group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">بلاک ۲۴ ساعته</span>
                <span className="text-[10px] text-slate-400 font-mono">مدیریت زمان</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsTribeModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-[#ff9500]/15 text-[#ff9500] group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">چالش‌های قبیله</span>
                <span className="text-[10px] text-slate-400 font-mono">جوایز الماس</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsDataBackupOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group text-center"
              >
                <div className="p-2.5 rounded-xl bg-[#30b0c7]/15 text-[#30b0c7] group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">پشتیبان‌گیری</span>
                <span className="text-[10px] text-slate-400 font-mono">فایل آفلاین JSON</span>
              </button>
            </div>
          </div>
        );

      case 'calendar_sync':
        return (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between h-full select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  خروجی تقویم و همگام‌سازی
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold">
                .ICS / Google
              </span>
            </div>

            <div className="py-2 space-y-1">
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                تسک‌ها و برنامه‌های زمان‌دار خود را با یک کلیک به تقویم رسمی تلفن همراه، Google Calendar و Outlook منتقل کنید.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsCalendarSyncOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-500" />
              <span>دانلود فایل تقویم و تنظیمات همگام‌سازی</span>
            </button>
          </div>
        );

      case 'tribe_challenges':
        return (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between h-full select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  چالش‌های هفتگی قبیله
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                ۳ چالش فعال
              </span>
            </div>

            <div className="py-2 space-y-2">
              <div className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                در ماراتن ۱۰۰۰ دقیقه تمرکز جمعی و بستن ۵۰ تسک هفتگی با دوستان مشارکت کنید و الماس بگیرید.
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsTribeModalOpen(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                <span>مشاهده چالش‌ها و جوایز</span>
              </button>
            </div>
          </div>
        );

      case 'monthly_report_card':
        return (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between h-full select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  کارنامه ماهانه عملکرد (Story)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                ۱۰۸۰×۱۹۲۰
              </span>
            </div>

            <div className="py-2 space-y-1">
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                کارنامه تصویری با کیفیت بالا شامل مجموع تسک‌ها، ساعات تمرکز، استریک و سطح باغچه جهت اشتراک‌گذاری در استوری.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsReportCardOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>مشاهده و دانلود کارت استوری ماهانه</span>
            </button>
          </div>
        );

      case 'data_backup':
        return (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between h-full select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  پشتیبان‌گیری و بازیابی محلی
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                JSON آفلاین
              </span>
            </div>

            <div className="py-2 space-y-1">
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                دانلود یک‌کلیکه تمام تسک‌ها، پروژه‌ها، عادات و وضعیت باغچه در فایل امن JSON و بازیابی آسان در هر زمان.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsDataBackupOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>مدیریت بکاپ و بازیابی اطلاعات</span>
            </button>
          </div>
        );

      case 'bento_tasks':
        return (
          <TaskMasterBentoWidgets
            widgetType="tasks"
            onSeeAllTasks={() => setActiveTab('tasks')}
            onOpenCreateTask={() => onOpenCreateTask(selectedDate)}
          />
        );

      case 'bento_calendar':
        return (
          <TaskMasterBentoWidgets
            widgetType="calendar"
            onSeeAllTasks={() => setActiveTab('tasks')}
          />
        );

      case 'bento_progress':
        return (
          <TaskMasterBentoWidgets
            widgetType="progress"
          />
        );

      case 'bento_timeline':
        return (
          <TaskMasterBentoWidgets
            widgetType="timeline"
          />
        );

      case 'bento_notes':
        return (
          <TaskMasterBentoWidgets
            widgetType="notes"
          />
        );

      case 'upcoming_tasks':
        return (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>برنامه‌ی پیشِ رو و کارهای روز</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  اول پین‌شده‌ها، سپس به ترتیب روز — تسک‌های زودتر در صدر
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                مشاهده همه در بخش تسک‌ها →
              </button>
            </div>

            <QuickAddBar />
            <div className="flex-1">
              <DashboardTaskList onNavigateToTasks={() => setActiveTab('tasks')} />
            </div>
          </div>
        );

      case 'story_newspaper':
        return (
          <div className="bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-yellow-50 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900 rounded-3xl border border-amber-200/90 dark:border-amber-900/40 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 w-full h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  استوری روزنامه و وقایع روز
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">
                  ویژه پیشرفت
                </span>
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
                📰 تلاش امروزتان را با مفاخر و سلبریتی‌های حوزه کاری‌تان بسنجید و «داستان امروز» را ثبت کنید.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onOpenNewspaperStory();
                }}
                className="py-2.5 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>استوری روزنامه</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onOpenDailyStory();
                }}
                className="py-2.5 px-3 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Feather className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>داستان روز</span>
              </button>
            </div>
          </div>
        );

      case 'weekly_strip':
        return (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 w-full h-full flex flex-col justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span>تقویم روزهای هفته</span>
            </h3>
            <div className="w-full min-w-0 overflow-hidden">
              <WeeklyStrip />
            </div>
          </div>
        );

      case 'productivity_tip':
        return (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 w-full h-full flex flex-col justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00b884]" />
              <span>تکنیک بهره‌وری روز</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              💡 <strong>تکنیک بلوک‌های زمانی:</strong> کارهای بزرگ را به بخش‌های ۲۵ دقیقه‌ای تقسیم کنید و پس از هر بلوک، ۵ دقیقه به مغزتان استراحت دهید.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('focus')}
              className="w-full py-2.5 bg-[#121212] hover:bg-black dark:bg-white dark:text-zinc-900 text-white rounded-2xl text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
            >
              شروع جلسه پومودورو
            </button>
          </div>
        );

      case 'colleagues_chat':
        return (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 w-full h-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#121212] dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4 text-[#00b884]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    پیام‌ها و گفتگوی مستقیم با همکاران
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    ارتباط لحظه‌ای و پیام‌رسانی کاری با اعضای تیم
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>ورود به بخش پیام‌ها</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/50 space-y-2">
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                  هنوز با همکاری گفتگو نکرده‌اید.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="px-4 py-2 bg-[#121212] hover:bg-black dark:bg-white dark:text-zinc-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  شروع گفتگوی جدید با همکاران 💬
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {friends.slice(0, 6).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onStartDirectChat(f)}
                    className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/60 dark:bg-zinc-950/60 hover:bg-white dark:hover:bg-zinc-850 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="relative flex-shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPublicProfile(f);
                        }}
                        title="مشاهده پروفایل"
                      >
                        <UserAvatar user={f} size="sm" className="w-10 h-10 shadow-xs" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-900 absolute bottom-0 right-0" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white truncate">
                          {f.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          @{f.username}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 group-hover:bg-[#121212] dark:group-hover:bg-white text-slate-600 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-zinc-900 border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs"
                      title="چت مستقیم"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getColSpanClass = (span: number) => {
    switch (span) {
      case 12:
        return 'col-span-12';
      case 8:
        return 'col-span-12 lg:col-span-8';
      case 6:
        return 'col-span-12 lg:col-span-6';
      case 4:
        return 'col-span-12 md:col-span-6 lg:col-span-4';
      case 3:
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in w-full min-w-0 select-none" dir="rtl">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
            داشبورد ماژولار و دسترسی سریع
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/50">
            {isSimpleMode ? 'حالت ساده' : 'چیدمان آزاد'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isSimpleMode && (
            isEditMode ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playComplete();
                  setIsEditMode(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>پایان و ذخیره چیدمان</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsEditMode(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200/90 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:text-black dark:hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 group"
                title="ویرایش آزادانه چیدمان و موقعیت المان‌های داشبورد"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                <span>ویرایش چیدمان داشبورد</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. SHARED APPLE SPOTLIGHT HERO CARD */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#1c1c1e] via-[#28282b] to-[#121214] text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 select-none border border-white/10 animate-in fade-in">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatAppDate(selectedDate || new Date().toISOString().split('T')[0], calendarType, 'full')}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {toPersianDigits(dashboardGems)} الماس
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-rose-300 text-xs font-mono font-bold flex items-center gap-1 border border-white/10">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              {toPersianDigits(streak.currentStreak)} روز استریک
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black tracking-tight">
            سلام {currentUser?.name?.split('(')[0]?.trim() || currentUser?.name || 'همراه گرامی'}، روز پرانرژی و موفقی داشته باشی ☀️
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <span>{toPersianDigits(todayCompleted)} از {toPersianDigits(todayTotal)} تسک امروز انجام شده</span>
            <span className="text-zinc-500">•</span>
            <span className="text-emerald-400 font-bold font-mono">{toPersianDigits(todayRate)}٪ پیشرفت</span>
          </div>
        </div>

        {/* Quick Action Dock - Apple Control Center Style */}
        <div className="flex items-center gap-2 flex-wrap relative z-10 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsZenOpen(true);
            }}
            className="py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 border border-white/10"
            title="حالت ساعت رومیزی تمام‌صفحه و تایمر تمرکز ۱۶:۹"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>ساعت رومیزی و تمرکز</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setIsTribeModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-white/10"
            title="چالش‌های گروهی و هفتگی با دوستان"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>چالش‌های قبیله</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onOpenNewspaperStory();
            }}
            className="py-2.5 px-4 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            title="استوری پیشرفت و داستان روز"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>استوری روز</span>
          </button>

          {/* Secondary Tools Dropdown in Hero */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHeroToolsOpen(!isHeroToolsOpen)}
              className="py-2.5 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-white/10"
              title="سایر امکانات و ابزارها"
            >
              <span>سایر ابزارها</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {isHeroToolsOpen && (
              <div
                className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50 text-slate-800 dark:text-zinc-100 animate-in fade-in zoom-in-95"
                onClick={() => setIsHeroToolsOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsReportCardOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                >
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>کارنامه ماهانه (استوری)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('planner');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                >
                  <CalendarDays className="w-4 h-4 text-emerald-500" />
                  <span>بلاک‌بندی ۲۴ساعته</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsDataBackupOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                >
                  <Database className="w-4 h-4 text-teal-500" />
                  <span>پشتیبان‌گیری و بازیابی داده</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsCalendarSyncOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>خروجی و همگام‌سازی تقویم</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODE-SPECIFIC BODY */}
      {isSimpleMode ? (
        <div className="space-y-5 animate-in fade-in">
          {/* Direct Quick Add Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-3">
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>ثبت آسان و سریع کار جدید:</span>
            </span>
            <QuickAddBar />
          </div>

          {/* Simple Today Task Checklist */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>کارهای امروز شما</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 font-mono">
                {toPersianDigits(todayCompleted)} / {toPersianDigits(todayTotal)}
              </span>
            </div>
            <DashboardTaskList onNavigateToTasks={() => setActiveTab('tasks')} />
          </div>

          {/* Micro Habit & Garden Duo in Simple Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FocusGardenWidget />
            <MicroHabitsWidget />
          </div>
        </div>
      ) : (
        /* 3. ADVANCED MODULAR DASHBOARD VIEW */
        <>
          {/* Edit Mode Banner */}
          {isEditMode && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-indigo-400 dark:border-indigo-600 shadow-xl space-y-3 animate-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>حالت ویرایش چیدمان داشبورد</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 font-bold">
                        فعال
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                      جهت‌ها را تغییر دهید، عرض المان را با دکمه‌های درصدی تعیین کنید یا کارت‌ها را بکشید و رها کنید.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {hiddenWidgets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHiddenTray(!showHiddenTray)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>المان‌های مخفی ({toPersianDigits(hiddenWidgets.length)})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="بازنشانی چیدمان به حالت پیش‌فرض"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازنشانی پیش‌فرض</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playComplete();
                      setIsEditMode(false);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#121212] dark:bg-white text-white dark:text-zinc-900 text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تایید</span>
                  </button>
                </div>
              </div>

              {/* Hidden Widgets Shelf */}
              {showHiddenTray && hiddenWidgets.length > 0 && (
                <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                    المان‌های غیرفعال (برای بازگرداندن به داشبورد، روی + کلیک کنید):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hiddenWidgets.map((hw) => (
                      <button
                        key={hw.id}
                        type="button"
                        onClick={() => unhideWidget(hw.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold hover:border-emerald-500 transition-colors shadow-2xs cursor-pointer group"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-125 transition-transform" />
                        <span>{hw.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. MODULAR GRID */}
          <div
            className={`grid grid-cols-12 gap-5 w-full relative transition-all ${
              isEditMode
                ? 'p-3 sm:p-5 rounded-[36px] bg-slate-100/50 dark:bg-zinc-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]'
                : ''
            }`}
          >
            {widgets.map((w, index) => {
              if (!w.visible && !isEditMode) return null;

              const colSpanClass = getColSpanClass(w.colSpan);
              const isDraggingThis = draggedIndex === index;

              return (
                <div
                  key={w.id}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`${colSpanClass} transition-all duration-300 relative group/card ${
                    !w.visible ? 'opacity-40 grayscale' : ''
                  } ${
                    isEditMode
                      ? 'p-1.5 rounded-[32px] ring-2 ring-indigo-500/20 hover:ring-indigo-500/60 shadow-lg bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs'
                      : ''
                  } ${isDraggingThis ? 'scale-95 opacity-50 rotate-1' : ''}`}
                >
                  {/* EDIT OVERLAY TOOLBAR: ONE-TOUCH FREEDOM CONTROLS */}
                  {isEditMode && (
                    <div className="absolute -top-3 left-2 right-2 z-30 flex items-center justify-between p-1 px-2.5 rounded-2xl bg-[#121212] dark:bg-zinc-800 text-white shadow-xl border border-white/10 text-xs animate-in fade-in flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <span className="font-black text-[10px] text-white truncate max-w-[110px]">
                          {w.title}
                        </span>
                      </div>

                      {/* Directional Move Controls */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          title="ردیف بالا ⬆️"
                          className="p-1 rounded-md hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === widgets.length - 1}
                          title="ردیف پایین ⬇️"
                          className="p-1 rounded-md hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveRight(index)}
                          disabled={index === 0}
                          title="به راست ➡️"
                          className="p-1 rounded-md hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveLeft(index)}
                          disabled={index === widgets.length - 1}
                          title="به چپ ⬅️"
                          className="p-1 rounded-md hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Direct Width Selectors (33%, 50%, 66%, 100%) */}
                      <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
                        {[
                          { span: 4, label: '۳۳٪' },
                          { span: 6, label: '۵۰٪' },
                          { span: 8, label: '۶۶٪' },
                          { span: 12, label: '۱۰۰٪' },
                        ].map((btn) => (
                          <button
                            key={btn.span}
                            type="button"
                            onClick={() => setWidgetWidth(index, btn.span as any)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer ${
                              w.colSpan === btn.span
                                ? 'bg-emerald-500 text-white font-black'
                                : 'text-zinc-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(index)}
                        title={w.visible ? 'مخفی کردن المان' : 'نمایش المان'}
                        className="p-1 rounded-md hover:bg-white/20 text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        {w.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  {/* WIDGET CONTENT */}
                  <div className="h-full w-full">
                    {renderWidgetContent(w.id, w.colSpan)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ZEN STANDBY MODAL */}
      <ZenStandbyModal isOpen={isZenOpen} onClose={() => setIsZenOpen(false)} />

      {/* CALENDAR SYNC MODAL */}
      <CalendarSyncModal isOpen={isCalendarSyncOpen} onClose={() => setIsCalendarSyncOpen(false)} />

      {/* TRIBE SOCIAL CHALLENGES MODAL */}
      <TribeChallengesModal isOpen={isTribeModalOpen} onClose={() => setIsTribeModalOpen(false)} />

      {/* MONTHLY REPORT CARD MODAL */}
      <MonthlyReportCardModal isOpen={isReportCardOpen} onClose={() => setIsReportCardOpen(false)} />

      {/* DATA BACKUP & RESTORE MODAL */}
      <DataBackupModal isOpen={isDataBackupOpen} onClose={() => setIsDataBackupOpen(false)} />

      {/* DAILY BRIEFING & EVENING WRAP-UP MODAL */}
      <DailyBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        onOpenCreateTask={() => onOpenCreateTask(selectedDate)}
      />

      {/* PRESET TASK TEMPLATES MODAL */}
      <TaskTemplatesModal
        isOpen={isTaskTemplatesOpen}
        onClose={() => setIsTaskTemplatesOpen(false)}
      />
    </div>
  );
};
