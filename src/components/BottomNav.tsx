import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Brain,
  Target,
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
    { id: 'planner', label: 'دیلی پلنر', icon: Clock },
    { id: 'habits', label: 'تحلیل عادت', icon: Brain },
    { id: 'career', label: 'اهداف', icon: Target },
    { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-xl pb-safe lg:hidden">
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
                  ? 'text-slate-900 font-black scale-105'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#121212] rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none font-bold">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Add Button */}
        <button
          onClick={() => {
            sounds.playPop();
            openCreateModal(selectedDate);
          }}
          className="w-10 h-10 rounded-2xl bg-[#121212] hover:bg-black text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mx-1"
          title="افزودن تسک جدید"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </nav>
  );
};
