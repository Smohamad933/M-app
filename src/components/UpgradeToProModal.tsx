import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  RefreshCw,
  Copy,
  Bot,
  CreditCard,
} from 'lucide-react';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRO_PLANS: {
  id: ProDurationPlan;
  key: 'plus' | 'pro' | 'ultra';
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
    key: 'plus',
    title: 'پلاس Plus (۱ ماهه)',
    durationLabel: '۳۰ روز دسترسی با نماد پلاس ➕',
    days: 30,
    price: '۲۹۰,۰۰۰ تومان',
    perMonth: 'ماهی ۲۹۰ هزار ت',
    tag: 'نماد ➕ در پروفایل',
  },
  {
    id: '3_months',
    key: 'pro',
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
    key: 'ultra',
    title: 'اولترا Ultra (۶ ماهه)',
    durationLabel: '۱۸۰ روز دسترسی با نماد الماس 💎',
    days: 180,
    price: '۱,۱۹۰,۰۰۰ تومان',
    perMonth: 'ماهی ۱۹۸ هزار ت (۳۵٪ تخفیف)',
    tag: 'نماد 💎 الماس در پروفایل',
  },
];

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setActiveTab, completeBaleVerification } = useTask();
  const [selectedPlanId, setSelectedPlanId] = useState<ProDurationPlan>('3_months');
  const [paymentMode, setPaymentMode] = useState<'bale' | 'card'>('bale');
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Bale Payment Flow States
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isWaitingBalePayment, setIsWaitingBalePayment] = useState(false);
  const [balePaymentDone, setBalePaymentDone] = useState(false);
  const [baleInvoiceData, setBaleInvoiceData] = useState<{
    link: string;
    botUsername: string;
    amountRials: number;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedPlan = PRO_PLANS.find((p) => p.id === selectedPlanId) || PRO_PLANS[1];

  // Auto-poll subscription status while waiting for Bale payment
  useEffect(() => {
    if (!isOpen || !isWaitingBalePayment || balePaymentDone) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const user = await api.getCurrentUser();
        if (user && isMounted) {
          const plan = user.subscription?.plan;
          if (plan === 'pro' || plan === 'plus' || plan === 'ultra') {
            sounds.playComplete();
            setBalePaymentDone(true);
            setIsWaitingBalePayment(false);
            completeBaleVerification(user);
          }
        }
      } catch {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, isWaitingBalePayment, balePaymentDone, completeBaleVerification]);

  if (!isOpen) return null;

  // 1. Direct Bale Payment Handler
  const handlePayWithBale = async () => {
    setIsGeneratingInvoice(true);
    sounds.playPop();
    try {
      const planKey = selectedPlan.key;
      const res = await api.createBalePaymentInvoice(planKey, selectedPlan.id);
      if (res && res.baleBotLink) {
        setBaleInvoiceData({
          link: res.baleBotLink,
          botUsername: res.baleBotLink,
          amountRials: res.amountRials,
        });
        setIsWaitingBalePayment(true);
        // Open Bale directly in new tab or messenger app
        window.open(res.baleBotLink, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در ارتباط با درگاه پرداخت بله');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleCopyBaleLink = () => {
    if (!baleInvoiceData?.link) return;
    try {
      navigator.clipboard.writeText(baleInvoiceData.link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  // 2. Legacy Card Request Handler
  const handleSubmitCardRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const planKey = selectedPlan.key;
      await api.submitPayment({
        plan: planKey,
        planType: selectedPlan.id,
        amount: selectedPlan.price,
        trackingCode: 'درخواست شماره کارت',
        paymentMethod: 'request_card',
        note: userNote.trim(),
      });

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
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>ارتقای حساب کاربری به اشتراک ویژه</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
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
            <span>انتخاب پلن اشتراک:</span>
            <span className="text-[11px] text-emerald-700 font-bold">فعال‌سازی آنی پس از پرداخت</span>
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
                    setBalePaymentDone(false);
                    setIsWaitingBalePayment(false);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between text-right ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/10'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  {plan.tag && (
                    <span className="absolute -top-2.5 left-2 px-2 py-0.5 rounded-full bg-blue-700 text-white text-[9px] font-black shadow-xs">
                      {plan.tag}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900">
                        {plan.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mb-3">
                      {plan.durationLabel}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80">
                    <div className="text-sm font-black text-slate-900">
                      {plan.price}
                    </div>
                    <div className="text-[10px] text-blue-700 font-bold mt-0.5">
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
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">تسک‌های نامحدود</div>
              <div className="text-[10px] text-slate-500">بدون محدودیت روزانه در تعداد تسک</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <FolderKanban className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">پروژه‌های تیمی اختصاصی</div>
              <div className="text-[10px] text-slate-500">ایجاد تیم‌ها و چت‌های پروژه</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">اتاق‌های تمرکز طولانی</div>
              <div className="text-[10px] text-slate-500">تایمر پومودورو بدون محدودیت</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-800">پیام‌رسان بدون مرز</div>
              <div className="text-[10px] text-slate-500">گفتگوی مستقیم با تمامی همکاران</div>
            </div>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setPaymentMode('bale')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
              paymentMode === 'bale'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>پرداخت با پیام‌رسان بله (توصیه‌شده)</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('card')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              paymentMode === 'card'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>هماهنگی کارت‌به‌کارت با مدیر</span>
          </button>
        </div>

        {/* Payment Content based on Mode */}
        {paymentMode === 'bale' ? (
          <div className="space-y-4">
            {balePaymentDone ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-black text-slate-900">
                  🎉 پرداخت شما با موفقیت در بله تأیید و حساب شما فعال گردید!
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  طرح <b>«{selectedPlan.title}»</b> به حساب کاربری شما افزوده شد. اکنون دسترسی کامل به کلیه امکانات نامحدود دارید.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    شروع استفاده از امکانات ویژه 🚀
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950">
                      پرداخت امن و آنی از طریق کیف‌پول و درگاه بله
                    </h4>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                      با لمس دکمه زیر، فاکتور خرید مستقیم در بازوی رسمی بله برای شما صادر شده و می‌توانید به وسیله کیف‌پول الکترونیکی بله یا تمامی کارت‌های عضو شتاب پرداخت فرمایید.
                    </p>
                  </div>
                </div>

                {isWaitingBalePayment && (
                  <div className="p-3 rounded-xl bg-white/90 border border-blue-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-700 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>در انتظار پرداخت شما در پیام‌رسان بله...</span>
                    </div>
                    {baleInvoiceData?.link && (
                      <button
                        type="button"
                        onClick={handleCopyBaleLink}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLink ? 'کپی شد' : 'کپی لینک بله'}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePayWithBale}
                    disabled={isGeneratingInvoice}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingInvoice ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    <span>
                      {isWaitingBalePayment
                        ? `باز کردن مجدد فاکتور «${selectedPlan.title}» در بله 🚀`
                        : `صدور فاکتور و پرداخت آنلاین ${selectedPlan.price} در بله 🚀`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Card-to-card manual request mode */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>هماهنگی اختصاصی شماره کارت با مدیر</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                جهت امنیت و هماهنگی پرداخت، اطلاعات شماره کارت به صورت مستقیم و اختصاصی توسط مدیر سیستم (<span className="font-bold text-slate-800">Mohusyn</span>) در بخش پیام‌ها برای شما ارسال خواهد شد.
              </p>
            </div>

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
              <form onSubmit={handleSubmitCardRequest} className="space-y-3 pt-1">
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
        )}
      </div>
    </div>
  );
};
