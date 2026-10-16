import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import type { GoalPeriod, GoalCategory } from '../types';
import {
  Target,
  Clock,
  Brain,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  X,
  Compass,
} from 'lucide-react';

export const CareerGoalsView: React.FC = () => {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    currentUser,
    personalityResult,
    savePersonalityResult,
    updateUserTimeline,
  } = useTask();

  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'timeline' | 'personality'>('goals');
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod | 'all'>('all');
  
  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('career');
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('quarter1');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  // Daily Timeline State
  const [wakeUp, setWakeUp] = useState(currentUser?.dailyTimeline?.wakeUp || '۰۶:۳۰');
  const [workStart, setWorkStart] = useState(currentUser?.dailyTimeline?.workStart || '۰۸:۳۰');
  const [lunch, setLunch] = useState(currentUser?.dailyTimeline?.lunch || '۱۳:۳۰');
  const [gym, setGym] = useState(currentUser?.dailyTimeline?.gym || '۱۸:۰۰');
  const [sleep, setSleep] = useState(currentUser?.dailyTimeline?.sleep || '۲۳:۳۰');
  const [timelineSaved, setTimelineSaved] = useState(false);

  // Personality Test State
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [isTakingTest, setIsTakingTest] = useState(false);

  const userJob = currentUser?.jobTitle || 'برنامه‌نویس و طراح محصول';

  // Periods config
  const periods: Array<{ id: GoalPeriod; label: string }> = [
    { id: 'week', label: 'این هفته' },
    { id: 'month', label: 'این ماه' },
    { id: 'quarter1', label: '۳ ماهه اول' },
    { id: 'halfYear1', label: '۶ ماهه اول' },
    { id: 'halfYear2', label: '۶ ماهه دوم' },
    { id: 'year', label: 'اهداف سالانه' },
  ];

  // Job-specific suggestions
  const jobSuggestions = [
    { title: 'طراحی و پیاده‌سازی سیستم دیزاین مدرن', category: 'career', period: 'quarter1' },
    { title: 'ارتقای مهارت‌های تخصصی و فریم‌ورک‌های جدید', category: 'skill', period: 'month' },
    { title: 'توسعه و انتشار MVP محصول اصلی', category: 'project', period: 'quarter1' },
    { title: 'مطالعه ۲ کتاب تخصصی حوزه مدیریت زمان و رهبری', category: 'skill', period: 'halfYear1' },
    { title: '۳۰ جلسه تمرین مستمر باشگاه و ارتقای آمادگی جسمانی', category: 'personal', period: 'month' },
  ];

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    sounds.playPop();

    await addGoal({
      title: goalTitle.trim(),
      category: goalCategory,
      period: goalPeriod,
      description: goalDescription.trim() || undefined,
      targetDate: goalTargetDate.trim() || undefined,
      progress: 0,
      completed: false,
    });

    setGoalTitle('');
    setGoalDescription('');
    setGoalTargetDate('');
    setIsGoalModalOpen(false);
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserTimeline({
      wakeUp,
      workStart,
      lunch,
      gym,
      sleep,
    });
    setTimelineSaved(true);
    sounds.playComplete();
    setTimeout(() => setTimelineSaved(false), 2500);
  };

  // 8 Questions for Productivity Personality Test
  const questions = [
    {
      q: 'هنگام مواجهه با یک ددلاین فشرده، اولین واکنش شما چیست؟',
      options: [
        { text: 'برنامه‌ریزی دقیق ساعت‌به‌ساعت و شروع سریع', type: 'architect' },
        { text: 'شروع مستقیم به کار با تکیه بر آدرنالین و سرعت بالا', type: 'strategist' },
        { text: 'طوفان فکری برای پیدا کردن سریع‌ترین و خلاقانه‌ترین راه‌حل', type: 'creator' },
        { text: 'حفظ آرامش، حذف حواشی و ادامه منظم روتین', type: 'optimizer' },
      ],
    },
    {
      q: 'کدام محیط کاری بیشترین بازدهی را برای شما ایجاد می‌کند؟',
      options: [
        { text: 'محیط کاملاً ساکت و سازمان‌یافته با نظم بصری بالا', type: 'architect' },
        { text: 'فضای پویا و سریع با چالش‌ها و بازخوردهای مداوم', type: 'strategist' },
        { text: 'محیط الهام‌بخش با آزادی عمل کامل و بدون محدودیت زمانی', type: 'creator' },
        { text: 'فضای ارگونومیک با ابزارهای آماده و بدون مزاحمت', type: 'optimizer' },
      ],
    },
    {
      q: 'بزرگترین مانع ذهنی شما در مسیر انجام کارها چیست؟',
      options: [
        { text: 'کمال‌گرایی وسواس‌گونه و تلاش برای بی‌نقص بودن همه‌چیز', type: 'architect' },
        { text: 'خستگی ناگهانی از کارهای تکراری و اداری طولانی', type: 'strategist' },
        { text: 'شروع چندین ایده همزمان و رها کردن نیمه‌کاره آن‌ها', type: 'creator' },
        { text: 'مقاومت در برابر تغییرات ناگهانی برنامه‌ها و جلسات تحمیلی', type: 'optimizer' },
      ],
    },
    {
      q: 'چگونه اهداف بلندمدت خود را دنبال می‌کنید؟',
      options: [
        { text: 'خرد کردن به مایلستون‌های فصلی و وظایف روزانه دقیق', type: 'architect' },
        { text: 'تمرکز بر یک هدف بزرگ و تلاش پیوسته تا رسیدن به نتیجه', type: 'strategist' },
        { text: 'پیروی از شهود، یادگیری مداوم و غنیمت شمردن فرصت‌ها', type: 'creator' },
        { text: 'ایجاد عادت‌های کوچک روزانه که انباشته می‌شوند', type: 'optimizer' },
      ],
    },
    {
      q: 'وقتی وسط یک تسک سنگین دچار افت انرژی می‌شوید چه می‌کنید؟',
      options: [
        { text: 'توقف طبق برنامه، استراحت ۵ دقیقه‌ای و شروع مجدد پومودورو', type: 'architect' },
        { text: 'تغییر موقت تسک به یک کار فوری‌تر برای ایجاد هیجان', type: 'strategist' },
        { text: 'پیاده‌روی، نوشیدن قهوه یا یادداشت ایده‌های جدید', type: 'creator' },
        { text: 'بررسی چک‌لیست برای بستن کارهای سریع و بازیابی مومنتوم', type: 'optimizer' },
      ],
    },
    {
      q: 'کدام سبک مدیریت زمان برای شما طبیعی‌تر است؟',
      options: [
        { text: 'تایم‌باکسینگ (Time Boxing) و بلوک‌بندی دقیق ساعات روز', type: 'architect' },
        { text: 'روش قورباغه را قورت بده (انجام سخت‌ترین کار در اول صبح)', type: 'strategist' },
        { text: 'کار بر اساس جریان ذهنی آزاد (Flow State) تا خستگی کامل', type: 'creator' },
        { text: 'ماتریس آیزنهاور و حذف قاطع کارهای غیرضروری', type: 'optimizer' },
      ],
    },
    {
      q: 'چگونه موفقیت یک روز کاری را ارزیابی می‌کنید؟',
      options: [
        { text: 'تیک خوردن ۱۰۰٪ کارهای ثبت‌شده در تقویم کاری', type: 'architect' },
        { text: 'حل کردن یک چالش بزرگ و اثرگذار که دیگران نتوانستند', type: 'strategist' },
        { text: 'خلق یک خروجی تازه و نوآورانه که به آن افتخار می‌کنم', type: 'creator' },
        { text: 'انجام کارها بدون استرس، اضافه‌کاری و حواس‌پرتی', type: 'optimizer' },
      ],
    },
    {
      q: 'ابزار کاری ایده‌آل شما چه ویژگی دارد؟',
      options: [
        { text: 'سیستم جامع با تحلیل داده‌ها و نمودارهای پیشرفت دقیق', type: 'architect' },
        { text: 'رابط کاربری سریع و بدون معطلی برای اجرای فوری کارها', type: 'strategist' },
        { text: 'ظاهر مینیمال، مدرن و انعطاف‌پذیر با زیبایی بصری', type: 'creator' },
        { text: 'سیستمی خودکار که نیاز به یادآوری و دوباره‌کاری را حذف کند', type: 'optimizer' },
      ],
    },
  ];

  const handleFinishTest = () => {
    sounds.playComplete();
    const counts: Record<string, number> = { architect: 0, strategist: 0, creator: 0, optimizer: 0 };
    Object.values(testAnswers).forEach((idx, qIndex) => {
      const opt = questions[qIndex]?.options[idx];
      if (opt) counts[opt.type] = (counts[opt.type] || 0) + 1;
    });

    const dominant = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b), 'architect');

    const archetypes: Record<string, {
      title: string;
      archetype: string;
      desc: string;
      strengths: string[];
      growth: string[];
      recommendations: string[];
    }> = {
      architect: {
        title: 'معمار سیستم و انضباط (System Architect)',
        archetype: 'استاد نظم و ساختارسازی',
        desc: 'شما زمانی بیشترین شاهکارها را خلق می‌کنید که سیستم شفاف، اهداف مدون و محیطی بدون مزاحمت داشته باشید. شما برای مهندسی و توسعه پروژه‌های ماندگار ساخته شده‌اید.',
        strengths: ['برنامه‌ریزی دقیق و تحلیلی', 'ثبات قدم در ددلاین‌های سنگین', 'توجه بالا به کیفیت و جزییات'],
        growth: ['انعطاف‌پذیری در برابر رخدادهای پیش‌بینی‌نشده', 'پرهیز از وسواس کمال‌گرایی (Overthinking)'],
        recommendations: [
          'از روش Time-Boxing برای قفل کردن بازه‌های ۲ ساعته در دیلی پلنر استفاده کنید.',
          'ددلاین‌های داخلی خود را ۲۴ ساعت زودتر از موعد اصلی قرار دهید.',
          'قانون ۸۰/۲۰ را برای جلوگیری از کمال‌گرایی تمرین کنید.',
        ],
      },
      strategist: {
        title: 'استراتژیست عمل‌گرا (Action Strategist)',
        archetype: 'مرد چالش‌های بزرگ و نتیجه‌گرا',
        desc: 'انرژی و هیجان حل مسائل پیچیده شما را به پیش می‌برد. ددلاین‌های سخت به جای ترس، آدرنالین لازم برای پرش‌های بزرگ کاری را در شما فعال می‌کنند.',
        strengths: ['تصمیم‌گیری سریع زیر فشار', 'تمرکز لیزری بر نتایج نهایی', 'شجاعت در دست‌وپنجه نرم کردن با چالش‌ها'],
        growth: ['صبر و تاب‌آوری در کارهای روتین و مستندسازی', 'جلوگیری از فرسودگی شغلی (Burnout)'],
        recommendations: [
          'قورباغه بزرگ را اول صبح با تایمر فوکوس بگ‌تایم قورت دهید.',
          'استراحت‌های روزانه را جدی بگیرید تا ذخیره آدرنالین شما تخلیه نشود.',
          'کارهای اداری ریز را به انتهای روز موکول کنید.',
        ],
      },
      creator: {
        title: 'خالق نوآور و ایده‌پرداز (Creative Innovator)',
        archetype: 'الهام‌بخش و کاشف راه‌حل‌های نو',
        desc: 'شما دنیا را از دریچه امکان‌ها و خلق چیزهای تازه می‌بینید. روش‌های سنتی و خشک کاری به سرعت انرژی شما را تخلیه می‌کنند، اما آزادی عمل و ایده‌پردازی معجزه می‌آفریند.',
        strengths: ['تفکر خارج از چارچوب و نوآوری', 'شهود قوی و ارتباط دادن ایده‌های نامرتبط', 'اشتیاق فراوان در فاز ایده‌پردازی'],
        growth: ['به سرانجام رساندن پروژه‌ها پس از افول هیجان اولیه', 'پایبندی به روتین‌های ثابت روزانه'],
        recommendations: [
          'ایده‌های ناگهانی را در نوت‌های سریع ذخیره کرده و اجازه ندهید تسک جاری قطع شود.',
          'از تکنیک تعهد عمومی یا اعلام ددلاین به دوستان برای حفظ شتاب استفاده کنید.',
          'پروژه‌های بزرگ را به بازه‌های حداکثر ۱۰ روزه بشکنید.',
        ],
      },
      optimizer: {
        title: 'بهینه‌ساز بهره‌وری (Efficiency Optimizer)',
        archetype: 'استاد تعادل، آرامش و پیوستگی',
        desc: 'بزرگترین هنر شما انجام کارهای باکیفیت با کمترین هدررفت انرژی و استرس است. شما به جای جهش‌های ناگهانی، به قدرت جادویی عادات کوچک انباشته‌شده باور دارید.',
        strengths: ['پایداری در بلندمدت بدون فرسودگی', 'حذف قاطع حواشی و کارهای بی‌فایده', 'روان‌سازی فرآیندهای پیچیده'],
        growth: ['پذیرش ریسک در فرصت‌های طلایی نوظهور', 'سرعت بخشیدن در موقعیت‌های اضطراری'],
        recommendations: [
          'از تحلیلگر عادات بگ‌تایم برای پایش نرخ اصطکاک و بهبود مستمر هفتگی استفاده کنید.',
          'هر فصل یک مهارت کاملاً غافلگیرکننده و جدید به کارنامه خود اضافه کنید.',
          'زنجیره استریک عادات روزانه خود را بالای ۲۰ روز نگه دارید.',
        ],
      },
    };

    const res = archetypes[dominant] || archetypes.architect;
    savePersonalityResult({
      type: dominant,
      archetype: res.archetype,
      title: res.title,
      description: res.desc,
      strengths: res.strengths,
      growthAreas: res.growth,
      recommendations: res.recommendations,
      testedAt: new Date().toISOString(),
    });
    setIsTakingTest(false);
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedPeriod === 'all') return true;
    return g.period === selectedPeriod;
  });

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in select-none" dir="rtl">
      {/* 1. TOP BENTO HEADER WITH SUB-TABS */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                اهداف دوره‌ای، برنامه‌ریزی شغلی و روانشناسی بهره‌وری
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
              مدیریت اهداف تخصصی، تنظیم تایم‌لاین شبانه‌روز و تحلیل تیپ شخصیتی
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#252528] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-xs font-bold w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveSubTab('goals');
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'goals'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>اهداف شغلی</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveSubTab('timeline');
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تایم‌لاین روزانه</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveSubTab('personality');
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'personality'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>تست شخصیت</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB 1: PERIODIC GOALS & OKRs */}
      {activeSubTab === 'goals' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1c1c1e] p-4 rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            {/* Period pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSelectedPeriod('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer shrink-0 ${
                  selectedPeriod === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#252528] text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                همه اهداف ({toPersianDigits(goals.length)})
              </button>
              {periods.map((p) => {
                const count = goals.filter((g) => g.period === p.id).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedPeriod(p.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer shrink-0 ${
                      selectedPeriod === p.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-[#252528] text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {p.label} {count > 0 && `(${toPersianDigits(count)})`}
                  </button>
                );
              })}
            </div>

            {/* New Goal button */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsGoalModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>هدف جدید</span>
            </button>
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">هنوز هدفی در این بازه زمانی ثبت نشده است</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-md mx-auto">
                اهداف هفتگی، ماهانه، ۳ ماهه یا سالانه متناسب با شغل خود را ثبت کنید تا در دیلی پلنر و تحلیلگر عادت‌ها رصد شوند.
              </p>
              
              {/* Job quick templates */}
              <div className="pt-3 max-w-lg mx-auto">
                <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2">پیشنهادهای آماده برای {userJob}:</div>
                <div className="space-y-1.5 text-right">
                  {jobSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setGoalTitle(sug.title);
                        setGoalCategory(sug.category as GoalCategory);
                        setGoalPeriod(sug.period as GoalPeriod);
                        setIsGoalModalOpen(true);
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] hover:border-black/20 text-xs text-slate-700 dark:text-zinc-300 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>• {sug.title}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((g) => {
                const isCompleted = g.progress === 100 || g.completed;
                return (
                  <div
                    key={g.id}
                    className={`p-5 rounded-[28px] border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/30'
                        : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 font-bold">
                          {periods.find((p) => p.id === g.period)?.label || g.period}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playTrash();
                              deleteGoal(g.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="حذف هدف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-sm font-black ${isCompleted ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-900 dark:text-white'}`}>
                        {g.title}
                      </h4>

                      {g.description && (
                        <p className="text-xs text-slate-400 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                          {g.description}
                        </p>
                      )}
                    </div>

                    {/* Progress slider and percentage */}
                    <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400 dark:text-zinc-400 text-[11px]">میزان پیشرفت:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{toPersianDigits(g.progress)}٪</span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={g.progress}
                        onChange={(e) => updateGoal(g.id, { progress: parseInt(e.target.value, 10), completed: parseInt(e.target.value, 10) === 100 })}
                        className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-100 dark:bg-[#252528] rounded-full"
                      />

                      {g.targetDate && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 font-mono font-bold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          موعد هدف: {toPersianDigits(g.targetDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-TAB 2: DAILY BLUEPRINT TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 space-y-6 animate-in fade-in shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                تایم‌لاین روتین شبانه‌روز شما
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5 font-medium">
                ساعات کلیدی بیداری، کار، وعده‌های غذایی و استراحت را مشخص کنید تا پلنر بهینه‌ترین زمان‌ها را پیشنهاد دهد.
              </p>
            </div>

            {timelineSaved && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                تایم‌لاین با موفقیت ذخیره شد
              </span>
            )}
          </div>

          <form onSubmit={handleSaveTimeline} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-2">
                <label className="text-xs font-black text-amber-700 dark:text-amber-400 block">ساعت بیداری ☀️</label>
                <input
                  type="text"
                  value={wakeUp}
                  onChange={(e) => setWakeUp(e.target.value)}
                  placeholder="۰۶:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <span className="text-[10px] text-slate-400 font-bold block">شروع روتین صبحگاهی</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 space-y-2">
                <label className="text-xs font-black text-indigo-700 dark:text-indigo-400 block">شروع کار عمیق 💻</label>
                <input
                  type="text"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  placeholder="۰۸:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <span className="text-[10px] text-slate-400 font-bold block">تمرکز بر تسک‌های اصلی</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-2">
                <label className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">ناهار و تجدید قوا 🥗</label>
                <input
                  type="text"
                  value={lunch}
                  onChange={(e) => setLunch(e.target.value)}
                  placeholder="۱۳:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[10px] text-slate-400 font-bold block">استراحت میان‌روز</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 space-y-2">
                <label className="text-xs font-black text-rose-700 dark:text-rose-400 block">ورزش و باشگاه 🏃‍♂️</label>
                <input
                  type="text"
                  value={gym}
                  onChange={(e) => setGym(e.target.value)}
                  placeholder="۱۸:۰۰"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-rose-500/40"
                />
                <span className="text-[10px] text-slate-400 font-bold block">فعالیت بدنی و تخلیه استرس</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20 space-y-2">
                <label className="text-xs font-black text-purple-700 dark:text-purple-400 block">زمان خواب 🌙</label>
                <input
                  type="text"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="۲۳:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <span className="text-[10px] text-slate-400 font-bold block">۷-۸ ساعت خواب کامل</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs transition-all shadow-md cursor-pointer active:scale-95"
              >
                ذخیره و تثبیت تایم‌لاین
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. SUB-TAB 3: PERSONALITY TEST */}
      {activeSubTab === 'personality' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 space-y-6 animate-in fade-in shadow-xs">
          {personalityResult && !isTakingTest ? (
            /* Results Screen */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      تیپ شخصیتی بهره‌وری شما: {personalityResult.title}
                    </h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 font-bold">
                      {personalityResult.archetype}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setIsTakingTest(true);
                    setTestAnswers({});
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black transition-colors cursor-pointer self-start sm:self-auto"
                >
                  انجام مجدد آزمون
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                {personalityResult.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    نقاط قوت برجسته شما:
                  </h4>
                  <ul className="text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                    {personalityResult.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    زمینه‌های قابل ارتقاء و رشد:
                  </h4>
                  <ul className="text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                    {personalityResult.growthAreas.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 space-y-2">
                <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  پیشنهادهای طلایی متناسب با ذهن شما برای رسیدن به اهداف:
                </h4>
                <ul className="text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  {personalityResult.recommendations.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            /* Test Questions */
            <div className="space-y-6">
              <div className="pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  آزمون روانشناسی کار، بهره‌وری و تمرکز
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5 font-medium">
                  به سوالات زیر بر اساس واقعیت رفتار کاری خود پاسخ دهید تا تیپ بهره‌وری و متدهای متناسب شما استخراج شود.
                </p>
              </div>

              <div className="space-y-5">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-200">
                        {toPersianDigits(qIndex + 1)}
                      </span>
                      <span>{q.q}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = testAnswers[qIndex] === optIndex;
                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() => {
                              sounds.playPop();
                              setTestAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
                            }}
                            className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-slate-900 dark:bg-white border-transparent text-white dark:text-slate-900 font-bold shadow-xs'
                                : 'bg-white dark:bg-zinc-800/80 border-black/[0.06] dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-black/20'
                            }`}
                          >
                            <span>{opt.text}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                {personalityResult && (
                  <button
                    type="button"
                    onClick={() => setIsTakingTest(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] text-slate-700 dark:text-zinc-300 text-xs font-black transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinishTest}
                  disabled={Object.keys(testAnswers).length < questions.length}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  مشاهده تحلیل تیپ شخصیتی و پیشنهادها
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-[32px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                تعریف هدف جدید
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">
                  عنوان هدف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="مثال: یادگیری فریم‌ورک جدید یا توسعه نسخه اول محصول"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">بازه زمانی هدف</label>
                  <select
                    value={goalPeriod}
                    onChange={(e) => setGoalPeriod(e.target.value as GoalPeriod)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">دسته‌بندی هدف</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="career">شغلی و حرفه‌ای</option>
                    <option value="skill">مهارت و یادگیری</option>
                    <option value="project">پروژه و محصول</option>
                    <option value="personal">فردی و سلامتی</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">موعد نهایی تحقق (شمسی/تاریخ)</label>
                <input
                  type="text"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  placeholder="مثال: پایان آبان ۱۴۰۵"
                  className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">توضیحات تکمیلی</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="جزییات، پیش‌نیازها و تعریف موفقیت برای این هدف..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] text-slate-700 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black transition-all shadow-md cursor-pointer active:scale-95"
                >
                  ایجاد هدف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
