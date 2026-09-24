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
import { MessagesView } from './MessagesView';
import { AiTaskAgentModal } from './AiTaskAgentModal';
import { DirectChatModal } from './DirectChatModal';
import { NotificationCenterModal, type AppNotification } from './NotificationCenterModal';
import { UpgradeToProModal } from './UpgradeToProModal';
import { ExtensionDownloadModal } from './ExtensionDownloadModal';
import { FirstLoginProfileModal } from './FirstLoginProfileModal';
import { PublicUserProfileModal } from './PublicUserProfileModal';
import { SubscriptionBadge } from './SubscriptionBadge';
import { api } from '../services/api';
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
  Eye,
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
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Bot,
  ShieldAlert,
} from 'lucide-react';
import { MandatorySyncModal } from './MandatorySyncModal';
import { BaleVerificationModal } from './BaleVerificationModal';

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
    streak,
    logout,
    openCreateModal,
    setIsShareModalOpen,
    globalSettings,
    getText,
    isPro,
    isFirstLoginModalOpen,
    setIsFirstLoginModalOpen,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    friends,
    viewingPublicUser,
    setViewingPublicUser,
    isMandatorySyncDue,
    remainingHoursUntilSync,
    isSyncModalOpen,
    setIsSyncModalOpen,
  } = useTask();

  const todayISO = getTodayISO();
  const gk = greetingKeySet(new Date().getHours());
  const greetingText = getText(gk.text);
  const greetingSub = getText(gk.sub);

  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'بگ تایم';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;
  const defaultAvatar = typeof appBranding?.defaultAvatarDataUrl === 'string' ? appBranding.defaultAvatarDataUrl : null;
  const firstName = (currentUser?.name || '').split(' ')[0];

  // Mobile & Modal state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  // Desktop Sidebar collapsed by default (icon-only mode)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  // New interactive states
  const [isBaleModalOpen, setIsBaleModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [directChatUser, setDirectChatUser] = useState<{
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    status?: 'online' | 'offline';
    role?: string;
  } | null>(null);

  const refreshNotifications = React.useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
      setUnreadNotifCount(list.filter((n: any) => !n.read).length);
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const handleMarkAllNotifsRead = async () => {
    await api.markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifCount(0);
  };

  const handleClearAllNotifs = async () => {
    await api.clearNotifications();
    setNotifications([]);
    setUnreadNotifCount(0);
  };

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

  const myVisibleProjectsCount = projects.filter((p) => {
    if (!currentUser) return false;
    if (p.creatorId === currentUser.id) return true;
    const memberIds = Array.isArray(p.memberIds) ? p.memberIds : [];
    return memberIds.includes(currentUser.id) || (currentUser.username && memberIds.includes(currentUser.username));
  }).length;

  const navItems: Array<{ id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean; badge?: number }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'کارهای من', icon: CheckSquare, badge: pendingTodayCount > 0 ? pendingTodayCount : undefined },
    { id: 'planner', label: 'دیلی پلنر ساعتی', icon: Clock },
    { id: 'calendar', label: 'تقویم', icon: CalendarDays },
    { id: 'messages', label: 'پیام‌ها و گفتگوها', icon: MessageSquare },
    { id: 'friends', label: 'همکاران و دوستان', icon: Users, badge: friendsList.length > 0 ? friendsList.length : undefined },
    { id: 'projects', label: 'پروژه‌های تیمی', icon: FolderKanban, badge: myVisibleProjectsCount > 0 ? myVisibleProjectsCount : undefined },
    { id: 'focus', label: 'تمرکز پومودورو', icon: Timer },
    { id: 'habits', label: 'تحلیلگر عادت‌ها', icon: Brain },
    { id: 'career', label: 'اهداف و رشد شغلی', icon: Compass },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: LayoutGrid },
    { id: 'stats', label: 'گزارش عملکرد', icon: BarChart3 },
    { id: 'users', label: 'مانیتورینگ کاربران', icon: ShieldCheck, adminOnly: true, badge: users.length > 0 ? users.length : undefined },
  ];

  const handleMobileTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#edf1f7] text-slate-900 flex flex-row antialiased selection:bg-[#121212] selection:text-white font-sans">
      {/* 1. DESKTOP SIDEBAR - STAYS 100% FIXED ON THE SIDE */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-white border-l border-slate-200/90 z-30 select-none flex-shrink-0 h-screen transition-all duration-300 ease-in-out shadow-xs sticky top-0 overflow-y-auto no-scrollbar ${
          isSidebarExpanded ? 'w-64 p-5' : 'w-20 p-3 items-center'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 w-full">
          {/* Brand Logo, App Name & Expand/Collapse Toggle */}
          <div className={`flex items-center gap-2.5 pb-4 border-b border-slate-100 ${isSidebarExpanded ? 'justify-between' : 'flex-col justify-center'}`}>
            <div
              onClick={() => {
                sounds.playPop();
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
              title={appName}
            >
              {appLogo ? (
                <img src={appLogo} alt={appName} className="w-9 h-9 rounded-2xl object-cover shadow-xs border border-slate-100" />
              ) : (
                <TaskMasterHexagon size={36} />
              )}
              {isSidebarExpanded && (
                <h1 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1">
                  <span>{appName}</span>
                  <span className="text-[#00b884]">.</span>
                </h1>
              )}
            </div>

            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsSidebarExpanded(!isSidebarExpanded);
              }}
              className={`p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer ${
                !isSidebarExpanded ? 'w-10 h-10 flex items-center justify-center' : ''
              }`}
              title={isSidebarExpanded ? 'جمع کردن سایدبار' : 'گسترش سایدبار'}
            >
              {isSidebarExpanded ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Hero Greeting Headline (shown only when expanded) */}
          {isSidebarExpanded && (
            <div className="mt-4 mb-3 animate-in fade-in">
              <h2 className="text-base font-black text-slate-900 leading-snug">
                روزت رو شروع کن <br />
                و پرانرژی باش ✌️
              </h2>
            </div>
          )}

          {/* MENU Label */}
          {isSidebarExpanded && (
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase my-2 px-1">
              MENU
            </div>
          )}

          {/* Navigation Links */}
          <nav className={`space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar py-2 ${isSidebarExpanded ? '-mx-1 px-1' : 'w-full flex flex-col items-center'}`}>
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              if (!isSidebarExpanded) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playPop();
                      setActiveTab(item.id);
                    }}
                    title={item.label}
                    className={`w-12 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 stroke-[2.5]' : 'stroke-2'}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00b884] stroke-[2.5]' : 'text-slate-500 stroke-2'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-3.5 rounded-full bg-[#00b884]" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Real Colleagues / Friends Section */}
          {friendsList.length > 0 ? (
            <div className={`pt-3 border-t border-slate-100 ${isSidebarExpanded ? 'space-y-2' : 'w-full flex flex-col items-center'}`}>
              {isSidebarExpanded ? (
                <>
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
                            size="w-6 h-6 rounded-full text-[9px]"
                            className="border-2 border-white shadow-xs"
                          />
                        </div>
                      ))}
                      {friendsList.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center">
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
                    className="p-2.5 bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-2xl space-y-1.5 text-right cursor-pointer transition-all hover:shadow-xs group"
                    title={`چت با ${friendsList[0].name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <UserAvatar
                          name={friendsList[0].name}
                          avatar={friendsList[0].avatar}
                          size="w-5 h-5 rounded-full text-[9px]"
                        />
                        <span className="truncate max-w-[90px]">{friendsList[0].name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[9px] text-slate-400 group-hover:text-slate-800 font-bold">
                        گفتگو 💬
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('friends');
                  }}
                  className="w-12 h-11 rounded-2xl flex items-center justify-center relative text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  title={`همکاران (${toPersianDigits(friendsList.length)})`}
                >
                  <Users className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-600 text-white text-[8px] font-black flex items-center justify-center">
                    {toPersianDigits(friendsList.length)}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className={`pt-3 border-t border-slate-100 ${isSidebarExpanded ? '' : 'w-full flex justify-center'}`}>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('friends');
                }}
                className={`flex items-center hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer ${
                  isSidebarExpanded ? 'p-2.5 justify-between w-full' : 'w-12 h-11 justify-center'
                }`}
                title="یافتن و افزودن همکاران"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Users className="w-4 h-4 stroke-[2]" />
                  </div>
                  {isSidebarExpanded && (
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-800">همکاران</div>
                      <div className="text-[10px] text-slate-400">یافتن و افزودن ‹</div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`space-y-1.5 pt-3 border-t border-slate-100 text-xs flex-shrink-0 ${isSidebarExpanded ? 'w-full' : 'w-full flex flex-col items-center'}`}>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsFontModalOpen(true);
              }}
              className={`flex items-center gap-2.5 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer ${
                isSidebarExpanded ? 'w-full px-3 py-2 text-xs' : 'w-10 h-10 justify-center'
              }`}
              title="فونت کل سیستم"
            >
              <Type className="w-4 h-4 text-indigo-500" />
              {isSidebarExpanded && <span>فونت کل سیستم</span>}
            </button>
          )}

          {/* View My Public Profile Button */}
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setViewingPublicUser(currentUser);
              }}
              className={`flex items-center gap-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${
                isSidebarExpanded ? 'w-full px-3 py-2' : 'w-10 h-10 justify-center'
              }`}
              title="مشاهده پروفایل شما (دید همکاران)"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              {isSidebarExpanded && <span>پروفایل من (دید همکاران)</span>}
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className={`flex items-center gap-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer ${
              isSidebarExpanded ? 'w-full px-3 py-2 text-xs' : 'w-10 h-10 justify-center'
            }`}
            title="خروج از حساب"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarExpanded && <span>خروج از حساب</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA - STAYS SOLID & INDEPENDENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#f4f7fa]">
        {/* Top Header Bar - 100% FIXED AT TOP */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-20 flex-shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Left/Start Actions on Mobile & Desktop Search Bar */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
                  title="منوی اصلی"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {/* Desktop Search Bar */}
                <div className="hidden md:flex flex-1 max-w-md min-w-0">
                  <div className="relative flex items-center bg-[#f4f6f8] border border-slate-200/80 rounded-full px-4 py-2 hover:border-slate-300 focus-within:border-slate-400 transition-all w-full">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اینجا جستجو کنید..."
                      className="w-full bg-transparent px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                      className="text-slate-400 hover:text-slate-700 flex-shrink-0 cursor-pointer"
                      title="فیلترها"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Mobile Search Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className="md:hidden w-8 h-8 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                  title="جستجو"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

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

                {/* Share Button (desktop/tablet) */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs hidden sm:flex cursor-pointer"
                  title="اشتراک‌گذاری گزارش"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Browser Extension Assistant Button */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsExtensionModalOpen(true);
                  }}
                  className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 flex items-center gap-1.5 text-indigo-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                  title="افزونه دستیار نیوتَب مرورگر (کروم، اج، فایرفاکس)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span className="hidden sm:inline">افزونه دستیار</span>
                </button>

                {/* Notification Bell with interactive Modal */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsNotificationCenterOpen(true);
                    setUnreadNotifCount(0);
                  }}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shadow-2xs relative cursor-pointer flex-shrink-0"
                  title="مرکز اعلان‌ها"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#f95738] absolute top-1 right-1 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Subscription Pro Badge or Upgrade Button */}
                {isPro ? (
                  <SubscriptionBadge user={currentUser} size="sm" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsUpgradeModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[10px] sm:text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    title="ارتقاء به اشتراک ویژه نامحدود"
                  >
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>ارتقاء Pro</span>
                  </button>
                )}

                {/* Settings Cogwheel (hidden on small screens, in menu) */}
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
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-slate-200/80 hover:bg-slate-100 items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer hidden sm:flex flex-shrink-0"
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
                      setViewingPublicUser(currentUser);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 sm:pl-3 sm:pr-1 p-0.5 rounded-full border border-slate-200/80 hover:border-slate-300 transition-colors bg-white shadow-2xs cursor-pointer flex-shrink-0"
                    title="مشاهده پروفایل و شناسنامه من"
                  >
                    <UserAvatar
                      name={currentUser.name}
                      avatar={currentUser.avatar}
                      fallbackImage={defaultAvatar}
                      size="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs"
                      className="rounded-full ring-2 ring-emerald-500/20"
                    />
                    <div className="hidden sm:flex flex-col text-right leading-tight">
                      <span className="font-extrabold text-xs text-slate-900 truncate max-w-[110px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold truncate max-w-[110px]">
                        {currentUser.jobTitle || (isAdmin ? 'مدیر سیستم' : 'طراح رابط کاربری')}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>
                )}

                {/* Primary Add Task Button (hidden on mobile, in bottom nav) */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    openCreateModal(selectedDate);
                  }}
                  className="hidden md:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex-shrink-0"
                  title="افزودن و تعریف تسک جدید"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>تسک جدید</span>
                </button>
              </div>
            </div>

            {/* Mobile Expanded Search Bar (when toggled) */}
            {isMobileSearchOpen && (
              <div className="md:hidden pt-1 pb-1 animate-in fade-in">
                <div className="relative flex items-center bg-[#f4f6f8] border border-slate-300 rounded-2xl px-3 py-2 w-full">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در تسک‌ها و همکاران..."
                    className="w-full bg-transparent px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sub-header info bar */}
            <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100 flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm truncate" title={greetingSub}>
                  {greetingText}
                  {firstName ? <span className="text-indigo-600">، {firstName}</span> : null}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    مدیر
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* 12-Hour Offline Sync Indicator & Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-all cursor-pointer ${
                    isMandatorySyncDue
                      ? 'bg-amber-500 text-white border-amber-600 animate-pulse font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                  }`}
                  title="وضعیت همگام‌سازی آفلاین ۱۲ ساعته با سرور"
                >
                  <Wifi className={`w-3 h-3 ${isMandatorySyncDue ? 'text-white' : 'text-emerald-600'}`} />
                  <span>
                    {isMandatorySyncDue
                      ? 'سینک اجباری ۱۲h'
                      : `${toPersianDigits(remainingHoursUntilSync)}h تا سینک`}
                  </span>
                </button>

                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/60">
                  <CalendarDays className="w-3 h-3 text-slate-400" />
                  <span>{formatPersianDate(new Date(), 'full')}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold border border-slate-200/60 hidden sm:inline-flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b884] animate-pulse" />
                  {liveClock}
                </span>
              </div>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 p-4 sm:p-7 space-y-6 max-w-7xl w-full mx-auto pb-24 lg:pb-10 min-w-0">
            {/* Unverified User Restriction Banner */}
            {currentUser && currentUser.role !== 'admin' && currentUser.username?.toLowerCase() !== 'mohusyn' && (!currentUser.isVerified || currentUser.status === 'pending_verification') && (
              <div className="p-4 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm animate-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 flex-shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-amber-900">حساب کاربری شما محدود است (نیازمند تایید شماره)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 font-bold">محدودیت دسترسی</span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed text-amber-800">
                      جهت باز شدن دسترسی به تمامی امکانات بگ تایم، ایجاد تسک و اتاق‌های گفتگوی زنده، لطفاً حساب خود را با ربات بله تایید فرمایید.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBaleModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#00b884] hover:bg-[#00a375] text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all flex-shrink-0"
                >
                  <Bot className="w-4 h-4" />
                  <span>تأیید فوری با ربات بله</span>
                </button>
              </div>
            )}

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

                {/* Dashboard Recent Messages & Colleagues Chat Section */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4 min-w-0 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4 text-[#00b884]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          پیام‌ها و گفتگوی مستقیم با همکاران
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ارتباط لحظه‌ای و پیام‌رسانی کاری با اعضای تیم
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>ورود به بخش پیام‌ها</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>

                  {friends.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                      <p className="text-xs text-slate-500 font-bold">
                        هنوز با همکاری گفتگو نکرده‌اید.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('messages')}
                        className="px-4 py-2 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        شروع گفتگوی جدید با همکاران 💬
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {friends.slice(0, 6).map((f) => (
                        <div
                          key={f.id}
                          onClick={() => {
                            setDirectChatUser(f as any);
                          }}
                          className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-400 bg-slate-50/60 hover:bg-white transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex-shrink-0">
                              <UserAvatar user={f} size="sm" className="w-10 h-10 shadow-xs" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white absolute bottom-0 right-0" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-900 group-hover:text-black truncate">
                                {f.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                @{f.username}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="p-2 rounded-xl bg-white group-hover:bg-[#121212] text-slate-600 group-hover:text-white border border-slate-200 transition-colors shadow-2xs"
                            title="چت مستقیم"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MESSAGES & CHAT */}
            {activeTab === 'messages' && (
              <div className="w-full min-w-0">
                <MessagesView
                  initialChatUserId={directChatUser?.id || null}
                  onOpenPublicProfile={(u) => setViewingPublicUser(u)}
                />
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

      {/* Mobile Bottom Navigation (screens < 1024px) */}
      <BottomNav />

      {/* Mobile Drawer Navigation (Menu overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[82%] max-w-[320px] bg-white h-full p-4 sm:p-5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 border-l border-slate-200">
            <div className="flex flex-col min-h-0 flex-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {appLogo ? (
                    <img src={appLogo} alt={appName} className="w-9 h-9 rounded-2xl object-cover shadow-xs border border-slate-100" />
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                      <TaskMasterHexagon size={24} />
                    </div>
                  )}
                  <div>
                    <div className="font-black text-sm text-slate-900 leading-tight">{appName}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">مدیریت زمان و فعالیت‌ها</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="بستن منو"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card in Drawer */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="my-3.5 p-3 rounded-2xl bg-gradient-to-l from-slate-50 to-white border border-slate-200/80 text-right w-full flex items-center gap-3 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="relative">
                    <UserAvatar
                      name={currentUser.name}
                      avatar={currentUser.avatar}
                      fallbackImage={defaultAvatar}
                      size="w-10 h-10 rounded-full text-xs"
                      className="rounded-full ring-2 ring-emerald-500/20 shadow-2xs"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {currentUser.jobTitle || (isAdmin ? 'مدیر سیستم' : 'کاربر')}
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:-translate-x-0.5" />
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-900 border border-emerald-500/25 shadow-xs font-black'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#00b884] stroke-[2.5]' : 'text-slate-500 stroke-2'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {toPersianDigits(item.badge)}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-1.5 h-3.5 rounded-full bg-[#00b884]" />
                        )}
                      </div>
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
                  setIsMobileMenuOpen(false);
                  sounds.playPop();
                  setViewingPublicUser(currentUser);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>پروفایل من (دید همکاران)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب کاربری</span>
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
      <ExtensionDownloadModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />

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
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
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

      {/* 12-Hour Offline-First Mandatory Sync Modal */}
      <MandatorySyncModal
        isOpen={isSyncModalOpen || isMandatorySyncDue}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Bale Verification Modal for Restricted Users */}
      {isBaleModalOpen && currentUser && (
        <BaleVerificationModal
          data={{
            userId: currentUser.id,
            username: currentUser.username,
            phone: currentUser.phone || '',
            verificationCode: currentUser.verificationCode || '',
            baleBotUsername: globalSettings?.baleBot?.botUsername || 'BagTime_Bot',
            baleBotLink: `https://ble.ir/${(globalSettings?.baleBot?.botUsername || 'BagTime_Bot').replace(/^@/, '')}?start=verify_${currentUser.verificationCode || ''}`,
          }}
          onClose={() => setIsBaleModalOpen(false)}
        />
      )}

      {/* Colleague or Self Public Profile Card */}
      {(inspectedUser || viewingPublicUser) && (
        <PublicUserProfileModal
          isOpen={Boolean(inspectedUser || viewingPublicUser)}
          user={inspectedUser || viewingPublicUser}
          onClose={() => {
            setInspectedUser(null);
            setViewingPublicUser(null);
          }}
          onStartChat={(peer) => {
            setInspectedUser(null);
            setViewingPublicUser(null);
            setDirectChatUser(peer as any);
          }}
          onEditProfile={() => {
            setInspectedUser(null);
            setViewingPublicUser(null);
            setIsProfileModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
