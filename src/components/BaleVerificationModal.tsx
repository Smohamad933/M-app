import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { toPersianDigits } from '../utils/persianDate';
import {
  Bot,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';

export interface BaleVerificationInfo {
  userId: string;
  username?: string;
  phone?: string;
  verificationCode: string;
  baleBotUsername: string;
  baleBotLink: string;
}

interface BaleVerificationModalProps {
  data: BaleVerificationInfo;
  onClose: () => void;
  onVerified?: () => void;
}

export const BaleVerificationModal: React.FC<BaleVerificationModalProps> = ({
  data,
  onClose,
  onVerified,
}) => {
  const { completeBaleVerification } = useTask();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Auto-poll verification status every 2.5 seconds
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const check = await api.checkVerification(data.userId);
        if (check.verified && check.user && isMounted) {
          sounds.playComplete();
          completeBaleVerification(check.user);
          if (onVerified) onVerified();
          onClose();
        }
      } catch {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [data.userId, completeBaleVerification, onClose, onVerified]);

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(data.verificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const check = await api.checkVerification(data.userId);
      if (check.verified && check.user) {
        sounds.playComplete();
        completeBaleVerification(check.user);
        if (onVerified) onVerified();
        onClose();
      } else {
        alert('کد فعال‌سازی شما هنوز در ربات بله ارسال و شماره تماس تأیید نشده است. لطفاً ابتدا در بله شماره خود را ارسال فرمایید.');
      }
    } catch {
      alert('خطا در بررسی وضعیت احراز هویت.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in"
      dir="rtl"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
          <Bot className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            تأیید هویت شماره با ربات بله
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            کد فعال‌سازی اختصاصی شما صادر شد. جهت تأیید و فعال‌سازی کامل حساب، کافیست به ربات بله مراجعه کرده و کد زیر را ارسال فرمایید:
          </p>
        </div>

        {/* Bot ID Box */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold">شناسه ربات رسمی:</span>
          <span className="font-mono font-black text-blue-700 dir-ltr">
            @{data.baleBotUsername.replace(/^@/, '')}
          </span>
        </div>

        {/* Verification Code Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-400">کد تأیید ۶ رقمی شما:</div>
          <div className="text-3xl font-black font-mono tracking-widest text-slate-900 select-all py-1">
            {toPersianDigits(data.verificationCode)}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedCode ? 'کد کپی شد!' : 'کپی کردن کد'}</span>
          </button>
        </div>

        {/* Step by step guide */}
        <div className="text-right p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-[11px] text-amber-900">
          <div className="font-black text-amber-950 flex items-center gap-1.5">
            <span>⚠️ مراحل احراز هویت الزامی با ربات بله:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 font-medium leading-relaxed pr-1 text-[11px]">
            <li>وارد ربات بله شوید و دکمه شیشه‌ای <b>«🔐 تأیید حساب کاربری»</b> را لمس کنید.</li>
            <li>کد ۶ رقمی بالا را به ربات ارسال فرمایید.</li>
            <li>سپس دکمه <b>«📱 ارسال شماره تماس من»</b> را در بله بزنید تا شماره شما تطبیق داده شود.</li>
          </ol>
          <div className="text-[10px] text-amber-800/80 pt-0.5 font-bold">
            * بدون تطبیق شماره تماس در ربات بله، دسترسی به امکانات ایجاد تسک و چت مسدود خواهد ماند.
          </div>
        </div>

        {/* Live Polling Status */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 py-2.5 rounded-xl border border-blue-100">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>در انتظار ارسال کد و تطبیق شماره در ربات بله...</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={data.baleBotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ورود به ربات بله و تکمیل احراز هویت 🚀</span>
          </a>

          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'در حال بررسی...' : 'بررسی مجدد وضعیت تأیید بله'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
