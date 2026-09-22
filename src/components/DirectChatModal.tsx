import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
import {
  X,
  Send,
  CheckCheck,
} from 'lucide-react';
import type { FriendItem } from './FriendsView';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

interface DirectChatModalProps {
  friend?: FriendItem | null;
  peerUser?: FriendItem | null;
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
  const { currentUser } = useTask();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myId = currentUser?.id || 'me';
  const peerId = friend?.id || 'peer';

  // Load chat history from localStorage
  useEffect(() => {
    if (!friend) return;
    const storageKey = `taskrooz_chat_${myId}_${peerId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
        return;
      }
    } catch {}

    // Initial conversation seed
    const initial: ChatMessage[] = [
      {
        id: 'msg-1',
        senderId: peerId,
        senderName: friend.name,
        text: `سلام ${currentUser?.name || ''}! امروز برنامه‌ام روی وایرفریم‌هاست. روی چه تسکی کار می‌کنی؟`,
        timestamp: '۱۲:۴۵',
        isMe: false,
      },
      {
        id: 'msg-2',
        senderId: myId,
        senderName: currentUser?.name || 'من',
        text: 'سلام Michie عزیز! تسک‌های روزانه‌م رو توی دیلی پلنر مرتب کردم، کارها خوب پیش میره 👍',
        timestamp: '۱۲:۵۰',
        isMe: true,
      },
    ];
    setMessages(initial);
  }, [friend, myId, peerId, currentUser?.name]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen || !friend) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    sounds.playPop();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: myId,
      senderName: currentUser?.name || 'من',
      text: inputVal.trim(),
      timestamp: timeStr,
      isMe: true,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputVal('');

    const storageKey = `taskrooz_chat_${myId}_${peerId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    // Simulated interactive reply from colleague after 1.5s
    setTimeout(() => {
      const replies = [
        'عالیه! پرانرژی ادامه بده، هر کمکی خواستی من اینجام ✌️',
        'پیامت رسید، منم دارم تسک‌های مربوط به پروژه تیمی رو نهایی می‌کنم.',
        'آفرین بر تو! بریم که تا آخر وقت تمام تسک‌ها رو سبز کنیم 💪',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: 'msg-' + Date.now() + 1,
        senderId: peerId,
        senderName: friend.name,
        text: randomReply,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isMe: false,
      };
      setMessages((prev) => {
        const withReply = [...prev, replyMsg];
        try {
          localStorage.setItem(storageKey, JSON.stringify(withReply));
        } catch {}
        return withReply;
      });
      sounds.playPop();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-slate-200/90 h-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar
                name={friend.name}
                avatar={friend.avatar}
                size="w-10 h-10 rounded-full text-xs"
                className="border-2 border-[#00b884]"
              />
              <span className="w-3 h-3 rounded-full bg-[#00b884] border-2 border-white absolute bottom-0 left-0" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 leading-snug">
                  {friend.name}
                </h3>
                <span className="text-[10px] text-[#00895f] font-bold">آنلاین</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-bold">
                @{friend.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#f8fafc]/60">
          <div className="text-center my-2">
            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs">
              گفتگوی امن و مستقیم با {friend.name}
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                  msg.isMe
                    ? 'bg-[#121212] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                <p className="font-bold">{msg.text}</p>
                <div
                  className={`flex items-center gap-1 text-[9px] font-mono ${
                    msg.isMe ? 'text-slate-400 justify-start' : 'text-slate-400 justify-end'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isMe && <CheckCheck className="w-3 h-3 text-[#00b884]" />}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`پیامی برای ${friend.name} بنویسید...`}
            className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white font-bold transition-all shadow-2xs"
            autoFocus
          />

          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="p-2.5 rounded-2xl bg-[#121212] hover:bg-black text-white transition-colors cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center flex-shrink-0"
            title="ارسال پیام"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
