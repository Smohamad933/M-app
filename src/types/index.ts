export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number;
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  categoryId: string;
  subtasks: SubTask[];
  isPinned?: boolean;
  focusMinutesSpent?: number;
  reminder?: boolean;
  repeat?: 'none' | 'daily' | 'weekly';
  tags?: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export type TabType = 'tasks' | 'calendar' | 'focus' | 'categories' | 'stats';

export type FilterStatus = 'all' | 'pending' | 'completed' | 'starred' | 'urgent';

export interface DailyStreak {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
}

export interface AppSettings {
  language: 'fa' | 'en';
  persianDigits: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  viewMode: 'mobile-frame' | 'responsive';
}
