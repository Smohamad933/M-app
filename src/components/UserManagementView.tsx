import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatPersianDate } from '../utils/persianDate';
import type { User } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  ListTodo,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  PlusCircle,
  X,
  Check,
  Lock,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    updateUser,
    deleteUser,
    setSelectedFilterUserId,
    setActiveTab,
    openCreateModal,
  } = useTask();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [formError, setFormError] = useState<string | null>(null);

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const totalTasksAll = users.reduce((sum, u) => sum + (u.totalTasks || 0), 0);
  const totalDoneAll = users.reduce((sum, u) => sum + (u.completedTasks || 0), 0);
  const overallRate = totalTasksAll > 0 ? Math.round((totalDoneAll / totalTasksAll) * 100) : 0;

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
    setFormError(null);
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('نام کاربر الزامی است.');
      return;
    }

    if (editingUser) {
      try {
        await updateUser({
          id: editingUser.id,
          name: name.trim(),
          role,
          password: password.trim() || undefined,
        });
        setIsAddModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || 'خطا در ویرایش کاربر.');
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setFormError('نام کاربری و کلمه عبور الزامی است.');
        return;
      }
      try {
        await createUser({
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          role,
        });
        setIsAddModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || 'خطا در ثبت کاربر.');
      }
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('نمی‌توانید حساب کاربری خودتان را حذف کنید.');
      return;
    }
    if (window.confirm(`آیا از حذف کاربر "${user.name}" و تمام تسک‌های مربوطه اطمینان دارید؟`)) {
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
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پنل مدیریت کاربران و اعضای تیم
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعریف اکانت، تخصیص وظایف و پایش عملکرد اعضا
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          افزودن کاربر جدید
        </button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">تعداد کل کاربران</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(totalUsers)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {toPersianDigits(adminUsers)} مدیر سیستم
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">کل تسک‌های تیم</span>
            <ListTodo className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(totalTasksAll)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            در تمام روزها و موضوعات
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">تسک‌های انجام‌شده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(totalDoneAll)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            تکمیل موفق وظایف
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">میانگین بازدهی</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(overallRate)}٪
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            نرخ تکمیل کل اعضا
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>فهرست حساب‌های کاربری</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
              {toPersianDigits(users.length)} حساب
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700/80">
              <tr>
                <th className="py-3 px-4">کاربر</th>
                <th className="py-3 px-4">نام کاربری</th>
                <th className="py-3 px-4">نقش</th>
                <th className="py-3 px-4">تاریخ ساخت</th>
                <th className="py-3 px-4">وضعیت تسک‌ها</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const total = u.totalTasks || 0;
                const done = u.completedTasks || 0;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* User Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {u.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                                شما
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      @{u.username}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          مدیر سیستم
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          کاربر عادی
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {u.createdAt ? formatPersianDate(u.createdAt, 'short') : '—'}
                    </td>

                    {/* Task Progress */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {toPersianDigits(done)} از {toPersianDigits(total)} انجام شد
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {toPersianDigits(percent)}٪
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleViewUserTasks(u.id)}
                          className="p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="مشاهده تمام تسک‌های این کاربر"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleAssignTask(u.id)}
                          className="p-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="اختصاص تسک جدید به این کاربر"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
                          title="ویرایش مشخصات"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition-colors"
                            title="حذف کاربر"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingUser ? 'ویرایش مشخصات کاربر' : 'ساخت کاربر جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800/60">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  نام کاربری (انگلیسی) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: ali_m"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>کلمه عبور</span>
                  {editingUser && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      (خالی بگذارید تا تغییر نکند)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  نقش و سطح دسترسی
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      role === 'user'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                    }`}
                  >
                    <span>کاربر عادی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                      role === 'admin'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>مدیر سیستم</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingUser ? 'ذخیره تغییرات' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
