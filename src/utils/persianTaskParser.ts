/**
 * In-House Natural Language Task Parser for Persian text and speech.
 * Converts unstructured user prompts (e.g. "قراره ساعت ۱۲ برم کلاس موسیقی و ساعت ۱۳ قرار با دوستم...")
 * into discrete scheduled tasks with time, priority, and category.
 */

export interface ParsedTaskDraft {
  id: string;
  title: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  categoryId?: string;
  categoryName?: string;
  date?: string;
  selected: boolean;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const PERSIAN_WORDS_NUMBERS: Record<string, number> = {
  'یک': 1, 'یه': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5,
  'شش': 6, 'شیش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10,
  'یازده': 11, 'دوازده': 12, 'سیزده': 13, 'چهارده': 14, 'پانزده': 15,
  'شانزده': 16, 'هفده': 17, 'هجده': 18, 'نوزده': 19, 'بیست': 20,
};

function normalizeDigits(str: string): string {
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), i.toString());
  }
  return res;
}

export function parseTasksFromPersianText(rawText: string, defaultDate: string): ParsedTaskDraft[] {
  if (!rawText || !rawText.trim()) return [];

  const text = normalizeDigits(rawText.trim());

  // Split into candidate segments using common Persian delimiters
  // Delimiters: و ساعت, بعدش ساعت, سپس ساعت, و بعد, و بعدش, سپس, بعدش, خط جدید, یا "و" قبل از کلمات کلیدی
  const splitRegex = /(?:\n+|[؛;]|\s+و\s+(?=ساعت|بعد|سپس|قراره|میخوام|باید)|(?:\s+(?:سپس|بعدش|بعد|همچنین)\s+))/gi;
  const rawSegments = text.split(splitRegex);

  const cleanSegments: string[] = [];
  for (const seg of rawSegments) {
    const s = seg.trim();
    if (!s) continue;
    // If segment still contains "و ساعت", sub-split
    const subParts = s.split(/\s+و\s+(?=ساعت|\d{1,2}|یک|دو|سه|چهار|پنج)/gi);
    for (const sub of subParts) {
      if (sub.trim().length > 2) {
        cleanSegments.push(sub.trim());
      }
    }
  }

  const results: ParsedTaskDraft[] = [];

  for (let idx = 0; idx < cleanSegments.length; idx++) {
    const segment = cleanSegments[idx];

    // 1. Extract Time (e.g. "ساعت ۱۲ ظهر", "ساعت 1", "ساعت 17:30", "5 بعد از ظهر", "ظهر ساعت 12")
    let extractedTime: string | undefined;

    // Pattern 1: HH:MM
    const colonMatch = segment.match(/(?:ساعت\s*)?([012]?\d):([0-5]\d)/);
    if (colonMatch) {
      const h = parseInt(colonMatch[1], 10);
      const m = colonMatch[2];
      extractedTime = `${String(h).padStart(2, '0')}:${m}`;
    } else {
      // Pattern 2: "ساعت X" with words or digits + optional ظهر/عصر/شب/صبح
      const hourDigitMatch = segment.match(/ساعت\s*(\d{1,2})(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر))?/i);
      const hourWordMatch = !hourDigitMatch
        ? segment.match(/ساعت\s*(یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر))?/i)
        : null;

      if (hourDigitMatch) {
        let h = parseInt(hourDigitMatch[1], 10);
        const mod = hourDigitMatch[2];
        if (mod && ['عصر', 'غروب', 'شب', 'بعدازظهر'].includes(mod) && h < 12) {
          h += 12;
        } else if (mod === 'ظهر' && h < 12 && h > 6) {
          // keep 12
        } else if (h >= 1 && h <= 6 && !mod) {
          // If 1-6 without morning/night, usually afternoon in daily task context
          h += 12;
        }
        extractedTime = `${String(h).padStart(2, '0')}:۰۰`;
      } else if (hourWordMatch) {
        let h = PERSIAN_WORDS_NUMBERS[hourWordMatch[1]] || 12;
        const mod = hourWordMatch[2];
        if (mod && ['عصر', 'غروب', 'شب', 'بعدازظهر'].includes(mod) && h < 12) {
          h += 12;
        } else if (h >= 1 && h <= 6 && !mod) {
          h += 12;
        }
        extractedTime = `${String(h).padStart(2, '0')}:۰۰`;
      }
    }

    // 2. Clean task title from conversational preambles and fillers (Persian-safe word boundaries)
    let cleanTitle = segment
      // Remove time expressions from title
      .replace(/(?:ساعت\s*)?([012]?\d):([0-5]\d)/g, '')
      .replace(/ساعت\s*\d{1,2}(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر))?/g, '')
      .replace(/ساعت\s*(یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر))?/g, '')
      .replace(/(?:^|\s+)(?:ظهر|عصر|صبح|غروب|امشب|فردا)(?:\s+|$)/g, ' ')
      // Remove intent filler verbs/preambles anywhere in segment
      .replace(/(?:^|\s+)(?:قراره|میخوام|باید|لازمه|تصمیم دارم|برنامه اینه که|یادم باشه|حتما)(?:\s+|$)/g, ' ')
      .replace(/(?:^|\s+)(?:برم|بریم|انجام بدم|شروع کنم|داشته باشم|داشته باشیم|رو برم|بخرم|تحویل بدم)(?:\s+|$)/g, ' ')
      .replace(/(?:^|\s+)(?:رو|هم|یک|یه)(?:\s+|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Specific smart polishing for common Persian phrases
    if (segment.includes('شیرینی فروشی') || segment.includes('شیرینی')) {
      cleanTitle = 'خرید شیرینی از شیرینی‌فروشی';
    } else if (segment.includes('موسیقی')) {
      cleanTitle = 'کلاس موسیقی';
    } else if (segment.includes('قرار با دوست') || (segment.includes('قرار') && segment.includes('دوست'))) {
      cleanTitle = 'قرار ملاقات با دوست';
    } else if (segment.includes('تحویل') || segment.includes('برسونم')) {
      cleanTitle = cleanTitle && cleanTitle.length > 2 && cleanTitle !== 'تحویل' ? `تحویل ${cleanTitle}` : 'تحویل سفارش و امانت';
    } else if (cleanTitle.length < 3) {
      cleanTitle = segment.trim();
    }

    // Clean leading/trailing punctuation
    cleanTitle = cleanTitle.replace(/^[،,.-]+|[،,.-]+$/g, '').trim();
    if (!cleanTitle) cleanTitle = `تسک ${idx + 1}`;

    // 3. Category inference
    let categoryId = 'cat-personal';
    let categoryName = 'شخصی';
    const lowerSeg = segment.toLowerCase();

    if (lowerSeg.includes('موسیقی') || lowerSeg.includes('کلاس') || lowerSeg.includes('درس') || lowerSeg.includes('مطالعه') || lowerSeg.includes('کتاب') || lowerSeg.includes('آموزش')) {
      categoryId = 'cat-study';
      categoryName = 'آموزش و یادگیری';
    } else if (lowerSeg.includes('شیرینی') || lowerSeg.includes('خرید') || lowerSeg.includes('فروشگاه') || lowerSeg.includes('مارکت') || lowerSeg.includes('بازار')) {
      categoryId = 'cat-shopping';
      categoryName = 'خرید و مایحتاج';
    } else if (lowerSeg.includes('جلسه') || lowerSeg.includes('پروژه') || lowerSeg.includes('کار') || lowerSeg.includes('گزارش') || lowerSeg.includes('کد') || lowerSeg.includes('برنامه')) {
      categoryId = 'cat-work';
      categoryName = 'کاری و شغلی';
    } else if (lowerSeg.includes('ورزش') || lowerSeg.includes('باشگاه') || lowerSeg.includes('سلامت') || lowerSeg.includes('دکتر') || lowerSeg.includes('دارو')) {
      categoryId = 'cat-health';
      categoryName = 'سلامتی و ورزش';
    }

    // 4. Priority inference
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lowerSeg.includes('فوری') || lowerSeg.includes('حتما') || lowerSeg.includes('اورژانسی') || lowerSeg.includes('سریع')) {
      priority = 'high';
    }

    results.push({
      id: 'draft-' + Date.now() + '-' + idx,
      title: cleanTitle,
      time: extractedTime,
      priority,
      categoryId,
      categoryName,
      date: defaultDate,
      selected: true,
    });
  }

  // If results is empty but user wrote something, create 1 general task
  if (results.length === 0 && text.length > 2) {
    results.push({
      id: 'draft-' + Date.now() + '-0',
      title: text,
      priority: 'medium',
      categoryId: 'cat-work',
      categoryName: 'کاری و شغلی',
      date: defaultDate,
      selected: true,
    });
  }

  return results;
}
