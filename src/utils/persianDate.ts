/**
 * Persian (Jalali) date utilities & number formatters
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toPersianDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[parseInt(w, 10)]);
}

export function toEnglishDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[۰-۹]/g, (w) => {
    const idx = PERSIAN_DIGITS.indexOf(w);
    return idx !== -1 ? ENGLISH_DIGITS[idx] : w;
  });
}

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

export const PERSIAN_WEEKDAYS_SHORT = [
  '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج', 'ش'
];

/**
 * Converts Gregorian date to Jalali date [year, month (1-12), day (1-31)]
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/**
 * Converts Jalali date to Gregorian date [year, month (1-12), day (1-31)]
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy2 = jy - 979;
  let days =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  let i = 0;
  for (; days >= sal_a[i] + (i === 1 && leap ? 1 : 0); i++);
  const gm = i;
  const gd = days - sal_a[i - 1] - (i === 2 && leap ? 1 : 0) + 1;
  return [gy, gm, gd];
}

export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatPersianDate(
  dateInput: Date | string,
  style: 'full' | 'short' | 'dayMonth' | 'weekday' | 'monthYear' = 'full'
): string {
  const date = typeof dateInput === 'string' ? parseISODate(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

  const weekdayName = PERSIAN_WEEKDAYS[date.getDay()];
  const monthName = PERSIAN_MONTHS[jm - 1];

  switch (style) {
    case 'weekday':
      return weekdayName;
    case 'dayMonth':
      return `${toPersianDigits(jd)} ${monthName}`;
    case 'monthYear':
      return `${monthName} ${toPersianDigits(jy)}`;
    case 'short':
      return `${toPersianDigits(jy)}/${toPersianDigits(String(jm).padStart(2, '0'))}/${toPersianDigits(String(jd).padStart(2, '0'))}`;
    case 'full':
    default:
      return `${weekdayName}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
  }
}

export function getDaysAround(selectedISO: string, daysBefore = 3, daysAfter = 10) {
  const baseDate = parseISODate(selectedISO);
  const todayISO = getTodayISO();
  const days = [];

  for (let i = -daysBefore; i <= daysAfter; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${dayOfMonth}`;

    const [jy, jm, jd] = gregorianToJalali(y, d.getMonth() + 1, d.getDate());
    const weekday = PERSIAN_WEEKDAYS[d.getDay()];
    const weekdayShort = PERSIAN_WEEKDAYS_SHORT[d.getDay()];
    const monthName = PERSIAN_MONTHS[jm - 1];

    days.push({
      date: d,
      iso,
      weekday,
      weekdayShort,
      jalaliDay: jd,
      jalaliMonth: jm,
      jalaliYear: jy,
      jalaliMonthName: monthName,
      isToday: iso === todayISO,
      isSelected: iso === selectedISO,
    });
  }

  return days;
}

export function getGreeting(): { text: string; subtext: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'صبح بخیر! ☀️', subtext: 'امروز قراره روز پرباری داشته باشی', icon: 'Sun' };
  } else if (hour >= 12 && hour < 16) {
    return { text: 'ظهر بخیر! 🌤️', subtext: 'پیشرفت امروزت چطور بوده تا الان؟', icon: 'SunMedium' };
  } else if (hour >= 16 && hour < 20) {
    return { text: 'عصر بخیر! 🌇', subtext: 'وقت جمع‌بندی کارهای امروز است', icon: 'Sunset' };
  } else {
    return { text: 'شب بخیر! 🌙', subtext: 'خسته نباشی! آماده برنامه‌ریزی فردا شو', icon: 'Moon' };
  }
}
