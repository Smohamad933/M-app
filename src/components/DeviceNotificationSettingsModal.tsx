import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Clock,
  X,
  Volume2,
  Check,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  isSecureContextForNotifications,
  sendDeviceNotification,
  type NotificationSettings,
} from '../utils/webNotifications';
import { sounds } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceNotificationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSecure, setIsSecure] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermissionState = () => {
    setPermission(getNotificationPermission());
    setIsSecure(isSecureContextForNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      checkPermissionState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (!isSecureContextForNotifications()) {
      alert(
        'مرورگرها به دلایل امنیتی فقط در آدرس دارای HTTPS اجازه فعال‌سازی نوتیفیکیشن را می‌دهند.\n\nلطفاً سایت را با https://bagtime.negahm.ir باز کنید.'
      );
      return;
    }

    sounds.playPop();
    setIsRequesting(true);

    try {
      const res = await requestNotificationPermission();
      setPermission(res.permission);

      if (res.granted) {
        sounds.playComplete();
        sendDeviceNotification('تبریک! نوتیفیکیشن‌های بگ‌تایم فعال شدند 🎉', {
          body: 'اکنون یادآورهای روزانه و اعلان‌های ۱۵ دقیقه قبل از تسک‌ها را دریافت خواهید کرد.',
        });
      } else if (res.reason === 'insecure_http') {
        alert(
          'مرورگر شما به دلایل امنیتی فقط در پروتکل امن HTTPS اجازه نمایش کادر درخواست نوتیفیکیشن را می‌دهد.\n\nلطفاً با آدرس https://bagtime.negahm.ir وارد شوید.'
        );
      } else if (res.permission === 'denied') {
        alert(
          'دسترسی نوتیفیکیشن در مرورگر مسدود (Block) شده است.\n\nبرای فعال‌سازی:\n۱. روی آیکون تنظیمات/قفل در کنار آدرس سایت در بالای مرورگر کلیک کنید.\n۲. گزینه Notifications را روی Allow قرار دهید.\n۳. صفحه را رفرش (Refresh) کنید.'
        );
      }
    } finally {
      setIsRequesting(false);
      checkPermissionState();
    }
  };

  const handleSendTestNotification = async () => {
    sounds.playPop();

    if (permission !== 'granted') {
      if (!isSecureContextForNotifications()) {
        alert('برای دریافت نوتیفیکیشن باید از آدرس دارای HTTPS استفاده کنید.');
        return;
      }
      if (permission === 'denied') {
        alert(
          'دسترسی نوتیفیکیشن در مرورگر مسدود شده است. لطفاً از طریق علامت قفل/تنظیمات کنار آدرس در نوار بالای مرورگر، Notifications را روی Allow بگذارید.'
        );
        return;
      }
      // If default, trigger permission request directly
      await handleRequestPermission();
      return;
    }

    const success = sendDeviceNotification('تست نوتیفیکیشن بگ‌تایم 🔔', {
      body: 'این یک پیام آزمایشی برای اطمینان از دریافت نوتیفیکیشن‌ها در گوشی یا مرورگر شماست.',
    });

    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      alert('خطا در ارسال نوتیفیکیشن آزمایشی. لطفاً دسترسی مرورگر را بررسی کنید.');
    }
  };

  const handleSwitchToHttps = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `https://${window.location.host}${window.location.pathname}${window.location.search}`;
    }
  };

  const handleSave = () => {
    sounds.playComplete();
    saveNotificationSettings(settings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-auto relative animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>سیستم نوتیفیکیشن مرورگر و گوشی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  ۳ بار در روز + یادآور تسک
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ارسال اعلان‌های هوشمند روزانه به گوشی و رایانه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Insecure HTTP Warning Banner (if user opened over HTTP) */}
        {!isSecure && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>نیاز به اتصال امن HTTPS در مرورگر</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              مرورگر کروم و فایرفاکس به دلایل امنیتی فقط در پروتکل امن <strong>HTTPS</strong> اجازه نمایش کادر درخواست نوتیفیکیشن را صادر می‌کنند.
            </p>
            <button
              type="button"
              onClick={handleSwitchToHttps}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <span>انتقال به آدرس امن HTTPS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Permission Status Box */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            permission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : permission === 'denied'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {permission === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  permission === 'denied' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
            )}
            <div>
              <div className="text-xs font-black">
                {permission === 'granted'
                  ? 'مجوز نوتیفیکیشن در مرورگر فعال است ✓'
                  : permission === 'denied'
                  ? 'دسترسی نوتیفیکیشن در مرورگر مسدود (Block) شده است'
                  : 'دسترسی نوتیفیکیشن هنوز تأیید نشده است'}
              </div>
              <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                {permission === 'granted'
                  ? 'سیستم به صورت خودکار پیام‌ها را ارسال خواهد کرد.'
                  : permission === 'denied'
                  ? 'برای فعال‌سازی: روی آیکون قفل/تنظیمات کنار آدرس سایت در نوار بالا کلیک کرده و گزینه Notifications را روی Allow قرار دهید.'
                  : 'برای دریافت اعلان روی گوشی یا لپ‌تاپ، دکمه مقابل را بزنید و در کادر مرورگر دکمه Allow را انتخاب کنید.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {permission === 'denied' && (
              <button
                type="button"
                onClick={checkPermissionState}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="بررسی مجدد مجوز"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بررسی مجدد</span>
              </button>
            )}

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className={`px-3.5 py-2 rounded-xl text-white text-xs font-black transition-all cursor-pointer shadow-xs ${
                  permission === 'denied'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isRequesting ? 'در حال بررسی...' : 'فعال‌سازی دسترسی'}
              </button>
            )}
          </div>
        </div>

        {/* 3 Times in Day Setup */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>زمان‌بندی اعلان‌های ۳ گانه روزانه:</span>
          </h3>

          {/* 1. Morning Checkpoint */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">☀️</span>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  ۱. اعلان صبحگاهی (ثبت برنامه روز)
                </div>
                <p className="text-[11px] text-slate-500">
                  قبل از شروع کار برای یادداشت کارهای امروز
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.morningTime}
                onChange={(e) => setSettings({ ...settings, morningTime: e.target.value })}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              />
              <input
                type="checkbox"
                checked={settings.morningEnabled}
                onChange={(e) => setSettings({ ...settings, morningEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Midday Break Checkpoint */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">☕</span>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  ۲. اعلان نیمروزی (استراحت و تیک زدن کارها)
                </div>
                <p className="text-[11px] text-slate-500">
                  وقت استراحت شیفت صبح جهت بررسی و ثبت کار بعدی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.noonTime}
                onChange={(e) => setSettings({ ...settings, noonTime: e.target.value })}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              />
              <input
                type="checkbox"
                checked={settings.noonEnabled}
                onChange={(e) => setSettings({ ...settings, noonEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Night Reflection Checkpoint */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🌙</span>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  ۳. اعلان شبانگاهی (خلاصه روز و داستان روز)
                </div>
                <p className="text-[11px] text-slate-500">
                  قبل از خواب برای ثبت وقایع روز و سنجش پیشرفت با مفاخر
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.nightTime}
                onChange={(e) => setSettings({ ...settings, nightTime: e.target.value })}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
              />
              <input
                type="checkbox"
                checked={settings.nightEnabled}
                onChange={(e) => setSettings({ ...settings, nightEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 15-Minute Task Reminder Toggle */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                یادآور ۱۵ دقیقه قبل از هر تسک
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                برای کارهایی که ساعت مشخص دارند، یک ربع زودتر نوتیفیکیشن هشدار فرستاده می‌شود.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.taskRemindersEnabled}
              onChange={(e) =>
                setSettings({ ...settings, taskRemindersEnabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{testSent ? 'ارسال شد! بررسی کنید' : 'ارسال اعلان آزمایشی'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره تنظیمات نوتیفیکیشن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
