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
      procrastination: { label: 'اهمال‌کاری و مقاومت ذهنی', icon: Flame, color: 'bg-rose-500', badgeCls: 'bg-rose-50 text-rose-700 border-rose-200' },
      others_priority: { label: 'اولویت دادن به کارهای دیگران', icon: Users, color: 'bg-amber-500', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200' },
      time_shortage: { label: 'کمبود زمان و خطای تخمین', icon: Clock, color: 'bg-sky-500', badgeCls: 'bg-sky-50 text-sky-700 border-sky-200' },
      low_energy: { label: 'خستگی و افت انرژی جسمی/ذهنی', icon: BatteryLow, color: 'bg-indigo-500', badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      distraction: { label: 'حواس‌پرتی با موبایل و وب', icon: Smartphone, color: 'bg-purple-500', badgeCls: 'bg-purple-50 text-purple-700 border-purple-200' },
      external: { label: 'موانع خارجی و رخدادهای غیرمنتظره', icon: ShieldAlert, color: 'bg-emerald-500', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      other: { label: 'سایر موارد', icon: AlertTriangle, color: 'bg-slate-400', badgeCls: 'bg-slate-50 text-slate-700 border-slate-200' },
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
    <div className="space-y-6 animate-in fade-in pb-16" dir="rtl">
      {/* 1. Header Banner - Pure Light Mode */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Brain className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                تحلیلگر هوشمند عادات و رفتار کاری ({userName})
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                تحلیل اختصاصی کاربر
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ارزیابی اختصاصی الگوهای رفتاری، درصد تعهد و ارائه برنامه جبرانی شخصی‌سازی‌شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold">عنوان شغلی:</span>
          <span className="text-slate-800 font-extrabold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            {userJob}
          </span>
          {currentUser?.dailyTimeline?.wakeUp && (
            <span className="text-[11px] text-slate-600 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/70 font-bold flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>بیداری: {currentUser.dailyTimeline.wakeUp}</span>
            </span>
          )}
        </div>
      </div>

      {/* ZERO-STATE: If user has not created any tasks yet */}
      {!hasData ? (
        <div className="bg-white rounded-[28px] p-8 sm:p-12 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">
              هنوز وظیفه‌ای برای تحلیل عادات ثبت نشده است
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              سامانه هوشمند تحلیلگر عادات، به محض این که شما کارهای روزانه خود را در بگ تایم ثبت کرده و وضعیت انجام آن‌ها را مشخص کنید، الگوهای تمرکز، میزان اهمال‌کاری و برنامه جبرانی شما را به صورت دقیق استخراج خواهد کرد.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => openCreateModal()}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت اولین وظیفه روزانه 🚀</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Key Metrics Bento Grid - Light Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Positive Habits */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold text-slate-600">شاخص عادت‌های مثبت</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-emerald-600">
                {toPersianDigits(analysis.positiveScore)}٪
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${analysis.positiveScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                {toPersianDigits(analysis.completed)} تسک انجام‌شده از کل {toPersianDigits(analysis.total)}
              </div>
            </div>

            {/* Negative Obstacles */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-xs font-bold text-slate-600">نرخ موانع و تعویق</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-rose-600">
                {toPersianDigits(analysis.negativeScore)}٪
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${analysis.negativeScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                {toPersianDigits(analysis.totalObstacles)} مانع ثبت‌شده برای کارهای ناتمام
              </div>
            </div>

            {/* Dominant Blocker */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold text-slate-600">مانع رفتاری غالب</span>
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                {analysis.dominantObstacle ? analysis.dominantObstacle.label : 'ثبت نشده (عالی)'}
              </div>
              <div className="text-[11px] text-amber-700 font-bold">
                {analysis.dominantObstacle 
                  ? `${toPersianDigits(analysis.dominantObstacle.percent)}٪ از کل موانع شما` 
                  : 'هیچ مانع تکراری ثبت نشده است'}
              </div>
              <div className="text-[10px] text-slate-400">
                {analysis.dominantObstacle ? 'نیاز به تمرکز در برنامه‌ریزی هفتگی' : 'عملکرد بدون انباشتگی'}
              </div>
            </div>

            {/* Deep Focus Time */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex items-center justify-between text-purple-600">
                <span className="text-xs font-bold text-slate-600">تمرکز عمیق کاربر</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {toPersianDigits(analysis.focusTime)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                دقیقه تمرکز عمیق ثبت‌شده
              </div>
              <div className="text-[10px] text-slate-400">
                تقویت راندمان با سشن‌های پومودورو
              </div>
            </div>
          </div>

          {/* 3. Obstacle Breakdown & Smart AI Narrative */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Obstacle Breakdown Visual Bars */}
            <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>تفکیک آماری دلایل تعویق در کارهای شما</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {toPersianDigits(analysis.totalObstacles)} مورد ثبت‌شده
                </span>
              </div>

              {analysis.totalObstacles === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-medium space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>هیچ مانع یا دلیل ناتمام ماندنی برای تسک‌های شما ثبت نشده است.</p>
                  <p className="text-[11px] text-slate-400">تمام کارهای ثبت‌شده به موقع انجام شده‌اند یا دلیلی ثبت نگردیده است.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {analysis.breakdown.filter((x) => x.count > 0).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.cat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-bold flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            {item.label}
                          </span>
                          <span className="font-mono text-slate-500 font-bold">
                            {toPersianDigits(item.percent)}٪ ({toPersianDigits(item.count)} تسک)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
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
            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 rounded-[28px] border border-indigo-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>تحلیل هوشمند و روانشناسی عملکرد شما</span>
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black">
                  پردازش اختصاصی هوش مصنوعی
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
                <p>
                  همکار گرامی <strong className="text-slate-950 font-black">{userName}</strong>؛ با پایش کارهای ثبت‌شده شما در حوزه <span className="text-indigo-600 font-black underline decoration-indigo-300 underline-offset-4">{userJob}</span>، 
                  نرخ تعهد و به سرانجام رساندن کارها <span className="text-emerald-600 font-black">{toPersianDigits(analysis.completionRate)}٪</span> محاسبه شده است.
                </p>

                {analysis.dominantObstacle?.cat === 'procrastination' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                    ⚠️ <strong className="text-rose-950">الگوی رفتاری اصلی شما: مقاومت ذهنی در شروع (اهمال‌کاری)</strong>. 
                    بررسی‌ها نشان می‌دهد کارهایی که در ابتدای روز شروع نمی‌شوند بیش از ۶۰٪ شانس تعویق دارند. خرد کردن هر وظیفه به بخش‌های ۱۰ دقیقه‌ای بلافاصله این اصطکاک را برطرف می‌کند.
                  </div>
                )}

                {analysis.dominantObstacle?.cat === 'others_priority' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                    ⚠️ <strong className="text-amber-950">الگوی رفتاری اصلی شما: اولویت دادن به تقاضاهای دیگران</strong>. 
                    شما معمولاً زمان اختصاصی کار عمیق خود را با پاسخگویی به پیام‌ها و کارهای سایر همکاران معاوضه می‌کنید. توصیه می‌شود ساعات ۹ الی ۱۱ صبح را به عنوان زمان طلایی تمرکز فردی قفل کنید.
                  </div>
                )}

                {analysis.dominantObstacle?.cat === 'distraction' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900">
                    ⚠️ <strong className="text-purple-950">الگوی رفتاری اصلی شما: پرش حواس با شبکه‌های اجتماعی و موبایل</strong>. 
                    سوئیچ مداوم بین کارهای فکری و اعلان‌های گوشی موجب خستگی زودهنگام مغز می‌شود. روشن کردن تایمر پومودورو و بستن تب‌های اضافی، کارایی شما را تا ۲ برابر بالا می‌برد.
                  </div>
                )}

                {!analysis.dominantObstacle && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    ⭐ <strong className="text-emerald-950">وضعیت عالی: تعادل و انضباط کامل</strong>. 
                    وظایف شما با ریتم بسیار مناسبی در حال اجرا هستند. با افزایش دقایق تمرکز عمیق پومودورو، رکورد استریک خود را حفظ کنید.
                  </div>
                )}

                <div className="pt-1 text-[11px] text-slate-500 font-medium">
                  💡 این تحلیل با ثبت هر تسک یا ثبت دلیل عدم انجام، به صورت بلادرنگ برای اکانت شما به‌روزرسانی می‌شود.
                </div>
              </div>
            </div>
          </div>

          {/* 4. Smart Compensation Plan for Upcoming Weeks */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    برنامه‌ریزی هوشمند جبرانی و تثبیت عادات برای شما
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    اقدامات پیشنهادی متناسب با راندمان کاری و تخصص {userJob}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openCreateModal()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <span>افزودن تسک جبرانی</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px] font-black">
                    ۱
                  </span>
                  <span>هفته اول: بازیابی ریتم انرژی</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>تنظیم ساعت بیداری و خواب پایدار در پروفایل کاربری</li>
                  <li>شروع روز با انجام چالش‌برانگیزترین تسک در ۹۰ دقیقه اول</li>
                  <li>ثبت ۳۰ دقیقه تمرکز عمیق روزانه با تایمر پومودورو</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-black">
                    ۲
                  </span>
                  <span>هفته دوم: تصفیه کارهای معوق</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>بستن سریع کارهای ناتمام گذشته با تکنیک سشن‌های فشرده</li>
                  <li>حذف تسک‌های کم‌اهمیتی که بیش از ۲ هفته به تعویق افتاده‌اند</li>
                  <li>تقسیم پروژه‌های بزرگ به بخش‌های مستقل زیر یک ساعته</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-black">
                    ۳
                  </span>
                  <span>هفته سوم: تثبیت استریک و بهره‌وری</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pr-2 list-disc list-inside leading-relaxed font-medium">
                  <li>حفظ زنجیره استریک برای حداقل ۱۴ روز مداوم</li>
                  <li>دریافت نوتیفیکیشن‌های یادآوری روزانه در پیام‌رسان بله</li>
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
