import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
} from '../types';
import { api } from '../services/api';
import { getTodayISO, formatPersianDate, toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
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
  register: (data: { username: string; password: string; name: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (data: { username: string; password: string; name: string; role: 'admin' | 'user' }) => Promise<User>;
  updateUser: (data: { id: string; name: string; role: 'admin' | 'user'; password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;

  // Group Focus Rooms (Pomodoro Rooms)
  activeRoomId: string | null;
  activeRoom: FocusRoom | null;
  joinFocusRoom: (roomId: string) => Promise<boolean>;
  leaveFocusRoom: () => Promise<void>;
  deleteFocusRoom: (roomId?: string) => Promise<void>;
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
  
  // Settings
  updateSettings: (partial: Partial<AppSettings>) => void;
  getDailySummaryText: () => string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>(() => ({
    language: 'fa',
    persianDigits: true,
    soundEnabled: true,
    hapticEnabled: true,
    theme: 'dark',
    viewMode: 'desktop',
  }));

  const [streak] = useState<DailyStreak>(() => ({
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayISO(),
  }));
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('list');
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

  // Sync settings with audio and theme
  useEffect(() => {
    sounds.enabled = settings.soundEnabled;
    sounds.hapticEnabled = settings.hapticEnabled;
    
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

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
    try {
      const room = await api.joinFocusRoom(roomId);
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
    try {
      const updated = await api.syncFocusRoomTimer(activeRoomId, action, timeLeft, mode);
      setActiveRoom(updated);
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

  // Load initial data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteRoom = urlParams.get('room') || urlParams.get('room_id');
        if (inviteRoom) {
          sessionStorage.setItem('taskrooz_pending_room', inviteRoom);
        }

        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (inviteRoom) {
            sessionStorage.removeItem('taskrooz_pending_room');
            await joinFocusRoom(inviteRoom);
          }
        }

        const cats = await api.getCategories();
        setCategories(cats);
        await refreshProjects();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
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
    if (currentUser?.role === 'admin') {
      try {
        const uList = await api.getUsers();
        setUsers(uList);
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshTasks();
      refreshUsers();
      refreshProjects();
    }
  }, [currentUser, refreshTasks, refreshUsers, refreshProjects]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      setCurrentUser(res.user);
      sounds.playComplete();
      await checkPendingRoomInvite();
      return true;
    } catch (e: any) {
      throw e;
    }
  };

  const register = async (data: { username: string; password: string; name: string }): Promise<boolean> => {
    try {
      const res = await api.register(data);
      setCurrentUser(res.user);
      sounds.playComplete();
      await checkPendingRoomInvite();
      return true;
    } catch (e: any) {
      throw e;
    }
  };

  const logout = async () => {
    await api.logout();
    setCurrentUser(null);
    setTasks([]);
    sounds.playPop();
  };

  const createUser = async (data: { username: string; password: string; name: string; role: 'admin' | 'user' }) => {
    const newUser = await api.createUser(data);
    await refreshUsers();
    sounds.playComplete();
    return newUser;
  };

  const updateUser = async (data: { id: string; name: string; role: 'admin' | 'user'; password?: string }) => {
    await api.updateUser(data);
    await refreshUsers();
    sounds.playPop();
  };

  const deleteUser = async (id: string) => {
    await api.deleteUser(id);
    await refreshUsers();
    await refreshTasks();
    sounds.playPop();
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
    const created = await api.createTask({
      ...taskData,
      userId: taskData.userId || currentUser?.id || 'usr_admin_1',
    });
    setTasks((prev) => [created, ...prev]);
    sounds.playPop();
    refreshUsers();
    refreshProjects();
    return created;
  };

  const updateTask = async (updatedTask: Task) => {
    await api.updateTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    sounds.playPop();
    refreshUsers();
    refreshProjects();
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeFocusTaskId === id) {
      setActiveFocusTaskId(null);
    }
    sounds.playPop();
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
      deleteUser,
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
      getDailySummaryText,
    }),
    [
      currentUser,
      users,
      tasks,
      categories,
      projects,
      selectedProjectId,
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
      activeRoomId,
      activeRoom,
      refreshActiveRoom,
      getDailySummaryText,
      refreshProjects,
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
