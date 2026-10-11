import React, { useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import { toPersianDigits } from '../utils/persianDate';
import {
  Bell,
  Send,
  Users,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Laptop,
} from 'lucide-react';

interface Props {
  users: User[];
  preselectedUserId?: string;
  onSent?: () => void;
  onNotificationSent?: () => void;
}

const TITLE_PRESETS = [
  '📢 پیام مهم مدیریت بَگ‌تایم',
  '⚡ اطلاعیه سیستمی و به‌روزرسانی',
  '⏰ یادآوری مهم پیگیری کارها',
  '🌟 پیام تشویقی و افتخار روز',
  '🎯 هدف جدید در سامانه',
];

export const SiteNotificationBroadcastManager: React.FC<Props> = ({
  users,
  preselectedUserId = 'all',
  onSent,
}) => {
  const [targetUserId, setTargetUserId] = useState<string>(preselectedUserId);
  const [title, setTitle] = useState('📢 پیام مهم مدیریت بَگ‌تایم');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'alert' | 'info'>('announcement');
  const [url, setUrl] = useState('https://bagtime.negahm.ir');
  const [isSending, setIsSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const targetUserObj = users.find((u) => u.id === targetUserId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('لطفاً عنوان اعلان را وارد کنید.');
      return;
    }
    if (!message.trim()) {
      alert('لطفاً متن پیام اعلان را بنویسید.');
      return;
    }

    const recipientLabel =
      targetUserId === 'all'
        ? `تمامی کاربران (${toPersianDigits(users.length)} نفر)`
        : targetUserObj?.name || 'کاربر انتخاب‌شده';

    const confirmed = window.confirm(
      `آیا از ارسال اعلان سایت به «${recipientLabel}» اطمینان دارید؟\nاین اعلان روی مرورگر و گوشی کاربران به صورت نوتیفیکیشن زنده ارسال خواهد شد.`
    );
    if (!confirmed) return;

    setIsSending(true);
    setSuccessNotice(null);
    sounds.playPop();

    try {
      const res = await api.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        targetUserId,
        type,
        url: url.trim() || undefined,
      });

      sounds.playComplete();
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setSuccessNotice(res.message || 'اعلان با موفقیت برای کاربران ارسال شد!');
      setMessage('');
      if (onSent) onSent();
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال اعلان سایت.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 rounded-3xl p-5 sm:p-7 border border-zinc-800 space-y-6 shadow-xl text-white font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                ارسال نوتیفیکیشن از طرف سایت (Web Push & In-App)
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                زنده و لحظه‌ای
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ارسال پیام و اعلان رسمی سایت با متن دلخواه به رایانه و گوشی کاربران
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-2xl border border-zinc-800">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>پشتیبانی از مرورگر، ویندوز و گوشی</span>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{successNotice}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Audience Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>مخاطب اعلان:</span>
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">📢 تمامی کاربران سامانه ({toPersianDigits(users.length)} کاربر)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.name} (@{u.username}) {u.jobTitle ? `• ${u.jobTitle}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Title Presets & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">
                عنوان نوتیفیکیشن:
              </label>
              <span className="text-[10px] text-zinc-500">الگوهای آماده:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TITLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTitle(preset);
                    sounds.playPop();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    title === preset
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: 📢 اطلاعیه مهم برگزاری جلسه یا آپدیت وظایف"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">
                متن پیام اعلان:
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {toPersianDigits(message.length)} نویسه
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="متن اعلان خود را اینجا بنویسید... (این پیام هم به صورت نوتیفیکیشن مرورگر روی گوشی/لپ‌تاپ ظاهر می‌شود و هم در زنگوله بالای سامانه ذخیره می‌گردد)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
            />
          </div>

          {/* Type & Action URL Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">نوع اعلان:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="announcement">📢 اعلان عمومی و سازمانی</option>
                <option value="alert">⚡ هشدار و یادآوری کاری</option>
                <option value="info">💡 پیام انگیزشی و اطلاع‌رسانی</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">لینک مقصد هنگام کلیک (اختیاری):</label>
              <input
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://bagtime.negahm.ir"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
            <span>{isSending ? 'در حال ارسال نوتیفیکیشن...' : 'ارسال رسمی نوتیفیکیشن به کاربران 🚀'}</span>
          </button>
        </div>

        {/* Right / Live Device Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-amber-400" />
            <span>پیش‌نمایش زنده نوتیفیکیشن در دستگاه کاربر:</span>
          </div>

          {/* Mockup Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950 border-2 border-zinc-800 space-y-4 shadow-inner relative overflow-hidden">
            {/* Top Device Banner */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-zinc-400">بَگ‌تایم • BagTime Web Push</span>
              </div>
              <span className="font-mono">همین الان</span>
            </div>

            {/* Notification Toast Mockup */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white truncate">
                    {title || 'عنوان اعلان'}
                  </div>
                  <div className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed break-words font-medium">
                    {message || 'متن پیام اعلان شما در اینجا به نمایش در خواهد آمد...'}
                  </div>
                </div>
              </div>

              {url && (
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-1 border-t border-zinc-800/80">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{url}</span>
                </div>
              )}
            </div>

            {/* In-App Bell Preview */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
              <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>نمایش در زنگوله اعلان‌های داخل سایت:</span>
              </div>
              <div className="text-[11px] text-zinc-300">
                کاربران علاوه بر اعلان ویندوز/گوشی، این پیام را در زنگوله بالای صفحه دریافت کرده و تاریخچه آن محفوظ می‌ماند.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
