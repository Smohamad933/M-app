import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, Category, AppSettings, DailyStreak, TabType, FilterStatus } from '../types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadStreakFromStorage,
  saveStreakToStorage,
  getSampleTasks,
  DEFAULT_CATEGORIES,
} from '../utils/storage';
import { getTodayISO, formatPersianDate, toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';

interface TaskContextType {
  tasks: Task[];
  categories: Category[];
  settings: AppSettings;
  streak: DailyStreak;
  selectedDate: string;
  activeTab: TabType;
  filterStatus: FilterStatus;
  filterCategory: string | null;
  searchQuery: string;
  activeFocusTaskId: string | null;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  isShareModalOpen: boolean;
  isQuickAddOpen: boolean;
  
  // Actions
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: TabType) => void;
  setFilterStatus: (filter: FilterStatus) => void;
  setFilterCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFocusTaskId: (id: string | null) => void;
  setIsQuickAddOpen: (open: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  
  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  togglePin: (taskId: string) => void;
  addFocusMinutes: (taskId: string, minutes: number) => void;
  
  // Modal controllers
  openCreateModal: (defaultDate?: string) => void;
  openEditModal: (task: Task) => void;
  closeTaskModal: () => void;
  
  // Category management
  addCategory: (category: Omit<Category, 'id'>) => Category;
  deleteCategory: (id: string) => void;
  
  // Settings & Storage
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetToSampleData: () => void;
  importTasksJSON: (jsonStr: string) => boolean;
  getDailySummaryText: () => string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage);
  const [categories, setCategories] = useState<Category[]>(loadCategoriesFromStorage);
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage);
  const [streak, setStreak] = useState<DailyStreak>(loadStreakFromStorage);
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Sync settings with audio module
  useEffect(() => {
    sounds.enabled = settings.soundEnabled;
    sounds.hapticEnabled = settings.hapticEnabled;
    
    // Apply dark class to html document
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Save changes to storage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveCategoriesToStorage(categories);
  }, [categories]);

  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  useEffect(() => {
    saveStreakToStorage(streak);
  }, [streak]);

  // Streak verification on task completion
  const checkDailyStreak = useCallback((completedDate: string) => {
    const today = getTodayISO();
    if (completedDate !== today) return;

    setStreak((prev) => {
      if (prev.lastActiveDate === today) {
        return prev;
      }
      
      const lastDate = new Date(prev.lastActiveDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = prev.currentStreak;
      if (diffDays <= 2) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      return {
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, prev.bestStreak),
        lastActiveDate: today,
      };
    });
  }, []);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      subtasks: taskData.subtasks || [],
    };
    setTasks((prev) => [newTask, ...prev]);
    sounds.playPop();
    return newTask;
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    sounds.playPop();
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeFocusTaskId === id) {
      setActiveFocusTaskId(null);
    }
    sounds.playPop();
  }, [activeFocusTaskId]);

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const newStatus = !task.completed;
          if (newStatus) {
            sounds.playComplete();
            triggerConfetti();
            checkDailyStreak(task.date);
          } else {
            sounds.playPop();
          }
          return {
            ...task,
            completed: newStatus,
            completedAt: newStatus ? new Date().toISOString() : undefined,
          };
        }
        return task;
      })
    );
  }, [checkDailyStreak, triggerConfetti]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
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

          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allCompleted ? true : task.completed,
            completedAt: allCompleted ? new Date().toISOString() : task.completedAt,
          };
        }
        return task;
      })
    );
  }, [triggerConfetti]);

  const togglePin = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isPinned: !t.isPinned } : t))
    );
    sounds.playPop();
  }, []);

  const addFocusMinutes = useCallback((taskId: string, minutes: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, focusMinutesSpent: (t.focusMinutesSpent || 0) + minutes }
          : t
      )
    );
  }, []);

  const openCreateModal = useCallback((defaultDate?: string) => {
    if (defaultDate) {
      setSelectedDate(defaultDate);
    }
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  const addCategory = useCallback((catData: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...catData,
      id: 'cat_' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
    sounds.playPop();
    return newCat;
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (filterCategory === id) {
      setFilterCategory(null);
    }
  }, [filterCategory]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetToSampleData = useCallback(() => {
    const samples = getSampleTasks();
    setTasks(samples);
    setCategories(DEFAULT_CATEGORIES);
    setStreak({
      currentStreak: 4,
      bestStreak: 12,
      lastActiveDate: getTodayISO(),
    });
    setSelectedDate(getTodayISO());
    sounds.playPop();
  }, []);

  const importTasksJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        setTasks(parsed);
        sounds.playPop();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }, []);

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

    text += `\n✨ ارسال شده از تسک‌روز (اپلیکیشن مدیریت کارهای روزانه)`;
    return text;
  }, [tasks]);

  const value = useMemo(
    () => ({
      tasks,
      categories,
      settings,
      streak,
      selectedDate,
      activeTab,
      filterStatus,
      filterCategory,
      searchQuery,
      activeFocusTaskId,
      isTaskModalOpen,
      editingTask,
      isShareModalOpen,
      isQuickAddOpen,
      setSelectedDate,
      setActiveTab,
      setFilterStatus,
      setFilterCategory,
      setSearchQuery,
      setActiveFocusTaskId,
      setIsQuickAddOpen,
      setIsShareModalOpen,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      toggleSubtask,
      togglePin,
      addFocusMinutes,
      openCreateModal,
      openEditModal,
      closeTaskModal,
      addCategory,
      deleteCategory,
      updateSettings,
      resetToSampleData,
      importTasksJSON,
      getDailySummaryText,
    }),
    [
      tasks,
      categories,
      settings,
      streak,
      selectedDate,
      activeTab,
      filterStatus,
      filterCategory,
      searchQuery,
      activeFocusTaskId,
      isTaskModalOpen,
      editingTask,
      isShareModalOpen,
      isQuickAddOpen,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
      toggleSubtask,
      togglePin,
      addFocusMinutes,
      openCreateModal,
      openEditModal,
      closeTaskModal,
      addCategory,
      deleteCategory,
      updateSettings,
      resetToSampleData,
      importTasksJSON,
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
