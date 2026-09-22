import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import type { Priority, SubTask } from '../types';
import {
  getTodayISO,
  formatPersianDate,
  PERSIAN_MONTHS,
  isoToJalali,
  jalaliToISO,
  toPersianDigits,
} from '../utils/persianDate';
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
  FolderKanban,
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
    projects,
    selectedProjectId,
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
  const [projectId, setProjectId] = useState<string | null>(selectedProjectId);
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Admin user assignment
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser?.id || '');

  const todayISO = getTodayISO();

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDate(editingTask.date);
      setTime(editingTask.time || '');
      setPriority(editingTask.priority);
      setCategoryId(editingTask.categoryId);
      setProjectId(editingTask.projectId || null);
      setIsPinned(editingTask.isPinned || false);
      setSubtasks(editingTask.subtasks || []);
      setAssignedUserId(editingTask.userId || currentUser?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setDate(selectedDate || todayISO);
      setTime('');
      setPriority('medium');
      setCategoryId(categories[0]?.id || 'cat-work');
      setProjectId(selectedProjectId || null);
      setIsPinned(false);
      setSubtasks([]);
      setAssignedUserId(currentUser?.id || '');
    }
  }, [editingTask, isTaskModalOpen, selectedDate, selectedProjectId, categories, currentUser, todayISO]);

  if (!isTaskModalOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      updateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time: time || undefined,
        priority,
        categoryId,
        projectId: projectId || undefined,
        isPinned,
        subtasks,
        ...(currentUser?.role === 'admin' ? { userId: assignedUserId } : {}),
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        time: time || undefined,
        priority,
        categoryId,
        projectId: projectId || undefined,
        completed: false,
        isPinned,
        subtasks,
        ...(currentUser?.role === 'admin' ? { userId: assignedUserId } : {}),
      });
    }

    closeTaskModal();
  };

  // Jalali selector parts
  const [jy, jm, jd] = isoToJalali(date || todayISO);

  const onJalaliChange = (newJy: number, newJm: number, newJd: number) => {
    const maxD = newJm <= 6 ? 31 : newJm <= 11 ? 30 : 29;
    const safeD = Math.min(newJd, maxD);
    setDate(jalaliToISO(newJy, newJm, safeD));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">
            {editingTask ? 'ویرایش تسک' : 'افزودن تسک جدید'}
          </h2>
          <button
            onClick={closeTaskModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Admin User Assignment Selector */}
          {currentUser?.role === 'admin' && users.length > 1 && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                تخصیص تسک به کاربر:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none"
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
            <label className="font-extrabold text-slate-700">
              عنوان تسک <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: نهایی‌سازی پروژه..."
              className="w-full px-4 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 placeholder-slate-400 text-xs outline-none focus:border-slate-400 focus:bg-white font-bold transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700">
              توضیحات یا یادداشت (اختیاری)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="جزئیات و نکات کلیدی..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-slate-900 placeholder-slate-400 text-xs outline-none focus:border-slate-400 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Persian Date & 24-Hour Time Picker */}
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-slate-200">
            {/* Persian Date Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تاریخ شمسی تسک</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                  {formatPersianDate(date || todayISO, 'full')}
                </span>
              </div>

              {/* Day, Month, Year selects */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">روز</span>
                  <select
                    value={jd}
                    onChange={(e) => onJalaliChange(jy, jm, Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs outline-none cursor-pointer"
                  >
                    {Array.from({ length: jm <= 6 ? 31 : jm <= 11 ? 30 : 29 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {toPersianDigits(d)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">ماه</span>
                  <select
                    value={jm}
                    onChange={(e) => onJalaliChange(jy, Number(e.target.value), jd)}
                    className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs outline-none cursor-pointer"
                  >
                    {PERSIAN_MONTHS.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">سال</span>
                  <select
                    value={jy}
                    onChange={(e) => onJalaliChange(Number(e.target.value), jm, jd)}
                    className="w-full px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs outline-none font-mono cursor-pointer"
                  >
                    {[1404, 1405, 1406].map((y) => (
                      <option key={y} value={y}>
                        {toPersianDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 24-Hour Time Picker */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="font-extrabold text-slate-700 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>ساعت اجرا (۲۴ ساعته)</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  جهت نمایش در دیلی پلنر ساعتی
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono outline-none cursor-pointer focus:border-slate-400"
                />

                {/* Quick hour buttons */}
                <div className="flex flex-wrap gap-1">
                  {['09:00', '12:00', '15:00', '18:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTime(preset)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        time === preset
                          ? 'bg-[#121212] text-white font-bold border-black'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-black'
                      }`}
                    >
                      {toPersianDigits(preset)}
                    </button>
                  ))}
                  {time && (
                    <button
                      type="button"
                      onClick={() => setTime('')}
                      className="text-[10px] text-slate-400 hover:text-rose-500 px-1 py-1 cursor-pointer font-bold"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700">
              اولویت
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  priority === 'high'
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                    : 'bg-[#f8fafc] text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                فوری
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                    : 'bg-[#f8fafc] text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                <span>⚡</span>
                مهم
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  priority === 'low'
                    ? 'bg-slate-100 text-slate-800 border-slate-300 shadow-xs font-black'
                    : 'bg-[#f8fafc] text-slate-500 border-slate-200 hover:text-slate-900'
                }`}
              >
                <span>🌱</span>
                عادی
              </button>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-700">
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
                        ? 'border-slate-800 bg-[#121212] text-white font-bold'
                        : 'border-slate-200 bg-[#f8fafc] text-slate-600 hover:text-black'
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

          {/* Team Project selection */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                پروژه تیمی (اختیاری)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProjectId(null)}
                  className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    projectId === null
                      ? 'border-slate-800 bg-[#121212] text-white font-bold'
                      : 'border-slate-200 bg-[#f8fafc] text-slate-600 hover:text-black'
                  }`}
                >
                  بدون پروژه (شخصی)
                </button>
                {projects.map((p) => {
                  const isSelected = projectId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectId(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-800 bg-[#121212] text-white font-bold shadow-xs'
                          : 'border-slate-200 bg-[#f8fafc] text-slate-600 hover:text-black'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtasks (Checklist) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-extrabold text-slate-700 flex items-center justify-between">
              <span>چک‌لیست زیرتسک‌ها</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({subtasks.length} مورد)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="افزودن گام یا ریزتسک..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#f8fafc] border border-slate-200 text-slate-900 placeholder-slate-400 text-xs outline-none focus:border-slate-400"
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
                className="px-3.5 py-2 bg-[#121212] hover:bg-black text-white rounded-xl transition-colors font-bold flex items-center justify-center cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80"
                  >
                    <span className="text-xs text-slate-700">
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
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
                className="w-4 h-4 rounded text-slate-900 focus:ring-0 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#f95738]" />
                سنجاق به بالای لیست کارهای روزانه
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={closeTaskModal}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[#121212] hover:bg-black text-white font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{editingTask ? 'ذخیره تغییرات' : 'افزودن تسک'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
