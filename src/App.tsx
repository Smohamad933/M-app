import React, { Component, type ReactNode, useEffect, useState } from 'react';
import { TaskProvider, useTask } from './context/TaskContext';
import { MainLayout } from './components/MainLayout';
import { LoginScreen } from './components/LoginScreen';
import { AlertTriangle, RefreshCw, Database, DatabaseZap, Loader2 } from 'lucide-react';
import { api } from './services/api';

/**
 * Full-screen guard: if the database file (data/db.json) is missing on the
 * server, show a clear "database not installed" panel instead of a broken app.
 */
function DbGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'missing' | 'ready'>('checking');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    let alive = true;
    api.checkDatabase().then((res) => {
      if (!alive) return;
      setState(res.installed ? 'ready' : 'missing');
    });
    return () => { alive = false; };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await api.installDatabase();
      window.location.reload();
    } catch (e) {
      setInstalling(false);
      alert('نصب پایگاه داده ناموفق بود. از دسترسی نوشتن به پوشه data روی سرور مطمئن شوید.');
    }
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-mono tracking-wider">MOHUSYN • LOADING</span>
        </div>
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 selection:bg-white selection:text-zinc-950">
        <div className="max-w-md w-full bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">پایگاه داده نصب نشده است</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              فایل داده <span className="font-mono text-amber-300">data/db.json</span> روی سرور یافت نشد.
              برای استفاده از سامانه، ابتدا پایگاه داده را نصب کنید تا حساب‌ها، تسک‌ها و تنظیمات آماده شوند.
            </p>
          </div>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
          >
            {installing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DatabaseZap className="w-4 h-4" />
            )}
            <span>{installing ? 'در حال نصب پایگاه داده...' : 'نصب و راه‌اندازی پایگاه داده'}</span>
          </button>
          <p className="text-[10px] text-zinc-500 font-mono">BUILT BY MOHUSYN • TASKROOZ</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TaskRooz UI Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('taskrooz_system_font');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 selection:bg-white selection:text-zinc-950">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">خطای موقت در بارگذاری رابط کاربری</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {this.state.error?.message || 'مشکلی در اجرای موقت برنامه رخ داد.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>بازنشانی و اجرای مجدد سامانه</span>
            </button>
            <p className="text-[10px] text-zinc-500 font-mono">BUILT BY MOHUSYN • TASKROOZ</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { currentUser, isLoading } = useTask();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-mono tracking-wider">MOHUSYN • LOADING</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <MainLayout />;
}

export function App() {
  return (
    <ErrorBoundary>
      <TaskProvider>
        <DbGate>
          <AppContent />
        </DbGate>
      </TaskProvider>
    </ErrorBoundary>
  );
}

export default App;
