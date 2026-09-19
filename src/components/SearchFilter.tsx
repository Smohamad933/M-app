import React from 'react';
import { useTask } from '../context/TaskContext';
import type { FilterStatus } from '../types';
import { Search, X } from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

interface SearchFilterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ isOpen, onClose }) => {
  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    categories,
    tasks,
    selectedDate,
  } = useTask();

  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const pendingCount = dayTasks.filter((t) => !t.completed).length;
  const completedCount = dayTasks.filter((t) => t.completed).length;

  const filterTabs: Array<{ id: FilterStatus; label: string; count?: number }> = [
    { id: 'all', label: 'همه', count: dayTasks.length },
    { id: 'pending', label: 'در انتظار', count: pendingCount },
    { id: 'completed', label: 'انجام‌شده', count: completedCount },
    { id: 'starred', label: 'سنجاق‌ها' },
    { id: 'urgent', label: 'فوری‌ها' },
  ];

  return (
    <div className="px-4 py-2 space-y-2.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Live Search Input (conditionally visible or always available) */}
      {isOpen && (
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان یا توضیحات تسک‌ها..."
            className="w-full pl-9 pr-9 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 transition-all"
            autoFocus
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Filter status pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" style={{ scrollbarWidth: 'none' }}>
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`mr-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-500/60 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {toPersianDigits(tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFilterCategory(null)}
          className={`flex-shrink-0 text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors ${
            filterCategory === null
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          تمام دسته‌ها
        </button>

        {categories.map((cat) => {
          const isSelected = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(isSelected ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg border transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 font-semibold'
                  : 'border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
