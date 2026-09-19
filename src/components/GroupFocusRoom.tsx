import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Coffee,
  Crown,
  Send,
  UserPlus,
  DoorOpen,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const GroupFocusRoom: React.FC = () => {
  const {
    activeRoom,
    activeRoomId,
    currentUser,
    users,
    createFocusRoom,
    joinFocusRoom,
    leaveFocusRoom,
    syncRoomTimer,
    sendRoomMessage,
  } = useTask();

  // Lobby states
  const [roomInput, setRoomInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('اتاق تمرکز و مطالعه مشترک');
  const [focusDurationMin, setFocusDurationMin] = useState(25);
  const [breakDurationMin, setBreakDurationMin] = useState(5);
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // In-room states
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedUserToInvite, setSelectedUserToInvite] = useState('');
  const [inviteSuccessNotice, setInviteSuccessNotice] = useState<string | null>(null);

  // Load active rooms for lobby
  useEffect(() => {
    if (!activeRoomId) {
      api.getActiveFocusRooms().then(setActiveRoomsList).catch(() => {});
    }
  }, [activeRoomId]);

  // Handle timer countdown locally when isRunning
  const [localTimeLeft, setLocalTimeLeft] = useState(activeRoom?.timeLeft || 1500);

  useEffect(() => {
    if (activeRoom) {
      setLocalTimeLeft(activeRoom.timeLeft);
    }
  }, [activeRoom?.timeLeft, activeRoom?.isRunning, activeRoom?.mode]);

  useEffect(() => {
    if (!activeRoom?.isRunning) return;

    const interval = setInterval(() => {
      setLocalTimeLeft((prev) => {
        if (prev <= 1) {
          sounds.playTimerFinish();
          try {
            confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.isRunning]);

  const isHost = activeRoom?.hostId === currentUser?.id;

  // Actions
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createFocusRoom(newRoomName, focusDurationMin * 60, breakDurationMin * 60);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    // Support full URL or raw ID
    let id = roomInput.trim();
    if (id.includes('room=')) {
      id = id.split('room=')[1].split('&')[0];
    } else if (id.includes('room_id=')) {
      id = id.split('room_id=')[1].split('&')[0];
    }

    setIsJoining(true);
    try {
      await joinFocusRoom(id);
    } finally {
      setIsJoining(false);
    }
  };

  const getInviteUrl = () => {
    if (!activeRoom) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${activeRoom.id}`;
  };

  const handleCopyInviteLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playPop();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInviteToUser = () => {
    if (!selectedUserToInvite) return;
    const targetUser = users.find((u) => u.id === selectedUserToInvite || u.username === selectedUserToInvite);
    const targetName = targetUser?.name || selectedUserToInvite;
    const url = getInviteUrl();

    // Send chat notification
    sendRoomMessage(`💌 دعوت‌نامه برای ${targetName} ارسال شد: ${url}`);
    setInviteSuccessNotice(`دعوت‌نامه برای ${targetName} آماده شد و لینک کپی شد!`);
    navigator.clipboard.writeText(url);
    sounds.playPop();

    setTimeout(() => {
      setInviteSuccessNotice(null);
      setIsInviteModalOpen(false);
    }, 2500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;
    sendRoomMessage(messageText.trim());
    setMessageText('');
  };

  const sendQuickCheer = (cheer: string) => {
    sendRoomMessage(cheer);
  };

  // Timer controls
  const handleToggleTimer = () => {
    if (!activeRoom) return;
    sounds.playPop();
    if (activeRoom.isRunning) {
      syncRoomTimer('pause', localTimeLeft);
    } else {
      syncRoomTimer('start', localTimeLeft, activeRoom.mode);
    }
  };

  const handleResetTimer = () => {
    sounds.playPop();
    syncRoomTimer('reset');
  };

  const handleSwitchMode = (mode: 'focus' | 'shortBreak') => {
    sounds.playPop();
    syncRoomTimer('setMode', undefined, mode);
  };

  // Format time display
  const minutes = Math.floor(localTimeLeft / 60);
  const seconds = localTimeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = activeRoom?.mode === 'focus' ? activeRoom.focusDuration : (activeRoom?.breakDuration || 300);
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - localTimeLeft) / totalDuration) * 100));

  // --- VIEW 1: LOBBY (NOT IN A ROOM) ---
  if (!activeRoom) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in">
        {/* Banner */}
        <div className="p-6 bg-zinc-900/70 rounded-3xl border border-zinc-800 text-center space-y-2 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-black text-white">
            اتاق‌های تمرکز گروهی پومودورو
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            در کنار هم‌تیمی‌ها، دوستان یا هم‌کلاسی‌های خود در یک اتاق مجازی متمرکز شوید. تایمر همگام، اعلام حضور زنده و انرژی کار گروهی!
          </p>
        </div>

        {/* 2 Column Options: Create or Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create New Room Card */}
          <div className="p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">ایجاد اتاق تمرکز جدید</h3>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">نام اتاق</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="مثال: تمرکز پروژه خرداد..."
                    className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">زمان تمرکز</label>
                    <select
                      value={focusDurationMin}
                      onChange={(e) => setFocusDurationMin(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden cursor-pointer"
                    >
                      <option value={20}>۲۰ دقیقه</option>
                      <option value={25}>۲۵ دقیقه (استاندارد)</option>
                      <option value={30}>۳۰ دقیقه</option>
                      <option value={45}>۴۵ دقیقه</option>
                      <option value={50}>۵۰ دقیقه</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">زمان استراحت</label>
                    <select
                      value={breakDurationMin}
                      onChange={(e) => setBreakDurationMin(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-white text-xs outline-hidden cursor-pointer"
                    >
                      <option value={5}>۵ دقیقه</option>
                      <option value={10}>۱۰ دقیقه</option>
                      <option value={15}>۱۵ دقیقه</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isCreating ? 'در حال ایجاد...' : 'ایجاد اتاق و دعوت دیگران'}
                </button>
              </form>
            </div>
          </div>

          {/* Join by Code/Link Card */}
          <div className="p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">پیوستن به اتاق با کد یا لینک</h3>
              </div>

              <form onSubmit={handleJoinById} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">شناسه یا لینک اتاق</label>
                  <input
                    type="text"
                    required
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="مثال: room_abc123 یا لینک کامل"
                    className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs font-mono outline-hidden focus:border-zinc-500"
                  />
                  <p className="text-[10px] text-zinc-500 pt-0.5">
                    اگر دوستی برای شما لینک ارسال کرده، می‌توانید کد یا کل لینک را اینجا وارد کنید.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <DoorOpen className="w-4 h-4" />
                  {isJoining ? 'در حال ورود...' : 'ورود به اتاق تمرکز'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Active Open Rooms List */}
        {activeRoomsList.length > 0 && (
          <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              اتاق‌های تمرکز فعال
            </h3>
            <div className="divide-y divide-zinc-800/60">
              {activeRoomsList.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{r.name}</span>
                      {r.isRunning && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          در حال اجرا
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      میزبان: {r.hostName} • {toPersianDigits(r.participantCount)} نفر حاضر
                    </div>
                  </div>
                  <button
                    onClick={() => joinFocusRoom(r.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>پیوستن</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: INSIDE ACTIVE ROOM ---
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in">
      {/* Room Top Bar */}
      <div className="p-4 sm:p-5 bg-zinc-900/80 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-black text-white">
              {activeRoom.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono">
            <span>کد اتاق: <strong className="text-zinc-200 font-bold">{activeRoom.id}</strong></span>
            <span>•</span>
            <span>میزبان: <strong className="text-zinc-200">{activeRoom.hostName}</strong></span>
            {isHost && (
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mr-1">
                <Crown className="w-3 h-3" />
                (شما)
              </span>
            )}
          </div>
        </div>

        {/* Room Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyInviteLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'لینک کپی شد!' : 'کپی لینک دعوت'}</span>
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>دعوت کاربر</span>
          </button>

          <button
            onClick={leaveFocusRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 text-xs font-bold transition-all cursor-pointer"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Timer on right (or left in RTL), Participants & Chat on side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Synced Timer Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-6">
          {/* Phase Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/90 border border-zinc-700 text-xs font-bold">
            {activeRoom.mode === 'focus' ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-white">فاز تمرکز عمیق گروهی</span>
              </>
            ) : (
              <>
                <Coffee className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">فاز استراحت گروهی</span>
              </>
            )}
          </div>

          {/* Circular Countdown Display */}
          <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="110"
                className="stroke-zinc-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="130"
                cy="130"
                r="110"
                className="stroke-white transition-all duration-700 ease-linear"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={(2 * Math.PI * 110) - ((2 * Math.PI * 110) * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-wider font-mono">
                {toPersianDigits(formattedTime)}
              </span>
              <span className="text-xs font-semibold text-zinc-400 mt-2">
                {activeRoom.isRunning ? 'تایمر در حال اجرا ⚡' : 'توقف موقت تایمر'}
              </span>
            </div>
          </div>

          {/* Timer Controls (Host or any participant) */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetTimer}
              className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
              title="بازنشانی زمان"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleTimer}
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {activeRoom.isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-zinc-950" />
                  توقف تایمر
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-zinc-950" />
                  شروع تمرکز گروهی
                </>
              )}
            </button>

            {/* Quick Switch Phase */}
            <button
              onClick={() => handleSwitchMode(activeRoom.mode === 'focus' ? 'shortBreak' : 'focus')}
              className="p-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
              title="تغییر فاز تمرکز / استراحت"
            >
              <Coffee className="w-5 h-5" />
            </button>
          </div>

          {/* Quick cheers bar */}
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs">
            {['خداقوت 🔥', 'شروع کردیم 🎯', 'خسته نباشید 👏', 'پومودورو تمام شد 🏆', 'قهوه و استراحت ☕'].map((cheer) => (
              <button
                key={cheer}
                onClick={() => sendQuickCheer(cheer)}
                className="px-2.5 py-1 rounded-xl bg-zinc-850 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold border border-zinc-700/60 transition-colors cursor-pointer"
              >
                {cheer}
              </button>
            ))}
          </div>
        </div>

        {/* Side Panel: Participants & Live Room Chat */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Active Participants Box */}
          <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" />
                حاضرین در اتاق ({toPersianDigits(activeRoom.participants?.length || 1)})
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeRoom.participants?.map((p) => {
                const isUserHost = p.userId === activeRoom.hostId;
                const isMe = p.userId === currentUser?.id;

                return (
                  <div key={p.userId} className="flex items-center justify-between py-1 px-2 rounded-xl bg-zinc-800/40 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[11px] border border-zinc-700 flex-shrink-0">
                        {p.name.slice(0, 1)}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-white text-[11px]">{p.name}</span>
                        {isMe && <span className="text-[10px] text-zinc-400 mr-1">(شما)</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isUserHost && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold" title="میزبان اتاق">
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="آنلاین" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Live Messages */}
          <div className="p-4 sm:p-5 bg-zinc-900/60 rounded-3xl border border-zinc-800 space-y-3 flex-1 flex flex-col justify-between min-h-[220px]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-zinc-800">
              <Flame className="w-4 h-4 text-orange-400" />
              انرژی و پیام‌های اتاق
            </span>

            <div className="space-y-1.5 max-h-40 overflow-y-auto flex-1 text-xs">
              {activeRoom.messages?.slice(-15).map((m) => (
                <div key={m.id} className="text-[11px] bg-zinc-800/30 p-1.5 rounded-lg">
                  <span className="font-bold text-zinc-300 ml-1">{m.userName}:</span>
                  <span className="text-zinc-200">{m.text}</span>
                  <span className="text-[9px] text-zinc-500 float-left font-mono">{m.timestamp}</span>
                </div>
              ))}
            </div>

            {/* Send message form */}
            <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="پیام یا انگیزه..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-800 text-white text-xs outline-hidden border border-zinc-700/60 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-zinc-300" />
              دعوت دوستان به اتاق تمرکز
            </h3>

            {/* Invite link box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">لینک ورود مستقیم به اتاق:</label>
              <div className="flex items-center gap-2 bg-zinc-800/90 p-2 rounded-2xl border border-zinc-700/60">
                <input
                  type="text"
                  readOnly
                  value={getInviteUrl()}
                  className="flex-1 bg-transparent text-xs text-white font-mono outline-hidden select-all"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="px-3 py-1 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                >
                  {copiedLink ? 'کپی شد!' : 'کپی'}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                هر فردی که روی این لینک کلیک کند، اگر لاگین نباشد به صفحه ورود/ثبت‌نام هدایت می‌شود و پس از ورود مستقیماً وارد همین اتاق خواهد شد.
              </p>
            </div>

            {/* Select user to invite */}
            {users.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400">دعوت از کاربران سامانه:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedUserToInvite}
                    onChange={(e) => setSelectedUserToInvite(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-hidden"
                  >
                    <option value="">انتخاب کاربر...</option>
                    {users
                      .filter((u) => u.id !== currentUser?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (@{u.username})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleSendInviteToUser}
                    className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 cursor-pointer"
                  >
                    ارسال دعوت
                  </button>
                </div>
              </div>
            )}

            {inviteSuccessNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 text-xs border border-emerald-800/60 font-bold text-center">
                {inviteSuccessNotice}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
