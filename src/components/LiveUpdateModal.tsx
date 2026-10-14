import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileArchive,
  RefreshCw,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface LiveUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveUpdateModal: React.FC<LiveUpdateModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useTask();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.zip')) {
        alert('لطفاً تنها فایل با فرمت ZIP آپلود نمایید.');
        return;
      }
      setSelectedFile(file);
      setResultMessage(null);
      sounds.playPop();
    }
  };

  const handleStartUpdate = async () => {
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    setResultMessage(null);
    setUploadProgress(15);
    sounds.playPop();

    try {
      const userToken = (currentUser as any)?.token || localStorage.getItem('taskrooz_token') || currentUser?.id || '';
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (userToken) {
        formData.append('token', userToken);
      }
      if (currentUser?.username) {
        formData.append('username', currentUser.username);
      }

      setUploadProgress(45);

      const response = await fetch('./api/update.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Auth-Token': userToken,
        },
        body: formData,
      });

      setUploadProgress(85);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در اعمال به‌روزرسانی زنده.');
      }

      setUploadProgress(100);
      sounds.playComplete();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {}

      setResultMessage({
        type: 'success',
        text: `سامانه با موفقیت به‌روزرسانی شد! (${data.files_updated} فایل جایگزین شد). صفحه تا لحظاتی دیگر رفرش می‌شود...`,
      });

      // Auto-reload after 2.5 seconds to load new frontend bundle
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err: any) {
      console.error('Update failed:', err);
      sounds.playComplete();
      setResultMessage({
        type: 'error',
        text: err.message || 'خطا در ارتباط با سرور یا پردازش فایل زیپ.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-zinc-800 space-y-5 relative my-auto select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>به‌روزرسانی زنده و بدون قطعی سرور</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  Zero-Downtime
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                آپلود فایل زیپ سورس و جایگزینی آنی بدون نیاز به خروج از دسترس
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Protection Note */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>محافظت خودکار از داده‌ها:</strong> در این فرآیند دیتابیس کاربران (<code className="font-mono text-[11px]">data/db.json</code> و MySQL) و فایل تنظیمات دیتابیس (<code className="font-mono text-[11px]">config.php</code>) کاملاً حفظ شده و هیچ‌گونه اطلاعاتی پاک نمی‌شود.
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-3xl text-center space-y-2.5 cursor-pointer transition-all ${
            selectedFile
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-zinc-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-zinc-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            {selectedFile ? (
              <FileArchive className="w-6 h-6 text-emerald-500" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {selectedFile ? selectedFile.name : 'انتخاب یا رها کردن فایل زیپ سورس (taskrooz-source.zip)'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {selectedFile
                ? `حجم فایل: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} مگابایت`
                : 'برای انتخاب فایل روی این کادر کلیک کنید'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-bold">
              <span>در حال ارسال، استخراج و به‌روزرسانی زنده...</span>
              <span className="font-mono">{uploadProgress}٪</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result Message */}
        {resultMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
              resultMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-800 dark:text-red-300'
            }`}
          >
            {resultMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{resultMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleStartUpdate}
            disabled={!selectedFile || isUploading}
            className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
            <span>{isUploading ? 'در حال اعمال به‌روزرسانی...' : 'شروع به‌روزرسانی زنده'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
