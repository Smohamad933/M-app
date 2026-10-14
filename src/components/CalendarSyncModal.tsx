import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Calendar,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ isOpen, onClose }) => {
  const { tasks, selectedDate, currentUser } = useTask();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter tasks with dates
  const scheduledTasks = tasks.filter((t) => t.date);

  // Generate standard iCalendar (.ics) content
  const generateICS = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BagTime//Task Management Calendar//FA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:برنامه‌ها و تسک‌های بَگ‌تایم',
      'X-WR-TIMEZONE:Asia/Tehran',
    ];

    scheduledTasks.forEach((t) => {
      // Date format: YYYYMMDD
      const dateClean = t.date.replace(/-/g, '');
      const timeStart = (t.time || '09:00').replace(':', '') + '00';
      const dtStart = `${dateClean}T${timeStart}`;
      
      const duration = t.durationMinutes || 45;
      const startH = parseInt(timeStart.substring(0, 2), 10);
      const startM = parseInt(timeStart.substring(2, 4), 10);
      const totalEndMins = (startH * 60) + startM + duration;
      const endH = String(Math.floor(totalEndMins / 60) % 24).padStart(2, '0');
      const endM = String(totalEndMins % 60).padStart(2, '0');
      const dtEnd = `${dateClean}T${endH}${endM}00`;
      
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:task_${t.id}@bagtime.negahm.ir`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push(`DTSTART;TZID=Asia/Tehran:${dtStart}`);
      lines.push(`DTEND;TZID=Asia/Tehran:${dtEnd}`);
      lines.push(`SUMMARY:${t.title}`);
      lines.push(`DESCRIPTION:${t.description || 'ثبت شده در سامانه مدیریت زمان بَگ‌تایم'}`);
      lines.push(`STATUS:${t.completed ? 'COMPLETED' : 'CONFIRMED'}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };

  const handleDownloadICS = () => {
    sounds.playComplete();
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `bagtime-tasks-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Calendar Quick Web Link for selected day's first pending task
  const pendingForDay = tasks.filter((t) => (t.date === (selectedDate || new Date().toISOString().split('T')[0])) && !t.completed);
  const sampleTask = pendingForDay[0] || tasks[0];

  const getGoogleCalendarUrl = (t?: typeof sampleTask) => {
    if (!t) return 'https://calendar.google.com/calendar/u/0/r';
    const dateClean = t.date.replace(/-/g, '');
    const timeStart = (t.time || '09:00').replace(':', '') + '00';
    const dates = `${dateClean}T${timeStart}/${dateClean}T${timeStart}`;
    const text = encodeURIComponent(t.title);
    const details = encodeURIComponent(t.description || 'ثبت شده از طریق بَگ‌تایم');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
  };

  const getOutlookUrl = (t?: typeof sampleTask) => {
    if (!t) return 'https://outlook.live.com/calendar/0/deeplink/compose';
    const subject = encodeURIComponent(t.title);
    const body = encodeURIComponent(t.description || 'ثبت شده از طریق بَگ‌تایم');
    const startdt = `${t.date}T${t.time || '09:00'}:00`;
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}&startdt=${startdt}`;
  };

  const syncFeedUrl = `https://bagtime.negahm.ir/api/calendar-feed.php?token=${currentUser?.id || 'public'}`;

  const handleCopyFeed = () => {
    sounds.playPop();
    navigator.clipboard.writeText(syncFeedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                خروجی تقویم و همگام‌سازی ابری
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                انتقال تسک‌ها به تقویم رسمی گوشی، گوگل و اوت‌لوک
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

        {/* 1. Download .ICS Button */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-xs sm:text-sm">
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>دانلود فایل استاندارد تقویم (.ics)</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {toPersianDigits(scheduledTasks.length)} رویداد
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
            این فایل مستقیماً روی تمامی گوشی‌های اندروید، آیفون و تقویم ویندوز باز شده و تمام کارهای زمان‌دار شما را به تقویم رسمی تلفن همراه اضافه می‌کند.
          </p>
          <button
            type="button"
            onClick={handleDownloadICS}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>دریافت و دانلود فایل تقویم iCalendar</span>
          </button>
        </div>

        {/* 2. Direct Sync to Google / Outlook */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            افزودن مستقیم به تقویم‌های آنلاین:
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Google Calendar */}
            <a
              href={getGoogleCalendarUrl(sampleTask)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Google Calendar
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
            </a>

            {/* Microsoft Outlook */}
            <a
              href={getOutlookUrl(sampleTask)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Outlook Calendar
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
            </a>
          </div>
        </div>

        {/* 3. Live Subscription Feed URL */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            آدرس فید اشتراکی همگام‌سازی بلادرنگ (WebCal Feed):
          </span>
          <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
            <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 truncate flex-1" dir="ltr">
              {syncFeedUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyFeed}
              className="p-2 rounded-lg bg-white dark:bg-zinc-700 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
