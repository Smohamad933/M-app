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

  const rightSideTabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tasks', label: 'کارهای من', icon: CheckSquare },
  ];

  const leftSideTabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'messages', label: 'پیام‌ها', icon: MessageSquare },
    { id: 'friends', label: 'همکاران', icon: Users },
  ];

  return (
    <nav className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[410px] z-40 lg:hidden pointer-events-none select-none">
      <div className="pointer-events-auto relative bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full shadow-[0_12px_36px_rgba(15,23,42,0.12)] px-2 py-1.5 flex items-center justify-between">
        {/* Right 2 Tabs in RTL (داشبورد، کارهای من) */}
        <div className="flex-1 flex items-center justify-around">
          {rightSideTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer min-w-[62px] ${
                  isActive
                    ? 'text-emerald-800 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-emerald-500/10 rounded-full -z-10 border border-emerald-500/20 animate-in zoom-in-95 duration-150" />
                )}

                <div className={`transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#00b884]' : 'stroke-[1.8]'}`} />
                </div>

                <span className={`text-[11px] mt-0.5 tracking-tight leading-none transition-colors ${
                  isActive ? 'font-black text-emerald-800' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Modern Glowing Action Button (New Task) */}
        <div className="relative -mt-6 px-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              openCreateModal();
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00b884] via-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white shadow-[0_6px_20px_rgba(0,184,132,0.4)] hover:shadow-[0_8px_24px_rgba(0,184,132,0.55)] border-[3px] border-white flex items-center justify-center transition-all duration-200 hover:scale-108 active:scale-95 cursor-pointer group"
            title="افزودن تسک جدید"
            aria-label="افزودن تسک جدید"
          >
            <Plus className="w-6 h-6 text-white stroke-[2.8] transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>

        {/* Left 2 Tabs in RTL (پیام‌ها، همکاران) */}
        <div className="flex-1 flex items-center justify-around">
          {leftSideTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer min-w-[62px] ${
                  isActive
                    ? 'text-emerald-800 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-emerald-500/10 rounded-full -z-10 border border-emerald-500/20 animate-in zoom-in-95 duration-150" />
                )}

                <div className={`transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#00b884]' : 'stroke-[1.8]'}`} />
                </div>

                <span className={`text-[11px] mt-0.5 tracking-tight leading-none transition-colors ${
                  isActive ? 'font-black text-emerald-800' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
