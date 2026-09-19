export type Priority = 'high' | 'medium' | 'low';
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  totalTasks?: number;
  completedTasks?: number;
  progressPercent?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  userName?: string;
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
  createdAt: string;
}

export type TaskCreateInput = Omit<Task, 'id' | 'createdAt' | 'userId'> & { userId?: string };

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export type TabType = 'dashboard' | 'tasks' | 'calendar' | 'focus' | 'categories' | 'stats' | 'users';

export type TaskViewMode = 'list' | 'kanban' | 'calendar';

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
}

export interface RoomParticipant {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  status: 'focusing' | 'break' | 'idle' | 'completed';
  joinedAt: string;
  lastPing: number;
}

export interface RoomMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface FocusRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  focusDuration: number; // seconds
  breakDuration: number; // seconds
  mode: 'focus' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  timeLeft: number;
  lastUpdated: number;
  participants: RoomParticipant[];
  messages: RoomMessage[];
  createdAt: string;
}
