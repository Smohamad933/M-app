import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import {
  Briefcase,
  User,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
  Plus,
  Trash2,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  User,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
};

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const CategoriesView: React.FC = () => {
  const {
    categories,
    tasks,
    setFilterCategory,
    setActiveTab,
    addCategory,
    deleteCategory,
  } = useTask();

  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);
  const [newCatIcon, setNewCatIcon] = useState('Folder');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setIsAdding(false);
  };

  const handleSelectCategory = (categoryId: string) => {
    setFilterCategory(categoryId);
    setActiveTab('tasks');
  };

  return (
    <div className="flex-1 p-5 pb-24 overflow-y-auto space-y-5">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            دسته‌بندی‌های تسک‌ها
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سازماندهی هوشمند کارها بر اساس موضوعات مختلف
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          دسته‌بندی جدید
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {categories.map((cat) => {
          const catTasks = tasks.filter((t) => t.categoryId === cat.id);
          const completedCount = catTasks.filter((t) => t.completed).length;
          const totalCount = catTasks.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const IconComp = cat.icon && CATEGORY_ICONS[cat.icon] ? CATEGORY_ICONS[cat.icon] : Folder;

          return (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className="group p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {toPersianDigits(totalCount)} تسک ({toPersianDigits(completedCount)} انجام شده)
                    </p>
                  </div>
                </div>

                {!cat.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`آیا دسته‌بندی "${cat.name}" حذف شود؟`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="حذف دسته‌بندی"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>پیشرفت کلی</span>
                  <span>{toPersianDigits(percent)}٪</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ساخت دسته‌بندی جدید
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  نام دسته
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: پروژه‌های فریلنسری..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Icon & Color picker */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  آیکون دسته
                </label>
                <div className="flex items-center gap-2">
                  {Object.keys(CATEGORY_ICONS).map((iconKey) => {
                    const IconComp = CATEGORY_ICONS[iconKey];
                    const isSelected = newCatIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewCatIcon(iconKey)}
                        className={`p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  رنگ نشانگر
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newCatColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  ایجاد دسته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
