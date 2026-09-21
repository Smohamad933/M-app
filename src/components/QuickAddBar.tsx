import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { Plus, Mic, MicOff, Send } from 'lucide-react';

export const QuickAddBar: React.FC = () => {
  const { addTask, selectedDate, categories } = useTask();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

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
        setVoiceNotice('خطا در دریافت صدا یا دسترسی میکروفون داده نشد.');
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
    <div className="pt-2 pb-1">
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 bg-zinc-900/90 p-1.5 pl-2.5 rounded-2xl border border-zinc-800 shadow-xs focus-within:border-zinc-600 transition-all"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
          }`}
          title="تایپ صوتی تسک"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="افزودن سریع تسک جدید... (اینتر بزنید)"
          className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 outline-hidden font-medium"
        />

        {text.trim() ? (
          <button
            type="submit"
            className="p-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="ثبت تسک"
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
          </button>
        ) : (
          <button
            type="submit"
            disabled
            className="p-2 text-zinc-600 rounded-xl cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </form>

      {voiceNotice && (
        <div className="mt-1 px-2 text-[10px] font-semibold text-zinc-400 animate-in fade-in">
          {voiceNotice}
        </div>
      )}
    </div>
  );
};
