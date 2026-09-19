import { TaskProvider, useTask } from './context/TaskContext';
import { MainLayout } from './components/MainLayout';
import { LoginScreen } from './components/LoginScreen';

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
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;
