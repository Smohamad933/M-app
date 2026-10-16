import React, { useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, PERSIAN_WEEKDAYS_SHORT, formatAppDate } from '../utils/persianDate';
import {
  Flame,
  CheckCircle2,
  Timer,
  Trophy,
  TrendingUp,
  Lightbulb,
  Award,
  CalendarDays,
  Target,
  Zap,
} from 'lucide-react';

export const StatsView: React.FC = () => {
  const { tasks, streak, calendarType } = useTask();

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);

  const today = new Date();
  const weekDaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayIndex = d.getDay();
    const dayLabel = PERSIAN_WEEKDAYS_SHORT[dayIndex];
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const dayTasks = tasks.filter((t) => t.date === iso);
    const dayDone = dayTasks.filter((t) => t.completed).length;

    return {
      dayLabel,
      count: dayDone,
      isToday: iso === getTodayISO(),
      iso,
    };
  });

  const maxCount = Math.max(...weekDaysData.map((d) => d.count), 4);

  // 60-Day Productivity Heatmap
  const sixtyDaysData = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (59 - i));
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const doneCount = tasks.filter((t) => t.date === iso && t.completed).length;
      return {
        iso,
        count: doneCount,
        isToday: iso === getTodayISO(),
      };
    });
  }, [tasks]);

  const productivityTips = [
    {
      title: 'قانون ۲ دقیقه (Two-Minute Rule)',
      text: 'اگر انجام کاری کمتر از ۲ دقیقه زمان می‌برد، فوراً انجامش بده و در فهرست کارهای بعدی قرار نده.',
    },
    {
      title: 'قورباغه‌ات را اول وقت قورت بده',
      text: 'سخت‌ترین و کلیدی‌ترین کار روزت را صبح اول وقت، قبل از شروع هر کار دیگری به پایان برسان.',
    },
    {
      title: 'تمرکز عمیق بدون وقفه (Deep Work)',
      text: 'در فواصل ۲۵ دقیقه‌ای پومودورو، تمام اعلان‌ها و نوتیفیکیشن‌های موبایل و وب را قطع کنید.',
    },
    {
      title: 'قانون ۸۰/۲۰ پارتو',
      text: '۸۰ درصد دستاوردهای حرفه‌ای شما حاصل ۲۰ درصد از مهم‌ترین تلاش‌های متمرکزتان هستند.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-20 select-none w-full" dir="rtl">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                گزارش عملکرد، راندمان و آمار فعالیت
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                تحلیل جامع
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5 font-medium">
              پایش دستاوردهای روزانه، ساعات تمرکز عمیق، استریک فعالیت و نقشه پیوستگی ۶۰ روزه
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold bg-slate-50 dark:bg-[#252528] px-3.5 py-2 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
          <span>امروز: </span>
          <span className="text-slate-900 dark:text-white font-black">{formatAppDate(getTodayISO(), calendarType, 'full')}</span>
        </div>
      </div>

      {/* 2. Streak Hero Bento Box */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-[#1c1c1e] to-black text-white rounded-[32px] shadow-lg border border-white/10 space-y-4 relative overflow-hidden">
        {/* Animated Glow Lights */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between flex-wrap gap-2 relative z-10">
          <span className="text-xs font-black px-3.5 py-1.5 rounded-2xl bg-white/10 text-white border border-white/10 flex items-center gap-2 shadow-xs">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>استریک فعالیت روزانه</span>
          </span>
          <span className="text-xs text-amber-300 font-black flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>بهترین رکورد شما: {toPersianDigits(streak.bestStreak)} روز</span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 pt-2 relative z-10">
          <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
            {toPersianDigits(streak.currentStreak)}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-300">روز پیوسته و مداوم</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-md font-medium relative z-10">
          پیوستگی مداوم کلید اصلی تسلط و بهره‌وری است. با ثبت و انجام حداقل ۱ کار در هر روز، آتش استریک خود را روشن نگه دارید.
        </p>
      </div>

      {/* 3. 4 Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">تسک‌های انجام‌شده</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {toPersianDigits(totalCompleted)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            از مجموع {toPersianDigits(totalTasks)} تسک
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">نرخ بهره‌وری کلی</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {toPersianDigits(overallRate)}٪
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold">
            نرخ تحقق برنامه‌ها
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">ساعات تمرکز عمیق</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {toPersianDigits(Math.round(totalFocusMinutes / 60))} <span className="text-xs font-normal">ساعت</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold">
            {toPersianDigits(totalFocusMinutes)} دقیقه پومودورو
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">ثبت بر اساس ددلاین</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {toPersianDigits(tasks.filter((t) => t.time).length)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold">
            وظایف زمان‌بندی‌شده
          </div>
        </div>
      </div>

      {/* 4. 60-Day Productivity Heatmap */}
      <div className="p-5 sm:p-7 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                نقشه پیوستگی و فعالیت ۶۰ روز گذشته (Activity Heatmap)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                تداوم تلاش‌های روزانه شما؛ هر مربع پررنگ‌تر نشان‌دهنده تسک‌های بیشتر انجام شده است
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
            <span>کمتر</span>
            <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-[#252528]" />
            <span className="w-3 h-3 rounded-md bg-emerald-300 dark:bg-emerald-800/60" />
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span className="w-3 h-3 rounded-md bg-emerald-600 dark:bg-emerald-400" />
            <span>بیشتر</span>
          </div>
        </div>

        <div className="pt-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="grid grid-rows-6 grid-flow-col gap-2 min-w-[580px]">
            {sixtyDaysData.map((d, i) => {
              let bg = 'bg-slate-100 dark:bg-[#252528]';
              if (d.count >= 5) bg = 'bg-emerald-600 dark:bg-emerald-400';
              else if (d.count >= 3) bg = 'bg-emerald-500';
              else if (d.count >= 1) bg = 'bg-emerald-300 dark:bg-emerald-700/80';

              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-lg transition-all hover:scale-125 cursor-pointer relative group ${bg} ${
                    d.isToday ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-[#1c1c1e]' : ''
                  }`}
                  title={`${d.iso}: ${toPersianDigits(d.count)} تسک انجام‌شده`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Weekly Activity Chart */}
      <div className="p-5 sm:p-7 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>نمودار فعالیت هفتگی (۷ روز اخیر)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold font-mono">میانگین روزانه</span>
        </div>

        <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
          {weekDaysData.map((d, idx) => {
            const heightPercent = Math.max((d.count / maxCount) * 100, 12);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-black text-slate-400 font-mono">
                  {toPersianDigits(d.count)}
                </span>
                <div className="w-full max-w-[36px] bg-slate-100 dark:bg-[#252528] rounded-2xl h-full flex items-end overflow-hidden p-1">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      d.isToday
                        ? 'bg-slate-900 dark:bg-white shadow-xs'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-black ${
                    d.isToday ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                >
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Productivity Tips */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 px-1">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>اصول طلایی بهره‌وری و مدیریت زمان</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {productivityTips.map((tip, i) => (
            <div
              key={i}
              className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-1.5 hover:border-black/20 dark:hover:border-white/20 transition-all"
            >
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{tip.title}</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
