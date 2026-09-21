/**
 * متن‌های قابل ویرایش سیستم — Admin Text Manager
 * مدیر سیستم می‌تواند از پنل مدیریت همه این متن‌ها را تغییر دهد.
 * اگر متن خاصی در تنظیمات ذخیره نشده باشد، مقدار پیش‌فرض اینجا به‌کار می‌رود.
 */

export interface AppTextDef {
  key: string;
  label: string;
  hint?: string;
  default: string;
  multiline?: boolean;
  section: 'login' | 'greeting' | 'room' | 'system';
}

export const APP_TEXTS: AppTextDef[] = [
  // ── صفحه ورود ──────────────────────────────────────────────
  {
    key: 'appName',
    label: 'نام برنامه (عنوان صفحه ورود)',
    hint: 'در عنوان «ورود به ...» صفحه ورود نمایش داده می‌شود.',
    default: 'تسک‌روز',
    section: 'login',
  },
  {
    key: 'loginSubtitle',
    label: 'زیرنویس برند صفحه ورود',
    hint: 'متن کوچک زیر عنوان صفحه ورود.',
    default: 'BUILT BY MOHUSYN',
    section: 'login',
  },
  {
    key: 'inviteBannerTitle',
    label: 'عنوان بنر دعوت‌نامه اتاق',
    default: 'دعوت‌نامه اتاق تمرکز گروهی',
    section: 'login',
  },
  {
    key: 'inviteBannerText',
    label: 'متن بنر دعوت‌نامه اتاق',
    default: 'وارد شوید یا حساب بسازید تا مستقیماً به اتاق متصل شوید.',
    section: 'login',
  },

  // ── سلام صبح/ظهر/عصر/شب ────────────────────────────────────
  {
    key: 'greetingMorning',
    label: 'سلام صبح (۵ تا ۲)',
    default: 'صبح بخیر! ☀️',
    section: 'greeting',
  },
  {
    key: 'greetingMorningSub',
    label: 'زیرنویس سلام صبح',
    default: 'امروز قراره روز پرباری داشته باشی',
    section: 'greeting',
  },
  {
    key: 'greetingNoon',
    label: 'سلام ظهر (۱۲ تا ۱۶)',
    default: 'ظهر بخیر! 🌤️',
    section: 'greeting',
  },
  {
    key: 'greetingNoonSub',
    label: 'زیرنویس سلام ظهر',
    default: 'پیشرفت امروزت چطور بوده تا الان؟',
    section: 'greeting',
  },
  {
    key: 'greetingEvening',
    label: 'سلام عصر (۱۶ تا ۲۰)',
    default: 'عصر بخیر! 🌇',
    section: 'greeting',
  },
  {
    key: 'greetingEveningSub',
    label: 'زیرنویس سلام عصر',
    default: 'وقت جمع‌بندی کارهای امروز است',
    section: 'greeting',
  },
  {
    key: 'greetingNight',
    label: 'سلام شب (۲۰ تا ۵)',
    default: 'شب بخیر! 🌙',
    section: 'greeting',
  },
  {
    key: 'greetingNightSub',
    label: 'زیرنویس سلام شب',
    default: 'خسته نباشی! آماده برنامه‌ریزی فردا شو',
    section: 'greeting',
  },

  // ── اتاق تمرکز ─────────────────────────────────────────────
  {
    key: 'focusLobbyTitle',
    label: 'عنوان صفحه تمرکز (لابی)',
    default: 'اتاق‌های تمرکز گروهی پومودورو',
    section: 'room',
  },
  {
    key: 'focusLobbyHint',
    label: 'توضیح صفحه تمرکز (لابی)',
    default:
      'در کنار هم‌تیمی‌ها، دوستان یا هم‌کلاسی‌های خود در یک اتاق مجازی متمرکز شوید. تایمر همگام، چت زنده، ارسال دعوت‌نامه و افزایش بازدهی فردی و تیمی!',
    multiline: true,
    section: 'room',
  },
  {
    key: 'focusCreateTitle',
    label: 'عنوان کارت ایجاد اتاق',
    default: 'ایجاد اتاق تمرکز جدید',
    section: 'room',
  },

  // ── سیستم ──────────────────────────────────────────────────
  {
    key: 'footerCredits',
    label: 'متن پایین سایدبار (امضا)',
    default: 'mohusyn.ir • ۲۰۲۶',
    section: 'system',
  },
  {
    key: 'logoutLabel',
    label: 'برچسب دکمه خروج از حساب',
    default: 'خروج از حساب',
    section: 'system',
  },
  {
    key: 'streakLabel',
    label: 'برچسب نشان استریک',
    default: 'روز استریک',
    section: 'system',
  },
  {
    key: 'searchPlaceholder',
    label: 'متن راهنمای جستجو',
    default: 'جستجو در تسک‌ها',
    section: 'system',
  },
];

export const DEFAULT_APP_TEXTS: Record<string, string> = Object.fromEntries(
  APP_TEXTS.map((t) => [t.key, t.default]),
);

/** بخش‌بندی برای نمایش گروه‌بندی‌شده در پنل مدیر */
export const APP_TEXT_SECTIONS: { id: AppTextDef['section']; label: string }[] = [
  { id: 'login', label: 'صفحه ورود و دعوت‌نامه' },
  { id: 'greeting', label: 'سلام‌های صبح تا شب' },
  { id: 'room', label: 'اتاق تمرکز' },
  { id: 'system', label: 'متن‌های عمومی سامانه' },
];

/** کلید سلام بر اساس ساعت روز */
export function greetingKeySet(hour: number): { text: string; sub: string } {
  if (hour >= 5 && hour < 12) return { text: 'greetingMorning', sub: 'greetingMorningSub' };
  if (hour >= 12 && hour < 16) return { text: 'greetingNoon', sub: 'greetingNoonSub' };
  if (hour >= 16 && hour < 20) return { text: 'greetingEvening', sub: 'greetingEveningSub' };
  return { text: 'greetingNight', sub: 'greetingNightSub' };
}
