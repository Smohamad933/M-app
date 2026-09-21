import React, { useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import type { UncompletedCategory } from '../types';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Flame,
  Users,
  Clock,
  BatteryLow,
  Smartphone,
  ShieldAlert,
  Brain,
  ArrowRight,
  Target,
} from 'lucide-react';

export const HabitsAnalyzerView: React.FC = () => {
  const { tasks, currentUser, openCreateModal } = useTask();

  // Analyze all tasks or current month's tasks
  const analysis = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    
    // Category counts
    const categoryCounts: Record<UncompletedCategory, number> = {
      procrastination: 0,
      others_priority: 0,
      time_shortage: 0,
      low_energy: 0,
      distraction: 0,
      external: 0,
      other: 0,
    };

    tasks.forEach((t) => {
      if (t.uncompletedCategory && categoryCounts[t.uncompletedCategory] !== undefined) {
        categoryCounts[t.uncompletedCategory]++;
      }
    });

    const totalObstacles = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

    // Calculate Positive Habits Score (0 - 100)
    const completionRate = total > 0 ? (completed / total) * 100 : 70;
    const focusTime = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
    const focusBonus = Math.min(20, Math.round(focusTime / 30) * 5);
    const positiveScore = Math.min(100, Math.round(completionRate * 0.8 + focusBonus));

    // Calculate Negative Habits Score (Obstacles severity)
    const negativeScore = totalObstacles > 0 ? Math.min(100, Math.round((totalObstacles / Math.max(1, total)) * 100)) : 15;

    // Obstacle breakdown list
    const categoryLabels: Record<UncompletedCategory, { label: string; icon: React.ElementType; color: string }> = {
      procrastination: { label: 'اهمال‌کاری و مقاومت ذهنی', icon: Flame, color: 'bg-rose-500 text-rose-400' },
      others_priority: { label: 'اولویت دادن به کارهای دیگران', icon: Users, color: 'bg-amber-500 text-amber-400' },
      time_shortage: { label: 'کمبود زمان و خطای تخمین', icon: Clock, color: 'bg-sky-500 text-sky-400' },
      low_energy: { label: 'خستگی و افت انرژی جسمی/ذهنی', icon: BatteryLow, color: 'bg-indigo-500 text-indigo-400' },
      distraction: { label: 'حواس‌پرتی با موبایل و وب', icon: Smartphone, color: 'bg-purple-500 text-purple-400' },
      external: { label: 'موانع خارجی و رخدادهای غیرمنتظره', icon: ShieldAlert, color: 'bg-emerald-500 text-emerald-400' },
      other: { label: 'سایر موارد', icon: AlertTriangle, color: 'bg-zinc-500 text-zinc-400' },
    };

    const breakdown = (Object.keys(categoryCounts) as UncompletedCategory[])
      .map((cat) => ({
        cat,
        count: categoryCounts[cat],
        percent: totalObstacles > 0 ? Math.round((categoryCounts[cat] / totalObstacles) * 100) : 0,
        ...categoryLabels[cat],
      }))
      .sort((a, b) => b.count - a.count);

    // Primary dominant obstacle
    const dominantObstacle = breakdown[0]?.count > 0 ? breakdown[0] : null;

    return {
      total,
      completed,
      positiveScore,
      negativeScore,
      totalObstacles,
      breakdown,
      dominantObstacle,
      focusTime,
    };
  }, [tasks]);

  const userJob = currentUser?.jobTitle || 'متخصص و توسعه‌دهنده';

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* 1. Header Banner */}
      <div className="bg-zinc-900/70 p-5 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                سیستم تحلیل هوش مصنوعی عادت‌ها (AI Habits Analyzer)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                تحلیلگر ماهانه و هفتگی
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              شناسایی الگوهای رفتاری، درصد اهمال‌کاری و ارائه برنامه‌ریزی هوشمندانه جبرانی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>شغل ثبت‌شده:</span>
          <span className="text-white font-bold bg-zinc-800 px-2.5 py-1 rounded-xl border border-zinc-700/60">
            {userJob}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Positive Habits */}
        <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold text-zinc-300">شاخص عادت‌های مثبت</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {toPersianDigits(analysis.positiveScore)}٪
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${analysis.positiveScore}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-2">
            تکمیل وظایف و تعهد به برنامه‌ریزی
          </div>
        </div>

        {/* Negative Obstacles */}
        <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold text-zinc-300">موانع پیشرفت و تعویق</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-rose-400">
            {toPersianDigits(analysis.negativeScore)}٪
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${analysis.negativeScore}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-2">
            اهمال‌کاری، حواس‌پرتی و فرسودگی
          </div>
        </div>

        {/* Dominant Blocker */}
        <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold text-zinc-300">بزرگ‌ترین مانع رفتاری</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-base font-black text-white truncate mt-1">
            {analysis.dominantObstacle ? analysis.dominantObstacle.label : 'ثبت نشده (عملکرد عالی)'}
          </div>
          <div className="text-[11px] text-amber-400 mt-2 font-bold">
            {analysis.dominantObstacle ? `${toPersianDigits(analysis.dominantObstacle.percent)}٪ از کل دلایل عدم انجام` : 'هیچ مانع تکرارشونده‌ای نیست'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            نیاز به مدیریت آگاهانه در هفته‌های آتی
          </div>
        </div>

        {/* Deep Focus Time */}
        <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold text-zinc-300">تمرکز عمیق ثبت‌شده</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-white">
            {toPersianDigits(analysis.focusTime)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">
            دقیقه در تایمر پومودورو
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            میانگین {toPersianDigits(Math.round(analysis.focusTime / 7))} دقیقه در روز
          </div>
        </div>
      </div>

      {/* 3. Obstacle Breakdown & Smart AI Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Obstacle Breakdown Visual Bars */}
        <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              تفکیک آماری دلایل عدم انجام تسک‌ها
            </h3>
            <span className="text-[11px] text-zinc-400">
              {toPersianDigits(analysis.totalObstacles)} مانع ثبت‌شده
            </span>
          </div>

          <div className="space-y-3.5">
            {analysis.breakdown.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      {item.label}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {toPersianDigits(item.percent)}٪ ({toPersianDigits(item.count)} مورد)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color.split(' ')[0]}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Narrative Report */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-purple-950/30 rounded-3xl border border-indigo-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              تحلیل هوشمند و روانشناسی عملکرد شما
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
              تولید خودکار هوش مصنوعی
            </span>
          </div>

          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-medium">
            <p>
              با بررسی داده‌های ماه جاری و تسک‌های ثبت‌شده برای تخصص <span className="text-white font-black underline decoration-indigo-500 underline-offset-4">{userJob}</span>، 
              نرخ اجرای کارها <span className="text-emerald-400 font-bold">{toPersianDigits(analysis.positiveScore)}٪</span> است که نشان‌دهنده ظرفیت بالای شما برای خروجی مؤثر است.
            </p>

            {analysis.dominantObstacle?.cat === 'procrastination' && (
              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-200">
                ⚠️ <strong className="text-white">الگوی غالب: مقاومت در شروع (اهمال‌کاری)</strong>. 
                ذهن شما معمولاً کارهای بزرگ و مبهم را تهدید تلقی کرده و به سمت لذت‌های کوتاه‌مدت فرار می‌کند. خرد کردن کارها به زیرتسک‌های ۵ دقیقه‌ای بلافاصله این اصطکاک را از بین می‌برد.
              </div>
            )}

            {analysis.dominantObstacle?.cat === 'others_priority' && (
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
                ⚠️ <strong className="text-white">الگوی غالب: اولویت دادن به کارهای دیگران</strong>. 
                شما وقت باارزش خود را فدای پاسخگویی سریع به دیگران می‌کنید. پیشنهاد می‌شود ۲ ساعت اول صبح را به کارهای اختصاصی خود ببندید و درهای ارتباطی را قطع کنید.
              </div>
            )}

            {analysis.dominantObstacle?.cat === 'distraction' && (
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-purple-200">
                ⚠️ <strong className="text-white">الگوی غالب: حواس‌پرتی با موبایل و اینترنت</strong>. 
                پرش‌های مداوم توجه انرژی مغز را تحلیل می‌برد. استفاده از قابلیت Focus Room گروهی و قرار دادن گوشی در اتاق دیگر بهره‌وری شما را تا دو برابر ارتقا می‌دهد.
              </div>
            )}

            <p className="text-[11px] text-zinc-400 pt-1">
              💡 تحلیلگر در پایان هر ماه گزارش تفصیلی از تبدیل عادات منفی به مثبت ثبت کرده و درصد تغییرات را ارزیابی می‌کند.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Smart Compensation Plan for Upcoming Weeks */}
      <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">
                برنامه‌ریزی هوشمندانه برای جبران در هفته‌های آینده
              </h3>
              <p className="text-[11px] text-zinc-400">
                اقدامات عملی گام‌به‌گام برای افزایش راندمان و جبران عقب‌افتادگی‌های ماه جاری
              </p>
            </div>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>افزودن تسک جبرانی</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black">
                ۱
              </span>
              <span>هفته اول: بازیابی ریتم انرژی</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
              <li>قفل کردن تایم‌لاین صبحگاهی (بیداری سر وقت و نوشیدن آب)</li>
              <li>انجام مهم‌ترین تسک روز در ۹۰ دقیقه ابتدایی کاری</li>
              <li>ممنوعیت استفاده از شبکه‌های اجتماعی قبل از اتمام اولین تسک</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-black">
                ۲
              </span>
              <span>هفته دوم: تصفیه کارهای انباشته</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
              <li>اختصاص یک سشن پومودورو برای بستن خرده‌کارهای ناتمام</li>
              <li>حذف یا برون‌سپاری کارهای کم‌ارزشی که بیش از ۲ هفته به تعویق افتاده‌اند</li>
              <li>گفتن «نه» به پروژه‌ها یا قرارهای غیرضروری خارج از اهداف</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black">
                ۳
              </span>
              <span>هفته سوم و چهارم: تثبیت استریک و اهداف</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed">
              <li>حفظ زنجیره استریک متوالی برای حداقل ۱۴ روز پیوسته</li>
              <li>برگزاری ۲ جلسه تمرکز عمیق گروهی در هفته با اعضای تیم</li>
              <li>ثبت ارزیابی هفتگی در بخش یادداشت‌های دیلی پلنر</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
