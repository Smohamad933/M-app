import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import JSZip from 'jszip';
import {
  ArrowRight,
  Download,
  FolderArchive,
  Copy,
  CheckCircle2,
  Sparkles,
  Type,
  Layers,
  Palette,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sliders,
  Calendar,
  Edit3,
  RotateCcw,
  AtSign,
  Camera,
  Trash2,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { FontSelectorModal } from './FontSelectorModal';

type StudioTab = 'feed_posts' | 'stories_strategy';
type SlideTheme = 'light' | 'dark' | 'indigo' | 'emerald';
type StoryTheme = 'dark' | 'light' | 'indigo' | 'emerald' | 'sunset';
type AspectRatio = 'portrait' | 'square'; // portrait: 1080x1350 (4:5), square: 1080x1080 (1:1)
type RightPanelTab = 'edit' | 'settings' | 'caption';

export interface SlideData {
  badge: string;
  title: string;
  subtitle?: string;
  bodyText?: string;
  highlightBox?: string;
  topHandle?: string;
  footerRightText?: string;
  footerNote?: string;
  content?: React.ReactNode;
}

export interface PostDefinition {
  id: string;
  category: 'launch' | 'demo' | 'content';
  tag: string;
  title: string;
  caption: string;
  slides: [SlideData, SlideData, SlideData, SlideData];
}

export interface StorySlotData {
  time: string;
  type: string;
  sticker: string;
  hook?: string;
  title?: string;
  conclusion?: string;
  body?: string;
  action?: string;
  demoNote?: string;
  ctaText?: string;
  handles?: string;
}

export interface StoryDayPlan {
  day: number;
  cycleName: string;
  cycleColor: string;
  focusFeature: string;
  story1: StorySlotData;
  story2: StorySlotData;
  story3: StorySlotData;
}

// ── Default 22 Instagram Feed Posts ──
const DEFAULT_POSTS: PostDefinition[] = [
  // 1. Official Launch
  {
    id: 'launch-official',
    category: 'launch',
    tag: '🚀 پست ویژه: رونمایی رسمی',
    title: 'رونمایی رسمی از سامانه هوشمند بَگ‌تایم',
    caption: `🎉 آغاز رسمی فصلی نو در مدیریت زمان و بهره‌وری فردی و سازمانی!

با افتخار سامانه هوشمند «بَگ‌تایم (Bag Time)» رونمایی شد. 🚀

🔹 دیلی پلنر ساعتی با تکنیک اصولی Time Blocking
🔹 تحلیلگر موانع و عادت‌های بازدارنده (AI Habits)
🔹 افزونه اختصاصی تب جدید مرورگر با ورود یکپارچه (SSO)
🔹 اتاق‌های تمرکز زنده و پومودورو گروهی با موزیک تمرکز
🔹 اتصال مستقیم و ثبت‌نام ۱ کلیکی با ربات بله

📱 همین حالا برای شروع به @bagtime_app پیام دهید یا کلمه «بگ تایم» را دایرکت بفرستید!

@bagtime_app

#رونمایی #بگ_تایم #مدیریت_زمان #بهره_وری #تکنولوژی #پلنر`,
    slides: [
      {
        badge: '🚀 رونمایی رسمی',
        title: 'سامانه بَگ‌تایم متولد شد؛ کنترل روزهایت را پس بگیر!',
        subtitle: 'سامانه هوشمند مدیریت زمان و برنامه‌ریزی فردی و سازمانی',
        bodyText: `پلتفرمی فراتر از یک تو-دو لیست معمولی\nابزاری مدرن برای بلوک‌بندی ساعتی و ریشه‌یابی تعویق کارها\nتمرکز عمیق فردی و تیمی در محیطی سریع و سبک`,
        highlightBox: 'همین حالا با آرامش کارهایت را مدیریت کن ✨',
        footerNote: 'ورق بزنید تا با قابلیت‌ها آشنا شوید ‹',
      },
      {
        badge: '✨ امکانات کلیدی',
        title: 'هسته‌ای هوشمند برای روزهای پرمشغله',
        subtitle: 'طراحی شده بر پایه روانشناسی کار عمیق و تمرکز پایدار',
        bodyText: `⏰ دیلی پلنر ساعتی با نشانگر زنده زمان فعلی\n🧠 تحلیلگر عادت‌ها: کشف دلیل انجام نشدن کارها\n🌐 افزونه تب جدید مرورگر با ورود یکپارچه SSO\n🎧 اتاق‌های تمرکز زنده و پومودورو گروهی`,
        highlightBox: 'همه ابزارهای بهره‌وری در یک محیط یکپارچه',
      },
      {
        badge: '💡 طراحی و تجربه کاربری',
        title: 'طراحی شده بر پایه روانشناسی کار عمیق',
        subtitle: 'بدون پیچیدگی‌های خسته‌کننده ابزارهای خارجی',
        bodyText: `محیطی کاملاً مینیمال، سریع و بدون سردرگمی\nسازگار با وب، موبایل PWA و افزونه مرورگر\nامنیت کامل اطلاعات و اتصال مستقیم به پیام‌رسان بله`,
        highlightBox: 'ساده برای افراد تازه‌کار، قدرتمند برای مدیران و فریلنسرها',
      },
      {
        badge: '🎯 شروع و همراهی',
        title: 'از همین امروز منظم‌تر و موفق‌تر زندگی کن!',
        subtitle: 'یک قدم کوچک برای رسیدن به اهداف بزرگ',
        bodyText: `ورود آسان و سریع بدون نیاز به پسورد پیچیده\nیکپارچگی روی تمام دستگاه‌ها و مرورگر شما\nپشتیبانی و امکانات اختصاصی برای تیم‌ها`,
        highlightBox: 'کلمه «بگ تایم» را به دایرکت @bagtime_app بفرستید ✌️',
        footerNote: 'ورود مستقیم از بایو',
      },
    ],
  },

  // 2. Free Demo Account
  {
    id: 'demo-access',
    category: 'demo',
    tag: '⭐ پست ویژه: دریافت اکانت دمو',
    title: 'دریافت اکانت دمو رایگان بَگ‌تایم',
    caption: `می‌خوای قبل از هر تصمیمی، تمام امکانات نسخه Pro بَگ‌تایم رو رایگان امتحان کنی؟ ⭐

برای دریافت اکانت دموی سازمان و نسخه ویژه:
کلمه «دمو» یا «بگ‌تایم» رو به دایرکت @bagtime_app بفرستید تا دسترسی تست براتون فعال بشه!

🔹 تست نامحدود اتاق‌های پومودورو
🔹 فعال‌سازی افزونه نیوتَب مرورگر
🔹 آنالیز اختصاصی عادت‌های کاری شما

@bagtime_app

#اکانت_دمو #تست_رایگان #بگ_تایم #نرم_افزار #پلنر #تمرکز`,
    slides: [
      {
        badge: '⭐ تست رایگان',
        title: 'فرصت ویژه: دریافت اکانت دمو بَگ‌تایم!',
        subtitle: 'دسترسی کامل به تمام امکانات نسخه Pro بدون پرداخت هزینه',
        bodyText: `تست عملی سیستم مدیریت کارها و پلنر ساعتی\nامکان ارزیابی قبل از تصمیم‌گیری نهایی\nمشاهده گزارش‌های عملکرد و موانع کاری`,
        highlightBox: 'ظرفیت تست آزمایشی محدود است! 🎁',
        footerNote: 'شرایط دریافت در اسلایدهای بعد ‹',
      },
      {
        badge: '💎 چه امکاناتی در دمو فعاله؟',
        title: 'آزمایش تمام ابزارهای نسخه پیشرفته',
        subtitle: 'هر آنچه برای مدیریت حرفه‌ای کارهایتان نیاز دارید',
        bodyText: `تسک‌گذاری نامحدود با اولویت‌بندی هوشمند\nحضور در اتاق‌های تمرکز گروهی پومودورو\nاتصال افزونه نیوتَب مرورگر به حساب شما\nتحلیل ریشه‌ای موانع و اهمال‌کاری‌ها`,
        highlightBox: 'بدون هیچ محدودیتی در طول دوره تست',
      },
      {
        badge: '📩 چطور اکانت دمو بگیریم؟',
        title: 'فقط یک پیام ساده در دایرکت!',
        subtitle: 'در کمتر از ۲ دقیقه حسابتان فعال خواهد شد',
        bodyText: `کافیه وارد دایرکت اینستاگرام @bagtime_app بشی\nکلمه «دمو» یا «بگ‌تایم» رو ارسال کنی\nکد ورود اختصاصی بلافاصله برات فرستاده میشه`,
        highlightBox: 'دایرکت @bagtime_app ‹ کلمه «دمو»',
      },
      {
        badge: '⚡ دعوت به اقدام',
        title: 'امروز شروع کن، فردایت منظم‌تر خواهد بود',
        subtitle: 'تغییر از اولین قدم کوچک شروع می‌شود',
        bodyText: `بدون نیاز به نصب نرم‌افزارهای سنگین\nپشتیبانی سریع در طول مدت تست\nتجربه کارایی و نظم پایدار`,
        highlightBox: 'همین الان کلمه «دمو» رو به @bagtime_app دایرکت کن! ✨',
      },
    ],
  },

  // 20 Content Posts
  ...Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    const postThemes = [
      {
        title: 'چرا روزت تموم میشه ولی نصف کارهات می‌مونه؟',
        s1Badge: '⚠️ چالش روزمره',
        s1Sub: 'شلوغی ذهن و خطای نداشتن بلوک‌بندی زمانی',
        s1Body: 'لیست کارهای بلندبالا می‌نویسیم اما زمان انجام مشخص نیست\nبین کارهای کوچک و بی‌اهمیت گم می‌شویم\nدر پایان روز خستگی می‌ماند و کارهای اصلی روی زمین!',
        s1Box: 'راهکار در تعداد کارها نیست؛ در تخصیص زمان است',
        s2Badge: '💡 تکنیک علمی',
        s2Title: 'روش جادویی Time Blocking چیست؟',
        s2Sub: 'روشی که ایلان ماسک و بیل گیتس برای روزهایشان استفاده می‌کنند',
        s2Body: 'به جای نوشتن لیست بی‌انتها، هر کار در یک ساعت مشخص قفل می‌شود\nمغز در هر ساعت فقط روی یک موضوع فکر می‌کند\nاسترس ناشی از حجم کارها به کلی ناپدید می‌شود',
        s2Box: 'یک ساعت کار متمرکز = ۴ ساعت کار پراکنده',
        s3Badge: '🚀 در بَگ‌تایم',
        s3Title: 'دیلی پلنر ساعتی با نشانگر زنده زمان',
        s3Sub: 'همیشه می‌دانی در این لحظه نوبت کدام کار است',
        s3Body: 'خط زمان قرمز رنگ در طول روز حرکت می‌کند\nبا یک نگاه وضعیت تسک‌های هر ساعت را می‌بینی\nامکان جابجایی سریع کارها در صورت تغییر برنامه',
        s3Box: 'برنامه‌ریزی دقیق بدون سردرگمی ذهنی',
        s4Badge: '✌️ گام بعدی',
        s4Title: 'امروز روزت را بلوک‌بندی کن',
        s4Sub: 'یک روز با پلنر ساعتی کار کن تا تفاوت را لمس کنی',
        s4Body: 'پلنر را باز کن و ۳ کار اصلی‌ات را در ساعات مشخص قرار بده\nنوتیفیکیشن‌ها را در طول بلوک کاری ببند\nپایان روز تیک خوردن تمام تسک‌های اصلی را جشن بگیر!',
        s4Box: 'کلمه «بگ‌تایم» را به دایرکت @bagtime_app بفرست تا شروع کنی!',
      },
      {
        title: 'تکنیک پومودورو اما به سبک حرفه‌ای‌ها',
        s1Badge: '🍅 پومودورو مدرن',
        s1Sub: 'چرا خیلی‌ها از پومودورو نتیجه نمی‌گیرند؟',
        s1Body: 'تایمر می‌گذارند اما حین کار اینستاگرام را چک می‌کنند!\nزمان استراحت ۵ دقیقه‌ای تبدیل به نیم ساعت می‌شود\nکارهای سنگین را بدون خرد کردن وارد پومودورو می‌کنند',
        s1Box: 'پومودورو تعهد به یک تسک واحد است، نه فقط تماشای تایمر',
        s2Badge: '🎧 فرمول تمرکز عمیق',
        s2Title: '۳ شرط پومودوروی نتیجه‌بخش',
        s2Sub: 'روانشناسی قفل شدن ذهن روی تسک',
        s2Body: 'قطع کامل پیام‌رسان‌ها در بازه ۲۵ دقیقه‌ای\nاستفاده از صدای باران یا لوفای برای آرامش ذهن\nتعیین دقیق خروجی مورد انتظار قبل از زدن دکمه استارت',
        s2Box: 'تمرکز یک عضله است که با تمرین قوی می‌شود',
        s3Badge: '👥 در بَگ‌تایم',
        s3Title: 'اتاق‌های زنده پومودورو و کار گروهی',
        s3Sub: 'دیگر به تنهایی پشت میز خسته نمی‌شوی',
        s3Body: 'حضور در اتاق‌های تمرکز مشترک با تایمر همگام\nمشاهده دوستان و همکارانی که در حال کارند\nموزیک لوفای پس‌زمینه بدون نیاز به فیلترشکن',
        s3Box: 'انرژی جمعی کارایی شما را تا ۳ برابر بالا می‌برد',
        s4Badge: '🚀 اقدام امروز',
        s4Title: 'یک پومودورو ۲۵ دقیقه‌ای تجربه کن',
        s4Sub: 'سخت‌ترین کار امروزت را انتخاب کن و استارت بزن',
        s4Body: 'وارد بخش اتاق‌های تمرکز شو\nتایمر ۲۵ دقیقه را با هدف مشخص روشن کن\nلذت پایان یک تسک سخت را بچش!',
        s4Box: 'ورود رایگان به اتاق‌های تمرکز در @bagtime_app',
      },
      {
        title: 'چرا کارها رو عقب میندازیم؟ (۴ ریشه اهمال‌کاری)',
        s1Badge: '🧠 ریشه‌یابی',
        s1Sub: 'اهمال‌کاری تنبلی نیست؛ پیام هشدار مغز است',
        s1Body: 'مغز انسان از کارهای مبهم و ناشناخته فرار می‌کند\nترس از کامل نبودن نتیجه باعث تعویق شروع می‌شود\nافت انرژی و خستگی جسمی انگیزه را از بین می‌برد',
        s1Box: 'وقتی دلیل را بشناسی، راه‌حل ساده می‌شود',
        s2Badge: '🔍 ۴ عامل بازدارنده',
        s2Title: 'دلیل واقعی عقب افتادن کارهای تو چیست؟',
        s2Sub: 'طبق بررسی روانشناسان عملکرد',
        s2Body: '۱. ابهام در تسک: کار بیش از حد بزرگ یا گنگ است\n۲. حواس‌پرتی دیجیتال: نوتیفیکیشن و چک کردن مداوم پیام‌ها\n۳. تخمین غلط زمان: فکر می‌کنی ۵ دقیقه‌ای تمام می‌شود!\n۴. کمال‌گرایی منفی: یا عالی انجام میدم یا اصلاً شروع نمی‌کنم!',
        s2Box: 'شناخت عامل تعویق = نصف مسیر درمان',
        s3Badge: '📊 سیستم بَگ‌تایم',
        s3Title: 'تحلیلگر هوشمند دلایل تعویق (AI Habits)',
        s3Sub: 'ثبت دلیل انجام نشدن هر تسک برای شناخت الگوی رفتاری',
        s3Body: 'وقتی تسکی ناتمام می‌ماند، دلیلش را در ۲ ثانیه انتخاب می‌کنی\nنمودار هفتگی به تو نشان می‌دهد بیشترین ضربه از کجا وارد شده\nارائه توصیه‌های هوشمند برای رفع عادت‌های مخرب',
        s3Box: 'با داده‌های واقعی رفتار کاری خودت را اصلاح کن',
        s4Badge: '💡 گام عملی',
        s4Title: 'امروز کارهای سخت را خرد کن',
        s4Sub: 'قانون اولین قدم کوچک',
        s4Body: 'کار سنگین امروزت را به بخش‌های ۱۰ دقیقه‌ای تقسیم کن\nفقط بخش اول را شروع کن و بعد تصمیم بگیر\nدلیل تعویق‌هایت را در پلنر بگ‌تایم ثبت کن',
        s4Box: 'برای تست تحلیلگر عادت‌ها به @bagtime_app دایرکت بده!',
      },
      {
        title: 'دیلی پلنر ساعتی؛ نجات‌بخش ذهن‌های شلوغ',
        s1Badge: '⏰ نظم روزانه',
        s1Sub: 'چرا تو-دو لیست‌های کاغذی به تنهایی کافی نیستند؟',
        s1Body: 'چک‌لیست فقط می‌گوید «چه کاری» باید انجام شود\nاما نمی‌گوید «کِی» و «چقدر طول می‌کشد»\nنتیجه: انباشته شدن ده‌ها کار بدون زمان‌بندی واقع‌بینانه',
        s1Box: 'زمان محدود است؛ کارها را در ظرف زمان بچین',
        s2Badge: '⚡ جادوی تایم‌باکس',
        s2Title: 'ظرفیت روز شما دقیقاً چقدر است؟',
        s2Sub: 'چگونه واقع‌بینانه برنامه‌ریزی کنیم؟',
        s2Body: 'برای کارهای غیرمنتظره حداقل ۲ ساعت زمان خالی بگذار\nساعت‌های پرانرژی روز را به کارهای فکری اختصاص بده\nکارهای روتین را در ساعت‌های افت انرژی قرار بده',
        s2Box: 'برنامه انعطاف‌پذیر همیشه پایدارتر از برنامه فشرده است',
        s3Badge: '✨ ویژگی‌های بگ‌تایم',
        s3Title: 'طراحی شده مخصوص زندگی پرسرعت امروز',
        s3Sub: 'امکاناتی که در هیچ چک‌لیست معمولی پیدا نمی‌کنی',
        s3Body: 'بلوک‌های ساعتی با رنگ‌بندی تفکیک‌شده\nهشدار زمان آغاز هر تسک در پیام‌رسان بله\nدسترسی فوری از تب جدید مرورگر بدون نیاز به باز کردن سایت',
        s3Box: 'همیشه یک گام جلوتر از کارهایت باش',
        s4Badge: '🎯 شروع سریع',
        s4Title: 'فردا صبحت را با آرامش شروع کن',
        s4Sub: 'امشب فقط ۵ دقیقه برای چینش ساعات فردا وقت بگذار',
        s4Body: 'ساعات خواب، کار عمیق و استراحت را مشخص کن\nمهم‌ترین هدف فردا را در اولین بلوک کاری قرار بده\nبا خیالی آسوده و ذهنی سبک به خواب برو!',
        s4Box: 'دسترسی رایگان به پلنر در @bagtime_app',
      },
    ];

    const fallbackTheme = postThemes[i % postThemes.length];
    const titles = [
      'چرا روزت تموم میشه ولی نصف کارهات می‌مونه؟',
      'تکنیک پومودورو اما به سبک حرفه‌ای‌ها',
      'چرا کارها رو عقب میندازیم؟ (۴ ریشه اهمال‌کاری)',
      'دیلی پلنر ساعتی؛ نجات‌بخش ذهن‌های شلوغ',
      '۳ دزد بزرگ زمان در طول روز کاری',
      'قانون ۵ دقیقه برای شروع کارهای سخت',
      'چطور در خانه مثل یک مدیر منظم باشیم؟',
      'تکلیف کارهای ناتمام گذشته چیست؟',
      'فرمول طلایی آیزنهاور برای تفکیک کارها',
      'چرا چک‌لیست کاغذی دیگر جواب نمی‌دهد؟',
      'صبح‌ها چطور باانرژی و متمرکز شروع کنیم؟',
      'ورود فوق‌سریع بدون پسورد با ربات بله',
      'خستگی عصرگاهی ناشی از چیست؟',
      'مدیریت پروژه تیمی بدون ابزار پیچیده',
      'هنر محترمانه «نه» گفتن به درخواست‌ها',
      '۵ دقیقه طلایی پایان ساعت کاری',
      'سیستم ضد حواس‌پرتی در محل کار',
      'راز افرادی که همیشه وقت اضافه دارند',
      'چطور اولویت‌های شغلی را گم نکنیم؟',
      'پلنر بَگ‌تایم؛ تحول واقعی سبک زندگی',
    ];

    const curTitle = titles[i] || `راهکار طلایی موفقیت شماره ${idx}`;

    return {
      id: `post-${idx}`,
      category: 'content' as const,
      tag: `پست ${idx}: بهره‌وری و نظم`,
      title: curTitle,
      caption: `نکته کلیدی روز: ${curTitle} 🎯

برای ارتقای نظم فردی و برنامه‌ریزی هوشمند، سامانه بَگ‌تایم را رایگان امتحان کنید.

@bagtime_app

#بگ_تایم #مدیریت_زمان #پلنر #بهره_وری #کار_عمیق`,
      slides: [
        {
          badge: fallbackTheme.s1Badge,
          title: curTitle,
          subtitle: fallbackTheme.s1Sub,
          bodyText: fallbackTheme.s1Body,
          highlightBox: fallbackTheme.s1Box,
          footerNote: 'اسلاید بعد را بخوانید ‹',
        },
        {
          badge: fallbackTheme.s2Badge,
          title: fallbackTheme.s2Title,
          subtitle: fallbackTheme.s2Sub,
          bodyText: fallbackTheme.s2Body,
          highlightBox: fallbackTheme.s2Box,
          footerNote: 'ورق بزنید ‹',
        },
        {
          badge: fallbackTheme.s3Badge,
          title: fallbackTheme.s3Title,
          subtitle: fallbackTheme.s3Sub,
          bodyText: fallbackTheme.s3Body,
          highlightBox: fallbackTheme.s3Box,
          footerNote: 'راهکار عملی در اسلاید بعد ‹',
        },
        {
          badge: fallbackTheme.s4Badge,
          title: fallbackTheme.s4Title,
          subtitle: fallbackTheme.s4Sub,
          bodyText: fallbackTheme.s4Body,
          highlightBox: fallbackTheme.s4Box,
          footerNote: 'بَگ‌تایم',
        },
      ] as [SlideData, SlideData, SlideData, SlideData],
    };
  }),
];

