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

// ── Official Dual Servers & Auto-Failover System ──
const BAGTIME_SERVERS = [
  'https://task.mohusyn.ir',
  'https://bagtime.negahm.ir'
];

let activeServerUrl = 'https://task.mohusyn.ir';

async function initServerManager() {
  const saved = await Storage.get('active_server', null);
  if (saved && BAGTIME_SERVERS.includes(saved)) {
    activeServerUrl = saved;
  } else {
    activeServerUrl = BAGTIME_SERVERS[0];
  }
  updateServerUI();
  checkBothServersHealth();
}

function updateServerUI() {
  const label = activeServerUrl.replace(/^https?:\/\//, '');
  const badgeEl = document.getElementById('serverBadgeLabel');
  if (badgeEl) badgeEl.textContent = label;

  const dotEl = document.getElementById('serverDotIndicator');
  if (dotEl) {
    dotEl.className = 'server-dot online';
  }

  // Update open webapp links
  const openAppBtn = document.getElementById('openWebAppBtn');
  if (openAppBtn) openAppBtn.href = activeServerUrl;

  const footerLink = document.getElementById('tasksFooterLink');
  if (footerLink) footerLink.href = activeServerUrl;

  const srvInput = document.getElementById('extServerUrl');
  if (srvInput) srvInput.value = activeServerUrl;

  // Update dropdown choices
  const choice1 = document.getElementById('choiceSrv1');
  const choice2 = document.getElementById('choiceSrv2');
  if (choice1 && choice2) {
    if (activeServerUrl.includes('task.mohusyn.ir')) {
      choice1.classList.add('active');
      choice2.classList.remove('active');
    } else {
      choice2.classList.add('active');
      choice1.classList.remove('active');
    }
  }

  // Update modal pills
  const modalSrv1Btn = document.getElementById('modalSrv1Btn');
  const modalSrv2Btn = document.getElementById('modalSrv2Btn');
  if (modalSrv1Btn && modalSrv2Btn) {
    if (activeServerUrl.includes('task.mohusyn.ir')) {
      modalSrv1Btn.classList.add('active');
      modalSrv2Btn.classList.remove('active');
    } else {
      modalSrv2Btn.classList.add('active');
      modalSrv1Btn.classList.remove('active');
    }
  }
}

async function checkBothServersHealth() {
  for (const srv of BAGTIME_SERVERS) {
    const isSrv1 = srv.includes('task.mohusyn.ir');
    const badgeEl = isSrv1 ? document.getElementById('srv1StatusBadge') : document.getElementById('srv2StatusBadge');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${srv}/api/settings.php`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timer);
      if (badgeEl) {
        badgeEl.textContent = '🟢 آنلاین';
        badgeEl.className = 'server-status-pill online';
      }
    } catch {
      if (badgeEl) {
        badgeEl.textContent = isSrv1 ? 'سرور ۱' : 'سرور ۲';
        badgeEl.className = 'server-status-pill';
      }
    }
  }
}

// Smart Fetch with Dual-Server Failover
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

// Login Modal & Mandatory Gate Elements
const mandatoryAuthGate = document.getElementById('mandatoryAuthGate');
const mainWorkspace = document.getElementById('mainWorkspace');
const gateActiveServerLabel = document.getElementById('gateActiveServerLabel');
const gateTabBale = document.getElementById('gateTabBale');
const gateTabPassword = document.getElementById('gateTabPassword');
const gateBaleContent = document.getElementById('gateBaleContent');
const gatePasswordContent = document.getElementById('gatePasswordContent');
const gateStartBaleBtn = document.getElementById('gateStartBaleBtn');
const gateBalePollingStatus = document.getElementById('gateBalePollingStatus');
const gateLoginForm = document.getElementById('gateLoginForm');
const gateUsername = document.getElementById('gateUsername');
const gatePassword = document.getElementById('gatePassword');
const gateLoginError = document.getElementById('gateLoginError');
const gateLoginSubmitBtn = document.getElementById('gateLoginSubmitBtn');
const gateSrv1Btn = document.getElementById('gateSrv1Btn');
const gateSrv2Btn = document.getElementById('gateSrv2Btn');
const gateServerUrl = document.getElementById('gateServerUrl');
const gateRegisterLink = document.getElementById('gateRegisterLink');

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
function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = '';

  const filtered = tasks.filter((t) => {
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
        <p class="empty-title">کاری در این لیست وجود ندارد</p>
        <p class="empty-desc">با استفاده از کادر بالا، تسک جدید اضافه کنید یا در پلنر اصلی برنامه‌ریزی کنید.</p>
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

    el.querySelector('.task-delete-btn').addEventListener('click', () => {
      deleteTask(task.id);
    });

    tasksList.appendChild(el);
  });
}

async function addTask(title, time = '', priority = 'medium') {
  const newTask = {
    id: 't_' + Date.now(),
    title,
    time,
    priority,
    completed: false,
    date: getTodayDateKey(),
  };

  tasks.unshift(newTask);
  await Storage.set('tasks', tasks);
  renderTasks();
  AudioFeedback.playCheck();

  // Push to server with failover
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
    }).catch(() => {});
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

  if (currentAccount && currentAccount.token) {
    try {
      const res = await smartServerFetch('/api/notes.php', {
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
    smartServerFetch('/api/notes.php', {
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
    dayCell.className = `cal-day-cell ${isToday ? 'today' : ''}`;
    dayCell.textContent = toPersianDigits(d);
    dayCell.title = `${d} ${PERSIAN_MONTHS[calViewMonth - 1]}`;
    calDaysGrid.appendChild(dayCell);
  }
}

function updateMandatoryGateUI() {
  const isAuthed = Boolean(currentAccount && currentAccount.token && currentAccount.user);

  if (isAuthed) {
    if (mandatoryAuthGate) mandatoryAuthGate.style.display = 'none';
    if (mainWorkspace) mainWorkspace.style.display = 'grid';
  } else {
    if (mandatoryAuthGate) mandatoryAuthGate.style.display = 'flex';
    if (mainWorkspace) mainWorkspace.style.display = 'none';
  }

  if (gateActiveServerLabel) {
    gateActiveServerLabel.textContent = activeServerUrl.replace(/^https?:\/\//, '');
  }
  if (gateRegisterLink) {
    gateRegisterLink.href = activeServerUrl;
  }
  if (gateServerUrl) {
    gateServerUrl.value = activeServerUrl;
  }
}

// ── Account & Auth State ──
async function renderAccountUI() {
  currentAccount = await Storage.get('account', null);
  updateMandatoryGateUI();

  if (accountBox) {
    accountBox.innerHTML = '';
    if (currentAccount && currentAccount.user) {
      const u = currentAccount.user;
      accountBox.innerHTML = `
        <div class="user-chip-btn" id="userProfileChip" title="متصل به حساب ${escapeHtml(u.name || u.username)}">
          <span class="dot-status linked"></span>
          <span class="user-chip-name">${escapeHtml(u.name || u.username)}</span>
          <button type="button" id="logoutBtn" class="btn-chip-logout" title="خروج از حساب">✕</button>
        </div>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟ برای استفاده مجدد، ورود الزامی است.')) {
            await Storage.set('account', null);
            currentAccount = null;
            await renderAccountUI();
          }
        });
      }

      if (hubSyncNotice) {
        hubSyncNotice.textContent = `همگام‌سازی زنده فعال است (${escapeHtml(u.name || u.username)})`;
      }
    } else {
      accountBox.innerHTML = `
        <button type="button" id="openLoginModalBtn" class="btn-connect" style="color: #ef4444; border-color: #fca5a5;">
          <span class="dot-status unlinked" style="background: #ef4444;"></span>
          <span>ورود الزامی 🔐</span>
        </button>
      `;

      const openBtn = document.getElementById('openLoginModalBtn');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          updateMandatoryGateUI();
        });
      }

      if (hubSyncNotice) {
        hubSyncNotice.textContent = 'جهت استفاده از دستیار و همگام‌سازی، ورود الزامی است.';
      }
    }
  }
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
  const btns = [startBaleLoginBtn, gateStartBaleBtn].filter(Boolean);
  const statuses = [balePollingStatus, gateBalePollingStatus].filter(Boolean);

  btns.forEach((b) => {
    b.disabled = true;
    b.textContent = 'در حال ایجاد تیکت ورود...';
  });
  statuses.forEach((s) => (s.style.display = 'flex'));

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
            statuses.forEach((s) => (s.style.display = 'none'));
            btns.forEach((b) => {
              b.disabled = false;
              b.textContent = '🚀 ورود آنی با ربات بله';
            });

            await renderAccountUI();
            await syncWithServer();
            await inheritFontsFromServer();
          }
        } catch {}
      }, 2000);
    } else {
      alert('خطا در صدور تیکت ورود بله: ' + (data.error || 'پاسخ ناموفق'));
      btns.forEach((b) => {
        b.disabled = false;
        b.textContent = '🚀 ورود آنی با ربات بله';
      });
      statuses.forEach((s) => (s.style.display = 'none'));
    }
  } catch (e) {
    alert('عدم برقراری ارتباط با سرور بله یا سرورهای بگ تایم.');
    btns.forEach((b) => {
      b.disabled = false;
      b.textContent = '🚀 ورود آنی با ربات بله';
    });
    statuses.forEach((s) => (s.style.display = 'none'));
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

  const modalSrv1Btn = document.getElementById('modalSrv1Btn');
  const modalSrv2Btn = document.getElementById('modalSrv2Btn');
  if (modalSrv1Btn && extServerUrl) {
    modalSrv1Btn.addEventListener('click', () => {
      extServerUrl.value = 'https://task.mohusyn.ir';
      modalSrv1Btn.classList.add('active');
      if (modalSrv2Btn) modalSrv2Btn.classList.remove('active');
    });
  }
  if (modalSrv2Btn && extServerUrl) {
    modalSrv2Btn.addEventListener('click', () => {
      extServerUrl.value = 'https://bagtime.negahm.ir';
      modalSrv2Btn.classList.add('active');
      if (modalSrv1Btn) modalSrv1Btn.classList.remove('active');
    });
  }

  document.addEventListener('click', (e) => {
    if (serverPickerMenu && !serverPickerMenu.contains(e.target) && e.target !== serverSelectorBtn) {
      serverPickerMenu.style.display = 'none';
    }
  });

  // Load Account & Sync
  await renderAccountUI();
  await syncWithServer();
  await inheritFontsFromServer();

  if (refreshTasksBtn) {
    refreshTasksBtn.addEventListener('click', syncWithServer);
  }

  // Mandatory Gate Controls
  if (gateStartBaleBtn) {
    gateStartBaleBtn.addEventListener('click', () => {
      handleStartBaleLogin(true);
    });
  }

  if (gateTabBale && gateTabPassword) {
    gateTabBale.addEventListener('click', () => {
      gateTabBale.classList.add('active');
      gateTabPassword.classList.remove('active');
      if (gateBaleContent) gateBaleContent.style.display = 'flex';
      if (gatePasswordContent) gatePasswordContent.style.display = 'none';
    });
    gateTabPassword.addEventListener('click', () => {
      gateTabPassword.classList.add('active');
      gateTabBale.classList.remove('active');
      if (gateBaleContent) gateBaleContent.style.display = 'none';
      if (gatePasswordContent) gatePasswordContent.style.display = 'flex';
    });
  }

  if (gateSrv1Btn && gateServerUrl) {
    gateSrv1Btn.addEventListener('click', () => {
      gateServerUrl.value = 'https://task.mohusyn.ir';
      gateSrv1Btn.classList.add('active');
      if (gateSrv2Btn) gateSrv2Btn.classList.remove('active');
    });
  }

  if (gateSrv2Btn && gateServerUrl) {
    gateSrv2Btn.addEventListener('click', () => {
      gateServerUrl.value = 'https://bagtime.negahm.ir';
      gateSrv2Btn.classList.add('active');
      if (gateSrv1Btn) gateSrv1Btn.classList.remove('active');
    });
  }

  if (gateLoginForm) {
    gateLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (gateLoginError) gateLoginError.style.display = 'none';
      if (gateLoginSubmitBtn) {
        gateLoginSubmitBtn.disabled = true;
        gateLoginSubmitBtn.textContent = 'در حال تأیید و ورود...';
      }

      const sUrl = (gateServerUrl?.value || activeServerUrl).trim().replace(/\/+$/, '');
      const uName = gateUsername?.value.trim();
      const uPass = gatePassword?.value.trim();

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
          if (gatePassword) gatePassword.value = '';
          await renderAccountUI();
          await syncWithServer();
          await inheritFontsFromServer();
          AudioFeedback.playCheck();
        } else {
          if (gateLoginError) {
            gateLoginError.textContent = data.error || 'اطلاعات ورود نادرست است.';
            gateLoginError.style.display = 'block';
          }
        }
      } catch (err) {
        if (gateLoginError) {
          gateLoginError.textContent = 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت یا سرور دیگر را امتحان کنید.';
          gateLoginError.style.display = 'block';
        }
      } finally {
        if (gateLoginSubmitBtn) {
          gateLoginSubmitBtn.disabled = false;
          gateLoginSubmitBtn.textContent = 'ورود و قفل‌گشایی دستیار ⚡';
        }
      }
    });
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
      const icon = shortcutIconInput?.value || '🔗';
      if (!title || !url) return;
      addShortcut(title, url, icon);
      addShortcutModal.style.display = 'none';
      shortcutTitleInput.value = '';
      shortcutUrlInput.value = '';
      if (shortcutIconInput) shortcutIconInput.value = '🔗';
    });
  }

  // Manual Login Form Submit
  if (extLoginForm) {
    extLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      extLoginError.style.display = 'none';
      extLoginSubmitBtn.disabled = true;
      extLoginSubmitBtn.textContent = 'در حال اتصال و تأیید...';

      const sUrl = (extServerUrl.value || activeServerUrl).trim().replace(/\/+$/, '');
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
          await inheritFontsFromServer();
          AudioFeedback.playCheck();
        } else {
          extLoginError.textContent = data.error || 'اطلاعات ورود نادرست است یا ارتباط با سرور برقرار نشد.';
          extLoginError.style.display = 'block';
        }
      } catch (err) {
        extLoginError.textContent = 'عدم برقراری ارتباط با آدرس سرور مشخص شده. در حال بررسی سرور پشتیبان...';
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
