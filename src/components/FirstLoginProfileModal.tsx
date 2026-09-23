import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { IRAN_PROVINCES, POPULAR_JOBS } from '../utils/iranLocations';
import {
  Calendar,
  MapPin,
  Briefcase,
  Mail,
  Clock,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

interface FirstLoginProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstLoginProfileModal: React.FC<FirstLoginProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateMyProfile, globalSettings } = useTask();

  const [birthYear, setBirthYear] = useState('1375');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthDay, setBirthDay] = useState('01');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [province, setProvince] = useState(currentUser?.province || 'تهران');
  const [city, setCity] = useState(currentUser?.city || 'تهران');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || 'برنامه‌نویس و توسعه‌دهنده نرم‌افزار');
  const [customJob, setCustomJob] = useState('');
  const [wakeUp, setWakeUp] = useState(currentUser?.dailyTimeline?.wakeUp || '07:00');
  const [workStart, setWorkStart] = useState(currentUser?.dailyTimeline?.workStart || '08:30');
  const [workEnd, setWorkEnd] = useState(currentUser?.dailyTimeline?.workEnd || '17:00');
  const [sleep, setSleep] = useState(currentUser?.dailyTimeline?.sleep || '23:30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCities = IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  const handleProvinceChange = (pName: string) => {
    setProvince(pName);
    const p = IRAN_PROVINCES.find((item) => item.name === pName);
    if (p && p.cities.length > 0) {
      setCity(p.cities[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!city.trim() || !province.trim()) {
      setError('لطفاً استان و شهر محل سکونت خود را انتخاب کنید.');
      return;
    }

    const finalJob = (jobTitle === 'custom' ? customJob.trim() : jobTitle) || 'سایر / کارشناس آزاد';
    if (!finalJob) {
      setError('لطفاً عنوان شغلی خود را مشخص فرمایید.');
      return;
    }

    const finalBirthDate = `${birthYear}/${birthMonth}/${birthDay}`;

    setIsSubmitting(true);
    try {
      if (currentUser?.id) {
        await updateMyProfile({
          id: currentUser.id,
          birthDate: finalBirthDate,
          province,
          city,
          jobTitle: finalJob,
          email: email.trim(),
          dailyTimeline: {
            wakeUp,
            workStart,
            workEnd,
            sleep,
          },
        });
      }
      sounds.playComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت اطلاعات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Persian years from 1330 to 1395
  const years = Array.from({ length: 66 }, (_, i) => String(1395 - i));
  const months = [
    { num: '01', name: 'فروردین' },
    { num: '02', name: 'اردیبهشت' },
    { num: '03', name: 'خرداد' },
    { num: '04', name: 'تیر' },
    { num: '05', name: 'مرداد' },
    { num: '06', name: 'شهریور' },
    { num: '07', name: 'مهر' },
    { num: '08', name: 'آبان' },
    { num: '09', name: 'آذر' },
    { num: '10', name: 'دی' },
    { num: '11', name: 'بهمن' },
    { num: '12', name: 'اسفند' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const jobsList = globalSettings?.jobCategories && globalSettings.jobCategories.length > 0
    ? globalSettings.jobCategories
    : POPULAR_JOBS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="text-center space-y-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[22px] flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
            تکمیل شناسنامه کاربری در تسک‌روز
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            به تسک‌روز خوش آمدید! جهت امکان همکاری در پروژه‌های تیمی، یافتن همکاران و هماهنگی زمان‌بندی روزانه، لطفاً شناسنامه خود را تکمیل کنید:
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Jalali Birthdate 3-dropdowns */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>تاریخ تولد (شمسی) <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>

              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Province & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>استان محل سکونت <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
              >
                {IRAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                شهر محل سکونت <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
              >
                {currentCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job / Profession */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <span>عنوان شغلی یا حوزه تخصصی <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
            >
              {jobsList.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
              <option value="custom">سایر / عنوان سفارشی...</option>
            </select>
            {jobTitle === 'custom' && (
              <input
                type="text"
                required
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
                placeholder="عنوان شغلی خود را بنویسید..."
                className="w-full px-3 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>آدرس ایمیل (جهت اطلاع‌رسانی‌ها)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
            />
          </div>

          {/* Daily Routine 24h timeline */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>برنامه روتین شبانه‌روزی (جهت خط زمان‌بندی روزانه):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">ساعت بیداری</span>
                <input
                  type="time"
                  value={wakeUp}
                  onChange={(e) => setWakeUp(e.target.value)}
                  className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">شروع کار</span>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">پایان کار</span>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">ساعت خواب</span>
                <input
                  type="time"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-white text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت شناسنامه...' : 'ثبت نهایی شناسنامه و ورود به تسک‌روز 🚀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
