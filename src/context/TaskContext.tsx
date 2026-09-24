import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Task,
  Category,
  AppSettings,
  DailyStreak,
  TabType,
  FilterStatus,
  User,
  TaskViewMode,
  TaskCreateInput,
  FocusRoom,
  TeamProject,
  CareerGoal,
  PersonalityTestResult,
  UncompletedCategory,
  UserTimeline,
  GlobalSystemSettings,
  SystemFontOption,
  FriendRequestItem,
  AppOperatingMode,
  TaskWorkLog,
} from '../types';
import { api, DEFAULT_GLOBAL_SETTINGS, onSyncEvent, broadcastSync } from '../services/api';
import { getTodayISO, formatPersianDate, toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { DEFAULT_APP_TEXTS } from '../utils/appTexts';
import confetti from 'canvas-confetti';

interface TaskContextType {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  categories: Category[];
  projects: TeamProject[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  settings: AppSettings;
  systemFont: string;
  setSystemFont: (fontId: string) => void;
  streak: DailyStreak;
  selectedDate: string;
  activeTab: TabType;
  taskViewMode: TaskViewMode;
  filterStatus: FilterStatus;
  filterCategory: string | null;
  selectedFilterUserId: string | null;
  searchQuery: string;
  activeFocusTaskId: string | null;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  isShareModalOpen: boolean;
  isLoading: boolean;
  
  // Auth & User Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    birthDate?: string;
    jobTitle?: string;
    skills?: string[];
    dailyTimeline?: UserTimeline;
  }) => Promise<any>;
  completeBaleVerification: (user: User) => void;
  logout: () => Promise<void>;
  createUser: (data: {
    username: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    jobTitle?: string;
    skills?: string[];
  }) => Promise<User>;
  updateUser: (data: { id: string; name: string; role: 'admin' | 'user'; password?: string }) => Promise<void>;
  updateMyProfile: (data: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    birthDate?: string;
    jobTitle?: string;
    skills?: string[];
    bio?: string;
    coverImage?: string;
    isProfileCompleted?: boolean;
    dailyTimeline?: Record<string, string>;
    avatar?: string | null;
    password?: string;
    baleChatId?: string | number;
    baleUsername?: string;
    baleNotifToken?: string;
    baleNotificationsEnabled?: boolean;
  }) => Promise<void>;
  deleteUser: (id: string, username?: string) => Promise<void>;
  deleteUsersBulk: (ids: string[]) => Promise<{
    deletedCount: number;
    deleted: string[];
    skipped: { id: string; reason: string }[];
  }>;
  refreshUsers: () => Promise<void>;
  /** Admin-editable app text with fallback to the built-in default */
  getText: (key: string) => string;

  // Career Goals & Personality
  goals: CareerGoal[];
  addGoal: (goal: Omit<CareerGoal, 'id' | 'createdAt' | 'userId'>) => Promise<CareerGoal>;
  updateGoal: (id: string, updates: Partial<CareerGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  personalityResult: PersonalityTestResult | null;
  savePersonalityResult: (result: PersonalityTestResult) => Promise<void>;
  updateUserTimeline: (timeline: UserTimeline) => Promise<void>;

  // Daily Notes
  dailyNotes: Record<string, string>;
  saveDailyNote: (date: string, content: string) => Promise<void>;

  // Incomplete Task Reason Modal
  incompleteModalTask: Task | null;
  openIncompleteModal: (task: Task) => void;
  closeIncompleteModal: () => void;
  setTaskIncompleteReason: (taskId: string, category: UncompletedCategory, reason: string) => Promise<void>;

  // Excel / CSV Export
  exportUsersCsv: (ids?: string[]) => void;

  // Group Focus Rooms (Pomodoro Rooms)
  activeRoomId: string | null;
  activeRoom: FocusRoom | null;
  joinFocusRoom: (roomId: string) => Promise<boolean>;
  leaveFocusRoom: () => Promise<void>;
  deleteFocusRoom: (roomId?: string) => Promise<void>;
  deleteAllFocusRooms: () => Promise<number>;
  createFocusRoom: (name: string, focusDuration?: number, breakDuration?: number) => Promise<FocusRoom>;
  syncRoomTimer: (action: 'start' | 'pause' | 'reset' | 'setMode', timeLeft?: number, mode?: string) => Promise<void>;
  sendRoomMessage: (text: string) => Promise<void>;
  refreshActiveRoom: () => Promise<void>;

  // Team Projects
  createTeamProject: (data: { name: string; description?: string; color?: string; icon?: string; memberIds?: string[] }) => Promise<TeamProject>;
  updateTeamProject: (id: string, updates: Partial<TeamProject>) => Promise<void>;
  deleteTeamProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;

  // Navigation & Filters
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: TabType) => void;
  setTaskViewMode: (mode: TaskViewMode) => void;
  setFilterStatus: (filter: FilterStatus) => void;
  setFilterCategory: (categoryId: string | null) => void;
  setSelectedFilterUserId: (userId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFocusTaskId: (id: string | null) => void;
  setIsShareModalOpen: (open: boolean) => void;
  
  // Task management
  addTask: (task: TaskCreateInput) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  togglePin: (taskId: string) => Promise<void>;
  addFocusMinutes: (taskId: string, minutes: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
  
  // Modal controllers
  openCreateModal: (defaultDate?: string, defaultUserId?: string, defaultProjectId?: string) => void;
  openEditModal: (task: Task) => void;
  closeTaskModal: () => void;
  
  // Category management
  addCategory: (category: { name: string; color: string; icon: string }) => Promise<Category>;
  deleteCategory?: (id: string) => Promise<void>;
  
  // Friends & Colleague Network
  friends: User[];
  friendRequests: { incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] };
  refreshFriends: () => Promise<void>;
  sendFriendRequest: (toUserId: string, projectId?: string, projectName?: string) => Promise<any>;
  acceptFriendRequest: (requestId: string) => Promise<any>;
  rejectFriendRequest: (requestId: string) => Promise<any>;
  removeFriend: (friendId: string) => Promise<any>;

  // Subscription & Identity
  isPro: boolean;
  setUserSubscription: (
    userId: string,
    plan: 'free' | 'plus' | 'pro' | 'ultra',
    planType?: '1_month' | '3_months' | '6_months',
    expiresAt?: string
  ) => Promise<void>;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isFirstLoginModalOpen: boolean;
  setIsFirstLoginModalOpen: (open: boolean) => void;
  viewingPublicUser: User | null;
  setViewingPublicUser: (user: User | null) => void;

  // Operating Mode & Community Demo & Work Logger
  isDemoMode: boolean;
  appOperatingMode: AppOperatingMode;
  setAppOperatingMode: (mode: AppOperatingMode) => Promise<void>;
  logTaskWorkTime: (taskId: string, minutes: number) => Promise<void>;
  deleteMyAccount: () => Promise<void>;
  approveUserRegistration: (userId: string) => Promise<void>;

  // Settings
  updateSettings: (partial: Partial<AppSettings>) => void;
  getDailySummaryText: () => string;

  // Global System Settings & Custom Fonts
  globalSettings: GlobalSystemSettings;
  updateGlobalSettings: (partial: Partial<GlobalSystemSettings>) => Promise<void>;
  allAvailableFonts: SystemFontOption[];
  customFonts: SystemFontOption[];
  addCustomFont: (font: { name: string; family: string; fontUrl?: string; description?: string }) => void;
  uploadCustomFont: (file: File, name: string, family?: string, description?: string) => Promise<SystemFontOption>;
  deleteCustomFont: (fontId: string) => void;

  // 12-Hour Offline-First Sync
  isMandatorySyncDue: boolean;
  remainingHoursUntilSync: number;
  triggerServerSync: () => Promise<void>;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const AVAILABLE_FONTS: SystemFontOption[] = [
  {
    id: 'vazirmatn',
    name: 'وزیرمتن (پیش‌فرض مدرن)',
    family: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    description: 'استاندارد، مدرن و فوق‌العاده خوانا برای وب و موبایل',
  },
  {
    id: 'cairo',
    name: 'قاهره (بولد و پویا)',
    family: "'Cairo', 'Vazirmatn', -apple-system, sans-serif",
    description: 'فونت هندسی و چشم‌نواز با خطوط قوی و مدرن',
  },
  {
    id: 'rubik',
    name: 'روبیک (گرد و صمیمی)',
    family: "'Rubik', 'Vazirmatn', -apple-system, sans-serif",
    description: 'فونت با گوشه‌های نرم و گرد، صمیمی و زیبا',
  },
  {
    id: 'shabnam',
    name: 'شبنم (فرهنگی و خوانا)',
    family: "'Shabnam', 'Vazirmatn', -apple-system, sans-serif",
    description: 'فونت رسمی، ساختاریافته و با تناسبات دقیق',
  },
  {
    id: 'sahel',
    name: 'ساحل (هندسی و لطیف)',
    family: "'Sahel', 'Vazirmatn', -apple-system, sans-serif",
    description: 'فونت هندسی، ظریف و چشم‌نواز برای متون طولانی',
  },
  {
    id: 'jakarta',
    name: 'پلاس جاکارتا مدرن',
    family: "'Plus Jakarta Sans', 'Vazirmatn', sans-serif",
    description: 'فونت بین‌المللی مینیمال و تمیز',
  },
];

function injectFontLink(font: SystemFontOption) {
  try {
    if (!font) return;
    const fontSource = font.dataUrl || font.fontUrl;
    if (!fontSource) return;
    const elementId = `custom-font-style-${font.id || 'default'}`;
    const existing = document.getElementById(elementId);
    if (existing) existing.remove();

    if (fontSource.endsWith('.css') || fontSource.includes('fonts.googleapis') || fontSource.includes('cdn.')) {
      const link = document.createElement('link');
      link.id = elementId;
      link.rel = 'stylesheet';
      link.href = fontSource;
      document.head.appendChild(link);
    } else {
      const style = document.createElement('style');
      style.id = elementId;
      const cleanFamily = (font.family || font.name || 'CustomFont').replace(/['"]/g, '').split(',')[0].trim();
      style.textContent = `
        @font-face {
          font-family: '${cleanFamily}';
          src: url('${fontSource}') format('woff2'), url('${fontSource}') format('truetype'), url('${fontSource}') format('opentype');
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (e) {
    console.warn('Could not inject font link:', e);
  }
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCachedUser());
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !api.getCachedUser() && Boolean(api.getAuthToken()));

  // Custom fonts & Global settings
  const [customFonts, setCustomFonts] = useState<SystemFontOption[]>(() => {
    return api.getCustomFonts();
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalSystemSettings>(() => {
    try {
      const raw = localStorage.getItem('taskrooz_global_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_GLOBAL_SETTINGS;
  });

  const allAvailableFonts = useMemo(() => {
    return [...AVAILABLE_FONTS, ...customFonts];
  }, [customFonts]);

  const [systemFont, setSystemFontState] = useState<string>(() => {
    try {
      return localStorage.getItem('taskrooz_system_font') || 'vazirmatn';
    } catch {
      return 'vazirmatn';
    }
  });

  const setSystemFont = (fontId: string) => {
    setSystemFontState(fontId);
    sounds.playPop();
  };

  const addCustomFont = (fontData: { name: string; family: string; fontUrl?: string; description?: string }) => {
    const rawFamily = fontData.family.trim().replace(/['"]/g, '');
    const newFont: SystemFontOption = {
      id: 'custom_' + Date.now(),
      name: fontData.name.trim(),
      family: `'${rawFamily}', 'Vazirmatn', sans-serif`,
      description: fontData.description?.trim() || 'فونت سفارشی افزوده شده',
      fontUrl: fontData.fontUrl?.trim() || undefined,
      isCustom: true,
    };

    if (newFont.fontUrl) {
      injectFontLink(newFont);
    }
    const updated = [...customFonts, newFont];
    setCustomFonts(updated);
    api.saveCustomFonts(updated);
    setSystemFontState(newFont.id);
    sounds.playComplete();
  };

  const uploadCustomFont = async (file: File, name: string, family?: string, description?: string): Promise<SystemFontOption> => {
    const font = await api.uploadCustomFont(file, name, family, description);
    injectFontLink(font);
    const updated = [...customFonts.filter((f) => f.id !== font.id && f.name.toLowerCase() !== font.name.toLowerCase()), font];
    setCustomFonts(updated);
    setSystemFontState(font.id);
    sounds.playComplete();
    return font;
  };

  const deleteCustomFont = (fontId: string) => {
    const updated = customFonts.filter((f) => f.id !== fontId);
    setCustomFonts(updated);
    api.saveCustomFonts(updated);
    if (systemFont === fontId) {
      setSystemFontState('vazirmatn');
    }
    sounds.playPop();
  };

  const updateGlobalSettings = async (partial: Partial<GlobalSystemSettings>) => {
    const updated: GlobalSystemSettings = {
      ...globalSettings,
      ...partial,
      broadcastNotice: {
        ...globalSettings.broadcastNotice,
        ...(partial.broadcastNotice || {}),
        updatedAt: new Date().toISOString(),
      },
    };
    setGlobalSettings(updated);
    await api.saveGlobalSettings(updated);
    if (updated.enforcedFont) {
      setSystemFontState(updated.enforcedFont);
    }
    sounds.playComplete();
  };

  useEffect(() => {
    const found = allAvailableFonts.find((f) => f.id === systemFont) || allAvailableFonts[0] || AVAILABLE_FONTS[0];
    if (found) {
      if (found.fontUrl || found.dataUrl) {
        injectFontLink(found);
      }
      if (found.family) {
        document.documentElement.style.setProperty('--font-sans', found.family);
      }
      try {
        localStorage.setItem('taskrooz_system_font', found.id);
      } catch {}
    }
  }, [systemFont, allAvailableFonts]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('taskrooz_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      language: 'fa',
      persianDigits: true,
      soundEnabled: true,
      hapticEnabled: true,
      theme: 'light',
      viewMode: 'desktop',
    };
  });

  const [streak] = useState<DailyStreak>(() => ({
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayISO(),
  }));
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('kanban');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [selectedFilterUserId, setSelectedFilterUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  // Group Focus Room State
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || params.get('room_id') || null;
    } catch {
      return null;
    }
  });
  const [activeRoom, setActiveRoom] = useState<FocusRoom | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // New features state
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [personalityResult, setPersonalityResult] = useState<PersonalityTestResult | null>(null);
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [incompleteModalTask, setIncompleteModalTask] = useState<Task | null>(null);

  // Friends & Colleague Network state
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] }>({
    incoming: [],
    outgoing: [],
  });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState(false);
  const [viewingPublicUser, setViewingPublicUser] = useState<User | null>(null);

  // 12-Hour Offline-First Sync State
  const [isMandatorySyncDue, setIsMandatorySyncDue] = useState<boolean>(() => api.isMandatorySyncDue());
  const [remainingHoursUntilSync, setRemainingHoursUntilSync] = useState<number>(() => api.getRemainingHoursUntilMandatorySync());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Periodically check 12-hour sync requirement
  useEffect(() => {
    const checkSyncStatus = () => {
      const isDue = api.isMandatorySyncDue();
      setIsMandatorySyncDue(isDue);
      setRemainingHoursUntilSync(api.getRemainingHoursUntilMandatorySync());
      if (isDue) {
        setIsSyncModalOpen(true);
      }
    };
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  const triggerServerSync = async () => {
    await api.syncDataWithServer();
    setIsMandatorySyncDue(false);
    setRemainingHoursUntilSync(12);
    setIsSyncModalOpen(false);
    await refreshTasks();
    await refreshProjects();
    await refreshUsers();
  };

  // Sync settings with audio and light theme
  useEffect(() => {
    sounds.enabled = settings.soundEnabled;
    sounds.hapticEnabled = settings.hapticEnabled;
    
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    try {
      localStorage.setItem('taskrooz_settings', JSON.stringify({ ...settings, theme: 'light' }));
    } catch {}
  }, [settings]);

  // Periodic Task Reminder & Bale Notification Dispatcher
  const remindedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    const checkDueReminders = async () => {
      if (!currentUser) return;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const nowTimeStr = `${currentHours}:${currentMins}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      const dueTasks = tasks.filter((t) => {
        if (t.completed) return false;
        if (t.date && t.date !== todayDateStr) return false;
        if (!t.time) return false;
        if (remindedTaskIdsRef.current.has(t.id)) return false;

        return t.time === nowTimeStr;
      });

      for (const t of dueTasks) {
        remindedTaskIdsRef.current.add(t.id);
        sounds.playWarning();

        // Dispatch to Bale if user has Bale connected and enabled
        if (currentUser.baleChatId && currentUser.baleNotificationsEnabled !== false) {
          try {
            await api.testBaleNotification({
              userId: currentUser.id,
              title: `⏰ یادآوری تسک: ${t.title}`,
              message: `کاربر گرامی ${currentUser.name}، زمان انجام وظیفه «${t.title}» فرا رسیده است (ساعت ${t.time}).\nجهت ثبت گزارش و بررسی به اپلیکیشن بگ تایم مراجعه فرمایید.`,
            });
          } catch {
            // Ignore background error
          }
        }
      }
    };

    const interval = setInterval(checkDueReminders, 30000);
    return () => clearInterval(interval);
  }, [currentUser, tasks]);

  // Refresh active room data
  const refreshActiveRoom = useCallback(async () => {
    if (!activeRoomId) return;
    try {
      const room = await api.getFocusRoom(activeRoomId);
      if (room) {
        setActiveRoom(room);
      }
    } catch {
      // ignore
    }
  }, [activeRoomId]);

  // Periodic polling for active room (sync timer, participants and real-time messages every 1.5s)
  useEffect(() => {
    if (!activeRoomId) return;
    refreshActiveRoom();
    const interval = setInterval(refreshActiveRoom, 1500);
    return () => clearInterval(interval);
  }, [activeRoomId, refreshActiveRoom]);

  const joinFocusRoom = async (roomId: string): Promise<boolean> => {
    const cleanId = (roomId || '').replace(/['"]/g, '').trim().split('#')[0].split('&')[0];
    if (!cleanId) return false;
    try {
      const room = await api.joinFocusRoom(cleanId);
      setActiveRoomId(room.id);
      setActiveRoom(room);
      setActiveTab('focus');
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('room', room.id);
        window.history.replaceState(null, '', newUrl.toString());
      } catch {}
      sounds.playComplete();
      return true;
    } catch (e: any) {
      alert(e.message || 'خطا در ورود به اتاق.');
      return false;
    }
  };

  const leaveFocusRoom = async () => {
    if (activeRoomId) {
      await api.leaveFocusRoom(activeRoomId);
    }
    setActiveRoomId(null);
    setActiveRoom(null);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('room');
      newUrl.searchParams.delete('room_id');
      window.history.replaceState(null, '', newUrl.toString());
    } catch {}
    sounds.playPop();
  };

  const deleteFocusRoom = async (targetRoomId?: string) => {
    const idToDelete = targetRoomId || activeRoomId;
    if (!idToDelete) return;
    try {
      await api.deleteFocusRoom(idToDelete);
      // If we are currently inside that room, update activeRoom to reflect isDeleted
      if (activeRoom && activeRoom.id === idToDelete) {
        setActiveRoom({
          ...activeRoom,
          isDeleted: true,
          deletedAt: Math.floor(Date.now() / 1000),
          isRunning: false,
        });
      }
      sounds.playPop();
    } catch (e: any) {
      alert(e.message || 'خطا در حذف اتاق');
    }
  };

  const deleteAllFocusRooms = async (): Promise<number> => {
    const count = await api.deleteAllFocusRooms();
    // If we are currently inside a room, mark it as deleted too
    if (activeRoom) {
      setActiveRoom({
        ...activeRoom,
        isDeleted: true,
        deletedAt: Math.floor(Date.now() / 1000),
        isRunning: false,
      });
    }
    sounds.playComplete();
    return count;
  };

  const createFocusRoom = async (name: string, focusDuration = 1500, breakDuration = 300): Promise<FocusRoom> => {
    const room = await api.createFocusRoom(name, focusDuration, breakDuration);
    setActiveRoomId(room.id);
    setActiveRoom(room);
    setActiveTab('focus');
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', room.id);
      window.history.replaceState(null, '', newUrl.toString());
    } catch {}
    sounds.playComplete();
    return room;
  };

  const syncRoomTimer = async (action: 'start' | 'pause' | 'reset' | 'setMode', timeLeft?: number, mode?: string) => {
    if (!activeRoomId) return;

    // Instant optimistic update for immediate, lag-free UI responsiveness
    setActiveRoom((prev) => {
      if (!prev) return prev;
      const isRunning = action === 'start' ? true : (action === 'pause' ? false : (action === 'reset' ? false : prev.isRunning));
      const targetMode = (action === 'setMode' && mode) ? (mode as any) : prev.mode;
      const targetTime = action === 'reset'
        ? (targetMode === 'focus' ? prev.focusDuration : prev.breakDuration)
        : (timeLeft !== undefined ? timeLeft : prev.timeLeft);
      return {
        ...prev,
        isRunning,
        mode: targetMode,
        timeLeft: targetTime,
        lastUpdated: Date.now(),
      };
    });

    try {
      const updated = await api.syncFocusRoomTimer(activeRoomId, action, timeLeft, mode);
      if (updated) {
        setActiveRoom(updated);
      }
    } catch {
      // ignore
    }
  };

  const sendRoomMessage = async (text: string) => {
    if (!activeRoomId || !text.trim() || !currentUser) return;
    
    // Optimistic message append
    const tempMsg = {
      id: 'opt_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    if (activeRoom) {
      setActiveRoom({
        ...activeRoom,
        messages: [...activeRoom.messages, tempMsg],
      });
    }

    try {
      const updated = await api.sendFocusRoomMessage(activeRoomId, text);
      setActiveRoom(updated);
      sounds.playPop();
    } catch {
      // ignore
    }
  };

  // Helper to check pending room invite after auth
  const checkPendingRoomInvite = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room') || urlParams.get('room_id');
      const pendingRoom = urlRoom || sessionStorage.getItem('taskrooz_pending_room');
      if (pendingRoom) {
        sessionStorage.removeItem('taskrooz_pending_room');
        await joinFocusRoom(pendingRoom);
      }
    } catch {
      // ignore
    }
  };

  const appOperatingMode: AppOperatingMode = globalSettings?.appOperatingMode || 'commercial';
  const isDemoMode = appOperatingMode === 'community_demo';
  const curPlan = (currentUser?.subscription?.plan || '').toLowerCase();
  const isPro = isDemoMode || currentUser?.role === 'admin' || (curPlan !== '' && curPlan !== 'free');

  const setAppOperatingMode = async (mode: AppOperatingMode) => {
    await updateGlobalSettings({ appOperatingMode: mode });
    broadcastSync('SETTINGS_UPDATED', { appOperatingMode: mode });
    sounds.playComplete();
  };

  const logTaskWorkTime = async (taskId: string, minutes: number) => {
    if (!currentUser || minutes <= 0) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newLog: TaskWorkLog = {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || null,
      minutes,
      loggedAt: new Date().toISOString(),
    };

    const updatedLogs = [...(task.workLogs || []), newLog];
    const totalMinutes = (task.focusMinutesSpent || 0) + minutes;

    const updatedTask: Task = {
      ...task,
      focusMinutesSpent: totalMinutes,
      workLogs: updatedLogs,
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    await api.updateTask(updatedTask);
    broadcastSync('TASK_UPDATED', { taskId, projectId: task.projectId });
    sounds.playComplete();
  };

  const deleteMyAccount = async () => {
    if (!currentUser) return;
    if (currentUser.id === 'usr_admin_mohusyn' || (currentUser.username || '').toLowerCase() === 'mohusyn') {
      alert('حساب کاربری مدیر اصلی محافظت‌شده است و قابل حذف نیست.');
      return;
    }
    await api.deleteUser(currentUser.id, currentUser.username);
    broadcastSync('USER_DELETED', { id: currentUser.id, username: currentUser.username });
    await logout();
  };

  const approveUserRegistration = async (userId: string) => {
    await api.setUserSubscription(userId, 'pro', '3_months');
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: 'active',
              isDemo: true,
              subscription: {
                plan: 'pro',
                planType: '3_months',
                activatedAt: new Date().toISOString(),
              },
            }
          : u
      )
    );
    await refreshUsers();
    sounds.playComplete();
  };

  const refreshFriends = useCallback(async () => {
    if (!currentUser) return;
    try {
      const fList = await api.getFriends();
      setFriends(fList);
      const reqs = await api.getFriendRequests();
      setFriendRequests(reqs);
    } catch {}
  }, [currentUser]);

  const sendFriendRequest = async (toUserId: string, projectId?: string, projectName?: string) => {
    const res = await api.sendFriendRequest(toUserId, projectId, projectName);
    await refreshFriends();
    return res;
  };

  const acceptFriendRequest = async (requestId: string) => {
    const res = await api.acceptFriendRequest(requestId);
    await refreshFriends();
    await refreshProjects();
    sounds.playComplete();
    return res;
  };

  const rejectFriendRequest = async (requestId: string) => {
    const res = await api.rejectFriendRequest(requestId);
    await refreshFriends();
    return res;
  };

  const removeFriend = async (friendId: string) => {
    await api.removeFriend(friendId);
    await refreshFriends();
    sounds.playPop();
  };

  const setUserSubscription = async (
    userId: string,
    plan: 'free' | 'plus' | 'pro' | 'ultra',
    planType?: '1_month' | '3_months' | '6_months',
    expiresAt?: string
  ) => {
    // 1. Optimistic local state update immediately
    const isTargetMe = (u: User) =>
      u.id === userId || (u.username && u.username.toLowerCase() === userId.toLowerCase());

    const isPremium = plan !== 'free';

    setUsers((prev) =>
      prev.map((u) =>
        isTargetMe(u)
          ? {
              ...u,
              status: isPremium ? 'active' : u.status,
              subscription: {
                plan,
                planType: planType || (plan === 'ultra' ? '6_months' : plan === 'plus' ? '1_month' : '3_months'),
                activatedAt: new Date().toISOString(),
                expiresAt,
              },
            }
          : u
      )
    );
    if (currentUser && isTargetMe(currentUser)) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              status: isPremium ? 'active' : prev.status,
              subscription: {
                plan,
                planType: planType || (plan === 'ultra' ? '6_months' : plan === 'plus' ? '1_month' : '3_months'),
                activatedAt: new Date().toISOString(),
                expiresAt,
              },
            }
          : prev
      );
    }

    // 2. Persist to API
    await api.setUserSubscription(userId, plan, planType, expiresAt);

    // 3. Re-sync from server
    await refreshUsers();
    sounds.playComplete();
  };

  const refreshProjects = useCallback(async () => {
    try {
      const pList = await api.getTeamProjects();
      setProjects(pList);
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  }, []);

  const createTeamProject = async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    memberIds?: string[];
  }): Promise<TeamProject> => {
    if (!isPro) {
      const myProjects = projects.filter((p) => p.creatorId === currentUser?.id);
      if (myProjects.length >= 1) {
        setIsUpgradeModalOpen(true);
        sounds.playPop();
        throw new Error('در پلن رایگان فقط مجاز به ایجاد ۱ پروژه تیمی هستید. جهت ایجاد پروژه‌های نامحدود، حساب خود را به اشتراک ویژه (Pro) ارتقا دهید.');
      }
    }
    const created = await api.createTeamProject(data);
    setProjects((prev) => [created, ...prev]);
    sounds.playComplete();
    return created;
  };

  const updateTeamProject = async (id: string, updates: Partial<TeamProject>) => {
    await api.updateTeamProject(id, updates);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    sounds.playPop();
    refreshTasks();
  };

  const deleteTeamProject = async (id: string) => {
    await api.deleteTeamProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    sounds.playPop();
    refreshTasks();
  };

  // Load initial data (Fast, Offline-first, Parallelized)
  useEffect(() => {
    async function init() {
      // If we don't have a cached user, show brief loading while checking token
      if (!api.getCachedUser() && api.getAuthToken()) {
        setIsLoading(true);
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteRoom = urlParams.get('room') || urlParams.get('room_id');
        if (inviteRoom) {
          sessionStorage.setItem('taskrooz_pending_room', inviteRoom);
        }

        // Fast user verification
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (inviteRoom) {
            sessionStorage.removeItem('taskrooz_pending_room');
            joinFocusRoom(inviteRoom).catch(() => {});
          }
        }
      } catch (e) {
        console.error('Initialization user check error:', e);
      } finally {
        // Drop the loading screen immediately so the app is accessible instantly!
        setIsLoading(false);
      }

      // Concurrently load all other data in PARALLEL in background
      Promise.allSettled([
        api.getCategories().then((cats) => setCategories(cats)),
        refreshProjects(),
        api.getGoals().then((gList) => setGoals(gList)),
        api.getPersonalityResult().then((pRes) => setPersonalityResult(pRes)),
        api.getDailyNotes().then((notes) => setDailyNotes(notes)),
        api.getGlobalSettings().then((gSettings) => {
          setGlobalSettings(gSettings);
          if (gSettings.enforcedFont) {
            setSystemFontState(gSettings.enforcedFont);
          }
        }),
        api.fetchCustomFonts().then((remoteFonts) => {
          setCustomFonts(remoteFonts);
          remoteFonts.forEach(injectFontLink);
        }),
      ]);
    }
    init();
  }, []);

  const refreshGoals = useCallback(async () => {
    try {
      const gList = await api.getGoals();
      setGoals(gList);
    } catch (e) {
      console.error('Error fetching goals:', e);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const filter: { userId?: string | null; projectId?: string | null } = {};
      if (selectedFilterUserId) {
        filter.userId = selectedFilterUserId;
      }
      if (selectedProjectId) {
        filter.projectId = selectedProjectId;
      }
      const fetched = await api.getTasks(filter);
      setTasks(fetched);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  }, [selectedFilterUserId, selectedProjectId]);

  const refreshUsers = useCallback(async () => {
    if (currentUser) {
      try {
        const uList = await api.getUsers();
        setUsers(uList);

        // Keep currentUser strictly synchronized with their directory record
        const selfInList = uList.find(
          (u) =>
            u.id === currentUser.id ||
            (u.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
        );
        if (selfInList) {
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const subChanged =
              prev.subscription?.plan !== selfInList.subscription?.plan ||
              prev.subscription?.planType !== selfInList.subscription?.planType ||
              prev.subscription?.expiresAt !== selfInList.subscription?.expiresAt;
            const statusChanged = prev.status !== selfInList.status;
            const isDemoChanged = prev.isDemo !== selfInList.isDemo;
            const roleChanged = prev.role !== selfInList.role;

            if (subChanged || statusChanged || isDemoChanged || roleChanged) {
              return {
                ...prev,
                ...selfInList,
                subscription: selfInList.subscription || prev.subscription,
              };
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    }
  }, [currentUser]);

  // Real-time synchronization: BroadcastChannel + periodic polling
  useEffect(() => {
    const unsubscribe = onSyncEvent((event, payload) => {
      if (event === 'USER_REGISTERED' || event === 'USER_UPDATED') {
        refreshUsers();
        api.getCurrentUser().then((me) => {
          if (me) setCurrentUser(me);
        }).catch(() => {});
      } else if (event === 'USER_DELETED') {
        // Cross-tab: purge local mirror and refresh so deleted users never resurrect
        const deletedId = (payload as any)?.id as string | undefined;
        const deletedUsername = (payload as any)?.username as string | undefined;
        if (deletedId) {
          api.removeLocalUserMirror(deletedId, deletedUsername);
        }
        refreshUsers();
      } else if (event === 'TASK_UPDATED' || event === 'TASK_CREATED' || event === 'TASK_DELETED' || event === 'PROJECT_SYNC') {
        refreshTasks();
        refreshProjects();
      } else if (event === 'SETTINGS_UPDATED') {
        api.getGlobalSettings().then(setGlobalSettings).catch(() => {});
        refreshUsers();
      } else if (event === 'ROOM_SYNC') {
        refreshActiveRoom();
      }
    });

    // Background polling for users directory & subscription changes (every 30s when tab is visible)
    let userPoll: any = null;
    if (currentUser) {
      userPoll = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        refreshUsers();
      }, 30000);
    }

    // Background sync for team project tasks and live progress (every 15 seconds when tab is visible)
    let taskPoll: any = null;
    if (currentUser) {
      taskPoll = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        refreshTasks();
        refreshProjects();
      }, 15000);
    }

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden && currentUser) {
        refreshTasks();
        refreshProjects();
        refreshUsers();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      unsubscribe();
      if (userPoll) clearInterval(userPoll);
      if (taskPoll) clearInterval(taskPoll);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [currentUser, refreshUsers, refreshTasks, refreshProjects, refreshActiveRoom]);

  useEffect(() => {
    if (currentUser) {
      refreshTasks();
      refreshUsers();
      refreshProjects();
      refreshGoals();
      refreshFriends();

      const localCompleted = typeof window !== 'undefined' && localStorage.getItem('taskrooz_user_profile_completed_' + currentUser.id) === 'true';
      const hasCoreInfo = Boolean(currentUser.birthDate && currentUser.city && currentUser.jobTitle);
      const isAlreadyCompleted = currentUser.role === 'admin' || currentUser.isProfileCompleted === true || localCompleted || hasCoreInfo;

      if (!isAlreadyCompleted) {
        setIsFirstLoginModalOpen(true);
      } else {
        setIsFirstLoginModalOpen(false);
      }
    }
  }, [currentUser, refreshTasks, refreshUsers, refreshProjects, refreshGoals, refreshFriends]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      setCurrentUser(res.user);
      if (res.user) {
        try {
          const uList = await api.getUsers();
          setUsers(uList);
        } catch {}
      }
      sounds.playComplete();
      await checkPendingRoomInvite();
      return true;
    } catch (e: any) {
      throw e;
    }
  };

  const register = async (data: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    birthDate?: string;
    jobTitle?: string;
    skills?: string[];
    dailyTimeline?: UserTimeline;
  }): Promise<any> => {
    try {
      const res: any = await api.register(data);
      if (res.requiresVerification) {
        return res;
      }
      const userObj = { ...res.user, isProfileCompleted: true };
      setCurrentUser(userObj);
      try {
        localStorage.setItem('taskrooz_user_profile_completed_' + res.user.id, 'true');
      } catch {}
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.username.toLowerCase() !== res.user.username.toLowerCase());
        return [...filtered, userObj];
      });
      try {
        localStorage.setItem('taskrooz_sync_signal', String(Date.now()));
      } catch {}
      sounds.playComplete();
      await checkPendingRoomInvite();
      return res;
    } catch (e: any) {
      throw e;
    }
  };

  const completeBaleVerification = (user: User) => {
    const userObj = { ...user, isProfileCompleted: true };
    setCurrentUser(userObj);
    try {
      localStorage.setItem('taskrooz_user_profile_completed_' + user.id, 'true');
    } catch {}
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.username.toLowerCase() !== user.username.toLowerCase());
      return [...filtered, userObj];
    });
    sounds.playComplete();
  };

  const addGoal = async (data: Omit<CareerGoal, 'id' | 'createdAt' | 'userId'>): Promise<CareerGoal> => {
    const created = await api.createGoal(data);
    setGoals((prev) => [created, ...prev]);
    sounds.playComplete();
    return created;
  };

  const updateGoal = async (id: string, updates: Partial<CareerGoal>) => {
    await api.updateGoal(id, updates);
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    sounds.playPop();
  };

  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    sounds.playPop();
  };

  const savePersonalityResult = async (result: PersonalityTestResult) => {
    await api.savePersonalityResult(result);
    setPersonalityResult(result);
    sounds.playComplete();
  };

  const saveDailyNote = async (date: string, content: string) => {
    await api.saveDailyNote(date, content);
    setDailyNotes((prev) => ({ ...prev, [date]: content }));
    sounds.playPop();
  };

  const updateUserTimeline = async (timeline: UserTimeline) => {
    if (!currentUser) return;
    const updated = { ...currentUser, dailyTimeline: timeline };
    setCurrentUser(updated);
    sounds.playPop();
    // Persist to server (self profile update)
    try {
      await api.updateMyProfile({ id: currentUser.id, dailyTimeline: timeline as Record<string, string> });
    } catch {
      // offline — local state already updated
    }
  };

  const openIncompleteModal = (task: Task) => {
    setIncompleteModalTask(task);
  };

  const closeIncompleteModal = () => {
    setIncompleteModalTask(null);
  };

  const setTaskIncompleteReason = async (taskId: string, category: UncompletedCategory, reason: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    const updated: Task = {
      ...t,
      completed: false,
      uncompletedCategory: category,
      reasonUncompleted: reason,
      uncompletedAt: new Date().toISOString(),
    };
    await updateTask(updated);
    sounds.playPop();
    closeIncompleteModal();
  };

  const exportUsersCsv = (ids?: string[]) => {
    const list = ids && ids.length > 0 ? users.filter((u) => ids.includes(u.id)) : users;
    api.exportUsersCsv(list);
    sounds.playComplete();
  };

  const logout = async () => {
    await api.logout();
    setCurrentUser(null);
    setTasks([]);
    sounds.playPop();
  };

  const createUser = async (data: {
    username: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    jobTitle?: string;
    skills?: string[];
  }) => {
    const newUser = await api.createUser(data);
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== newUser.id && u.username.toLowerCase() !== newUser.username.toLowerCase());
      return [...filtered, newUser];
    });
    await refreshUsers();
    sounds.playComplete();
    return newUser;
  };

  const updateUser = async (data: { id: string; name: string; role: 'admin' | 'user'; password?: string }) => {
    await api.updateUser(data);
    await refreshUsers();
    sounds.playPop();
  };

  /** Self-service profile update (avatar, contact info, routine, password) */
  const updateMyProfile = async (data: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    birthDate?: string;
    jobTitle?: string;
    skills?: string[];
    bio?: string;
    coverImage?: string;
    isProfileCompleted?: boolean;
    dailyTimeline?: Record<string, string>;
    avatar?: string | null;
    password?: string;
    baleChatId?: string | number;
    baleUsername?: string;
    baleNotifToken?: string;
    baleNotificationsEnabled?: boolean;
  }) => {
    const updated = await api.updateMyProfile(data);
    // Merge returned fields into the current user (only fields that were sent)
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, isProfileCompleted: true };
      for (const k of Object.keys(updated) as (keyof typeof updated)[]) {
        if (updated[k] !== null && updated[k] !== undefined && updated[k] !== '') {
          (merged as any)[k] = updated[k];
        } else if ((k === 'avatar' && data.avatar === null) || (k === 'avatar' && data.avatar === '')) {
          delete (merged as any).avatar;
        }
      }
      merged.isProfileCompleted = true;
      try {
        localStorage.setItem('taskrooz_user_profile_completed_' + prev.id, 'true');
      } catch {}
      return merged;
    });
    await refreshUsers();
    sounds.playComplete();
  };

  /** Admin-editable app text with fallback to the built-in default */
  const getText = useCallback(
    (key: string) => {
      const custom = globalSettings.texts?.[key];
      if (typeof custom === 'string' && custom.trim() !== '') return custom;
      return DEFAULT_APP_TEXTS[key] ?? key;
    },
    [globalSettings.texts]
  );

  const deleteUser = async (id: string, username?: string) => {
    await api.deleteUser(id, username);
    // Immediate optimistic removal so the list updates instantly
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await refreshUsers();
    await refreshTasks();
    sounds.playComplete();
  };

  /** Bulk deletion of many users (admin) — one server call, protected accounts skipped */
  const deleteUsersBulk = async (ids: string[]) => {
    const result = await api.deleteUsersBulk(ids);
    const deletedSet = new Set(result.deleted || []);
    setUsers((prev) => prev.filter((u) => !deletedSet.has(u.id)));
    // Purge local mirrors so deleted users can never resurrect
    (result.deleted || []).forEach((id) => api.removeLocalUserMirror(id));
    await refreshUsers();
    await refreshTasks();
    sounds.playComplete();
    return result;
  };

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch {
      // ignore
    }
  }, []);

  const addTask = async (taskData: TaskCreateInput): Promise<Task> => {
    if (!isPro) {
      const activeTasksCount = tasks.filter((t) => t.userId === currentUser?.id && !t.completed).length;
      if (activeTasksCount >= 5) {
        setIsUpgradeModalOpen(true);
        sounds.playPop();
        throw new Error('سقف تسک‌های فعال در پلن رایگان ۵ عدد است. لطفاً جهت ثبت تسک‌های بیشتر، حساب خود را به نسخه ویژه (Pro) ارتقا دهید.');
      }
    }
    const created = await api.createTask({
      ...taskData,
      userId: taskData.userId || currentUser?.id || 'usr_admin_1',
    });
    setTasks((prev) => [created, ...prev]);
    sounds.playPop();
    broadcastSync('TASK_CREATED', { taskId: created.id, projectId: created.projectId });
    refreshUsers();
    refreshProjects();
    return created;
  };

  const updateTask = async (updatedTask: Task) => {
    await api.updateTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    sounds.playPop();
    broadcastSync('TASK_UPDATED', { taskId: updatedTask.id, projectId: updatedTask.projectId });
    refreshUsers();
    refreshProjects();
  };

  const deleteTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeFocusTaskId === id) {
      setActiveFocusTaskId(null);
    }
    sounds.playPop();
    broadcastSync('TASK_DELETED', { taskId: id, projectId: target?.projectId });
    refreshUsers();
    refreshProjects();
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = !task.completed;
    if (newStatus) {
      sounds.playComplete();
      triggerConfetti();
    } else {
      sounds.playPop();
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: newStatus,
              completedAt: newStatus ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    await api.toggleTask(id);
    broadcastSync('TASK_UPDATED', { taskId: id, projectId: task.projectId });
    refreshUsers();
    refreshProjects();
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
    if (allCompleted && !task.completed) {
      sounds.playComplete();
      triggerConfetti();
    } else {
      sounds.playPop();
    }

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      completed: allCompleted ? true : task.completed,
      completedAt: allCompleted ? new Date().toISOString() : task.completedAt,
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    await api.updateTask(updatedTask);
    refreshUsers();
    refreshProjects();
  };

  const togglePin = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, isPinned: !task.isPinned };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    sounds.playPop();
    await api.updateTask(updatedTask);
  };

  const addFocusMinutes = async (taskId: string, minutes: number) => {
    await api.addFocusMinutes(taskId, minutes);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, focusMinutesSpent: (t.focusMinutesSpent || 0) + minutes }
          : t
      )
    );
  };

  const openCreateModal = (defaultDate?: string, defaultUserId?: string, defaultProjectId?: string) => {
    if (defaultDate) setSelectedDate(defaultDate);
    if (defaultUserId) setSelectedFilterUserId(defaultUserId);
    if (defaultProjectId) setSelectedProjectId(defaultProjectId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const addCategory = async (catData: { name: string; color: string; icon: string }): Promise<Category> => {
    const newCat = await api.createCategory(catData);
    setCategories((prev) => [...prev, newCat]);
    sounds.playPop();
    return newCat;
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const getDailySummaryText = useCallback((): string => {
    const today = getTodayISO();
    const todayTasks = tasks.filter((t) => t.date === today);
    const completed = todayTasks.filter((t) => t.completed);
    const pending = todayTasks.filter((t) => !t.completed);

    const dateFormatted = formatPersianDate(today, 'full');
    
    let text = `📋 گزارش تسک‌های روزانه - ${dateFormatted}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🎯 پیشرفت کلی: ${toPersianDigits(completed.length)} از ${toPersianDigits(todayTasks.length)} تسک (${todayTasks.length ? toPersianDigits(Math.round((completed.length / todayTasks.length) * 100)) : '۰'}٪)\n\n`;

    if (completed.length > 0) {
      text += `✅ کارهای انجام‌شده:\n`;
      completed.forEach((t) => {
        text += `• ${t.title}${t.time ? ` (ساعت ${toPersianDigits(t.time)})` : ''}\n`;
      });
      text += `\n`;
    }

    if (pending.length > 0) {
      text += `⏳ کارهای در حال انتظار:\n`;
      pending.forEach((t) => {
        const priorityLabel = t.priority === 'high' ? '🔥 فوری' : t.priority === 'medium' ? '⚡ مهم' : ' معمولی';
        text += `• ${t.title} [${priorityLabel}]${t.time ? ` (ساعت ${toPersianDigits(t.time)})` : ''}\n`;
      });
    }

    text += `\n✨ ارسال شده از تسک‌روز (مدیریت کارهای روزانه)`;
    return text;
  }, [tasks]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      tasks,
      categories,
      projects,
      selectedProjectId,
      setSelectedProjectId,
      createTeamProject,
      updateTeamProject,
      deleteTeamProject,
      refreshProjects,
      settings,
      streak,
      selectedDate,
      activeTab,
      taskViewMode,
      filterStatus,
      filterCategory,
      selectedFilterUserId,
      searchQuery,
      activeFocusTaskId,
      isTaskModalOpen,
      editingTask,
      isShareModalOpen,
      isLoading,
      login,
      register,
      logout,
      createUser,
      updateUser,
      updateMyProfile,
      deleteUser,
      deleteUsersBulk,
      refreshUsers,
      setSelectedDate,
      setActiveTab,
      setTaskViewMode,
      setFilterStatus,
      setFilterCategory,
      setSelectedFilterUserId,
      setSearchQuery,
      setActiveFocusTaskId,
      setIsShareModalOpen,
      activeRoomId,
      activeRoom,
      joinFocusRoom,
      leaveFocusRoom,
      deleteFocusRoom,
      deleteAllFocusRooms,
      createFocusRoom,
      syncRoomTimer,
      sendRoomMessage,
      refreshActiveRoom,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      toggleSubtask,
      togglePin,
      addFocusMinutes,
      refreshTasks,
      openCreateModal,
      openEditModal,
      closeTaskModal,
      addCategory,
      updateSettings,
      systemFont,
      setSystemFont,
      getDailySummaryText,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      personalityResult,
      savePersonalityResult,
      updateUserTimeline,
      dailyNotes,
      saveDailyNote,
      incompleteModalTask,
      openIncompleteModal,
      closeIncompleteModal,
      setTaskIncompleteReason,
      exportUsersCsv,
      globalSettings,
      updateGlobalSettings,
      getText,
      allAvailableFonts,
      customFonts,
      addCustomFont,
      uploadCustomFont,
      deleteCustomFont,
      // Friends & Colleague Network
      friends,
      friendRequests,
      refreshFriends,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      // Subscription & Public Profile
      isPro,
      setUserSubscription,
      isUpgradeModalOpen,
      setIsUpgradeModalOpen,
      isFirstLoginModalOpen,
      setIsFirstLoginModalOpen,
      viewingPublicUser,
      setViewingPublicUser,
      // Operating Mode & Work Logger
      isDemoMode,
      appOperatingMode,
      setAppOperatingMode,
      logTaskWorkTime,
      deleteMyAccount,
      approveUserRegistration,
      // Auth & User Actions
      completeBaleVerification,
      // 12-Hour Offline-First Sync
      isMandatorySyncDue,
      remainingHoursUntilSync,
      triggerServerSync,
      isSyncModalOpen,
      setIsSyncModalOpen,
    }),
    [
      currentUser,
      users,
      tasks,
      categories,
      projects,
      selectedProjectId,
      settings,
      systemFont,
      streak,
      selectedDate,
      activeTab,
      taskViewMode,
      filterStatus,
      filterCategory,
      selectedFilterUserId,
      searchQuery,
      activeFocusTaskId,
      isTaskModalOpen,
      editingTask,
      isShareModalOpen,
      isLoading,
      activeRoomId,
      activeRoom,
      refreshActiveRoom,
      getDailySummaryText,
      refreshProjects,
      goals,
      personalityResult,
      dailyNotes,
      incompleteModalTask,
      globalSettings,
      allAvailableFonts,
      customFonts,
      friends,
      friendRequests,
      refreshFriends,
      isPro,
      isUpgradeModalOpen,
      isFirstLoginModalOpen,
      viewingPublicUser,
      isDemoMode,
      appOperatingMode,
      isMandatorySyncDue,
      remainingHoursUntilSync,
      isSyncModalOpen,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
