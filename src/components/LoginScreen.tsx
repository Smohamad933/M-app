import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { TaskMasterHexagon } from './TaskMasterLogo';
import type { AppDeveloper } from '../types';
import {
  Lock,
  User,
  ArrowLeft,
  UserPlus,
  LogIn,
  Timer,
  Phone,
  Mail,
  Check,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register, globalSettings, getText } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // App branding (custom logo & appName)
  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'تسک‌روز';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;

  // App developers configured by admin
  const appDevelopers = useMemo(() => {
    if (globalSettings?.appDevelopers && globalSettings.appDevelopers.length > 0) {
      return globalSettings.appDevelopers;
    }
    return [
      {
        id: 'dev_mohusyn',
        name: 'Mohusyn',
        role: 'توسعه‌دهنده ارشد و معمار سیستم',
        avatarUrl: null,
      },
    ];
  }, [globalSettings?.appDevelopers]);

  // Detect if user is joining via room invite link
  const inviteRoom = typeof window !== 'undefined' 
    ? (new URLSearchParams(window.location.search).get('room') || 
       new URLSearchParams(window.location.search).get('room_id') || 
       sessionStorage.getItem('taskrooz_pending_room'))
    : null;

  // Basic Auth fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!username.trim() || !password.trim()) {
          setError("لطفاً نام کاربری و کلمه عبور را وارد کنید.");
          setLoading(false);
          return;
        }
        await login(username.trim(), password);
      } else {
        // Fast, frictionless registration
        if (!name.trim() || !username.trim() || !password.trim()) {
          setError("لطفاً نام، نام کاربری و کلمه عبور را تکمیل کنید.");
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError("شماره تماس (موبایل) الزامی است.");
          setLoading(false);
          return;
        }
        const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
        if (!/^09\d{9}$/.test(cleanPhone)) {
          setError("شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).");
          setLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          setError("نام کاربری باید حداقل ۳ کاراکتر باشد.");
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError("کلمه عبور باید حداقل ۴ کاراکتر باشد.");
          setLoading(false);
          return;
        }

        await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: cleanPhone,
          email: email.trim(),
        });
      }
    } catch (err: any) {
      setError(err.message || (mode === "login" ? "نام کاربری یا رمز عبور اشتباه است." : "خطا در ایجاد حساب کاربری."));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
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
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center font-bold">
            ثبت‌نام سریع و رایگان در تسک‌روز
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

          {/* REGISTER QUICK FORM */}
          {mode === "register" && (
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
                  <span>ایمیل معتبر (اختیاری)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 font-mono text-xs outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 leading-relaxed font-medium">
                💡 ساخت حساب رایگان است. پس از ورود، اطلاعات تکمیلی در اولین ورود تکمیل می‌شود.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading
                ? "لطفاً شکیبا باشید..."
                : mode === "login"
                ? "ورود به داشبورد"
                : "ثبت‌نام و ایجاد حساب کاربری 🚀"}
              {mode === "login" ? (
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>

        {/* App Developers Footer - Configured by Admin in Panel */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center -space-x-2 space-x-reverse">
            {appDevelopers.slice(0, 4).map((dev: AppDeveloper) => (
              <div
                key={dev.id}
                title={`${dev.name} (${dev.role})`}
                className="relative group cursor-pointer"
              >
                {dev.avatarUrl ? (
                  <img
                    src={dev.avatarUrl}
                    alt={dev.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                    {dev.name.charAt(0)}
                  </div>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1.5 right-0 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-xl whitespace-nowrap shadow-lg z-30 pointer-events-none">
                  <span className="font-black">{dev.name}</span>
                  <span className="text-[9px] text-slate-300">{dev.role}</span>
                </div>
              </div>
            ))}
            {appDevelopers.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center">
                +{toPersianDigits(appDevelopers.length - 4)}
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-700 block">
              اعضای توسعه‌دهنده این آپ
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {appDevelopers.map((d: AppDeveloper) => d.name).join('، ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
