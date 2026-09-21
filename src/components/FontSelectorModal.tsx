import React, { useState, useRef } from 'react';
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
  UploadCloud,
  FileCheck2,
  AlertCircle,
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
    uploadCustomFont,
    deleteCustomFont,
  } = useTask();

  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'url'>('list');
  const [justApplied, setJustApplied] = useState(false);

  // Form states for adding custom font via URL
  const [fontName, setFontName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [fontUrl, setFontUrl] = useState('');
  const [fontDesc, setFontDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFontName, setUploadFontName] = useState('');
  const [uploadFontFamily, setUploadFontFamily] = useState('');
  const [uploadFontDesc, setUploadFontDesc] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Process selected file
  const processFile = (file: File) => {
    setUploadError(null);
    const validExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadError('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایلی با پسوند woff2، woff، ttf یا otf انتخاب کنید.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('حجم فایل فونت نباید بیشتر از ۸ مگابایت باشد.');
      return;
    }

    setSelectedFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const cleanFamily = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    setUploadFontName(baseName);
    setUploadFontFamily(cleanFamily);
    setUploadFontDesc(`فونت بارگذاری شده (${(file.size / 1024).toFixed(0)} کیلوبایت)`);

    // Create temporary dataUrl for instant preview
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewDataUrl(result);
      // Inject temp font-face for instant preview in this modal
      const tempStyle = document.createElement('style');
      tempStyle.id = 'temp-preview-font-style';
      tempStyle.textContent = `
        @font-face {
          font-family: 'TempPreviewFont_${cleanFamily}';
          src: url('${result}') format('woff2');
        }
      `;
      const prev = document.getElementById('temp-preview-font-style');
      if (prev) prev.remove();
      document.head.appendChild(tempStyle);
    };
    reader.readAsDataURL(file);
    sounds.playPop();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('لطفاً ابتدا یک فایل فونت انتخاب یا رها کنید.');
      return;
    }
    if (!uploadFontName.trim()) {
      setUploadError('نام نمایشی فونت الزامی است.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const createdFont = await uploadCustomFont(
        selectedFile,
        uploadFontName.trim(),
        uploadFontFamily.trim() || undefined,
        uploadFontDesc.trim() || undefined
      );

      setSelectedFile(null);
      setPreviewDataUrl(null);
      setUploadFontName('');
      setUploadFontFamily('');
      setUploadFontDesc('');
      setActiveTab('list');
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 2500);
      handleSelect(createdFont.id);
    } catch (err: any) {
      setUploadError(err.message || 'خطا در بارگذاری فونت بر روی سرور.');
    } finally {
      setIsUploading(false);
    }
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
        description: fontDesc.trim() || 'فونت سفارشی وب',
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
                <h3 className="text-base font-black text-white">مدیریت و آپلود فونت‌های سیستم</h3>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  مدیریت فونت
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                تغییر فونت کل سیستم، آپلود فایل فونت شخصی یا اتصال به CDNهای وب‌فونت
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

        {/* Tab switchers: Font list vs Upload Font vs Add URL */}
        <div className="flex items-center p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 flex-shrink-0 gap-1">
          <button
            type="button"
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
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>آپلود فایل فونت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>افزودن با لینک وب</span>
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
                          فونت سفارشی / آپلود شده
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
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="حذف فونت سفارشی"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live preview in this font */}
                  <div
                    className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-200 transition-colors"
                    style={{ fontFamily: font.family }}
                  >
                    «تسک‌روز؛ تمرکز، بهره‌وری پایدار، پومودورو تیمی و شکوفایی استعداد»
                    <div className="text-[11px] text-zinc-400 mt-1">
                      ارقام فارسی: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ • ساعت: ۱۴:۳۰
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: UPLOAD FONT FILE */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pl-1">
            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".woff2,.woff,.ttf,.otf"
              className="hidden"
            />

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-500 hover:bg-zinc-800/30'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedFile.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      حجم فایل: {(selectedFile.size / 1024).toFixed(1)} کیلوبایت • آماده آپلود و اعمال
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-indigo-400 hover:underline pt-1 inline-block"
                  >
                    انتخاب فایل دیگر
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      فایل فونت را اینجا رها کنید یا برای انتخاب کلیک کنید
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      فرمت‌های مجاز: <span className="text-zinc-300 font-mono">.woff2, .woff, .ttf, .otf</span> (حداکثر ۸ مگابایت)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Card if file selected */}
            {selectedFile && previewDataUrl && (
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  پیش‌نمایش زنده با فونت بارگذاری شده:
                </span>
                <div
                  className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 text-sm text-zinc-100"
                  style={{ fontFamily: `TempPreviewFont_${uploadFontFamily}, 'Vazirmatn', sans-serif` }}
                >
                  «تسک‌روز؛ نظم ذهنی، بهره‌وری پایدار و شکوفایی استعداد»
                  <div className="text-xs text-zinc-400 mt-1">
                    ۱۲۳۴۵۶۷۸۹۰ - شنبه، یکشنبه، دوشنبه، سه‌شنبه • ۱۴:۳۰
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            {selectedFile && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      نام نمایشی فونت <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadFontName}
                      onChange={(e) => setUploadFontName(e.target.value)}
                      placeholder="مثال: ایران نستعلیق، ساحل بولد"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">
                      نام CSS Family
                    </label>
                    <input
                      type="text"
                      value={uploadFontFamily}
                      onChange={(e) => setUploadFontFamily(e.target.value)}
                      placeholder="IranNastaliq"
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500 font-mono text-left"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    توضیحات کوتاه
                  </label>
                  <input
                    type="text"
                    value={uploadFontDesc}
                    onChange={(e) => setUploadFontDesc(e.target.value)}
                    placeholder="مثال: فونت سازمانی آپلود شده توسط مدیر"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-md"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال آپلود و ذخیره فونت...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>آپلود، ذخیره و اعمال بر کل سیستم</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewDataUrl(null);
                  setActiveTab('list');
                }}
                className="px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADD FONT VIA WEB URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pl-1">
            {formError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                نام نمایشی فونت <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="مثال: لاله زار، ایران سنس، شبنم"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                نام Family فونت در CSS <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="مثال: Lalezar یا Shabnam"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500 font-mono text-left"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                لینک استایل‌شیت یا فایل فونت (اختیاری برای فونت‌های محلی)
              </label>
              <input
                type="url"
                value={fontUrl}
                onChange={(e) => setFontUrl(e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=Lalezar&display=swap"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500 font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                توضیحات فونت
              </label>
              <input
                type="text"
                value={fontDesc}
                onChange={(e) => setFontDesc(e.target.value)}
                placeholder="توضیح کوتاه درباره کاربرد این فونت"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-white text-xs outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>ذخیره و اعمال فونت جدید</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs flex-shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازنشانی به وزیرمتن پیش‌فرض</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
