import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
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
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { FontSelectorModal } from './FontSelectorModal';

type StudioTab = 'feed_posts' | 'stories_strategy';
type SlideTheme = 'light' | 'dark' | 'indigo' | 'emerald';
type AspectRatio = 'portrait' | 'square'; // portrait: 1080x1350 (4:5), square: 1080x1080 (1:1)

interface SlideData {
  badge: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  footerNote?: string;
}

interface PostDefinition {
  id: string;
  category: 'content' | 'launch' | 'demo';
  tag: string;
  title: string;
  caption: string;
  slides: [SlideData, SlideData, SlideData, SlideData];
}

interface StoryDayPlan {
  day: number;
  cycleName: string;
  cycleColor: string;
  focusFeature: string;
  story1: {
    time: string;
    type: string;
    sticker: string;
    hook: string;
    body: string;
    action: string;
  };
  story2: {
    time: string;
    type: string;
    sticker: string;
    title: string;
    body: string;
    demoNote: string;
  };
  story3: {
    time: string;
    type: string;
    sticker: string;
    conclusion: string;
    ctaText: string;
    handles: string;
  };
}

export const InstagramSlidesStudio: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    allAvailableFonts,
    systemFont,
    globalSettings,
    customFonts,
  } = useTask();

  const [activeTab, setActiveTab] = useState<StudioTab>('feed_posts');

  // Feed Posts State
  const [activePostIndex, setActivePostIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('light');
  const [selectedFont, setSelectedFont] = useState<string>(systemFont || 'vazirmatn');
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>(true);
  const [showHandles, setShowHandles] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'content' | 'launch' | 'demo'>('all');

  // 60-Day Story Strategy State
  const [selectedStoryDay, setSelectedStoryDay] = useState<number>(1);
  const [activeStorySlot, setActiveStorySlot] = useState<1 | 2 | 3>(1);
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

  // ── 22 Ready-to-Use 4-Slide Instagram Posts ──
  const posts: PostDefinition[] = [
    // 1. Official Launch Co-branded
    {
      id: 'launch-official',
      category: 'launch',
      tag: '🚀 پست ویژه: رونمایی رسمی',
      title: 'رونمایی رسمی از سامانه هوشمند بَگ‌تایم',
      caption: `🎉 آغاز رسمی فصلی نو در مدیریت زمان و بهره‌وری فردی و سازمانی!

با افتخار، سامانه هوشمند «بَگ‌تایم (Bag Time)» ثمره همکاری تیم‌های خلاق و توسعه نگاه مدیا (@negahmedia.co) و بگ‌تایم (@bagtime_app) رونمایی شد. 🚀

🔹 دیلی پلنر ساعتی با تکنیک اصولی Time Blocking
🔹 تحلیلگر موانع و عادت‌های بازدارنده (AI Habits)
🔹 افزونه اختصاصی تب جدید مرورگر با ورود یکپارچه (SSO)
🔹 اتاق‌های تمرکز زنده و پومودورو گروهی با موزیک تمرکز
🔹 اتصال مستقیم و ثبت‌نام ۱ کلیکی با ربات بله

📱 همین حالا برای شروع تجربه نظم واقعی به لینک بایو @bagtime_app مراجعه کنید یا کلمه «بگ تایم» را دایرکت دهید!

@bagtime_app
@negahmedia.co

#رونمایی #بگ_تایم #نگاه_مدیا #کیان_فناوران_نگاه #مدیریت_زمان #بهره_وری #تکنولوژی`,
      slides: [
        {
          badge: '🚀 رونمایی رسمی',
          title: 'سامانه بَگ‌تایم متولد شد؛ کنترل روزهایت را پس بگیر!',
          subtitle: 'همکاری رسمی و مشترک نگاه مدیا (@negahmedia.co) و بَگ‌تایم (@bagtime_app)',
          content: (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-xs font-bold leading-relaxed">
                پلتفرمی که فراتر از یک تو-دو لیست معمولی است؛ ابزاری مدرن برای بلوک‌بندی ساعتی، ریشه‌یابی تعویق کارها و تمرکز عمیق فردی و تیمی.
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-500">
                <span>@bagtime_app</span>
                <span>✖️</span>
                <span>@negahmedia.co</span>
              </div>
            </div>
          ),
          footerNote: 'ورق بزنید تا با قابلیت‌ها آشنا شوید ‹',
        },
        {
          badge: '✨ امکانات کلیدی',
          title: 'هسته‌ای هوشمند برای روزهای پرمشغله',
          content: (
            <div className="space-y-2 text-xs font-bold">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <span>⏰</span>
                <span>دیلی پلنر ساعتی با نشانگر زنده زمان فعلی</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                <span>🧠</span>
                <span>تحلیلگر عادت‌ها: کشف دلیل انجام نشدن کارها</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                <span>🌐</span>
                <span>افزونه تب جدید مرورگر با ورود یکپارچه SSO</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <span>🎧</span>
                <span>اتاق‌های تمرکز زنده و پومودورو گروهی</span>
              </div>
            </div>
          ),
        },
        {
          badge: '💻 نگاه مدیا و توسعه',
          title: 'طراحی شده بر پایه روانشناسی کار عمیق',
          content: (
            <div className="space-y-2.5 text-xs leading-relaxed font-bold">
              <p>
                تیم نگاه مدیا با شناخت چالش‌های تمرکز در عصر هوش مصنوعی و حواس‌پرتی‌های دیجیتال، محیطی مینیمال و سریع آفریده است.
              </p>
              <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 space-y-1">
                <div className="text-[11px] font-black text-emerald-500">✅ بدون پیچیدگی و سردرگمی</div>
                <div className="text-[10px] text-slate-400">ساده برای افراد تازه‌کار، قدرتمند برای مدیران و فریلنسرها</div>
              </div>
            </div>
          ),
        },
        {
          badge: '🎯 شروع و همراهی',
          title: 'از همین امروز منظم‌تر و موفق‌تر زندگی کن!',
          content: (
            <div className="space-y-3 text-center">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md">
                کلمه «بگ تایم» را به دایرکت پیج بفرستید تا لینک ورود مستقیم را دریافت کنید ✌️
              </div>
              <div className="text-[11px] font-bold text-slate-400">
                دنبال کنید: @bagtime_app • @negahmedia.co
              </div>
            </div>
          ),
          footerNote: 'بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه',
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

برای دسترسی به اکانت دموی سازمان و نسخه ویژه:
کلمه «دمو» یا «بگ‌تایم» رو به دایرکت @bagtime_app یا @negahmedia.co بفرستید تا دسترسی تست براتون فعال بشه!

🔹 تست نامحدود اتاق‌های پومودورو
🔹 فعال‌سازی افزونه نیوتَب مرورگر
🔹 آنالیز اختصاصی عادت‌های کاری شما

@bagtime_app
@negahmedia.co

#اکانت_دمو #تست_رایگان #بگ_تایم #نرم_افزار #پلنر #تمرکز`,
      slides: [
        {
          badge: '⭐ تست رایگان',
          title: 'فرصت ویژه: دریافت اکانت دمو بَگ‌تایم!',
          subtitle: 'دسترسی کامل به تمام امکانات نسخه Pro بدون پرداخت هزینه',
          content: (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs font-bold text-right">
              <div>🎁 اگر می‌خواهید سیستم مدیریت کارها و پلنر ساعتی را به صورت عملی تست کنید، اکانت دمو در اختیار شماست.</div>
              <div className="text-amber-500 font-black">ظرفیت تست آزمایشی محدود است!</div>
            </div>
          ),
          footerNote: 'شرایط دریافت در اسلایدهای بعد ‹',
        },
        {
          badge: '💎 چه امکاناتی در دمو فعاله؟',
          title: 'آزمایش تمام ابزارهای نسخه پیشرفته',
          content: (
            <div className="space-y-2 text-xs font-bold text-right">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>تسک‌گذاری نامحدود با اولویت‌بندی هوشمند</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>حضور در اتاق‌های تمرکز گروهی پومودورو</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>اتصال افزونه نیوتَب مرورگر به حساب شما</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                <span>تحلیل ریشه‌ای موانع و اهمال‌کاری‌ها</span>
              </div>
            </div>
          ),
        },
        {
          badge: '📩 چطور اکانت دمو بگیریم؟',
          title: 'فقط یک پیام ساده در دایرکت!',
          content: (
            <div className="space-y-3 text-right text-xs font-bold">
              <p>کافیه وارد دایرکت اینستاگرام یکی از دو پیج زیر بشی و کلمه <span className="text-emerald-500 font-black">«دمو»</span> رو بفرستی:</p>
              <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 space-y-1.5 font-mono text-center">
                <div className="text-indigo-400 font-bold">@bagtime_app</div>
                <div className="text-slate-400 font-bold">@negahmedia.co</div>
              </div>
              <div className="text-[11px] text-slate-400">کد ورود اختصاصی بلافاصله براتون ارسال میشه.</div>
            </div>
          ),
        },
        {
          badge: '⚡ دعوت به اقدام',
          title: 'امروز شروع کن، فردایت منظم‌تر خواهد بود',
          content: (
            <div className="space-y-3 text-center">
              <div className="p-4 rounded-3xl bg-[#0f172a] text-white font-black text-xs space-y-1.5 shadow-xl">
                <div className="text-amber-300">همین الان کلمه «دمو» رو دایرکت کن!</div>
                <div className="text-[10px] text-slate-300">پاسخگویی سریع توسط تیم پشتیبانی بگ‌تایم</div>
              </div>
            </div>
          ),
          footerNote: 'بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه',
        },
      ],
    },

    // 20 Content Posts
    ...Array.from({ length: 20 }, (_, i) => {
      const idx = i + 1;
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
        caption: `نکته کلیدی روز: ${curTitle} 🎯\n\nبرای ارتقای نظم فردی و برنامه‌ریزی هوشمند، سامانه بَگ‌تایم را رایگان امتحان کنید.\n\n@bagtime_app • @negahmedia.co\n#بگ_تایم #مدیریت_زمان #پلنر`,
        slides: [
          {
            badge: `✨ نکته شماره ${idx}`,
            title: curTitle,
            subtitle: 'گام‌های عملی برای ساختن روزهایی پربارتر و کم‌استرس‌تر',
            content: <p className="text-xs font-bold leading-relaxed">اصلاح عادت‌های کوچک روزانه، دستاوردهای بزرگ ماه‌های آینده را رقم می‌زند.</p>,
            footerNote: 'اسلاید بعد را بخوانید ‹',
          },
          {
            badge: '🔍 تحلیل موضوع',
            title: 'چرا باید این اصل را جدی بگیریم؟',
            content: <p className="text-xs font-bold leading-relaxed">انرژی اراده انسان محدود است؛ بدون یک ابزار پایدار، نظم پس از چند روز از بین می‌رود.</p>,
          },
          {
            badge: '⚡ راهکار بَگ‌تایم',
            title: 'پیاده‌سازی در زندگی روزمره',
            content: <p className="text-xs font-bold leading-relaxed">با اتصال تقویم، تایم‌لاین ساعتی و پومودورو، کارهایتان روی ریل موفقیت قرار می‌گیرد.</p>,
          },
          {
            badge: '🚀 اقدام فوری',
            title: 'همین حالا رایگان عضو شو',
            content: <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-center">دایرکت @bagtime_app یا @negahmedia.co کلمه «بگ‌تایم» رو بفرست!</div>,
            footerNote: 'بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه',
          },
        ] as [SlideData, SlideData, SlideData, SlideData],
      };
    }),
  ];

  // ── 60-Day Instagram Stories Database (180 Distinct Stories / 3 Daily) ──
  const storyCycles = [
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

  const generate60DaysPlan = (): StoryDayPlan[] => {
    return Array.from({ length: 60 }, (_, i) => {
      const dayNum = i + 1;
      const cycleIdx = Math.floor(i / 6);
      const cycle = storyCycles[cycleIdx] || storyCycles[0];

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
          sticker: 'باکس سوال (Question Box) یا دایرکت پیج‌ها',
          conclusion: `نتیجه روز ${dayNum}: امروز با بَگ‌تایم چقدر جلو افتادی؟`,
          ctaText: `برای دریافت دسترسی رایگان و شروع استفاده از ${cycle.name}: کلمه «بگ‌تایم» یا «دمو» رو به دایرکت بفرست! ✌️`,
          handles: '@bagtime_app • @negahmedia.co',
        },
      };
    });
  };

  const stories60Days = generate60DaysPlan();
  const currentStoryDayData = stories60Days[selectedStoryDay - 1] || stories60Days[0];

  const currentPost = posts[activePostIndex] || posts[0];

  const filteredPosts = posts.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

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

  // ── Robust Native Pixel HTML2Canvas Renderers (0% Transform Error) ──
  const handleExportSingleSlide = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    setExportProgress('در حال ایجاد خروجی رتینا بدون افت کیفیت...');
    sounds.playPop();

    try {
      const targetElement = exportContainerRef.current.querySelector<HTMLElement>(`#clean-slide-${activeSlideIndex}`);
      if (!targetElement) throw new Error('المان اسلاید یافت نشد.');

      const canvas = await html2canvas(targetElement, {
        scale: 1, // Target element is natively 1080px wide
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentPost.id}-slide-${activeSlideIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      sounds.playComplete();
    } catch (err) {
      console.error('Export error:', err);
      alert('خطا در خروجی تصویر. لطفاً مجدداً امتحان کنید.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleExportAllSlidesZip = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    sounds.playPop();

    const zip = new JSZip();

    try {
      for (let i = 0; i < 4; i++) {
        setExportProgress(`در حال رندر اسلاید ${i + 1} از ۴...`);
        const targetElement = exportContainerRef.current.querySelector<HTMLElement>(`#clean-slide-${i}`);
        if (!targetElement) continue;

        const canvas = await html2canvas(targetElement, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0f172a',
          logging: false,
        });

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          zip.file(`slide-${i + 1}.png`, blob);
        }
      }

      setExportProgress('در حال فشرده‌سازی در قالب فایل ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPost.id}-carousel-4slides.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sounds.playComplete();
    } catch (err) {
      console.error('Batch export error:', err);
      alert('خطا در خروجی فایل زیپ.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Export 9:16 Instagram Story Image
  const handleExportStoryImage = async () => {
    if (!storyExportRef.current || isExporting) return;
    setIsExporting(true);
    setExportProgress('در حال رندر استوری عمودی ۱۰۸۰×۱۹۲۰...');
    sounds.playPop();

    try {
      const canvas = await html2canvas(storyExportRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bagtime-story-day-${selectedStoryDay}-slot-${activeStorySlot}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      sounds.playComplete();
    } catch (err) {
      console.error('Story export error:', err);
      alert('خطا در خروجی استوری.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const getThemeClasses = (theme: SlideTheme) => {
    switch (theme) {
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

  // Render Slide Content (used for both Preview and Native Off-screen Export)
  const renderSlideContent = (slideIndex: number, isNativeExport: boolean = false) => {
    const s = currentPost.slides[slideIndex] || currentPost.slides[0];

    return (
      <div
        className={`w-full h-full flex flex-col justify-between ${
          isNativeExport ? 'p-16' : 'p-6 sm:p-8'
        } select-none relative overflow-hidden ${themeStyles.container}`}
        style={{ fontFamily: selectedFont || 'inherit' }}
        dir="rtl"
      >
        {/* Glow Decors */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={isNativeExport ? 42 : 26} />
            <span className={`font-black ${isNativeExport ? 'text-xl' : 'text-xs sm:text-sm'} tracking-tight flex items-center gap-1`}>
              <span>بَگ‌تایم</span>
              <span className={themeStyles.accentText}>.</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showHandles && (
              <span className={`${isNativeExport ? 'text-sm' : 'text-[10px]'} font-bold text-slate-400`}>
                @bagtime_app • @negahmedia.co
              </span>
            )}
            <span className={`${isNativeExport ? 'text-sm px-3 py-1' : 'text-[10px] px-2 py-0.5'} font-black rounded-full bg-slate-500/10 border border-slate-500/20`}>
              {slideIndex + 1} / ۴
            </span>
          </div>
        </div>

        {/* Middle Body */}
        <div className={`my-auto ${isNativeExport ? 'space-y-8 py-6' : 'space-y-4 py-2'} z-10 text-right`}>
          <div className={`inline-flex items-center gap-1.5 ${isNativeExport ? 'px-4 py-1.5 text-base' : 'px-2.5 py-1 text-[11px]'} font-black rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20`}>
            <span>{s.badge}</span>
          </div>

          <h2 className={`${isNativeExport ? 'text-3xl' : 'text-lg sm:text-xl'} font-black leading-snug`}>
            {s.title}
          </h2>

          {s.subtitle && (
            <p className={`${isNativeExport ? 'text-lg' : 'text-xs sm:text-[13px]'} font-bold leading-relaxed ${themeStyles.subtext}`}>
              {s.subtitle}
            </p>
          )}

          <div className={`${isNativeExport ? 'text-base pt-3' : 'pt-1'}`}>
            {s.content}
          </div>
        </div>

        {/* Bottom Footer of Slide */}
        <div className={`pt-3 border-t border-slate-500/10 flex items-center justify-between ${isNativeExport ? 'text-sm pt-5' : 'text-[10px]'} text-slate-400 z-10 flex-shrink-0`}>
          {showFooterBranding ? (
            <span>
              {footerPrefix} <strong>{footerCompany}</strong>
            </span>
          ) : (
            <span>@bagtime_app</span>
          )}

          <div className="flex items-center gap-1.5 font-bold">
            {s.footerNote ? (
              <span className="text-emerald-500">{s.footerNote}</span>
            ) : (
              <span>@negahmedia.co</span>
            )}
          </div>
        </div>
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
              <p className="text-[10px] text-slate-400">۲۲ پست اسلایدی فید + تقویم استراتژیک ۶۰ روزه استوری‌ها</p>
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
                <span className="text-[10px] ml-1">اندازه نمایش:</span>
                <button
                  type="button"
                  onClick={() => setZoomScale(0.75)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${zoomScale === 0.75 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                  ۷۵٪
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(0.85)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${zoomScale === 0.85 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                  ۸۵٪
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1.0)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${zoomScale === 1.0 ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                  ۱۰۰٪
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="w-full flex justify-center items-center py-1">
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center',
                }}
                className="transition-transform duration-200"
              >
                <div
                  className={`rounded-[28px] overflow-hidden shadow-2xl transition-all ${
                    aspectRatio === 'portrait'
                      ? 'w-[340px] sm:w-[370px] h-[425px] sm:h-[462px]'
                      : 'w-[340px] sm:w-[370px] h-[340px] sm:h-[370px]'
                  }`}
                >
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

            {/* Quick Export Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExportSingleSlide}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>دانلود اسلاید فعلی (PNG)</span>
              </button>

              <button
                onClick={handleExportAllSlidesZip}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-4 h-4" />
                <span>دانلود هر ۴ اسلاید (ZIP)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Customization Controls & Caption */}
          <div className="lg:col-span-5 space-y-4">
            {/* Font Picker */}
            <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span>فونت اسلایدها</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsFontModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>آپلود فونت جدید</span>
                </button>
              </div>

              <select
                value={selectedFont}
                onChange={(e) => {
                  sounds.playPop();
                  setSelectedFont(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white font-bold outline-none focus:border-indigo-500 cursor-pointer"
              >
                <optgroup label="فونت‌های استاندارد سیستم">
                  {allAvailableFonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>

                {customFonts && customFonts.length > 0 && (
                  <optgroup label="فونت‌های اختصاصی آپلودشده">
                    {customFonts.map((cf) => (
                      <option key={cf.id} value={cf.id}>
                        ⭐ {cf.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Format & Dimensions */}
            <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2.5">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
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

            {/* Branding & Handles Toggles */}
            <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">نمایش آیدی پیج‌ها (@bagtime_app و @negahmedia.co)</span>
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

            {/* Caption Section */}
            <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>متن کپشن اختصاصی این پست</span>
                </span>

                <button
                  onClick={handleCopyCaption}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCaption ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? 'کپی شد' : 'کپی متن کپشن'}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 max-h-36 overflow-y-auto leading-relaxed select-all">
                <pre className="whitespace-pre-wrap font-sans">{currentPost.caption}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: 60-DAY INSTAGRAM STORIES STRATEGY HUB ── */}
      {activeTab === 'stories_strategy' && (
        <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-in fade-in">
          {/* Header Stats Bar */}
          <div className="p-5 rounded-3xl bg-[#0d1322] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-black">تقویم استراتژیک ۶۰ روزه استوری اینستاگرام</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  ۳ استوری در روز • ۱۸۰ استوری آماده
                </span>
              </div>
              <p className="text-xs text-slate-400">
                هر ۶ روز روی یکی از ویژگی‌های کلیدی بَگ‌تایم تمرکز می‌شود تا مخاطبان قدم‌به‌قدم ارزش سیستم را درک کنند.
              </p>
            </div>

            {/* Progress counter */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">پیشرفت انتشار استوری‌ها:</div>
                <div className="text-lg font-black text-emerald-400">
                  {publishedDays.length} از ۶۰ روز ({Math.round((publishedDays.length / 60) * 100)}٪)
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDayPublished(selectedStoryDay)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  publishedDays.includes(selectedStoryDay)
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{publishedDays.includes(selectedStoryDay) ? 'روز انتخاب‌شده منتشر شد' : 'ثبت به عنوان منتشر شده'}</span>
              </button>
            </div>
          </div>

          {/* 60 Days Grid Selector */}
          <div className="p-4 rounded-3xl bg-[#0d1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">انتخاب شماره روز کاری (۱ تا ۶۰):</span>
              <span className="text-slate-400 text-[11px]">
                {currentStoryDayData.cycleName}
              </span>
            </div>

            {/* Scrollable Day Pills */}
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1.5 max-h-36 overflow-y-auto p-1">
              {stories60Days.map((sd) => {
                const isSelected = selectedStoryDay === sd.day;
                const isDone = publishedDays.includes(sd.day);
                return (
                  <button
                    key={sd.day}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setSelectedStoryDay(sd.day);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border relative ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md ring-2 ring-purple-400/50'
                        : isDone
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{sd.day}</span>
                    {isDone && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Day Plan: 3 Stories Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Story 1: Morning Hook (10:00) */}
            <div className={`p-5 rounded-3xl bg-[#0d1322] border transition-all ${
              activeStorySlot === 1 ? 'border-purple-500 shadow-xl ring-1 ring-purple-500' : 'border-slate-800'
            } space-y-3.5 flex flex-col justify-between`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    استوری ۱ • ساعت ۱۰:۰۰ صبح
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{currentStoryDayData.story1.type}</span>
                </div>

                <h3 className="text-sm font-black text-white">{currentStoryDayData.story1.hook}</h3>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                  {currentStoryDayData.story1.body}
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300 font-bold">
                  🎯 استیکر پیشنهادی: {currentStoryDayData.story1.sticker}
                </div>
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

            {/* Story 2: Afternoon Feature Demo (14:00) */}
            <div className={`p-5 rounded-3xl bg-[#0d1322] border transition-all ${
              activeStorySlot === 2 ? 'border-purple-500 shadow-xl ring-1 ring-purple-500' : 'border-slate-800'
            } space-y-3.5 flex flex-col justify-between`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    استوری ۲ • ساعت ۱۴:۰۰ ظهر
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{currentStoryDayData.story2.type}</span>
                </div>

                <h3 className="text-sm font-black text-white">{currentStoryDayData.story2.title}</h3>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                  {currentStoryDayData.story2.body}
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 font-bold">
                  📱 توصیه تصویر: {currentStoryDayData.story2.sticker}
                </div>
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
                  <span className="text-[10px] text-slate-400 font-bold">{currentStoryDayData.story3.type}</span>
                </div>

                <h3 className="text-sm font-black text-white">{currentStoryDayData.story3.conclusion}</h3>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                  {currentStoryDayData.story3.ctaText}
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300 font-bold">
                  📩 هدایت دایرکت به پیج‌ها: {currentStoryDayData.story3.handles}
                </div>
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
                  onClick={() => handleCopyStoryText(3, `${currentStoryDayData.story3.conclusion}\n\n${currentStoryDayData.story3.ctaText}\n\n${currentStoryDayData.story3.handles}`)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedStoryText === 'story_3' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStoryText === 'story_3' ? 'کپی شد' : 'کپی متن استوری ۳'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Story Visual Graphic Generator & Downloader (9:16 Aspect) */}
          <div className="p-6 rounded-3xl bg-[#0d1322] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-right">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Sparkles className="w-4 h-4" />
                <span>رندر استوری گرافیکی ۹:۱۶ اینستاگرام (1080 × 1920)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                می‌توانید استوری شماره {activeStorySlot} امروز (روز {selectedStoryDay}) را با کیفیت اصلی رتینا مستقیماً به صورت تصویر PNG دانلود کرده و در پیج استوری بگذارید.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportStoryImage}
              disabled={isExporting}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>دانلود تصویر استوری شماره {activeStorySlot} (PNG)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── NATIVE UNTRANSFORMED OFF-SCREEN RENDER CONTAINERS (0% ERROR) ── */}
      {/* 1. Feed Slides Off-screen Container (1080x1350 / 1080x1080) */}
      <div
        ref={exportContainerRef}
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '0',
          width: '1080px',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            id={`clean-slide-${idx}`}
            style={{
              width: '1080px',
              height: aspectRatio === 'portrait' ? '1350px' : '1080px',
            }}
          >
            {renderSlideContent(idx, true)}
          </div>
        ))}
      </div>

      {/* 2. Story 9:16 (1080x1920) Off-screen Render Container */}
      <div
        ref={storyExportRef}
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '0',
          width: '1080px',
          height: '1920px',
          zIndex: -9999,
          pointerEvents: 'none',
          fontFamily: selectedFont || 'inherit',
        }}
        className="bg-[#0f172a] text-white p-20 flex flex-col justify-between"
        dir="rtl"
      >
        {/* Glow */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3">
            <TaskMasterHexagon size={48} />
            <span className="font-black text-2xl tracking-tight">بَگ‌تایم</span>
          </div>
          <div className="text-right">
            <div className="text-emerald-400 font-black text-lg">روز {selectedStoryDay} از ۶۰</div>
            <div className="text-slate-400 text-sm">@bagtime_app • @negahmedia.co</div>
          </div>
        </div>

        {/* Center Content */}
        <div className="my-auto space-y-10 z-10 text-right py-10">
          <div className="inline-block px-5 py-2 rounded-2xl bg-purple-500/20 text-purple-300 font-black text-lg border border-purple-500/30">
            {activeStorySlot === 1 && currentStoryDayData.story1.time}
            {activeStorySlot === 2 && currentStoryDayData.story2.time}
            {activeStorySlot === 3 && currentStoryDayData.story3.time}
          </div>

          <h2 className="text-4xl font-black leading-tight text-white">
            {activeStorySlot === 1 && currentStoryDayData.story1.hook}
            {activeStorySlot === 2 && currentStoryDayData.story2.title}
            {activeStorySlot === 3 && currentStoryDayData.story3.conclusion}
          </h2>

          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-xl font-bold text-slate-200 leading-loose whitespace-pre-wrap">
            {activeStorySlot === 1 && currentStoryDayData.story1.body}
            {activeStorySlot === 2 && currentStoryDayData.story2.body}
            {activeStorySlot === 3 && currentStoryDayData.story3.ctaText}
          </div>

          <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-lg font-bold">
            {activeStorySlot === 1 && `🎯 ${currentStoryDayData.story1.sticker}`}
            {activeStorySlot === 2 && `💡 ${currentStoryDayData.story2.demoNote}`}
            {activeStorySlot === 3 && `📩 دایرکت به پیج‌های رسمی: ${currentStoryDayData.story3.handles}`}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-base text-slate-400 z-10">
          <span>{footerPrefix} <strong>{footerCompany}</strong></span>
          <span>bagtime.app</span>
        </div>
      </div>

      {/* Font Upload Modal */}
      <FontSelectorModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
    </div>
  );
};
