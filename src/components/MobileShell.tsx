import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { Header } from './Header';
import { WeeklyStrip } from './WeeklyStrip';
import { QuickAddBar } from './QuickAddBar';
import { SearchFilter } from './SearchFilter';
import { TaskList } from './TaskList';
import { CalendarView } from './CalendarView';
import { FocusTimer } from './FocusTimer';
import { CategoriesView } from './CategoriesView';
import { StatsView } from './StatsView';
import { UserManagementView } from './UserManagementView';
import { BottomNav } from './BottomNav';
import { TaskModal } from './TaskModal';
import { ExportShareModal } from './ExportShareModal';
import { toPersianDigits } from '../utils/persianDate';
import {
  Monitor,
  Wifi,
  BatteryCharging,
} from 'lucide-react';

export const MobileShell: React.FC = () => {
  const { activeTab, updateSettings, currentUser } = useTask();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Clock for mobile status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top desktop control banner */}
      <div className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 hidden sm:flex items-center justify-between text-xs text-slate-400 z-30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-white tracking-wide">
            شبیه‌ساز موبایل تسک‌روز
          </span>
          <span className="text-[11px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md">
            نسخه موبایل PWA
          </span>
        </div>

        {/* View Mode Switcher to Desktop Dashboard */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ viewMode: 'desktop' })}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-bold text-xs shadow-xs"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>ورود به داشبورد دسکتاپ</span>
          </button>
        </div>
      </div>

      {/* Main Container / Phone Mockup Frame */}
      <div className="w-full flex-1 flex items-center justify-center sm:py-6 sm:px-4">
        <div className="w-full flex flex-col relative overflow-hidden transition-all duration-300 sm:max-w-[430px] sm:h-[880px] sm:rounded-[50px] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] sm:ring-1 sm:ring-slate-700/60 bg-white dark:bg-slate-900">
          {/* Mobile Top Status Bar & Dynamic Island */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 pt-3 pb-2 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 select-none z-30">
            {/* Clock */}
            <span className="font-bold text-xs tracking-tight font-mono">
              {toPersianDigits(currentTimeStr)}
            </span>

            {/* Dynamic Island Pill */}
            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-black rounded-full text-white text-[10px] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="font-medium text-[10px] tracking-tight">تسک‌روز</span>
            </div>

            {/* Status Icons: Wifi & Battery */}
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">5G</span>
              <BatteryCharging className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          {/* App Header */}
          <Header
            isSearchActive={isSearchActive}
            onToggleSearch={() => setIsSearchActive(!isSearchActive)}
          />

          {/* Search & Filter Bar */}
          <SearchFilter
            isOpen={isSearchActive}
            onClose={() => setIsSearchActive(false)}
          />

          {/* Active Tab View Body */}
          <main className="flex-1 overflow-y-auto flex flex-col relative bg-slate-50/50 dark:bg-slate-900/50">
            {activeTab === 'dashboard' && (
              <>
                <WeeklyStrip />
                <QuickAddBar />
                <TaskList />
              </>
            )}

            {activeTab === 'tasks' && (
              <>
                <WeeklyStrip />
                <QuickAddBar />
                <TaskList />
              </>
            )}

            {activeTab === 'calendar' && <CalendarView />}

            {activeTab === 'focus' && <FocusTimer />}

            {activeTab === 'categories' && <CategoriesView />}

            {activeTab === 'users' && currentUser?.role === 'admin' && (
              <div className="p-4">
                <UserManagementView />
              </div>
            )}

            {activeTab === 'stats' && <StatsView />}
          </main>

          {/* Bottom Navigation */}
          <BottomNav />

          {/* Modals */}
          <TaskModal />
          <ExportShareModal />
        </div>
      </div>
    </div>
  );
};
