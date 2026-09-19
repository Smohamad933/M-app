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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-white selection:text-zinc-950">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-3xl p-7 shadow-2xl border border-zinc-800 space-y-6 backdrop-blur-xl animate-in fade-in zoom-in-95">
        {/* Brand signature */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <CheckSquare className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              ورود به تسک‌روز
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono tracking-wide">
              BUILT BY MOHUSYN
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/40 text-rose-400 text-xs border border-rose-800/60 text-center font-bold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300">
              نام کاربری
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری شما"
                className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
              />
              <User className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300">
              کلمه عبور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
              />
              <Lock className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-zinc-800/80 text-center space-y-2">
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[11px] font-bold border border-zinc-700/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            ورود سریع با اکانت مدیر (admin / admin)
          </button>
        </div>
      </div>

      <div className="mt-4 text-[11px] text-zinc-400 font-mono tracking-wider">
        mohusyn.ir • ۲۰۲۶
      </div>
    </div>
  );
};
