import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { X, Copy, Check, Share2, Download, Upload } from 'lucide-react';
import { sounds } from '../utils/sound';

export const ExportShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    getDailySummaryText,
    tasks,
    importTasksJSON,
  } = useTask();

  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isShareModalOpen) return null;

  const summaryText = getDailySummaryText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      sounds.playComplete();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'گزارش تسک‌های روزانه من',
          text: summaryText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tasks_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importTasksJSON(content);
      if (ok) {
        setImportStatus('تسک‌ها با موفقیت بازیابی شدند!');
        setTimeout(() => {
          setImportStatus(null);
          setIsShareModalOpen(false);
        }, 1500);
      } else {
        setImportStatus('خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              اشتراک‌گذاری و پشتیبان‌گیری
            </h3>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text report preview */}
        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            متن گزارش روزانه (آماده برای ارسال در تلگرام/واتساپ):
          </label>
          <div className="flex-1 min-h-[140px] max-h-[220px] bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-y-auto text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
            {summaryText}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                کپی شد!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                کپی متن گزارش
              </>
            )}
          </button>

          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4 text-indigo-500" />
            اشتراک‌گذاری مستقیم
          </button>
        </div>

        {/* JSON Backup & Restore */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            فایل پشتیبان کامل:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              دانلود نسخه پشتیبان (JSON)
            </button>

            <label className="flex-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              بازیابی از فایل
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
          {importStatus && (
            <p className="text-center text-xs font-bold text-emerald-500 pt-1">
              {importStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
