import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import type { User } from '../types';
import {
  X,
  MessageSquare,
  UserPlus,
  Check,
  MapPin,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  Sparkles,
  Copy,
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
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const isFriend = friends.some((f) => f.id === user.id);
  const numericIdStr = user.numericId ? `#${user.numericId}` : `#${toPersianDigits(1000)}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(`@${user.username} (${numericIdStr})`);
    setCopiedId(true);
    sounds.playPop();
    setTimeout(() => setCopiedId(false), 2000);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Top bar with close */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            شناسنامه عمومی همکار
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Avatar & Identity */}
        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          <div className="relative">
            <UserAvatar user={user} size="xl" className="w-20 h-20 text-2xl shadow-xl ring-4 ring-slate-100 dark:ring-zinc-800" />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" title="آنلاین" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                {user.name}
              </h3>
              {user.role === 'admin' ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                  مدیر سیستم
                </span>
              ) : isPro ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  ویژه Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold">
                  کاربر
                </span>
              )}
            </div>

            {/* Username & Numeric ID */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-mono text-slate-500 dark:text-zinc-400 dir-ltr text-left">
                @{user.username}
              </span>
              <span className="text-slate-300 dark:text-zinc-600">•</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-mono text-[11px] font-bold transition-all cursor-pointer"
                title="کپی شناسه یکتا"
              >
                <span>{numericIdStr}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>

            {user.jobTitle && (
              <p className="text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 pt-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span>{user.jobTitle}</span>
              </p>
            )}

            {(user.province || user.city) && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                <span>{user.province ? `${user.province}، ${user.city || ''}` : user.city}</span>
              </p>
            )}
          </div>
        </div>

        {/* Public Productivity Stats */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-center space-y-0.5">
            <div className="text-[10px] text-slate-500 dark:text-zinc-400">تسک‌های تکمیل‌شده</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {toPersianDigits(user.completedTasks ?? 0)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-center space-y-0.5">
            <div className="text-[10px] text-slate-500 dark:text-zinc-400">درصد تعهد و پیشرفت</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              %{toPersianDigits(user.progressPercent ?? 0)}
            </div>
          </div>
        </div>

        {/* Skills Chips */}
        {user.skills && user.skills.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              مهارت‌ها و حوزه‌های تخصصی:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isMe && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            {/* Direct Chat Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onStartChat) onStartChat(user);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ارسال پیام مستقیم به این همکار 💬</span>
            </button>

            {/* Friend Request / Connection Status */}
            {isFriend ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  در لیست همکاران و دوستان شما قرار دارد
                </span>
                <button
                  type="button"
                  onClick={() => removeFriend(user.id)}
                  className="text-[10px] text-rose-500 hover:text-rose-600 underline cursor-pointer"
                >
                  حذف ارتباط
                </button>
              </div>
            ) : requestSent ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
                درخواست دوستی و همکاری ارسال شد (در انتظار تأیید) ⏳
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendFriendRequest}
                disabled={isSendingRequest}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>{isSendingRequest ? 'در حال ارسال...' : 'افزودن به همکاران / ارسال درخواست دوستی 🤝'}</span>
              </button>
            )}

            {/* Invite to project */}
            {onInviteToProject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInviteToProject(user);
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                <span>دعوت به پروژه تیمی 📁</span>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons for Myself */}
        {isMe && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-[11px] text-indigo-900 leading-relaxed text-center font-medium">
              این پیش‌نمایش شناسنامه عمومی شماست؛ سایر کاربران و همکاران پروفایل شما را به این صورت مشاهده می‌کنند.
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEditProfile) onEditProfile();
              }}
              className="w-full py-2.5 rounded-xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#00b884]" />
              <span>ویرایش اطلاعات و شناسنامه من ✏️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
