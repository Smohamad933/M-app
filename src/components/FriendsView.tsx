import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { User } from '../types';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export interface FriendItem {
  id: string;
  name: string;
  username?: string;
  jobTitle?: string;
  avatar?: string | null;
  online?: boolean;
  addedAt?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  fromUsername: string;
  fromAvatar?: string | null;
  toUserId: string;
  createdAt: string;
}

export interface FriendsViewProps {
  onStartChat?: (user: FriendItem) => void;
  onOpenChatWithUser?: (friend: FriendItem) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onStartChat, onOpenChatWithUser }) => {
  const handleChat = (f: FriendItem) => {
    if (onStartChat) onStartChat(f);
    else if (onOpenChatWithUser) onOpenChatWithUser(f);
  };
  const { currentUser, users } = useTask();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');

  const myId = currentUser?.id || 'me';

  // Load friends from localStorage
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_friends_${myId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Load incoming friend requests
  const [requests, setRequests] = useState<FriendRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`taskrooz_requests_${myId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [serverSearchResults, setServerSearchResults] = useState<typeof users>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`taskrooz_friends_${myId}`, JSON.stringify(friends));
      window.dispatchEvent(new CustomEvent('taskrooz-friends-changed', { detail: friends }));
    } catch {}
  }, [friends, myId]);

  useEffect(() => {
    try {
      localStorage.setItem(`taskrooz_requests_${myId}`, JSON.stringify(requests));
    } catch {}
  }, [requests, myId]);

  // Live server search when query is typed
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) {
      setServerSearchResults([]);
      setIsSearching(false);
      return;
    }
    let active = true;
    setIsSearching(true);
    api.searchUsers(q)
      .then((res: User[]) => {
        if (active) {
          setServerSearchResults(res.filter((u: User) => u.id !== currentUser?.id));
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

  // Combined search results: server results + context users
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];

    const map = new Map<string, (typeof users)[0]>();
    serverSearchResults.forEach((u) => {
      if (u.id !== currentUser?.id) map.set(u.id, u);
    });
    users
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) => {
        const matchName = u.name && u.name.toLowerCase().includes(q);
        const matchUser = u.username && u.username.toLowerCase().includes(q);
        const matchJob = u.jobTitle && u.jobTitle.toLowerCase().includes(q);
        return matchName || matchUser || matchJob;
      })
      .forEach((u) => map.set(u.id, u));

    return Array.from(map.values()).slice(0, 20);
  })();

  const handleSendRequest = (user: (typeof users)[0]) => {
    sounds.playComplete();
    // Check if already friends
    if (friends.some((f) => f.id === user.id)) {
      setSentNotice(`شما قبلاً با «${user.name}» همکار و دوست هستید.`);
      setTimeout(() => setSentNotice(null), 3500);
      return;
    }

    const newFriend: FriendItem = {
      id: user.id,
      name: user.name,
      username: user.username,
      jobTitle: user.jobTitle || 'همکار تیمی',
      avatar: user.avatar,
      online: true,
      addedAt: new Date().toISOString(),
    };
    const updated = [...friends, newFriend];
    setFriends(updated);
    setSentNotice(`✅ «${user.name}» (@${user.username}) به لیست همکاران و دوستان شما اضافه شد!`);
    setTimeout(() => setSentNotice(null), 4000);
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    sounds.playComplete();
    const newFriend: FriendItem = {
      id: req.fromUserId,
      name: req.fromName,
      username: req.fromUsername,
      jobTitle: 'همکار تیمی',
      avatar: req.fromAvatar,
      online: true,
      addedAt: new Date().toISOString(),
    };
    setFriends([...friends, newFriend]);
    setRequests(requests.filter((r) => r.id !== req.id));
  };

  const handleRejectRequest = (reqId: string) => {
    sounds.playPop();
    setRequests(requests.filter((r) => r.id !== reqId));
  };

  const handleRemoveFriend = (friendId: string) => {
    if (window.confirm('آیا مایلید این کاربر از لیست دوستان شما حذف شود؟')) {
      sounds.playPop();
      setFriends(friends.filter((f) => f.id !== friendId));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6 text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                شبکه دوستان و همکاران (Friends & Colleagues)
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00895f] border border-emerald-200 font-extrabold">
                امن و اختصاصی
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              برای حفظ حریم خصوصی، کاربران با جستجوی نام کاربری یافت می‌شوند و با تایید متقابل به لیست اضافه می‌گردند
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/70 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('my_friends')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my_friends'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            دوستان من ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            درخواست‌ها
            {requests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#f95738] text-white text-[10px] font-black flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            جستجوی کاربر جدید
          </button>
        </div>
      </div>

      {sentNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-200 font-bold animate-in fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-[#00b884]" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* TAB 1: MY FRIENDS */}
      {activeTab === 'my_friends' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar
                        name={friend.name}
                        avatar={friend.avatar}
                        size="w-12 h-12 rounded-full text-sm"
                        className="border-2 border-[#00b884]"
                      />
                      {friend.online && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#00b884] border-2 border-white absolute bottom-0 left-0" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 leading-snug">
                        {friend.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 font-bold">
                        @{friend.username}
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                        {friend.jobTitle || 'همکار تیمی'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleChat(friend)}
                    className="flex-1 py-2 rounded-xl bg-[#121212] hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ارسال پیام و چت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="حذف از دوستان"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {friends.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-700">هنوز دوستی به لیست شما اضافه نشده است</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                از بخش «جستجوی کاربر جدید» همکاران یا دوستان خود را با نام کاربری پیدا کرده و درخواست دوستی بفرستید.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={req.fromName}
                    avatar={req.fromAvatar}
                    size="w-11 h-11 rounded-full text-xs"
                    className="border-2 border-slate-300"
                  />
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      {req.fromName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 font-bold">
                      @{req.fromUsername} • {req.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req)}
                    className="px-4 py-2 rounded-xl bg-[#121212] hover:bg-black text-white text-xs font-black transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#00b884]" />
                    <span>قبول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    رد
                  </button>
                </div>
              </div>
            ))}
          </div>

          {requests.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
              <Check className="w-8 h-8 text-[#00b884] mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-700">درخواست دوستی جدیدی وجود ندارد</h4>
              <p className="text-xs text-slate-400">تمام درخواست‌های دوستی بررسی شده‌اند.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH USER */}
      {activeTab === 'search' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>جستجوی همکار یا کاربر با آیدی یا نام</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="حداقل ۲ حرف از نام کاربری (@username) یا نام شخص را تایپ کنید..."
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white font-bold transition-all shadow-2xs"
                autoFocus
              />
            </div>
          </div>

          {/* Results list */}
          {isSearching && (
            <div className="text-xs text-slate-400 font-bold animate-pulse pt-2">
              در حال جستجو در میان کاربران سامانه...
            </div>
          )}

          {searchQuery.trim().length >= 1 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-bold text-slate-400">
                نتایج جستجو ({searchResults.length} کاربر پیدا شد):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((user) => {
                  const isFriend = friends.some((f) => f.id === user.id);

                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-[#f8fafc] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user.name}
                          avatar={user.avatar}
                          size="w-10 h-10 rounded-full text-xs"
                          className="border-2 border-slate-300"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-slate-900">{user.name}</span>
                            {user.role === 'admin' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 font-black">
                                مدیر
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold block">
                            @{user.username}
                          </span>
                          {user.jobTitle && (
                            <span className="text-[10px] text-slate-500 block">
                              {user.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {isFriend ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2.5 py-1 rounded-xl bg-emerald-50 text-[#00895f] border border-emerald-200 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>همکار</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const f = friends.find((item) => item.id === user.id);
                              if (f) handleChat(f);
                            }}
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs cursor-pointer shadow-xs"
                            title="شروع گفتگو"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendRequest(user)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#121212] hover:bg-black text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#00b884]" />
                          <span>افزودن همکار</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isSearching && searchResults.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                  کاربری با عبارت «{searchQuery}» پیدا نشد.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
