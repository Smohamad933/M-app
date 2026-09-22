import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import type { TabType } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Users,
  Plus,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openCreateModal, selectedDate } = useTask();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleTabClick = (tab: TabType) => {
    sounds.playPop();
    setShowActionSheet(false);
    setActiveTab(tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'planner', label: 'پلنر ساعتی', icon: Clock },
    { id: 'tasks', label: 'کارهای من', icon: CheckSquare },
    { id: 'friends', label: 'همکاران', icon: Users },
  ];

  return (
    <>
      {/* Mobile Bottom Quick Action Popover */}
      {showActionSheet && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setShowActionSheet(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-200 space-y-2.5 max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800">ایجاد تسک جدید</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowActionSheet(false);
                // Trigger AI assistant via custom event or manual modal
                window.dispatchEvent(new CustomEvent('open-ai-agent-modal'));
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-sm hover:opacity-95 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div>دستیار هوش مصنوعی (صوتی / متنی)</div>
                <div className="text-[10px] opacity-85 font-medium">تشخیص خودکار ساعت و اولویت از روی صدای شما</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setShowActionSheet(false);
                openCreateModal(selectedDate);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div>افزودن دستی و سنتی فرم</div>
                <div className="text-[10px] text-slate-500 font-medium">تعیین دستی عنوان، ساعت، برچسب و چک‌لیست</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-5px_20px_rgba(0,0,0,0.04)] pb-safe lg:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5 sm:py-2">
          {/* Tabs */}
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

          {/* Plus Action Button */}
          <button
            onClick={() => {
              sounds.playPop();
              setShowActionSheet(!showActionSheet);
            }}
            className="w-10 h-10 rounded-2xl bg-[#121212] hover:bg-black text-white shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 mx-1"
            title="افزودن تسک"
          >
            <Plus className={`w-5 h-5 stroke-[2.5] transition-transform duration-200 ${showActionSheet ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </nav>
    </>
  );
};
