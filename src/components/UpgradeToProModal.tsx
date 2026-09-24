import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import type { ProDurationPlan } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Send,
  X,
  Zap,
  Clock,
  FolderKanban,
  Users,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRO_PLANS: {
  id: ProDurationPlan;
  title: string;
  durationLabel: string;
  days: number;
  price: string;
  perMonth: string;
  tag?: string;
  isPopular?: boolean;
}[] = [
  {
    id: '1_month',
    title: 'پلاس Plus (۱ ماهه)',
    durationLabel: '۳۰ روز دسترسی با نماد پلاس ➕',
    days: 30,
    price: '۲۹۰,۰۰۰ تومان',
    perMonth: 'ماهی ۲۹۰ هزار ت',
    tag: 'نماد ➕ در پروفایل',
  },
  {
    id: '3_months',
    title: 'پرو Pro (۳ ماهه)',
    durationLabel: '۹۰ روز دسترسی با نماد ستاره ⭐',
    days: 90,
    price: '۶۹۰,۰۰۰ تومان',
    perMonth: 'ماهی ۲۳۰ هزار ت (۲۰٪ تخفیف)',
    tag: 'پیشنهاد ویژه ⭐',
    isPopular: true,
  },
  {
    id: '6_months',
    title: 'اولترا Ultra (۶ ماهه)',
    durationLabel: '۱۸۰ روز دسترسی با نماد الماس 💎',
    days: 180,
    price: '۱,۱۹۰,۰۰۰ تومان',
    perMonth: 'ماهی ۱۹۸ هزار ت (۳۵٪ تخفیف)',
    tag: 'نماد 💎 الماس در پروفایل',
  },
];

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setActiveTab } = useTask();
  const [selectedPlanId, setSelectedPlanId] = useState<ProDurationPlan>('3_months');
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = PRO_PLANS.find((p) => p.id === selectedPlanId) || PRO_PLANS[1];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const planKey = selectedPlan.id === '6_months' ? 'ultra' : selectedPlan.id === '1_month' ? 'plus' : 'pro';
      await api.submitPayment({
        plan: planKey,
        planType: selectedPlan.id,
        amount: selectedPlan.price,
        trackingCode: 'درخواست شماره کارت',
        paymentMethod: 'request_card',
        note: userNote.trim(),
      });

      // Send direct message to admin (Mohusyn)
      try {
        const text = `🔔 سلام و وقت بخیر، من (${currentUser?.name || 'کاربر'}) متقاضی ارتقا به طرح «${selectedPlan.title}» (${selectedPlan.price}) هستم.\n${userNote.trim() ? `توضیحات: ${userNote.trim()}\n` : ''}لطفاً شماره کارت جهت پرداخت را برای من ارسال فرمایید. با تشکر!`;
        await api.sendDirectMessage('usr_admin_mohusyn', text);
      } catch {}

      setIsSent(true);
      sounds.playComplete();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت درخواست');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToChat = () => {
    onClose();
    setActiveTab('messages');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto text-slate-800"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>ارتقای حساب کاربری به اشتراک ویژه</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  PRO
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                دسترسی به پروژه‌های تیمی، اتاق‌های تمرکز طولانی و تحلیل پیشرفته
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Pro Subscription Plans Selector */}
        <div>
          <div className="text-xs font-black text-slate-800 mb-3 flex items-center justify-between">
            <span>انتخاب پلن مورد نظر:</span>
            <span className="text-[11px] text-emerald-700 font-bold">دسترسی فوری پس از تایید مدیر</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRO_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    sounds.playPop();
                    setSelectedPlanId(plan.id);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between text-right ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/10'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  {plan.tag && (
                    <span className="absolute -top-2.5 left-2 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black shadow-xs">
                      {plan.tag}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900">
                        {plan.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mb-3">
                      {plan.durationLabel}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">
                      {plan.price}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      {plan.perMonth}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">تسک‌های نامحدود</div>
              <div className="text-[10px] text-slate-500">بدون سقف ۵ تسک در پلن پایه</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <FolderKanban className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">پروژه‌های تیمی نامحدود</div>
              <div className="text-[10px] text-slate-500">ایجاد تیم‌ها و چت‌های اختصاصی</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">اتاق‌های تمرکز طولانی</div>
              <div className="text-[10px] text-slate-500">تایمر پومودورو بدون محدودیت زمانی</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">پیام‌رسان بدون محدودیت</div>
              <div className="text-[10px] text-slate-500">ارتباط لایو با کلیه همکاران</div>
            </div>
          </div>
        </div>

        {/* Request Notice Box (No public card number shown to everyone!) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نحوه پرداخت و فعال‌سازی اشتراک</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            جهت امنیت و هماهنگی پرداخت، اطلاعات شماره کارت به صورت مستقیم و اختصاصی توسط مدیر سیستم (<span className="font-bold text-slate-800">Mohusyn</span>) در بخش پیام‌ها برای شما ارسال خواهد شد.
          </p>
        </div>

        {/* Submit Form or Sent Confirmation */}
        {isSent ? (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 space-y-3 text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-black text-slate-900">
              درخواست فعال‌سازی «{selectedPlan.title}» با موفقیت برای مدیر ارسال شد!
            </h4>
            <p className="text-xs leading-relaxed text-slate-600">
              پیام شما در چت خصوصی به مدیر سیستم ارسال گردید. مدیر به زودی شماره کارت و اطلاعات واریز را در بخش پیام‌ها برای شما ارسال خواهد کرد.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleGoToChat}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>مشاهده پیام در بخش گفتگوها</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                یادداشت یا شماره تماس برای مدیر (اختیاری)
              </label>
              <input
                type="text"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="مثال: شماره تماس جهت هماهنگی یا توضیح..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? 'در حال ارسال درخواست...' : `درخواست شماره کارت برای «${selectedPlan.title}» 🚀`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
