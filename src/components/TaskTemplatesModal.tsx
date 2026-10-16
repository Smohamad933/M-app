import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import type { Priority } from '../types';
import { getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  X,
  Sparkles,
  Plus,
  Briefcase,
  Users,
  Target,
  Heart,
  Layers,
  BookOpen,
  Check,
} from 'lucide-react';

interface TaskTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: 'work' | 'personal' | 'growth' | 'wellness';
  icon: React.ElementType;
  badge: string;
  subtasks: string[];
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'tpl_deep_work',
    title: 'شروع روز کاری و تمرکز عمیق (Deep Work)',
    description: 'روتین استاندارد برای آغاز پربازده روز و قطع عوامل حواس‌پرتی',
    priority: 'high',
    category: 'work',
    icon: Target,
    badge: 'بهره‌وری بالا',
    subtasks: [
      'تعیین ۳ اولویت طلایی و مهم روز',
      'بستن تمام تب‌های غیرضروری و فعال‌سازی حالت فوکوس',
      'بلوک ۹۰ دقیقه‌ای تمرکز عمیق روی سخت‌ترین کار (قورت دادن قورباغه)',
      'بررسی و پاسخ‌گویی متمرکز به پیام‌ها و ایمیل‌های مهم',
    ],
  },
  {
    id: 'tpl_meeting_prep',
    title: 'برگزاری جلسه رسمی کاری و مذاکره',
    description: 'چک‌لیست آماده‌سازی و پیگیری نتایج جلسات برای عدم اتلاف وقت',
    priority: 'urgent',
    category: 'work',
    icon: Users,
    badge: 'تیمی',
    subtasks: [
      'تهیه سرفصل‌ها و دستور جلسه (Agenda)',
      'بررسی فایل‌های پیوست و آمار موردنیاز پیش از جلسه',
      'ثبت مصوبات و افراد مسئول در حین جلسه',
      'ارسال صورت‌جلسه و گام‌های بعدی بلافاصله پس از اتمام',
    ],
  },
  {
    id: 'tpl_project_deliver',
    title: 'تحویل نهایی پروژه و بستن فاز (Delivery)',
    description: 'کنترل کیفیت، تست نهایی، تهیه مستندات و تسویه حساب با کارفرما',
    priority: 'high',
    category: 'work',
    icon: Briefcase,
    badge: 'پروژه',
    subtasks: [
      'تست نهایی عملکرد و مرور باگ‌های احتمالی',
      'تهیه نسخه پشتیبان نهایی و فایل‌های منبع',
      'نگارش مستندات تحویل یا راهنمای کاربری',
      'ارسال فاکتور نهایی و اعلام رسمی تحویل به مشتری',
    ],
  },
  {
    id: 'tpl_weekly_review',
    title: 'بازبینی هفتگی و برنامه‌ریزی شنبه',
    description: 'مرور نتایج هفته گذشته، پاکسازی تسک‌ها و تنظیم اهداف هفته بعد',
    priority: 'high',
    category: 'growth',
    icon: Layers,
    badge: 'استراتژیک',
    subtasks: [
      'مرور کارهای انجام‌شده و استریک فعالیت',
      'انتقال یا حذف تسک‌های معوقه و تسویه‌نشده',
      'تعیین ۳ هدف کلان برای هفته آینده',
      'مرتب‌سازی دسکتاپ و صندوق دریافت پیام‌ها',
    ],
  },
  {
    id: 'tpl_wellness_reset',
    title: 'روتین سلامت، ورزش و بازیابی انرژی',
    description: 'شارژ مجدد قوای جسمی و ذهنی برای حفظ پیوستگی و جلوگیری از فرسودگی',
    priority: 'medium',
    category: 'wellness',
    icon: Heart,
    badge: 'سلامتی',
    subtasks: [
      'نوشیدن دو لیوان آب ولرم و هیدراتاسیون',
      '۲۰ دقیقه پیاده‌روی سریع یا حرکات کششی سبک',
      'تنفس عمیق ۵ دقیقه‌ای یا مدیتشن بدون تلفن همراه',
      'ثبت یادداشت شکرگزاری یا نکته مثبت روز',
    ],
  },
  {
    id: 'tpl_reading_sprint',
    title: 'جلسه مطالعه عمیق و خلاصه‌نویسی',
    description: 'توسعه مهارت‌های فردی و مطالعه کتاب یا مقالات تخصصی',
    priority: 'medium',
    category: 'growth',
    icon: BookOpen,
    badge: 'یادگیری',
    subtasks: [
      'انتخاب فصل یا مقاله مورد نظر',
      '۳۰ دقیقه مطالعه پیوسته بدون وقفه',
      'یادداشت‌برداری از ۳ ایده کلیدی در دفترچه',
      'طرح‌ریزی یک اقدام عملی بر اساس آموخته‌ها',
    ],
  },
];

export const TaskTemplatesModal: React.FC<TaskTemplatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addTask, selectedDate } = useTask();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedTemplateId, setAddedTemplateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayISO = getTodayISO();

  const filtered = PRESET_TEMPLATES.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleApplyTemplate = (tpl: PresetTemplate) => {
    sounds.playComplete();
    addTask({
      title: tpl.title,
      description: tpl.description,
      date: selectedDate || todayISO,
      priority: tpl.priority,
      categoryId: tpl.category === 'wellness' ? 'health' : 'work',
      completed: false,
      subtasks: tpl.subtasks.map((st) => ({
        id: crypto.randomUUID(),
        title: st,
        completed: false,
      })),
    });

    setAddedTemplateId(tpl.id);
    setTimeout(() => {
      setAddedTemplateId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-zinc-100 rounded-[32px] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                قالب‌های آماده و چک‌لیست‌های سریع
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                افزودن برنامه‌های استاندارد کاری و فردی با یک کلیک بدون تایپ مجدد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-5 sm:px-6 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
          {[
            { id: 'all', label: 'همه قالب‌ها' },
            { id: 'work', label: 'کسب‌وکار و کار' },
            { id: 'growth', label: 'رشد و استراتژی' },
            { id: 'wellness', label: 'سلامت و روتین' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                sounds.playPop();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of Templates */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1 min-h-0">
          {filtered.map((tpl) => {
            const Icon = tpl.icon;
            const isAdded = addedTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {tpl.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                          {tpl.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    disabled={isAdded}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>افزوده شد!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن به امروز</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subtask preview */}
                <div className="pr-10 space-y-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                  {tpl.subtasks.map((st, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#18181a] flex-shrink-0">
          <div className="text-[11px] text-slate-400 font-medium">
            تمام زیرتسک‌ها به صورت خودکار به لیست کارهای امروز شما اضافه می‌شوند.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
