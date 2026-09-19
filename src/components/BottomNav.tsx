import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  CheckSquare,
  CalendarDays,
  Timer,
  LayoutGrid,
  BarChart3,
  Plus,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openCreateModal, selectedDate } = useTask();

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setActiveTab(tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
    { id: 'calendar', label: 'تقویم', icon: CalendarDays },
    { id: 'focus', label: 'تمرکز', icon: Timer },
    { id: 'categories', label: 'دسته‌ها', icon: LayoutGrid },
    { id: 'stats', label: 'آمار', icon: BarChart3 },
  ];

  return (
    <div className="fixed sm:absolute bottom-0 inset-x-0 z-30">
      {/* Floating Action Button (FAB) right above or centered */}
      <div className="flex justify-center -mb-5 relative z-40 pointer-events-none">
        <button
          onClick={() => {
            sounds.playPop();
            openCreateModal(selectedDate);
          }}
          className="pointer-events-auto w-14 h-14 rounded-full bg-linear-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-slate-100 dark:border-slate-900"
          title="افزودن تسک جدید"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Nav bar */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 pt-2 pb-5 sm:pb-3 flex items-center justify-around shadow-lg">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          // Insert an empty spacer in the middle (after index 2) to give room to the FAB button!
          return (
            <React.Fragment key={tab.id}>
              {idx === 2 && <div className="w-12" aria-hidden="true" />}
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 min-w-[54px] rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">
                  {tab.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
