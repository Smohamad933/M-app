import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Clock,
  MoreHorizontal,
  ChevronDown,
  X,
  MessageSquare,
  Plus,
} from 'lucide-react';
import {
  AvatarMichie,
  AvatarDesigner,
  AvatarDeveloper,
  AvatarProductManager,
} from '../utils/designAvatars';

interface BentoWidgetsProps {
  onSeeAllTasks?: () => void;
  onOpenCreateTask?: () => void;
}

export const TaskMasterBentoWidgets: React.FC<BentoWidgetsProps> = ({
  onSeeAllTasks,
  onOpenCreateTask,
}) => {
  const { tasks, toggleTaskComplete, selectedDate, setSelectedDate, setActiveTab } = useTask();
  const [showTodayBanner, setShowTodayBanner] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('شهریور');
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const todayISO = getTodayISO();
  const todayTasksList = tasks.filter((t) => t.date === todayISO);

  // Real or high-fidelity fallback tasks for the 2 hero cards
  const realCard1 = todayTasksList[0];
  const realCard2 = todayTasksList[1];

  const heroCard1 = realCard1 ? {
    id: realCard1.id,
    title: realCard1.title,
    description: realCard1.description || 'تسک تعریف‌شده برای امروز',
    completed: realCard1.completed,
    progress: realCard1.completed ? 100 : 65,
  } : {
    id: 'hero-1',
    title: 'کیت اپلیکیشن تحویل غذا (Delivery App Kit)',
    description: 'طراحی رابط کاربری و فلوهای سفارش‌دهی پروژه تحویل سریع کالا Foodnow...',
    completed: false,
    progress: 65,
  };

  const heroCard2 = realCard2 ? {
    id: realCard2.id,
    title: realCard2.title,
    description: realCard2.description || 'تسک در حال انجام امروز',
    completed: realCard2.completed,
    progress: realCard2.completed ? 100 : 80,
  } : {
    id: 'hero-2',
    title: 'شات دریبل داشبورد تسک‌مستر (Dribbble Shot)',
    description: 'پیاده‌سازی استایل مینیمال، مدرن و هماهنگ داشبورد مدیریت پروژه...',
    completed: true,
    progress: 80,
  };

  // Calendar dates mock setup matching Dribbble visual
  const greenDays = [2, 5, 6, 8, 14, 20, 23, 24, 28];
  const darkDays = [10, 25];
  const coralDay = 16; // Current highlight day in Dribbble reference

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
      {/* 1. TOP-LEFT: TODAY TASKS */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              کارهای امروز (Today Tasks)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="تسک جدید"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onSeeAllTasks || (() => setActiveTab('tasks'))}
              className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <span className="text-[10px]">‹</span>
            </button>
          </div>
        </div>

        {/* 2 Side-by-Side Task Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1 */}
          <div
            onClick={() => {
              if (realCard1) toggleTaskComplete(realCard1.id);
            }}
            className="bg-[#f8fafc] border border-slate-100/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-bold text-xs sm:text-sm leading-snug line-clamp-1 ${heroCard1.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {heroCard1.title}
              </h4>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/50"
                title="گزینه‌ها"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
              {heroCard1.description}
            </p>

            <div className="space-y-2 pt-1">
              {/* Avatars + % */}
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2 space-x-reverse">
                  <AvatarMichie size={24} className="border-2 border-white shadow-xs" />
                  <AvatarDesigner size={24} className="border-2 border-white shadow-xs" />
                  <AvatarDeveloper size={24} className="border-2 border-white shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[9px] font-bold text-slate-600 flex items-center justify-center">
                    ۲+
                  </div>
                </div>
                <span className="text-[11px] font-black text-slate-700 font-mono">
                  {toPersianDigits(heroCard1.progress)}٪
                </span>
              </div>

              {/* Progress Bar (Mint Green) */}
              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00b884] h-full rounded-full transition-all duration-300"
                  style={{ width: `${heroCard1.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => {
              if (realCard2) toggleTaskComplete(realCard2.id);
            }}
            className="bg-[#f8fafc] border border-slate-100/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-bold text-xs sm:text-sm leading-snug line-clamp-1 ${heroCard2.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {heroCard2.title}
              </h4>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/50"
                title="گزینه‌ها"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
              {heroCard2.description}
            </p>

            <div className="space-y-2 pt-1">
              {/* Avatars + % */}
              <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2 space-x-reverse">
                  <AvatarProductManager size={24} className="border-2 border-white shadow-xs" />
                  <AvatarMichie size={24} className="border-2 border-white shadow-xs" />
                  <AvatarDeveloper size={24} className="border-2 border-white shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[9px] font-bold text-slate-600 flex items-center justify-center">
                    ۱+
                  </div>
                </div>
                <span className="text-[11px] font-black text-slate-700 font-mono">
                  {toPersianDigits(heroCard2.progress)}٪
                </span>
              </div>

              {/* Progress Bar (Mint Green) */}
              <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00b884] h-full rounded-full transition-all duration-300"
                  style={{ width: `${heroCard2.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Black Pill Motivation Banner */}
        {showTodayBanner && (
          <div className="bg-[#121212] text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#00b884]/20 text-[#00b884] flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-xs font-bold leading-tight">
                امروز {toPersianDigits(todayTasksList.length || 5)} تسک داری. پرقدرت ادامه بده! 💪
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowTodayBanner(false);
              }}
              className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              title="بستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. TOP-RIGHT: CALENDAR */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header with Month Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              تقویم (Calendar)
            </h3>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors bg-white shadow-2xs"
            >
              <span>{selectedMonth}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMonthOpen && (
              <div className="absolute left-0 mt-1 w-28 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 text-xs font-semibold text-slate-700">
                {['فروردین', 'اردیبهشت', 'تیر', 'مرداد', 'شهریور', 'مهر', 'بهمن', 'اسفند'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthOpen(false);
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400">
          <span>ش</span>
          <span>ی</span>
          <span>د</span>
          <span>س</span>
          <span>چ</span>
          <span>پ</span>
          <span>ج</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold">
          {/* Previous month days: diagonal hatched pattern boxes */}
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />

          {/* Days 1 to 29 */}
          {Array.from({ length: 29 }, (_, i) => {
            const day = i + 1;
            const isGreen = greenDays.includes(day);
            const isCoral = day === coralDay;
            const isDark = darkDays.includes(day);

            let style = 'text-slate-800 hover:bg-slate-100';
            if (isGreen) {
              style = 'bg-[#00b884] text-white shadow-xs';
            } else if (isCoral) {
              style = 'bg-[#f95738] text-white shadow-sm ring-2 ring-[#f95738]/20';
            } else if (isDark) {
              style = 'bg-[#121212] text-white shadow-xs';
            }

            return (
              <div key={day} className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    if (selectedDate) setSelectedDate(selectedDate);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${style}`}
                >
                  {toPersianDigits(day)}
                </button>
              </div>
            );
          })}

          {/* Trailing next month days: hatched */}
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
          <div className="h-8 rounded-xl pattern-hatched opacity-60 m-0.5" />
        </div>
      </div>

      {/* 3. BOTTOM-LEFT: TASK PROGRESS */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              پیشرفت تسک‌ها (Task Progress)
            </h3>
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            title="گزینه‌ها"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Bar Chart with Hatched Columns & 65% Black Pillar */}
        <div className="h-48 flex items-end justify-between px-2 pt-6 pb-1">
          {/* Column 12 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#00b884] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۸٪
            </span>
            <div className="w-10 sm:w-11 h-24 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۲</span>
          </div>

          {/* Column 13 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#121212] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۲٪
            </span>
            <div className="w-10 sm:w-11 h-16 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۳</span>
          </div>

          {/* Column 14 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#f95738] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۱۲٪
            </span>
            <div className="w-10 sm:w-11 h-28 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۴</span>
          </div>

          {/* Column 15 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#00b884] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۵٪
            </span>
            <div className="w-10 sm:w-11 h-20 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۵</span>
          </div>

          {/* Column 16: SOLID JET BLACK PILLAR */}
          <div className="flex flex-col items-center gap-1.5 -mt-6">
            <span className="bg-[#121212] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
              ۶۵٪
            </span>
            <div className="w-11 sm:w-12 h-36 bg-[#121212] rounded-2xl flex flex-col items-center justify-center p-1 shadow-md relative">
              <span className="bg-[#f95738] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                +۸٪
              </span>
            </div>
            <span className="text-xs font-black text-slate-900">۱۶</span>
          </div>

          {/* Column 17 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#00b884] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۶٪
            </span>
            <div className="w-10 sm:w-11 h-24 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۷</span>
          </div>

          {/* Column 18 */}
          <div className="flex flex-col items-center gap-2">
            <span className="bg-[#f95738] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
              +۱۰٪
            </span>
            <div className="w-10 sm:w-11 h-18 rounded-2xl pattern-hatched border border-slate-200/50" />
            <span className="text-xs font-bold text-slate-400">۱۸</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM-RIGHT: TASK TIMELINE (GANTT) */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              زمان‌بندی تسک‌ها (Task Timeline)
            </h3>
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            title="گزینه‌ها"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Gantt Bars with Vertical Marker */}
        <div className="relative h-48 flex flex-col justify-between py-2">
          {/* Vertical marker line at point 16 */}
          <div
            className="absolute top-0 bottom-6 w-[2px] bg-[#f95738] z-10 flex flex-col items-center pointer-events-none"
            style={{ right: '62%' }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-[#f95738] bg-white -mt-1 shadow-2xs" />
          </div>

          {/* Background hatched zones for right side */}
          <div
            className="absolute top-2 bottom-8 left-4 w-32 pattern-hatched rounded-xl opacity-60 pointer-events-none"
          />

          {/* Row 1: Interview (Coral Orange) */}
          <div className="flex items-center">
            <div className="bg-[#f95738] text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-xs w-44">
              مصاحبه (Interview)
            </div>
          </div>

          {/* Row 2: Ideate (Mint Green) */}
          <div className="flex items-center pr-12">
            <div className="bg-[#00b884] text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-xs w-52">
              ایده‌پردازی (Ideate)
            </div>
          </div>

          {/* Row 3: Wireframe (Periwinkle Blue) */}
          <div className="flex items-center pr-28">
            <div className="bg-[#6366f1] text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-xs w-48">
              وایرفریم (Wireframe)
            </div>
          </div>

          {/* Row 4: Evaluate (Jet Black) */}
          <div className="flex items-center">
            <div className="bg-[#121212] text-white text-xs font-extrabold px-6 py-2.5 rounded-full shadow-xs w-48">
              ارزیابی (Evaluate)
            </div>
          </div>

          {/* X-axis time marks */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-2 border-t border-slate-100">
            <span>۱۲</span>
            <span>۱۳</span>
            <span>۱۴</span>
            <span>۱۵</span>
            <span className="text-slate-900 font-black">۱۶</span>
            <span>۱۷</span>
            <span>۱۸</span>
          </div>
        </div>
      </div>
    </div>
  );
};
