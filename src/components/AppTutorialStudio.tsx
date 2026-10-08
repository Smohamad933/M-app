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
      'گزینه «تکرار به عنوان روتین» رو بزن تا خودکار برای تمام هفته یا تمام ماه (۳۰ روز) ثبت بشه',
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
      'تسک یک «تیک قرمز هشدار» می‌گیره تا از یادت نره و بعدا اصلاحش کنی',
      'در بخش «تحلیلگر عادت‌ها»، نمودارها بهت میگن بیشترین نقطه‌ضعف کجاست',
      'رویکرد مبتنی بر داده برای بهبود مستمر بهره‌وری فردی',
    ],
    highlightTip: '🔍 تا نفهمی چرا کارهات عقب میفته، برنامه‌ت تغییر نمیکنه!',
    mockupType: 'habits',
  },
  {
    stepNumber: 6,
    badge: 'گام پنجم • یادآورهای ۳۰ روزه',
    title: 'یادآورهای دوره‌ای با آلارم و نوتیفیکیشن روزانه 🔔',
    subtitle: 'عادت‌ها و قرارهای حیاتی رو حتی یک روز هم از دست نده',
    bullets: [
      'ساعت مشخص روز رو تعیین کن و دوره رو روی «عرض ۱ ماه هرروز» بذار',
      'راس ساعت، صدای زنگ هشدار و نوتیفیکیشن مستقیم دریافت می‌کنی',
      'مناسب برای مصرف ویتامین و دارو، بررسی ایمیل‌ها، ورزش و خواب',
      'فعال‌سازی یا خاموش‌سازی هر یادآور با یک کلیک ساده',
    ],
    highlightTip: '⏰ یادآورهای بگ‌تایم نیازی به تقویم‌های پیچیده خارجی ندارند.',
    mockupType: 'reminders',
  },
  {
    stepNumber: 7,
    badge: 'گام ششم • افزونه نیوتَب مرورگر',
    title: 'افزونه تب جدید مرورگر (New Tab Assistant) 🌐',
    subtitle: 'هر بار تب جدید باز می‌کنی، کارها و اهدافت جلو چشمته!',
    bullets: [
      'قابل نصب روی کروم، مایکروسافت اج و موزیلا فایرفاکس',
      'ساعت دیجیتال مدرن، سرچ سریع، میانبرهای کاری و تسک‌های امروز',
      'ورود همزمان و سینک خودکار تسک‌ها بین مرورگر و وب‌اپلیکیشن',
      'جلوگیری از رفتن به یوتیوب و شبکه‌های اجتماعی هنگام کار با کامپیوتر',
    ],
    highlightTip: '💻 با هر بار باز کردن تب مرورگر، روی مهم‌ترین کار متمرکز بمون.',
    mockupType: 'extension',
  },
  {
    stepNumber: 8,
    badge: 'گام آخر • شروع رایگان',
    title: 'همین حالا روزت رو متحول کن! 🚀',
    subtitle: 'سامانه بَگ‌تایم؛ بدون نیاز به نصب، کاملاً رایگان و در دسترس',
    bullets: [
      'آدرس ورود مستقیم: task.mohusyn.ir یا bagtime.negahm.ir',
      'ورود سریع با نام کاربری یا تایید شماره با ربات بله',
      'دسترسی کامل به تمام ابزارهای پلنر، تمرکز، تقویم شمسی و روتین‌ها',
      'برای دریافت لینک فوری، کلمه «بگ‌تایم» رو در دایرکت ارسال کن!',
    ],
    highlightTip: '✌️ از همین امروز کارهات رو طبق برنامه تموم کن و لذت ببر.',
    mockupType: 'cta',
  },
];

