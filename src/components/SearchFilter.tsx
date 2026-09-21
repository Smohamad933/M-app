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
    <div className="py-2 space-y-2.5">
      {isOpen && (
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در تسک‌ها..."
            className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-hidden focus:border-zinc-600 transition-all"
            autoFocus
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-zinc-400 hover:text-white p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="absolute left-3 top-2.5 text-zinc-400 hover:text-white p-0.5 rounded-full cursor-pointer"
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
              className={`flex-shrink-0 px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`mr-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-400'
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
          className={`flex-shrink-0 text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
            filterCategory === null
              ? 'border-white text-white bg-zinc-800 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
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
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-zinc-500 bg-zinc-800 text-white font-semibold'
                  : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
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
