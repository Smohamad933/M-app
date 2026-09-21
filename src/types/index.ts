export type Priority = 'high' | 'medium' | 'low';
export type UserRole = 'admin' | 'user';

export interface UserTimeline {
  wakeUp?: string;
  workStart?: string;
  lunch?: string;
  gym?: string;
  sleep?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  province?: string;
  city?: string;
  birthDate?: string;
  jobTitle?: string;
  skills?: string[];
  dailyTimeline?: UserTimeline;
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

export type UncompletedCategory =
  | 'procrastination'
  | 'others_priority'
  | 'time_shortage'
  | 'low_energy'
  | 'distraction'
  | 'external'
  | 'other';

export interface Task {
  id: string;
  userId: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
  goalId?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number;
  completed: boolean;
  completedAt?: string;
  reasonUncompleted?: string;
  uncompletedCategory?: UncompletedCategory;
  uncompletedAt?: string;
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

export interface TeamProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  creatorId: string;
  creatorName: string;
  memberIds: string[];
  createdAt: string;
  totalTasks?: number;
  completedTasks?: number;
  progressPercent?: number;
}

export type GoalPeriod = 'week' | 'month' | 'quarter1' | 'halfYear1' | 'halfYear2' | 'year';
export type GoalCategory = 'career' | 'skill' | 'personal' | 'project';

export interface CareerGoal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  period: GoalPeriod;
  progress: number; // 0 to 100
  targetDate?: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

export interface PersonalityTestResult {
  type: string;
  title: string;
  archetype: string;
  description: string;
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
  testedAt: string;
}

export interface DailyNote {
  id: string;
  userId: string;
  date: string;
  content: string;
  updatedAt: string;
}

export type TabType =
  | 'dashboard'
  | 'tasks'
  | 'planner'
  | 'habits'
  | 'career'
  | 'calendar'
  | 'focus'
  | 'projects'
  | 'categories'
  | 'stats'
  | 'users';

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
  systemFont?: string;
}

export interface RoomParticipant {
  userId: string;
  name?: string;
  userName?: string;
  username?: string;
  role?: UserRole;
  isHost?: boolean;
  status?: 'focusing' | 'break' | 'idle' | 'completed';
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
  isDeleted?: boolean;
  deletedAt?: number; // epoch timestamp in seconds
  createdAt: string;
}

export interface SystemFontOption {
  id: string;
  name: string;
  family: string;
  description: string;
  isCustom?: boolean;
  fontUrl?: string;
}

export interface GlobalSystemSettings {
  broadcastNotice: {
    enabled: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent' | 'motivational';
    updatedAt?: string;
  };
  enforcedTheme: 'system' | 'dark' | 'light' | 'obsidian';
  enforcedFont: string;
  defaultDailyFocusMinutes: number;
  workHoursPolicy: {
    start: string;
    end: string;
  };
  roomPolicy: {
    allowUserRoomCreation: boolean;
    allowPublicChat: boolean;
  };
  dailyMantra: string;
}
