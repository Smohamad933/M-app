import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { getUserGems, deductGems } from '../utils/gemManager';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
  Clock,
  Briefcase,
  Trash2,
  Eye,
  Sparkles,
  Copy,
  CheckCheck,
  Share2,
  Gift,
  UserCheck,
} from 'lucide-react';

export interface FriendsViewProps {
  onStartChat?: (user: User) => void;
  onOpenChatWithUser?: (friend: User) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onStartChat, onOpenChatWithUser }) => {
  const {
    currentUser,
    friends,
    friendRequests,
    refreshFriends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    setViewingPublicUser,
  } = useTask();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');
  const [requestsSubTab, setRequestsSubTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter inside friends
  const [friendsFilter, setFriendsFilter] = useState<'all' | 'with_role'>('all');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');

  // UI Feedback
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isCopiedInvite, setIsCopiedInvite] = useState(false);

  // Gem Gifting Modal State
  const [giftingToUser, setGiftingToUser] = useState<User | null>(null);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  const [giftNotice, setGiftNotice] = useState<string | null>(null);

  // Current user gems
  const userGems = useMemo(() => {
    return getUserGems(currentUser?.id || 'guest');
  }, [currentUser?.id, actionNotice]);

  const handleChat = (u: User) => {
    sounds.playPop();
    if (onStartChat) onStartChat(u);
    else if (onOpenChatWithUser) onOpenChatWithUser(u);
  };

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  // Live search colleagues on server
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = setTimeout(() => {
      api.searchUsers(q)
        .then((res: User[]) => {
          if (active) {
            setSearchResults(res.filter((u) => u.id !== currentUser?.id));
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (active) setIsSearching(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser?.id]);

  const handleSendRequest = async (toUser: User) => {
    try {
      sounds.playPop();
      await sendFriendRequest(toUser.id);
      sounds.playComplete();
      setActionNotice(`درخواست همکاری برای «${toUser.name}» با موفقیت ارسال شد.`);
      setTimeout(() => setActionNotice(null), 3500);

      setSearchResults((prev) =>
        prev.map((u) => (u.id === toUser.id ? ({ ...u, hasPendingRequest: true } as any) : u))
      );
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال درخواست همکاری');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      sounds.playComplete();
      await acceptFriendRequest(requestId);
      setActionNotice('درخواست همکاری پذیرفته شد و همکار جدید به فهرست شما پیوست! 🤝');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'خطا در پذیرش درخواست');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      sounds.playPop();
      await rejectFriendRequest(requestId);
    } catch (err: any) {
      alert(err.message || 'خطا در رد درخواست');
    }
  };

  const handleRemoveFriend = async (friend: User) => {
    if (confirm(`آیا از حذف «${friend.name}» از لیست همکاران اطمینان دارید؟`)) {
      sounds.playPop();
      await removeFriend(friend.id);
      setActionNotice(`«${friend.name}» از لیست همکاران حذف شد.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Copy personal invite link
  const handleCopyInviteLink = () => {
    sounds.playPop();
    const username = currentUser?.username || 'user';
    const numId = currentUser?.numericId || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = `${origin}/?invite=${username}&ref=${numId}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      setIsCopiedInvite(true);
      setTimeout(() => setIsCopiedInvite(false), 2500);
    }
  };

  // Send Gems Gift
  const handleConfirmGift = () => {
    if (!giftingToUser) return;
    if (userGems < giftAmount) {
      setGiftNotice('موجودی الماس شما کافی نیست!');
      setTimeout(() => setGiftNotice(null), 2500);
      return;
    }

    const success = deductGems(currentUser?.id || 'guest', giftAmount);
    if (success) {
      sounds.playComplete();
      setActionNotice(`🎁 ${toPersianDigits(giftAmount)} الماس به عنوان پاداش برای «${giftingToUser.name}» ارسال شد!`);
      setTimeout(() => setActionNotice(null), 4000);
      setGiftingToUser(null);
    } else {
      setGiftNotice('خطا در انتقال الماس');
    }
  };

  // Filtered friends list
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      if (friendsFilter === 'with_role' && !f.jobTitle) return false;
      if (friendsSearchQuery.trim()) {
        const q = friendsSearchQuery.toLowerCase().trim();
        const mName = f.name.toLowerCase().includes(q);
        const mUser = f.username.toLowerCase().includes(q);
        const mJob = f.jobTitle?.toLowerCase().includes(q);
        const mNum = f.numericId ? String(f.numericId).includes(q) : false;
        if (!mName && !mUser && !mJob && !mNum) return false;
      }
      return true;
    });
  }, [friends, friendsFilter, friendsSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in pb-20 w-full select-none" dir="rtl">
      {/* 1. HERO BENTO OVERVIEW BAR */}
      <div className="relative p-6 sm:p-7 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Soft Ambient Aurora Mesh Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(0,184,132,0.3)]">
                <Users className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>شبکه همکاران و تیم</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    اتصال زنده
                  </span>
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium">
                  مدیریت روابط کاری، گفتگوی مستقیم، اشتراک پروژه‌ها و پاداش الماس
                </p>
              </div>
            </div>
          </div>

          {/* KPI Stat Cards & Personal Invite ID */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* My Connected Friends Stat */}
            <div className="p-3 sm:px-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {toPersianDigits(friends.length)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">همکار متصل</div>
              </div>
            </div>

            {/* Pending Requests Stat */}
            <div className="p-3 sm:px-4 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {toPersianDigits(friendRequests.incoming.length)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">درخواست جدید</div>
              </div>
            </div>

            {/* Personal ID & Quick Copy */}
            <div className="p-2.5 sm:px-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  شناسه شما:
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white font-mono flex items-center gap-1 dir-ltr">
                  <span>@{currentUser?.username || 'user'}</span>
                  {currentUser?.numericId && (
                    <span className="text-[10px] opacity-70">#{currentUser.numericId}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="کپی لینک دعوت همکار"
              >
                {isCopiedInvite ? (
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {actionNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center animate-in fade-in duration-200">
            {actionNotice}
          </div>
        )}
      </div>

      {/* 2. MAIN NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="p-1 bg-white dark:bg-[#1c1c1e] rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('my_friends');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'my_friends'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>همکاران من</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'my_friends'
                ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            }`}>
              {toPersianDigits(friends.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('requests');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'requests'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>درخواست‌ها</span>
            {friendRequests.incoming.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {toPersianDigits(friendRequests.incoming.length)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('search');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'search'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>یافتن همکار جدید</span>
          </button>
        </div>

        {/* Search within connected friends (only on my_friends tab) */}
        {activeTab === 'my_friends' && friends.length > 0 && (
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={friendsSearchQuery}
                onChange={(e) => setFriendsSearchQuery(e.target.value)}
                placeholder="فیلتر نام یا سمت همکار..."
                className="w-full px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setFriendsFilter(friendsFilter === 'all' ? 'with_role' : 'all');
              }}
              className={`p-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                friendsFilter === 'with_role'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] text-slate-500'
              }`}
              title="فیلتر افراد دارای سمت شغلی"
            >
              <Briefcase className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB 1: MY FRIENDS (CONNECTED COLLEAGUES) */}
      {activeTab === 'my_friends' && (
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="py-16 text-center p-8 bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-dashed border-black/[0.08] dark:border-white/[0.1] space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {friendsSearchQuery.trim()
                    ? 'همکاری با این مشخصات یافت نشد'
                    : 'هنوز هیچ همکاری به شبکه شما اضافه نشده است'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {friendsSearchQuery.trim()
                    ? 'املا یا کلمات کلیدی دیگری را امتحان کنید.'
                    : 'با ارسال درخواست همکاری یا اشتراک شناسه، همکاران خود را متصل کنید تا چت مستقیم و مدیریت مشترک پروژه‌ها فعال گردد.'}
                </p>
              </div>

              {!friendsSearchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('search');
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>جستجو و افزودن اولین همکار 🤝</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] group hover:shadow-md"
                >
                  {/* Card Header Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <UserAvatar user={friend} size="md" className="w-13 h-13 shadow-sm rounded-2xl" />
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1c1c1e] absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {friend.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px] dir-ltr text-left">
                            @{friend.username}
                          </span>
                          {friend.numericId && (
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-mono text-[10px] font-bold">
                              #{friend.numericId}
                            </span>
                          )}
                        </div>

                        {friend.jobTitle && (
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                            <span className="truncate">{friend.jobTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options / Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend)}
                      className="p-1.5 rounded-xl text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="حذف از همکاران"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleChat(friend)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 hover:opacity-90"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>پیام مستقیم</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setViewingPublicUser(friend);
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="مشاهده شناسنامه و آمار کاری"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        setGiftingToUser(friend);
                      }}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                      title="ارسال هدیه الماس به همکار"
                    >
                      <Gift className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: REQUESTS HUB (INCOMING & OUTGOING) */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.08] pb-3">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setRequestsSubTab('incoming');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                requestsSubTab === 'incoming'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span>دریافتی</span>
              <span className="font-mono text-[10px]">({toPersianDigits(friendRequests.incoming.length)})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                setRequestsSubTab('outgoing');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                requestsSubTab === 'outgoing'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span>ارسالی</span>
              <span className="font-mono text-[10px]">({toPersianDigits(friendRequests.outgoing.length)})</span>
            </button>
          </div>

          {requestsSubTab === 'incoming' && (
            <div className="space-y-3">
              {friendRequests.incoming.length === 0 ? (
                <div className="py-12 text-center p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-dashed border-black/[0.06] dark:border-white/[0.08]">
                  <p className="text-xs text-slate-400 font-bold">در حال حاضر درخواست جدیدی دریافت نکرده‌اید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friendRequests.incoming.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={req.fromUserName} avatar={req.fromUserAvatar} size="md" className="w-11 h-11 flex-shrink-0 rounded-2xl" />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {req.fromUserName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            @{req.fromUserUsername}
                          </div>
                          {req.projectName && (
                            <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold mt-0.5 truncate">
                              دعوت به پروژه: {req.projectName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>پذیرش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {requestsSubTab === 'outgoing' && (
            <div className="space-y-3">
              {friendRequests.outgoing.length === 0 ? (
                <div className="py-12 text-center p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-dashed border-black/[0.06] dark:border-white/[0.08]">
                  <p className="text-xs text-slate-400 font-bold">هیچ درخواستی در وضعیت انتظار برای همکاران ارسال نکرده‌اید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friendRequests.outgoing.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">
                            شناسه کاربر: {req.toUserId}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                            در انتظار تأیید طرف مقابل ⏳
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500">
                        ارسال‌شده
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: EXPLORE & SEARCH COLLEAGUES */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 dark:text-white">
                جستجوی مستقیم در دیتابیس همکاران:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="نام فارسی، نام‌کاربری انگلیسی (@username) یا کد عددی (#1001)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {isSearching && (
              <div className="py-6 text-center text-xs text-slate-400 font-bold animate-pulse">
                در حال جستجو میان کاربران سامانه...
              </div>
            )}

            {!isSearching && searchQuery.trim() && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                  <span>نتایج جستجو:</span>
                  <span className="font-mono">{toPersianDigits(searchResults.length)} کاربر یافت شد</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-bold border border-dashed border-black/[0.06] dark:border-white/[0.08] rounded-2xl">
                    کاربری با عبارت «{searchQuery}» پیدا نشد. از همکارتان بخواهید کد عددی‌اش را به شما بدهد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((user) => {
                      const isFriend = friends.some((f) => f.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className="p-4 rounded-[24px] bg-slate-50/70 dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar user={user} size="md" className="w-11 h-11 flex-shrink-0 rounded-2xl" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {user.name}
                                </span>
                                {user.numericId && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[9px] font-bold border border-black/[0.04] dark:border-white/[0.06]">
                                    #{user.numericId}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dir-ltr text-right truncate">
                                @{user.username}
                              </div>
                              {user.jobTitle && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {user.jobTitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playPop();
                                setViewingPublicUser(user);
                              }}
                              className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] text-slate-600 dark:text-zinc-300 text-xs font-bold border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer"
                              title="مشاهده شناسنامه"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isFriend ? (
                              <button
                                type="button"
                                onClick={() => handleChat(user)}
                                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>چت</span>
                              </button>
                            ) : (user as any).hasPendingRequest ? (
                              <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                در انتظار تأیید ⏳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendRequest(user)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>درخواست همکاری</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Referral Reward Callout Card */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-600/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <h4 className="text-sm font-black text-white">
                  دعوت از همکاران جدید = ۵۰ الماس پاداش برای شما!
                </h4>
              </div>
              <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
                لینک دعوت اختصاصی خود را برای هم‌تیمی‌ها بفرستید تا پس از عضویت، ۵۰ الماس به باغچه تمرکز شما اضافه شود.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
            >
              {isCopiedInvite ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{isCopiedInvite ? 'لینک کپی شد!' : 'کپی لینک و دعوت'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. GEM GIFTING POPUP MODAL */}
      {giftingToUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-black/[0.08] dark:border-white/[0.12] p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ارسال هدیه الماس به «{giftingToUser.name}»
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                به پاس تلاش و همراهی، به همکار خود الماس هدیه دهید.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setGiftAmount(amt)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer font-mono ${
                    giftAmount === amt
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  +{toPersianDigits(amt)} 💎
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              موجودی فعلی شما: <span className="font-mono font-bold text-amber-500">{toPersianDigits(userGems)}</span> الماس
            </div>

            {giftNotice && (
              <div className="text-xs text-rose-500 font-bold">{giftNotice}</div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmGift}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                ارسال هدیه
              </button>
              <button
                type="button"
                onClick={() => setGiftingToUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
