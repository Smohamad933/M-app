import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Wifi,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
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

  // Auto-sync immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      handleSyncNow();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      }, 1500);
    } catch (err: any) {
      setSyncError(err.message || 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
      sounds.playPop();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 text-center relative">
        {/* Close X Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}

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
              : 'همگام‌سازی خودکار با سرور 🔄'}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            {syncSuccess
              ? 'اطلاعات و تسک‌های شما با سرور مرکزی تطبیق و ذخیره شد.'
              : 'سامانه به صورت خودکار اطلاعات و تسک‌ها را در پس‌زمینه با سرور ابری همگام‌سازی می‌کند.'}
          </p>
        </div>

        {/* Info Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1.5 font-bold">
            <Wifi className="w-4 h-4 text-emerald-600" />
            وضعیت همگام‌سازی:
          </span>
          <span className="font-bold text-emerald-600">
            {isSyncing ? 'در حال ارسال و دریافت...' : isMandatorySyncDue ? 'زمان سینک فرا رسیده' : `${toPersianDigits(remainingHoursUntilSync)} ساعت تا سینک بعدی`}
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
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'در حال همگام‌سازی در پس‌زمینه...' : 'همگام‌سازی مجدد 🔄'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              بستن و ادامه کار با برنامه
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
