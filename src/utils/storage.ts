import type { Task, Category, AppSettings, DailyStreak } from '../types';
import { getTodayISO } from './persianDate';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'کاری و شغلی', color: '#6366f1', icon: 'Briefcase', isDefault: true },
  { id: 'cat-personal', name: 'کارهای شخصی', color: '#10b981', icon: 'User', isDefault: true },
  { id: 'cat-study', name: 'مطالعه و یادگیری', color: '#f59e0b', icon: 'BookOpen', isDefault: true },
  { id: 'cat-health', name: 'ورزش و سلامتی', color: '#f43f5e', icon: 'Activity', isDefault: true },
  { id: 'cat-shopping', name: 'خرید و منزل', color: '#0ea5e9', icon: 'ShoppingCart', isDefault: true },
  { id: 'cat-finance', name: 'امور مالی', color: '#8b5cf6', icon: 'CreditCard', isDefault: true },
];

export function getSampleTasks(): Task[] {
  // Clean slate - zero sample tasks as requested!
  return [];
}

const STORAGE_KEYS = {
  TASKS: 'task_app_tasks_v2',
  CATEGORIES: 'task_app_categories_v2',
  SETTINGS: 'task_app_settings_v2',
  STREAK: 'task_app_streak_v2',
};

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return [];
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

export function loadCategoriesFromStorage(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading categories:', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesToStorage(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  const defaultSettings: AppSettings = {
    language: 'fa',
    persianDigits: true,
    soundEnabled: true,
    hapticEnabled: true,
    theme: 'dark',
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return defaultSettings;
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function loadStreakFromStorage(): DailyStreak {
  const defaultStreak: DailyStreak = {
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayISO(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading streak:', e);
  }
  return defaultStreak;
}

export function saveStreakToStorage(streak: DailyStreak): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
  } catch (e) {
    console.error('Error saving streak:', e);
  }
}
