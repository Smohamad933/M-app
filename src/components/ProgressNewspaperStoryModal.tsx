import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  X,
  Quote,
  Feather,
  Download,
  TrendingUp,
  Award,
  Check,
  Star,
} from 'lucide-react';

interface ProgressNewspaperStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyStory?: () => void;
}

interface CelebrityTwin {
  id: string;
  name: string;
  enName: string;
  field: string;
  era: string;
  headline: string;
  commentary: string;
  quote: string;
  powerWord: string;
}

// Steve Jobs Animated Character Illustration (Vector & Glow)
const SteveJobsCharacter: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Subtle pulsing ambient backlight */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-sky-500/25 via-indigo-500/20 to-amber-500/20 animate-pulse blur-md" />
    
    <svg
      viewBox="0 0 120 120"
      className="w-full h-full relative z-10 transition-transform duration-300 hover:scale-105 select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="jobsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="jobsSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd5b5" />
          <stop offset="100%" stopColor="#e8b993" />
        </linearGradient>
        <linearGradient id="jobsTurtleneckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="jobsGlassesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Modern Badge Background */}
      <rect width="120" height="120" rx="32" fill="url(#jobsBgGrad)" />

      {/* Shoulders & Iconic Black Turtleneck */}
      <path d="M 20 120 C 20 92 38 85 48 83 L 72 83 C 82 85 100 92 100 120 Z" fill="url(#jobsTurtleneckGrad)" />
      
      {/* Turtleneck Collar */}
      <rect x="46" y="73" width="28" height="15" rx="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />

      {/* Neck */}
      <rect x="52" y="64" width="16" height="14" fill="#e8b993" />

      {/* Ears */}
      <ellipse cx="36" cy="52" rx="4" ry="6" fill="#e8b993" />
      <ellipse cx="84" cy="52" rx="4" ry="6" fill="#e8b993" />

      {/* Head / Face */}
      <ellipse cx="60" cy="51" rx="23" ry="26" fill="url(#jobsSkinGrad)" />

      {/* Receding Hair & Graying sides */}
      <path d="M 37 45 C 36 29 46 19 60 19 C 74 19 84 29 83 45 C 81 36 74 27 60 27 C 46 27 39 36 37 45 Z" fill="#64748b" />
      <path d="M 36 45 C 34 52 34 60 37 66 C 38 64 38 52 40 48 Z" fill="#64748b" />
      <path d="M 84 45 C 86 52 86 60 83 66 C 82 64 82 52 80 48 Z" fill="#64748b" />

      {/* Neat Stubble Beard & Mustache */}
      <path d="M 43 55 C 43 72 50 78 60 78 C 70 78 77 72 77 55 C 73 59 69 61 60 61 C 51 61 47 59 43 55 Z" fill="#71717a" opacity="0.65" />
      <path d="M 52 64 Q 60 62 68 64 Q 60 66 52 64 Z" fill="#52525b" />
      <path d="M 55 69 Q 60 71 65 69" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />

      {/* Expressive Eyes */}
      <ellipse cx="50" cy="49" rx="2.2" ry="2.5" fill="#0f172a" />
      <ellipse cx="70" cy="49" rx="2.2" ry="2.5" fill="#0f172a" />
      {/* Eye catchlights */}
      <circle cx="50.8" cy="48.2" r="0.8" fill="#ffffff" />
      <circle cx="70.8" cy="48.2" r="0.8" fill="#ffffff" />

      {/* Eyebrows */}
      <path d="M 44 43 Q 50 41 55 43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M 65 43 Q 70 41 76 43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

      {/* Iconic Round Glasses */}
      <circle cx="50" cy="49" r="8.5" stroke="url(#jobsGlassesGrad)" strokeWidth="2" fill="none" />
      <circle cx="70" cy="49" r="8.5" stroke="url(#jobsGlassesGrad)" strokeWidth="2" fill="none" />
      <path d="M 58.5 48.5 Q 60 47 61.5 48.5" stroke="url(#jobsGlassesGrad)" strokeWidth="2" fill="none" />
      <path d="M 41.5 48.5 L 36 47" stroke="url(#jobsGlassesGrad)" strokeWidth="1.5" />
      <path d="M 78.5 48.5 L 84 47" stroke="url(#jobsGlassesGrad)" strokeWidth="1.5" />
      
      {/* Glasses lens subtle reflection */}
      <path d="M 46 45 L 52 43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <path d="M 66 45 L 72 43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />

      {/* Nose */}
      <path d="M 60 47 L 58.5 56 L 62 56" stroke="#c28859" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const CELEBRITY_DATABASE: CelebrityTwin = {
  id: 'jobs',
  name: 'استیو جابز',
  enName: 'Steve Jobs',
  field: 'نوآوری تکنولوژی و دیزاین محصول',
  era: 'بنیان‌گذار افسانه‌ای اپل',
  headline: 'وسواس نسبت به بهترین نتیجه و زیبایی در جزئیات!',
  commentary: 'تلاش امروزت ردپایی از وسواس استیو جابز را داشت؛ هیچ کاری را نیمه‌کاره رها نکردی و به کمتر از شاهکار رضایت ندادی.',
  quote: '«تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی.»',
  powerWord: 'کمال‌گرایی سازنده',
};

