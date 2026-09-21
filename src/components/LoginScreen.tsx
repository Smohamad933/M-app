import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { IRAN_PROVINCES, POPULAR_JOBS, SUGGESTED_SKILLS } from '../utils/iranLocations';
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
  Plus,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

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

  // Rich Profile fields (Requirement 4)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [birthDate, setBirthDate] = useState('');
  const [jobTitle, setJobTitle] = useState('برنامه‌نویس و توسعه‌دهنده نرم‌افزار');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If registering and still on step 1, advance to step 2 first
    if (mode === 'register' && registerStep === 1) {
      if (!name.trim() || !username.trim() || !password.trim()) {
        setError('لطفاً نام، نام کاربری و کلمه عبور را تکمیل کنید.');
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
        const finalJob = customJob.trim() ? customJob.trim() : jobTitle;

        await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim(),
          email: email.trim(),
          province,
          city,
          birthDate: birthDate.trim(),
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

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setRegisterStep(1);
    setError(null);
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
              {mode === 'login' ? 'ورود به تسک‌روز' : 'ایجاد حساب کاربری جدید'}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono tracking-wide">
              BUILT BY MOHUSYN
            </p>
          </div>
        </div>

        {/* Room Invite Banner if any */}
        {inviteRoom && (
          <div className="p-3 rounded-2xl bg-indigo-950/40 text-indigo-300 text-xs border border-indigo-800/60 text-center font-bold animate-in fade-in space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-white">
              <Timer className="w-4 h-4 text-indigo-400" />
              <span>دعوت‌نامه اتاق تمرکز گروهی</span>
            </div>
            <p className="text-[11px] font-normal text-indigo-200">
              وارد شوید یا حساب بسازید تا مستقیماً به اتاق متصل شوید.
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
                  <span>شماره تماس (موبایل)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
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

              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>تاریخ تولد (شمسی)</span>
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="مثال: ۱۳۸۰/۰۵/۱۴"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>شغل و نوع تخصص</span>
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden mb-1.5"
                >
                  {POPULAR_JOBS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={customJob}
                  onChange={(e) => setCustomJob(e.target.value)}
                  placeholder="یا عنوان شغلی دقیق خود را بنویسید (مثلاً: فیلمبردار مستند)"
                  className="w-full px-3 py-2 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 text-white text-xs outline-hidden placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  مهارت‌های کلیدی (جهت تحلیل هوش مصنوعی)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                  {SUGGESTED_SKILLS.map((s) => {
                    const isSelected = selectedSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`text-[10px] px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-zinc-950 font-bold shadow-xs'
                            : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                    placeholder="مهارت دیگر (تایپ کنید و + را بزنید)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-white text-[11px] outline-hidden placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2">
            {mode === 'register' && registerStep === 2 ? (
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
                  {loading ? 'در حال ایجاد حساب...' : 'تکمیل ثبت‌نام و ورود'}
                  <Check className="w-4 h-4 stroke-[3]" />
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
