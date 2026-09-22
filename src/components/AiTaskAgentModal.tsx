import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { parseTasksFromPersianText, type ParsedTaskDraft } from '../utils/persianTaskParser';
import { toPersianDigits, formatPersianDate, getTodayISO } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Sparkles,
  Bot,
  Mic,
  MicOff,
  X,
  Check,
  Plus,
  Clock,
  Trash2,
  FileEdit,
  Layers,
} from 'lucide-react';

export interface AiTaskAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToManual?: () => void;
  onOpenManualModal?: () => void;
}

export const AiTaskAgentModal: React.FC<AiTaskAgentModalProps> = ({
  isOpen,
  onClose,
  onSwitchToManual,
  onOpenManualModal,
}) => {
  const handleManual = onSwitchToManual || onOpenManualModal;
  const { addTask, selectedDate, categories } = useTask();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ParsedTaskDraft[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const todayISO = getTodayISO();
  const activeDate = selectedDate || todayISO;

  const samplePrompts = [
    'قراره ساعت ۱۲ ظهر برم کلاس موسیقی و ساعت ۱ میخوام با دوستم قرار دارم و ساعت ۵ برم شیرینی فروشی شیرینی بخرم و بعدش برم فلان جا تحویل اش بدم',
    'صبح ساعت ۹:۳۰ جلسه بررسی تسک‌ها، ساعت ۱۴ تدوین گزارش عملکرد، و شب ساعت ۲۰ ورزش در باشگاه',
    'ساعت ۱۰ مراجعه به بانک، ساعت ۱۲ خرید مایحتاج خانه، ساعت ۱۶ مطالعه فصل دوم کتاب',
  ];

  const handleParse = (textToParse?: string) => {
    const text = typeof textToParse === 'string' ? textToParse : inputText;
    if (!text.trim()) return;

    sounds.playPop();
    const parsed = parseTasksFromPersianText(text, activeDate);
    setDrafts(parsed);
    setHasParsed(true);
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
        setVoiceNotice('در حال شنیدن صدای شما... (کارهایتان را پشت سر هم بگویید)');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => {
            const next = prev ? `${prev} ${transcript}` : transcript;
            handleParse(next);
            return next;
          });
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('خطا در دریافت صدا یا عدم دسترسی به میکروفون.');
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceNotice(null), 2000);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice('خطا در راه‌اندازی ضبط صدا.');
      setTimeout(() => setVoiceNotice(null), 3000);
    }
  };

  const updateDraft = (id: string, patch: Partial<ParsedTaskDraft>) => {
    setDrafts(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const removeDraft = (id: string) => {
    setDrafts(drafts.filter((d) => d.id !== id));
  };

  const addManualDraft = () => {
    setDrafts([
      ...drafts,
      {
        id: 'draft-' + Date.now(),
        title: 'تسک جدید',
        time: '12:00',
        priority: 'medium',
        categoryId: categories[0]?.id || 'cat-work',
        categoryName: categories[0]?.name || 'کاری',
        date: activeDate,
        selected: true,
      },
    ]);
  };

  const handleConfirmAll = async () => {
    const selectedDrafts = drafts.filter((d) => d.selected && d.title.trim());
    if (selectedDrafts.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const d of selectedDrafts) {
        // match category id with real category
        const matchedCat = categories.find((c) => c.id === d.categoryId) || categories[0];
        await addTask({
          title: d.title.trim(),
          date: d.date || activeDate,
          time: d.time || undefined,
          priority: d.priority,
          categoryId: matchedCat?.id || 'cat-work',
          completed: false,
          subtasks: [],
        });
      }
      sounds.playComplete();
      onClose();
    } catch {
      alert('خطا در ذخیره تسک‌ها.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-[#00b884]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  دستیار هوشمند برنامه‌ریزی (AI Agent)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#00895f] border border-emerald-200 font-extrabold">
                  هوشمند
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                برنامه‌ات را بنویس یا بگو؛ ایجنت کارهایت را تفکیک و زمان‌بندی می‌کند
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleManual?.();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-black hover:border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs"
              title="ورود به فرم دستی"
            >
              <FileEdit className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">فرم دستی</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Prompt input card */}
          <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>برنامه یا کارهای دلخواهت را بنویس یا با صدا بگو:</span>
              </label>

              <span className="text-[11px] font-bold text-slate-400">
                تاریخ هدف: {formatPersianDate(activeDate, 'dayMonth')}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="مثلاً: قراره ساعت ۱۲ برم کلاس موسیقی و ساعت ۱۳ قرار با دوستم و ساعت ۱۷ خرید شیرینی و تحویلش..."
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 resize-none font-bold leading-relaxed shadow-2xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleParse();
                  }
                }}
              />

              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-600 hover:text-black hover:bg-slate-200'
                  }`}
                  title="تایپ صوتی (میکروفون)"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleParse()}
                  className="px-4 py-2 bg-[#121212] hover:bg-black text-white rounded-xl font-black text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00b884]" />
                  <span>تفکیک با ایجنت</span>
                </button>
              </div>
            </div>

            {voiceNotice && (
              <div className="text-[11px] font-bold text-slate-500 animate-in fade-in flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{voiceNotice}</span>
              </div>
            )}

            {/* Quick Example Pill Buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 block">نمونه جملات آماده برای آزمایش:</span>
              <div className="flex flex-col gap-1.5">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputText(p);
                      handleParse(p);
                    }}
                    className="text-right text-[11px] text-slate-600 hover:text-black hover:bg-white p-2 rounded-xl border border-slate-200/60 transition-colors truncate font-medium cursor-pointer"
                  >
                    💡 {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results: Extracted Task Cards */}
          {hasParsed && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00b884]" />
                  <h3 className="font-black text-xs sm:text-sm text-slate-900">
                    تسک‌های تفکیک‌شده توسط ایجنت ({toPersianDigits(drafts.length)} مورد)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={addManualDraft}
                  className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن کار دستی به این لیست</span>
                </button>
              </div>

              {drafts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold">
                  تسکی از متن استخراج نشد. لطفاً متن را کامل‌تر بنویسید.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {drafts.map((d, index) => (
                    <div
                      key={d.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        d.selected
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200/50 opacity-60'
                      }`}
                    >
                      {/* Left: Checkbox + Title Input */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={d.selected}
                          onChange={(e) => updateDraft(d.id, { selected: e.target.checked })}
                          className="w-4 h-4 rounded text-slate-900 border-slate-300 cursor-pointer"
                        />

                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                          {toPersianDigits(index + 1)}
                        </span>

                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => updateDraft(d.id, { title: e.target.value })}
                          className="w-full bg-transparent text-xs font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-slate-800 outline-none pb-0.5"
                          placeholder="عنوان تسک..."
                        />
                      </div>

                      {/* Right: Time, Category & Priority Selectors */}
                      <div className="flex items-center gap-2 flex-wrap self-end sm:self-center flex-shrink-0">
                        {/* Time Picker */}
                        <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="time"
                            value={d.time || '12:00'}
                            onChange={(e) => updateDraft(d.id, { time: e.target.value })}
                            className="bg-transparent text-xs font-mono font-bold text-slate-800 outline-none cursor-pointer w-16"
                          />
                        </div>

                        {/* Priority Selector */}
                        <select
                          value={d.priority}
                          onChange={(e) => updateDraft(d.id, { priority: e.target.value as any })}
                          className="bg-slate-100 text-slate-700 font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 outline-none cursor-pointer"
                        >
                          <option value="high">فوری 🔥</option>
                          <option value="medium">مهم ⚡</option>
                          <option value="low">عادی 🌱</option>
                        </select>

                        {/* Category Selector */}
                        <select
                          value={d.categoryId}
                          onChange={(e) => {
                            const cat = categories.find((c) => c.id === e.target.value);
                            updateDraft(d.id, { categoryId: e.target.value, categoryName: cat?.name });
                          }}
                          className="bg-slate-100 text-slate-700 font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 outline-none cursor-pointer max-w-[110px] truncate"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeDraft(d.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
          >
            انصراف
          </button>

          {hasParsed && drafts.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={isSubmitting || selectedCount === 0}
              className="px-6 py-3 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isSubmitting
                  ? 'در حال افزودن...'
                  : `تایید و ثبت ${toPersianDigits(selectedCount)} تسک در برنامه`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleParse()}
              disabled={!inputText.trim()}
              className="px-6 py-3 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#00b884]" />
              <span>تفکیک و نمایش تسک‌ها</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
