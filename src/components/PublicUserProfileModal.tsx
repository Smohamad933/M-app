import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';
import { SubscriptionBadge } from './SubscriptionBadge';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { api } from '../services/api';
import type { User, Task } from '../types';
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
  MapPin,
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
  const { currentUser, friends, sendFriendRequest, removeFriend, tasks: contextTasks } = useTask();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // User's strictly isolated tasks state
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    // If viewing myself, use my own tasks from context
    if (currentUser?.id === user.id) {
      const myTasks = contextTasks.filter((t) => t.userId === user.id || t.userId === user.username);
      setUserTasks(myTasks);
      setIsLoadingTasks(false);
      return;
    }

    // STRICT USER TASK ISOLATION:
    // When viewing another user, NEVER fall back to current user's contextTasks!
    // Query exclusively for tasks belonging to user.id or user.username
    setIsLoadingTasks(true);
    const loadTasks = async () => {
      try {
        const fetched = await api.getTasks({ userId: user.id });
        if (isMounted) {
          if (Array.isArray(fetched)) {
            // Strictly filter out any task that does not belong to the target user
            const targetTasks = fetched.filter(
              (t) => t.userId && (t.userId === user.id || t.userId === user.username)
            );
            setUserTasks(targetTasks);
          } else {
            setUserTasks([]);
          }
        }
      } catch {
        if (isMounted) setUserTasks([]);
      } finally {
        if (isMounted) setIsLoadingTasks(false);
      }
    };

    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.username, currentUser?.id]);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const isFriend = friends.some((f) => f.id === user.id);
  const canViewPhone = currentUser?.role === 'admin' || isMe;
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

  const isPro = user.role === 'admin' || (!!user.subscription?.plan && user.subscription.plan !== 'free');

  // STRICT RULE: Only completed tasks are displayed on user profile
  const completedTasks = userTasks.filter((t) => t.completed);
  const totalTasksCount = userTasks.length > 0 ? userTasks.length : (user.totalTasks || 0);
  const completedTasksCount = userTasks.length > 0 ? completedTasks.length : (user.completedTasks || 0);
  const progressPercent = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : (user.progressPercent || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-[390px] sm:max-w-[420px] bg-[#0c1017] text-slate-100 rounded-[34px] sm:rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-slate-800/90 overflow-hidden relative animate-in zoom-in-95 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Ambient Header - Harmonized Deep Midnight Slate */}
        <div className="relative h-32 sm:h-36 w-full bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0c1017] overflow-hidden flex-shrink-0 border-b border-slate-800/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700/25 via-slate-800/10 to-transparent" />

          {/* Top navigation actions */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title="بستن شناسنامه"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[11px] font-bold text-slate-400 tracking-wider">
              شناسنامه کاربر
            </span>

            <button
              type="button"
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                sounds.playPop();
              }}
              className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isBookmarked
                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/70 hover:bg-slate-800'
              }`}
              title="نشان کردن پروفایل"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Avatar outside overflow-hidden */}
        <div className="relative -mt-14 flex justify-center z-20 flex-shrink-0">
          <div className="relative group">
            <UserAvatar
              user={user}
              size="2xl"
              className="w-24 h-24 sm:w-26 sm:h-26 text-3xl shadow-2xl ring-4 ring-[#0c1017] rounded-full object-cover"
            />
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-[#0c1017]"
              title="آنلاین در سیستم"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 space-y-4 no-scrollbar">
          {/* User Name & Role Status */}
          <div className="text-center space-y-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                {user.name}
              </h3>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black inline-flex items-center gap-1 whitespace-nowrap">
                  <span>🛡️</span>
                  <span>مدیر سیستم</span>
                </span>
              ) : isPro ? (
                <SubscriptionBadge user={user} size="sm" />
              ) : null}
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {user.jobTitle || 'عضو سامانه بَگ‌تایم'} • آخرین بازدید اخیراً
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
              className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700/70 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title="گفتگوی مستقیم"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Phone Call (Strictly Private: only visible to Admin or Self) */}
            {canViewPhone && user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700/70 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                title={`تماس با ${user.phone}`}
              >
                <Phone className="w-4 h-4 text-sky-400" />
              </a>
            )}

            {/* Email */}
            {user.email ? (
              <a
                href={`mailto:${user.email}`}
                className="w-11 h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700/70 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                title={`ارسال ایمیل به ${user.email}`}
              >
                <Mail className="w-4 h-4 text-amber-400" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-11 h-11 rounded-2xl bg-slate-900/40 text-slate-600 flex items-center justify-center border border-slate-800/50 cursor-not-allowed"
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
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700/70'
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
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={user} size="xs" className="w-7 h-7 rounded-lg" />
              <div>
                <div className="text-xs font-black text-white">شناسنامه سازمانی بَگ‌تایم</div>
                <div className="text-[10px] text-slate-400">عضو تاییدشده سامانه</div>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700/70">
              {numericIdStr}
            </span>
          </div>

          {/* Productivity Stats (Tasks Completed & Commitment %) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center space-y-1">
              <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>تسک‌های تکمیل‌شده</span>
              </div>
              <div className="text-base font-black text-white font-mono flex items-center justify-center gap-1">
                <span>{toPersianDigits(completedTasksCount)}</span>
                <span className="text-[10px] text-slate-500 font-normal">از {toPersianDigits(totalTasksCount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-center space-y-1">
              <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>درصد تعهد و پیشرفت</span>
              </div>
              <div className="text-base font-black text-emerald-400 font-mono">
                {toPersianDigits(progressPercent)}٪
              </div>
            </div>
          </div>

          {/* Details Box (Phone, Bio, Username, Location) */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 space-y-3 shadow-sm">
            {/* Phone (Strictly Private: only visible to Admin or Self) */}
            {canViewPhone && user.phone && (
              <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px]">شماره موبایل:</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="font-mono text-white font-bold hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer dir-ltr"
                >
                  <span>{user.phone}</span>
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              </div>
            )}

            {/* Bio */}
            <div className="space-y-1 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Info className="w-4 h-4 text-slate-500" />
                <span>بیوگرافی:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pr-6 font-medium select-text">
                {user.bio || 'توسعه‌دهنده و فعال در تیم، علاقه‌مند به بهره‌وری و تمرکز عمیق.'}
              </p>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <AtSign className="w-4 h-4 text-slate-500" />
                <span className="text-[11px]">نام کاربری:</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="font-mono text-white font-bold hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer dir-ltr"
              >
                <span>@{user.username}</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>

            {/* Location */}
            {(user.province || user.city) && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px]">موقعیت مکانی:</span>
                </div>
                <span className="text-xs text-slate-200 font-bold">
                  {user.province ? `${user.province}، ${user.city || ''}` : user.city}
                </span>
              </div>
            )}
          </div>

          {/* Skills chips */}
          {user.skills && user.skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400">مهارت‌ها:</span>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toggle notifications */}
          {!isMe && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>دریافت اعلانات این کاربر</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  sounds.playPop();
                }}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-700'
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
                className="w-full py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700/70 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>دعوت به پروژه تیمی</span>
              </button>
            )}

            {isMe && onEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProfile();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>ویرایش اطلاعات شناسنامه من</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
