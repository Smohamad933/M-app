import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { IRAN_PROVINCES, POPULAR_JOBS, SUGGESTED_SKILLS } from '../utils/iranLocations';
import { toPersianDigits } from '../utils/persianDate';
import {
  CheckSquare,
  Lock,
  User,
  ArrowLeft,
  UserPlus,
  LogIn,
  Timer,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Check,
  Search,
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

export const LoginScreen: React.FC = () => {
  const { login, register, globalSettings, getText } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Detect if user is joining via room invite link
  const inviteRoom = typeof window !== 'undefined' 
    ? (new URLSearchParams(window.location.search).get('room') || 
       new URLSearchParams(window.location.search).get('room_id') || 
       sessionStorage.getItem('taskrooz_pending_room'))
    : null;

  // Basic Auth fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Rich Profile fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  
  // Persian Birth Date Dropdown Selectors
  const [birthYear, setBirthYear] = useState('1380');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthDay, setBirthDay] = useState('01');

  // Dynamic job categories loaded from global settings or default
  const jobCategories = (globalSettings?.jobCategories && globalSettings.jobCategories.length > 0)
    ? globalSettings.jobCategories
    : POPULAR_JOBS;

  const [jobTitle, setJobTitle] = useState(jobCategories[0] || 'برنامه‌نویس و توسعه‌دهنده نرم‌افزار');
  const [customJob, setCustomJob] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['مدیریت پروژه و تایم منیجمنت']);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available cities for selected province
  const currentCities = IRAN_PROVINCES.find((p) => p.name === province)?.cities || ['تهران'];

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const cities = IRAN_PROVINCES.find((p) => p.name === newProvince)?.cities || [];
    setCity(cities[0] || 'مرکز استان');
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  // Searchable skill picker state
  const [skillSearchOpen, setSkillSearchOpen] = useState(false);
  const matchingSkills = (() => {
    const q = customSkillInput.trim();
    const pool = q
      ? SUGGESTED_SKILLS.filter((s) => s.includes(q))
      : SUGGESTED_SKILLS;
    return pool.filter((s) => !selectedSkills.includes(s)).slice(0, 8);
  })();

  const addSkillFromList = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setCustomSkillInput('');
    sounds.playPop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If registering and still on step 1, advance to step 2 first
    if (mode === 'register' && registerStep === 1) {
      if (!name.trim() || !username.trim() || !password.trim()) {
        setError('لطفاً نام، نام کاربری و کلمه عبور را تکمیل کنید.');
        return;
      }
      if (!phone.trim()) {
        setError('شماره تماس (موبایل) الزامی است.');
        return;
      }
      const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      if (!/^09\d{9}$/.test(cleanPhone)) {
        setError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).');
        return;
      }
      if (username.trim().length < 3) {
        setError('نام کاربری باید حداقل ۳ کاراکتر باشد.');
        return;
      }
      if (password.length < 4) {
        setError('کلمه عبور باید حداقل ۴ کاراکتر باشد.');
        return;
      }
      setRegisterStep(2);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        if (!username.trim() || !password.trim()) {
          setError('لطفاً نام کاربری و کلمه عبور را وارد کنید.');
          setLoading(false);
          return;
        }
        await login(username.trim(), password);
      } else {
        // Register Mode with all complete details
        const finalJob = (jobTitle === 'custom' ? customJob.trim() : jobTitle) || 'سایر / فریلنسر آزاد';
        const finalBirthDate = `${birthYear}/${birthMonth}/${birthDay}`;

        await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()),
          email: email.trim(),
          province,
          city,
          birthDate: finalBirthDate,
          jobTitle: finalJob,
          skills: selectedSkills,
        });
      }
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? 'نام کاربری یا رمز عبور اشتباه است.' : 'خطا در ایجاد حساب کاربری.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOnly = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('شماره تماس (موبایل) الزامی است.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }
    setLoading(true);
    try {
      const finalJob = (jobTitle === 'custom' ? customJob.trim() : jobTitle) || 'سایر / فریلنسر آزاد';
      const finalBirthDate = `${birthYear}/${birthMonth}/${birthDay}`;
      await api.register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        phone: cleanPhone,
        email: email.trim(),
        province,
        city,
        birthDate: finalBirthDate,
        jobTitle: finalJob,
        skills: selectedSkills,
      });
      // Clear session token so admin or user can log in freshly
      await api.logout();
      setMode('login');
      setRegisterStep(1);
      setSuccessNotice(`✅ کاربر «${name.trim()}» با موفقیت ثبت شد. حالا می‌توانید وارد حساب او شوید.`);
      sounds.playComplete();
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد حساب کاربری.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setRegisterStep(1);
    setError(null);
    setSuccessNotice(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-3 sm:p-4 selection:bg-white selection:text-zinc-950 w-full overflow-x-hidden">
      <div className={`w-full ${mode === 'register' ? 'max-w-md' : 'max-w-sm'} bg-zinc-900/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-zinc-800 space-y-5 backdrop-blur-xl animate-in fade-in zoom-in-95 transition-all`}>
        
        {/* Brand signature matching mohusyn.ir */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <CheckSquare className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {mode === 'login' ? `ورود به ${getText('appName')}` : 'ایجاد حساب کاربری جدید'}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono tracking-wide">
              {getText('loginSubtitle')}
            </p>
          </div>
        </div>

        {/* Room Invite Banner if any */}
        {inviteRoom && (
          <div className="p-3 rounded-2xl bg-indigo-950/40 text-indigo-300 text-xs border border-indigo-800/60 text-center font-bold animate-in fade-in space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-white">
              <Timer className="w-4 h-4 text-indigo-400" />
              <span>{getText('inviteBannerTitle')}</span>
            </div>
            <p className="text-[11px] font-normal text-indigo-200">
              {getText('inviteBannerText')}
            </p>
          </div>
        )}

        {/* Tab switch between Login and Register */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950/70 rounded-2xl border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            ثبت‌نام کامل
          </button>
        </div>

        {/* Step indicator for Registration */}
        {mode === 'register' && (
          <div className="flex items-center justify-between text-xs px-2 pt-1">
            <div className={`flex items-center gap-1.5 font-bold ${registerStep === 1 ? 'text-white' : 'text-zinc-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${registerStep === 1 ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}>
                ۱
              </span>
              <span>اطلاعات امنیتی و تماس</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${registerStep === 2 ? 'text-white' : 'text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${registerStep === 2 ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                ۲
              </span>
              <span>شغل، شهر و مهارت‌ها</span>
            </div>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 text-emerald-300 text-xs border border-emerald-800/80 leading-relaxed font-bold animate-in fade-in flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/40 text-rose-400 text-xs border border-rose-800/60 text-center font-bold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'login' && (
            <>
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">نام کاربری</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری شما"
                    className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                    autoFocus
                  />
                  <User className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">کلمه عبور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور شما"
                    className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
                </div>
              </div>
            </>
          )}

          {/* REGISTER STEP 1 */}
          {mode === 'register' && registerStep === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="font-bold text-zinc-300">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سید محمدحسین"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">
                    نام کاربری <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="انگلیسی (ali_m)"
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">
                    کلمه عبور <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
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
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹ (الزامی)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ایمیل معتبر (Gmail)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          {/* REGISTER STEP 2: PROFILE & SKILLS */}
          {mode === 'register' && registerStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>استان</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden"
                  >
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">شهر</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden"
                  >
                    {currentCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* JALALI BIRTH DATE 3-DROPDOWN SELECTOR */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>تاریخ تولد (شمسی)</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {toPersianDigits(birthYear)}/{toPersianDigits(birthMonth)}/{toPersianDigits(birthDay)}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[10px] text-zinc-400 mb-0.5">روز</span>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden"
                    >
                      {BIRTH_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {toPersianDigits(parseInt(d, 10))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-400 mb-0.5">ماه</span>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden"
                    >
                      {PERSIAN_MONTHS.map((m) => (
                        <option key={m.val} value={m.val}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-400 mb-0.5">سال</span>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden font-mono"
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

              {/* DYNAMIC JOB CATEGORIES & CUSTOM INPUT */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>حوزه کاری و نوع تخصص</span>
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden mb-1.5"
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
                    placeholder="عنوان شغلی یا حوزه تخصصی خود را بنویسید..."
                    className="w-full px-3 py-2 rounded-2xl bg-zinc-800/90 border border-indigo-500/60 text-white text-xs outline-hidden placeholder:text-zinc-500 animate-in fade-in"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  مهارت‌های کلیدی (جهت تحلیل هوش مصنوعی)
                </label>

                {/* Selected skills as removable chips */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-xl bg-white text-zinc-950 font-bold shadow-xs"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => toggleSkill(s)}
                          className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                          title="حذف مهارت"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Searchable skill picker — no full list wall */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => {
                      setCustomSkillInput(e.target.value);
                      setSkillSearchOpen(true);
                    }}
                    onFocus={() => setSkillSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSkillSearchOpen(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    placeholder="جستجوی مهارت... (تایپ کنید یا Enter بزنید)"
                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-white text-[11px] outline-hidden placeholder:text-zinc-500"
                  />

                  {/* Suggestions dropdown */}
                  {skillSearchOpen && matchingSkills.length > 0 && (
                    <div className="absolute z-30 top-full right-0 left-0 mt-1 max-h-44 overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-1.5 animate-in fade-in">
                      <div className="text-[9px] text-zinc-500 px-2 py-1">
                        {customSkillInput.trim() ? 'نتایج جستجو' : 'پیشنهادی'}
                      </div>
                      {matchingSkills.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addSkillFromList(s);
                          }}
                          className="w-full text-right px-2.5 py-1.5 rounded-xl text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-emerald-500" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2">
            {mode === 'register' && registerStep === 2 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all text-xs cursor-pointer"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'در حال ایجاد حساب...' : 'تکمیل ثبت‌نام و ورود مستقیم'}
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterOnly}
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl bg-zinc-850 hover:bg-zinc-800 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت‌نام و بازگشت به صفحه ورود</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  'در حال پردازش...'
                ) : mode === 'login' ? (
                  <>
                    <span>ورود به حساب کاربری</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>مرحله بعدی (اطلاعات تکمیلی)</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Mode switch helper text */}
        <div className="text-center pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
          {mode === 'login' ? (
            <p>
              حساب کاربری ندارید؟{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                ثبت نام رایگان با اطلاعات کامل
              </button>
            </p>
          ) : (
            <p>
              قبلاً ثبت نام کرده‌اید؟{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-white font-bold hover:underline cursor-pointer"
              >
                وارد شوید
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 text-[11px] text-zinc-400 font-mono tracking-wider">
        mohusyn.ir • ۲۰۲۶
      </div>
    </div>
  );
};
