import type {
  Task,
  User,
  Category,
  FocusRoom,
  TeamProject,
  CareerGoal,
  PersonalityTestResult,
  GlobalSystemSettings,
  SystemFontOption,
} from '../types';
import { DEFAULT_CATEGORIES } from '../utils/storage';

export const DEFAULT_GLOBAL_SETTINGS: GlobalSystemSettings = {
  broadcastNotice: {
    enabled: true,
    title: 'خوش‌آمدید به سامانه تسک‌روز',
    message: 'سامانه متمرکز برنامه‌ریزی روزانه، پومودورو تیمی و پایش بهره‌وری آماده استفاده است.',
    type: 'info',
    updatedAt: new Date().toISOString(),
  },
  enforcedTheme: 'system',
  enforcedFont: 'vazirmatn',
  defaultDailyFocusMinutes: 90,
  workHoursPolicy: {
    start: '08:30',
    end: '17:00',
  },
  roomPolicy: {
    allowUserRoomCreation: true,
    allowPublicChat: true,
  },
  dailyMantra: 'تمرکز پیوسته بر کارهای با اولویت بالا و پرهیز از چندوظیفگی',
};

// Real-time synchronization channel for cross-tab and cross-window coordination
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('taskrooz_sync_channel') 
  : null;

export function broadcastSync(event: string, payload?: any) {
  try {
    syncChannel?.postMessage({ event, payload, timestamp: Date.now() });
  } catch {}
}

export function onSyncEvent(callback: (event: string, payload?: any) => void): () => void {
  if (!syncChannel) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data?.event) {
      callback(e.data.event, e.data.payload);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel.removeEventListener('message', handler);
}

const TOKEN_KEY = 'taskrooz_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }

  let url = endpoint;
  if (!url.startsWith('http')) {
    url = url.startsWith('/') ? url : '/' + url;
  }

  // Append token to query parameter for IIS / Apache environments where headers might be filtered
  if (token && !url.includes('token=')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}token=${encodeURIComponent(token)}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers,
    });
  } catch (err: any) {
    throw new Error('عدم برقراری ارتباط با سرور. لطفاً وضعیت سرور و شبکه را بررسی کنید.');
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`خطای سرور (${res.status}): ${text.slice(0, 150)}`);
    }
    throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'خطایی در پردازش اطلاعات در سرور رخ داد.');
  }

  return data;
}

