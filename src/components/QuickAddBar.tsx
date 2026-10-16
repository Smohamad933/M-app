import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { Plus, Mic, MicOff, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

export const QuickAddBar: React.FC = () => {
  const { addTask, selectedDate, categories } = useTask();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    sounds.playPop();
    await addTask({
      title: text.trim(),
      date: selectedDate,
      priority: 'medium',
      categoryId: categories[0]?.id || 'cat-work',
      completed: false,
      subtasks: [],
    });

    setText('');
    setVoiceNotice(null);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('مرورگر شما از تایپ صوتی پشتیبانی نمی‌کند.');
      setTimeout(() => setVoiceNotice(null), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('در حال شنیدن صدای شما... (تسک را بگویید)');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('خطا در دریافت صدا یا عدم دسترسی میکروفون.');
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceNotice(null), 2000);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice('خطا در راه‌اندازی تایپ صوتی');
      setTimeout(() => setVoiceNotice(null), 3000);
    }
  };

  return (
    <div className="w-full select-none" dir="rtl">
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 bg-slate-100/80 dark:bg-[#252528] p-1.5 pl-2.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
          }`}
          title="تایپ صوتی تسک"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="افزودن سریع تسک جدید... (نام کار را بنویسید و اینتر بزنید)"
          className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none font-bold px-1"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">ثبت کار</span>
        </button>
      </form>

      {voiceNotice && (
        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 px-3 animate-in fade-in flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>{voiceNotice}</span>
        </div>
      )}
    </div>
  );
};
