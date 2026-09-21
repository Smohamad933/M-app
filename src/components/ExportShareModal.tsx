import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { X, Copy, Check, Share2, Download } from 'lucide-react';
import { sounds } from '../utils/sound';

export const ExportShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    getDailySummaryText,
    tasks,
  } = useTask();

  const [copied, setCopied] = useState(false);

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
        // User cancelled
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-zinc-300" />
            <h3 className="text-sm font-extrabold text-white">
              اشتراک‌گذاری گزارش روزانه
            </h3>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text report preview */}
        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-xs font-semibold text-zinc-400">
            متن گزارش روزانه:
          </label>
          <div className="flex-1 min-h-[140px] max-h-[220px] bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 overflow-y-auto text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
            {summaryText}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-xs'
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
            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-750 text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            اشتراک مستقیم
          </button>
        </div>

        {/* JSON Backup */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <button
            onClick={handleExportJSON}
            className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            دانلود فایل پشتیبان داده‌ها (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
