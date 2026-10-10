import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas-pro';
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

// Steve Jobs Animated Character Illustration (No Apple Emojis!)
const SteveJobsCharacter: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Subtle pulsing ambient backlight */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-500/25 via-indigo-500/20 to-amber-500/20 animate-pulse blur-sm" />
    
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
      <rect width="120" height="120" rx="30" fill="url(#jobsBgGrad)" />

      {/* Shoulders & Iconic Black Turtleneck */}
      <path d="M 22 120 C 22 92 38 85 48 83 L 72 83 C 82 85 98 92 98 120 Z" fill="url(#jobsTurtleneckGrad)" />
      
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

// Einstein Animated Character Illustration
const EinsteinCharacter: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-purple-500/20 animate-pulse blur-sm" />
    <svg
      viewBox="0 0 120 120"
      className="w-full h-full relative z-10 transition-transform duration-300 hover:scale-105 select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="120" rx="30" fill="#1e1b4b" />
      <circle cx="60" cy="55" r="23" fill="#fcd5b5" />
      {/* Wild iconic white hair */}
      <path d="M 32 40 C 26 26 42 16 60 16 C 78 16 94 26 88 40 C 96 46 95 62 86 68 C 88 56 86 44 80 40 C 76 26 44 26 40 40 C 34 44 32 56 34 68 C 25 62 24 46 32 40 Z" fill="#e2e8f0" />
      {/* Clothes */}
      <path d="M 28 120 C 28 94 40 86 52 84 L 68 84 C 80 86 92 94 92 120 Z" fill="#334155" />
      {/* Mustache */}
      <path d="M 47 64 Q 60 59 73 64 Q 60 70 47 64 Z" fill="#f1f5f9" />
      {/* Eyes & Eyebrows */}
      <ellipse cx="50" cy="48" rx="2" ry="2.5" fill="#0f172a" />
      <ellipse cx="70" cy="48" rx="2" ry="2.5" fill="#0f172a" />
      <path d="M 45 42 Q 51 39 56 42" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <path d="M 64 42 Q 69 39 75 42" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

// Character Avatar Switcher
const AnimatedCelebrityAvatar: React.FC<{ twin: CelebrityTwin; size?: number; className?: string }> = ({
  twin,
  size = 64,
  className = '',
}) => {
  if (twin.id === 'jobs' || twin.enName.toLowerCase().includes('jobs')) {
    return <SteveJobsCharacter size={size} className={className} />;
  }
  if (twin.id === 'einstein' || twin.enName.toLowerCase().includes('einstein')) {
    return <EinsteinCharacter size={size} className={className} />;
  }
  // Default Steve Jobs for tech/productivity flagship representation
  return <SteveJobsCharacter size={size} className={className} />;
};

const CELEBRITY_DATABASE: Record<string, CelebrityTwin[]> = {
  programming: [
    {
      id: 'jobs',
      name: 'استیو جابز',
      enName: 'Steve Jobs',
      field: 'نوآوری تکنولوژی و دیزاین محصول',
      era: 'بنیان‌گذار افسانه‌ای اپل',
      headline: 'وسواس نسبت به بهترین نتیجه و زیبایی در جزئیات!',
      commentary: 'تلاش امروزت ردپایی از وسواس استیو جابز را داشت؛ هیچ کاری را نیمه‌کاره رها نکردی و به کمتر از شاهکار رضایت ندادی.',
      quote: '«تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی.»',
      powerWord: 'کمال‌گرایی سازنده',
    },
    {
      id: 'einstein',
      name: 'آلبرت اینشتین',
      enName: 'Albert Einstein',
      field: 'فیزیک نظری و کاوش کیهان',
      era: 'نوبل فیزیک ۱۹۲۱',
      headline: 'غرق در آزمایشگاه ذهنی و شکستن مرزهای ناشناخته!',
      commentary: 'تمرکز امروز تو یادآور اینشتین در دوران تدوین نظریه نسبیت بود؛ سکوت، تمرکز عمیق و دستاوردهایی فراتر از حد انتظار.',
      quote: '«من استعداد خاصی ندارم، فقط با کنجکاوی بسیار زیاد تسلیم نمی‌شوم.»',
      powerWord: 'تفکر عمیق',
    },
  ],
  general: [
    {
      id: 'jobs',
      name: 'استیو جابز',
      enName: 'Steve Jobs',
      field: 'نوآوری تکنولوژی و دیزاین محصول',
      era: 'بنیان‌گذار افسانه‌ای اپل',
      headline: 'وسواس نسبت به بهترین نتیجه و زیبایی در جزئیات!',
      commentary: 'تلاش امروزت ردپایی از وسواس استیو جابز را داشت؛ هیچ کاری را نیمه‌کاره رها نکردی و به کمتر از شاهکار رضایت ندادی.',
      quote: '«تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی.»',
      powerWord: 'کمال‌گرایی سازنده',
    },
  ],
};

