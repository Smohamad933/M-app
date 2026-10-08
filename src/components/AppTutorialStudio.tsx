import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import JSZip from 'jszip';
import {
  Sparkles,
  Download,
  Layers,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Copy,
  Check,
  Edit3,
  Repeat,
  Bell,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';

export type TutorialFormat = 'feed_carousel' | 'story_highlight';
export type FeedAspectRatio = '4:5' | '1:1';
export type TutorialTheme = 'dark' | 'indigo' | 'emerald' | 'purple';

export interface TutorialSlideData {
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  bullets: string[];
  highlightTip?: string;
  mockupType: 'welcome' | 'routine' | 'planner' | 'focus' | 'habits' | 'reminders' | 'extension' | 'cta';
}

const DEFAULT_TUTORIAL_SLIDES: TutorialSlideData[] = [
  {
    stepNumber: 1,
    badge: 'معرفی جامع • شروع کار',
    title: 'چطور با بَگ‌تایم روزت رو نجات بدی؟ ⚡',
    subtitle: 'راهنمای گام‌به‌گام و صفر تا صد استفاده از سامانه مدیریت زمان',
    bullets: [
      'پایان بلاتکلیفی، فراموشی کارهای مهم و سردرگمی روزانه',
      'تلفیق هوشمند دیلی‌پلنر، زمان‌بندی ساعتی و تایمر تمرکز عمیق',
      'دسترسی آنی و سریع در task.mohusyn.ir و bagtime.negahm.ir',
      'پشتیبانی کامل از موبایل، تبلت و کامپیوتر بدون فیلتر',
    ],
    highlightTip: '💡 اسلایدها رو ورق بزن تا در ۳ دقیقه به کل سیستم مسلط بشی!',
    mockupType: 'welcome',
  },
  {
    stepNumber: 2,
    badge: 'گام اول • ثبت تسک و روتین',
    title: 'یک‌بار بنویس، برای تمام ماه ثبت کن! 🔁',
    subtitle: 'سیستم ثبت هوشمند تسک‌ها و روتین‌های روزانه خودکار',
    bullets: [
      'با دکمه سبز «افزودن کار جدید» تسک‌های روزت رو ثبت کن',
      'گزینه «تکرار به عنوان روتین» رو بزن تا خودکار برای تمام ماه ثبت بشه',
      'دیگه نیاز نیست کارهای تکراری روزانه رو هرروز دستی وارد کنی!',
      'امکان تعیین اولویت، دسته‌بندی و چک‌لیست زیرکارها',
    ],
    highlightTip: '⚡ تسک‌های روتین با نشانگر بنفش 🔁 روتین در تقویم مشخص میشن.',
    mockupType: 'routine',
  },
  {
    stepNumber: 3,
    badge: 'گام دوم • پلنر ساعتی',
    title: 'بلوک‌های زمانی ساعت به ساعت (Time Blocking) 🕒',
    subtitle: 'تکنیک برنامه‌ریزی افراد فوق‌موفق روی گانت ۲۴ ساعته',
    bullets: [
      'برای کارهات ساعت مشخص تعیین کن تا روی خط زمانی روز بچینن',
      'خط قرمز زنده «هم‌اکنون» دقیقا بهت نشون میده الان باید مشغول چی باشی',
      'جلوگیری ۱۰۰٪ از پرش ذهن بین کارها و هدر رفتن ساعات مفید روز',
      'قابلیت شیفت و هماهنگی کارها متناسب با انرژی روزانه',
    ],
    highlightTip: '🎯 وقتی بدونی الان باید چی کار کنی، اراده‌ت تلف نمیشه!',
    mockupType: 'planner',
  },
  {
    stepNumber: 4,
    badge: 'گام سوم • تمرکز و اتاق زنده',
    title: 'تمرکز عمیق ۲۵ دقیقه‌ای و ورود با کد QR ⏱️',
    subtitle: 'تکنیک کار عمیق پومودورو بدون حواس‌پرتی گوشی و شبکه‌های اجتماعی',
    bullets: [
      'تایمر ۲۵ دقیقه تمرکز + ۵ دقیقه استراحت رو استارت بزن',
      'دقایق تمرکز شما خودکار روی تسک و گزارش عملکرد ماهانه ذخیره میشه',
      'امکان ایجاد «اتاق تمرکز زنده» با دوستان و همکاران',
      'پیوستن فوق‌العاده سریع با اسکن کد QR بدون نیاز به نصب اپلیکیشن!',
    ],
    highlightTip: '👥 وقتی در اتاق تمرکز با بقیه هستی، انگیزه و بازدهیت دوبرابر میشه.',
    mockupType: 'focus',
  },
  {
    stepNumber: 5,
    badge: 'گام چهارم • تیک قرمز و تحلیلگر',
    title: 'تیک قرمز و کشف علت عدم انجام کارها ❌',
    subtitle: 'تحلیلگر هوشمند عادت‌ها و رفع چرایی کارهای نصفه مونده',
    bullets: [
      'اگر کاری انجام نشد، علت رو ثبت کن (خستگی، اتلاف وقت، تداخل...)',
      'کارهای نصفه مونده با نشانگر متمایز «تیک قرمز» روی کارت مشخص میشن',
      'هوش مصنوعی سامانه نمودار موانع اصلی موفقیتت رو رسم میکنه',
      'تکنیک‌های رفع اهمال‌کاری متناسب با مشکل شما پیشنهاد داده میشه',
    ],
    highlightTip: '🔍 با شناخت دلایل تنبلی، دفعه بعد جلوش رو می‌گیری.',
    mockupType: 'habits',
  },
  {
    stepNumber: 6,
    badge: 'گام پنجم • یادآور ۳۰ روزه و تقویم',
    title: 'یادآورهای دوره‌ای ۳۰ روزه و تقویم دوزبانه 🔔',
    subtitle: 'فراموش نکردن قسط‌ها، چکاپ‌ها، جلسات ماهانه و پیگیری‌ها',
    bullets: [
      'یادآورهای ماهانه و دوره‌ای ۳۰ روزه با شمارش معکوس دقیق',
      'قابلیت سوئیچ یکپارچه بین تقویم شمسی (جلالی) و میلادی (گریگوری)',
      'نمایش وضعیت روزها، استریک و ثبات در پایبندی به برنامه‌ها',
      'اطلاع‌رسانی بلادرنگ پیامکی و اعلان روی دستگاه',
    ],
    highlightTip: '📅 ذهن برای ایده‌پردازیه، نه نگه داشتن تاریخ‌ها!',
    mockupType: 'reminders',
  },
  {
    stepNumber: 7,
    badge: 'گام ششم • افزونه مرورگر',
    title: 'اکستنشن تب جدید نیوتَب (Chrome & Firefox) 💻',
    subtitle: 'برنامه‌هات با باز کردن هر تب جدید جلوی چشمته',
    bullets: [
      'با نصب اکستنشن، هر تب مرورگر تبدیل به داشبورد اختصاصی بَگ‌تایم میشه',
      'ساعت زنده، تسک‌های فوری امروز و وضعیت تمرکز بدون باز کردن سایت',
      'جلوگیری از رفتن به یوتیوب و شبکه‌های اجتماعی هنگام کار با لپ‌تاپ',
      'دانلود مستقیم با یک کلیک در پنل کاربری بَگ‌تایم',
    ],
    highlightTip: '🖥️ تمرکزت روی سیستم و لپ‌تاپ همیشه حفظ می‌مونه.',
    mockupType: 'extension',
  },
  {
    stepNumber: 8,
    badge: 'گام آخر • شروع قدرتمند',
    title: 'همین الان شروع کن و زندگیت رو سازماندهی کن! 🚀',
    subtitle: 'ورود رایگان، بدون فیلترشکن و سازگار با همه دستگاه‌ها',
    bullets: [
      'ورود مستقیم با شماره موبایل و ربات بله',
      'آدرس دائمی سرور: task.mohusyn.ir و bagtime.negahm.ir',
      'قابل نصب به صورت اپلیکیشن PWA روی آیفون و اندروید',
      'سیستم ابری با ذخیره لحظه‌ای و امنیت بالا',
    ],
    highlightTip: '✨ تصمیم امروزت، موفقیت ۶ ماه آینده‌ت رو می‌سازه!',
    mockupType: 'cta',
  },
];

export const AppTutorialStudio: React.FC = () => {
  const [slides, setSlides] = useState<TutorialSlideData[]>(() => {
    try {
      const saved = localStorage.getItem('bagtime_tutorial_slides_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TUTORIAL_SLIDES;
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [format, setFormat] = useState<TutorialFormat>('feed_carousel');
  const [feedRatio, setFeedRatio] = useState<FeedAspectRatio>('4:5'); // 4:5 is primary Instagram carousel standard!
  const [theme, setTheme] = useState<TutorialTheme>('dark');
  const [quality, setQuality] = useState<'hd' | '4k'>('hd');
  const [customHandle, setCustomHandle] = useState<string>('@bagtime_app');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const updateSlideField = (field: keyof TutorialSlideData, val: any) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[currentSlideIndex] = {
        ...updated[currentSlideIndex],
        [field]: val,
      };
      try {
        localStorage.setItem('bagtime_tutorial_slides_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetSlides = () => {
    if (confirm('آیا مایل به بازنشانی اسلایدهای آموزش به متن‌های پیش‌فرض هستید؟')) {
      setSlides(DEFAULT_TUTORIAL_SLIDES);
      try {
        localStorage.removeItem('bagtime_tutorial_slides_v2');
      } catch {}
      sounds.playComplete();
    }
  };

  // Color Theme Palettes matching Instagram Studio & Bag Time Dark aesthetic
  const getThemeStyles = () => {
    switch (theme) {
      case 'indigo':
        return {
          container: 'bg-gradient-to-b from-[#0b0e1a] via-[#1e1b4b] to-[#0f172a] text-white border border-indigo-800/40 shadow-2xl',
          badge: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
          card: 'bg-indigo-950/70 border border-indigo-700/60 text-indigo-100 shadow-md',
          accent: 'text-amber-300',
          bullet: 'text-amber-400',
          glow1: 'bg-indigo-500/25',
          glow2: 'bg-amber-500/20',
          headerBorder: 'border-indigo-800/60',
          footerBorder: 'border-indigo-800/60',
          footerText: 'text-indigo-300',
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-b from-[#021f18] via-[#064e3b] to-[#022c22] text-white border border-emerald-800/40 shadow-2xl',
          badge: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
          card: 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-100 shadow-md',
          accent: 'text-emerald-300',
          bullet: 'text-emerald-400',
          glow1: 'bg-emerald-500/25',
          glow2: 'bg-teal-500/20',
          headerBorder: 'border-emerald-800/60',
          footerBorder: 'border-emerald-800/60',
          footerText: 'text-emerald-300',
        };
      case 'purple':
        return {
          container: 'bg-gradient-to-b from-[#180a24] via-[#2e1065] to-[#140727] text-white border border-purple-800/40 shadow-2xl',
          badge: 'bg-purple-500/25 text-purple-200 border border-purple-500/30',
          card: 'bg-purple-950/70 border border-purple-700/60 text-purple-100 shadow-md',
          accent: 'text-purple-300',
          bullet: 'text-purple-400',
          glow1: 'bg-purple-500/25',
          glow2: 'bg-pink-500/20',
          headerBorder: 'border-purple-800/60',
          footerBorder: 'border-purple-800/60',
          footerText: 'text-purple-300',
        };
      case 'dark':
      default:
        // Deep obsidian site dark theme (#070b14, #0b0f19, #0f172a)
        return {
          container: 'bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#0b0f19] text-white border border-slate-800 shadow-2xl',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          card: 'bg-slate-900/95 border border-slate-800 text-slate-100 shadow-md',
          accent: 'text-emerald-400',
          bullet: 'text-emerald-400',
          glow1: 'bg-purple-500/20',
          glow2: 'bg-emerald-500/20',
          headerBorder: 'border-slate-800',
          footerBorder: 'border-slate-800',
          footerText: 'text-slate-400',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Photorealistic UI Mockup Renderer based on tutorial step
  const renderStepMockup = (type: TutorialSlideData['mockupType']) => {
    switch (type) {
      case 'welcome':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-2 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-slate-400 text-[9px] font-mono" dir="ltr">task.mohusyn.ir/login</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
              <TaskMasterHexagon size={24} />
              <div className="flex-1">
                <div className="font-black text-white text-[11px]">سامانه مدیریت زمان بَگ‌تایم</div>
                <div className="text-[8.5px] text-slate-400">ورود با شماره موبایل یا ربات بله</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-bold">
                آنلاین
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[8.5px] text-center font-bold">
              <div className="p-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-emerald-300">✓ تم دارک و لایت</div>
              <div className="p-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-purple-300">✓ تقویم شمسی و میلادی</div>
            </div>
          </div>
        );

      case 'routine':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-purple-400 flex items-center gap-1">
                <Repeat className="w-3 h-3 text-purple-400" />
                <span>روتین‌های تکرارشونده ماهانه</span>
              </span>
              <span className="text-[8px] text-slate-400">تکرار ۳۰ روزه</span>
            </div>
            <div className="space-y-1">
              <div className="p-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                  <span className="font-bold text-white text-[9px]">ورزش و پیاده‌روی صبحگاهی</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[7.5px] font-bold">🔁 هرروز ماه</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">✓</span>
                  <span className="font-bold text-slate-200 text-[9px]">مطالعه ۳۰ صفحه کتاب تخصصی</span>
                </div>
                <span className="text-[8px] text-slate-400 font-mono">۲۱:۳۰</span>
              </div>
            </div>
          </div>
        );

      case 'planner':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>دیلی‌پلنر ساعتی بَگ‌تایم</span>
              </span>
              <span className="text-slate-400 text-[8px]">چهارشنبه • امروز</span>
            </div>
            <div className="space-y-1 text-[9px]">
              <div className="p-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border-r-4 border-emerald-500 border border-emerald-800/60 shadow-lg flex items-center justify-between">
                <div>
                  <div className="font-black text-white text-[9.5px]">توسعه پروژه و کدنویسی عمیق</div>
                  <div className="text-[7.5px] text-emerald-300">⏱️ ۱۰:۰۰ تا ۱۱:۳۰</div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[7.5px] font-black animate-pulse">
                  هم‌اکنون
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-slate-400">
                <span>جلسه با کارفرما و ارائه گزارش</span>
                <span className="text-[8px] font-mono">۱۲:۰۰</span>
              </div>
            </div>
          </div>
        );

      case 'focus':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-amber-400">اتاق تمرکز زنده (دیپ ورک)</span>
              <span className="text-emerald-400 text-[8px] font-bold">🟢 ۴ نفر آنلاین</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-lg font-black font-mono text-white tracking-wider">۲۴:۵۲</div>
                <div className="text-[8px] text-amber-300 font-bold">پومودورو ۲۵ دقیقه‌ای</div>
              </div>
              <div className="text-left bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                <div className="text-[7.5px] text-emerald-400 font-bold">📱 ورود با اسکن QR</div>
                <div className="text-[7px] text-slate-400">اتصال آنی بدون لاگین</div>
              </div>
            </div>
          </div>
        );

      case 'habits':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-rose-400">تیک قرمز و تحلیل علت عدم انجام</span>
              <span className="text-slate-400 text-[8px]">هوش مصنوعی</span>
            </div>
            <div className="p-1.5 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[9px] font-black">✕</span>
                <span className="font-bold text-white text-[9px]">تکمیل گزارش حسابداری شرکت</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[7.5px] font-bold">تیک قرمز ❌</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[8px] flex items-center justify-between text-slate-300">
              <span>علت ثبت‌شده: «کمبود وقت و تداخل کاری»</span>
              <span className="text-amber-400 font-bold">راهکار: جابجایی به ۹ صبح</span>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-amber-300 flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-400" />
                <span>یادآورهای دوره‌ای ۳۰ روزه</span>
              </span>
              <span className="text-slate-400 text-[8px]">هوشمند</span>
            </div>
            <div className="p-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-[9px]">پرداخت اجاره دفتر و تمدید هاست</div>
                <div className="text-[7.5px] text-amber-300">🔔 هشدار ۳ روز قبل از موعد</div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-black">
                ۲ روز مانده
              </span>
            </div>
          </div>
        );

      case 'extension':
        return (
          <div className="w-full rounded-2xl bg-[#070b14] border border-slate-800 p-2.5 sm:p-3 space-y-1.5 text-right font-sans text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-black text-emerald-400">اکستنشن تب جدید مرورگر (New Tab)</span>
              <span className="text-slate-400 text-[8px]">Chrome & Edge</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-[8px] text-slate-400 px-2">
              <span>در هر تب جدید: ساعت زنده + تسک‌های فوری + تایمر</span>
              <span>⚡</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[8px] text-center font-bold">
              <div className="p-1 rounded-lg bg-slate-800 text-slate-300">📌 بدون فیلتر</div>
              <div className="p-1 rounded-lg bg-slate-800 text-emerald-300">⚡ سبک و سریع</div>
              <div className="p-1 rounded-lg bg-slate-800 text-slate-300">🔄 همگام با سایت</div>
            </div>
          </div>
        );

      case 'cta':
      default:
        return (
          <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 p-2.5 sm:p-3 space-y-1.5 text-center text-[10px]">
            <TaskMasterHexagon size={26} className="mx-auto" />
            <div className="font-black text-white text-xs">سامانه مدیریت زمان بَگ‌تایم</div>
            <div className="text-slate-300 text-[9px]">همین حالا رایگان شروع کن:</div>
            <div className="p-1.5 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow-sm">
              task.mohusyn.ir ⚡
            </div>
            <div className="text-[8.5px] text-slate-400 font-mono" dir="ltr">{customHandle}</div>
          </div>
        );
    }
  };

  // Render Single Slide Content (Unified for 4:5 Feed or 9:16 Story)
  const renderSlideGraphic = (s: TutorialSlideData, isStory = false) => {
    return (
      <div
        className={`w-full h-full ${themeStyles.container} ${
          isStory ? 'p-6 sm:p-7 flex flex-col justify-between' : 'p-5 sm:p-6 flex flex-col justify-between'
        } relative overflow-hidden select-none`}
        dir="rtl"
        style={{
          fontFamily: 'inherit',
          fontFeatureSettings: '"liga" 1, "calt" 1',
        }}
      >
        {/* Glow Decors */}
        <div className={`absolute top-0 right-0 w-56 h-56 rounded-full ${themeStyles.glow1} blur-3xl pointer-events-none`} />
        <div className={`absolute bottom-0 left-0 w-56 h-56 rounded-full ${themeStyles.glow2} blur-3xl pointer-events-none`} />

        {/* Top Header */}
        <div className={`flex items-center justify-between z-10 border-b ${themeStyles.headerBorder} pb-2.5 flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={24} />
            <div className="leading-tight">
              <span className="font-black text-xs sm:text-sm text-white">بَگ‌تایم</span>
              <span className="text-[8px] text-slate-400 block font-mono" dir="ltr">BagTime</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black ${themeStyles.badge}`}>
              {s.badge}
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold" dir="ltr">
              {toPersianDigits(s.stepNumber)}/{toPersianDigits(slides.length)}
            </span>
          </div>
        </div>

        {/* Center Main Body */}
        <div className="my-auto space-y-2 z-10 text-right py-1 flex-1 flex flex-col justify-center">
          <h2 className="text-sm sm:text-base font-black leading-snug text-white">
            {s.title}
          </h2>

          <p className="text-[10.5px] sm:text-[11px] font-bold text-slate-300 leading-relaxed">
            {s.subtitle}
          </p>

          {/* Interactive UI Mockup */}
          <div className="my-1">
            {renderStepMockup(s.mockupType)}
          </div>

          {/* Bullet points */}
          <div className="space-y-1 text-xs">
            {s.bullets.slice(0, 4).map((b, idx) => (
              <div
                key={idx}
                className={`p-1.5 sm:p-2 rounded-xl ${themeStyles.card} flex items-start gap-1.5 text-right leading-relaxed`}
              >
                <span className={`font-black ${themeStyles.bullet} text-xs`}>•</span>
                <span className="flex-1 text-[10.5px] sm:text-[11px] font-bold text-slate-200">{b}</span>
              </div>
            ))}
          </div>

          {s.highlightTip && (
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[10.5px] text-center">
              {s.highlightTip}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`pt-2 border-t ${themeStyles.footerBorder} flex items-center justify-between text-[10px] ${themeStyles.footerText} z-10 flex-shrink-0`}>
          <span className="font-bold">آموزش رسمی کار با سامانه بَگ‌تایم</span>
          <span className="font-mono text-emerald-400 font-bold" dir="ltr">{customHandle}</span>
        </div>
      </div>
    );
  };

  // Dimensions computation
  const isStory = format === 'story_highlight';
  const previewWidth = isStory ? 340 : 360;
  const previewHeight = isStory ? 604 : feedRatio === '4:5' ? 450 : 360; // 4:5 ratio: 360 x 450 (standard Instagram portrait)
  const targetWidth = quality === '4k' ? 2160 : 1080;


  // Export current slide as PNG
  const handleExportSinglePNG = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    const is4K = quality === '4k';
    setExportProgress(`در حال رندر تصویر با کیفیت ${is4K ? '4K' : '۱۰۸۰p'}...`);
    sounds.playPop();

    try {
      await new Promise((r) => setTimeout(r, 60));
      if (typeof document !== 'undefined' && (document as any).fonts) {
        try {
          await (document as any).fonts.ready;
        } catch {}
      }

      const scaleFactor = targetWidth / previewWidth;

      const canvas = await html2canvas(previewRef.current, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#070b14',
        logging: false,
        width: previewWidth,
        height: previewHeight,
        windowWidth: previewWidth,
        windowHeight: previewHeight,
      });

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bagtime-tutorial-${format}-${feedRatio === '4:5' ? '4x5' : '1x1'}-step-${currentSlideIndex + 1}-${quality.toUpperCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (e: any) {
      alert(`خطا در دانلود تصویر: ${e.message || 'مشکل در رندر'}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Export all slides as ZIP
  const handleExportAllZip = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    const is4K = quality === '4k';
    sounds.playPop();

    const zip = new JSZip();

    try {
      const scaleFactor = targetWidth / previewWidth;

      for (let i = 0; i < slides.length; i++) {
        setExportProgress(`در حال پردازش اسلاید ${i + 1} از ${slides.length} (${is4K ? 'کیفیت 4K' : '۱۰۸۰p'})...`);
        const targetEl = exportContainerRef.current.querySelector<HTMLElement>(`#tutorial-clean-${i}`);
        if (!targetEl) continue;

        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(targetEl, {
          scale: scaleFactor,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#070b14',
          logging: false,
          width: previewWidth,
          height: previewHeight,
          windowWidth: previewWidth,
          windowHeight: previewHeight,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector(`#tutorial-clean-${i}`) as HTMLElement;
            if (el) {
              el.style.position = 'static';
              el.style.opacity = '1';
              el.style.visibility = 'visible';
            }
          },
        });

        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        zip.file(`${String(i + 1).padStart(2, '0')}-tutorial-${format}-${quality.toUpperCase()}.png`, blob);
      }

      setExportProgress('در حال بسته‌بندی فایل فشرده ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bagtime-app-complete-tutorial-${format}-${feedRatio === '4:5' ? '4x5' : '1x1'}-${quality.toUpperCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (e: any) {
      alert(`خطا در دانلود بسته ZIP: ${e.message || 'مشکل در رندر'}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Caption generator for Instagram
  const generateCaption = () => {
    return `📌 آموزش کامل و صفر تا صد کار با بَگ‌تایم (Bag Time) ⚡\n\nاگر کارهات همیشه نصفه می‌مونه، بین تسک‌ها سردرگمی یا نمیدونی چطور از روزت حداکثر بازدهی رو بگیری، این راهنمای قدم‌به‌قدم برای شماست.\n\nدر این آموزش یاد می‌گیرید:\n۱. نحوه ثبت سریع تسک‌ها و روتین‌های روزانه/ماهانه\n۲. دیلی‌پلنر ساعتی و تکنیک Time Blocking (بلوک‌بندی ۲۴ ساعته)\n۳. اتاق‌های تمرکز ۲۵ دقیقه‌ای و ورود بدون لاگین با کد QR\n۴. ثبت تیک قرمز و تحلیلگر هوشمند موانع بهره‌وری\n۵. یادآورهای دوره‌ای با شمارش معکوس ۳۰ روزه\n۶. اکستنشن تب جدید مرورگر (Chrome & Edge)\n\n🌐 آدرس ورود به سامانه بدون نیاز به فیلترشکن:\ntask.mohusyn.ir\nbagtime.negahm.ir\n\n💬 کلمه «آموزش» رو توی دایرکت بفرست تا لینک دسترسی مستقیم برات ارسال بشه!\n\n${customHandle} #بگ_تایم #مدیریت_زمان #بهره_وری #برنامه_ریزی #پلنر_ساعتی`;
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(generateCaption());
    setCopiedCaption(true);
    sounds.playPop();
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070b14] text-white p-4 sm:p-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              استودیو مستقل آموزش کامل کار با سامانه (Onboarding & App Tutorial Studio)
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              آموزش ۰ تا ۱۰۰
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            طراحی و خروجی پست اسلایدی پرتره (۴:۵) و استوری‌های هایلایت آموزش نحوه استفاده از تمامی بخش‌های بَگ‌تایم همراه با موکاپ‌های زنده
          </p>
        </div>

        {/* Format Switcher: Carousel Post (4:5) vs Story Highlight (9:16) */}
        <div className="flex items-center rounded-2xl bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setFormat('feed_carousel');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              format === 'feed_carousel'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>پست اسلایدی فید ({feedRatio === '4:5' ? '۴:۵ پرتره' : '۱:۱'})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setFormat('story_highlight');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              format === 'story_highlight'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>استوری هایلایت (۹:۱۶)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left = Live Canvas Preview, Right = Step Selector & Content Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column: Step Selector, Theme, Quality, Custom Handle & Inputs */}
        <div className="lg:col-span-6 space-y-4 order-2 lg:order-2">
          {/* Step Selector (1 to 8) */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>انتخاب مرحله آموزش:</span>
              </span>
              <span className="text-emerald-400">
                مرحله {toPersianDigits(currentSlideIndex + 1)} از {toPersianDigits(slides.length)}
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlideIndex(idx);
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentSlideIndex === idx
                      ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={s.title}
                >
                  {toPersianDigits(idx + 1)}
                </button>
              ))}
            </div>
          </div>

          {/* Theme, Ratio & Quality Controls */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Theme */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">تم رنگ‌بندی:</label>
              <div className="grid grid-cols-4 gap-1">
                {(['dark', 'indigo', 'emerald', 'purple'] as TutorialTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setTheme(t);
                    }}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      theme === t
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {t === 'dark' ? 'تاریک' : t === 'indigo' ? 'ایندیگو' : t === 'emerald' ? 'زمردی' : 'بنفش'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratio (for feed posts) or Quality */}
            {format === 'feed_carousel' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">نسبت ابعاد پست فید:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setFeedRatio('4:5');
                    }}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      feedRatio === '4:5'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ۴:۵ پرتره (استاندارد)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setFeedRatio('1:1');
                    }}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      feedRatio === '1:1'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ۱:۱ مربعی
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">کیفیت خروجی PNG:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setQuality('hd')}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      quality === 'hd'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ۱۰۸۰p رتینا
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality('4k')}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      quality === '4k'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ۴K اولترا
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Handle */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">آیدی / پیج روی خروجی:</label>
            <input
              type="text"
              value={customHandle}
              onChange={(e) => setCustomHandle(e.target.value)}
              placeholder="@bagtime_app"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500 text-left"
              dir="ltr"
            />
          </div>

          {/* Live Content Editor for Active Slide */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>ویرایش محتوای اسلاید {toPersianDigits(currentSlideIndex + 1)}:</span>
              </span>
              <button
                type="button"
                onClick={resetSlides}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>بازنشانی پیش‌فرض</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-300">نشانگر بالا (Badge):</label>
              <input
                type="text"
                value={activeSlide.badge}
                onChange={(e) => updateSlideField('badge', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-300">عنوان اصلی اسلاید:</label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateSlideField('title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-300">زیرعنوان توضیحی:</label>
              <input
                type="text"
                value={activeSlide.subtitle}
                onChange={(e) => updateSlideField('subtitle', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-300">نکات و گام‌های اجرایی (هر سطر یک نکته):</label>
              <textarea
                rows={4}
                value={activeSlide.bullets.join('\n')}
                onChange={(e) => updateSlideField('bullets', e.target.value.split('\n'))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-300">کادر نکته طلایی پایین:</label>
              <input
                type="text"
                value={activeSlide.highlightTip || ''}
                onChange={(e) => updateSlideField('highlightTip', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Instagram Caption Box */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>کپشن آماده اینستاگرام:</span>
              </span>
              <button
                type="button"
                onClick={copyCaption}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? 'کپی شد' : 'کپی متن کامل'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10.5px] text-slate-300 leading-relaxed font-sans max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
              {generateCaption()}
            </div>
          </div>
        </div>

        {/* Left Column: Live Canvas Preview & Quick Export */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-4 order-1 lg:order-1">
          {/* Action Buttons */}
          <div className="w-full flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSinglePNG}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>دانلود همین اسلاید ({quality.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllZip}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>دانلود زیپ کل پکیج آموزش ({quality.toUpperCase()})</span>
              </button>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 text-slate-300">
                اسلاید {toPersianDigits(currentSlideIndex + 1)} از {toPersianDigits(slides.length)}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlideIndex === slides.length - 1}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Export Status Indicator */}
          {isExporting && (
            <div className="w-full p-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-bold text-center animate-pulse">
              {exportProgress}
            </div>
          )}

          {/* Live Canvas Preview Frame */}
          <div className="w-full flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden min-h-[480px]">
            <div
              ref={previewRef}
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
              }}
              className="rounded-3xl shadow-2xl overflow-hidden border border-slate-700/80 transition-all flex-shrink-0"
            >
              {renderSlideGraphic(activeSlide, format === 'story_highlight')}
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen Render Container for Batch Export */}
      <div
        ref={exportContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: `${previewWidth}px`,
          pointerEvents: 'none',
        }}
      >
        {slides.map((_s, idx) => (
          <div
            key={idx}
            id={`tutorial-clean-${idx}`}
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
              overflow: 'hidden',
            }}
          >
            {renderSlideGraphic(_s, format === 'story_highlight')}
          </div>
        ))}
      </div>
    </div>
  );
};
