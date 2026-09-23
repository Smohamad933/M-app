import React, { useState, useRef, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';
import { IRAN_PROVINCES, POPULAR_JOBS } from '../utils/iranLocations';
import { sounds } from '../utils/sound';
import type { UserTimeline } from '../types';
import {
  X,
  Camera,
  Trash2,
  Save,
  Lock,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Wrench,
  Clock,
  UserRound,
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

/**
 * Read an image file, center-crop to a square and downscale to max 256px,
 * then return a compact JPEG data URL (keeps db.json small).
 */
function processAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خواندن فایل ناموفق بود.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فایل تصویر معتبر نیست.'));
      img.onload = () => {
        try {
          const MAX = 256;
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = MAX;
          canvas.height = MAX;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas در دسترس نیست.');
          ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX, MAX);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (e: any) {
          reject(e);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const TIMELINE_FIELDS: { key: keyof UserTimeline; label: string }[] = [
  { key: 'wakeUp', label: 'بیداری' },
  { key: 'workStart', label: 'شروع کار' },
  { key: 'lunch', label: 'ناهار' },
  { key: 'gym', label: 'ورزش' },
  { key: 'sleep', label: 'خواب' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateMyProfile } = useTask();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [province, setProvince] = useState(currentUser?.province || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [skills, setSkills] = useState<string[]>(currentUser?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [timeline, setTimeline] = useState<Record<string, string>>({
    wakeUp: currentUser?.dailyTimeline?.wakeUp || '',
    workStart: currentUser?.dailyTimeline?.workStart || '',
    lunch: currentUser?.dailyTimeline?.lunch || '',
    gym: currentUser?.dailyTimeline?.gym || '',
    sleep: currentUser?.dailyTimeline?.sleep || '',
  });
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cities = IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('لطفاً یک فایل تصویر (JPG/PNG) انتخاب کنید.');
      return;
    }
    try {
      const dataUrl = await processAvatarFile(file);
      if (dataUrl.length > 600000) {
        setError('حجم تصویر بعد از فشرده‌سازی بزرگ است؛ تصویری با کیفیت کمتر انتخاب کنید.');
        return;
      }
      setAvatar(dataUrl);
      setError(null);
      sounds.playPop();
    } catch (e: any) {
      setError(e.message || 'خطا در پردازش تصویر.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    if (skills.includes(val)) return;
    setSkills([...skills, val]);
    setSkillInput('');
    sounds.playPop();
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!name.trim()) {
      setError('نام و نام خانوادگی الزامی است.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tl: UserTimeline = {};
      TIMELINE_FIELDS.forEach(({ key }) => {
        if (timeline[key]) (tl as any)[key] = timeline[key];
      });
      await updateMyProfile({
        id: currentUser.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        province,
        city: city.trim(),
        birthDate: birthDate.trim(),
        jobTitle: jobTitle.trim(),
        skills,
        dailyTimeline: tl as Record<string, string>,
        avatar: avatar ?? null,
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'خطا در ذخیره پروفایل.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 text-slate-800 text-xs outline-none focus:border-slate-800 focus:bg-white transition-all';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-[32px] p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserRound className="w-5 h-5 text-slate-700" />
            ویرایش پروفایل من
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold">
              @{currentUser?.username}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{error}</div>
        )}

        {/* Avatar section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-4">
          <div className="relative">
            <UserAvatar name={name} avatar={avatar} size="w-20 h-20 text-2xl" className="border-2 border-[#00b884]" />
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                fileRef.current?.click();
              }}
              className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-full bg-[#121212] hover:bg-black text-white flex items-center justify-center border-2 border-white transition-colors cursor-pointer shadow-md"
              title="تغییر عکس پروفایل"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="text-xs font-black text-slate-800">عکس پروفایل</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              عکس در اندازه ۲۵۶ پیکسل فشرده و روی سرور ذخیره می‌شود. در لیست اعضا، اتاق‌های تمرکز و پنل مدیر نمایش داده می‌شود.
            </p>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => {
                  fileRef.current?.click();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#121212] hover:bg-black text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-[#00b884]" />
                {avatar ? 'تغییر عکس' : 'انتخاب عکس'}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatar(undefined);
                    sounds.playPop();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف عکس
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-slate-400" />
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              شماره موبایل
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0912..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              ایمیل
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              تاریخ تولد (شمسی)
            </label>
            <input type="text" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} placeholder="۱۳۸۰/۰۱/۰۱" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              استان
            </label>
            <select value={province} onChange={(e) => { setProvince(e.target.value); setCity(''); }} className={inputCls}>
              <option value="">انتخاب نشد</option>
              {IRAN_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">شهر</label>
            {province ? (
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}>
                <option value="">انتخاب نشد</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="اول استان را انتخاب کنید" />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              عنوان شغلی
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className={inputCls}
              placeholder="مثال: توسعه‌دهنده نرم‌افزار"
              list="profile-job-suggestions"
            />
            <datalist id="profile-job-suggestions">
              {POPULAR_JOBS.map((j: string) => (
                <option key={j} value={j} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            مهارت‌ها
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[8px]">
            {skills.map((sk) => (
              <span key={sk} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
                {sk}
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((s) => s !== sk))}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="مثلاً: React، مدیریت پروژه، عکاسی..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#f8fafc] border border-slate-200 text-slate-800 text-xs outline-none focus:border-slate-800"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              افزودن
            </button>
          </div>
        </div>

        {/* Daily routine */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            روتین روزانه ۲۴ ساعته
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TIMELINE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <div className="text-[10px] text-slate-400 mb-1 font-bold">{label}</div>
                <input
                  type="text"
                  value={timeline[key]}
                  onChange={(e) => setTimeline({ ...timeline, [key]: e.target.value })}
                  placeholder="۰۷:۰۰"
                  className="w-full px-2 py-1.5 rounded-lg bg-[#f8fafc] border border-slate-200 text-center font-mono text-xs text-slate-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            تغییر رمز عبور <span className="text-slate-400 font-normal">(اختیاری)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="در صورت خالی بودن، رمز تغییر نمی‌کند"
            className={inputCls}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#121212] hover:bg-black text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#00b884]" />
            {saving ? 'در حال ذخیره...' : 'ذخیره پروفایل'}
          </button>
        </div>
      </div>
    </div>
  );
};
