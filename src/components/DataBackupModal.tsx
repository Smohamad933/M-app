import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const { tasks, projects, currentUser } = useTask();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const userKey = currentUser?.id || 'guest';
  const todayISO = new Date().toISOString().split('T')[0];

  // Export full JSON Backup
  const handleExportBackup = () => {
    sounds.playPop();

    try {
      const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        user: {
          id: currentUser?.id,
          username: currentUser?.username,
          name: currentUser?.name,
        },
        tasks,
        projects,
        habits: JSON.parse(localStorage.getItem(`taskrooz_micro_habits_${userKey}`) || '[]'),
        garden: JSON.parse(localStorage.getItem(`taskrooz_garden_${userKey}`) || '{}'),
        gardenCustomization: JSON.parse(localStorage.getItem(`taskrooz_customization_${userKey}`) || '{}'),
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `bagtime_backup_${todayISO}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
      setStatusMessage({
        type: 'success',
        text: `پشتیبان‌گیری از ${toPersianDigits(tasks.length)} تسک با موفقیت انجام و ذخیره شد.`,
      });
    } catch (e) {
      console.error('Backup error', e);
      setStatusMessage({
        type: 'error',
        text: 'خطا در ایجاد فایل پشتیبان.',
      });
    }
  };

  // Restore JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('لطفاً تنها فایل با پسوند .json انتخاب نمایید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setIsRestoring(true);
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data || (!data.tasks && !Array.isArray(data.tasks))) {
          throw new Error('ساختار فایل پشتیبان معتبر نمی‌باشد.');
        }

        // Restore tasks
        if (data.tasks) {
          localStorage.setItem(`tasks_${userKey}`, JSON.stringify(data.tasks));
        }

        // Restore habits
        if (data.habits) {
          localStorage.setItem(`taskrooz_micro_habits_${userKey}`, JSON.stringify(data.habits));
        }

        // Restore garden
        if (data.garden) {
          localStorage.setItem(`taskrooz_garden_${userKey}`, JSON.stringify(data.garden));
        }
        if (data.gardenCustomization) {
          localStorage.setItem(`taskrooz_customization_${userKey}`, JSON.stringify(data.gardenCustomization));
        }

        sounds.playComplete();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}

        setStatusMessage({
          type: 'success',
          text: 'اطلاعات با موفقیت بازیابی شد. برای اعمال کامل، صفحه تا ۳ ثانیه دیگر رفرش می‌شود...',
        });

        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } catch (err: any) {
        sounds.playPop();
        setStatusMessage({
          type: 'error',
          text: err.message || 'خطا در خواندن فایل پشتیبان.',
        });
      } finally {
        setIsRestoring(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                پشتیبان‌گیری محلی و بازیابی اطلاعات
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                حفاظت کامل و آفلاین از تسک‌ها، عادات و اطلاعات باغچه تمرکز
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                <FileJson className="w-4 h-4 text-indigo-500" />
                <span>دانلود نسخه پشتیبان (JSON)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                شامل {toPersianDigits(tasks.length)} تسک، عادات، سطح باغچه و تنظیمات
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل JSON</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>بازیابی اطلاعات از فایل</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                فایل JSON خروجی گرفته‌شده را انتخاب نمایید
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isRestoring ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>انتخاب و بازگردانی فایل</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span>داده‌ها به صورت استاندارد در حافظه مرورگر امن نگهداری می‌شوند.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
