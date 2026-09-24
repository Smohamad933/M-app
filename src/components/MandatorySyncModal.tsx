import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Wifi,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MandatorySyncModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const MandatorySyncModal: React.FC<MandatorySyncModalProps> = ({ isOpen, onClose }) => {
  const { triggerServerSync, isMandatorySyncDue, remainingHoursUntilSync } = useTask();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen && !isMandatorySyncDue) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await triggerServerSync();
      setSyncSuccess(true);
      sounds.playComplete();
      setTimeout(() => {
        setSyncSuccess(false);
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      setSyncError(err.message || 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
      sounds.playPop();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 text-center">
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          {syncSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in" />
          ) : (
            <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-900">
            {syncSuccess
              ? 'همگام‌سازی با موفقیت انجام شد! 🎉'
              : 'همگام‌سازی اجباری ۱۲ ساعته با سرور ⏳'}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            {syncSuccess
              ? 'اطلاعات و تسک‌های شما با سرور مرکزی تطبیق و ذخیره شد. تا ۱۲ ساعت آینده می‌توانید بدون نیاز به اینترنت از برنامه استفاده نمایید.'
              : 'سامانه بگ تایم به صورت آفلاین کار می‌کند؛ اما جهت امنیت اطلاعات و بکاپ در سرور مرکزی، هر ۱۲ ساعت اتصال به اینترنت و همگام‌سازی داده‌ها الزامی است.'}
          </p>
        </div>

        {/* Info Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1.5 font-bold">
            <Wifi className="w-4 h-4 text-emerald-600" />
            وضعیت همگام‌سازی:
          </span>
          <span className="font-bold text-amber-600">
            {isMandatorySyncDue ? 'زمان همگام‌سازی فرا رسیده' : `${toPersianDigits(remainingHoursUntilSync)} ساعت تا سینک بعدی`}
          </span>
        </div>

        {/* Error message */}
        {syncError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 text-right">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'در حال ارسال و ذخیره اطلاعات در سرور...' : 'همگام‌سازی اکنون با سرور 🔄'}</span>
          </button>

          {!isMandatorySyncDue && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
