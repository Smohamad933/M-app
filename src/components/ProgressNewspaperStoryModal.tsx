import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  X,
  Star,
  Quote,
  Feather,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface ProgressNewspaperStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDailyStory?: () => void;
}

interface CelebrityTwin {
  name: string;
  enName: string;
  field: string;
  era: string;
  avatarEmoji: string;
  avatarBg: string;
  headline: string;
  commentary: string;
  quote: string;
  powerWord: string;
}

const CELEBRITY_DATABASE: Record<string, CelebrityTwin[]> = {
  programming: [
    {
      name: 'لینوس توروالدز',
      enName: 'Linus Torvalds',
      field: 'مهندسی نرم‌افزار و معماری سیستم',
      era: 'خالق لینوکس و گیت',
      avatarEmoji: '🐧',
      avatarBg: 'from-amber-600 to-yellow-500',
      headline: 'تعهد دیوانه‌وار به نظم کدها و ساختار بی‌نقص!',
      commentary: 'امروز مثل لینوس توروالدز در اتاق کارش، تمام حواشی را حذف کردی و تک‌تک وظایف را با نظم مهندسی جلو بردی.',
      quote: '«حرف زدن مفت است، کد را نشانم بده!»',
      powerWord: 'پشتکار مهندسی',
    },
    {
      name: 'استیو جابز',
      enName: 'Steve Jobs',
      field: 'نوآوری تکنولوژی و دیزاین محصول',
      era: 'بنیان‌گذار افسانه‌ای اپل',
      avatarEmoji: '🍏',
      avatarBg: 'from-slate-800 to-indigo-900',
      headline: 'وسواس نسبت به بهترین نتیجه و زیبایی در جزئیات!',
      commentary: 'تلاش امروزت ردپایی از وسواس استیو جابز را داشت؛ هیچ کاری را نیمه‌کاره رها نکردی و به کمتر از شاهکار رضایت ندادی.',
      quote: '«تنها راه انجام کار بزرگ، عشق به کاری است که انجام می‌دهی.»',
      powerWord: 'کمال‌گرایی سازنده',
    },
    {
      name: 'آدا لاولیس',
      enName: 'Ada Lovelace',
      field: 'ریاضیات و پایه‌گذاری علوم کامپیوتر',
      era: 'نخستین برنامه‌نویس تاریخ',
      avatarEmoji: '✨',
      avatarBg: 'from-purple-600 to-indigo-600',
      headline: 'دیدن آینده پیش از آنکه دیگران باورش کنند!',
      commentary: 'امروز با همان ذهن تحلیلی و شجاعانه آدا لاولیس گام برداشتی؛ حل گره‌های پیچیده در چند حرکت حساب‌شده.',
      quote: '«تخیل، هنر درک و کشف ارتباطات ناپیداست.»',
      powerWord: 'شهود تحلیلی',
    },
  ],
  science: [
    {
      name: 'آلبرت اینشتین',
      enName: 'Albert Einstein',
      field: 'فیزیک نظری و کاوش کیهان',
      era: 'نوبل فیزیک ۱۹۲۱',
      avatarEmoji: '🧠',
      avatarBg: 'from-blue-600 to-cyan-500',
      headline: 'غرق در آزمایشگاه ذهنی و شکستن مرزهای ناشناخته!',
      commentary: 'تمرکز امروز تو یادآور اینشتین در دوران تدوین نظریه نسبیت بود؛ سکوت، تمرکز عمیق و دستاوردهایی فراتر از حد انتظار.',
      quote: '«من استعداد خاصی ندارم، فقط با کنجکاوی بسیار زیاد تسلیم نمی‌شوم.»',
      powerWord: 'تفکر عمیق',
    },
    {
      name: 'ماری کوری',
      enName: 'Marie Curie',
      field: 'شیمی و رادیواکتیویته',
      era: 'دو بار برنده جایزه نوبل',
      avatarEmoji: '🔬',
      avatarBg: 'from-emerald-600 to-teal-500',
      headline: 'شجاعت ایستادگی پای رسالت تا دستیابی به قله!',
      commentary: 'پایداری امروزت مثل ماری کوری در تاریکی آزمایشگاه بود؛ هیچ مانعی نتوانست تمرکزت را از مسیر هدف بردارد.',
      quote: '«هیچ چیز در زندگی نباید مایه ترس باشد، بلکه فقط باید فهمیده شود.»',
      powerWord: 'پایداری علمی',
    },
  ],
  cinema: [
    {
      name: 'لئوناردو دی‌کاپریو',
      enName: 'Leonardo DiCaprio',
      field: 'سینما، بازیگری و هنر اجرا',
      era: 'برنده اسکار و رکورددار تعهد',
      avatarEmoji: '🎬',
      avatarBg: 'from-amber-700 to-orange-600',
      headline: 'درخشش در صحنه و جنگیدن برای هر لحظه تا فتح نتیجه!',
      commentary: 'عملکرد امروزت شبیه بازی دی‌کاپریو در فیلم ازگوربرخاسته بود؛ هیچ خستگی نتوانست جلوی اشتیاق و اجرای بی‌نقصت را بگیرد.',
      quote: '«اگر به آنچه انجام می‌دهی ۱۰۰٪ ایمان داشته باشی، غیرممکن‌ها تسلیم می‌شوند.»',
      powerWord: 'تعهد هنری',
    },
    {
      name: 'کریستوفر نولان',
      enName: 'Christopher Nolan',
      field: 'کارگردانی و سناریونویسی زمان‌محور',
      era: 'خالق میان‌ستاره‌ای و اوپنهایمر',
      avatarEmoji: '⏳',
      avatarBg: 'from-slate-900 to-stone-800',
      headline: 'مهندسی دقیق ثانیه‌ها و سناریوی قدرتمند روز!',
      commentary: 'امروز کارگردان زندگی خودت بودی و مانند نولان هر بخش از روز را با زمان‌بندی دقیق و بلوک‌های هدفمند چیدی.',
      quote: '«زمان مهم‌ترین بعد زندگی است؛ از تک‌تک ثانیه‌هایش اثر خلق کن.»',
      powerWord: 'مهندسی زمان',
    },
  ],
  business: [
    {
      name: 'ایلان ماسک',
      enName: 'Elon Musk',
      field: 'کارآفرینی، هوافضا و تسخیر آینده',
      era: 'رهبر تسلا و اسپیس‌ایکس',
      avatarEmoji: '🚀',
      avatarBg: 'from-rose-600 to-red-600',
      headline: 'شتاب فوق‌العاده و درهم شکستن رکوردهای بهره‌وری!',
      commentary: 'حجم کارهای انجام‌شده‌ات امروز شبیه یک شیفت ماراتن در کارخانه اسپیس‌ایکس بود؛ انگیزه بالا و پیشروی تهاجمی به جلو.',
      quote: '«وقتی چیزی به اندازه کافی مهم است، انجامش می‌دهی حتی اگر شانس به نفع تو نباشد.»',
      powerWord: 'شتاب بی‌پایان',
    },
    {
      name: 'وارن بافت',
      enName: 'Warren Buffett',
      field: 'سرمایه‌گذاری راهبردی و صبوری هوشمند',
      era: 'اسطوره بورس و انباشت ارزش',
      avatarEmoji: '📈',
      avatarBg: 'from-emerald-700 to-green-600',
      headline: 'انتخاب هوشمندانه اولویت‌ها و حذف تصمیم‌های زائد!',
      commentary: 'مثل بافت به کارهای بی‌ارزش «نه» گفتی و انرژیت را دقیقاً روی تسک‌های با ارزش‌افزوده متمرکز کردی.',
      quote: '«فرق بین آدم‌های موفق و خیلی موفق این است که دومی‌ها تقریباً به همه‌چیز نه می‌گویند.»',
      powerWord: 'تمرکز گزینشی',
    },
  ],
  general: [
    {
      name: 'توماس ادیسون',
      enName: 'Thomas Edison',
      field: 'اختراع، صنعت و پشتکار تاریخی',
      era: 'بیش از ۱۰۰۰ اختراع ثبت‌شده',
      avatarEmoji: '💡',
      avatarBg: 'from-amber-500 to-yellow-600',
      headline: 'پشتکار فولادین؛ آزمایش مداوم تا روشن شدن چراغ پیروزی!',
      commentary: 'تلاش خستگی‌ناپذیر امروزت نشان داد که برای پیروزی نیازی به معجزه نداری؛ فقط ادامه‌دادن با امید.',
      quote: '«نبوغ یک درصد الهام است و نود و نه درصد عرق ریختن.»',
      powerWord: 'عزم شکست‌ناپذیر',
    },
    {
      name: 'لئوناردو داوینچی',
      enName: 'Leonardo da Vinci',
      field: 'همه‌چیزدانی، نقاشی و مهندسی',
      era: 'نابغه عصر رنسانس',
      avatarEmoji: '🎨',
      avatarBg: 'from-amber-800 to-stone-700',
      headline: 'کنجکاوی بی‌پایان در چندین جبهه و خلق دستاوردهای متنوع!',
      commentary: 'امروز تنوع کارهایت و انرژی بالایت نشان از ذهن چندبعدی داوینچی داشت؛ هماهنگی عالی میان وظایف مختلف.',
      quote: '«یادگیری هرگز ذهن را خسته نمی‌کند.»',
      powerWord: 'کنجکاوی چندبعدی',
    },
  ],
};

