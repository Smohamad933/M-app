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
  const today = getTodayISO();
  const d = new Date();
  
  // Tomorrow
  const tomorrowDate = new Date(d);
  tomorrowDate.setDate(d.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'task-1',
      title: 'بررسی ایمیل‌ها و برنامه‌ریزی هفتگی',
      description: 'اولویت‌بندی پیام‌های دریافتی، بررسی تقویم قرارها و آماده‌سازی تسک‌های کلیدی',
      date: today,
      time: '08:30',
      durationMinutes: 30,
      completed: true,
      completedAt: new Date().toISOString(),
      priority: 'high',
      categoryId: 'cat-work',
      isPinned: true,
      subtasks: [
        { id: 'sub-1-1', title: 'مرور صندوق ورودی جیمیل', completed: true },
        { id: 'sub-1-2', title: 'پاسخ به تیکت‌های پشتیبانی', completed: true },
        { id: 'sub-1-3', title: 'به‌روزرسانی بورد پروژه', completed: true },
      ],
      focusMinutesSpent: 25,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'طراحی ساختار جدید داشبورد اپلیکیشن',
      description: 'طراحی پروتوتایپ کامپوننت‌های تسک‌ها، کارت پیشرفت روزانه و نویگیشن موبایل',
      date: today,
      time: '10:00',
      durationMinutes: 90,
      completed: false,
      priority: 'high',
      categoryId: 'cat-work',
      isPinned: true,
      subtasks: [
        { id: 'sub-2-1', title: 'طراحی رابط کاربری ریسپانسیو', completed: true },
        { id: 'sub-2-2', title: 'پیاده‌سازی تایمر پومودورو', completed: false },
        { id: 'sub-2-3', title: 'تست تعامل در موبایل', completed: false },
      ],
      focusMinutesSpent: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'ورزش عصرگاهی و پیاده‌روی سریع',
      description: 'حداقل ۳۰ دقیقه دویدن یا نرمش هوازی در پارک یا باشگاه',
      date: today,
      time: '17:30',
      durationMinutes: 45,
      completed: false,
      priority: 'medium',
      categoryId: 'cat-health',
      subtasks: [
        { id: 'sub-3-1', title: '۱۰ دقیقه گرم کردن', completed: false },
        { id: 'sub-3-2', title: '۲۵ دقیقه دویدن', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'مطالعه فصل چهارم کتاب «عادت‌های اتمی»',
      description: 'یادداشت‌برداری نکات کلیدی در مورد شکل‌گیری سیستم‌های روزانه موفق',
      date: today,
      time: '21:00',
      durationMinutes: 40,
      completed: false,
      priority: 'low',
      categoryId: 'cat-study',
      subtasks: [
        { id: 'sub-4-1', title: 'خواندن ۲۵ صفحه', completed: false },
        { id: 'sub-4-2', title: 'خلاصه‌نویسی در دفترچه', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'خرید هفتگی میوه و اقلام سوپرمارکت',
      description: 'خرید شیر، نان جو، قهوه، میوه و سبزیجات تازه',
      date: tomorrow,
      time: '11:00',
      durationMinutes: 60,
      completed: false,
      priority: 'medium',
      categoryId: 'cat-shopping',
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-6',
      title: 'بررسی هزینه‌های ماهانه و بودجه‌بندی',
      description: 'تطبیق تراکنش‌های بانکی، پرداخت قبوض و اختصاص پس‌انداز ماه',
      date: tomorrow,
      time: '19:00',
      durationMinutes: 45,
      completed: false,
      priority: 'medium',
      categoryId: 'cat-finance',
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

const STORAGE_KEYS = {
  TASKS: 'task_app_tasks_v1',
  CATEGORIES: 'task_app_categories_v1',
  SETTINGS: 'task_app_settings_v1',
  STREAK: 'task_app_streak_v1',
  FOCUS_STATS: 'task_app_focus_v1',
};

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return getSampleTasks();
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
    viewMode: 'mobile-frame',
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
    currentStreak: 4,
    bestStreak: 12,
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
