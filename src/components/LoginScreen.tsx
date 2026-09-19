import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { CheckSquare, Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useTask();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await login(username.trim(), password);
      if (!ok) {
        setError('نام کاربری یا کلمه عبور نادرست است.');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setUsername('admin');
    setPassword('admin');
    login('admin', 'admin');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in-95">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <CheckSquare className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            ورود به تسک‌روز
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سامانه برنامه‌ریزی کارهای روزانه و مدیریت تیم
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800 text-center font-bold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              نام کاربری
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <User className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              کلمه عبور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            حساب پیش‌فرض مدیر سیستم:
          </p>
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            ورود سریع با اکانت مدیر (admin / admin)
          </button>
        </div>
      </div>
    </div>
  );
};
