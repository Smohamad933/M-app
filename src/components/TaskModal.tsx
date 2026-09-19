import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import type { Priority, SubTask } from '../types';
import { getTodayISO } from '../utils/persianDate';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Star,
  Check,
  AlertCircle,
  Briefcase,
  User as UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
  UserCheck,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  User: UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
};

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    closeTaskModal,
    editingTask,
    addTask,
    updateTask,
    categories,
    selectedDate,
    currentUser,
    users,
  } = useTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id || 'usr_admin_1');
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Populate form when editing or resetting for new
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDate(editingTask.date);
      setTime(editingTask.time || '');
      setPriority(editingTask.priority);
      setCategoryId(editingTask.categoryId);
      setAssignedUserId(editingTask.userId || currentUser?.id || 'usr_admin_1');
      setIsPinned(!!editingTask.isPinned);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setDate(selectedDate || getTodayISO());
      setTime('');
      setPriority('medium');
      setCategoryId(categories[0]?.id || 'cat-work');
      setAssignedUserId(currentUser?.id || 'usr_admin_1');
      setIsPinned(false);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [editingTask, isTaskModalOpen, selectedDate, categories, currentUser]);

  if (!isTaskModalOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (subId: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== subId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      await updateTask({
        ...editingTask,
        userId: assignedUserId,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time: time || undefined,
        priority,
        categoryId,
        isPinned,
        subtasks,
      });
    } else {
      await addTask({
        userId: assignedUserId,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time: time || undefined,
        completed: false,
        priority,
        categoryId,
        isPinned,
        subtasks,
      });
    }

    closeTaskModal();
  };

  // Quick dates helpers
  const todayISO = getTodayISO();
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {editingTask ? 'ویرایش تسک' : 'افزودن تسک جدید'}
          </h2>
          <button
            onClick={closeTaskModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Admin User Assignment Selector */}
          {currentUser?.role === 'admin' && users.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
              <label className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                تخصیص تسک به کاربر:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-hidden"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username}) {u.role === 'admin' ? '- مدیر' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              عنوان تسک <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تحویل گزارش نهایی..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              توضیحات یا یادداشت (اختیاری)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="جزئیات بیشتر، نکات مهم و ..."
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                تاریخ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDate(todayISO)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    date === todayISO
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getTomorrowISO())}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    date === getTomorrowISO()
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  فردا
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                ساعت (اختیاری)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              اولویت تسک
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  priority === 'high'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                فوری
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  priority === 'medium'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>⚡</span>
                مهم
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  priority === 'low'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🌱</span>
                عادی
              </button>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              دسته‌بندی
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const IconComponent = cat.icon && CATEGORY_ICONS[cat.icon] ? CATEGORY_ICONS[cat.icon] : Folder;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                        : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <IconComponent
                      className="w-3.5 h-3.5"
                      style={{ color: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks (Checklist) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>چک‌لیست و ریزتسک‌ها</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({subtasks.length} مورد)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="افزودن گام یا زیرتسک..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-bold flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50"
                  >
                    <span className="text-xs text-slate-800 dark:text-slate-200">
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pin option */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                سنجاق به بالای لیست تسک‌ها
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={closeTaskModal}
              className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingTask ? 'ذخیره تغییرات' : 'ثبت تسک جدید'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
