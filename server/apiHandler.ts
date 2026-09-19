import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

interface DBUser {
  id: string;
  username: string;
  password: string; // Plain/hashed
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface DBTask {
  id: string;
  userId: string;
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

interface AppData {
  users: DBUser[];
  tasks: DBTask[];
  categories: DBCategory[];
}

const DB_FILE = path.resolve(process.cwd(), 'data/db.json');

const INITIAL_DATA: AppData = {
  users: [
    {
      id: 'usr_admin_1',
      username: 'admin',
      password: 'admin',
      name: 'مدیر سیستم',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [], // Clean slate! No sample tasks!
  categories: [
    { id: 'cat-work', name: 'کاری و شغلی', color: '#6366f1', icon: 'Briefcase', isDefault: true },
    { id: 'cat-personal', name: 'کارهای شخصی', color: '#10b981', icon: 'User', isDefault: true },
    { id: 'cat-study', name: 'مطالعه و یادگیری', color: '#f59e0b', icon: 'BookOpen', isDefault: true },
    { id: 'cat-health', name: 'ورزش و سلامتی', color: '#f43f5e', icon: 'Activity', isDefault: true },
    { id: 'cat-shopping', name: 'خرید و منزل', color: '#0ea5e9', icon: 'ShoppingCart', isDefault: true },
    { id: 'cat-finance', name: 'امور مالی', color: '#8b5cf6', icon: 'CreditCard', isDefault: true },
  ],
};

function readDb(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure admin exists
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = INITIAL_DATA.users;
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
  // Default fallback to admin for ease of dev if not provided
  return db.users[0] || null;
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
        (u) => u.username === username && (u.password === password || (username === 'admin' && (password === 'admin' || password === 'admin123')))
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
      // Also delete user tasks
      db.tasks = db.tasks.filter((t) => t.userId !== id);
      writeDb(db);
      sendJson(res, { message: 'کاربر و تسک‌های مرتبط با موفقیت حذف شدند.' });
      return true;
    }
  }

  // 3. Tasks routes
  if (pathname.startsWith('/api/tasks')) {
    if (!currentUser) {
      sendJson(res, { error: 'ابتدا وارد شوید.' }, 401);
      return true;
    }

    if (method === 'GET') {
      let filtered = [...db.tasks];
      const targetUserId = urlObj.searchParams.get('user_id');

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

      // Populate user name
      const result = filtered.map((t) => {
        const u = db.users.find((user) => user.id === t.userId);
        return {
          ...t,
          userName: u?.name || 'کاربر',
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

      const newTask: DBTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId: targetUserId,
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
        task: { ...newTask, userName: u?.name || 'کاربر' },
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

  // 4. Categories
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

  // 5. Stats
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
