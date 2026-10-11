import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { IRAN_PROVINCES, POPULAR_JOBS } from '../utils/iranLocations';
import {
  MapPin,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface FirstLoginProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstLoginProfileModal: React.FC<FirstLoginProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateMyProfile, globalSettings } = useTask();

  const [province, setProvince] = useState(currentUser?.province || 'تهران');
  const [city, setCity] = useState(currentUser?.city || 'تهران');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || 'برنامه‌نویس و توسعه‌دهنده نرم‌افزار');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCities = IRAN_PROVINCES.find((p) => p.name === province)?.cities || ['تهران'];

  const handleProvinceChange = (pName: string) => {
    setProvince(pName);
    const p = IRAN_PROVINCES.find((item) => item.name === pName);
    if (p && p.cities.length > 0) {
      setCity(p.cities[0]);
    }
  };

  const handleSkipOrComplete = async (withDetails = true) => {
    setIsSubmitting(true);
    try {
      if (currentUser?.id) {
        // Mark locally first so user is NEVER blocked by network or server
        try {
          localStorage.setItem('taskrooz_user_profile_completed_' + currentUser.id, 'true');
        } catch {}

        if (withDetails) {
          // Attempt silent update to server; catch any 405/network errors gracefully
          try {
            await updateMyProfile({
              id: currentUser.id,
              province: province || 'تهران',
              city: city || 'تهران',
              jobTitle: jobTitle || 'کارشناس آزاد',
              isProfileCompleted: true,
            });
          } catch {
            // Silently handled: profile is already active locally
          }
        }
      }
    } finally {
      setIsSubmitting(false);
      sounds.playComplete();
      onClose();
    }
  };

  const jobsList = globalSettings?.jobCategories && globalSettings.jobCategories.length > 0
    ? globalSettings.jobCategories
    : POPULAR_JOBS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 text-slate-800"
        dir="rtl"
      >
        {/* Header */}
        <div className="text-center space-y-2 pb-2 border-b border-slate-100">
          <div className="w-13 h-13 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            خوش آمدید به بگ تایم (Bag Time) 👋
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            جهت شخصی‌سازی تجربه کاربری و ارتباط با همکاران، می‌توانید حوزه فعالیت خود را مشخص کنید:
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSkipOrComplete(true);
          }}
          className="space-y-3.5"
        >
          {/* Province & City */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>استان</span>
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-800 font-bold cursor-pointer"
              >
                {IRAN_PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                <span>شهر</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-800 font-bold cursor-pointer"
              >
                {currentCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job / Profession */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>عنوان شغلی یا تخصصی</span>
            </label>
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-800 font-bold cursor-pointer"
            >
              {jobsList.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Fast Submit + Instant Skip */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'در حال ورود...' : 'تأیید و ورود به برنامه 🚀'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSkipOrComplete(false)}
              className="w-full py-2 rounded-xl bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>رد شدن و ورود مستقیم</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
