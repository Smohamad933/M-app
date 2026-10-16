import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, getTodayISO, formatAppDate } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  X,
  Sun,
  Moon,
  Star,
  ArrowRight,
  Flame,
  Sparkles,
  Clock,
  Send,
  Heart,
  Smile,
  Zap,
  Coffee,
  CloudRain,
  ChevronLeft,
  CheckCheck,
  Plus,
} from 'lucide-react';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask?: () => void;
}

type MoodType = 'fire' | 'super' | 'chill' | 'tired' | 'challenging';

interface DailyReflectionData {
  mood?: MoodType;
  note?: string;
  savedAt?: string;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateTask,
}) => {
  const {
    tasks,
    updateTask,
    streak,
    currentUser,
    openEditModal,
  } = useTask();

  const todayISO = getTodayISO();
  const currentHour = new Date().getHours();

  // Default to morning before 16:00, evening after 16:00
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>(() => {
    return currentHour < 16 ? 'morning' : 'evening';
  });

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  // Storage key for daily reflection
  const storageKey = useMemo(() => {
    const uid = currentUser?.id || 'guest';
    return `taskrooz_reflection_${uid}_${todayISO}`;
  }, [currentUser, todayISO]);

  // Load existing reflection
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: DailyReflectionData = JSON.parse(saved);
        if (parsed.mood) setSelectedMood(parsed.mood);
        if (parsed.note) setReflectionNote(parsed.note);
      }
    } catch {}
  }, [isOpen, storageKey]);

  if (!isOpen) return null;

  // Filter tasks for today
  const todayTasks = tasks.filter((t) => t.date === todayISO);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const pendingTodayTasks = todayTasks.filter((t) => !t.completed && !t.reasonUncompleted);

  // Golden focus tasks
  const goldenTasks = todayTasks.filter((t) => t.isGoldenFocus);

  // Overdue / yesterday tasks that are unfinished
  const yesterdayTasks = tasks.filter(
    (t) => t.date < todayISO && !t.completed && !t.reasonUncompleted
  );

  // Toggle Golden Focus on a task
  const handleToggleGolden = (taskId: string, currentVal?: boolean) => {
    sounds.playPop();
    if (!currentVal && goldenTasks.length >= 3) {
      alert('حداکثر می‌توانید ۳ کار را به عنوان اولویت طلایی امروز تعیین کنید.');
      return;
    }
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      updateTask({ ...t, isGoldenFocus: !currentVal });
    }
  };

  // Move single task to today
  const handleMoveToToday = (taskId: string) => {
    sounds.playPop();
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      updateTask({ ...t, date: todayISO });
    }
  };

  // Move all yesterday's tasks to today
  const handleMoveAllToToday = () => {
    sounds.playComplete();
    yesterdayTasks.forEach((t) => {
      updateTask({ ...t, date: todayISO });
    });
  };

  // Move remaining today's tasks to tomorrow
  const handleMoveRemainingToTomorrow = () => {
    sounds.playComplete();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrowISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    pendingTodayTasks.forEach((t) => {
      updateTask({ ...t, date: tomorrowISO });
    });
    alert(`${toPersianDigits(pendingTodayTasks.length)} تسک با موفقیت به فردا منتقل شدند.`);
  };

  // Save reflection
  const handleSaveReflection = () => {
    sounds.playComplete();
    const data: DailyReflectionData = {
      mood: selectedMood || undefined,
      note: reflectionNote.trim(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2500);
    } catch {}
  };

  const moods: Array<{ id: MoodType; label: string; icon: React.ElementType; color: string; bg: string }> = [
    { id: 'fire', label: 'پرانرژی و قهرمان', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { id: 'super', label: 'عالی و شاداب', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { id: 'chill', label: 'آرام و پیوسته', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { id: 'tired', label: 'خسته اما خرسند', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    { id: 'challenging', label: 'پرچالش و سخت', icon: CloudRain, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-zinc-100 rounded-[32px] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              activeTab === 'morning'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
            }`}>
              {activeTab === 'morning' ? <Sun className="w-5 h-5 animate-spin-slow" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {activeTab === 'morning' ? 'مرور و تمرکز صبحگاهی' : 'جمع‌بندی و بازتاب شبانه'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
                {formatAppDate(todayISO)} • {currentUser?.name || 'همکار گرامی'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl flex items-center gap-1 border border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('morning');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'morning'
                    ? 'bg-white dark:bg-[#2c2c2e] text-amber-800 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">صبح</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActiveTab('evening');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'evening'
                    ? 'bg-white dark:bg-[#2c2c2e] text-indigo-800 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">شب</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {/* ================= MORNING TAB ================= */}
          {activeTab === 'morning' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Daily Affirmation / Greeting */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                    روز جدید، فرصتی تازه برای درخشیدن! ☀️
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    ۳ کار حیاتی امروزت را انتخاب کن تا تمرکزت روی مهم‌ترین اهداف قفل بماند. بر کارهای کوچک اما اثرگذار متمرکز شو.
                  </p>
                </div>
              </div>

              {/* SECTION: 3 Golden Priorities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      ۳ اولویت طلایی امروز (Top 3 Focus)
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {toPersianDigits(goldenTasks.length)} از ۳ انتخاب شده
                  </span>
                </div>

                {todayTasks.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-medium">امروز هنوز تسکی تعریف نکرده‌اید.</p>
                    {onOpenCreateTask && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCreateTask();
                        }}
                        className="px-4 py-2 rounded-xl bg-[#00b884] hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ثبت اولین تسک امروز</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map((task) => {
                      const isGolden = Boolean(task.isGoldenFocus);
                      return (
                        <div
                          key={task.id}
                          className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isGolden
                              ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-100 shadow-xs'
                              : 'bg-white dark:bg-[#252528] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleGolden(task.id, isGolden)}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                isGolden
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-400 hover:text-amber-500'
                              }`}
                              title={isGolden ? 'حذف از اولویت طلایی' : 'انتخاب به عنوان اولویت طلایی'}
                            >
                              <Star className={`w-4 h-4 ${isGolden ? 'fill-white' : ''}`} />
                            </button>
                            <span className={`text-xs font-bold truncate ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'
                            }`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isGolden && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                اولویت طلایی ⭐
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                openEditModal(task);
                              }}
                              className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                            >
                              جزئیات
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: Yesterday's Rollover (Overdue) */}
              {yesterdayTasks.length > 0 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-[#252528] border border-slate-200/80 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        کارهای عقب‌افتاده از دیروز ({toPersianDigits(yesterdayTasks.length)} کار)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleMoveAllToToday}
                      className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>انتقال همه به امروز</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {yesterdayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">
                          {t.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveToToday(t.id)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
                        >
                          <span>انتقال به امروز</span>
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= EVENING TAB ================= */}
          {activeTab === 'evening' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Daily Performance Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    پایان روز کاری! خسته نباشی قهرمان 🌙
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    امروز {toPersianDigits(completedTodayTasks.length)} از {toPersianDigits(todayTasks.length)} کار را تیک زدی.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-center min-w-[70px]">
                    <div className="text-xl font-black font-mono">
                      {toPersianDigits(
                        todayTasks.length > 0
                          ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
                          : 0
                      )}%
                    </div>
                    <div className="text-[9px] font-bold">پیشرفت روز</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-center min-w-[70px]">
                    <div className="text-xl font-black font-mono flex items-center justify-center gap-0.5">
                      <Flame className="w-4 h-4 fill-rose-500" />
                      {toPersianDigits(streak.currentStreak)}
                    </div>
                    <div className="text-[9px] font-bold">روز استریک</div>
                  </div>
                </div>
              </div>

              {/* MOOD TRACKER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Smile className="w-4 h-4 text-indigo-500" />
                    <span>حال و هوای امروزت چطور بود؟ (Mood Tracker)</span>
                  </h4>
                  {selectedMood && (
                    <span className="text-[10px] text-slate-400 font-bold">انتخاب شده</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {moods.map((m) => {
                    const isSelected = selectedMood === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sounds.playPop();
                          setSelectedMood(m.id);
                        }}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? `${m.bg} ring-2 ring-indigo-500/40 shadow-xs scale-102`
                            : 'bg-white dark:bg-[#252528] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? m.color : 'text-slate-400'}`} />
                        <span className={`text-[11px] font-bold ${
                          isSelected ? 'text-slate-900 dark:text-white font-black' : 'text-slate-600 dark:text-zinc-400'
                        }`}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DAILY REFLECTION NOTE */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>یک دستاورد یا جمله شکرگزاری برای امروز بنویس:</span>
                </label>
                <div className="relative">
                  <textarea
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    placeholder="مثلاً: امروز توانستم گزارش پروژه را بدون حواس‌پرتی تمام کنم و پیاده‌روی عصرگاهی عالی بود..."
                    rows={3}
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-black/[0.08] dark:border-white/[0.1] text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleSaveReflection}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isNoteSaved ? 'ذخیره شد! ✨' : 'ثبت یادداشت امروز'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* UNFINISHED TASKS ROLLOVER */}
              {pendingTodayTasks.length > 0 && (
                <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                        {toPersianDigits(pendingTodayTasks.length)} کار هنوز تکمیل نشده است
                      </h4>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 font-medium">
                        برای خالی شدن ذهن در پایان شب، کارهای باقیمانده را به فردا منتقل کن.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMoveRemainingToTomorrow}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>انتقال همه به فردا</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#18181a] flex-shrink-0">
          <div className="text-[11px] text-slate-400 font-medium">
            تسک‌روز • مرور هوشمندانه سبک زندگی و کار
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            بستن و ادامه کار
          </button>
        </div>
      </div>
    </div>
  );
};
