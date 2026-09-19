import React from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatPersianDate, getTodayISO, getGreeting } from '../utils/persianDate';
import type { TabType } from '../types';
import { TaskList } from './TaskList';
import { KanbanBoard } from './KanbanBoard';
import { CalendarView } from './CalendarView';
import { FocusTimer } from './FocusTimer';
import { CategoriesView } from './CategoriesView';
import { StatsView } from './StatsView';
import { UserManagementView } from './UserManagementView';
import { WeeklyStrip } from './WeeklyStrip';
import { QuickAddBar } from './QuickAddBar';
import { TaskModal } from './TaskModal';
import { ExportShareModal } from './ExportShareModal';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Timer,
  LayoutGrid,
  Users,
  BarChart3,
  Smartphone,
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
} from 'lucide-react';

export const DesktopDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    tasks,
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
  } = useTask();

  const greeting = getGreeting();
  const todayISO = getTodayISO();

  // Metrics for Dashboard overview
  const todayTasks = tasks.filter((t) => t.date === todayISO);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);

  const navItems: Array<{ id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean; badge?: number }> = [
    { id: 'dashboard', label: 'داشبورد و آمار', icon: LayoutDashboard },
    { id: 'tasks', label: 'تسک‌ها و برنامه‌ها', icon: CheckSquare, badge: todayTasks.filter(t => !t.completed).length },
    { id: 'calendar', label: 'تقویم شمسی', icon: CalendarDays },
    { id: 'focus', label: 'تایمر تمرکز پومودورو', icon: Timer },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: LayoutGrid },
    { id: 'users', label: 'مدیریت کاربران', icon: Users, adminOnly: true, badge: users.length },
    { id: 'stats', label: 'گزارش عملکرد', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* 1. RTL Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-4 z-20 shadow-xs select-none">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                تسک‌روز
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  IIS
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">مدیریت وظایف و تیم</p>
            </div>
          </div>

          {/* Active User Profile Pill */}
          {currentUser && (
            <div className="p-3 mb-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {currentUser.role === 'admin' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        مدیر سیستم
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">کاربر عادی</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && currentUser?.role !== 'admin') {
                return null;
              }
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
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
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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

        {/* Sidebar Footer: Mobile switch, Theme, Logout */}
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Switch to Mobile Simulator Frame */}
          <button
            onClick={() => updateSettings({ viewMode: 'mobile-frame' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="مشاهده در قاب گوشی هوشمند"
          >
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span>شبیه‌ساز موبایل</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>حالت روز</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>حالت شب</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Desktop Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between z-10">
          {/* Left: Date & Greeting */}
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {greeting.text}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                امروز: {formatPersianDate(selectedDate, 'full')}
              </p>
            </div>

            {/* Streak Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{toPersianDigits(streak.currentStreak)} روز استریک</span>
            </div>
          </div>

          {/* Right: Search, User Filter, Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56 lg:w-72">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تسک‌ها..."
                className="w-full pl-3 pr-9 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-hidden focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Admin Filter: All users vs Specific user */}
            {currentUser?.role === 'admin' && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-slate-400">مشاهده:</span>
                <select
                  value={selectedFilterUserId || ''}
                  onChange={(e) => setSelectedFilterUserId(e.target.value || null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-hidden"
                >
                  <option value="">همه کاربران ({toPersianDigits(users.length)})</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Share / Export */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="اشتراک گزارش روزانه"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* New Task Button */}
            <button
              onClick={() => openCreateModal(selectedDate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسک جدید</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">تسک‌های امروز</span>
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(todayTotal)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {toPersianDigits(todayCompleted)} تسک تکمیل‌شده
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">نرخ پیشرفت امروز</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(todayRate)}٪
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${todayRate}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">تمرکز عمیق (پومودورو)</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(totalFocusMinutes)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    دقیقه ثبت‌شده روی تسک‌ها
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">زنجیره موفقیت</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(streak.currentStreak)} روز
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    بهترین رکورد: {toPersianDigits(streak.bestStreak)} روز
                  </div>
                </div>
              </div>

              {/* Tasks Quick Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        کارهای روزانه امروز
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        برنامه‌ریزی و پیگیری سریع فعالیت‌های امروز
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      مشاهده همه در بخش تسک‌ها →
                    </button>
                  </div>

                  <QuickAddBar />
                  <TaskList />
                </div>

                {/* Right side widget: Weekly Strip & Productivity Insights */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      تقویم روزهای این هفته
                    </h3>
                    <WeeklyStrip />
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      توصیه بهره‌وری روز
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      💡 <strong>تکنیک بلوک‌های زمانی:</strong> کارهای بزرگ را به بخش‌های ۲۵ دقیقه‌ای تقسیم کنید و پس از هر بلوک، ۵ دقیقه به مغزتان استراحت دهید.
                    </p>
                    <button
                      onClick={() => setActiveTab('focus')}
                      className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-bold transition-colors"
                    >
                      شروع جلسه پومودورو
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASKS (List / Kanban / Calendar) */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Task View Mode Switcher Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <WeeklyStrip />

                {/* View switcher: List vs Kanban */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-end sm:self-center">
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      taskViewMode === 'list'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>فهرست ستونی</span>
                  </button>

                  <button
                    onClick={() => setTaskViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      taskViewMode === 'kanban'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    <span>کانبان بورد</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2">
                <QuickAddBar />
              </div>

              {/* Content view based on view mode */}
              {taskViewMode === 'list' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                  <TaskList />
                </div>
              )}

              {taskViewMode === 'kanban' && <KanbanBoard />}
            </div>
          )}

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-in fade-in">
              <CalendarView />
            </div>
          )}

          {/* TAB 4: FOCUS TIMER */}
          {activeTab === 'focus' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs animate-in fade-in flex items-center justify-center min-h-[600px]">
              <FocusTimer />
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs animate-in fade-in">
              <CategoriesView />
            </div>
          )}

          {/* TAB 6: USERS MANAGEMENT (Admin Only) */}
          {activeTab === 'users' && currentUser?.role === 'admin' && (
            <UserManagementView />
          )}

          {/* TAB 7: STATS & ANALYTICS */}
          {activeTab === 'stats' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs animate-in fade-in">
              <StatsView />
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TaskModal />
      <ExportShareModal />
    </div>
  );
};
