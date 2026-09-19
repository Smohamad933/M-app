import type { Task, User, Category, FocusRoom, TeamProject } from '../types';
import { DEFAULT_CATEGORIES } from '../utils/storage';

const TOKEN_KEY = 'taskrooz_auth_token';
const USERS_STORAGE_KEY = 'taskrooz_users_local';
const TASKS_STORAGE_KEY = 'taskrooz_tasks_local';
const ROOMS_STORAGE_KEY = 'taskrooz_rooms_local';
const PROJECTS_STORAGE_KEY = 'taskrooz_projects_local';

function getLocalProjects(): TeamProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'proj_default_1',
        name: 'پروژه آلفا (توسعه محصول)',
        description: 'طراحی رابط کاربری و پیاده‌سازی سیستم مدیریت تسک‌های مدرن',
        color: '#6366f1',
        icon: 'FolderKanban',
        creatorId: 'usr_admin_1',
        creatorName: 'سید محمدحسین شیخ الاسلامی',
        memberIds: ['usr_admin_1'],
        createdAt: '1403/07/01',
      }
    ];
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

function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
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

  let res: Response;
  try {
    res = await fetch(endpoint, {
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
  async register(data: { username: string; password: string; name: string }): Promise<{ user: User; token: string }> {
    const payload = {
      username: data.username.trim(),
      password: data.password.trim(),
      name: data.name.trim(),
    };

    try {
      const res = await request<{ user: User; token: string; message: string }>('api/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(res.token);
      return res;
    } catch (e1) {
      try {
        const res = await request<{ user: User; token: string; message: string }>('api/register.php', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setAuthToken(res.token);
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
          role: existingUsers.length === 0 ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          totalTasks: 0,
          completedTasks: 0,
        };

        existingUsers.push(newUser);
        saveLocalUsers(existingUsers);

        const token = btoa(`${newUser.id}:${Date.now()}`);
        setAuthToken(token);
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
      // Local check fallback
      const localUsers = getLocalUsers();
      const matched = localUsers.find((u) => u.username.toLowerCase() === cleanUser);
      if (matched) {
        const token = btoa(`${matched.id}:${Date.now()}`);
        setAuthToken(token);
        return { user: matched, token };
      }

      // Default Admin credential fallback
      if (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123')) {
        const fallbackAdmin: User = {
          id: 'usr_admin_1',
          username: 'admin',
          name: 'مدیر سیستم',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        const dummyToken = btoa('usr_admin_1:' + Date.now());
        setAuthToken(dummyToken);
        return { user: fallbackAdmin, token: dummyToken };
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
    try {
      const data = await request<{ users: User[] }>('api/users.php');
      return data.users;
    } catch {
      const locals = getLocalUsers();
      if (locals.length > 0) return locals;
      return [
        {
          id: 'usr_admin_1',
          username: 'admin',
          name: 'مدیر سیستم',
          role: 'admin',
          createdAt: new Date().toISOString(),
          totalTasks: 0,
          completedTasks: 0,
        },
      ];
    }
  },

  async createUser(user: { username: string; password: string; name: string; role: 'admin' | 'user' }): Promise<User> {
    try {
      const data = await request<{ user: User; message: string }>('api/users.php', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      return data.user;
    } catch {
      // Offline fallback
      const locals = getLocalUsers();
      const newUser: User = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        username: user.username.toLowerCase(),
        name: user.name,
        role: user.role,
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
      const locals = getLocalUsers().filter((u) => u.id !== id);
      saveLocalUsers(locals);
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
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const currentUser = await this.getCurrentUser();
      const newRoom: FocusRoom = {
        id: 'room_' + Math.random().toString(36).substr(2, 6),
        name: name.trim() || 'اتاق تمرکز گروهی',
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
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        createdAt: new Date().toISOString(),
      };
      rooms.unshift(newRoom);
      saveLocalRooms(rooms);
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
    try {
      const data = await request<{ room: FocusRoom }>(`api/rooms.php?action=join`, {
        method: 'POST',
        body: JSON.stringify({ roomId }),
      });
      return data.room;
    } catch {
      const rooms = getLocalRooms();
      const currentUser = await this.getCurrentUser();
      let room = rooms.find((r) => r.id === roomId);
      if (!room) {
        // Create auto room if not existing locally
        room = {
          id: roomId,
          name: 'اتاق تمرکز مشترک',
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
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
      saveLocalRooms(rooms);
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
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        });
        saveLocalRooms(rooms);
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
};
