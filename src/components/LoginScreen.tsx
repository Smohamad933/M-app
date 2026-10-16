import React, { useState, useMemo, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { api, setAuthToken, getAuthToken } from '../services/api';
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
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Code2,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

import { BaleVerificationModal, type BaleVerificationInfo } from './BaleVerificationModal';

export const LoginScreen: React.FC = () => {
  const { login, register, globalSettings, getText, completeBaleVerification } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedDevForModal, setSelectedDevForModal] = useState<AppDeveloper | null>(null);

  // Show/Hide password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Bale Verification Modal State
  const [baleVerificationData, setBaleVerificationData] = useState<BaleVerificationInfo | null>(null);

  // Bale Automatic Login State
  const [isStartingBaleLogin, setIsStartingBaleLogin] = useState(false);
  const [baleLoginModalData, setBaleLoginModalData] = useState<{
    ticket: string;
    baleBotUsername: string;
    baleBotLink: string;
    expiresIn: number;
  } | null>(null);
  const [balePollingActive, setBalePollingActive] = useState(false);

  // Bale Onboarding State (Set custom name, username, and password)
  const [baleOnboardingData, setBaleOnboardingData] = useState<{
    user: any;
    token: string;
  } | null>(null);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingUsername, setOnboardingUsername] = useState('');
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [onboardingConfirmPassword, setOnboardingConfirmPassword] = useState('');
  const [showOnboardingPassword, setShowOnboardingPassword] = useState(false);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [balePollingStep, setBalePollingStep] = useState<'pending' | 'waiting_contact'>('pending');

  // Bale Auto-Login Polling Effect
  useEffect(() => {
    if (!balePollingActive || !baleLoginModalData?.ticket) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.checkBaleLoginStatus(baleLoginModalData.ticket);
        if (!isMounted) return;
        if (res.status === 'waiting_contact') {
          setBalePollingStep('waiting_contact');
        } else if (res.status === 'approved' && res.token && res.user) {
          clearInterval(interval);
          setBalePollingActive(false);
          setBaleLoginModalData(null);
          setAuthToken(res.token);

          // 1. Immediately complete authentication & persist session in localStorage!
          completeBaleVerification(res.user, res.token);

          const isPlaceholderUsername = (res.user.username || '').toLowerCase().startsWith('bale_');
          if (res.isNewUser || isPlaceholderUsername) {
            setBaleOnboardingData({
              user: res.user,
              token: res.token,
            });
            setOnboardingName(res.user.name || '');
            setOnboardingUsername(isPlaceholderUsername ? '' : res.user.username);
            setOnboardingPassword('');
            setOnboardingConfirmPassword('');
          }
        }
      } catch (e) {
        // Continue polling
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [balePollingActive, baleLoginModalData, completeBaleVerification]);

  const handleCompleteBaleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baleOnboardingData) return;

    if (!onboardingName.trim()) {
      setOnboardingError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }
    const cleanUname = onboardingUsername.trim().toLowerCase();
    if (!cleanUname || cleanUname.length < 3) {
      setOnboardingError('نام کاربری باید حداقل ۳ کاراکتر انگلیسی باشد.');
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUname)) {
      setOnboardingError('نام کاربری فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و زیرخط (_) باشد.');
      return;
    }
    if (cleanUname === 'mohusyn') {
      setOnboardingError('این نام کاربری رزرو شده است.');
      return;
    }
    if (!onboardingPassword || onboardingPassword.length < 4) {
      setOnboardingError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (onboardingPassword !== onboardingConfirmPassword) {
      setOnboardingError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    setIsSubmittingOnboarding(true);
    setOnboardingError(null);
    try {
      setAuthToken(baleOnboardingData.token);
      let updatedUser: any = null;
      try {
        const res = await api.completeBaleOnboarding({
          userId: baleOnboardingData.user.id,
          token: baleOnboardingData.token,
          name: onboardingName.trim(),
          username: cleanUname,
          password: onboardingPassword,
          prevUsername: baleOnboardingData.user.username,
        });
        if (res && res.user) {
          updatedUser = res.user;
          if (res.token) setAuthToken(res.token);
        }
      } catch {
        // Fallback to updateMyProfile
        updatedUser = await api.updateMyProfile({
          id: baleOnboardingData.user.id,
          name: onboardingName.trim(),
          username: cleanUname,
          password: onboardingPassword,
        });
      }

      if (!updatedUser) {
        throw new Error('خطا در ثبت اطلاعات در سامانه.');
      }

      setBaleOnboardingData(null);
      const activeToken = baleOnboardingData.token || getAuthToken() || '';
      completeBaleVerification(updatedUser, activeToken);
    } catch (err: any) {
      setOnboardingError(err?.message || 'خطا در ثبت نام کاربری و رمز عبور');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const handleSkipBaleOnboarding = () => {
    setBaleOnboardingData(null);
  };

  const handleStartAutoBaleLogin = async () => {
    setIsStartingBaleLogin(true);
    setError(null);
    setBalePollingStep('pending');
    try {
      const res = await api.createBaleLoginTicket();
      if (res && res.ticket) {
        setBaleLoginModalData(res);
        setBalePollingActive(true);
        // Automatically open the Bale deep-link in a new tab/window
        if (res.baleBotLink) {
          window.open(res.baleBotLink, '_blank');
        }
      } else {
        setError('خطا در برقراری ارتباط با سرویس ورود بله. لطفاً بررسی کنید ربات بله در سرور فعال باشد.');
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در ایجاد نشست ورود با بله.');
    } finally {
      setIsStartingBaleLogin(false);
    }
  };

  // App branding (custom logo & appName)
  const appBranding = globalSettings?.appBranding;
  const appName = (appBranding?.appName || '').trim() || 'بگ تایم';
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
        try {
          await login(username.trim(), password);
        } catch (loginErr: any) {
          if (loginErr?.requiresVerification && loginErr?.userId) {
            setBaleVerificationData({
              userId: loginErr.userId,
              username: username.trim(),
              phone: loginErr.phone || '',
              verificationCode: loginErr.verificationCode,
              baleBotUsername: loginErr.baleBotUsername || 'BagTime_Bot',
              baleBotLink: loginErr.baleBotLink || `https://ble.ir/BagTime_Bot?start=verify_${loginErr.verificationCode}`,
            });
            setError(null);
            setLoading(false);
            return;
          }
          throw loginErr;
        }
      } else {
        // Strict registration with mandatory mobile phone
        if (!name.trim() || !username.trim() || !password.trim()) {
          setError("لطفاً نام، نام کاربری و کلمه عبور را تکمیل کنید.");
          setLoading(false);
          return;
        }

        if (!phone.trim()) {
          setError("شماره موبایل اجباری است. لطفاً شماره موبایل خود را وارد کنید.");
          setLoading(false);
          return;
        }

        const cleanPhone = phone.trim().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
        if (!/^09\d{9}$/.test(cleanPhone)) {
          setError("شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).");
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
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex flex-col items-center justify-center p-3.5 sm:p-6 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black w-full overflow-x-hidden relative transition-colors duration-300">
      {/* Ambient Aurora Glows */}
      <div className="absolute top-12 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Main Luxury Bento Glass Card */}
      <div className={`w-full ${mode === 'register' ? 'max-w-lg' : 'max-w-md'} bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl rounded-[36px] sm:rounded-[40px] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-black/[0.06] dark:border-white/[0.08] space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 transition-all relative z-10`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {appLogo ? (
              <div className="p-1 rounded-2xl bg-white dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
                <img src={appLogo} alt={appName} className="w-14 h-14 rounded-xl object-cover" />
              </div>
            ) : (
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-500/20 shadow-xs">
                <TaskMasterHexagon size={50} className="shadow-xs" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 tracking-tight font-mono">
              <span>{appName}</span>
              <span className="text-emerald-500">.</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400 mt-1">
              روزت رو شروع کن و پرانرژی باش ✌️
            </p>
          </div>
        </div>

        {/* Room Invite Banner if any */}
        {inviteRoom && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-xs border border-indigo-200/80 dark:border-indigo-800/60 text-center font-bold animate-in fade-in space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-indigo-950 dark:text-indigo-100 font-black">
              <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{getText('inviteBannerTitle')}</span>
            </div>
            <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              {getText('inviteBannerText')}
            </p>
          </div>
        )}

        {/* HERO: DIRECT BALE 1-CLICK LOGIN / REGISTER */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30 space-y-3.5 group">
          {/* Soft ambient highlight */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black backdrop-blur-xs">
                <Zap className="w-3 h-3 fill-current" />
                <span>سریع‌ترین و آسان‌ترین روش</span>
              </div>
              <h3 className="text-sm sm:text-base font-black leading-tight text-white">
                ورود یا ثبت‌نام مستقیم با پیام‌رسان بله
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium leading-relaxed">
                تنها با ۱ لمس در بازوی بله، بدون نیاز به پسورد یا پر کردن فرم‌های طولانی!
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartAutoBaleLogin}
            disabled={isStartingBaleLogin}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-emerald-800 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10"
          >
            {isStartingBaleLogin ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>در حال ایجاد نشست امن بله...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-emerald-600" />
                <span>ورود و ثبت‌نام آنی با بازوی بله 🚀</span>
              </>
            )}
          </button>
        </div>

        {/* OR DIVIDER */}
        <div className="relative my-1 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]"></div>
          </div>
          <div className="relative bg-white dark:bg-[#1c1c1e] px-3 text-[11px] font-bold text-slate-400 dark:text-zinc-500">
            یا با نام کاربری و کلمه عبور
          </div>
        </div>

        {/* Tab Switcher: Login vs Register (Apple Segmented Bar) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-[#252528] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-xs font-black gap-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-500" />
            <span>ورود به حساب</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
            <span>ثبت‌نام کامل</span>
          </button>
        </div>

        {/* Step indicator for Registration */}
        {mode === 'register' && (
          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-indigo-800 dark:text-indigo-300 text-center font-bold">
            ✨ عضویت رایگان و دسترسی به تمام ابزارهای هوشمند
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs border border-emerald-200/80 dark:border-emerald-800/60 leading-relaxed font-bold animate-in fade-in flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200/80 dark:border-rose-800/60 text-center font-bold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'login' && (
            <>
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 dark:text-zinc-300">نام کاربری</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری شما"
                    className="w-full pl-3 pr-10 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-mono outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    autoFocus
                  />
                  <User className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-700 dark:text-zinc-300">کلمه عبور</label>
                  <a
                    href="https://t.me/Mohusyn_ir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    فراموشی رمز عبور؟
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور شما"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 dark:text-zinc-500" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* REGISTER QUICK FORM */}
          {mode === "register" && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>نام و نام خانوادگی</span>
                  <span className="text-[10px] text-rose-500 font-bold">* الزامی</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سید محمدحسین"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>نام کاربری</span>
                    <span className="text-[10px] text-slate-400 font-mono">انگلیسی</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ali_m"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs text-left outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>کلمه عبور</span>
                    <span className="text-[10px] text-slate-400 font-mono">۴+ رقم</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="کلمه عبور"
                      className="w-full pl-9 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-black text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>شماره موبایل</span>
                  </span>
                  <span className="text-[10px] text-rose-500 font-bold">* الزامی</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs text-left outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-black text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>ایمیل (اختیاری)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">جهت بازیابی</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50/90 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white font-mono text-xs text-left outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                💡 ایجاد حساب کاملاً رایگان است و اطلاعات شما در سرور امن و رمزنگاری‌شده نگهداری می‌شود.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black text-xs shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading
                ? "لطفاً شکیبا باشید..."
                : mode === "login"
                ? "ورود به داشبورد"
                : "ثبت‌نام و ورود به بگ‌تایم 🚀"}
              {mode === "login" ? (
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </form>

        {/* APP DEVELOPERS BENTO CARD - LUXURY APPLE REDESIGN */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                تیم توسعه و معماران سیستم
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
              {toPersianDigits(appDevelopers.length)} عضو سازنده
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {appDevelopers.map((dev: AppDeveloper) => (
              <button
                key={dev.id}
                type="button"
                onClick={() => setSelectedDevForModal(dev)}
                className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 dark:bg-[#252528]/80 dark:hover:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer flex items-center gap-2.5 text-right group active:scale-98 shadow-2xs hover:shadow-sm"
              >
                <div className="relative shrink-0">
                  {dev.avatarUrl ? (
                    <img
                      src={dev.avatarUrl}
                      alt={dev.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white dark:border-zinc-700 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm flex items-center justify-center border border-white dark:border-zinc-700 shadow-2xs group-hover:scale-105 transition-transform">
                      {dev.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {dev.name}
                    </span>
                    <ArrowLeft className="w-3 h-3 text-slate-300 dark:text-zinc-600 group-hover:text-indigo-500 group-hover:-translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block font-medium">
                    {dev.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Micro Footer: Company / Platform Branding */}
        {globalSettings?.footerBranding?.enabled !== false && (
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-center text-[10px] text-slate-400 dark:text-zinc-500 select-none">
            <span>{globalSettings?.footerBranding?.prefixText || 'بَگ‌تایم، از خانوادهٔ'}{' '}</span>
            {globalSettings?.footerBranding?.isLinkEnabled && globalSettings?.footerBranding?.companyUrl ? (
              <a
                href={globalSettings.footerBranding.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-slate-300 dark:decoration-zinc-700 underline-offset-2"
              >
                {globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه'}
              </a>
            ) : (
              <strong className="font-black text-slate-600 dark:text-zinc-300">
                {globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه'}
              </strong>
            )}
          </div>
        )}
      </div>

      {/* Developer Profile Modal - Luxury Bento */}
      {selectedDevForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedDevForModal(null)}
          dir="rtl"
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 text-center relative border border-black/[0.08] dark:border-white/[0.1]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedDevForModal(null)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
                    className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-white dark:border-zinc-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-3xl flex items-center justify-center shadow-xl border-4 border-white dark:border-zinc-800 font-mono">
                    {selectedDevForModal.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black border-2 border-white dark:border-zinc-800 shadow-xs">
                  سازنده 💻
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {selectedDevForModal.name}
              </h3>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {selectedDevForModal.role}
              </p>
            </div>

            {selectedDevForModal.bio && (
              <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-[#252528] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] leading-relaxed font-medium text-right">
                {selectedDevForModal.bio}
              </p>
            )}

            {selectedDevForModal.link && (
              <a
                href={selectedDevForModal.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
              >
                <span>مشاهده وبسایت یا رزومه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setSelectedDevForModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* AUTO BALE LOGIN MODAL */}
      {baleLoginModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 text-center relative border border-emerald-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setBaleLoginModalData(null);
                setBalePollingActive(false);
              }}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Bot Icon */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-500/30 shadow-inner animate-pulse">
                  <Bot className="w-9 h-9" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-slate-900 dark:text-white text-base">ورود سریع با پیام‌رسان بله</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                لطفاً روی دکمه زیر کلیک کرده و در صفحه باز شده در بله دکمه <span className="font-bold text-emerald-600 dark:text-emerald-400">«شروع / Start»</span> را بزنید.
              </p>
            </div>

            {/* Status indicator */}
            {balePollingStep === 'waiting_contact' ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-800 dark:text-amber-200 font-bold animate-pulse">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>لطفاً در بله دکمه «📱 ارسال شماره تماس» را لمس کنید</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                <span>در انتظار تأیید ورود شما در بله...</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <a
                href={baleLoginModalData.baleBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <span>باز کردن پیام‌رسان بله</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setBaleLoginModalData(null);
                  setBalePollingActive(false);
                }}
                className="w-full py-2.5 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                انصراف و ورود با رمز عبور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BALE BOT VERIFICATION MODAL */}
      {baleVerificationData && (
        <BaleVerificationModal
          data={baleVerificationData}
          onClose={() => setBaleVerificationData(null)}
        />
      )}

      {/* BALE POST-LOGIN ONBOARDING MODAL */}
      {baleOnboardingData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 relative border border-black/[0.08] dark:border-white/[0.1]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تنظیم مشخصات ورود به بگ تایم
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                ورود شما با بله انجام شد. لطفاً نام کاربری و رمز دلخواهتان را تعیین کنید تا در دفعات بعدی نیز بتوانید بدون نیاز به بله به سامانه وارد شوید.
              </p>
            </div>

            {onboardingError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold leading-relaxed">
                {onboardingError}
              </div>
            )}

            <form onSubmit={handleCompleteBaleOnboarding} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-zinc-300">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="مثال: علیرضا احمدی"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 dark:text-zinc-300">
                    نام کاربری انگلیسی (Username) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">حداقل ۳ حرف</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={onboardingUsername}
                    onChange={(e) => setOnboardingUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="alireza_ahmadi"
                    className="w-full px-4 pl-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 font-mono text-xs text-left outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-zinc-300">
                    رمز عبور <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOnboardingPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      value={onboardingPassword}
                      onChange={(e) => setOnboardingPassword(e.target.value)}
                      placeholder="حداقل ۴ کاراکتر"
                      className="w-full px-4 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOnboardingPassword(!showOnboardingPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showOnboardingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-zinc-300">
                    تکرار رمز عبور <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showOnboardingPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={onboardingConfirmPassword}
                    onChange={(e) => setOnboardingConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-xs outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmittingOnboarding}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmittingOnboarding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ذخیره اطلاعات...</span>
                    </>
                  ) : (
                    <>
                      <span>ثبت اطلاعات و ورود به برنامه 🚀</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipBaleOnboarding}
                  className="w-full py-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 text-[11px] font-bold transition-colors cursor-pointer text-center block"
                >
                  فعلاً رد کردن و ورود مستقیم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
