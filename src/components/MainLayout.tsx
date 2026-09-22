import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, formatPersianDate } from '../utils/persianDate';
import { greetingKeySet } from '../utils/appTexts';
import { UserAvatar } from './UserAvatar';
import { ProfileModal } from './ProfileModal';
import { DashboardTaskList } from './DashboardTaskList';
import type { TabType } from '../types';
import { TaskList } from './TaskList';
import { KanbanBoard } from './KanbanBoard';
import { CalendarView } from './CalendarView';
import { FocusTimer } from './FocusTimer';
import { CategoriesView } from './CategoriesView';
import { StatsView } from './StatsView';
import { UserManagementView } from './UserManagementView';
import { TeamProjectsView } from './TeamProjectsView';
import { WeeklyStrip } from './WeeklyStrip';
import { QuickAddBar } from './QuickAddBar';
import { TaskModal } from './TaskModal';
import { ExportShareModal } from './ExportShareModal';
import { FontSelectorModal } from './FontSelectorModal';
import { TaskIncompleteModal } from './TaskIncompleteModal';
import { HourlyPlannerView } from './HourlyPlannerView';
import { HabitsAnalyzerView } from './HabitsAnalyzerView';
import { CareerGoalsView } from './CareerGoalsView';
import { BottomNav } from './BottomNav';
import { sounds } from '../utils/sound';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  CalendarDays,
  Timer,
  LayoutGrid,
  Users,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  Search,
  Plus,
  Share2,
  Columns3,
  List,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Menu,
  X,
  Type,
  Brain,
  Compass,
  Megaphone,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const {
    currentUser,
    users,
    tasks,
    projects,
    activeTab,
    setActiveTab,
    taskViewMode,
    setTaskViewMode,
    selectedDate,
    searchQuery,
    setSearchQuery,
    selectedFilterUserId,
    setSelectedFilterUserId,
    settings,
    updateSettings,
    streak,
    logout,
    openCreateModal,
    setIsShareModalOpen,
    globalSettings,
    getText,
  } = useTask();

  const todayISO = getTodayISO();
  // Admin-editable greeting (falls back to built-in defaults)
  const gk = greetingKeySet(new Date().getHours());
  const greetingText = getText(gk.text);
  const greetingSub = getText(gk.sub);

  // Admin-editable app branding (name, logo, default profile photo)
  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'تسک‌روز';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;
  const defaultAvatar = typeof appBranding?.defaultAvatarDataUrl === 'string' ? appBranding.defaultAvatarDataUrl : null;
  const firstName = (currentUser?.name || '').split(' ')[0];

  // Mobile menu / drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Live 24-hour clock
  const [liveClock, setLiveClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Metrics for Dashboard overview
  const todayTasks = tasks.filter((t) => t.date === todayISO);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);

  const navItems: Array<{ id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean; badge?: number }> = [
    { id: 'dashboard', label: 'داشبورد و آمار', icon: LayoutDashboard },
    { id: 'planner', label: 'دیلی پلنر ساعتی', icon: Clock },
    { id: 'habits', label: 'تحلیلگر عادت‌ها', icon: Brain },
    { id: 'career', label: 'اهداف و رشد شغلی', icon: Compass },
    { id: 'tasks', label: 'کارهای روزانه', icon: CheckSquare, badge: todayTasks.filter((t) => !t.completed).length },
    { id: 'projects', label: 'پروژه‌های تیمی', icon: FolderKanban, badge: projects.length },
    { id: 'calendar', label: 'تقویم شمسی', icon: CalendarDays },
    { id: 'focus', label: 'تمرکز پومودورو', icon: Timer },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: LayoutGrid },
    { id: 'users', label: 'مانیتورینگ کاربران', icon: Users, adminOnly: true, badge: users.length },
    { id: 'stats', label: 'گزارش عملکرد', icon: BarChart3 },
  ];

  const handleMobileTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex antialiased selection:bg-zinc-100 selection:text-zinc-900 w-full overflow-x-clip">
      {/* 1. Desktop RTL Sidebar (Visible on screens >= 1024px) — sticky: NEVER scrolls with the page */}
      <aside className="hidden lg:flex w-64 bg-zinc-900/60 border-l border-zinc-800/80 backdrop-blur-xl flex-col justify-between p-4 z-20 shadow-xs select-none sticky top-0 h-screen flex-shrink-0 min-h-0 overflow-hidden">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Logo & mohusyn.ir signature */}
          <div className="flex items-center gap-3 px-2 py-2.5 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-md overflow-hidden">
              {appLogo ? (
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
              ) : (
                <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                {appName}
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wide">
                BUILT BY MOHUSYN
              </p>
            </div>
          </div>

          {/* Active User Card — click to edit profile */}
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsProfileModalOpen(true);
              }}
              className="p-2.5 mb-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/60 transition-all text-right cursor-pointer w-full"
              title="ویرایش پروفایل و عکس"
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar name={currentUser.name} avatar={currentUser.avatar} fallbackImage={defaultAvatar} size="w-9 h-9 rounded-full text-sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        مدیر سیستم
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-medium">کاربر عادی</span>
                    )}
                    <span className="text-[9px] text-indigo-400 mr-auto flex items-center gap-0.5">
                      ویرایش
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Navigation Links — flex-1 with hidden-scrollbar safety net so the sidebar
              fits 100vh and NEVER shows a visible scrollbar on normal screens */}
          <nav className="space-y-0.5 flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-md font-extrabold scale-[1.01]'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
                      }`}
                    >
                      {toPersianDigits(item.badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-1.5 pt-3 border-t border-zinc-800/80 text-xs flex-shrink-0">
          {/* Admin Font Switcher */}
          {isAdmin && (
            <button
              onClick={() => {
                sounds.playPop();
                setIsFontModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-indigo-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <Type className="w-4 h-4 text-indigo-400" />
              <span>فونت کل سیستم</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>حالت روز</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-zinc-300" />
                <span>حالت شب</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-bold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>

          {/* Credits footer (admin-editable text) */}
          <div className="pt-1.5 px-1 text-[10px] text-zinc-400 font-mono">
            {getText('footerCredits')}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-clip min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-800/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
            {/* Right: Brand (mobile) / Greeting (desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Mobile App Icon */}
              <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold shadow-xs overflow-hidden">
                  {appLogo ? (
                    <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
                  ) : (
                    <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
                <span className="font-extrabold text-xs text-white sm:hidden max-[430px]:hidden">
                  {appName}
                </span>
              </div>

              {/* Greeting & Persian Date & Live 24-Hour Clock */}
              <div className="min-w-0 flex items-center gap-1 sm:gap-2">
                <span className="text-xs font-black text-white hidden sm:inline truncate" title={greetingSub}>
                  {greetingText}
                  {firstName ? <span className="text-indigo-300">، {firstName}</span> : null}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold shadow-xs min-w-0 max-w-full" title="تاریخ شمسی امروز">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{formatPersianDate(new Date(), 'full')}</span>
                  <span className="sm:hidden truncate">{formatPersianDate(new Date(), 'dayMonth')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-200 border border-zinc-800 font-mono font-bold flex-shrink-0 max-[430px]:hidden" title="ساعت ۲۴ ساعته">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {liveClock}
                </span>
              </div>
            </div>

            {/* Left: Actions & Search */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Day / Night Theme Toggle */}
              <button
                onClick={() => {
                  sounds.playPop();
                  updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title={settings.theme === 'dark' ? 'تغییر به تم روز ☀️' : 'تغییر به تم شب 🌙'}
                aria-label="تغییر حالت شب و روز"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold hidden sm:inline text-amber-300">روز</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-bold hidden sm:inline text-indigo-300">شب</span>
                  </>
                )}
              </button>

              {/* Admin Font Switcher Button */}
              {isAdmin && (
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsFontModalOpen(true);
                  }}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl sm:rounded-2xl bg-zinc-800/90 hover:bg-zinc-700/80 text-zinc-200 border border-indigo-500/40 hover:border-indigo-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="تغییر فونت کل سیستم (مخصوص مدیر کل)"
                  aria-label="تغییر فونت کل سیستم"
                >
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-bold hidden md:inline text-indigo-200">فونت</span>
                </button>
              )}

              {/* Desktop Search */}
              <div className="relative hidden md:block w-40 lg:w-56">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${getText('searchPlaceholder')}...`}
                  className="w-full pl-3 pr-8.5 py-1.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 placeholder:text-zinc-500"
                />
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="جستجو"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Filter by User (Admin Only - Desktop) */}
              {isAdmin && users.length > 1 && (
                <select
                  value={selectedFilterUserId || ''}
                  onChange={(e) => setSelectedFilterUserId(e.target.value || null)}
                  className="hidden xl:block px-2.5 py-1.5 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs outline-hidden cursor-pointer max-w-[130px] truncate"
                >
                  <option value="">همه کاربران</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Share / Export */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="اشتراک‌گذاری گزارش روزانه"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Profile (photo) button */}
              {currentUser && (
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsProfileModalOpen(true);
                  }}
                  className="p-0.5 rounded-full ring-1 ring-transparent hover:ring-indigo-500/60 transition-all cursor-pointer"
                  title="ویرایش پروفایل و عکس"
                  aria-label="پروفایل من"
                >
                  <UserAvatar name={currentUser.name} avatar={currentUser.avatar} fallbackImage={defaultAvatar} size="w-8 h-8 rounded-full text-xs" />
                </button>
              )}

              {/* New Task Button */}
              <button
                onClick={() => openCreateModal(selectedDate)}
                className="flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">تسک جدید</span>
              </button>

              {/* Mobile Menu / Profile Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="منوی کاربری و تنظیمات"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Search Bar on Mobile */}
          {isMobileSearchOpen && (
            <div className="md:hidden mt-2 pt-2 border-t border-zinc-800/80 animate-in fade-in">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان یا توضیحات تسک‌ها..."
                  className="w-full pl-8 pr-9 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-hidden focus:border-zinc-500 placeholder:text-zinc-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Main Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto pb-28 lg:pb-12 min-w-0 overflow-x-hidden">
          {/* Global Announcement Banner from Admin (Mohusyn) */}
          {globalSettings?.broadcastNotice?.enabled && globalSettings.broadcastNotice.message && (
            <div
              className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 backdrop-blur-md shadow-lg animate-in slide-in-from-top-2 duration-300 ${
                globalSettings.broadcastNotice.type === 'urgent'
                  ? 'bg-rose-950/40 border-rose-800/70 text-rose-200 shadow-rose-950/20'
                  : globalSettings.broadcastNotice.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-800/70 text-amber-200 shadow-amber-950/20'
                  : globalSettings.broadcastNotice.type === 'motivational'
                  ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200 shadow-emerald-950/20'
                  : 'bg-indigo-950/40 border-indigo-800/70 text-indigo-200 shadow-indigo-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                    globalSettings.broadcastNotice.type === 'urgent'
                      ? 'bg-rose-500/20 text-rose-400'
                      : globalSettings.broadcastNotice.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-400'
                      : globalSettings.broadcastNotice.type === 'motivational'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs text-white">
                      {globalSettings.broadcastNotice.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/10 font-bold">
                      پیام سراسری سازمان
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {globalSettings.broadcastNotice.message}
                  </p>
                </div>
              </div>

              {globalSettings.dailyMantra && (
                <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>تمرکز روز: {globalSettings.dailyMantra}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in w-full min-w-0">
              {/* Top 4 Bento KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
                <div className="p-3.5 sm:p-5 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                  <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold">تسک‌های امروز</span>
                    <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-white">
                    {toPersianDigits(todayTotal)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                    {toPersianDigits(todayCompleted)} تسک تکمیل‌شده
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                  <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold">نرخ پیشرفت</span>
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-white">
                    {toPersianDigits(todayRate)}٪
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${todayRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                  <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold">تمرکز عمیق</span>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-white">
                    {toPersianDigits(totalFocusMinutes)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                    دقیقه در پومودورو
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 backdrop-blur-md">
                  <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold">زنجیره استریک</span>
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-white">
                    {toPersianDigits(streak.currentStreak)} {getText('streakLabel')}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                    بهترین رکورد: {toPersianDigits(streak.bestStreak)} {getText('streakLabel')}
                  </div>
                </div>
              </div>

              {/* Tasks Bento Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0">
                <div className="lg:col-span-2 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 backdrop-blur-md space-y-4 min-w-0 w-full overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        برنامه‌ی پیشِ رو
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        اول پین‌شده‌ها، سپس به ترتیب روز — تسک‌های زودتر در صدر
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      مشاهده همه در بخش تسک‌ها →
                    </button>
                  </div>

                  <QuickAddBar />
                  <DashboardTaskList />
                </div>

                {/* Right side bento cards */}
                <div className="space-y-5 sm:space-y-6 min-w-0 w-full overflow-hidden">
                  <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 backdrop-blur-md space-y-3 min-w-0 w-full overflow-hidden">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-zinc-300" />
                      تقویم روزهای هفته
                    </h3>
                    <div className="w-full min-w-0 overflow-hidden">
                      <WeeklyStrip />
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 backdrop-blur-md space-y-3">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      تکنیک بهره‌وری روز
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      💡 <strong>تکنیک بلوک‌های زمانی:</strong> کارهای بزرگ را به بخش‌های ۲۵ دقیقه‌ای تقسیم کنید و پس از هر بلوک، ۵ دقیقه به مغزتان استراحت دهید.
                    </p>
                    <button
                      onClick={() => setActiveTab('focus')}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      شروع جلسه پومودورو
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HOURLY DAILY PLANNER */}
          {activeTab === 'planner' && (
            <div className="w-full min-w-0">
              <HourlyPlannerView />
            </div>
          )}

          {/* TAB: AI HABITS ANALYZER */}
          {activeTab === 'habits' && (
            <div className="w-full min-w-0">
              <HabitsAnalyzerView />
            </div>
          )}

          {/* TAB: CAREER GOALS & PERSONALITY */}
          {activeTab === 'career' && (
            <div className="w-full min-w-0">
              <CareerGoalsView />
            </div>
          )}

          {/* TAB 2: TASKS (List & Kanban) */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-in fade-in w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-zinc-800/80 min-w-0 w-full overflow-hidden">
                <div className="w-full min-w-0 overflow-hidden">
                  <WeeklyStrip />
                </div>

                <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-2xl self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskViewMode === 'list'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>فهرست</span>
                  </button>

                  <button
                    onClick={() => setTaskViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      taskViewMode === 'kanban'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    <span>کانبان بورد</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-2">
                <QuickAddBar />
              </div>

              {taskViewMode === 'list' && (
                <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5">
                  <TaskList />
                </div>
              )}

              {taskViewMode === 'kanban' && <KanbanBoard />}
            </div>
          )}

          {/* TAB: TEAM PROJECTS */}
          {activeTab === 'projects' && (
            <div className="w-full min-w-0">
              <TeamProjectsView />
            </div>
          )}

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 animate-in fade-in">
              <CalendarView />
            </div>
          )}

          {/* TAB 4: FOCUS TIMER */}
          {activeTab === 'focus' && (
            <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-8 animate-in fade-in flex items-center justify-center min-h-[480px]">
              <FocusTimer />
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-6 animate-in fade-in">
              <CategoriesView />
            </div>
          )}

          {/* TAB 6: USER MANAGEMENT (Admin Only) */}
          {activeTab === 'users' && isAdmin && (
            <UserManagementView />
          )}

          {/* TAB 7: STATS & ANALYTICS */}
          {activeTab === 'stats' && (
            <div className="bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-6 animate-in fade-in">
              <StatsView />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation (Visible on screens < 1024px) */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer / Menu Modal */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end lg:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-zinc-900 h-full p-5 border-r border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold">
                    <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white">تسک‌روز</h2>
                    <p className="text-[9px] text-zinc-400 font-mono">BUILT BY MOHUSYN</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Info Card — click to edit profile */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sounds.playPop();
                    setIsProfileModalOpen(true);
                  }}
                  className="my-4 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 hover:border-indigo-500/40 transition-all text-right cursor-pointer w-full"
                  title="ویرایش پروفایل و عکس"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={currentUser.name} avatar={currentUser.avatar} fallbackImage={defaultAvatar} size="w-9 h-9 rounded-full text-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isAdmin ? (
                          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            مدیر سیستم
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">کاربر عادی</span>
                        )}
                        <span className="text-[9px] text-indigo-400 mr-auto">ویرایش پروفایل</span>
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Navigation Items in Drawer — scrollable middle, footer always visible */}
              <div className="space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1 my-1">
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileTabSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
                          {toPersianDigits(item.badge)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-3 mt-2 border-t border-zinc-800 space-y-1.5 text-xs flex-shrink-0">
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsFontModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-indigo-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span>تغییر فونت سیستم</span>
                </button>
              )}

              <button
                onClick={() => {
                  updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>حالت روز</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-zinc-300" />
                    <span>حالت شب</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>{getText('logoutLabel')}</span>
              </button>

              <div className="text-[10px] text-zinc-500 font-mono text-center pt-2">
                {getText('footerCredits')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <TaskModal />
      <TaskIncompleteModal />
      <ExportShareModal />
      <FontSelectorModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
    </div>
  );
};