export const AppTutorialStudio: React.FC = () => {
  

  const [format, setFormat] = useState<TutorialFormat>('feed_carousel');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [theme, setTheme] = useState<TutorialTheme>('dark');
  const [quality, setQuality] = useState<'hd' | '4k'>('hd');
  const [customHandle, setCustomHandle] = useState<string>(() => {
    try {
      return localStorage.getItem('bagtime_instagram_handle') || '@bagtime_app';
    } catch {
      return '@bagtime_app';
    }
  });

  const [slides, setSlides] = useState<TutorialSlideData[]>(() => {
    try {
      const saved = localStorage.getItem('bagtime_tutorial_slides_v2');
      return saved ? JSON.parse(saved) : DEFAULT_TUTORIAL_SLIDES;
    } catch {
      return DEFAULT_TUTORIAL_SLIDES;
    }
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const updateActiveSlide = (patch: Partial<TutorialSlideData>) => {
    setSlides((prev) => {
      const updated = prev.map((s, idx) => (idx === currentSlideIndex ? { ...s, ...patch } : s));
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

  // Color Theme Palettes
  const getThemeStyles = () => {
    switch (theme) {
      case 'indigo':
        return {
          container: 'bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#131b31] text-white border-indigo-900/40',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          card: 'bg-indigo-950/40 border-indigo-800/40 text-slate-200',
          accent: 'text-amber-400',
          bullet: 'text-indigo-400',
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-br from-[#041a14] via-[#02130e] to-[#072c22] text-white border-emerald-900/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          card: 'bg-emerald-950/40 border-emerald-800/40 text-slate-200',
          accent: 'text-emerald-400',
          bullet: 'text-emerald-400',
        };
      case 'purple':
        return {
          container: 'bg-gradient-to-br from-[#180a24] via-[#0f0517] to-[#250f38] text-white border-purple-900/40',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          card: 'bg-purple-950/40 border-purple-800/40 text-slate-200',
          accent: 'text-pink-400',
          bullet: 'text-purple-400',
        };
      case 'dark':
      default:
        return {
          container: 'bg-[#090d16] text-white border-slate-800',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          card: 'bg-slate-900/80 border-slate-800 text-slate-200',
          accent: 'text-[#00b884]',
          bullet: 'text-emerald-400',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Photorealistic UI Mockup Renderer based on tutorial step
  const renderStepMockup = (type: TutorialSlideData['mockupType']) => {
    switch (type) {
      case 'welcome':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2.5 text-right font-mono text-[10px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-slate-400 text-[9px]">task.mohusyn.ir/login</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
              <TaskMasterHexagon size={24} />
              <div>
                <div className="font-black text-white text-[11px]">سامانه مدیریت زمان بَگ‌تایم</div>
                <div className="text-slate-400 text-[9px]">ورود با شماره موبایل یا ربات بله</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-bold">
                ✓ تم دارک و لایت
              </div>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-center font-bold">
                ✓ تقویم شمسی و میلادی
              </div>
            </div>
          </div>
        );

      case 'routine':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                <span>ثبت روتین تکرارشونده</span>
              </span>
              <span className="text-[9px] font-mono">Modal Preview</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-white font-bold text-[11px]">ورزش صبحگاهی و پیاده‌روی</div>
              <div className="flex items-center gap-1 text-[9px] text-indigo-300">
                <Repeat className="w-2.5 h-2.5" />
                <span>تکرار روزانه برای تمام این ماه (۳۰ روز متوالی)</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-center font-bold text-[10px]">
              ✓ ۳۰ تسک خودکار در تقویم درج شد بدون نیاز به تکرار دستی
            </div>
          </div>
        );

      case 'planner':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-amber-400 font-bold">دیلی‌پلنر ساعتی بگ‌تایم</span>
              <span className="text-[9px] text-slate-500 font-mono">ساعت ۱۰:۳۰</span>
            </div>
            <div className="space-y-1">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 line-through flex justify-between">
                <span>۰۹:۰۰ جلسه و بررسی تسک‌ها</span>
                <span className="text-emerald-400">تکمیل شد ✓</span>
              </div>
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 flex items-center justify-between">
                <div>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-black text-[8px] ml-1">هم‌اکنون</span>
                  <span className="text-white font-bold text-[11px]">توسعه پروژه و کار عمیق</span>
                </div>
                <span className="text-emerald-400 font-mono text-[9px]">۱۰:۰۰ - ۱۱:۳۰</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex justify-between">
                <span>۱۱:۳۰ هماهنگی با تیم و ارسال گزارش</span>
                <span className="text-slate-500">در انتظار</span>
              </div>
            </div>
          </div>
        );

      case 'focus':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-emerald-400 font-bold">اتاق تمرکز پومودورو</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px]">اتاق زنده فعال</span>
            </div>
            <div className="flex items-center justify-center py-1">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex flex-col items-center justify-center animate-pulse">
                <span className="text-white font-black font-mono text-base">۲۴:۱۸</span>
                <span className="text-[8px] text-emerald-400 font-bold">تمرکز عمیق</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                ورود سریع دوستان با اسکن QR کد
              </span>
              <span className="text-emerald-400 font-bold">۳ نفر آنلاین</span>
            </div>
          </div>
        );

      case 'habits':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-rose-400 font-bold">تیک قرمز عدم انجام تسک</span>
              <span className="text-rose-400 text-[9px]">علت‌یابی هوشمند</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">طراحی صفحات فرود وب‌سایت</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-black text-[9px]">تیک قرمز ❌</span>
              </div>
              <div className="text-rose-300 text-[9px]">دلیل: کمبود وقت و فورس شدن جلسه فوری</div>
            </div>
            <div className="text-slate-400 text-[9px] flex justify-between items-center">
              <span>ثبت شده در تحلیلگر عادت‌ها</span>
              <span className="text-amber-400 font-bold">نمودار بهره‌وری بروز شد ✓</span>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-500" />
                یادآورهای ۳۰ روزه روزانه
              </span>
              <span className="text-[9px] text-emerald-400">فعال</span>
            </div>
            <div className="space-y-1.5">
              <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">مصرف ویتامین و نوشیدن آب 💧</div>
                  <div className="text-[8px] text-slate-400">ساعت ۱۱:۰۰ • هرروز به مدت ۱ ماه</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">مرور کارهای امروز و روتین شبانه 📝</div>
                  <div className="text-[8px] text-slate-400">ساعت ۱۸:۰۰ • هشدار با صدای زنگ</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        );

      case 'extension':
        return (
          <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2 text-right text-[10px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-indigo-400 font-bold">افزونه نیوتَب مرورگر بَگ‌تایم</span>
              <span className="text-[9px] text-slate-500 font-mono">Chrome / Edge</span>
            </div>
            <div className="text-center py-1">
              <div className="text-2xl font-black text-white font-mono">۱۰:۴۵</div>
              <div className="text-[9px] text-indigo-300">امروز ۴ تسک باقی‌مانده دارید</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-300 text-[9px]">
              🔍 سرچ مستقیم گوگل + دسترسی به تسک‌ها با هر تب جدید
            </div>
          </div>
        );

      case 'cta':
      default:
        return (
          <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 p-3 space-y-2 text-center text-[10px]">
            <TaskMasterHexagon size={28} className="mx-auto" />
            <div className="font-black text-white text-xs">سامانه مدیریت زمان بَگ‌تایم</div>
            <div className="text-slate-300 text-[10px]">همین حالا رایگان شروع کن:</div>
            <div className="p-1.5 rounded-xl bg-emerald-600 text-white font-black text-[11px] shadow-sm">
              task.mohusyn.ir ⚡
            </div>
            <div className="text-[9px] text-slate-400 font-mono" dir="ltr">{customHandle}</div>
          </div>
        );
    }
  };

  // Render Single Slide Content (Unified for Feed 1:1 or Story 9:16)
  const renderSlideGraphic = (s: TutorialSlideData, isStory = false) => {
    return (
      <div
        className={`w-full h-full ${themeStyles.container} ${
          isStory ? 'p-6 flex flex-col justify-between' : 'p-6 sm:p-7 flex flex-col justify-between'
        } relative overflow-hidden select-none`}
        dir="rtl"
        style={{
          fontFamily: 'inherit',
          fontFeatureSettings: '"liga" 1, "calt" 1',
        }}
      >
        {/* Glow Decors */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-500/15 z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={26} />
            <span className="font-black text-xs sm:text-sm">بَگ‌تایم</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${themeStyles.badge}`}>
              {s.badge}
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {s.stepNumber} / {slides.length}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="my-auto space-y-2.5 z-10 text-right py-2 flex-1 flex flex-col justify-center">
          <h2 className={`font-black leading-snug ${isStory ? 'text-base' : 'text-sm sm:text-base text-white'}`}>
            {s.title}
          </h2>

          <p className="text-xs font-normal text-slate-400 leading-relaxed">
            {s.subtitle}
          </p>

          {/* Interactive UI Mockup */}
          <div className="my-1">
            {renderStepMockup(s.mockupType)}
          </div>

          {/* Bullet points */}
          <div className="space-y-1.5 text-xs">
            {s.bullets.map((b, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl ${themeStyles.card} flex items-start gap-2 text-right leading-relaxed`}
              >
                <span className={`font-black ${themeStyles.bullet}`}>•</span>
                <span className="flex-1 text-[11px] font-bold">{b}</span>
              </div>
            ))}
          </div>

          {s.highlightTip && (
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[11px] text-center">
              {s.highlightTip}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-500/15 flex items-center justify-between text-[10px] text-slate-400 z-10 flex-shrink-0">
          <span className="font-bold">آموزش رسمی کار با سامانه بَگ‌تایم</span>
          <span className="font-mono text-emerald-400" dir="ltr">{customHandle}</span>
        </div>
      </div>
    );
  };

  // Export current slide as PNG
  const handleExportSinglePNG = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    const is4K = quality === '4k';
    const isStory = format === 'story_highlight';
    setExportProgress(`در حال رندر تصویر با کیفیت ${is4K ? '4K' : '۱۰۸۰p'}...`);
    sounds.playPop();

    try {
      await new Promise((r) => setTimeout(r, 60));
      if (typeof document !== 'undefined' && (document as any).fonts) {
        try {
          await (document as any).fonts.ready;
        } catch {}
      }

      const baseWidth = isStory ? 360 : 380;
      const baseHeight = isStory ? 640 : 380;
      const targetWidth = is4K ? 2160 : 1080;
      const scaleFactor = targetWidth / baseWidth;

      const canvas = await html2canvas(previewRef.current, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#090d16',
        logging: false,
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
      });

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bagtime-tutorial-${format}-step-${currentSlideIndex + 1}-${quality.toUpperCase()}.png`;
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
    const isStory = format === 'story_highlight';
    sounds.playPop();

    const zip = new JSZip();

    try {
      const baseWidth = isStory ? 360 : 380;
      const baseHeight = isStory ? 640 : 380;
      const targetWidth = is4K ? 2160 : 1080;
      const scaleFactor = targetWidth / baseWidth;

      for (let i = 0; i < slides.length; i++) {
        setExportProgress(`در حال پردازش اسلاید ${i + 1} از ${slides.length} (${is4K ? 'کیفیت 4K' : '۱۰۸۰p'})...`);
        const targetEl = exportContainerRef.current.querySelector<HTMLElement>(`#tutorial-clean-${i}`);
        if (!targetEl) continue;

        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(targetEl, {
          scale: scaleFactor,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#090d16',
          logging: false,
          width: baseWidth,
          height: baseHeight,
          windowWidth: baseWidth,
          windowHeight: baseHeight,
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
      link.download = `bagtime-app-complete-tutorial-${format}-${quality.toUpperCase()}.zip`;
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
    return `📌 آموزش کامل و صفر تا صد کار با بَگ‌تایم (Bag Time) ⚡\n\nاگر کارهات همیشه نصفه می‌مونه، بین تسک‌ها سردرگمی یا نمیدونی چطور از روزت حداکثر بازدهی رو بگیری، این پست راهنمای قدم‌به‌قدم شماست.\n\nدر این آموزش یاد می‌گیرید:\n۱. نحوه ثبت سریع تسک‌ها و روتین‌های روزانه/هفتگی\n۲. دیلی‌پلنر ساعتی و تکنیک Time Blocking\n۳. اتاق‌های تمرکز ۲۵ دقیقه‌ای و ورود با کد QR\n۴. ثبت تیک قرمز و تحلیلگر هوشمند عادت‌ها\n۵. یادآورهای دوره‌ای با هشدار ۳۰ روزه\n۶. افزونه تب جدید مرورگر (New Tab)\n\n🌐 آدرس ورود رایگان به سامانه:\ntask.mohusyn.ir\nbagtime.negahm.ir\n\n💬 کلمه «بگ‌تایم» رو توی دایرکت بفرست تا لینک دسترسی آنی برات ارسال بشه!\n\n${customHandle} #بگ_تایم #مدیریت_زمان #بهره_وری #برنامه_ریزی #پلنر_ساعتی`;
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
            طراحی و خروجی پست اسلایدی و استوری‌های هایلایت آموزش نحوه استفاده از تمامی بخش‌های بَگ‌تایم همراه با موکاپ‌های زنده
          </p>
        </div>

        {/* Format Switcher: Carousel Post vs Story Highlight */}
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
            <span>پست اسلایدی فید (۱:۱)</span>
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

      {/* Main Workspace Layout: Canvas on Right/Center + Customizer on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Live Controls & Manual Editor */}
        <div className="lg:col-span-5 space-y-5">
          {/* Slide Navigation Strip */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>انتخاب مرحله آموزش:</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                مرحله {currentSlideIndex + 1} از {slides.length}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {slides.map((_s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlideIndex(idx);
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    currentSlideIndex === idx
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-105'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {toPersianDigits(idx + 1)}
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Quality Controls */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">تم رنگ‌بندی:</label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'dark', label: 'تاریک' },
                    { id: 'indigo', label: 'ایندیگو' },
                    { id: 'emerald', label: 'زمردی' },
                    { id: 'purple', label: 'بنفش' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        theme === t.id
                          ? 'bg-white text-slate-900 font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">کیفیت خروجی PNG:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setQuality('hd')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quality === 'hd'
                        ? 'bg-slate-200 text-slate-900 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    ۱۰۸۰p رتینا
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality('4k')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quality === '4k'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    4K اولترا
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Handle Input */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400">آیدی / پیج روی خروجی:</label>
              <input
                type="text"
                value={customHandle}
                onChange={(e) => {
                  setCustomHandle(e.target.value);
                  try {
                    localStorage.setItem('bagtime_instagram_handle', e.target.value);
                  } catch {}
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Manual Slide Content Editor */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>ویرایش محتوای اسلاید {currentSlideIndex + 1}:</span>
              </span>
              <button
                type="button"
                onClick={resetSlides}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>بازنشانی پیش‌فرض</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">نشانگر بالا (Badge):</label>
              <input
                type="text"
                value={activeSlide.badge}
                onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">عنوان اصلی اسلاید:</label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">زیرعنوان توضیحی:</label>
              <input
                type="text"
                value={activeSlide.subtitle}
                onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-normal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">نکات و گام‌های اجرایی (هر سطر یک نکته):</label>
              <textarea
                rows={3}
                value={activeSlide.bullets.join('\n')}
                onChange={(e) => updateActiveSlide({ bullets: e.target.value.split('\n') })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 leading-relaxed font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">کادر نکته طلایی پایین:</label>
              <input
                type="text"
                value={activeSlide.highlightTip || ''}
                onChange={(e) => updateActiveSlide({ highlightTip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Caption Generator Box */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>کپشن آماده انتشار در اینستاگرام:</span>
              </span>
              <button
                type="button"
                onClick={copyCaption}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? 'کپی شد!' : 'کپی کپشن'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {generateCaption()}
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Canvas Live Preview & Export Action Bar */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          {/* Top Actions: Prev / Next / Export Status */}
          <div className="w-full flex items-center justify-between bg-[#0d1322] border border-slate-800 p-3 rounded-2xl flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="اسلاید قبل"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-black text-white px-2">
                اسلاید {toPersianDigits(currentSlideIndex + 1)} از {toPersianDigits(slides.length)}
              </span>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
                }}
                disabled={currentSlideIndex === slides.length - 1}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="اسلاید بعد"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSinglePNG}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>دانلود همین اسلاید ({quality.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllZip}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود زیپ کل پکیج آموزش ({quality.toUpperCase()})</span>
              </button>
            </div>
          </div>

          {isExporting && (
            <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center animate-pulse">
              {exportProgress}
            </div>
          )}

          {/* Live Canvas Preview Frame */}
          <div className="w-full flex items-center justify-center p-4 bg-slate-950/60 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden min-h-[440px]">
            <div
              ref={previewRef}
              style={{
                width: format === 'story_highlight' ? '360px' : '380px',
                height: format === 'story_highlight' ? '640px' : '380px',
                aspectRatio: format === 'story_highlight' ? '9 / 16' : '1 / 1',
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
          width: format === 'story_highlight' ? '360px' : '380px',
          pointerEvents: 'none',
        }}
      >
        {slides.map((_s, idx) => (
          <div
            key={idx}
            id={`tutorial-clean-${idx}`}
            style={{
              width: format === 'story_highlight' ? '360px' : '380px',
              height: format === 'story_highlight' ? '640px' : '380px',
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
