import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  isSecureContextForNotifications,
  sendDeviceNotification,
} from '../utils/webNotifications';
import { sounds } from '../utils/sound';

interface MandatoryNotificationPermissionModalProps {
  onPermissionGranted: () => void;
}

export const MandatoryNotificationPermissionModal: React.FC<MandatoryNotificationPermissionModalProps> = ({
  onPermissionGranted,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSecure, setIsSecure] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkStatus = () => {
    if (!isNotificationSupported()) {
      onPermissionGranted();
      return;
    }

    const current = getNotificationPermission();
    setPermission(current);
    setIsSecure(isSecureContextForNotifications());

    if (current === 'granted') {
      onPermissionGranted();
    }
  };

  useEffect(() => {
    checkStatus();

    // Auto-check when user returns to tab after changing browser permissions
    const handleFocus = () => {
      checkStatus();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(checkStatus, 1500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleRequest = async () => {
    if (!isSecureContextForNotifications()) {
      alert(
        'مرورگرها به دلایل امنیتی فقط در پروتکل امن HTTPS اجازه نمایش کادر درخواست نوتیفیکیشن را صادر می‌کنند.\n\nلطفاً سایت را با https://bagtime.negahm.ir باز فرمایید.'
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
        sendDeviceNotification('تبریک! نوتیفیکیشن‌های بَگ‌تایم فعال شدند 🎉', {
          body: 'از این پس یادآورهای برنامه‌ریزی، هشدارهای تسک و پیام‌های سیستمی را دریافت خواهید کرد.',
        });
        onPermissionGranted();
      } else if (res.permission === 'denied') {
        alert(
          'دسترسی نوتیفیکیشن در مرورگر شما مسدود (Block) شده است.\n\nبرای فعال‌سازی:\n۱. روی آیکون تنظیمات/قفل کنار آدرس سایت در نوار بالای مرورگر کلیک کنید.\n۲. گزینه Notifications را روی Allow قرار دهید.\n۳. صفحه را رفرش فرمایید.'
        );
      }
    } finally {
      setIsRequesting(false);
      checkStatus();
    }
  };

  const handleSwitchToHttps = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `https://${window.location.host}${window.location.pathname}${window.location.search}`;
    }
  };

  // If already granted or unsupported, do not display gate
  if (permission === 'granted' || !isNotificationSupported()) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in select-none"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-stone-900 via-[#18181b] to-black text-white rounded-[38px] p-6 sm:p-7 shadow-2xl border border-white/15 space-y-5 relative overflow-hidden animate-in zoom-in-95">
        {/* Ambient Backlight */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Icon with Pulse Animation */}
        <div className="text-center space-y-3 pt-2 relative z-10">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center shadow-inner relative">
              <Bell className="w-10 h-10 text-amber-400 animate-bounce" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-zinc-900 text-xs font-black shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full">
              گام اول ورود به سامانه
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
              الزام فعال‌سازی نوتیفیکیشن
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium px-2">
              برای استفاده از امکانات بَگ‌تایم و دریافت به موقع یادآورهای کاری، اعطای دسترسی اعلان مرورگر الزامی است.
            </p>
          </div>
        </div>

        {/* What You Receive Cards */}
        <div className="space-y-2 relative z-10">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">یادآورهای روزانه برنامه‌ریزی</div>
              <div className="text-[10px] text-zinc-400">۳ بار در روز (صبح، ظهر، شب) جهت پایش کارها</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">هشدار ۱۵ دقیقه قبل از هر تسک</div>
              <div className="text-[10px] text-zinc-400">اعلان فوری روی گوشی یا رایانه پیش از موعد</div>
            </div>
          </div>
        </div>

        {/* Insecure HTTP Warning Banner (if opened without HTTPS) */}
        {!isSecure && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2 relative z-10">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Lock className="w-4 h-4 shrink-0" />
              <span>نیاز به باز شدن در آدرس امن HTTPS</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              مرورگر کروم به دلایل امنیتی فقط در آدرس‌های دارای HTTPS اجازه فعال‌سازی اعلان را صادر می‌کند.
            </p>
            <button
              type="button"
              onClick={handleSwitchToHttps}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <span>انتقال به آدرس امن https://bagtime.negahm.ir</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* State 1: Permission Denied in Browser */}
        {permission === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 space-y-2 text-xs relative z-10">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>دسترسی نوتیفیکیشن در مرورگر مسدود شده است</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300">
              مرورگر شما کادر درخواست را مسدود کرده است. برای باز کردن قفل دسترسی:
            </p>
            <ol className="text-[11px] text-zinc-300 space-y-1 list-decimal list-inside pr-1">
              <li>روی علامت قفل / تنظیمات کنار آدرس سایت در بالای مرورگر کلیک کنید.</li>
              <li>گزینه Notifications را روی <strong>Allow (مجاز)</strong> بگذارید.</li>
              <li>دکمه «بررسی مجدد مجوز» را در زیر بزنید.</li>
            </ol>
            <button
              type="button"
              onClick={checkStatus}
              className="w-full mt-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بررسی مجدد مجوز 🔄</span>
            </button>
          </div>
        )}

        {/* State 2: Default (Needs user action to prompt) */}
        {permission !== 'denied' && (
          <div className="pt-2 relative z-10 space-y-2">
            <button
              type="button"
              onClick={handleRequest}
              disabled={isRequesting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{isRequesting ? 'در حال ارتباط با مرورگر...' : 'تأیید و فعال‌سازی دسترسی نوتیفیکیشن 🔔'}</span>
            </button>
            <p className="text-center text-[10px] text-zinc-500">
              پس از کلیک، در کادر باز شده مرورگر گزینه Allow را انتخاب فرمایید.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
