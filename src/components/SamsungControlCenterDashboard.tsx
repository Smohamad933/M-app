import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { TaskMasterBentoWidgets } from './TaskMasterBentoWidgets';
import { QuickAddBar } from './QuickAddBar';
import { DashboardTaskList } from './DashboardTaskList';
import { WeeklyStrip } from './WeeklyStrip';
import { UserAvatar } from './UserAvatar';
import {
  SlidersHorizontal,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
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
    title: 'کارت‌های شاخص عملکرد (KPI)',
    subtitle: 'آمار تسک‌های امروز، نرخ پیشرفت، تمرکز عمیق و زنجیره استریک',
    colSpan: 12,
    visible: true,
    category: 'kpi',
  },
  {
    id: 'bento_tasks',
    title: 'کارهای امروز و پیام امیدبخش',
    subtitle: 'فهرست کارهای فردی و تیمی به همراه نوار پیشرفت',
    colSpan: 6,
    visible: true,
    category: 'tasks',
  },
  {
    id: 'bento_calendar',
    title: 'تقویم تعاملی ماهانه',
    subtitle: 'نمای ماه با شمارنده تسک‌ها و پشتیبانی شمسی/میلادی',
    colSpan: 6,
    visible: true,
    category: 'calendar',
  },
  {
    id: 'bento_progress',
    title: 'پیشرفت واقعی تسک‌ها در ۷ روز',
    subtitle: 'نمودار میله‌ای مقایسه‌ای انجام کارها در طول هفته',
    colSpan: 6,
    visible: true,
    category: 'kpi',
  },
  {
    id: 'bento_timeline',
    title: 'زمان‌بندی گانت تسک‌های امروز',
    subtitle: 'خط زمان زنده و تقسیم‌بندی ساعتی کارهای زمان‌دار',
    colSpan: 6,
    visible: true,
    category: 'tasks',
  },
  {
    id: 'upcoming_tasks',
    title: 'برنامه‌ی پیشِ رو و ثبت سریع',
    subtitle: 'تسک‌های اولویت‌دار روز، پین‌شده‌ها و نوار ثبت سریع',
    colSpan: 8,
    visible: true,
    category: 'tasks',
  },
  {
    id: 'story_newspaper',
    title: 'استوری روزنامه و داستان روز',
    subtitle: 'مقایسه عملکرد با مفاخر و ثبت ژورنال روزانه',
    colSpan: 4,
    visible: true,
    category: 'tools',
  },
  {
    id: 'weekly_strip',
    title: 'تقویم روزهای هفته',
    subtitle: 'نوار افقی انتخاب و مرور سریع روزهای هفته جاری',
    colSpan: 6,
    visible: true,
    category: 'calendar',
  },
  {
    id: 'productivity_tip',
    title: 'تکنیک بهره‌وری روز و پومودورو',
    subtitle: 'نکات روزانه مدیریت زمان و دکمه شروع سریع تمرکز',
    colSpan: 6,
    visible: true,
    category: 'tools',
  },
  {
    id: 'bento_notes',
    title: 'یادداشت‌های روزانه و ایده‌ها',
    subtitle: 'همگام‌سازی بلادرنگ با افزونه نیوتَب مرورگر',
    colSpan: 12,
    visible: true,
    category: 'tools',
  },
  {
    id: 'colleagues_chat',
    title: 'پیام‌ها و گفتگوی مستقیم با همکاران',
    subtitle: 'مکالمه سریع و پیام‌رسانی کاری با اعضای تیم',
    colSpan: 12,
    visible: true,
    category: 'chat',
  },
];

interface SamsungControlCenterDashboardProps {
  onOpenCreateTask: (date?: string) => void;
  onOpenNewspaperStory: () => void;
  onOpenDailyStory: () => void;
  onOpenPublicProfile: (user: any) => void;
  onStartDirectChat: (user: any) => void;
}

