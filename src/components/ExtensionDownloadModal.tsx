import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  CheckSquare,
  Clock,
  Sparkles,
  Timer,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface ExtensionDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionDownloadModal: React.FC<ExtensionDownloadModalProps> = ({ isOpen, onClose }) => {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'edge' | 'firefox'>('chrome');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const directZipUrl = '/api/download.php?file=extension';

  const rawGithubUrl = 'https://raw.githubusercontent.com/Smohamad933/M-app/arena/01a0c425-m-app/bagtime-extension.zip';

  const handleCopyLink = () => {
    sounds.playPop();
    navigator.clipboard.writeText(rawGithubUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownload = () => {
    sounds.playPop();
    const link = document.createElement('a');
    link.href = directZipUrl;
    link.download = 'bagtime-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-l from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                افزونه دستیار شخصی بگ تایم (نیوتَب مرورگر)
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                ویژه گوگل کروم، مایکروسافت اج و موزیلا فایرفاکس در حالت توسعه‌دهنده (Developer Mode)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-slate-800">تسک‌های روزانه</div>
              <div className="text-[10px] text-slate-500">تیک‌زدن و افزودن سریع</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-slate-800">تایم‌لاین ساعتی</div>
              <div className="text-[10px] text-slate-500">مشخص‌بودن زمان فعلی</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-slate-800">تایمر پومودورو</div>
              <div className="text-[10px] text-slate-500">زنگ اتمام و استراحت</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-slate-800">یادداشت‌های سریع</div>
              <div className="text-[10px] text-slate-500">ذخیره خودکار در مرورگر</div>
            </div>
          </div>

          {/* Download Action Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>فایل بسته افزونه آماده دریافت است</span>
              </div>
              <p className="text-[11px] text-emerald-800/80">
                شامل کدهای Manifest V3، فایل صفحه هوم‌پیج نیوتَب، استایل‌ها، آیکون‌ها و پاپ‌آپ سریع.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود bagtime-extension.zip</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="کپی لینک مستقیم خام گیت‌هاب"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'لینک کپی شد' : 'کپی لینک مستقیم'}</span>
              </button>
            </div>
          </div>

          {/* Browser Selection Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">
                راهنمای نصب گام‌به‌گام در مرورگر:
              </span>
              <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedBrowser('chrome');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedBrowser === 'chrome'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  گوگل کروم / بریو
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedBrowser('edge');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedBrowser === 'edge'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مایکروسافت اج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedBrowser('firefox');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedBrowser === 'firefox'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  موزیلا فایرفاکس
                </button>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
              {selectedBrowser === 'chrome' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۱</span>
                    <span>فایل <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-indigo-600">bagtime-extension.zip</code> را دانلود و اکسترکت (استخراج) کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۲</span>
                    <span>مرورگر کروم را باز کنید و آدرس <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800" dir="ltr">chrome://extensions</code> را در نوار آدرس وارد کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۳</span>
                    <span>در گوشه بالای صفحه، کلید <strong>حالت توسعه‌دهنده (Developer mode)</strong> را روشن کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۴</span>
                    <span>روی دکمه <strong>بارگذاری پوشه بازشده (Load unpacked)</strong> کلیک کرده و پوشه استخراج‌شده افزونه را انتخاب فرمایید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۵</span>
                    <span>اکنون کافی است کلید <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">Ctrl + T</kbd> یا دکمه تب جدید را بزنید؛ صفحه دستیار شخصی بگ تایم باز می‌شود!</span>
                  </div>
                </>
              )}

              {selectedBrowser === 'edge' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۱</span>
                    <span>فایل زیپ افزونه را دانلود کرده و آن را اکسترکت کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۲</span>
                    <span>در نوار آدرس اج وارد کنید: <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800" dir="ltr">edge://extensions</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۳</span>
                    <span>از منوی سمت چپ، گزینه <strong>Developer mode</strong> را فعال کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۴</span>
                    <span>روی دکمه <strong>Load unpacked</strong> کلیک کرده و پوشه را انتخاب کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۵</span>
                    <span>یک تب جدید در مایکروسافت اج باز کنید و برنامه‌ریزی روزانه خود را شروع نمایید!</span>
                  </div>
                </>
              )}

              {selectedBrowser === 'firefox' && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۱</span>
                    <span>فایل زیپ افزونه را اکسترکت کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۲</span>
                    <span>در آدرس‌بار فایرفاکس وارد کنید: <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800" dir="ltr">about:debugging#/runtime/this-firefox</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۳</span>
                    <span>روی دکمه <strong>Load Temporary Add-on...</strong> کلیک کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۴</span>
                    <span>فایل <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-indigo-600">manifest.json</code> موجود در پوشه افزونه را انتخاب کنید.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">۵</span>
                    <span>افزونه بلافاصله روی فایرفاکس فعال شده و صفحه New Tab تبدیل به دستیار می‌شود.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            نسخه افزونه: ۱.۰.۰ • کاملاً مستقل و آفلاین
          </span>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
