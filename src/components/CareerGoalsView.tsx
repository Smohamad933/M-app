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

  const userJob = currentUser?.jobTitle || 'برنامه‌نویس و فیلمبردار';

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
    { title: 'ساخت فیلم کوتاه ۱۰۰ ثانیه‌ای با داستان منسجم', category: 'career', period: 'quarter1' },
    { title: 'اصلاح رنگ و تدوین پیشرفته پروژه مستند', category: 'skill', period: 'month' },
    { title: 'توسعه و انتشار MVP محصول اصلی', category: 'project', period: 'quarter1' },
    { title: 'یادگیری عمیق فریم‌ورک جدید و پیاده‌سازی تست', category: 'skill', period: 'halfYear1' },
    { title: '۳۰ جلسه تمرین مستمر باشگاه و ارتقای آمادگی جسمانی', category: 'personal', period: 'month' },
  ];

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

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
      q: 'بزرگ‌ترین قاتل تمرکز شما در طول روز کدام است؟',
      options: [
        { text: 'جلسات پیش‌بینی‌نشده و کارهای دیگران', type: 'architect' },
        { text: 'کارهای تکراری، خسته‌کننده و طولانی', type: 'strategist' },
        { text: 'نوتیفیکیشن‌های موبایل و سرک کشیدن به وب', type: 'creator' },
        { text: 'خستگی جسمی و کمبود خواب باکیفیت', type: 'optimizer' },
      ],
    },
    {
      q: 'در پروژه‌های بزرگ چگونه کارها را سازماندهی می‌کنید؟',
      options: [
        { text: 'تفکیک به زیرپروژه‌ها و جدول زمان‌بندی شفاف', type: 'architect' },
        { text: 'تعیین خروجی نهایی و دویدن به سمت هدف', type: 'strategist' },
        { text: 'تجسم نتیجه نهایی و کار بر اساس موج انرژی درونی', type: 'creator' },
        { text: 'ایجاد چک‌لیست روتین روزانه و تیک زدن پله‌پله', type: 'optimizer' },
      ],
    },
    {
      q: 'محیط کاری ایده‌آل برای بیشترین بازدهی شما چگونه است؟',
      options: [
        { text: 'اتاق ساکت، میز بسیار مرتب و بدون رفت‌وآمد', type: 'architect' },
        { text: 'فضای پرتحرک با دسترسی سریع به هم‌تیمی‌ها', type: 'strategist' },
        { text: 'محیط الهام‌بخش با موسیقی فوکوس و نور طبیعی', type: 'creator' },
        { text: 'فضای آشنا و ارگونومیک با ابزارهای ثابت و آماده', type: 'optimizer' },
      ],
    },
  ];

  const handleFinishTest = () => {
    // Determine dominant archetype
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
        title: 'معمار ساختاریافته (Focused Architect)',
        archetype: 'استاد نظم و سیستم‌سازی',
        desc: 'شما زمانی بیشترین شاهکارها را خلق می‌کنید که سیستم شفاف، اهداف مدون و محیطی بدون مزاحمت داشته باشید. شما برای مهندسی و توسعه پروژه‌های ماندگار ساخته شده‌اید.',
        strengths: ['برنامه‌ریزی دقیق و تحلیلی', 'ثبات قدم در ددلاین‌های سنگین', 'توجه به کیفیت و جزییات'],
        growth: ['انعطاف‌پذیری در برابر رخدادهای پیش‌بینی‌نشده', 'پرهیز از وسواس کمال‌گرایی (Overthinking)'],
        recommendations: [
          'از روش Time-Boxing برای قفل کردن بازه‌های ۲ ساعته در دیلی پلنر استفاده کنید.',
          'ددلاین‌ها را ۱۰ درصد زودتر از موعد تعیین کنید تا استرس کاهش یابد.',
        ],
      },
      strategist: {
        title: 'استراتژیست عمل‌گرا (Dynamic Strategist)',
        archetype: 'موتور محرک خروجی و اقدام سریع',
        desc: 'شما عاشق نتایج ملموس، چالش‌های پرسرعت و تبدیل ایده به واقعیت هستید. اهمال‌کاری شما معمولاً از سر رفتن حوصله ناشی می‌شود، نه از ناتوانی.',
        strengths: ['سرعت عمل استثنایی در تحویل خروجی', 'قدرت تصمیم‌گیری بالا زیر فشار', 'انرژی مسری برای تیم'],
        growth: ['حفظ تمرکز روی پروژه‌های بلندمدت', 'پرهیز از سوزاندن انرژی در ابتدای راه (Burnout)'],
        recommendations: [
          'پروژه‌ها را به اسپرینت‌های ۱ هفته‌ای خرد کنید تا انگیزه شما تازه بماند.',
          'از اتاق تمرکز گروهی (Focus Room) برای همراه کردن دیگران استفاده کنید.',
        ],
      },
      creator: {
        title: 'خالق نوآور (Innovative Creator)',
        archetype: 'چشمه جوشان ایده‌ها و داستان‌ها',
        desc: 'شما دارای شهود خلاقانه قوی و دید بصری بالا هستید (به خصوص در فیلمبرداری، طراحی و حل مسائل پیچیده). کارهای خشک و اداری انرژی شما را کاهش می‌دهند.',
        strengths: ['تفکر خلاق خارج از چهارچوب', 'ذوق هنری و داستان‌پردازی قوی', 'اشتیاق عمیق به کارهای نو'],
        growth: ['پایان دادن به کارهای شروع‌شده', 'پرهیز از پرش مکرر میان ایده‌های مختلف'],
        recommendations: [
          'قانون «یک پروژه اصلی در هر فصل» را رعایت کنید.',
          'نوتیفیکیشن‌های تلفن همراه را هنگام ضبط و خلق به طور کامل سایلنت کنید.',
        ],
      },
      optimizer: {
        title: 'بهبودگر پایدار (Consistent Optimizer)',
        archetype: 'قهرمان استریک و عادات ماندگار',
        desc: 'شما با نظم پله‌پله و آرام کوه‌ها را جا‌به‌جا می‌کنید. زنجیره استریک و عادات روزانه بهترین دوستان شما در رسیدن به قله‌های شغلی هستند.',
        strengths: ['صبر و استقامت طولانی‌مدت', 'عادات پایدار و سلامت ریتم روزانه', 'قابل اتکا برای همکاران'],
        growth: ['ریسک‌پذیری در کارهای بزرگ جدید', 'سرعت بخشیدن به چرخه آزمون و خطا'],
        recommendations: [
          'استریک خود را با ثبت روزانه در تسک‌روز بالای ۳۰ روز نگه دارید.',
          'هر ماه یک هدف چالش‌برانگیز خارج از منطقه امن خود اضافه کنید.',
        ],
      },
    };

    const chosen = archetypes[dominant] || archetypes.architect;

    savePersonalityResult({
      type: dominant,
      title: chosen.title,
      archetype: chosen.archetype,
      description: chosen.desc,
      strengths: chosen.strengths,
      growthAreas: chosen.growth,
      recommendations: chosen.recommendations,
      testedAt: new Date().toISOString(),
    });

    setIsTakingTest(false);
  };

  const filteredGoals = goals.filter((g) => {
    if (selectedPeriod === 'all') return true;
    return g.period === selectedPeriod;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* 1. Header Bar with Sub-Tab Switcher */}
      <div className="bg-zinc-900/70 p-5 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                اهداف دوره‌ای، برنامه‌ریزی شغلی و روانشناسی بهره‌وری
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              مدیریت اهداف تخصصی، تنظیم تایم‌لاین شبانه‌روز و تحلیل تیپ شخصیتی
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-xs font-bold self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'goals'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>اهداف شغلی</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تایم‌لاین روزانه</span>
          </button>

          <button
            onClick={() => setActiveSubTab('personality')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'personality'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>تست شخصیت</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: CAREER & PERIODIC GOALS */}
      {activeSubTab === 'goals' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Period pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex-shrink-0 ${
                  selectedPeriod === 'all'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                همه اهداف ({toPersianDigits(goals.length)})
              </button>
              {periods.map((p) => {
                const count = goals.filter((g) => g.period === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex-shrink-0 ${
                      selectedPeriod === p.id
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.label} {count > 0 && `(${toPersianDigits(count)})`}
                  </button>
                );
              })}
            </div>

            {/* New Goal button */}
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>هدف جدید</span>
            </button>
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">هنوز هدفی در این بازه زمانی ثبت نشده است</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                اهداف هفتگی، ماهانه، ۳ ماهه یا سالانه متناسب با شغل خود را ثبت کنید تا در دیلی پلنر و تحلیلگر عادت‌ها رصد شوند.
              </p>
              
              {/* Job quick templates */}
              <div className="pt-3 max-w-lg mx-auto">
                <div className="text-[11px] font-bold text-zinc-400 mb-2">پیشنهادهای آماده برای {userJob}:</div>
                <div className="space-y-1.5 text-right">
                  {jobSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setGoalTitle(sug.title);
                        setGoalCategory(sug.category as GoalCategory);
                        setGoalPeriod(sug.period as GoalPeriod);
                        setIsGoalModalOpen(true);
                      }}
                      className="w-full p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>• {sug.title}</span>
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
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
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isCompleted
                        ? 'bg-zinc-950/40 border-emerald-900/40'
                        : 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                          {periods.find((p) => p.id === g.period)?.label || g.period}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteGoal(g.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="حذف هدف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-sm font-black ${isCompleted ? 'line-through text-zinc-400' : 'text-white'}`}>
                        {g.title}
                      </h4>

                      {g.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {g.description}
                        </p>
                      )}
                    </div>

                    {/* Progress slider and percentage */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 text-[11px]">میزان پیشرفت:</span>
                        <span className="font-bold text-white font-mono">{toPersianDigits(g.progress)}٪</span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={g.progress}
                        onChange={(e) => updateGoal(g.id, { progress: parseInt(e.target.value, 10), completed: parseInt(e.target.value, 10) === 100 })}
                        className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-full"
                      />

                      {g.targetDate && (
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-zinc-500" />
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

      {/* 3. TAB 2: DAILY TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 sm:p-6 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                تایم‌لاین روتین شبانه‌روز شما
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                ساعات کلیدی بیداری، کار، وعده‌های غذایی و استراحت را مشخص کنید تا پلنر بهینه‌ترین زمان‌ها را پیشنهاد دهد.
              </p>
            </div>

            {timelineSaved && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                تایم‌لاین با موفقیت ذخیره شد
              </span>
            )}
          </div>

          <form onSubmit={handleSaveTimeline} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-amber-400 block">ساعت بیداری ☀️</label>
                <input
                  type="text"
                  value={wakeUp}
                  onChange={(e) => setWakeUp(e.target.value)}
                  placeholder="۰۶:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block">شروع روتین صبحگاهی</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-indigo-400 block">شروع کار عمیق 💻</label>
                <input
                  type="text"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  placeholder="۰۸:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block">تمرکز بر تسک‌های اصلی</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-emerald-400 block">ناهار و تجدید قوا 🥗</label>
                <input
                  type="text"
                  value={lunch}
                  onChange={(e) => setLunch(e.target.value)}
                  placeholder="۱۳:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block">استراحت میان‌روز</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-rose-400 block">ورزش و باشگاه 🏃‍♂️</label>
                <input
                  type="text"
                  value={gym}
                  onChange={(e) => setGym(e.target.value)}
                  placeholder="۱۸:۰۰"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block">فعالیت بدنی و تخلیه استرس</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-purple-400 block">زمان خواب 🌙</label>
                <input
                  type="text"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="۲۳:۳۰"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block">۷-۸ ساعت خواب کامل</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                ذخیره و تثبیت تایم‌لاین
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TAB 3: PERSONALITY & PRODUCTIVITY TEST */}
      {activeSubTab === 'personality' && (
        <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 sm:p-6 space-y-6 animate-in fade-in">
          {personalityResult && !isTakingTest ? (
            /* Results Screen */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      تیپ شخصیتی بهره‌وری شما: {personalityResult.title}
                    </h3>
                    <p className="text-xs text-purple-400 mt-0.5 font-bold">
                      {personalityResult.archetype}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsTakingTest(true);
                    setTestAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  انجام مجدد آزمون
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-medium">
                {personalityResult.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    نقاط قوت برجسته شما:
                  </h4>
                  <ul className="text-xs text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
                    {personalityResult.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    زمینه‌های قابل ارتقاء و رشد:
                  </h4>
                  <ul className="text-xs text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
                    {personalityResult.growthAreas.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  پیشنهادهای طلایی متناسب با ذهن شما برای رسیدن به اهداف:
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
                  {personalityResult.recommendations.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            /* Test Questions */
            <div className="space-y-6">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  آزمون روانشناسی کار، بهره‌وری و تمرکز
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  به سوالات زیر بر اساس واقعیت رفتار کاری خود پاسخ دهید تا تیپ بهره‌وری و متدهای متناسب شما استخراج شود.
                </p>
              </div>

              <div className="space-y-6">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-300">
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
                                ? 'bg-zinc-800 border-white text-white font-bold ring-1 ring-white/30'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
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

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                {personalityResult && (
                  <button
                    onClick={() => setIsTakingTest(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
                <button
                  onClick={handleFinishTest}
                  disabled={Object.keys(testAnswers).length < questions.length}
                  className="px-6 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-40"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                تعریف هدف جدید
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  عنوان هدف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="مثال: ساخت فیلم کوتاه ۱۰۰ ثانیه‌ای یا توسعه نسخه اول محصول"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">بازه زمانی هدف</label>
                  <select
                    value={goalPeriod}
                    onChange={(e) => setGoalPeriod(e.target.value as GoalPeriod)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">دسته‌بندی هدف</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden"
                  >
                    <option value="career">شغلی و حرفه‌ای</option>
                    <option value="skill">مهارت و یادگیری</option>
                    <option value="project">پروژه و محصول</option>
                    <option value="personal">فردی و سلامتی</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">موعد نهایی تحقق (شمسی/تاریخ)</label>
                <input
                  type="text"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  placeholder="مثال: پایان آبان ۱۴۰۵"
                  className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">توضیحات تکمیلی</label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="جزییات، پیش‌نیازها و تعریف موفقیت برای این هدف..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black transition-all shadow-md cursor-pointer"
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
