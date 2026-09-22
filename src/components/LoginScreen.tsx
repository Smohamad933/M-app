import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { IRAN_PROVINCES, POPULAR_JOBS, SUGGESTED_SKILLS } from '../utils/iranLocations';
import { toPersianDigits } from '../utils/persianDate';
import { TaskMasterHexagon } from './TaskMasterLogo';
import {
  AvatarMichie,
  AvatarDesigner,
  AvatarDeveloper,
  AvatarProductManager,
} from '../utils/designAvatars';
import {
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

  // App branding (custom logo & appName)
  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'تسک‌روز';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;

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

  // Searchable skill picker state - user constraint: do not display all skills, find via search
  const [skillSearchOpen, setSkillSearchOpen] = useState(false);
  const matchingSkills = (() => {
    const q = customSkillInput.trim();
    if (!q) return [];
    const pool = SUGGESTED_SKILLS.filter((s) => s.includes(q));
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
    <div className="min-h-screen bg-[#edf0f4] flex flex-col items-center justify-center p-3 sm:p-6 selection:bg-[#121212] selection:text-white w-full overflow-x-hidden">
      <div className={`w-full ${mode === 'register' ? 'max-w-lg' : 'max-w-md'} bg-white rounded-[32px] sm:rounded-[36px] p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] border border-slate-200/70 space-y-6 animate-in fade-in zoom-in-95 transition-all`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100" />
            ) : (
              <TaskMasterHexagon size={54} className="shadow-xs" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1">
              <span>{appName}</span>
              <span className="text-[#00b884]">.</span>
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              روزت رو شروع کن و پرانرژی باش ✌️
            </p>
          </div>
        </div>

        {/* Room Invite Banner if any */}
        {inviteRoom && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-900 text-xs border border-indigo-200/80 text-center font-bold animate-in fade-in space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-indigo-950 font-black">
              <Timer className="w-4 h-4 text-indigo-600" />
              <span>{getText('inviteBannerTitle')}</span>
            </div>
            <p className="text-[11px] font-medium text-indigo-700">
              {getText('inviteBannerText')}
            </p>
          </div>
        )}

        {/* Tab switch between Login and Register (Dribbble pill style) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#121212] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#121212] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            ثبت‌نام کامل
          </button>
        </div>

        {/* Step indicator for Registration */}
        {mode === 'register' && (
          <div className="flex items-center justify-between text-xs px-2 pt-1 border-b border-slate-100 pb-3">
            <div className={`flex items-center gap-1.5 font-extrabold ${registerStep === 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${registerStep === 1 ? 'bg-[#121212] text-white' : 'bg-slate-200 text-slate-600'}`}>
                ۱
              </span>
              <span>اطلاعات امنیتی و تماس</span>
            </div>
            <div className={`flex items-center gap-1.5 font-extrabold ${registerStep === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${registerStep === 2 ? 'bg-[#121212] text-white' : 'bg-slate-200 text-slate-500'}`}>
                ۲
              </span>
              <span>شغل، شهر و مهارت‌ها</span>
            </div>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-200 leading-relaxed font-bold animate-in fade-in flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00b884] flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200 text-center font-bold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'login' && (
            <>
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">نام کاربری</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری شما"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs font-mono outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                    autoFocus
                  />
                  <User className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">کلمه عبور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور شما"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
                </div>
              </div>
            </>
          )}

          {/* REGISTER STEP 1 */}
          {mode === 'register' && registerStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سید محمدحسین"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">
                    نام کاربری <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="انگلیسی (ali_m)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 font-mono text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">
                    کلمه عبور <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
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
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 font-mono text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>ایمیل معتبر (Gmail)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 font-mono text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* REGISTER STEP 2: PROFILE & SKILLS */}
          {mode === 'register' && registerStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>استان</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden"
                  >
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">شهر</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden"
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
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاریخ تولد (شمسی)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {toPersianDigits(birthYear)}/{toPersianDigits(birthMonth)}/{toPersianDigits(birthDay)}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-0.5">روز</span>
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden"
                    >
                      {BIRTH_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {toPersianDigits(parseInt(d, 10))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-0.5">ماه</span>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden"
                    >
                      {PERSIAN_MONTHS.map((m) => (
                        <option key={m.val} value={m.val}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500 mb-0.5">سال</span>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full px-2 py-2 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden font-mono"
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
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>حوزه کاری و نوع تخصص</span>
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 text-xs outline-hidden mb-1.5"
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
                    className="w-full px-3 py-2 rounded-2xl bg-white border border-[#00b884] text-slate-900 text-xs outline-hidden placeholder:text-slate-400 animate-in fade-in"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700">
                  مهارت‌های کلیدی (جهت تحلیل هوش مصنوعی)
                </label>

                {/* Selected skills as removable chips */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => toggleSkill(s)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
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
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
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
                    className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-[#f8fafc] border border-slate-200 text-slate-800 text-[11px] outline-hidden placeholder:text-slate-400"
                  />

                  {/* Suggestions dropdown */}
                  {skillSearchOpen && matchingSkills.length > 0 && (
                    <div className="absolute z-30 top-full right-0 left-0 mt-1 max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 animate-in fade-in">
                      <div className="text-[9px] text-slate-400 px-2 py-1">
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
                          className="w-full text-right px-2.5 py-1.5 rounded-xl text-[11px] text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-[#00b884]" />
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
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold transition-all text-xs cursor-pointer"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'در حال ایجاد حساب...' : 'تکمیل ثبت‌نام و ورود مستقیم'}
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRegisterOnly}
                  disabled={loading}
                  className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-[#00b884] border border-[#00b884]/40 font-bold text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت‌نام و بازگشت به صفحه ورود</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading
                  ? 'لطفاً شکیبا باشید...'
                  : mode === 'login'
                  ? 'ورود به داشبورد'
                  : 'مرحله بعد: تکمیل تخصص و پروفایل'}
                {mode === 'login' ? (
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            )}
          </div>
        </form>

        {/* Team Avatars Footer Preview matching Dribbble reference */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center -space-x-2 space-x-reverse">
            <AvatarMichie size={30} className="border-2 border-white shadow-xs" />
            <AvatarDesigner size={30} className="border-2 border-white shadow-xs" />
            <AvatarDeveloper size={30} className="border-2 border-white shadow-xs" />
            <AvatarProductManager size={30} className="border-2 border-white shadow-xs" />
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center">
              ۱۰+
            </div>
          </div>
          <span className="text-[11px] font-extrabold text-slate-400">
            تیم خلاق و هوشمند
          </span>
        </div>
      </div>
    </div>
  );
};
