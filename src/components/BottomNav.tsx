import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  CalendarDays,
  Users,
  BarChart3,
  Plus,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openCreateModal, selectedDate, currentUser } = useTask();

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setActiveTab(tab);
  };

  const isAdmin = currentUser?.role === 'admin';

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
    { id: 'focus', label: 'تمرکز', icon: Timer },
    { id: 'calendar', label: 'تقویم', icon: CalendarDays },
    isAdmin
      ? { id: 'users', label: 'کاربران', icon: Users }
      : { id: 'stats', label: 'آمار', icon: BarChart3 },
  ];

  return (
    <div className="sticky bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-lg">
      <div className="relative max-w-lg mx-auto flex items-center justify-between px-3 py-2">
        {/* Navigation Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Add Button */}
        <button
          onClick={() => {
            sounds.playPop();
            openCreateModal(selectedDate);
          }}
          className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mr-1"
          title="افزودن تسک جدید"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Mobile Home Bar indicator */}
      <div className="py-1 flex justify-center items-center pointer-events-none">
        <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
};
