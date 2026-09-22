// Comprehensive Integration and Stress Test Suite for TaskRooz
const http = require('http');

const BASE_URL = 'http://localhost:5173';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// 1. Authentication Tests
test('Admin Login with Mohusyn / Smosh1387', async () => {
  const res = await request('POST', '/api/auth/login', {
    username: 'Mohusyn',
    password: 'Smosh1387',
  });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.body.user.role === 'admin', `Role must be admin, got ${res.body.user.role}`);
  assert(res.body.user.username.toLowerCase() === 'mohusyn', 'Username must match Mohusyn');
  assert(typeof res.body.token === 'string' && res.body.token.length > 10, 'Valid token returned');
});

test('Login with Wrong Credentials Fails (401)', async () => {
  const res = await request('POST', '/api/auth/login', {
    username: 'Mohusyn',
    password: 'WrongPassword!',
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  assert(res.body.error, 'Error message must be present');
});

test('Regular User Registration Defaults to role: "user"', async () => {
  const uniqueUser = 'test_user_' + Date.now();
  const res = await request('POST', '/api/auth/register', {
    username: uniqueUser,
    password: 'TestPassword123',
    name: 'تست کننده سیستم',
    phone: '09120001122',
    email: 'tester@taskrooz.local',
    province: 'اصفهان',
    city: 'اصفهان',
    birthDate: '1375/02/10',
    jobTitle: 'مهندس ارشد نرم‌افزار',
    skills: ['TypeScript', 'React', 'Docker'],
    dailyTimeline: { wakeUp: '06:00', workStart: '08:00', lunch: '13:00', gym: '17:30', sleep: '23:00' },
    role: 'admin', // Malicious attempt to escalate privileges!
  });
  assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
  assert(res.body.user.role === 'user', `Crucial: user must have role 'user', got ${res.body.user.role}`);
  assert(res.body.user.jobTitle === 'مهندس ارشد نرم‌افزار', 'Job title properly stored');
  assert(res.body.user.province === 'اصفهان', 'Province properly stored');
});

// 2. Task Management & Hourly Planner
test('Task Creation, Hourly Assignment & Incomplete Reason', async () => {
  // Login as admin
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const token = loginRes.body.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // Create Task
  const createRes = await request('POST', '/api/tasks', {
    title: 'تکمیل ماژول تحلیلگر عادات',
    description: 'پیاده‌سازی نمودار ماهانه و راهکارهای جبرانی هوشمند',
    date: '2026-09-21',
    time: '14:30',
    durationMinutes: 90,
    priority: 'high',
    categoryId: 'cat-work',
  }, authHeader);

  assert(createRes.status === 201, `Expected 201 Created, got ${createRes.status}`);
  const task = createRes.body.task;
  assert(task.title === 'تکمیل ماژول تحلیلگر عادات', 'Title matches');
  assert(task.time === '14:30', 'Hourly time matches 14:30');
  assert(task.completed === false, 'Initially incomplete');

  // Toggle Task Completion
  const toggleRes = await request('PATCH', `/api/tasks?id=${task.id}&action=toggle`, {}, authHeader);
  assert(toggleRes.status === 200, `Expected 200, got ${toggleRes.status}`);
  assert(toggleRes.body.completed === true, 'Task is completed');

  // Toggle Back
  await request('PATCH', `/api/tasks?id=${task.id}&action=toggle`, {}, authHeader);

  // Set Reason for Incomplete
  const updateRes = await request('PUT', '/api/tasks', {
    id: task.id,
    reasonUncompleted: 'جلسه برنامه‌ریزی غیرمنتظره به طول انجامید',
    uncompletedCategory: 'others_priority',
  }, authHeader);
  assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);

  // Fetch Tasks and Verify
  const listRes = await request('GET', '/api/tasks?date=2026-09-21', null, authHeader);
  const found = listRes.body.tasks.find((t) => t.id === task.id);
  assert(found, 'Task must exist in list');
  assert(found.reasonUncompleted === 'جلسه برنامه‌ریزی غیرمنتظره به طول انجامید', 'Reason saved correctly');
  assert(found.uncompletedCategory === 'others_priority', 'Category saved correctly');

  // Delete Task
  const delRes = await request('DELETE', `/api/tasks?id=${task.id}`, null, authHeader);
  assert(delRes.status === 200, 'Task deleted successfully');
});

// 3. Career Goals & Daily Notes
test('Career Goals Management (CRUD)', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  // Add Goal
  const addRes = await request('POST', '/api/goals', {
    title: 'کسب مدرک بین‌المللی معماری ابری',
    period: 'quarterly',
    targetDate: '1405/09/30',
  }, authHeader);
  assert(addRes.status === 201, `Goal creation expected 201, got ${addRes.status}`);
  const goal = addRes.body.goal;
  assert(goal.period === 'quarterly', 'Period quarterly');
  assert(goal.progress === 0, 'Initial progress 0');

  // Update Goal Progress
  const updateRes = await request('PUT', '/api/goals', {
    id: goal.id,
    progress: 75,
  }, authHeader);
  assert(updateRes.status === 200, `Goal update expected 200, got ${updateRes.status}`);
  assert(updateRes.body.goal.progress === 75, 'Progress updated to 75%');

  // List Goals
  const listRes = await request('GET', '/api/goals', null, authHeader);
  assert(listRes.status === 200, 'Goals fetched');
  assert(listRes.body.goals.some((g) => g.id === goal.id), 'Created goal present in list');

  // Delete Goal
  const delRes = await request('DELETE', `/api/goals?id=${goal.id}`, null, authHeader);
  assert(delRes.status === 200, 'Goal deleted');
});

