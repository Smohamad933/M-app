import React, { useState } from 'react';
import { useTask, AVAILABLE_FONTS } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { Type, Check, X, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';

interface FontSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FontSelectorModal: React.FC<FontSelectorModalProps> = ({ isOpen, onClose }) => {
  const { systemFont, setSystemFont } = useTask();
  const [justApplied, setJustApplied] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (fontId: string) => {
    setSystemFont(fontId);
    sounds.playComplete();
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleResetDefault = () => {
    handleSelect('vazirmatn');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">تغییر فونت کل سیستم</h3>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  مدیر کل (Mohusyn)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                فونت انتخابی شما بر روی تمام بخش‌های تسک‌روز، تیترها، جداول و منوها اعمال می‌شود.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert if just applied */}
        {justApplied && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in flex-shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            فونت با موفقیت بر کل سیستم اعمال شد و در تنظیمات ذخیره گردید.
          </div>
        )}

        {/* Fonts list */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 pl-1">
          {AVAILABLE_FONTS.map((font) => {
            const isCurrent = systemFont === font.id;
            return (
              <div
                key={font.id}
                onClick={() => handleSelect(font.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  isCurrent
                    ? 'bg-zinc-800/90 border-indigo-500 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/40'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-sm text-white">
                      {font.name}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        فونت فعال
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">{font.description}</span>
                </div>

                {/* Live Preview Box rendered in this font */}
                <div
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-zinc-200 text-xs leading-relaxed"
                  style={{ fontFamily: font.family }}
                >
                  «مدیریت کارهای روزانه، تمرکز عمیق پومودورو و پروژه‌های تیمی — ۱۴۰۵/۰۶/۲۸ (۱۲۳۴۵۶۷۸۹۰)»
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            بازنشانی به وزیرمتن
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
