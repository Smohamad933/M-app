import React from 'react';
import { ShieldCheck, Lock, Cpu, EyeOff, Trash2, Check, X } from 'lucide-react';
import { TaskMasterHexagon } from './TaskMasterLogo';
import { sounds } from '../utils/sound';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0d1322] rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                سیاست‌های حریم خصوصی و امنیت داده‌ها
              </h2>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                شفافیت کامل در نحوه استفاده و حفاظت از اطلاعات کاربران بَگ‌تایم
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto leading-relaxed text-xs text-slate-700 dark:text-slate-300">
          {/* Important Highlight Box for AI Agent Training */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-teal-500/10 border-2 border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm">
              <Cpu className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>کاربرد انحصاری داده‌ها: آموزش ایجنت هوشمند دستیار نسخه‌های بعدی</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-800 dark:text-slate-200 font-bold">
              دسترسی به اطلاعات و الگوهای مدیریت زمان، ثبت تسک‌ها، روتین‌ها و بازخوردهای عدم انجام کارها در سامانه بَگ‌تایم، 
              <span className="text-emerald-600 dark:text-emerald-400 font-black mx-1">
                صرفاً و منحصراً جهت آموزش، ارتقا و بهینه‌سازی مدل‌های هوش مصنوعی و «ایجنت دستیار بَگ‌تایم (AI Assistant Agent)» در نسخه‌های بعدی
              </span> 
              استفاده می‌شود تا بتواند به شکل هوشمندانه شما را در برنامه‌ریزی واقع‌بینانه، ریشه‌یابی موانع و جلوگیری از اهمال‌کاری یاری دهد.
            </p>
          </div>

          {/* Principle 1: No Commercial Selling or Third-party Transfer */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>۱. عدم واگذاری تجاری و حفظ امانت اطلاعات</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              هیچ بخشی از اطلاعات شما به شرکت‌های تبلیغاتی، سازمان‌های ثالث یا مقاصد تجاری بیرون از بَگ‌تایم واگذار نشده و نخواهد شد. ارتباطات کاربری بر بستر رمزنگاری‌شده SSL و سرورهای داخلی امن هدایت می‌شوند.
            </p>
          </div>

          {/* Principle 2: Mobile Number Privacy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <EyeOff className="w-4 h-4 text-amber-500" />
              <span>۲. محرمانگی کامل شماره تماس و مشخصات هویتی</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              شماره تلفن‌های همراه ثبت‌شده صرفاً برای احراز هویت پیامکی و اتصال ربات بله نزد سامانه نگهداری می‌شوند و تحت هیچ عنوانی در پروفایل‌های عمومی، جستجوی کاربران یا فهرست دوستان برای سایر کاربران قابل مشاهده نیستند.
            </p>
          </div>

          {/* Principle 3: User Rights & Data Erasure */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>۳. حق بازنشانی و حذف دائمی اطلاعات</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              شما در هر زمان می‌توانید از طریق بخش تنظیمات پروفایل خود، درخواست حذف کامل حساب کاربری و پاکسازی داده‌های ثبت‌شده را ارسال نمایید تا تمامی اطلاعات شما برای همیشه حذف گردند.
            </p>
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-center pt-2">
            BAGTIME PRIVACY POLICY • VERSION 2.4 • VALIDATED 2026
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <TaskMasterHexagon size={20} />
            <span className="font-black text-xs text-slate-700 dark:text-slate-300">سامانه بَگ‌تایم</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playComplete();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>متوجه شدم و تایید می‌کنم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
