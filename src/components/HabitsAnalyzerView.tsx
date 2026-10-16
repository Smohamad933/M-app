import React, { useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
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
  CheckCircle2,
  Coffee,
  PlusCircle,
} from 'lucide-react';

export const HabitsAnalyzerView: React.FC = () => {
  const { tasks, currentUser, openCreateModal } = useTask();

  // Filter tasks strictly for the logged-in user
  const userTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter((t) => t.userId === currentUser.id);
  }, [tasks, currentUser]);

  // Compute metrics exclusively for this user
  const analysis = useMemo(() => {
    const total = userTasks.length;
    const completed = userTasks.filter((t) => t.completed).length;

    // Category counts for obstacles logged by THIS user
    const categoryCounts: Record<UncompletedCategory, number> = {
      procrastination: 0,
      others_priority: 0,
      time_shortage: 0,
      low_energy: 0,
      distraction: 0,
      external: 0,
      other: 0,
    };

    userTasks.forEach((t) => {
      if (t.uncompletedCategory && categoryCounts[t.uncompletedCategory] !== undefined) {
        categoryCounts[t.uncompletedCategory]++;
      }
    });

    const totalObstacles = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

    // Real Positive Habits Score based strictly on user completion and focus
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const focusTime = userTasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
    const focusBonus = Math.min(15, Math.round(focusTime / 45) * 5);
    const positiveScore = total > 0 ? Math.min(100, Math.round(completionRate * 0.85 + focusBonus)) : 0;

    // Real Negative Habits Score (ratio of obstacles to total tasks)
    const negativeScore = total > 0 && totalObstacles > 0 
      ? Math.min(100, Math.round((totalObstacles / total) * 100)) 
      : 0;

    // Obstacle breakdown list
    const categoryLabels: Record<UncompletedCategory, { label: string; icon: React.ElementType; color: string; badgeCls: string }> = {
      procrastination: { label: 'اهمال‌کاری و مقاومت ذهنی', icon: Flame, color: 'bg-rose-500', badgeCls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      others_priority: { label: 'اولویت دادن به کارهای دیگران', icon: Users, color: 'bg-amber-500', badgeCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      time_shortage: { label: 'کمبود زمان و خطای تخمین', icon: Clock, color: 'bg-sky-500', badgeCls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
      low_energy: { label: 'خستگی و افت انرژی جسمی/ذهنی', icon: BatteryLow, color: 'bg-indigo-500', badgeCls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
      distraction: { label: 'حواس‌پرتی با موبایل و وب', icon: Smartphone, color: 'bg-purple-500', badgeCls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
      external: { label: 'موانع خارجی و رخدادهای غیرمنتظره', icon: ShieldAlert, color: 'bg-emerald-500', badgeCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
      other: { label: 'سایر موارد', icon: AlertTriangle, color: 'bg-slate-400', badgeCls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    };

    const breakdown = (Object.keys(categoryCounts) as UncompletedCategory[])
      .map((cat) => ({
        cat,
        count: categoryCounts[cat],
        percent: totalObstacles > 0 ? Math.round((categoryCounts[cat] / totalObstacles) * 100) : 0,
        ...categoryLabels[cat],
      }))
      .sort((a, b) => b.count - a.count);

    const dominantObstacle = breakdown[0]?.count > 0 ? breakdown[0] : null;

    return {
      total,
      completed,
      completionRate,
      positiveScore,
      negativeScore,
      totalObstacles,
      breakdown,
      dominantObstacle,
      focusTime,
    };
  }, [userTasks]);

  const userJob = currentUser?.jobTitle || 'متخصص و توسعه‌دهنده';
  const userName = currentUser?.name || 'کاربر گرامی';
  const hasData = analysis.total > 0;

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in select-none" dir="rtl">
      {/* 1. TOP BENTO HEADER */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تحلیلگر هوشمند عادات و رفتار کاری ({userName})
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                تحلیل شناختی اختصاصی
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5 font-medium">
              ارزیابی هوشمند الگوهای رفتاری، درصد تعهد، دلایل تعویق و ارائه برنامه جبرانی شخصی‌سازی‌شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 dark:text-zinc-500 font-bold">عنوان شغلی:</span>
          <span className="text-slate-800 dark:text-zinc-200 font-black bg-slate-100 dark:bg-[#252528] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs">
            {userJob}
          </span>
          {currentUser?.dailyTimeline?.wakeUp && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 font-bold flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>ساعت بیداری: {currentUser.dailyTimeline.wakeUp}</span>
            </span>
          )}
        </div>
      </div>

      {/* ZERO-STATE: If user has not created any tasks yet */}
      {!hasData ? (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-8 sm:p-12 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              هنوز وظیفه‌ای برای تحلیل عادات ثبت نشده است
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 leading-relaxed font-medium">
              سامانه هوشمند تحلیلگر عادات، به محض این که شما کارهای روزانه خود را در بگ تایم ثبت کرده و وضعیت انجام آن‌ها را مشخص کنید، الگوهای تمرکز، میزان اهمال‌کاری و برنامه جبرانی شما را به صورت دقیق استخراج خواهد کرد.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playPop();
                openCreateModal();
              }}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت اولین وظیفه روزانه 🚀</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Positive Habits */}
            <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">شاخص عادت‌های مثبت</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {toPersianDigits(analysis.positiveScore)}٪
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#252528] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${analysis.positiveScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium pt-1">
                {toPersianDigits(analysis.completed)} تسک انجام‌شده از کل {toPersianDigits(analysis.total)}
              </div>
            </div>

            {/* Negative Obstacles */}
            <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">نرخ اصطکاک و تعویق</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {toPersianDigits(analysis.negativeScore)}٪
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#252528] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${analysis.negativeScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium pt-1">
                {toPersianDigits(analysis.totalObstacles)} مانع ثبت‌شده برای کارهای ناتمام
              </div>
            </div>

            {/* Dominant Blocker */}
            <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">مانع رفتاری غالب</span>
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {analysis.dominantObstacle ? analysis.dominantObstacle.label : 'ثبت نشده (عالی)'}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                {analysis.dominantObstacle 
                  ? `${toPersianDigits(analysis.dominantObstacle.percent)}٪ از کل موانع شما` 
                  : 'هیچ مانع تکراری ثبت نشده است'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                {analysis.dominantObstacle ? 'نیاز به تمرکز در برنامه‌ریزی هفتگی' : 'عملکرد بدون انباشتگی'}
              </div>
            </div>

            {/* Deep Focus Time */}
            <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">تمرکز عمیق کاربر</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {toPersianDigits(analysis.focusTime)} <span className="text-xs font-normal">دقیقه</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                {toPersianDigits(Math.round(analysis.focusTime / 60))} ساعت کار بدون وقفه
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                تقویت راندمان با سشن‌های پومودورو
              </div>
            </div>
          </div>

          {/* 3. Obstacle Breakdown & Smart AI Narrative */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Obstacle Breakdown Visual Bars */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>تفکیک آماری دلایل تعویق در کارهای شما</span>
                </h3>
                <span className="text-xs text-slate-400 dark:text-zinc-400 font-bold font-mono">
                  {toPersianDigits(analysis.totalObstacles)} مورد
                </span>
              </div>

              {analysis.totalObstacles === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-zinc-400 text-xs font-medium space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-black text-slate-800 dark:text-zinc-200">هیچ مانع یا دلیلی برای کارهای ناتمام ثبت نشده است.</p>
                  <p className="text-[11px] text-slate-400">تمام کارهای ثبت‌شده به موقع انجام شده‌اند.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {analysis.breakdown.filter((x) => x.count > 0).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.cat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 dark:text-zinc-200 font-bold flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            {item.label}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-zinc-400 font-bold">
                            {toPersianDigits(item.percent)}٪ ({toPersianDigits(item.count)} تسک)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#252528] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: AI Narrative Report */}
            <div className="bg-gradient-to-br from-indigo-500/[0.06] via-white dark:via-[#1c1c1e] to-purple-500/[0.06] rounded-[32px] border border-indigo-500/20 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>تحلیل هوشمند و روانشناسی عملکرد</span>
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black">
                  هوش مصنوعی تحلیلی
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                <p>
                  همکار گرامی <strong className="text-slate-950 dark:text-white font-black">{userName}</strong>؛ با پایش کارهای ثبت‌شده شما در حوزه <span className="text-indigo-600 dark:text-indigo-400 font-black underline decoration-indigo-300 underline-offset-4">{userJob}</span>، 
                  نرخ تعهد و به سرانجام رساندن کارها <span className="text-emerald-600 dark:text-emerald-400 font-black">{toPersianDigits(analysis.completionRate)}٪</span> محاسبه شده است.
                </p>

                {analysis.dominantObstacle?.cat === 'procrastination' && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200">
                    ⚠️ <strong className="text-rose-950 dark:text-rose-100">الگوی رفتاری اصلی شما: مقاومت ذهنی در شروع (اهمال‌کاری)</strong>. 
                    بررسی‌ها نشان می‌دهد کارهایی که در ابتدای روز شروع نمی‌شوند بیش از ۶۰٪ شانس تعویق دارند. خرد کردن هر وظیفه به بخش‌های ۱۰ دقیقه‌ای بلافاصله این اصطکاک را برطرف می‌کند.
                  </div>
                )}

                {analysis.dominantObstacle?.cat === 'others_priority' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    ⚠️ <strong className="text-amber-950 dark:text-amber-100">الگوی رفتاری اصلی شما: اولویت دادن به تقاضاهای دیگران</strong>. 
                    شما معمولاً زمان اختصاصی کار عمیق خود را با پاسخگویی به پیام‌ها و کارهای سایر همکاران معاوضه می‌کنید. توصیه می‌شود ساعات ۹ الی ۱۱ صبح را به عنوان زمان طلایی تمرکز فردی قفل کنید.
                  </div>
                )}

                {analysis.dominantObstacle?.cat === 'distraction' && (
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
                    ⚠️ <strong className="text-purple-950 dark:text-purple-100">الگوی رفتاری اصلی شما: پرش حواس با شبکه‌های اجتماعی و موبایل</strong>. 
                    سوئیچ مداوم بین کارهای فکری و اعلان‌های گوشی موجب خستگی زودهنگام مغز می‌شود. روشن کردن تایمر پومودورو و بستن تب‌های اضافی، کارایی شما را تا ۲ برابر بالا می‌برد.
                  </div>
                )}

                {!analysis.dominantObstacle && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                    ⭐ <strong className="text-emerald-950 dark:text-emerald-100">وضعیت عالی: تعادل و انضباط کامل</strong>. 
                    وظایف شما با ریتم بسیار مناسبی در حال اجرا هستند. با افزایش دقایق تمرکز عمیق پومودورو، رکورد استریک خود را حفظ کنید.
                  </div>
                )}

                <div className="pt-1 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                  💡 این تحلیل با ثبت هر تسک یا ثبت دلیل عدم انجام، به صورت بلادرنگ برای حساب شما به‌روزرسانی می‌شود.
                </div>
              </div>
            </div>
          </div>

          {/* 4. Smart Compensation Plan for Upcoming Weeks */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    برنامه‌ریزی هوشمند جبرانی و تثبیت عادات برای شما
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                    اقدامات پیشنهادی متناسب با راندمان کاری و تخصص {userJob}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  openCreateModal();
                }}
                className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <span>افزودن تسک جبرانی</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-mono font-black">
                    ۱
                  </span>
                  <span>هفته اول: بازیابی ریتم انرژی</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>تنظیم ساعت بیداری و خواب پایدار در پروفایل کاربری</li>
                  <li>شروع روز با انجام چالش‌برانگیزترین تسک در ۹۰ دقیقه اول</li>
                  <li>ثبت ۳۰ دقیقه تمرکز عمیق روزانه با تایمر پومودورو</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-mono font-black">
                    ۲
                  </span>
                  <span>هفته دوم: تصفیه کارهای معوق</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>بستن سریع کارهای ناتمام گذشته با تکنیک سشن‌های فشرده</li>
                  <li>حذف تسک‌های کم‌اهمیتی که بیش از ۲ هفته به تعویق افتاده‌اند</li>
                  <li>تقسیم پروژه‌های بزرگ به بخش‌های مستقل زیر یک ساعته</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-mono font-black">
                    ۳
                  </span>
                  <span>هفته سوم: تثبیت استریک و بهره‌وری</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-zinc-400 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>حفظ زنجیره استریک برای حداقل ۱۴ روز مداوم</li>
                  <li>دریافت یادآوری‌های روزانه در پیام‌رسان بله</li>
                  <li>بررسی هفتگی تحلیلگر عادات جهت مشاهده پیشرفت شاخص‌ها</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
