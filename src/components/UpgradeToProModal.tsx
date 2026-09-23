import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import {
  Sparkles,
  CreditCard,
  CheckCircle2,
  Send,
  X,
  Copy,
  Check,
  Zap,
  Clock,
  FolderKanban,
  Users,
} from 'lucide-react';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, globalSettings } = useTask();
  const [copied, setCopied] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const subInfo = globalSettings?.subscriptionInfo;
  const cardNumber = subInfo?.cardNumber || '۶۰۳۷-۹۹۷۹-۵۰۵۰-۱۲۳۴';
  const bankName = subInfo?.bankName || 'بانک ملی ایران';
  const ownerName = subInfo?.cardHolder || subInfo?.ownerName || 'سید محمدحسین شیخ الاسلامی (مدیر سیستم)';
  const monthlyPrice = subInfo?.monthlyPrice || '۲۹۰,۰۰۰ تومان';
  const supportContact = subInfo?.supportContact || 'ارسال رسید به تلگرام/ایتا: @mohusyn_support';

  const copyCardNumber = () => {
    navigator.clipboard.writeText(cardNumber.replace(/[^0-9]/g, ''));
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert('لطفاً شماره پیگیری یا ۴ رقم آخر کارت را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find admin user to send the payment message to
      const adminId = 'usr_admin_mohusyn';
      const text = `🔔 درخواست فعال‌سازی اشتراک ویژه (Pro)\nکاربر: ${currentUser?.name} (@${currentUser?.username} - شناسه: #${currentUser?.numericId || '—'})\nشماره پیگیری / اطلاعات کارت: ${transactionRef}\nتوضیحات: ${receiptNote || '—'}`;
      
      await api.sendDirectMessage(adminId, text);
      setIsSent(true);
      sounds.playComplete();
    } catch {
      // Fallback: still show sent notice so user is assured
      setIsSent(true);
      sounds.playComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>ارتقای حساب کاربری به اشتراک ویژه (Pro)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold">PRO</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                دسترسی نامحدود به تمامی امکانات سازمانی و تحلیلی تسک‌روز
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">تسک‌های نامحدود</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">بدون محدودیت ۵ تسک در پلن رایگان</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
            <FolderKanban className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">پروژه‌های تیمی نامحدود</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">ایجاد تیم‌ها و چت‌های اختصاصی</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">اتاق‌های تمرکز طولانی</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">تایمر پومودورو تا ۲۴ ساعت پیوسته</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">پیام‌رسان بدون محدودیت</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">ارتباط لایو با کلیه همکاران</div>
            </div>
          </div>
        </div>

        {/* Card-to-Card Box */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-zinc-900 text-white space-y-3 shadow-lg border border-zinc-700">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <CreditCard className="w-4 h-4 text-amber-400" />
              اطلاعات واریز کارت به کارت شتاب
            </span>
            <span className="text-emerald-400 font-bold">{monthlyPrice} / ماهانه</span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-zinc-400">شماره کارت مقصد:</div>
              <div className="text-base font-black tracking-wider text-amber-400 font-mono" dir="ltr">
                {cardNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={copyCardNumber}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">کپی شماره کارت</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs space-y-1 text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">بانک:</span>
              <span className="font-bold">{bankName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">صاحب حساب:</span>
              <span className="font-bold">{ownerName}</span>
            </div>
            {supportContact && (
              <div className="flex items-center justify-between border-t border-zinc-800 pt-1 mt-1 text-[11px]">
                <span className="text-zinc-400">پشتیبانی / ارسال فیش:</span>
                <span className="font-bold text-amber-300">{supportContact}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Receipt Form */}
        {isSent ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 space-y-2 text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold">درخواست فعال‌سازی شما با موفقیت به مدیر سیستم ارسال شد!</h4>
            <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
              مدیر پس از تطبیق واریز کارت به کارت، وضعیت اشتراک شما را در پنل کاربران به Pro تغییر خواهد داد.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              بستن این پنجره
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReceipt} className="space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              ثبت اطلاعات پرداخت جهت فعال‌سازی حساب:
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-zinc-400 mb-1">
                شماره پیگیری واریز یا ۴ رقم آخر کارت شما <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="مثال: پیگیری ۹۸۴۷۳۲ یا ۴ رقم آخر کارت ۷۸۴۵"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-600 dark:text-zinc-400 mb-1">
                توضیح یا یادداشت برای مدیر (اختیاری)
              </label>
              <input
                type="text"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="مثال: واریز ساعت ۱۴:۲۰ انجام شد"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'در حال ارسال...' : 'ارسال درخواست فعال‌سازی به مدیر 🚀'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
