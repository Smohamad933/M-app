import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  CalendarDays,
  FolderKanban,
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
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderKanban },
    { id: 'focus', label: 'تمرکز', icon: Timer },
    { id: 'calendar', label: 'تقویم', icon: CalendarDays },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-between px-2.5 py-1.5 sm:py-2">
        {/* Navigation Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${
                isActive
                  ? 'text-white font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Add Button */}
        <button
          onClick={() => {
            sounds.playPop();
            openCreateModal(selectedDate);
          }}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mx-1"
          title="افزودن تسک جدید"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </nav>
  );
};
