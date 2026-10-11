import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building2,
  Server,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { useTask } from '../context/TaskContext';

interface SsoLoginScreenProps {
  onBack: () => void;
}

export const SsoLoginScreen: React.FC<SsoLoginScreenProps> = ({ onBack }) => {
  const { completeBaleVerification, globalSettings } = useTask();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Connection check
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; message: string; version?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.ssoTestConnection();
        if (isMounted) {
          setHealthStatus({
            ok: res.ok,
            message: res.message || 'پاسخ معتبر دریافت شد',
            version: (res as any).version || '1.0.0',
          });
        }
      } catch {
        if (isMounted) {
          setHealthStatus({
            ok: false,
            message: 'عدم دسترسی به سرور احراز هویت نگاه (SSO)',
          });
        }
      } finally {
        if (isMounted) setIsCheckingHealth(false);
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('لطفاً ایمیل و کلمه عبور حساب نگاه را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.ssoLogin(email.trim(), password);
      if (res && res.user) {
        sounds.playComplete();
        setSuccessMessage('ورود با موفقیت انجام شد. در حال هدایت به بَگ‌تایم...');
        completeBaleVerification(res.user, res.token);
        setTimeout(() => {
          onBack();
        }, 800);
      } else {
        setError('ورود با SSO با خطا مواجه شد. لطفاً مشخصات را بررسی کنید.');
        sounds.playWarning();
      }
    } catch (err: any) {
      sounds.playWarning();
      setError(err?.message || 'ایمیل یا کلمه عبور در سامانه متمرکز نگاه معتبر نیست.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('mohusyn@negahm.ir');
    setPassword('admin1234');
    setError(null);
  };

  const appName = globalSettings?.appBranding?.appName || 'بَگ‌تایم';

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between p-4 sm:p-6"
      dir="rtl"
    >
      {/* Top Header Navigation */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold backdrop-blur-md border border-white/10 transition-all cursor-pointer active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه ورود اصلی {appName}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>کیان فناوران نگاه</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Branding */}
          <div className="text-center space-y-2 relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 mb-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                <Sparkles className="w-3 h-3" />
                <span>احراز هویت یکپارچه سازمانی</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">سامانه متمرکز نگاه (SSO v1)</h1>
              <p className="text-xs text-slate-400 font-medium">
                ورود ایمن به حساب کاربری سازمانی در تمام سامانه‌های گروه نگاه
              </p>
            </div>
          </div>

          {/* SSO Server Health Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">سرویس متمرکز SSO:</span>
            </div>
            {isCheckingHealth ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-bold text-[11px]">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                <span>بررسی اتصال...</span>
              </span>
            ) : healthStatus?.ok ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>فعال و آنلاین</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <AlertCircle className="w-3 h-3" />
                <span>محیط آماده‌سازی داخلی</span>
              </span>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                نام کاربری یا ایمیل سازمانی نگاه <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="مثال: mohusyn یا name@negahm.ir"
                  required
                  autoFocus
                  className="w-full text-xs font-mono pl-3.5 pr-10 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  کلمه عبور <span className="text-rose-400">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-xs font-mono pl-10 pr-10 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>در حال اعتبارسنجی در SSO نگاه...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>ورود یکپارچه به {appName}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400">
            <span>حساب تستی نگاه:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer hover:underline"
            >
              درج مشخصات ادمین تستی (mohusyn@negahm.ir)
            </button>
          </div>

          {/* Information Notice */}
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-slate-300 leading-relaxed space-y-1">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>امنیت و یکپارچگی حساب:</span>
            </div>
            <p className="text-slate-400 text-[10px]">
              با ورود از طریق SSO نگاه، پروفایل، نقش، ایمیل و شماره تماس سازمانی شما به صورت خودکار با سامانه بَگ‌تایم همگام‌سازی می‌گردد.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-4xl w-full mx-auto text-center pb-2 text-[11px] text-slate-500 select-none">
        <span>بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه</span>
      </footer>
    </div>
  );
};
