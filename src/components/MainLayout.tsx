import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, formatAppDate } from '../utils/persianDate';
import { greetingKeySet } from '../utils/appTexts';
import { UserAvatar } from './UserAvatar';
import { ProfileModal } from './ProfileModal';
import { TaskMasterHexagon } from './TaskMasterLogo';
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
import { RemindersModal } from './RemindersModal';
import { UpgradeToProModal } from './UpgradeToProModal';
import { ExtensionDownloadModal } from './ExtensionDownloadModal';
import { FirstLoginProfileModal } from './FirstLoginProfileModal';
import { PublicUserProfileModal } from './PublicUserProfileModal';
import { SubscriptionBadge } from './SubscriptionBadge';
import { ProgressNewspaperStoryModal } from './ProgressNewspaperStoryModal';
import { DailyStoryModal } from './DailyStoryModal';
import { DeviceNotificationSettingsModal } from './DeviceNotificationSettingsModal';
import { MandatoryNotificationPermissionModal } from './MandatoryNotificationPermissionModal';
import {
  checkAndFireScheduledNotifications,
  getNotificationPermission,
  isNotificationSupported,
  sendDeviceNotification,
} from '../utils/webNotifications';
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
  Flame,
  Columns3,
  List,
  ShieldCheck,
  Clock,
  Sparkles,
  Menu,
  X,
  Type,
  Brain,
  Compass,
  Newspaper,
  Feather,
  Smartphone,
  Megaphone,
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
  Sun,
  Moon,
  Calendar,
} from 'lucide-react';
import { MandatorySyncModal } from './MandatorySyncModal';
import { BaleVerificationModal } from './BaleVerificationModal';
import {
  DashboardCustomizationModal,
  DEFAULT_PRIMARY_TABS,
  DEFAULT_SECONDARY_TABS,
  DEFAULT_DASHBOARD_BLOCKS,
} from './DashboardCustomizationModal';
import { SamsungControlCenterDashboard } from './SamsungControlCenterDashboard';
import { LiveUpdateModal } from './LiveUpdateModal';
import { FocusGardenShopModal, type PlantCustomization } from './FocusGardenShopModal';
import { getUserGems, saveGardenData, getGardenData } from '../utils/gemManager';

