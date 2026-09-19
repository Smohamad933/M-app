import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { CheckSquare, Lock, User, ArrowLeft, UserPlus, LogIn, Sparkles, Timer } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register } = useTask();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Detect if user is joining via room invite link
  const inviteRoom = typeof window !== 'undefined' 
    ? (new URLSearchParams(window.location.search).get('room') || 
       new URLSearchParams(window.location.search).get('room_id') || 
       sessionStorage.getItem('taskrooz_pending_room'))
    : null;

  // Form fields (all blank by default - no hardcoded admin credentials)
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        // Register mode
        if (!name.trim() || !username.trim() || !password.trim()) {
          setError('لطفاً تمامی موارد خواسته شده را تکمیل کنید.');
          setLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          setError('نام کاربری باید حداقل ۳ کاراکتر باشد.');
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('کلمه عبور باید حداقل ۴ کاراکتر باشد.');
          setLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
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
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-3 sm:p-4 selection:bg-white selection:text-zinc-950 w-full overflow-x-hidden">
      <div className="w-full max-w-sm bg-zinc-900/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-zinc-800 space-y-5 sm:space-y-6 backdrop-blur-xl animate-in fade-in zoom-in-95">
        
        {/* Brand signature matching mohusyn.ir */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <CheckSquare className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {mode === 'login' ? 'ورود به تسک‌روز' : 'ایجاد حساب در تسک‌روز'}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono tracking-wide">
              BUILT BY MOHUSYN
            </p>
          </div>
        </div>

        {/* Room Invite Banner */}
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
            ایجاد حساب جدید
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/40 text-rose-400 text-xs border border-rose-800/60 text-center font-bold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="font-bold text-zinc-300">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  autoFocus
                />
                <Sparkles className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
              </div>
            </div>
          )}

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
                placeholder="نام کاربری (حداقل ۳ حرف)"
                className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white font-mono text-xs outline-hidden focus:border-zinc-500"
                autoFocus={mode === 'login'}
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
            className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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
                <span>ایجاد حساب و ورود</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
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
                ثبت نام رایگان
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
