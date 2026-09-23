import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { UserAvatar } from './UserAvatar';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Users,
  Plus,
  LogIn,
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
  Trash2,
  Clock,
  AlertTriangle,
  Radio,
  Music,
  Volume2,
  VolumeX,
  SkipForward,
  Sliders,
  Check,
} from 'lucide-react';
import { focusAudio, DEFAULT_FOCUS_TRACKS, type FocusTrack } from '../utils/focusAudio';

export const GroupFocusRoom: React.FC = () => {
  const {
    activeRoom,
    currentUser,
    users,
    createFocusRoom,
    joinFocusRoom,
    leaveFocusRoom,
    deleteFocusRoom,
    deleteAllFocusRooms,
    syncRoomTimer,
    sendRoomMessage,
    globalSettings,
    getText,
  } = useTask();

  // Lobby states
  const [roomInput, setRoomInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('اتاق تمرکز و مطالعه مشترک');
  const [focusDurationMin, setFocusDurationMin] = useState(25);
  const [breakDurationMin, setBreakDurationMin] = useState(5);
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Admin: delete ALL rooms state
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // In-room states
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedUserToInvite, setSelectedUserToInvite] = useState('');
  const [inviteSuccessNotice, setInviteSuccessNotice] = useState<string | null>(null);

  // Focus Music State (1 to 3 tracks playlist)
  const [playlist, setPlaylist] = useState<FocusTrack[]>(DEFAULT_FOCUS_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [autoPlayWithTimer, setAutoPlayWithTimer] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // Subscribe to audio engine
  useEffect(() => {
    const unsub = focusAudio.subscribe((playing, track, vol) => {
      setIsPlayingMusic(playing);
      setMusicVolume(vol);
      const idx = playlist.findIndex((t) => t.id === track.id);
      if (idx !== -1) setCurrentTrackIndex(idx);
    });
    return () => unsub();
  }, [playlist]);

  // Fetch active rooms for lobby
  const loadRooms = () => {
    setIsLoadingRooms(true);
    api.getActiveFocusRooms()
      .then((rooms) => {
        setActiveRoomsList(rooms || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingRooms(false));
  };

  useEffect(() => {
    if (!activeRoom) {
      loadRooms();
      const interval = setInterval(loadRooms, 3500);
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  // Handle timer countdown locally when isRunning
  const [localTimeLeft, setLocalTimeLeft] = useState(activeRoom?.timeLeft || 1500);

  useEffect(() => {
    if (!activeRoom) return;

    if (!activeRoom.isRunning) {
      setLocalTimeLeft(activeRoom.timeLeft);
    } else {
      setLocalTimeLeft((prev) => {
        if (Math.abs(prev - activeRoom.timeLeft) > 2) {
          return activeRoom.timeLeft;
        }
        return prev;
      });
    }
  }, [activeRoom?.timeLeft, activeRoom?.isRunning, activeRoom?.mode]);

  useEffect(() => {
    if (!activeRoom?.isRunning || activeRoom?.isDeleted) return;

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
  }, [activeRoom?.isRunning, activeRoom?.isDeleted]);

  // Auto-play music when timer starts if enabled
  useEffect(() => {
    if (activeRoom?.isRunning && autoPlayWithTimer && !isPlayingMusic) {
      focusAudio.play();
    } else if (!activeRoom?.isRunning && autoPlayWithTimer && isPlayingMusic) {
      focusAudio.stop();
    }
  }, [activeRoom?.isRunning, autoPlayWithTimer]);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (activeRoom?.messages) {
      const currentCount = activeRoom.messages.length;
      if (currentCount > prevMessagesCountRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (prevMessagesCountRef.current > 0) {
          const lastMsg = activeRoom.messages[currentCount - 1];
          if (lastMsg.userId !== currentUser?.id && lastMsg.userId !== 'system') {
            sounds.playPop();
          }
        }
      }
      prevMessagesCountRef.current = currentCount;
    }
  }, [activeRoom?.messages, currentUser?.id]);

  // Calculate remaining retention time for deleted room
  const [retentionSecsLeft, setRetentionSecsLeft] = useState<number>(0);

  useEffect(() => {
    if (!activeRoom?.isDeleted || !activeRoom?.deletedAt) return;

    const updateRetention = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, activeRoom.deletedAt! + 600 - now);
      setRetentionSecsLeft(remaining);
      if (remaining === 0) {
        leaveFocusRoom();
      }
    };

    updateRetention();
    const timer = setInterval(updateRetention, 1000);
    return () => clearInterval(timer);
  }, [activeRoom?.isDeleted, activeRoom?.deletedAt, leaveFocusRoom]);

  const isHost = activeRoom ? activeRoom.hostId === currentUser?.id || currentUser?.role === 'admin' : false;

  // Music handlers
  const handleToggleMusic = () => {
    sounds.playPop();
    focusAudio.toggle();
  };

  const handleNextTrack = () => {
    sounds.playPop();
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    focusAudio.setTrack(playlist[nextIdx]);
  };

  const handleVolumeChange = (newVol: number) => {
    setMusicVolume(newVol);
    focusAudio.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    sounds.playPop();
    if (isMuted) {
      setIsMuted(false);
      focusAudio.setVolume(musicVolume || 0.5);
    } else {
      setIsMuted(true);
      focusAudio.setVolume(0);
    }
  };

  const handleSelectTrack = (track: FocusTrack) => {
    sounds.playPop();
    focusAudio.setTrack(track);
  };

  const handleAddCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAudioUrl.trim()) return;
    const newTrack: FocusTrack = {
      id: `custom-${Date.now()}`,
      title: 'موسیقی اختصاصی میزبان',
      artist: 'استریم دلخواه آنلاین',
      type: 'custom',
      url: customAudioUrl.trim(),
      tag: 'اختصاصی 🔗',
    };
    const updated = [newTrack, ...playlist].slice(0, 3);
    setPlaylist(updated);
    setCustomAudioUrl('');
    handleSelectTrack(newTrack);
  };

  // Actions
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setIsCreating(true);
    try {
      await createFocusRoom(newRoomName, focusDurationMin * 60, breakDurationMin * 60);
    } catch (err: any) {
      alert(err.message || 'خطا در ساخت اتاق');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinDirect = async (roomId: string) => {
    setJoiningRoomId(roomId);
    try {
      await joinFocusRoom(roomId);
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleJoinById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    let id = roomInput.trim();
    if (id.includes('room=')) {
      id = id.split('room=')[1].split('&')[0];
    } else if (id.includes('room_id=')) {
      id = id.split('room_id=')[1].split('&')[0];
    }
    id = id.replace(/['"]/g, '').trim().split('#')[0].split('&')[0];

    setIsJoining(true);
    try {
      const ok = await joinFocusRoom(id);
      if (ok) {
        setRoomInput('');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در پیوستن به اتاق.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom) return;
    setIsDeleting(true);
    try {
      await deleteFocusRoom(activeRoom.id);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllRooms = async () => {
    setIsDeletingAll(true);
    try {
      const count = await deleteAllFocusRooms();
      setIsDeleteAllModalOpen(false);
      loadRooms();
      alert(`همه اتاق‌های تمرکز (مجموعاً ${toPersianDigits(count)} اتاق) با موفقیت حذف شدند.`);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کلی اتاق‌ها. لطفاً اتصال به سرور را بررسی کنید.');
    } finally {
      setIsDeletingAll(false);
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

    sendRoomMessage(`💌 دعوت‌نامه برای ${targetName} ارسال شد: ${url}`);
    setInviteSuccessNotice(`دعوت‌نامه برای ${targetName} آماده شد و لینک در کلیپ‌بورد کپی گردید.`);
    navigator.clipboard.writeText(url);
    sounds.playPop();

    setTimeout(() => {
      setInviteSuccessNotice(null);
      setIsInviteModalOpen(false);
    }, 2500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || activeRoom?.isDeleted) return;
    sendRoomMessage(messageText.trim());
    setMessageText('');
  };

  const sendQuickCheer = (cheer: string) => {
    if (activeRoom?.isDeleted) return;
    sendRoomMessage(cheer);
  };

  const handleToggleTimer = () => {
    if (!activeRoom || activeRoom.isDeleted) return;
    sounds.playPop();
    if (activeRoom.isRunning) {
      syncRoomTimer('pause', localTimeLeft);
    } else {
      syncRoomTimer('start', localTimeLeft, activeRoom.mode);
    }
  };

  const handleResetTimer = () => {
    if (!activeRoom || activeRoom.isDeleted) return;
    sounds.playPop();
    syncRoomTimer('reset');
  };

  const handleSwitchMode = (mode: 'focus' | 'shortBreak') => {
    if (!activeRoom || activeRoom.isDeleted) return;
    sounds.playPop();
    syncRoomTimer('setMode', undefined, mode);
  };

  // Format time display
  const minutes = Math.floor(localTimeLeft / 60);
  const seconds = localTimeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = activeRoom?.mode === 'focus' ? activeRoom.focusDuration : (activeRoom?.breakDuration || 300);
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - localTimeLeft) / totalDuration) * 100));

  const activeFocusTrack = playlist[currentTrackIndex] || DEFAULT_FOCUS_TRACKS[0];

  // --- VIEW 1: LOBBY (NOT IN A ROOM) ---
  if (!activeRoom) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in">
        {/* Banner */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-black text-zinc-900">
            {getText('focusLobbyTitle')}
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            {getText('focusLobbyHint')}
          </p>
        </div>

        {/* 2 Column Options: Create or Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create New Room Card */}
          <div className="p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">{getText('focusCreateTitle')}</h3>
              </div>

              {globalSettings?.roomPolicy?.allowUserRoomCreation === false && currentUser?.role !== 'admin' ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4" />
                    <span>سیاست سازمانی ایجاد اتاق</span>
                  </div>
                  <p>
                    طبق مصوبه مدیر سیستم، ایجاد اتاق تمرکز جدید در اختیار مدیر کل قرار دارد. می‌توانید از فهرست اتاق‌های فعال زیر به جلسات تمرکز ملحق شوید.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700">نام اتاق</label>
                    <input
                      type="text"
                      required
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="مثال: تمرکز پروژه بگ تایم..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs outline-hidden focus:border-zinc-400 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700">زمان تمرکز</label>
                      <select
                        value={focusDurationMin}
                        onChange={(e) => setFocusDurationMin(Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs outline-hidden cursor-pointer"
                      >
                        <option value={20}>۲۰ دقیقه</option>
                        <option value={25}>۲۵ دقیقه (استاندارد)</option>
                        <option value={30}>۳۰ دقیقه</option>
                        <option value={45}>۴۵ دقیقه</option>
                        <option value={50}>۵۰ دقیقه</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700">زمان استراحت</label>
                      <select
                        value={breakDurationMin}
                        onChange={(e) => setBreakDurationMin(Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs outline-hidden cursor-pointer"
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
                    className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isCreating ? 'در حال ایجاد و ورود...' : 'ایجاد اتاق و ورود مستقیم'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Join by Code/Link Card */}
          <div className="p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">ورود به اتاق با لینک یا کد</h3>
              </div>

              <form onSubmit={handleJoinById} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">شناسه یا لینک اتاق</label>
                  <input
                    type="text"
                    required
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="کد اتاق یا لینک ارسالی..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs outline-hidden focus:border-zinc-400 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-zinc-400">
                    می‌توانید شناسه کوتاه مانند <code className="text-zinc-600 font-bold">room_abc123</code> یا لینک کامل را وارد کنید.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs border border-zinc-200 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  {isJoining ? 'در حال ورود...' : 'پیوستن به اتاق تمرکز'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Active Public / Team Rooms List */}
        <div className="p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              اتاق‌های در حال اجرا در سامانه
              {activeRoomsList.length > 0 && (
                <span className="text-[10px] text-zinc-400 font-mono">({toPersianDigits(activeRoomsList.length)})</span>
              )}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {currentUser?.role === 'admin' && activeRoomsList.length > 0 && (
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsDeleteAllModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="حذف همه اتاق‌های تمرکز توسط مدیر سیستم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف همه اتاق‌ها</span>
                </button>
              )}
              <button
                onClick={loadRooms}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                {isLoadingRooms ? 'به‌روزرسانی...' : 'بروزرسانی لیست'}
              </button>
            </div>
          </div>

          {activeRoomsList.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">
              در حال حاضر اتاق فعالی وجود ندارد. اولین اتاق تمرکز را ایجاد کنید!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeRoomsList.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">{r.name}</h4>
                    <p className="text-[11px] text-zinc-500 truncate">
                      میزبان: {r.hostName} • {toPersianDigits(r.participantCount || 1)} نفر
                    </p>
                  </div>

                  <button
                    onClick={() => handleJoinDirect(r.id)}
                    disabled={joiningRoomId === r.id}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 disabled:opacity-60 shadow-xs"
                  >
                    {joiningRoomId === r.id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>در حال ورود...</span>
                      </>
                    ) : (
                      <>
                        <span>ورود مستقیم</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete All Rooms Confirmation Modal */}
        {isDeleteAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">حذف کلیه اتاق‌های تمرکز سامانه</h3>
                  <p className="text-xs text-zinc-500">عملیات سراسری ویژه مدیر سیستم</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-2 text-xs leading-relaxed text-red-900">
                <p className="font-bold text-red-950">
                  ⚠️ اخطار امنیتی مدیر سیستم:
                </p>
                <p>
                  با اجرای این عملیات، تمامی {toPersianDigits(activeRoomsList.length)} اتاق تمرکز فعال در سیستم به طور یک‌جا بسته و پیام‌ها و جلسات آن‌ها لغو خواهند شد.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={handleDeleteAllRooms}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeletingAll ? 'در حال حذف همه اتاق‌ها...' : 'تأیید و حذف همه اتاق‌ها'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: INSIDE ACTIVE FOCUS ROOM ---
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={leaveFocusRoom}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لابی اتاق‌ها</span>
        </button>

        <span className="text-[11px] text-zinc-400 font-mono">
          شناسه: {activeRoom.id}
        </span>
      </div>

      {/* Retention Banner if room is deleted */}
      {activeRoom.isDeleted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">
                این اتاق توسط میزبان بسته شده است.
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                طبق سیاست سیستم، پیام‌ها به مدت ۱۰ دقیقه پس از بسته شدن در سرور نگه‌داری شده و سپس خودکار پاکسازی می‌شوند.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono text-xs bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-900">
              <Clock className="w-3.5 h-3.5" />
              <span>{toPersianDigits(Math.floor(retentionSecsLeft / 60))}:{toPersianDigits(String(retentionSecsLeft % 60).padStart(2, '0'))}</span>
            </div>
            <button
              onClick={leaveFocusRoom}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer"
            >
              خروج به لابی
            </button>
          </div>
        </div>
      )}

      {/* Room Header Top Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-zinc-900 truncate">{activeRoom.name}</h2>
              {activeRoom.isDeleted && (
                <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">
                  بسته شده
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              میزبان: <span className="text-zinc-800 font-semibold">{activeRoom.hostName}</span>
              {isHost && <span className="text-amber-600 mr-1 font-bold">(شما میزبانید)</span>}
            </p>
          </div>
        </div>

        {/* Room Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {!activeRoom.isDeleted && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold border border-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>دعوت</span>
            </button>
          )}

          {isHost && !activeRoom.isDeleted && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="حذف و بستن اتاق"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف اتاق</span>
            </button>
          )}

          <button
            onClick={leaveFocusRoom}
            className="px-3.5 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border border-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Focus Music Playlist Bar (1 to 3 tracks) */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-pink-50/60 rounded-3xl border border-purple-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs relative">
            <Music className="w-4 h-4" />
            {isPlayingMusic && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <div className="min-w-0 flex-1 sm:flex-initial">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 truncate">{activeFocusTrack.title}</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-bold text-[10px]">
                {activeFocusTrack.tag}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate">{activeFocusTrack.artist}</p>
          </div>
        </div>

        {/* Music Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleMusic}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isPlayingMusic ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">توقف موسیقی</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">پخش موسیقی تمرکز</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextTrack}
              title="آهنگ بعدی در پلی‌لیست"
              className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 rotate-180" />
            </button>

            <button
              onClick={handleToggleMute}
              title={isMuted ? 'فعال‌سازی صدا' : 'قطع صدا'}
              className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-xs cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : musicVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 h-1.5 accent-purple-600 bg-zinc-200 rounded-lg cursor-pointer hidden md:block"
              title="تنظیم بلندی صدا"
            />
          </div>

          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            title="تنظیمات پلی‌لیست تمرکز"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">پلی‌لیست ({toPersianDigits(playlist.length)})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Synced Pomodoro Timer + Live Chat & Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timer Box */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center space-y-6">
          {/* Mode Badge Switcher */}
          <div className="inline-flex items-center p-1 bg-zinc-100 rounded-2xl border border-zinc-200 text-xs font-bold">
            <button
              onClick={() => handleSwitchMode('focus')}
              disabled={activeRoom.isDeleted}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeRoom.mode === 'focus'
                  ? 'bg-white text-zinc-900 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              تمرکز ({toPersianDigits(Math.round(activeRoom.focusDuration / 60))} دقیقه)
            </button>
            <button
              onClick={() => handleSwitchMode('shortBreak')}
              disabled={activeRoom.isDeleted}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeRoom.mode === 'shortBreak'
                  ? 'bg-white text-zinc-900 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              استراحت ({toPersianDigits(Math.round(activeRoom.breakDuration / 60))} دقیقه)
            </button>
          </div>

          {/* Circular Countdown Progress */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-zinc-100"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`transition-all duration-1000 ${
                  activeRoom.mode === 'focus' ? 'stroke-zinc-900' : 'stroke-emerald-500'
                }`}
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-zinc-900 font-mono tracking-wider">
                {toPersianDigits(formattedTime)}
              </span>
              <span className="text-xs font-semibold text-zinc-500 mt-2">
                {activeRoom.isDeleted
                  ? 'اتاق بسته شده'
                  : activeRoom.isRunning
                  ? 'تایمر هماهنگ در حال اجرا ⚡'
                  : 'توقف موقت تایمر'}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          {!activeRoom.isDeleted && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetTimer}
                className="p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all cursor-pointer border border-zinc-200"
                title="بازنشانی زمان"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleToggleTimer}
                className="px-8 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {activeRoom.isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-white" />
                    توقف تایمر
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    شروع تمرکز گروهی
                  </>
                )}
              </button>

              <button
                onClick={() => handleSwitchMode(activeRoom.mode === 'focus' ? 'shortBreak' : 'focus')}
                className="p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all cursor-pointer border border-zinc-200"
                title="تغییر فاز تمرکز / استراحت"
              >
                <Coffee className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Quick cheers bar */}
          {!activeRoom.isDeleted && (
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs">
              {['خداقوت 🔥', 'شروع کردیم 🎯', 'خسته نباشید 👏', 'پومودورو تمام شد 🏆', 'قهوه و استراحت ☕'].map((cheer) => (
                <button
                  key={cheer}
                  onClick={() => sendQuickCheer(cheer)}
                  className="px-2.5 py-1 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold border border-zinc-200 transition-colors cursor-pointer"
                >
                  {cheer}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel: Participants & Live Room Chat */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Active Participants Box */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-500" />
                حاضرین در اتاق ({toPersianDigits(activeRoom.participants?.length || 1)})
              </span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {activeRoom.participants?.map((p) => {
                const isUserHost = p.userId === activeRoom.hostId;
                const isMe = p.userId === currentUser?.id;
                const displayName = p.userName || p.name || p.username || 'کاربر';
                const participantAvatar = users.find((u) => u.id === p.userId)?.avatar;

                return (
                  <div key={p.userId} className="flex items-center justify-between py-1 px-2 rounded-xl bg-zinc-50 text-xs border border-zinc-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={displayName} avatar={participantAvatar} size="w-7 h-7 rounded-full text-[11px]" />
                      <div className="truncate">
                        <span className="font-bold text-zinc-900 text-[11px]">{displayName}</span>
                        {isMe && <span className="text-[10px] text-zinc-400 mr-1">(شما)</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isUserHost && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-bold" title="میزبان اتاق">
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
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-3 flex-1 flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                پیام‌ها و گفتگوی زنده اتاق
              </span>
              <span className="text-[10px] text-zinc-400">
                {activeRoom.messages?.length ? `${toPersianDigits(activeRoom.messages.length)} پیام` : 'بدون پیام'}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto flex-1 text-xs pr-1">
              {activeRoom.messages?.map((m) => {
                const isSys = m.userId === 'system';
                const isMe = m.userId === currentUser?.id;

                if (isSys) {
                  return (
                    <div key={m.id} className="text-[10px] text-center text-zinc-500 bg-zinc-100 py-1 px-2.5 rounded-xl border border-zinc-200">
                      <span>{m.text}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-2xl max-w-[85%] text-[11px] ${
                      isMe
                        ? 'bg-zinc-900 text-white mr-auto font-medium shadow-xs'
                        : 'bg-zinc-100 text-zinc-900 ml-auto border border-zinc-200'
                    }`}
                  >
                    {!isMe && (
                      <span className="block font-bold text-[10px] text-zinc-500 mb-0.5">
                        {m.userName}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-left font-mono ${
                        isMe ? 'text-zinc-400' : 'text-zinc-400'
                      }`}
                    >
                      {toPersianDigits(m.timestamp)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message form */}
            {!activeRoom.isDeleted ? (
              globalSettings?.roomPolicy?.allowPublicChat === false && currentUser?.role !== 'admin' ? (
                <div className="pt-2 text-center text-[11px] text-zinc-400 bg-zinc-50 py-2 rounded-xl border border-zinc-200">
                  گفتگوی عمومی طبق سیاست مدیر سازمان موقتاً غیرفعال است.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="پیام یا انگیزه..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-50 text-zinc-900 text-xs outline-hidden border border-zinc-200 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-2.5 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 cursor-pointer disabled:opacity-40 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </form>
              )
            ) : (
              <div className="pt-2 text-center text-[11px] text-zinc-500 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                اتاق بسته شده است؛ ارسال پیام غیرفعال است (پیام‌ها تا ۱۰ دقیقه نگه‌داری می‌شوند).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Playlist Configuration Modal (1 to 3 tracks) */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">پلی‌لیست موسیقی تمرکز پومودورو</h3>
                  <p className="text-[11px] text-zinc-500">انتخاب قطعات آرامش‌بخش برای تمرکز عمیق</p>
                </div>
              </div>
              <button
                onClick={() => setIsMusicModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Playlist list */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700">قطعات پلی‌لیست (۱ تا ۳ آهنگ):</label>
              {DEFAULT_FOCUS_TRACKS.map((t, idx) => {
                const isCurrent = activeFocusTrack.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrack(t)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isCurrent ? 'bg-purple-600 text-white' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {toPersianDigits(idx + 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{t.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/70 border border-zinc-200 text-zinc-700">
                        {t.tag}
                      </span>
                      {isCurrent && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Streaming Track Form */}
            <form onSubmit={handleAddCustomTrack} className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="text-xs font-bold text-zinc-700">افزودن لینک موزیک دلخواه میزبان:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customAudioUrl}
                  onChange={(e) => setCustomAudioUrl(e.target.value)}
                  placeholder="https://example.com/ambient.mp3..."
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 outline-hidden focus:bg-white focus:border-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!customAudioUrl.trim()}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  افزودن
                </button>
              </div>
            </form>

            {/* Auto-play toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div>
                <p className="text-xs font-bold text-zinc-900">پخش خودکار با شروع تایمر</p>
                <p className="text-[10px] text-zinc-500">موسیقی همراه با استارت پومودورو آغاز شود</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlayWithTimer(!autoPlayWithTimer)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoPlayWithTimer ? 'bg-purple-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    autoPlayWithTimer ? 'right-6' : 'right-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMusicModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer shadow-xs"
              >
                تأیید و بازگشت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">حذف و بستن اتاق تمرکز</h3>
                <p className="text-xs text-zinc-500">اتاق «{activeRoom.name}»</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs leading-relaxed text-amber-900">
              <p className="font-semibold text-amber-950">
                ⚠️ سیاست نگه‌داری پیام‌ها:
              </p>
              <p>
                با بستن اتاق، جلسه برای تمام کاربران به پایان می‌رسد.
                <strong className="text-amber-800 mr-1">
                  پیام‌ها و چت‌های این اتاق تا ۱۰ دقیقه پس از حذف بر روی سرور نگه‌داری می‌شوند
                </strong>
                تا کاربران در صورت نیاز تاریخچه پیام‌ها را بررسی کنند. پس از ۱۰ دقیقه، کلیه اطلاعات به طور دائمی پاک خواهند شد.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRoom}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? 'در حال حذف...' : 'تأیید و بستن اتاق'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-zinc-600" />
              دعوت دوستان به اتاق تمرکز
            </h3>

            {/* Invite link box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600">لینک ورود مستقیم به اتاق:</label>
              <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-2xl border border-zinc-200">
                <input
                  type="text"
                  readOnly
                  value={getInviteUrl()}
                  className="flex-1 bg-transparent text-xs text-zinc-900 font-mono outline-hidden select-all"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="px-3 py-1 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer shadow-xs"
                >
                  {copiedLink ? 'کپی شد!' : 'کپی'}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                هر فردی که روی این لینک کلیک کند، اگر لاگین نباشد به صفحه ورود/ثبت‌نام هدایت می‌شود و پس از ورود مستقیماً وارد همین اتاق خواهد شد.
              </p>
            </div>

            {/* Select user to invite */}
            {users.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <label className="text-xs font-semibold text-zinc-600">دعوت از کاربران سامانه:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedUserToInvite}
                    onChange={(e) => setSelectedUserToInvite(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs outline-hidden"
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
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer shadow-xs"
                  >
                    ارسال دعوت
                  </button>
                </div>
              </div>
            )}

            {inviteSuccessNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 font-bold text-center">
                {inviteSuccessNotice}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
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
