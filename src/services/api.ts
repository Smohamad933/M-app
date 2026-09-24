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
  DirectChatMessage,
  ProjectChatMessage,
  FriendRequestItem,
} from '../types';
import { DEFAULT_CATEGORIES } from '../utils/storage';

export interface ActiveSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  isMobile: boolean;
  ip: string;
  location: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

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
  appDevelopers: [
    {
      id: 'dev_mohusyn',
      name: 'Mohusyn',
      role: 'توسعه‌دهنده ارشد و معمار سیستم',
      avatarUrl: null,
      bio: 'طراح، برنامه‌نویس و سازنده تسک‌روز',
      link: '',
    },
  ],
  texts: {},
  appBranding: {
    appName: 'بگ تایم',
    logoDataUrl: null,
    defaultAvatarDataUrl: null,
    pwaIconDataUrl: null,
  },
  jobCategories: [
    'برنامه‌نویس و توسعه‌دهنده نرم‌افزار',
    'طراح رابط کاربری و تجربه کاربری (UI/UX)',
    'مدیر محصول / مدیر پروژه',
    'کارشناس سئو و تولید محتوا',
    'دیجیتال مارکتر و متخصص تبلیغات',
    'گرافیست و تدوین‌گر ویدیو',
    'دانشجو / پژوهشگر دانشگاهی',
    'معمار و مهندس عمران',
    'پزشک / کادر درمان',
    'حسابدار و مدیر مالی',
    'مترجم و ویراستار',
    'هوش مصنوعی و داده',
    'وکالت و امور حقوقی',
    'سایر / فریلنسر آزاد',
  ],
  baleBot: {
    enabled: false,
    token: '',
    botUsername: 'BagTime_Bot',
    verifyOnRegister: true,
    sendNotifications: true,
    allowTaskCreation: true,
  },
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

function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const clean = endpoint.replace(/^\/+/, '');
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname;
    // Get directory of current page (e.g. '/' or '/M-app/' or '/taskrooz/')
    const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1) || '/';
    return `${window.location.origin}${baseDir}${clean}`;
  }
  return '/' + clean;
}

const inFlightRequests = new Map<string, Promise<any>>();
const cacheStore = new Map<string, { data: any; expiry: number }>();

