import React, { Component, type ReactNode, useEffect, useState } from 'react';
import { TaskProvider, useTask } from './context/TaskContext';
import { MainLayout } from './components/MainLayout';
import { LoginScreen } from './components/LoginScreen';
import { AlertTriangle, RefreshCw, Database, DatabaseZap, Loader2 } from 'lucide-react';
import { api } from './services/api';
import { TaskMasterHexagon } from './components/TaskMasterLogo';

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
      <div className="min-h-screen bg-[#edf0f4] flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <TaskMasterHexagon size={48} className="animate-pulse" />
          <span className="text-xs text-slate-500 font-bold tracking-wider">در حال بارگذاری تسک‌روز...</span>
        </div>
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="min-h-screen bg-[#edf0f4] text-slate-900 flex items-center justify-center p-4 selection:bg-[#121212] selection:text-white">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-[32px] p-7 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">پایگاه داده نصب نشده است</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              فایل داده <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1 rounded">data/db.json</span> روی سرور یافت نشد.
              برای استفاده از سامانه، ابتدا پایگاه داده را نصب کنید تا حساب‌ها، تسک‌ها و تنظیمات آماده شوند.
            </p>
          </div>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full py-3.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
          >
            {installing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DatabaseZap className="w-4 h-4 text-[#00b884]" />
            )}
            <span>{installing ? 'در حال نصب پایگاه داده...' : 'نصب و راه‌اندازی پایگاه داده'}</span>
          </button>
          <p className="text-[10px] text-slate-400 font-mono">TASKROOZ • BUILT BY MOHUSYN</p>
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
        <div className="min-h-screen bg-[#edf0f4] text-slate-900 flex items-center justify-center p-4 selection:bg-[#121212] selection:text-white">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-[32px] p-7 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">خطای موقت در بارگذاری رابط کاربری</h2>
              <p className="text-xs text-slate-500 mt-1">
                {this.state.error?.message || 'مشکلی در اجرای موقت برنامه رخ داد.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>بازنشانی و اجرای مجدد سامانه</span>
            </button>
            <p className="text-[10px] text-slate-400 font-mono">TASKROOZ • BUILT BY MOHUSYN</p>
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
      <div className="min-h-screen bg-[#edf0f4] flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <TaskMasterHexagon size={48} className="animate-pulse" />
          <span className="text-xs text-slate-500 font-bold tracking-wider">در حال بارگذاری سامانه...</span>
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
