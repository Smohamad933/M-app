/**
 * Bag Time Assistant Extension - New Tab Engine
 * 100% Offline-capable, Multi-Search-Engine, Custom Font Switcher & Live Bag Time Sync.
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

// Web Audio Sound Synthesizer (Instant feedback without external audio files)
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
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
};

// Persian Digits Helper
function toPersianDigits(n) {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => digits[+w]);
}

// Gregorian to Jalali Conversion
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
    title: 'Google',
    icon: '🌐',
    url: 'https://www.google.com/search?q=',
    placeholder: 'جستجو در گوگل یا وارد کردن آدرس وبسایت...',
  },
  bing: {
    name: 'بینگ',
    title: 'Bing',
    icon: '🔷',
    url: 'https://www.bing.com/search?q=',
    placeholder: 'جستجو در مایکروسافت بینگ...',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    title: 'DuckDuckGo',
    icon: '🦆',
    url: 'https://duckduckgo.com/?q=',
    placeholder: 'جستجوی خصوصی و امن در DuckDuckGo...',
  },
  yahoo: {
    name: 'یاهو',
    title: 'Yahoo',
    icon: '🟣',
    url: 'https://search.yahoo.com/search?p=',
    placeholder: 'جستجو در موتور یاهو...',
  },
  ecosia: {
    name: 'Ecosia',
    title: 'Ecosia',
    icon: '🌱',
    url: 'https://www.ecosia.org/search?q=',
    placeholder: 'جستجو و کاشت درختان با Ecosia...',
  },
};

// Available Fonts
const FONTS_CONFIG = {
  vazirmatn: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sahel: "'Sahel', 'Vazirmatn', -apple-system, sans-serif",
  shabnam: "'Shabnam', 'Vazirmatn', -apple-system, sans-serif",
  dana: "'Dana', 'Vazirmatn', -apple-system, sans-serif",
  yekan: "'IRANYekan', 'Yekan', 'Vazirmatn', -apple-system, sans-serif",
  system: "'Tahoma', 'Segoe UI', system-ui, -apple-system, sans-serif",
  inter: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

// State
let tasks = [];
let currentFilter = 'all';
let currentSearchEngine = 'google';
let currentFont = 'vazirmatn';
let currentAccount = null; // { user, token, serverUrl }

// DOM Elements
const liveClock = document.getElementById('liveClock');
const liveDate = document.getElementById('liveDate');
const fontSelect = document.getElementById('fontSelect');
const heroEngineIcon = document.getElementById('heroEngineIcon');
const heroEngineTitle = document.getElementById('heroEngineTitle');
const heroSearchForm = document.getElementById('heroSearchForm');
const heroSearchInput = document.getElementById('heroSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchEngineBadge = document.getElementById('searchEngineBadge');
const searchEngineIcon = document.getElementById('searchEngineIcon');
const searchEngineName = document.getElementById('searchEngineName');
const progressStats = document.getElementById('progressStats');
const progressBar = document.getElementById('progressBar');
const tasksCountBadge = document.getElementById('tasksCountBadge');
const tasksList = document.getElementById('tasksList');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const refreshTasksBtn = document.getElementById('refreshTasksBtn');
const hubSyncNotice = document.getElementById('hubSyncNotice');

// Login Modal Elements
const loginModal = document.getElementById('loginModal');
const openLoginModalBtn = document.getElementById('openLoginModalBtn');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const extLoginForm = document.getElementById('extLoginForm');
const extServerUrl = document.getElementById('extServerUrl');
const extUsername = document.getElementById('extUsername');
const extPassword = document.getElementById('extPassword');
const extLoginError = document.getElementById('extLoginError');
const extLoginSubmitBtn = document.getElementById('extLoginSubmitBtn');
const accountBox = document.getElementById('accountBox');

// ── Clock & Date ──
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  if (liveClock) liveClock.textContent = `${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`;
}

// ── Font Management ──
function applyFont(fontKey) {
  currentFont = fontKey in FONTS_CONFIG ? fontKey : 'vazirmatn';
  const fontCss = FONTS_CONFIG[currentFont];
  document.documentElement.style.setProperty('--font-family-current', fontCss);
  document.body.style.fontFamily = fontCss;
  if (fontSelect) fontSelect.value = currentFont;
  Storage.set('font_family', currentFont);
}

// ── Search Engine Switcher ──
function setSearchEngine(engineKey) {
  if (!SEARCH_ENGINES[engineKey]) engineKey = 'google';
  currentSearchEngine = engineKey;
  const cfg = SEARCH_ENGINES[engineKey];

  if (heroEngineIcon) heroEngineIcon.textContent = cfg.icon;
  if (heroEngineTitle) heroEngineTitle.textContent = cfg.title;
  if (searchEngineIcon) searchEngineIcon.textContent = cfg.icon;
  if (searchEngineName) searchEngineName.textContent = cfg.name;
  if (heroSearchInput) heroSearchInput.placeholder = cfg.placeholder;

  document.querySelectorAll('.engine-pill').forEach((pill) => {
    if (pill.dataset.engine === engineKey) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  Storage.set('search_engine', engineKey);
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const q = (heroSearchInput.value || '').trim();
  if (!q) return;

  // Direct URL navigation if query resembles a website URL
  const isUrl = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(q) && !q.includes(' ');
  if (isUrl) {
    let target = q;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    window.location.href = target;
    return;
  }

  const engine = SEARCH_ENGINES[currentSearchEngine] || SEARCH_ENGINES.google;
  window.location.href = engine.url + encodeURIComponent(q);
}

// ── Tasks Rendering & Actions ──
function renderTasks() {
  tasksList.innerHTML = '';

  let filtered = tasks;
  if (currentFilter === 'pending') {
    filtered = tasks.filter((t) => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter((t) => t.completed);
  }

  tasksCountBadge.textContent = `${toPersianDigits(filtered.length)} تسک`;

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div class="tasks-empty-state">
        <div class="empty-icon">☕</div>
        <div class="empty-title">${currentFilter === 'completed' ? 'هنوز کاری تکمیل نشده است' : 'کاری در این لیست وجود ندارد'}</div>
        <div class="empty-sub">با استفاده از کادر بالا تسک جدید اضافه کنید یا در پلنر اصلی برنامه‌ریزی کنید.</div>
      </div>
    `;
  } else {
    filtered.forEach((t) => {
      const div = document.createElement('div');
      div.className = `task-item-card ${t.completed ? 'completed' : ''}`;
      div.innerHTML = `
        <div class="task-left-group">
          <div class="task-checkbox-custom ${t.completed ? 'checked' : ''}" data-id="${t.id}">
            ${t.completed ? '✓' : ''}
          </div>
          <span class="task-title-text" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
        </div>
        <div class="task-right-group">
          <span class="tag-priority ${t.priority || 'medium'}">
            ${t.priority === 'high' ? 'فوری' : t.priority === 'low' ? 'عادی' : 'متوسط'}
          </span>
          <button type="button" class="btn-delete-task" data-id="${t.id}" title="حذف تسک">✕</button>
        </div>
      `;
      tasksList.appendChild(div);
    });
  }

  // Bind checkbox clicks
  tasksList.querySelectorAll('.task-checkbox-custom').forEach((box) => {
    box.addEventListener('click', () => toggleTask(box.dataset.id));
  });

  // Bind delete buttons
  tasksList.querySelectorAll('.btn-delete-task').forEach((btn) => {
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

  // Push toggle to Bag Time server if connected
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
    fetch(`${baseUrl}/api/tasks.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({ action: 'delete', id }),
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

// ── Account & Live Server Sync ──
async function renderAccountUI() {
  currentAccount = await Storage.get('account', null);
  if (!accountBox) return;

  if (currentAccount && currentAccount.user && currentAccount.token) {
    const uName = currentAccount.user.name || currentAccount.user.username;
    accountBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button type="button" id="userMenuBtn" class="btn-connect" title="حساب متصل است: ${escapeHtml(uName)}">
          <span class="dot-status linked"></span>
          <span>سلام ${escapeHtml(uName)}</span>
        </button>
        <button type="button" id="extLogoutBtn" class="btn-connect" style="padding: 0.35rem 0.55rem; color: #f43f5e;" title="خروج از حساب">
          ✕
        </button>
      </div>
    `;

    const logoutBtn = document.getElementById('extLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('آیا می‌خواهید از حساب کاربری بگ تایم در افزونه خارج شوید؟')) {
          await Storage.set('account', null);
          currentAccount = null;
          await renderAccountUI();
          if (hubSyncNotice) hubSyncNotice.textContent = 'همگام‌سازی محلی (اتصال به سرور غیرفعال است)';
        }
      });
    }

    if (hubSyncNotice) hubSyncNotice.textContent = `همگام‌سازی زنده با حساب ${uName} 🟢`;
  } else {
    accountBox.innerHTML = `
      <button type="button" id="openLoginModalBtn" class="btn-connect">
        <span class="dot-status unlinked"></span>
        <span>اتصال به بگ تایم</span>
      </button>
    `;
    const openBtn = document.getElementById('openLoginModalBtn');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (loginModal) loginModal.style.display = 'flex';
      });
    }
    if (hubSyncNotice) hubSyncNotice.textContent = 'جهت همگام‌سازی دوطرفه با اپلیکیشن، دکمه اتصال را بزنید.';
  }
}

async function syncWithServer() {
  if (!currentAccount || !currentAccount.token) return;

  if (refreshTasksBtn) refreshTasksBtn.classList.add('spinning');
  const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');

  try {
    const res = await fetch(`${baseUrl}/api/tasks.php`, {
      headers: {
        'Authorization': `Bearer ${currentAccount.token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        // Map server tasks to extension format
        const todayStr = new Date().toISOString().split('T')[0];
        const serverTodayTasks = data.tasks.filter((t) => !t.date || t.date === todayStr);

        if (serverTodayTasks.length > 0) {
          tasks = serverTodayTasks.map((st) => ({
            id: String(st.id),
            title: st.title,
            priority: st.priority || 'medium',
            completed: Boolean(st.completed),
            date: st.date,
          }));
          await Storage.set('tasks', tasks);
          renderTasks();
        }
      }
    }
  } catch (e) {
    // Offline or server temporarily unreachable: retain local tasks
  } finally {
    if (refreshTasksBtn) {
      setTimeout(() => refreshTasksBtn.classList.remove('spinning'), 500);
    }
  }
}

// ── Initialize App ──
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  if (liveDate) liveDate.textContent = getJalaliDateString();

  // Load Saved Font
  const savedFont = await Storage.get('font_family', 'vazirmatn');
  applyFont(savedFont);

  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      applyFont(e.target.value);
    });
  }

  // Load Saved Search Engine
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

  // Search Form Submit
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', handleSearchSubmit);
  }

  // Search Input live clear button
  if (heroSearchInput && clearSearchBtn) {
    heroSearchInput.addEventListener('input', () => {
      clearSearchBtn.style.display = heroSearchInput.value ? 'flex' : 'none';
    });
    clearSearchBtn.addEventListener('click', () => {
      heroSearchInput.value = '';
      clearSearchBtn.style.display = 'none';
      heroSearchInput.focus();
    });
  }

  // Keyboard shortcut '/' to focus search bar
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== heroSearchInput && document.activeElement !== taskInput) {
      e.preventDefault();
      heroSearchInput.focus();
    }
  });

  // Load Tasks
  tasks = (await Storage.get('tasks', [])) || [];
  renderTasks();

  // Load Account & Initial Sync
  await renderAccountUI();
  await syncWithServer();

  // Refresh tasks button
  if (refreshTasksBtn) {
    refreshTasksBtn.addEventListener('click', syncWithServer);
  }

  // Task Filter Tabs
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Add Task Form
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = (taskInput.value || '').trim();
      if (!title) return;

      const newTask = {
        id: 'task_' + Date.now(),
        title,
        priority: prioritySelect ? prioritySelect.value : 'medium',
        completed: false,
        date: new Date().toISOString().split('T')[0],
      };

      tasks.unshift(newTask);
      await Storage.set('tasks', tasks);
      taskInput.value = '';
      renderTasks();
      AudioFeedback.playCheck();

      // Push new task directly to Bag Time server if connected
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
            date: newTask.date,
          }),
        }).catch(() => {});
      }
    });
  }

  // Login Modal Handlers
  if (closeLoginModalBtn && loginModal) {
    closeLoginModalBtn.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
    }
  });

  if (extLoginForm) {
    extLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      extLoginError.style.display = 'none';
      extLoginSubmitBtn.disabled = true;
      extLoginSubmitBtn.textContent = 'در حال اتصال و تأیید...';

      const sUrl = (extServerUrl.value || 'https://taskrooz.mohusyn.ir').trim().replace(/\/+$/, '');
      const uName = extUsername.value.trim();
      const uPass = extPassword.value.trim();

      try {
        const res = await fetch(`${sUrl}/api/auth.php?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uName, password: uPass }),
        });

        const data = await res.json();
        if (res.ok && data.token) {
          const acc = {
            user: data.user,
            token: data.token,
            serverUrl: sUrl,
          };
          await Storage.set('account', acc);
          currentAccount = acc;
          loginModal.style.display = 'none';
          extPassword.value = '';
          await renderAccountUI();
          await syncWithServer();
          AudioFeedback.playCheck();
        } else {
          extLoginError.textContent = data.error || 'اطلاعات ورود نادرست است یا ارتباط با سرور برقرار نشد.';
          extLoginError.style.display = 'block';
        }
      } catch (err) {
        extLoginError.textContent = 'عدم برقراری ارتباط با آدرس سرور مشخص شده. لطفاً اتصال اینترنت یا آدرس را بررسی فرمایید.';
        extLoginError.style.display = 'block';
      } finally {
        extLoginSubmitBtn.disabled = false;
        extLoginSubmitBtn.textContent = 'ورود و دریافت کارهای من ⚡';
      }
    });
  }
}

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
