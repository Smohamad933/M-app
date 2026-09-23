import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openCreateModal } = useTask();

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setActiveTab(tab);
  };

  const leftTabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'کارهای من', icon: CheckSquare },
  ];

  const rightTabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'messages', label: 'پیام‌ها', icon: MessageSquare },
    { id: 'friends', label: 'همکاران', icon: Users },
  ];

  return (
    <nav className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[430px] z-40 lg:hidden">
      <div className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-zinc-800 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-1.5 flex items-center justify-between">
        {/* Left 2 Tabs */}
        <div className="flex-1 flex items-center justify-around">
          {leftTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 ease-out cursor-pointer group select-none min-w-[64px] ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
                }`}
              >
                {/* Active Indicator Backdrop Pill */}
                {isActive && (
                  <span className="absolute inset-0 bg-slate-100 dark:bg-zinc-800 rounded-2xl -z-10 shadow-xs animate-in zoom-in-90 duration-200" />
                )}

                <div className={`transition-transform duration-300 ${isActive ? 'scale-115 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.6] text-slate-900 dark:text-emerald-400' : 'stroke-[1.8]'}`} />
                </div>

                <span className={`text-[10px] mt-1 tracking-tight leading-none transition-all duration-200 ${
                  isActive ? 'font-black scale-105 text-slate-900 dark:text-white' : 'font-semibold'
                }`}>
                  {tab.label}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Animated Floating Action Button (New Task) */}
        <div className="relative -mt-5 px-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal();
            }}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border-2 border-white dark:border-zinc-800 group"
            title="افزودن تسک جدید"
          >
            <Plus className="w-5 h-5 text-[#00b884] stroke-[3] transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-[8px] font-black text-white leading-none mt-0.5">تسک</span>
          </button>
        </div>

        {/* Right 2 Tabs */}
        <div className="flex-1 flex items-center justify-around">
          {rightTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 ease-out cursor-pointer group select-none min-w-[64px] ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200'
                }`}
              >
                {/* Active Indicator Backdrop Pill */}
                {isActive && (
                  <span className="absolute inset-0 bg-slate-100 dark:bg-zinc-800 rounded-2xl -z-10 shadow-xs animate-in zoom-in-90 duration-200" />
                )}

                <div className={`transition-transform duration-300 ${isActive ? 'scale-115 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.6] text-slate-900 dark:text-emerald-400' : 'stroke-[1.8]'}`} />
                </div>

                <span className={`text-[10px] mt-1 tracking-tight leading-none transition-all duration-200 ${
                  isActive ? 'font-black scale-105 text-slate-900 dark:text-white' : 'font-semibold'
                }`}>
                  {tab.label}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
