import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  LayoutGrid,
  Menu,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { TabType } from '../types';
import { sounds } from '../utils/sound';

export interface DashboardCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryTabIds: TabType[];
  secondaryTabIds: TabType[];
  onSaveMenuConfig: (primary: TabType[], secondary: TabType[]) => void;
  dashboardBlocksOrder: string[];
  onSaveDashboardBlocks: (blocks: string[]) => void;
  navItems: Array<{ id: TabType; label: string; icon: React.ElementType; adminOnly?: boolean }>;
  isAdmin?: boolean;
}

export const DEFAULT_PRIMARY_TABS: TabType[] = ['dashboard', 'tasks', 'planner', 'focus', 'messages'];
export const DEFAULT_SECONDARY_TABS: TabType[] = [
  'calendar',
  'friends',
  'projects',
  'habits',
  'career',
  'categories',
  'stats',
];

export const DASHBOARD_BLOCK_DEFINITIONS = [
  {
    id: 'bento',
    title: 'ویجت‌های بنتو ۴گانه',
    description: 'تقویم ماهانه، ساعت آنالوگ تعاملی، چالش استریک و تسک در حال فوکوس',
    icon: LayoutGrid,
  },
  {
    id: 'kpi',
    title: 'کارت‌های شاخص عملکرد (KPI)',
    description: '۴ کارت آماری: تسک‌های امروز، نرخ پیشرفت، دقایق تمرکز پومودورو و زنجیره استریک',
    icon: Sparkles,
  },
  {
    id: 'tasks_feed',
    title: 'برنامه‌ی پیشِ رو و ابزارهای روز',
    description: 'فهرست تسک‌های اولویت‌دار، ثبت سریع، استوری روزنامه و تقویم هفته',
    icon: Layers,
  },
  {
    id: 'chat',
    title: 'گفتگوی سریع با همکاران و پیام‌ها',
    description: 'پنل دسترسی سریع به مکالمات اخیر با همکاران متصل در داشبورد',
    icon: Menu,
  },
];

export const DEFAULT_DASHBOARD_BLOCKS = ['bento', 'kpi', 'tasks_feed', 'chat'];

