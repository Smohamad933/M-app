import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import {
  ArrowRight,
  Download,
  FolderArchive,
  Copy,
  CheckCircle2,
  Sparkles,
  Type,
  Layers,
  Palette,
  Clock,
  FileText,
  Smartphone,
  Flame,
  BatteryLow,
  ChevronLeft,
  ChevronRight,
  Upload,
  Share2,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { FontSelectorModal } from './FontSelectorModal';

type SlideTheme = 'light' | 'dark' | 'indigo' | 'emerald';
type AspectRatio = 'portrait' | 'square'; // portrait: 1080x1350 (4:5), square: 1080x1080 (1:1)

interface InstagramSlidesStudioProps {
  onBack?: () => void;
}

export const InstagramSlidesStudio: React.FC<InstagramSlidesStudioProps> = ({ onBack }) => {
  const {
    allAvailableFonts,
    systemFont,
    globalSettings,
    customFonts,
  } = useTask();

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('light');
  const [selectedFont, setSelectedFont] = useState<string>(systemFont || 'vazirmatn');
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);

  // Hidden container reference to render all slides for batch export
  const slideRef = useRef<HTMLDivElement>(null);
  const batchContainerRef = useRef<HTMLDivElement>(null);

  // Footer text
  const footerPrefix = globalSettings?.footerBranding?.prefixText || 'بَگ‌تایم، از خانوادهٔ';
  const footerCompany = globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه';

  const captionText = `چند بار شده اول صبح با کلی انرژی شروع کنی، ولی آخر شب ببینی مهم‌ترین کارهات دست‌نخورده باقی مونده؟ ⏳

مشکل از اراده تو نیست؛ مشکل از نداشتن یک سیستم درست برای مدیریت زمان و تمرکزه!

سامانه «بَگ‌تایم» فراتر از یک لیست کارهای ساده است:
🔹 تایم‌لاین ساعتی (Time Blocking) تا بدونی دقیقاً الان نوبت چیه
🔹 تحلیلگر موانع و عادت‌ها برای ریشه‌یابی تعویق کارها
🔹 افزونه نیوتَب مرورگر برای دسترسی فوری بدون باز کردن پنجره اضافه
🔹 اتاق‌های تمرکز گروهی برای پومودورو و کار عمیق تیمی
🔹 ثبت‌نام و ورود فوق‌العاده سریع با ربات بله

📱 اگر می‌خوای کنترل روزهات رو دستت بگیری:
کلمه «بگ تایم» رو برامون دایرکت کن یا روی لینک بایو کلیک کن ✌️

#برنامه_ریزی #مدیریت_زمان #بهره_وری #تمرکز #پومودورو #بگ_تایم #تسک_روزانه #کیان_فناوران_نگاه`;

  const handleCopyCaption = () => {
    sounds.playPop();
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Export current slide as PNG
  const handleExportSingleSlide = async () => {
    if (!slideRef.current || isExporting) return;
    setIsExporting(true);
    setExportProgress('در حال پردازش گرافیک با رزولوشن بالا...');
    sounds.playPop();

    try {
      const canvas = await html2canvas(slideRef.current, {
        scale: 2.5, // 2.5x crisp resolution for Retina / Instagram
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bagtime-slide-${activeSlideIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      sounds.playComplete();
    } catch (err) {
      console.error('Export error:', err);
      alert('خطا در خروجی تصویر. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Export all 5 slides in one ZIP
  const handleExportAllSlidesZip = async () => {
    if (isExporting) return;
    setIsExporting(true);
    sounds.playPop();

    const zip = new JSZip();
    const slidesElements = batchContainerRef.current?.querySelectorAll<HTMLElement>('.batch-slide-item');

    if (!slidesElements || slidesElements.length === 0) {
      setIsExporting(false);
      return;
    }

    try {
      for (let i = 0; i < slidesElements.length; i++) {
        setExportProgress(`در حال پردازش اسلاید ${i + 1} از ۵...`);
        const el = slidesElements[i];
        const canvas = await html2canvas(el, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          zip.file(`slide-${i + 1}.png`, blob);
        }
      }

      setExportProgress('در حال ایجاد فایل فشرده ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bagtime-instagram-carousel.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (err) {
      console.error('Batch export error:', err);
      alert('خطا در خروجی دسته‌ای. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Theme styling helpers
  const getThemeClasses = (theme: SlideTheme) => {
    switch (theme) {
      case 'dark':
        return {
          container: 'bg-[#0f172a] text-slate-100 border border-slate-800',
          card: 'bg-slate-900/80 border-slate-800 text-slate-200',
          accentText: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          subtext: 'text-slate-400',
          cardHighlight: 'bg-slate-800/90 border-slate-700',
        };
      case 'indigo':
        return {
          container: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-800/50',
          card: 'bg-indigo-900/40 border-indigo-700/50 text-indigo-100',
          accentText: 'text-amber-300',
          badge: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
          subtext: 'text-indigo-200',
          cardHighlight: 'bg-indigo-800/60 border-indigo-600',
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] text-white border border-emerald-800/50',
          card: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-100',
          accentText: 'text-emerald-300',
          badge: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
          subtext: 'text-emerald-200/80',
          cardHighlight: 'bg-emerald-800/50 border-emerald-600',
        };
      case 'light':
      default:
        return {
          container: 'bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#edf2f7] text-slate-900 border border-slate-200/90',
          card: 'bg-white/90 border-slate-200/90 text-slate-800 shadow-sm',
          accentText: 'text-[#00b884]',
          badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          subtext: 'text-slate-600',
          cardHighlight: 'bg-emerald-50/70 border-emerald-300/80',
        };
    }
  };

  const themeStyles = getThemeClasses(slideTheme);

  // Render individual slide component
  const renderSlideContent = (index: number, _isBatch: boolean = false) => {
    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-7 sm:p-10 select-none relative overflow-hidden ${themeStyles.container}`}
        style={{ fontFamily: selectedFont || 'inherit' }}
        dir="rtl"
      >
        {/* Subtle Decorative Background Circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <TaskMasterHexagon size={32} />
            <span className="font-black text-sm tracking-tight flex items-center gap-1">
              <span>بَگ‌تایم</span>
              <span className={themeStyles.accentText}>.</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20">
              اسلاید {index + 1} از ۵
            </span>
          </div>
        </div>

        {/* Slide 1: کاور و قلاب (Hook) */}
        {index === 0 && (
          <div className="my-auto space-y-6 z-10 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <span>⚠️ یک مشکل همگانی</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
              چرا روزت تموم میشه ولی نصف کارهات می‌مونه؟
            </h1>

            <p className={`text-sm sm:text-base font-bold leading-relaxed ${themeStyles.subtext}`}>
              با شلوغی ذهن، فرار از کارها و سردرگمی بین تسک‌ها خداحافظی کن! 🧠❌
            </p>

            {/* Visual Hook Card */}
            <div className={`p-4 rounded-3xl border ${themeStyles.card} space-y-3`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-rose-500 line-through">❌ لیست کارهای بی‌پایان و خسته‌کننده</span>
                <span className="text-xs">سردرگمی</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/50 overflow-hidden">
                <div className="w-1/3 h-full bg-rose-500 rounded-full" />
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className={themeStyles.accentText}>✅ سیستم هوشمند Time Blocking بَگ‌تایم</span>
                <span className="text-xs">آرامش و تمرکز</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-black text-indigo-500 flex items-center gap-1">
                <span>ورق بزنید</span>
                <ChevronLeft className="w-4 h-4 animate-bounce-x" />
              </span>
              <span className="text-[11px] text-slate-400 font-bold">دستیار شخصی و سازمانی</span>
            </div>
          </div>
        )}

        {/* Slide 2: معرفی بَگ‌تایم و دیلی پلنر ساعتی */}
        {index === 1 && (
          <div className="my-auto space-y-5 z-10 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>تکنیک اصولی Time Blocking</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              بَگ‌تایم؛ دستیار هوشمند روزهای پرمشغله 🎯
            </h2>

            {/* Timeline Visual Cards */}
            <div className="space-y-2.5">
              <div className={`p-3 rounded-2xl border ${themeStyles.cardHighlight} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-xl">
                    ۰۹:۰۰ - ۱۰:۳۰
                  </span>
                  <span className="text-xs font-black">تمرکز عمیق روی کار اصلی 🔥</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">الان</span>
              </div>

              <div className={`p-3 rounded-2xl border ${themeStyles.card} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl">
                    ۱۰:۳۰ - ۱۱:۰۰
                  </span>
                  <span className="text-xs font-bold text-slate-700">استراحت و صرف قهوه ☕</span>
                </div>
                <span className="text-[10px] text-slate-400">۳۰ دقیقه</span>
              </div>

              <div className={`p-3 rounded-2xl border ${themeStyles.card} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl">
                    ۱۱:۰۰ - ۱۲:۳۰
                  </span>
                  <span className="text-xs font-bold text-slate-700">جلسه آنلاین و هماهنگی پروژه 💼</span>
                </div>
                <span className="text-[10px] text-slate-400">تیم</span>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border ${themeStyles.card} text-xs font-bold leading-relaxed ${themeStyles.subtext}`}>
              💡 با نشانگر زنده «زمان فعلی»، در هر ساعت از روز دقیقاً می‌دانی نوبت انجام کدام کار است!
            </div>
          </div>
        )}

        {/* Slide 3: تحلیلگر موانع و عادت‌ها */}
        {index === 2 && (
          <div className="my-auto space-y-4 z-10 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تحلیلگر هوشمند عادت‌ها (AI Habits)</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              کاری عقب افتاد؟ دلیلش رو کشف کن! 🧠
            </h2>

            <p className={`text-xs font-bold leading-relaxed ${themeStyles.subtext}`}>
              اگر کاری انجام نشد، بَگ‌تایم ریشه اصلی تعویق را شناسایی و دسته‌بندی می‌کند:
            </p>

            {/* 4 Reasons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-2xl border ${themeStyles.card} space-y-1`}>
                <div className="flex items-center gap-2 text-rose-500 font-black text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>فضای مجازی</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">حواس‌پرتی با نوتیفیکیشن‌ها و شبکه‌های اجتماعی</p>
              </div>

              <div className={`p-3 rounded-2xl border ${themeStyles.card} space-y-1`}>
                <div className="flex items-center gap-2 text-amber-500 font-black text-xs">
                  <BatteryLow className="w-4 h-4" />
                  <span>افت انرژی</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">خستگی مفرط، کمبود خواب یا افت انگیزه</p>
              </div>

              <div className={`p-3 rounded-2xl border ${themeStyles.card} space-y-1`}>
                <div className="flex items-center gap-2 text-indigo-500 font-black text-xs">
                  <Clock className="w-4 h-4" />
                  <span>خطای تخمین</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">کمبود زمان یا جلسات پیش‌بینی‌نشده</p>
              </div>

              <div className={`p-3 rounded-2xl border ${themeStyles.card} space-y-1`}>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs">
                  <Flame className="w-4 h-4" />
                  <span>اهمال‌کاری</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">مقاومت ذهنی برای شروع تسک‌های سخت</p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border ${themeStyles.cardHighlight} text-[11px] font-bold text-indigo-800 leading-relaxed`}>
              ✨ سیستم با این دلایل، راهکارهای علمی برای اصلاح الگوهای رفتاری ارائه می‌دهد.
            </div>
          </div>
        )}

        {/* Slide 4: افزونه نیوتَب و اتاق‌های تمرکز زنده */}
        {index === 3 && (
          <div className="my-auto space-y-4 z-10 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <Share2 className="w-3.5 h-3.5" />
              <span>دسترسی همه‌جانبه و کار تیمی</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              همه‌جا همراهته؛ حتی تو تب جدید مرورگرت! 🌐
            </h2>

            <div className="space-y-3">
              {/* Extension Feature */}
              <div className={`p-3.5 rounded-2xl border ${themeStyles.card} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-indigo-600 flex items-center gap-1.5">
                    <span>⚡ افزونه اختصاصی New Tab با ورود یکپارچه (SSO)</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">کروم و اج</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  با باز کردن هر تب جدید، تسک‌های امروز، تقویم شمسی و موتورهای جستجو جلوته؛ بدون نیاز به وارد کردن مجدد رمز عبور!
                </p>
              </div>

              {/* Focus Rooms Feature */}
              <div className={`p-3.5 rounded-2xl border ${themeStyles.card} space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-600 flex items-center gap-1.5">
                    <span>🎧 اتاق‌های تمرکز زنده (Group Pomodoro)</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">کار تیمی</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  حضور همزمان با همکاران و دوستان در اتاق مجازی، تایمر هماهنگ پومودورو، چت زنده و پخش موزیک‌های آرامش‌بخش تمرکز.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide 5: جمع‌بندی و فراخوان (CTA) */}
        {index === 4 && (
          <div className="my-auto space-y-5 z-10 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>شروع فوری و آسان</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              وقتشه به روزهات نظم بدی... 🚀
            </h2>

            {/* Checklist */}
            <div className="space-y-2 text-xs font-bold">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span>
                <span>تحت وب و PWA سبک (بدون نیاز به نصب نرم‌افزار سنگین)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span>
                <span>ورود فوق‌سریع با یک کلیک از طریق ربات بله</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span>
                <span>افزونه نیوتَب و مدیریت کارهای امروز</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span>
                <span>کاملاً رایگان برای شروع</span>
              </div>
            </div>

            {/* Big CTA Banner */}
            <div className="p-4 rounded-3xl bg-[#0f172a] text-white text-center space-y-2 shadow-lg">
              <div className="text-xs font-bold text-emerald-400">📩 دریافت فوری لینک ورود:</div>
              <div className="text-sm sm:text-base font-black">
                کلمه <span className="text-amber-300">«بگ‌تایم»</span> رو دایرکت کن تا لینک مستقیم ورود برات ارسال بشه! ✌️
              </div>
            </div>
          </div>
        )}

        {/* Slide Footer */}
        {showFooterBranding && (
          <div className="pt-3 border-t border-slate-500/10 flex items-center justify-between text-[10px] text-slate-400 z-10">
            <span>
              {footerPrefix} <strong>{footerCompany}</strong>
            </span>
            <span>bagtime.app</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <header className="px-4 sm:px-6 py-3.5 bg-[#111827]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به برنامه اصلی</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm font-black leading-tight">استودیو اسلایدهای گرافیکی اینستاگرام</h1>
              <p className="text-[10px] text-slate-400">طراحی و خروجی پست ۵ اسلایدی بَگ‌تایم با فونت دلخواه</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportSingleSlide}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>دانلود اسلاید فعلی (PNG)</span>
          </button>

          <button
            onClick={handleExportAllSlidesZip}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <FolderArchive className="w-4 h-4" />
            <span>دانلود همه ۵ اسلاید (ZIP)</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Canvas Preview */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          {/* Progress Toast */}
          {isExporting && (
            <div className="w-full p-3 rounded-2xl bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs font-bold text-center animate-pulse">
              ⏳ {exportProgress}
            </div>
          )}

          {/* Aspect Ratio Container */}
          <div className="w-full flex justify-center items-center py-2">
            <div
              ref={slideRef}
              className={`rounded-[32px] shadow-2xl transition-all duration-300 overflow-hidden ${
                aspectRatio === 'portrait'
                  ? 'w-[360px] sm:w-[420px] h-[450px] sm:h-[525px]' // 4:5 ratio
                  : 'w-[360px] sm:w-[420px] h-[360px] sm:h-[420px]' // 1:1 ratio
              }`}
            >
              {renderSlideContent(activeSlideIndex)}
            </div>
          </div>

          {/* Slide Navigation Pagination */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playPop();
                  setActiveSlideIndex(idx);
                }}
                className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSlideIndex === idx
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setActiveSlideIndex(Math.min(4, activeSlideIndex + 1))}
              disabled={activeSlideIndex === 4}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails Carousel */}
          <div className="grid grid-cols-5 gap-2 w-full max-w-xl pt-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playPop();
                  setActiveSlideIndex(idx);
                }}
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                  activeSlideIndex === idx
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-black text-slate-300">اسلاید {idx + 1}</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  {idx === 0 && 'کاور و قلاب'}
                  {idx === 1 && 'دیلی پلنر'}
                  {idx === 2 && 'تحلیل عادت‌ها'}
                  {idx === 3 && 'افزونه نیوتَب'}
                  {idx === 4 && 'فراخوان CTA'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Customization Controls & Caption */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Custom Font Picker */}
          <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-400" />
                <span>فونت اسلایدها</span>
              </span>

              <button
                type="button"
                onClick={() => setIsFontModalOpen(true)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>آپلود فونت جدید</span>
              </button>
            </div>

            <select
              value={selectedFont}
              onChange={(e) => {
                sounds.playPop();
                setSelectedFont(e.target.value);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
            >
              <optgroup label="فونت‌های استاندارد سیستم">
                {allAvailableFonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </optgroup>

              {customFonts && customFonts.length > 0 && (
                <optgroup label="فونت‌های اختصاصی آپلودشده شما">
                  {customFonts.map((cf) => (
                    <option key={cf.id} value={cf.id}>
                      ⭐ {cf.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 2. Format & Dimensions */}
          <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>ابعاد و نسبت تصویر</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('portrait')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                  aspectRatio === 'portrait'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>عمودی اینستاگرام (۴:۵)</span>
                <span className="text-[10px] opacity-70">1080 × 1350 پیکسل</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('square')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                  aspectRatio === 'square'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>مربعی کلاسیک (۱:۱)</span>
                <span className="text-[10px] opacity-70">1080 × 1080 پیکسل</span>
              </button>
            </div>
          </div>

          {/* 3. Theme & Palette */}
          <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>تم و ترکیب رنگی اسلایدها</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSlideTheme('light')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  slideTheme === 'light'
                    ? 'bg-white text-slate-900 border-white font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ☀️ لایت بَگ‌تایم
              </button>

              <button
                type="button"
                onClick={() => setSlideTheme('dark')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  slideTheme === 'dark'
                    ? 'bg-slate-800 text-white border-emerald-500 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🌙 آبزیدین دارک
              </button>

              <button
                type="button"
                onClick={() => setSlideTheme('indigo')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  slideTheme === 'indigo'
                    ? 'bg-indigo-900 text-white border-indigo-400 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🔮 نیلی متالیک
              </button>

              <button
                type="button"
                onClick={() => setSlideTheme('emerald')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  slideTheme === 'emerald'
                    ? 'bg-emerald-950 text-white border-emerald-400 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🍃 سبز زمردی
              </button>
            </div>
          </div>

          {/* 4. Footer Branding Toggle */}
          <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">پاورقی برند</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {footerPrefix} {footerCompany}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFooterBranding}
                onChange={(e) => setShowFooterBranding(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-bold text-slate-300">نمایش</span>
            </label>
          </div>

          {/* 5. Ready-to-use Caption for Instagram Post */}
          <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>متن کپشن آماده اینستاگرام</span>
              </span>

              <button
                onClick={handleCopyCaption}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCaption ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'کپی شد' : 'کپی کپشن'}</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 max-h-40 overflow-y-auto leading-relaxed select-all">
              <pre className="whitespace-pre-wrap font-sans">{captionText}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Batch Container for Rendering all 5 slides simultaneously during ZIP export */}
      <div
        ref={batchContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`batch-slide-item ${
              aspectRatio === 'portrait' ? 'w-[1080px] h-[1350px]' : 'w-[1080px] h-[1080px]'
            }`}
          >
            {renderSlideContent(idx, true)}
          </div>
        ))}
      </div>

      {/* Font Upload Modal Integration */}
      <FontSelectorModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
    </div>
  );
};
