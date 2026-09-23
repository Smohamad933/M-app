import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { APP_TEXTS, APP_TEXT_SECTIONS } from '../utils/appTexts';
import { UserAvatar } from './UserAvatar';
import type { User, GlobalSystemSettings, AppDeveloper } from '../types';
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
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ListTodo,
  Target,
  BookOpen,
  CheckCircle,
  Image as ImageIcon,
  ImagePlus,
  Smartphone,
  Code2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  Download,
  Copy,
  Package,
  CreditCard,
} from 'lucide-react';

/**
 * Read an image file, center-crop to a square and downscale to max `max` px.
 */
function processSquareImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const scale = Math.min(1, max / side);
        const size = Math.max(1, Math.round(side * scale));
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('image load failed'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Admin branding image field: preview + upload + remove */
const BrandImageField: React.FC<{
  label: string;
  description: string;
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
  maxSide?: number;
}> = ({ label, description, value, onChange, maxSide = 512 }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('فقط فایل تصویری مجاز است (PNG / JPG / WebP).');
      return;
    }
    try {
      const dataUrl = await processSquareImage(file, maxSide);
      onChange(dataUrl);
    } catch {
      alert('خواندن تصویر ناموفق بود.');
    }
  };
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-zinc-300">{label}</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-zinc-600" />
          )}
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className="text-[10px] text-zinc-500 leading-relaxed">{description}</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{value ? 'تغییر عکس' : 'بارگذاری عکس'}</span>
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 transition-colors cursor-pointer"
                title="حذف عکس"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
};

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
    deleteUsersBulk,
    setUserSubscription,
  } = useTask();

  // Active view tab inside Admin Panel
  const [adminTab, setAdminTab] = useState<'users' | 'settings' | 'texts' | 'developers' | 'apk'>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [planFilter, setPlanFilter] = useState<'all' | 'pro' | 'free'>('all');

  // Bulk selection & actions (multi-select users)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // APK generation states
  const [isBuildingApk, setIsBuildingApk] = useState(false);
  const [apkBuildStep, setApkBuildStep] = useState<string | null>(null);
  const [apkBuildProgress, setApkBuildProgress] = useState(0);
  const [copiedApkLink, setCopiedApkLink] = useState(false);

  const handleGenerateAndDownloadApk = () => {
    setIsBuildingApk(true);
    setApkBuildProgress(20);
    setApkBuildStep('در حال بسته‌بندی فایل‌های وب، استایل‌ها و کامپوننت‌های تسک‌روز...');
    sounds.playPop();

    setTimeout(() => {
      setApkBuildProgress(50);
      setApkBuildStep('تولید ساختار AndroidManifest، آیکون‌های برنامه و کانفیگ WebView...');
    }, 700);

    setTimeout(() => {
      setApkBuildProgress(80);
      setApkBuildStep('تلفیق منابع و امضای دیجیتال بسته نصبی (TaskRooz.apk)...');
    }, 1400);

    setTimeout(() => {
      setApkBuildProgress(100);
      setApkBuildStep('پکیج APK با موفقیت ساخته شد! در حال شروع دانلود...');
      sounds.playComplete();

      // Trigger file download
      const link = document.createElement('a');
      link.href = '/TaskRooz.apk';
      link.download = 'TaskRooz.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsBuildingApk(false);
        setApkBuildStep(null);
      }, 1500);
    }, 2100);
  };

  const handleCopyApkLink = () => {
    const origin = window.location.origin;
    const directUrl = `${origin}/TaskRooz.apk`;
    navigator.clipboard.writeText(directUrl);
    setCopiedApkLink(true);
    sounds.playPop();
    setTimeout(() => setCopiedApkLink(false), 3000);
  };

  // Admin App Developers Manager (configured by admin with photo, name, role)
  const [developersList, setDevelopersList] = useState<AppDeveloper[]>(() => {
    if (globalSettings?.appDevelopers && globalSettings.appDevelopers.length > 0) {
      return globalSettings.appDevelopers;
    }
    return [
      {
        id: 'dev_mohusyn',
        name: 'Mohusyn',
        role: 'توسعه‌دهنده ارشد و معمار سیستم',
        avatarUrl: null,
        bio: 'طراح، برنامه‌نویس و سازنده تسک‌روز',
        link: '',
      },
    ];
  });

  const [devForm, setDevForm] = useState<{
    id?: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    bio: string;
    link: string;
  }>({
    name: '',
    role: '',
    avatarUrl: null,
    bio: '',
    link: '',
  });

  const [editingDevId, setEditingDevId] = useState<string | null>(null);
  const [isSavingDevelopers, setIsSavingDevelopers] = useState(false);
  const [developersSavedNotice, setDevelopersSavedNotice] = useState(false);

  useEffect(() => {
    if (globalSettings?.appDevelopers && globalSettings.appDevelopers.length > 0) {
      setDevelopersList(globalSettings.appDevelopers);
    }
  }, [globalSettings?.appDevelopers]);

  const handleDevPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processSquareImage(file, 256);
      setDevForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      sounds.playPop();
    } catch {
      alert('خطا در پردازش تصویر. لطفاً تصویر دیگری انتخاب کنید.');
    }
  };

  const handleSaveDeveloperItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devForm.name.trim()) {
      alert('لطفاً نام توسعه‌دهنده را وارد کنید.');
      return;
    }
    if (!devForm.role.trim()) {
      alert('لطفاً سمت / نقش توسعه‌دهنده را مشخص کنید.');
      return;
    }

    if (editingDevId) {
      setDevelopersList((prev) =>
        prev.map((d) => (d.id === editingDevId ? { ...d, ...devForm, id: editingDevId } : d))
      );
      setEditingDevId(null);
    } else {
      const newDev: AppDeveloper = {
        id: 'dev_' + Date.now(),
        name: devForm.name.trim(),
        role: devForm.role.trim(),
        avatarUrl: devForm.avatarUrl,
        bio: devForm.bio.trim(),
        link: devForm.link.trim(),
      };
      setDevelopersList((prev) => [...prev, newDev]);
    }

    setDevForm({ name: '', role: '', avatarUrl: null, bio: '', link: '' });
    sounds.playComplete();
  };

  const handleEditDev = (dev: AppDeveloper) => {
    setEditingDevId(dev.id);
    setDevForm({
      id: dev.id,
      name: dev.name,
      role: dev.role,
      avatarUrl: dev.avatarUrl || null,
      bio: dev.bio || '',
      link: dev.link || '',
    });
    sounds.playPop();
  };

  const handleDeleteDev = (devId: string) => {
    if (developersList.length <= 1) {
      alert('حداقل یک توسعه‌دهنده باید در سیستم ثبت باشد.');
      return;
    }
    if (!window.confirm('آیا از حذف این عضو از تیم توسعه اطمینان دارید؟')) return;
    setDevelopersList((prev) => prev.filter((d) => d.id !== devId));
    if (editingDevId === devId) {
      setEditingDevId(null);
      setDevForm({ name: '', role: '', avatarUrl: null, bio: '', link: '' });
    }
    sounds.playPop();
  };

  const handleMoveDev = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= developersList.length) return;
    const copy = [...developersList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setDevelopersList(copy);
    sounds.playPop();
  };

  const handlePublishDevelopers = async () => {
    setIsSavingDevelopers(true);
    try {
      await updateGlobalSettings({ appDevelopers: developersList });
      setDevelopersSavedNotice(true);
      setTimeout(() => setDevelopersSavedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره توسعه‌دهندگان');
    } finally {
      setIsSavingDevelopers(false);
    }
  };

  // Admin Text Manager — editable app texts (values fall back to built-in defaults)
  const [textsForm, setTextsForm] = useState<Record<string, string>>(() => ({
    ...(globalSettings?.texts || {}),
  }));
  const [textsSavedNotice, setTextsSavedNotice] = useState(false);
  const [isSavingTexts, setIsSavingTexts] = useState(false);

  useEffect(() => {
    setTextsForm({ ...(globalSettings?.texts || {}) });
  }, [globalSettings?.texts]);

  const handleSaveTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTexts(true);
    try {
      await updateGlobalSettings({ texts: { ...textsForm } });
      setTextsSavedNotice(true);
      setTimeout(() => setTextsSavedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره متن‌ها');
    } finally {
      setIsSavingTexts(false);
    }
  };

  const handleResetTexts = () => {
    if (!window.confirm('با بازنشانی، همه ویرایش‌های شما روی متن‌ها حذف می‌شود و متن‌های پیش‌فرض سامانه استفاده خواهد شد. ادامه می‌دهید؟')) return;
    setTextsForm({});
    sounds.playPop();
  };

  // ── Bulk selection helpers ────────────────────────────────────────────
  const isUserLocked = (u: User) =>
    u.id === 'usr_admin_mohusyn' || (u.username || '').toLowerCase() === 'mohusyn' || u.id === currentUser?.id;

  const selectableUsers = users.filter((u) => !isUserLocked(u));
  const allSelectableSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    sounds.playPop();
  };

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
    }
    sounds.playPop();
  };

  const selectedUserNames = users.filter((u) => selectedIds.has(u.id)).map((u) => u.name);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await deleteUsersBulk([...selectedIds]);
      setIsBulkDeleteModalOpen(false);
      setSelectedIds(new Set());
      let msg = `${result.deletedCount} کاربر به همراه تمامی تسک‌ها و داده‌هایشان حذف شدند.`;
      if (result.skipped && result.skipped.length > 0) {
        msg += `\n\n${result.skipped.length} کاربر حذف نشد: ${result.skipped.map((sk) => sk.reason).join('، ')}`;
      }
      alert(msg);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف گروهی کاربران.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // User Comprehensive Report Modal State
  const [reportUser, setReportUser] = useState<User | null>(null);
  const [reportData, setReportData] = useState<{
    user: User;
    tasks: any[];
    goals: any[];
    notes: Record<string, string>;
    personality: any;
    stats: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      incompleteWithReason: number;
      completionRate: number;
    };
  } | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportTab, setReportTab] = useState<'overview' | 'tasks' | 'goals' | 'notes' | 'personality'>('overview');

  // Job Categories Management State in Global Settings
  const [newJobCategory, setNewJobCategory] = useState('');

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

  // Job categories list from form settings
  const jobCategoriesList = (formSettings.jobCategories && formSettings.jobCategories.length > 0)
    ? formSettings.jobCategories
    : (globalSettings?.jobCategories || [
        'برنامه‌نویس و توسعه‌دهنده نرم‌افزار',
        'طراح رابط کاربری و تجربه کاربری (UI/UX)',
        'مدیر محصول / مدیر پروژه',
        'کارشناس سئو و تولید محتوا',
        'دیجیتال مارکتر و متخصص تبلیغات',
        'گرافیست و تدوین‌گر ویدیو',
        'دانشجو / پژوهشگر دانشگاهی',
        'معمار و مهندس عمران',
        'پزشک / کادر درمان',
        'حسابدار و مدیر مالی',
        'مترجم و ویراستار',
        'هوش مصنوعی و داده',
        'وکالت و امور حقوقی',
        'سایر / فریلنسر آزاد',
      ]);

  const handleAddJobCategory = () => {
    const val = newJobCategory.trim();
    if (!val) return;
    if (jobCategoriesList.includes(val)) {
      alert('این دسته شغلی از قبل در لیست وجود دارد.');
      return;
    }
    const updated = [...jobCategoriesList, val];
    setFormSettings({
      ...formSettings,
      jobCategories: updated,
    });
    setNewJobCategory('');
    sounds.playPop();
  };

  const handleRemoveJobCategory = (cat: string) => {
    const updated = jobCategoriesList.filter((c) => c !== cat);
    setFormSettings({
      ...formSettings,
      jobCategories: updated,
    });
    sounds.playPop();
  };

  const handleOpenReport = async (user: User) => {
    setReportUser(user);
    setIsLoadingReport(true);
    setReportData(null);
    setReportTab('overview');
    sounds.playPop();
    try {
      const data = await api.getUserReport(user.id);
      setReportData(data);
    } catch (err: any) {
      alert(err.message || 'خطا در بارگذاری گزارش و کارنامه کاربر');
    } finally {
      setIsLoadingReport(false);
    }
  };

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

    if (user.id === 'usr_admin_mohusyn' || (user.username || '').toLowerCase() === 'mohusyn') {
      alert('حساب مدیر اصلی (Mohusyn) قابل حذف نیست.');
      return;
    }

    if (window.confirm(`آیا از حذف حساب کاربری "${user.name}" اطمینان دارید؟ تمامی تسک‌ها، اهداف و داده‌های مربوطه نیز حذف خواهند شد.`)) {
      try {
        await deleteUser(user.id, user.username);
        alert(`کاربر "${user.name}" و تمامی داده‌های مرتبط با موفقیت حذف شد.`);
      } catch (err: any) {
        alert(err.message || 'خطا در حذف کاربر. لطفاً اتصال به سرور را بررسی کنید.');
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

  // Branding helper (kept inside formSettings so the main save button persists it)
  const setBranding = (patch: Partial<NonNullable<GlobalSystemSettings['appBranding']>>) => {
    const base = { appName: 'تسک‌روز', logoDataUrl: null, defaultAvatarDataUrl: null, pwaIconDataUrl: null };
    setFormSettings({ ...formSettings, appBranding: { ...base, ...formSettings.appBranding, ...patch } });
  };
  const branding = formSettings.appBranding || {};

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
            onClick={() => exportUsersCsv()}
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
      <div className="flex items-center p-1.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 max-w-2xl flex-wrap gap-1">
        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
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
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'settings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>تنظیمات سراسری سازمان</span>
        </button>

        <button
          onClick={() => setAdminTab('texts')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'texts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>ویرایش متن‌های سامانه</span>
        </button>

        <button
          onClick={() => setAdminTab('developers')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'developers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>تیم توسعه‌دهنده آپ</span>
        </button>

        <button
          onClick={() => setAdminTab('apk')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'apk'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>خروجی APK اندروید</span>
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
              <div className="text-xs text-zinc-400 mb-1">اشتراک ویژه Pro ⭐</div>
              <div className="text-2xl font-black text-amber-400">
                {toPersianDigits(users.filter((u) => u.role === 'admin' || u.subscription?.plan === 'pro').length)}
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
              <div className="text-xs text-zinc-400 mb-1">کاربران پلن رایگان</div>
              <div className="text-2xl font-black text-slate-300">
                {toPersianDigits(users.filter((u) => u.role !== 'admin' && u.subscription?.plan !== 'pro').length)}
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

          {/* BULK ACTION BAR — appears when one or more users are selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-3xl bg-gradient-to-r from-rose-950/60 to-zinc-900 border border-rose-500/30 animate-in fade-in flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-black text-sm">
                  {toPersianDigits(selectedIds.size)}
                </div>
                <div>
                  <div className="text-xs font-black text-white">
                    {toPersianDigits(selectedIds.size)} کاربر انتخاب شده است
                  </div>
                  <div className="text-[10px] text-rose-200/70">
                    عملیات گروهی روی کاربران انتخاب‌شده اعمال می‌شود
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setIsBulkDeleteModalOpen(true);
                    sounds.playPop();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف گروهی ({toPersianDigits(selectedIds.size)})</span>
                </button>
                <button
                  onClick={() => exportUsersCsv([...selectedIds])}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
                  title="خروجی اکسل فقط از کاربران انتخاب‌شده"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل انتخاب‌شده‌ها</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    sounds.playPop();
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700/60 transition-colors cursor-pointer"
                >
                  لغو انتخاب
                </button>
              </div>
            </div>
          )}

          {/* Filter Pills for Subscription */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlanFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                planFilter === 'all'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              همه کاربران ({toPersianDigits(users.length)})
            </button>

            <button
              type="button"
              onClick={() => setPlanFilter('pro')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                planFilter === 'pro'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>اشتراک ویژه Pro ({toPersianDigits(users.filter((u) => u.role === 'admin' || u.subscription?.plan === 'pro').length)})</span>
            </button>

            <button
              type="button"
              onClick={() => setPlanFilter('free')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                planFilter === 'free'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              پلن رایگان ({toPersianDigits(users.filter((u) => u.role !== 'admin' && u.subscription?.plan !== 'pro').length)})
            </button>
          </div>

          {/* Users List Table/Cards */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Select all (locked users excluded) */}
                <input
                  type="checkbox"
                  checked={allSelectableSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedIds.size > 0 && !allSelectableSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                  title="انتخاب همه کاربران قابل انتخاب"
                />
                <span className="text-xs font-bold text-zinc-300">
                  فهرست کامل اعضای سیستم ({toPersianDigits(users.length)})
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                مشاهده لحظه‌ای عملکرد و انتصاب مستقیم تسک
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {users
                .filter((u) => {
                  if (planFilter === 'pro') return u.role === 'admin' || u.subscription?.plan === 'pro';
                  if (planFilter === 'free') return u.role !== 'admin' && u.subscription?.plan !== 'pro';
                  return true;
                })
                .map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const total = u.totalTasks || 0;
                const done = u.completedTasks || 0;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                const skills = Array.isArray(u.skills) ? u.skills : [];
                const isUserPro = u.role === 'admin' || u.subscription?.plan === 'pro';

                return (
                  <div
                    key={u.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* User info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Bulk-select checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        disabled={isUserLocked(u)}
                        onChange={() => toggleSelect(u.id)}
                        className={`mt-1 w-4 h-4 rounded cursor-pointer accent-rose-600 ${
                          isUserLocked(u) ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title={isUserLocked(u) ? 'حساب مدیر اصلی/جاری قابل انتخاب نیست' : 'انتخاب برای عملیات گروهی'}
                      />
                      <UserAvatar name={u.name} avatar={u.avatar} size="w-11 h-11 text-sm" />
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
                          <span className="font-mono text-zinc-500 dir-ltr text-left">@{u.username}</span>

                          {u.numericId && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-300 font-mono text-[10px] font-bold border border-zinc-700/50">
                              #{u.numericId}
                            </span>
                          )}

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
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Subscription Toggle for non-admin */}
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => setUserSubscription(u.id, isUserPro ? 'free' : 'pro')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isUserPro
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                            }`}
                            title="تغییر وضعیت اشتراک کاربر"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isUserPro ? 'لغو Pro' : 'فعال‌سازی Pro ⭐'}</span>
                          </button>
                        )}

                        {/* VIEW USER COMPREHENSIVE REPORT */}
                        <button
                          onClick={() => handleOpenReport(u)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60 transition-all font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                          title="مشاهده کارنامه، تسک‌ها، دلایل عدم انجام، یادداشت‌ها و اهداف این کاربر"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>کارنامه و گزارش عملکرد</span>
                        </button>

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
                          title="مشاهده تسک‌های این کاربر در تقویم"
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

          {/* 2b. App Identity & Images (admin-editable branding) */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 flex-wrap">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">هویت و عکس‌های اپ</h3>
              <span className="text-[10px] text-zinc-500">با دکمه «ذخیره تغییرات تنظیمات» اعمال می‌شود</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              نام و لوگوی اپ در هدر و سایدبار، عکس پیش‌فرض پروفایل برای کاربرانی که هنوز عکس نفرستاده‌اند، و
              آیکون و نام اپ در لیست اپ‌های نصب‌شده روی گوشی (PWA) از همین‌جا تغییر می‌کند.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">نام اپلیکیشن</label>
                <input
                  type="text"
                  value={branding.appName || ''}
                  onChange={(e) => setBranding({ appName: e.target.value })}
                  placeholder="تسک‌روز"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  در هدر بالای صفحه، سایدبار و کنار آیکون اپ در گوشی نمایش داده می‌شود.
                </p>
              </div>
              <BrandImageField
                label="لوگوی اپ"
                description="جایگزین آیکون پیش‌فرض تسک‌روز در هدر و سایدبار."
                value={branding.logoDataUrl}
                onChange={(v) => setBranding({ logoDataUrl: v })}
                maxSide={256}
              />
              <BrandImageField
                label="عکس پیش‌فرض پروفایل"
                description="برای کاربرانی که هنوز عکسی برای خودشان نگذاشته‌اند نمایش داده می‌شود."
                value={branding.defaultAvatarDataUrl}
                onChange={(v) => setBranding({ defaultAvatarDataUrl: v })}
                maxSide={256}
              />
              <BrandImageField
                label="آیکون اپ در موبایل (PWA)"
                description="همین عکس در لیست اپ‌های نصب‌شده گوشی و صفحه اصلی نمایش داده می‌شود."
                value={branding.pwaIconDataUrl}
                onChange={(v) => setBranding({ pwaIconDataUrl: v })}
                maxSide={512}
              />
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

          {/* 4. Job Categories Management (New Feature) */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">مدیریت حوزه‌های کاری و دسته‌بندی مشاغل</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {toPersianDigits(jobCategoriesList.length)} دسته‌بندی تعریف‌شده
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              دسته‌بندی‌ها و مشاغلی که در اینجا تعریف می‌کنید، بلافاصله در فرم ثبت‌نام کاربران جدید قرار می‌گیرند.
            </p>

            {/* Existing Categories Badges with Delete button */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
              {jobCategoriesList.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-bold hover:border-zinc-500 transition-colors"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveJobCategory(cat)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer p-0.5"
                    title={`حذف دسته‌بندی "${cat}"`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Category Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newJobCategory}
                onChange={(e) => setNewJobCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddJobCategory();
                  }
                }}
                placeholder="عنوان حوزه یا شغل جدید (مثلاً: مهندس هوش مصنوعی، مشاور حقوقی)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddJobCategory}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>افزودن دسته</span>
              </button>
            </div>
          </div>

          {/* 5. Subscription & Card-to-Card Payment Settings */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">تنظیمات پرداخت کارت به کارت و ارتقاء به Pro</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              این اطلاعات در پنجره «ارتقاء به اشتراک Pro» برای کاربران پلن رایگان نمایش داده می‌شود تا پس از واریز کارت به کارت، رسید را برای شما ارسال کنند.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">شماره کارت بانکی ۱۶ رقمی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={formSettings.subscriptionInfo?.cardNumber || ''}
                  onChange={(e) => {
                    const prev = formSettings.subscriptionInfo || {};
                    setFormSettings({
                      ...formSettings,
                      subscriptionInfo: { ...prev, cardNumber: e.target.value },
                    });
                  }}
                  placeholder="6037-9975-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">نام صاحب حساب</label>
                <input
                  type="text"
                  value={formSettings.subscriptionInfo?.cardHolder || formSettings.subscriptionInfo?.ownerName || ''}
                  onChange={(e) => {
                    const prev = formSettings.subscriptionInfo || {};
                    setFormSettings({
                      ...formSettings,
                      subscriptionInfo: { ...prev, cardHolder: e.target.value, ownerName: e.target.value },
                    });
                  }}
                  placeholder="مثال: سید محمدحسین"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">نام بانک</label>
                <input
                  type="text"
                  value={formSettings.subscriptionInfo?.bankName || ''}
                  onChange={(e) => {
                    const prev = formSettings.subscriptionInfo || {};
                    setFormSettings({
                      ...formSettings,
                      subscriptionInfo: { ...prev, bankName: e.target.value },
                    });
                  }}
                  placeholder="مثال: بانک ملی / سامان"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">مبلغ اشتراک ماهانه</label>
                <input
                  type="text"
                  value={formSettings.subscriptionInfo?.monthlyPrice || ''}
                  onChange={(e) => {
                    const prev = formSettings.subscriptionInfo || {};
                    setFormSettings({
                      ...formSettings,
                      subscriptionInfo: { ...prev, monthlyPrice: e.target.value },
                    });
                  }}
                  placeholder="مثال: ۹۹,۰۰۰ تومان"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">راه ارتباطی و پشتیبانی جهت ارسال فیش واریز</label>
                <input
                  type="text"
                  value={formSettings.subscriptionInfo?.supportContact || ''}
                  onChange={(e) => {
                    const prev = formSettings.subscriptionInfo || {};
                    setFormSettings({
                      ...formSettings,
                      subscriptionInfo: { ...prev, supportContact: e.target.value },
                    });
                  }}
                  placeholder="مثال: تلگرام @Mohusyn_Support یا واتساپ ۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
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

      {/* TAB 3: ADMIN TEXT MANAGER (edit every visible app text) */}
      {adminTab === 'texts' && (
        <form onSubmit={handleSaveTexts} className="space-y-6 animate-in fade-in">
          {textsSavedNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>متن‌های سامانه با موفقیت ذخیره شد و برای همه کاربران اعمال گردید.</span>
            </div>
          )}

          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">مدیریت متن‌های نمایش‌داده‌شده سامانه</h3>
                  <p className="text-[11px] text-zinc-400">
                    هر متنی که خالی بگذارید، به مقدار پیش‌فرض سامانه بازمی‌گردد. تغییرات بلافاصله بعد از ذخیره برای همه کاربران اعمال می‌شود.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetTexts}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 text-xs font-bold border border-zinc-700/60 hover:border-rose-500/30 transition-colors cursor-pointer"
              >
                بازنشانی به پیش‌فرض
              </button>
            </div>

            {APP_TEXT_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-black text-emerald-400 tracking-wide">▸ {section.label}</span>
                  <div className="flex-1 h-px bg-zinc-800/80" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {APP_TEXTS.filter((t) => t.section === section.id).map((t) => (
                    <div key={t.key} className={t.multiline ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        {t.label}
                        <span className="mr-2 text-[10px] text-zinc-600 font-mono">{t.key}</span>
                      </label>
                      {t.multiline ? (
                        <textarea
                          value={textsForm[t.key] ?? ''}
                          onChange={(e) => setTextsForm({ ...textsForm, [t.key]: e.target.value })}
                          rows={2}
                          placeholder={t.default}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-emerald-500 resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={textsForm[t.key] ?? ''}
                          onChange={(e) => setTextsForm({ ...textsForm, [t.key]: e.target.value })}
                          placeholder={t.default}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-emerald-500"
                        />
                      )}
                      {t.hint && <p className="text-[10px] text-zinc-600 mt-1">{t.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingTexts}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingTexts ? 'در حال ذخیره...' : 'ذخیره و اعمال متن‌ها بر کل سیستم ✍️'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: APP DEVELOPERS (تیم توسعه‌دهنده اپ - نمایش در صفحه ورود و ثبت‌نام) */}
      {adminTab === 'developers' && (
        <div className="space-y-6 animate-in fade-in">
          {developersSavedNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>اعضای توسعه‌دهنده با موفقیت ذخیره و در صفحه ورود و ثبت‌نام اعمال گردید.</span>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-2 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">مدیریت اعضای تیم توسعه‌دهنده این آپ</h3>
                <p className="text-[11px] text-zinc-400">
                  اعضایی که در این قسمت با نام، عکس و تخصص مشخص می‌کنید، در بخش پایینی فرم ورود و ثبت‌نام سامانه نمایش داده می‌شوند.
                </p>
              </div>
            </div>
          </div>

          {/* Live Preview of Login Screen Footer */}
          <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 pb-2 border-b border-zinc-800/60">
              <span>پیش‌نمایش ظاهر در فوتر صفحه ورود و ثبت‌نام</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">LIVE PREVIEW</span>
            </div>

            {/* The exact box as it appears in LoginScreen */}
            <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center -space-x-2 space-x-reverse">
                {developersList.slice(0, 4).map((dev) => (
                  <div key={dev.id} title={`${dev.name} (${dev.role})`} className="relative group">
                    {dev.avatarUrl ? (
                      <img
                        src={dev.avatarUrl}
                        alt={dev.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                        {dev.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {developersList.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white text-[9px] font-black text-slate-600 flex items-center justify-center">
                    +{toPersianDigits(developersList.length - 4)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] font-extrabold text-slate-700 block">
                  اعضای توسعه‌دهنده این آپ
                </span>
                <span className="text-[9px] text-slate-400 block font-medium">
                  {developersList.map((d) => d.name).join('، ')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: List of Current Developers */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 pb-1">
                <span>لیست اعضای تیم توسعه ({toPersianDigits(developersList.length)} نفر)</span>
                <span className="text-[11px] text-zinc-500">برای تغییر اولویت از دکمه‌های فلش استفاده کنید</span>
              </div>

              {developersList.map((dev, idx) => (
                <div
                  key={dev.id}
                  className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {dev.avatarUrl ? (
                      <img
                        src={dev.avatarUrl}
                        alt={dev.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-zinc-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-zinc-800 text-white font-black text-sm flex items-center justify-center border border-zinc-700 flex-shrink-0">
                        {dev.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{dev.name}</h4>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black">
                            توسعه‌دهنده اصلی
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">{dev.role}</p>
                      {dev.bio && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{dev.bio}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveDev(idx, 'up')}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="بالا بردن"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === developersList.length - 1}
                      onClick={() => handleMoveDev(idx, 'down')}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="پایین بردن"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditDev(dev)}
                      className="p-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 cursor-pointer"
                      title="ویرایش عضو"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDev(dev.id)}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                      title="حذف عضو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handlePublishDevelopers}
                  disabled={isSavingDevelopers}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingDevelopers ? 'در حال ذخیره...' : 'ذخیره و انتشار تیم توسعه‌دهندگان در صفحه لاگین 🚀'}</span>
                </button>
              </div>
            </div>

            {/* Right Form: Add / Edit Developer */}
            <div className="lg:col-span-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>{editingDevId ? 'ویرایش اطلاعات توسعه‌دهنده' : 'افزودن عضو جدید به تیم توسعه'}</span>
                </h4>
                {editingDevId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDevId(null);
                      setDevForm({ name: '', role: '', avatarUrl: null, bio: '', link: '' });
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveDeveloperItem} className="space-y-3.5">
                {/* Photo Upload & Preview */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    عکس / آواتار عضو
                  </label>
                  <div className="flex items-center gap-3">
                    {devForm.avatarUrl ? (
                      <div className="relative">
                        <img
                          src={devForm.avatarUrl}
                          alt="پیش‌نمایش"
                          className="w-14 h-14 rounded-2xl object-cover border border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => setDevForm({ ...devForm, avatarUrl: null })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-500 cursor-pointer"
                          title="حذف عکس"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
                        بدون عکس
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer transition-colors border border-zinc-700">
                        <ImagePlus className="w-3.5 h-3.5 text-blue-400" />
                        <span>انتخاب عکس از کامپیوتر</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDevPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-zinc-500">
                        فرمت JPG یا PNG، به صورت خودکار به شکل گرد برش می‌خورد.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    نام و نام خانوادگی <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={devForm.name}
                    onChange={(e) => setDevForm({ ...devForm, name: e.target.value })}
                    placeholder="مثال: Mohusyn یا سارا احمدی"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    سمت یا حوزه تخصصی <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={devForm.role}
                    onChange={(e) => setDevForm({ ...devForm, role: e.target.value })}
                    placeholder="مثال: برنامه‌نویس فول‌استک یا طراح رابط کاربری"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Short Bio */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    توضیح کوتاه یا افتخارات (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={devForm.bio}
                    onChange={(e) => setDevForm({ ...devForm, bio: e.target.value })}
                    placeholder="مثال: طراح و توسعه‌دهنده نسخه وب و PWA"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    لینک گیت‌هاب یا وب‌سایت (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={devForm.link}
                    onChange={(e) => setDevForm({ ...devForm, link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-blue-500 dir-ltr text-left"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDevId ? 'ثبت تغییرات عضو' : 'افزودن به لیست تیم'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANDROID APK BUILDER */}
      {adminTab === 'apk' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border border-emerald-800/40 p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  موتور بومی ساخت بسته نصبی اندروید (Android APK Generator)
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  تبدیل مستقیم برنامه به فایل نصبی اندروید (APK)
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  با فشردن کلید زیر، کلیه کدهای برنامه، رابط کاربری، استایل‌ها، فونت‌های فارسی، آیکون‌های برنامه و ماژول آفلاین با یکدیگر تلفیق شده و فایل نصبی استاندارد اندروید (<code className="text-emerald-400 font-mono">TaskRooz.apk</code>) بلافاصله جهت نصب روی گوشی دانلود می‌گردد.
                </p>
              </div>

              {/* Package Icon preview */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-1 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-zinc-950 rounded-[22px] flex flex-col items-center justify-center p-2 text-center">
                    <Smartphone className="w-9 h-9 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-black text-white">تسک‌روز</span>
                    <span className="text-[8px] text-zinc-400 font-mono">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">شناسه پکیج (Package ID)</div>
              <div className="text-xs font-mono font-bold text-white truncate" dir="ltr">com.taskrooz.app</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">نسخه اپلیکیشن (Version)</div>
              <div className="text-xs font-mono font-bold text-emerald-400">1.0.0 (Build 1)</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">حجم پکیج نصبی</div>
              <div className="text-xs font-bold text-white">حدود ۸۰۸ کیلوبایت (فوق‌العاده بهینه)</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">سازگاری اندروید</div>
              <div className="text-xs font-bold text-cyan-400">Android 5.0+ (Lollipop تا Android 15)</div>
            </div>
          </div>

          {/* Generator Actions & Progress */}
          <div className="p-6 md:p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto py-2">
              {isBuildingApk ? (
                <div className="w-full space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">در حال کامپایل و آماده‌سازی فایل APK...</h4>
                    <p className="text-xs text-emerald-400 font-medium">{apkBuildStep}</p>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${apkBuildProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGenerateAndDownloadApk}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm md:text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>تولید و دریافت آنی فایل نصبی اندروید (TaskRooz.apk) 🚀</span>
                  </button>
                  <p className="text-[11px] text-zinc-400">
                    با کلیک روی این دکمه، پکیج مستقیماً در مرورگر شما دانلود می‌شود و آماده انتقال به موبایل خواهد بود.
                  </p>
                </>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-3 text-xs">
              <a
                href="/TaskRooz.apk"
                download="TaskRooz.apk"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>لینک دانلود مستقیم TaskRooz.apk</span>
              </a>

              <button
                type="button"
                onClick={handleCopyApkLink}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedApkLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">لینک در حافظه کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>کپی آدرس مستقیم فایل APK جهت اشتراک‌گذاری</span>
                  </>
                )}
              </button>

              <a
                href="/taskrooz-source.zip"
                download="taskrooz-source.zip"
                className="px-4 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                title="دانلود بسته کامل سورس‌کد و پروژه‌های نیتیو"
              >
                <Package className="w-4 h-4 text-indigo-400" />
                <span>دانلود سورس کامل پروژه (Zip)</span>
              </a>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>راهنمای ۳ مرحله‌ای نصب اپلیکیشن روی تلفن همراه:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">
                  ۱
                </div>
                <div className="text-xs font-bold text-white">دریافت فایل APK</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  فایل <code className="text-emerald-400 font-mono">TaskRooz.apk</code> را از دکمه بالا دانلود کرده یا از طریق تلگرام، ایتا یا کابل به گوشی منتقل کنید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">
                  ۲
                </div>
                <div className="text-xs font-bold text-white">اجازه نصب (Allow Install)</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  هنگام لمس فایل، در صورت مشاهده پیام امنیتی، گزینه «اجازه نصب از این منبع» (Install Unknown Apps) را تأیید نمایید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">
                  ۳
                </div>
                <div className="text-xs font-bold text-white">اجرا و کارکرد تمام‌صفحه</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  آیکون تسک‌روز در لیست برنامه‌های گوشی قرار گرفته و به عنوان اپ بومی با سرعت بالا و دسترسی آفلاین اجرا می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>
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

      {/* MODAL: COMPREHENSIVE USER PERFORMANCE REPORT */}
      {reportUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setReportUser(null)}
        >
          <div
            className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-start gap-3">
                <UserAvatar name={reportUser.name} avatar={reportUser.avatar} size="w-12 h-12 text-base" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      کارنامه و گزارش عملکرد: {reportUser.name}
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                      @{reportUser.username}
                    </span>
                    {reportUser.role === 'admin' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                        مدیر سیستم
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        کاربر عادی
                      </span>
                    )}
                  </div>

                  {/* User metadata badges */}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-1.5">
                    {reportUser.jobTitle && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/50">
                        <Briefcase className="w-3 h-3 text-zinc-400" />
                        {reportUser.jobTitle}
                      </span>
                    )}

                    {reportUser.phone && (
                      <a
                        href={`tel:${reportUser.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-indigo-400 font-mono transition-colors"
                      >
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {reportUser.phone}
                      </a>
                    )}

                    {reportUser.email && (
                      <a
                        href={`mailto:${reportUser.email}`}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-indigo-400 font-mono transition-colors"
                      >
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {reportUser.email}
                      </a>
                    )}

                    {(reportUser.province || reportUser.city) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        {reportUser.province} {reportUser.city && `، ${reportUser.city}`}
                      </span>
                    )}

                    {reportUser.birthDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        متولد {toPersianDigits(reportUser.birthDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setReportUser(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="بستن کارنامه"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading Indicator */}
            {isLoadingReport ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">در حال دریافت جامع‌ترین گزارش عملکرد کاربر از دیتابیس...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                {/* 4 Summary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-emerald-400 text-[11px] mb-1 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>نرخ موفقیت تسک‌ها</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {toPersianDigits(reportData.stats.completionRate)}٪
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-indigo-400 text-[11px] mb-1 font-bold">
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>تسک‌های انجام‌شده</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {toPersianDigits(reportData.stats.completedTasks)}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        از {toPersianDigits(reportData.stats.totalTasks)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-amber-400 text-[11px] mb-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>دلایل عدم انجام تسک</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                      {toPersianDigits(reportData.stats.incompleteWithReason)}
                    </div>
                  </div>

                  <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center gap-1 text-purple-400 text-[11px] mb-1 font-bold">
                      <Target className="w-3.5 h-3.5" />
                      <span>اهداف شغلی ثبت‌شده</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {toPersianDigits(reportData.goals?.length || 0)}
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs inside Modal */}
                <div className="flex items-center gap-1 p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 overflow-x-auto">
                  <button
                    onClick={() => setReportTab('overview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      reportTab === 'overview' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    خلاصه وضعیت
                  </button>
                  <button
                    onClick={() => setReportTab('tasks')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      reportTab === 'tasks' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    فهرست تسک‌ها ({toPersianDigits(reportData.tasks?.length || 0)})
                  </button>
                  <button
                    onClick={() => setReportTab('goals')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      reportTab === 'goals' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    اهداف و رشد شغلی ({toPersianDigits(reportData.goals?.length || 0)})
                  </button>
                  <button
                    onClick={() => setReportTab('notes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      reportTab === 'notes' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    یادداشت‌های روزانه ({toPersianDigits(Object.keys(reportData.notes || {}).length)})
                  </button>
                  <button
                    onClick={() => setReportTab('personality')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      reportTab === 'personality' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    آزمون شخصیت و روتین
                  </button>
                </div>

                {/* TAB CONTENT */}
                <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/80 p-4 min-h-[220px] max-h-[46vh] overflow-y-auto space-y-3">
                  {/* TAB 1: OVERVIEW & INCOMPLETE REASONS */}
                  {reportTab === 'overview' && (
                    <div className="space-y-3 animate-in fade-in text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <span className="font-bold text-zinc-300">تحلیل دلایل عدم انجام تسک‌ها (ثبت در هوش مصنوعی):</span>
                        <span className="text-[11px] text-zinc-500">
                          {toPersianDigits(reportData.stats.incompleteWithReason)} تسک با دلیل ثبت‌شده
                        </span>
                      </div>

                      {reportData.tasks.filter((t) => t.incompleteReason).length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 space-y-1">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
                          <p>این کاربر هیچ تسک نیمه‌کاره با دلیل ثبت‌شده ندارد یا همه کارهایش را انجام داده است.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {reportData.tasks
                            .filter((t) => t.incompleteReason)
                            .map((t) => (
                              <div
                                key={t.id}
                                className="p-3 rounded-xl bg-zinc-900 border border-amber-500/20 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-white text-xs">{t.title}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {toPersianDigits(t.date)} {t.time && `• ${t.time}`}
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] leading-relaxed flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">علت اعلام‌شده توسط کاربر: </span>
                                    <span>{t.incompleteReason}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: TASKS LIST */}
                  {reportTab === 'tasks' && (
                    <div className="space-y-2 animate-in fade-in">
                      {reportData.tasks.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          هنوز هیچ تسکی برای این کاربر ثبت نشده است.
                        </div>
                      ) : (
                        reportData.tasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {t.completed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                                    <CheckCircle className="w-3 h-3" />
                                    انجام شده
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    در انتظار
                                  </span>
                                )}
                                <span className={`font-bold text-white ${t.completed ? 'line-through text-zinc-400' : ''}`}>
                                  {t.title}
                                </span>
                              </div>
                              {t.description && (
                                <p className="text-[11px] text-zinc-400 truncate">{t.description}</p>
                              )}
                              {t.incompleteReason && (
                                <p className="text-[11px] text-amber-300">
                                  ⚠️ علت عدم انجام: {t.incompleteReason}
                                </p>
                              )}
                            </div>

                            <div className="text-right text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                              <div>{toPersianDigits(t.date)}</div>
                              {t.time && <div className="text-zinc-500">{t.time}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: CAREER GOALS */}
                  {reportTab === 'goals' && (
                    <div className="space-y-2.5 animate-in fade-in">
                      {(!reportData.goals || reportData.goals.length === 0) ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          این کاربر هنوز هدف شغلی ثبت نکرده است.
                        </div>
                      ) : (
                        reportData.goals.map((g) => (
                          <div
                            key={g.id}
                            className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-400" />
                                <span className="font-bold text-white">{g.title}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                {g.period === 'week' ? 'هفتگی' : g.period === 'month' ? 'ماهانه' : g.period === 'quarter' ? 'فصلی' : 'سالانه'}
                              </span>
                            </div>
                            {g.description && (
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{g.description}</p>
                            )}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>پیشرفت هدف</span>
                                <span className="font-mono text-purple-300">{toPersianDigits(g.progress || 0)}٪</span>
                              </div>
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-purple-500 h-full rounded-full transition-all"
                                  style={{ width: `${g.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: DAILY NOTES */}
                  {reportTab === 'notes' && (
                    <div className="space-y-2.5 animate-in fade-in text-xs">
                      {(!reportData.notes || Object.keys(reportData.notes).length === 0) ? (
                        <div className="py-8 text-center text-zinc-500">
                          هیچ یادداشت روزانه‌ای توسط این کاربر ثبت نشده است.
                        </div>
                      ) : (
                        Object.entries(reportData.notes).map(([dt, txt]) => (
                          <div
                            key={dt}
                            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1"
                          >
                            <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-mono">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>تاریخ: {toPersianDigits(dt)}</span>
                            </div>
                            <p className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap">{txt}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: PERSONALITY & TIMELINE */}
                  {reportTab === 'personality' && (
                    <div className="space-y-3 animate-in fade-in text-xs">
                      {reportData.personality ? (
                        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">تیپ شخصیتی: {reportData.personality.type}</span>
                            <span className="text-[11px] text-indigo-400 font-mono">
                              ثبت‌شده در {toPersianDigits((reportData.personality.createdAt || '').slice(0, 10))}
                            </span>
                          </div>
                          {reportData.personality.description && (
                            <p className="text-zinc-300 text-xs leading-relaxed">{reportData.personality.description}</p>
                          )}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-zinc-500">
                          آزمون شخصیتی ثبت نشده است.
                        </div>
                      )}

                      {/* Daily timeline if exists */}
                      {reportData.user.dailyTimeline && Object.keys(reportData.user.dailyTimeline).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <span className="font-bold text-zinc-300 block">روتین شبانه‌روزی ۲۴ ساعته:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(reportData.user.dailyTimeline).map(([timeSlot, act]: any) => (
                              <div key={timeSlot} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px]">
                                <span className="text-indigo-400">{timeSlot}: </span>
                                <span className="text-zinc-300 font-sans">{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetId = reportUser.id;
                        setReportUser(null);
                        handleAssignTask(targetId);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>انتصاب تسک به این کاربر</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetId = reportUser.id;
                        setReportUser(null);
                        handleViewUserTasks(targetId);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>مشاهده در تقویم تسک‌ها</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setReportUser(null)}
                    className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    بستن کارنامه
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                خطا در بارگذاری اطلاعات گزارش.
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL: BULK DELETE CONFIRMATION */}
      {isBulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  حذف گروهی {toPersianDigits(selectedIds.size)} کاربر
                </h3>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  این عملیات قطعی و برگشت‌ناپذیر است
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/25 text-xs text-rose-200 leading-relaxed">
              <p className="font-bold mb-1">هشدار:</p>
              <p>
                با حذف گروهی، علاوه بر خودِ حساب‌ها، <span className="font-black">تمامی تسک‌ها، اهداف، یادداشت‌های روزانه و نتایج شخصیت‌شناسی</span> هر کاربر انتخاب‌شده نیز برای همیشه حذف می‌شود.
              </p>
            </div>

            {/* Selected names preview */}
            <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 max-h-36 overflow-y-auto space-y-1">
              <div className="text-[10px] text-zinc-500 font-bold mb-1.5">
                کاربران مورد نظر ({toPersianDigits(selectedUserNames.length)}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedUserNames.slice(0, 12).map((n, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60 font-bold">
                    {n}
                  </span>
                ))}
                {selectedUserNames.length > 12 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800/60 text-zinc-400 font-mono">
                    +{toPersianDigits(selectedUserNames.length - 12)} کاربر دیگر
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isBulkDeleting ? 'در حال حذف گروهی...' : 'بله، حذف قطعی همه انتخاب‌شده‌ها'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
