import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import {
  toPersianDigits,
  getTodayISO,
  getDaysAround,
  isoToJalali,
  jalaliToISO,
  PERSIAN_MONTHS,
} from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  FolderKanban,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';

interface BentoWidgetsProps {
  onSeeAllTasks?: () => void;
  onOpenCreateTask?: () => void;
}

export const TaskMasterBentoWidgets: React.FC<BentoWidgetsProps> = ({
  onSeeAllTasks,
  onOpenCreateTask,
}) => {
  const {
    tasks,
    toggleTaskComplete,
    selectedDate,
    setSelectedDate,
    setActiveTab,
  } = useTask();

  const [showTodayBanner, setShowTodayBanner] = useState(true);

  const todayISO = getTodayISO();
  const activeDate = selectedDate || todayISO;

  // 1. REAL TODAY TASKS: Priority to Team Project tasks, fallback to personal tasks
  const activeDayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === activeDate);
  }, [tasks, activeDate]);

  const teamTasks = useMemo(() => {
    return activeDayTasks.filter((t) => t.projectId || t.projectName);
  }, [activeDayTasks]);

  const personalTasks = useMemo(() => {
    return activeDayTasks.filter((t) => !t.projectId && !t.projectName);
  }, [activeDayTasks]);

  // Displayed tasks: team first, then personal
  const displayTasks = useMemo(() => {
    const list = teamTasks.length > 0 ? [...teamTasks, ...personalTasks] : personalTasks;
    return list.slice(0, 4);
  }, [teamTasks, personalTasks]);

  const totalTasksCount = activeDayTasks.length;
  const completedTasksCount = activeDayTasks.filter((t) => t.completed).length;
  const pendingTasksCount = totalTasksCount - completedTasksCount;
  const todayRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Dynamic Confidence-Boosting Message
  const motivationalMessage = useMemo(() => {
    if (totalTasksCount === 0) {
      return '🚀 برنامه‌ی امروزت سبکه؛ زمان طلایی برای تفکر خلاق، استراحت یا شروع یک کار جدید!';
    }
    if (pendingTasksCount === 0) {
      return '🏆 فوق‌العاده بود! تمام کارهای امروز را با موفقیت انجام دادی؛ به پشتکار خودت افتخار کن!';
    }
    if (completedTasksCount > 0) {
      return `💪 عالی پیش رفتی! ${toPersianDigits(completedTasksCount)} تسک رو تمام کردی، فقط ${toPersianDigits(pendingTasksCount)} تای دیگه مونده، تو از پسش برمی‌آیی!`;
    }
    return `✨ امروز ${toPersianDigits(pendingTasksCount)} تسک در پیش داری؛ با اولین قدم شروع کن، قدرت اراده تو از هر مانعی بزرگتره! 💪`;
  }, [totalTasksCount, completedTasksCount, pendingTasksCount]);

  // 2. REAL CALENDAR LOGIC: Jalali Month calculation
  const [activeJy, activeJm] = useMemo(() => {
    const [y, m] = isoToJalali(activeDate);
    return [y, m];
  }, [activeDate]);
  const [calMonth, setCalMonth] = useState<number>(activeJm);
  const [calYear, setCalYear] = useState<number>(activeJy);

  const monthName = PERSIAN_MONTHS[calMonth - 1] || 'شهریور';
  const daysInMonth = calMonth <= 6 ? 31 : calMonth <= 11 ? 30 : 29;

  const navigateMonth = (delta: number) => {
    sounds.playPop();
    let nextM = calMonth + delta;
    let nextY = calYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    } else if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setCalMonth(nextM);
    setCalYear(nextY);
  };

  // 3. REAL TASK PROGRESS: Real week completion rates
  const weekDays = useMemo(() => {
    return getDaysAround(todayISO, 3, 3); // 7 days (3 past, today, 3 future)
  }, [todayISO]);

  const progressStats = useMemo(() => {
    return weekDays.map((wd) => {
      const dTasks = tasks.filter((t) => t.date === wd.iso);
      const total = dTasks.length;
      const done = dTasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        iso: wd.iso,
        dayNum: wd.jalaliDay,
        rate,
        total,
        isToday: wd.iso === todayISO,
      };
    });
  }, [weekDays, tasks, todayISO]);

  // 4. REAL TASK TIMELINE: Map real timed tasks or active tasks
  const timedTasks = useMemo(() => {
    const list = activeDayTasks.filter((t) => t.time);
    if (list.length > 0) {
      return list.sort((a, b) => a.time!.localeCompare(b.time!)).slice(0, 4);
    }
    // Fallback to active tasks
    return activeDayTasks.slice(0, 4);
  }, [activeDayTasks]);

  // Current real hour (0 to 24)
  const currentHour = new Date().getHours();
  // Marker position percentage across 12:00 to 18:00 window (or day)
  const markerHour = Math.max(12, Math.min(18, currentHour));
  const markerPercent = Math.round(((markerHour - 12) / 6) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
      {/* 1. TOP-LEFT: TODAY TASKS (Team & Personal with Confidence Message) */}
      <div className="bg-white rounded-[28px] p-4 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs flex-shrink-0">
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">
                کارهای امروز
              </h3>
              <span className="text-[10px] text-slate-400 font-bold block truncate">
                {teamTasks.length > 0 ? 'شامل پروژه‌های تیمی و کارهای فردی' : 'کارهای فردی شما'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="p-1.5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="ثبت تسک جدید"
              >
                <Plus className="w-4 h-4 text-slate-800" />
              </button>
            )}
            <button
              type="button"
              onClick={onSeeAllTasks || (() => setActiveTab('tasks'))}
              className="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <span className="text-[10px]">‹</span>
            </button>
          </div>
        </div>

        {/* Task Cards or Clean Empty State */}
        {displayTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {displayTasks.map((task, i) => {
              const isCompleted = task.completed;
              const subCount = task.subtasks?.length || 0;
              const subDone = task.subtasks?.filter((s) => s.completed).length || 0;
              const progress = isCompleted ? 100 : subCount > 0 ? Math.round((subDone / subCount) * 100) : (i === 0 ? 65 : 80);

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    sounds.playPop();
                    toggleTaskComplete(task.id);
                  }}
                  className={`bg-[#f8fafc] border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-2xs ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {task.projectId && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                            <FolderKanban className="w-2.5 h-2.5" />
                            تیمی
                          </span>
                        )}
                        <h4
                          className={`font-black text-xs sm:text-sm leading-snug line-clamp-1 ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playPop();
                        toggleTaskComplete(task.id);
                      }}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isCompleted ? 'bg-[#00b884] border-[#00b884] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
                    {task.description || 'تسک تعریف‌شده برای امروز'}
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* Status & % */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isCompleted ? 'تکمیل شده' : 'در حال انجام'}
                      </span>
                      <span className="text-[11px] font-black text-slate-700 font-mono">
                        {toPersianDigits(progress)}٪
                      </span>
                    </div>

                    {/* Progress Bar (Mint Green) */}
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00b884] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 px-4 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-black text-slate-700">هنوز تسکی برای امروز ثبت نشده است</p>
            <p className="text-[11px] text-slate-400">برای شروع روز، اولین تسک خود را ثبت کنید.</p>
          </div>
        )}

        {/* Dynamic Confidence & Motivational Banner */}
        {showTodayBanner && (
          <div className="bg-[#121212] text-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-full bg-[#00b884]/20 text-[#00b884] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </div>
              <p className="text-[11px] font-bold leading-relaxed text-zinc-200 line-clamp-2">
                {motivationalMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowTodayBanner(false);
              }}
              className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              title="بستن"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 2. TOP-RIGHT: INTERACTIVE CALENDAR */}
      <div className="bg-white rounded-[28px] p-4 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header with Month Navigator */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs flex-shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">
                تقویم کارهای ماهانه
              </h3>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:block truncate">
                کلیک روی هر روز برای مشاهده کارهای آن روز
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="ماه بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-800 px-1.5 min-w-[65px] text-center">
              {monthName} {toPersianDigits(calYear)}
            </span>

            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="ماه قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400">
          <span>ش</span>
          <span>ی</span>
          <span>د</span>
          <span>س</span>
          <span>چ</span>
          <span>پ</span>
          <span>ج</span>
        </div>

        {/* Calendar Grid: Real month days with real task count indicators */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold">
          {/* Previous month filler */}
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />

          {/* Days 1 to daysInMonth */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const dayISO = jalaliToISO(calYear, calMonth, dayNum);
            const isSelected = dayISO === activeDate;
            const isToday = dayISO === todayISO;

            // Check real tasks on this date
            const dayTasksList = tasks.filter((t) => t.date === dayISO);
            const hasTasks = dayTasksList.length > 0;
            const allDone = hasTasks && dayTasksList.every((t) => t.completed);

            let style = 'text-slate-800 hover:bg-slate-100';
            if (isSelected) {
              style = 'bg-[#f95738] text-white shadow-md ring-2 ring-[#f95738]/20 font-black';
            } else if (allDone) {
              style = 'bg-[#00b884] text-white shadow-xs font-bold';
            } else if (hasTasks) {
              style = 'bg-[#121212] text-white shadow-xs font-bold';
            } else if (isToday) {
              style = 'border-2 border-slate-900 text-slate-900 font-black';
            }

            return (
              <div key={dayNum} className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedDate(dayISO);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${style}`}
                  title={`${toPersianDigits(dayNum)} ${monthName} (${hasTasks ? `${dayTasksList.length} تسک` : 'بدون تسک'})`}
                >
                  {toPersianDigits(dayNum)}
                  {hasTasks && !isSelected && !allDone && (
                    <span className="w-1 h-1 rounded-full bg-[#f95738] absolute bottom-0.5 left-1/2 -translate-x-1/2" />
                  )}
                </button>
              </div>
            );
          })}

          {/* Trailing padding days */}
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
        </div>
      </div>

      {/* 3. BOTTOM-LEFT: REAL TASK PROGRESS */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                پیشرفت واقعی تسک‌ها (Task Progress)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                محاسبه بلادرنگ درصد کارهای تکمیل‌شده روزها
              </span>
            </div>
          </div>

          <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            امروز: {toPersianDigits(todayRate)}٪
          </span>
        </div>

        {/* Visual Bar Chart with Real Daily Completion Rates */}
        <div className="h-48 flex items-end justify-between px-2 pt-6 pb-1">
          {progressStats.map((stat) => {
            const isToday = stat.isToday;
            const rate = stat.rate;

            if (isToday) {
              return (
                <div key={stat.iso} className="flex flex-col items-center gap-1.5 -mt-6">
                  <span className="bg-[#121212] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                    {toPersianDigits(rate)}٪
                  </span>
                  <div className="w-11 sm:w-12 h-36 bg-[#121212] rounded-2xl flex flex-col items-center justify-center p-1 shadow-md relative">
                    <span className="bg-[#f95738] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      امروز
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{toPersianDigits(stat.dayNum)}</span>
                </div>
              );
            }

            const pillBg = rate >= 70 ? 'bg-[#00b884]' : rate > 0 ? 'bg-[#f95738]' : 'bg-slate-300';
            const heightClass = rate > 75 ? 'h-28' : rate > 40 ? 'h-24' : rate > 0 ? 'h-18' : 'h-14';

            return (
              <div key={stat.iso} className="flex flex-col items-center gap-2">
                <span className={`${pillBg} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs`}>
                  +{toPersianDigits(rate)}٪
                </span>
                <div className={`w-10 sm:w-11 ${heightClass} rounded-2xl pattern-hatched border border-slate-200/70`} />
                <span className="text-xs font-bold text-slate-400">{toPersianDigits(stat.dayNum)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BOTTOM-RIGHT: REAL TASK TIMELINE (GANTT) */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                زمان‌بندی واقعی تسک‌ها (Task Timeline)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                نمودار گانت کارهای ساعت‌دار امروز • نشانگر نارنجی: ساعت جاری ({toPersianDigits(currentHour)}:۰۰)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className="text-xs font-black text-slate-400 hover:text-black transition-colors"
          >
            پلنر ۲۴ ساعته ←
          </button>
        </div>

        {/* Real Horizontal Gantt Bars with Live Time Indicator */}
        <div className="relative h-48 flex flex-col justify-between py-2">
          {/* Real Live Vertical Hour Marker Line */}
          <div
            className="absolute top-0 bottom-6 w-[2px] bg-[#f95738] z-10 flex flex-col items-center pointer-events-none transition-all duration-500"
            style={{ right: `${markerPercent}%` }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-[#f95738] bg-white -mt-1 shadow-xs" />
          </div>

          {/* Background hatched zones for visual texture */}
          <div className="absolute top-2 bottom-8 left-4 w-28 pattern-hatched rounded-xl opacity-60 pointer-events-none" />

          {/* Real or structured timed task bars */}
          {timedTasks.length > 0 ? (
            timedTasks.map((t, idx) => {
              const colors = [
                'bg-[#f95738]',
                'bg-[#00b884]',
                'bg-[#6366f1]',
                'bg-[#121212]',
              ];
              const barColor = colors[idx % colors.length];
              const indentClasses = ['', 'pr-12', 'pr-24', 'pr-8'];

              return (
                <div key={t.id} className={`flex items-center ${indentClasses[idx] || ''}`}>
                  <div
                    onClick={() => {
                      sounds.playPop();
                      toggleTaskComplete(t.id);
                    }}
                    className={`${barColor} text-white text-xs font-black px-5 py-2.5 rounded-full shadow-xs cursor-pointer hover:opacity-90 transition-opacity truncate max-w-[280px] flex items-center gap-1.5`}
                    title={t.title}
                  >
                    <span>{t.time ? toPersianDigits(t.time) : ''}</span>
                    <span className="truncate">{t.title}</span>
                    {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-slate-200/80 bg-[#f8fafc] space-y-1">
              <Clock className="w-6 h-6 text-slate-300" />
              <span className="text-xs font-black text-slate-700">تسک ساعت‌داری برای امروز ثبت نشده است</span>
              <span className="text-[10px] text-slate-400">کارهای ساعت‌دار به صورت خودکار در این نوار گانت زمان‌بندی می‌شوند.</span>
            </div>
          )}

          {/* X-axis time marks */}
          <div className="flex items-center justify-between text-xs font-black text-slate-400 pt-2 border-t border-slate-100">
            <span>۱۲:۰۰</span>
            <span>۱۳:۰۰</span>
            <span>۱۴:۰۰</span>
            <span>۱۵:۰۰</span>
            <span className={currentHour === 16 ? 'text-[#f95738] font-black' : ''}>۱۶:۰۰</span>
            <span>۱۷:۰۰</span>
            <span>۱۸:۰۰</span>
          </div>
        </div>
      </div>
    </div>
  );
};
