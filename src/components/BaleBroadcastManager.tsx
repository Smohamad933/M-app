import React, { useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { sounds } from '../utils/sound';
import { toPersianDigits } from '../utils/persianDate';
import {
  Send,
  Plus,
  Trash2,
  ExternalLink,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  Users,
  User as UserIcon,
  Hash,
  RefreshCw,
} from 'lucide-react';

interface InlineButton {
  id: string;
  text: string;
  type: 'url' | 'callback';
  value: string;
}

interface BaleBroadcastManagerProps {
  users: User[];
  botToken?: string;
  preselectedUserId?: string;
}

export const BaleBroadcastManager: React.FC<BaleBroadcastManagerProps> = ({
  users,
  botToken,
  preselectedUserId,
}) => {
  const [target, setTarget] = useState<'all' | 'user' | 'chat_id'>(
    preselectedUserId ? 'user' : 'all'
  );
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || '');
  const [customChatId, setCustomChatId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>(
    'سلام و درود! 🌸\n\nپیام جدیدی از طرف مدیریت سامانه «بگ تایم» برای شما ارسال شده است.\nبرای ورود مستقیم به پنل کاربری یا بررسی کارهای خود از دکمه‌های زیر استفاده کنید.'
  );

  const [buttons, setButtons] = useState<InlineButton[]>([
    {
      id: 'btn_1',
      text: '🌐 ورود به سایت بگ‌تایم',
      type: 'url',
      value: typeof window !== 'undefined' ? window.location.origin : 'https://task.mohusyn.ir',
    },
    {
      id: 'btn_2',
      text: '📋 مشاهده تسک‌های من',
      type: 'callback',
      value: 'my_tasks',
    },
  ]);

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    message: string;
    sentCount?: number;
    failedCount?: number;
  } | null>(null);

  // Filter users with Bale connected
  const baleConnectedUsers = users.filter((u) => !!u.baleChatId);

  // Add custom button
  const handleAddButton = () => {
    sounds.playPop();
    const newBtn: InlineButton = {
      id: `btn_${Date.now()}`,
      text: 'دکمه جدید',
      type: 'url',
      value: 'https://task.mohusyn.ir',
    };
    setButtons([...buttons, newBtn]);
  };

  // Remove button
  const handleRemoveButton = (id: string) => {
    sounds.playPop();
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // Update button field
  const handleUpdateButton = (id: string, updates: Partial<InlineButton>) => {
    setButtons(buttons.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  // Quick Preset Templates
  const handleApplyPreset = (type: 'update' | 'tasks' | 'pro' | 'welcome') => {
    sounds.playPop();
    if (type === 'update') {
      setMessageText(
        '🚀 **به‌روزرسانی بزرگ بگ‌تایم منتشر شد!**\n\nامکانات جدید شامل استوری پیشرفت روزنامه، وقایع‌نگاری روزانه و یادآورهای هوشمند هم‌اکنون در دسترس شماست.'
      );
      setButtons([
        {
          id: 'btn_up_1',
          text: '⚡ ورود و تجربه امکانات جدید',
          type: 'url',
          value: typeof window !== 'undefined' ? window.location.origin : 'https://task.mohusyn.ir',
        },
        {
          id: 'btn_up_2',
          text: '🗞️ مشاهده استوری روزنامه',
          type: 'callback',
          value: 'newspaper_story',
        },
      ]);
    } else if (type === 'tasks') {
      setMessageText(
        '⏰ **یادآور زمان‌بندی و وظایف امروز**\n\nبرای ثبت یا تیک زدن کارهای شیفت امروز و افزایش استریک روزانه‌تان، وارد سامانه شوید.'
      );
      setButtons([
        {
          id: 'btn_tsk_1',
          text: '📋 تسک‌های امروز من',
          type: 'callback',
          value: 'my_tasks',
        },
        {
          id: 'btn_tsk_2',
          text: '➕ افزودن سریع تسک',
          type: 'callback',
          value: 'new_task',
        },
      ]);
    } else if (type === 'pro') {
      setMessageText(
        '💎 **پیشنهاد ویژه اشتراک نامحدود بگ‌تایم**\n\nبا ارتقاء به حساب Pro از امکانات نامحدود، گزارش‌های پیشرفته و افزونه مرورگر بهره‌مند شوید.'
      );
      setButtons([
        {
          id: 'btn_pro_1',
          text: '⭐ ارتقاء اشتراک ویژه Pro',
          type: 'url',
          value: (typeof window !== 'undefined' ? window.location.origin : 'https://task.mohusyn.ir') + '?modal=upgrade',
        },
        {
          id: 'btn_pro_2',
          text: '💬 ارتباط با پشتیبانی',
          type: 'url',
          value: 'https://ble.ir/smosh',
        },
      ]);
    } else if (type === 'welcome') {
      setMessageText(
        '🌸 **به سامانه هوشمند بگ‌تایم خوش آمدید!**\n\nحساب کاربری شما با موفقیت فعال شد. از این پس اعلان‌ها و یادآورهای تسک‌ها را مستقیماً در همین پیام‌رسان دریافت خواهید کرد.'
      );
      setButtons([
        {
          id: 'btn_wlc_1',
          text: '🌐 ورود به پنل کاربری',
          type: 'url',
          value: typeof window !== 'undefined' ? window.location.origin : 'https://task.mohusyn.ir',
        },
      ]);
    }
  };

  // Add quick preset buttons
  const handleAddPresetButton = (preset: { text: string; type: 'url' | 'callback'; value: string }) => {
    sounds.playPop();
    const newBtn: InlineButton = {
      id: `btn_${Date.now()}`,
      text: preset.text,
      type: preset.type,
      value: preset.value,
    };
    setButtons([...buttons, newBtn]);
  };

  // Send Message
  const handleSendMessage = async (testAdminOnly = false) => {
    if (!messageText.trim()) {
      alert('لطفاً متن پیام را وارد کنید.');
      return;
    }

    sounds.playPop();
    setIsSending(true);
    setSendResult(null);

    const formattedButtons = buttons.map((b) => ({
      text: b.text.trim(),
      type: b.type,
      value: b.value.trim(),
    }));

    try {
      let finalTarget = target;
      let finalChatId = customChatId.trim();
      let finalUserId = selectedUserId;

      if (testAdminOnly) {
        finalTarget = 'chat_id';
        finalChatId = '671754408'; // Mohusyn Admin Chat ID
      }

      const res = await api.sendBaleCustomMessage({
        target: finalTarget,
        userId: finalTarget === 'user' ? finalUserId : undefined,
        chatId: finalTarget === 'chat_id' ? finalChatId : undefined,
        text: messageText.trim(),
        buttons: formattedButtons,
        token: botToken,
      });

      if (res && res.ok) {
        sounds.playComplete();
        setSendResult({
          ok: true,
          message: res.message || 'پیام با موفقیت به کاربران در بله ارسال شد.',
          sentCount: res.sentCount,
          failedCount: res.failedCount,
        });
      } else {
        setSendResult({
          ok: false,
          message: res?.error || 'خطا در ارسال پیام به سرورهای بله.',
        });
      }
    } catch (err: any) {
      setSendResult({
        ok: false,
        message: err?.message || 'خطا در برقراری ارتباط با وب‌سرویس بله.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-blue-900/40 via-zinc-900 to-indigo-950/40 border border-blue-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>سامانه ارسال پیام هوشمند و تعاملی بازوی بله</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                ارسال پیام از طرف ربات بله با دکمه‌های شیشه‌ای (Inline Keyboard)
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80 font-bold">
              {toPersianDigits(baleConnectedUsers.length)} کاربر متصل به بله
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          شما به عنوان مدیر کل می‌توانید هرگونه پیام، اطلاعیه، یادآور یا پیام اختصاصی را از نام ربات بله برای کاربران ارسال کرده و در زیر متن، دکمه‌های شیشه‌ای قابل کلیک (لینک وب‌سایت یا دستورات تعاملی) قرار دهید.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Form & Button Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Target Audience Selection */}
          <div className="p-5 bg-zinc-900/70 rounded-3xl border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>انتخاب گیرنده پیام:</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTarget('all')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  target === 'all'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md font-black'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>همه کاربران بله</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget('user')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  target === 'user'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md font-black'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>کاربر مشخص</span>
              </button>

              <button
                type="button"
                onClick={() => setTarget('chat_id')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  target === 'chat_id'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md font-black'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>شناسه چت دستی</span>
              </button>
            </div>

            {/* Target Options Details */}
            {target === 'user' && (
              <div className="pt-2 animate-in fade-in">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب از بین کاربران متصل به بله...</option>
                  {baleConnectedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) — شناسه چت: {u.baleChatId}
                    </option>
                  ))}
                </select>
                {baleConnectedUsers.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    هنوز کاربری ربات بله را استارت نکرده است.
                  </p>
                )}
              </div>
            )}

            {target === 'chat_id' && (
              <div className="pt-2 animate-in fade-in">
                <input
                  type="text"
                  value={customChatId}
                  onChange={(e) => setCustomChatId(e.target.value)}
                  placeholder="شناسه عددی چت بله (مثال: 671754408)"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white text-left outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 2. Message Text & Presets */}
          <div className="p-5 bg-zinc-900/70 rounded-3xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>متن پیام ارسالی:</span>
              </label>

              <span className="text-[10px] text-zinc-500 font-mono">
                {toPersianDigits(messageText.length)} نویسه
              </span>
            </div>

            {/* Quick Template Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] text-zinc-400 font-bold shrink-0">قالب‌ها:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('update')}
                className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                📢 آپدیت جدید
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tasks')}
                className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                ⏰ یادآور کارها
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('pro')}
                className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                💎 آفر اشتراک Pro
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('welcome')}
                className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                🌸 خوش‌آمدگویی
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
              placeholder="متن پیام خود را بنویسید (پشتیبانی از اموجی و قالب‌بندی)..."
              className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs leading-relaxed text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>

          {/* 3. Dynamic Inline Keyboard Buttons Builder */}
          <div className="p-5 bg-zinc-900/70 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>دکمه‌های شیشه‌ای زیر پیام (Inline Buttons):</span>
                </label>
                <p className="text-[10px] text-zinc-400">
                  دکمه‌هایی که دقیقاً زیر پیام در بله قرار می‌گیرند و کاربر می‌تواند لمس کند.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddButton}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن دکمه</span>
              </button>
            </div>

            {/* Quick Ready Add-on Buttons */}
            <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-bold block">
                افزودن دکمه‌های آماده با یک کلیک:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetButton({
                      text: '🌐 ورود به بگ تایم',
                      type: 'url',
                      value: typeof window !== 'undefined' ? window.location.origin : 'https://task.mohusyn.ir',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  + ورود به سایت
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetButton({
                      text: '📋 تسک‌های امروز من',
                      type: 'callback',
                      value: 'my_tasks',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  + تسک‌های من
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetButton({
                      text: '➕ تسک جدید',
                      type: 'callback',
                      value: 'new_task',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  + تسک جدید
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetButton({
                      text: '🔔 تنظیمات اعلان‌ها',
                      type: 'callback',
                      value: 'notif_settings',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  + تنظیمات نوتیف
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPresetButton({
                      text: '💬 ارتباط با پشتیبانی',
                      type: 'url',
                      value: 'https://ble.ir/smosh',
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  + پشتیبانی
                </button>
              </div>
            </div>

            {/* Configured Buttons List */}
            <div className="space-y-2.5">
              {buttons.map((btn, index) => (
                <div
                  key={btn.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 animate-in slide-in-from-top-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-blue-400">
                      دکمه {toPersianDigits(index + 1)}:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(btn.id)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف این دکمه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Button Label */}
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => handleUpdateButton(btn.id, { text: e.target.value })}
                        placeholder="عنوان دکمه (مثال: ورود به سایت)"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Button Type */}
                    <div className="sm:col-span-3">
                      <select
                        value={btn.type}
                        onChange={(e) =>
                          handleUpdateButton(btn.id, {
                            type: e.target.value as 'url' | 'callback',
                            value:
                              e.target.value === 'url'
                                ? 'https://task.mohusyn.ir'
                                : 'my_tasks',
                          })
                        }
                        className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="url">لینک وب (URL)</option>
                        <option value="callback">دستور بازگشتی (Callback)</option>
                      </select>
                    </div>

                    {/* Value */}
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={btn.value}
                        onChange={(e) => handleUpdateButton(btn.id, { value: e.target.value })}
                        placeholder={btn.type === 'url' ? 'https://...' : 'کد دستور'}
                        dir="ltr"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-cyan-300 text-left outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {buttons.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
                  هیچ دکمه شیشه‌ای اضافه نشده است. با دکمه «افزودن دکمه» می‌توانید دکمه‌های دلخواه بسازید.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Authentic Bale Chat Mock Preview & Send Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 bg-zinc-900/70 rounded-3xl border border-zinc-800 space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>پیش‌نمایش زنده در پیام‌رسان بله</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Bale Client Preview</span>
            </div>

            {/* BALE CHAT BUBBLE MOCK */}
            <div className="p-4 rounded-3xl bg-[#0f2744] border border-blue-900/60 shadow-inner space-y-3 font-sans">
              {/* Bot Info Header */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-blue-800/40">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white">بگ تایم (Bag Time)</span>
                    <span className="text-[10px] text-blue-400">✓</span>
                  </div>
                  <span className="text-[9px] text-blue-300/80 font-mono">bot</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-xs text-white leading-relaxed whitespace-pre-wrap font-sans">
                {messageText || 'متن پیام در اینجا نمایش داده خواهد شد...'}
              </div>

              {/* Live Mock of Inline Buttons */}
              {buttons.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-blue-800/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {buttons.map((b) => (
                      <div
                        key={b.id}
                        className="py-2 px-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs truncate"
                      >
                        {b.type === 'url' ? (
                          <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{b.text || 'دکمه'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Send Result Banner */}
            {sendResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  sendResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {sendResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{sendResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleSendMessage(false)}
                disabled={isSending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>در حال ارسال پیام از طریق بله...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ارسال پیام با دکمه‌های شیشه‌ای 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage(true)}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700 active:scale-95 disabled:opacity-50"
                title="ارسال تستی به چت مدیر در بله جهت تست قبل از ارسال همگانی"
              >
                <span>🧪 ارسال تستی به اکانت مدیر (S.m.sh)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
