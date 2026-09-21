import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import {
  Type,
  Check,
  X,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Plus,
  Trash2,
  Globe,
  Eye,
} from 'lucide-react';

interface FontSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FontSelectorModal: React.FC<FontSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    systemFont,
    setSystemFont,
    allAvailableFonts,
    addCustomFont,
    deleteCustomFont,
  } = useTask();

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [justApplied, setJustApplied] = useState(false);

  // Form states for adding custom font
  const [fontName, setFontName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontUrl, setFontUrl] = useState('');
  const [fontDesc, setFontDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fontName.trim() || !fontFamily.trim()) {
      setFormError('نام نمایشی و نام Family فونت در CSS الزامی هستند.');
      return;
    }

    try {
      addCustomFont({
        name: fontName.trim(),
        family: fontFamily.trim(),
        fontUrl: fontUrl.trim() || undefined,
        description: fontDesc.trim() || 'فونت سفارشی افزوده شده توسط مدیر',
      });
      setFontName('');
      setFontFamily('');
      setFontUrl('');
      setFontDesc('');
      setActiveTab('list');
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 2000);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت فونت جدید.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
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
                <h3 className="text-base font-black text-white">تغییر و افزودن فونت‌های سیستم</h3>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  مدیریت اختصاصی
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                فونت انتخابی شما بر تمام بخش‌ها، تقویم جلالی، دیلی پلنر و متون اعمال می‌شود.
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

        {/* Tab switchers: Font list vs Add Font */}
        <div className="flex items-center p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 flex-shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            فهرست فونت‌ها ({allAvailableFonts.length})
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن فونت دلخواه</span>
          </button>
        </div>

        {/* Success Alert if just applied */}
        {justApplied && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in flex-shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            فونت با موفقیت بر کل سیستم اعمال شد و در تنظیمات ذخیره گردید.
          </div>
        )}

        {/* TAB 1: LIST OF FONTS */}
        {activeTab === 'list' && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-1 pl-1">
            {allAvailableFonts.map((font) => {
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white">
                        {font.name}
                      </span>
                      {font.isCustom && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                          فونت سفارشی
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          فونت فعال
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{font.description}</span>
                      {font.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`آیا از حذف فونت "${font.name}" اطمینان دارید؟`)) {
                              deleteCustomFont(font.id);
                            }
                          }}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف فونت سفارشی"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live Preview Box rendered in this font */}
                  <div
                    className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-zinc-200 text-xs leading-relaxed"
                    style={{ fontFamily: font.family }}
                  >
                    «تسک‌روز؛ مدیریت زمان‌بندی روزانه، تمرکز عمیق پومودورو و اهداف شغلی — ۱۴۰۵/۰۶/۲۸ (۱۲۳۴۵۶۷۸۹۰)»
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ADD CUSTOM FONT FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pl-1">
            {formError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  نام نمایشی فونت <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  placeholder="مثال: ایران‌یکان، شبنم، دانا، کلمه"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  نام Font-Family در CSS <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="مثال: IRANYekanX, Dana, Lalezar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>آدرس فایل وب‌فونت یا CDN (اختیاری)</span>
                <span className="text-[10px] text-zinc-500 font-normal">لینک .woff2 یا CSS Google Fonts / CDN</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://cdn.jsdelivr.net/.../font.css یا فایل محلی"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-indigo-500"
                />
                <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                اگر فونت در سیستم‌عامل کاربر نصب باشد، نیازی به وارد کردن لینک CDN نیست.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                توضیح کوتاه درباره فونت
              </label>
              <input
                type="text"
                value={fontDesc}
                onChange={(e) => setFontDesc(e.target.value)}
                placeholder="مثال: فونت رسمی شرکتی با اعداد فارسی"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Live Typing Preview */}
            {fontFamily.trim() && (
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>پیش‌نمایش زنده نام فونت:</span>
                </div>
                <div
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs leading-relaxed"
                  style={{ fontFamily: `'${fontFamily.trim().replace(/['"]/g, '')}', sans-serif` }}
                >
                  «تسک‌روز؛ برنامه‌ریزی کارهای روزانه و پایش تمرکز عمیق تیم — ۱۴۰۵ (۰۱۲۳۴۵۶۷۸۹)»
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                انصراف
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                افزودن و فعال‌سازی در سیستم
              </button>
            </div>
          </form>
        )}

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
