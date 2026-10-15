import React, { useRef, useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface MonthlyReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReportCardModal: React.FC<MonthlyReportCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, currentUser, streak } = useTask();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Focus Garden Plant info
  const userKey = currentUser?.id || 'guest';
  let gardenLevel = 1;
  let gardenSpecies = 'شبدر چهارپر';
  try {
    const gData = localStorage.getItem(`taskrooz_garden_${userKey}`);
    if (gData) {
      const g = JSON.parse(gData);
      gardenLevel = Math.floor((g.xp || 0) / 100) + 1;
    }
    const cData = localStorage.getItem(`taskrooz_customization_${userKey}`);
    if (cData) {
      const c = JSON.parse(cData);
      const names: Record<string, string> = {
        clover: 'شبدر چهارپر',
        cactus: 'کاکتوس صخره‌ای',
        bamboo: 'بامبو شانس',
        bonsai: 'بونسای ژاپنی',
        sunflower: 'آفتابگردان زرین',
        magicTree: 'درخت جادویی کهکشانی',
      };
      if (c.species && names[c.species]) gardenSpecies = names[c.species];
    }
  } catch {}

  const now = new Date();
  const jalaliMonthYear = now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
  });

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    sounds.playPop();

    try {
      const element = cardRef.current;
      let dataUrl: string;

      try {
        dataUrl = await toPng(element, {
          canvasWidth: 1080,
          canvasHeight: 1920,
          backgroundColor: '#0a0d14',
          cacheBust: true,
          style: {
            letterSpacing: '0px',
            fontFamily: 'Vazirmatn, Sahel, Shabnam, system-ui, sans-serif',
          },
        });
      } catch (err) {
        console.warn('Fallback to skipFonts toPng', err);
        dataUrl = await toPng(element, {
          canvasWidth: 1080,
          canvasHeight: 1920,
          backgroundColor: '#0a0d14',
          skipFonts: true,
          style: {
            letterSpacing: '0px',
          },
        });
      }

      const link = document.createElement('a');
      link.download = `bagtime-card-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sounds.playComplete();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b'],
        });
      } catch {}
    } catch (e) {
      console.error('Failed to export report card', e);
      alert('خطا در دانلود تصویر کارنامه.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">
              کارت کارنامه عملکرد و استاتوس ماهانه
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-black/40">
          {/* THE 1080x1920 STORY CANVAS */}
          <div
            ref={cardRef}
            className="w-[340px] h-[604px] rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-950 to-zinc-950 border border-indigo-500/30 p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl select-none"
            style={{
              boxShadow: '0 20px 50px rgba(99,102,241,0.2)',
              letterSpacing: '0px',
            }}
          >
            {/* Background glowing orbs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header: App Brand & Date */}
            <div className="flex items-center justify-between z-10 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-black text-xs shadow-md">
                  BT
                </div>
                <div>
                  <div className="text-xs font-black tracking-wide">بَـگ‌تـایـم</div>
                  <div className="text-[10px] text-zinc-400">کارنامه ماهانه عملکرد</div>
                </div>
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-indigo-300 border border-white/10">
                  {jalaliMonthYear}
                </span>
              </div>
            </div>

            {/* User Profile Spotlight */}
            <div className="flex items-center gap-3.5 my-3 z-10 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-black text-white shadow-lg shrink-0">
                {currentUser?.name ? currentUser.name.slice(0, 1) : 'ک'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black truncate">{currentUser?.name || 'کاربر پرتلاش'}</div>
                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {currentUser?.jobTitle || 'عضو رسمی جامعه بگ‌تایم'}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5 z-10 my-1">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-bold">تسک‌های انجام‌شده</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black mt-2 text-white">
                  {toPersianDigits(completedTasks)}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">
                  پیشرفت {toPersianDigits(successRate)}٪
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-bold">زمان تمرکز عمیق</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black mt-2 text-white">
                  {toPersianDigits(totalFocusHours)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  ساعت در پومودورو
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-bold">زنجیره استمرار</span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black mt-2 text-white">
                  {toPersianDigits(streak.currentStreak)}
                </div>
                <div className="text-[10px] text-rose-400 font-bold mt-1">
                  روز مداومت پیوسته
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-bold">باغچه تمرکز</span>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xl font-black mt-2 text-white truncate">
                  سطح {toPersianDigits(gardenLevel)}
                </div>
                <div className="text-[10px] text-teal-300 font-bold mt-1 truncate">
                  {gardenSpecies}
                </div>
              </div>
            </div>

            {/* Motivational Footer */}
            <div className="z-10 p-3 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-emerald-900/40 border border-white/10 text-center">
              <p className="text-[11px] font-bold text-zinc-200">
                «پشتکار و تمرکز روزانه، تفاوتی نامرئی است که نتایجی خارق‌العاده خلق می‌کند.»
              </p>
            </div>

            {/* Bottom Signature */}
            <div className="flex items-center justify-between text-[9px] text-zinc-500 z-10 pt-2 border-t border-white/10">
              <span>تولید شده در پلتفرم بگ‌تایم</span>
              <span>bagtime.negahm.ir</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            بستن
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <span>در حال تولید فایل باکیفیت...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>دانلود کارت با کیفیت عالی (Story 9:16)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
