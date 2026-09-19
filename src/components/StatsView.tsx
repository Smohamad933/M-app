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
    };
  });

  const maxCount = Math.max(...weekDaysData.map((d) => d.count), 4);

  const productivityTips = [
    {
      title: 'قانون ۲ دقیقه',
      text: 'اگر انجام کاری کمتر از ۲ دقیقه زمان می‌برد، فوراً انجامش بده و در فهرست کارهای بعدی قرار نده.',
    },
    {
      title: 'اولویت‌بندی قورباغه‌ات را قورت بده',
      text: 'سخت‌ترین و کلیدی‌ترین کار روزت را صبح اول وقت، قبل از شروع هر کار دیگری به پایان برسان.',
    },
    {
      title: 'تمرکز عمیق بدون وقفه',
      text: 'در فواصل ۲۵ دقیقه‌ای پومودورو، تمام اعلان‌ها و نوتیفیکیشن‌ها را قطع کنید.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-base font-black text-white">
          آمار عملکرد و بهره‌وری
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          تحلیل دستاوردهای روزانه و استریک فعالیت شما
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="p-6 bg-zinc-900/70 rounded-3xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            استریک فعالیت روزانه
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            بهترین رکورد: {toPersianDigits(streak.bestStreak)} روز
          </span>
        </div>

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-5xl font-black text-white tracking-tight">
            {toPersianDigits(streak.currentStreak)}
          </span>
          <span className="text-base font-bold text-zinc-400">روز متوالی</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
          پیوستگی کلید موفقیت است؛ انجام مداوم کارهای کوچک نتایج بزرگی در طول زمان می‌سازد.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-white">
            {toPersianDigits(totalCompleted)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">تسک تکمیل‌شده</div>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-200 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-white">
            {toPersianDigits(overallRate)}٪
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">نرخ بهره‌وری</div>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Timer className="w-4 h-4" />
          </div>
          <div className="text-xl font-black text-white">
            {toPersianDigits(Math.round(totalFocusMinutes / 60))}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">ساعت تمرکز</div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-zinc-400" />
            فعالیت هفتگی
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono">۷ روز اخیر</span>
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1">
          {weekDaysData.map((d, idx) => {
            const heightPercent = Math.max((d.count / maxCount) * 100, 10);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-zinc-400">
                  {toPersianDigits(d.count)}
                </span>
                <div className="w-full max-w-[28px] bg-zinc-800 rounded-xl h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      d.isToday
                        ? 'bg-white shadow-xs'
                        : 'bg-zinc-600'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    d.isToday ? 'font-bold text-white' : 'text-zinc-500'
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
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          توصیه‌های بهبود مدیریت زمان
        </h3>

        <div className="space-y-2">
          {productivityTips.map((tip, i) => (
            <div
              key={i}
              className="p-3.5 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 space-y-1"
            >
              <h4 className="text-xs font-bold text-white">
                💡 {tip.title}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
