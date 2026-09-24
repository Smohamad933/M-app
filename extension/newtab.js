/**
 * Bag Time Personal Assistant - New Tab Engine
 * 100% Offline-capable, zero external dependency, with Google search & full account sync.
 */

// Storage Abstraction (chrome.storage.local or localStorage fallback)
const Storage = {
  async get(key, defaultValue = null) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => {
          resolve(res[key] !== undefined ? res[key] : defaultValue);
        });
      });
    }
    try {
      const v = localStorage.getItem('bagtime_ext_' + key);
      return v !== null ? JSON.parse(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    try {
      localStorage.setItem('bagtime_ext_' + key, JSON.stringify(value));
    } catch {}
  }
};

// Web Audio Sound Synthesizer
const AudioFeedback = {
  ctx: null,
  getCtx() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  },

  playCheck() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  },

  playBell() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.0);
      });
    } catch {}
  }
};

// Persian Digits Converter
function toPersianDigits(n) {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => digits[+w]);
}

// Gregorian to Jalali conversion
function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = [
  'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

function getJalaliDateString() {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const weekday = PERSIAN_WEEKDAYS[now.getDay()];
  const monthName = PERSIAN_MONTHS[jm - 1];
  return `${weekday}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

// Search Engines Configuration
const SEARCH_ENGINES = {
  google: {
    name: 'گوگل',
    icon: '🌐',
    url: 'https://www.google.com/search?q=',
    placeholder: 'جستجو در گوگل یا وارد کردن آدرس وبسایت...',
  },
  bing: {
    name: 'بینگ',
    icon: '🔷',
    url: 'https://www.bing.com/search?q=',
    placeholder: 'جستجو در مایکروسافت بینگ...',
  },
  duckduckgo: {
    name: 'داک‌داک‌گو',
    icon: '🦆',
    url: 'https://duckduckgo.com/?q=',
    placeholder: 'جستجوی خصوصی در DuckDuckGo...',
  },
  yahoo: {
    name: 'یاهو',
    icon: '🟣',
    url: 'https://search.yahoo.com/search?p=',
    placeholder: 'جستجو در یاهو...',
  },
  ecosia: {
    name: 'اکوزیا',
    icon: '🌱',
    url: 'https://www.ecosia.org/search?q=',
    placeholder: 'جستجو و کاشت درخت با Ecosia...',
  },
};

// State
let tasks = [];
let currentFilter = 'all';
let timelineSchedule = {};
let pomodoroSecondsLeft = 25 * 60;
let pomodoroTimer = null;
let pomodoroIsRunning = false;
let currentSearchEngine = 'google';
let currentAccount = null; // { user, token, serverUrl }

// DOM Elements
const liveClock = document.getElementById('liveClock');
const liveDate = document.getElementById('liveDate');
const greetingText = document.getElementById('greetingText');
const progressStats = document.getElementById('progressStats');
const progressBar = document.getElementById('progressBar');
const tasksCountBadge = document.getElementById('tasksCountBadge');
const tasksList = document.getElementById('tasksList');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const timelineScroll = document.getElementById('timelineScroll');
const timerDisplay = document.getElementById('timerDisplay');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerBreakBtn = document.getElementById('timerBreakBtn');
const notesArea = document.getElementById('notesArea');
const notesCharCount = document.getElementById('notesCharCount');
const copyNotesBtn = document.getElementById('copyNotesBtn');
const heroSearchForm = document.getElementById('heroSearchForm');
const heroSearchInput = document.getElementById('heroSearchInput');
const searchEngineBadge = document.getElementById('searchEngineBadge');
const searchEngineIcon = document.getElementById('searchEngineIcon');
const searchEngineName = document.getElementById('searchEngineName');
const accountBox = document.getElementById('accountBox');
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const extLoginForm = document.getElementById('extLoginForm');
const extServerUrl = document.getElementById('extServerUrl');
const extUsername = document.getElementById('extUsername');
const extPassword = document.getElementById('extPassword');
const extLoginError = document.getElementById('extLoginError');

// Clock & Date updater
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  liveClock.textContent = `${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`;

  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    greetingText.textContent = 'صبح بخیر! روز پرانرژی و موفقی پیش رو داشته باشید ☀️';
  } else if (hour >= 12 && hour < 18) {
    greetingText.textContent = 'عصر بخیر! چه کارهایی امروز در اولویت شما هستند؟ 🌿';
  } else {
    greetingText.textContent = 'شب بخیر! مرور دستاوردها و برنامه‌ریزی برای فردا 🌙';
  }
}

// ── Search Engine Functionality ──
function setSearchEngine(engineKey) {
  if (!SEARCH_ENGINES[engineKey]) engineKey = 'google';
  currentSearchEngine = engineKey;
  Storage.set('search_engine', engineKey);

  const engine = SEARCH_ENGINES[engineKey];
  if (searchEngineIcon) searchEngineIcon.textContent = engine.icon;
  if (searchEngineName) searchEngineName.textContent = engine.name;
  if (heroSearchInput) heroSearchInput.placeholder = engine.placeholder;

  document.querySelectorAll('.engine-pill').forEach((pill) => {
    if (pill.dataset.engine === engineKey) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const query = (heroSearchInput.value || '').trim();
  if (!query) return;

  // Direct URL navigation check
  const isUrl = /^https?:\/\//i.test(query) || /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(query);
  if (isUrl) {
    const targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
    window.location.href = targetUrl;
    return;
  }

  const engine = SEARCH_ENGINES[currentSearchEngine] || SEARCH_ENGINES.google;
  window.location.href = `${engine.url}${encodeURIComponent(query)}`;
}

// ── Server Synchronization & Account ──
async function syncWithServer() {
  if (!currentAccount || !currentAccount.token) return;
  const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');

  try {
    // 1. Fetch tasks from server
    const res = await fetch(`${baseUrl}/api/tasks.php`, {
      headers: {
        'Authorization': `Bearer ${currentAccount.token}`,
        'X-Auth-Token': currentAccount.token,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        // Map server tasks to extension tasks format
        tasks = data.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority || 'medium',
          completed: Boolean(t.completed),
          date: t.date,
          timeBlock: t.timeBlock,
        }));
        await Storage.set('tasks', tasks);
        renderTasks();
      }
    }
  } catch (err) {
    console.warn('Sync with server failed, running offline:', err);
  }
}

async function renderAccountUI() {
  currentAccount = await Storage.get('auth_account', null);
  if (!accountBox) return;

  if (currentAccount && currentAccount.user) {
    const userName = currentAccount.user.name || currentAccount.user.username || 'کاربر بگ تایم';
    accountBox.innerHTML = `
      <div class="account-badge-box">
        <span class="sync-indicator-dot" title="همگام‌سازی زنده با سرور فعال است"></span>
        <span style="color: #1e1b4b;">${userName}</span>
        <button type="button" id="extManualSyncBtn" style="border: none; background: none; cursor: pointer; color: #4f46e5; font-size: 0.75rem; font-weight: 800;" title="همگام‌سازی مجدد">🔄</button>
        <button type="button" id="extLogoutBtn" style="border: none; background: none; cursor: pointer; color: #e11d48; font-size: 0.75rem; font-weight: 800;" title="خروج از حساب">خروج</button>
      </div>
    `;

    document.getElementById('extManualSyncBtn')?.addEventListener('click', async () => {
      await syncWithServer();
      AudioFeedback.playCheck();
      alert('اطلاعات با موفقیت با سرور همگام‌سازی شد!');
    });

    document.getElementById('extLogoutBtn')?.addEventListener('click', async () => {
      if (confirm('آیا از خروج از حساب کاربری بگ تایم اطمینان دارید؟')) {
        await Storage.set('auth_account', null);
        currentAccount = null;
        renderAccountUI();
      }
    });
  } else {
    accountBox.innerHTML = `
      <button type="button" id="openLoginModalBtn" class="btn btn-outline" style="font-size: 0.75rem; padding: 0.45rem 0.85rem;">
        🔑 اتصال به حساب کاربری
      </button>
    `;
    document.getElementById('openLoginModalBtn')?.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'flex';
    });
  }
}

// ── Tasks Rendering & Management ──
function renderTasks() {
  const filtered = tasks.filter((t) => {
    if (currentFilter === 'pending') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  tasksList.innerHTML = '';
  tasksCountBadge.textContent = `${toPersianDigits(filtered.length)} تسک`;

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8; font-size: 0.85rem;">
        ${currentFilter === 'completed' ? 'هنوز تسکی انجام نشده است.' : 'هیچ تسکی برای نمایش وجود ندارد. یکی اضافه کنید! ✨'}
      </div>
    `;
  } else {
    filtered.forEach((t) => {
      const div = document.createElement('div');
      div.className = `task-item ${t.completed ? 'completed' : ''}`;
      div.innerHTML = `
        <div class="task-checkbox ${t.completed ? 'checked' : ''}" data-id="${t.id}">
          ${t.completed ? '✓' : ''}
        </div>
        <div class="task-title-text">${escapeHtml(t.title)}</div>
        <span class="priority-tag priority-${t.priority}">
          ${t.priority === 'high' ? 'فوری' : t.priority === 'low' ? 'عادی' : 'متوسط'}
        </span>
        <button type="button" class="task-delete-btn" data-id="${t.id}" title="حذف تسک">✕</button>
      `;
      tasksList.appendChild(div);
    });
  }

  // Bind actions
  tasksList.querySelectorAll('.task-checkbox').forEach((box) => {
    box.addEventListener('click', () => toggleTask(box.dataset.id));
  });

  tasksList.querySelectorAll('.task-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteTask(btn.dataset.id);
    });
  });

  updateProgress();
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  if (task.completed) AudioFeedback.playCheck();
  await Storage.set('tasks', tasks);
  renderTasks();

  // Push toggle to server if connected
  if (currentAccount && currentAccount.token) {
    const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/tasks.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({ action: 'toggle', id: task.id }),
    }).catch(() => {});
  }
}