test('Daily Notes and Habit Tracking', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  const saveRes = await request('POST', '/api/notes', {
    date: '2026-09-21',
    content: 'امروز جلسات تیمی فشرده بود اما کارهای اصلی با دقت انجام شد.',
    habitsCompleted: ['water', 'workout'],
  }, authHeader);
  assert(saveRes.status === 200, 'Notes saved');

  const getRes = await request('GET', '/api/notes?date=2026-09-21', null, authHeader);
  assert(getRes.status === 200, 'Notes fetched');
  assert(getRes.body.note.content.includes('جلسات تیمی'), 'Content matches');
  assert(getRes.body.note.habitsCompleted.includes('water'), 'Habit water tracked');
});

// 4. Admin Monitoring & CSV Export
test('Admin CSV Export with Persian UTF-8 BOM', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  const csvRes = await request('GET', '/api/users/export/csv', null, authHeader);
  assert(csvRes.status === 200, `Expected 200 for CSV, got ${csvRes.status}`);
  assert(csvRes.headers['content-type'].includes('text/csv'), 'Content-type is text/csv');
  assert(typeof csvRes.body === 'string', 'Body is string');
  assert(csvRes.body.startsWith('\uFEFF'), 'CSV starts with UTF-8 BOM for Microsoft Excel');
  assert(csvRes.body.includes('ردیف,نام و نام خانوادگی'), 'Persian headers exist');
  assert(csvRes.body.includes('Mohusyn'), 'Mohusyn row exists in CSV');
});

test('Non-Admin Blocked from Admin CSV Export and Users List (403)', async () => {
  // Register regular user
  const regRes = await request('POST', '/api/auth/register', {
    username: 'regular_user_' + Date.now(),
    password: 'Password123!',
    name: 'کاربر معمولی بدون دسترسی',
  });
  const regularToken = regRes.body.token;
  const regularHeader = { Authorization: `Bearer ${regularToken}` };

  // Try to access users list
  const usersRes = await request('GET', '/api/users', null, regularHeader);
  assert(usersRes.status === 403, `Non-admin must be rejected with 403, got ${usersRes.status}`);

  // Try to access CSV export
  const exportRes = await request('GET', '/api/users/export/csv', null, regularHeader);
  assert(exportRes.status === 403, `Non-admin must be rejected with 403, got ${exportRes.status}`);
});

// 5. Pomodoro Focus Rooms & Chat
test('Group Focus Room Lifecycle & Timer Sync', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  // Create Room
  const createRoomRes = await request('POST', '/api/rooms', {
    name: 'اتاق تمرکز برنامه‌نویسان ارشد',
    focusDuration: 1500,
    breakDuration: 300,
  }, authHeader);
  assert(createRoomRes.status === 201, 'Room created');
  const room = createRoomRes.body.room;

  // Send Message
  const msgRes = await request('POST', `/api/rooms?id=${room.id}&action=message`, {
    text: 'سلام به همگی، تمرکز ۲۵ دقیقه‌ای را آغاز می‌کنیم! 🎯',
  }, authHeader);
  assert(msgRes.status === 200, 'Message sent');
  assert(msgRes.body.room.messages.some((m) => m.text.includes('تمرکز ۲۵ دقیقه‌ای')), 'Message saved');

  // Start Timer
  const timerRes = await request('POST', `/api/rooms?id=${room.id}&action=timer`, {
    action: 'start',
    timeLeft: 1500,
  }, authHeader);
  assert(timerRes.status === 200, 'Timer action handled');
  assert(timerRes.body.room.isRunning === true, 'Room timer is running');

  // Delete Room
  const delRes = await request('DELETE', `/api/rooms?id=${room.id}`, null, authHeader);
  assert(delRes.status === 200, 'Room marked deleted with 10-min message retention');
});