// ── Default 60-Day Stories ──
const STORY_CYCLES = [
  { name: 'دیلی پلنر ساعتی (Time Blocking)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'ریشه‌یابی و تحلیلگر عادت‌ها (AI Habits)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { name: 'افزونه نیوتَب و ورود یکپارچه SSO', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { name: 'اتاق‌های تمرکز زنده و پومودورو گروهی', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { name: 'ورود سریع بدون پسورد با ربات بله', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { name: 'شبکه همکاران و چت درون‌سازمانی', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { name: 'مدیریت انرژی و خستگی مفرط', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { name: 'قانون ۵ دقیقه و غلبه بر تنبلی', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { name: 'ماتریس اولویت‌بندی آیزنهاور', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'اکانت دمو و تحول پایدار سبک کار', color: 'text-emerald-300 bg-emerald-600/20 border-emerald-500/30' },
];

const generateInitial60DaysPlan = (): StoryDayPlan[] => {
  return Array.from({ length: 60 }, (_, i) => {
    const dayNum = i + 1;
    const cycleIdx = Math.floor(i / 6);
    const cycle = STORY_CYCLES[cycleIdx] || STORY_CYCLES[0];

    return {
      day: dayNum,
      cycleName: `دوره ${cycleIdx + 1} (روزهای ${cycleIdx * 6 + 1} تا ${cycleIdx * 6 + 6}): ${cycle.name}`,
      cycleColor: cycle.color,
      focusFeature: cycle.name,
      story1: {
        time: '۱۰:۰۰ صبح (قلاب و تعامل)',
        type: 'Poll / Question',
        sticker: 'استیکر نظرسنجی (بله/خیر) یا اسلایدر آتش',
        hook: `روز ${dayNum} • صبح بخیر! چقدر از کارهای دیروزت انجام شد؟`,
        body: `بیشتر از ۸۰٪ کارهام رو زدم ✅\nمتاسفانه نصفشون موند ❌\n\nاگر حس می‌کنی سردرگمی، امروز قراره تکنیک «${cycle.name}» رو با هم باز کنیم.`,
        action: 'روی نظرسنجی بالا کلیک کن تا نتایج رو ببینی!',
      },
      story2: {
        time: '۱۴:۰۰ ظهر (آموزش و نمایش زنده ویژگی)',
        type: 'Value & Demo Spotlight',
        sticker: 'اسکرین‌شات سامانه بَگ‌تایم + گیف اشاره‌گر',
        title: `آموزش روز ${dayNum}: نحوه اجرای ${cycle.name}`,
        body: `در سامانه بَگ‌تایم وقتی این ویژگی رو فعال می‌کنی، مغزت از حالت چندوظیفگی خلاص میشه و انرژی اراده روی مهم‌ترین کار متمرکز می‌مونه.\n\n📱 نمونه اجرا شده رو در تصویر می‌بینید.`,
        demoNote: 'قابل استفاده در وب‌اپلیکیشن PWA و افزونه مرورگر',
      },
      story3: {
        time: '۱۹:۰۰ عصر (نتیجه عملی و دعوت به دایرکت)',
        type: 'Direct CTA & Engagement',
        sticker: 'باکس سوال (Question Box) یا دایرکت پیج',
        conclusion: `نتیجه روز ${dayNum}: امروز با بَگ‌تایم چقدر جلو افتادی؟`,
        ctaText: `برای دریافت دسترسی رایگان و شروع استفاده از ${cycle.name}: کلمه «بگ‌تایم» یا «دمو» رو به دایرکت بفرست! ✌️`,
        handles: '@bagtime_app',
      },
    };
  });
};

export const InstagramSlidesStudio: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    allAvailableFonts,
    systemFont,
    globalSettings,
  } = useTask();

  const [activeTab, setActiveTab] = useState<StudioTab>('feed_posts');

  // Handle & Branding state (configurable by user)
  const [customHandle, setCustomHandle] = useState<string>(() => {
    try {
      return localStorage.getItem('bagtime_instagram_handle') || '@bagtime_app';
    } catch {
      return '@bagtime_app';
    }
  });

  // Persistent Custom Post Overrides
  const [customPosts, setCustomPosts] = useState<Record<string, PostDefinition>>(() => {
    try {
      const saved = localStorage.getItem('bagtime_instagram_post_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persistent Custom Story Overrides
  const [customStories, setCustomStories] = useState<Record<number, Partial<StoryDayPlan>>>(() => {
    try {
      const saved = localStorage.getItem('bagtime_instagram_story_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Feed Posts State
  const [activePostIndex, setActivePostIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('light');
  const [selectedFont, setSelectedFont] = useState<string>(systemFont || 'vazirmatn');
  const [showFooter, setShowFooter] = useState<boolean>(true);
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>(true);
  const [showHandles, setShowHandles] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'content' | 'launch' | 'demo'>('all');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('edit');
  const [exportQuality, setExportQuality] = useState<'4k' | 'hd'>('4k');

  // 60-Day Story Strategy State
  const [selectedStoryDay, setSelectedStoryDay] = useState<number>(1);
  const [activeStorySlot, setActiveStorySlot] = useState<1 | 2 | 3>(1);
  const [editingStorySlot, setEditingStorySlot] = useState<1 | 2 | 3 | null>(null);
  const [storyTheme, setStoryTheme] = useState<StoryTheme>('dark');
  const [showStoryFooter, setShowStoryFooter] = useState<boolean>(false);
  const [storyFooterRight, setStoryFooterRight] = useState<string>('');
  const [storyFooterLeft, setStoryFooterLeft] = useState<string>('');
  const [showStoryMockup, setShowStoryMockup] = useState<boolean>(true);
  const [customStoryScreenshot, setCustomStoryScreenshot] = useState<string | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomStoryScreenshot(event.target.result);
        sounds.playComplete();
      }
    };
    reader.readAsDataURL(file);
  };
  const [publishedDays, setPublishedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('bagtime_stories_published');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedStoryText, setCopiedStoryText] = useState<string | null>(null);

  // References for reliable export
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const storyExportRef = useRef<HTMLDivElement>(null);

  const footerPrefix = globalSettings?.footerBranding?.prefixText || 'بَگ‌تایم، از خانوادهٔ';
  const footerCompany = globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه';

  // Save custom handle
  const handleUpdateHandle = (val: string) => {
    setCustomHandle(val);
    try {
      localStorage.setItem('bagtime_instagram_handle', val);
    } catch {}
  };

  // Persist published story days
  useEffect(() => {
    try {
      localStorage.setItem('bagtime_stories_published', JSON.stringify(publishedDays));
    } catch {}
  }, [publishedDays]);

  const toggleDayPublished = (day: number) => {
    sounds.playPop();
    setPublishedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Compute merged posts
  const posts: PostDefinition[] = DEFAULT_POSTS.map((p) => {
    if (customPosts[p.id]) {
      return { ...p, ...customPosts[p.id] };
    }
    return p;
  });

  const currentPost = posts[activePostIndex] || posts[0];
  const activeSlide = currentPost.slides[activeSlideIndex] || currentPost.slides[0];

  const filteredPosts = posts.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  // Compute merged stories
  const baseStories = generateInitial60DaysPlan();
  const stories60Days: StoryDayPlan[] = baseStories.map((plan) => {
    if (customStories[plan.day]) {
      return { ...plan, ...customStories[plan.day] } as StoryDayPlan;
    }
    return plan;
  });

  const currentStoryDayData = stories60Days[selectedStoryDay - 1] || stories60Days[0];

  // ── Manual Editing Handlers for Posts ──
  const handleUpdateActiveSlide = (field: keyof SlideData, value: string) => {
    const updatedSlides = [...currentPost.slides] as [SlideData, SlideData, SlideData, SlideData];
    updatedSlides[activeSlideIndex] = {
      ...updatedSlides[activeSlideIndex],
      [field]: value,
    };

    const updatedPost: PostDefinition = {
      ...currentPost,
      slides: updatedSlides,
    };

    const nextCustomPosts = {
      ...customPosts,
      [currentPost.id]: updatedPost,
    };
    setCustomPosts(nextCustomPosts);
    try {
      localStorage.setItem('bagtime_instagram_post_overrides', JSON.stringify(nextCustomPosts));
    } catch {}
  };

  const handleUpdateActiveCaption = (caption: string) => {
    const updatedPost: PostDefinition = {
      ...currentPost,
      caption,
    };

    const nextCustomPosts = {
      ...customPosts,
      [currentPost.id]: updatedPost,
    };
    setCustomPosts(nextCustomPosts);
    try {
      localStorage.setItem('bagtime_instagram_post_overrides', JSON.stringify(nextCustomPosts));
    } catch {}
  };

  const handleResetCurrentPost = () => {
    sounds.playPop();
    const defaultPost = DEFAULT_POSTS.find((p) => p.id === currentPost.id);
    if (!defaultPost) return;

    const nextCustomPosts = { ...customPosts };
    delete nextCustomPosts[currentPost.id];
    setCustomPosts(nextCustomPosts);
    try {
      localStorage.setItem('bagtime_instagram_post_overrides', JSON.stringify(nextCustomPosts));
    } catch {}
    alert('متن این پست با موفقیت به حالت اولیه بازنشانی شد.');
  };

  // ── Manual Editing Handlers for Stories ──
  const handleUpdateStorySlot = (slotNum: 1 | 2 | 3, field: string, value: string) => {
    const slotKey = `story${slotNum}` as 'story1' | 'story2' | 'story3';
    const currentSlotData = currentStoryDayData[slotKey];
    const updatedSlotData = { ...currentSlotData, [field]: value };

    const updatedDayPlan: Partial<StoryDayPlan> = {
      ...currentStoryDayData,
      [slotKey]: updatedSlotData,
    };

    const nextCustomStories = {
      ...customStories,
      [selectedStoryDay]: updatedDayPlan,
    };
    setCustomStories(nextCustomStories);
    try {
      localStorage.setItem('bagtime_instagram_story_overrides', JSON.stringify(nextCustomStories));
    } catch {}
  };

  const handleResetStorySlot = (slotNum: 1 | 2 | 3) => {
    sounds.playPop();
    const baseDay = baseStories.find((d) => d.day === selectedStoryDay);
    if (!baseDay) return;

    const slotKey = `story${slotNum}` as 'story1' | 'story2' | 'story3';
    const nextCustomStories = { ...customStories };
    if (nextCustomStories[selectedStoryDay]) {
      nextCustomStories[selectedStoryDay] = {
        ...nextCustomStories[selectedStoryDay],
        [slotKey]: baseDay[slotKey],
      };
      setCustomStories(nextCustomStories);
      try {
        localStorage.setItem('bagtime_instagram_story_overrides', JSON.stringify(nextCustomStories));
      } catch {}
    }
    setEditingStorySlot(null);
  };

  const handleCopyCaption = () => {
    sounds.playPop();
    navigator.clipboard.writeText(currentPost.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyStoryText = (slotNum: number, text: string) => {
    sounds.playPop();
    navigator.clipboard.writeText(text);
    setCopiedStoryText(`story_${slotNum}`);
    setTimeout(() => setCopiedStoryText(null), 2500);
  };

  // Robust Canvas to Blob Converter
  const getCanvasBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              const arr = dataUrl.split(',');
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              resolve(new Blob([u8arr], { type: mime }));
            } catch (e) {
              reject(e);
            }
          }
        }, 'image/png');
      } catch (e) {
        reject(e);
      }
    });
  };

  // ── Robust Native Pixel HTML2Canvas Single Slide PNG Export (Identical to Preview, 4K Supported) ──
  const handleExportSingleSlide = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    setExportProgress(`در حال تولید تصویر اسلاید با کیفیت ${exportQuality === '4k' ? '4K Ultra HD (۲۱۶۰p)' : '۱۰۸۰p رتینا'}...`);
    sounds.playPop();

    try {
      const isPortrait = aspectRatio === 'portrait';
      const baseWidth = 380;
      const baseHeight = isPortrait ? 475 : 380;
      const targetElement = exportContainerRef.current.querySelector<HTMLElement>(`#clean-slide-${activeSlideIndex}`);
      if (!targetElement) throw new Error('المان اسلاید یافت نشد.');

      await new Promise((r) => setTimeout(r, 60));

      const targetWidth = exportQuality === '4k' ? 2160 : 1080;
      const scaleFactor = targetWidth / baseWidth; // 5.6842 for 4K (2160x2700 / 2160x2160), 2.8421 for HD (1080x1350 / 1080x1080)

      const canvas = await html2canvas(targetElement, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: slideTheme === 'light' ? '#ffffff' : '#0b0f19',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector(`#clean-slide-${activeSlideIndex}`) as HTMLElement;
          if (el) {
            el.style.position = 'static';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
          }
        },
      });

      const blob = await getCanvasBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPost.id}-slide-${activeSlideIndex + 1}-${exportQuality.toUpperCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`خطا در خروجی تصویر: ${err?.message || 'مشکل در رندر'}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // ── Robust 4-Slide ZIP Export (Identical to Preview, 4K Supported) ──
  const handleExportAllSlidesZip = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    sounds.playPop();

    const zip = new JSZip();

    try {
      const isPortrait = aspectRatio === 'portrait';
      const baseWidth = 380;
      const baseHeight = isPortrait ? 475 : 380;
      const targetWidth = exportQuality === '4k' ? 2160 : 1080;
      const scaleFactor = targetWidth / baseWidth;

      for (let i = 0; i < 4; i++) {
        setExportProgress(`در حال پردازش و رندر اسلاید ${i + 1} از ۴ (${exportQuality === '4k' ? 'کیفیت 4K' : 'کیفیت ۱۰۸۰p'})...`);
        const targetElement = exportContainerRef.current.querySelector<HTMLElement>(`#clean-slide-${i}`);
        if (!targetElement) continue;

        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(targetElement, {
          scale: scaleFactor,
          useCORS: true,
          allowTaint: true,
          backgroundColor: slideTheme === 'light' ? '#ffffff' : '#0b0f19',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          width: baseWidth,
          height: baseHeight,
          windowWidth: baseWidth,
          windowHeight: baseHeight,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector(`#clean-slide-${i}`) as HTMLElement;
            if (el) {
              el.style.position = 'static';
              el.style.opacity = '1';
              el.style.visibility = 'visible';
            }
          },
        });

        const blob = await getCanvasBlob(canvas);
        zip.file(`slide-${i + 1}-${exportQuality.toUpperCase()}.png`, blob);
      }

      setExportProgress('در حال ایجاد فایل فشرده ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPost.id}-carousel-4slides-${exportQuality.toUpperCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (err: any) {
      console.error('Batch export error:', err);
      alert(`خطا در خروجی فایل زیپ: ${err?.message || 'مشکل در رندر تصاویر'}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // ── Robust 9:16 Instagram Story PNG Export (Full 4K Ultra HD 2160x3840) ──
  const handleExportStoryImage = async () => {
    if (!storyExportRef.current || isExporting) return;
    setIsExporting(true);
    const is4K = exportQuality === '4k';
    setExportProgress(`در حال رندر استوری عمودی با کیفیت ${is4K ? '4K Ultra HD (۲۱۶۰×۳۸۴۰)' : '۱۰۸۰×۱۹۲۰'}...`);
    sounds.playPop();

    try {
      await new Promise((r) => setTimeout(r, 60));

      const baseWidth = 360;
      const baseHeight = 640;
      const targetWidth = is4K ? 2160 : 1080;
      const scaleFactor = targetWidth / baseWidth; // exactly 6.0 for 4K (2160x3840), 3.0 for HD (1080x1920)

      const canvas = await html2canvas(storyExportRef.current, {
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor:
          storyTheme === 'light'
            ? '#ffffff'
            : storyTheme === 'indigo'
            ? '#0b0e1a'
            : storyTheme === 'emerald'
            ? '#021f18'
            : storyTheme === 'sunset'
            ? '#1c1917'
            : '#0b0f19',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: baseWidth,
        height: baseHeight,
        windowWidth: baseWidth,
        windowHeight: baseHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-story-export="true"]') as HTMLElement;
          if (el) {
            el.style.position = 'static';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
          }
        },
      });

      const blob = await getCanvasBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bagtime-story-day-${selectedStoryDay}-slot-${activeStorySlot}-${exportQuality.toUpperCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (err: any) {
      console.error('Story export error:', err);
      alert(`خطا در دانلود استوری: ${err?.message || 'مشکل در رندر'}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Color Styles
  const getThemeClasses = (t: SlideTheme) => {
    switch (t) {
      case 'dark':
        return {
          container: 'bg-[#0f172a] text-slate-100 border border-slate-800 shadow-2xl',
          card: 'bg-slate-900/80 border-slate-800 text-slate-200',
          accentText: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          subtext: 'text-slate-400',
        };
      case 'indigo':
        return {
          container: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-800/50 shadow-2xl',
          card: 'bg-indigo-900/40 border-indigo-700/50 text-indigo-100',
          accentText: 'text-amber-300',
          badge: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
          subtext: 'text-indigo-200',
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] text-white border border-emerald-800/50 shadow-2xl',
          card: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-100',
          accentText: 'text-emerald-300',
          badge: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
          subtext: 'text-emerald-200/80',
        };
      case 'light':
      default:
        return {
          container: 'bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#edf2f7] text-slate-900 border border-slate-200/90 shadow-2xl',
          card: 'bg-white/95 border-slate-200/90 text-slate-800 shadow-xs',
          accentText: 'text-[#00b884]',
          badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          subtext: 'text-slate-600',
        };
    }
  };

  const themeStyles = getThemeClasses(slideTheme);

  // Story Theme Styles
  const getStoryThemeClasses = (t: StoryTheme) => {
    switch (t) {
      case 'light':
        return {
          container: 'bg-gradient-to-b from-[#f8fafc] via-[#ffffff] to-[#f1f5f9] text-slate-900 border border-slate-200 shadow-2xl',
          card: 'bg-white/95 border-slate-200 text-slate-800 shadow-md',
          subtext: 'text-slate-600',
          accentText: 'text-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          glow1: 'bg-emerald-500/10',
          glow2: 'bg-indigo-500/10',
          headerBorder: 'border-slate-200',
          footerBorder: 'border-slate-200',
          footerText: 'text-slate-500',
        };
      case 'indigo':
        return {
          container: 'bg-gradient-to-b from-[#0b0e1a] via-[#1e1b4b] to-[#0f172a] text-white border border-indigo-800/40 shadow-2xl',
          card: 'bg-indigo-950/70 border-indigo-700/60 text-indigo-100 shadow-md',
          subtext: 'text-indigo-200',
          accentText: 'text-amber-300',
          badge: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
          glow1: 'bg-indigo-500/25',
          glow2: 'bg-amber-500/20',
          headerBorder: 'border-indigo-800/60',
          footerBorder: 'border-indigo-800/60',
          footerText: 'text-indigo-300',
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-b from-[#021f18] via-[#064e3b] to-[#022c22] text-white border border-emerald-800/40 shadow-2xl',
          card: 'bg-emerald-950/70 border-emerald-700/60 text-emerald-100 shadow-md',
          subtext: 'text-emerald-200',
          accentText: 'text-emerald-300',
          badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
          glow1: 'bg-emerald-500/25',
          glow2: 'bg-teal-500/20',
          headerBorder: 'border-emerald-800/60',
          footerBorder: 'border-emerald-800/60',
          footerText: 'text-emerald-300',
        };
      case 'sunset':
        return {
          container: 'bg-gradient-to-b from-[#1c1917] via-[#4c0519] to-[#1e1b4b] text-white border border-rose-800/40 shadow-2xl',
          card: 'bg-black/60 border-rose-800/60 text-rose-100 shadow-md',
          subtext: 'text-rose-200',
          accentText: 'text-amber-300',
          badge: 'bg-rose-500/25 text-rose-200 border-rose-500/30',
          glow1: 'bg-rose-500/25',
          glow2: 'bg-amber-500/20',
          headerBorder: 'border-rose-800/60',
          footerBorder: 'border-rose-800/60',
          footerText: 'text-rose-300',
        };
      case 'dark':
      default:
        return {
          container: 'bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#0b0f19] text-white border border-slate-800 shadow-2xl',
          card: 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-md',
          subtext: 'text-slate-400',
          accentText: 'text-emerald-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          glow1: 'bg-purple-500/20',
          glow2: 'bg-emerald-500/20',
          headerBorder: 'border-slate-800',
          footerBorder: 'border-slate-800',
          footerText: 'text-slate-400',
        };
    }
  };

  // Feature Screenshot Mockup Card
  const renderFeatureMockupCard = (cycleIdx: number, isLight: boolean) => {
    const bg = isLight ? 'bg-slate-100/90 text-slate-800 border-slate-200' : 'bg-slate-900/90 text-slate-100 border-slate-800';

    switch (cycleIdx) {
      case 0: // Time Blocking
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-1.5 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-500 border-b border-slate-700/40 pb-1">
              <span>⏰ دیلی پلنر ساعتی بَگ‌تایم</span>
              <span>Time Blocking</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold flex justify-between">
              <span>۰۹:۰۰ - ۱۰:۳۰ کار عمیق روی تسک‌های اصلی</span>
              <span>✅ انجام شد</span>
            </div>
            <div className="py-0.5 px-2 rounded-full bg-rose-500/20 text-rose-500 text-[9px] font-black flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>۱۰:۴۵ | خط نشانگر زنده زمان فعلی</span>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold flex justify-between">
              <span>۱۱:۰۰ - ۱۲:۳۰ جلسه هماهنگی پروژه</span>
              <span>⏳ در جریان</span>
            </div>
          </div>
        );
      case 1: // AI Habits
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-1.5 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-purple-400 border-b border-slate-700/40 pb-1">
              <span>🧠 تحلیلگر عادت‌ها (AI Habits)</span>
              <span>گزارش علل تعویق</span>
            </div>
            <div className="flex items-center justify-between font-black text-xs text-emerald-500">
              <span>نرخ بهره‌وری امروز:</span>
              <span>۸۲٪ عالی</span>
            </div>
            <div className="text-[10px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>📱 عامل اول: حواس‌پرتی گوشی و شبکه‌های اجتماعی</span>
                <span className="text-amber-400 font-bold">۴۱٪</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>😴 عامل دوم: افت انرژی و خستگی عصرگاهی</span>
                <span className="text-rose-400 font-bold">۲۷٪</span>
              </div>
            </div>
          </div>
        );
      case 2: // New Tab SSO
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-2 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-indigo-400 border-b border-slate-700/40 pb-1">
              <span>🌐 افزونه تب جدید مرورگر BagTime</span>
              <span>ورود یکپارچه SSO</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-800 text-slate-300 text-[10px] text-center border border-slate-700">
              🔍 جستجو در گوگل یا وارد کردن آدرس وب...
            </div>
            <div className="flex items-center justify-around text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400">بَگ‌تایم</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400">پیام‌رسان بله</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400">سایت نگاه</span>
            </div>
          </div>
        );
      case 3: // Focus Rooms
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-1.5 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-amber-400 border-b border-slate-700/40 pb-1">
              <span>🎧 اتاق تمرکز مشترک بَگ‌تایم</span>
              <span>۴ همکار آنلاین</span>
            </div>
            <div className="text-center font-mono font-black text-xl text-emerald-400 py-1">
              ۲۴:۵۲ 🍅
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>🎵 موزیک لوفای باران</span>
              <span className="text-emerald-400 font-bold">🟢 تمرکز عمیق فعال</span>
            </div>
          </div>
        );
      case 4: // Bale Bot
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-1.5 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-sky-400 border-b border-slate-700/40 pb-1">
              <span>🤖 ربات بله سامانه بَگ‌تایم</span>
              <span>ورود بدون پسورد</span>
            </div>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-300 text-[10px] space-y-1">
              <div>✓ تایید آنی شماره تماس از بله</div>
              <div>✓ دسترسی مستقیم فعال شد، ورود با یک کلیک!</div>
            </div>
          </div>
        );
      default:
        return (
          <div className={`p-3 rounded-2xl border ${bg} text-right text-[11px] space-y-1.5 shadow-md`}>
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-400 border-b border-slate-700/40 pb-1">
              <span>⭐ سامانه مدیریت زمان بَگ‌تایم</span>
              <span>نسخه Pro</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-bold text-center">
              پلنر ساعتی • اتاق‌های تمرکز • ریشه‌یابی عادت‌ها
            </div>
          </div>
        );
    }
  };

  // Render Story Content (Identical for Preview & 4K Export)
  const renderStoryContent = (slotNum: 1 | 2 | 3) => {
    const isLight = storyTheme === 'light';
    const theme = getStoryThemeClasses(storyTheme);
    const cycleIdx = Math.floor((selectedStoryDay - 1) / 6);

    const slotData =
      slotNum === 1
        ? currentStoryDayData.story1
        : slotNum === 2
        ? currentStoryDayData.story2
        : currentStoryDayData.story3;

    const hookOrTitle =
      slotNum === 1
        ? currentStoryDayData.story1.hook
        : slotNum === 2
        ? currentStoryDayData.story2.title
        : currentStoryDayData.story3.conclusion;

    const bodyText =
      slotNum === 1
        ? currentStoryDayData.story1.body
        : slotNum === 2
        ? currentStoryDayData.story2.body
        : currentStoryDayData.story3.ctaText;

    const stickerOrNote =
      slotNum === 1
        ? `🎯 ${currentStoryDayData.story1.sticker}`
        : slotNum === 2
        ? `💡 ${currentStoryDayData.story2.demoNote || currentStoryDayData.story2.sticker}`
        : `📩 دایرکت: ${currentStoryDayData.story3.handles || customHandle}`;

    return (
      <div
        className={`w-full h-full ${theme.container} p-6 flex flex-col justify-between overflow-hidden relative select-none`}
        style={{
          fontFamily: selectedFont || 'inherit',
          fontFeatureSettings: '"liga" 1, "calt" 1',
        }}
        dir="rtl"
      >
        {/* Glow Decors */}
        <div className={`absolute top-10 left-5 w-48 h-48 rounded-full ${theme.glow1} blur-2xl pointer-events-none`} />
        <div className={`absolute bottom-10 right-5 w-48 h-48 rounded-full ${theme.glow2} blur-2xl pointer-events-none`} />

        {/* Top Header */}
        <div className={`flex items-center justify-between z-10 border-b ${theme.headerBorder} pb-3 flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={26} />
            <span className="font-black text-sm">بَگ‌تایم</span>
          </div>
          <div className="text-right">
            <div className={`${theme.accentText} font-black text-xs`}>روز {selectedStoryDay} از ۶۰</div>
            <div className={`${theme.subtext} text-[10px] font-mono`} dir="ltr">{customHandle}</div>
          </div>
        </div>

        {/* Center Body */}
        <div className="my-auto space-y-2.5 z-10 text-right py-2 flex-1 flex flex-col justify-center">
          <div className={`inline-block px-2.5 py-1 rounded-xl font-black text-xs self-start ${theme.badge}`}>
            {slotData.time}
          </div>

          <h2 className="text-base font-black leading-snug">
            {hookOrTitle}
          </h2>

          {/* Feature Screenshot Mockup or Custom Uploaded Image */}
          {showStoryMockup && (
            <div className="w-full rounded-2xl overflow-hidden shadow-lg relative my-1">
              {customStoryScreenshot ? (
                <div className="w-full h-36 bg-slate-950 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-700">
                  <img
                    src={customStoryScreenshot}
                    alt="اسکرین‌شات سامانه"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                renderFeatureMockupCard(cycleIdx, isLight)
              )}
            </div>
          )}

          <div className={`p-3 rounded-2xl border text-xs font-bold leading-relaxed whitespace-pre-wrap ${theme.card}`}>
            {bodyText}
          </div>

          <div className="p-2.5 rounded-xl border bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
            {stickerOrNote}
          </div>
        </div>

        {/* Optional Footer (Hidden by default, user can toggle and edit) */}
        {showStoryFooter && (
          <div className={`pt-3 border-t ${theme.footerBorder} flex items-center justify-between text-xs ${theme.footerText} z-10 flex-shrink-0`}>
            <span>
              {storyFooterRight || `${footerPrefix} ${footerCompany}`}
            </span>
            <span className="font-mono text-emerald-500" dir="ltr">
              {storyFooterLeft || customHandle}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render Slide Content (Identical for Preview & Export)
  const renderSlideContent = (slideIndex: number) => {
    const s = currentPost.slides[slideIndex] || currentPost.slides[0];

    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-6 sm:p-7 select-none relative overflow-hidden ${themeStyles.container}`}
        style={{
          fontFamily: selectedFont || 'inherit',
          fontFeatureSettings: '"liga" 1, "calt" 1',
        }}
        dir="rtl"
      >
        {/* Glow Decors */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={26} />
            <span className="font-black text-xs sm:text-sm flex items-center gap-1">
              <span>بَگ‌تایم</span>
              <span className={themeStyles.accentText}>.</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showHandles && (s.topHandle !== undefined ? s.topHandle : customHandle) && (
              <span className="text-[10px] font-bold text-slate-400 font-mono" dir="ltr">
                {s.topHandle !== undefined ? s.topHandle : customHandle}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 font-black rounded-full bg-slate-500/10 border border-slate-500/20">
              {slideIndex + 1} / ۴
            </span>
          </div>
        </div>

        {/* Middle Body */}
        <div className="my-auto space-y-3 py-2 z-10 text-right">
          {s.badge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span>{s.badge}</span>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-black leading-snug">
            {s.title}
          </h2>

          {s.subtitle && (
            <p className={`text-xs sm:text-[13px] font-bold leading-relaxed ${themeStyles.subtext}`}>
              {s.subtitle}
            </p>
          )}

          {/* Body Content / Points */}
          {s.bodyText ? (
            <div className="space-y-2 text-xs font-bold leading-relaxed">
              {s.bodyText.split('\n').filter(Boolean).map((line, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${themeStyles.card} flex items-start gap-2 text-right`}
                >
                  <span className="text-emerald-500 font-black">•</span>
                  <span className="flex-1">{line}</span>
                </div>
              ))}
              {s.highlightBox && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-center text-xs mt-2">
                  {s.highlightBox}
                </div>
              )}
            </div>
          ) : s.content ? (
            <div className="pt-1">
              {s.content}
            </div>
          ) : null}
        </div>

        {/* Bottom Footer of Slide */}
        {showFooter && (
          <div className="pt-3 border-t border-slate-500/10 flex items-center justify-between text-[10px] text-slate-400 z-10 flex-shrink-0">
            <div>
              {s.footerRightText !== undefined
                ? s.footerRightText
                : showFooterBranding
                ? `${footerPrefix} ${footerCompany}`
                : ''}
            </div>

            <div className="flex items-center gap-1.5 font-bold">
              {s.footerNote ? (
                <span className="text-emerald-500">{s.footerNote}</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <header className="px-4 sm:px-6 py-3 bg-[#0d1322] border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به برنامه اصلی</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black leading-tight">استودیو سوشال و استراتژی اینستاگرام</h1>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  مخصوص مدیر کل
                </span>
              </div>
              <p className="text-[10px] text-slate-400">۲۲ پست اسلایدی قابل ویرایش دستی + تقویم استراتژیک ۶۰ روزه استوری‌ها</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Feed Posts vs Stories Strategy */}
        <div className="flex items-center rounded-2xl bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('feed_posts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'feed_posts'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>پست‌های اسلایدی فید</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stories_strategy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stories_strategy'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>تقویم ۶۰ روزه استوری‌ها</span>
          </button>
        </div>
      </header>

      {/* ── TAB 1: FEED CAROUSEL POSTS STUDIO ── */}
      {activeTab === 'feed_posts' && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
          {/* Left Column: Live Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-4">
            {isExporting && (
              <div className="w-full p-2.5 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-200 text-xs font-bold text-center animate-pulse">
                ⏳ {exportProgress}
              </div>
            )}

            {/* Post Selection Quick Bar */}
            <div className="w-full bg-[#0d1322] border border-slate-800/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>انتخاب پست (از میان ۲۲ پست آماده):</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      categoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    همه ({posts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('launch')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      categoryFilter === 'launch' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    رونمایی
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('demo')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      categoryFilter === 'demo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    اکانت دمو
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('content')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                      categoryFilter === 'content' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    محتوایی (۲۰)
                  </button>
                </div>
              </div>

              <select
                value={activePostIndex}
                onChange={(e) => {
                  sounds.playPop();
                  setActivePostIndex(Number(e.target.value));
                  setActiveSlideIndex(0);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
              >
                {filteredPosts.map((p) => {
                  const globalIdx = posts.findIndex((item) => item.id === p.id);
                  return (
                    <option key={p.id} value={globalIdx}>
                      {p.tag} • {p.title}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Scale Controller */}
            <div className="flex items-center justify-between w-full px-2 text-xs text-slate-400">
              <span className="font-bold text-[11px]">پیش‌نمایش زنده پست اینستاگرام:</span>
              <div className="flex items-center gap-1">
                <span>اندازه نمایش:</span>
                {[0.75, 0.85, 1.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setZoomScale(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      zoomScale === s ? 'bg-slate-700 text-white font-black' : 'hover:bg-slate-800'
                    }`}
                  >
                    {s === 0.85 ? '۸۵٪ (استاندارد)' : `${s * 100}٪`}
                  </button>
                ))}
              </div>
            </div>

            {/* Balanced Scaled Canvas Container */}
            <div className="w-full flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-[#090d18] border border-slate-800/80 shadow-2xl overflow-hidden min-h-[460px]">
              <div
                style={{
                  width: '380px',
                  height: aspectRatio === 'portrait' ? '475px' : '380px',
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease, height 0.2s ease',
                }}
                className="relative rounded-3xl shadow-2xl flex-shrink-0"
              >
                <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-700/60 shadow-inner">
                  {renderSlideContent(activeSlideIndex)}
                </div>
              </div>
            </div>

            {/* 4-Slide Navigation */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sounds.playPop();
                    setActiveSlideIndex(idx);
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeSlideIndex === idx
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => setActiveSlideIndex(Math.min(3, activeSlideIndex + 1))}
                disabled={activeSlideIndex === 3}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Position Indicator */}
            <div className="grid grid-cols-4 gap-2 w-full pt-1">
              {['کاور و قلاب', 'شرح موضوع', 'راهکار بَگ‌تایم', 'نتیجه و اقدام'].map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveSlideIndex(idx);
                  }}
                  className={`p-2 rounded-2xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                    activeSlideIndex === idx
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-[#0d1322] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-black text-xs">اسلاید {idx + 1}</div>
                  <div className="text-[10px] opacity-75">{step}</div>
                </button>
              ))}
            </div>

            {/* Quality Selector */}
            <div className="flex items-center justify-between w-full px-3 py-2 bg-[#0d1322] rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                <span>کیفیت رندر و دانلود:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportQuality('4k')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    exportQuality === '4k'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💎 4K اولترا HD (۲۱۶۰p)
                </button>
                <button
                  type="button"
                  onClick={() => setExportQuality('hd')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    exportQuality === 'hd'
                      ? 'bg-slate-700 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ۱۰۸۰p رتینا
                </button>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3 w-full pt-1">
              <button
                type="button"
                onClick={handleExportSingleSlide}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>دانلود اسلاید ({exportQuality === '4k' ? '4K PNG' : 'PNG'})</span>
              </button>

              <button
                type="button"
                onClick={handleExportAllSlidesZip}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-4 h-4" />
                <span>دانلود زیپ ۴ اسلاید ({exportQuality === '4k' ? '4K' : 'ZIP'})</span>
              </button>
            </div>
          </div>

          {/* Right Column: Manual Editor / Settings / Caption Tabs */}
          <div className="lg:col-span-5 space-y-4">
            {/* Panel Mode Switcher */}
            <div className="flex items-center rounded-2xl bg-[#0d1322] p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setRightPanelTab('edit')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'edit'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✏️ ویرایش دستی اسلایدها</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('settings')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>🎨 استایل و قالب</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('caption')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'caption'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>کپشن</span>
              </button>
            </div>

            {/* TAB: EDIT SLIDE CONTENT */}
            {rightPanelTab === 'edit' && (
              <div className="p-4 sm:p-5 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span>ویرایش دستی اسلاید {activeSlideIndex + 1} از ۴</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleResetCurrentPost}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>بازنشانی به پیش‌فرض</span>
                  </button>
                </div>

                {/* Slide Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeSlideIndex === idx
                          ? 'bg-emerald-600 text-white font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      اسلاید {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Badge Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">نشان یا برچسب بالای اسلاید (Badge):</label>
                  <input
                    type="text"
                    value={activeSlide.badge || ''}
                    onChange={(e) => handleUpdateActiveSlide('badge', e.target.value)}
                    placeholder="مثال: 🚀 امکانات کلیدی"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Title Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">عنوان اصلی اسلاید (Title):</label>
                  <input
                    type="text"
                    value={activeSlide.title || ''}
                    onChange={(e) => handleUpdateActiveSlide('title', e.target.value)}
                    placeholder="عنوان بزرگ اسلاید..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Subtitle Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">زیرعنوان یا توضیح کوتاه (Subtitle):</label>
                  <input
                    type="text"
                    value={activeSlide.subtitle || ''}
                    onChange={(e) => handleUpdateActiveSlide('subtitle', e.target.value)}
                    placeholder="توضیح تکمیلی زیر عنوان..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Body Points (Textarea) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">متن و نکات بدنه اسلاید (هر خط = یک نکته بولت):</label>
                    <span className="text-[9px] text-slate-500">با اینتر خط جدید ایجاد کنید</span>
                  </div>
                  <textarea
                    rows={4}
                    value={activeSlide.bodyText || ''}
                    onChange={(e) => handleUpdateActiveSlide('bodyText', e.target.value)}
                    placeholder="نکته اول&#10;نکته دوم&#10;نکته سوم"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 leading-relaxed outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Highlight Box */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">باکس برجسته / کال تو اکشن پایین اسلاید:</label>
                  <input
                    type="text"
                    value={activeSlide.highlightBox || ''}
                    onChange={(e) => handleUpdateActiveSlide('highlightBox', e.target.value)}
                    placeholder="مثال: کلمه «دمو» را به دایرکت @bagtime_app بفرستید"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Top Handle for this slide */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">آیدی بالای اسلاید (Top Handle):</label>
                    <span className="text-[9px] text-slate-500">خالی بگذارید تا پنهان شود</span>
                  </div>
                  <input
                    type="text"
                    value={activeSlide.topHandle !== undefined ? activeSlide.topHandle : customHandle}
                    onChange={(e) => handleUpdateActiveSlide('topHandle', e.target.value)}
                    placeholder="مثال: @bagtime_app یا خالی"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>

                {/* Footer Right Text */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">متن سمت راست پاورقی (Footer Right):</label>
                    <span className="text-[9px] text-slate-500">متن برند یا نام دلخواه یا خالی</span>
                  </div>
                  <input
                    type="text"
                    value={activeSlide.footerRightText !== undefined ? activeSlide.footerRightText : (showFooterBranding ? `${footerPrefix} ${footerCompany}` : '')}
                    onChange={(e) => handleUpdateActiveSlide('footerRightText', e.target.value)}
                    placeholder="مثال: بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه یا خالی"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Footer Left Note */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">متن سمت چپ پاورقی (Footer Left Note):</label>
                    <span className="text-[9px] text-slate-500">نکته یا آیدی یا خالی</span>
                  </div>
                  <input
                    type="text"
                    value={activeSlide.footerNote !== undefined ? activeSlide.footerNote : ''}
                    onChange={(e) => handleUpdateActiveSlide('footerNote', e.target.value)}
                    placeholder="مثال: ورق بزنید ‹ یا آیدی دلخواه یا خالی"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-400 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>تغییرات به صورت آنی در پیش‌نمایش اعمال شده و برای دانلود ذخیره می‌گردند.</span>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS & STYLES */}
            {rightPanelTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Custom Handle Configuration */}
                <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <AtSign className="w-4 h-4 text-emerald-400" />
                    <span>آیدی پیج اینستاگرام (Handle)</span>
                  </span>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => handleUpdateHandle(e.target.value)}
                    placeholder="@bagtime_app"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400 leading-normal block">
                    این آیدی روی اسلایدها و استوری‌ها نمایش داده می‌شود و می‌توانید به دلخواه خود تغییر دهید.
                  </span>
                </div>

                {/* Font Selector */}
                <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-emerald-400" />
                      <span>فونت اسلایدها</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsFontModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>آپلود فونت جدید</span>
                    </button>
                  </div>

                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {allAvailableFonts.map((f) => (
                      <option key={f.id} value={f.family || f.id}>
                        {f.name} {f.id === systemFont ? '(پیش‌فرض سامانه)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>ابعاد و نسبت اسلایدها</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('portrait')}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 border ${
                        aspectRatio === 'portrait'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>عمودی اینستاگرام (۴:۵)</span>
                      <span className="text-[9px] opacity-70">1080 × 1350 پیکسل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAspectRatio('square')}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 border ${
                        aspectRatio === 'square'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>مربعی کلاسیک (۱:۱)</span>
                      <span className="text-[9px] opacity-70">1080 × 1080 پیکسل</span>
                    </button>
                  </div>
                </div>

                {/* Theme & Palette */}
                <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>تم و رنگ‌بندی اسلایدها</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSlideTheme('light')}
                      className={`py-2 px-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        slideTheme === 'light'
                          ? 'bg-white text-slate-900 border-white font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      ☀️ لایت بَگ‌تایم
                    </button>

                    <button
                      type="button"
                      onClick={() => setSlideTheme('dark')}
                      className={`py-2 px-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        slideTheme === 'dark'
                          ? 'bg-slate-800 text-white border-emerald-500 font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      🌙 آبزیدین دارک
                    </button>

                    <button
                      type="button"
                      onClick={() => setSlideTheme('indigo')}
                      className={`py-2 px-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        slideTheme === 'indigo'
                          ? 'bg-indigo-900 text-white border-indigo-400 font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      🔮 نیلی متالیک
                    </button>

                    <button
                      type="button"
                      onClick={() => setSlideTheme('emerald')}
                      className={`py-2 px-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        slideTheme === 'emerald'
                          ? 'bg-emerald-950 text-white border-emerald-400 font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      🍃 سبز زمردی
                    </button>
                  </div>
                </div>

                {/* Handles & Footer Toggles */}
                <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">نمایش آیدی پیج در بالا ({customHandle})</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHandles}
                        onChange={(e) => setShowHandles(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-300">نمایش نوار پاورقی اسلایدها</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooter}
                        onChange={(e) => setShowFooter(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-300">پاورقی برند ({footerCompany})</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooterBranding}
                        onChange={(e) => setShowFooterBranding(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAPTION */}
            {rightPanelTab === 'caption' && (
              <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>متن کپشن اختصاصی این پست (قابل ویرایش)</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCaption ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'کپی شد' : 'کپی متن کپشن'}</span>
                  </button>
                </div>

                <textarea
                  rows={10}
                  value={currentPost.caption}
                  onChange={(e) => handleUpdateActiveCaption(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed outline-none focus:border-amber-500 font-sans"
                  dir="rtl"
                />

                <span className="text-[10px] text-slate-500 block">
                  می‌توانید کپشن را مستقیماً ویرایش کرده و سپس دکمه کپی را بزنید.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: 60-DAY INSTAGRAM STORIES STRATEGY ── */}
      {activeTab === 'stories_strategy' && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-black border border-purple-500/30">
                <Calendar className="w-3.5 h-3.5" />
                <span>برنامه استراتژیک ۶۰ روزه استوری‌ها (۱۸۰ استوری کامل)</span>
              </div>
              <h2 className="text-xl font-black text-white">۳ استوری اختصاصی در هر روز • چرخه ۶ روزه فیچرها</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                هر روز شامل ۳ استوری هدفمند (۱۰:۰۰ صبح قلاب، ۱۴:۰۰ ظهر آموزش و نمایش ویژگی، ۱۹:۰۰ عصر اقدام و دایرکت به {customHandle}) است. تمامی استوری‌ها قابل ویرایش دستی هستند.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-400">{publishedDays.length} / ۶۰</div>
                <div className="text-[10px] text-slate-400 font-bold">روزهای منتشر شده</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <div className="text-2xl font-black text-purple-400">{Math.round((publishedDays.length / 60) * 100)}٪</div>
                <div className="text-[10px] text-slate-400 font-bold">پیشرفت کل</div>
              </div>
            </div>
          </div>

          {/* Quick Day Selector (1 to 60) */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span>انتخاب روز انتشار:</span>
                <span className="text-purple-400 font-black">روز {selectedStoryDay}</span>
              </span>

              <div className={`px-3 py-1 rounded-xl text-xs font-black border ${currentStoryDayData.cycleColor}`}>
                {currentStoryDayData.cycleName}
              </div>
            </div>

            {/* 60 Days Scrollable Grid */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {stories60Days.map((d) => {
                const isPublished = publishedDays.includes(d.day);
                const isSelected = selectedStoryDay === d.day;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedStoryDay(d.day);
                      setEditingStorySlot(null);
                    }}
                    className={`flex-shrink-0 w-11 h-11 rounded-2xl font-black text-xs transition-all relative flex flex-col items-center justify-center cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-lg scale-105 ring-2 ring-purple-400'
                        : isPublished
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{d.day}</span>
                    {isPublished && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Scheduled Stories for the Selected Day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Story 1: Morning Hook (10:00) */}
            <div className={`p-5 rounded-3xl bg-[#0d1322] border transition-all ${
              activeStorySlot === 1 ? 'border-purple-500 shadow-xl ring-1 ring-purple-500' : 'border-slate-800'
            } space-y-3.5 flex flex-col justify-between`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    استوری ۱ • ساعت ۱۰:۰۰ صبح
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingStorySlot(editingStorySlot === 1 ? null : 1)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-400" />
                      <span>{editingStorySlot === 1 ? 'بستن ویرایش' : 'ویرایش'}</span>
                    </button>
                  </div>
                </div>

                {editingStorySlot === 1 ? (
                  <div className="space-y-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-right">
                    <label className="text-[10px] font-bold text-slate-400">قلاب و عنوان:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story1.hook || ''}
                      onChange={(e) => handleUpdateStorySlot(1, 'hook', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none"
                    />
                    <label className="text-[10px] font-bold text-slate-400">متن استوری:</label>
                    <textarea
                      rows={4}
                      value={currentStoryDayData.story1.body || ''}
                      onChange={(e) => handleUpdateStorySlot(1, 'body', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none leading-relaxed"
                    />
                    <label className="text-[10px] font-bold text-slate-400">پیشنهاد استیکر:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story1.sticker || ''}
                      onChange={(e) => handleUpdateStorySlot(1, 'sticker', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-amber-300 outline-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleResetStorySlot(1)}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        بازنشانی به پیش‌فرض
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStorySlot(null)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        تایید ویرایش
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-white">{currentStoryDayData.story1.hook}</h3>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                      {currentStoryDayData.story1.body}
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 font-bold">
                      💡 استیکر تعاملی: {currentStoryDayData.story1.sticker}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStorySlot(1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  پیش‌نمایش گرافیکی
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStoryText(1, `${currentStoryDayData.story1.hook}\n\n${currentStoryDayData.story1.body}`)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedStoryText === 'story_1' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStoryText === 'story_1' ? 'کپی شد' : 'کپی متن استوری ۱'}</span>
                </button>
              </div>
            </div>

            {/* Story 2: Afternoon Demo & Education (14:00) */}
            <div className={`p-5 rounded-3xl bg-[#0d1322] border transition-all ${
              activeStorySlot === 2 ? 'border-purple-500 shadow-xl ring-1 ring-purple-500' : 'border-slate-800'
            } space-y-3.5 flex flex-col justify-between`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    استوری ۲ • ساعت ۱۴:۰۰ ظهر
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingStorySlot(editingStorySlot === 2 ? null : 2)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-400" />
                      <span>{editingStorySlot === 2 ? 'بستن ویرایش' : 'ویرایش'}</span>
                    </button>
                  </div>
                </div>

                {editingStorySlot === 2 ? (
                  <div className="space-y-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-right">
                    <label className="text-[10px] font-bold text-slate-400">عنوان آموزش:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story2.title || ''}
                      onChange={(e) => handleUpdateStorySlot(2, 'title', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none"
                    />
                    <label className="text-[10px] font-bold text-slate-400">متن استوری:</label>
                    <textarea
                      rows={4}
                      value={currentStoryDayData.story2.body || ''}
                      onChange={(e) => handleUpdateStorySlot(2, 'body', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none leading-relaxed"
                    />
                    <label className="text-[10px] font-bold text-slate-400">توصیه تصویر و دمو:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story2.sticker || ''}
                      onChange={(e) => handleUpdateStorySlot(2, 'sticker', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-emerald-300 outline-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleResetStorySlot(2)}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        بازنشانی به پیش‌فرض
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStorySlot(null)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        تایید ویرایش
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-white">{currentStoryDayData.story2.title}</h3>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                      {currentStoryDayData.story2.body}
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 font-bold">
                      📱 توصیه تصویر: {currentStoryDayData.story2.sticker}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStorySlot(2)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  پیش‌نمایش گرافیکی
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStoryText(2, `${currentStoryDayData.story2.title}\n\n${currentStoryDayData.story2.body}`)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedStoryText === 'story_2' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStoryText === 'story_2' ? 'کپی شد' : 'کپی متن استوری ۲'}</span>
                </button>
              </div>
            </div>

            {/* Story 3: Evening CTA & Direct (19:00) */}
            <div className={`p-5 rounded-3xl bg-[#0d1322] border transition-all ${
              activeStorySlot === 3 ? 'border-purple-500 shadow-xl ring-1 ring-purple-500' : 'border-slate-800'
            } space-y-3.5 flex flex-col justify-between`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    استوری ۳ • ساعت ۱۹:۰۰ عصر
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingStorySlot(editingStorySlot === 3 ? null : 3)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-400" />
                      <span>{editingStorySlot === 3 ? 'بستن ویرایش' : 'ویرایش'}</span>
                    </button>
                  </div>
                </div>

                {editingStorySlot === 3 ? (
                  <div className="space-y-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-right">
                    <label className="text-[10px] font-bold text-slate-400">جمع‌بندی و نتیجه:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story3.conclusion || ''}
                      onChange={(e) => handleUpdateStorySlot(3, 'conclusion', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none"
                    />
                    <label className="text-[10px] font-bold text-slate-400">دعوت به اقدام (CTA):</label>
                    <textarea
                      rows={4}
                      value={currentStoryDayData.story3.ctaText || ''}
                      onChange={(e) => handleUpdateStorySlot(3, 'ctaText', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-white outline-none leading-relaxed"
                    />
                    <label className="text-[10px] font-bold text-slate-400">آیدی دایرکت پیج:</label>
                    <input
                      type="text"
                      value={currentStoryDayData.story3.handles || customHandle}
                      onChange={(e) => handleUpdateStorySlot(3, 'handles', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-indigo-300 outline-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleResetStorySlot(3)}
                        className="text-[10px] text-rose-400 hover:text-rose-300"
                      >
                        بازنشانی به پیش‌فرض
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStorySlot(null)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                      >
                        تایید ویرایش
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-white">{currentStoryDayData.story3.conclusion}</h3>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                      {currentStoryDayData.story3.ctaText}
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300 font-bold">
                      📩 هدایت دایرکت به پیج: {currentStoryDayData.story3.handles || customHandle}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStorySlot(3)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  پیش‌نمایش گرافیکی
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStoryText(3, `${currentStoryDayData.story3.conclusion}\n\n${currentStoryDayData.story3.ctaText}\n\n${currentStoryDayData.story3.handles || customHandle}`)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedStoryText === 'story_3' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStoryText === 'story_3' ? 'کپی شد' : 'کپی متن استوری ۳'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Story Visual Studio Controls & Live 9:16 Scaled Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Visual Customizer (Theme, Mockup, Footer) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Story Theme Selector */}
              <div className="p-5 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>تم رنگ‌بندی استوری</span>
                  </span>
                  <span className="text-[10px] text-slate-400">تغییر زنده رنگ پس‌زمینه و کارت‌ها</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => { sounds.playPop(); setStoryTheme('dark'); }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      storyTheme === 'dark'
                        ? 'bg-slate-800 text-purple-400 border-purple-500 shadow-md ring-2 ring-purple-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🌙 دارک
                  </button>

                  <button
                    type="button"
                    onClick={() => { sounds.playPop(); setStoryTheme('light'); }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      storyTheme === 'light'
                        ? 'bg-white text-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ☀️ لایت
                  </button>

                  <button
                    type="button"
                    onClick={() => { sounds.playPop(); setStoryTheme('indigo'); }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      storyTheme === 'indigo'
                        ? 'bg-indigo-900 text-amber-300 border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🔮 نیلی
                  </button>

                  <button
                    type="button"
                    onClick={() => { sounds.playPop(); setStoryTheme('emerald'); }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      storyTheme === 'emerald'
                        ? 'bg-emerald-900 text-emerald-300 border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🍃 زمردی
                  </button>

                  <button
                    type="button"
                    onClick={() => { sounds.playPop(); setStoryTheme('sunset'); }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      storyTheme === 'sunset'
                        ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-md ring-2 ring-rose-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🌅 سان‌ست
                  </button>
                </div>
              </div>

              {/* Automated & Custom System Feature Screenshot Mockup */}
              <div className="p-5 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>اسکرین‌شات و موکاپ سامانه در استوری</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] text-slate-400">نمایش موکاپ:</span>
                    <input
                      type="checkbox"
                      checked={showStoryMockup}
                      onChange={(e) => setShowStoryMockup(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                  </label>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  سامانه بر اساس چرخه آموزشی روز ({currentStoryDayData.cycleName})، به صورت خودکار موکاپ زنده و گرافیکی بخش مربوطه (پلنر ساعتی، تحلیلگر عادت‌ها، افزونه تب، اتاق تمرکز، بات بله) را درون استوری قرار می‌دهد؛ همچنین می‌توانید در صورت تمایل اسکرین‌شات اختصاصی خود را بارگذاری کنید.
                </p>

                {/* Custom Upload or Reset */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <input
                    type="file"
                    ref={storyFileInputRef}
                    accept="image/*"
                    onChange={handleStoryScreenshotUpload}
                    className="hidden"
                  />

                  {customStoryScreenshot ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اسکرین‌شات اختصاصی فعال است</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStoryScreenshot(null);
                          if (storyFileInputRef.current) storyFileInputRef.current.value = '';
                          sounds.playPop();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-rose-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف و بازگشت به موکاپ خودکار</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => storyFileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 بارگذاری اسکرین‌شات اختصاصی سامانه</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Story Footer Customizer & Toggle */}
              <div className="p-5 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>نوار پاورقی استوری (Footer)</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] text-slate-400">{showStoryFooter ? 'نمایش داده می‌شود' : 'مخفی (حذف شده)'}</span>
                    <input
                      type="checkbox"
                      checked={showStoryFooter}
                      onChange={(e) => setShowStoryFooter(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                  </label>
                </div>

                {!showStoryFooter ? (
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                    💡 پاورقی زیر استوری هم‌اکنون غیرفعال است و هیچ متن اضافه‌ای در پایین استوری چاپ نمی‌شود (دقیقاً مطابق درخواست شما). در صورت تمایل می‌توانید تیک بالا را بزنید تا فعال گردد.
                  </p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">متن سمت راست پاورقی استوری:</label>
                      <input
                        type="text"
                        value={storyFooterRight}
                        onChange={(e) => setStoryFooterRight(e.target.value)}
                        placeholder={`${footerPrefix} ${footerCompany}`}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">آیدی سمت چپ پاورقی استوری:</label>
                      <input
                        type="text"
                        value={storyFooterLeft}
                        onChange={(e) => setStoryFooterLeft(e.target.value)}
                        placeholder={customHandle}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-purple-300 font-mono outline-none focus:border-purple-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Scaled 9:16 Story Preview & Quick Slot Switcher */}
            <div className="lg:col-span-6 flex flex-col items-center space-y-4">
              {/* Slot Switcher Tabs */}
              <div className="flex items-center justify-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => { sounds.playPop(); setActiveStorySlot(1); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStorySlot === 1
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  استوری ۱ (۱۰:۰۰)
                </button>
                <button
                  type="button"
                  onClick={() => { sounds.playPop(); setActiveStorySlot(2); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStorySlot === 2
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  استوری ۲ (۱۴:۰۰)
                </button>
                <button
                  type="button"
                  onClick={() => { sounds.playPop(); setActiveStorySlot(3); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeStorySlot === 3
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  استوری ۳ (۱۹:۰۰)
                </button>
              </div>

              {/* Realistic 9:16 Phone Mock Frame for 1:1 Live Preview */}
              <div className="w-[320px] h-[568px] rounded-[32px] overflow-hidden border-4 border-slate-700/80 shadow-2xl relative bg-black flex flex-col">
                <div className="flex-1 w-full h-full overflow-hidden">
                  {renderStoryContent(activeStorySlot)}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-bold text-center">
                پیش‌نمایش زنده و واقعی استوری شماره {activeStorySlot} با تم {storyTheme === 'light' ? 'لایت سفید' : storyTheme === 'indigo' ? 'نیلی متالیک' : storyTheme === 'emerald' ? 'سبز زمردی' : storyTheme === 'sunset' ? 'سان‌ست رز' : 'دارک آبزیدین'}
              </div>
            </div>
          </div>

          {/* Story Visual Graphic Generator & Downloader (9:16 Aspect) */}
          <div className="p-6 rounded-3xl bg-[#0d1322] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-right">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Sparkles className="w-4 h-4" />
                <span>رندر استوری گرافیکی ۹:۱۶ اینستاگرام (کیفیت 4K Ultra HD)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                می‌توانید استوری شماره {activeStorySlot} امروز (روز {selectedStoryDay}) را با کیفیت شفاف 4K (۲۱۶۰ × ۳۸۴۰ پیکسل) مستقیماً به صورت تصویر PNG دانلود کرده و در پیج استوری بگذارید. تمام متن‌های ویرایش‌شده شما در تصویر نهایی اعمال می‌شوند.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Quality Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportQuality('4k')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    exportQuality === '4k'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💎 4K اولترا HD
                </button>
                <button
                  type="button"
                  onClick={() => setExportQuality('hd')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    exportQuality === 'hd'
                      ? 'bg-slate-700 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ۱۰۸۰p رتینا
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleDayPublished(selectedStoryDay)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  publishedDays.includes(selectedStoryDay)
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{publishedDays.includes(selectedStoryDay) ? 'منتشر شده ✅' : 'ثبت به عنوان منتشر شده'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportStoryImage}
                disabled={isExporting}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>دانلود استوری {exportQuality === '4k' ? 'با کیفیت 4K' : '۱۰۸۰p'} (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NATIVE UNTRANSFORMED OFF-SCREEN RENDER CONTAINERS (0% ERROR - IDENTICAL TO PREVIEW) ── */}
      {/* 1. Feed Slides Off-screen Container */}
      <div
        ref={exportContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '380px',
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            id={`clean-slide-${idx}`}
            style={{
              width: '380px',
              height: aspectRatio === 'portrait' ? '475px' : '380px',
              overflow: 'hidden',
            }}
          >
            {renderSlideContent(idx)}
          </div>
        ))}
      </div>

      {/* 2. Story 9:16 Off-screen Render Container (360x640, scaled to 2160x3840 4K UHD during capture) */}
      <div
        ref={storyExportRef}
        data-story-export="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '360px',
          height: '640px',
          pointerEvents: 'none',
        }}
      >
        {renderStoryContent(activeStorySlot)}
      </div>

      {/* Font Upload Modal */}
      <FontSelectorModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
    </div>
  );
};
