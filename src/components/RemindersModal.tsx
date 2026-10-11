import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import {
  Bell,
  X,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose }) => {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useTask();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState<'month' | 'week' | 'always' | 'once'>('month');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addReminder({
      title: title.trim(),
      time,
      duration,
    });

    setTitle('');
    setIsAdding(false);
  };

  const getDurationLabel = (d: string) => {
    switch (d) {
      case 'month':
        return 'عرض یک ماه هرروز (۳۰ روزه)';
      case 'week':
        return 'عرض یک هفته هرروز (۷ روزه)';
      case 'always':
        return 'هرروز به‌صورت دائمی';
      case 'once':
        return 'فقط یک‌بار';
      default:
        return '۳۰ روزه';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>سیستم یادآورها و آلارم‌های دوره‌ای</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                تنظیم یادآور برای تکرار روزانه در زمان مشخص به مدت یک ماه یا هفته با ارسال نوتیفیکیشن
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Quick Create Card */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setIsAdding(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد یادآور جدید (تکرار روزانه برای ۱ ماه)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateReminder} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>ثبت یادآور زمان‌دار</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">عنوان یادآور:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مصرف قرص و ویتامین، پیگیری قرارداد، مرور زبان..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs outline-none focus:border-amber-500 font-bold"
                  autoFocus
                  required
                />
              </div>

              {/* Time Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>ساعت اعلام:</span>
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const hStr = String(h).padStart(2, '0');
                      return ['00', '15', '30', '45'].map((m) => {
                        const val = `${hStr}:${m}`;
                        return (
                          <option key={val} value={val}>
                            ساعت {toPersianDigits(val)}
                          </option>
                        );
                      });
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>مدت تکرار:</span>
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    <option value="month">عرض یک ماه هرروز (۳۰ روزه)</option>
                    <option value="week">عرض یک هفته هرروز (۷ روزه)</option>
                    <option value="always">هرروز به‌صورت دائمی</option>
                    <option value="once">فقط امروز (یک‌بار)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید و شروع یادآوری</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          <div className="space-y-3">
            <h3 className="font-black text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>یادآورهای فعال شما:</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                {toPersianDigits(reminders.length)} عدد
              </span>
            </h3>

            {reminders.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold">هنوز یادآوری ثبت نشده است.</p>
                <p className="text-[11px]">با دکمه بالا می‌توانید یادآوری روزانه ۳۰ روزه اضافه کنید.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      rem.active
                        ? 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleReminder(rem.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                          rem.active
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                        title={rem.active ? 'غیرفعال کردن یادآور' : 'فعال کردن یادآور'}
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {rem.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ساعت {toPersianDigits(rem.time)}
                          </span>
                          <span>•</span>
                          <span>{getDurationLabel(rem.duration)}</span>
                          {rem.endDate && (
                            <>
                              <span>•</span>
                              <span>تا {rem.endDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleReminder(rem.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          rem.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {rem.active ? 'فعال' : 'خاموش'}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteReminder(rem.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="حذف یادآور"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between px-6">
          <span className="text-[11px] text-slate-500 font-bold">
            یادآورها راس زمان تعیین‌شده با صدای زنگ و پیام درون‌برنامه‌ای هشدار می‌دهند.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