// Run all tests
async function run() {
  console.log(`Starting ${tests.length} automated integration tests...\n`);
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✓ PASS: ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${t.name}`);
      console.error(`    -> ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

// 6. In-house AI Habits Analyzer Stress Test
test('AI Habits Analyzer: Multiple Incomplete Reasons & Stats', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  const categories = [
    { cat: 'procrastination', reason: 'به تعویق انداختن شروع پروژه' },
    { cat: 'distraction', reason: 'چک کردن مداوم پیام‌ها و حواس‌پرتی' },
    { cat: 'low_energy', reason: 'خستگی بعد از ساعات کاری' },
    { cat: 'others_priority', reason: 'رسیدگی به کارهای فوری همکاران' },
  ];

  const createdIds = [];
  for (const item of categories) {
    const res = await request('POST', '/api/tasks', {
      title: `تسک آزمایشی ${item.cat}`,
      date: '2026-09-21',
      time: '11:00',
      categoryId: 'cat-work',
    }, authHeader);
    assert(res.status === 201, 'Task created');
    const taskId = res.body.task.id;
    createdIds.push(taskId);

    // Save Incomplete Reason
    const reasonRes = await request('PUT', '/api/tasks', {
      id: taskId,
      reasonUncompleted: item.reason,
      uncompletedCategory: item.cat,
    }, authHeader);
    assert(reasonRes.status === 200, 'Reason saved');
  }

  // Fetch all tasks and verify reasons
  const listRes = await request('GET', '/api/tasks?date=2026-09-21', null, authHeader);
  const tasks = listRes.body.tasks.filter((t) => createdIds.includes(t.id));
  assert(tasks.length === 4, 'All 4 tasks retrieved');
  assert(tasks.some((t) => t.uncompletedCategory === 'procrastination'), 'Procrastination tracked');
  assert(tasks.some((t) => t.uncompletedCategory === 'distraction'), 'Distraction tracked');
  assert(tasks.some((t) => t.uncompletedCategory === 'low_energy'), 'Low energy tracked');

  // Clean up
  for (const id of createdIds) {
    await request('DELETE', `/api/tasks?id=${id}`, null, authHeader);
  }
});

// 7. Admin Assigns Task to Regular User
test('Admin Assigns Task Directly to Regular User', async () => {
  // 1. Register regular user
  const uniqueName = 'user_target_' + Date.now();
  const regRes = await request('POST', '/api/auth/register', {
    username: uniqueName,
    password: 'TargetPass123',
    name: 'کاربر هدف انتصاب تسک',
  });
  assert(regRes.status === 201, 'Target user registered');
  const targetUserId = regRes.body.user.id;
  const targetToken = regRes.body.token;

  // 2. Admin assigns task to target user
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const assignRes = await request('POST', '/api/tasks', {
    title: 'تکمیل گزارش فصلی واحد فنی',
    description: 'توسط مدیر ارشد به شما محول شده است.',
    date: '2026-09-21',
    time: '16:00',
    priority: 'high',
    userId: targetUserId,
    categoryId: 'cat-work',
  }, adminHeader);
  assert(assignRes.status === 201, 'Admin assigned task successfully');
  const assignedTaskId = assignRes.body.task.id;

  // 3. Target user fetches tasks and verifies
  const userHeader = { Authorization: `Bearer ${targetToken}` };
  const userTasksRes = await request('GET', '/api/tasks?date=2026-09-21', null, userHeader);
  const foundTask = userTasksRes.body.tasks.find((t) => t.id === assignedTaskId);
  assert(foundTask, 'Assigned task visible in user task list');
  assert(foundTask.priority === 'high', 'Priority matches high');
  assert(foundTask.time === '16:00', 'Assigned time matches 16:00');

  // Clean up
  await request('DELETE', `/api/tasks?id=${assignedTaskId}`, null, adminHeader);
});

// 8. Personality Assessment & Career Timeline Verification
test('Personality Test & Daily Routine Timeline', async () => {
  const loginRes = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const authHeader = { Authorization: `Bearer ${loginRes.body.token}` };

  // Save Personality Test Result
  const persRes = await request('POST', '/api/personality', {
    primaryType: 'استراتژیست تحلیلی (Architect)',
    scores: { focus: 88, planning: 92, execution: 85, adaptability: 78 },
    recommendations: [
      'اختصاص بلوک‌های تمرکز عمیق ۹۰ دقیقه‌ای در ساعات آغازین صبح',
      'حذف اعلان‌های پیام‌رسان‌ها در زمان کار با کد و طراحی معماری',
    ],
  }, authHeader);
  assert(persRes.status === 200, 'Personality result saved');

  // Retrieve Personality Result
  const getPersRes = await request('GET', '/api/personality', null, authHeader);
  assert(getPersRes.status === 200, 'Personality result fetched');
  assert(getPersRes.body.result.primaryType.includes('استراتژیست'), 'Primary type matches');
  assert(getPersRes.body.result.scores.focus === 88, 'Scores match');
});

