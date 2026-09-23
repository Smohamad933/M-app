import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

function normalizePersianText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776))
    .replace(/^[@#]/, '')
    .trim()
    .toLowerCase();
}

interface DBUser {
  id: string;
  numericId?: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  phone?: string;
  email?: string;
  province?: string;
  city?: string;
  birthDate?: string;
  jobTitle?: string;
  skills?: string[];
  dailyTimeline?: any;
  subscription?: {
    plan: 'free' | 'pro';
    expiresAt?: string | null;
  };
  isProfileCompleted?: boolean;
  avatar?: string; // data URL (base64) profile photo
  createdAt: string;
}

interface DBTask {
  id: string;
  userId: string;
  projectId?: string | null;
  projectName?: string;
  goalId?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: string;
  reasonUncompleted?: string;
  uncompletedCategory?: string;
  uncompletedAt?: string;
  priority: 'high' | 'medium' | 'low';
  categoryId: string;
  isPinned?: boolean;
  focusMinutesSpent?: number;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  createdAt: string;
}

interface DBCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

interface DBRoomParticipant {
  userId: string;
  userName: string;
  isHost: boolean;
  joinedAt: string;
  lastPing: number;
}

interface DBRoomMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface DBFocusRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  focusDuration: number;
  breakDuration: number;
  timeLeft: number;
  isRunning: boolean;
  mode: 'focus' | 'shortBreak';
  lastUpdated: number;
  participants: DBRoomParticipant[];
  messages: DBRoomMessage[];
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: number; // epoch timestamp in seconds
}

