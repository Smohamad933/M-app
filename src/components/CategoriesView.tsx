import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import {
  Briefcase,
  User as UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowLeft,
  X,
  Palette,
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
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    sounds.playPop();
    await addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setIsAdding(false);
  };

  const handleSelectCategory = (categoryId: string) => {
    sounds.playPop();
    setFilterCategory(categoryId);
    setActiveTab('tasks');
  };

  const handleDeleteCategory = async (e: React.MouseEvent, categoryId: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟`)) {
      sounds.playTrash();
      if (deleteCategory) {
        await deleteCategory(categoryId);
      }
    }
  };

  const totalCategories = categories.length;

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in select-none" dir="rtl">
      {/* 1. TOP BENTO HEADER */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                دسته‌بندی‌ها و حوزه‌های کاری (Workspaces)
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                {toPersianDigits(totalCategories)} دسته
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium mt-0.5">
              سازماندهی هدفمند وظایف بر اساس بخش‌های زندگی، پروژه‌ها و تخصص‌ها
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playPop();
            setIsAdding(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 text-xs font-black transition-all hover:scale-102 active:scale-95 cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>دسته‌بندی جدید</span>
        </button>
      </div>

      {/* 2. CATEGORIES BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const catTasks = tasks.filter((t) => t.categoryId === cat.id);
          const completedCount = catTasks.filter((t) => t.completed).length;
          const totalCount = catTasks.length;
          const pendingCount = totalCount - completedCount;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const IconComp = cat.icon && CATEGORY_ICONS[cat.icon] ? CATEGORY_ICONS[cat.icon] : Folder;

          return (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className="group p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Top ambient color strip */}
              <div
                className="absolute top-0 right-0 left-0 h-1.5 opacity-80"
                style={{ backgroundColor: cat.color }}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      border: `1.5px solid ${cat.color}35`,
                    }}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500">
                      {toPersianDigits(totalCount)} تسک کل
                    </span>
                  </div>
                </div>

                {deleteCategory && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="حذف دسته"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress and status */}
              <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                  <span>پیشرفت کل</span>
                  <span className="font-mono font-black" style={{ color: cat.color }}>
                    {toPersianDigits(percent)}٪
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-[#252528] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{toPersianDigits(completedCount)} انجام‌شده</span>
                  </span>

                  <span>{toPersianDigits(pendingCount)} در انتظار</span>
                </div>
              </div>

              {/* Action hint */}
              <div className="flex items-center justify-between text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 pt-1 group-hover:translate-x-1 transition-transform">
                <span>مشاهده تسک‌های این بخش</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CREATE CATEGORY MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  ساخت دسته‌بندی جدید
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">نام دسته‌بندی</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: پروژه‌های ویدیویی، سلامت، یادگیری..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs font-bold"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">آیکون نمادین</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(CATEGORY_ICONS).map((iconKey) => {
                    const IconComp = CATEGORY_ICONS[iconKey];
                    const isSelected = newCatIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewCatIcon(iconKey)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'border-black/[0.06] dark:border-white/[0.08] text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">رنگ معرف</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-xs ${
                        newCatColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-black cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-slate-900 font-black cursor-pointer shadow-md transition-all active:scale-95"
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