export const ProgressNewspaperStoryModal: React.FC<ProgressNewspaperStoryModalProps> = ({
  isOpen,
  onClose,
  onOpenDailyStory,
}) => {
  const { tasks, currentUser, selectedDate, calendarType, streak } = useTask();
  const [twinIndex, setTwinIndex] = useState(0);
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

  // Determine user domain
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
    combinedContext.includes('program') ||
    combinedContext.includes('فرانت') ||
    combinedContext.includes('بک')
  ) {
    categoryKey = 'programming';
  } else if (
    combinedContext.includes('بازیگر') ||
    combinedContext.includes('سینما') ||
    combinedContext.includes('فیلم') ||
    combinedContext.includes('هنر') ||
    combinedContext.includes('actor') ||
    combinedContext.includes('رسانه') ||
    combinedContext.includes('کارگردان')
  ) {
    categoryKey = 'cinema';
  } else if (
    combinedContext.includes('علم') ||
    combinedContext.includes('دانشگاه') ||
    combinedContext.includes('پژوهش') ||
    combinedContext.includes('فیزیک') ||
    combinedContext.includes('تحقیق') ||
    combinedContext.includes('استاد')
  ) {
    categoryKey = 'science';
  } else if (
    combinedContext.includes('مدیر') ||
    combinedContext.includes('کسب') ||
    combinedContext.includes('استارتاپ') ||
    combinedContext.includes('فروش') ||
    combinedContext.includes('مالی') ||
    combinedContext.includes('تجارت') ||
    combinedContext.includes('market') ||
    combinedContext.includes('ceo')
  ) {
    categoryKey = 'business';
  }

  const twinList = CELEBRITY_DATABASE[categoryKey] || CELEBRITY_DATABASE['general'];
  const activeTwin = twinList[twinIndex % twinList.length];

  const handleNextTwin = () => {
    sounds.playPop();
    setTwinIndex((prev) => (prev + 1) % twinList.length);
  };

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        ref={storyCardRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-gradient-to-b from-[#fbf8f1] via-[#f7f3e8] to-[#f2ecdd] text-slate-900 rounded-[32px] p-5 sm:p-7 shadow-2xl border-4 border-amber-900/20 space-y-5 relative animate-in zoom-in-95 my-auto overflow-hidden font-serif select-none"
      >
        {/* Subtle Newspaper Vintage Texture Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#d6c7a1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 relative">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-600 bg-amber-900/10 px-2 py-0.5 rounded">
              BAGTIME DAILY EDITION
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              • {formatAppDate(targetDate, calendarType, 'full')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-900/10 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Newspaper Title Head banner */}
        <div className="text-center space-y-1 relative">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <Star className="w-3.5 h-3.5 fill-amber-700" />
            <span className="text-[11px] font-bold tracking-widest font-sans uppercase">
              ویژه‌نامه استوری پیشرفت روزنامه
            </span>
            <Star className="w-3.5 h-3.5 fill-amber-700" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            روزنامه عصر پیشرفت
          </h1>
          <p className="text-[11px] text-slate-600 font-sans italic">
            بررسی دستاوردهای {currentUser?.name || 'قهرمان امروز'} در تراز مفاخر و سلبریتی‌ها
          </p>
        </div>

        {/* Top Headline Box */}
        <div className="p-3.5 rounded-2xl bg-white/80 border-2 border-slate-900 shadow-sm space-y-1 text-center relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full font-sans">
            <Zap className="w-3 h-3 text-amber-700" />
            <span>تیتر یک روز: {activeTwin.powerWord}</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
            «{activeTwin.headline}»
          </h2>
        </div>

        {/* Celebrity Twin Feature Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-amber-900/20 shadow-md space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeTwin.avatarBg} text-white flex items-center justify-center text-3xl shadow-md border-2 border-white`}
              >
                {activeTwin.avatarEmoji}
              </div>
              <div>
                <div className="text-[10px] font-black text-amber-800 uppercase font-sans tracking-wide">
                  همتای افتخار امروز شما:
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {activeTwin.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  {activeTwin.enName} • {activeTwin.era}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextTwin}
              title="مشاهده الگوی دیگر"
              className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>چهره دیگر</span>
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium text-justify">
            {activeTwin.commentary}
          </p>

          <div className="p-2.5 rounded-xl bg-amber-50/80 border-r-4 border-amber-700 text-[11px] text-amber-950 italic flex items-center gap-2">
            <Quote className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{activeTwin.quote}</span>
          </div>
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-3 gap-2.5 font-sans">
          <div className="p-3 rounded-2xl bg-white/90 border border-slate-300 text-center space-y-0.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} ({toPersianDigits(percent)}٪)
            </div>
            <div className="text-[10px] text-slate-500 font-bold">کارهای تکمیل‌شده</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-slate-300 text-center space-y-0.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {toPersianDigits(totalFocusMins)} دقیقه
            </div>
            <div className="text-[10px] text-slate-500 font-bold">زمان تمرکز امروز</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-slate-300 text-center space-y-0.5">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {toPersianDigits(streak.currentStreak)} روز
            </div>
            <div className="text-[10px] text-slate-500 font-bold">استریک مداوم</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-2.5 font-sans">
          <button
            type="button"
            onClick={handleCelebrate}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>تشویق و ثبت افتخار 🎉</span>
          </button>

          {onOpenDailyStory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDailyStory();
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Feather className="w-4 h-4 text-amber-400" />
              <span>نوشتن داستان روز 📖</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