interface DBTeamProject {
  id: string;
  name: string;
  description: string;
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

interface DBCareerGoal {
  id: string;
  userId: string;
  title: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  progress: number;
  targetDate?: string;
  completed?: boolean;
  createdAt: string;
}

interface DBDailyNote {
  id: string;
  userId: string;
  date: string;
  content: string;
  habitsCompleted: string[];
  updatedAt: string;
}

interface DBPersonalityResult {
  id: string;
  userId: string;
  primaryType: string;
  scores: Record<string, number>;
  recommendations: string[];
  completedAt: string;
}

interface AppData {
  users: DBUser[];
  tasks: DBTask[];
  categories: DBCategory[];
  focus_rooms: DBFocusRoom[];
  projects: DBTeamProject[];
  goals: DBCareerGoal[];
  dailyNotes: DBDailyNote[];
  personalityResults: DBPersonalityResult[];
  globalSettings?: any;
  custom_fonts?: any[];
  friendships?: Array<{ id: string; user1Id: string; user2Id: string; createdAt: string }>;
  friend_requests?: Array<{
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserUsername?: string;
    fromUserAvatar?: string | null;
    toUserId: string;
    projectId?: string;
    projectName?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  }>;
  messages?: Array<{
    id: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string | null;
    receiverId: string;
    text: string;
    createdAt: string;
    read?: boolean;
  }>;
  project_messages?: Array<{
    id: string;
    projectId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string | null;
    text: string;
    createdAt: string;
  }>;
}

const DB_FILE = path.resolve(process.cwd(), 'data/db.json');

const INITIAL_DATA: AppData = {
  users: [
    {
      id: 'usr_admin_mohusyn',
      username: 'Mohusyn',
      password: 'Smosh1387',
      name: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [],
  categories: [
    { id: 'cat-work', name: 'کاری و شغلی', color: '#6366f1', icon: 'Briefcase', isDefault: true },
    { id: 'cat-personal', name: 'کارهای شخصی', color: '#10b981', icon: 'User', isDefault: true },
    { id: 'cat-study', name: 'مطالعه و یادگیری', color: '#f59e0b', icon: 'BookOpen', isDefault: true },
    { id: 'cat-health', name: 'ورزش و سلامتی', color: '#f43f5e', icon: 'Activity', isDefault: true },
    { id: 'cat-shopping', name: 'خرید و منزل', color: '#0ea5e9', icon: 'ShoppingCart', isDefault: true },
    { id: 'cat-finance', name: 'امور مالی', color: '#8b5cf6', icon: 'CreditCard', isDefault: true },
  ],
  focus_rooms: [
    {
      id: 'room_deepwork',
      name: 'اتاق تمرکز عمیق (دیپ ورک)',
      hostId: 'usr_admin_mohusyn',
      hostName: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
      focusDuration: 1500,
      breakDuration: 300,
      timeLeft: 1500,
      isRunning: false,
      mode: 'focus',
      lastUpdated: Date.now(),
      participants: [
        {
          userId: 'usr_admin_mohusyn',
          userName: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
          isHost: true,
          joinedAt: '۰۸:۳۰',
          lastPing: Date.now(),
        },
      ],
      messages: [
        {
          id: 'msg_init_1',
          userId: 'system',
          userName: 'سیستم',
          text: 'اتاق تمرکز عمیق آماده است. کار روی مهم‌ترین تسک روز را آغاز کنید! 🎯',
          timestamp: '۰۸:۳۰',
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'room_dev',
      name: 'اتاق توسعه محصول و برنامه‌نویسی',
      hostId: 'usr_admin_mohusyn',
      hostName: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
      focusDuration: 3000,
      breakDuration: 600,
      timeLeft: 3000,
      isRunning: false,
      mode: 'focus',
      lastUpdated: Date.now(),
      participants: [],
      messages: [
        {
          id: 'msg_init_2',
          userId: 'system',
          userName: 'سیستم',
          text: 'اتاق توسعه محصول آماده است. برنامه‌نویسی با بازه‌های ۵۰ دقیقه‌ای! 💻',
          timestamp: '۰۹:۰۰',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [],
  goals: [],
  dailyNotes: [],
  personalityResults: [],
  custom_fonts: [],
  globalSettings: {
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
  },
};

function purgeExpiredDeletedRooms(db: AppData): boolean {
  const now = Math.floor(Date.now() / 1000);
  const initialCount = db.focus_rooms.length;
  // Retain messages and rooms for 10 minutes (600 seconds) after deletion
  db.focus_rooms = db.focus_rooms.filter((r) => {
    if (r.isDeleted && r.deletedAt && now - r.deletedAt > 600) {
      return false; // Permanently purge after 10 minutes
    }
    return true;
  });
  return db.focus_rooms.length !== initialCount;
}

function readDb(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_DATA.users;
      }

      // Ensure Mohusyn exists as Admin
      const mohusynUser = parsed.users.find((u: any) => u.username?.toLowerCase() === 'mohusyn');
      if (!mohusynUser) {
        parsed.users.unshift(INITIAL_DATA.users[0]);
      } else {
        mohusynUser.role = 'admin';
        mohusynUser.password = 'Smosh1387';
      }

      if (!parsed.categories) parsed.categories = INITIAL_DATA.categories;
      if (!parsed.tasks) parsed.tasks = [];
      if (!parsed.focus_rooms || parsed.focus_rooms.length === 0) {
        parsed.focus_rooms = INITIAL_DATA.focus_rooms;
      }
      if (!parsed.projects) parsed.projects = INITIAL_DATA.projects;
      if (!parsed.goals) parsed.goals = [];
      if (!parsed.dailyNotes) parsed.dailyNotes = [];
      if (!parsed.personalityResults) parsed.personalityResults = [];
      if (!parsed.custom_fonts) parsed.custom_fonts = [];
      if (!parsed.friendships) parsed.friendships = [];
      if (!parsed.friend_requests) parsed.friend_requests = [];
      if (!parsed.messages) parsed.messages = [];
      if (!parsed.project_messages) parsed.project_messages = [];

      // Ensure every user has numericId, subscription & isProfileCompleted
      let maxNum = 1000;
      for (const u of parsed.users) {
        if (u.numericId) maxNum = Math.max(maxNum, u.numericId);
      }
      for (const u of parsed.users) {
        if (!u.numericId) {
          if (u.username?.toLowerCase() === 'mohusyn') {
            u.numericId = 1000;
          } else {
            maxNum++;
            u.numericId = maxNum;
          }
        }
        if (!u.subscription) {
          u.subscription = { plan: u.role === 'admin' ? 'pro' : 'free' };
        }
        if (u.isProfileCompleted === undefined) {
          u.isProfileCompleted = u.role === 'admin' || Boolean(u.birthDate && u.jobTitle && u.city);
        }
      }

      if (purgeExpiredDeletedRooms(parsed)) {
        writeDb(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
  // File missing or unreadable — re-seed defaults (normal flow is blocked by the install guard)
  writeDb(INITIAL_DATA);
  return INITIAL_DATA;
}

function writeDb(data: AppData) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

function isDbInstalled(): boolean {
  try {
    return fs.existsSync(DB_FILE) && fs.statSync(DB_FILE).size > 10;
  } catch {
    return false;
  }
}

/** Read the DB only if it already exists (never auto-seeds). Used by PWA manifest/icon routes. */
function readDbSafe(): AppData | null {
  if (!isDbInstalled()) return null;
  return readDb();
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function getUserFromToken(req: IncomingMessage, db: AppData): DBUser | null {
  const authHeader = (req.headers['authorization'] || req.headers['x-auth-token'] || '') as string;
  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (!token) {
    try {
      const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      token = urlObj.searchParams.get('token') || '';
    } catch {}
  }

  if (token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const userId = decoded.split(':')[0];
      const found = db.users.find((u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
      if (found) return found;
      if (userId === 'usr_admin_mohusyn' || userId.toLowerCase() === 'mohusyn') {
        return db.users.find((u) => u.username.toLowerCase() === 'mohusyn') || null;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method?.toUpperCase();

  // --- Dynamic PWA manifest (admin-editable name) ---
  if (pathname === '/manifest.php') {
    const db = readDbSafe();
    const branding = db?.globalSettings?.appBranding || {};
    const name = (branding.appName || '').trim() || 'تسک‌روز';
    const manifest = {
      name,
      short_name: name,
      start_url: './',
      scope: './',
      display: 'standalone',
      dir: 'rtl',
      lang: 'fa',
      background_color: '#09090b',
      theme_color: '#4f46e5',
      description: 'سامانه برنامه‌ریزی روزانه و بهره‌وری تیمی',
      icons: [
        { src: 'app-icon.php?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'app-icon.php?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'app-icon.php?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(JSON.stringify(manifest));
    return true;
  }

  // --- Dynamic PWA icon (admin-editable, falls back to static icons) ---
  if (pathname === '/app-icon.php') {
    const db = readDbSafe();
    const dataUrl = db?.globalSettings?.appBranding?.pwaIconDataUrl;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      const m = dataUrl.match(/^data:(image\/[a-z0-9+.-]+);base64,(.*)$/i);
      if (m) {
        res.statusCode = 200;
        res.setHeader('Content-Type', m[1]);
        res.setHeader('Cache-Control', 'no-cache');
        res.end(Buffer.from(m[2], 'base64'));
        return true;
      }
    }
    const size = parseInt(urlObj.searchParams.get('size') || '512', 10) || 512;
    const file = path.resolve(process.cwd(), size >= 384 ? 'icon-512.png' : 'icon-192.png');
    if (fs.existsSync(file)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      res.end(fs.readFileSync(file));
    } else {
      res.statusCode = 404;
      res.end('not found');
    }
    return true;
  }

  if (!req.url?.startsWith('/api')) {
    return false;
  }

  // --- Database installation guard (mirrors PHP: no silent auto-seed) ---
  if (!pathname.startsWith('/api/install')) {
    if (!isDbInstalled()) {
      sendJson(res, { code: 'DB_NOT_INSTALLED', error: 'پایگاه داده نصب نیست — فایل data/db.json روی سرور یافت نشد.' }, 503);
      return true;
    }
  }

  // --- Install / health endpoint (works even before installation) ---
  if (pathname.startsWith('/api/install')) {
    if (method === 'GET') {
      sendJson(res, { installed: isDbInstalled(), app: 'TaskRooz' });
      return true;
    }
    if (method === 'POST') {
      if (!isDbInstalled()) writeDb(INITIAL_DATA);
      sendJson(res, { installed: true, message: 'پایگاه داده با موفقیت نصب شد.' });
      return true;
    }
    sendJson(res, { error: 'متد نامعتبر است.' }, 405);
    return true;
  }

  const db = readDb();
  const currentUser = getUserFromToken(req, db);

  // 1. Auth routes
  if (pathname.startsWith('/api/auth')) {
    const parsedAuthBody = method === 'POST' ? await parseJsonBody(req) : {};
    const action = urlObj.searchParams.get('action') || parsedAuthBody.action || pathname.replace('/api/auth/', '').replace('/api/auth', '');

    if (method === 'POST' && (action === 'register' || pathname.endsWith('/register'))) {
      const body = parsedAuthBody;
      const username = body.username?.trim();
      const password = body.password?.trim();
      const name = body.name?.trim();
      const rawPhone = body.phone ? normalizePersianText(body.phone) : '';
      const email = body.email?.trim().toLowerCase();

      if (!username || !password || !name) {
        sendJson(res, { error: 'تمامی فیلدها الزامی هستند.' }, 400);
        return true;
      }

      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        sendJson(res, { error: 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.' }, 400);
        return true;
      }

      if (rawPhone && db.users.some((u) => u.phone && normalizePersianText(u.phone) === rawPhone)) {
        sendJson(res, { error: 'این شماره موبایل قبلاً در سامانه ثبت شده است.' }, 400);
        return true;
      }

      if (email && db.users.some((u) => u.email && u.email.toLowerCase() === email)) {
        sendJson(res, { error: 'این آدرس ایمیل قبلاً در سامانه ثبت شده است.' }, 400);
        return true;
      }

      const nextNumericId = Math.max(1000, ...db.users.map((u) => u.numericId || 1000)) + 1;
      const isProfileCompleted = Boolean(body.birthDate && body.jobTitle && body.city);

      const newUser: DBUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        numericId: nextNumericId,
        username,
        password,
        name,
        role: 'user', // Always user, never admin!
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        province: body.province?.trim(),
        city: body.city?.trim(),
        birthDate: body.birthDate?.trim(),
        jobTitle: body.jobTitle?.trim(),
        skills: body.skills || [],
        dailyTimeline: body.dailyTimeline,
        subscription: { plan: 'free' },
        isProfileCompleted,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      writeDb(db);

      const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
      sendJson(res, {
        message: 'ثبت‌نام با موفقیت انجام شد.',
        user: {
          id: newUser.id,
          numericId: newUser.numericId,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          email: newUser.email,
          province: newUser.province,
          city: newUser.city,
          birthDate: newUser.birthDate,
          jobTitle: newUser.jobTitle,
          skills: newUser.skills,
          dailyTimeline: newUser.dailyTimeline,
          subscription: newUser.subscription,
          isProfileCompleted: newUser.isProfileCompleted,
          createdAt: newUser.createdAt,
        },
        token,
      }, 201);
      return true;
    }

    if (method === 'POST' && (action === 'complete_profile' || pathname.endsWith('/complete_profile'))) {
      if (!currentUser) {
        sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
        return true;
      }
      const body = parsedAuthBody;
      const self = db.users.find((u) => u.id === currentUser.id);
      if (!self) {
        sendJson(res, { error: 'کاربر یافت نشد.' }, 404);
        return true;
      }
      if (body.birthDate) self.birthDate = body.birthDate.trim();
      if (body.province) self.province = body.province.trim();
      if (body.city) self.city = body.city.trim();
      if (body.jobTitle) self.jobTitle = body.jobTitle.trim();
      if (body.email) self.email = body.email.trim();
      if (body.skills) self.skills = body.skills;
      if (body.dailyTimeline) self.dailyTimeline = body.dailyTimeline;
      self.isProfileCompleted = true;
      writeDb(db);
      sendJson(res, { message: 'اطلاعات پروفایل با موفقیت ثبت شد.', user: self });
      return true;
    }

    if (method === 'POST' && (action === 'login' || pathname.endsWith('/login') || !action || action === '')) {
      const body = parsedAuthBody;
      const username = body.username?.trim();
      const password = body.password?.trim();

      const user = db.users.find(
        (u) =>
          u.username.toLowerCase() === username?.toLowerCase() &&
          (u.password === password ||
            (u.username.toLowerCase() === 'mohusyn' && password === 'Smosh1387'))
      );

      if (!user) {
        sendJson(res, { error: 'نام کاربری یا کلمه عبور اشتباه است.' }, 401);
        return true;
      }

      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      sendJson(res, {
        message: 'ورود با موفقیت انجام شد.',
        user: {
          id: user.id,
          numericId: user.numericId,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
          email: user.email,
          province: user.province,
          city: user.city,
          birthDate: user.birthDate,
          jobTitle: user.jobTitle,
          avatar: user.avatar || null,
          skills: user.skills,
          dailyTimeline: user.dailyTimeline,
          subscription: user.subscription || { plan: user.role === 'admin' ? 'pro' : 'free' },
          isProfileCompleted: user.isProfileCompleted ?? (user.role === 'admin' || Boolean(user.birthDate && user.jobTitle && user.city)),
          createdAt: user.createdAt,
        },
        token,
      });
      return true;
    }

    if (method === 'GET' && action === 'me') {
      if (!currentUser) {
        sendJson(res, { authenticated: false });
        return true;
      }
      sendJson(res, {
        authenticated: true,
        user: {
          id: currentUser.id,
          numericId: currentUser.numericId,
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
          phone: currentUser.phone || '',
          email: currentUser.email || '',
          province: currentUser.province || '',
          city: currentUser.city || '',
          birthDate: currentUser.birthDate || '',
          jobTitle: currentUser.jobTitle || '',
          avatar: currentUser.avatar || null,
          skills: currentUser.skills || [],
          dailyTimeline: currentUser.dailyTimeline || [],
          subscription: currentUser.subscription || { plan: currentUser.role === 'admin' ? 'pro' : 'free' },
          isProfileCompleted: currentUser.isProfileCompleted ?? (currentUser.role === 'admin' || Boolean(currentUser.birthDate && currentUser.jobTitle && currentUser.city)),
          createdAt: currentUser.createdAt,
        },
      });
      return true;
    }

    if (method === 'POST' && action === 'logout') {
      sendJson(res, { message: 'خروج با موفقیت انجام شد.' });
      return true;
    }
  }

  // 2. Users routes (Admin only — except self profile update below)
  if (pathname.startsWith('/api/users')) {
    // Parse body ONCE (stream can only be read once) and share across branches
    const parsedBody = method === 'POST' || method === 'PUT' || method === 'PATCH' ? await parseJsonBody(req) : {};

    // ── Self profile update: ANY authenticated user, only their OWN profile ──
    if ((method === 'PUT' || method === 'POST') && parsedBody.action === 'update_profile') {
      if (!currentUser) {
        sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
        return true;
      }
      if (parsedBody.id && parsedBody.id !== currentUser.id) {
        sendJson(res, { error: 'فقط می‌توانید پروفایل خودتان را ویرایش کنید.' }, 403);
        return true;
      }
      const self = db.users.find((u) => u.id === currentUser!.id);
      if (!self) {
        sendJson(res, { error: 'کاربر پیدا نشد.' }, 404);
        return true;
      }
      const strField = (v: any) => (typeof v === 'string' ? v.trim() : undefined);
      for (const k of ['name', 'phone', 'email', 'province', 'city', 'birthDate', 'jobTitle'] as const) {
        const v = strField((parsedBody as any)[k]);
        if (v !== undefined) (self as any)[k] = v;
      }
      if (Array.isArray((parsedBody as any).skills)) {
        self.skills = ((parsedBody as any).skills as any[]).filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
      }
      if ((parsedBody as any).dailyTimeline && typeof (parsedBody as any).dailyTimeline === 'object') {
        self.dailyTimeline = (parsedBody as any).dailyTimeline;
      }
      if ('avatar' in (parsedBody as any)) {
        const av = (parsedBody as any).avatar;
        if (av === '' || av === null) {
          self.avatar = undefined;
        } else if (typeof av === 'string' && av.startsWith('data:image/') && av.length < 600000) {
          self.avatar = av;
        } else {
          sendJson(res, { error: 'عکس پروفایل معتبر نیست (حداکثر ۶۰۰ کیلوبایت).' }, 400);
          return true;
        }
      }
      if (typeof (parsedBody as any).password === 'string' && (parsedBody as any).password) {
        self.password = (parsedBody as any).password.trim();
      }
      writeDb(db);
      sendJson(res, {
        message: 'پروفایل شما با موفقیت به‌روزرسانی شد.',
        user: {
          id: self.id,
          username: self.username,
          name: self.name,
          role: self.role,
          phone: self.phone,
          email: self.email,
          province: self.province,
          city: self.city,
          birthDate: self.birthDate,
          jobTitle: self.jobTitle,
          avatar: self.avatar || null,
          skills: self.skills,
          dailyTimeline: self.dailyTimeline,
        },
      });
      return true;
    }

    const qAction = urlObj.searchParams.get('action') || '';

    // Allow authenticated users to search/view safe public colleague profiles
    if (method === 'GET' && (qAction === 'public' || qAction === 'search' || urlObj.searchParams.has('q') || urlObj.searchParams.has('search'))) {
      const rawQ = urlObj.searchParams.get('q') || urlObj.searchParams.get('search') || '';
      const q = normalizePersianText(rawQ);
      let list = db.users || [];
      if (q) {
        list = list.filter((u) => {
          const nameNorm = normalizePersianText(u.name || '');
          const userNorm = normalizePersianText(u.username || '');
          const jobNorm = normalizePersianText(u.jobTitle || '');
          const phoneNorm = normalizePersianText(u.phone || '');
          const numStr = String(u.numericId || '');
          return (
            nameNorm.includes(q) ||
            userNorm.includes(q) ||
            jobNorm.includes(q) ||
            phoneNorm.includes(q) ||
            numStr === q
          );
        });
      }
      const myId = currentUser?.id;
      const safeUsers = list.map((u) => {
        const isFriend = db.friendships?.some(
          (f) => (f.user1Id === myId && f.user2Id === u.id) || (f.user2Id === myId && f.user1Id === u.id)
        ) || false;
        return {
          id: u.id,
          numericId: u.numericId || 1000,
          name: u.name,
          username: u.username,
          avatar: u.avatar || null,
          jobTitle: u.jobTitle || null,
          role: u.role || 'user',
          phone: u.phone || null,
          province: u.province || null,
          city: u.city || null,
          skills: u.skills || [],
          subscription: u.subscription || { plan: u.role === 'admin' ? 'pro' : 'free' },
          isFriend,
          createdAt: u.createdAt,
        };
      });
      sendJson(res, { users: safeUsers });
      return true;
    }

    if (!currentUser || currentUser.role !== 'admin') {
      sendJson(res, { error: 'دسترسی فقط برای مدیر سیستم مجاز است.' }, 403);
      return true;
    }

    // Shared user-data purge (no response) — used by single AND bulk delete
    const removeUserData = (id: string) => {
      db.users = db.users.filter((u) => u.id !== id);
      db.tasks = db.tasks.filter((t) => t.userId !== id);
      db.goals = db.goals.filter((g) => g.userId !== id);
      db.dailyNotes = db.dailyNotes.filter((n) => n.userId !== id);
      db.personalityResults = db.personalityResults.filter((x) => x.userId !== id);
    };

    const isProtectedUser = (u: DBUser) =>
      u.id === 'usr_admin_mohusyn' || (u.username || '').toLowerCase() === 'mohusyn';

    // Shared user-deletion routine: removes the user AND all their data
    // (tasks, goals, notes, personality) so nothing is orphaned.
    const handleUserDelete = (id: string | null) => {
      if (!id) {
        sendJson(res, { error: 'شناسه کاربر الزامی است.' }, 400);
        return;
      }
      const target = db.users.find((u) => u.id === id);
      if (target && isProtectedUser(target)) {
        sendJson(res, { error: 'شما نمی‌توانید حساب کاربری مدیر اصلی را حذف کنید.' }, 400);
        return;
      }
      if (id === currentUser!.id) {
        sendJson(res, { error: 'امکان حذف حساب کاربری جاری وجود ندارد.' }, 400);
        return;
      }
      removeUserData(id);
      writeDb(db);
      sendJson(res, { message: 'کاربر و تمامی تسک‌ها و داده‌های مرتبط با موفقیت حذف شدند.' });
    };

    // IIS 405 resilience: some servers block the DELETE verb, allow delete via GET/POST ?action=delete
    if (method === 'GET' && (qAction === 'delete' || qAction === 'delete_user')) {
      handleUserDelete(urlObj.searchParams.get('id'));
      return true;
    }
    if (method === 'POST' && (qAction === 'delete' || qAction === 'delete_user')) {
      handleUserDelete(typeof parsedBody.id === 'string' && parsedBody.id ? parsedBody.id : urlObj.searchParams.get('id'));
      return true;
    }

    // Bulk delete (admin): wipe many users (and all their data) in one call.
    // Mohusyn + the admin's own account are skipped, never deleted.
    if ((method === 'POST' || method === 'GET') && (qAction === 'delete_many' || qAction === 'delete_multiple' || qAction === 'bulk_delete')) {
      const rawIds: unknown = method === 'POST' ? parsedBody.ids : urlObj.searchParams.get('ids');
      const idList = Array.isArray(rawIds)
        ? rawIds.map((x) => String(x))
        : String(rawIds || '').split(',');
      const ids = [...new Set(idList.map((x) => x.trim()).filter(Boolean))];
      if (ids.length === 0) {
        sendJson(res, { error: 'لیست شناسه کاربران خالی است.' }, 400);
        return true;
      }
      const deleted: string[] = [];
      const skipped: { id: string; reason: string }[] = [];
      for (const id of ids) {
        const target = db.users.find((u) => u.id === id);
        if (!target) {
          skipped.push({ id, reason: 'کاربر پیدا نشد' });
          continue;
        }
        if (isProtectedUser(target)) {
          skipped.push({ id, reason: 'مدیر اصلی محافظت‌شده است' });
          continue;
        }
        if (target.id === currentUser!.id) {
          skipped.push({ id, reason: 'حذف حساب جاری شما مجاز نیست' });
          continue;
        }
        removeUserData(id);
        deleted.push(id);
      }
      writeDb(db);
      sendJson(res, {
        message: deleted.length + ' کاربر به همراه تمامی داده‌هایشان حذف شدند.',
        deletedCount: deleted.length,
        deleted,
        skipped,
      });
      return true;
    }

    if (method === 'GET') {
      const action = urlObj.searchParams.get('action');
      if (action === 'report') {
        const targetId = urlObj.searchParams.get('user_id') || urlObj.searchParams.get('id');
        const targetUser = db.users.find((u) => u.id === targetId || u.username === targetId);
        if (!targetUser) {
          sendJson(res, { error: 'کاربر پیدا نشد.' }, 404);
          return true;
        }
        const userTasks = db.tasks.filter((t) => t.userId === targetUser.id);
        const userGoals = ((db as any).goals || []).filter((g: any) => g.userId === targetUser.id);
        const userNotes: Record<string, string> = {};
        const rawNotes = (db as any).dailyNotes;
        if (Array.isArray(rawNotes)) {
          for (const n of rawNotes) {
            if (n && n.userId === targetUser.id) userNotes[n.date] = n.content;
          }
        } else if (rawNotes && typeof rawNotes === 'object') {
          Object.assign(userNotes, rawNotes[targetUser.id] || {});
        }
        let userPersonality = null;
        const rawPers = (db as any).personalityResults;
        if (Array.isArray(rawPers)) {
          userPersonality = rawPers.find((p: any) => p && p.userId === targetUser.id) || null;
        } else if (rawPers && typeof rawPers === 'object') {
          userPersonality = rawPers[targetUser.id] || null;
        }
        const total = userTasks.length;
        const done = userTasks.filter((t) => t.completed).length;
        const pending = total - done;
        const withReason = userTasks.filter((t: any) => t.incompleteReason).length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        sendJson(res, {
          user: targetUser,
          tasks: userTasks,
          goals: userGoals,
          notes: userNotes,
          personality: userPersonality,
          stats: {
            totalTasks: total,
            completedTasks: done,
            pendingTasks: pending,
            incompleteWithReason: withReason,
            completionRate: rate,
          },
        });
        return true;
      }

      if (action === 'export_csv' || pathname.endsWith('/export/csv')) {
        const rows = [
          'ردیف,نام و نام خانوادگی,نام کاربری,نقش,شماره تماس,ایمیل,استان,شهر,تاریخ تولد,شغل,کل تسک‌ها,تسک‌های انجام‌شده,درصد پیشرفت,تاریخ عضویت',
          ...db.users.map((u, i) => {
            const userTasks = db.tasks.filter((t) => t.userId === u.id);
            const done = userTasks.filter((t) => t.completed).length;
            const total = userTasks.length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            return [
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
              total,
              done,
              `${percent}%`,
              `"${(u.createdAt || '').slice(0, 10)}"`,
            ].join(',');
          }),
        ];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="taskrooz-users.csv"');
        res.end('\uFEFF' + rows.join('\r\n'));
        return true;
      }

      const result = db.users.map((u) => {
        const userTasks = db.tasks.filter((t) => t.userId === u.id);
        const done = userTasks.filter((t) => t.completed).length;
        const total = userTasks.length;
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          phone: u.phone,
          email: u.email,
          province: u.province,
          city: u.city,
          birthDate: u.birthDate,
          jobTitle: u.jobTitle,
          avatar: u.avatar || null,
          skills: u.skills,
          dailyTimeline: u.dailyTimeline,
          createdAt: u.createdAt,
          totalTasks: total,
          completedTasks: done,
          progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      });
      sendJson(res, { users: result });
      return true;
    }

    if (method === 'POST') {
      const body = parsedBody;

      // IIS 405 resilience: admin user-update fallback for servers that block PUT
      if (body.action === 'update_user') {
        const { id, name, role, password } = body;
        const user = db.users.find((u) => u.id === id);
        if (!user) {
          sendJson(res, { error: 'کاربر پیدا نشد.' }, 404);
          return true;
        }
        if (name) user.name = name.trim();
        if (role) user.role = role === 'admin' ? 'admin' : 'user';
        if (password) user.password = password.trim();
        writeDb(db);
        sendJson(res, { message: 'کاربر به‌روزرسانی شد.' });
        return true;
      }

      // Admin toggle user subscription
      if (body.action === 'set_subscription') {
        const { userId, plan, expiresAt } = body;
        const target = db.users.find((u) => u.id === userId);
        if (!target) {
          sendJson(res, { error: 'کاربر پیدا نشد.' }, 404);
          return true;
        }
        target.subscription = {
          plan: plan === 'pro' ? 'pro' : 'free',
          expiresAt: expiresAt || null,
        };
        writeDb(db);
        sendJson(res, { message: 'اشتراک کاربر به‌روزرسانی شد.', subscription: target.subscription });
        return true;
      }

      const username = body.username?.trim();
      const password = body.password?.trim();
      const name = body.name?.trim();
      const role = body.role === 'admin' ? 'admin' : 'user';
      const rawPhone = body.phone ? normalizePersianText(body.phone) : '';
      const email = body.email?.trim().toLowerCase();

      if (!username || !password || !name) {
        sendJson(res, { error: 'تمامی فیلدها الزامی هستند.' }, 400);
        return true;
      }

      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        sendJson(res, { error: 'این نام کاربری قبلاً ثبت شده است.' }, 400);
        return true;
      }

      if (rawPhone && db.users.some((u) => u.phone && normalizePersianText(u.phone) === rawPhone)) {
        sendJson(res, { error: 'این شماره موبایل قبلاً در سامانه ثبت شده است.' }, 400);
        return true;
      }

      if (email && db.users.some((u) => u.email && u.email.toLowerCase() === email)) {
        sendJson(res, { error: 'این آدرس ایمیل قبلاً در سامانه ثبت شده است.' }, 400);
        return true;
      }

      const nextNumericId = Math.max(1000, ...db.users.map((u) => u.numericId || 1000)) + 1;
      const isProfileCompleted = Boolean(body.birthDate && body.jobTitle && body.city);

      const newUser: DBUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        numericId: nextNumericId,
        username,
        password,
        name,
        role,
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        province: body.province?.trim(),
        city: body.city?.trim(),
        birthDate: body.birthDate?.trim(),
        jobTitle: body.jobTitle?.trim(),
        skills: body.skills || [],
        dailyTimeline: body.dailyTimeline,
        subscription: { plan: body.plan || (role === 'admin' ? 'pro' : 'free') },
        isProfileCompleted,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      writeDb(db);

      sendJson(res, {
        message: 'کاربر جدید با موفقیت ایجاد شد.',
        user: {
          id: newUser.id,
          numericId: newUser.numericId,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          email: newUser.email,
          province: newUser.province,
          city: newUser.city,
          birthDate: newUser.birthDate,
          jobTitle: newUser.jobTitle,
          skills: newUser.skills,
          dailyTimeline: newUser.dailyTimeline,
          subscription: newUser.subscription,
          isProfileCompleted: newUser.isProfileCompleted,
          createdAt: newUser.createdAt,
        },
      }, 201);
      return true;
    }

    if (method === 'PUT') {
      const body = parsedBody;
      const { id, name, role, password } = body;
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        sendJson(res, { error: 'کاربر پیدا نشد.' }, 404);
        return true;
      }
      if (name) user.name = name.trim();
      if (role) user.role = role === 'admin' ? 'admin' : 'user';
      if (password) user.password = password.trim();

      writeDb(db);
      sendJson(res, { message: 'کاربر به‌روزرسانی شد.' });
      return true;
    }

    if (method === 'DELETE') {
      handleUserDelete(urlObj.searchParams.get('id'));
      return true;
    }
  }

  // 3. Focus Rooms routes (/api/rooms)
  if (pathname.startsWith('/api/rooms')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
      return true;
    }

    const action = urlObj.searchParams.get('action') || '';

    // Delete ALL rooms (Admin only) — soft delete with 10-minute message retention
    if (action === 'delete_all' || action === 'deleteall' || action === 'wipe') {
      if (currentUser.role !== 'admin') {
        sendJson(res, { error: 'دسترسی فقط برای مدیر سیستم مجاز است.' }, 403);
        return true;
      }
      const now = Math.floor(Date.now() / 1000);
      let count = 0;
      for (const r of db.focus_rooms) {
        if (r.isDeleted) continue;
        r.isDeleted = true;
        r.deletedAt = now;
        r.isRunning = false;
        r.messages.push({
          id: 'msg_delall_' + now + '_' + Math.random().toString(36).substr(2, 4),
          userId: 'system',
          userName: 'سیستم',
          text: `این اتاق توسط مدیر سیستم (${currentUser.name}) بسته شد. پیام‌ها طبق سیاست سیستم تا ۱۰ دقیقه نگه‌داری می‌شوند.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        count++;
      }
      writeDb(db);
      sendJson(res, { message: 'همه اتاق‌های تمرکز با موفقیت حذف شدند.', deletedCount: count });
      return true;
    }

    // List active rooms for lobby
    if (method === 'GET' && action === 'list') {
      purgeExpiredDeletedRooms(db);
      const rooms = db.focus_rooms
        .filter((r) => !r.isDeleted)
        .map((r) => ({
          id: r.id,
          name: r.name,
          hostName: r.hostName,
          participantCount: r.participants.length,
          isRunning: r.isRunning,
          mode: r.mode,
        }));
      sendJson(res, { rooms });
      return true;
    }

    // Get specific room (including deleted ones during the 10-minute retention period)
    if (method === 'GET' && (action === 'get' || urlObj.searchParams.has('room_id'))) {
      purgeExpiredDeletedRooms(db);
      const roomId = urlObj.searchParams.get('room_id');
      const room = db.focus_rooms.find((r) => r.id === roomId);
      if (!room) {
        sendJson(res, { error: 'اتاق پیدا نشد یا پس از ۱۰ دقیقه منقضی و پاک شده است.' }, 404);
        return true;
      }

      // Calculate elapsed timer if running
      if (room.isRunning && !room.isDeleted) {
        const elapsed = Math.floor((Date.now() - room.lastUpdated) / 1000);
        if (elapsed > 0) {
          room.timeLeft = Math.max(0, room.timeLeft - elapsed);
          room.lastUpdated = Date.now();
          if (room.timeLeft === 0) {
            room.isRunning = false;
          }
          writeDb(db);
        }
      }

      sendJson(res, { room });
      return true;
    }

    // Create room
    if (method === 'POST' && (action === 'create' || !action)) {
      const body = await parseJsonBody(req);
      const name = body.name?.trim() || 'اتاق تمرکز گروهی';
      const focusDuration = Number(body.focusDuration) || 1500;
      const breakDuration = Number(body.breakDuration) || 300;

      const newRoom: DBFocusRoom = {
        id: 'room_' + Math.random().toString(36).substr(2, 6),
        name,
        hostId: currentUser.id,
        hostName: currentUser.name,
        focusDuration,
        breakDuration,
        timeLeft: focusDuration,
        isRunning: false,
        mode: 'focus',
        lastUpdated: Date.now(),
        participants: [
          {
            userId: currentUser.id,
            userName: currentUser.name,
            isHost: true,
            joinedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            lastPing: Date.now(),
          },
        ],
        messages: [
          {
            id: 'msg_welcome_' + Date.now(),
            userId: 'system',
            userName: 'سیستم',
            text: `اتاق «${name}» توسط ${currentUser.name} ایجاد شد. خوش آمدید!`,
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      db.focus_rooms.unshift(newRoom);
      writeDb(db);

      sendJson(res, { message: 'اتاق با موفقیت ایجاد شد.', room: newRoom }, 201);
      return true;
    }

    // Join room
    if ((method === 'POST' || method === 'GET') && (action === 'join' || pathname.endsWith('/join'))) {
      const body = method === 'POST' ? await parseJsonBody(req) : {};
      const rawRoomId = body.roomId || body.room_id || urlObj.searchParams.get('room_id') || urlObj.searchParams.get('roomId') || urlObj.searchParams.get('id');
      const roomId = (rawRoomId || '').replace(/['"]/g, '').trim().split('#')[0].split('&')[0];

      if (!roomId) {
        sendJson(res, { error: 'شناسه اتاق الزامی است.' }, 400);
        return true;
      }

      let room = db.focus_rooms.find((r) => r.id === roomId && !r.isDeleted);
      if (!room) {
        // Auto-provision room on demand so direct join NEVER fails!
        const cleanName = roomId.startsWith('room_') ? 'اتاق تمرکز مشترک' : decodeURIComponent(roomId);
        room = {
          id: roomId,
          name: cleanName,
          hostId: currentUser.id,
          hostName: currentUser.name,
          focusDuration: 1500,
          breakDuration: 300,
          timeLeft: 1500,
          isRunning: false,
          mode: 'focus',
          lastUpdated: Date.now(),
          participants: [],
          messages: [
            {
              id: 'msg_welcome_' + Date.now(),
              userId: 'system',
              userName: 'سیستم',
              text: `اتاق «${cleanName}» ایجاد شد. به تمرکز تیمی خوش آمدید! 🎯`,
              timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            },
          ],
          createdAt: new Date().toISOString(),
        };
        db.focus_rooms.unshift(room);
        writeDb(db);
      }

      const existingPart = room.participants.find((p) => p.userId === currentUser.id);
      if (!existingPart) {
        room.participants.push({
          userId: currentUser.id,
          userName: currentUser.name,
          isHost: currentUser.id === room.hostId,
          joinedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          lastPing: Date.now(),
        });
        room.messages.push({
          id: 'msg_join_' + Date.now(),
          userId: 'system',
          userName: 'سیستم',
          text: `${currentUser.name} به اتاق پیوست.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        writeDb(db);
      } else {
        existingPart.lastPing = Date.now();
        writeDb(db);
      }

      sendJson(res, { message: 'شما به اتاق ملحق شدید.', room });
      return true;
    }

    // Sync timer
    if (method === 'POST' && (action === 'sync' || action === 'timer')) {
      const body = await parseJsonBody(req);
      const roomId = body.roomId || urlObj.searchParams.get('id') || urlObj.searchParams.get('roomId') || urlObj.searchParams.get('room_id');
      const timerAction = body.timerAction || body.action || urlObj.searchParams.get('timerAction');
      const timeLeft = body.timeLeft;
      const mode = body.mode;
      const room = db.focus_rooms.find((r) => r.id === roomId && !r.isDeleted);
      if (!room) {
        sendJson(res, { error: 'اتاق یافت نشد.' }, 404);
        return true;
      }

      if (timerAction === 'start') {
        room.isRunning = true;
        room.lastUpdated = Date.now();
        if (timeLeft !== undefined) room.timeLeft = timeLeft;
        if (mode) room.mode = mode;
      } else if (timerAction === 'pause') {
        room.isRunning = false;
        room.lastUpdated = Date.now();
        if (timeLeft !== undefined) room.timeLeft = timeLeft;
      } else if (timerAction === 'reset') {
        room.isRunning = false;
        room.lastUpdated = Date.now();
        room.timeLeft = room.mode === 'focus' ? room.focusDuration : room.breakDuration;
      } else if (timerAction === 'setMode') {
        room.mode = mode || 'focus';
        room.isRunning = false;
        room.timeLeft = room.mode === 'focus' ? room.focusDuration : room.breakDuration;
        room.lastUpdated = Date.now();
      }

      writeDb(db);
      sendJson(res, { room });
      return true;
    }

    // Add message
    if (method === 'POST' && action === 'message') {
      const body = await parseJsonBody(req);
      const roomId = body.roomId || urlObj.searchParams.get('id') || urlObj.searchParams.get('roomId') || urlObj.searchParams.get('room_id');
      const text = body.text;
      if (!roomId || !text?.trim()) {
        sendJson(res, { error: 'متن پیام الزامی است.' }, 400);
        return true;
      }

      const room = db.focus_rooms.find((r) => r.id === roomId);
      if (!room) {
        sendJson(res, { error: 'اتاق یافت نشد.' }, 404);
        return true;
      }

      if (room.isDeleted) {
        sendJson(res, { error: 'امکان ارسال پیام در اتاق بسته شده وجود ندارد.' }, 400);
        return true;
      }

      const newMsg: DBRoomMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        userId: currentUser.id,
        userName: currentUser.name,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };

      room.messages.push(newMsg);
      // Keep up to 200 messages
      if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200);
      }
      writeDb(db);

      sendJson(res, { message: 'پیام ارسال شد.', room });
      return true;
    }

    // Leave room
    if (method === 'POST' && action === 'leave') {
      const body = await parseJsonBody(req);
      const roomId = body.roomId || urlObj.searchParams.get('room_id');
      const room = db.focus_rooms.find((r) => r.id === roomId);
      if (room) {
        room.participants = room.participants.filter((p) => p.userId !== currentUser.id);
        room.messages.push({
          id: 'msg_leave_' + Date.now(),
          userId: 'system',
          userName: 'سیستم',
          text: `${currentUser.name} از اتاق خارج شد.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
        writeDb(db);
      }
      sendJson(res, { message: 'از اتاق خارج شدید.' });
      return true;
    }

    // Delete room (Hosts & Admins only, with 10-minute message retention!)
    if ((method === 'POST' && (action === 'delete' || action === 'close')) || method === 'DELETE') {
      const body = method === 'POST' ? await parseJsonBody(req) : {};
      const roomId = body?.roomId || urlObj.searchParams.get('id') || urlObj.searchParams.get('roomId') || urlObj.searchParams.get('room_id');
      const room = db.focus_rooms.find((r) => r.id === roomId);
      if (!room) {
        sendJson(res, { error: 'اتاق یافت نشد.' }, 404);
        return true;
      }

      if (room.hostId !== currentUser.id && currentUser.role !== 'admin') {
        sendJson(res, { error: 'تنها میزبان یا مدیر سیستم مجاز به حذف اتاق هستند.' }, 403);
        return true;
      }

      room.isDeleted = true;
      room.deletedAt = Math.floor(Date.now() / 1000);
      room.isRunning = false;
      room.messages.push({
        id: 'msg_del_' + Date.now(),
        userId: 'system',
        userName: 'سیستم',
        text: `این اتاق توسط ${currentUser.name} بسته شد. پیام‌ها طبق سیاست سیستم تا ۱۰ دقیقه در سرور محفوظ مانده و سپس به طور کامل پاکسازی خواهند شد.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
      writeDb(db);

      sendJson(res, {
        message: 'اتاق با موفقیت بسته شد. پیام‌ها به مدت ۱۰ دقیقه تا پاکسازی کامل در سرور نگه‌داری می‌شوند.',
        room,
      });
      return true;
    }
  }

  // 4. Team Projects routes (/api/projects)
  if (pathname.startsWith('/api/projects')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
      return true;
    }

    // List user projects with task progress stats
    if (method === 'GET') {
      const action = urlObj.searchParams.get('action') || '';
      if (action === 'messages' || urlObj.searchParams.has('project_id')) {
        const pId = urlObj.searchParams.get('project_id') || urlObj.searchParams.get('id');
        const msgs = (db.project_messages || []).filter((m) => m.projectId === pId);
        sendJson(res, { messages: msgs });
        return true;
      }

      const isAdmin = currentUser.role === 'admin';
      const visible = db.projects.filter(
        (p) => isAdmin || p.creatorId === currentUser.id || (p.memberIds && p.memberIds.includes(currentUser.id))
      );

      const enriched = visible.map((p) => {
        const projectTasks = db.tasks.filter((t) => t.projectId === p.id);
        const total = projectTasks.length;
        const done = projectTasks.filter((t) => t.completed).length;
        return {
          ...p,
          totalTasks: total,
          completedTasks: done,
          progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      });

      sendJson(res, { projects: enriched });
      return true;
    }

    // Create team project / project group chat
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const action = urlObj.searchParams.get('action') || body.action;

      // Group chat message inside team project
      if (action === 'messages' || action === 'send_message') {
        const projectId = body.projectId || urlObj.searchParams.get('project_id');
        const text = body.text?.trim();
        if (!projectId || !text) {
          sendJson(res, { error: 'شناسه پروژه و متن پیام الزامی است.' }, 400);
          return true;
        }
        const newMsg = {
          id: 'pmsg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          projectId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar || null,
          text,
          createdAt: new Date().toISOString(),
        };
        if (!db.project_messages) db.project_messages = [];
        db.project_messages.push(newMsg);
        writeDb(db);
        sendJson(res, { message: 'پیام تیمی ارسال شد.', data: newMsg }, 201);
        return true;
      }

      // Free plan restriction: max 1 project
      if (currentUser.role !== 'admin' && (!currentUser.subscription || currentUser.subscription.plan !== 'pro')) {
        const myProjects = db.projects.filter((p) => p.creatorId === currentUser.id);
        if (myProjects.length >= 1) {
          sendJson(res, { error: 'در پلن رایگان فقط مجاز به ایجاد ۱ پروژه تیمی هستید. جهت ایجاد پروژه‌های نامحدود، حساب خود را ارتقا دهید.' }, 403);
          return true;
        }
      }

      const name = body.name?.trim();
      if (!name) {
        sendJson(res, { error: 'نام پروژه تیمی الزامی است.' }, 400);
        return true;
      }

      const memberIds = Array.isArray(body.memberIds) ? body.memberIds : [currentUser.id];
      if (!memberIds.includes(currentUser.id)) {
        memberIds.push(currentUser.id);
      }

      const newProj: DBTeamProject = {
        id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        description: body.description?.trim() || '',
        color: body.color || '#6366f1',
        icon: body.icon || 'FolderKanban',
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        memberIds,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        totalTasks: 0,
        completedTasks: 0,
        progressPercent: 0,
      };

      db.projects.unshift(newProj);
      writeDb(db);

      sendJson(res, { message: 'پروژه تیمی با موفقیت ایجاد شد.', project: newProj }, 201);
      return true;
    }

    // Update team project
    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id;
      const proj = db.projects.find((p) => p.id === id);
      if (!proj) {
        sendJson(res, { error: 'پروژه پیدا نشد.' }, 404);
        return true;
      }

      if (proj.creatorId !== currentUser.id && currentUser.role !== 'admin') {
        sendJson(res, { error: 'تنها ایجادکننده پروژه یا مدیر مجاز به ویرایش هستند.' }, 403);
        return true;
      }

      if (body.name !== undefined) proj.name = body.name.trim();
      if (body.description !== undefined) proj.description = body.description.trim();
      if (body.color !== undefined) proj.color = body.color;
      if (body.icon !== undefined) proj.icon = body.icon;
      if (Array.isArray(body.memberIds)) proj.memberIds = body.memberIds;

      writeDb(db);
      sendJson(res, { message: 'پروژه تیمی به‌روزرسانی شد.', project: proj });
      return true;
    }

    // Delete team project
    if (method === 'DELETE') {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const pathId = pathParts.length > 1 && pathParts[pathParts.length - 1] !== 'projects' ? pathParts[pathParts.length - 1] : null;
      const id = urlObj.searchParams.get('id') || pathId;
      const proj = db.projects.find((p) => p.id === id);
      if (!proj) {
        sendJson(res, { error: 'پروژه پیدا نشد.' }, 404);
        return true;
      }

      if (proj.creatorId !== currentUser.id && currentUser.role !== 'admin') {
        sendJson(res, { error: 'تنها ایجادکننده پروژه یا مدیر مجاز به حذف هستند.' }, 403);
        return true;
      }

      db.projects = db.projects.filter((p) => p.id !== id);
      // Unlink tasks associated with this project
      for (const t of db.tasks) {
        if (t.projectId === id) {
          t.projectId = null;
        }
      }

      writeDb(db);
      sendJson(res, { message: 'پروژه تیمی با موفقیت حذف شد.' });
      return true;
    }
  }

  // 5. Tasks routes
  if (pathname.startsWith('/api/tasks')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد شوید.' }, 401);
      return true;
    }

    if (method === 'GET') {
      let filtered = [...db.tasks];
      const targetUserId = urlObj.searchParams.get('user_id');
      const projectIdFilter = urlObj.searchParams.get('project_id');

      if (currentUser.role === 'admin') {
        if (targetUserId) {
          filtered = filtered.filter((t) => t.userId === targetUserId);
        }
      } else {
        filtered = filtered.filter((t) => t.userId === currentUser.id);
      }

      const dateFilter = urlObj.searchParams.get('date');
      if (dateFilter) {
        filtered = filtered.filter((t) => t.date === dateFilter);
      }

      const catFilter = urlObj.searchParams.get('category_id');
      if (catFilter) {
        filtered = filtered.filter((t) => t.categoryId === catFilter);
      }

      if (projectIdFilter) {
        filtered = filtered.filter((t) => t.projectId === projectIdFilter);
      }

      // Populate user name and project name
      const result = filtered.map((t) => {
        const u = db.users.find((user) => user.id === t.userId);
        const p = t.projectId ? db.projects.find((proj) => proj.id === t.projectId) : null;
        return {
          ...t,
          userName: u?.name || 'کاربر',
          projectName: p?.name || '',
        };
      });

      sendJson(res, { tasks: result });
      return true;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const title = body.title?.trim();
      if (!title) {
        sendJson(res, { error: 'عنوان تسک الزامی است.' }, 400);
        return true;
      }

      let targetUserId = currentUser.id;
      if (currentUser.role === 'admin' && body.userId) {
        targetUserId = body.userId;
      }

      const projectId = body.projectId || null;
      const project = projectId ? db.projects.find((p) => p.id === projectId) : null;

      const newTask: DBTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId: targetUserId,
        projectId,
        title,
        description: body.description?.trim(),
        date: body.date || new Date().toISOString().slice(0, 10),
        time: body.time,
        durationMinutes: body.durationMinutes || 0,
        completed: false,
        priority: body.priority || 'medium',
        categoryId: body.categoryId || 'cat-work',
        isPinned: !!body.isPinned,
        focusMinutesSpent: 0,
        subtasks: body.subtasks || [],
        createdAt: new Date().toISOString(),
      };

      db.tasks.unshift(newTask);
      writeDb(db);

      const u = db.users.find((user) => user.id === targetUserId);
      sendJson(res, {
        message: 'تسک با موفقیت اضافه شد.',
        task: {
          ...newTask,
          userName: u?.name || 'کاربر',
          projectName: project?.name || '',
        },
      }, 201);
      return true;
    }

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id;
      const taskIndex = db.tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        sendJson(res, { error: 'تسک پیدا نشد.' }, 404);
        return true;
      }

      const existing = db.tasks[taskIndex];
      if (currentUser.role !== 'admin' && existing.userId !== currentUser.id) {
        sendJson(res, { error: 'عدم دسترسی.' }, 403);
        return true;
      }

      db.tasks[taskIndex] = {
        ...existing,
        ...body,
        projectId: body.projectId !== undefined ? body.projectId : existing.projectId,
        userId: currentUser.role === 'admin' && body.userId ? body.userId : existing.userId,
      };

      writeDb(db);
      sendJson(res, { message: 'تسک به‌روزرسانی شد.', task: db.tasks[taskIndex] });
      return true;
    }

    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const id = urlObj.searchParams.get('id') || body.id;
      const action = urlObj.searchParams.get('action') || body.action || 'toggle';

      const task = db.tasks.find((t) => t.id === id);
      if (!task) {
        sendJson(res, { error: 'تسک پیدا نشد.' }, 404);
        return true;
      }

      if (action === 'toggle') {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : undefined;
      } else if (action === 'addFocus') {
        const mins = Number(body.minutes || 25);
        task.focusMinutesSpent = (task.focusMinutesSpent || 0) + mins;
      }

      writeDb(db);
      sendJson(res, { completed: task.completed, completedAt: task.completedAt, task });
      return true;
    }

    if (method === 'DELETE') {
      const id = urlObj.searchParams.get('id');
      if (!id) {
        sendJson(res, { error: 'شناسه تسک الزامی است.' }, 400);
        return true;
      }

      const task = db.tasks.find((t) => t.id === id);
      if (!task) {
        sendJson(res, { error: 'تسک پیدا نشد.' }, 404);
        return true;
      }

      if (currentUser.role !== 'admin' && task.userId !== currentUser.id) {
        sendJson(res, { error: 'عدم دسترسی.' }, 403);
        return true;
      }

      db.tasks = db.tasks.filter((t) => t.id !== id);
      writeDb(db);
      sendJson(res, { message: 'تسک حذف شد.' });
      return true;
    }
  }

  // 6. Categories
  if (pathname.startsWith('/api/categories')) {
    if (method === 'GET') {
      sendJson(res, { categories: db.categories });
      return true;
    }
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const name = body.name?.trim();
      if (!name) {
        sendJson(res, { error: 'نام دسته‌بندی الزامی است.' }, 400);
        return true;
      }
      const newCat: DBCategory = {
        id: 'cat_' + Date.now(),
        name,
        color: body.color || '#6366f1',
        icon: body.icon || 'Folder',
        isDefault: false,
      };
      db.categories.push(newCat);
      writeDb(db);
      sendJson(res, { category: newCat }, 201);
      return true;
    }
  }

  // 7. Stats
  if (pathname.startsWith('/api/stats')) {
    const today = new Date().toISOString().slice(0, 10);
    const targetUserId = urlObj.searchParams.get('user_id');

    let relevantTasks = db.tasks;
    if (currentUser?.role === 'admin') {
      if (targetUserId) {
        relevantTasks = relevantTasks.filter((t) => t.userId === targetUserId);
      }
    } else if (currentUser) {
      relevantTasks = relevantTasks.filter((t) => t.userId === currentUser.id);
    }

    const totalTasks = relevantTasks.length;
    const totalCompleted = relevantTasks.filter((t) => t.completed).length;
    const todayTasks = relevantTasks.filter((t) => t.date === today);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;
    const focusMinutes = relevantTasks.reduce((s, t) => s + (t.focusMinutesSpent || 0), 0);

    sendJson(res, {
      totalTasks,
      totalCompleted,
      overallRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      todayTotal: todayTasks.length,
      todayCompleted,
      todayRate: todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0,
      focusMinutes,
      totalUsers: db.users.length,
    });
    return true;
  }

  // 8. Career Goals routes (/api/goals)
  if (pathname.startsWith('/api/goals')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد شوید.' }, 401);
      return true;
    }

    if (method === 'GET') {
      const targetUserId = (currentUser.role === 'admin' && urlObj.searchParams.get('user_id')) || currentUser.id;
      const goals = db.goals.filter((g) => g.userId === targetUserId);
      sendJson(res, { goals });
      return true;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const title = body.title?.trim();
      const period = body.period || 'quarterly';
      if (!title) {
        sendJson(res, { error: 'عنوان هدف الزامی است.' }, 400);
        return true;
      }

      const newGoal: DBCareerGoal = {
        id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        userId: currentUser.id,
        title,
        period,
        progress: Number(body.progress || 0),
        targetDate: body.targetDate,
        completed: Boolean(body.completed),
        createdAt: new Date().toISOString(),
      };
      db.goals.push(newGoal);
      writeDb(db);
      sendJson(res, { goal: newGoal }, 201);
      return true;
    }

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id;
      const goalIndex = db.goals.findIndex((g) => g.id === id);
      if (goalIndex === -1) {
        sendJson(res, { error: 'هدف پیدا نشد.' }, 404);
        return true;
      }
      const existing = db.goals[goalIndex];
      if (currentUser.role !== 'admin' && existing.userId !== currentUser.id) {
        sendJson(res, { error: 'عدم دسترسی.' }, 403);
        return true;
      }
      db.goals[goalIndex] = {
        ...existing,
        ...body,
        userId: existing.userId,
      };
      writeDb(db);
      sendJson(res, { goal: db.goals[goalIndex] });
      return true;
    }

    if (method === 'DELETE') {
      const id = urlObj.searchParams.get('id');
      const goalIndex = db.goals.findIndex((g) => g.id === id);
      if (goalIndex === -1) {
        sendJson(res, { error: 'هدف پیدا نشد.' }, 404);
        return true;
      }
      const existing = db.goals[goalIndex];
      if (currentUser.role !== 'admin' && existing.userId !== currentUser.id) {
        sendJson(res, { error: 'عدم دسترسی.' }, 403);
        return true;
      }
      db.goals.splice(goalIndex, 1);
      writeDb(db);
      sendJson(res, { message: 'هدف با موفقیت حذف شد.' });
      return true;
    }
  }

  // 9. Daily Notes & Habits (/api/notes)
  if (pathname.startsWith('/api/notes')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد شوید.' }, 401);
      return true;
    }

    if (method === 'GET') {
      const date = urlObj.searchParams.get('date') || new Date().toISOString().slice(0, 10);
      const note = db.dailyNotes.find((n) => n.userId === currentUser.id && n.date === date) || {
        id: '',
        userId: currentUser.id,
        date,
        content: '',
        habitsCompleted: [],
        updatedAt: '',
      };
      sendJson(res, { note });
      return true;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const date = body.date || new Date().toISOString().slice(0, 10);
      const content = body.content || '';
      const habitsCompleted = Array.isArray(body.habitsCompleted) ? body.habitsCompleted : [];

      let note = db.dailyNotes.find((n) => n.userId === currentUser.id && n.date === date);
      if (note) {
        note.content = content;
        note.habitsCompleted = habitsCompleted;
        note.updatedAt = new Date().toISOString();
      } else {
        note = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          userId: currentUser.id,
          date,
          content,
          habitsCompleted,
          updatedAt: new Date().toISOString(),
        };
        db.dailyNotes.push(note);
      }
      writeDb(db);
      sendJson(res, { note });
      return true;
    }
  }

  // 10. Personality Assessment (/api/personality)
  if (pathname.startsWith('/api/personality')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد شوید.' }, 401);
      return true;
    }

    if (method === 'GET') {
      const result = db.personalityResults.find((p) => p.userId === currentUser.id) || null;
      sendJson(res, { result });
      return true;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const primaryType = body.primaryType || 'استراتژیست تحلیلی';
      const scores = body.scores || {};
      const recommendations = Array.isArray(body.recommendations) ? body.recommendations : [];

      let item = db.personalityResults.find((p) => p.userId === currentUser.id);
      if (item) {
        item.primaryType = primaryType;
        item.scores = scores;
        item.recommendations = recommendations;
        item.completedAt = new Date().toISOString();
      } else {
        item = {
          id: 'pers_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          userId: currentUser.id,
          primaryType,
          scores,
          recommendations,
          completedAt: new Date().toISOString(),
        };
        db.personalityResults.push(item);
      }
      writeDb(db);
      sendJson(res, { result: item });
      return true;
    }
  }

  // 11. Global Settings (/api/settings)
  if (pathname.startsWith('/api/settings')) {
    const action = urlObj.searchParams.get('action');
    if (method === 'GET' && (action === 'global' || !action)) {
      sendJson(res, { settings: db.globalSettings || INITIAL_DATA.globalSettings });
      return true;
    }

    if (method === 'POST' && (action === 'global' || !action)) {
      if (!currentUser || currentUser.role !== 'admin') {
        sendJson(res, { error: 'تنها مدیر ارشد مجاز به تغییر تنظیمات سراسری سیستم است.' }, 403);
        return true;
      }
      const body = await parseJsonBody(req);
      db.globalSettings = { ...(db.globalSettings || {}), ...body, updatedAt: new Date().toISOString() };
      writeDb(db);
      sendJson(res, { message: 'تنظیمات سراسری سیستم با موفقیت اعمال گردید.', settings: db.globalSettings });
      return true;
    }
  }

  // 12. Fonts Hub & Upload (/api/fonts)
  if (pathname.startsWith('/api/fonts')) {
    const action = urlObj.searchParams.get('action');

    // Get all custom fonts
    if (method === 'GET') {
      sendJson(res, { fonts: db.custom_fonts || [] });
      return true;
    }

    // Upload custom font file
    if (method === 'POST' && (action === 'upload' || pathname.endsWith('/upload'))) {
      const body = await parseJsonBody(req);
      const filename = body.filename || `font_${Date.now()}.woff2`;
      const dataUrl = body.dataUrl || '';
      const name = body.name?.trim() || filename.split('.')[0];
      const family = body.family?.trim() || name;
      const description = body.description?.trim() || 'فونت سفارشی آپلود شده در سامانه';

      let cleanFileName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!cleanFileName.match(/\.(woff2|woff|ttf|otf)$/i)) {
        cleanFileName += '.woff2';
      }

      // Save file if dataUrl provided
      if (dataUrl && dataUrl.includes('base64,')) {
        try {
          const base64Data = dataUrl.split('base64,')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fontsDir = path.resolve(process.cwd(), 'public/fonts');
          if (!fs.existsSync(fontsDir)) {
            fs.mkdirSync(fontsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(fontsDir, cleanFileName), buffer);

          const distFontsDir = path.resolve(process.cwd(), 'dist/fonts');
          if (fs.existsSync(distFontsDir)) {
            fs.writeFileSync(path.join(distFontsDir, cleanFileName), buffer);
          }
        } catch (err) {
          console.error('Failed to write uploaded font file:', err);
        }
      }

      const newFont = {
        id: 'font_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        family,
        fontUrl: `/fonts/${cleanFileName}`,
        dataUrl: dataUrl || undefined,
        description,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      if (!db.custom_fonts) db.custom_fonts = [];
      db.custom_fonts.push(newFont);
      writeDb(db);

      sendJson(res, { message: 'فونت با موفقیت آپلود و در سامانه فعال گردید.', font: newFont }, 201);
      return true;
    }

    // Save/Add custom font metadata or URL
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const name = body.name?.trim();
      const family = body.family?.trim() || name;
      const fontUrl = body.fontUrl?.trim();
      const description = body.description?.trim() || 'فونت سفارشی وب';

      if (!name) {
        sendJson(res, { error: 'نام فونت الزامی است.' }, 400);
        return true;
      }

      const newFont = {
        id: body.id || 'font_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        family,
        fontUrl,
        dataUrl: body.dataUrl,
        description,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      if (!db.custom_fonts) db.custom_fonts = [];
      const idx = db.custom_fonts.findIndex((f) => f.id === newFont.id || f.name.toLowerCase() === newFont.name.toLowerCase());
      if (idx >= 0) {
        db.custom_fonts[idx] = newFont;
      } else {
        db.custom_fonts.push(newFont);
      }
      writeDb(db);
      sendJson(res, { message: 'فونت سفارشی ذخیره شد.', font: newFont }, 201);
      return true;
    }

    // Delete custom font
    if (method === 'DELETE') {
      const id = urlObj.searchParams.get('id');
      if (!id) {
        sendJson(res, { error: 'شناسه فونت الزامی است.' }, 400);
        return true;
      }
      if (db.custom_fonts) {
        db.custom_fonts = db.custom_fonts.filter((f) => f.id !== id);
        writeDb(db);
      }
      sendJson(res, { message: 'فونت سفارشی حذف شد.' });
      return true;
    }
  }

  // 13. Android APK Builder & Download (/api/apk)
  if (pathname.startsWith('/api/apk')) {
    const action = urlObj.searchParams.get('action') || 'status';
    const apkPath = path.join(process.cwd(), 'public', 'TaskRooz.apk');
    const exists = fs.existsSync(apkPath);
    const size = exists ? fs.statSync(apkPath).size : 0;

    if (action === 'status') {
      sendJson(res, {
        status: 'ready',
        appName: 'تسک‌روز',
        packageName: 'com.taskrooz.app',
        version: '1.0.0',
        apkExists: exists,
        sizeBytes: size,
        sizeFormatted: exists ? `${Math.round(size / 1024)} KB` : '0 KB',
        downloadUrl: '/TaskRooz.apk',
      });
      return true;
    }

    if (action === 'download' || action === 'build') {
      if (exists) {
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="TaskRooz.apk"',
          'Content-Length': size,
        });
        const stream = fs.createReadStream(apkPath);
        stream.pipe(res);
        return true;
      }
      sendJson(res, { error: 'فایل APK یافت نشد.' }, 404);
      return true;
    }
  }

  // 14. Friends & Colleague Network (/api/friends)
  if (pathname.startsWith('/api/friends')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
      return true;
    }
    const myId = currentUser.id;
    const action = urlObj.searchParams.get('action') || '';

    // GET /api/friends?action=requests or /api/friends/requests or ?type=incoming
    if (method === 'GET' && (action === 'requests' || action === 'incoming' || urlObj.searchParams.get('type') === 'incoming' || pathname.endsWith('/requests'))) {
      const incoming = (db.friend_requests || []).filter((r) => r.toUserId === myId && r.status === 'pending');
      const outgoing = (db.friend_requests || []).filter((r) => r.fromUserId === myId);
      sendJson(res, { requests: incoming, incoming, outgoing });
      return true;
    }

    // GET /api/friends (list my accepted friends)
    if (method === 'GET') {
      const friendIds = new Set<string>();
      (db.friendships || []).forEach((f) => {
        if (f.user1Id === myId) friendIds.add(f.user2Id);
        if (f.user2Id === myId) friendIds.add(f.user1Id);
      });
      const friendsList = (db.users || [])
        .filter((u) => friendIds.has(u.id))
        .map((u) => ({
          id: u.id,
          numericId: u.numericId || 1000,
          name: u.name,
          username: u.username,
          avatar: u.avatar || null,
          jobTitle: u.jobTitle || null,
          phone: u.phone || null,
          role: u.role || 'user',
          subscription: u.subscription || { plan: 'free' },
          online: true,
        }));
      sendJson(res, { friends: friendsList });
      return true;
    }

    // POST /api/friends (request, accept, reject)
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const postAction = body.action || action;

      // Send friend request or project invite
      if (postAction === 'request' || postAction === 'send' || postAction === 'send_request') {
        const toUserId = body.toUserId || body.receiverId || body.userId;
        if (!toUserId || toUserId === myId) {
          sendJson(res, { error: 'کاربر مقصد نامعتبر است.' }, 400);
          return true;
        }

        const isAlreadyFriend = (db.friendships || []).some(
          (f) => (f.user1Id === myId && f.user2Id === toUserId) || (f.user2Id === myId && f.user1Id === toUserId)
        );

        if (isAlreadyFriend) {
          if (body.projectId) {
            const p = (db.projects || []).find((proj) => proj.id === body.projectId);
            if (p && !p.memberIds.includes(toUserId)) {
              p.memberIds.push(toUserId);
              writeDb(db);
            }
          }
          sendJson(res, { message: 'این کاربر در لیست همکاران شما قرار دارد.', isFriend: true });
          return true;
        }

        const newReq = {
          id: 'freq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          fromUserId: myId,
          fromUserName: currentUser.name,
          fromUserUsername: currentUser.username,
          fromUserAvatar: currentUser.avatar || null,
          toUserId,
          projectId: body.projectId || undefined,
          projectName: body.projectName || undefined,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        };

        if (!db.friend_requests) db.friend_requests = [];
        db.friend_requests.push(newReq);
        writeDb(db);
        sendJson(res, { message: 'درخواست با موفقیت ارسال شد.', request: newReq }, 201);
        return true;
      }

      // Accept request
      if (postAction === 'accept' || postAction === 'accept_request') {
        const reqId = body.requestId || body.id;
        const reqItem = (db.friend_requests || []).find((r) => r.id === reqId && r.toUserId === myId);
        if (!reqItem) {
          sendJson(res, { error: 'درخواست یافت نشد.' }, 404);
          return true;
        }
        reqItem.status = 'accepted';

        if (!db.friendships) db.friendships = [];
        const exists = db.friendships.some(
          (f) => (f.user1Id === reqItem.fromUserId && f.user2Id === myId) || (f.user2Id === reqItem.fromUserId && f.user1Id === myId)
        );
        if (!exists) {
          db.friendships.push({
            id: 'fs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            user1Id: reqItem.fromUserId,
            user2Id: myId,
            createdAt: new Date().toISOString(),
          });
        }

        if (reqItem.projectId) {
          const proj = (db.projects || []).find((p) => p.id === reqItem.projectId);
          if (proj && !proj.memberIds.includes(myId)) {
            proj.memberIds.push(myId);
          }
        }
        writeDb(db);
        sendJson(res, { message: 'درخواست همکاری با موفقیت پذیرفته شد.' });
        return true;
      }

      // Reject request
      if (postAction === 'reject' || postAction === 'reject_request') {
        const reqId = body.requestId || body.id;
        const reqItem = (db.friend_requests || []).find((r) => r.id === reqId && r.toUserId === myId);
        if (reqItem) {
          reqItem.status = 'rejected';
          writeDb(db);
        }
        sendJson(res, { message: 'درخواست رد شد.' });
        return true;
      }
    }

    // DELETE /api/friends?id=FRIEND_ID
    if (method === 'DELETE') {
      const friendId = urlObj.searchParams.get('id');
      if (friendId && db.friendships) {
        db.friendships = db.friendships.filter(
          (f) => !(f.user1Id === myId && f.user2Id === friendId) && !(f.user2Id === myId && f.user1Id === friendId)
        );
        writeDb(db);
      }
      sendJson(res, { message: 'کاربر از لیست دوستان حذف شد.' });
      return true;
    }
  }

  // 15. Direct Real-time User-to-User Messages (/api/messages)
  if (pathname.startsWith('/api/messages')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد حساب کاربری خود شوید.' }, 401);
      return true;
    }
    const myId = currentUser.id;

    if (method === 'GET') {
      const withUserId = urlObj.searchParams.get('with') || urlObj.searchParams.get('chatWith') || urlObj.searchParams.get('userId');
      if (withUserId) {
        const conv = (db.messages || []).filter(
          (m) =>
            (m.senderId === myId && m.receiverId === withUserId) ||
            (m.senderId === withUserId && m.receiverId === myId)
        );
        let changed = false;
        conv.forEach((m) => {
          if (m.receiverId === myId && !m.read) {
            m.read = true;
            changed = true;
          }
        });
        if (changed) writeDb(db);
        sendJson(res, { messages: conv });
        return true;
      }

      // Summary of conversations
      const partnersMap = new Map<string, { lastMessage: any; unreadCount: number }>();
      (db.messages || []).forEach((m) => {
        if (m.senderId === myId || m.receiverId === myId) {
          const partnerId = m.senderId === myId ? m.receiverId : m.senderId;
          const entry = partnersMap.get(partnerId) || { lastMessage: null, unreadCount: 0 };
          entry.lastMessage = m;
          if (m.receiverId === myId && !m.read) {
            entry.unreadCount++;
          }
          partnersMap.set(partnerId, entry);
        }
      });

      const convos = Array.from(partnersMap.entries()).map(([partnerId, data]) => {
        const partner = (db.users || []).find((u) => u.id === partnerId);
        return {
          partnerId,
          partnerName: partner?.name || 'کاربر',
          partnerUsername: partner?.username || '',
          partnerAvatar: partner?.avatar || null,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount,
        };
      });
      sendJson(res, { conversations: convos });
      return true;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const receiverId = body.receiverId;
      const text = body.text?.trim();
      if (!receiverId || !text) {
        sendJson(res, { error: 'گیرنده و متن پیام الزامی است.' }, 400);
        return true;
      }
      const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        senderId: myId,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar || null,
        receiverId,
        text,
        createdAt: new Date().toISOString(),
        read: false,
      };
      if (!db.messages) db.messages = [];
      db.messages.push(newMsg);
      writeDb(db);
      sendJson(res, { message: 'پیام ارسال شد.', data: newMsg }, 201);
      return true;
    }
  }

  sendJson(res, { error: 'آدرس نامعتبر است.' }, 404);
  return true;
}