export const DashboardCustomizationModal: React.FC<DashboardCustomizationModalProps> = ({
  isOpen,
  onClose,
  primaryTabIds,
  secondaryTabIds,
  onSaveMenuConfig,
  dashboardBlocksOrder,
  onSaveDashboardBlocks,
  navItems,
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'sidebar' | 'dashboard'>('sidebar');
  const [primary, setPrimary] = useState<TabType[]>(primaryTabIds);
  const [secondary, setSecondary] = useState<TabType[]>(secondaryTabIds);
  const [blocks, setBlocks] = useState<string[]>(dashboardBlocksOrder);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrimary(primaryTabIds);
      setSecondary(secondaryTabIds);
      setBlocks(dashboardBlocksOrder.length > 0 ? dashboardBlocksOrder : DEFAULT_DASHBOARD_BLOCKS);
      setHasSaved(false);
    }
  }, [isOpen, primaryTabIds, secondaryTabIds, dashboardBlocksOrder]);

  if (!isOpen) return null;

  // Filter available nav items
  const itemMap = new Map(navItems.map((item) => [item.id, item]));

  // Sidebar re-ordering handlers
  const moveItemUp = (list: TabType[], index: number, setList: (l: TabType[]) => void) => {
    if (index <= 0) return;
    sounds.playPop();
    const next = [...list];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setList(next);
  };

  const moveItemDown = (list: TabType[], index: number, setList: (l: TabType[]) => void) => {
    if (index >= list.length - 1) return;
    sounds.playPop();
    const next = [...list];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setList(next);
  };

  const moveToSecondary = (tabId: TabType) => {
    if (primary.length <= 1) {
      alert('حداقل یک آیتم باید در بخش بالای منو باقی بماند.');
      return;
    }
    sounds.playPop();
    setPrimary((prev) => prev.filter((id) => id !== tabId));
    setSecondary((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]));
  };

  const moveToPrimary = (tabId: TabType) => {
    sounds.playPop();
    setSecondary((prev) => prev.filter((id) => id !== tabId));
    setPrimary((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]));
  };

  const handleResetSidebar = () => {
    sounds.playPop();
    const defPrim = [...DEFAULT_PRIMARY_TABS];
    if (isAdmin && !defPrim.includes('users')) defPrim.push('users');
    setPrimary(defPrim);
    setSecondary(DEFAULT_SECONDARY_TABS.filter((id) => !defPrim.includes(id)));
  };

  // Dashboard blocks handlers
  const moveBlockUp = (index: number) => {
    if (index <= 0) return;
    sounds.playPop();
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setBlocks(next);
  };

  const moveBlockDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    sounds.playPop();
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setBlocks(next);
  };

  const handleResetBlocks = () => {
    sounds.playPop();
    setBlocks(DEFAULT_DASHBOARD_BLOCKS);
  };

  const handleSaveAll = () => {
    sounds.playComplete();
    onSaveMenuConfig(primary, secondary);
    onSaveDashboardBlocks(blocks);
    setHasSaved(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[32px] p-5 sm:p-6 shadow-2xl border border-slate-200/90 dark:border-zinc-800 space-y-4 max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                شخصی‌سازی پنل و چینش داشبورد
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                انتخاب آیتم‌های بالا/پایین منوی سایدبار و اولویت بخش‌های داشبورد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 dark:bg-zinc-800/80 rounded-2xl flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('sidebar');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'sidebar'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Menu className="w-3.5 h-3.5 text-indigo-500" />
            <span>منوی کناری (بالا و پایین)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('dashboard');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
            <span>بخش‌های صفحه داشبورد</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 text-xs">
          {activeTab === 'sidebar' ? (
            <div className="space-y-4">
              {/* TOP SECTION (PRIMARY MENU) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>آیتم‌های بالای منو (بخش اصلی و دسترسی سریع)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {primary.length} مورد
                  </span>
                </div>
                <div className="space-y-1.5">
                  {primary.map((tabId, idx) => {
                    const item = itemMap.get(tabId);
                    if (!item) return null;
                    const Icon = item.icon;
                    return (
                      <div
                        key={tabId}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveItemUp(primary, idx, setPrimary)}
                            disabled={idx === 0}
                            title="انتقال به بالا"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemDown(primary, idx, setPrimary)}
                            disabled={idx === primary.length - 1}
                            title="انتقال به پایین"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveToSecondary(tabId)}
                            title="انتقال به پایین (سایر امکانات)"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer mr-1"
                          >
                            <ChevronDown className="w-3 h-3" />
                            <span>به پایین</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM SECTION (SECONDARY MENU) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>آیتم‌های پایین منو (سایر امکانات و ابزارها)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {secondary.length} مورد
                  </span>
                </div>
                <div className="space-y-1.5">
                  {secondary.map((tabId, idx) => {
                    const item = itemMap.get(tabId);
                    if (!item) return null;
                    const Icon = item.icon;
                    return (
                      <div
                        key={tabId}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveItemUp(secondary, idx, setSecondary)}
                            disabled={idx === 0}
                            title="انتقال به بالا"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemDown(secondary, idx, setSecondary)}
                            disabled={idx === secondary.length - 1}
                            title="انتقال به پایین"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveToPrimary(tabId)}
                            title="انتقال به بالا (بخش اصلی)"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer mr-1"
                          >
                            <ChevronUp className="w-3 h-3" />
                            <span>به بالا</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset Sidebar Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetSidebar}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>بازنشانی چینش منو به حالت اولیه</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-black text-slate-900 dark:text-white text-xs">
                  ترتیب نمایش بخش‌ها در صفحه داشبورد (بالا به پایین)
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {blocks.length} بخش
                </span>
              </div>
              <div className="space-y-2">
                {blocks.map((bId, idx) => {
                  const def = DASHBOARD_BLOCK_DEFINITIONS.find((d) => d.id === bId);
                  if (!def) return null;
                  const Icon = def.icon;
                  return (
                    <div
                      key={bId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center flex-shrink-0 font-black text-xs">
                          {idx + 1}
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                            {def.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {def.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveBlockUp(idx)}
                          disabled={idx === 0}
                          title="حرکت به سمت بالا"
                          className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlockDown(idx)}
                          disabled={idx === blocks.length - 1}
                          title="حرکت به سمت پایین"
                          className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset Blocks Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetBlocks}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>بازنشانی چیدمان داشبورد به حالت اولیه</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-2xl bg-[#121212] dark:bg-white text-white dark:text-zinc-900 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 hover:bg-black"
          >
            {hasSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>ذخیره شد!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>ذخیره و اعمال تغییرات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
