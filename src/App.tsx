import { TaskProvider, useTask } from './context/TaskContext';
import { MobileShell } from './components/MobileShell';
import { DesktopDashboard } from './components/DesktopDashboard';
import { LoginScreen } from './components/LoginScreen';

function AppContent() {
  const { currentUser, settings, isLoading } = useTask();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">در حال بارگذاری سامانه...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (settings.viewMode === 'mobile-frame') {
    return <MobileShell />;
  }

  return <DesktopDashboard />;
}

export function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;