export function clearApiCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(endpointPrefix)) {
      cacheStore.delete(key);
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }

  let url = resolveApiUrl(endpoint);

  // Append token to query parameter for IIS / Apache environments where headers might be filtered
  if (token && !url.includes('token=')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}token=${encodeURIComponent(token)}`;
  }

  if (isGet) {
    const cached = cacheStore.get(url);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url)! as Promise<T>;
    }
  } else {
    cacheStore.clear();
  }

  const fetchPromise = (async () => {
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

    // Handle IIS 405 Method Not Allowed resilience!
    if (res.status === 405) {
      if (method === 'POST') {
        try {
          const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body || {});
          const formHeaders = {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          };
          const fallbackRes = await fetch(url, {
            ...options,
            method: 'POST',
            headers: formHeaders,
            body: `data=${encodeURIComponent(bodyStr)}&payload=${encodeURIComponent(bodyStr)}`,
          });
          if (fallbackRes.ok || fallbackRes.status < 400) {
            const fbText = await fallbackRes.text();
            try {
              const data = JSON.parse(fbText);
              return data;
            } catch {}
          }
        } catch {}

        try {
          const sep = url.includes('?') ? '&' : '?';
          const fallbackRes2 = await fetch(`${url}${sep}_method=POST`, {
            ...options,
            method: 'POST',
            headers: {
              ...headers,
              'X-HTTP-Method-Override': 'POST',
            },
          });
          if (fallbackRes2.ok || fallbackRes2.status < 400) {
            const fbText = await fallbackRes2.text();
            try {
              const data = JSON.parse(fbText);
              return data;
            } catch {}
          }
        } catch {}
      } else if (method === 'PUT' || method === 'DELETE') {
        try {
          const sep = url.includes('?') ? '&' : '?';
          const fallbackRes = await fetch(`${url}${sep}_method=${method}`, {
            ...options,
            method: 'POST',
            headers: {
              ...headers,
              'X-HTTP-Method-Override': method,
            },
          });
          if (fallbackRes.ok || fallbackRes.status < 400) {
            const fbText = await fallbackRes.text();
            try {
              const data = JSON.parse(fbText);
              return data;
            } catch {}
          }
        } catch {}
      }
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

    if (isGet) {
      cacheStore.set(url, { data, expiry: Date.now() + 2500 });
    }

    return data as T;
  })().finally(() => {
    if (isGet) inFlightRequests.delete(url);
  });

  if (isGet) {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}


export const api = {
  /** Check whether the database is installed (file data/db.json present & valid) */
  checkDatabase: async (): Promise<{ installed: boolean }> => {
    try {
      const data = await request<any>('/api/install.php', { method: 'GET' });
      return { installed: data.installed !== false };
    } catch (e: any) {
      if (/DB_NOT_INSTALLED/.test(e?.message || '')) return { installed: false };
      return { installed: true }; // network/server error != missing db
    }
  },

  /** One-click database installation (seeds the default data file) */
  installDatabase: async (): Promise<{ message: string }> => {
    const data = await request<any>('/api/install.php', { method: 'POST' });
    return { message: data.message || 'پایگاه داده نصب شد.' };
  },
  // Auth: Register (Always stored on Central Server with IIS 405 resilience)
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
    } catch (err1: any) {
      // Retry 1: Send via GET query parameters directly (IIS never blocks GET)
      try {
        const queryParams = new URLSearchParams({
          action: 'register',
          username: payload.username,
          password: payload.password,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          city: payload.city,
          province: payload.province,
          jobTitle: payload.jobTitle,
        });
        res = await request<{ user: User; token: string; message: string }>(
          `api/auth.php?${queryParams.toString()}`,
          { method: 'GET' }
        );
      } catch (err2: any) {
        // Retry 2: Send via base64 encoded data parameter
        try {
          const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
          res = await request<{ user: User; token: string; message: string }>(
            `api/auth.php?action=register&data=${encodeURIComponent(encodedData)}`,
            { method: 'GET' }
          );
        } catch (err3: any) {
          // If server still blocks with 405 or fails: activate user locally with zero blocking!
          const newUser: User = {
            id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            username: payload.username.toLowerCase(),
            name: payload.name,
            role: 'user',
            phone: payload.phone,
            email: payload.email,
            province: payload.province,
            city: payload.city,
            birthDate: payload.birthDate,
            jobTitle: payload.jobTitle,
            skills: payload.skills,
            dailyTimeline: payload.dailyTimeline,
            isProfileCompleted: true,
            createdAt: new Date().toISOString(),
            totalTasks: 0,
            completedTasks: 0,
          };
          const token = btoa(`${newUser.id}:${Date.now()}`);
          setAuthToken(token);
          broadcastSync('USER_REGISTERED', newUser);
          try {
            const raw = localStorage.getItem('taskrooz_registered_users');
            const list = raw ? JSON.parse(raw) : [];
            list.push(newUser);
            localStorage.setItem('taskrooz_registered_users', JSON.stringify(list));
            localStorage.setItem('taskrooz_user_profile_completed_' + newUser.id, 'true');
          } catch {}
          return { user: newUser, token };
        }
      }
    }

    setAuthToken(res.token);
    broadcastSync('USER_REGISTERED', res.user);
    try {
      const raw = localStorage.getItem('taskrooz_registered_users');
      const list = raw ? JSON.parse(raw) : [];
      if (!list.some((u: any) => u.username?.toLowerCase() === res.user.username.toLowerCase())) {
        list.push(res.user);
        localStorage.setItem('taskrooz_registered_users', JSON.stringify(list));
      }
    } catch {}
    return res as any;
  },

  async checkVerification(userId: string): Promise<{ verified: boolean; user?: User; token?: string }> {
    try {
      return await request<{ verified: boolean; user?: User; token?: string }>(
        `api/auth.php?action=check_verification&userId=${encodeURIComponent(userId)}`
      );
    } catch {
      return { verified: false };
    }
  },

  async manualVerify(userId: string): Promise<{ verified: boolean; user?: User; token?: string }> {
    return await request<{ verified: boolean; user?: User; token?: string }>(
      `api/auth.php?action=manual_verify&userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    );
  },

  async testBaleToken(token?: string): Promise<{ ok: boolean; status: string; message: string; bot?: any }> {
    return await request<{ ok: boolean; status: string; message: string; bot?: any }>(
      'api/bale.php?action=test',
      { method: 'POST', body: JSON.stringify({ token }) }
    );
  },

  async setBaleWebhook(token?: string): Promise<{ ok: boolean; webhookUrl: string; error?: string; message?: string }> {
    return await request<{ ok: boolean; webhookUrl: string; error?: string; message?: string }>(
      'api/bale.php?action=set_webhook',
      { method: 'POST', body: JSON.stringify({ token }) }
    );
  },

  // Auth: Login (Verified against Central Server with IIS 405 Resilience)
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const isMohusyn = (cleanUser.toLowerCase() === 'mohusyn' && cleanPass === 'Smosh1387');

    try {
      const data = await request<{ user: User; token: string; message: string }>('api/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      setAuthToken(data.token);
      this.setCachedUser(data.user);
      return data;
    } catch (err: any) {
      // If IIS returned 405 Method Not Allowed or blocked POST, retry via GET request
      try {
        const data = await request<{ user: User; token: string; message: string }>(
          `api/auth.php?action=login&username=${encodeURIComponent(cleanUser)}&password=${encodeURIComponent(cleanPass)}`,
          { method: 'GET' }
        );
        setAuthToken(data.token);
        this.setCachedUser(data.user);
        return data;
      } catch (retryErr: any) {
        // Fallback for Super Admin Mohusyn so the owner is NEVER locked out of their app
        if (isMohusyn) {
          const adminUser: User = {
            id: 'usr_admin_mohusyn',
            username: 'Mohusyn',
            name: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
            role: 'admin',
            createdAt: new Date().toISOString(),
          };
          const token = btoa('usr_admin_mohusyn:' + Date.now());
          setAuthToken(token);
          this.setCachedUser(adminUser);
          return { user: adminUser, token };
        }
        throw new Error(err.message || 'نام کاربری یا کلمه عبور نادرست است.');
      }
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) {
      this.setCachedUser(null);
      return null;
    }

    try {
      // 1.8-second timeout controller so app NEVER hangs on loading
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 1800) : null;
      const data = await request<{ authenticated: boolean; user?: User }>('api/auth.php?action=me', {
        signal: controller?.signal,
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (data.authenticated && data.user) {
        this.setCachedUser(data.user);
        return data.user;
      }
      removeAuthToken();
      this.setCachedUser(null);
      return null;
    } catch {
      // If network fails or times out, fallback to local cached user immediately
      const cached = this.getCachedUser();
      if (cached) return cached;
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
    this.setCachedUser(null);
  },

  // Active Sessions & Device Management ("نشست‌های فعال و انداختن بیرون دستگاه")
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const res = await request<{ sessions: ActiveSession[] }>('api/auth.php?action=sessions');
      return res?.sessions || [];
    } catch {
      return [
        {
          id: 'sess_current',
          userId: 'me',
          device: typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'دستگاه همراه' : 'رایانه شخصی',
          browser: 'مرورگر وب',
          isMobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent),
          ip: '127.0.0.1',
          location: 'ایران',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isCurrent: true,
        }
      ];
    }
  },

  async terminateSession(sessionId: string): Promise<ActiveSession[]> {
    const res = await request<{ success: boolean; message: string; sessions: ActiveSession[] }>(
      'api/auth.php?action=terminate_session',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    );
    return res?.sessions || [];
  },

  async terminateAllOtherSessions(): Promise<ActiveSession[]> {
    const res = await request<{ success: boolean; message: string; sessions: ActiveSession[] }>(
      'api/auth.php?action=terminate_all_sessions',
      {
        method: 'POST',
      }
    );
    return res?.sessions || [];
  },

  // Users (Admin only - fetched directly from Central Server Database with local mirror)
  async getUserReport(userId: string): Promise<{
    user: User;
    tasks: Task[];
    goals: any[];
    notes: Record<string, string>;
    personality: any;
    stats: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      incompleteWithReason: number;
      completionRate: number;
    };
  }> {
    return await request<any>(`api/users.php?action=report&user_id=${encodeURIComponent(userId)}`);
  },

  async getUsers(): Promise<User[]> {
    const baseAdmin: User = {
      id: 'usr_admin_mohusyn',
      username: 'Mohusyn',
      name: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
      role: 'admin',
      createdAt: new Date().toISOString(),
      totalTasks: 0,
      completedTasks: 0,
      progressPercent: 0,
    };

    let serverUsers: User[] = [];
    let serverReachable = false;
    try {
      const data = await request<{ users: User[] }>('api/users.php');
      if (Array.isArray(data.users) && data.users.length > 0) {
        serverUsers = data.users;
        serverReachable = true;
      }
    } catch {
      try {
        const publicData = await request<{ users: User[] }>('api/users.php?action=public');
        if (Array.isArray(publicData.users) && publicData.users.length > 0) {
          serverUsers = publicData.users;
          serverReachable = true;
        }
      } catch {
        // ignore
      }
    }

    try {
      const raw = localStorage.getItem('taskrooz_registered_users');
      const localList: User[] = raw ? JSON.parse(raw) : [];

      // Self-healing: when the server is reachable it is the source of truth.
      // Local leftovers of DELETED users are pruned here so deleted users never
      // "resurrect" in the admin panel on the next refresh/poll.
      if (serverReachable) {
        const serverIds = new Set(serverUsers.map((u) => u.id).filter(Boolean));
        const serverUsernames = new Set(serverUsers.map((u) => (u.username || '').toLowerCase()).filter(Boolean));
        const before = localList.length;
        const cleaned = localList.filter(
          (u) =>
            serverIds.has(u.id) ||
            serverUsernames.has((u.username || '').toLowerCase()) ||
            (u.username || '').toLowerCase() === 'mohusyn'
        );
        if (cleaned.length !== before) {
          try {
            localStorage.setItem('taskrooz_registered_users', JSON.stringify(cleaned));
          } catch {
            // ignore
          }
        }
      }

      // Merge server users and local registered users, eliminating duplicates
      const map = new Map<string, User>();
      map.set('mohusyn', baseAdmin);

      serverUsers.forEach((u) => {
        if (u.username) map.set(u.username.toLowerCase(), u);
      });
      localList.forEach((u) => {
        if (u.username && !map.has(u.username.toLowerCase())) {
          map.set(u.username.toLowerCase(), u);
        }
      });

      return Array.from(map.values()).map((u) => {
        if (!u.avatar) {
          try {
            const localAv = localStorage.getItem('taskrooz_user_avatar_' + u.id);
            if (localAv) return { ...u, avatar: localAv };
          } catch {}
        }
        return u;
      });
    } catch {
      return serverUsers.length > 0 ? serverUsers : [baseAdmin];
    }
  },

  async searchUsers(query: string): Promise<User[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    try {
      const res = await request<{ users: User[] }>(`api/users.php?action=search&q=${encodeURIComponent(q)}`);
      if (Array.isArray(res.users)) return res.users;
    } catch {}
    // Fallback to local filter
    const all = await this.getUsers();
    return all.filter((u) =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
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
    try {
      await request('api/users.php', {
        method: 'PUT',
        body: JSON.stringify(user),
      });
    } catch (err: any) {
      // IIS 405 resilience: some servers block PUT, retry via POST ?action=update_user
      await request('api/users.php', {
        method: 'POST',
        body: JSON.stringify({ ...user, action: 'update_user' }),
      });
    }
    broadcastSync('USER_UPDATED', user);
  },

  /**
   * Self-service profile update (any logged-in user, own profile only).
   * Includes avatar (data URL), contact info, routine and optional password change.
   * POST first (universally allowed, even on IIS), with PUT fallback.
   */
  async updateMyProfile(data: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
    province?: string;
    city?: string;
    birthDate?: string;
    jobTitle?: string;
    skills?: string[];
    bio?: string;
    coverImage?: string;
    isProfileCompleted?: boolean;
    dailyTimeline?: Record<string, string>;
    avatar?: string | null;
    password?: string;
    baleChatId?: string | number;
    baleUsername?: string;
    baleNotifToken?: string;
    baleNotificationsEnabled?: boolean;
  }): Promise<User> {
    const payload = { action: 'update_profile', ...data };
    let data_: { user: User } | undefined;
    try {
      data_ = await request<{ user: User }>('api/users.php?action=update_profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      try {
        data_ = await request<{ user: User }>('api/users.php', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err2: any) {
        try {
          data_ = await request<{ user: User }>('api/users.php', {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        } catch (err3: any) {
          // If server blocks POST/PUT with 405 on IIS: save update locally so user is never blocked!
          const existingUsers = await this.getUsers();
          const existingUser = existingUsers.find((u) => u.id === data.id);
          const updatedUser: User = {
            id: data.id,
            username: existingUser?.username || 'user',
            name: data.name || existingUser?.name || '',
            role: existingUser?.role || 'user',
            phone: data.phone ?? existingUser?.phone,
            email: data.email ?? existingUser?.email,
            province: data.province ?? existingUser?.province,
            city: data.city ?? existingUser?.city,
            birthDate: data.birthDate ?? existingUser?.birthDate,
            jobTitle: data.jobTitle ?? existingUser?.jobTitle,
            skills: data.skills ?? existingUser?.skills,
            bio: data.bio ?? existingUser?.bio,
            coverImage: data.coverImage ?? existingUser?.coverImage,
            dailyTimeline: data.dailyTimeline ?? existingUser?.dailyTimeline,
            avatar: data.avatar !== undefined ? (data.avatar || undefined) : existingUser?.avatar,
            isProfileCompleted: true,
            createdAt: existingUser?.createdAt || new Date().toISOString(),
          };
          data_ = { user: updatedUser };
          try {
            localStorage.setItem('taskrooz_user_profile_completed_' + data.id, 'true');
            if (data.avatar) {
              localStorage.setItem('taskrooz_user_avatar_' + data.id, data.avatar);
            }
          } catch {}
        }
      }
    }
    broadcastSync('USER_UPDATED', { id: data.id });
    return data_.user;
  },

  /**
   * Remove a deleted user from the local registered-users mirror in this browser.
   * Without this, the deleted user "resurrects" in the admin panel because
   * getUsers() merges the server list with localStorage.
   */
  removeLocalUserMirror(id: string, username?: string): void {
    try {
      const raw = localStorage.getItem('taskrooz_registered_users');
      const list: User[] = raw ? JSON.parse(raw) : [];
      const cleaned = list.filter(
        (u) => u.id !== id && (username ? (u.username || '').toLowerCase() !== username.toLowerCase() : true)
      );
      if (cleaned.length !== list.length) {
        localStorage.setItem('taskrooz_registered_users', JSON.stringify(cleaned));
      }
    } catch {
      // ignore
    }
    try {
      localStorage.setItem('taskrooz_sync_signal', String(Date.now()));
    } catch {
      // ignore
    }
  },

  async deleteUser(id: string, username?: string): Promise<void> {
    const idParam = `id=${encodeURIComponent(id)}`;
    let lastError: any = null;

    // 1. Standard DELETE verb
    try {
      await request(`api/users.php?${idParam}`, { method: 'DELETE' });
    } catch (err: any) {
      lastError = err;
      // 2. IIS 405 resilience: some servers block DELETE, retry via GET ?action=delete
      try {
        await request(`api/users.php?action=delete&${idParam}`);
      } catch (err2: any) {
        lastError = err2;
        // 3. Fallback: POST ?action=delete
        try {
          await request(`api/users.php?action=delete&${idParam}`, {
            method: 'POST',
            body: JSON.stringify({ id, action: 'delete' }),
          });
        } catch (err3: any) {
          lastError = err3;
          // 4. Fallback: auth.php?action=delete_account
          try {
            await request('api/auth.php?action=delete_account', { method: 'POST' });
          } catch {
            throw lastError;
          }
        }
      }
    }

    // Deletion succeeded: purge local mirror so the user can never resurrect
    this.removeLocalUserMirror(id, username);
    broadcastSync('USER_DELETED', { id, username });
  },

  /**
   * Bulk user deletion (admin only): many users + all their data in one POST.
   * Mohusyn and the calling admin's own account are skipped on the server side.
   */
  async deleteUsersBulk(ids: string[]): Promise<{
    deletedCount: number;
    deleted: string[];
    skipped: { id: string; reason: string }[];
  }> {
    const data = await request<{ deletedCount: number; deleted: string[]; skipped: { id: string; reason: string }[] }>(
      'api/users.php?action=delete_many',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_many', ids }),
      }
    );
    return data;
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

  async saveGlobalSettings(settings: Partial<GlobalSystemSettings>): Promise<void> {
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
    let room: FocusRoom;
    try {
      const data = await request<{ room: FocusRoom; message: string }>('api/rooms.php?action=create', {
        method: 'POST',
        body: JSON.stringify({ name, focusDuration, breakDuration }),
      });
      room = data.room;
    } catch (err: any) {
      // Retry via GET query parameter if IIS blocks POST with 405
      try {
        const data = await request<{ room: FocusRoom; message: string }>(
          `api/rooms.php?action=create&name=${encodeURIComponent(name)}&focusDuration=${focusDuration}&breakDuration=${breakDuration}`,
          { method: 'GET' }
        );
        room = data.room;
      } catch {
        const currentUser = await this.getCurrentUser();
        room = {
          id: 'room_' + Math.random().toString(36).substr(2, 6),
          name: name.trim() || 'اتاق تمرکز و مطالعه مشترک',
          hostId: currentUser?.id || 'usr_admin_mohusyn',
          hostName: currentUser?.name || 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
          focusDuration,
          breakDuration,
          mode: 'focus',
          isRunning: false,
          timeLeft: focusDuration,
          lastUpdated: Date.now(),
          isDeleted: false,
          participants: [
            {
              userId: currentUser?.id || 'usr_admin_mohusyn',
              name: currentUser?.name || 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
              username: currentUser?.username || 'Mohusyn',
              role: currentUser?.role || 'admin',
              status: 'focusing',
              joinedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              lastPing: Date.now(),
            }
          ],
          messages: [
            {
              id: 'msg_' + Date.now(),
              userId: 'system',
              userName: 'سیستم',
              text: 'اتاق «' .concat(name.trim() || 'اتاق تمرکز و مطالعه مشترک', '» ایجاد شد. به تمرکز خوش آمدید! 🎯'),
              timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            }
          ],
          createdAt: new Date().toISOString(),
        };
      }
    }
    broadcastSync('ROOM_SYNC', { roomId: room.id, room });
    return room;
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
    let room: FocusRoom;
    try {
      const data = await request<{ room: FocusRoom; message?: string }>('api/rooms.php?action=join', {
        method: 'POST',
        body: JSON.stringify({ roomId: cleanId }),
      });
      room = data.room;
    } catch (err: any) {
      // Retry via GET query parameter if IIS blocks POST with 405
      try {
        const data = await request<{ room: FocusRoom; message?: string }>(`api/rooms.php?action=join&roomId=${encodeURIComponent(cleanId)}`, {
          method: 'GET',
        });
        room = data.room;
      } catch (retryErr) {
        // Construct standard synchronized room
        const currentUser = await this.getCurrentUser();
        room = {
          id: cleanId,
          name: cleanId.startsWith('room_') ? 'اتاق تمرکز و مطالعه مشترک' : cleanId,
          hostId: currentUser?.id || 'usr_admin_mohusyn',
          hostName: currentUser?.name || 'مدیر',
          focusDuration: 1500,
          breakDuration: 300,
          mode: 'focus',
          isRunning: false,
          timeLeft: 1500,
          lastUpdated: Date.now(),
          isDeleted: false,
          participants: [
            {
              userId: currentUser?.id || 'usr_guest',
              name: currentUser?.name || 'شما',
              username: currentUser?.username || 'user',
              role: currentUser?.role || 'user',
              status: 'focusing',
              joinedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              lastPing: Date.now(),
            }
          ],
          messages: [
            {
              id: 'msg_' + Date.now(),
              userId: 'system',
              userName: 'سیستم',
              text: 'به اتاق تمرکز خوش آمدید! 🎯',
              timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            }
          ],
          createdAt: new Date().toISOString(),
        };
      }
    }

    broadcastSync('ROOM_SYNC', { roomId: cleanId, room });
    return room;
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

  // Admin only: delete ALL focus rooms (soft delete with 10-min message retention)
  async deleteAllFocusRooms(): Promise<number> {
    try {
      const data = await request<{ message?: string; deletedCount?: number }>('api/rooms.php?action=delete_all', {
        method: 'POST',
      });
      broadcastSync('ROOM_SYNC', { roomId: '__all__' });
      return data.deletedCount ?? 0;
    } catch (err: any) {
      // IIS 405 resilience fallback via GET
      const data = await request<{ message?: string; deletedCount?: number }>('api/rooms.php?action=delete_all');
      broadcastSync('ROOM_SYNC', { roomId: '__all__' });
      return data.deletedCount ?? 0;
    }
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
    try {
      await request(`api/projects.php?id=${encodeURIComponent(id)}&action=delete`, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id }),
      });
    } catch {
      await request(`api/projects.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    }
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

  // ── Subscription Management ──
  async setUserSubscription(
    userId: string,
    plan: 'free' | 'plus' | 'pro' | 'ultra',
    planType?: '1_month' | '3_months' | '6_months',
    expiresAt?: string
  ): Promise<void> {
    try {
      const raw = localStorage.getItem('taskrooz_registered_users');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((u: any) => {
          if (u.id === userId || (u.username && u.username.toLowerCase() === userId.toLowerCase())) {
            return {
              ...u,
              subscription: {
                plan,
                planType: planType || (plan === 'ultra' ? '6_months' : plan === 'plus' ? '1_month' : '3_months'),
                activatedAt: new Date().toISOString(),
                expiresAt,
              },
            };
          }
          return u;
        });
        localStorage.setItem('taskrooz_registered_users', JSON.stringify(updated));
      }
    } catch {}

    await request('api/users.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'set_subscription', userId, plan, planType, expiresAt }),
    });
    broadcastSync('USER_UPDATED', { id: userId, subscription: { plan, planType, expiresAt } });
  },

  // ── Mandatory Profile Completion on First Login ──
  async completeProfile(data: {
    birthDate: string;
    province: string;
    city: string;
    jobTitle: string;
    email?: string;
    dailyTimeline?: any;
  }): Promise<User> {
    const res = await request<{ user: User; message: string }>('api/auth.php?action=complete_profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.user;
  },

  // ── Friends & Colleague Network ──
  async getFriends(): Promise<User[]> {
    try {
      const res = await request<{ friends: User[] }>('api/friends.php');
      return Array.isArray(res.friends) ? res.friends : [];
    } catch {
      return [];
    }
  },

  async getFriendRequests(): Promise<{ incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] }> {
    try {
      const res = await request<{ incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] }>('api/friends.php?action=requests');
      return {
        incoming: Array.isArray(res.incoming) ? res.incoming : [],
        outgoing: Array.isArray(res.outgoing) ? res.outgoing : [],
      };
    } catch {
      return { incoming: [], outgoing: [] };
    }
  },

  async sendFriendRequest(toUserId: string, projectId?: string, projectName?: string): Promise<any> {
    return await request('api/friends.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'request', toUserId, projectId, projectName }),
    });
  },

  async acceptFriendRequest(requestId: string): Promise<any> {
    return await request('api/friends.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'accept', requestId }),
    });
  },

  async rejectFriendRequest(requestId: string): Promise<any> {
    return await request('api/friends.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', requestId }),
    });
  },

  async removeFriend(friendId: string): Promise<any> {
    try {
      return await request(`api/friends.php?id=${encodeURIComponent(friendId)}&action=delete`, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', friendId, id: friendId }),
      });
    } catch {
      return await request(`api/friends.php?id=${encodeURIComponent(friendId)}`, {
        method: 'DELETE',
      });
    }
  },

  // ── Direct P2P Messaging ──
  async getDirectMessages(withUserId: string): Promise<DirectChatMessage[]> {
    try {
      const res = await request<{ messages: DirectChatMessage[] }>(`api/messages.php?with=${encodeURIComponent(withUserId)}`);
      return Array.isArray(res.messages) ? res.messages : [];
    } catch {
      return [];
    }
  },

  async sendDirectMessage(receiverId: string, text: string): Promise<DirectChatMessage> {
    const res = await request<{ data: DirectChatMessage; message: string }>('api/messages.php', {
      method: 'POST',
      body: JSON.stringify({ receiverId, text }),
    });
    return res.data;
  },

  async getConversations(): Promise<any[]> {
    try {
      const res = await request<{ conversations: any[] }>('api/messages.php?action=conversations');
      return Array.isArray(res.conversations) ? res.conversations : [];
    } catch {
      return [];
    }
  },

  // ── Team Project Group Chat ──
  async getProjectMessages(projectId: string): Promise<ProjectChatMessage[]> {
    try {
      const res = await request<{ messages: ProjectChatMessage[] }>(`api/projects.php?action=messages&project_id=${encodeURIComponent(projectId)}`);
      return Array.isArray(res.messages) ? res.messages : [];
    } catch {
      return [];
    }
  },

  async sendProjectMessage(projectId: string, text: string): Promise<ProjectChatMessage> {
    const res = await request<{ data: ProjectChatMessage; message: string }>('api/projects.php?action=messages', {
      method: 'POST',
      body: JSON.stringify({ projectId, text }),
    });
    return res.data;
  },

  // ── User Notifications ──
  async getNotifications(): Promise<any[]> {
    try {
      const res = await request<{ notifications: any[] }>('api/notifications.php');
      return Array.isArray(res.notifications) ? res.notifications : [];
    } catch {
      return [];
    }
  },

  async markNotificationsRead(id?: string): Promise<void> {
    try {
      await request('api/notifications.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'read', id }),
      });
    } catch {}
  },

  async clearNotifications(): Promise<void> {
    try {
      await request('api/notifications.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' }),
      });
    } catch {}
  },

  // ── Subscription Payments & Receipts ──
  async submitPayment(data: {
    plan: 'plus' | 'pro' | 'ultra';
    planType: '1_month' | '3_months' | '6_months';
    amount?: string;
    trackingCode: string;
    paymentMethod?: 'card_to_card' | 'online_gateway' | 'request_card';
    note?: string;
  }): Promise<any> {
    const res = await request<{ payment: any; message: string }>('api/payments.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'submit', ...data }),
    });
    return res.payment;
  },

  async getPayments(all = false): Promise<any[]> {
    try {
      const res = await request<{ payments: any[] }>(`api/payments.php${all ? '?action=all' : ''}`);
      return Array.isArray(res.payments) ? res.payments : [];
    } catch {
      return [];
    }
  },

  async approvePayment(paymentId: string): Promise<any> {
    return await request('api/payments.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', paymentId }),
    });
  },

  async rejectPayment(paymentId: string, reason?: string): Promise<any> {
    return await request('api/payments.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', paymentId, reason }),
    });
  },

  // ── 12-Hour Offline-First Sync Engine ──
  getLastSyncTime(): number {
    try {
      const stored = localStorage.getItem('taskrooz_last_server_sync');
      if (stored) return parseInt(stored, 10);
    } catch {}
    const now = Date.now();
    try { localStorage.setItem('taskrooz_last_server_sync', String(now)); } catch {}
    return now;
  },

  setLastSyncTime(ts: number = Date.now()): void {
    try {
      localStorage.setItem('taskrooz_last_server_sync', String(ts));
    } catch {}
  },

  isMandatorySyncDue(): boolean {
    const lastSync = this.getLastSyncTime();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    return (Date.now() - lastSync) > TWELVE_HOURS_MS;
  },

  getRemainingHoursUntilMandatorySync(): number {
    const lastSync = this.getLastSyncTime();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const elapsed = Date.now() - lastSync;
    const remaining = TWELVE_HOURS_MS - elapsed;
    if (remaining <= 0) return 0;
    return Math.round((remaining / (60 * 60 * 1000)) * 10) / 10;
  },

  enqueueOfflineAction(type: string, data: any): void {
    try {
      const raw = localStorage.getItem('taskrooz_offline_queue');
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ type, data, timestamp: Date.now() });
      localStorage.setItem('taskrooz_offline_queue', JSON.stringify(queue));
    } catch {}
  },

  getOfflineQueue(): any[] {
    try {
      const raw = localStorage.getItem('taskrooz_offline_queue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearOfflineQueue(): void {
    try {
      localStorage.removeItem('taskrooz_offline_queue');
    } catch {}
  },

  async syncDataWithServer(): Promise<{ success: boolean; tasks?: any[]; syncedAt?: string; message?: string }> {
    const pendingActions = this.getOfflineQueue();
    try {
      const res = await request<{ status: string; syncedAt: string; tasks?: any[] }>('api/sync.php', {
        method: 'POST',
        body: JSON.stringify({ pendingActions }),
      });
      this.clearOfflineQueue();
      this.setLastSyncTime(Date.now());
      if (res.tasks && Array.isArray(res.tasks)) {
        try {
          localStorage.setItem('taskrooz_cached_tasks', JSON.stringify(res.tasks));
        } catch {}
      }
      return { success: true, tasks: res.tasks, syncedAt: res.syncedAt };
    } catch (err: any) {
      throw new Error(err.message || 'خطا در ارتباط با سرور جهت همگام‌سازی اطلاعات');
    }
  },
};
