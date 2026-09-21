import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import type { UncompletedCategory } from '../types';
import {
  AlertTriangle,
  X,
  Check,
  Flame,
  Users,
  Clock,
  BatteryLow,
  Smartphone,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const TaskIncompleteModal: React.FC = () => {
  const { incompleteModalTask, closeIncompleteModal, setTaskIncompleteReason } = useTask();
  const [selectedCategory, setSelectedCategory] = useState<UncompletedCategory>('procrastination');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!incompleteModalTask) return null;

  const categories: Array<{
    id: UncompletedCategory;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    advice: string;
  }> = [
    {
      id: 'procrastination',
      title: 'اهمال‌کاری و تنبلی',
      description: 'شروع کار به تعویق افتاد یا در برابر آن مقاومت ذهنی وجود داشت.',
      icon: Flame,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      advice: 'نکته: قانون ۵ دقیقه را امتحان کنید؛ فقط ۵ دقیقه شروع کنید و فشار تمام کردن را از دوش خود بردارید.',
    },
    {
      id: 'others_priority',
      title: 'اولویت دادن به دیگران',
      description: 'درخواست‌ها، تماس‌ها یا جلسات اطرافیان مانع انجام کار شد.',
      icon: Users,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      advice: 'نکته: یادگیری «نه» گفتن محترمانه و قفل کردن زمان‌های اختصاصی (Time Blocking) نجات‌بخش است.',
    },
    {
      id: 'time_shortage',
      title: 'کمبود زمان و خطای تخمین',
      description: 'حجم کار بیشتر از زمان در نظر گرفته شده بود.',
      icon: Clock,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      advice: 'نکته: همیشه ۲۰ درصد زمان شناور برای پیش‌آمدهای روزانه در تقویم خالی بگذارید.',
    },
    {
      id: 'low_energy',
      title: 'خستگی و افت انرژی',
      description: 'سطح انرژی جسمی یا ذهنی برای انجام باکیفیت کار کافی نبود.',
      icon: BatteryLow,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      advice: 'نکته: کیفیت خواب و تغذیه را بازبینی کنید و کارهای سخت را در ساعت طلایی انرژی خود قرار دهید.',
    },
    {
      id: 'distraction',
      title: 'حواس‌پرتی و فضای مجازی',
      description: 'نوتیفیکیشن‌ها، شبکه‌های اجتماعی یا پرش افکار مانع تمرکز شد.',
      icon: Smartphone,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      advice: 'نکته: حین انجام کار، گوشی را در حالت فوکوس و خارج از میدان دید قرار دهید.',
    },
    {
      id: 'external',
      title: 'مانع خارجی یا مشکل فنی',
      description: 'قطعی اینترنت، بیماری یا رخدادی خارج از کنترل شما پیش آمد.',
      icon: ShieldAlert,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      advice: 'نکته: عوامل خارج از کنترل اجتناب‌ناپذیرند؛ خود را سرزنش نکنید و کار را برای فردا بازتعریف کنید.',
    },
  ];

  const currentAdvice = categories.find((c) => c.id === selectedCategory)?.advice || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setTaskIncompleteReason(
        incompleteModalTask.id,
        selectedCategory,
        customReason.trim() || categories.find((c) => c.id === selectedCategory)?.title || ''
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={closeIncompleteModal}
    >
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                ثبت دلیل عدم انجام تسک
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-mono">
                  AI Habits Analyzer
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                تسک: <span className="text-zinc-200 font-bold">{incompleteModalTask.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeIncompleteModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pl-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              چه عاملی باعث شد این کار انجام نشود یا به تعویق بیفتد؟
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-800/90 border-white ring-1 ring-white/30 shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-xl border ${c.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-xs text-white">{c.title}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed pr-0.5">
                      {c.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Instant Insight Box */}
          {currentAdvice && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 text-indigo-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed font-medium">
                {currentAdvice}
              </div>
            </div>
          )}

          {/* Custom explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">
              توضیحات تکمیلی (اختیاری)
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="مثلاً: درگیر جلسه ناگهانی با کارفرما شدم یا تمرکزم به خاطر شبکه‌های اجتماعی به هم ریخت..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 placeholder:text-zinc-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeIncompleteModal}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 text-xs transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'در حال ثبت...' : 'ثبت در تحلیلگر عادت‌ها'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
