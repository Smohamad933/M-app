import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatAppDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Feather,
  Save,
  Trash2,
  X,
  History,
  CheckCircle,
  Heart,
} from 'lucide-react';

export interface DailyStory {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: string;
  gratitude?: string;
  createdAt: number;
}

const STORAGE_KEY = 'bagtime_daily_stories';

export const DailyStoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { selectedDate, calendarType } = useTask();
  const todayISO = getTodayISO();
  const targetDate = selectedDate || todayISO;

  const [stories, setStories] = useState<DailyStory[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [viewMode, setViewMode] = useState<'editor' | 'history'>('editor');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('💪');
  const [gratitude, setGratitude] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load story for current date if exists
  useEffect(() => {
    const existing = stories.find((s) => s.date === targetDate);
    if (existing) {
      setTitle(existing.title || '');
      setContent(existing.content || '');
      setMood(existing.mood || '💪');
      setGratitude(existing.gratitude || '');
    } else {
      setTitle('');
      setContent('');
      setMood('💪');
      setGratitude('');
    }
  }, [targetDate, stories]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!content.trim() && !title.trim()) return;

    sounds.playComplete();
    const existingIndex = stories.findIndex((s) => s.date === targetDate);
    const newStory: DailyStory = {
      id: existingIndex >= 0 ? stories[existingIndex].id : `story_${Date.now()}`,
      date: targetDate,
      title: title.trim() || 'داستان و وقایع امروز',
      content: content.trim(),
      mood,
      gratitude: gratitude.trim(),
      createdAt: Date.now(),
    };

    let updated = [...stories];
    if (existingIndex >= 0) {
      updated[existingIndex] = newStory;
    } else {
      updated.unshift(newStory);
    }

    setStories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('آیا از حذف این داستان مطمئن هستید؟')) return;
    const updated = stories.filter((s) => s.id !== id);
    setStories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const moods = [
    { emoji: '🚀', label: 'شاهکار و پرانرژی' },
    { emoji: '💪', label: 'باانگیزه و پرتلاش' },
    { emoji: '☕', label: 'آرام و پیوسته' },
    { emoji: '💡', label: 'خلاق و الهام‌بخش' },
    { emoji: '😴', label: 'خسته اما راضی' },
    { emoji: '🌧️', label: 'روز چالش‌برانگیز' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto relative animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>داستان روز</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (وقایع‌نگاری و خاطرات روزانه)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تاریخ: {formatAppDate(targetDate, calendarType, 'full')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'editor' ? 'history' : 'editor')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              {viewMode === 'editor' ? (
                <>
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  <span>آرشیو داستان‌ها ({toPersianDigits(stories.length)})</span>
                </>
              ) : (
                <>
                  <Feather className="w-3.5 h-3.5 text-amber-500" />
                  <span>نوشتن داستان</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode: Editor */}
        {viewMode === 'editor' ? (
          <div className="space-y-4">
            {/* Title & Mood */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                  تیتر یا نام داستان امروز:
                </label>
                <div className="flex items-center gap-1">
                  {moods.map((m) => (
                    <button
                      key={m.emoji}
                      type="button"
                      onClick={() => setMood(m.emoji)}
                      title={m.label}
                      className={`text-lg p-1.5 rounded-xl transition-all cursor-pointer ${
                        mood === m.emoji
                          ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-500 scale-110'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60'
                      }`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: روز عبور از چالش کدنویسی و پیروزی در ارائه‌ی نهایی..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500"
              />
            </div>

            {/* Content Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                شرح وقایع، درس‌ها و احساسات امروز:
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="امروز چطور گذشت؟ چه درس مهمی گرفتی؟ چه کاری عالی پیش رفت و چه مانعی را حل کردی؟..."
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-amber-500 resize-none font-sans"
              />
            </div>

            {/* Daily Gratitude Box */}
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
                <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>شکرگزاری روزانه (امروز بابت چی قلباً خوشحالی؟):</span>
              </div>
              <input
                type="text"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="مثلاً: سلامتی، همراهی یک دوست خوب، پیشرفت یک تسک سخت..."
                className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                این داستان‌ها بعدها برای مرور سالانه و گزارش پیشرفت محفوظ می‌مانند.
              </span>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>داستان ذخیره شد ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ثبت داستان امروز</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode: History */
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {stories.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                هنوز داستانی ثبت نکرده‌اید. اولین داستان خود را بنویسید!
              </div>
            ) : (
              stories.map((story) => (
                <div
                  key={story.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{story.mood}</span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {story.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {formatAppDate(story.date, calendarType, 'full')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(story.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {story.content}
                  </p>

                  {story.gratitude && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100/40 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                      ❤️ شکرگزاری: {story.gratitude}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
