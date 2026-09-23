import React, { useState, useEffect, useRef } from 'react';
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
  CheckCheck,
  Eye,
  Users,
} from 'lucide-react';

interface MessagesViewProps {
  initialChatUserId?: string | null;
  onOpenPublicProfile?: (user: User) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialChatUserId,
  onOpenPublicProfile,
}) => {
  const { currentUser, friends, users, setViewingPublicUser } = useTask();

  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch summary of all conversations
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res);
    } catch {
      // ignore
    }
  };

  // Fetch messages with active partner
  const loadMessages = async () => {
    if (!activePartner) return;
    try {
      const msgs = await api.getDirectMessages(activePartner.id);
      setMessages(msgs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set initial partner if provided
  useEffect(() => {
    if (initialChatUserId && users.length > 0) {
      const found = users.find((u) => u.id === initialChatUserId);
      if (found) {
        setActivePartner(found);
      }
    } else if (!activePartner && friends.length > 0) {
      // Default to first friend if no partner selected yet
      setActivePartner(friends[0]);
    }
  }, [initialChatUserId, users, friends]);

  // Poll messages when active partner changes
  useEffect(() => {
    if (!activePartner) {
      setMessages([]);
      return;
    }
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
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

    setInputText('');
    setIsSending(true);

    try {
      const sent = await api.sendDirectMessage(activePartner.id, text);
      sounds.playPop();
      setMessages((prev) => [...prev, sent]);
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

  // Filter conversations / colleagues by search query
  const filteredPartners = (friends.length > 0 ? friends : users).filter((u) => {
    if (u.id === currentUser?.id) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      String(u.numericId || '').includes(q)
    );
  });

  return (
    <div className="w-full space-y-4 animate-in fade-in pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-6 h-6 stroke-[2.5] text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                پیام‌ها و گفتگوی مستقیم با همکاران
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                گفتگوی امن P2P
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
              ارسال و دریافت پیام‌های لحظه‌ای ذخیره‌شده در پایگاه‌داده، هماهنگی پروژه‌ها و پیگیری امور
            </p>
          </div>
        </div>

        {activePartner && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenPublicProfile) onOpenPublicProfile(activePartner);
                else setViewingPublicUser(activePartner);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پروفایل همکار</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Messaging Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-slate-200/90 dark:border-zinc-800 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] h-[72vh]">
        {/* Right Pane: Conversations & Colleagues List (4 cols) */}
        <div className="md:col-span-4 border-l border-slate-200 dark:border-zinc-800 flex flex-col h-full bg-slate-50/50 dark:bg-zinc-950/40">
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
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-xs text-slate-400 font-bold">همکاری پیدا نشد</p>
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
        <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-zinc-900">
          {activePartner ? (
            <>
              {/* Active Partner Top Bar */}
              <div className="p-3.5 px-5 border-b border-slate-200/90 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <UserAvatar user={activePartner} size="sm" className="w-9 h-9" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {activePartner.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        @{activePartner.username}
                      </span>
                    </div>
                    {activePartner.jobTitle && (
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {activePartner.jobTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    آنلاین در سیستم
                  </span>
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

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <UserAvatar
                          name={isMe ? currentUser?.name : activePartner.name}
                          avatar={isMe ? currentUser?.avatar : activePartner.avatar}
                          size="xs"
                          className="w-7 h-7 flex-shrink-0"
                        />

                        <div
                          className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 shadow-2xs ${
                            isMe
                              ? 'bg-[#121212] text-white rounded-bl-none'
                              : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-br-none border border-slate-200 dark:border-zinc-700/80'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-medium select-text">{m.text}</p>
                          <div
                            className={`flex items-center gap-1.5 text-[9px] pt-0.5 justify-end ${
                              isMe ? 'text-zinc-400' : 'text-slate-400'
                            }`}
                          >
                            <span>{timeStr ? toPersianDigits(timeStr) : ''}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-zinc-600" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                  هیچ گفتگویی انتخاب نشده است
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  از ستون سمت راست یکی از همکاران را انتخاب کنید تا تاریخچه پیام‌ها نمایش داده شود.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
