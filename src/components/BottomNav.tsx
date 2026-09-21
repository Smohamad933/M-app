import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Timer,
  User,
  Plus,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openCreateModal, selectedDate, currentUser } = useTask();

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setActiveTab(tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'planner', label: 'دیلی پلن', icon: Clock },
    { id: 'focus', label: 'تمرکز', icon: Timer },
    { id: 'tasks', label: 'تسک‌ها', icon: CheckSquare },
    { id: 'profile', label: 'پروفایل', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {/* First 2 tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${
                isActive ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
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

        {/* Center Floating Quick Add Button */}
        <button
          onClick={() => {
            sounds.playPop();
            openCreateModal(selectedDate);
          }}
          className="w-11 h-11 -mt-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mx-1 border-2 border-zinc-900"
          title="افزودن تسک جدید"
          aria-label="افزودن تسک جدید"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Next tabs */}
        {tabs.slice(2).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${
                isActive ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                {tab.id === 'profile' && currentUser?.avatar ? (
                  <div className={`w-5 h-5 rounded-full overflow-hidden border ${isActive ? 'border-white' : 'border-zinc-700'}`}>
                    <img src={currentUser.avatar} alt="پروفایل" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
