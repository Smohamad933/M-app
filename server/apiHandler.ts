import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

interface DBUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface DBTask {
  id: string;
  userId: string;
  projectId?: string | null;
  projectName?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: string;
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

interface AppData {
  users: DBUser[];
  tasks: DBTask[];
  categories: DBCategory[];
  focus_rooms: DBFocusRoom[];
  projects: DBTeamProject[];
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
  focus_rooms: [],
  projects: [
    {
      id: 'proj_alpha_1',
      name: 'پروژه آلفا (توسعه تسک‌روز)',
      description: 'طراحی رابط کاربری مدرن، سیستم تمرکز گروهی پومودورو و مدیریت پروژه‌ها',
      color: '#6366f1',
      icon: 'FolderKanban',
      creatorId: 'usr_admin_mohusyn',
      creatorName: 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
      memberIds: ['usr_admin_mohusyn'],
      createdAt: new Date().toISOString().slice(0, 10),
    },
  ],
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
      if (!parsed.focus_rooms) parsed.focus_rooms = [];
      if (!parsed.projects) parsed.projects = INITIAL_DATA.projects;

      if (purgeExpiredDeletedRooms(parsed)) {
        writeDb(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
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
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const userId = decoded.split(':')[0];
      return db.users.find((u) => u.id === userId) || null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!req.url?.startsWith('/api')) {
    return false;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method?.toUpperCase();
  const db = readDb();
  const currentUser = getUserFromToken(req, db);

  // 1. Auth routes
  if (pathname.startsWith('/api/auth')) {
    const action = urlObj.searchParams.get('action');

    if (method === 'POST' && (action === 'login' || !action)) {
      const body = await parseJsonBody(req);
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
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      });
      return true;
    }

    if (method === 'POST' && action === 'register') {
      const body = await parseJsonBody(req);
      const username = body.username?.trim();
      const password = body.password?.trim();
      const name = body.name?.trim();

      if (!username || !password || !name) {
        sendJson(res, { error: 'تمامی فیلدها الزامی هستند.' }, 400);
        return true;
      }

      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        sendJson(res, { error: 'این نام کاربری قبلاً ثبت شده است.' }, 400);
        return true;
      }

      const newUser: DBUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        username,
        password,
        name,
        role: 'user', // Always user, never admin!
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      writeDb(db);

      const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
      sendJson(res, {
        message: 'ثبت‌نام با موفقیت انجام شد.',
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        token,
      }, 201);
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
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
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

  // 2. Users routes (Admin only)
  if (pathname.startsWith('/api/users')) {
    if (!currentUser || currentUser.role !== 'admin') {
      sendJson(res, { error: 'دسترسی فقط برای مدیر سیستم مجاز است.' }, 403);
      return true;
    }

    if (method === 'GET') {
      const result = db.users.map((u) => {
        const userTasks = db.tasks.filter((t) => t.userId === u.id);
        const done = userTasks.filter((t) => t.completed).length;
        const total = userTasks.length;
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
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
      const body = await parseJsonBody(req);
      const username = body.username?.trim();
      const password = body.password?.trim();
      const name = body.name?.trim();
      const role = body.role === 'admin' ? 'admin' : 'user';

      if (!username || !password || !name) {
        sendJson(res, { error: 'تمامی فیلدها الزامی هستند.' }, 400);
        return true;
      }

      if (db.users.some((u) => u.username === username)) {
        sendJson(res, { error: 'این نام کاربری قبلاً ثبت شده است.' }, 400);
        return true;
      }

      const newUser: DBUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        username,
        password,
        name,
        role,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      writeDb(db);

      sendJson(res, {
        message: 'کاربر جدید با موفقیت ایجاد شد.',
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
          totalTasks: 0,
          completedTasks: 0,
          progressPercent: 0,
        },
      }, 201);
      return true;
    }

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
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
      const id = urlObj.searchParams.get('id');
      if (!id) {
        sendJson(res, { error: 'شناسه کاربر الزامی است.' }, 400);
        return true;
      }
      if (id === currentUser.id) {
        sendJson(res, { error: 'امکان حذف حساب کاربری جاری وجود ندارد.' }, 400);
        return true;
      }
      db.users = db.users.filter((u) => u.id !== id);
      db.tasks = db.tasks.filter((t) => t.userId !== id);
      writeDb(db);
      sendJson(res, { message: 'کاربر و تسک‌های مرتبط با موفقیت حذف شدند.' });
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
    if (method === 'POST' && action === 'create') {
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
    if (method === 'POST' && action === 'join') {
      const body = await parseJsonBody(req);
      const roomId = body.roomId || urlObj.searchParams.get('room_id');
      const room = db.focus_rooms.find((r) => r.id === roomId && !r.isDeleted);
      if (!room) {
        sendJson(res, { error: 'اتاق مورد نظر یافت نشد یا پاک شده است.' }, 404);
        return true;
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
      }

      sendJson(res, { message: 'شما به اتاق ملحق شدید.', room });
      return true;
    }

    // Sync timer
    if (method === 'POST' && action === 'sync') {
      const body = await parseJsonBody(req);
      const { roomId, timerAction, timeLeft, mode } = body;
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
      const { roomId, text } = body;
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
    if (method === 'POST' && (action === 'delete' || action === 'close')) {
      const body = await parseJsonBody(req);
      const roomId = body.roomId || urlObj.searchParams.get('room_id');
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

    // Create team project
    if (method === 'POST') {
      const body = await parseJsonBody(req);
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
      const id = urlObj.searchParams.get('id');
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
      sendJson(res, { task });
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

  sendJson(res, { error: 'آدرس نامعتبر است.' }, 404);
  return true;
}
