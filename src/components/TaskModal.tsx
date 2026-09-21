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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id || 'usr_admin_1');
  const [isPinned, setIsPinned] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDate(editingTask.date);
      setTime(editingTask.time || '');
      setPriority(editingTask.priority);
      setCategoryId(editingTask.categoryId);
      setProjectId(editingTask.projectId || null);
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
      setProjectId(selectedProjectId || null);
      setAssignedUserId(currentUser?.id || 'usr_admin_1');
      setIsPinned(false);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [editingTask, isTaskModalOpen, selectedDate, categories, currentUser, selectedProjectId]);

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
        projectId: projectId || undefined,
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
        projectId: projectId || undefined,
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

  const todayISO = getTodayISO();
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [jy, jm, jd] = isoToJalali(date || todayISO);

  const onJalaliChange = (newJy: number, newJm: number, newJd: number) => {
    const maxD = newJm <= 6 ? 31 : newJm <= 11 ? 30 : 29;
    const safeD = Math.min(newJd, maxD);
    setDate(jalaliToISO(newJy, newJm, safeD));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <h2 className="text-sm font-extrabold text-white">
            {editingTask ? 'ویرایش تسک' : 'افزودن تسک جدید'}
          </h2>
          <button
            onClick={closeTaskModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Admin User Assignment Selector */}
          {currentUser?.role === 'admin' && users.length > 1 && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
              <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                تخصیص تسک به کاربر:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white outline-hidden"
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
            <label className="font-bold text-zinc-300">
              عنوان تسک <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: نهایی‌سازی پروژه..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs outline-hidden focus:border-zinc-500 font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300">
              توضیحات یا یادداشت (اختیاری)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="جزئیات و نکات کلیدی..."
              className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs outline-hidden focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Persian Date & 24-Hour Time Picker */}
          <div className="space-y-3 p-3.5 bg-zinc-800/40 rounded-2xl border border-zinc-700/50">
            {/* Persian Date Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تاریخ شمسی تسک</span>
                </label>
                <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-800/60">
                  {formatPersianDate(date || todayISO, 'full')}
                </span>
              </div>

              {/* Day, Month, Year selects */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold block">روز</span>
                  <select
                    value={jd}
                    onChange={(e) => onJalaliChange(jy, jm, Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-hidden cursor-pointer"
                  >
                    {Array.from({ length: jm <= 6 ? 31 : jm <= 11 ? 30 : 29 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {toPersianDigits(d)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold block">ماه</span>
                  <select
                    value={jm}
                    onChange={(e) => onJalaliChange(jy, Number(e.target.value), jd)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-hidden cursor-pointer"
                  >
                    {PERSIAN_MONTHS.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold block">سال</span>
                  <select
                    value={jy}
                    onChange={(e) => onJalaliChange(Number(e.target.value), jm, jd)}
                    className="w-full px-2 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-hidden cursor-pointer"
                  >
                    {[1403, 1404, 1405, 1406, 1407].map((y) => (
                      <option key={y} value={y}>
                        {toPersianDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Date Pills */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDate(todayISO)}
                  className={`text-[10px] px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                    date === todayISO
                      ? 'bg-white text-zinc-950 font-bold border-transparent'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                  }`}
                >
                  امروز ({formatPersianDate(todayISO, 'dayMonth')})
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getTomorrowISO())}
                  className={`text-[10px] px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                    date === getTomorrowISO()
                      ? 'bg-white text-zinc-950 font-bold border-transparent'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                  }`}
                >
                  فردا ({formatPersianDate(getTomorrowISO(), 'dayMonth')})
                </button>
              </div>
            </div>

            {/* Time (24-hour) */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-300 flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ساعت انجام (۲۴ ساعته)</span>
                </label>
                {time && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    {toPersianDigits(time)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-mono outline-hidden focus:border-zinc-500"
                />
                <div className="flex gap-1 flex-wrap">
                  {['09:00', '12:00', '16:00', '20:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTime(preset)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        time === preset
                          ? 'bg-white text-zinc-950 font-bold border-transparent'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:text-white'
                      }`}
                    >
                      {toPersianDigits(preset)}
                    </button>
                  ))}
                  {time && (
                    <button
                      type="button"
                      onClick={() => setTime('')}
                      className="text-[10px] text-zinc-500 hover:text-rose-400 px-1 py-1 cursor-pointer"
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
            <label className="font-bold text-zinc-300">
              اولویت
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-2 rounded-2xl text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  priority === 'high'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 border-transparent hover:text-white'
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
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 border-transparent hover:text-white'
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
                    ? 'bg-white text-zinc-950 border-white shadow-sm font-black'
                    : 'bg-zinc-800/80 text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                <span>🌱</span>
                عادی
              </button>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300">
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
                        ? 'border-white bg-zinc-800 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
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
              <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                پروژه تیمی (اختیاری)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProjectId(null)}
                  className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    projectId === null
                      ? 'border-white bg-zinc-800 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
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
                          ? 'border-white bg-zinc-800 text-white font-bold shadow-xs'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
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
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="font-bold text-zinc-300 flex items-center justify-between">
              <span>چک‌لیست زیرتسک‌ها</span>
              <span className="text-[11px] font-normal text-zinc-500">
                ({subtasks.length} مورد)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="افزودن گام یا ریزتسک..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white placeholder-zinc-500 text-xs outline-hidden focus:border-zinc-500"
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
                className="px-3 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl transition-colors font-bold flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 rounded-xl border border-zinc-800"
                  >
                    <span className="text-xs text-zinc-200">
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
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
                className="w-4 h-4 rounded text-white focus:ring-0 bg-zinc-800 border-zinc-700"
              />
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                سنجاق به بالای لیست کارهای روزانه
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={closeTaskModal}
              className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingTask ? 'ذخیره تغییرات' : 'ثبت تسک'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
