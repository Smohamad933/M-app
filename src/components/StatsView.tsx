import React from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, PERSIAN_WEEKDAYS_SHORT } from '../utils/persianDate';
import {
  Flame,
  CheckCircle,
  Timer,
  Trophy,
  TrendingUp,
  Lightbulb,
  Award,
} from 'lucide-react';

export const StatsView: React.FC = () => {
  const { tasks, streak } = useTask();

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 120);

  // Generate weekly simulated stats for 7 days
  const today = new Date();
  const weekDaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayIndex = d.getDay();
    const dayLabel = PERSIAN_WEEKDAYS_SHORT[dayIndex];
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const dayTasks = tasks.filter((t) => t.date === iso);
    const dayDone = dayTasks.filter((t) => t.completed).length;
    // fallback simulation for visual richness if starting fresh
    const count = dayTasks.length > 0 ? dayDone : (i % 3 === 0 ? 3 : i % 2 === 0 ? 4 : 2);

    return {
      dayLabel,
      count,
      isToday: iso === getTodayISO(),
    };
  });

  const maxCount = Math.max(...weekDaysData.map((d) => d.count), 5);

  const productivityTips = [
    {
      title: 'قانون ۲ دقیقه',
      text: 'اگر انجام کاری کمتر از ۲ دقیقه طول می‌کشد، همین الان انجامش بده و به بعد موکول نکن.',
    },
    {
      title: 'قورباغه‌ات را قورت بده',
      text: 'سخت‌ترین و مهم‌ترین تسک روزت رو در ساعات اولیه صبح، زمانی که انرژی مغز در بالاترین سطح است انجام بده.',
    },
    {
      title: 'بلوک‌های تمرکز ۲۵ دقیقه‌ای',
      text: 'با تایمر پومودورو، عوامل حواس‌پرتی را حذف کن و تمام تمرکزت را روی یک تک تسک قرار بده.',
    },
  ];

  return (
    <div className="flex-1 p-5 pb-24 overflow-y-auto space-y-4">
      {/* View Header */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          آمار و عملکرد شما
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          بررسی پیوستگی و دستاوردهای روزانه
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/25">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-white" />
              استریک فعالیت روزانه
            </span>
            <span className="text-xs font-medium text-amber-100 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              بهترین رکورد: {toPersianDigits(streak.bestStreak)} روز
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className="text-5xl font-black font-sans tracking-tight">
              {toPersianDigits(streak.currentStreak)}
            </span>
            <span className="text-lg font-bold">روز متوالی</span>
          </div>

          <p className="text-xs text-amber-100/90 leading-relaxed max-w-xs mt-1">
            آفرین! شما {toPersianDigits(streak.currentStreak)} روز است که بدون وقفه کارهایتان را به سرانجام می‌رسانید. ادامه بده! 🔥
          </p>
        </div>

        {/* Ambient flame background decoration */}
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-1.5">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100">
            {toPersianDigits(totalCompleted)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            تسک تکمیل‌شده
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-1.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100">
            {toPersianDigits(overallRate)}٪
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            نرخ بهره‌وری
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-1.5">
            <Timer className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100">
            {toPersianDigits(Math.round(totalFocusMinutes / 60))}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            ساعت تمرکز عمیق
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" />
            فعالیت هفتگی (کارهای انجام‌شده)
          </h3>
          <span className="text-[10px] text-slate-400">۷ روز گذشته</span>
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1">
          {weekDaysData.map((d, idx) => {
            const heightPercent = Math.max((d.count / maxCount) * 100, 15);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-500">
                  {toPersianDigits(d.count)}
                </span>
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-700/60 rounded-xl h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      d.isToday
                        ? 'bg-indigo-600 dark:bg-indigo-500 shadow-xs'
                        : 'bg-indigo-400/80 dark:bg-indigo-700/80'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    d.isToday
                      ? 'font-bold text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400'
                  }`}
                >
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Productivity Tips */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          توصیه‌های طلایی افزایش بهره‌وری
        </h3>

        <div className="space-y-2">
          {productivityTips.map((tip, i) => (
            <div
              key={i}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1"
            >
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                💡 {tip.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
