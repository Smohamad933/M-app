import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';
import { SubscriptionBadge } from './SubscriptionBadge';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import type { User } from '../types';
import {
  X,
  MessageSquare,
  Phone,
  Mail,
  UserPlus,
  Check,
  CheckCircle2,
  FolderKanban,
  Copy,
  Info,
  AtSign,
  Bookmark,
  Bell,
  Edit3,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';

interface PublicUserProfileModalProps {
  isOpen?: boolean;
  user: User | null;
  onClose: () => void;
  onStartChat?: (user: User) => void;
  onInviteToProject?: (user: User) => void;
  onEditProfile?: () => void;
}

export const PublicUserProfileModal: React.FC<PublicUserProfileModalProps> = ({
  user,
  onClose,
  onStartChat,
  onInviteToProject,
  onEditProfile,
}) => {
  const { currentUser, friends, sendFriendRequest, removeFriend } = useTask();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const isFriend = friends.some((f) => f.id === user.id);
  const numericIdStr = user.numericId ? `#${user.numericId}` : `#${toPersianDigits(1001)}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(`@${user.username} (${numericIdStr})`);
    setCopiedId(true);
    sounds.playPop();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPhone = () => {
    if (!user.phone) return;
    navigator.clipboard.writeText(user.phone);
    setCopiedPhone(true);
    sounds.playPop();
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSendFriendRequest = async () => {
    setIsSendingRequest(true);
    try {
      await sendFriendRequest(user.id);
      setRequestSent(true);
      sounds.playComplete();
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال درخواست دوستی');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const isPro = user.role === 'admin' || user.subscription?.plan === 'pro';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-[390px] sm:max-w-[420px] bg-[#121418] text-white rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden relative animate-in zoom-in-95 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Ambient Header */}
        <div className="relative h-32 sm:h-36 w-full bg-gradient-to-b from-slate-800 via-indigo-950/70 to-[#121418] overflow-hidden flex-shrink-0">
          {/* Subtle ambient lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/30 via-indigo-600/20 to-transparent" />
          
          {/* Top navigation actions */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer active:scale-95"
              title="بستن شناسنامه"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[11px] font-bold text-white/70 tracking-wider">
              Profile Card
            </span>

            <button
              type="button"
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                sounds.playPop();
              }}
              className={`w-9 h-9 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isBookmarked ? 'bg-amber-500 text-black font-black' : 'bg-black/40 text-white/90 hover:bg-black/60'
              }`}
              title="نشان کردن پروفایل"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Avatar outside overflow-hidden: NEVER clipped or sliced */}
        <div className="relative -mt-14 flex justify-center z-20 flex-shrink-0">
          <div className="relative group">
            <UserAvatar
              user={user}
              size="2xl"
              className="w-24 h-24 sm:w-26 sm:h-26 text-3xl shadow-2xl ring-4 ring-[#121418] rounded-full object-cover"
            />
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#121418]"
              title="آنلاین در سیستم"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 space-y-4 no-scrollbar">
          {/* User Name & Role Status */}
          <div className="text-center space-y-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {user.name}
              </h3>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-[10px] font-black inline-flex items-center gap-1 whitespace-nowrap">
                  <span>🛡️</span>
                  <span>مدیر سیستم</span>
                </span>
              ) : isPro ? (
                <SubscriptionBadge user={user} size="sm" />
              ) : null}
            </div>

            <p className="text-xs text-zinc-400 font-medium">
              {user.jobTitle || 'عضو سامانه بگ تایم'} • آخرین بازدید اخیراً
            </p>
          </div>

          {/* Round Action Buttons Row (Chat, Call, Mail, Connect) */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {/* Chat Action */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onStartChat) onStartChat(user);
              }}
              className="w-11 h-11 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title="گفتگوی مستقیم"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Phone Call / Copy */}
            {user.phone ? (
              <a
                href={`tel:${user.phone}`}
                className="w-11 h-11 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                title={`تماس با ${user.phone}`}
              >
                <Phone className="w-4 h-4 text-sky-400" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-11 h-11 rounded-2xl bg-zinc-800/40 text-zinc-600 flex items-center justify-center border border-white/5 cursor-not-allowed"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}

            {/* Email */}
            {user.email ? (
              <a
                href={`mailto:${user.email}`}
                className="w-11 h-11 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-white flex items-center justify-center border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                title={`ارسال ایمیل به ${user.email}`}
              >
                <Mail className="w-4 h-4 text-amber-400" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-11 h-11 rounded-2xl bg-zinc-800/40 text-zinc-600 flex items-center justify-center border border-white/5 cursor-not-allowed"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}

            {/* Friend / Connect */}
            {!isMe && (
              <button
                type="button"
                onClick={isFriend ? () => removeFriend(user.id) : handleSendFriendRequest}
                disabled={isSendingRequest}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                  isFriend
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : requestSent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800/90 hover:bg-zinc-700 text-white border-white/10'
                }`}
                title={isFriend ? 'دوست شما (کلیک جهت لغو)' : requestSent ? 'درخواست ارسال شد' : 'افزودن به همکاران'}
              >
                {isFriend ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            )}
          </div>

          {/* Department / Community Pill Card */}
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={user} size="xs" className="w-7 h-7 rounded-lg" />
              <div>
                <div className="text-xs font-black text-white">شناسنامه سازمانی بگ تایم</div>
                <div className="text-[10px] text-zinc-400">عضو تاییدشده سامانه</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
              {numericIdStr}
            </span>
          </div>

          {/* Productivity Stats (Tasks Completed & Commitment %) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 text-center space-y-0.5">
              <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                <CheckSquare className="w-3 h-3 text-emerald-400" />
                <span>تسک‌های تکمیل‌شده</span>
              </div>
              <div className="text-base font-black text-white font-mono">
                {toPersianDigits(user.completedTasks ?? 0)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 text-center space-y-0.5">
              <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
                <span>درصد تعهد و پیشرفت</span>
              </div>
              <div className="text-base font-black text-emerald-400 font-mono">
                {toPersianDigits(user.progressPercent ?? 0)}٪
              </div>
            </div>
          </div>

          {/* Details Box (Phone, Bio, Username) */}
          <div className="p-4 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3 shadow-sm">
            {/* Phone */}
            {user.phone && (
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  <span className="text-[11px]">شماره موبایل:</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="font-mono text-white font-bold hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer dir-ltr"
                >
                  <span>{user.phone}</span>
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                </button>
              </div>
            )}

            {/* Bio */}
            <div className="space-y-1 pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                <Info className="w-4 h-4 text-zinc-500" />
                <span>بیوگرافی:</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed pr-6 font-medium select-text">
                {user.bio || 'توسعه‌دهنده و فعال در تیم، علاقه‌مند به بهره‌وری و تمرکز عمیق.'}
              </p>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400">
                <AtSign className="w-4 h-4 text-zinc-500" />
                <span className="text-[11px]">نام کاربری:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="font-mono text-white font-bold hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer dir-ltr"
              >
                <span>@{user.username}</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
            </div>

            {/* Location */}
            {(user.province || user.city) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">موقعیت مکانی:</span>
                <span className="text-xs text-zinc-200 font-bold">
                  {user.province ? `${user.province}، ${user.city || ''}` : user.city}
                </span>
              </div>
            )}
          </div>

          {/* Skills chips */}
          {user.skills && user.skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400">مهارت‌ها:</span>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 border border-white/5 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toggle notifications */}
          {!isMe && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Bell className="w-4 h-4 text-zinc-400" />
                <span>اعلانات کاربر</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  sounds.playPop();
                }}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    notificationsEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 space-y-2">
            {!isMe && onInviteToProject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInviteToProject(user);
                }}
                className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-purple-400" />
                <span>دعوت به پروژه تیمی</span>
              </button>
            )}

            {isMe ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEditProfile) onEditProfile();
                }}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>ویرایش بیوگرافی و اطلاعات من ✏️</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
              >
                بستن شناسنامه
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
