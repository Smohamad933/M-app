import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import type { DirectChatMessage } from '../types';
import {
  X,
  Send,
  Check,
  CheckCheck,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DirectChatModalProps {
  friend?: any;
  peerUser?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  friend: friendProp,
  peerUser,
  isOpen,
  onClose,
}) => {
  const friend = peerUser || friendProp || null;
  const { currentUser, users, setUserSubscription } = useTask();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [approvingMsgId, setApprovingMsgId] = useState<string | null>(null);
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

  const handleApproveSubscription = async (
    msg: DirectChatMessage,
    planType: '1_month' | '3_months' | '6_months',
    planLabel: string
  ) => {
    if (!friendId) return;
    setApprovingMsgId(msg.id);
    try {
      const days = planType === '6_months' ? 180 : planType === '3_months' ? 90 : 30;
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      await setUserSubscription(friendId, 'pro', planType, expiresAt);
      sounds.playComplete();

      const confirmationText = `✅ اشتراک ویژه «${planLabel}» شما با موفقیت تأیید و در سیستم فعال گردید. از امکانات تسک‌روز لذت ببرید! ⭐`;
      const reply = await api.sendDirectMessage(friendId, confirmationText);
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      alert(err.message || 'خطا در فعال‌سازی اشتراک');
    } finally {
      setApprovingMsgId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" dir="rtl">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200/90 dark:border-zinc-800 h-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <UserAvatar
                user={friend}
                size="md"
                className="w-11 h-11 ring-2 ring-emerald-500 rounded-full"
              />
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 absolute bottom-0 left-0" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug truncate">
                  {friend.name}
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">آنلاین</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-bold dir-ltr text-left truncate">
                @{friend.username} {friend.numericId ? `(#${friend.numericId})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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

            const isSubRequest =
              msg.text.includes('درخواست فعال‌سازی اشتراک ویژه') ||
              (msg.text.includes('پلن انتخابی:') && msg.text.includes('اطلاعات کارت'));

            let detectedPlan: '1_month' | '3_months' | '6_months' = '1_month';
            let detectedPlanLabel = 'پلاس Plus (۱ ماهه)';
            if (msg.text.includes('اولترا') || msg.text.includes('Ultra') || msg.text.includes('۶ ماهه')) {
              detectedPlan = '6_months';
              detectedPlanLabel = 'اولترا Ultra (۶ ماهه)';
            } else if (msg.text.includes('پرو') || msg.text.includes('Pro') || msg.text.includes('۳ ماهه')) {
              detectedPlan = '3_months';
              detectedPlanLabel = 'پرو Pro (۳ ماهه)';
            }

            const targetUserInDirectory = users.find((u) => u.id === friendId) || friend;
            const isTargetPro =
              targetUserInDirectory?.role === 'admin' ||
              targetUserInDirectory?.subscription?.plan === 'pro';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-2xs ${
                    isMe
                      ? 'bg-[#121212] dark:bg-white text-white dark:text-zinc-900 rounded-br-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200/80 dark:border-zinc-700 rounded-bl-xs'
                  }`}
                >
                  <p className="font-bold select-text whitespace-pre-wrap">{msg.text}</p>

                  {/* ACTIONABLE SUBSCRIPTION ACTIVATION BUTTON IN CHAT */}
                  {isSubRequest && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-500/30">
                      {currentUser?.role === 'admin' ? (
                        isTargetPro ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>
                                اشتراک ویژه این کاربر فعال است ({targetUserInDirectory?.subscription?.planType === '6_months' ? 'اولترا' : targetUserInDirectory?.subscription?.planType === '3_months' ? 'پرو' : 'پلاس'}) ✅
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={approvingMsgId === msg.id}
                              onClick={() => handleApproveSubscription(msg, detectedPlan, detectedPlanLabel)}
                              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                            >
                              تمدید یا تغییر دوره به «{detectedPlanLabel}» ⚡
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={approvingMsgId === msg.id}
                            onClick={() => handleApproveSubscription(msg, detectedPlan, detectedPlanLabel)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4 fill-black" />
                            <span>
                              {approvingMsgId === msg.id ? 'در حال فعال‌سازی...' : `تأیید اشتراک و فعال‌سازی فوری ${detectedPlanLabel} ⚡`}
                            </span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                          {isTargetPro ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">درخواست شما توسط مدیر تأیید شد و اشتراک فعال است ✅</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                              <span>درخواست ثبت شده — در انتظار تأیید پرداخت توسط مدیر...</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex items-center gap-1 text-[9px] font-mono ${
                      isMe ? 'text-slate-400 dark:text-zinc-500 justify-start' : 'text-slate-400 dark:text-zinc-400 justify-end'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <span title={msg.read ? 'سین شد' : 'ارسال شد (سین نشده)'}>
                        {msg.read ? (
                          <CheckCheck className="w-3 h-3 text-[#00b884]" />
                        ) : (
                          <Check className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        )}
                      </span>
                    )}
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
