import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, Category, AppSettings, DailyStreak, TabType, FilterStatus, User, TaskViewMode, TaskCreateInput } from '../types';
import { api } from '../services/api';
import { getTodayISO, formatPersianDate, toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';

interface TaskContextType {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  categories: Category[];
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
  openCreateModal: (defaultDate?: string, defaultUserId?: string) => void;
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

  // Load initial data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
        // Do NOT auto-login: default to login screen if not authenticated

        const cats = await api.getCategories();
        setCategories(cats);
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
      const filter: { userId?: string | null } = {};
      if (selectedFilterUserId) {
        filter.userId = selectedFilterUserId;
      }
      const fetched = await api.getTasks(filter);
      setTasks(fetched);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  }, [selectedFilterUserId]);

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
    }
  }, [currentUser, refreshTasks, refreshUsers]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      setCurrentUser(res.user);
      sounds.playComplete();
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
    return created;
  };

  const updateTask = async (updatedTask: Task) => {
    await api.updateTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    sounds.playPop();
    refreshUsers();
  };

  const deleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeFocusTaskId === id) {
      setActiveFocusTaskId(null);
    }
    sounds.playPop();
    refreshUsers();
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

  const openCreateModal = (defaultDate?: string, defaultUserId?: string) => {
    if (defaultDate) setSelectedDate(defaultDate);
    if (defaultUserId) setSelectedFilterUserId(defaultUserId);
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
      refreshTasks,
      refreshUsers,
      getDailySummaryText,
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
