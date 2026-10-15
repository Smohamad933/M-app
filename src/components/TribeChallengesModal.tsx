import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { getUserGems, deductGems, addGems } from '../utils/gemManager';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Users,
  Flame,
  Clock,
  Sparkles,
  Gift,
  Send,
  CheckCircle2,
  Medal,
  Heart,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface TribeChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Quest {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  unit: string;
  rewardGems: number;
  rewardTitle: string;
  icon: 'clock' | 'streak' | 'tasks';
  claimed?: boolean;
}

export const TribeChallengesModal: React.FC<TribeChallengesModalProps> = ({ isOpen, onClose }) => {
  const { tasks, friends, currentUser } = useTask();
  const userKey = currentUser?.id || 'guest';
  const claimedKey = `taskrooz_tribe_claimed_${userKey}`;

  const [activeTab, setActiveTab] = useState<'quests' | 'gift' | 'ranks'>('quests');
  const [selectedFriend, setSelectedFriend] = useState<string>(friends[0]?.id || '');
  const [giftGems, setGiftGems] = useState<number>(30);
  const [giftNote, setGiftNote] = useState<string>('خدا قوت رفیق! این الماس‌ها برای رشد باغچه‌ت 🌿');
  const [giftSentSuccess, setGiftSentSuccess] = useState<boolean>(false);
  const [giftError, setGiftError] = useState<string | null>(null);

  // Real-time gems synchronization
  const [myGems, setMyGems] = useState<number>(() => getUserGems(userKey));

  useEffect(() => {
    setMyGems(getUserGems(userKey));
    const handleUpdate = () => {
      setMyGems(getUserGems(userKey));
    };
    window.addEventListener('taskrooz_garden_updated', handleUpdate);
    return () => window.removeEventListener('taskrooz_garden_updated', handleUpdate);
  }, [userKey, isOpen]);

  const [claimedQuests, setClaimedQuests] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(claimedKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  if (!isOpen) return null;

  // Calculate actual team / user contributions
  const totalUserFocusMins = tasks.reduce((sum, t) => sum + (t.focusMinutesSpent || 0), 0);
  const totalUserCompletedTasks = tasks.filter((t) => t.completed).length;

  // Community / Tribe multipliers (User stats + mock friendly team effort)
  const tribeFocusMins = totalUserFocusMins + 420;
  const tribeCompletedTasks = totalUserCompletedTasks + 28;

  const quests: Quest[] = [
    {
      id: 'quest_focus_1000',
      title: 'ماراتن ۱۰۰۰ دقیقه تمرکز جمعی',
      desc: 'ثبت ۱۰۰۰ دقیقه زمان تمرکز عمیق توسط اعضای قبیله در طول هفته',
      target: 1000,
      current: Math.min(1000, tribeFocusMins),
      unit: 'دقیقه',
      rewardGems: 250,
      rewardTitle: 'هاله کهکشانی + ۲۵۰ الماس',
      icon: 'clock',
      claimed: claimedQuests.includes('quest_focus_1000'),
    },
    {
      id: 'quest_tasks_50',
      title: 'پاکسازی ۵۰ تسک هفتگی',
      desc: 'تکمیل و بستن حداقل ۵۰ کار و پروژه کاری در طول هفته',
      target: 50,
      current: Math.min(50, tribeCompletedTasks),
      unit: 'تسک',
      rewardGems: 150,
      rewardTitle: 'بذر کاکتوس طلایی + ۱۵۰ الماس',
      icon: 'tasks',
      claimed: claimedQuests.includes('quest_tasks_50'),
    },
    {
      id: 'quest_streak_7',
      title: 'زنجیره استمرار ۷ روزه عادات',
      desc: 'انجام روزانه عادات میکرو و استمرار بدون انقطاع برای ۷ روز',
      target: 7,
      current: 5,
      unit: 'روز',
      rewardGems: 100,
      rewardTitle: 'گلدان فیروزه‌ای سنتی + ۱۰۰ الماس',
      icon: 'streak',
      claimed: claimedQuests.includes('quest_streak_7'),
    },
  ];

  const handleClaimReward = (q: Quest) => {
    if (q.current < q.target || q.claimed) return;
    sounds.playComplete();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });
    } catch {}

    const next = [...claimedQuests, q.id];
    setClaimedQuests(next);
    try {
      localStorage.setItem(claimedKey, JSON.stringify(next));
      // Add real gems to balance
      const newTotal = addGems(userKey, q.rewardGems);
      setMyGems(newTotal);
    } catch {}
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend) return;
    setGiftError(null);

    // 1. Validate real balance: MUST NOT EXCEED AVAILABLE GEMS!
    if (myGems < giftGems) {
      sounds.playPop();
      setGiftError(`موجودی الماس شما (${toPersianDigits(myGems)}) برای ارسال ${toPersianDigits(giftGems)} الماس کافی نیست!`);
      return;
    }

    // 2. Atomically deduct gems
    const success = deductGems(userKey, giftGems);
    if (!success) {
      sounds.playPop();
      setGiftError('خطا در کسر موجودی: الماس کافی ندارید.');
      return;
    }

    setMyGems(getUserGems(userKey));

    sounds.playComplete();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ec4899', '#f59e0b', '#8b5cf6'],
      });
    } catch {}

    // Log gift in storage
    try {
      const sentGiftsKey = `taskrooz_sent_gifts_${userKey}`;
      const existing = JSON.parse(localStorage.getItem(sentGiftsKey) || '[]');
      existing.push({
        friendId: selectedFriend,
        gems: giftGems,
        note: giftNote,
        date: new Date().toISOString(),
      });
      localStorage.setItem(sentGiftsKey, JSON.stringify(existing));
    } catch {}

    setGiftSentSuccess(true);
    setTimeout(() => {
      setGiftSentSuccess(false);
      setGiftNote('');
    }, 3000);
  };

  const hasEnoughGems = myGems >= giftGems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5 fill-amber-500/30" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>چالش‌های هفتگی قبیله و رقابت تیمی</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  فصل جاری
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                همکاری جمعی برای فتح اهداف، دریافت الماس و جوایز نایاب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Gems Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{toPersianDigits(myGems)} الماس</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('quests');
            }}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quests'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>چالش‌های فعال ({toPersianDigits(quests.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('gift');
            }}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gift'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>ارسال هدیه به دوستان</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setActiveTab('ranks');
            }}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ranks'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>رتبه‌بندی اعضا</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {activeTab === 'quests' && (
            <div className="space-y-3">
              {quests.map((q) => {
                const percent = Math.min(100, Math.round((q.current / q.target) * 100));
                const isReady = q.current >= q.target && !q.claimed;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col gap-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          {q.icon === 'clock' && <Clock className="w-4 h-4" />}
                          {q.icon === 'tasks' && <CheckCircle2 className="w-4 h-4" />}
                          {q.icon === 'streak' && <Flame className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                            {q.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            {q.desc}
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {toPersianDigits(q.current)} / {toPersianDigits(q.target)} {q.unit}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-zinc-700/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Footer / Reward */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>جایزه: {q.rewardTitle}</span>
                      </div>

                      {q.claimed ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> دریافت شد
                        </span>
                      ) : isReady ? (
                        <button
                          type="button"
                          onClick={() => handleClaimReward(q)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer animate-pulse"
                        >
                          دریافت جایزه! 🎉
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">
                          {toPersianDigits(percent)}٪ تکمیل
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'gift' && (
            <form onSubmit={handleSendGift} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0 fill-rose-500/20" />
                  <span>
                    با ارسال الماس از موجودی خود، به دوستانتان در رشد باغچه‌شان انگیزه ببخشید!
                  </span>
                </div>
                <div className="font-mono font-black text-xs shrink-0 mr-2 text-amber-700 dark:text-amber-300">
                  موجودی: {toPersianDigits(myGems)} الماس
                </div>
              </div>

              {giftError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{giftError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  انتخاب دوست دریافت‌کننده:
                </label>
                {friends.length > 0 ? (
                  <select
                    value={selectedFriend}
                    onChange={(e) => setSelectedFriend(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                  >
                    {friends.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.username || f.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs text-slate-500">
                    هنوز دوستی به لیست دوستان شما افزوده نشده است.
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    تعداد الماس اهدایی:
                  </label>
                  <span className={`text-[11px] font-bold ${hasEnoughGems ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {hasEnoughGems ? 'موجودی کافی است' : 'کسری موجودی الماس!'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[20, 50, 100].map((amt) => {
                    const canAfford = myGems >= amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setGiftGems(amt);
                          setGiftError(null);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          giftGems === amt
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black'
                            : canAfford
                            ? 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-400'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-400 opacity-60'
                        }`}
                      >
                        {toPersianDigits(amt)} الماس
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  پیام دلگرم‌کننده همراه هدیه:
                </label>
                <textarea
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-white outline-none focus:border-amber-500"
                  placeholder="یک متن پرانرژی بنویسید..."
                />
              </div>

              <button
                type="submit"
                disabled={!selectedFriend || !hasEnoughGems}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {hasEnoughGems
                    ? `ارسال ${toPersianDigits(giftGems)} الماس به دوست`
                    : `موجودی ناکافی است (${toPersianDigits(myGems)} / ${toPersianDigits(giftGems)})`}
                </span>
              </button>

              {giftSentSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center animate-in fade-in">
                  ✓ هدیه شما با موفقیت از حسابتان کسر و برای دوستتان ارسال گردید!
                </div>
              )}
            </form>
          )}

          {activeTab === 'ranks' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 pb-1">
                رتبه‌بندی عملکرد اعضای قبیله در هفته جاری:
              </div>

              {/* Rank 1 */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                    ۱
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{currentUser?.name || 'شما'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                        پیشتاز
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {toPersianDigits(totalUserFocusMins)} دقیقه تمرکز | {toPersianDigits(totalUserCompletedTasks)} تسک
                    </div>
                  </div>
                </div>
                <Medal className="w-5 h-5 text-amber-500" />
              </div>

              {/* Team Members */}
              {friends.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center">
                      {toPersianDigits(idx + 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        {f.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {toPersianDigits(180 + idx * 45)} دقیقه تمرکز
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
