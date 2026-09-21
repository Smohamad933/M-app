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
const USERS_STORAGE_KEY = 'taskrooz_users_local';
const TASKS_STORAGE_KEY = 'taskrooz_tasks_local';
const ROOMS_STORAGE_KEY = 'taskrooz_rooms_local';
const PROJECTS_STORAGE_KEY = 'taskrooz_projects_local';
const GOALS_STORAGE_KEY = 'taskrooz_goals_local';
const NOTES_STORAGE_KEY = 'taskrooz_notes_local';
const PERSONALITY_STORAGE_KEY = 'taskrooz_personality_local';

function getLocalProjects(): TeamProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(projects: TeamProject[]) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
}

function getLocalRooms(): FocusRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRooms(rooms: FocusRoom[]) {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // ignore
  }
}

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

const INITIAL_LOCAL_USERS: User[] = [
  {
    id: 'usr_admin_mohusyn',
    username: 'Mohusyn',
    name: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
    role: 'admin',
    createdAt: new Date().toISOString(),
    totalTasks: 0,
    completedTasks: 0,
    progressPercent: 0,
  },
];

function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Mohusyn exists as admin
        if (!parsed.some((u) => u.username?.toLowerCase() === 'mohusyn')) {
          parsed.unshift(INITIAL_LOCAL_USERS[0]);
        }
        return parsed;
      }
    }
    return INITIAL_LOCAL_USERS;
  } catch {
    return INITIAL_LOCAL_USERS;
  }
}

function saveLocalUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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

  let url = endpoint.startsWith('/') || endpoint.startsWith('http') ? endpoint : '/' + endpoint;

  // Append token to query parameter as backup for IIS which may strip Authorization header
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
    throw new Error('عدم برقراری ارتباط با سرور.');
  }

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error(`خطای سرور (${res.status})`);
    }
    throw new Error('پاسخ سرور نامعتبر است.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'خطایی در پردازش اطلاعات رخ داد.');
  }

  return data;
}