// 9. PHP Files Syntax & Structure Validation
test('PHP Standalone Files Validation', () => {
  const fs = require('fs');
  const phpFiles = [
    'install.php',
    'config.php',
    'login.php',
    'register.php',
    'dashboard.php',
    'admin.php',
    'index.php',
    'api/auth.php',
    'api/tasks.php',
    'api/users.php',
    'api/db.php',
  ];

  for (const file of phpFiles) {
    const fullPath = `./${file}`;
    assert(fs.existsSync(fullPath), `File must exist: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Basic PHP checks
    assert(content.includes('<?php'), `PHP open tag required in ${file}`);
    assert(!content.includes('<?=' ) || content.includes('?>'), `Short tags balanced in ${file}`);

    // Check for obvious syntax breakages
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    // For standalone templating files, HTML might interleave, but pure PHP blocks should be balanced
    assert(Math.abs(openBraces - closeBraces) < 5, `Brace mismatch suspicious in ${file}`);
  }
});

// 10. Admin Global Settings Enforcement
test('Admin Global Settings & Broadcast Banner Enforcement', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const updateRes = await request('POST', '/api/settings?action=global', {
    broadcastNotice: {
      enabled: true,
      title: 'جلسه اضطراری توسعه فنی',
      message: 'تمامی اعضا راس ساعت ۱۷ در اتاق تمرکز حضور به هم رسانند.',
      type: 'urgent',
    },
    enforcedFont: 'cairo',
    defaultDailyFocusMinutes: 120,
    workHoursPolicy: { start: '08:00', end: '16:30' },
    roomPolicy: { allowUserRoomCreation: true, allowPublicChat: true },
    dailyMantra: 'تمرکز تیمی حداکثری و تحقق اهداف فصلی',
  }, adminHeader);
  assert(updateRes.status === 200, 'Global settings updated by admin');

  // Any user or guest can fetch global settings
  const getRes = await request('GET', '/api/settings?action=global');
  assert(getRes.status === 200, 'Global settings fetched');
  assert(getRes.body.settings.broadcastNotice.title === 'جلسه اضطراری توسعه فنی', 'Broadcast title matches');
  assert(getRes.body.settings.enforcedFont === 'cairo', 'Enforced font matches cairo');
});

// 11. Newly Registered User Instantly Appears in Admin User List
test('New User Registration Immediately Appears in Admin Users List', async () => {
  const newUsername = 'live_member_' + Date.now();
  const regRes = await request('POST', '/api/auth/register', {
    username: newUsername,
    password: 'MemberPass123',
    name: 'عضو تازه پیوسته به سامانه',
    jobTitle: 'کارشناس تضمین کیفیت (QA)',
    city: 'شیراز',
  });
  assert(regRes.status === 201, 'New user registered');

  // Admin logs in and checks user list
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const listRes = await request('GET', '/api/users', null, adminHeader);
  assert(listRes.status === 200, 'Admin users list retrieved');
  const found = listRes.body.users.find((u) => u.username.toLowerCase() === newUsername.toLowerCase());
  assert(found, `Newly registered user '${newUsername}' MUST appear in admin user list!`);
  assert(found.jobTitle === 'کارشناس تضمین کیفیت (QA)', 'Job title matches');
  assert(found.role === 'user', 'Role is user');
});

// 12. Font Upload and Custom Fonts Hub
test('Font Upload Endpoint & Custom Fonts Storage', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const fakeWoff2 = 'd09GMgABAAAAAAYAAwAAAAAADeAA...';
  const uploadRes = await request('POST', '/api/fonts?action=upload', {
    filename: 'Sahel-Bold.woff2',
    dataUrl: 'data:font/woff2;base64,' + Buffer.from(fakeWoff2).toString('base64'),
    name: 'ساحل بولد سفارشی',
    family: 'SahelBoldCustom',
    description: 'فونت آپلود شده در تست یکپارچه',
  }, adminHeader);

  assert(uploadRes.status === 201, 'Font upload returned 201 Created');
  assert(uploadRes.body.font.name === 'ساحل بولد سفارشی', 'Font name matches');
  assert(uploadRes.body.font.fontUrl.includes('Sahel-Bold.woff2'), 'Font URL points to uploaded file');

  const getFontsRes = await request('GET', '/api/fonts');
  assert(getFontsRes.status === 200, 'Custom fonts list fetched');
  const foundFont = getFontsRes.body.fonts.find((f) => f.name === 'ساحل بولد سفارشی');
  assert(foundFont, 'Uploaded font appears in custom fonts list');
});

// 13. Direct Focus Room Join and Auto-Provisioning
test('Direct Focus Room Join & Dynamic Auto-Provisioning (Never Fails)', async () => {
  const userLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const userHeader = { Authorization: `Bearer ${userLogin.body.token}` };

  // Join pre-seeded room
  const joinPreseeded = await request('POST', '/api/rooms?action=join', {
    roomId: 'room_deepwork',
  }, userHeader);
  assert(joinPreseeded.status === 200, 'Joined pre-seeded room successfully');
  assert(joinPreseeded.body.room.id === 'room_deepwork', 'Room id is room_deepwork');

  // Join non-existing custom room code (e.g. "team-alpha-meeting") -> auto provisions on the fly!
  const customRoomCode = 'room_dynamic_' + Date.now();
  const joinDynamic = await request('POST', '/api/rooms?action=join', {
    roomId: customRoomCode,
  }, userHeader);
  assert(joinDynamic.status === 200, 'Dynamic room join auto-provisions with 200 OK');
  assert(joinDynamic.body.room.id === customRoomCode, 'Dynamic room was auto-created and joined');
  assert(joinDynamic.body.room.participants.length > 0, 'User is registered as participant in dynamic room');
});

// 14. Co-presence in Same Room: Mohusyn creates, Reza joins, both in participants (count = 2)
test('Multi-User Room Co-presence: Both Users in Same Room with Unified State', async () => {
  // 1. Register Reza
  const rezaUsername = 'reza_test_' + Date.now();
  const rezaReg = await request('POST', '/api/auth?action=register', {
    username: rezaUsername,
    password: 'RezaPassword123',
    name: 'رضا',
  });
  assert(rezaReg.status === 201, 'Reza registered successfully');
  const rezaHeader = { Authorization: `Bearer ${rezaReg.body.token}` };

  // 2. Mohusyn creates a room
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const createRes = await request('POST', '/api/rooms?action=create', {
    name: 'اتاق تمرکز و مطالعه مشترک',
    focusDuration: 1500,
    breakDuration: 300,
  }, adminHeader);
  assert(createRes.status === 201, 'Admin created room');
  const roomId = createRes.body.room.id;

  // 3. Reza joins the exact same room
  const joinRes = await request('POST', '/api/rooms?action=join', {
    roomId: roomId,
  }, rezaHeader);
  assert(joinRes.status === 200, 'Reza joined Mohusyn room');
  assert(!joinRes.body.room.isDeleted, 'Room must NOT be deleted');

  // 4. Check that BOTH Mohusyn and Reza are in room.participants
  const getRoom = await request('GET', `/api/rooms?action=get&room_id=${roomId}`, null, adminHeader);
  assert(getRoom.status === 200, 'Room fetched');
  const participantNames = getRoom.body.room.participants.map((p) => p.userName || p.name);
  assert(participantNames.includes('رضا'), 'Reza must be in room participants list');
  assert(getRoom.body.room.participants.length >= 2, 'Room must have at least 2 participants');

  // 5. Check Admin User Monitoring shows Reza
  const usersRes = await request('GET', '/api/users', null, adminHeader);
  assert(usersRes.status === 200, 'Admin users list fetched');
  const foundReza = usersRes.body.users.find((u) => u.username.toLowerCase() === rezaUsername.toLowerCase());
  assert(foundReza, 'Reza MUST appear in Admin User Monitoring panel');
});

// 15. Admin Can Read Comprehensive Performance Report of Other Users
test('Admin Can Read Comprehensive Performance Report of Other Users', async () => {
  // 1. Register a user with complete profile
  const reportUsername = 'student_' + Date.now();
  const reg = await request('POST', '/api/auth?action=register', {
    username: reportUsername,
    password: 'StudentPass123',
    name: 'سارا احمدی',
    phone: '09129876543',
    birthDate: '1381/06/20',
    jobTitle: 'کارشناس هوش مصنوعی',
  });
  assert(reg.status === 201, 'User registered');
  const studentId = reg.body.user.id;
  const studentHeader = { Authorization: `Bearer ${reg.body.token}` };

  // 2. Student adds a task with incomplete reason
  await request('POST', '/api/tasks', {
    title: 'تکمیل ماژول شبکه عصبی',
    date: '1405-01-01',
    time: '14:00',
    priority: 'high',
    userId: studentId,
  }, studentHeader);

  // 3. Admin logs in and requests comprehensive report for this user
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const reportRes = await request('GET', `/api/users?action=report&user_id=${studentId}`, null, adminHeader);
  assert(reportRes.status === 200, 'User report fetched successfully');
  assert(reportRes.body.user.name === 'سارا احمدی', 'Report belongs to student');
  assert(reportRes.body.user.phone === '09129876543', 'Phone is included in report');
  assert(Array.isArray(reportRes.body.tasks), 'Tasks list returned in report');
  assert(reportRes.body.stats.totalTasks >= 1, 'Total tasks counted in report');
});

// 16. Admin Global Settings Job Categories & Registration Integration
test('Admin Global Settings Job Categories & Registration Integration', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  // Save new job categories
  const newCategories = [
    'مهندس هوش مصنوعی و یادگیری عمیق',
    'مشاور حقوقی و مالکیت فکری',
    'متخصص DevOps و کلود',
  ];
  const saveRes = await request('POST', '/api/settings?action=global', {
    jobCategories: newCategories,
  }, adminHeader);
  assert(saveRes.status === 200, 'Global settings saved');

  // Fetch settings to verify persistence
  const getRes = await request('GET', '/api/settings', null, adminHeader);
  assert(getRes.status === 200, 'Settings retrieved');
  assert(getRes.body.settings.jobCategories.includes('مهندس هوش مصنوعی و یادگیری عمیق'), 'New job category persisted');
});

// 17. User Deletion: no resurrection, related data cleaned, IIS-405 fallbacks
test('User Deletion: Permanent Removal, Data Cleanup & IIS-405 Fallbacks', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  // Create two users via admin panel endpoint
  const u1 = (await request('POST', '/api/users', {
    username: 'delcheck_verb_' + Date.now(),
    password: 'Pass123!',
    name: 'کاربر حذف‌شده ۱',
    role: 'user',
  }, adminHeader)).body.user;
  const u2 = (await request('POST', '/api/users', {
    username: 'delcheck_fallback_' + Date.now(),
    password: 'Pass123!',
    name: 'کاربر حذف‌شده ۲',
    role: 'user',
  }, adminHeader)).body.user;

  // Give u1 a task so we can verify cascade cleanup
  await request('POST', '/api/tasks', {
    title: 'تسک وابسته به کاربر حذف‌شده',
    userId: u1.id,
    date: '2026-09-21',
    categoryId: 'cat-work',
  }, adminHeader);

  // Delete u1 via standard DELETE verb
  const del1 = await request('DELETE', `/api/users?id=${u1.id}`, null, adminHeader);
  assert(del1.status === 200, `DELETE verb should succeed, got ${del1.status}`);

  // Delete u2 via IIS-405 fallback (GET ?action=delete)
  const del2 = await request('GET', `/api/users?action=delete&id=${u2.id}`, null, adminHeader);
  assert(del2.status === 200, `GET ?action=delete fallback should succeed, got ${del2.status}`);

  // Both must be GONE from the server list (and stay gone on re-poll — no resurrection)
  for (let i = 0; i < 2; i++) {
    const list = await request('GET', '/api/users', null, adminHeader);
    const found1 = list.body.users.some((u) => u.id === u1.id || u.username === u1.username);
    const found2 = list.body.users.some((u) => u.id === u2.id || u.username === u2.username);
    assert(!found1, 'Deleted user u1 must NOT reappear on poll (no resurrection)');
    assert(!found2, 'Deleted user u2 must NOT reappear on poll (no resurrection)');
  }

  // Tasks of the deleted user must be gone too
  const orphan = await request('GET', `/api/tasks?user_id=${u1.id}`, null, adminHeader);
  assert(orphan.status === 200 && orphan.body.tasks.length === 0, 'Tasks of deleted user must be cascade-deleted');

  // Super admin Mohusyn is protected from deletion
  const delMohusyn = await request('DELETE', '/api/users?id=usr_admin_mohusyn', null, adminHeader);
  assert(delMohusyn.status === 400, `Mohusyn account must be protected from deletion, got ${delMohusyn.status}`);
});

// 18. Admin "Delete All Rooms" endpoint
test('Admin Delete All Focus Rooms', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  // Seed: create a room first
  const roomRes = await request('POST', '/api/rooms', {
    name: 'اتاق آزمایشی حذف کلی',
    focusDuration: 1500,
    breakDuration: 300,
  }, adminHeader);
  assert(roomRes.status === 201, 'Room created for delete-all test');

  // Non-admin must be rejected
  const regRes = await request('POST', '/api/auth/register', {
    username: 'noadmin_' + Date.now(),
    password: 'Pass123!',
    name: 'کاربر بدون دسترسی',
    phone: '09120009999',
  });
  const noAdminHeader = { Authorization: `Bearer ${regRes.body.token}` };
  const forbidden = await request('POST', '/api/rooms?action=delete_all', {}, noAdminHeader);
  assert(forbidden.status === 403, `Non-admin delete_all must be 403, got ${forbidden.status}`);

  // Admin wipes ALL rooms
  const wipe = await request('POST', '/api/rooms?action=delete_all', {}, adminHeader);
  assert(wipe.status === 200, `Admin delete_all should succeed, got ${wipe.status}`);
  assert(wipe.body.deletedCount >= 1, 'At least the seeded room must be deleted');

  // Room list must now be empty
  const list = await request('GET', '/api/rooms?action=list', null, adminHeader);
  assert(list.status === 200, 'Room list fetched after wipe');
  assert(Array.isArray(list.body.rooms) && list.body.rooms.length === 0, 'No active rooms may remain after admin wipe');
});

// ─────────────────────────────────────────────────────────────────────────────
// New features: self profile update (incl. avatar) + admin text manager
// ─────────────────────────────────────────────────────────────────────────────

const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// 19. Self profile update: any user can edit own profile incl. photo + password
test('Profile Self-Update: Avatar, Contact Fields & Password Rotation', async () => {
  const regRes = await request('POST', '/api/auth/register', {
    username: 'profile_test_' + Date.now(),
    password: 'OldPass123!',
    name: 'کاربر پروفایل',
  });
  assert(regRes.status === 201, `Register should succeed, got ${regRes.status}`);
  const user = regRes.body.user;
  const userHeader = { Authorization: `Bearer ${regRes.body.token}` };

  // 1. Update own profile with avatar + fields
  const upd = await request('PUT', '/api/users', {
    action: 'update_profile',
    name: 'کاربر پروفایل ویرایش‌شده',
    phone: '09123456789',
    email: 'profile@test.local',
    province: 'اصفهان',
    city: 'اصفهان',
    jobTitle: 'تست‌نویس',
    skills: ['React', 'PHP'],
    avatar: TINY_PNG,
  }, userHeader);
  assert(upd.status === 200, `Self profile update should succeed, got ${upd.status}`);
  assert(typeof upd.body.user.avatar === 'string' && upd.body.user.avatar.startsWith('data:image/'), 'Avatar data URL must be returned');
  assert(upd.body.user.name === 'کاربر پروفایل ویرایش‌شده', 'Name must be updated');

  // 2. Persisted: /me returns avatar
  const me = await request('GET', '/api/auth?action=me', null, userHeader);
  assert(me.status === 200 && me.body.authenticated === true, '/me must authenticate');
  assert(me.body.user.avatar === TINY_PNG, 'Avatar must persist across /me');
  assert(Array.isArray(me.body.user.skills) && me.body.user.skills.includes('React'), 'Skills must persist');

  // 3. Empty string removes avatar
  const remove = await request('PUT', '/api/users', { action: 'update_profile', avatar: '' }, userHeader);
  assert(remove.status === 200, `Avatar removal should succeed, got ${remove.status}`);
  const me2 = await request('GET', '/api/auth?action=me', null, userHeader);
  assert(!me2.body.user.avatar, 'Avatar must be removed after empty-string update');

  // 4. Password rotation via self profile update
  const pw = await request('PUT', '/api/users', { action: 'update_profile', password: 'NewPass99!' }, userHeader);
  assert(pw.status === 200, `Password change should succeed, got ${pw.status}`);
  const loginNew = await request('POST', '/api/auth/login', { username: user.username, password: 'NewPass99!' });
  assert(loginNew.status === 200, `Login with new password must work, got ${loginNew.status}`);

  // 5. Invalid avatar rejected
  const badAvatar = await request('PUT', '/api/users', { action: 'update_profile', avatar: 'not-a-data-url' }, userHeader);
  assert(badAvatar.status === 400, `Invalid avatar must be 400, got ${badAvatar.status}`);

  // Cleanup: admin deletes the test user
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };
  const del = await request('GET', `/api/users?action=delete&id=${user.id}`, null, adminHeader);
  assert(del.status === 200, `Cleanup delete should succeed, got ${del.status}`);
});

// 20. Self profile update is strictly own-account only
test('Profile Self-Update Security: Cannot Edit Other Users', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  const regRes = await request('POST', '/api/auth/register', {
    username: 'profile_sec_' + Date.now(),
    password: 'Pass123!',
    name: 'کاربر امنیتی',
  });
  const user = regRes.body.user;
  const userHeader = { Authorization: `Bearer ${regRes.body.token}` };

  // Non-admin targets another (admin) user id -> 403
  const other = await request('PUT', '/api/users', {
    action: 'update_profile',
    id: adminLogin.body.user.id,
    name: 'هاک نام مدیر',
  }, userHeader);
  assert(other.status === 403, `Editing another user must be 403, got ${other.status}`);

  // Admin id must not be renamed
  const list = await request('GET', '/api/users', null, adminHeader);
  const mohusyn = list.body.users.find((u) => u.username === 'Mohusyn');
  assert(mohusyn && mohusyn.name !== 'هاک نام مدیر', 'Admin name must be untouched');

  // No authentication -> 401 (dev handler) 
  const anon = await request('PUT', '/api/users', { action: 'update_profile', name: 'بی‌هویت' });
  assert([401, 403].includes(anon.status), `Anonymous self-update must be rejected, got ${anon.status}`);

  // Cleanup
  const del = await request('GET', `/api/users?action=delete&id=${user.id}`, null, adminHeader);
  assert(del.status === 200, `Cleanup delete should succeed, got ${del.status}`);
});

// 21. Admin Text Manager: app texts stored in global settings & readable
test('Admin Text Manager: Editable App Texts in Global Settings', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };

  // Publish a custom text
  const put = await request('POST', '/api/settings', {
    texts: { appName: 'تسک‌روز آزمایشی', footerCredits: 'test-credits-۲۰۲۶' },
  }, adminHeader);
  assert(put.status === 200, `Settings save should succeed, got ${put.status}`);

  const got = await request('GET', '/api/settings', null, adminHeader);
  assert(got.status === 200, 'Settings fetch must succeed');
  assert(got.body.settings.texts && got.body.settings.texts.appName === 'تسک‌روز آزمایشی', `Custom appName text must round-trip, got: ${JSON.stringify(got.body.settings.texts)}`);
  assert(got.body.settings.texts.footerCredits === 'test-credits-۲۰۲۶', 'Custom footer text must round-trip');

  // Blank value -> client falls back to built-in default (server keeps empty string)
  const blank = await request('POST', '/api/settings', { texts: { appName: '' } }, adminHeader);
  assert(blank.status === 200, 'Blank text save must succeed');
  const got2 = await request('GET', '/api/settings', null, adminHeader);
  assert(got2.body.settings.texts.appName === '', 'Blank text must be stored as empty string');
});

// 22. PWA: service worker, manifest and icons must be served
test('PWA Assets: Service Worker, Manifest & Icons Served', async () => {
  const sw = await new Promise((resolve) => {
    const http = require('http');
    http.get('http://localhost:5173/sw.js', (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', () => resolve({ status: 0, body: '' }));
  });
  assert(sw.status === 200, `sw.js must be served, got ${sw.status}`);
  assert(sw.body.includes("addEventListener('fetch'"), 'sw.js must contain a fetch handler');

  const manifest = await request('GET', '/manifest.json');
  assert(manifest.status === 200, `manifest.json must be served, got ${manifest.status}`);
  const m = typeof manifest.body === 'string' ? JSON.parse(manifest.body) : manifest.body;
  assert(m.name && m.start_url, 'manifest must have name and start_url');
  assert(Array.isArray(m.icons) && m.icons.length >= 2, 'manifest must declare icons');
  const pngIcons = m.icons.filter((i) => i.type === 'image/png');
  assert(pngIcons.some((i) => i.sizes === '192x192') && pngIcons.some((i) => i.sizes === '512x512'),
    'manifest must declare 192 and 512 PNG icons');

  for (const icon of ['./icon-192.png', './icon-512.png', './icon-maskable-512.png']) {
    const r = await new Promise((resolve) => {
      const http = require('http');
      http.get('http://localhost:5173/' + icon, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }).on('error', () => resolve(0));
    });
    assert(r === 200, `${icon} must be served, got ${r}`);
  }
});

// 23. Admin bulk delete: multi-select wipe with protections
test('Admin Bulk Delete: Multi-select Wipe with Protections', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
  const adminHeader = { Authorization: `Bearer ${adminLogin.body.token}` };
  const adminId = adminLogin.body.user.id;

  // Seed 3 disposable users
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const r = await request('POST', '/api/auth/register', {
      username: 'bulk_' + i + '_' + Date.now(),
      password: 'Pass123!',
      name: 'کاربر گروهی ' + i,
    });
    assert(r.status === 201, `Seed user ${i} must register, got ${r.status}`);
    ids.push(r.body.user.id);
  }

  // Non-admin bulk delete must be 403
  const regRes = await request('POST', '/api/auth/register', {
    username: 'bulk_no_' + Date.now(),
    password: 'Pass123!',
    name: 'کاربر بدون دسترسی',
  });
  const noAdminHeader = { Authorization: `Bearer ${regRes.body.token}` };
  const forbidden = await request('POST', '/api/users?action=delete_many', { action: 'delete_many', ids }, noAdminHeader);
  assert(forbidden.status === 403, `Non-admin bulk delete must be 403, got ${forbidden.status}`);

  // Admin bulk: delete 2 of 3, plus own id (skipped) + unknown id (skipped)
  const res = await request('POST', '/api/users?action=delete_many', {
    action: 'delete_many',
    ids: [ids[0], ids[1], adminId, 'nonexistent_user_999'],
  }, adminHeader);
  assert(res.status === 200, `Bulk delete should succeed, got ${res.status}`);
  assert(res.body.deletedCount === 2, `Exactly 2 users must be deleted, got ${res.body.deletedCount}`);
  assert(res.body.deleted.includes(ids[0]) && res.body.deleted.includes(ids[1]), 'The two seeded users must be in deleted list');
  assert(res.body.skipped.length === 2, `Own admin + unknown id must be skipped, got ${res.body.skipped.length}`);

  // Third user survives; deleted ones are gone
  const list = await request('GET', '/api/users', null, adminHeader);
  assert(list.body.users.some((u) => u.id === ids[2]), 'Third user must survive bulk delete');
  assert(!list.body.users.some((u) => u.id === ids[0]), 'First user must be gone');
  assert(!list.body.users.some((u) => u.id === ids[1]), 'Second user must be gone');

  // Empty ids list -> 400
  const empty = await request('POST', '/api/users?action=delete_many', { action: 'delete_many', ids: [] }, adminHeader);
  assert(empty.status === 400, `Empty ids must be 400, got ${empty.status}`);

  // Cleanup: remove the surviving user + the non-admin probe
  const cleanup = await request('POST', '/api/users?action=delete_many', {
    action: 'delete_many',
    ids: [ids[2], regRes.body.user.id],
  }, adminHeader);
  assert(cleanup.status === 200 && cleanup.body.deletedCount === 2, 'Cleanup bulk delete must succeed');
});

// 28. Database install guard: 503 when data/db.json is missing + one-click install
test('Database Install Guard: 503 When Missing + One-Click Install', async () => {
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.resolve(process.cwd(), 'data/db.json');
  const backup = dbPath + '.test28_backup';
  fs.copyFileSync(dbPath, backup);
  try {
    fs.unlinkSync(dbPath);

    // Any API route must now answer 503 DB_NOT_INSTALLED (no silent auto-seed)
    const blocked = await request('GET', '/api/tasks.php');
    assert(blocked.status === 503, `Missing db must give 503, got ${blocked.status}`);
    assert(blocked.body.code === 'DB_NOT_INSTALLED', `code must be DB_NOT_INSTALLED, got ${blocked.body.code}`);

    // PWA manifest must keep working before installation
    const manifest = await new Promise((resolve) => {
      http.get(BASE_URL + '/manifest.php', (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }).on('error', () => resolve({ status: 0, body: '' }));
    });
    assert(manifest.status === 200, `manifest.php must work before install, got ${manifest.status}`);
    assert(/"name":/.test(manifest.body), 'manifest must contain an app name');

    // Health check reports not-installed
    const health = await request('GET', '/api/install.php');
    assert(health.status === 200, `install health must be 200, got ${health.status}`);
    assert(health.body.installed === false, 'db must report installed=false before install');

    // One-click install seeds the database file
    const install = await request('POST', '/api/install.php');
    assert(install.status === 200, `install must succeed, got ${install.status}`);
    assert(install.body.installed === true, 'installed flag must be true after install');
    assert(fs.existsSync(dbPath), 'db.json must be created by the install endpoint');

    // API is fully operational again
    const after = await request('GET', '/api/install.php');
    assert(after.body.installed === true, 'db must report installed=true after install');
    const login = await request('POST', '/api/auth/login', { username: 'Mohusyn', password: 'Smosh1387' });
    assert(login.status === 200, `login must work after fresh install, got ${login.status}`);
  } finally {
    // Restore the original development database
    fs.copyFileSync(backup, dbPath);
    fs.unlinkSync(backup);
  }
});
