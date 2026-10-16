import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import { toPersianDigits } from '../utils/persianDate';
import { getUserGems, deductGems } from '../utils/gemManager';
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
  ArrowRight,
  X,
  ChevronDown,
  LogOut,
  Gift,
} from 'lucide-react';

interface MessagesViewProps {
  initialChatUserId?: string | null;
  onOpenPublicProfile?: (user: User) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialChatUserId,
  onOpenPublicProfile,
}) => {
  const {
    currentUser,
    friends,
    users,
    setViewingPublicUser,
    setUserSubscription,
    setActiveTab,
    globalSettings,
  } = useTask();

  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isGiftingOpen, setIsGiftingOpen] = useState(false);
  const [giftingAmount, setGiftingAmount] = useState<number>(10);
  const [giftFeedback, setGiftFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User Gems
  const userGems = useMemo(() => {
    return getUserGems(currentUser?.id || 'guest');
  }, [currentUser?.id, giftFeedback]);

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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Allowed Partners (Friends + Active Conversations + Admin)
  const allowedPartners = useMemo(() => {
    const partnerMap = new Map<string, User>();

    // 1. Accepted friends
    friends.forEach((f) => {
      if (f.id !== currentUser?.id) {
        partnerMap.set(f.id, f);
      }
    });

    // 2. Active conversations
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

    // 3. Admin user for customer support
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
    }, 3500);
    return () => clearInterval(interval);
  }, [activePartner?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activePartner || isSending) return;

    sounds.playPop();
    setInputText('');
    setIsSending(true);

    // Instant optimistic render in UI
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
      if (sent && sent.id) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
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
      }
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
      await setUserSubscription(target.id, 'pro', planType, expiresAt);
      sounds.playComplete();

      const confirmationText = `✅ اشتراک ویژه «${planLabel}» شما با موفقیت تأیید و در سیستم فعال گردید. هم‌اکنون به تمامی امکانات پروژه‌های تیمی، وظایف نامحدود و اتاق‌های تمرکز تسک‌روز دسترسی دارید! ⭐`;
      const reply = await api.sendDirectMessage(target.id, confirmationText);
      if (reply && reply.id) {
        setMessages((prev) => [...prev, reply]);
      }
    } catch (err: any) {
      alert(err.message || 'خطا در فعال‌سازی اشتراک');
    } finally {
      setApprovingMsgId(null);
    }
  };

  // Quick gift gems inside chat
  const handleGiftGemsInChat = async () => {
    if (!activePartner) return;
    if (userGems < giftingAmount) {
      setGiftFeedback('موجودی الماس شما کافی نیست!');
      setTimeout(() => setGiftFeedback(null), 2500);
      return;
    }

    const deducted = deductGems(currentUser?.id || 'guest', giftingAmount);
    if (deducted) {
      sounds.playComplete();
      setIsGiftingOpen(false);
      const giftMessage = `🎁 به پاس همکاری و تلاش، ${toPersianDigits(giftingAmount)} الماس به عنوان هدیه برای شما ارسال شد! ✨💎`;
      await handleSendMessage(giftMessage);
    }
  };

  const handleSendCardNumber = (planTitle: string) => {
    const subInfo = (globalSettings as any)?.subscriptionInfo;
    const card = subInfo?.cardNumber || '۶۰۳۷-۹۹۷۹-۵۰۵۰-۱۲۳۴';
    const bank = subInfo?.bankName || 'بانک ملی ایران';
    const owner = subInfo?.cardHolder || subInfo?.ownerName || 'سید محمدحسین شیخ الاسلامی';
    const msg = `💳 سلام و درود خدمت شما بزرگوار.\nجهت فعال‌سازی طرح «${planTitle}»، لطفاً مبلغ را به شماره کارت زیر واریز فرمایید:\n\nشماره کارت: ${card}\nبانک: ${bank}\nصاحب حساب: ${owner}\n\nپس از واریز، شماره پیگیری یا ۴ رقم آخر کارت را در پاسخ ارسال فرمایید تا حسابتان فوراً فعال گردد. با تشکر!`;
    setInputText(msg);
    sounds.playPop();
  };

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

  const quickReplies = [
    'سلام و خسته نباشید 🌿',
    'تسک با موفقیت انجام شد ✅',
    'بررسی شد، موافقم 👍',
    'برای فردا هماهنگ می‌کنیم ⏳',
  ];

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-16 select-none" dir="rtl">
      {/* 1. TOP BENTO BAR */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(99,102,241,0.3)]">
            <MessageSquare className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                پیام‌ها و گفتگوی کاری
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                ارتباط زنده P2P
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5 font-medium">
              گفتگوی مستقیم با اعضای تیم، اشتراک اسناد و هماهنگی سریع اهداف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activePartner && (
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                if (onOpenPublicProfile) onOpenPublicProfile(activePartner);
                else setViewingPublicUser(activePartner);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پروفایل {activePartner.name.split(' ')[0]}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('tasks');
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="خروج از پیام‌ها و بازگشت به کارهای من"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>خروج به کارهای من</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN MESSAGING WINDOW (TELEGRAM & APPLE STYLE) */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-190px)] min-h-[520px]">
        {/* RIGHT SIDE: CONVERSATIONS & CONTACTS (4 Cols) */}
        <div
          className={`${
            activePartner ? 'hidden md:flex' : 'flex'
          } md:col-span-4 border-l border-black/[0.06] dark:border-white/[0.08] flex-col h-full bg-slate-50/50 dark:bg-[#18181a] select-none`}
        >
          {/* Search Contacts Bar */}
          <div className="p-3.5 border-b border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی همکار یا نام کاربری..."
                className="w-full pr-9 pl-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 absolute left-3 top-3 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-black/[0.03] dark:divide-white/[0.04]">
            {filteredPartners.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-700 dark:text-zinc-200 font-bold">
                    {searchQuery ? 'همکاری با این مشخصات یافت نشد' : 'هنوز همکار فعالی متصل نشده است'}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {searchQuery
                      ? 'املا یا نام کاربری را بررسی کنید'
                      : 'جهت شروع گفتگوی کاری، از بخش «همکاران و تیم» درخواست ارتباط ارسال فرمایید.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActiveTab('friends');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    یافتن همکار 🤝
                  </button>
                )}
              </div>
            ) : (
              filteredPartners.map((partner) => {
                const isSelected = activePartner?.id === partner.id;
                const conv = conversations.find((c) => c.partnerId === partner.id);
                const lastText = conv?.lastMessage?.text || '';
                const unreadCount = conv?.unreadCount || 0;
                const lastTime = conv?.lastMessage?.createdAt
                  ? conv.lastMessage.createdAt.slice(11, 16)
                  : '';

                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActivePartner(partner);
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 transition-all cursor-pointer text-right group ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-r-4 border-indigo-600'
                        : 'hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={partner} size="md" className="w-12 h-12 rounded-2xl shadow-2xs" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1c1c1e] absolute bottom-0 right-0 shadow-xs" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-black truncate ${
                          isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-zinc-100'
                        }`}>
                          {partner.name}
                        </span>
                        {lastTime && (
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {toPersianDigits(lastTime)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] truncate flex-1 ${
                          unreadCount > 0
                            ? 'font-black text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-zinc-400 font-medium'
                        }`}>
                          {lastText ? lastText : partner.jobTitle || `@${partner.username}`}
                        </p>

                        {unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white font-mono font-black text-[9px] flex items-center justify-center flex-shrink-0">
                            {toPersianDigits(unreadCount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* LEFT SIDE: ACTIVE CHAT STREAM & INPUT BAR (8 Cols) */}
        <div
          className={`${
            activePartner ? 'flex' : 'hidden md:flex'
          } md:col-span-8 flex-col h-full bg-white dark:bg-[#1c1c1e] relative`}
        >
          {activePartner ? (
            <>
              {/* Chat Window Header */}
              <div className="p-3.5 sm:p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md flex-shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setActivePartner(null);
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 md:hidden cursor-pointer"
                    title="بازگشت به مخاطبین"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <UserAvatar user={activePartner} size="md" className="w-10 h-10 rounded-2xl shadow-xs" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1c1c1e] absolute -bottom-0.5 -right-0.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {activePartner.name}
                      </span>
                      {activePartner.numericId && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono text-[9px] font-bold">
                          #{activePartner.numericId}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium truncate block">
                      {activePartner.jobTitle || `@${activePartner.username}`}
                    </span>
                  </div>
                </div>

                {/* Header Quick Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Gift Gems Button */}
                  <button
                    type="button"
                    onClick={() => setIsGiftingOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500/20"
                    title="اهدای الماس به همکار"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">هدیه الماس</span>
                  </button>

                  {/* Switch Contact Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsContactPickerOpen((p) => !p)}
                      className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="انتخاب همکار دیگر"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">تغییر مخاطب</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>

                    {isContactPickerOpen && (
                      <div className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-[#252528] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl z-50 p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-1">
                          گفتگو با همکار دیگر:
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
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <UserAvatar user={u} size="xs" className="w-6 h-6 flex-shrink-0" />
                            <span className="text-xs truncate flex-1">{u.name}</span>
                            {u.id === activePartner.id && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Stream Bubbles */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/50 dark:bg-[#151517]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        گفتگو با «{activePartner.name}» آماده است! 🚀
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
                        پیامی بنویسید یا از پاسخ‌های آماده زیر برای شروع سریع مکالمه کاری استفاده نمایید.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages
                    .filter((m): m is DirectChatMessage => Boolean(m && typeof m === 'object' && m.id && m.senderId))
                    .map((m) => {
                      const isMe = m.senderId === currentUser?.id;
                      const timeStr = m.createdAt ? m.createdAt.slice(11, 16) : '';

                      // Rich Card Detection (Subscription & Bank Details)
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

                      const isTargetPro =
                        activePartner &&
                        activePartner.subscription &&
                        activePartner.subscription.plan !== 'free';

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2.5 ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <UserAvatar user={activePartner} size="xs" className="w-7 h-7 rounded-xl flex-shrink-0 mb-1" />
                          )}

                          <div
                            className={`max-w-[85%] sm:max-w-md p-3.5 rounded-[22px] shadow-2xs space-y-1.5 transition-all text-right leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-tr from-slate-900 to-zinc-800 dark:from-emerald-600 dark:to-teal-600 text-white rounded-br-xs'
                                : 'bg-white dark:bg-[#252528] text-slate-800 dark:text-zinc-100 border border-black/[0.05] dark:border-white/[0.08] rounded-bl-xs'
                            }`}
                          >
                            <p className="text-xs font-medium whitespace-pre-wrap break-words leading-relaxed">
                              {m.text}
                            </p>

                            {/* Admin 1-Click Subscription Approval Badge */}
                            {isSubRequest && (
                              <div className="pt-2 border-t border-white/20 dark:border-white/10 space-y-2">
                                {currentUser?.role === 'admin' && !isMe ? (
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-amber-300">
                                      طرح درخواستی: {detectedPlanLabel}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        disabled={approvingMsgId === m.id}
                                        onClick={() =>
                                          handleApproveSubscription(m, activePartner, detectedPlan, detectedPlanLabel)
                                        }
                                        className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        <span>تأیید و ارتقای حساب ⭐</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSendCardNumber(detectedPlanLabel)}
                                        className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        ارسال شماره کارت
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold flex items-center gap-1">
                                    {isTargetPro ? (
                                      <span className="text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>اشتراک ویژه شما فعال است ✅</span>
                                      </span>
                                    ) : (
                                      <span className="text-amber-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>در انتظار بررسی مدیریت...</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Timestamp and Delivery Status */}
                            <div
                              className={`flex items-center gap-1.5 text-[9px] font-mono justify-end pt-0.5 ${
                                isMe ? 'text-white/60' : 'text-slate-400'
                              }`}
                            >
                              <span>{timeStr ? toPersianDigits(timeStr) : ''}</span>
                              {isMe && (
                                <span>
                                  {m.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-white/50" />
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

              {/* Quick Reply Suggestions */}
              <div className="px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#1c1c1e] flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pl-1">
                  پاسخ سریع:
                </span>
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/20 text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition-all cursor-pointer whitespace-nowrap hover:scale-102 active:scale-95 shadow-2xs"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 sm:p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] flex items-center gap-2 flex-shrink-0"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`پیام به ${activePartner.name}...`}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 flex-shrink-0"
                >
                  <Send className="w-4 h-4 stroke-[2.4]" />
                  <span className="hidden sm:inline">{isSending ? 'در حال ارسال...' : 'ارسال'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 select-none">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                  هیچ گفتگویی انتخاب نشده است
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  از ستون سمت راست یکی از همکاران را انتخاب فرمایید تا جریان مکالمات کاری فعال گردد.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GEM GIFTING MINI MODAL */}
      {isGiftingOpen && activePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-black/[0.08] dark:border-white/[0.12] p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ارسال پاداش الماس در چت به «{activePartner.name}»
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تعداد الماس مورد نظر برای قدردانی را انتخاب کنید:
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setGiftingAmount(amt)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer font-mono ${
                    giftingAmount === amt
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  +{toPersianDigits(amt)} 💎
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              موجودی شما: <span className="font-mono font-bold text-amber-500">{toPersianDigits(userGems)}</span> الماس
            </div>

            {giftFeedback && (
              <div className="text-xs text-rose-500 font-bold">{giftFeedback}</div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleGiftGemsInChat}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                ارسال پاداش
              </button>
              <button
                type="button"
                onClick={() => setIsGiftingOpen(false)}
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