export const ProgressNewspaperStoryModal: React.FC<ProgressNewspaperStoryModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyStory,
}) => {
  const { tasks, currentUser, selectedDate, calendarType, streak } = useTask();
  const [isDownloading, setIsDownloading] = useState(false);
  const storyExportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const todayISO = getTodayISO();
  const targetDate = selectedDate || todayISO;
  const targetTasks = tasks.filter((t) => t.date === targetDate);
  const completedTasks = targetTasks.filter((t) => t.completed);
  const totalCount = targetTasks.length;
  const completedCount = completedTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalFocusMins = completedTasks.reduce((acc, t) => acc + (t.focusMinutesSpent || t.durationMinutes || 0), 0);

  // Determine user domain & Twin (Steve Jobs is the primary inspiring avatar)
  const userJob = (currentUser?.jobTitle || '').toLowerCase();
  const userSkills = (currentUser?.skills || []).map((s) => s.toLowerCase()).join(' ');
  const combinedContext = `${userJob} ${userSkills}`;

  let categoryKey = 'general';
  if (
    combinedContext.includes('برنامه') ||
    combinedContext.includes('کد') ||
    combinedContext.includes('توسعه') ||
    combinedContext.includes('developer') ||
    combinedContext.includes('software') ||
    combinedContext.includes('design') ||
    combinedContext.includes('طراح') ||
    combinedContext.includes('مدیر')
  ) {
    categoryKey = 'programming';
  }

  const twinList = CELEBRITY_DATABASE[categoryKey] || CELEBRITY_DATABASE['general'];
  // Active twin is Steve Jobs (clean, consistent and matches user request)
  const activeTwin = twinList[0];

  // Dynamic Progress message
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
    if (!storyExportRef.current || isDownloading) return;
    setIsDownloading(true);
    sounds.playPop();

    try {
      if (typeof document !== 'undefined' && (document as any).fonts) {
        try {
          await (document as any).fonts.ready;
        } catch {}
      }

      const baseWidth = 360;
      const baseHeight = 640;
      const targetWidth = 1080;
      const scaleFactor = targetWidth / baseWidth; // 3.0 for sharp 1080x1920

      const canvas = await html2canvas(storyExportRef.current, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-story-export="true"]') as HTMLElement;
          if (el) {
            el.style.position = 'static';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.transform = 'none';
          }
        },
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `bagtime-story-${currentUser?.username || 'progress'}-${targetDate}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sounds.playComplete();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {}
    } catch (err) {
      console.error('Failed to export story:', err);
      alert('خطا در تولید تصویر استوری. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      {/* Main Minimal Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] bg-gradient-to-b from-stone-900 via-[#18181b] to-black text-white rounded-[36px] p-5 sm:p-6 shadow-2xl border border-white/10 space-y-4 relative animate-in zoom-in-95 my-auto overflow-hidden select-none"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Minimal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              بَگ‌تایم • استوری پیشرفت
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              {formatAppDate(targetDate, calendarType, 'full')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Headline & Progress Status Pill */}
        <div className="text-center space-y-2 pt-1 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{progressVerdict}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            کارنامه پیشرفت {currentUser?.name || 'شما'}
          </h2>
          <p className="text-xs text-zinc-400">
            «{activeTwin.headline}»
          </p>
        </div>

        {/* Minimal Progress Dashboard Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Completion Rate */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-white font-mono">
              {toPersianDigits(percent)}٪
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">
              {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} تسک
            </div>
          </div>

          {/* Focus Time */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-sm font-black text-white font-mono">
              {toPersianDigits(totalFocusMins)}
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">دقیقه تمرکز</div>
          </div>

          {/* Streak */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Flame className="w-4 h-4 fill-amber-400/60" />
            </div>
            <div className="text-sm font-black text-white font-mono">
              {toPersianDigits(streak.currentStreak)} روز
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">استمرار متوالی</div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5 px-0.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>درصد تحقق اهداف امروز:</span>
            <span className="font-mono font-bold text-emerald-400">{toPersianDigits(percent)}٪</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(percent, 4)}%` }}
            />
          </div>
        </div>

        {/* Celebrity Twin Feature Card with Animated Steve Jobs Character (NO APPLE EMOJI!) */}
        <div className="p-4 rounded-3xl bg-white/[0.05] border border-white/10 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            {/* Animated Character Avatar */}
            <AnimatedCelebrityAvatar twin={activeTwin} size={58} />

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-amber-400/90 tracking-wide">
                همتای افتخار امروز شما:
              </div>
              <h3 className="text-base font-black text-white">
                {activeTwin.name}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                {activeTwin.enName} • {activeTwin.era}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            {activeTwin.commentary}
          </p>

          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-amber-200/90 italic flex items-center gap-2">
            <Quote className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{activeTwin.quote}</span>
          </div>
        </div>

        {/* Completed Tasks Highlight (if any) */}
        {completedTasks.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>بخشی از تسک‌های فتح‌شده امروز:</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1 no-scrollbar">
              {completedTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-zinc-200 flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minimal Footer Watermark */}
        <div className="text-center pt-1 text-[10px] text-zinc-500 font-mono">
          bagtime.negahm.ir
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          {/* Primary Download Story Button */}
          <button
            type="button"
            onClick={handleDownloadStory}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'در حال آماده‌سازی...' : 'دانلود استوری 📥'}</span>
          </button>

          <button
            type="button"
            onClick={handleCelebrate}
            className="py-2.5 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="جشن افتخار"
          >
            <Sparkles className="w-4 h-4" />
            <span>جشن 🎉</span>
          </button>

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
              <span>داستان روز 📖</span>
            </button>
          )}
        </div>
      </div>

      {/* OFF-SCREEN 9:16 INSTAGRAM STORY EXPORT CONTAINER (1080x1920 HD Ready) */}
      <div
        ref={storyExportRef}
        data-story-export="true"
        dir="rtl"
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 360,
          height: 640,
          pointerEvents: 'none',
          opacity: 1,
          visibility: 'visible',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        className="bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#090d16] text-white p-6 flex flex-col justify-between overflow-hidden relative select-none"
      >
        {/* Ambient Glows for Story */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Story Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-black uppercase tracking-widest text-emerald-300">
              BAGTIME • DAILY STORY
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            {formatAppDate(targetDate, calendarType, 'full')}
          </span>
        </div>

        {/* Main Content Body */}
        <div className="space-y-4 my-auto relative z-10">
          {/* Progress Verdict Badge */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-black text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{progressVerdict}</span>
            </div>

            <h1 className="text-xl font-black text-white">
              کارنامه پیشرفت {currentUser?.name || 'قهرمان امروز'}
            </h1>
            <p className="text-[11px] text-zinc-400">
              «{activeTwin.headline}»
            </p>
          </div>

          {/* Steve Jobs Animated Character Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/15 space-y-2.5 shadow-xl">
            <div className="flex items-center gap-3">
              <SteveJobsCharacter size={56} />
              <div>
                <div className="text-[9px] font-black text-amber-400 uppercase">
                  همتای افتخار امروز:
                </div>
                <div className="text-sm font-black text-white">
                  {activeTwin.name}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {activeTwin.enName} • {activeTwin.era}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
              {activeTwin.commentary}
            </p>

            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-[10px] text-amber-200 italic flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{activeTwin.quote}</span>
            </div>
          </div>

          {/* Productivity Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-center space-y-0.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {toPersianDigits(percent)}٪
              </div>
              <div className="text-[9px] text-zinc-400">
                {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} تسک
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-center space-y-0.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {toPersianDigits(totalFocusMins)}
              </div>
              <div className="text-[9px] text-zinc-400">دقیقه تمرکز</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-center space-y-0.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Flame className="w-3.5 h-3.5 fill-amber-400/60" />
              </div>
              <div className="text-base font-black text-white font-mono">
                {toPersianDigits(streak.currentStreak)} روز
              </div>
              <div className="text-[9px] text-zinc-400">استمرار متوالی</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full"
              style={{ width: `${Math.max(percent, 5)}%` }}
            />
          </div>

          {/* Completed Tasks Showcase */}
          {completedTasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>دستاوردها و تسک‌های فتح‌شده:</span>
              </div>
              {completedTasks.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="p-1.5 px-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-zinc-200 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Footer Brand */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500 relative z-10">
          <div className="font-bold text-zinc-400">
            طراحی شده با سامانه مدیریت زمان بَگ‌تایم
          </div>
          <div className="font-mono text-emerald-400 font-bold">
            bagtime.negahm.ir
          </div>
        </div>
      </div>
    </div>
  );
};
