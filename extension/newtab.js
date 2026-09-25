/**
 * Bag Time Assistant Extension - New Tab Engine
 * 100% Offline-capable, Multi-Search-Engine, Dynamic Persian Font Inheritance,
 * Bale 1-Click Login, Sponsored Shortcuts, Time-based Tasks, Quick Notes,
 * Jalali Calendar & Pomodoro Timer.
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

// Jalali to Gregorian (For calendar calculations)
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

// Default User Shortcuts
const DEFAULT_SHORTCUTS = [
  { id: 'sc_google', title: 'گوگل', url: 'https://www.google.com', icon: '🌐' },
  { id: 'sc_bale', title: 'پیام‌رسان بله', url: 'https://web.bale.ai', icon: '🤖' },
  { id: 'sc_github', title: 'گیت‌هاب', url: 'https://github.com', icon: '🐙' },
  { id: 'sc_youtube', title: 'یوتیوب', url: 'https://www.youtube.com', icon: '▶️' },
  { id: 'sc_wikipedia', title: 'ویکی‌پدیا', url: 'https://fa.wikipedia.org', icon: '📖' },
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

// Focus Timer State
let focusDurationSeconds = 25 * 60;
let focusRemainingSeconds = 25 * 60;
let focusIntervalId = null;
let focusSessionsCompleted = 0;
let focusMinutesTotal = 0;

// Bale Login Polling State
let baleLoginTicket = null;
let balePollingInterval = null;

// Debounce Note Sync
let noteSyncTimeout = null;

// DOM Elements Cache
const headerClock = document.getElementById('headerClock');
const headerDate = document.getElementById('headerDate');
const calLiveClock = document.getElementById('calLiveClock');
const calLiveDate = document.getElementById('calLiveDate');
const fontSelect = document.getElementById('fontSelect');
const heroEngineIcon = document.getElementById('heroEngineIcon');
const heroEngineTitle = document.getElementById('heroEngineTitle');
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

const focusTimerDisplay = document.getElementById('focusTimerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const focusSessionsCount = document.getElementById('focusSessionsCount');
const focusMinutesTotalEl = document.getElementById('focusMinutesTotal');
const focusModeLabel = document.getElementById('focusModeLabel');

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
const closeAddShortcutBtn = document.getElementById('closeAddShortcutBtn');
const addShortcutForm = document.getElementById('addShortcutForm');
const shortcutTitleInput = document.getElementById('shortcutTitleInput');
const shortcutUrlInput = document.getElementById('shortcutUrlInput');

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

async function inheritFontsFromServer(serverUrl) {
  try {
    const sUrl = (serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
    const res = await fetch(`${sUrl}/api/settings.php`);
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

// ── Shortcuts / Bookmarks (With Sponsored First) ──
function renderShortcuts() {
  if (!shortcutsList) return;
  shortcutsList.innerHTML = '';

  // 1. FIRST ITEM: Sponsored Site from Admin (if enabled)
  if (sponsoredSite && sponsoredSite.enabled !== false && sponsoredSite.url) {
    const spEl = document.createElement('a');
    spEl.href = sponsoredSite.url;
    spEl.target = '_blank';
    spEl.rel = 'noopener noreferrer';
    spEl.className = 'shortcut-item sponsored';
    spEl.title = `اسپانسر: ${sponsoredSite.title}`;

    const iconContent = (sponsoredSite.icon && sponsoredSite.icon.startsWith('http'))
      ? `<img src="${escapeHtml(sponsoredSite.icon)}" alt="logo" />`
      : `<span>${escapeHtml(sponsoredSite.icon || '⭐')}</span>`;

    spEl.innerHTML = `
      <span class="shortcut-badge">${escapeHtml(sponsoredSite.badge || 'اسپانسر')}</span>
      <div class="shortcut-icon-box">
        ${iconContent}
      </div>
      <span class="shortcut-title">${escapeHtml(sponsoredSite.title)}</span>
    `;
    shortcutsList.appendChild(spEl);
  }

  // 2. User-added Shortcuts
  shortcuts.forEach((sc, idx) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'shortcut-item';

    const iconContent = (sc.icon && sc.icon.startsWith('http'))
      ? `<img src="${escapeHtml(sc.icon)}" alt="icon" />`
      : `<span>${escapeHtml(sc.icon || '🔗')}</span>`;

    itemEl.innerHTML = `
      <button type="button" class="shortcut-delete-btn" title="حذف میانبر" data-index="${idx}">✕</button>
      <div class="shortcut-icon-box">
        ${iconContent}
      </div>
      <span class="shortcut-title">${escapeHtml(sc.title)}</span>
    `;

    itemEl.addEventListener('click', (e) => {
      if ((e.target).classList.contains('shortcut-delete-btn')) {
        e.stopPropagation();
        deleteShortcut(idx);
        return;
      }
      window.open(sc.url, '_blank');
    });

    shortcutsList.appendChild(itemEl);
  });

  // 3. Add Shortcut Button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-add-shortcut';
  addBtn.title = 'افزودن میانبر جدید به صفحه';
  addBtn.innerHTML = `
    <div class="add-shortcut-icon">+</div>
    <span class="shortcut-title">افزودن</span>
  `;
  addBtn.addEventListener('click', () => {
    if (addShortcutModal) addShortcutModal.style.display = 'flex';
  });
  shortcutsList.appendChild(addBtn);
}

async function addShortcut(title, url) {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  const newSc = {
    id: 'sc_' + Date.now(),
    title: title.trim(),
    url: cleanUrl,
    icon: '🌐',
  };
  shortcuts.push(newSc);
  await Storage.set('shortcuts', shortcuts);
  renderShortcuts();
  AudioFeedback.playCheck();
}

async function deleteShortcut(idx) {
  shortcuts.splice(idx, 1);
  await Storage.set('shortcuts', shortcuts);
  renderShortcuts();
}

// ── Time-based Tasks Rendering & Management ──
function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = '';

  let filtered = tasks;
  if (currentFilter === 'pending') {
    filtered = tasks.filter((t) => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter((t) => t.completed);
  }

  if (tasksCountBadge) tasksCountBadge.textContent = `${toPersianDigits(filtered.length)} تسک`;

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <div class="tasks-empty-state">
        <div class="empty-icon">☕</div>
        <div class="empty-title">${currentFilter === 'completed' ? 'هنوز کاری تکمیل نشده است' : 'کاری در این لیست وجود ندارد'}</div>
        <div class="empty-sub">با استفاده از کادر بالا تسک جدید اضافه کنید یا در پلنر اصلی برنامه‌ریزی کنید.</div>
      </div>
    `;
    updateProgress();
    return;
  }

  filtered.forEach((task) => {
    const el = document.createElement('div');
    el.className = `task-item ${task.completed ? 'completed' : ''}`;

    const priorityClass = task.priority || 'medium';
    const timeDisplay = task.time ? `<span class="task-time-badge">⏰ ${toPersianDigits(task.time)}</span>` : '';

    el.innerHTML = `
      <div class="task-item-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
        <span class="task-item-title">${escapeHtml(task.title)}</span>
      </div>
      <div class="task-item-right">
        ${timeDisplay}
        <span class="task-priority-tag ${priorityClass}" title="اولویت ${priorityClass}"></span>
        <button type="button" class="task-delete-btn" title="حذف">✕</button>
      </div>
    `;

    const checkbox = el.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const delBtn = el.querySelector('.task-delete-btn');
    delBtn.addEventListener('click', () => deleteTask(task.id));

    tasksList.appendChild(el);
  });

  updateProgress();
}

async function toggleTask(id) {
  const t = tasks.find((item) => item.id === id);
  if (!t) return;

  t.completed = !t.completed;
  await Storage.set('tasks', tasks);
  renderTasks();
  if (t.completed) AudioFeedback.playCheck();

  // Push update to Bag Time server if connected
  if (currentAccount && currentAccount.token) {
    const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/tasks.php`, {
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
  if (!progressStats || !progressBar) return;
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  progressStats.textContent = `${toPersianDigits(done)} از ${toPersianDigits(total)} (${toPersianDigits(percent)}٪)`;
  progressBar.style.width = `${percent}%`;
}

// ── Quick Daily Notes ──
async function loadDailyNote() {
  const localNote = await Storage.get('daily_note_' + getTodayDateKey(), '');
  if (dailyNoteArea) dailyNoteArea.value = localNote;

  // Sync from server if connected
  if (currentAccount && currentAccount.token) {
    try {
      const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/notes.php`, {
        headers: { 'Authorization': `Bearer ${currentAccount.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverNotes = data.notes || {};
        const todayKey = getTodayDateKey();
        if (serverNotes[todayKey] && !localNote) {
          dailyNoteArea.value = serverNotes[todayKey];
          await Storage.set('daily_note_' + todayKey, serverNotes[todayKey]);
        }
      }
    } catch {}
  }
}

async function saveDailyNote(manual = false) {
  if (!dailyNoteArea) return;
  const content = dailyNoteArea.value;
  const todayKey = getTodayDateKey();
  await Storage.set('daily_note_' + todayKey, content);

  if (noteStatusText) {
    noteStatusText.textContent = manual ? 'یادداشت با موفقیت ذخیره شد ✓' : 'ذخیره خودکار ✓';
    setTimeout(() => {
      if (noteStatusText) noteStatusText.textContent = 'آماده نوشتن';
    }, 2500);
  }

  if (currentAccount && currentAccount.token) {
    const baseUrl = (currentAccount.serverUrl || 'https://taskrooz.mohusyn.ir').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/notes.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccount.token}`,
      },
      body: JSON.stringify({ date: todayKey, content }),
    }).catch(() => {});
  }
}

function getTodayDateKey() {
  return new Date().toISOString().split('T')[0];
}

// ── Mini Jalali Calendar ──
function initCalendar() {
  const now = new Date();
  const [jy, jm] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  calViewYear = jy;
  calViewMonth = jm;
  renderCalendar();
}

function renderCalendar() {
  if (!calDaysGrid || !calCurrentMonthTitle) return;

  calCurrentMonthTitle.textContent = `${PERSIAN_MONTHS[calViewMonth - 1]} ${toPersianDigits(calViewYear)}`;
  calDaysGrid.innerHTML = '';

  const now = new Date();
  const [todayY, todayM, todayD] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // First day of month in Gregorian to find day of week
  const [gy, gm, gd] = jalaliToGregorian(calViewYear, calViewMonth, 1);
  const firstDayDate = new Date(gy, gm - 1, gd);
  // Persian week: Saturday is 0, Sunday is 1, ... Friday is 6
  const weekdayOffset = (firstDayDate.getDay() + 1) % 7;

  // Month days count (Jalali months 1-6 have 31 days, 7-11 have 30 days, 12 has 29/30)
  const monthDaysCount = (calViewMonth <= 6) ? 31 : ((calViewMonth <= 11) ? 30 : 29);

  // Empty cells for offset
  for (let i = 0; i < weekdayOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day-cell empty';
    calDaysGrid.appendChild(emptyCell);
  }

  // Days
  for (let d = 1; d <= monthDaysCount; d++) {
    const dayCell = document.createElement('div');
    const isToday = (calViewYear === todayY && calViewMonth === todayM && d === todayD);
    dayCell.className = `cal-day-cell ${isToday ? 'today' : ''}`;
    dayCell.textContent = toPersianDigits(d);
    dayCell.title = `${d} ${PERSIAN_MONTHS[calViewMonth - 1]}`;
    calDaysGrid.appendChild(dayCell);
  }
}

// ── Pomodoro Focus Timer ──
function updateTimerDisplay() {
  if (!focusTimerDisplay) return;
  const m = Math.floor(focusRemainingSeconds / 60);
  const s = focusRemainingSeconds % 60;
  focusTimerDisplay.textContent = `${toPersianDigits(String(m).padStart(2, '0'))}:${toPersianDigits(String(s).padStart(2, '0'))}`;
}

function startFocusTimer() {
  if (focusIntervalId) {
    // Pause
    clearInterval(focusIntervalId);
    focusIntervalId = null;
    if (startTimerBtn) startTimerBtn.querySelector('span').textContent = 'ادامه تمرکز ▶';
    return;
  }

  if (startTimerBtn) startTimerBtn.querySelector('span').textContent = 'توقف موقت ⏸';

  focusIntervalId = setInterval(() => {
    if (focusRemainingSeconds > 0) {
      focusRemainingSeconds--;
      updateTimerDisplay();
    } else {
      // Finished
      clearInterval(focusIntervalId);
      focusIntervalId = null;
      AudioFeedback.playComplete();
      focusSessionsCompleted++;
      focusMinutesTotal += Math.round(focusDurationSeconds / 60);

      if (focusSessionsCount) focusSessionsCount.textContent = `${toPersianDigits(focusSessionsCompleted)} جلسه`;
      if (focusMinutesTotalEl) focusMinutesTotalEl.textContent = `${toPersianDigits(focusMinutesTotal)} دقیقه`;
      if (startTimerBtn) startTimerBtn.querySelector('span').textContent = 'تمرکز بعدی 🚀';
      alert('🎉 تبریک! جلسه تمرکز شما با موفقیت به پایان رسید.');
      resetFocusTimer();
    }
  }, 1000);
}

function resetFocusTimer() {
  if (focusIntervalId) {
    clearInterval(focusIntervalId);
    focusIntervalId = null;
  }
  focusRemainingSeconds = focusDurationSeconds;
  updateTimerDisplay();
  if (startTimerBtn) startTimerBtn.querySelector('span').textContent = 'شروع تمرکز 🚀';
}

function setFocusMode(minutes, label) {
  focusDurationSeconds = minutes * 60;
  resetFocusTimer();
  if (focusModeLabel) focusModeLabel.textContent = label;
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
        const todayStr = getTodayDateKey();
        const serverTodayTasks = data.tasks.filter((t) => !t.date || t.date === todayStr);

        if (serverTodayTasks.length > 0) {
          tasks = serverTodayTasks.map((st) => ({
            id: String(st.id),
            title: st.title,
            priority: st.priority || 'medium',
            completed: Boolean(st.completed),
            time: st.time || '',
            date: st.date,
          }));
          await Storage.set('tasks', tasks);
          renderTasks();
        }
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

  const baseUrl = (extServerUrl?.value || 'https://taskrooz.mohusyn.ir').trim().replace(/\/+$/, '');

  try {
    const res = await fetch(`${baseUrl}/api/bale.php?action=create_bale_login`);
    const data = await res.json();

    if (data.ok && data.ticket && data.baleBotLink) {
      baleLoginTicket = data.ticket;
      // Open Bale Bot deep link
      window.open(data.baleBotLink, '_blank');

      // Start Polling
      if (balePollingInterval) clearInterval(balePollingInterval);
      balePollingInterval = setInterval(async () => {
        try {
          const chkRes = await fetch(`${baseUrl}/api/bale.php?action=check_bale_login&ticket=${encodeURIComponent(baleLoginTicket)}`);
          const chkData = await chkRes.json();

          if (chkData.status === 'approved' && chkData.user && chkData.token) {
            clearInterval(balePollingInterval);
            balePollingInterval = null;

            const acc = {
              user: chkData.user,
              token: chkData.token,
              serverUrl: baseUrl,
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
            await inheritFontsFromServer(baseUrl);
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
    alert('عدم برقراری ارتباط با سرور بله یا سرور بگ تایم.');
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

  // Initialize Calendar
  initCalendar();

  // Initialize Pomodoro Timer
  updateTimerDisplay();

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
    url: 'https://taskrooz.mohusyn.ir',
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

  // Focus Timer Controls
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', startFocusTimer);
  }

  if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', resetFocusTimer);
  }

  document.querySelectorAll('.btn-timer-mode').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-timer-mode').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mins = parseInt(btn.dataset.minutes, 10) || 25;
      setFocusMode(mins, btn.textContent);
    });
  });

  // Task Filters
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Add Task Form with Time
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = (taskInput.value || '').trim();
      if (!title) return;

      const timeVal = (taskTimeInput?.value || '').trim();

      const newTask = {
        id: 'task_' + Date.now(),
        title,
        time: timeVal,
        priority: prioritySelect ? prioritySelect.value : 'medium',
        completed: false,
        date: getTodayDateKey(),
      };

      tasks.unshift(newTask);
      await Storage.set('tasks', tasks);
      taskInput.value = '';
      if (taskTimeInput) taskTimeInput.value = '';
      renderTasks();
      AudioFeedback.playCheck();

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
            time: newTask.time,
            priority: newTask.priority,
            date: newTask.date,
          }),
        }).catch(() => {});
      }
    });
  }

  // Load Account & Sync
  await renderAccountUI();
  await syncWithServer();
  await inheritFontsFromServer(currentAccount?.serverUrl);

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
      if (!title || !url) return;
      addShortcut(title, url);
      addShortcutModal.style.display = 'none';
      shortcutTitleInput.value = '';
      shortcutUrlInput.value = '';
    });
  }

  // Manual Login Form Submit
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
          await inheritFontsFromServer(sUrl);
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