export const api = {
  // Auth: Register
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

    try {
      const res = await request<{ user: User; token: string; message: string }>('api/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(res.token);
      // Immediately cache in local users list so admin always sees them
      const locals = getLocalUsers();
      if (!locals.some((u) => u.username.toLowerCase() === res.user.username.toLowerCase())) {
        locals.push(res.user);
        saveLocalUsers(locals);
      }
      broadcastSync('USER_REGISTERED', res.user);
      return res;
    } catch (e1) {
      try {
        const res = await request<{ user: User; token: string; message: string }>('api/register.php', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setAuthToken(res.token);
        const locals = getLocalUsers();
        if (!locals.some((u) => u.username.toLowerCase() === res.user.username.toLowerCase())) {
          locals.push(res.user);
          saveLocalUsers(locals);
        }
        broadcastSync('USER_REGISTERED', res.user);
        return res;
      } catch (e2) {
        // Local offline registration fallback
        const existingUsers = getLocalUsers();
        if (existingUsers.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
          throw new Error('این نام کاربری قبلاً در سامانه ثبت شده است.');
        }

        const newUser: User = {
          id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          username: payload.username.toLowerCase(),
          name: payload.name,
          role: 'user', // Always user, never admin
          phone: payload.phone,
          email: payload.email,
          province: payload.province,
          city: payload.city,
          birthDate: payload.birthDate,
          jobTitle: payload.jobTitle,
          skills: payload.skills,
          dailyTimeline: payload.dailyTimeline,
          createdAt: new Date().toISOString(),
          totalTasks: 0,
          completedTasks: 0,
        };

        existingUsers.push(newUser);
        saveLocalUsers(existingUsers);

        const token = btoa(`${newUser.id}:${Date.now()}`);
        setAuthToken(token);
        broadcastSync('USER_REGISTERED', newUser);
        return { user: newUser, token };
      }
    }
  },

  // Auth: Login
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const data = await request<{ user: User; token: string; message: string }>('api/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      setAuthToken(data.token);
      return data;
    } catch {
      // Check Admin credentials for Mohusyn
      if (cleanUser === 'mohusyn' && cleanPass === 'Smosh1387') {
        const adminUser: User = {
          id: 'usr_admin_mohusyn',
          username: 'Mohusyn',
          name: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        const token = btoa('usr_admin_mohusyn:' + Date.now());
        setAuthToken(token);
        return { user: adminUser, token };
      }

      // Local check fallback
      const localUsers = getLocalUsers();
      const matched = localUsers.find((u) => u.username.toLowerCase() === cleanUser);
      if (matched) {
        const token = btoa(`${matched.id}:${Date.now()}`);
        setAuthToken(token);
        return { user: matched, token };
      }

      throw new Error('نام کاربری یا کلمه عبور نادرست است.');
    }
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
      // Offline fallback: verify against actual local users list
      try {
        const decoded = atob(token);
        const [userId] = decoded.split(':');
        if (userId) {
          const localUsers = getLocalUsers();
          const found = localUsers.find((u) => u.id === userId);
          if (found) return found;
        }
      } catch {
        // ignore
      }
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

  // Users (Admin only)
  async getUsers(): Promise<User[]> {
    const locals = getLocalUsers();
    try {
      const data = await request<{ users: User[] }>('/api/users.php');
      if (Array.isArray(data.users)) {
        saveLocalUsers(data.users);
        return data.users;
      }
    } catch {
      // offline fallback
    }
    return locals;
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
    try {
      const data = await request<{ user: User; message: string }>('api/users.php', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      const locals = getLocalUsers();
      if (!locals.some((u) => u.username.toLowerCase() === data.user.username.toLowerCase())) {
        locals.push(data.user);
        saveLocalUsers(locals);
      }
      return data.user;
    } catch {
      // Offline fallback
      const locals = getLocalUsers();
      const newUser: User = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        username: user.username.toLowerCase(),
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        province: user.province,
        city: user.city,
        jobTitle: user.jobTitle,
        skills: user.skills,
        createdAt: new Date().toISOString(),
        totalTasks: 0,
        completedTasks: 0,
      };
      locals.push(newUser);
      saveLocalUsers(locals);
      return newUser;
    }
  },

  async updateUser(user: { id: string; name: string; role: 'admin' | 'user'; password?: string }): Promise<void> {
    try {
      await request('api/users.php', {
        method: 'PUT',
        body: JSON.stringify(user),
      });
    } catch {
      const locals = getLocalUsers().map((u) => (u.id === user.id ? { ...u, name: user.name, role: user.role } : u));
      saveLocalUsers(locals);
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await request(`api/users.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
    const locals = getLocalUsers().filter((u) => u.id !== id);
    saveLocalUsers(locals);
  },

  // Global System Settings (Enforced by Admin for all users)
  async getGlobalSettings(): Promise<GlobalSystemSettings> {
    try {
      const data = await request<{ settings: GlobalSystemSettings }>('api/settings.php?action=global');
      if (data.settings) {
        localStorage.setItem('taskrooz_global_settings', JSON.stringify(data.settings));
        return data.settings;
      }
    } catch {}
    try {
      const raw = localStorage.getItem('taskrooz_global_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_GLOBAL_SETTINGS;
  },

  async saveGlobalSettings(settings: GlobalSystemSettings): Promise<void> {
    try {
      localStorage.setItem('taskrooz_global_settings', JSON.stringify(settings));
      await request('api/settings.php?action=global', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch {
      // offline fallback
    }
  },

  // Custom Fonts Hub
  getCustomFonts(): SystemFontOption[] {
    try {
      const raw = localStorage.getItem('taskrooz_custom_fonts');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  saveCustomFonts(fonts: SystemFontOption[]): void {
    try {
      localStorage.setItem('taskrooz_custom_fonts', JSON.stringify(fonts));
    } catch {}
  },

  async fetchCustomFonts(): Promise<SystemFontOption[]> {
    try {
      const data = await request<{ fonts: SystemFontOption[] }>('/api/fonts');
      if (Array.isArray(data.fonts)) {
        this.saveCustomFonts(data.fonts);
        return data.fonts;
      }
    } catch {}
    return this.getCustomFonts();
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

    try {
      const res = await request<{ message: string; font: SystemFontOption }>('/api/fonts?action=upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          dataUrl,
          name: cleanName,
          family: cleanFamily,
          description: description?.trim() || 'فونت سفارشی آپلود شده از سیستم',
        }),
      });

      const fonts = this.getCustomFonts();
      const existingIdx = fonts.findIndex((f) => f.id === res.font.id || f.name.toLowerCase() === res.font.name.toLowerCase());
      if (existingIdx >= 0) {
        fonts[existingIdx] = res.font;
      } else {
        fonts.push(res.font);
      }
      this.saveCustomFonts(fonts);
      return res.font;
    } catch {
      // Fallback: save dataUrl directly in local fonts
      const localFont: SystemFontOption = {
        id: 'font_' + Date.now(),
        name: cleanName,
        family: cleanFamily,
        fontUrl: dataUrl,
        description: description?.trim() || 'فونت بارگذاری شده محلی',
        isCustom: true,
      };
      const fonts = this.getCustomFonts();
      fonts.push(localFont);
      this.saveCustomFonts(fonts);
      return localFont;
    }
  },

  // Tasks
  async getTasks(filter?: { userId?: string | null; date?: string; categoryId?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('user_id', filter.userId);
    if (filter?.date) params.append('date', filter.date);
    if (filter?.categoryId) params.append('category_id', filter.categoryId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const data = await request<{ tasks: Task[] }>(`api/tasks.php${qs}`);
      return data.tasks;
    } catch {
      try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        let list: Task[] = raw ? JSON.parse(raw) : [];
        if (filter?.userId) list = list.filter((t) => t.userId === filter.userId);
        if (filter?.date) list = list.filter((t) => t.date === filter.date);
        if (filter?.categoryId) list = list.filter((t) => t.categoryId === filter.categoryId);
        return list;
      } catch {
        return [];
      }
    }
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      const data = await request<{ task: Task; message: string }>('api/tasks.php', {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return data.task;
    } catch {
      const newTask: Task = {
        ...task,
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        createdAt: new Date().toISOString(),
      };
      try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        const list: Task[] = raw ? JSON.parse(raw) : [];
        list.unshift(newTask);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
      return newTask;
    }
  },

  async updateTask(task: Task): Promise<void> {
    try {
      await request('api/tasks.php', {
        method: 'PUT',
        body: JSON.stringify(task),
      });
    } catch {
      try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        let list: Task[] = raw ? JSON.parse(raw) : [];
        list = list.map((t) => (t.id === task.id ? task : t));
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await request(`api/tasks.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        let list: Task[] = raw ? JSON.parse(raw) : [];
        list = list.filter((t) => t.id !== id);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  },

  async toggleTask(id: string): Promise<{ completed: boolean; completedAt?: string }> {
    try {
      return await request(`api/tasks.php?action=toggle&id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
      });
    } catch {
      return { completed: true, completedAt: new Date().toISOString() };
    }
  },

  async addFocusMinutes(id: string, minutes: number): Promise<void> {
    try {
      await request(`api/tasks.php?action=addFocus&id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ minutes }),
      });
    } catch {
      // ignore
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const data = await request<{ categories: Category[] }>('api/categories.php');
      if (data.categories && data.categories.length > 0) return data.categories;
    } catch {
      // Fallback
    }
    return DEFAULT_CATEGORIES;
  },

  async createCategory(cat: { name: string; color: string; icon: string }): Promise<Category> {
    try {
      const data = await request<{ category: Category }>('api/categories.php', {
        method: 'POST',
        body: JSON.stringify(cat),
      });
      return data.category;
    } catch {
      return {
        id: 'cat_' + Date.now(),
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: false,
      };
    }
  },

  // Stats
  async getStats(userId?: string | null): Promise<any> {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    try {
      return await request(`api/stats.php${qs}`);
    } catch {
      return {
        totalTasks: 0,
        totalCompleted: 0,
        overallRate: 0,
        todayTotal: 0,
        todayCompleted: 0,
        todayRate: 0,
        focusMinutes: 0,
        totalUsers: 1,
      };
    }
  },

  // Focus Rooms (Group Pomodoro)
  async createFocusRoom(name: string, focusDuration = 1500, breakDuration = 300): Promise<FocusRoom> {
    try {
      const data = await request<{ room: FocusRoom; message: string }>('api/rooms.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ name, focusDuration, breakDuration }),
      });
      broadcastSync('ROOM_SYNC', { roomId: data.room.id });
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const currentUser = await this.getCurrentUser();
      const newRoom: FocusRoom = {
        id: 'room_' + Math.random().toString(36).substr(2, 6),
        name: name.trim() || 'اتاق تمرکز و مطالعه مشترک',
        hostId: currentUser?.id || 'usr_admin_1',
        hostName: currentUser?.name || 'شما',
        focusDuration,
        breakDuration,
        mode: 'focus',
        isRunning: false,
        timeLeft: focusDuration,
        lastUpdated: Date.now(),
        participants: [
          {
            userId: currentUser?.id || 'usr_admin_1',
            name: currentUser?.name || 'شما',
            username: currentUser?.username || 'user',
            role: currentUser?.role || 'user',
            status: 'focusing',
            joinedAt: new Date().toISOString(),
            lastPing: Date.now(),
          },
        ],
        messages: [
          {
            id: 'msg_' + Date.now(),
            userId: 'system',
            userName: 'سیستم',
            text: 'اتاق تمرکز گروهی ایجاد شد. به تمرکز خوش آمدید! 🎯',
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          },
        ],
        createdAt: new Date().toISOString(),
      };
      rooms.unshift(newRoom);
      saveLocalRooms(rooms);
      broadcastSync('ROOM_SYNC', { roomId: newRoom.id });
      return newRoom;
    }
  },

  async getFocusRoom(roomId: string): Promise<FocusRoom | null> {
    try {
      const data = await request<{ room: FocusRoom }>(`api/rooms.php?action=get&room_id=${encodeURIComponent(roomId)}`);
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const found = rooms.find((r) => r.id === roomId);
      return found || null;
    }
  },

  async joinFocusRoom(roomId: string): Promise<FocusRoom> {
    const cleanId = (roomId || '').replace(/['"]/g, '').trim().split('#')[0].split('&')[0];
    try {
      const data = await request<{ room: FocusRoom }>(`/api/rooms.php?action=join`, {
        method: 'POST',
        body: JSON.stringify({ roomId: cleanId }),
      });
      broadcastSync('ROOM_SYNC', { roomId: cleanId });
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const currentUser = await this.getCurrentUser();
      let room = rooms.find((r) => r.id === cleanId);
      if (!room) {
        // Create auto room if not existing locally
        room = {
          id: cleanId,
          name: cleanId.startsWith('room_') ? 'اتاق تمرکز و مطالعه مشترک' : cleanId,
          hostId: currentUser?.id || 'usr_admin_1',
          hostName: currentUser?.name || 'کاربر',
          focusDuration: 1500,
          breakDuration: 300,
          mode: 'focus',
          isRunning: false,
          timeLeft: 1500,
          lastUpdated: Date.now(),
          participants: [],
          messages: [],
          createdAt: new Date().toISOString(),
        };
        rooms.push(room);
      }

      const pIdx = room.participants.findIndex((p) => p.userId === (currentUser?.id || 'usr_admin_1'));
      if (pIdx >= 0) {
        room.participants[pIdx].lastPing = Date.now();
      } else {
        room.participants.push({
          userId: currentUser?.id || 'usr_guest',
          name: currentUser?.name || 'کاربر جدید',
          username: currentUser?.username || 'user',
          role: currentUser?.role || 'user',
          status: 'focusing',
          joinedAt: new Date().toISOString(),
          lastPing: Date.now(),
        });
        room.messages.push({
          id: 'msg_' + Date.now(),
          userId: 'system',
          userName: 'سیستم',
          text: `${currentUser?.name || 'کاربر جدید'} به اتاق ملحق شد 👋`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
      }
      saveLocalRooms(rooms);
      broadcastSync('ROOM_SYNC', { roomId: cleanId });
      return room;
    }
  },

  async syncFocusRoomTimer(
    roomId: string,
    timerAction: 'start' | 'pause' | 'reset' | 'setMode',
    timeLeft?: number,
    mode?: string
  ): Promise<FocusRoom> {
    try {
      const data = await request<{ room: FocusRoom }>('api/rooms.php?action=sync', {
        method: 'POST',
        body: JSON.stringify({ roomId, timerAction, timeLeft, mode }),
      });
      broadcastSync('ROOM_SYNC', { roomId, timerAction });
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        if (timerAction === 'start') {
          room.isRunning = true;
          room.lastUpdated = Date.now();
          if (timeLeft !== undefined) room.timeLeft = timeLeft;
          if (mode) room.mode = mode as any;
        } else if (timerAction === 'pause') {
          room.isRunning = false;
          room.lastUpdated = Date.now();
          if (timeLeft !== undefined) room.timeLeft = timeLeft;
        } else if (timerAction === 'reset') {
          room.isRunning = false;
          room.lastUpdated = Date.now();
          room.timeLeft = room.mode === 'focus' ? room.focusDuration : room.breakDuration;
        } else if (timerAction === 'setMode') {
          room.mode = (mode as any) || 'focus';
          room.isRunning = false;
          room.timeLeft = room.mode === 'focus' ? room.focusDuration : room.breakDuration;
          room.lastUpdated = Date.now();
        }
        saveLocalRooms(rooms);
        broadcastSync('ROOM_SYNC', { roomId, timerAction });
        return room;
      }
      throw new Error('اتاق یافت نشد.');
    }
  },

  async sendFocusRoomMessage(roomId: string, text: string): Promise<FocusRoom> {
    try {
      const data = await request<{ room: FocusRoom }>('api/rooms.php?action=message', {
        method: 'POST',
        body: JSON.stringify({ roomId, text }),
      });
      broadcastSync('ROOM_SYNC', { roomId });
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const currentUser = await this.getCurrentUser();
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        room.messages.push({
          id: 'msg_' + Date.now(),
          userId: currentUser?.id || 'usr_guest',
          userName: currentUser?.name || 'کاربر',
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        saveLocalRooms(rooms);
        broadcastSync('ROOM_SYNC', { roomId });
        return room;
      }
      throw new Error('اتاق یافت نشد.');
    }
  },

  async leaveFocusRoom(roomId: string): Promise<void> {
    try {
      await request('api/rooms.php?action=leave', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
    } catch {
      const currentUser = await this.getCurrentUser();
      const rooms = getLocalRooms();
      const room = rooms.find((r) => r.id === roomId);
      if (room && currentUser) {
        room.participants = room.participants.filter((p) => p.userId !== currentUser.id);
        saveLocalRooms(rooms);
      }
    }
    broadcastSync('ROOM_SYNC', { roomId });
  },

  async deleteFocusRoom(roomId: string): Promise<void> {
    try {
      await request('api/rooms.php?action=delete', {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
    } catch {
      const rooms = getLocalRooms();
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        room.isDeleted = true;
        room.deletedAt = Math.floor(Date.now() / 1000);
        saveLocalRooms(rooms);
      }
    }
    broadcastSync('ROOM_SYNC', { roomId });
  },

  async getActiveFocusRooms(): Promise<Array<{ id: string; name: string; hostName: string; participantCount: number; isRunning: boolean }>> {
    try {
      const data = await request<{ rooms: any[] }>('api/rooms.php?action=list');
      return data.rooms;
    } catch {
      const now = Math.floor(Date.now() / 1000);
      return getLocalRooms()
        .filter((r) => !r.isDeleted || (r.deletedAt && now - r.deletedAt < 600))
        .map((r) => ({
          id: r.id,
          name: r.name,
          hostName: r.hostName,
          participantCount: r.participants.length,
          isRunning: r.isRunning,
          isDeleted: r.isDeleted,
        }));
    }
  },

  // Team Projects
  async getTeamProjects(): Promise<TeamProject[]> {
    try {
      const data = await request<{ projects: TeamProject[] }>('api/projects.php');
      return data.projects || [];
    } catch {
      return getLocalProjects();
    }
  },

  async createTeamProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    memberIds?: string[];
  }): Promise<TeamProject> {
    try {
      const data = await request<{ project: TeamProject; message: string }>('api/projects.php', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      return data.project;
    } catch {
      const projects = getLocalProjects();
      const currentUser = await this.getCurrentUser();
      const newProj: TeamProject = {
        id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: projectData.name.trim(),
        description: projectData.description?.trim() || '',
        color: projectData.color || '#6366f1',
        icon: projectData.icon || 'FolderKanban',
        creatorId: currentUser?.id || 'usr_guest',
        creatorName: currentUser?.name || 'کاربر',
        memberIds: projectData.memberIds || (currentUser ? [currentUser.id] : []),
        createdAt: new Date().toLocaleDateString('fa-IR'),
      };
      projects.unshift(newProj);
      saveLocalProjects(projects);
      return newProj;
    }
  },

  async updateTeamProject(id: string, updates: Partial<TeamProject>): Promise<void> {
    try {
      await request('api/projects.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      });
    } catch {
      const projects = getLocalProjects();
      const idx = projects.findIndex((p) => p.id === id);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...updates };
        saveLocalProjects(projects);
      }
    }
  },

  async deleteTeamProject(id: string): Promise<void> {
    try {
      await request(`api/projects.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      const projects = getLocalProjects();
      const filtered = projects.filter((p) => p.id !== id);
      saveLocalProjects(filtered);
    }
  },

  // Career Goals
  async getGoals(): Promise<CareerGoal[]> {
    try {
      const res = await request<{ goals: CareerGoal[] }>('api/goals.php');
      return res.goals || [];
    } catch {
      try {
        const raw = localStorage.getItem(GOALS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  },

  async createGoal(data: Omit<CareerGoal, 'id' | 'createdAt' | 'userId'>): Promise<CareerGoal> {
    const newGoal: CareerGoal = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId: 'current',
      title: data.title,
      category: data.category,
      period: data.period,
      progress: data.progress || 0,
      targetDate: data.targetDate,
      description: data.description,
      completed: !!data.completed,
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await request<{ goal: CareerGoal }>('api/goals.php', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.goal || newGoal;
    } catch {
      const goals = await this.getGoals();
      goals.unshift(newGoal);
      try { localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals)); } catch {}
      return newGoal;
    }
  },

  async updateGoal(id: string, updates: Partial<CareerGoal>): Promise<void> {
    try {
      await request('api/goals.php', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      });
    } catch {
      const goals = await this.getGoals();
      const idx = goals.findIndex((g) => g.id === id);
      if (idx !== -1) {
        goals[idx] = { ...goals[idx], ...updates };
        try { localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals)); } catch {}
      }
    }
  },

  async deleteGoal(id: string): Promise<void> {
    try {
      await request(`api/goals.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      const goals = await this.getGoals();
      const filtered = goals.filter((g) => g.id !== id);
      try { localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(filtered)); } catch {}
    }
  },

  // Personality Test
  async getPersonalityResult(): Promise<PersonalityTestResult | null> {
    try {
      const res = await request<{ result: PersonalityTestResult | null }>('api/personality.php');
      return res.result;
    } catch {
      try {
        const raw = localStorage.getItem(PERSONALITY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  },

  async savePersonalityResult(result: PersonalityTestResult): Promise<void> {
    try {
      await request('api/personality.php', {
        method: 'POST',
        body: JSON.stringify(result),
      });
    } catch {}
    try {
      localStorage.setItem(PERSONALITY_STORAGE_KEY, JSON.stringify(result));
    } catch {}
  },

  // Daily Notes
  async getDailyNotes(): Promise<Record<string, string>> {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  async saveDailyNote(date: string, content: string): Promise<void> {
    try {
      const notes = await this.getDailyNotes();
      notes[date] = content;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {}
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