export const api = {
  // Auth: Register (Always stored on Central Server)
  async register(data: {
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
    dailyTimeline?: any;
  }): Promise<{ user: User; token: string }> {
    const payload = {
      username: data.username.trim(),
      password: data.password.trim(),
      name: data.name.trim(),
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      province: data.province?.trim() || '',
      city: data.city?.trim() || '',
      birthDate: data.birthDate?.trim() || '',
      jobTitle: data.jobTitle?.trim() || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      dailyTimeline: data.dailyTimeline || {},
    };

    let res: { user: User; token: string; message: string };
    try {
      res = await request<{ user: User; token: string; message: string }>('api/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      // Fallback router endpoint if IIS rewrites differently
      res = await request<{ user: User; token: string; message: string }>('api/register.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    setAuthToken(res.token);
    broadcastSync('USER_REGISTERED', res.user);
    return res;
  },

  // Auth: Login (Verified against Central Server)
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const data = await request<{ user: User; token: string; message: string }>('api/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
    });

    setAuthToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const data = await request<{ authenticated: boolean; user?: User }>('api/auth.php?action=me');
      if (data.authenticated && data.user) return data.user;
      removeAuthToken();
      return null;
    } catch {
      removeAuthToken();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('api/auth.php?action=logout', { method: 'POST' });
    } catch {
      // ignore
    }
    removeAuthToken();
  },

  // Users (Admin only - fetched directly from Central Server Database)
  async getUsers(): Promise<User[]> {
    const data = await request<{ users: User[] }>('api/users.php');
    return Array.isArray(data.users) ? data.users : [];
  },

  async createUser(user: {
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
  }): Promise<User> {
    const data = await request<{ user: User; message: string }>('api/users.php', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    broadcastSync('USER_REGISTERED', data.user);
    return data.user;
  },

  async updateUser(user: { id: string; name: string; role: 'admin' | 'user'; password?: string }): Promise<void> {
    await request('api/users.php', {
      method: 'PUT',
      body: JSON.stringify(user),
    });
    broadcastSync('USER_UPDATED', user);
  },

  async deleteUser(id: string): Promise<void> {
    await request(`api/users.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    broadcastSync('USER_DELETED', { id });
  },

  // Global System Settings (Enforced by Admin on Server)
  async getGlobalSettings(): Promise<GlobalSystemSettings> {
    try {
      const data = await request<{ settings: GlobalSystemSettings }>('api/settings.php?action=global');
      if (data.settings && Object.keys(data.settings).length > 0) {
        return data.settings;
      }
    } catch {
      // ignore
    }
    return DEFAULT_GLOBAL_SETTINGS;
  },

  async saveGlobalSettings(settings: GlobalSystemSettings): Promise<void> {
    await request('api/settings.php?action=global', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    broadcastSync('SETTINGS_UPDATED', settings);
  },

  // Custom Fonts Hub (Stored on Central Server)
  getCustomFonts(): SystemFontOption[] {
    try {
      const raw = localStorage.getItem('taskrooz_custom_fonts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCustomFonts(fonts: SystemFontOption[]): void {
    try {
      localStorage.setItem('taskrooz_custom_fonts', JSON.stringify(fonts));
    } catch {}
  },

  async fetchCustomFonts(): Promise<SystemFontOption[]> {
    try {
      const data = await request<{ fonts: SystemFontOption[] }>('api/fonts.php');
      const list = Array.isArray(data.fonts) ? data.fonts : [];
      this.saveCustomFonts(list);
      return list;
    } catch {
      return this.getCustomFonts();
    }
  },

  async uploadCustomFont(file: File, name: string, family?: string, description?: string): Promise<SystemFontOption> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const cleanName = name.trim() || file.name.replace(/\.[^/.]+$/, '');
    const cleanFamily = (family?.trim() || cleanName).replace(/[^a-zA-Z0-9_-]/g, '_');

    const res = await request<{ message: string; font: SystemFontOption }>('api/fonts.php?action=upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        dataUrl,
        name: cleanName,
        family: cleanFamily,
        description: description?.trim() || 'فونت سفارشی آپلود شده از سیستم',
      }),
    });

    broadcastSync('FONT_UPLOADED', res.font);
    return res.font;
  },

  // Tasks (Managed directly on Central Server)
  async getTasks(filter?: { userId?: string | null; date?: string; categoryId?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('user_id', filter.userId);
    if (filter?.date) params.append('date', filter.date);
    if (filter?.categoryId) params.append('category_id', filter.categoryId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await request<{ tasks: Task[] }>(`api/tasks.php${qs}`);
    return Array.isArray(data.tasks) ? data.tasks : [];
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const data = await request<{ task: Task; message: string }>('api/tasks.php', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return data.task;
  },

  async updateTask(task: Task): Promise<void> {
    await request('api/tasks.php', {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  async deleteTask(id: string): Promise<void> {
    await request(`api/tasks.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async toggleTask(id: string): Promise<{ completed: boolean; completedAt?: string }> {
    return await request(`api/tasks.php?action=toggle&id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
    });
  },

  async addFocusMinutes(id: string, minutes: number): Promise<void> {
    await request(`api/tasks.php?action=addFocus&id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ minutes }),
    });
  },

  // Categories (Server Managed)
  async getCategories(): Promise<Category[]> {
    try {
      const data = await request<{ categories: Category[] }>('api/categories.php');
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CATEGORIES;
  },

  async createCategory(cat: { name: string; color: string; icon: string }): Promise<Category> {
    const data = await request<{ category: Category }>('api/categories.php', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
    return data.category;
  },

  // Stats
  async getStats(userId?: string | null): Promise<any> {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return await request(`api/stats.php${qs}`);
  },

  // Focus Rooms (Unified Group Pomodoro on Central Server)
  async createFocusRoom(name: string, focusDuration = 1500, breakDuration = 300): Promise<FocusRoom> {
    const data = await request<{ room: FocusRoom; message: string }>('api/rooms.php?action=create', {
      method: 'POST',
      body: JSON.stringify({ name, focusDuration, breakDuration }),
    });
    broadcastSync('ROOM_SYNC', { roomId: data.room.id });
    return data.room;
  },

  async getFocusRoom(roomId: string): Promise<FocusRoom | null> {
    try {
      const data = await request<{ room: FocusRoom }>(`api/rooms.php?action=get&room_id=${encodeURIComponent(roomId)}`);
      return data.room || null;
    } catch {
      return null;
    }
  },

  async joinFocusRoom(roomId: string): Promise<FocusRoom> {
    const cleanId = (roomId || '').replace(/['"]/g, '').trim().split('#')[0].split('&')[0];
    const data = await request<{ room: FocusRoom; message?: string }>('api/rooms.php?action=join', {
      method: 'POST',
      body: JSON.stringify({ roomId: cleanId }),
    });
    broadcastSync('ROOM_SYNC', { roomId: cleanId });
    return data.room;
  },

  async syncFocusRoomTimer(
    roomId: string,
    timerAction: 'start' | 'pause' | 'reset' | 'setMode',
    timeLeft?: number,
    mode?: string
  ): Promise<FocusRoom> {
    const data = await request<{ room: FocusRoom }>('api/rooms.php?action=sync', {
      method: 'POST',
      body: JSON.stringify({ roomId, timerAction, timeLeft, mode }),
    });
    broadcastSync('ROOM_SYNC', { roomId, timerAction });
    return data.room;
  },

  async sendFocusRoomMessage(roomId: string, text: string): Promise<FocusRoom> {
    const data = await request<{ room: FocusRoom }>('api/rooms.php?action=message', {
      method: 'POST',
      body: JSON.stringify({ roomId, text }),
    });
    broadcastSync('ROOM_SYNC', { roomId });
    return data.room;
  },

  async leaveFocusRoom(roomId: string): Promise<void> {
    try {
      await request('api/rooms.php?action=leave', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
    } catch {
      // ignore
    }
    broadcastSync('ROOM_SYNC', { roomId });
  },

  async deleteFocusRoom(roomId: string): Promise<void> {
    await request('api/rooms.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
    broadcastSync('ROOM_SYNC', { roomId });
  },

  async getActiveFocusRooms(): Promise<Array<{ id: string; name: string; hostName: string; participantCount: number; isRunning: boolean }>> {
    try {
      const data = await request<{ rooms: any[] }>('api/rooms.php?action=list');
      return Array.isArray(data.rooms) ? data.rooms : [];
    } catch {
      return [];
    }
  },

  // Team Projects (Stored on Central Server)
  async getTeamProjects(): Promise<TeamProject[]> {
    try {
      const data = await request<{ projects: TeamProject[] }>('api/projects.php');
      return Array.isArray(data.projects) ? data.projects : [];
    } catch {
      return [];
    }
  },

  async createTeamProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    memberIds?: string[];
  }): Promise<TeamProject> {
    const data = await request<{ project: TeamProject; message: string }>('api/projects.php', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return data.project;
  },

  async updateTeamProject(id: string, updates: Partial<TeamProject>): Promise<void> {
    await request('api/projects.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  },

  async deleteTeamProject(id: string): Promise<void> {
    await request(`api/projects.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Career Goals (Stored on Central Server)
  async getGoals(): Promise<CareerGoal[]> {
    try {
      const res = await request<{ goals: CareerGoal[] }>('api/goals.php');
      return Array.isArray(res.goals) ? res.goals : [];
    } catch {
      return [];
    }
  },

  async createGoal(data: Omit<CareerGoal, 'id' | 'createdAt' | 'userId'>): Promise<CareerGoal> {
    const res = await request<{ goal: CareerGoal }>('api/goals.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.goal;
  },

  async updateGoal(id: string, updates: Partial<CareerGoal>): Promise<void> {
    await request('api/goals.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  },

  async deleteGoal(id: string): Promise<void> {
    await request(`api/goals.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Personality Test (Stored on Central Server)
  async getPersonalityResult(): Promise<PersonalityTestResult | null> {
    try {
      const res = await request<{ result: PersonalityTestResult | null }>('api/personality.php');
      return res.result || null;
    } catch {
      return null;
    }
  },

  async savePersonalityResult(result: PersonalityTestResult): Promise<void> {
    await request('api/personality.php', {
      method: 'POST',
      body: JSON.stringify(result),
    });
  },

  // Daily Notes (Stored on Central Server)
  async getDailyNotes(): Promise<Record<string, string>> {
    try {
      const res = await request<{ notes: Record<string, string> }>('api/notes.php');
      return res.notes || {};
    } catch {
      return {};
    }
  },

  async saveDailyNote(date: string, content: string): Promise<void> {
    await request('api/notes.php', {
      method: 'POST',
      body: JSON.stringify({ date, content }),
    });
  },

  // Export Users to Excel/CSV with Persian UTF-8 BOM
  exportUsersCsv(users: User[]): void {
    const headers = [
      'ردیف',
      'نام و نام خانوادگی',
      'نام کاربری',
      'نقش کاربری',
      'شماره تماس',
      'ایمیل',
      'استان',
      'شهر',
      'تاریخ تولد',
      'شغل و تخصص',
      'مهارت‌ها',
      'کل تسک‌ها',
      'تسک‌های انجام‌شده',
      'درصد پیشرفت',
      'تاریخ عضویت',
    ];

    const rows = users.map((u, i) => [
      i + 1,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      u.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی',
      `"${(u.phone || '—').replace(/"/g, '""')}"`,
      `"${(u.email || '—').replace(/"/g, '""')}"`,
      `"${(u.province || '—').replace(/"/g, '""')}"`,
      `"${(u.city || '—').replace(/"/g, '""')}"`,
      `"${(u.birthDate || '—').replace(/"/g, '""')}"`,
      `"${(u.jobTitle || '—').replace(/"/g, '""')}"`,
      `"${(Array.isArray(u.skills) ? u.skills.join(' ، ') : '—').replace(/"/g, '""')}"`,
      u.totalTasks || 0,
      u.completedTasks || 0,
      `${u.progressPercent || 0}%`,
      `"${(u.createdAt || '').slice(0, 10)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `taskrooz-users-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