export const SamsungControlCenterDashboard: React.FC<SamsungControlCenterDashboardProps> = ({
  onOpenCreateTask,
  onOpenNewspaperStory,
  onOpenDailyStory,
  onOpenPublicProfile,
  onStartDirectChat,
}) => {
  const {
    tasks,
    streak,
    selectedDate,
    setActiveTab,
    getText,
    currentUser,
    friends,
  } = useTask();

  const userKey = currentUser ? (currentUser.id || currentUser.username || 'guest') : 'guest';
  const storageKey = `taskrooz_samsung_dashboard_${userKey}`;

  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<SamsungWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: SamsungWidgetConfig[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with any new defaults if missing
          const existingIds = new Set(parsed.map((w) => w.id));
          const missing = DEFAULT_SAMSUNG_WIDGETS.filter((w) => !existingIds.has(w.id));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return DEFAULT_SAMSUNG_WIDGETS;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showHiddenTray, setShowHiddenTray] = useState(false);

  // Sync when user changes
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

  // Movement operations (Up, Down, Left, Right)
  const moveUp = (index: number) => {
    if (index <= 0) return;
    sounds.playPop();
    const next = [...widgets];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    saveLayout(next);
  };

  const moveDown = (index: number) => {
    if (index >= widgets.length - 1) return;
    sounds.playPop();
    const next = [...widgets];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    saveLayout(next);
  };

  const moveLeft = (index: number) => {
    // In Persian RTL: Left is forward in the flex/grid line
    if (index >= widgets.length - 1) return;
    sounds.playPop();
    const next = [...widgets];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    saveLayout(next);
  };

  const moveRight = (index: number) => {
    // In Persian RTL: Right is backward in the flex/grid line
    if (index <= 0) return;
    sounds.playPop();
    const next = [...widgets];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    saveLayout(next);
  };

  // Resize width toggle (e.g. 6 to 12 cols, or 12 to 6)
  const toggleWidth = (index: number) => {
    sounds.playPop();
    const next = [...widgets];
    const curr = next[index].colSpan;
    if (curr === 12) {
      next[index].colSpan = 6;
    } else if (curr === 6) {
      next[index].colSpan = 12;
    } else if (curr === 8) {
      next[index].colSpan = 12;
    } else if (curr === 4) {
      next[index].colSpan = 6;
    } else {
      next[index].colSpan = 12;
    }
    saveLayout(next);
  };

  // Visibility toggle
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

  // Reset to default Samsung layout
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

  // Hidden widgets count
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  // Component Renderer for each modular widget
  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'kpi_cards':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full h-full">
            <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold">تسک‌های امروز</span>
                <CheckSquare className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {toPersianDigits(todayTotal)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-bold">
                {toPersianDigits(todayCompleted)} تسک تکمیل‌شده
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold">نرخ پیشرفت</span>
                <TrendingUp className="w-4 h-4 text-[#00b884]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {toPersianDigits(todayRate)}٪
              </div>
              <div className="w-full bg-slate-200/70 dark:bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#00b884] h-full rounded-full transition-all duration-500"
                  style={{ width: `${todayRate}%` }}
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold">تمرکز عمیق</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {toPersianDigits(totalFocusMinutes)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-bold">
                دقیقه در پومودورو
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold">زنجیره استریک</span>
                <Flame className="w-4 h-4 text-[#f95738]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {toPersianDigits(streak.currentStreak)} {getText('streakLabel')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-bold">
                بهترین رکورد: {toPersianDigits(streak.bestStreak)} {getText('streakLabel')}
              </div>
            </div>
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 w-full h-full flex flex-col justify-between">
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 w-full h-full flex flex-col justify-between">
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 w-full h-full flex flex-col justify-between">
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 w-full h-full">
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
      {/* 1. TOP HEADER & SAMSUNG CONTROL CENTER EDIT TRIGGER */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
            کنترل‌سنتر و داشبورد ماژولار
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/50">
            سامسونگ One UI 7
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:text-black dark:hover:text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 group"
              title="ویرایش آزادانه چیدمان المان‌های داشبورد مشابه کنترل سنتر سامسونگ"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
              <span>ویرایش چیدمان کنترل‌سنتر</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SAMSUNG CONTROL CENTER EDIT MODE BANNER */}
      {isEditMode && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-indigo-400 dark:border-indigo-600 shadow-xl space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>حالت شخصی‌سازی آزادانه (One UI Grid)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 font-bold">
                    فعال
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  المان‌ها را با دکمه‌های جهت (⬆️ بالا، ⬇️ پایین، ⬅️ چپ، ➡️ راست) جابجا کنید، اندازه را با ↔️ تغییر دهید یا کارت‌ها را بکشید و رها کنید.
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
                title="بازنشانی چیدمان اولیه سامسونگ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی</span>
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

          {/* Hidden Widgets Drawer */}
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

      {/* 3. RESPONSIVE 12-COLUMN SAMSUNG CONTROL CENTER GRID */}
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
              {/* EDIT OVERLAY TOOLBAR: ONE UI STYLE DIRECTIONAL CONTROLS */}
              {isEditMode && (
                <div className="absolute -top-3 left-3 right-3 z-30 flex items-center justify-between p-1 px-2.5 rounded-2xl bg-[#121212] dark:bg-zinc-800 text-white shadow-xl border border-white/10 text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <span className="font-black text-[10px] text-white truncate max-w-[120px]">
                      {w.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/15 text-slate-300 font-mono">
                      {w.colSpan === 12 ? 'کامل' : `${Math.round((w.colSpan / 12) * 100)}٪`}
                    </span>
                  </div>

                  {/* Move Controls: Up, Down, Left, Right, Width, Hide */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      title="انتقال به بالا ⬆️"
                      className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === widgets.length - 1}
                      title="انتقال به پایین ⬇️"
                      className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {/* Move Right (RTL: previous position) */}
                    <button
                      type="button"
                      onClick={() => moveRight(index)}
                      disabled={index === 0}
                      title="انتقال به راست ➡️"
                      className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Move Left (RTL: next position) */}
                    <button
                      type="button"
                      onClick={() => moveLeft(index)}
                      disabled={index === widgets.length - 1}
                      title="انتقال به چپ ⬅️"
                      className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>

                    {/* Toggle Width */}
                    <button
                      type="button"
                      onClick={() => toggleWidth(index)}
                      title="تغییر عرض (تمام‌عرض / نیم‌صفحه)"
                      className="p-1 rounded-lg hover:bg-white/20 text-amber-300 hover:text-amber-200 cursor-pointer"
                    >
                      {w.colSpan === 12 ? (
                        <Minimize2 className="w-3 h-3" />
                      ) : (
                        <Maximize2 className="w-3 h-3" />
                      )}
                    </button>

                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => toggleVisibility(index)}
                      title={w.visible ? 'مخفی کردن المان' : 'نمایش المان'}
                      className="p-1 rounded-lg hover:bg-white/20 text-rose-300 hover:text-rose-200 cursor-pointer"
                    >
                      {w.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Widget Card Body */}
              <div className="w-full h-full">
                {renderWidgetContent(w.id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