export const ProgressNewspaperStoryModal: React.FC<ProgressNewspaperStoryModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyStory,
}) => {
  const { tasks, currentUser, selectedDate, calendarType, streak } = useTask();
  const [isDownloading, setIsDownloading] = useState(false);
  const storyCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const todayISO = getTodayISO();
  const targetDate = selectedDate || todayISO;
  const targetTasks = tasks.filter((t) => t.date === targetDate);
  const completedTasks = targetTasks.filter((t) => t.completed);
  const totalCount = targetTasks.length;
  const completedCount = completedTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalFocusMins = completedTasks.reduce((acc, t) => acc + (t.focusMinutesSpent || t.durationMinutes || 0), 0);

  const activeTwin = CELEBRITY_DATABASE;

  // Dynamic Progress verdict
  const progressVerdict =
    percent === 100
      ? 'شاهکار کامل! تمامی تسک‌های روز با موفقیت انجام شدند 🏆'
      : percent >= 70
      ? 'پیشرفت چشمگیر و تمرکز استثنایی در طول روز ⚡'
      : percent >= 40
      ? 'پیشروی منظم و گام‌های استوار در مسیر اهداف 🎯'
      : percent > 0
      ? 'حرکت پیوسته و گام‌های مثبت رو به جلو 🌱'
      : 'برنامه‌ریزی دقیق؛ آماده برای یک خیزش پرقدرت 🚀';

  const handleCelebrate = () => {
    sounds.playComplete();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#eab308', '#00b884', '#6366f1', '#ec4899', '#f97316'],
      });
    } catch {}
  };

  const handleDownloadStory = async () => {
    if (!storyCardRef.current || isDownloading) return;
    setIsDownloading(true);
    sounds.playPop();

    try {
      if (typeof document !== 'undefined' && (document as any).fonts) {
        try {
          await (document as any).fonts.ready;
        } catch {}
      }

      const element = storyCardRef.current;

      // Primary High-Fidelity SVG ForeignObject Exporter:
      // Preserves 100% native browser Arabic/Persian cursive ligatures (zero detached letters!)
      // and exports at standard full-bleed 1080x1920 Instagram/Bale/Telegram Story dimensions!
      let dataUrl: string;
      try {
        dataUrl = await toPng(element, {
          canvasWidth: 1080,
          canvasHeight: 1920,
          backgroundColor: '#090d16',
          cacheBust: true,
          style: {
            letterSpacing: '0px',
            fontFamily: 'Vazirmatn, Sahel, Shabnam, system-ui, sans-serif',
          },
        });
      } catch (errToPng) {
        console.warn('First toPng attempt with font embedding encountered an issue, retrying with optimized config:', errToPng);
        dataUrl = await toPng(element, {
          canvasWidth: 1080,
          canvasHeight: 1920,
          backgroundColor: '#090d16',
          skipFonts: true,
          style: {
            letterSpacing: '0px',
          },
        });
      }

      const link = document.createElement('a');
      link.download = `bagtime-story-1080x1920-${targetDate}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sounds.playComplete();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6'],
        });
      } catch {}
    } catch (err) {
      console.error('Failed to export story:', err);
      alert('خطا در دانلود استوری. لطفاً دوباره امتحان کنید.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] my-auto flex flex-col items-center gap-2.5 select-none"
      >
        {/* Top Control Bar with Close and Modal Title */}
        <div className="w-full flex items-center justify-between px-1 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-zinc-300" style={{ letterSpacing: '0px' }}>
              پیش‌نمایش استوری استاندارد (۱۰۸۰ × ۱۹۲۰)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =========================================================================
            THE VISUAL STORY CARD (WYSIWYG: EXACT 9:16 PROPORTION, FULL BLEED 1080x1920)
            Zero letter spacing everywhere to guarantee 100% connected Persian calligraphy!
            ========================================================================= */}
        <div
          ref={storyCardRef}
          data-story-preview="true"
          dir="rtl"
          className="w-full aspect-[9/16] bg-[#090d16] text-white rounded-[28px] p-4 sm:p-5 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] border border-white/15 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(175deg, #070a11 0%, #0d1424 45%, #05080e 100%)',
            letterSpacing: '0px',
            fontFamily: 'Vazirmatn, Sahel, Shabnam, system-ui, sans-serif',
          }}
        >
          {/* Glowing Ambient Mesh Orbs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-[75px] pointer-events-none" />
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-[85px] pointer-events-none" />
          <div className="absolute -bottom-16 right-1/4 w-52 h-52 bg-amber-500/15 rounded-full blur-[75px] pointer-events-none" />

          {/* 1. TOP HEADER & INSTAGRAM STORY PROGRESS LINES */}
          <div className="space-y-2.5 relative z-10 w-full shrink-0">
            {/* Instagram Story 3-segment progress bars */}
            <div className="flex items-center gap-1.5 w-full">
              <div className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                <div className="h-full bg-emerald-400 w-full" />
              </div>
              <div className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                <div className="h-full bg-emerald-400 w-full" />
              </div>
              <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-indigo-400 w-3/4 animate-pulse" />
              </div>
            </div>

            {/* Brand Chip & Date */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span
                  className="font-mono text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full"
                  style={{ letterSpacing: '0.5px' }}
                >
                  BAGTIME • DAILY STORY
                </span>
              </div>
              <span className="text-[11px] text-zinc-300 font-medium" style={{ letterSpacing: '0px' }}>
                {formatAppDate(targetDate, calendarType, 'full')}
              </span>
            </div>
          </div>

          {/* 2. HERO STATUS & USER IDENTITY SECTION */}
          <div className="text-center space-y-2 py-1 relative z-10 shrink-0">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/40 text-[10.5px] font-black text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              style={{ letterSpacing: '0px' }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{progressVerdict}</span>
            </div>

            <h1
              className="text-base sm:text-lg font-black text-white leading-snug flex items-center justify-center gap-1.5 px-1"
              style={{ letterSpacing: '0px', wordSpacing: 'normal' }}
            >
              <span>کارنامه دستاوردهای {currentUser?.name || 'قهرمان امروز'}</span>
              <Award className="w-4 h-4 text-amber-400 fill-amber-400/30 shrink-0" />
            </h1>
            <p className="text-[11px] text-zinc-300 font-medium" style={{ letterSpacing: '0px' }}>
              «{activeTwin.headline}»
            </p>
          </div>

          {/* 3. THREE 3D GLASS PRODUCTIVITY STAT CARDS */}
          <div className="grid grid-cols-3 gap-2 relative z-10 shrink-0">
            {/* Completion Rate */}
            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-center space-y-1 shadow-inner relative overflow-hidden">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="text-sm font-black text-white font-mono" style={{ letterSpacing: '0px' }}>
                {toPersianDigits(percent)}٪
              </div>
              <div className="text-[8.5px] text-zinc-400 font-bold truncate" style={{ letterSpacing: '0px' }}>
                {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} تسک
              </div>
            </div>

            {/* Focus Minutes */}
            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-center space-y-1 shadow-inner relative overflow-hidden">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-900/40">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="text-sm font-black text-white font-mono" style={{ letterSpacing: '0px' }}>
                {toPersianDigits(totalFocusMins)}
              </div>
              <div className="text-[8.5px] text-zinc-400 font-bold" style={{ letterSpacing: '0px' }}>
                دقیقه تمرکز
              </div>
            </div>

            {/* Streak */}
            <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-center space-y-1 shadow-inner relative overflow-hidden">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-400 text-white flex items-center justify-center mx-auto shadow-md shadow-amber-900/40">
                <Flame className="w-3.5 h-3.5 fill-white stroke-[2]" />
              </div>
              <div className="text-sm font-black text-white font-mono" style={{ letterSpacing: '0px' }}>
                {toPersianDigits(streak.currentStreak)} روز
              </div>
              <div className="text-[8.5px] text-zinc-400 font-bold" style={{ letterSpacing: '0px' }}>
                استمرار متوالی
              </div>
            </div>
          </div>

          {/* 4. GLOWING PROGRESS TRACK */}
          <div className="space-y-1 px-0.5 relative z-10 shrink-0">
            <div className="flex items-center justify-between text-[9.5px] text-zinc-300 font-bold" style={{ letterSpacing: '0px' }}>
              <span>درصد تحقق اهداف امروز:</span>
              <span className="font-mono text-emerald-400 text-xs font-black">{toPersianDigits(percent)}٪</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                style={{ width: `${Math.max(percent, 4)}%` }}
              />
            </div>
          </div>

          {/* 5. STEVE JOBS VIP LUXURY GOLD FEATURE CARD */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/35 via-white/[0.04] to-indigo-950/20 border border-amber-500/35 space-y-2 relative overflow-hidden shadow-xl z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <SteveJobsCharacter size={52} />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] font-black text-black flex items-center justify-center">
                  ★
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black text-amber-400 flex items-center gap-1" style={{ letterSpacing: '0px' }}>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>همتای الهام‌بخش امروز شما:</span>
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5" style={{ letterSpacing: '0px' }}>
                  <span>{activeTwin.name}</span>
                  <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                    {activeTwin.powerWord}
                  </span>
                </h3>
                <p className="text-[9px] text-zinc-400 font-sans truncate" style={{ letterSpacing: '0px' }}>
                  <span dir="ltr">{activeTwin.enName}</span> • {activeTwin.era}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-zinc-200 leading-relaxed font-medium" style={{ letterSpacing: '0px' }}>
              {activeTwin.commentary}
            </p>

            <div className="p-1.5 px-2 rounded-xl bg-black/45 border border-amber-400/20 text-[9.5px] text-amber-200/95 italic flex items-center gap-2" style={{ letterSpacing: '0px' }}>
              <Quote className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{activeTwin.quote}</span>
            </div>
          </div>

          {/* 6. MOTIVATIONAL HIGHLIGHT / COMPLETED TASKS */}
          <div className="space-y-1 relative z-10 shrink-0">
            {completedTasks.length > 0 ? (
              <div className="space-y-1">
                <div className="text-[9.5px] font-bold text-zinc-300 flex items-center gap-1.5" style={{ letterSpacing: '0px' }}>
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>بخشی از تسک‌های فتح‌شده امروز:</span>
                </div>
                <div className="space-y-1 max-h-12 overflow-hidden">
                  {completedTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="p-1 px-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-[10px] text-zinc-200 flex items-center gap-1.5"
                      style={{ letterSpacing: '0px' }}
                    >
                      <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0 stroke-[3]" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="p-1.5 px-3 rounded-xl bg-indigo-950/40 border border-indigo-500/25 text-[9.5px] text-indigo-200 flex items-center justify-center gap-1.5"
                style={{ letterSpacing: '0px' }}
              >
                <Star className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>«هر روز فرصتی نو برای فتح قله‌های بزرگ‌تر است؛ استوار بمان!»</span>
              </div>
            )}
          </div>

          {/* 7. VERIFIED MINIMALIST FOOTER WATERMARK */}
          <div
            className="pt-1.5 flex items-center justify-between border-t border-white/10 text-[9px] text-zinc-400 relative z-10 shrink-0"
            style={{ letterSpacing: '0px' }}
          >
            <span className="font-medium">سامانه مدیریت زمان و اهداف بَگ‌تایم</span>
            <span className="font-mono text-emerald-400 font-bold" style={{ letterSpacing: '0.5px' }}>
              bagtime.negahm.ir
            </span>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM CONTROLS (OUTSIDE OF THE CAPTURED STORY CARD)
            ========================================================================= */}
        <div className="w-full flex flex-col gap-1.5 pt-0.5">
          <div className="w-full flex items-center gap-2">
            {/* Primary Download Button */}
            <button
              type="button"
              onClick={handleDownloadStory}
              disabled={isDownloading}
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span style={{ letterSpacing: '0px' }}>
                {isDownloading ? 'در حال تولید استوری HD...' : 'دانلود استوری (۱۰۸۰ × ۱۹۲۰) 📥'}
              </span>
            </button>

            {/* Celebrate Button */}
            <button
              type="button"
              onClick={handleCelebrate}
              className="py-2.5 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="جشن افتخار"
            >
              <Sparkles className="w-4 h-4" />
              <span>جشن 🎉</span>
            </button>

            {/* Daily Journal Button */}
            {onOpenDailyStory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDailyStory();
                }}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="ثبت در ژورنال روزانه"
              >
                <Feather className="w-4 h-4 text-amber-400" />
                <span>ژورنال 📖</span>
              </button>
            )}
          </div>

          <div className="text-center text-[9.5px] text-zinc-400 font-medium" style={{ letterSpacing: '0px' }}>
            کیفیت خروجی ۱۰۸۰ × ۱۹۲۰ استاندارد استوری شبکه‌های اجتماعی (اینستاگرام، بله و تلگرام)
          </div>
        </div>
      </div>
    </div>
  );
};