async function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  await Storage.set('tasks', tasks);
  renderTasks();

  if (currentAccount && currentAccount.token) {
    const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/tasks.php?action=delete&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentAccount.token}`,
      },
    }).catch(() => {});
  }
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  progressStats.textContent = `${toPersianDigits(done)} از ${toPersianDigits(total)} (${toPersianDigits(percent)}٪)`;
  progressBar.style.width = `${percent}%`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Hourly Timeline ──
function renderTimeline() {
  const hours = [];
  for (let h = 7; h <= 23; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  timelineScroll.innerHTML = '';
  hours.forEach((slot) => {
    const row = document.createElement('div');
    row.className = 'timeline-slot';
    const text = timelineSchedule[slot] || '';
    row.innerHTML = `
      <div class="slot-time">${toPersianDigits(slot)}</div>
      <input
        type="text"
        class="slot-input"
        data-slot="${slot}"
        value="${escapeHtml(text)}"
        placeholder="ثبت کار، جلسه یا هدف این ساعت..."
      />
    `;
    timelineScroll.appendChild(row);
  });

  timelineScroll.querySelectorAll('.slot-input').forEach((inp) => {
    inp.addEventListener('change', async () => {
      const slot = inp.dataset.slot;
      timelineSchedule[slot] = inp.value.trim();
      await Storage.set('timeline', timelineSchedule);
    });
  });
}

// ── Pomodoro Timer ──
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(pomodoroSecondsLeft);
}

function startTimer() {
  if (pomodoroIsRunning) return;
  pomodoroIsRunning = true;
  timerToggleBtn.textContent = 'توقف';
  timerToggleBtn.style.background = '#e11d48';

  pomodoroTimer = setInterval(() => {
    if (pomodoroSecondsLeft <= 1) {
      clearInterval(pomodoroTimer);
      pomodoroIsRunning = false;
      pomodoroSecondsLeft = 0;
      renderTimer();
      timerToggleBtn.textContent = 'شروع مجدد';
      timerToggleBtn.style.background = '#4f46e5';
      AudioFeedback.playBell();
      alert('🎉 زمان تمرکز عمیق پومودورو به پایان رسید! وقت استراحت است.');
      return;
    }
    pomodoroSecondsLeft -= 1;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  clearInterval(pomodoroTimer);
  pomodoroIsRunning = false;
  timerToggleBtn.textContent = 'ادامه';
  timerToggleBtn.style.background = '#4f46e5';
}

// ── Initialize App ──
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  liveDate.textContent = getJalaliDateString();

  // Load Search Engine
  const savedEngine = await Storage.get('search_engine', 'google');
  setSearchEngine(savedEngine);

  // Search Engine Pills listener
  document.querySelectorAll('.engine-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      setSearchEngine(pill.dataset.engine);
    });
  });

  // Search Engine Badge toggle
  if (searchEngineBadge) {
    searchEngineBadge.addEventListener('click', () => {
      const keys = Object.keys(SEARCH_ENGINES);
      const nextIdx = (keys.indexOf(currentSearchEngine) + 1) % keys.length;
      setSearchEngine(keys[nextIdx]);
    });
  }

  // Hero Search Form
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', handleSearchSubmit);
  }

  // Keyboard shortcut '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== heroSearchInput && document.activeElement !== taskInput && document.activeElement !== notesArea) {
      e.preventDefault();
      heroSearchInput.focus();
    }
  });

  // Load Tasks
  tasks = (await Storage.get('tasks', [])) || [];
  renderTasks();

  // Load Timeline
  timelineSchedule = (await Storage.get('timeline', {})) || {};
  renderTimeline();

  // Load Notes
  const savedNotes = await Storage.get('notes', '');
  notesArea.value = savedNotes;
  notesCharCount.textContent = `${toPersianDigits(savedNotes.length)} کاراکتر`;

  // Render Account Widget
  await renderAccountUI();

  // Initial Sync with server if logged in
  await syncWithServer();

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Add Task
  addTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    const newTask = {
      id: 'task_' + Date.now(),
      title,
      priority: prioritySelect.value,
      completed: false,
    };
    tasks.unshift(newTask);
    await Storage.set('tasks', tasks);
    taskInput.value = '';
    renderTasks();
    AudioFeedback.playCheck();

    // Push new task to server
    if (currentAccount && currentAccount.token) {
      const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
      fetch(`${baseUrl}/api/tasks.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAccount.token}`,
        },
        body: JSON.stringify({
          title: newTask.title,
          priority: newTask.priority,
          date: new Date().toISOString().split('T')[0],
        }),
      }).catch(() => {});
    }
  });

  // Notes Auto-Save
  let notesSaveTimeout = null;
  notesArea.addEventListener('input', () => {
    const text = notesArea.value;
    notesCharCount.textContent = `${toPersianDigits(text.length)} کاراکتر`;
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(async () => {
      await Storage.set('notes', text);
    }, 400);
  });

  copyNotesBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(notesArea.value);
    copyNotesBtn.textContent = 'کپی شد! ✓';
    setTimeout(() => {
      copyNotesBtn.textContent = 'کپی یادداشت';
    }, 2000);
  });

  // Pomodoro Controls
  timerToggleBtn.addEventListener('click', () => {
    if (pomodoroIsRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', () => {
    pauseTimer();
    pomodoroSecondsLeft = 25 * 60;
    renderTimer();
    timerToggleBtn.textContent = 'شروع';
  });

  timerBreakBtn.addEventListener('click', () => {
    pauseTimer();
    pomodoroSecondsLeft = 5 * 60;
    renderTimer();
    timerToggleBtn.textContent = 'شروع استراحت';
  });

  renderTimer();

  // Modal Listeners
  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'none';
    });
  }

  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) loginModal.style.display = 'none';
    });
  }

  // Account Login Form
  if (extLoginForm) {
    extLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const serverUrl = extServerUrl.value.trim().replace(/\/+$/, '');
      const username = extUsername.value.trim();
      const password = extPassword.value.trim();

      extLoginError.style.display = 'none';
      const submitBtn = document.getElementById('extLoginSubmitBtn');
      if (submitBtn) submitBtn.textContent = 'در حال ارتباط و ورود...';

      try {
        const res = await fetch(`${serverUrl}/api/auth.php?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.error || 'نام کاربری یا کلمه عبور نادرست است.');
        }

        // Save account
        const accountData = {
          token: data.token,
          user: data.user,
          serverUrl,
        };
        await Storage.set('auth_account', accountData);
        currentAccount = accountData;

        if (loginModal) loginModal.style.display = 'none';
        await renderAccountUI();
        await syncWithServer();
        AudioFeedback.playCheck();
        alert(`خوش آمدید ${data.user?.name || data.user?.username}! حساب شما متصل و تسک‌ها همگام‌سازی شدند.`);
      } catch (err) {
        extLoginError.textContent = err.message || 'خطا در ارتباط با سرور بگ تایم.';
        extLoginError.style.display = 'block';
      } finally {
        if (submitBtn) submitBtn.textContent = 'ورود و دریافت کارهای من';
      }
    });
  }
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', init);
