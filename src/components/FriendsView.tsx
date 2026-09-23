import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
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

  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
    api.searchUsers(q)
      .then((res: User[]) => {
        if (active) {
          // exclude myself from search results
          setSearchResults(res.filter((u) => u.id !== currentUser?.id));
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (active) setIsSearching(false);
      });

    return () => {
      active = false;
    };
  }, [searchQuery, currentUser?.id]);

  const handleSendRequest = async (toUser: User) => {
    try {
      await sendFriendRequest(toUser.id);
      sounds.playComplete();
      setActionNotice(`✅ درخواست همکاری برای «${toUser.name}» ارسال شد.`);
      setTimeout(() => setActionNotice(null), 3000);
      // Update local search result
      setSearchResults((prev) =>
        prev.map((u) => (u.id === toUser.id ? { ...u, hasPendingRequest: true } as any : u))
      );
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال درخواست همکاری');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setActionNotice('✅ درخواست همکاری پذیرفته شد و همکار به لیست شما اضافه گردید.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در پذیرش درخواست');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      sounds.playPop();
    } catch (err: any) {
      alert(err.message || 'خطا در رد درخواست');
    }
  };

  const handleRemoveFriend = async (friend: User) => {
    if (confirm(`آیا از حذف «${friend.name}» از لیست همکاران خود اطمینان دارید؟`)) {
      await removeFriend(friend.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6 stroke-[2.5] text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                شبکه دوستان و همکاران
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                ارتباط مستقیم
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
              جستجو با نام، نام‌کاربری یا شناسه عددی جهت برقراری ارتباط، چت لایو و پروژه‌های تیمی
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('my_friends')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_friends'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>همکاران من ({toPersianDigits(friends.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>درخواست‌ها</span>
            {friendRequests.incoming.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {toPersianDigits(friendRequests.incoming.length)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>جستجوی همکار جدید</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-in fade-in">
          {actionNotice}
        </div>
      )}

      {/* TAB 1: MY FRIENDS */}
      {activeTab === 'my_friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="py-16 text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  هنوز هیچ همکاری به لیست شما اضافه نشده است
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  با جستجوی نام کاربری، نام یا شناسه عددی همکاران خود، برای آنها درخواست همکاری ارسال کنید تا امکان گفتگوی مستقیم و عضویت در پروژه‌ها فعال گردد.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="px-5 py-2.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-2 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>یافتن همکار با جستجو 🔍</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-5 bg-white dark:bg-zinc-900 hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 transition-all flex flex-col justify-between space-y-4 shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <UserAvatar user={friend} size="md" className="w-12 h-12 shadow-sm" />
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-0 right-0" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {friend.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px] dir-ltr text-left">@{friend.username}</span>
                          {friend.numericId && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-mono text-[10px] font-bold">
                              #{friend.numericId}
                            </span>
                          )}
                        </div>
                        {friend.jobTitle && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                            <span>{friend.jobTitle}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend)}
                      className="p-1.5 rounded-xl text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                      title="حذف از همکاران"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleChat(friend)}
                      className="flex-1 py-2 rounded-xl bg-[#121212] hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>پیام مستقیم</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingPublicUser(friend)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                      title="مشاهده شناسنامه و آمار"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span>درخواست‌های همکاری دریافتی ({toPersianDigits(friendRequests.incoming.length)})</span>
            </h3>

            {friendRequests.incoming.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                در حال حاضر درخواست جدیدی دریافت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {friendRequests.incoming.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={req.fromUserName} avatar={req.fromUserAvatar} size="md" />
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {req.fromUserName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          @{req.fromUserUsername}
                        </div>
                        {req.projectName && (
                          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">
                            دعوت به پروژه: {req.projectName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>پذیرش</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رد</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          {friendRequests.outgoing.length > 0 && (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                درخواست‌های ارسال‌شده توسط شما (در انتظار پاسخ)
              </h3>
              <div className="space-y-2">
                {friendRequests.outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400"
                  >
                    <span>ارسال شده به کاربر با شناسه: <code className="font-mono text-slate-900 dark:text-white">{req.toUserId}</code></span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                      {req.status === 'pending' ? 'در انتظار تأیید ⏳' : req.status === 'accepted' ? 'تأیید شد ✅' : 'رد شد'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH COLLEAGUES */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                جستجوی همکار بر اساس نام فارسی، نام‌کاربری انگلیسی (@username) یا شناسه عددی (#1001):
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="مثال: علی، @ali-seyed، #1001 یا 0912..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs outline-none focus:border-slate-800 dark:focus:border-emerald-500 font-bold shadow-inner"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {isSearching && (
              <div className="py-6 text-center text-xs text-slate-400 font-bold">
                در حال جستجو میان کاربران سامانه...
              </div>
            )}

            {!isSearching && searchQuery.trim() && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400">
                  نتایج جستجو ({toPersianDigits(searchResults.length)} کاربر یافت شد):
                </div>

                {searchResults.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                    کاربری با عبارت «{searchQuery}» پیدا نشد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((user) => {
                      const isFriend = friends.some((f) => f.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar user={user} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {user.name}
                                </span>
                                {user.numericId && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[9px] font-bold">
                                    #{user.numericId}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 dir-ltr text-left">
                                @{user.username}
                              </div>
                              {user.jobTitle && (
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                  {user.jobTitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingPublicUser(user)}
                              className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
                              title="مشاهده شناسنامه"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isFriend ? (
                              <button
                                type="button"
                                onClick={() => handleChat(user)}
                                className="px-3 py-2 rounded-xl bg-[#121212] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>چت</span>
                              </button>
                            ) : (user as any).hasPendingRequest ? (
                              <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                                در انتظار تأیید ⏳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendRequest(user)}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>ارسال درخواست</span>
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
        </div>
      )}
    </div>
  );
};
