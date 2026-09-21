import React, { useState } from 'react';
import { useTask, AVAILABLE_FONTS } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
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
  Type,
  Sparkles,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  Briefcase,
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
    systemFont,
    setSystemFont,
    exportUsersCsv,
  } = useTask();

  const [fontSavedNotice, setFontSavedNotice] = useState(false);

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
      setFormError('لطفاً فیلدهای ستاره‌دار را تکمیل کنید.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/70 p-5 rounded-3xl border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                پنل مانیتورینگ ادمین (Mohusyn)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                دسترسی کامل مدیر کل
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              پایش عملکرد، مانیتورینگ تسک‌ها، تخصیص کار و دریافت گزارش اکسل دیتابیس
            </p>
          </div>
        </div>

        {/* Top actions: Add User & Export Excel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportUsersCsv}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            title="خروجی فایل اکسل با انکودینگ UTF-8 BOM"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>خروجی اکسل / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            افزودن کاربر
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">کل کاربران ثبت‌شده</div>
          <div className="text-2xl font-black text-white">{toPersianDigits(users.length)}</div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">مدیران سیستم</div>
          <div className="text-2xl font-black text-purple-400">
            {toPersianDigits(users.filter((u) => u.role === 'admin').length)}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">کاربران عادی (User)</div>
          <div className="text-2xl font-black text-white">
            {toPersianDigits(users.filter((u) => u.role === 'user').length)}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 mb-1">میانگین پیشرفت تیم</div>
          <div className="text-2xl font-black text-emerald-400">
            {toPersianDigits(
              users.length > 0
                ? Math.round(users.reduce((acc, u) => acc + (u.progressPercent || 0), 0) / users.length)
                : 0
            )}٪
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">
            فهرست حساب‌های کاربری و مشخصات فردی ({toPersianDigits(users.length)})
          </span>
          <span className="text-[11px] text-zinc-400">
            برای مانیتورینگ تسک‌ها یا اختصاص تسک جدید روی هر کاربر کلیک کنید
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
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
              >
                {/* User info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {u.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-white">{u.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          شما
                        </span>
                      )}
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          مدیر سیستم
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          کاربر عادی
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-0.5">
                      <span className="font-mono text-zinc-500">@{u.username}</span>

                      {u.jobTitle && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/50">
                          <Briefcase className="w-3 h-3 text-zinc-400" />
                          {u.jobTitle}
                        </span>
                      )}

                      {(u.province || u.city) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          {u.province} {u.city && `، ${u.city}`}
                        </span>
                      )}

                      {u.phone && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {toPersianDigits(u.phone)}
                        </span>
                      )}

                      {u.email && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          {u.email}
                        </span>
                      )}
                    </div>

                    {/* Skills pills */}
                    {Array.isArray(u.skills) && u.skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {u.skills.slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-950/60 border border-zinc-800 text-zinc-400"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Task progress & action buttons */}
                <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-0 border-zinc-800/60">
                  <div className="text-right lg:text-left min-w-[100px]">
                    <div className="text-xs font-bold text-zinc-200">
                      {toPersianDigits(done)} از {toPersianDigits(total)} تسک
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      پیشرفت {toPersianDigits(percent)}٪
                    </div>
                    <div className="w-24 bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* System Font Customizer for Super Admin */}
      <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                تنظیم فونت سراسری سیستم
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  فقط مدیر کل
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                تغییر فونت کل سیستم تسک‌روز، تیترها، جداول، کارت‌های تسک و منوها
              </p>
            </div>
          </div>

          {fontSavedNotice && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              فونت بر کل سیستم اعمال شد
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVAILABLE_FONTS.map((font) => {
            const isCurrent = systemFont === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  setSystemFont(font.id);
                  sounds.playComplete();
                  setFontSavedNotice(true);
                  setTimeout(() => setFontSavedNotice(false), 2500);
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white truncate">{font.name}</span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      فعال
                    </span>
                  )}
                </div>
                <div
                  className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[11px] text-zinc-300 line-clamp-2"
                  style={{ fontFamily: font.family }}
                >
                  برنامه‌ریزی روزانه و پومودورو (۱۲۳۴۵۶۷۸۹۰)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
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

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-300">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">
                    نام کاربری <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="انگلیسی (ali_m)"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
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
                      className="w-full pl-3 pr-8 py-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                    />
                    <Lock className="w-3.5 h-3.5 absolute right-2.5 top-3 text-zinc-400" />
                  </div>
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
