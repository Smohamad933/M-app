import React, { useState, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { IRAN_PROVINCES, POPULAR_JOBS, SUGGESTED_SKILLS } from '../utils/iranLocations';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  User as UserIcon,
  Camera,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';

const PERSIAN_MONTHS = [
  { val: '01', name: 'فروردین' },
  { val: '02', name: 'اردیبهشت' },
  { val: '03', name: 'خرداد' },
  { val: '04', name: 'تیر' },
  { val: '05', name: 'مرداد' },
  { val: '06', name: 'شهریور' },
  { val: '07', name: 'مهر' },
  { val: '08', name: 'آبان' },
  { val: '09', name: 'آذر' },
  { val: '10', name: 'دی' },
  { val: '11', name: 'بهمن' },
  { val: '12', name: 'اسفند' },
];

const BIRTH_YEARS = Array.from({ length: 65 }, (_, i) => String(1395 - i));
const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, globalSettings, tasks } = useTask();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [province, setProvince] = useState(currentUser?.province || 'تهران');
  const [city, setCity] = useState(currentUser?.city || 'تهران');

  // Birth date parse
  const initialBirth = (currentUser?.birthDate || '1380/01/01').split('/');
  const [birthYear, setBirthYear] = useState(initialBirth[0] || '1380');
  const [birthMonth, setBirthMonth] = useState(initialBirth[1] || '01');
  const [birthDay, setBirthDay] = useState(initialBirth[2] || '01');

  // Job title
  const jobCategories = (globalSettings?.jobCategories && globalSettings.jobCategories.length > 0)
    ? globalSettings.jobCategories
    : POPULAR_JOBS;
  const initialJobIsCustom = currentUser?.jobTitle && !jobCategories.includes(currentUser.jobTitle);
  const [jobTitle, setJobTitle] = useState(initialJobIsCustom ? 'custom' : (currentUser?.jobTitle || jobCategories[0]));
  const [customJob, setCustomJob] = useState(initialJobIsCustom ? (currentUser?.jobTitle || '') : '');

  // Skills
  const [skills, setSkills] = useState<string[]>(Array.isArray(currentUser?.skills) ? currentUser.skills : []);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Avatar (Base64 dataUrl)
  const [avatar, setAvatar] = useState<string | null>(currentUser?.avatar || null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cities for selected province
  const currentCities = IRAN_PROVINCES.find((p) => p.name === province)?.cities || ['تهران'];

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const cities = IRAN_PROVINCES.find((p) => p.name === newProv)?.cities || [];
    setCity(cities[0] || 'مرکز استان');
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('حجم تصویر نباید بیشتر از ۳ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      sounds.playPop();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    sounds.playPop();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSkillTag = (skillName: string) => {
    if (skills.includes(skillName)) {
      setSkills(skills.filter((s) => s !== skillName));
    } else {
      setSkills([...skills, skillName]);
    }
    sounds.playPop();
  };

  const handleAddCustomSkill = () => {
    const val = newSkillInput.trim();
    if (!val) return;
    if (!skills.includes(val)) {
      setSkills([...skills, val]);
      setNewSkillInput('');
      sounds.playPop();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (!name.trim()) {
      setError('وارد کردن نام و نام خانوادگی الزامی است.');
      return;
    }

    if (!phone.trim()) {
      setError('وارد کردن شماره تماس (موبایل) الزامی است.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('کلمه عبور جدید با تکرار آن یکسان نیست.');
      return;
    }

    const finalJob = (jobTitle === 'custom' ? customJob.trim() : jobTitle) || 'سایر / فریلنسر آزاد';
    const finalBirthDate = `${birthYear}/${birthMonth}/${birthDay}`;

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        province,
        city,
        birthDate: finalBirthDate,
        jobTitle: finalJob,
        skills,
        avatar: avatar || undefined,
        newPassword: newPassword ? newPassword.trim() : undefined,
      });

      setSaveSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره اطلاعات پروفایل.');
    } finally {
      setIsSaving(false);
    }
  };

  // Performance metrics for current user
  const userTasks = tasks.filter((t) => t.userId === currentUser?.id || !t.userId);
  const doneTasks = userTasks.filter((t) => t.completed).length;
  const totalTasksCount = userTasks.length;
  const progressRate = totalTasksCount > 0 ? Math.round((doneTasks / totalTasksCount) * 100) : 0;

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 text-zinc-400">
        لطفاً ابتدا وارد حساب کاربری خود شوید.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-zinc-900/80 p-5 sm:p-6 rounded-3xl border border-zinc-800 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar Upload Area */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-800 border-2 border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-xl">
              {avatar ? (
                <img
                  src={avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-white">
                  {currentUser.name.slice(0, 1)}
                </span>
              )}
            </div>

            {/* Camera Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[11px] font-bold"
              title="تغییر تصویر پروفایل"
            >
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span>تغییر عکس</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">{currentUser.name}</h2>
              {currentUser.role === 'admin' ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  مدیر کل (Mohusyn)
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  کاربر سامانه
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono">@{currentUser.username}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                بارگذاری تصویر جدید
              </button>
              {avatar && (
                <>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف تصویر
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
          <div className="text-center px-3 border-l border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">نرخ تکمیل</span>
            <span className="text-base font-black text-emerald-400">{toPersianDigits(progressRate)}٪</span>
          </div>
          <div className="text-center px-3 border-l border-zinc-800">
            <span className="text-[10px] text-zinc-500 block">تسک‌ها</span>
            <span className="text-base font-black text-white">
              {toPersianDigits(doneTasks)}/{toPersianDigits(totalTasksCount)}
            </span>
          </div>
          <div className="text-center px-3">
            <span className="text-[10px] text-zinc-500 block">عضویت</span>
            <span className="text-xs font-mono text-zinc-300">
              {toPersianDigits((currentUser.createdAt || '').slice(0, 10))}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>اطلاعات پروفایل و تنظیمات کاربری شما با موفقیت در دیتابیس مرکزی ذخیره شد.</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <X className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 sm:p-7 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <UserIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-black text-white">اطلاعات هویتی و مشخصات فردی</h3>
        </div>

        {/* Name and Username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
              placeholder="نام و نام خانوادگی"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">نام کاربری (غیرقابل تغییر)</label>
            <input
              type="text"
              disabled
              value={currentUser.username}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/60 text-zinc-500 font-mono text-xs outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Contact Info: Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                شماره تماس (موبایل) <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-indigo-500"
              placeholder="09123456789"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>ایمیل معتبر (Gmail)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-indigo-500"
              placeholder="yourname@gmail.com"
            />
          </div>
        </div>

        {/* Province & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>استان محل سکونت</span>
            </label>
            <select
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              {IRAN_PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-300">شهر محل سکونت</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              {currentCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Jalali Birth Date Selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>تاریخ تولد (شمسی)</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {toPersianDigits(birthYear)}/{toPersianDigits(birthMonth)}/{toPersianDigits(birthDay)}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <span className="block text-[10px] text-zinc-500 mb-1">روز</span>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
              >
                {BIRTH_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {toPersianDigits(parseInt(d, 10))}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-zinc-500 mb-1">ماه</span>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
              >
                {PERSIAN_MONTHS.map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-zinc-500 mb-1">سال</span>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none font-mono focus:border-indigo-500"
              >
                {BIRTH_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
            <span>حوزه کاری و عنوان تخصص</span>
          </label>
          <select
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500 mb-2 cursor-pointer"
          >
            {jobCategories.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
            <option value="custom">+ عنوان یا حوزه کاری دیگر (تایپ دستی)...</option>
          </select>
          {jobTitle === 'custom' && (
            <input
              type="text"
              required
              value={customJob}
              onChange={(e) => setCustomJob(e.target.value)}
              placeholder="عنوان شغلی دقیق خود را بنویسید..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-indigo-500/60 text-white text-xs outline-none animate-in fade-in"
              autoFocus
            />
          )}
        </div>

        {/* Skills Tag Cloud */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>مهارت‌های کلیدی و تخصص‌ها</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {toPersianDigits(skills.length)} مهارت انتخاب‌شده
            </span>
          </label>

          {/* Active Skills Badges */}
          <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 min-h-[50px]">
            {skills.length === 0 ? (
              <span className="text-xs text-zinc-500 py-1">هنوز مهارتی انتخاب نشده است. از گزینه‌های زیر اضافه کنید.</span>
            ) : (
              skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-bold"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkillTag(sk)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Suggested Skills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkillTag(s)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>

          {/* Add custom skill */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="مهارت دیگر (تایپ کنید و + را بزنید)..."
              className="flex-1 px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-3 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">تغییر کلمه عبور (اختیاری)</h3>
          </div>
          <p className="text-xs text-zinc-400">
            در صورتی که می‌خواهید رمز عبور خود را تغییر دهید، فیلدهای زیر را تکمیل کنید. در غیر این صورت آن را خالی بگذارید.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">کلمه عبور جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۴ کاراکتر"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">تکرار کلمه عبور جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار کلمه عبور جدید"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات پروفایل'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
