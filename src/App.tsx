import { TaskProvider } from './context/TaskContext';
import { MobileShell } from './components/MobileShell';

export function App() {
  return (
    <TaskProvider>
      <MobileShell />
    </TaskProvider>
  );
}

export default App;
