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
} from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
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
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    sounds.playPop();
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      sounds.playComplete();
      sendDeviceNotification('تبریک! نوتیفیکیشن‌های بگ‌تایم فعال شدند 🎉', {
        body: 'اکنون یادآورهای صبح، ظهر، شب و ۱۵ دقیقه قبل از تسک‌ها را دریافت خواهید کرد.',
      });
    }
  };

  const handleSendTestNotification = () => {
    sounds.playPop();
    const success = sendDeviceNotification('تست نوتیفیکیشن بگ‌تایم 🔔', {
      body: 'این یک پیام آزمایشی برای اطمینان از دریافت نوتیفیکیشن‌ها در گوشی یا مرورگر شماست.',
    });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      alert('لطفاً ابتدا با دکمه بالا، دسترسی نوتیفیکیشن را در مرورگر مجاز (Allow) کنید.');
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

        {/* Permission Status Box */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            permission === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {permission === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-black">
                {permission === 'granted'
                  ? 'مجوز نوتیفیکیشن در مرورگر فعال است ✓'
                  : 'دسترسی نوتیفیکیشن هنوز تأیید نشده است'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {permission === 'granted'
                  ? 'سیستم به صورت خودکار پیام‌ها را ارسال خواهد کرد.'
                  : 'برای دریافت اعلان روی گوشی یا لپ‌تاپ، دکمه مقابل را بزنید و در اعلان مرورگر Allow را انتخاب کنید.'}
              </p>
            </div>
          </div>

          {permission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs"
            >
              فعال‌سازی دسترسی
            </button>
          )}
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
