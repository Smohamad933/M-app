import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatPersianDate } from '../utils/persianDate';
import type { User } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Eye,
  PlusCircle,
  X,
  Check,
  Lock,
  User as UserIcon,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    deleteUser,
    setSelectedFilterUserId,
    setActiveTab,
    openCreateModal,
  } = useTask();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not admin, do not render
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 text-zinc-400">
        شما دسترسی لازم برای مشاهده این بخش را ندارید.
      </div>
    );
  }

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('لطفاً تمامی فیلدها را تکمیل کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت کاربر جدید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('امکان حذف حساب کاربری جاری خودتان وجود ندارد.');
      return;
    }

    if (window.confirm(`آیا از حذف حساب کاربری "${user.name}" اطمینان دارید؟ تمامی تسک‌های مربوطه نیز حذف خواهند شد.`)) {
      try {
        await deleteUser(user.id);
      } catch (err: any) {
        alert(err.message || 'خطا در حذف کاربر.');
      }
    }
  };

  const handleViewUserTasks = (userId: string) => {
    setSelectedFilterUserId(userId);
    setActiveTab('tasks');
  };

  const handleAssignTask = (userId: string) => {
    openCreateModal(undefined, userId);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header bar matching mohusyn.ir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/70 p-5 rounded-3xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              مدیریت کاربران و دسترسی‌ها
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              افزودن و حذف کاربران، پایش تسک‌ها و کنترل دسترسی‌ها (فقط شما به عنوان مدیر دسترسی دارید)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          افزودن کاربر جدید
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">تعداد کاربران فعال</div>
          <div className="text-2xl font-black text-white">{toPersianDigits(users.length)}</div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">مدیران سیستم</div>
          <div className="text-2xl font-black text-white">
            {toPersianDigits(users.filter((u) => u.role === 'admin').length)}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 col-span-2 sm:col-span-1">
          <div className="text-xs text-zinc-400 mb-1">کاربران عادی</div>
          <div className="text-2xl font-black text-white">
            {toPersianDigits(users.filter((u) => u.role === 'user').length)}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">
            فهرست حساب‌های کاربری ({toPersianDigits(users.length)})
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {users.map((u) => {
            const isCurrent = u.id === currentUser?.id;
            const total = u.totalTasks || 0;
            const done = u.completedTasks || 0;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
              >
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/60 text-white font-bold flex items-center justify-center text-sm">
                    {u.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{u.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          شما
                        </span>
                      )}
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          مدیر
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          کاربر
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      @{u.username} • عضویت {u.createdAt ? formatPersianDate(u.createdAt, 'short') : '—'}
                    </div>
                  </div>
                </div>

                {/* Task progress & action buttons */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800/60">
                  <div className="text-right sm:text-left">
                    <div className="text-xs font-bold text-zinc-200">
                      {toPersianDigits(done)} از {toPersianDigits(total)} تسک
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      پیشرفت {toPersianDigits(percent)}٪
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* View user tasks */}
                    <button
                      onClick={() => handleViewUserTasks(u.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="مشاهده تسک‌های این کاربر"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>تسک‌ها</span>
                    </button>

                    {/* Assign task */}
                    <button
                      onClick={() => handleAssignTask(u.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="اختصاص تسک جدید به این کاربر"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>تسک جدید</span>
                    </button>

                    {/* Delete user */}
                    {!isCurrent && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="حذف کاربر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-zinc-300" />
                افزودن کاربر جدید
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 text-rose-400 text-xs border border-rose-800/60 font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-850 bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  نام کاربری (انگلیسی) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: ali_m"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">
                  کلمه عبور <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور کاربر"
                    className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3 text-zinc-400" />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">سطح دسترسی</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      role === 'user'
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>کاربر عادی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>مدیر سیستم</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'در حال ایجاد...' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
