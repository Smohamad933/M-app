import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import type { DirectChatMessage } from '../types';
import {
  X,
  Send,
  CheckCheck,
  Sparkles,
  Check,
} from 'lucide-react';

interface DirectChatModalProps {
  friend?: any;
  peerUser?: any;
  isOpen: boolean;
  onClose: () => void;
}

function parseSubscriptionRequest(text: string) {
  if (!text || !text.includes('درخواست فعال‌سازی اشتراک')) return null;

  let planType: '1_month' | '3_months' | '6_months' = '3_months';
  let planName = 'پرو (Pro - ۳ ماهه)';

  if (text.includes('اولترا') || text.includes('Ultra') || text.includes('۶ ماهه') || text.includes('۱۸۰ روز')) {
    planType = '6_months';
    planName = 'اولترا (Ultra - ۶ ماهه)';
  } else if (text.includes('پلاس') || text.includes('Plus') || text.includes('۱ ماهه') || text.includes('۳۰ روز')) {
    planType = '1_month';
    planName = 'پلاس (Plus - ۱ ماهه)';
  } else {
    planType = '3_months';
    planName = 'پرو (Pro - ۳ ماهه)';
  }

  const refMatch = text.match(/شماره پیگیری[^\n:]*:\s*([^\n]+)/);
  const refNum = refMatch ? refMatch[1].trim() : '';

  return { planType, planName, refNum };
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  friend: friendProp,
  peerUser,
  isOpen,
  onClose,
}) => {
  const friend = peerUser || friendProp || null;
  const { currentUser, setUserSubscription } = useTask();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
  const [approvedMsgIds, setApprovedMsgIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const friendId = friend?.id;

  // Fetch real messages from database
  const loadMessages = async () => {
    if (!friendId) return;
    try {
      const msgs = await api.getDirectMessages(friendId);
      setMessages(msgs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isOpen || !friendId) return;
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [isOpen, friendId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen || !friend) return null;

  const handleApproveSubscription = async (
    msgId: string,
    targetUserId: string,
    planType: '1_month' | '3_months' | '6_months',
    planName: string
  ) => {
    try {
      setApprovingMsgId(msgId);
      await setUserSubscription(targetUserId, 'pro', planType);
      setApprovedMsgIds((prev) => new Set([...prev, msgId]));

      const confirmText = `🎉 رسید پرداخت شما تایید شد و اشتراک ویژه «${planName}» با موفقیت برای حساب کاربری شما فعال گردید. هم‌اکنون دسترسی کامل و نامحدود برای شما برقرار است! ⭐`;
      const reply = await api.sendDirectMessage(targetUserId, confirmText);
      setMessages((prev) => [...prev, reply]);
      sounds.playComplete();
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'خطا در فعال‌سازی اشتراک');
    } finally {
      setApprovingMsgId(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputVal.trim();
    if (!text || !friendId || isSending) return;

    sounds.playPop();
    setInputVal('');
    setIsSending(true);

    // Optimistic message
    const tempMsg: DirectChatMessage = {
      id: 'opt_' + Date.now(),
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'من',
      senderAvatar: currentUser?.avatar || null,
      receiverId: friendId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const saved = await api.sendDirectMessage(friendId, text);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? saved : m)));
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" dir="rtl">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200/90 dark:border-zinc-800 h-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar
                user={friend}
                size="md"
                className="ring-2 ring-emerald-500"
              />
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-0 left-0" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                  {friend.name}
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">آنلاین</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-bold dir-ltr text-left">
                @{friend.username} {friend.numericId ? `(#${friend.numericId})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#f8fafc]/60 dark:bg-zinc-950/40">
          <div className="text-center my-2">
            <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 px-3 py-1 rounded-full shadow-2xs">
              گفتگوی واقعی و رمزگذاری‌شده میان شما و {friend.name}
            </span>
          </div>

          {messages.length === 0 && (
            <div className="py-14 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center mx-auto">
                <Send className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">هنوز پیامی ردوبدل نشده است</p>
              <p className="text-[11px] text-slate-400">پیام شما بلافاصله در پنل کاربری {friend.name} نمایش داده خواهد شد.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
            const subReq = parseSubscriptionRequest(msg.text);
            const isFriendPro = friend?.subscription?.plan === 'pro';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                    isMe
                      ? 'bg-[#121212] dark:bg-white text-white dark:text-zinc-900 rounded-br-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200/80 dark:border-zinc-700 rounded-bl-xs'
                  }`}
                >
                  <p className="font-bold whitespace-pre-wrap">{msg.text}</p>

                  {/* Interactive Subscription Approval Card */}
                  {subReq && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-right space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-[11px] font-black text-amber-500 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>درخواست فعال‌سازی {subReq.planName}</span>
                        </span>
                        {subReq.refNum && subReq.refNum !== '—' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            کد: {subReq.refNum}
                          </span>
                        )}
                      </div>

                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          disabled={approvingMsgId === msg.id}
                          onClick={() => handleApproveSubscription(msg.id, friend.id, subReq.planType, subReq.planName)}
                          className={`w-full py-2 px-3 rounded-lg font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                            approvedMsgIds.has(msg.id) || isFriendPro
                              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black'
                          }`}
                        >
                          {approvingMsgId === msg.id ? (
                            <span>در حال فعال‌سازی...</span>
                          ) : approvedMsgIds.has(msg.id) || isFriendPro ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>اشتراک فعال است ✓ (تمدید)</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>تأیید پرداخت و فعال‌سازی فوری ✅</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex items-center gap-1 text-[9px] font-mono ${
                      isMe ? 'text-slate-400 dark:text-zinc-500 justify-start' : 'text-slate-400 dark:text-zinc-400 justify-end'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#00b884]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`پیامی برای ${friend.name} بنویسید...`}
            className="flex-1 bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-zinc-700 font-bold transition-all shadow-2xs"
            autoFocus
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isSending}
            className="p-2.5 rounded-2xl bg-[#121212] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center flex-shrink-0"
            title="ارسال پیام"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
