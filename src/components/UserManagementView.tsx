import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { APP_TEXTS, APP_TEXT_SECTIONS } from '../utils/appTexts';
import { UserAvatar } from './UserAvatar';
import { SubscriptionBadge } from './SubscriptionBadge';
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
  CreditCard,
  Music,
  Upload,
  Bot,
  Database,
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
    appOperatingMode,
    setAppOperatingMode,
    approveUserRegistration,
  } = useTask();

  // Active view tab inside Admin Panel
  const [adminTab, setAdminTab] = useState<'users' | 'payments' | 'settings' | 'texts' | 'developers' | 'extension' | 'bale'>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pendingUsers = users.filter((u) => u.status === 'pending_approval');
  const [planFilter, setPlanFilter] = useState<'all' | 'pro' | 'free'>('all');

  // Payments management state
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const data = await api.getPayments(true);
      setPaymentsList(data);
    } catch {} finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (adminTab === 'payments') {
      loadPayments();
    }
  }, [adminTab]);

  const handleApprovePayment = async (paymentId: string) => {
    if (!window.confirm('آیا از تأیید این واریزی و فعال‌سازی فوری اشتراک کاربر اطمینان دارید؟')) return;
    setProcessingPaymentId(paymentId);
    try {
      await api.approvePayment(paymentId);
      sounds.playComplete();
      await loadPayments();
      await refreshUsers();
      alert('پرداخت با موفقیت تأیید شد و اشتراک کاربر فعال گردید! 🎉');
    } catch (err: any) {
      alert(err.message || 'خطا در تأیید پرداخت');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('علت رد پرداخت را وارد کنید (اختیاری):', 'عدم تطابق فیش واریزی یا شماره پیگیری');
    if (reason === null) return;
    setProcessingPaymentId(paymentId);
    try {
      await api.rejectPayment(paymentId, reason);
      sounds.playPop();
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'خطا در رد پرداخت');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleSendCardInChat = async (pay: any) => {
    try {
      const subInfo = (formSettings as any)?.subscriptionInfo;
      const card = subInfo?.cardNumber || '۶۰۳۷-۹۹۷۹-۵۰۵۰-۱۲۳۴';
      const bank = subInfo?.bankName || 'بانک ملی ایران';
      const owner = subInfo?.cardHolder || subInfo?.ownerName || 'سید محمدحسین شیخ الاسلامی';
      const text = `💳 سلام و درود خدمت شما بزرگوار.\nجهت فعال‌سازی طرح «${pay.planLabel || pay.plan}»، لطفاً مبلغ را به شماره کارت زیر واریز فرمایید:\n\nشماره کارت: ${card}\nبانک: ${bank}\nبه نام: ${owner}\n\nپس از واریز، شماره پیگیری یا ۴ رقم آخر کارت را ارسال فرمایید تا حسابتان فوراً فعال گردد. با تشکر!`;
      await api.sendDirectMessage(pay.userId, text);
      alert(`اطلاعات شماره کارت در چت با موفقیت برای کاربر ${pay.userName} ارسال شد.`);
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیام به کاربر');
    }
  };

  const pendingPaymentsCount = paymentsList.filter((p) => p.status === 'pending').length;

  // Subscription management state
  const [subscriptionModalUser, setSubscriptionModalUser] = useState<User | null>(null);
  const [updatingSubUserId, setUpdatingSubUserId] = useState<string | null>(null);
  const [subNotice, setSubNotice] = useState<string | null>(null);

  const handleUpdateSubscription = async (
    userId: string,
    plan: 'free' | 'plus' | 'pro' | 'ultra',
    planType: '1_month' | '3_months' | '6_months' = '1_month'
  ) => {
    setUpdatingSubUserId(userId);
    try {
      let expiresAt: string | undefined;
      if (plan !== 'free') {
        const now = new Date();
        const days = planType === '6_months' ? 180 : planType === '3_months' ? 90 : 30;
        now.setDate(now.getDate() + days);
        expiresAt = now.toISOString();
      }

      await setUserSubscription(userId, plan, planType, expiresAt);
      sounds.playComplete();
      const planName =
        planType === '6_months' || plan === 'ultra'
          ? 'اولترا (Ultra) 💎'
          : planType === '3_months' || plan === 'pro'
          ? 'پرو (Pro) ⭐'
          : 'پلاس (Plus) ➕';
      setSubNotice(
        plan !== 'free'
          ? `اشتراک ویژه ${planName} برای کاربر با موفقیت فعال شد.`
          : 'اشتراک کاربر به نسخه رایگان تغییر یافت.'
      );
      setTimeout(() => setSubNotice(null), 3500);
      setSubscriptionModalUser(null);
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر اشتراک کاربر');
    } finally {
      setUpdatingSubUserId(null);
    }
  };

  // Bulk selection & actions (multi-select users)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [copiedExtLink, setCopiedExtLink] = useState(false);
  const [selectedExtBrowser, setSelectedExtBrowser] = useState<'chrome' | 'edge' | 'firefox'>('chrome');

  const handleDownloadExtZip = () => {
    sounds.playPop();
    const link = document.createElement('a');
    link.href = '/bagtime-extension.zip';
    link.download = 'bagtime-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyExtLink = () => {
    sounds.playPop();
    navigator.clipboard.writeText('https://raw.githubusercontent.com/Smohamad933/M-app/arena/01a0c425-m-app/bagtime-extension.zip');
    setCopiedExtLink(true);
    setTimeout(() => setCopiedExtLink(false), 2500);
  };

  // Bale Messenger Bot State (docs.bale.ai)
  const initialBale = (globalSettings as any)?.baleBot || {
    enabled: false,
    token: '',
    botUsername: 'BagTime_Bot',
    providerToken: '',
    verifyOnRegister: true,
    sendNotifications: true,
    allowTaskCreation: true,
  };
  const [baleForm, setBaleForm] = useState(initialBale);
  const [baleTesting, setBaleTesting] = useState(false);
  const [baleTestResult, setBaleTestResult] = useState<{ ok: boolean; message: string; botName?: string } | null>(null);
  const [baleSaving, setBaleSaving] = useState(false);

  useEffect(() => {
    if ((globalSettings as any)?.baleBot) {
      setBaleForm((globalSettings as any).baleBot);
    }
  }, [globalSettings]);

  const handleTestBaleToken = async () => {
    setBaleTesting(true);
    setBaleTestResult(null);
    sounds.playPop();
    try {
      const res = await api.testBaleToken(baleForm.token);
      if (res.ok) {
        sounds.playComplete();
        setBaleTestResult({
          ok: true,
          message: 'اتصال با موفقیت برقرار شد!',
          botName: res.bot?.first_name || 'BagTime Bot',
        });
      } else {
        setBaleTestResult({
          ok: false,
          message: res.message || 'خطا در ارتباط با سرورهای بله',
        });
      }
    } catch (e: any) {
      setBaleTestResult({
        ok: false,
        message: e.message || 'خطا در تست توکن ربات بله',
      });
    } finally {
      setBaleTesting(false);
    }
  };

  const handleSaveBaleConfig = async () => {
    setBaleSaving(true);
    sounds.playPop();
    try {
      await updateGlobalSettings({
        baleBot: baleForm,
      });
      sounds.playComplete();
      alert('تنظیمات ربات بله با موفقیت ذخیره شد.');
    } catch (e: any) {
      alert(e.message || 'خطا در ذخیره تنظیمات ربات بله');
    } finally {
      setBaleSaving(false);
    }
  };

  const handleSetBaleWebhook = async () => {
    sounds.playPop();
    try {
      const explicitHttpsUrl = `${window.location.origin.replace(/^http:\/\//, 'https://')}/api/bale.php?action=webhook`;
      const res = await api.setBaleWebhook(baleForm.token, explicitHttpsUrl);
      if (res.ok) {
        sounds.playComplete();
        alert('وب‌هوک ربات بله با موفقیت تنظیم شد:\n' + res.webhookUrl);
      } else {
        alert(res.error || 'خطا در تنظیم وب‌هوک بله.');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در تنظیم وب‌هوک');
    }
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

  // Auto-refresh users when admin opens this tab + poll every 20s + storage event sync!
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refreshUsers();
    }, 20000);

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
          onClick={() => setAdminTab('payments')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'payments'
              ? 'bg-amber-500 text-black shadow-xs font-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>مدیریت تراکنش‌ها و واریزی‌ها</span>
          {pendingPaymentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {toPersianDigits(pendingPaymentsCount)}
            </span>
          )}
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
          onClick={() => setAdminTab('bale')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'bale'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-blue-400" />
          <span>ربات بله (Bale Bot)</span>
        </button>

        <button
          onClick={() => setAdminTab('extension')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'extension'
              ? 'bg-indigo-600 text-white shadow-xs font-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>افزونه دستیار مرورگر (نیوتَب)</span>
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

          {/* System Operating Mode Switcher: Commercial Pro vs Community Demo */}
          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <span>سیستم کاری سامانه:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      appOperatingMode === 'community_demo'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {appOperatingMode === 'community_demo' ? 'نسخه دمو و کامیونیتی تست 🚀' : 'سیستم تجاری و پلن‌های Pro 💳'}
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {appOperatingMode === 'community_demo'
                    ? 'در این حالت، ثبت‌نام کاربران نیازمند تأیید مدیر است و پس از تأیید، اشتراک نامحدود دمو دریافت می‌کنند.'
                    : 'در حالت تجاری، کاربران عادی رایگان هستند و جهت ارتقا به پلن‌های ۱، ۳ یا ۶ ماهه Pro کارت‌به‌کارت می‌کنند.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAppOperatingMode('commercial');
                    sounds.playPop();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    appOperatingMode === 'commercial'
                      ? 'bg-amber-500 text-black font-black shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>حالت ۱: تجاری و فروش Pro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAppOperatingMode('community_demo');
                    sounds.playPop();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    appOperatingMode === 'community_demo'
                      ? 'bg-emerald-500 text-black font-black shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>حالت ۲: دمو و کامیونیتی تست 🚀</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pending Demo Users Notification Card */}
          {pendingUsers.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-300 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-black">
                    🔔 {toPersianDigits(pendingUsers.length)} کاربر جدید در انتظار تأیید و فعال‌سازی اشتراک دمو هستند:
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {pendingUsers.map((pu) => (
                  <div key={pu.id} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{pu.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">@{pu.username}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        approveUserRegistration(pu.id);
                        sounds.playComplete();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تأیید دمو</span>
                    </button>
                  </div>
                ))}
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

            {subNotice && (
              <div className="p-3.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{subNotice}</span>
              </div>
            )}

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
                          ) : u.status === 'pending_approval' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                              در انتظار تأیید دمو ⏳
                            </span>
                          ) : u.isDemo ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>دمو کامیونیتی (Beta) 🚀</span>
                            </span>
                          ) : isUserPro ? (
                            <SubscriptionBadge user={u} size="sm" />
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                              کاربر عادی (رایگان)
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
                        {/* Approval button if user is unverified or pending Bale */}
                        {u.role !== 'admin' && (u.status === 'pending_verification' || !u.isVerified) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.manualVerify(u.id);
                                sounds.playComplete();
                                refreshUsers();
                                alert('کاربر ' + u.name + ' با موفقیت تأیید و فعال شد.');
                              } catch {
                                alert('خطا در تأیید کاربر.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="تأیید دستی و فعال‌سازی فوری بدون نیاز به ربات بله"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>تأیید بله ✓</span>
                          </button>
                        )}

                        {/* Approval button if user is pending in demo mode */}
                        {u.status === 'pending_approval' && (
                          <button
                            type="button"
                            onClick={() => {
                              approveUserRegistration(u.id);
                              sounds.playComplete();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="تأیید فوری حساب کاربری و فعال‌سازی کامل اشتراک دمو"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>تأیید دمو 🚀</span>
                          </button>
                        )}

                        {/* Subscription Management for non-admin */}
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            disabled={updatingSubUserId === u.id}
                            onClick={() => setSubscriptionModalUser(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                              isUserPro
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 hover:text-white'
                            }`}
                            title="تنظیم و تغییر دوره اشتراک Pro کاربر"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {updatingSubUserId === u.id
                                ? 'در حال ثبت...'
                                : isUserPro
                                ? 'مدیریت Pro ⭐'
                                : 'فعال‌سازی Pro ⭐'}
                            </span>
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

      {/* TAB: PAYMENTS & SUBSCRIPTION ORDERS */}
      {adminTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-400">کل تراکنش‌های ثبت‌شده</div>
                <div className="text-2xl font-black text-white mt-1">{toPersianDigits(paymentsList.length)}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-400 font-bold">در انتظار بررسی و تأیید ⏳</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{toPersianDigits(pendingPaymentsCount)}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-400 font-bold">تأیید و فعال شده ✅</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">
                  {toPersianDigits(paymentsList.filter((p) => p.status === 'approved').length)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">لیست فیش‌ها و واریزی‌های کاربران</h3>
              </div>
              <button
                type="button"
                onClick={loadPayments}
                disabled={isLoadingPayments}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPayments ? 'animate-spin' : ''}`} />
                <span>بروزرسانی</span>
              </button>
            </div>

            {paymentsList.length === 0 ? (
              <div className="py-14 text-center text-zinc-500 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-xs font-bold">هنوز هیچ فیش یا تراکنش پرداختی از سوی کاربران ثبت نشده است.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentsList.map((pay) => {
                  const isPending = pay.status === 'pending';
                  const isApproved = pay.status === 'approved';

                  return (
                    <div
                      key={pay.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isPending
                          ? 'bg-amber-950/15 border-amber-500/40 shadow-sm'
                          : isApproved
                          ? 'bg-emerald-950/10 border-emerald-500/30'
                          : 'bg-zinc-900/40 border-zinc-800 opacity-70'
                      }`}
                    >
                      {/* Left: User & Plan info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                          {pay.userName?.charAt(0) || 'ک'}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-white">{pay.userName}</span>
                            <span className="font-mono text-[10px] text-zinc-400">@{pay.userUsername}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {pay.planLabel || pay.plan}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-300 flex-wrap">
                            <span>مبلغ: <strong className="text-white font-mono">{pay.amount}</strong></span>
                            <span>روش: <strong className="text-zinc-200">{pay.paymentMethod === 'online_gateway' ? 'درگاه آنلاین' : 'کارت به کارت'}</strong></span>
                            <span className="text-zinc-400 font-mono text-[10px]">{pay.createdAt?.slice(0, 16)}</span>
                          </div>

                          <div className="p-2 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] font-mono text-amber-300 flex items-center gap-2">
                            <span className="text-zinc-400 font-sans">کد پیگیری / ۴ رقم کارت:</span>
                            <strong className="tracking-wider text-white text-xs">{pay.trackingCode}</strong>
                          </div>

                          {pay.note && (
                            <p className="text-[10px] text-zinc-400 italic">
                              توضیح کاربر: {pay.note}
                            </p>
                          )}
                          {pay.rejectReason && (
                            <p className="text-[10px] text-rose-400">
                              علت رد: {pay.rejectReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendCardInChat(pay)}
                              className="px-3 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              title="ارسال مستقیم شماره کارت در چت به کاربر"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>ارسال کارت در چت 💳</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingPaymentId === pay.id}
                              onClick={() => handleApprovePayment(pay.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{processingPaymentId === pay.id ? 'در حال ثبت...' : 'تأیید و ارتقای فوری 🚀'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingPaymentId === pay.id}
                              onClick={() => handleRejectPayment(pay.id)}
                              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              <span>رد فیش ❌</span>
                            </button>
                          </>
                        ) : isApproved ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>تأیید و فعال شد</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                            رد شده
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

          {/* Super Admin Status & Verification Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-zinc-900/60 rounded-3xl border border-emerald-800/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>تأیید فوری حساب مدیر کل (Super Admin)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    Mohusyn
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  تضمین دائمی فعال بودن و معافیت مدیر سیستم از محدودیت‌های بله و احراز هویت.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('taskrooz_auth_token') || '';
                  await fetch('/api/auth.php?action=admin_self_verify', {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  sounds.playComplete();
                  alert('حساب مدیر کل با موفقیت تایید و وضعیت آن فعال دائمی شد! ⚡');
                } catch {
                  alert('حساب شما فعال و تایید شده است.');
                }
              }}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 flex-shrink-0"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>⚡ تأیید فوری حساب مدیر</span>
            </button>
          </div>

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

          {/* CARD: FOCUS MUSIC PLAYLIST MANAGEMENT (آپلود و مدیریت موزیک تمرکز توسط مدیر) */}
          <div className="p-5 sm:p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مدیریت پلی‌لیست موسیقی تمرکز پومودورو (Focus Audio)</h3>
                  <p className="text-xs text-zinc-400">آپلود و انتشار فایل‌های صوتی آرامش‌بخش برای تمام کاربران سامانه</p>
                </div>
              </div>
            </div>

            {/* Existing Tracks in Playlist */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300">لیست قطعات فعلی پلی‌لیست:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {((formSettings as any).focusPlaylist || [
                  { id: 'track-lofi', title: 'بیت‌های ملایم لوفای (Cozy Lofi)', artist: 'رادیو تمرکز عمیق بگ تایم' },
                  { id: 'track-alpha', title: 'امواج آلفا ۵۲۸ هرتز (Alpha Waves)', artist: 'فرکانس تقویت تمرکز' },
                  { id: 'track-rain', title: 'صدای باران ملایم و کافه آرام', artist: 'طبیعت و وایت‌نویز' },
                ]).map((tr: any, idx: number) => (
                  <div key={tr.id || idx} className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {toPersianDigits(idx + 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{tr.title}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{tr.artist}</div>
                      </div>
                    </div>
                    {tr.id?.startsWith('uploaded-') && (
                      <button
                        type="button"
                        onClick={() => {
                          const curr = (formSettings as any).focusPlaylist || [];
                          const updated = curr.filter((x: any) => x.id !== tr.id);
                          setFormSettings({ ...formSettings, focusPlaylist: updated } as any);
                        }}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload File Input */}
            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-950 border border-dashed border-purple-500/40 hover:border-purple-500/80 text-purple-300 font-bold text-xs cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>کلیک جهت آپلود مستقیم فایل صوتی جدید (MP3 / WAV / OGG)</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) {
                      alert('حجم فایل صوتی نباید بیش از ۲۰ مگابایت باشد.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      const title = prompt('عنوان یا نام موزیک را وارد کنید:', file.name.replace(/\.[^/.]+$/, '')) || file.name;
                      const artist = prompt('نام خواننده یا هنرمند:', 'آپلود شده توسط مدیر Mohusyn') || 'مدیر سیستم';
                      const newTrack = {
                        id: `uploaded-${Date.now()}`,
                        title,
                        artist,
                        type: 'custom',
                        url: dataUrl,
                        tag: 'موزیک ادمین 🎵',
                      };
                      const curr = (formSettings as any).focusPlaylist || [];
                      setFormSettings({
                        ...formSettings,
                        focusPlaylist: [...curr, newTrack],
                      } as any);
                      alert('قطعه صوتی با موفقیت اضافه شد! برای ذخیره دکمه «اعمال سراسری» پایین را بزنید.');
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
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

      {/* TAB 5: BROWSER EXTENSION (CHROME, EDGE, FIREFOX NEW TAB ASSISTANT) */}
      {adminTab === 'extension' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-zinc-950 border border-indigo-700/40 p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  دستیار هوشمند مرورگر (Browser New Tab Extension • Manifest V3)
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  افزونه دستیار شخصی بگ تایم (ویژه کروم، اج و فایرفاکس)
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  با نصب این افزونه، صفحه شروع و تب جدید (New Tab) مرورگر شما به یک صفحه متمرکز، آرامش‌بخش و قدرتمند شامل لیست تسک‌های روزانه، تایم‌لاین ساعتی، تایمر تمرکز پومودورو و یادداشت‌های سریع تبدیل می‌شود که کاملاً مستقل و آفلاین کار می‌کند.
                </p>
              </div>

              {/* Package Icon preview */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-2xl shadow-indigo-500/25 flex items-center justify-center">
                  <div className="w-full h-full bg-zinc-950 rounded-[22px] flex flex-col items-center justify-center p-2 text-center">
                    <Sparkles className="w-9 h-9 text-indigo-400 mb-1" />
                    <span className="text-[10px] font-black text-white">دستیار بگ تایم</span>
                    <span className="text-[8px] text-zinc-400 font-mono">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">ساختار افزونه (Engine)</div>
              <div className="text-xs font-mono font-bold text-white truncate" dir="ltr">Manifest V3 Universal</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">سازگاری مرورگرها</div>
              <div className="text-xs font-bold text-indigo-400">Chrome, Edge, Firefox, Brave</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">حجم پکیج زیپ</div>
              <div className="text-xs font-bold text-emerald-400">۲۳ کیلوبایت (فوق‌العاده سریع)</div>
            </div>
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-1">وضعیت آفلاین</div>
              <div className="text-xs font-bold text-cyan-400">۱۰۰٪ آفلاین و ذخیره محلی</div>
            </div>
          </div>

          {/* Download & Raw Link Actions */}
          <div className="p-6 md:p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto py-2">
              <button
                type="button"
                onClick={handleDownloadExtZip}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm md:text-base shadow-xl shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                <span>دانلود آنی فایل فشرده افزونه (bagtime-extension.zip) 🚀</span>
              </button>
              <p className="text-[11px] text-zinc-400">
                فایل فشرده حاوی manifest.json استاندارد، صفحه نیوتَب، استایل‌ها، آیکون‌ها و پاپ‌آپ است.
              </p>
            </div>

            {/* Direct Links Bar */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-3 text-xs">
              <a
                href="/bagtime-extension.zip"
                download="bagtime-extension.zip"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>دانلود مستقیم از هاست (/bagtime-extension.zip)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyExtLink}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedExtLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">لینک مستقیم کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>کپی لینک مستقیم خام گیت‌هاب (Raw GitHub Link)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabbed Installation Instructions */}
          <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>راهنمای فعال‌سازی حالت توسعه‌دهنده (Developer Mode) در مرورگر</span>
              </h4>

              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('chrome');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'chrome'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  گوگل کروم / بریو
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('edge');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'edge'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  مایکروسافت اج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedExtBrowser('firefox');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedExtBrowser === 'firefox'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  موزیلا فایرفاکس
                </button>
              </div>
            </div>

            {selectedExtBrowser === 'chrome' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">استخراج فایل زیپ</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل <code className="text-indigo-400 font-mono">bagtime-extension.zip</code> را دانلود و در پوشه‌ای روی سیستم خود Extract کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">ورود به صفحه اکستنشن‌ها</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    در کروم آدرس <code className="text-zinc-300 font-mono" dir="ltr">chrome://extensions</code> را وارد و اینتر بزنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">فعال‌سازی Developer mode</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    کلید <strong>حالت توسعه‌دهنده</strong> را در گوشه بالای صفحه فعال کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">بارگذاری پوشه بازشده</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی <strong>Load unpacked</strong> کلیک کرده و پوشه را انتخاب کنید. اکنون با زدن <kbd className="text-zinc-300 font-mono">Ctrl+T</kbd> دستیار باز می‌شود!
                  </p>
                </div>
              </div>
            )}

            {selectedExtBrowser === 'edge' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">دانلود و استخراج</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل زیپ را دانلود و از حالت فشرده خارج کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">آدرس‌بار اج</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    آدرس <code className="text-zinc-300 font-mono" dir="ltr">edge://extensions</code> را در نوار آدرس مایکروسافت اج باز کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">روشن کردن Developer mode</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    از منوی سمت چپ گزینه <strong>Developer mode</strong> را فعال کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">انتخاب پوشه</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی <strong>Load unpacked</strong> کلیک کرده و پوشه را انتخاب فرمایید.
                  </p>
                </div>
              </div>
            )}

            {selectedExtBrowser === 'firefox' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۱</div>
                  <div className="text-xs font-bold text-white">اکسترکت فایل زیپ</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل زیپ دانلود شده را در یک مسیر مشخص اکسترکت فرمایید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۲</div>
                  <div className="text-xs font-bold text-white">صفحه دیباگ فایرفاکس</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    در آدرس‌بار فایرفاکس وارد کنید: <code className="text-zinc-300 font-mono text-[10px]" dir="ltr">about:debugging#/runtime/this-firefox</code>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">۳</div>
                  <div className="text-xs font-bold text-white">کلیک بر Load Add-on</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    روی کلید <strong>Load Temporary Add-on...</strong> کلیک کنید.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">۴</div>
                  <div className="text-xs font-bold text-white">انتخاب manifest.json</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    فایل <code className="text-indigo-400 font-mono">manifest.json</code> پوشه افزونه را انتخاب کنید تا دستیار فعال گردد.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* TAB 6: BALE MESSENGER BOT INTEGRATION (docs.bale.ai) */}
      {adminTab === 'bale' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950/70 via-zinc-900 to-zinc-950 border border-blue-600/30 p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  اتصال رسمی پیام‌رسان بله (Bale Bot Platform • docs.bale.ai)
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  مدیریت و پیکربندی ربات بله (BagTime Bale Bot)
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                  با تنظیم توکن ربات بله، امکان تایید هویت شماره موبایل در ثبت‌نام، ارسال بلادرنگ نوتیفیکیشن‌ها، و ایجاد وظایف و تسک‌ها مستقیماً از طریق پیام‌رسان بله برای کاربران فعال می‌شود.
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-1 shadow-2xl shadow-blue-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-zinc-950 rounded-[22px] flex flex-col items-center justify-center p-2 text-center">
                    <Bot className="w-9 h-9 text-blue-400 mb-1" />
                    <span className="text-[10px] font-black text-white">ربات بله</span>
                    <span className="text-[8px] text-zinc-400 font-mono">v1.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Configuration Form */}
          <div className="p-6 md:p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>مشخصات و توکن ربات پیام‌رسان بله</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  توکن ربات بله (Bale Bot Token) *
                </label>
                <input
                  type="text"
                  value={baleForm.token}
                  onChange={(e) => setBaleForm({ ...baleForm, token: e.target.value })}
                  placeholder="مثال: 123456789:AAHk..."
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-blue-500 text-left"
                />
                <p className="text-[10px] text-zinc-500">
                  توکن دریافتی از بازوی رسمی BotFather در پیام‌رسان بله را اینجا قرار دهید.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  شناسه کاربری ربات (Bot Username) *
                </label>
                <input
                  type="text"
                  value={baleForm.botUsername}
                  onChange={(e) => setBaleForm({ ...baleForm, botUsername: e.target.value })}
                  placeholder="مثال: BagTime_Bot"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-blue-500 text-left"
                />
                <p className="text-[10px] text-zinc-500">
                  آیدی ربات جهت هدایت کاربران در ثبت‌نام (لینک ble.ir/BagTime_Bot)
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>توکن درگاه پرداخت بله (Provider Token - کیف پول و شبکه شتاب)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">docs.bale.ai</span>
                </label>
                <input
                  type="text"
                  value={baleForm.providerToken || ''}
                  onChange={(e) => setBaleForm({ ...baleForm, providerToken: e.target.value })}
                  placeholder="مثال: 123456789:TEST:12345 یا توکن کیف‌پول بانکی بله"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs outline-none focus:border-blue-500 text-left"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  توکن درگاه پرداخت متد <code>sendInvoice</code> در بله. جهت دریافت: در بله به <b>@botfather</b> مراجعه کنید ⬅️ بازوهای من ⬅️ انتخاب بازو ⬅️ گزینه «پرداخت در بازو».
                </p>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <label className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={baleForm.enabled}
                  onChange={(e) => setBaleForm({ ...baleForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">فعال‌سازی ربات بله</div>
                  <div className="text-[10px] text-zinc-400">اتصال سامانه به زیرساخت بله</div>
                </div>
              </label>

              <label className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={baleForm.verifyOnRegister}
                  onChange={(e) => setBaleForm({ ...baleForm, verifyOnRegister: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">تأیید شماره در ثبت‌نام</div>
                  <div className="text-[10px] text-zinc-400">ارسال کد به ربات بله جهت احراز</div>
                </div>
              </label>

              <label className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={baleForm.sendNotifications}
                  onChange={(e) => setBaleForm({ ...baleForm, sendNotifications: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">ارسال نوتیفیکیشن‌ها</div>
                  <div className="text-[10px] text-zinc-400">ارسال اعلان تسک و پیام در بله</div>
                </div>
              </label>

              <label className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={baleForm.allowTaskCreation}
                  onChange={(e) => setBaleForm({ ...baleForm, allowTaskCreation: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">ثبت تسک از بله</div>
                  <div className="text-[10px] text-zinc-400">دستور task/ برای ساخت تسک</div>
                </div>
              </label>
            </div>

            {/* Test result banner if any */}
            {baleTestResult && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  baleTestResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {baleTestResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{baleTestResult.message}</span>
                  {baleTestResult.botName && (
                    <span className="font-bold text-white">({baleTestResult.botName})</span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveBaleConfig}
                disabled={baleSaving}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{baleSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات ربات بله'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestBaleToken}
                disabled={baleTesting || !baleForm.token.trim()}
                className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer border border-zinc-700 flex items-center gap-2 disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${baleTesting ? 'animate-spin text-blue-400' : ''}`} />
                <span>{baleTesting ? 'در حال تست...' : 'تست اتصال به سرور بله (getMe)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSetBaleWebhook}
                disabled={!baleForm.token.trim()}
                className="px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-cyan-300 font-bold text-xs transition-colors cursor-pointer border border-cyan-500/30 flex items-center gap-2 disabled:opacity-40"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>تنظیم خودکار وب‌هوک (setWebhook)</span>
              </button>
            </div>
          </div>

          {/* Bale Bot User Guide & Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guide Card */}
            <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>دکمه‌های شیشه‌ای و فرآیند تعامل کاربران در بازوی بله:</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="font-bold text-emerald-400 text-xs">
                    🔘 دکمه‌های شیشه‌ای (Inline Keyboard) بدون نیاز به تایپ دستی
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    تمامی گزینه‌ها (تأیید حساب، تسک‌های من، تسک جدید، تنظیمات نوتیفیکیشن و مشاهده Chat ID) در قالب دکمه‌های شیشه‌ای زیبا و روان زیر پیام‌ها قرار دارند.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="font-bold text-blue-400 text-xs">
                    🔐 احراز هویت ۲ مرحله‌ای الزامی با تطبیق شماره تماس
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    کاربر پس از ارسال کد ۶ رقمی، دکمه «ارسال شماره تماس» در بله را می‌زند؛ شماره بله مستقیماً با شماره ثبت‌نامی تطبیق داده شده و در صورت یکسان بودن، حساب فوراً فعال می‌شود.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="font-bold text-purple-400 text-xs">
                    🔔 تنظیم اختصاصی اکانت دریافت‌کننده نوتیفیکیشن
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    کاربر می‌تواند در ربات با دکمه شیشه‌ای «تنظیمات اعلان‌ها»، اکانت فعال خود برای دریافت نوتیفیکیشن‌ها را تعیین کند.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                  <div className="font-bold text-cyan-400 text-xs">
                    🆔 اتصال مستقیم با شناسه چت (Chat ID)
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    کاربران می‌توانند شناسه عددی چت خود را از ربات دریافت کرده و در تنظیمات پروفایل بگ تایم وارد کنند تا حسابشان بدون ثبت‌نام مجدد متصل شود.
                  </p>
                </div>
              </div>
            </div>

            {/* Modular Isolated Databases Status */}
            <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>معماری پایگاه‌داده‌های تفکیک‌شده (Modular Isolated Stores):</span>
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">پایگاه داده کاربران (Users DB)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">data/users.json • جدول users</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    مجزا و فوق‌سریع
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">پایگاه داده وظایف (Tasks DB)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">data/tasks.json • جدول tasks & projects</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    تفکیک شده
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">پایگاه داده پیام‌ها (Messages DB)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">data/messages.json • چت P2P و اتاق‌ها</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                    ایزوله و پرسرعت
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">پایگاه داده اعلان‌ها (Notifs DB)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">data/notifications.json • اعلان و لاگ بله</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    مستقل
                  </span>
                </div>
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

      {/* Admin User Pro Subscription Duration Modal */}
      {subscriptionModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSubscriptionModalUser(null)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-white"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مدیریت و فعال‌سازی اشتراک Pro</h3>
                  <p className="text-[11px] text-zinc-400 font-bold">
                    {subscriptionModalUser.name} (@{subscriptionModalUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubscriptionModalUser(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-zinc-300">
              دوره اشتراک Pro مورد نظر برای این کاربر را انتخاب کنید:
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                disabled={updatingSubUserId === subscriptionModalUser.id}
                onClick={() => handleUpdateSubscription(subscriptionModalUser.id, 'plus', '1_month')}
                className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-emerald-500/50 text-right flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center gap-2">
                    <span>پلن ۱: پلاس Plus (۱ ماهه - ۳۰ روز)</span>
                    <span className="text-[11px]">➕</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    نماد پلاس ➕ در پروفایل، تسک‌ها و پروژه‌های تیمی
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-zinc-700 text-zinc-200 text-[10px] font-bold group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  فعال‌سازی پلاس ➕
                </span>
              </button>

              <button
                type="button"
                disabled={updatingSubUserId === subscriptionModalUser.id}
                onClick={() => handleUpdateSubscription(subscriptionModalUser.id, 'pro', '3_months')}
                className="w-full p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/60 text-right flex items-center justify-between transition-all cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                    <span>پلن ۲: پرو Pro (۳ ماهه - ۹۰ روز)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-black">
                      محبوب‌ترین ⭐
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    نماد ستاره ⭐ در پروفایل، پلن طلایی حرفه‌ای
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-[10px] font-black group-hover:bg-amber-400 transition-colors">
                  فعال‌سازی پرو ⭐
                </span>
              </button>

              <button
                type="button"
                disabled={updatingSubUserId === subscriptionModalUser.id}
                onClick={() => handleUpdateSubscription(subscriptionModalUser.id, 'ultra', '6_months')}
                className="w-full p-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/50 text-right flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
              >
                <div>
                  <div className="text-xs font-black text-white group-hover:text-cyan-300 flex items-center gap-2">
                    <span>پلن ۳: اولترا Ultra (۶ ماهه - ۱۸۰ روز)</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black">
                      ۳۵٪ تخفیف 💎
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    نماد الماس 💎 در پروفایل، کامل‌ترین بسته نامحدود
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-zinc-700 text-zinc-200 text-[10px] font-bold group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  فعال‌سازی اولترا 💎
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={updatingSubUserId === subscriptionModalUser.id}
                onClick={() => handleUpdateSubscription(subscriptionModalUser.id, 'free')}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                لغو اشتراک Pro (تبدیل به رایگان)
              </button>

              <button
                type="button"
                onClick={() => setSubscriptionModalUser(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
