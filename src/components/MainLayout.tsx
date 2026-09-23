import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, formatPersianDate } from '../utils/persianDate';
import { greetingKeySet } from '../utils/appTexts';
import { UserAvatar } from './UserAvatar';
import { ProfileModal } from './ProfileModal';
import { DashboardTaskList } from './DashboardTaskList';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { TaskMasterBentoWidgets } from './TaskMasterBentoWidgets';
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
import { FriendsView } from './FriendsView';
import { AiTaskAgentModal } from './AiTaskAgentModal';
import { DirectChatModal } from './DirectChatModal';
import { NotificationCenterModal } from './NotificationCenterModal';
import { UpgradeToProModal } from './UpgradeToProModal';
import { FirstLoginProfileModal } from './FirstLoginProfileModal';
import { PublicUserProfileModal } from './PublicUserProfileModal';
import type { User } from '../types';
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
  ArrowUpRight,
  SlidersHorizontal,
  Bell,
  Settings,
  ChevronDown,
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
    isPro,
    isFirstLoginModalOpen,
    setIsFirstLoginModalOpen,
  } = useTask();

  const todayISO = getTodayISO();
  const gk = greetingKeySet(new Date().getHours());
  const greetingText = getText(gk.text);
  const greetingSub = getText(gk.sub);

  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'تسک‌روز';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;
  const defaultAvatar = typeof appBranding?.defaultAvatarDataUrl === 'string' ? appBranding.defaultAvatarDataUrl : null;
  const firstName = (currentUser?.name || '').split(' ')[0];

  // Mobile & Modal state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);

  // New interactive states
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(3);
  const [directChatUser, setDirectChatUser] = useState<{
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    status?: 'online' | 'offline';
    role?: string;
  } | null>(null);

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

  // Listen for mobile bottom nav custom events and subscription/profile events
  useEffect(() => {
    const handler = () => openCreateModal(selectedDate);
    const handleUpgrade = () => setIsUpgradeModalOpen(true);
    const handleUserProfile = (e: any) => {
      if (e?.detail) setInspectedUser(e.detail);
    };

    window.addEventListener('open-ai-agent-modal', handler);
    window.addEventListener('open-create-task-ai', handler);
    window.addEventListener('open-upgrade-modal', handleUpgrade);
    window.addEventListener('open-user-profile', handleUserProfile);

    return () => {
      window.removeEventListener('open-ai-agent-modal', handler);
      window.removeEventListener('open-create-task-ai', handler);
      window.removeEventListener('open-upgrade-modal', handleUpgrade);
      window.removeEventListener('open-user-profile', handleUserProfile);
    };
  }, [selectedDate, openCreateModal]);

  // Real friends list from localStorage
  const myId = currentUser?.id || 'me';
  const [friendsList, setFriendsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_friends_${myId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const updateFriends = () => {
      try {
        const saved = localStorage.getItem(`taskrooz_friends_${myId}`);
        setFriendsList(saved ? JSON.parse(saved) : []);
      } catch {
        setFriendsList([]);
      }
    };
    updateFriends();
    window.addEventListener('taskrooz-friends-changed', updateFriends);
    window.addEventListener('storage', updateFriends);
    return () => {
      window.removeEventListener('taskrooz-friends-changed', updateFriends);
      window.removeEventListener('storage', updateFriends);
    };
  }, [myId]);

  const isAdmin = currentUser?.role === 'admin';

  // Metrics for Dashboard overview
  const todayTasks = tasks.filter((t) => t.date === todayISO);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
  const pendingTodayCount = todayTasks.filter((t) => !t.completed).length;

  const navItems: Array<{ id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean; badge?: number }> = [
    { id: 'dashboard', label: 'داشبورد (Dashboard)', icon: LayoutDashboard },
    { id: 'planner', label: 'دیلی پلنر ساعتی', icon: Clock },
    { id: 'habits', label: 'تحلیلگر عادت‌ها', icon: Brain },
    { id: 'career', label: 'اهداف و رشد شغلی', icon: Compass },
    { id: 'tasks', label: 'کارهای من (My Tasks)', icon: CheckSquare, badge: pendingTodayCount > 0 ? pendingTodayCount : 4 },
    { id: 'projects', label: 'پروژه‌های تیمی', icon: FolderKanban, badge: projects.length },
    { id: 'friends', label: 'همکاران و دوستان', icon: Users, badge: 2 },
    { id: 'calendar', label: 'تقویم (Calendar)', icon: CalendarDays },
    { id: 'focus', label: 'تمرکز پومودورو', icon: Timer },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: LayoutGrid },
    { id: 'users', label: 'مانیتورینگ کاربران', icon: ShieldCheck, adminOnly: true, badge: users.length },
    { id: 'stats', label: 'گزارش عملکرد', icon: BarChart3 },
  ];

  const handleMobileTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#e4e9f2] text-slate-900 p-0 sm:p-4 lg:p-6 flex items-stretch justify-center antialiased selection:bg-[#121212] selection:text-white w-full overflow-x-hidden font-sans">
      {/* Floating Main Application Shell with high contrast */}
      <div className="bg-[#f1f4f8] rounded-none sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] border-0 sm:border border-slate-300/80 w-full max-w-[1600px] flex flex-col lg:flex-row overflow-hidden min-h-screen sm:min-h-[92vh] relative">
        
        {/* 1. DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200/90 flex-col justify-between p-6 z-20 select-none sticky top-0 h-[92vh] flex-shrink-0 min-h-0 overflow-y-auto no-scrollbar shadow-xs">
          <div className="flex flex-col min-h-0 flex-1">
            {/* Brand Logo & App Name */}
            <div className="flex items-center gap-3">
              {appLogo ? (
                <img src={appLogo} alt={appName} className="w-9 h-9 rounded-2xl object-cover shadow-xs border border-slate-100" />
              ) : (
                <TaskMasterHexagon size={38} />
              )}
              <h1 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-1">
                <span>{appName}</span>
                <span className="text-[#00b884]">.</span>
              </h1>
            </div>

            {/* Hero Greeting Headline */}
            <div className="mt-7 mb-6">
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                روزت رو شروع کن <br />
                و پرانرژی باش ✌️
              </h2>
            </div>

            {/* MENU Label */}
            <div className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2.5 px-2">
              MENU
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#121212] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                      <span>{item.label}</span>
                    </div>

                    {isActive ? (
                      <ArrowUpRight className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                    ) : item.badge !== undefined && item.badge > 0 ? (
                      <span className="bg-[#f95738] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                        +{toPersianDigits(item.badge)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Real Colleagues / Friends Section */}
            {friendsList.length > 0 ? (
              <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('friends');
                  }}
                  className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded-2xl transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center -space-x-2 space-x-reverse">
                    {friendsList.slice(0, 4).map((f) => (
                      <div key={f.id} className="relative">
                        <UserAvatar
                          name={f.name}
                          avatar={f.avatar}
                          size="w-7 h-7 rounded-full text-[10px]"
                          className="border-2 border-white shadow-xs"
                        />
                      </div>
                    ))}
                    {friendsList.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center">
                        +{toPersianDigits(friendsList.length - 4)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <span>همکاران ({toPersianDigits(friendsList.length)})</span>
                    <span className="text-slate-400">‹</span>
                  </span>
                </button>

                {/* Direct quick chat with active colleague */}
                <div
                  onClick={() => {
                    sounds.playPop();
                    setDirectChatUser({
                      id: friendsList[0].id,
                      name: friendsList[0].name,
                      username: friendsList[0].username,
                      avatar: friendsList[0].avatar,
                      role: friendsList[0].jobTitle || 'همکار',
                      status: 'online',
                    });
                  }}
                  className="p-3 bg-[#f8fafc] border border-slate-200/80 hover:border-slate-300 rounded-2xl space-y-2 text-right cursor-pointer transition-all hover:shadow-xs group"
                  title={`چت با ${friendsList[0].name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <UserAvatar
                        name={friendsList[0].name}
                        avatar={friendsList[0].avatar}
                        size="w-5 h-5 rounded-full text-[9px]"
                      />
                      <span className="truncate max-w-[100px]">{friendsList[0].name}</span>
                      <span className="w-2 h-2 rounded-full bg-[#00b884]" />
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-slate-800 font-bold">
                      گفتگو 💬
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    کلیک برای گفتگو با {friendsList[0].name}...
                  </p>
                </div>
              </div>
            ) : (
              /* Clean empty state for fresh install: no fake Michie, no fake +10 avatars */
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('friends');
                }}
                className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between hover:bg-slate-50 p-2.5 rounded-2xl transition-colors text-right cursor-pointer group w-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-[#00b884]/15 group-hover:text-[#00895f] transition-colors">
                    <Users className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">همکاران</div>
                    <div className="text-[10px] text-slate-400">یافتن و افزودن همکاران ‹</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  ۰
                </span>
              </button>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="space-y-1.5 pt-4 mt-2 border-t border-slate-100 text-xs flex-shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsFontModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <Type className="w-4 h-4 text-indigo-500" />
                <span>فونت کل سیستم</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>حالت روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-500" />
                  <span>حالت شب</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>

            <div className="pt-1.5 px-1 text-[10px] text-slate-400 font-mono">
              {getText('footerCredits')}
            </div>
          </div>
        </aside>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden min-h-full">
          {/* Top Header Bar */}
          <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="flex-1 max-w-md min-w-0">
                <div className="relative flex items-center bg-[#f4f6f8] border border-slate-200/80 rounded-full px-4 py-2 hover:border-slate-300 focus-within:border-slate-400 transition-all">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اینجا جستجو کنید... (Start searching here)"
                    className="w-full bg-transparent px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                    className="text-slate-400 hover:text-slate-700 flex-shrink-0"
                    title="فیلترها"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                {/* Admin User Filter Dropdown */}
                {isAdmin && users.length > 1 && (
                  <select
                    value={selectedFilterUserId || ''}
                    onChange={(e) => setSelectedFilterUserId(e.target.value || null)}
                    className="hidden xl:block px-2.5 py-1.5 rounded-full bg-[#f4f6f8] border border-slate-200 text-slate-700 text-xs outline-none cursor-pointer max-w-[130px] truncate"
                  >
                    <option value="">همه کاربران</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-9 h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs hidden sm:flex cursor-pointer"
                  title="اشتراک‌گذاری گزارش"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
                  }}
                  className="w-9 h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                  title={settings.theme === 'dark' ? 'تغییر به تم روز ☀️' : 'تغییر به تم شب 🌙'}
                >
                  {settings.theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {/* Notification Bell with interactive Modal */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsNotificationCenterOpen(true);
                    setUnreadNotifCount(0);
                  }}
                  className="w-9 h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs relative cursor-pointer"
                  title="مرکز اعلان‌ها"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f95738] absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Subscription Pro Badge or Upgrade Button */}
                {isPro ? (
                  <div
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[11px] font-black"
                    title="اشتراک ویژه Pro فعال است"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>پلن Pro</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsUpgradeModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="ارتقاء به اشتراک ویژه نامحدود"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ارتقاء به Pro ⭐</span>
                    <span className="sm:hidden">Pro ⭐</span>
                  </button>
                )}

                {/* Settings Cogwheel */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (isAdmin) {
                      setActiveTab('users');
                    } else {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className="w-9 h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                  title="تنظیمات"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* User Profile Pill */}
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsProfileModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full border border-slate-200/80 hover:border-slate-300 transition-colors bg-white shadow-2xs cursor-pointer"
                    title="مشاهده و ویرایش پروفایل"
                  >
                    <UserAvatar
                      name={currentUser.name}
                      avatar={currentUser.avatar}
                      fallbackImage={defaultAvatar}
                      size="w-8 h-8 rounded-full text-xs"
                      className="border-2 border-[#00b884]"
                    />
                    <div className="hidden sm:flex flex-col text-right leading-tight">
                      <span className="font-extrabold text-xs text-slate-900 truncate max-w-[120px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">
                        {currentUser.jobTitle || (isAdmin ? 'مدیر سیستم' : 'طراح رابط کاربری')}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>
                )}

                {/* Primary Add Task Button (Direct Manual Creation) */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    openCreateModal(selectedDate);
                  }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  title="افزودن و تعریف تسک جدید"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>تسک جدید</span>
                </button>

                {/* Mobile Menu Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="منو"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-header info bar */}
            <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-slate-800 truncate" title={greetingSub}>
                  {greetingText}
                  {firstName ? <span className="text-indigo-600">، {firstName}</span> : null}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    مدیر سیستم
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/60">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatPersianDate(new Date(), 'full')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200/60 max-[430px]:hidden">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b884] animate-pulse" />
                  {liveClock}
                </span>
              </div>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 p-4 sm:p-7 space-y-6 max-w-7xl w-full mx-auto pb-24 lg:pb-10 min-w-0">
            {/* Global Announcement Banner from Admin (Mohusyn) */}
            {globalSettings?.broadcastNotice?.enabled && globalSettings.broadcastNotice.message && (
              <div
                className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm animate-in slide-in-from-top-2 duration-300 ${
                  globalSettings.broadcastNotice.type === 'urgent'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : globalSettings.broadcastNotice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : globalSettings.broadcastNotice.type === 'motivational'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                      globalSettings.broadcastNotice.type === 'urgent'
                        ? 'bg-rose-100 text-rose-600'
                        : globalSettings.broadcastNotice.type === 'warning'
                        ? 'bg-amber-100 text-amber-600'
                        : globalSettings.broadcastNotice.type === 'motivational'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs">
                        {globalSettings.broadcastNotice.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 font-bold">
                        پیام سراسری سازمان
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {globalSettings.broadcastNotice.message}
                    </p>
                  </div>
                </div>

                {globalSettings.dailyMantra && (
                  <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold bg-white/70 px-3 py-1.5 rounded-xl border border-black/5 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تمرکز روز: {globalSettings.dailyMantra}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in w-full min-w-0">
                {/* 4 Dribbble Signature Widgets */}
                <TaskMasterBentoWidgets
                  onSeeAllTasks={() => setActiveTab('tasks')}
                  onOpenCreateTask={() => openCreateModal(selectedDate)}
                />

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                  <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-slate-500 mb-1.5">
                      <span className="text-xs font-bold">تسک‌های امروز</span>
                      <CheckSquare className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {toPersianDigits(todayTotal)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-bold">
                      {toPersianDigits(todayCompleted)} تسک تکمیل‌شده
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-slate-500 mb-1.5">
                      <span className="text-xs font-bold">نرخ پیشرفت</span>
                      <TrendingUp className="w-4 h-4 text-[#00b884]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {toPersianDigits(todayRate)}٪
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#00b884] h-full rounded-full transition-all duration-500"
                        style={{ width: `${todayRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-slate-500 mb-1.5">
                      <span className="text-xs font-bold">تمرکز عمیق</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {toPersianDigits(totalFocusMinutes)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-bold">
                      دقیقه در پومودورو
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between text-slate-500 mb-1.5">
                      <span className="text-xs font-bold">زنجیره استریک</span>
                      <Flame className="w-4 h-4 text-[#f95738]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {toPersianDigits(streak.currentStreak)} {getText('streakLabel')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-bold">
                      بهترین رکورد: {toPersianDigits(streak.bestStreak)} {getText('streakLabel')}
                    </div>
                  </div>
                </div>

                {/* Upcoming Tasks Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 min-w-0 w-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          برنامه‌ی پیشِ رو
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          اول پین‌شده‌ها، سپس به ترتیب روز — تسک‌های زودتر در صدر
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('tasks')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        مشاهده همه در بخش تسک‌ها →
                      </button>
                    </div>

                    <QuickAddBar />
                    <DashboardTaskList />
                  </div>

                  {/* Right side helper cards */}
                  <div className="space-y-6 min-w-0 w-full">
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 min-w-0 w-full">
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        تقویم روزهای هفته
                      </h3>
                      <div className="w-full min-w-0 overflow-hidden">
                        <WeeklyStrip />
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#00b884]" />
                        تکنیک بهره‌وری روز
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        💡 <strong>تکنیک بلوک‌های زمانی:</strong> کارهای بزرگ را به بخش‌های ۲۵ دقیقه‌ای تقسیم کنید و پس از هر بلوک، ۵ دقیقه به مغزتان استراحت دهید.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('focus')}
                        className="w-full py-2.5 bg-[#121212] hover:bg-black text-white rounded-2xl text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
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

            {/* TAB: TASKS (List & Kanban) */}
            {activeTab === 'tasks' && (
              <div className="space-y-4 animate-in fade-in w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] min-w-0 w-full overflow-hidden">
                  <div className="w-full min-w-0 overflow-hidden">
                    <WeeklyStrip />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setTaskViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        taskViewMode === 'list'
                          ? 'bg-[#121212] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>فهرست</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskViewMode('kanban')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        taskViewMode === 'kanban'
                          ? 'bg-[#121212] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Columns3 className="w-3.5 h-3.5" />
                      <span>کانبان</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
                  <QuickAddBar />
                </div>

                {taskViewMode === 'list' ? <TaskList /> : <KanbanBoard />}
              </div>
            )}

            {/* TAB: TEAM PROJECTS */}
            {activeTab === 'projects' && (
              <div className="w-full min-w-0">
                <TeamProjectsView />
              </div>
            )}

            {/* TAB: FRIENDS & DIRECT CHAT */}
            {activeTab === 'friends' && (
              <div className="w-full min-w-0">
                <FriendsView onStartChat={(user) => setDirectChatUser(user as any)} />
              </div>
            )}

            {/* TAB: JALALI CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="w-full min-w-0">
                <CalendarView />
              </div>
            )}

            {/* TAB: FOCUS TIMER (POMODORO) */}
            {activeTab === 'focus' && (
              <div className="w-full min-w-0">
                <FocusTimer />
              </div>
            )}

            {/* TAB: CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="w-full min-w-0">
                <CategoriesView />
              </div>
            )}

            {/* TAB: USERS MONITORING (ADMIN ONLY) */}
            {activeTab === 'users' && isAdmin && (
              <div className="w-full min-w-0">
                <UserManagementView />
              </div>
            )}

            {/* TAB: STATS REPORT */}
            {activeTab === 'stats' && (
              <div className="w-full min-w-0">
                <StatsView />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (screens < 1024px) */}
      <BottomNav />

      {/* Mobile Drawer Navigation (Menu overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full p-5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {appLogo ? (
                    <img src={appLogo} alt={appName} className="w-8 h-8 rounded-xl object-cover" />
                  ) : (
                    <TaskMasterHexagon size={32} />
                  )}
                  <span className="font-black text-sm text-slate-900">{appName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile in Drawer */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-right w-full flex items-center gap-3"
                >
                  <UserAvatar
                    name={currentUser.name}
                    avatar={currentUser.avatar}
                    fallbackImage={defaultAvatar}
                    size="w-9 h-9 rounded-full text-xs"
                    className="border-2 border-[#00b884]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser.jobTitle || (isAdmin ? 'مدیر سیستم' : 'کاربر')}
                    </div>
                  </div>
                </button>
              )}

              {/* Nav Items in Drawer */}
              <div className="space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1 my-1">
                {navItems.map((item) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileTabSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#121212] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f95738] text-white font-bold">
                          +{toPersianDigits(item.badge)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-1.5 text-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {settings.theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>حالت روز</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-500" />
                    <span>حالت شب</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب</span>
              </button>
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

      {/* AI Task Agent Modal (Voice + Natural Persian Language parsing) */}
      <AiTaskAgentModal
        isOpen={isAiAgentModalOpen}
        onClose={() => setIsAiAgentModalOpen(false)}
        onSwitchToManual={() => {
          setIsAiAgentModalOpen(false);
          openCreateModal(selectedDate);
        }}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onOpenTask={(_taskId) => {
          setActiveTab('tasks');
        }}
        onOpenChat={(userId, userName) => {
          setDirectChatUser({ id: userId, name: userName, status: 'online' });
        }}
      />

      {/* Direct Interactive Chat Modal */}
      {directChatUser && (
        <DirectChatModal
          isOpen={Boolean(directChatUser)}
          onClose={() => setDirectChatUser(null)}
          peerUser={directChatUser}
        />
      )}

      {/* Subscription Upgrade Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Mandatory First-Login Profile Completion */}
      <FirstLoginProfileModal
        isOpen={isFirstLoginModalOpen}
        onClose={() => setIsFirstLoginModalOpen(false)}
      />

      {/* Colleague Public Profile Card */}
      {inspectedUser && (
        <PublicUserProfileModal
          isOpen={Boolean(inspectedUser)}
          user={inspectedUser}
          onClose={() => setInspectedUser(null)}
          onStartChat={(peer) => {
            setInspectedUser(null);
            setDirectChatUser(peer as any);
          }}
        />
      )}
    </div>
  );
};
