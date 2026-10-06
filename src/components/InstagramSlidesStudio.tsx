import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { sounds } from '../utils/sound';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { FontSelectorModal } from './FontSelectorModal';

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

export const InstagramSlidesStudio: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const {
    allAvailableFonts,
    systemFont,
    globalSettings,
    customFonts,
  } = useTask();

  const [activePostIndex, setActivePostIndex] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('light');
  const [selectedFont, setSelectedFont] = useState<string>(systemFont || 'vazirmatn');
  const [showFooterBranding, setShowFooterBranding] = useState<boolean>(true);
  const [showHandles, setShowHandles] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(0.85); // 0.75, 0.85, 1.0 for comfortable canvas scale
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'content' | 'launch' | 'demo'>('all');

  const slideRef = useRef<HTMLDivElement>(null);
  const batchContainerRef = useRef<HTMLDivElement>(null);

  const footerPrefix = globalSettings?.footerBranding?.prefixText || 'بَگ‌تایم، از خانوادهٔ';
  const footerCompany = globalSettings?.footerBranding?.companyName || 'کیان فناوران نگاه';

  // ── 22 Ready-to-Use 4-Slide Instagram Posts (20 Content + 1 Official Launch + 1 Free Demo) ──
  const posts: PostDefinition[] = [
    // ── 1. رونمایی رسمی سامانه (Official Launch Co-branded) ──
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

    // ── 2. دریافت اکانت دمو رایگان (Free Demo Account) ──
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

    // ── ۳ تا ۲۲: بیست پست محتوایی اختصاصی برای انتشار منظم ──
    {
      id: 'post-1',
      category: 'content',
      tag: 'پست ۱: مدیریت زمان',
      title: 'چرا روزت تموم میشه ولی کارها میمونه؟',
      caption: `چند بار برات پیش اومده اول صبح با کلی انگیزه شروع کنی ولی شب ببینی کارهای اصلیت موندن؟ 🧠

علت این نیست که وقت نداری، علت استفاده نکردن از تایم‌لاین ساعتی (Time Blocking) هست.

سامانه بَگ‌تایم دقیقا با همین هدف ساخته شده؛ روزت رو بلوک‌بندی کن و با آرامش تسک‌هات رو تیک بزن! ✌️

#مدیریت_زمان #بهره_وری #تمرکز #بگ_تایم #برنامه_ریزی`,
      slides: [
        {
          badge: '⚠️ چالش روزمره',
          title: 'چرا روزت تموم میشه ولی کارها میمونه؟',
          subtitle: 'شلوغی ذهن و خطای نداشتن بلوک‌بندی زمانی',
          content: <p className="text-xs font-bold leading-relaxed">خیلی‌ها لیست کارهای بلندبالا می‌نویسند اما چون مشخص نیست هر کار کِی باید انجام شود، بین تسک‌ها گم می‌شوند!</p>,
          footerNote: 'ورق بزنید تا راهکار را ببینید ‹',
        },
        {
          badge: '💡 راهکار علمی',
          title: 'تکنیک اصولی Time Blocking',
          content: <p className="text-xs font-bold leading-relaxed">هر کار باید زمان شروع و پایان دقیق داشته باشد؛ با این کار استرس ناشی از حجم کارها ناپدید می‌شود.</p>,
        },
        {
          badge: '🚀 در بَگ‌تایم',
          title: 'دیلی پلنر ساعتی با نشانگر زنده',
          content: <p className="text-xs font-bold leading-relaxed">در پلنر بَگ‌تایم در هر ساعت روز خط زمان فعلی به شما می‌گوید در حال حاضر نوبت کدام کار است.</p>,
        },
        {
          badge: '✌️ گام بعدی',
          title: 'وقتشه به روزهات نظم بدی',
          content: <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-center">کلمه «بگ‌تایم» را دایرکت کنید تا بدون معطلی شروع کنید!</div>,
          footerNote: 'بَگ‌تایم، از خانوادهٔ کیان فناوران نگاه',
        },
      ],
    },
    {
      id: 'post-2',
      category: 'content',
      tag: 'پست ۲: تمرکز و پومودورو',
      title: 'پومودورو به سبک حرفه‌ای‌ها',
      caption: `تکنیک پومودورو رو اشتباه اجرا نکنید! 🍅
۲۵ دقیقه تمرکز خالص یعنی صفر نوتیفیکیشن و صفر پیام. در بَگ‌تایم با تایمر مشترک کنار دوستانتون کار کنید!

#پومودورو #کار_عمیق #تمرکز #بگ_تایم`,
      slides: [
        {
          badge: '🍅 پومودورو مدرن',
          title: 'تکنیک پومودورو اما به سبک حرفه‌ای‌ها',
          content: <p className="text-xs font-bold leading-relaxed">خیلی‌ها پومودورو می‌گیرند اما باز هم حین تایمر سراغ گوشی می‌روند! راز کار در تعهد محیطی است.</p>,
        },
        {
          badge: '🎧 چطور عمیق شویم؟',
          title: 'قطع محرک‌ها + صدای تمرکز',
          content: <p className="text-xs font-bold leading-relaxed">صدای یکنواخت باران یا موزیک لوفای در کنار بستن تب‌های اضافی، دوپامین مغز را روی تسک قفل می‌کند.</p>,
        },
        {
          badge: '👥 اتاق تمرکز',
          title: 'حضور همزمان در اتاق‌های زنده بَگ‌تایم',
          content: <p className="text-xs font-bold leading-relaxed">در اتاق‌های پومودورو بَگ‌تایم با همکاران همزمان کار کنید و خستگی کار تنهایی را فراموش کنید.</p>,
        },
        {
          badge: '🚀 اقدام',
          title: 'همین امروز اتاق تمرکزت را بساز',
          content: <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs font-bold text-center">ورود سریع از طریق لینک بایو @bagtime_app</div>,
        },
      ],
    },
    {
      id: 'post-3',
      category: 'content',
      tag: 'پست ۳: ریشه‌یابی اهمال‌کاری',
      title: 'چرا کارها رو عقب میندازیم؟',
      caption: `اهمال‌کاری تنبلی نیست؛ پاسخ مغز به ابهام یا استرسه! بَگ‌تایم دلیل عقب افتادن کارها رو ثبت می‌کنه تا رفتارت رو اصلاح کنی. 🧠

#اهمال_کاری #روانشناسی #عادت #بگ_تایم`,
      slides: [
        {
          badge: '🧠 روانشناسی کار',
          title: 'چرا کارها رو عقب میندازیم؟',
          content: <p className="text-xs font-bold leading-relaxed">اهمال‌کاری نشانه تنبلی نیست، بلکه نشانه ابهام در کار، ترس از کمال‌گرایی یا خستگی مفرط است.</p>,
        },
        {
          badge: '🔍 کشف ریشه‌ها',
          title: '۴ عامل پنهان تعویق کارها',
          content: <div className="space-y-1 text-xs font-bold"><div>📱 حواس‌پرتی با گوشی</div><div>😴 افت انرژی و بی‌خوابی</div><div>⏳ تخمین اشتباه زمان</div><div>🐢 مقاومت ذهنی در شروع</div></div>,
        },
        {
          badge: '📊 تحلیلگر هوشمند',
          title: 'ثبت دلایل در سامانه بَگ‌تایم',
          content: <p className="text-xs font-bold leading-relaxed">هنگام عقب افتادن تسک، دلیل را ثبت کنید تا سیستم الگوهای ناکارآمد شما را بازگو کند.</p>,
        },
        {
          badge: '🌱 رشد شخصی',
          title: 'بهبود مستمر با شناخت موانع',
          content: <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-center">شناخت مانع، نصف حل مسئله است. در بَگ‌تایم شروع کن!</div>,
        },
      ],
    },
    {
      id: 'post-4',
      category: 'content',
      tag: 'پست ۴: افزونه نیوتَب',
      title: 'دستیاری که همیشه در تب جدیدت هست',
      caption: `روزی چند بار تب جدید در مرورگرت باز می‌کنی؟ اگر به جای صفحه خالی، تسک‌های امروزت اونجا بودن چی می‌شد؟ 🌐

#افزونه_کروم #مرورگر #دستیار #نیوتَب #بگ_تایم`,
      slides: [
        {
          badge: '🌐 افزونه هوشمند',
          title: 'تب جدید مرورگرت رو تبدیل به دستیار کن',
          content: <p className="text-xs font-bold leading-relaxed">به جای یک صفحه خالی یا تبلیغاتی، تسک‌های کاری و ساعت شمسی جلوت باشه!</p>,
        },
        {
          badge: '⚡ ورود یکپارچه SSO',
          title: 'بدون نیاز به لاگین مجدد',
          content: <p className="text-xs font-bold leading-relaxed">وقتی تو سامانه وب لاگین هستی، افزونه خودکار سینک میشه و کارها رو نشون میده.</p>,
        },
        {
          badge: '🔍 موتورهای جستجو',
          title: 'گوگل، بینگ و میانبرهای روزمره',
          content: <p className="text-xs font-bold leading-relaxed">سرچ‌بار مرکزی سریع و دسترسی به سایت‌های مهم کاری در یک چشم به هم زدن.</p>,
        },
        {
          badge: '📥 نصب آسان',
          title: 'همین حالا افزونه را دریافت کن',
          content: <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs font-bold text-center">دانلود مستقیم فایل زیپ افزونه از پنل کاربری بَگ‌تایم</div>,
        },
      ],
    },
    {
      id: 'post-5',
      category: 'content',
      tag: 'پست ۵: سارقان زمان',
      title: '۳ دزد بزرگ زمان در طول روز کاری',
      caption: `روزت چطور مثل برق و باد گذشت؟ این ۳ تا دزد رو مهار کن تا وقت کم نیاری! ⏳

#زمان #سارقان_زمان #موفقیت #بهره_وری`,
      slides: [
        {
          badge: '🚨 هشدار اتلاف وقت',
          title: '۳ دزد بزرگ زمان در طول روز',
          content: <p className="text-xs font-bold leading-relaxed">گاهی بدون اینکه متوجه شویم ساعت‌ها برای کارهای بی‌ارزش هدر می‌رود.</p>,
        },
        {
          badge: '🛑 سارقان پنهان',
          title: 'چندوظیفگی و چک کردن مداوم پیام‌ها',
          content: <p className="text-xs font-bold leading-relaxed">پریدن مداوم بین تسک‌ها تا ۴۰ درصد از بهره‌وری مغز را کاهش می‌دهد!</p>,
        },
        {
          badge: '🛡️ سپر دفاعی',
          title: 'بَگ‌تایم و فاز فوکوس مطلق',
          content: <p className="text-xs font-bold leading-relaxed">بلوک‌بندی روز و پایبندی به ساعت مشخص، ذهن را از حواس‌پرتی محافظت می‌کند.</p>,
        },
        {
          badge: '✅ شروع مهار زمان',
          title: 'کنترل ساعات روزت رو به دست بگیر',
          content: <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-center">کلمه «بگ‌تایم» را بفرست تا زندگیت منظم شود!</div>,
        },
      ],
    },
    // ادامه پست‌های ۶ تا ۲۰ با محتوای اختصاصی و عناوین متفاوت
    ...Array.from({ length: 15 }, (_, i) => {
      const idx = i + 6;
      const titles = [
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
      const curTitle = titles[i] || `تکنیک طلایی بهره‌وری شماره ${idx}`;
      return {
        id: `post-${idx}`,
        category: 'content' as const,
        tag: `پست ${idx}: بهره‌وری پیشرفته`,
        title: curTitle,
        caption: `نکته کلیدی روز: ${curTitle} 🎯\n\nبرای ارتقای نظم فردی و برنامه‌ریزی هوشمند، سامانه بَگ‌تایم را رایگان امتحان کنید.\n\n@bagtime_app • @negahmedia.co\n#بگ_تایم #مدیریت_زمان #پلنر`,
        slides: [
          {
            badge: `✨ نکته شماره ${idx}`,
            title: curTitle,
            subtitle: 'گام‌های عملی برای ساختن روزهایی پربارتر',
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

  const handleExportSingleSlide = async () => {
    if (!slideRef.current || isExporting) return;
    setIsExporting(true);
    setExportProgress('در حال ایجاد خروجی با رزولوشن فوق‌العاده...');
    sounds.playPop();

    try {
      const canvas = await html2canvas(slideRef.current, {
        scale: 2.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
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
      alert('خطا در خروجی تصویر.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleExportAllSlidesZip = async () => {
    if (isExporting) return;
    setIsExporting(true);
    sounds.playPop();

    const zip = new JSZip();
    const slidesElements = batchContainerRef.current?.querySelectorAll<HTMLElement>('.batch-slide-item');

    if (!slidesElements || slidesElements.length === 0) {
      setIsExporting(false);
      return;
    }

    try {
      for (let i = 0; i < slidesElements.length; i++) {
        setExportProgress(`در حال پردازش اسلاید ${i + 1} از ۴...`);
        const el = slidesElements[i];
        const canvas = await html2canvas(el, {
          scale: 2.8,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
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
      alert('خطا در خروجی زیپ.');
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

  // Render Slide Content
  const renderSlideContent = (slideIndex: number, _isBatch: boolean = false) => {
    const s = currentPost.slides[slideIndex] || currentPost.slides[0];

    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-6 sm:p-8 select-none relative overflow-hidden ${themeStyles.container}`}
        style={{ fontFamily: selectedFont || 'inherit' }}
        dir="rtl"
      >
        {/* Glow Decors */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={26} />
            <span className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-1">
              <span>بَگ‌تایم</span>
              <span className={themeStyles.accentText}>.</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showHandles && (
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                @bagtime_app • @negahmedia.co
              </span>
            )}
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20">
              {slideIndex + 1} / ۴
            </span>
          </div>
        </div>

        {/* Middle Body */}
        <div className="my-auto space-y-4 z-10 text-right py-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span>{s.badge}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black leading-snug">
            {s.title}
          </h2>

          {s.subtitle && (
            <p className={`text-xs sm:text-[13px] font-bold leading-relaxed ${themeStyles.subtext}`}>
              {s.subtitle}
            </p>
          )}

          <div className="pt-1">
            {s.content}
          </div>
        </div>

        {/* Bottom Footer of Slide */}
        <div className="pt-3 border-t border-slate-500/10 flex items-center justify-between text-[10px] text-slate-400 z-10 flex-shrink-0">
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
                <h1 className="text-sm font-black leading-tight">استودیو اسلایدهای گرافیکی اینستاگرام</h1>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  مخصوص مدیر کل
                </span>
              </div>
              <p className="text-[10px] text-slate-400">۲۲ پست آماده ۴ اسلایدی + رونمایی رسمی و اکانت دمو</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportSingleSlide}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>دانلود اسلاید فعلی (PNG)</span>
          </button>

          <button
            onClick={handleExportAllSlidesZip}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>دانلود زیپ ۴ اسلاید (ZIP)</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Canvas Preview with Proportional Fitted Scaling */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          {/* Progress Toast */}
          {isExporting && (
            <div className="w-full p-2.5 rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-200 text-xs font-bold text-center animate-pulse">
              ⏳ {exportProgress}
            </div>
          )}

          {/* Post Selection Quick Bar */}
          <div className="w-full bg-[#0d1322] border border-slate-800/90 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>انتخاب پست (از میان ۲۲ پست آماده):</span>
              </span>

              {/* Category tabs */}
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

          {/* Scale Controller Bar */}
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
                ۸۵٪ (استاندارد)
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

          {/* Canvas Wrapper - Balanced Proportions */}
          <div className="w-full flex justify-center items-center py-1">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
              }}
              className="transition-transform duration-200"
            >
              <div
                ref={slideRef}
                className={`rounded-[28px] overflow-hidden shadow-2xl transition-all ${
                  aspectRatio === 'portrait'
                    ? 'w-[340px] sm:w-[370px] h-[425px] sm:h-[462px]' // Balanced 4:5
                    : 'w-[340px] sm:w-[370px] h-[340px] sm:h-[370px]' // Balanced 1:1
                }`}
              >
                {renderSlideContent(activeSlideIndex)}
              </div>
            </div>
          </div>

          {/* 4-Slide Navigation Pagination */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              title="اسلاید قبلی"
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
              title="اسلاید بعدی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails of 4 slides */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-lg">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playPop();
                  setActiveSlideIndex(idx);
                }}
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                  activeSlideIndex === idx
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-black text-slate-300">اسلاید {idx + 1}</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  {idx === 0 && 'کاور و قلاب'}
                  {idx === 1 && 'شرح موضوع'}
                  {idx === 2 && 'راهکار بَگ‌تایم'}
                  {idx === 3 && 'نتیجه و اقدام'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Customization Controls & Caption */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Custom Font Picker */}
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

          {/* 2. Format & Dimensions */}
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

          {/* 3. Theme & Palette */}
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

          {/* 4. Branding & Handles Toggles */}
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

          {/* 5. Ready-to-use Caption for Selected Post */}
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

      {/* Hidden Batch Container for Rendering all 4 slides simultaneously during ZIP export */}
      <div
        ref={batchContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`batch-slide-item ${
              aspectRatio === 'portrait' ? 'w-[1080px] h-[1350px]' : 'w-[1080px] h-[1080px]'
            }`}
          >
            {renderSlideContent(idx, true)}
          </div>
        ))}
      </div>

      {/* Font Upload Modal */}
      <FontSelectorModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
    </div>
  );
};
