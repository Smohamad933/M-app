import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import {
  Briefcase,
  User as UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
  Plus,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  User: UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
};

const COLOR_PALETTE = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export const CategoriesView: React.FC = () => {
  const {
    categories,
    tasks,
    setFilterCategory,
    setActiveTab,
    addCategory,
  } = useTask();

  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);
  const [newCatIcon, setNewCatIcon] = useState('Folder');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">
            دسته‌بندی‌های کارهای شما
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            سازماندهی هوشمند بر اساس حوزه‌های مختلف کاری و شخصی
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          دسته‌بندی جدید
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
              className="p-4 bg-zinc-900/60 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}40` }}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {toPersianDigits(totalCount)} تسک ({toPersianDigits(completedCount)} انجام شده)
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>پیشرفت</span>
                  <span>{toPersianDigits(percent)}٪</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
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

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white">
              ساخت دسته‌بندی جدید
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">نام دسته</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: پروژه‌های ویدیویی..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-hidden focus:border-zinc-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">آیکون</label>
                <div className="flex items-center gap-2">
                  {Object.keys(CATEGORY_ICONS).map((iconKey) => {
                    const IconComp = CATEGORY_ICONS[iconKey];
                    const isSelected = newCatIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewCatIcon(iconKey)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white bg-zinc-700 text-white'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">رنگ نشانگر</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        newCatColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 font-black cursor-pointer shadow-md"
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
