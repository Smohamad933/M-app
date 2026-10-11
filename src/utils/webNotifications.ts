/**
 * TaskRooz / BagTime - Web Push & Browser Device Notifications System
 * Supports:
 * 1. Morning planning reminder (08:30)
 * 2. Midday break & check-in reminder (13:30)
 * 3. Nightly reflection & story reminder (21:30)
 * 4. 15-minute before task reminder
 */

export interface NotificationSettings {
  enabled: boolean;
  morningTime: string; // e.g. "08:30"
  noonTime: string;    // e.g. "13:30"
  nightTime: string;   // e.g. "21:30"
  morningEnabled: boolean;
  noonEnabled: boolean;
  nightEnabled: boolean;
  taskReminderMinutes: number; // 15
  taskRemindersEnabled: boolean;
}

const SETTINGS_KEY = 'bagtime_device_notification_settings';
const FIRED_REMINDERS_KEY = 'bagtime_fired_reminders_today';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  morningTime: '08:30',
  noonTime: '13:30',
  nightTime: '21:30',
  morningEnabled: true,
  noonEnabled: true,
  nightEnabled: true,
  taskReminderMinutes: 15,
  taskRemindersEnabled: true,
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isSecureContextForNotifications(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof window.isSecureContext === 'boolean') return window.isSecureContext;
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission;
  reason?: 'not_supported' | 'insecure_http' | 'denied_by_user';
}> {
  if (!isNotificationSupported()) {
    return { granted: false, permission: 'denied', reason: 'not_supported' };
  }

  if (!isSecureContextForNotifications()) {
    return { granted: false, permission: Notification.permission, reason: 'insecure_http' };
  }

  try {
    let perm: NotificationPermission = 'default';
    const promise = Notification.requestPermission();
    if (promise && typeof promise.then === 'function') {
      perm = await promise;
    } else {
      perm = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }

    return {
      granted: perm === 'granted',
      permission: perm,
      reason: perm === 'denied' ? 'denied_by_user' : undefined,
    };
  } catch {
    return {
      granted: Notification.permission === 'granted',
      permission: Notification.permission,
    };
  }
}

export function sendDeviceNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    badge?: string;
    data?: any;
    url?: string;
  }
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const icon = options?.icon || '/app-icon.svg';
    const notif = new Notification(title, {
      body: options?.body || '',
      icon,
      badge: icon,
      tag: options?.tag || `bagtime_notif_${Date.now()}`,
      dir: 'rtl',
      lang: 'fa',
    });

    notif.onclick = () => {
      window.focus();
      if (options?.url) {
        window.location.href = options.url;
      }
      notif.close();
    };

    return true;
  } catch (e) {
    // Some mobile devices require ServiceWorker registration
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: options?.body || '',
          icon: options?.icon || '/app-icon.svg',
          badge: options?.icon || '/app-icon.svg',
          tag: options?.tag || `bagtime_sw_${Date.now()}`,
          dir: 'rtl',
          lang: 'fa',
        });
      }).catch(() => {});
      return true;
    }
    return false;
  }
}

/**
 * Checks and fires the 3 daily notification checkpoints + 15m task reminders
 */
export function checkAndFireScheduledNotifications(tasks: any[] = []) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().slice(0, 10);

  // Load fired checkpoints for today
  let firedToday: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem(FIRED_REMINDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === todayDateStr) {
        firedToday = parsed.fired || {};
      }
    }
  } catch {}

  const markFired = (key: string) => {
    firedToday[key] = true;
    try {
      localStorage.setItem(FIRED_REMINDERS_KEY, JSON.stringify({ date: todayDateStr, fired: firedToday }));
    } catch {}
  };

  // 1. Morning Reminder
  if (settings.morningEnabled && !firedToday['morning'] && currentTimeStr === settings.morningTime) {
    sendDeviceNotification('صبح بخیر قهرمان! ☀️', {
      body: 'روزت پر از برکت و موفقیت! قبل از شروع کارها، بیا برنامه‌ی امروزت رو در بگ‌تایم بچین.',
      tag: 'morning_checkin',
    });
    markFired('morning');
  }

  // 2. Noon Break Reminder
  if (settings.noonEnabled && !firedToday['noon'] && currentTimeStr === settings.noonTime) {
    sendDeviceNotification('خسته نباشی! وقت استراحت ظهره ☕', {
      body: 'شیفت صبح چطور پیش رفت؟ بیا کارهای انجام‌شده رو تیک بزن و برای کار‌های بعدی آماده شو.',
      tag: 'noon_checkin',
    });
    markFired('noon');
  }

  // 3. Night Reflection & Daily Story Reminder
  if (settings.nightEnabled && !firedToday['night'] && currentTimeStr === settings.nightTime) {
    sendDeviceNotification('پایان یک روز پرتلاش 🌙', {
      body: 'قبل از خواب بیا خلاصه روزت و «داستان امروز» رو بنویس و عملکردت رو با سلبریتی‌ها بسنج!',
      tag: 'night_checkin',
    });
    markFired('night');
  }

  // 4. 15-Minute Task Reminders
  if (settings.taskRemindersEnabled) {
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    tasks.forEach((t) => {
      if (t.completed) return;
      if (t.date && t.date !== todayDateStr) return;
      if (!t.time) return;

      const [taskH, taskM] = t.time.split(':').map(Number);
      if (isNaN(taskH) || isNaN(taskM)) return;

      const taskTotalMinutes = taskH * 60 + taskM;
      const diffMinutes = taskTotalMinutes - currentTotalMinutes;

      // Fire when exactly within 14-15 minutes before task time
      const taskKey = `task_15m_${t.id}`;
      if (diffMinutes <= 15 && diffMinutes >= 14 && !firedToday[taskKey]) {
        sendDeviceNotification(`⏰ یادآور تسک: ${t.title}`, {
          body: `۱۵ دقیقه دیگر (ساعت ${t.time}) نوبت اجرای این تسک است. آماده‌ای؟`,
          tag: taskKey,
        });
        markFired(taskKey);
      }
    });
  }
}
