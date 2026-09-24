import React, { useState, useEffect, useCallback } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 Hours
const STORAGE_KEY = 'bagtime_last_sync_timestamp';

export const OfflineSyncManager: React.FC = () => {
  const { tasks, currentUser, refreshTasks } = useTask();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return Number(stored);
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, String(now));
      return now;
    } catch {
      return Date.now();
    }
  });

  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');
  const [isSyncExpired, setIsSyncExpired] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessNotice, setSyncSuccessNotice] = useState<boolean>(false);

  // Check 12-hour expiration timer
  const evaluateSyncStatus = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastSyncTime;
    const remaining = SYNC_INTERVAL_MS - elapsed;

    if (remaining <= 0) {
      setIsSyncExpired(true);
      setRemainingTimeStr('منقضی شده (نیاز به اینترنت)');
    } else {
      setIsSyncExpired(false);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setRemainingTimeStr(`${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه مانده`);
    }
  }, [lastSyncTime]);

  useEffect(() => {
    evaluateSyncStatus();
    const interval = setInterval(evaluateSyncStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [evaluateSyncStatus]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming online
      handlePerformSync(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tasks]);

  const handlePerformSync = async (silent = false) => {
    if (!currentUser || isSyncing) return;
    setIsSyncing(true);

    try {
      await api.syncOfflineData(tasks);
      const now = Date.now();
      setLastSyncTime(now);
      localStorage.setItem(STORAGE_KEY, String(now));
      setIsSyncExpired(false);
      evaluateSyncStatus();
      if (!silent) {
        sounds.playComplete();
        setSyncSuccessNotice(true);
        setTimeout(() => setSyncSuccessNotice(false), 4000);
      }
      refreshTasks();
    } catch (err: any) {
      if (!silent) {
        alert('عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // If sync has expired (> 12 hours), render mandatory full-screen sync lock
  if (isSyncExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>پایان مهلت ۱۲ ساعته آفلاین</span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              همگام‌سازی اجباری ۱۲ ساعته با سرور
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              بیش از ۱۲ ساعت از آخرین ذخیره‌سازی داده‌های شما در سرور مرکزی گذشته است.
              جهت حفظ امنیت اطلاعات، تایید وضعیت حساب و دریافت تغییرات جدید، اتصال به اینترنت و همگام‌سازی الزامی است.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span className="font-bold">وضعیت اتصال دستگاه:</span>
            <span className={`inline-flex items-center gap-1.5 font-black ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>اینترنت متصل است</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>اینترنت قطع است</span>
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() => handlePerformSync(false)}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'در حال ارسال و همگام‌سازی با سرور...' : 'اتصال به اینترنت و همگام‌سازی اکنون 🚀'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Floating status indicator & manual sync pill
  return (
    <>
      {syncSuccessNotice && (
        <div className="fixed bottom-20 left-4 sm:left-6 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-2 duration-300" dir="rtl">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>اطلاعات شما با موفقیت در سرور ذخیره شد (تمدید ۱۲ ساعته فعال گردید).</span>
        </div>
      )}

      {/* Subtle Offline / Sync Indicator in Header/Floating */}
      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200/90 px-2.5 py-1 rounded-full shadow-2xs" dir="rtl">
        <span
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
          title={isOnline ? 'آنلاین' : 'آفلاین'}
        />
        <span className="text-[10px] text-slate-500">
          {isOnline ? 'همگام‌سازی ۱۲ ساعته:' : 'آفلاین:'}
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-800">
          {remainingTimeStr}
        </span>
        <button
          type="button"
          onClick={() => handlePerformSync(false)}
          disabled={isSyncing}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          title="همگام‌سازی دستی با سرور"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </>
  );
};
