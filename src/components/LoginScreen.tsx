import React, { useState, useMemo, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { api } from '../services/api';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
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
  X,
  Bot,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register, completeBaleVerification, globalSettings, getText } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedDevForModal, setSelectedDevForModal] = useState<AppDeveloper | null>(null);

  // Bale Verification Modal State
  const [baleVerificationData, setBaleVerificationData] = useState<{
    userId: string;
    username: string;
    phone: string;
    verificationCode: string;
    baleBotUsername: string;
    baleBotLink: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  // App branding (custom logo & appName)
  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'بگ تایم';
  const appLogo = typeof appBranding?.logoDataUrl === 'string' ? appBranding.logoDataUrl : null;

  // Real-time verification polling while verification modal is open
  useEffect(() => {
    if (!baleVerificationData?.userId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const check = await api.checkVerification(baleVerificationData.userId);
        if (check.verified && check.user && isMounted) {
          sounds.playComplete();
          completeBaleVerification(check.user);
          setBaleVerificationData(null);
        }
      } catch {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [baleVerificationData?.userId]);

  const handleManualVerify = async () => {
    if (!baleVerificationData?.userId) return;
    setIsVerifyingManual(true);
    sounds.playPop();
    try {
      const res = await api.manualVerify(baleVerificationData.userId);
      if (res.verified && res.user) {
        sounds.playComplete();
        completeBaleVerification(res.user);
        setBaleVerificationData(null);
      }
    } catch (e: any) {
      alert(e.message || 'خطا در تأیید حساب');
    } finally {
      setIsVerifyingManual(false);
    }
  };

  const handleCopyCode = () => {
    if (!baleVerificationData?.verificationCode) return;
    navigator.clipboard.writeText(baleVerificationData.verificationCode);
    setCopiedCode(true);
    sounds.playPop();
    setTimeout(() => setCopiedCode(false), 2500);
  };

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

        const regRes = await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          phone: cleanPhone,
          email: email.trim(),
        });

        if (regRes?.requiresVerification) {
          setBaleVerificationData({
            userId: regRes.user.id,
            username: regRes.user.username,
            phone: cleanPhone,
            verificationCode: regRes.verificationCode,
            baleBotUsername: regRes.baleBotUsername || 'BagTime_Bot',
            baleBotLink: regRes.baleBotLink || `https://ble.ir/BagTime_Bot?start=verify_${regRes.verificationCode}`,
          });
          return;
        }
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
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-700">کلمه عبور</label>
                  <a
                    href="https://t.me/Mohusyn_ir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    فراموشی رمز عبور؟
                  </a>
                </div>
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
            {appDevelopers.map((dev: AppDeveloper) => (
              <button
                key={dev.id}
                type="button"
                onClick={() => setSelectedDevForModal(dev)}
                title={`${dev.name} (${dev.role}) - کلیک برای مشاهده پروفایل کامل`}
                className="relative group cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              >
                {dev.avatarUrl ? (
                  <img
                    src={dev.avatarUrl}
                    alt={dev.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs">
                    {dev.name.charAt(0)}
                  </div>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1.5 right-0 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-xl whitespace-nowrap shadow-lg z-30 pointer-events-none">
                  <span className="font-black">{dev.name}</span>
                  <span className="text-[9px] text-slate-300">{dev.role}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-700 block">
              اعضای توسعه‌دهنده این آپ
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              جهت مشاهده پروفایل کلیک کنید
            </span>
          </div>
        </div>
      </div>

      {/* Developer Profile Modal */}
      {selectedDevForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedDevForModal(null)}
          dir="rtl"
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedDevForModal(null)}
              className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large Avatar */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                {selectedDevForModal.avatarUrl ? (
                  <img
                    src={selectedDevForModal.avatarUrl}
                    alt={selectedDevForModal.name}
                    className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-slate-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white font-black text-3xl flex items-center justify-center shadow-xl border-4 border-slate-100">
                    {selectedDevForModal.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold border-2 border-white shadow-xs">
                  توسعه‌دهنده 💻
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">{selectedDevForModal.name}</h3>
              <p className="text-xs font-bold text-indigo-600">{selectedDevForModal.role}</p>
            </div>

            {selectedDevForModal.bio && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                {selectedDevForModal.bio}
              </p>
            )}

            {selectedDevForModal.link && (
              <a
                href={selectedDevForModal.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-1"
              >
                <span>مشاهده وبسایت یا رزومه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setSelectedDevForModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* BALE BOT VERIFICATION MODAL */}
      {baleVerificationData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setBaleVerificationData(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                تأیید هویت شماره با ربات بله
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                کد فعال‌سازی اختصاصی شما صادر شد. جهت تأیید و ورود به برنامه، کافیست به ربات بله مراجعه کرده و کد زیر را ارسال فرمایید:
              </p>
            </div>

            {/* Bot ID Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">شناسه ربات رسمی:</span>
              <span className="font-mono font-black text-blue-700 dir-ltr">
                @{baleVerificationData.baleBotUsername.replace(/^@/, '')}
              </span>
            </div>

            {/* Verification Code Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-400">کد تأیید ۶ رقمی شما:</div>
              <div className="text-3xl font-black font-mono tracking-widest text-slate-900 select-all py-1">
                {toPersianDigits(baleVerificationData.verificationCode)}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'کد کپی شد!' : 'کپی کردن کد'}</span>
              </button>
            </div>

            {/* Live Polling Status */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 py-2 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>در انتظار تأیید خودکار توسط ربات بله...</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={baleVerificationData.baleBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>باز کردن ربات در بله و تأیید فوری 🚀</span>
              </a>

              <button
                type="button"
                onClick={handleManualVerify}
                disabled={isVerifyingManual}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                title="در صورت عدم دسترسی به بله یا کارکرد آفلاین"
              >
                {isVerifyingManual ? 'در حال فعال‌سازی...' : 'تأیید مستقیم (حالت آزمایشی / آفلاین)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
