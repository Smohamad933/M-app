import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import type { Task, Priority } from '../types';
import { toPersianDigits, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  CheckSquare,
} from 'lucide-react';

interface QuadrantConfig {
  priority: Priority;
  title: string;
  subtitle: string;
  actionText: string;
  badge: string;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  iconBg: string;
  textColor: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    priority: 'urgent',
    title: 'فوری و مهم (Do First)',
    subtitle: 'کارهای بحرانی و ضرب‌الاجل‌دار که باید همین امروز انجام شوند',
    actionText: 'اقدام فوری',
    badge: 'بحرانی',
    accentColor: '#f43f5e',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    borderColor: 'border-rose-500/25 dark:border-rose-500/30',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    textColor: 'text-rose-900 dark:text-rose-200',
  },
  {
    priority: 'high',
    title: 'مهم، اما غیرفوری (Schedule)',
    subtitle: 'اهداف استراتژیک، یادگیری، پروژه‌ها و برنامه‌ریزی بلندمدت',
    actionText: 'برنامه‌ریزی دقیق',
    badge: 'رشد فردی',
    accentColor: '#3b82f6',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    borderColor: 'border-blue-500/25 dark:border-blue-500/30',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-900 dark:text-blue-200',
  },
  {
    priority: 'medium',
    title: 'فوری، اما غیرمهم (Delegate)',
    subtitle: 'هماهنگی‌ها، ایمیل‌ها، وقفه‌ها یا کارهایی که بهتر است تفویض شوند',
    actionText: 'واگذاری یا تسریع',
    badge: 'روتین',
    accentColor: '#f59e0b',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    borderColor: 'border-amber-500/25 dark:border-amber-500/30',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-900 dark:text-amber-200',
  },
  {
    priority: 'low',
    title: 'نه فوری و نه مهم (Eliminate)',
    subtitle: 'کارهای کم‌ارزش، اتلاف وقت‌ها یا ایده‌های بک‌لاگ برای بازبینی آینده',
    actionText: 'حذف یا تعویق',
    badge: 'کم‌ارزش',
    accentColor: '#64748b',
    bgGradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    borderColor: 'border-slate-500/25 dark:border-slate-500/30',
    iconBg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    textColor: 'text-slate-900 dark:text-slate-200',
  },
];

export const EisenhowerMatrixView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    updateTask,
    toggleTaskComplete,
    addTask,
    openEditModal,
  } = useTask();

  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [quickInputQuadrant, setQuickInputQuadrant] = useState<Priority | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const todayISO = getTodayISO();

  // Filter tasks
  const relevantTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (dateFilter === 'today' && t.date !== selectedDate && t.date !== todayISO) {
        return false;
      }
      if (!showCompleted && t.completed) {
        return false;
      }
      return true;
    });
  }, [tasks, dateFilter, selectedDate, todayISO, showCompleted]);

  // Group by priority
  const quadrantTasks = useMemo(() => {
    const map: Record<Priority, Task[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };
    relevantTasks.forEach((t) => {
      const p = t.priority || 'medium';
      if (map[p]) map[p].push(t);
      else map.medium.push(t);
    });
    return map;
  }, [relevantTasks]);

  // Handle priority change
  const handleChangePriority = (taskId: string, newPriority: Priority) => {
    sounds.playPop();
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      updateTask({ ...t, priority: newPriority });
    }
  };

  // Handle Quick Add in Quadrant
  const handleQuickAdd = (priority: Priority) => {
    if (!quickTitle.trim()) return;
    sounds.playPop();
    addTask({
      title: quickTitle.trim(),
      date: selectedDate || todayISO,
      priority,
      categoryId: 'work',
      completed: false,
      subtasks: [],
    });
    setQuickTitle('');
    setQuickInputQuadrant(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-16 w-full select-none" dir="rtl">
      {/* Top Banner and Filter Bar */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              ماتریس اولویت‌بندی آیزنهاور (Eisenhower Matrix)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            دسته‌بندی هوشمند وظایف بر اساس فوریت و اهمیت؛ تمرکز بر آنچه حقیقتاً ارزش دارد
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          <div className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center gap-1 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setDateFilter('today');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              کارهای امروز
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setDateFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تمام کارها
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setShowCompleted(!showCompleted);
            }}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>کارهای انجام‌شده</span>
          </button>
        </div>
      </div>

      {/* 2x2 Grid Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((quad) => {
          const list = quadrantTasks[quad.priority] || [];
          const isQuickAdding = quickInputQuadrant === quad.priority;

          return (
            <div
              key={quad.priority}
              className={`p-5 rounded-[28px] bg-white dark:bg-[#1c1c1e] border ${quad.borderColor} shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col min-h-[340px] relative overflow-hidden`}
            >
              {/* Top Accent Gradient Header */}
              <div className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${quad.bgGradient} pointer-events-none`} />

              <div className="relative flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.08] mb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: quad.accentColor }} />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {quad.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                    {quad.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {toPersianDigits(list.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setQuickInputQuadrant(isQuickAdding ? null : quad.priority);
                      setQuickTitle('');
                    }}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="افزودن سریع به این بخش"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Input Bar */}
              {isQuickAdding && (
                <div className="relative mb-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleQuickAdd(quad.priority);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder={`افزودن تسک به بخش ${quad.actionText}...`}
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!quickTitle.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      ثبت
                    </button>
                  </form>
                </div>
              )}

              {/* Task Items in Quadrant */}
              <div className="relative flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-72">
                {list.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 space-y-2">
                    <p className="text-xs font-medium">هیچ کاری در این بخش قرار ندارد.</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      برای اضافه کردن، روی + کلیک کنید
                    </span>
                  </div>
                ) : (
                  list.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl bg-white dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all flex items-start justify-between gap-2.5 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playComplete();
                            toggleTaskComplete(task.id);
                          }}
                          className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer flex-shrink-0"
                          title={task.completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'تکمیل تسک'}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div
                          onClick={() => openEditModal(task)}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <span
                            className={`text-xs font-bold block truncate ${
                              task.completed
                                ? 'line-through text-slate-400 dark:text-zinc-500'
                                : 'text-slate-800 dark:text-zinc-100'
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.time && (
                            <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {toPersianDigits(task.time)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Move Priority Quick Select */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <select
                          value={task.priority}
                          onChange={(e) => handleChangePriority(task.id, e.target.value as Priority)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 outline-none cursor-pointer"
                          title="تغییر ربع آیزنهاور"
                        >
                          <option value="urgent">🔴 فوری و مهم</option>
                          <option value="high">🔵 مهم/غیرفوری</option>
                          <option value="medium">🟡 فوری/غیرمهم</option>
                          <option value="low">⚪ نه فوری/نه مهم</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
