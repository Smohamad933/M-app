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
    <div className="space-y-5 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900">
          آمار عملکرد و بهره‌وری
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          تحلیل دستاوردهای روزانه، ساعات تمرکز و استریک فعالیت شما
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="p-6 bg-[#121212] text-white rounded-[28px] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#f95738] fill-[#f95738] animate-pulse" />
            استریک فعالیت روزانه
          </span>
          <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            بهترین رکورد: {toPersianDigits(streak.bestStreak)} روز
          </span>
        </div>

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-5xl font-black text-white tracking-tight">
            {toPersianDigits(streak.currentStreak)}
          </span>
          <span className="text-base font-bold text-slate-300">روز متوالی</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
          پیوستگی کلید موفقیت است؛ انجام مداوم کارهای کوچک نتایج بزرگی در طول زمان می‌سازد.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-1">
          <div className="w-9 h-9 rounded-2xl bg-[#00b884]/15 text-[#00895f] flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {toPersianDigits(totalCompleted)}
          </div>
          <div className="text-xs text-slate-400 font-bold">تسک تکمیل‌شده</div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-1">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {toPersianDigits(overallRate)}٪
          </div>
          <div className="text-xs text-slate-400 font-bold">نرخ بهره‌وری</div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-1">
          <div className="w-9 h-9 rounded-2xl bg-[#f95738]/15 text-[#f95738] flex items-center justify-center mx-auto mb-2">
            <Timer className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {toPersianDigits(Math.round(totalFocusMinutes / 60))}
          </div>
          <div className="text-xs text-slate-400 font-bold">ساعت تمرکز</div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="p-5 sm:p-6 bg-white rounded-[28px] border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#00b884]" />
            <span>فعالیت هفتگی</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold font-mono">۷ روز اخیر</span>
        </div>

        <div className="h-36 flex items-end justify-between gap-2 sm:gap-3 pt-4 px-2">
          {weekDaysData.map((d, idx) => {
            const heightPercent = Math.max((d.count / maxCount) * 100, 10);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-black text-slate-400">
                  {toPersianDigits(d.count)}
                </span>
                <div className="w-full max-w-[32px] bg-slate-100 pattern-hatched rounded-2xl h-full flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      d.isToday
                        ? 'bg-[#121212] shadow-xs'
                        : 'bg-[#00b884]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-black ${
                    d.isToday ? 'text-slate-900' : 'text-slate-400'
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
        <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>توصیه‌های بهبود مدیریت زمان</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {productivityTips.map((tip, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors"
            >
              <h4 className="text-xs font-black text-slate-800">
                💡 {tip.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
