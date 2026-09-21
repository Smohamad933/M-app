import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import type { User, GlobalSystemSettings } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Eye,
  PlusCircle,
  X,
  Type,
  Sparkles,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  RefreshCw,
  Megaphone,
  Sliders,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    deleteUser,
    refreshUsers,
    setSelectedFilterUserId,
    setActiveTab,
    openCreateModal,
    allAvailableFonts,
    exportUsersCsv,
    globalSettings,
    updateGlobalSettings,
  } = useTask();

  // Active view tab inside Admin Panel
  const [adminTab, setAdminTab] = useState<'users' | 'settings'>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh users when admin opens this tab + poll every 3s + storage event sync!
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(() => {
      refreshUsers();
    }, 3000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'taskrooz_sync_signal' || e.key === 'taskrooz_users_local') {
        refreshUsers();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshUsers]);

  // Global Settings Form state
  const [formSettings, setFormSettings] = useState<GlobalSystemSettings>(globalSettings);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setFormSettings(globalSettings);
  }, [globalSettings]);

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    sounds.playPop();
    try {
      await refreshUsers();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setEmail('');
    setJobTitle('');
    setCity('');
    setRole('user');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('لطفاً فیلدهای ستاره‌دار (نام، نام کاربری و رمز عبور) را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        city: city.trim() || undefined,
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

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateGlobalSettings(formSettings);
      setSettingsSavedNotice(true);
      setTimeout(() => setSettingsSavedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header matching mohusyn.ir */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 p-5 rounded-3xl border border-zinc-800 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white">
                پنل مدیریت و فرماندهی سیستم (Mohusyn)
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              پایش عملکرد اعضا، اعمال تنظیمات سراسری برای همه کاربران، و خروجی دیتابیس
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            title="به‌روزرسانی بلادرنگ فهرست کاربران"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>به‌روزرسانی</span>
          </button>

          <button
            onClick={exportUsersCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            title="خروجی فایل اکسل با انکودینگ UTF-8 BOM"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>خروجی اکسل / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            افزودن کاربر جدید
          </button>
        </div>
      </div>

      {/* Admin Panel Tabs */}
      <div className="flex items-center p-1.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 max-w-md">
        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'users'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>پایش و فهرست اعضا ({toPersianDigits(users.length)})</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>تنظیمات سراسری سازمان</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST & MONITORING */}
      {adminTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="text-xs text-zinc-400 mb-1">کل کاربران ثبت‌شده</div>
              <div className="text-2xl font-black text-white">{toPersianDigits(users.length)}</div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="text-xs text-zinc-400 mb-1">مدیران سیستم</div>
              <div className="text-2xl font-black text-purple-400">
                {toPersianDigits(users.filter((u) => u.role === 'admin').length)}
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="text-xs text-zinc-400 mb-1">کاربران عادی (User)</div>
              <div className="text-2xl font-black text-white">
                {toPersianDigits(users.filter((u) => u.role === 'user').length)}
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
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

          {/* Users List Table/Cards */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">
                فهرست کامل اعضای سیستم ({toPersianDigits(users.length)})
              </span>
              <span className="text-[11px] text-zinc-400">
                مشاهده لحظه‌ای عملکرد و انتصاب مستقیم تسک
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const total = u.totalTasks || 0;
                const done = u.completedTasks || 0;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                const skills = Array.isArray(u.skills) ? u.skills : [];

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
                              شما (مدیر)
                            </span>
                          )}
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              مدیر کل
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
                              {u.phone}
                            </span>
                          )}

                          {u.email && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <Mail className="w-3 h-3 text-zinc-500" />
                              {u.email}
                            </span>
                          )}
                        </div>

                        {/* Skills chips */}
                        {skills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {skills.slice(0, 4).map((sk, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-300 border border-zinc-700/40"
                              >
                                {sk}
                              </span>
                            ))}
                            {skills.length > 4 && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                +{toPersianDigits(skills.length - 4)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress & Actions */}
                    <div className="flex items-center gap-4 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-800">
                      {/* Task Stats */}
                      <div className="text-right min-w-[110px]">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="text-xs font-bold text-white">
                            {toPersianDigits(done)} از {toPersianDigits(total)}
                          </span>
                          <span className="text-[11px] text-zinc-400">تسک</span>
                        </div>
                        <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          پیشرفت: {toPersianDigits(percent)}٪
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAssignTask(u.id)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
                          title="انتصاب تسک سازمانی به این کاربر"
                        >
                          <PlusCircle className="w-4 h-4 text-indigo-400" />
                        </button>

                        <button
                          onClick={() => handleViewUserTasks(u.id)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors cursor-pointer"
                          title="مشاهده تسک‌های این کاربر"
                        >
                          <Eye className="w-4 h-4 text-zinc-300" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700/60 hover:border-rose-500/30 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* TAB 2: GLOBAL SETTINGS (ENFORCED BY MOHUSYN FOR ALL USERS) */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveGlobalSettings} className="space-y-6 animate-in fade-in">
          {settingsSavedNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>تنظیمات سراسری سازمان با موفقیت بر کل کاربران سیستم اعمال گردید.</span>
            </div>
          )}

          {/* 1. Global Announcement Card */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">اطلاعیه و بنر سراسری برای تمام کاربران</h3>
                  <p className="text-[11px] text-zinc-400">پیامی که در بالای صفحه تمام کاربران سیستم به صورت زنده نمایش داده می‌شود.</p>
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-zinc-400 font-bold">نمایش بنر</span>
                <input
                  type="checkbox"
                  checked={formSettings.broadcastNotice.enabled}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      broadcastNotice: { ...formSettings.broadcastNotice, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1">عنوان پیام</label>
                <input
                  type="text"
                  value={formSettings.broadcastNotice.title}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      broadcastNotice: { ...formSettings.broadcastNotice, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                  placeholder="مثال: جلسه اضطراری هماهنگی پروژه‌ها"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">نوع و رنگ بنر</label>
                <select
                  value={formSettings.broadcastNotice.type}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      broadcastNotice: {
                        ...formSettings.broadcastNotice,
                        type: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="info">اطلاعاتی و عمومی (آبی)</option>
                  <option value="warning">هشدار و تذکر (زرد)</option>
                  <option value="urgent">فوری و مهم (قرمز)</option>
                  <option value="motivational">انگیزشی و تیمی (سبز)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">متن کامل اطلاعیه برای اعضا</label>
              <textarea
                value={formSettings.broadcastNotice.message}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    broadcastNotice: { ...formSettings.broadcastNotice, message: e.target.value },
                  })
                }
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500 resize-none"
                placeholder="متن پیام سراسری شما برای نمایش به تمام اعضای تیم..."
              />
            </div>
          </div>

          {/* 2. System Theme & Font Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Type className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">فونت پیش‌فرض سراسری سامانه</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                فونت انتخابی شما به عنوان فونت استاندارد برای تمام دستگاه‌ها و کاربران تنظیم می‌شود.
              </p>
              <select
                value={formSettings.enforcedFont}
                onChange={(e) => setFormSettings({ ...formSettings, enforcedFont: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-purple-500"
              >
                {allAvailableFonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.isCustom ? '(سفارشی)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">سیاست ساعات کاری سازمان</h3>
              </div>
              <p className="text-[11px] text-zinc-400">
                بازه ساعات رسمی کار و هدف حداقل تمرکز روزانه هر عضو تیم.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">شروع کار</label>
                  <input
                    type="text"
                    value={formSettings.workHoursPolicy.start}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        workHoursPolicy: { ...formSettings.workHoursPolicy, start: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">پایان کار</label>
                  <input
                    type="text"
                    value={formSettings.workHoursPolicy.end}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        workHoursPolicy: { ...formSettings.workHoursPolicy, end: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">هدف تمرکز (دقیقه)</label>
                  <input
                    type="number"
                    value={formSettings.defaultDailyFocusMinutes}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        defaultDailyFocusMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center font-mono text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Focus Room Permissions & Daily Mantra */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">دسترسی‌ها و شعار انگیزشی روز</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">سیاست اتاق‌های تمرکز زنده</label>
                <div className="space-y-2 text-xs text-zinc-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.roomPolicy.allowUserRoomCreation}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          roomPolicy: { ...formSettings.roomPolicy, allowUserRoomCreation: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>کاربران عادی اجازه ایجاد اتاق جدید داشته باشند</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.roomPolicy.allowPublicChat}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          roomPolicy: { ...formSettings.roomPolicy, allowPublicChat: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span>امکان چت و گفتگو در اتاق‌های تمرکز فعال باشد</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  شعار یا تمرکز کلیدی روز (Daily Mantra)
                </label>
                <input
                  type="text"
                  value={formSettings.dailyMantra}
                  onChange={(e) => setFormSettings({ ...formSettings, dailyMantra: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-emerald-500"
                  placeholder="مثال: اولویت با کارهای عمیق، پرهیز از اتلاف وقت در شبکه‌های اجتماعی"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? 'در حال اعمال سراسری...' : 'اعمال سراسری بر کل کاربران سیستم 🚀'}
            </button>
          </div>
        </form>
      )}

      {/* MODAL: ADD USER */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                افزودن عضو جدید به سیستم
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    نام و نام خانوادگی <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    نام کاربری (انگلیسی) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ali_rezaei"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    کلمه عبور <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">نقش کاربری</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="user">کاربر عادی (User)</option>
                    <option value="admin">مدیر سیستم (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">عنوان شغلی</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: توسعه‌دهنده نرم‌افزار"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">شهر محل سکونت</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: تهران"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">شماره موبایل</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">ایمیل</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت کاربر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
