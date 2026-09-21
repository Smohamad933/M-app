import React, { Component, type ReactNode } from 'react';
import { TaskProvider, useTask } from './context/TaskContext';
import { MainLayout } from './components/MainLayout';
import { LoginScreen } from './components/LoginScreen';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <AppContent />
      </TaskProvider>
    </ErrorBoundary>
  );
}

export default App;
