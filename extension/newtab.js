/**
 * Bag Time Assistant Extension - New Tab Engine
 * 100% Offline-capable, Multi-Search-Engine, Dynamic Persian Font Inheritance,
 * Dual-Server Automatic Failover (task.mohusyn.ir & bagtime.negahm.ir),
 * Bale 1-Click Login, Sponsored Shortcuts, Time-based Tasks, Quick Notes,
 * and Jalali Calendar.
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
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  },

  playComplete() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
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

// Jalali to Gregorian
function jalaliToGregorian(jy, jm, jd) {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  let gd = days + 1;
  let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13; gm++) {
    let v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
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

// ── Official Dual Servers & Automated Best Server Detection ──
const BAGTIME_SERVERS = [
  'https://task.mohusyn.ir',
  'https://bagtime.negahm.ir'
];

let activeServerUrl = 'https://task.mohusyn.ir';

async function initServerManager() {
  const saved = await Storage.get('active_server', null);
  if (saved && BAGTIME_SERVERS.includes(saved)) {
    activeServerUrl = saved;
  }
  updateServerUI();
  // Automatically test both servers in background to connect to whichever is online and faster
  autoDetectBestServer();
}

async function autoDetectBestServer() {
  try {
    const checks = BAGTIME_SERVERS.map(async (srv) => {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${srv}/api/settings.php`, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          return { srv, time: performance.now() - start, ok: true };
        }
      } catch {}
      return { srv, time: 99999, ok: false };
    });

    const results = await Promise.all(checks);
    const valid = results.filter((r) => r.ok).sort((a, b) => a.time - b.time);
    if (valid.length > 0 && valid[0].srv !== activeServerUrl) {
      activeServerUrl = valid[0].srv;
      await Storage.set('active_server', activeServerUrl);
      updateServerUI();
    }
  } catch {}
}

function updateServerUI() {
  // Update open webapp links to active server
  const openAppBtn = document.getElementById('openWebAppBtn');
  if (openAppBtn) openAppBtn.href = activeServerUrl;

  const footerLink = document.getElementById('tasksFooterLink');
  if (footerLink) footerLink.href = activeServerUrl;
}

// Smart Fetch with Dual-Server Automatic Failover
async function smartServerFetch(path, options = {}) {
  const candidates = [
    activeServerUrl,
    ...BAGTIME_SERVERS.filter((s) => s !== activeServerUrl)
  ];

  let lastError = null;

  for (const srv of candidates) {
    const cleanUrl = srv.replace(/\/+$/, '') + (path.startsWith('/') ? path : '/' + path);
    const controller = new AbortController();
    const timeout = options.timeout || 5500;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status < 500) {
        if (activeServerUrl !== srv) {
          activeServerUrl = srv;
          await Storage.set('active_server', srv);
          updateServerUI();
        }
        return res;
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }

  throw lastError || new Error('هر دو سرور در دسترس نیستند.');
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

// Available Persian Fonts
const FONTS_CONFIG = {
  vazirmatn: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sahel: "'Sahel', 'Vazirmatn', -apple-system, sans-serif",
  shabnam: "'Shabnam', 'Vazirmatn', -apple-system, sans-serif",
  dana: "'Dana', 'Vazirmatn', -apple-system, sans-serif",
  yekan: "'IRANYekan', 'Yekan', 'Vazirmatn', -apple-system, sans-serif",
  system: "'Tahoma', 'Segoe UI', system-ui, -apple-system, sans-serif",
  inter: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

// Default User Shortcuts (Exactly 8 shortcuts + 1 sponsored + 1 add button = 10 items in 5x2 grid)
const DEFAULT_SHORTCUTS = [
  { id: 'sc_bale', title: 'پیام‌رسان بله', url: 'https://web.bale.ai', icon: '🤖' },
  { id: 'sc_google', title: 'گوگل', url: 'https://www.google.com', icon: '🌐' },
  { id: 'sc_github', title: 'گیت‌هاب', url: 'https://github.com', icon: '🐙' },
  { id: 'sc_youtube', title: 'یوتیوب', url: 'https://www.youtube.com', icon: '▶️' },
  { id: 'sc_wikipedia', title: 'ویکی‌پدیا', url: 'https://fa.wikipedia.org', icon: '📖' },
  { id: 'sc_aparat', title: 'آپارات', url: 'https://www.aparat.com', icon: '📺' },
  { id: 'sc_digikala', title: 'دیجی‌کالا', url: 'https://www.digikala.com', icon: '🛍️' },
  { id: 'sc_bing', title: 'بینگ', url: 'https://www.bing.com', icon: '🔷' },
];

// App State
let tasks = [];
let currentFilter = 'all';
let currentSearchEngine = 'google';
let currentFont = 'vazirmatn';
let currentAccount = null; // { user, token, serverUrl }
let shortcuts = [];
let sponsoredSite = null;

// Mini Calendar State
let calViewYear = 1405;
let calViewMonth = 7; // Mehr

// Bale Login Polling State
let baleLoginTicket = null;
let balePollingInterval = null;

// Debounce Note Sync
let noteSyncTimeout = null;

// DOM Elements Cache
const headerClock = document.getElementById('navLiveClock') || document.getElementById('headerClock');
const headerDate = document.getElementById('navLiveDate') || document.getElementById('headerDate');
const calLiveClock = document.getElementById('calBigClock') || document.getElementById('calLiveClock');
const calLiveDate = document.getElementById('calBigDate') || document.getElementById('calLiveDate');
const fontSelect = document.getElementById('fontSelect');
const heroSearchForm = document.getElementById('heroSearchForm');
const heroSearchInput = document.getElementById('heroSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchEngineBadge = document.getElementById('searchEngineBadge');
const searchEngineIcon = document.getElementById('searchEngineIcon');
const searchEngineName = document.getElementById('searchEngineName');
const shortcutsList = document.getElementById('shortcutsList');

const progressStats = document.getElementById('progressStats');
const progressBar = document.getElementById('progressBar');
const tasksCountBadge = document.getElementById('tasksCountBadge');
const tasksList = document.getElementById('tasksList');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const taskTimeInput = document.getElementById('taskTimeInput');
const prioritySelect = document.getElementById('prioritySelect');
const refreshTasksBtn = document.getElementById('refreshTasksBtn');
const hubSyncNotice = document.getElementById('hubSyncNotice');

const dailyNoteArea = document.getElementById('dailyNoteArea');
const noteStatusText = document.getElementById('noteStatusText');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const copyNoteBtn = document.getElementById('copyNoteBtn');

const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
const calNextMonthBtn = document.getElementById('calNextMonthBtn');
const calCurrentMonthTitle = document.getElementById('calCurrentMonthTitle');
const calDaysGrid = document.getElementById('calDaysGrid');

// Login Modal Elements
const loginModal = document.getElementById('loginModal');
const openLoginModalBtn = document.getElementById('openLoginModalBtn');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const tabBaleLogin = document.getElementById('tabBaleLogin');
const tabManualLogin = document.getElementById('tabManualLogin');
const baleLoginContent = document.getElementById('baleLoginContent');
const manualLoginContent = document.getElementById('manualLoginContent');
const startBaleLoginBtn = document.getElementById('startBaleLoginBtn');
const balePollingStatus = document.getElementById('balePollingStatus');
const extLoginForm = document.getElementById('extLoginForm');
const extServerUrl = document.getElementById('extServerUrl');
const extUsername = document.getElementById('extUsername');
const extPassword = document.getElementById('extPassword');
const extLoginError = document.getElementById('extLoginError');
const extLoginSubmitBtn = document.getElementById('extLoginSubmitBtn');
const accountBox = document.getElementById('accountBox');

// Add Shortcut Modal
const addShortcutModal = document.getElementById('addShortcutModal');
const closeAddShortcutBtn = document.getElementById('closeShortcutModalBtn');
const addShortcutForm = document.getElementById('addShortcutForm');
const shortcutTitleInput = document.getElementById('scTitle');
const shortcutUrlInput = document.getElementById('scUrl');
const shortcutIconInput = document.getElementById('scIcon');

// Server Dropdown
const serverSelectorBtn = document.getElementById('serverSelectorBtn');
const serverPickerMenu = document.getElementById('serverPickerMenu');
const choiceSrv1 = document.getElementById('choiceSrv1');
const choiceSrv2 = document.getElementById('choiceSrv2');

// ── Clock & Date ──
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const timeFormatted = `${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`;

  if (headerClock) headerClock.textContent = timeFormatted;
  if (calLiveClock) calLiveClock.textContent = timeFormatted;
}

// ── Font Management & Server Font Inheritance ──
function applyFont(fontKey, customFontFamily = null) {
  currentFont = fontKey;
  let fontCss = customFontFamily || FONTS_CONFIG[fontKey] || FONTS_CONFIG.vazirmatn;
  document.documentElement.style.setProperty('--font-family-current', fontCss);
  document.body.style.fontFamily = fontCss;
  if (fontSelect && fontKey in FONTS_CONFIG) fontSelect.value = fontKey;
  Storage.set('font_family', fontKey);
}

async function inheritFontsFromServer() {
  try {
    const res = await smartServerFetch('/api/settings.php');
    if (!res.ok) return;
    const data = await res.json();
    const settings = data.settings || {};

    // 1. Inherit Enforced or Default Font from main app
    if (settings.enforcedFont && settings.enforcedFont !== 'system') {
      const serverFont = settings.enforcedFont.toLowerCase();
      if (serverFont in FONTS_CONFIG) {
        applyFont(serverFont);
      }
    }

    // 2. Inherit Admin Sponsored Site for Extension
    if (settings.extensionSponsoredSite) {
      sponsoredSite = settings.extensionSponsoredSite;
      await Storage.set('sponsored_site', sponsoredSite);
      renderShortcuts();
    }
  } catch {}
}

// ── Search Engine Switcher ──
function setSearchEngine(engineKey) {
  if (!SEARCH_ENGINES[engineKey]) engineKey = 'google';
  currentSearchEngine = engineKey;
  const cfg = SEARCH_ENGINES[engineKey];

  if (searchEngineIcon) searchEngineIcon.textContent = cfg.icon;
  if (searchEngineName) searchEngineName.textContent = cfg.name;
  if (heroSearchInput) heroSearchInput.placeholder = cfg.placeholder;

  document.querySelectorAll('.engine-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.engine === engineKey);
  });

  Storage.set('search_engine', engineKey);
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const q = heroSearchInput.value.trim();
  if (!q) return;

  // Direct URL navigation if query looks like a domain
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(q)) {
    window.location.href = 'https://' + q;
    return;
  }
  if (/^https?:\/\//i.test(q)) {
    window.location.href = q;
    return;
  }

  const engine = SEARCH_ENGINES[currentSearchEngine] || SEARCH_ENGINES.google;
  window.location.href = engine.url + encodeURIComponent(q);
}

// ── Shortcuts / Bookmarks (Apps Grid - Exact 5x2 Wireframe) ──
function renderShortcuts() {
  if (!shortcutsList) return;
  shortcutsList.innerHTML = '';

  // 1. FIRST ITEM: Sponsored Site from Admin (if enabled)
  if (sponsoredSite && sponsoredSite.enabled !== false && sponsoredSite.url) {
    const spEl = document.createElement('a');
    spEl.href = sponsoredSite.url;
    spEl.target = '_blank';
    spEl.rel = 'noopener noreferrer';
    spEl.className = 'app-tile sponsored';
    spEl.title = `اسپانسر: ${sponsoredSite.title}`;

    const iconContent = (sponsoredSite.icon && sponsoredSite.icon.startsWith('http'))
      ? `<img src="${escapeHtml(sponsoredSite.icon)}" alt="logo" />`
      : `<span>${escapeHtml(sponsoredSite.icon || '⭐')}</span>`;

    spEl.innerHTML = `
      <span class="app-sponsored-badge">${escapeHtml(sponsoredSite.badge || 'اسپانسر')}</span>
      <div class="app-tile-icon">
        ${iconContent}
      </div>
      <span class="app-tile-name">${escapeHtml(sponsoredSite.title)}</span>
    `;
    shortcutsList.appendChild(spEl);
  }

  // 2. User-added Shortcuts (Grid of rounded squares)
  shortcuts.forEach((sc, idx) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'app-tile';

    const iconContent = (sc.icon && sc.icon.startsWith('http'))
      ? `<img src="${escapeHtml(sc.icon)}" alt="icon" />`
      : `<span>${escapeHtml(sc.icon || '🔗')}</span>`;

    itemEl.innerHTML = `
      <button type="button" class="app-delete-btn" title="حذف میانبر" data-index="${idx}">✕</button>
      <div class="app-tile-icon">
        ${iconContent}
      </div>
      <span class="app-tile-name">${escapeHtml(sc.title)}</span>
    `;

    itemEl.addEventListener('click', (e) => {
      if ((e.target).classList.contains('app-delete-btn')) {
        e.stopPropagation();
        deleteShortcut(idx);
        return;
      }
      window.open(sc.url, '_blank');
    });

    shortcutsList.appendChild(itemEl);
  });

  // 3. Add Shortcut Button (Rounded square tile)
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'app-tile add-new';
  addBtn.title = 'افزودن میانبر جدید به صفحه';
  addBtn.innerHTML = `
    <div class="app-tile-icon" style="font-size: 1.6rem; font-weight: 300;">+</div>
    <span class="app-tile-name">افزودن</span>
  `;
  addBtn.addEventListener('click', () => {
    if (addShortcutModal) addShortcutModal.style.display = 'flex';
  });
  shortcutsList.appendChild(addBtn);
}

async function addShortcut(title, url, icon = '🔗') {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  shortcuts.push({
    id: 'sc_' + Date.now(),
    title,
    url,
    icon: icon || '🔗',
  });
  await Storage.set('shortcuts', shortcuts);
  renderShortcuts();
}

async function deleteShortcut(index) {
  shortcuts.splice(index, 1);
  await Storage.set('shortcuts', shortcuts);
  renderShortcuts();
}

// ── Tasks & Real-Time Sync Management ──
let selectedCalDate = null;
let selectedCalDay = null;

function jalaliToISO(jy, jm, jd) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const mm = String(gm).padStart(2, '0');
  const dd = String(gd).padStart(2, '0');
  return `${gy}-${mm}-${dd}`;
}

function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = '';

  const activeDate = selectedCalDate || getTodayDateKey();
  const dateTasks = tasks.filter((t) => !t.date || t.date === activeDate);

  const filtered = dateTasks.filter((t) => {
    if (currentFilter === 'pending') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  if (tasksCountBadge) {
    tasksCountBadge.textContent = `${toPersianDigits(filtered.length)} تسک`;
  }

  updateProgress();

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div class="tasks-empty-state">
        <div class="empty-icon">☕</div>
        <p class="empty-title">کاری برای این تاریخ ثبت نشده است</p>
        <p class="empty-desc">با استفاده از کادر بالا کار جدیدی بیفزایید تا مستقیماً با سرور همگام شود.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((task) => {
    const el = document.createElement('div');
    el.className = `task-item ${task.completed ? 'completed' : ''}`;

    el.innerHTML = `
      <div class="task-item-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" />
        <span class="task-item-title">${escapeHtml(task.title)}</span>
      </div>
      <div class="task-item-right">
        ${task.time ? `<span class="task-time-badge">${escapeHtml(toPersianDigits(task.time))}</span>` : ''}
        <span class="task-priority-tag ${task.priority || 'medium'}" title="اولویت: ${task.priority}"></span>
        <button type="button" class="task-delete-btn" title="حذف تسک" data-id="${task.id}">✕</button>
      </div>
    `;

    el.querySelector('.task-checkbox').addEventListener('change', (e) => {
      toggleTask(task.id, e.target.checked);
    });

    el.querySelector('.task-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    tasksList.appendChild(el);
  });
}

async function addTask(title, time = '', priority = 'medium') {
  const taskDate = selectedCalDate || getTodayDateKey();
  const newTask = {
    id: 't_' + Date.now(),
    title,
    time,
    priority,
    completed: false,
    date: taskDate,
  };

  tasks.unshift(newTask);
  await Storage.set('tasks', tasks);
  renderTasks();
  renderCalendar();
  AudioFeedback.playCheck();

  // Push to server with failover and immediately assign server ID
  if (currentAccount && currentAccount.token) {
    smartServerFetch('/api/tasks.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({
        title,
        time,
        priority,
        date: newTask.date,
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data && data.task && data.task.id) {
          const srvId = String(data.task.id);
          const tItem = tasks.find((item) => item.id === newTask.id);
          if (tItem) {
            tItem.id = srvId;
            await Storage.set('tasks', tasks);
            renderTasks();
            renderCalendar();
          }
        }
      })
      .catch(() => {});
  }
}

async function toggleTask(id, completed) {
  const t = tasks.find((item) => item.id === id);
  if (!t) return;
  t.completed = completed;
  await Storage.set('tasks', tasks);
  renderTasks();
  if (t.completed) AudioFeedback.playCheck();

  if (currentAccount && currentAccount.token) {
    smartServerFetch('/api/tasks.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({ action: 'toggle', id }),
    }).catch(() => {});
  }
}

async function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  await Storage.set('tasks', tasks);
  renderTasks();
  renderCalendar();

  if (currentAccount && currentAccount.token) {
    smartServerFetch('/api/tasks.php', {
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
  if (!progressStats || !progressBar) return;
  const activeDate = selectedCalDate || getTodayDateKey();
  const dateTasks = tasks.filter((t) => !t.date || t.date === activeDate);
  const total = dateTasks.length;
  const done = dateTasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  progressStats.textContent = `${toPersianDigits(done)} از ${toPersianDigits(total)} (${toPersianDigits(percent)}٪)`;
  progressBar.style.width = `${percent}%`;
}

// ── Quick Daily Notes ──
async function loadDailyNote() {
  const noteDate = selectedCalDate || getTodayDateKey();
  const localNote = await Storage.get('daily_note_' + noteDate, '');
  if (dailyNoteArea) dailyNoteArea.value = localNote;

  if (currentAccount && currentAccount.token) {
    try {
      const res = await smartServerFetch('/api/notes.php', {
        headers: { 'Authorization': `Bearer ${currentAccount.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverNotes = data.notes || {};
        if (serverNotes[noteDate] !== undefined && !localNote) {
          dailyNoteArea.value = serverNotes[noteDate];
          await Storage.set('daily_note_' + noteDate, serverNotes[noteDate]);
        }
      }
    } catch {}
  }
}

async function saveDailyNote(manual = false) {
  if (!dailyNoteArea) return;
  const content = dailyNoteArea.value;
  const noteDate = selectedCalDate || getTodayDateKey();
  await Storage.set('daily_note_' + noteDate, content);

  if (noteStatusText) {
    noteStatusText.textContent = manual ? 'یادداشت با موفقیت ذخیره شد ✓' : 'ذخیره خودکار ✓';
    setTimeout(() => {
      if (noteStatusText) noteStatusText.textContent = 'آماده نوشتن';
    }, 2500);
  }

  if (currentAccount && currentAccount.token) {
    smartServerFetch('/api/notes.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({ date: noteDate, content }),
    }).catch(() => {});
  }
}

function getTodayDateKey() {
  return new Date().toISOString().split('T')[0];
}

// ── Interactive Jalali Calendar ──
function initCalendar() {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  calViewYear = jy;
  calViewMonth = jm;
  selectedCalDay = jd;
  selectedCalDate = getTodayDateKey();
  renderCalendar();
}

function renderCalendar() {
  if (!calDaysGrid || !calCurrentMonthTitle) return;

  calCurrentMonthTitle.textContent = `${PERSIAN_MONTHS[calViewMonth - 1]} ${toPersianDigits(calViewYear)}`;
  calDaysGrid.innerHTML = '';

  const now = new Date();
  const [todayY, todayM, todayD] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const [gy, gm, gd] = jalaliToGregorian(calViewYear, calViewMonth, 1);
  const firstDayDate = new Date(gy, gm - 1, gd);
  const weekdayOffset = (firstDayDate.getDay() + 1) % 7;
  const monthDaysCount = (calViewMonth <= 6) ? 31 : ((calViewMonth <= 11) ? 30 : 29);

  for (let i = 0; i < weekdayOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day-cell empty';
    calDaysGrid.appendChild(emptyCell);
  }

  for (let d = 1; d <= monthDaysCount; d++) {
    const dayCell = document.createElement('div');
    const isToday = (calViewYear === todayY && calViewMonth === todayM && d === todayD);
    const dayISO = jalaliToISO(calViewYear, calViewMonth, d);
    const isSelected = (selectedCalDate === dayISO) || (!selectedCalDate && isToday);
    const hasTasks = tasks.some((t) => t.date === dayISO);

    dayCell.className = `cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''}`;
    dayCell.textContent = toPersianDigits(d);
    dayCell.title = `${d} ${PERSIAN_MONTHS[calViewMonth - 1]} ${toPersianDigits(calViewYear)} (${hasTasks ? 'دارای تسک' : 'بدون تسک'})`;

    dayCell.addEventListener('click', () => {
      selectedCalDay = d;
      selectedCalDate = dayISO;
      const calBigDate = document.getElementById('calBigDate');
      if (calBigDate) {
        calBigDate.textContent = isToday
          ? getJalaliDateString()
          : `کارهای ${toPersianDigits(d)} ${PERSIAN_MONTHS[calViewMonth - 1]} ${toPersianDigits(calViewYear)}`;
      }
      renderCalendar();
      renderTasks();
      loadDailyNote();
    });

    calDaysGrid.appendChild(dayCell);
  }
}

// ── Account & Auth State (With Mandatory Login Gate) ──
async function renderAccountUI() {
  currentAccount = await Storage.get('account', null);

  if (accountBox) {
    accountBox.innerHTML = '';
    if (currentAccount && currentAccount.user && currentAccount.token) {
      // LOGGED IN: UNLOCK EXTENSION
      document.body.classList.remove('locked-app');
      if (loginModal) loginModal.style.display = 'none';

      const u = currentAccount.user;
      const displayName = u.name || u.username;
      const initial = (displayName.charAt(0) || 'U').toUpperCase();
      const avatarHtml = (u.avatar && u.avatar.startsWith('data:'))
        ? `<img src="${u.avatar}" alt="${escapeHtml(displayName)}">`
        : `<span>${escapeHtml(initial)}</span>`;

      accountBox.innerHTML = `
        <div class="user-profile-menu-wrapper" id="userProfileMenuWrapper">
          <button type="button" class="user-profile-btn" id="userProfileBtn" title="پروفایل کاربری: ${escapeHtml(displayName)}">
            <div class="user-avatar-circle">
              ${avatarHtml}
            </div>
            <div class="user-info-text">
              <span class="user-name-title">${escapeHtml(displayName)}</span>
              <span class="user-status-subtitle">🟢 متصل</span>
            </div>
            <span class="user-chevron">▾</span>
          </button>

          <div class="profile-popover" id="profilePopover" style="display: none;">
            <div class="popover-user-card">
              <div class="popover-avatar-lg">
                ${avatarHtml}
              </div>
              <div class="popover-user-details">
                <h4 class="popover-user-name">${escapeHtml(displayName)}</h4>
                <span class="popover-user-tag">@${escapeHtml(u.username)}</span>
                <span class="popover-badge">${u.role === 'admin' ? 'مدیر سیستم ⭐' : 'عضو بگ تایم ✨'}</span>
              </div>
            </div>

            <div class="popover-divider"></div>

            <div class="popover-actions">
              <a href="${activeServerUrl}" target="_blank" class="popover-action-item">
                <span>🚀</span>
                <span>ورود به پلنر اصلی</span>
              </a>
              <button type="button" id="popoverSyncBtn" class="popover-action-item">
                <span>🔄</span>
                <span>همگام‌سازی سریع کارها</span>
              </button>
              <button type="button" id="logoutBtn" class="popover-action-item popover-logout">
                <span>🚪</span>
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const userProfileBtn = document.getElementById('userProfileBtn');
      const profilePopover = document.getElementById('profilePopover');
      if (userProfileBtn && profilePopover) {
        userProfileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isShown = profilePopover.style.display === 'flex';
          profilePopover.style.display = isShown ? 'none' : 'flex';
          userProfileBtn.classList.toggle('active', !isShown);
        });
      }

      const popoverSyncBtn = document.getElementById('popoverSyncBtn');
      if (popoverSyncBtn) {
        popoverSyncBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (profilePopover) profilePopover.style.display = 'none';
          if (userProfileBtn) userProfileBtn.classList.remove('active');
          AudioFeedback.playCheck();
          await syncWithServer();
        });
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟ با خروج، استفاده از افزونه تا ورود مجدد قفل خواهد شد.')) {
            await Storage.set('account', null);
            currentAccount = null;
            tasks = [];
            renderTasks();
            await renderAccountUI();
          }
        });
      }

      if (hubSyncNotice) {
        hubSyncNotice.textContent = `همگام‌سازی زنده فعال است (${escapeHtml(displayName)})`;
      }
      return true;
    } else {
      // NOT LOGGED IN: LOCK WORKSPACE WITH MANDATORY LOGIN GATE
      document.body.classList.add('locked-app');
      if (loginModal) loginModal.style.display = 'flex';
      const closeBtn = document.getElementById('closeLoginModalBtn');
      if (closeBtn) closeBtn.style.display = 'none';

      accountBox.innerHTML = `
        <button type="button" id="openLoginModalBtn" class="btn-connect">
          <span class="dot-status unlinked"></span>
          <span>ورود الزامی به بگ تایم</span>
        </button>
      `;

      const openBtn = document.getElementById('openLoginModalBtn');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          if (loginModal) loginModal.style.display = 'flex';
        });
      }

      if (hubSyncNotice) {
        hubSyncNotice.textContent = '🔒 قفل افزونه: لطفاً ابتدا وارد حساب خود شوید.';
      }
      return false;
    }
  }
  return false;
}

async function syncWithServer() {
  if (!currentAccount || !currentAccount.token) return;

  if (refreshTasksBtn) refreshTasksBtn.classList.add('spinning');

  try {
    const res = await smartServerFetch('/api/tasks.php', {
      headers: {
        'Authorization': `Bearer ${currentAccount.token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        tasks = data.tasks.map((st) => ({
          id: String(st.id),
          title: st.title,
          priority: st.priority || 'medium',
          completed: Boolean(st.completed),
          time: st.time || '',
          date: st.date || getTodayDateKey(),
        }));
        await Storage.set('tasks', tasks);
        renderTasks();
        renderCalendar();
      }
    }
  } catch (e) {
  } finally {
    if (refreshTasksBtn) {
      setTimeout(() => refreshTasksBtn.classList.remove('spinning'), 500);
    }
  }
}

// ── Bale 1-Click Login Flow ──
async function handleStartBaleLogin() {
  if (!startBaleLoginBtn) return;
  startBaleLoginBtn.disabled = true;
  startBaleLoginBtn.textContent = 'در حال ایجاد تیکت ورود...';
  if (balePollingStatus) balePollingStatus.style.display = 'flex';

  try {
    const res = await smartServerFetch('/api/bale.php?action=create_bale_login');
    const data = await res.json();

    if (data.ok && data.ticket && data.baleBotLink) {
      baleLoginTicket = data.ticket;
      window.open(data.baleBotLink, '_blank');

      if (balePollingInterval) clearInterval(balePollingInterval);
      balePollingInterval = setInterval(async () => {
        try {
          const chkRes = await smartServerFetch(`/api/bale.php?action=check_bale_login&ticket=${encodeURIComponent(baleLoginTicket)}`);
          const chkData = await chkRes.json();

          if (chkData.status === 'approved' && chkData.user && chkData.token) {
            clearInterval(balePollingInterval);
            balePollingInterval = null;

            const acc = {
              user: chkData.user,
              token: chkData.token,
              serverUrl: activeServerUrl,
            };
            await Storage.set('account', acc);
            currentAccount = acc;

            AudioFeedback.playComplete();
            if (loginModal) loginModal.style.display = 'none';
            if (balePollingStatus) balePollingStatus.style.display = 'none';
            startBaleLoginBtn.disabled = false;
            startBaleLoginBtn.textContent = '🚀 ورود آنی با ربات بله';

            await renderAccountUI();
            await syncWithServer();
            await inheritFontsFromServer();
          }
        } catch {}
      }, 2000);
    } else {
      alert('خطا در صدور تیکت ورود بله: ' + (data.error || 'پاسخ ناموفق'));
      startBaleLoginBtn.disabled = false;
      startBaleLoginBtn.textContent = '🚀 ورود آنی با ربات بله';
      if (balePollingStatus) balePollingStatus.style.display = 'none';
    }
  } catch (e) {
    alert('عدم برقراری ارتباط با سرور بله یا سرورهای بگ تایم.');
    startBaleLoginBtn.disabled = false;
    startBaleLoginBtn.textContent = '🚀 ورود آنی با ربات بله';
    if (balePollingStatus) balePollingStatus.style.display = 'none';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Initialize App ──
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  const jDateStr = getJalaliDateString();
  if (headerDate) headerDate.textContent = jDateStr;
  if (calLiveDate) calLiveDate.textContent = jDateStr;

  // Initialize Dual-Server Manager
  await initServerManager();

  // Initialize Calendar
  initCalendar();

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

  document.querySelectorAll('.engine-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      setSearchEngine(pill.dataset.engine);
    });
  });

  if (searchEngineBadge) {
    searchEngineBadge.addEventListener('click', () => {
      const keys = Object.keys(SEARCH_ENGINES);
      const nextIdx = (keys.indexOf(currentSearchEngine) + 1) % keys.length;
      setSearchEngine(keys[nextIdx]);
    });
  }

  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', handleSearchSubmit);
  }

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

  // Keyboard shortcut '/'
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== heroSearchInput && document.activeElement !== taskInput && document.activeElement !== dailyNoteArea) {
      e.preventDefault();
      heroSearchInput.focus();
    }
  });

  // Load Shortcuts
  shortcuts = (await Storage.get('shortcuts', null)) || DEFAULT_SHORTCUTS;
  sponsoredSite = await Storage.get('sponsored_site', {
    enabled: true,
    title: 'سامانه ابری بگ تایم',
    url: activeServerUrl,
    icon: '⭐',
    badge: 'اسپانسر',
  });
  renderShortcuts();

  // Load Tasks
  tasks = (await Storage.get('tasks', [])) || [];
  renderTasks();

  // Load Daily Note
  await loadDailyNote();

  if (dailyNoteArea) {
    dailyNoteArea.addEventListener('input', () => {
      if (noteStatusText) noteStatusText.textContent = 'در حال ذخیره‌سازی...';
      clearTimeout(noteSyncTimeout);
      noteSyncTimeout = setTimeout(() => saveDailyNote(false), 800);
    });
  }

  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', () => saveDailyNote(true));
  }

  if (copyNoteBtn) {
    copyNoteBtn.addEventListener('click', () => {
      if (!dailyNoteArea) return;
      navigator.clipboard.writeText(dailyNoteArea.value || '');
      AudioFeedback.playCheck();
      alert('یادداشت امروز در کلیپ‌بورد کپی شد.');
    });
  }

  // Calendar Month Navigation
  if (calPrevMonthBtn) {
    calPrevMonthBtn.addEventListener('click', () => {
      if (calViewMonth > 1) {
        calViewMonth--;
      } else {
        calViewMonth = 12;
        calViewYear--;
      }
      renderCalendar();
    });
  }

  if (calNextMonthBtn) {
    calNextMonthBtn.addEventListener('click', () => {
      if (calViewMonth < 12) {
        calViewMonth++;
      } else {
        calViewMonth = 1;
        calViewYear++;
      }
      renderCalendar();
    });
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
    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = taskInput.value.trim();
      if (!val) return;
      const timeVal = taskTimeInput?.value.trim() || '';
      const prioVal = prioritySelect?.value || 'medium';
      addTask(val, timeVal, prioVal);
      taskInput.value = '';
      if (taskTimeInput) taskTimeInput.value = '';
    });
  }

  // Server Dropdown Handlers
  if (serverSelectorBtn && serverPickerMenu) {
    serverSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = serverPickerMenu.style.display === 'flex';
      serverPickerMenu.style.display = isOpen ? 'none' : 'flex';
    });
  }

  if (choiceSrv1) {
    choiceSrv1.addEventListener('click', async () => {
      activeServerUrl = 'https://task.mohusyn.ir';
      await Storage.set('active_server', activeServerUrl);
      updateServerUI();
      if (serverPickerMenu) serverPickerMenu.style.display = 'none';
      syncWithServer();
    });
  }

  if (choiceSrv2) {
    choiceSrv2.addEventListener('click', async () => {
      activeServerUrl = 'https://bagtime.negahm.ir';
      await Storage.set('active_server', activeServerUrl);
      updateServerUI();
      if (serverPickerMenu) serverPickerMenu.style.display = 'none';
      syncWithServer();
    });
  }

  // Close popovers and menus on outside click
  document.addEventListener('click', (e) => {
    const profilePopover = document.getElementById('profilePopover');
    const userProfileBtn = document.getElementById('userProfileBtn');
    if (profilePopover && profilePopover.style.display === 'flex') {
      if (!profilePopover.contains(e.target) && !userProfileBtn?.contains(e.target)) {
        profilePopover.style.display = 'none';
        userProfileBtn?.classList.remove('active');
      }
    }
  });

  // Load Account & Mandatory Gate Enforcement
  const isLoggedIn = await renderAccountUI();
  if (isLoggedIn) {
    await syncWithServer();
    await inheritFontsFromServer();
  }

  if (refreshTasksBtn) {
    refreshTasksBtn.addEventListener('click', syncWithServer);
  }

  // Bale 1-Click Login Trigger
  if (startBaleLoginBtn) {
    startBaleLoginBtn.addEventListener('click', handleStartBaleLogin);
  }

  // Login Modal Tabs
  if (tabBaleLogin && tabManualLogin) {
    tabBaleLogin.addEventListener('click', () => {
      tabBaleLogin.classList.add('active');
      tabManualLogin.classList.remove('active');
      if (baleLoginContent) baleLoginContent.style.display = 'block';
      if (manualLoginContent) manualLoginContent.style.display = 'none';
    });
    tabManualLogin.addEventListener('click', () => {
      tabManualLogin.classList.add('active');
      tabBaleLogin.classList.remove('active');
      if (baleLoginContent) baleLoginContent.style.display = 'none';
      if (manualLoginContent) manualLoginContent.style.display = 'block';
    });
  }

  // Modal Closures
  if (closeLoginModalBtn && loginModal) {
    closeLoginModalBtn.addEventListener('click', () => {
      if (document.body.classList.contains('locked-app')) return;
      loginModal.style.display = 'none';
      if (balePollingInterval) {
        clearInterval(balePollingInterval);
        balePollingInterval = null;
      }
    });
  }

  if (closeAddShortcutBtn && addShortcutModal) {
    closeAddShortcutBtn.addEventListener('click', () => {
      addShortcutModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (document.body.classList.contains('locked-app')) return;
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
      if (balePollingInterval) {
        clearInterval(balePollingInterval);
        balePollingInterval = null;
      }
    }
    if (e.target === addShortcutModal) {
      addShortcutModal.style.display = 'none';
    }
  });

  // Add Shortcut Form Submit
  if (addShortcutForm) {
    addShortcutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = shortcutTitleInput?.value || '';
      const url = shortcutUrlInput?.value || '';
      const icon = shortcutIconInput?.value || '🔗';
      if (!title || !url) return;
      addShortcut(title, url, icon);
      addShortcutModal.style.display = 'none';
      shortcutTitleInput.value = '';
      shortcutUrlInput.value = '';
      if (shortcutIconInput) shortcutIconInput.value = '🔗';
    });
  }

  // Manual Login Form Submit with Automated Server Detection & Failover
  if (extLoginForm) {
    extLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      extLoginError.style.display = 'none';
      extLoginSubmitBtn.disabled = true;
      extLoginSubmitBtn.textContent = 'در حال اتصال و ورود...';

      const uName = extUsername?.value.trim() || '';
      const uPass = extPassword?.value.trim() || '';

      const serversToTry = [
        activeServerUrl,
        ...BAGTIME_SERVERS.filter((s) => s !== activeServerUrl)
      ];

      let lastLoginError = 'اطلاعات ورود نادرست است یا ارتباط با سرور برقرار نشد.';
      let loginSuccess = false;

      for (const sUrl of serversToTry) {
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
            activeServerUrl = sUrl;
            await Storage.set('active_server', sUrl);
            await Storage.set('account', acc);
            currentAccount = acc;
            loginModal.style.display = 'none';
            if (extPassword) extPassword.value = '';
            await renderAccountUI();
            await syncWithServer();
            await inheritFontsFromServer();
            AudioFeedback.playCheck();
            loginSuccess = true;
            break;
          } else if (data.error) {
            lastLoginError = data.error;
          }
        } catch (err) {
          lastLoginError = 'عدم برقراری ارتباط با سرور. در حال بررسی سرور پشتیبان...';
        }
      }

      if (!loginSuccess) {
        extLoginError.textContent = lastLoginError;
        extLoginError.style.display = 'block';
      }

      extLoginSubmitBtn.disabled = false;
      extLoginSubmitBtn.textContent = 'ورود و دریافت کارهای من ⚡';
    });
  }
}

// Start on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
