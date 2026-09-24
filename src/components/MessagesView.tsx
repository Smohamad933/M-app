import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import { toPersianDigits } from '../utils/persianDate';
import type { User, DirectChatMessage } from '../types';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Eye,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowRight,
  X,
  ChevronDown,
  LogOut,
} from 'lucide-react';

interface MessagesViewProps {
  initialChatUserId?: string | null;
  onOpenPublicProfile?: (user: User) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialChatUserId,
  onOpenPublicProfile,
}) => {
  const { currentUser, friends, users, setViewingPublicUser, setUserSubscription, setActiveTab, globalSettings } = useTask();

  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch summary of all conversations
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations((prev) => {
        if (prev.length === res.length && JSON.stringify(prev) === JSON.stringify(res)) {
          return prev;
        }
        return res;
      });
    } catch {
      // ignore
    }
  };

  // Fetch messages with active partner
  const loadMessages = async () => {
    if (!activePartner) return;
    try {
      const msgs = await api.getDirectMessages(activePartner.id);
      setMessages((prev) => {
        if (prev.length === msgs.length) {
          const prevLast = prev[prev.length - 1];
          const nextLast = msgs[msgs.length - 1];
          if (prevLast?.id === nextLast?.id && prevLast?.read === nextLast?.read) {
            return prev;
          }
        }
        return msgs;
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Colleagues allowed for chat:
  // ONLY accepted friends + users who already initiated a conversation + Admin for support
  // No random users allowed!
  const allowedPartners = useMemo(() => {
    const partnerMap = new Map<string, User>();

    // 1. Accepted friends
    friends.forEach((f) => {
      if (f.id !== currentUser?.id) {
        partnerMap.set(f.id, f);
      }
    });

    // 2. Any user with whom a conversation already exists (e.g. subscription requests to admin or support)
    conversations.forEach((c) => {
      if (c.partnerId !== currentUser?.id && !partnerMap.has(c.partnerId)) {
        const found = users.find((u) => u.id === c.partnerId);
        if (found) {
          partnerMap.set(found.id, found);
        } else {
          partnerMap.set(c.partnerId, {
            id: c.partnerId,
            name: c.partnerName,
            username: c.partnerUsername,
            avatar: c.partnerAvatar,
            role: 'user',
          } as User);
        }
      }
    });

    // 3. For regular users, include Admin (Mohusyn) for support and subscription activation requests
    if (currentUser?.role !== 'admin') {
      const adminUser = users.find((u) => u.role === 'admin' || u.id === 'usr_admin_mohusyn');
      if (adminUser && adminUser.id !== currentUser?.id && !partnerMap.has(adminUser.id)) {
        partnerMap.set(adminUser.id, adminUser);
      }
    }

    return Array.from(partnerMap.values());
  }, [friends, conversations, users, currentUser]);

  // Set initial partner if provided
  useEffect(() => {
    if (initialChatUserId && users.length > 0) {
      const found = users.find((u) => u.id === initialChatUserId);
      if (found) {
        setActivePartner(found);
      }
    } else if (!activePartner && allowedPartners.length > 0) {
      setActivePartner(allowedPartners[0]);
    }
  }, [initialChatUserId, users, allowedPartners]);

  // Poll messages when active partner changes
  useEffect(() => {
    if (!activePartner) {
      setMessages([]);
      return;
    }
    loadMessages();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [activePartner?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !activePartner || isSending) return;

    sounds.playPop();
    setInputText('');
    setIsSending(true);

    // Instant optimistic render in UI (0ms delay!)
    const tempMsg: DirectChatMessage = {
      id: 'opt_' + Date.now(),
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'من',
      senderAvatar: currentUser?.avatar || null,
      receiverId: activePartner.id,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const sent = await api.sendDirectMessage(activePartner.id, text);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
      // Update conversations preview
      setConversations((prev) => {
        const existing = prev.find((c) => c.partnerId === activePartner.id);
        if (existing) {
          return prev.map((c) =>
            c.partnerId === activePartner.id ? { ...c, lastMessage: sent } : c
          );
        }
        return [
          {
            partnerId: activePartner.id,
            partnerName: activePartner.name,
            partnerUsername: activePartner.username,
            partnerAvatar: activePartner.avatar,
            lastMessage: sent,
            unreadCount: 0,
          },
          ...prev,
        ];
      });
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveSubscription = async (
    msg: DirectChatMessage,
    target: User,
    planType: '1_month' | '3_months' | '6_months',
    planLabel: string
  ) => {
    setApprovingMsgId(msg.id);
    try {
      const days = planType === '6_months' ? 180 : planType === '3_months' ? 90 : 30;
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      const planKey = planType === '6_months' ? 'ultra' : planType === '1_month' ? 'plus' : 'pro';
      await setUserSubscription(target.id, planKey, planType, expiresAt);
      sounds.playComplete();

      // Automatically send an official confirmation reply in the chat
      const confirmationText = `✅ اشتراک ویژه «${planLabel}» شما با موفقیت تأیید و در سیستم فعال گردید. هم‌اکنون به تمامی امکانات پروژه‌های تیمی، وظایف نامحدود و اتاق‌های تمرکز تسک‌روز دسترسی دارید! ⭐`;
      const reply = await api.sendDirectMessage(target.id, confirmationText);
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      alert(err.message || 'خطا در فعال‌سازی اشتراک');
    } finally {
      setApprovingMsgId(null);
    }
  };

  // Filter conversations / colleagues by search query
  const filteredPartners = allowedPartners.filter((u) => {
    if (u.id === currentUser?.id) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      String(u.numericId || '').includes(q)
    );
  });

  const handleSendCardNumber = (planTitle: string) => {
    const subInfo = (globalSettings as any)?.subscriptionInfo;
    const card = subInfo?.cardNumber || '۶۰۳۷-۹۹۷۹-۵۰۵۰-۱۲۳۴';
    const bank = subInfo?.bankName || 'بانک ملی ایران';
    const owner = subInfo?.cardHolder || subInfo?.ownerName || 'سید محمدحسین شیخ الاسلامی';
    const msg = `💳 سلام و درود خدمت شما بزرگوار.\nجهت فعال‌سازی طرح «${planTitle}»، لطفاً مبلغ را به شماره کارت زیر واریز فرمایید:\n\nشماره کارت: ${card}\nبانک: ${bank}\nصاحب حساب: ${owner}\n\nپس از واریز، شماره پیگیری یا ۴ رقم آخر کارت را در پاسخ ارسال فرمایید تا حسابتان فوراً فعال گردد. با تشکر!`;
    setInputText(msg);
    sounds.playPop();
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5 stroke-[2.5] text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                پیام‌ها و گفتگوی مستقیم با همکاران
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                گفتگوی امن P2P
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              ارسال و دریافت پیام‌های لحظه‌ای ذخیره‌شده در پایگاه‌داده، هماهنگی پروژه‌ها و پیگیری امور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activePartner && (
            <>
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setActivePartner(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer md:hidden"
              >
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <span>لیست مخاطبین</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenPublicProfile) onOpenPublicProfile(activePartner);
                  else setViewingPublicUser(activePartner);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>پروفایل همکار</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="خروج از صفحه پیام‌ها و بازگشت به داشبورد"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>خروج از پیام‌ها</span>
          </button>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-175px)] min-h-[500px]">
        {/* Right Pane: Conversations & Colleagues List (4 cols) */}
        <div
          className={`${
            activePartner ? 'hidden md:flex' : 'flex'
          } md:col-span-4 border-l border-slate-200 dark:border-zinc-800 flex-col h-full bg-slate-50/50 dark:bg-zinc-950/40`}
        >
          {/* Search Bar */}
          <div className="p-3.5 border-b border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی همکار در چت..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* List of Colleagues / Chats */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 no-scrollbar">
            {filteredPartners.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-bold">
                    {searchQuery ? 'همکاری با این مشخصات یافت نشد' : 'گفتگو تنها با دوستان و همکاران تایید شده مجاز است'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {searchQuery
                      ? 'املا یا نام کاربری جستجو شده را بررسی کنید'
                      : 'جهت شروع گفتگوی مستقیم، ابتدا از بخش «همکاران و دوستان» درخواست دوستی ارسال و تایید نمایید.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>رفتن به شبکه همکاران و دوستان</span>
                  </button>
                )}
              </div>
            ) : (
              filteredPartners.map((user) => {
                const isSelected = activePartner?.id === user.id;
                const convo = conversations.find((c) => c.partnerId === user.id);
                const lastMsg = convo?.lastMessage;
                const unread = convo?.unreadCount || 0;

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      sounds.playPop();
                      setActivePartner(user);
                    }}
                    className={`p-3.5 flex items-center gap-3 transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-slate-200/70 dark:bg-zinc-800/90 border-r-4 border-slate-900 dark:border-emerald-500'
                        : 'hover:bg-slate-100/70 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={user} size="md" className="w-11 h-11" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-0 right-0" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {user.name}
                        </span>
                        {user.numericId && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{user.numericId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[170px]">
                          {lastMsg ? lastMsg.text : `@${user.username}`}
                        </p>
                        {unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Left Pane: Active Conversation Thread & Input (8 cols) */}
        <div
          className={`${
            activePartner ? 'flex' : 'hidden md:flex'
          } md:col-span-8 flex-col h-full bg-white dark:bg-zinc-900 relative`}
        >
          {activePartner ? (
            <>
              {/* Active Partner Top Bar */}
              <div className="p-3.5 px-4 sm:px-5 border-b border-slate-200/90 dark:border-zinc-800 flex items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-zinc-950/40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Back to Contacts List button (Fixes being stuck in chat) */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActivePartner(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="بازگشت به لیست مخاطبین و انتخاب همکار دیگر"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                    <span>مخاطبین</span>
                  </button>

                  <UserAvatar user={activePartner} size="sm" className="w-9 h-9 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {activePartner.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate hidden sm:inline">
                        @{activePartner.username}
                      </span>
                    </div>
                    {activePartner.jobTitle && (
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block">
                        {activePartner.jobTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Quick Contact Switcher Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsContactPickerOpen((p) => !p)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="تغییر سریع مخاطب گفتگو"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden md:inline">تغییر مخاطب</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {isContactPickerOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl z-50 p-2 space-y-1 max-h-72 overflow-y-auto">
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-1">
                          انتخاب مخاطب برای گفتگو:
                        </div>
                        {allowedPartners.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              sounds.playPop();
                              setActivePartner(u);
                              setIsContactPickerOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl flex items-center gap-2 text-right transition-colors cursor-pointer ${
                              u.id === activePartner.id
                                ? 'bg-indigo-50 text-indigo-900 font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <UserAvatar user={u} size="xs" className="w-7 h-7 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs truncate font-bold">{u.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">@{u.username}</div>
                            </div>
                            {u.id === activePartner.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exit Chat Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="خروج از بخش چت و بازگشت به داشبورد"
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span className="hidden sm:inline">خروج</span>
                  </button>
                </div>
              </div>

              {/* Messages Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30 dark:bg-zinc-950/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        هنوز پیامی با «{activePartner.name}» رد و بدل نشده است.
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        اولین پیام خود را ارسال کنید تا ارتباط مستقیم کاری شما برقرار شود.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    const timeStr = m.createdAt ? m.createdAt.slice(11, 16) : '';

                    const isSubRequest =
                      m.text.includes('درخواست فعال‌سازی') ||
                      m.text.includes('متقاضی ارتقا به طرح') ||
                      m.text.includes('درخواست شماره کارت') ||
                      (m.text.includes('پلن انتخابی:') && m.text.includes('اطلاعات کارت'));

                    let detectedPlan: '1_month' | '3_months' | '6_months' = '1_month';
                    let detectedPlanLabel = 'پلاس Plus (۱ ماهه)';
                    if (m.text.includes('اولترا') || m.text.includes('Ultra') || m.text.includes('۶ ماهه')) {
                      detectedPlan = '6_months';
                      detectedPlanLabel = 'اولترا Ultra (۶ ماهه)';
                    } else if (m.text.includes('پرو') || m.text.includes('Pro') || m.text.includes('۳ ماهه')) {
                      detectedPlan = '3_months';
                      detectedPlanLabel = 'پرو Pro (۳ ماهه)';
                    }

                    const targetUser = isMe ? currentUser : (users.find((u) => u.id === m.senderId) || activePartner);
                    const targetUserInDirectory = users.find((u) => u.id === targetUser?.id) || targetUser;
                    const targetPlan = (targetUserInDirectory?.subscription?.plan || '').toLowerCase();
                    const isTargetPro =
                      targetUserInDirectory?.role === 'admin' ||
                      (targetPlan !== '' && targetPlan !== 'free');

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <UserAvatar
                          name={isMe ? currentUser?.name : activePartner.name}
                          avatar={isMe ? currentUser?.avatar : activePartner.avatar}
                          size="xs"
                          className="w-7 h-7 flex-shrink-0 rounded-full"
                        />

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-2xs ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-bl-none'
                              : 'bg-white text-slate-900 rounded-br-none border border-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-medium select-text">{m.text}</p>

                          {/* ACTIONABLE SUBSCRIPTION BUTTONS IN CHAT */}
                          {isSubRequest && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 space-y-2">
                              {currentUser?.role === 'admin' ? (
                                <div className="space-y-2">
                                  {isTargetPro ? (
                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>
                                        اشتراک ویژه این کاربر فعال است ({targetUserInDirectory?.subscription?.planType === '6_months' ? 'اولترا' : targetUserInDirectory?.subscription?.planType === '3_months' ? 'پرو' : 'پلاس'}) ✅
                                      </span>
                                    </div>
                                  ) : null}

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleSendCardNumber(detectedPlanLabel)}
                                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                      <span>ارسال شماره کارت به کاربر 💳</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={approvingMsgId === m.id}
                                      onClick={() => handleApproveSubscription(m, targetUserInDirectory!, detectedPlan, detectedPlanLabel)}
                                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>
                                        {approvingMsgId === m.id ? 'در حال فعال‌سازی...' : `تأیید و فعال‌سازی فوری ${detectedPlanLabel} ⚡`}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                                  {isTargetPro ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>اشتراک ویژه شما فعال است ✅</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                                      <span>درخواست ثبت شده — در انتظار ارسال شماره کارت توسط مدیر...</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            className={`flex items-center gap-1.5 text-[9px] pt-0.5 justify-end ${
                              isMe ? 'text-zinc-400' : 'text-slate-400'
                            }`}
                          >
                            <span>{timeStr ? toPersianDigits(timeStr) : ''}</span>
                            {isMe && (
                              <span title={m.read ? 'سین شد' : 'ارسال شد (سین نشده)'}>
                                {m.read ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Check className="w-3 h-3 text-zinc-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`ارسال پیام به ${activePartner.name}...`}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-slate-800 dark:focus:border-emerald-500 shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-5 py-3 rounded-2xl bg-[#121212] hover:bg-black text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">{isSending ? 'در حال ارسال...' : 'ارسال'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                  هیچ گفتگویی انتخاب نشده است
                </h4>
                <p className="text-xs text-slate-400">
                  از ستون سمت راست یکی از همکاران را انتخاب کنید تا تاریخچه پیام‌ها نمایش داده شود، یا از طریق دکمه‌های زیر بخش مورد نظرتان را باز کنید.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  بازگشت به داشبورد و وظایف
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  لیست همکاران و دوستان
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
