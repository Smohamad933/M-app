/**
 * Bag Time Personal Assistant - New Tab Engine
 * 100% Offline-capable, zero external dependency
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

const QUOTES = [
  '«انگیزه چیزی است که شما را شروع می‌کند؛ عادت چیزی است که شما را ادامه می‌دهد.»',
  '«تمرکز یعنی نه گفتن به صد ایده خوب دیگر برای انجام یک کار عالی.»',
  '«برنامه‌ریزی، آوردن آینده به زمان حال است تا بتوانید کاری برای آن انجام دهید.»',
  '«یک ساعت تمرکز عمیق، با ارزش‌تر از هشت ساعت کار همراه با حواس‌پرتی است.»',
  '«پشتکار، عامل تفاوت بین پیروزی و شکست در اهداف روزانه است.»',
];

// App State
let tasks = [];
let currentFilter = 'all';
let timelineSchedule = {};
let timerInterval = null;
let timerSecondsLeft = 25 * 60;
let isTimerRunning = false;

// DOM Elements
const liveClockEl = document.getElementById('liveClock');
const liveDateEl = document.getElementById('liveDate');
const greetingTextEl = document.getElementById('greetingText');
const tasksListEl = document.getElementById('tasksList');
const tasksCountBadgeEl = document.getElementById('tasksCountBadge');
const progressBarEl = document.getElementById('progressBar');
const progressStatsEl = document.getElementById('progressStats');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const timelineScrollEl = document.getElementById('timelineScroll');
const timerDisplayEl = document.getElementById('timerDisplay');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerBreakBtn = document.getElementById('timerBreakBtn');
const notesArea = document.getElementById('notesArea');
const notesSavedTag = document.getElementById('notesSavedTag');
const notesCharCount = document.getElementById('notesCharCount');
const copyNotesBtn = document.getElementById('copyNotesBtn');
const dailyQuoteEl = document.getElementById('dailyQuote');

// 1. Clock & Date
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  liveClockEl.textContent = `${h}:${m}:${s}`;

  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const dayName = PERSIAN_WEEKDAYS[now.getDay()];
  const monthName = PERSIAN_MONTHS[jm - 1];
  liveDateEl.textContent = `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  // Greeting update
  const hour = now.getHours();
  let greet = 'روز بخیر!';
  if (hour >= 5 && hour < 12) greet = 'صبح بخیر! روز پر انرژی و موفقی پیش رو داشته باشید.';
  else if (hour >= 12 && hour < 16) greet = 'ظهر بخیر! وقت مرور اولویت‌های امروز است.';
  else if (hour >= 16 && hour < 20) greet = 'عصر بخیر! چقدر از کارهای امروز انجام شد؟';
  else greet = 'شب بخیر! وقت مرور دستاوردها و آماده‌سازی ذهن برای فرداست.';
  greetingTextEl.textContent = greet;
}

// 2. Tasks Rendering & Management
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  progressBarEl.style.width = pct + '%';
  progressStatsEl.textContent = `${toPersianDigits(completed)} از ${toPersianDigits(total)} (${toPersianDigits(pct)}٪)`;
  tasksCountBadgeEl.textContent = `${toPersianDigits(total)} تسک`;
}

function renderTasks() {
  let filtered = tasks;
  if (currentFilter === 'pending') filtered = tasks.filter((t) => !t.completed);
  if (currentFilter === 'completed') filtered = tasks.filter((t) => t.completed);

  if (filtered.length === 0) {
    tasksListEl.innerHTML = `
      <div class="empty-state">
        ${currentFilter === 'completed' ? 'هنوز تسکی انجام نشده است.' : 'هیچ تسکی در این لیست وجود ندارد.'}
      </div>
    `;
    updateProgress();
    return;
  }

  tasksListEl.innerHTML = filtered
    .map(
      (t) => `
      <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} />
          <span class="task-title">${escapeHtml(t.title)}</span>
        </div>
        <div class="task-right">
          <span class="priority-tag priority-${t.priority}">
            ${t.priority === 'high' ? 'فوری' : t.priority === 'low' ? 'عادی' : 'متوسط'}
          </span>
          <button type="button" class="delete-btn" title="حذف تسک">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `
    )
    .join('');

  updateProgress();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 3. Hourly Timeline
function renderTimeline() {
  const currentHour = new Date().getHours();
  const hours = [];
  for (let h = 7; h <= 23; h++) {
    hours.push(h);
  }

  timelineScrollEl.innerHTML = hours
    .map((h) => {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      const isCurrent = h === currentHour;
      const val = timelineSchedule[timeStr] || '';
      return `
      <div class="timeline-row ${isCurrent ? 'current-hour' : ''}">
        <span class="timeline-time">${timeStr}</span>
        <input
          type="text"
          class="timeline-input"
          data-time="${timeStr}"
          value="${escapeHtml(val)}"
          placeholder="برنامه این ساعت (کاری، مطالعه، ورزش...)"
        />
        ${isCurrent ? '<span class="timeline-now-badge">هم‌اکنون</span>' : ''}
      </div>
    `;
    })
    .join('');
}

// 4. Pomodoro Timer
function formatTimer(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplayEl.textContent = formatTimer(timerSecondsLeft);
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerToggleBtn.textContent = 'شروع';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
  } else {
    isTimerRunning = true;
    timerToggleBtn.textContent = 'توقف';
    timerToggleBtn.classList.remove('btn-primary');
    timerToggleBtn.classList.add('btn-outline');
    timerInterval = setInterval(() => {
      if (timerSecondsLeft > 0) {
        timerSecondsLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerToggleBtn.textContent = 'شروع';
        AudioFeedback.playBell();
        alert('زمان تمرکز به پایان رسید! تبریک، وقت یک استراحت کوتاه است.');
      }
    }, 1000);
  }
}

// Initial Setup
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  // Daily Quote
  const dayIdx = new Date().getDate() % QUOTES.length;
  dailyQuoteEl.textContent = QUOTES[dayIdx];

  // Load Tasks
  const savedTasks = await Storage.get('tasks', null);
  if (savedTasks && Array.isArray(savedTasks)) {
    tasks = savedTasks;
  } else {
    // Initial friendly starter tasks
    tasks = [
      { id: '1', title: 'مرور اولویت‌های مهم روز و زمان‌بندی', priority: 'high', completed: false },
      { id: '2', title: 'یک پارت تمرکز ۲۵ دقیقه‌ای (پومودورو)', priority: 'medium', completed: false },
      { id: '3', title: 'یادداشت‌برداری دستاوردهای امروز', priority: 'low', completed: false },
    ];
    await Storage.set('tasks', tasks);
  }
  renderTasks();

  // Load Timeline
  timelineSchedule = (await Storage.get('timeline', {})) || {};
  renderTimeline();

  // Load Notes
  const savedNotes = await Storage.get('notes', '');
  notesArea.value = savedNotes;
  notesCharCount.textContent = `${toPersianDigits(savedNotes.length)} کاراکتر`;

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
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
  });

  // Task Clicks (toggle / delete)
  tasksListEl.addEventListener('click', async (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const id = item.dataset.id;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (e.target.closest('.delete-btn')) {
      tasks = tasks.filter((t) => t.id !== id);
      await Storage.set('tasks', tasks);
      renderTasks();
      return;
    }

    if (e.target.classList.contains('task-checkbox') || e.target.closest('.task-left')) {
      task.completed = !task.completed;
      if (task.completed) {
        AudioFeedback.playCheck();
      }
      await Storage.set('tasks', tasks);
      renderTasks();
    }
  });

  // Timeline Change
  timelineScrollEl.addEventListener('input', async (e) => {
    if (e.target.classList.contains('timeline-input')) {
      const time = e.target.dataset.time;
      timelineSchedule[time] = e.target.value;
      await Storage.set('timeline', timelineSchedule);
    }
  });

  // Timer Buttons
  timerToggleBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSecondsLeft = 25 * 60;
    updateTimerDisplay();
    timerToggleBtn.textContent = 'شروع';
    timerToggleBtn.classList.remove('btn-outline');
    timerToggleBtn.classList.add('btn-primary');
  });
  timerBreakBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSecondsLeft = 5 * 60;
    updateTimerDisplay();
    timerToggleBtn.textContent = 'شروع استراحت';
  });

  // Notes Auto-save
  let saveNotesTimer = null;
  notesArea.addEventListener('input', () => {
    notesSavedTag.textContent = 'در حال ذخیره...';
    notesSavedTag.style.color = '#f59e0b';
    notesCharCount.textContent = `${toPersianDigits(notesArea.value.length)} کاراکتر`;
    clearTimeout(saveNotesTimer);
    saveNotesTimer = setTimeout(async () => {
      await Storage.set('notes', notesArea.value);
      notesSavedTag.textContent = '✓ ذخیره‌شده خودکار';
      notesSavedTag.style.color = '#10b981';
    }, 500);
  });

  // Copy Notes
  copyNotesBtn.addEventListener('click', () => {
    if (!notesArea.value.trim()) return;
    navigator.clipboard.writeText(notesArea.value);
    const prev = copyNotesBtn.textContent;
    copyNotesBtn.textContent = '✓ کپی شد';
    setTimeout(() => {
      copyNotesBtn.textContent = prev;
    }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', init);
