/**
 * In-House Natural Language Task Parser for Persian text and speech.
 * Converts unstructured Persian user prompts into discrete scheduled tasks
 * with time (24h), priority, and category.
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

export function parseTasksFromPersianText(rawText: string, defaultDate: string = ''): ParsedTaskDraft[] {
  if (!rawText || !rawText.trim()) return [];

  const text = normalizeDigits(rawText.trim());

  // Split into candidate segments using common Persian delimiters
  // Delimiters: و ساعت, بعدش ساعت, سپس ساعت, و بعد, و بعدش, سپس, بعدش, خط جدید
  const splitRegex = /(?:\n+|[؛;]|\s+و\s+(?=ساعت|\d{1,2}|یک|دو|سه|چهار|پنج|بعد|سپس|قراره|میخوام|باید)|(?:\s+(?:سپس|بعدش|بعد|همچنین)\s+))/gi;
  const rawSegments = text.split(splitRegex);

  const cleanSegments: string[] = [];
  for (const seg of rawSegments) {
    const s = seg.trim();
    if (!s) continue;

    // Sub-split if segment still bundles "و بعدش" or "و ساعت"
    const subParts = s.split(/\s+و\s+(?=ساعت|\d{1,2}|بعدش|سپس|قراره|باید)/gi);
    for (const sub of subParts) {
      const trimmed = sub.trim();
      if (trimmed.length > 2) {
        cleanSegments.push(trimmed);
      }
    }
  }

  const results: ParsedTaskDraft[] = [];

  for (let idx = 0; idx < cleanSegments.length; idx++) {
    const segment = cleanSegments[idx];

    // 1. Extract Time (e.g. "ساعت 12 ظهر", "ساعت 1", "ساعت 17:30", "5 بعد از ظهر")
    let extractedTime: string | undefined;

    // Pattern 1: HH:MM
    const colonMatch = segment.match(/(?:ساعت\s*)?([012]?\d):([0-5]\d)/);
    if (colonMatch) {
      const h = parseInt(colonMatch[1], 10);
      const m = colonMatch[2];
      extractedTime = `${String(h).padStart(2, '0')}:${m}`;
    } else {
      // Pattern 2: "ساعت X" with digits or words + optional period (ظهر/عصر/شب/صبح)
      const hourDigitMatch = segment.match(/ساعت\s*(\d{1,2})(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر|بعد\s*از\s*ظهر))?/i);
      const hourWordMatch = !hourDigitMatch
        ? segment.match(/ساعت\s*(یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر|بعد\s*از\s*ظهر))?/i)
        : null;

      if (hourDigitMatch) {
        let h = parseInt(hourDigitMatch[1], 10);
        const mod = hourDigitMatch[2];
        if (mod && (mod.includes('عصر') || mod.includes('غروب') || mod.includes('شب') || mod.includes('بعدازظهر') || mod.includes('بعد'))) {
          if (h < 12) h += 12;
        } else if (mod && mod.includes('ظهر')) {
          if (h < 12 && h > 6) {
            // e.g. 12 ظهر
          }
        } else if (h >= 1 && h <= 6) {
          // In daily planning, hours 1 to 6 without "صبح" are afternoon (13:00 to 18:00)
          h += 12;
        }
        extractedTime = `${String(h).padStart(2, '0')}:۰۰`;
      } else if (hourWordMatch) {
        let h = PERSIAN_WORDS_NUMBERS[hourWordMatch[1]] || 12;
        const mod = hourWordMatch[2];
        if (mod && (mod.includes('عصر') || mod.includes('غروب') || mod.includes('شب') || mod.includes('بعدازظهر') || mod.includes('بعد'))) {
          if (h < 12) h += 12;
        } else if (h >= 1 && h <= 6) {
          h += 12;
        }
        extractedTime = `${String(h).padStart(2, '0')}:۰۰`;
      }
    }

    // 2. Clean task title: strip time strings and conversational preambles
    let cleanTitle = segment
      .replace(/(?:ساعت\s*)?([012]?\d):([0-5]\d)/g, '')
      .replace(/ساعت\s*\d{1,2}(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر|بعد\s*از\s*ظهر))?/g, '')
      .replace(/ساعت\s*(یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(ظهر|عصر|غروب|شب|صبح|بعدازظهر|بعد\s*از\s*ظهر))?/g, '');

    // Strip common filler words
    const fillers = [
      'قراره', 'میخوام', 'باید', 'لازمه', 'تصمیم دارم', 'برنامه اینه که', 'یادم باشه', 'حتما',
      'برم', 'بریم', 'انجام بدم', 'شروع کنم', 'داشته باشم', 'داشته باشیم', 'رو برم', 'قرار دارم',
      'بعدش', 'سپس', 'همچنین', 'و بعد', 'بعد', 'تحویل اش بدم', 'تحویلش بدم', 'تحویل بدم',
      'ظهر', 'عصر', 'صبح', 'غروب', 'امشب', 'فردا', 'رو', 'هم', 'یک', 'یه',
    ];

    for (const f of fillers) {
      cleanTitle = cleanTitle.split(f).join(' ');
    }
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    // 3. Intelligent contextual refinement for common Persian requests
    if (segment.includes('شیرینی فروشی') || segment.includes('شیرینی')) {
      cleanTitle = 'خرید شیرینی از شیرینی‌فروشی';
    } else if (segment.includes('موسیقی') || segment.includes('کلاس')) {
      cleanTitle = cleanTitle ? (cleanTitle.includes('کلاس') ? cleanTitle : `کلاس ${cleanTitle}`) : 'کلاس موسیقی';
    } else if (segment.includes('قرار') && (segment.includes('دوست') || segment.includes('دوستم'))) {
      cleanTitle = 'قرار ملاقات با دوست';
    } else if (segment.includes('تحویل') || segment.includes('برسونم')) {
      cleanTitle = cleanTitle && cleanTitle.length > 2 ? `تحویل به ${cleanTitle}` : 'تحویل سفارش و امانت';
    } else if (cleanTitle.length < 3) {
      cleanTitle = segment.trim();
    }

    // Clean punctuation
    cleanTitle = cleanTitle.replace(/^[،,.-]+|[،,.-]+$/g, '').trim();
    if (!cleanTitle) cleanTitle = `تسک ${idx + 1}`;

    // 4. Category inference
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

    // 5. Priority inference
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