interface MainLayoutProps {
  onOpenInstagramStudio?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onOpenInstagramStudio }) => {
  const {
    currentUser,
    users,
    tasks,
    streak,
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
    viewingPublicUser,
    setViewingPublicUser,
    isMandatorySyncDue,
    remainingHoursUntilSync,
    isSyncModalOpen,
    setIsSyncModalOpen,
    interfaceMode,
    setInterfaceMode,
    themeMode,
    toggleThemeMode,
    calendarType,
    toggleCalendarType,
    reminders,
    isRemindersModalOpen,
    setIsRemindersModalOpen,
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
  const [isLiveUpdateOpen, setIsLiveUpdateOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isGardenShopOpen, setIsGardenShopOpen] = useState(false);
  const [userGems, setUserGems] = useState<number>(() => getUserGems(currentUser?.id || 'guest'));
  const [gardenCustomization, setGardenCustomization] = useState<PlantCustomization>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_garden_custom_${currentUser?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { species: 'clover', pot: 'terracotta', aura: 'none' };
  });

  useEffect(() => {
    const userKey = currentUser?.id || 'guest';
    setUserGems(getUserGems(userKey));
    const handleUpdate = () => {
      setUserGems(getUserGems(userKey));
    };
    window.addEventListener('taskrooz_garden_updated', handleUpdate);
    return () => window.removeEventListener('taskrooz_garden_updated', handleUpdate);
  }, [currentUser?.id]);

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

  // Daily Story, Newspaper Story & Device Notification States
  const [isNewspaperStoryOpen, setIsNewspaperStoryOpen] = useState(false);
  const [isDailyStoryOpen, setIsDailyStoryOpen] = useState(false);
  const [isDeviceNotifModalOpen, setIsDeviceNotifModalOpen] = useState(false);

  // Mandatory Notification Permission Gate (First thing checked upon opening system)
  const [isNotificationGateOpen, setIsNotificationGateOpen] = useState(false);
  const firedNotifIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isNotificationSupported()) {
      const perm = getNotificationPermission();
      if (perm !== 'granted') {
        setIsNotificationGateOpen(true);
      }
    }
  }, []);

  // Background Web Push / Device Notification Checker (3 Daily Checkpoints + 15m Task Reminders)
  useEffect(() => {
    checkAndFireScheduledNotifications(tasks);
    const interval = setInterval(() => {
      checkAndFireScheduledNotifications(tasks);
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  const refreshNotifications = React.useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
      const unreadList = list.filter((n: any) => !n.read);
      setUnreadNotifCount(unreadList.length);

      // Trigger Web Push Device Notification for newly arrived unread notifications
      if (getNotificationPermission() === 'granted') {
        unreadList.forEach((n: any) => {
          if (!firedNotifIdsRef.current.has(n.id)) {
            firedNotifIdsRef.current.add(n.id);
            sendDeviceNotification(n.title, {
              body: n.message,
              url: n.url,
              tag: n.id,
            });
            sounds.playPop();
          }
        });
      }
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
    ...(isAdmin ? [{ id: 'users' as TabType, label: 'مانیتورینگ کاربران', icon: ShieldCheck, adminOnly: true, badge: users.length > 0 ? users.length : undefined }] : []),
  ];

  // User personalization for sidebar menu (Top vs Bottom sections) & Dashboard blocks
  const userKey = currentUser ? (currentUser.id || currentUser.username || 'guest') : 'guest';
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

  const [userPrimaryTabs, setUserPrimaryTabs] = useState<TabType[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_menu_primary_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const def = [...DEFAULT_PRIMARY_TABS];
    if (isAdmin && !def.includes('users')) def.push('users');
    return def;
  });

  const [userSecondaryTabs, setUserSecondaryTabs] = useState<TabType[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_menu_secondary_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return DEFAULT_SECONDARY_TABS;
  });

  const [dashboardBlocksOrder, setDashboardBlocksOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_dashboard_blocks_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DASHBOARD_BLOCKS;
  });

  useEffect(() => {
    try {
      const savedPrim = localStorage.getItem(`taskrooz_menu_primary_${userKey}`);
      if (savedPrim) {
        const parsed = JSON.parse(savedPrim);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserPrimaryTabs(parsed);
        }
      } else {
        const def = [...DEFAULT_PRIMARY_TABS];
        if (isAdmin && !def.includes('users')) def.push('users');
        setUserPrimaryTabs(def);
      }

      const savedSec = localStorage.getItem(`taskrooz_menu_secondary_${userKey}`);
      if (savedSec) {
        const parsed = JSON.parse(savedSec);
        if (Array.isArray(parsed)) {
          setUserSecondaryTabs(parsed);
        }
      } else {
        setUserSecondaryTabs(DEFAULT_SECONDARY_TABS);
      }

      const savedBlocks = localStorage.getItem(`taskrooz_dashboard_blocks_${userKey}`);
      if (savedBlocks) {
        const parsed = JSON.parse(savedBlocks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDashboardBlocksOrder(parsed);
        }
      } else {
        setDashboardBlocksOrder(DEFAULT_DASHBOARD_BLOCKS);
      }
    } catch {}
  }, [userKey, isAdmin]);

  const handleSaveMenuConfig = (newPrimary: TabType[], newSecondary: TabType[]) => {
    setUserPrimaryTabs(newPrimary);
    setUserSecondaryTabs(newSecondary);
    try {
      localStorage.setItem(`taskrooz_menu_primary_${userKey}`, JSON.stringify(newPrimary));
      localStorage.setItem(`taskrooz_menu_secondary_${userKey}`, JSON.stringify(newSecondary));
    } catch {}
  };

  const handleSaveDashboardBlocks = (newBlocks: string[]) => {
    setDashboardBlocksOrder(newBlocks);
    try {
      localStorage.setItem(`taskrooz_dashboard_blocks_${userKey}`, JSON.stringify(newBlocks));
    } catch {}
  };

  const navItemMap = new Map(navItems.map((item) => [item.id, item]));

  // Primary nav items in user-configured order (بالای منو)
  const primaryNavItems = (interfaceMode === 'simple' ? userPrimaryTabs : navItems.map((n) => n.id))
    .map((id) => navItemMap.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  // Secondary nav items in user-configured order (پایین منو - سایر امکانات)
  const secondaryNavItems = (interfaceMode === 'simple' ? userSecondaryTabs : [])
    .map((id) => navItemMap.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  // Append any unassigned nav items to secondary
  if (interfaceMode === 'simple') {
    const assignedIds = new Set([...userPrimaryTabs, ...userSecondaryTabs]);
    navItems.forEach((item) => {
      if (!assignedIds.has(item.id)) {
        secondaryNavItems.push(item);
      }
    });
  }

  const isCurrentTabSecondary = secondaryNavItems.some((item) => item.id === activeTab);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'users' && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin, setActiveTab]);

  useEffect(() => {
    if (isCurrentTabSecondary) {
      setIsMoreToolsOpen(true);
    }
  }, [activeTab, isCurrentTabSecondary]);

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
                <h1 className="font-black text-lg text-slate-900 flex items-center gap-1">
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

          {/* MENU Label & Customization */}
          {isSidebarExpanded && (
            <div className="flex items-center justify-between my-2 px-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                MENU
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setIsCustomizationModalOpen(true);
                }}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer p-0.5 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                title="شخصی‌سازی منو و چینش پنل"
              >
                <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-bold">شخصی‌سازی</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={`space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar py-2 ${isSidebarExpanded ? '-mx-1 px-1' : 'w-full flex flex-col items-center'}`}>
            {primaryNavItems.map((item) => {
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
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 dark:text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-emerald-500" />
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
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shadow-xs font-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00b884] stroke-[2.5]' : 'text-slate-500 dark:text-zinc-400 stroke-2'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
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

            {/* Expandable Secondary Tools Section in Simple Mode */}
            {interfaceMode === 'simple' && secondaryNavItems.length > 0 && (
              isSidebarExpanded ? (
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsMoreToolsOpen(!isMoreToolsOpen);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrentTabSecondary || isMoreToolsOpen
                        ? 'bg-slate-100/80 text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-indigo-500" />
                      <span>سایر امکانات و ابزارها</span>
                      {isCurrentTabSecondary && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMoreToolsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMoreToolsOpen && (
                    <div className="mt-1 space-y-0.5 pr-2 border-r-2 border-indigo-200/80 mr-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {secondaryNavItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              sounds.playPop();
                              setActiveTab(item.id);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-900 font-black border border-indigo-200/70'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                                {toPersianDigits(item.badge)}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setIsCustomizationModalOpen(true);
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 mt-1 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer border border-dashed border-indigo-200/80 dark:border-indigo-800/60"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>شخصی‌سازی چینش ابزارها</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full pt-2 mt-2 border-t border-slate-100 flex flex-col items-center relative">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setIsMoreToolsOpen(!isMoreToolsOpen);
                    }}
                    title="سایر امکانات و ابزارها"
                    className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all cursor-pointer ${
                      isCurrentTabSecondary || isMoreToolsOpen
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs'
                        : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    {isCurrentTabSecondary && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>

                  {/* Clean Flyout Menu for Collapsed Rail */}
                  {isMoreToolsOpen && (
                    <div className="absolute right-14 top-0 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-left-2">
                      <div className="text-[10px] font-black text-slate-400 px-2 py-1 border-b border-slate-100 mb-1">
                        سایر امکانات و ابزارها
                      </div>
                      {secondaryNavItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              sounds.playPop();
                              setActiveTab(item.id);
                              setIsMoreToolsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                {toPersianDigits(item.badge)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}
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
        <div className={`space-y-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs flex-shrink-0 ${isSidebarExpanded ? 'w-full' : 'w-full flex flex-col items-center'}`}>
          {/* UI Mode Switcher (Simple vs Pro) */}
          <div className={`p-1 bg-slate-100/90 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-[11px] font-bold ${
            isSidebarExpanded ? 'w-full flex items-center gap-1' : 'w-10 flex flex-col items-center gap-1 p-1'
          }`}>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setInterfaceMode('simple');
              }}
              className={`rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isSidebarExpanded ? 'flex-1 py-1 px-2' : 'w-8 h-7'
              } ${
                interfaceMode === 'simple'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-400 font-black shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="رابط ساده و روان (آسون)"
            >
              <span>🌿</span>
              {isSidebarExpanded && <span>ساده</span>}
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setInterfaceMode('advanced');
              }}
              className={`rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isSidebarExpanded ? 'flex-1 py-1 px-2' : 'w-8 h-7'
              } ${
                interfaceMode === 'advanced'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-800 dark:text-indigo-400 font-black shadow-xs ring-1 ring-indigo-500/20'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="رابط حرفه‌ای و جامع (Pro)"
            >
              <span>⚡</span>
              {isSidebarExpanded && <span>حرفه‌ای</span>}
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsFontModalOpen(true);
              }}
              className={`flex items-center gap-2.5 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer ${
                isSidebarExpanded ? 'w-full px-3 py-2' : 'w-10 h-10 justify-center'
              }`}
              title="مشاهده پروفایل شما (دید همکاران)"
            >
              <Eye className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
              {isSidebarExpanded && <span>پروفایل من (دید همکاران)</span>}
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className={`flex items-center gap-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ${
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
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-[#f4f7fa] overflow-hidden">
        {/* Top Header Bar - 100% FIXED AT TOP */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2 sm:py-3 z-20 flex-shrink-0 flex flex-col gap-2 max-w-full shadow-2xs">
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
                  <div className="relative flex items-center bg-[#f4f6f8] dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-full px-4 py-2 hover:border-slate-300 dark:hover:border-zinc-700 focus-within:border-slate-400 dark:focus-within:border-zinc-600 transition-all w-full">
                    <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اینجا جستجو کنید..."
                      className="w-full bg-transparent px-2.5 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                      className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 flex-shrink-0 cursor-pointer"
                      title="فیلترها"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* 1. Real-time Gems Counter & Shop Shortcut (Prominent for all users) */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsGardenShopOpen(true);
                  }}
                  className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-amber-400/80 dark:border-amber-500/40 bg-gradient-to-r from-amber-100/90 via-amber-50 to-indigo-50/80 dark:from-amber-950/40 dark:to-indigo-950/30 hover:shadow-md transition-all flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-bold text-xs cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs group"
                  title="موجودی الماس‌های شما - کلیک کنید تا وارد فروشگاه باغچه شوید"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse group-hover:rotate-12 transition-transform" />
                  <span className="font-mono font-black">{toPersianDigits(userGems)}</span>
                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">الماس</span>
                </button>

                {/* 2. Streak Badge */}
                <div
                  className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs flex-shrink-0"
                  title={`زنجیره استمرار: ${toPersianDigits(streak.currentStreak)} روز`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30 animate-pulse" />
                  <span className="font-mono font-black">{toPersianDigits(streak.currentStreak)}</span>
                  <span className="hidden sm:inline text-[10px]">روز</span>
                </div>

                {/* Mobile Search Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className="md:hidden w-8 h-8 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                  title="جستجو"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                {/* 3. Consolidated Tools Dropdown Menu (Replaces all scattered extra buttons!) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className="h-8 sm:h-9 px-3 rounded-full border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-slate-700 dark:text-zinc-200 font-bold text-xs transition-all shadow-2xs cursor-pointer flex-shrink-0"
                    title="سایر امکانات و ابزارهای بگ‌تایم"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>امکانات و ابزارها</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  {isToolsDropdownOpen && (
                    <div
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 select-none"
                      onClick={() => setIsToolsDropdownOpen(false)}
                    >
                      <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2.5 py-1 border-b border-slate-100 dark:border-zinc-800 mb-1 text-right">
                        امکانات و ابزارهای بگ‌تایم:
                      </div>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsNewspaperStoryOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Newspaper className="w-4 h-4 text-amber-500" />
                        <span>استوری روزنامه و مفاخر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsDailyStoryOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Feather className="w-4 h-4 text-emerald-500" />
                        <span>داستان روز و خاطره‌نگاری</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsDeviceNotifModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Smartphone className="w-4 h-4 text-indigo-500" />
                        <span>اعلان‌های هوشمند گوشی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsRemindersModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Bell className="w-4 h-4 text-sky-500" />
                        <span>یادآورها و آلارم‌های ۳۰ روزه</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsExtensionModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>افزونه نیوتَب مرورگر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { sounds.playPop(); setIsShareModalOpen(true); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-right"
                      >
                        <Share2 className="w-4 h-4 text-teal-500" />
                        <span>اشتراک‌گذاری گزارش</span>
                      </button>

                      {isAdmin && (
                        <>
                          <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
                          {users.length > 1 && (
                            <div className="px-2 py-1">
                              <div className="text-[10px] text-slate-400 font-bold mb-1">فیلتر تسک‌های کاربر:</div>
                              <select
                                value={selectedFilterUserId || ''}
                                onChange={(e) => setSelectedFilterUserId(e.target.value || null)}
                                className="w-full px-2 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs outline-none cursor-pointer truncate"
                              >
                                <option value="">همه کاربران</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => { sounds.playPop(); setIsLiveUpdateOpen(true); }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-right"
                          >
                            <span className="text-xs">⚡</span>
                            <span>بروزرسانی زنده سرور (ZIP)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.playPop();
                              if (onOpenInstagramStudio) onOpenInstagramStudio();
                              else {
                                const url = new URL(window.location.href);
                                url.searchParams.set('page', 'instagram');
                                window.location.href = url.toString();
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors cursor-pointer text-right"
                          >
                            <span className="text-xs">📸</span>
                            <span>اسلایدهای اینستاگرام</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Notification Bell with interactive Modal */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsNotificationCenterOpen(true);
                    setUnreadNotifCount(0);
                  }}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors shadow-2xs relative cursor-pointer flex-shrink-0"
                  title="مرکز اعلان‌ها"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#f95738] absolute top-1 right-1 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                  )}
                </button>

                {/* Subscription Pro Badge or Upgrade Button (hidden on mobile) */}
                <div className="hidden sm:flex items-center flex-shrink-0">
                  {isPro ? (
                    <SubscriptionBadge user={currentUser} size="sm" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setIsUpgradeModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[10px] sm:text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                      title="ارتقاء به اشتراک ویژه نامحدود"
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>ارتقاء Pro</span>
                    </button>
                  )}
                </div>

                {/* Dark / Light Mode Switcher (hidden on mobile, set via profile/settings) */}
                <button
                  type="button"
                  onClick={toggleThemeMode}
                  className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full border items-center justify-center transition-all shadow-2xs cursor-pointer flex-shrink-0 hidden md:flex ${
                    themeMode === 'dark'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                  title={themeMode === 'dark' ? 'تغییر به تم روشن (Light)' : 'تغییر به تم تاریک (Dark Mode)'}
                >
                  {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>

                {/* Calendar Type Switcher (visible on all screens) */}
                <button
                  type="button"
                  onClick={toggleCalendarType}
                  className="h-8 sm:h-9 px-2.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center gap-1 font-bold text-xs transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                  title={calendarType === 'jalali' ? 'تقویم خورشیدی (شمسی) فعال است — کلیک برای تغییر به میلادی' : 'تقویم میلادی فعال است — کلیک برای تغییر به شمسی'}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{calendarType === 'jalali' ? 'شمسی' : 'میلادی'}</span>
                </button>

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
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer hidden sm:flex flex-shrink-0"
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
                    className="flex items-center gap-1.5 sm:gap-2 sm:pl-3 sm:pr-1 p-0.5 rounded-full border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer flex-shrink-0"
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
            <div className="flex items-center justify-between text-xs pt-1.5 px-1 border-t border-slate-100 dark:border-zinc-800/80 flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-slate-800 dark:text-zinc-100 text-xs sm:text-sm truncate" title={greetingSub}>
                  {greetingText}
                  {firstName ? <span className="text-indigo-600 dark:text-indigo-400">، {firstName}</span> : null}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
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
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700/50'
                  }`}
                  title="وضعیت همگام‌سازی آفلاین ۱۲ ساعته با سرور"
                >
                  <Wifi className={`w-3 h-3 ${isMandatorySyncDue ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span>
                    {isMandatorySyncDue
                      ? 'سینک اجباری ۱۲h'
                      : `${toPersianDigits(remainingHoursUntilSync)}h تا سینک`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleCalendarType}
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-white font-bold border border-slate-200/60 dark:border-zinc-700/50 cursor-pointer transition-colors"
                  title="کلیک برای تغییر بین تقویم شمسی و میلادی"
                >
                  <CalendarDays className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>{formatAppDate(new Date(), calendarType, 'full')}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black">
                    {calendarType === 'jalali' ? 'شمسی' : 'میلادی'}
                  </span>
                </button>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 font-mono font-bold border border-slate-200/60 dark:border-zinc-700/50 hidden sm:inline-flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b884] animate-pulse" />
                  {liveClock}
                </span>
              </div>
            </div>
          </header>

          {/* Scrollable Container for Main Content & Footer */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
            {/* Main Body - Full-Width Bleed Layout with no artificial side gutters */}
            <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full pb-24 lg:pb-10 min-w-0 overflow-x-hidden">
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
                    ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-200'
                    : globalSettings.broadcastNotice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-200'
                    : globalSettings.broadcastNotice.type === 'motivational'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-200'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                      globalSettings.broadcastNotice.type === 'urgent'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                        : globalSettings.broadcastNotice.type === 'warning'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                        : globalSettings.broadcastNotice.type === 'motivational'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs">
                        {globalSettings.broadcastNotice.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold">
                        پیام سراسری سازمان
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {globalSettings.broadcastNotice.message}
                    </p>
                  </div>
                </div>

                {globalSettings.dailyMantra && (
                  <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold bg-white/70 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/10 flex-shrink-0 text-slate-800 dark:text-zinc-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تمرکز روز: {globalSettings.dailyMantra}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: DASHBOARD (MODULAR CONTROL CENTER) */}
            {activeTab === 'dashboard' && (
              <SamsungControlCenterDashboard
                onOpenCreateTask={(d) => openCreateModal(d || selectedDate)}
                onOpenNewspaperStory={() => setIsNewspaperStoryOpen(true)}
                onOpenDailyStory={() => setIsDailyStoryOpen(true)}
                onOpenPublicProfile={(u) => setViewingPublicUser(u)}
                onStartDirectChat={(u) => setDirectChatUser(u)}
                setActiveTab={setActiveTab}
                interfaceMode={interfaceMode}
              />
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

          {/* Micro Footer Under Pages: "بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه" */}
          {globalSettings?.footerBranding?.enabled !== false && (
            <footer className="py-2.5 px-4 text-center select-none text-[10.5px] text-slate-400 dark:text-zinc-500 border-t border-slate-200/40 dark:border-white/[0.05] mt-auto bg-transparent">
              <span>{globalSettings?.footerBranding?.prefixText || 'بَگ‌تایم، از خانوادهٔ'}{' '}</span>
              {globalSettings?.footerBranding?.isLinkEnabled && globalSettings?.footerBranding?.companyUrl ? (
                <a
                  href={globalSettings.footerBranding.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-zinc-700 underline-offset-2 hover:decoration-indigo-500"
                >
                  {globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه'}
                </a>
              ) : (
                <strong className="font-black text-slate-600 dark:text-zinc-400">
                  {globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه'}
                </strong>
              )}
            </footer>
          )}
          </div>
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
                {primaryNavItems.map((item) => {
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

                {/* Secondary Items in Drawer when Simple Mode */}
                {interfaceMode === 'simple' && secondaryNavItems.length > 0 && (
                  <div className="pt-2 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrentTabSecondary || isMoreToolsOpen
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-indigo-500" />
                        <span>سایر امکانات و ابزارها</span>
                        {isCurrentTabSecondary && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMoreToolsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMoreToolsOpen && (
                      <div className="mt-1 space-y-0.5 pr-2 border-r-2 border-indigo-200 mr-2 animate-in fade-in duration-150">
                        {secondaryNavItems.map((item) => {
                          const isActive = activeTab === item.id;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleMobileTabSelect(item.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/80'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                              </div>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-2 text-xs flex-shrink-0">
              {/* Instagram Studio for Admin in Mobile Drawer */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sounds.playPop();
                    if (onOpenInstagramStudio) {
                      onOpenInstagramStudio();
                    } else {
                      const url = new URL(window.location.href);
                      url.searchParams.set('page', 'instagram');
                      window.location.href = url.toString();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-pink-700 bg-pink-50 border border-pink-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <span className="text-xs">📸</span>
                  <span>استودیو اسلایدهای اینستاگرام</span>
                </button>
              )}

              {/* Reminders Button in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  sounds.playPop();
                  setIsRemindersModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-amber-800 bg-amber-50/80 border border-amber-200/80 font-bold text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>یادآورها (آلارم روزانه ۱ ماهه)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-black">
                  {toPersianDigits(reminders.filter((r) => r.active).length)} فعال
                </span>
              </button>

              {/* Theme & Calendar Quick Switcher in Mobile Drawer */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={toggleThemeMode}
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 cursor-pointer"
                >
                  {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                  <span>{themeMode === 'dark' ? 'تم روشن' : 'تم دارک'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCalendarType}
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{calendarType === 'jalali' ? 'شمسی' : 'میلادی'}</span>
                </button>
              </div>

              {/* Interface Mode Toggle in Mobile Drawer */}
              <div className="p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setInterfaceMode('simple');
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    interfaceMode === 'simple'
                      ? 'bg-white text-emerald-800 font-black shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>🌿 ساده</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setInterfaceMode('advanced');
                  }}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    interfaceMode === 'advanced'
                      ? 'bg-white text-indigo-800 font-black shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>⚡ حرفه‌ای</span>
                </button>
              </div>

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

      {/* Reminders Modal (30-day daily alert system) */}
      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
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
          setIsNotificationCenterOpen(false);
        }}
        onOpenChat={(userId, userName) => {
          const matchedUser = users.find((u) => u.id === userId || (u.username && u.username.toLowerCase() === userId.toLowerCase())) ||
                              friendsList.find((f: any) => f.id === userId || (f.username && f.username.toLowerCase() === userId.toLowerCase()));
          setDirectChatUser({
            id: userId,
            name: matchedUser?.name || userName || 'همکار',
            username: matchedUser?.username,
            avatar: matchedUser?.avatar,
            role: matchedUser?.role,
            status: 'online',
          });
          setIsNotificationCenterOpen(false);
        }}
        onNotificationClick={(n) => {
          api.markNotificationsRead(n.id).catch(() => {});

          const isChatOrFriend =
            n.type === 'message' ||
            n.type === 'friend' ||
            n.id.startsWith('notif_msg_') ||
            n.id.startsWith('notif_freq_') ||
            n.id.startsWith('notif_f_acc_') ||
            n.title.includes('پیام') ||
            n.title.includes('دوستی') ||
            n.title.includes('همکاری') ||
            Boolean(n.senderId) ||
            Boolean(n.fromUserId);

          if (isChatOrFriend) {
            let targetUserId = n.senderId || n.fromUserId;
            let targetUserName = n.senderName || n.fromUserName || n.userName;

            if (!targetUserId && n.title.includes('از ')) {
              const parts = n.title.split('از ')[1]?.split(' ');
              const rawName = parts ? parts[0]?.trim() : '';
              if (rawName) {
                const found = users.find((u) => (u.username && u.username.toLowerCase().includes(rawName.toLowerCase())) || (u.name && u.name.includes(rawName))) ||
                              friendsList.find((f: any) => (f.username && f.username.toLowerCase().includes(rawName.toLowerCase())) || (f.name && f.name.includes(rawName)));
                if (found) {
                  targetUserId = found.id;
                  targetUserName = found.name;
                }
              }
            }

            if (!targetUserId && n.userId && n.userId !== currentUser?.id) {
              targetUserId = n.userId;
            }

            if (targetUserId) {
              const matchedUser = users.find((u) => u.id === targetUserId || (u.username && u.username.toLowerCase() === targetUserId.toLowerCase())) ||
                                  friendsList.find((f: any) => f.id === targetUserId || (f.username && f.username.toLowerCase() === targetUserId.toLowerCase()));
              setDirectChatUser({
                id: targetUserId,
                name: matchedUser?.name || targetUserName || 'همکار',
                username: matchedUser?.username,
                avatar: matchedUser?.avatar,
                role: matchedUser?.role,
                status: 'online',
              });
              setIsNotificationCenterOpen(false);
              return;
            }
          }

          if (n.type === 'task') {
            setActiveTab('tasks');
            setIsNotificationCenterOpen(false);
            return;
          }

          setIsNotificationCenterOpen(false);
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

      {/* Progress Newspaper Story Modal (Vintage Editorial & Celebrity Twins) */}
      <ProgressNewspaperStoryModal
        isOpen={isNewspaperStoryOpen}
        onClose={() => setIsNewspaperStoryOpen(false)}
        onOpenDailyStory={() => setIsDailyStoryOpen(true)}
      />

      {/* Daily Story / Journal Modal */}
      <DailyStoryModal
        isOpen={isDailyStoryOpen}
        onClose={() => setIsDailyStoryOpen(false)}
      />

      {/* Web Push & Browser Device Notification Settings Modal */}
      <DeviceNotificationSettingsModal
        isOpen={isDeviceNotifModalOpen}
        onClose={() => setIsDeviceNotifModalOpen(false)}
      />

      {/* Mandatory Notification Permission Gate (First thing checked upon opening system) */}
      {isNotificationGateOpen && (
        <MandatoryNotificationPermissionModal
          onPermissionGranted={() => setIsNotificationGateOpen(false)}
        />
      )}

      {/* Mandatory First-Login Profile Completion */}
      <FirstLoginProfileModal
        isOpen={isFirstLoginModalOpen}
        onClose={() => setIsFirstLoginModalOpen(false)}
      />

      {/* 12-Hour Offline-First Sync Modal (Only on manual user click, never blocking) */}
      <MandatorySyncModal
        isOpen={isSyncModalOpen}
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
      {/* Dashboard & Sidebar Menu Customization Modal */}
      <DashboardCustomizationModal
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        primaryTabIds={userPrimaryTabs}
        secondaryTabIds={userSecondaryTabs}
        onSaveMenuConfig={handleSaveMenuConfig}
        dashboardBlocksOrder={dashboardBlocksOrder}
        onSaveDashboardBlocks={handleSaveDashboardBlocks}
        navItems={navItems}
        isAdmin={isAdmin}
      />

      {/* Zero-Downtime Live Server Updater Modal */}
      {isAdmin && (
        <LiveUpdateModal
          isOpen={isLiveUpdateOpen}
          onClose={() => setIsLiveUpdateOpen(false)}
        />
      )}

      {/* FOCUS GARDEN SHOP & ACCESSORIES MODAL */}
      <FocusGardenShopModal
        isOpen={isGardenShopOpen}
        onClose={() => setIsGardenShopOpen(false)}
        gardenGems={userGems}
        onUpdateGems={(newGems) => {
          saveGardenData(currentUser?.id || 'guest', {
            ...getGardenData(currentUser?.id || 'guest'),
            gems: newGems,
          });
          setUserGems(newGems);
        }}
        customization={gardenCustomization}
        onUpdateCustomization={(c) => {
          setGardenCustomization(c);
          try {
            localStorage.setItem(
              `taskrooz_garden_custom_${currentUser?.id || 'guest'}`,
              JSON.stringify(c)
            );
          } catch {}
        }}
      />
    </div>
  );
};
