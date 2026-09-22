import React from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useTask();

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setActiveTab(tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'planner', label: 'پلنر ساعتی', icon: Clock },
    { id: 'tasks', label: 'کارهای من', icon: CheckSquare },
    { id: 'friends', label: 'همکاران', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-5px_20px_rgba(0,0,0,0.06)] pb-safe lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5 sm:py-2">
        {/* Left 2 Tabs */}
        {tabs.slice(0, 2).map((tab) => {
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

        {/* Center Floating AI Agent Button */}
        <button
          onClick={() => {
            sounds.playPop();
            window.dispatchEvent(new CustomEvent('open-ai-agent-modal'));
          }}
          className="w-12 h-12 rounded-2xl bg-[#121212] hover:bg-black text-white shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mx-1 border border-slate-700"
          title="افزودن هوشمند تسک با دستیار صوتی و متنی"
        >
          <Sparkles className="w-5 h-5 text-[#00b884] stroke-[2.5]" />
          <span className="text-[8px] font-black text-white leading-none mt-0.5">AI</span>
        </button>

        {/* Right 2 Tabs */}
        {tabs.slice(2, 4).map((tab) => {
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
      </div>
    </nav>
  );
};
