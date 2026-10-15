import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  ShoppingBag,
  Check,
  Share2,
  Copy,
  Droplets,
  Trophy,
} from 'lucide-react';

export interface PlantCustomization {
  species: 'clover' | 'cactus' | 'bamboo' | 'bonsai' | 'sunflower' | 'magicTree';
  pot: 'terracotta' | 'whiteCeramic' | 'turquoise' | 'marble' | 'gold';
  aura: 'none' | 'butterflies' | 'neonGlow' | 'galaxy';
}

interface FocusGardenShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  gardenGems: number;
  onUpdateGems: (newGems: number) => void;
  customization: PlantCustomization;
  onUpdateCustomization: (c: PlantCustomization) => void;
}

export const FocusGardenShopModal: React.FC<FocusGardenShopModalProps> = ({
  isOpen,
  onClose,
  gardenGems,
  onUpdateGems,
  customization,
  onUpdateCustomization,
}) => {
  const { currentUser } = useTask();
  const [activeTab, setActiveTab] = useState<'species' | 'pots' | 'auras' | 'earn'>('species');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Unlocked items persisted per user
  const userKey = currentUser?.id || 'guest';
  const unlockedStorageKey = `taskrooz_garden_unlocked_${userKey}`;
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(unlockedStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['clover', 'terracotta', 'none'];
  });

  if (!isOpen) return null;

  const saveUnlocked = (items: string[]) => {
    setUnlockedItems(items);
    try {
      localStorage.setItem(unlockedStorageKey, JSON.stringify(items));
    } catch {}
  };

  const handleBuyOrEquip = (itemId: string, type: 'species' | 'pot' | 'aura', price: number) => {
    const isUnlocked = unlockedItems.includes(itemId);

    if (isUnlocked) {
      sounds.playPop();
      onUpdateCustomization({
        ...customization,
        [type]: itemId,
      });
      return;
    }

    // Purchase
    if (gardenGems < price) {
      alert('الماس کافی ندارید! با انجام تسک‌ها، تمرکز و دعوت دوستان الماس بیشتری کسب کنید.');
      return;
    }

    sounds.playComplete();
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });
    } catch {}

    const newGems = gardenGems - price;
    onUpdateGems(newGems);
    const updatedUnlocked = [...unlockedItems, itemId];
    saveUnlocked(updatedUnlocked);

    onUpdateCustomization({
      ...customization,
      [type]: itemId,
    });
  };

  const inviteLink = `https://bagtime.negahm.ir/?ref=${currentUser?.username || 'member'}`;

  const handleCopyInvite = () => {
    sounds.playComplete();
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedInvite(true);
      // Reward +50 gems on first share
      if (!unlockedItems.includes('invited_once')) {
        onUpdateGems(gardenGems + 50);
        saveUnlocked([...unlockedItems, 'invited_once']);
      }
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  };

  // Item catalogs
  const SPECIES_CATALOG = [
    { id: 'clover', name: 'جوانه شبدر خوش‌شانس', price: 0, desc: 'نماد شانس و شروع پرامید' },
    { id: 'cactus', name: 'کاکتوس صحرایی صبور', price: 50, desc: 'استقامت بالا در برابر تنبلی' },
    { id: 'bamboo', name: 'بامبوی ثروت و پیروزی', price: 100, desc: 'رشد سریع و جهش اهداف' },
    { id: 'bonsai', name: 'بنسای مینیاتوری ژاپنی', price: 200, desc: 'نهایت دقت، ظرافت و آرامش ذن' },
    { id: 'sunflower', name: 'گل آفتابگردان زرین', price: 350, desc: 'همواره رو به نور موفقیت' },
    { id: 'magicTree', name: 'درخت کهن جادویی', price: 500, desc: 'اسطوره دانش و تمرکز بیکران' },
  ];

  const POTS_CATALOG = [
    { id: 'terracotta', name: 'گلدان سفالی سنتی', price: 0, color: '#78350f', desc: 'ساده، اصیل و خاکی' },
    { id: 'whiteCeramic', name: 'سرامیکی سفید مینیمال', price: 40, color: '#f8fafc', desc: 'مدرن و شیک' },
    { id: 'turquoise', name: 'کوزه فیروزه‌ای اصفهان', price: 120, color: '#06b6d4', desc: 'فیروزه‌کوب چشم‌نواز' },
    { id: 'marble', name: 'سنگ مرمر لوکس سلطنتی', price: 250, color: '#94a3b8', desc: 'وقار و شکوه اصیل' },
    { id: 'gold', name: 'کاسه طلای هخامنشی', price: 500, color: '#f59e0b', desc: 'شاهکار زرین قهرمانان' },
  ];

  const AURAS_CATALOG = [
    { id: 'none', name: 'بدون افکت', price: 0, desc: 'حالت طبیعی' },
    { id: 'butterflies', name: 'پروانه‌های رقصان', price: 80, desc: 'پرواز پروانه‌های شاداب' },
    { id: 'neonGlow', name: 'هاله نئونی زمردین', price: 150, desc: 'درخشش نئونی جذاب' },
    { id: 'galaxy', name: 'ذرات ستاره‌ای و کهکشان', price: 300, desc: 'گرد ستاره‌ای درخشان' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[32px] p-5 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-zinc-800 space-y-4 relative my-auto select-none"
      >
        {/* Header with Gems Counter */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>فروشگاه باغچه و شخصی‌سازی گل</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  اکسسوری‌ها
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                با الماس‌های کسب‌شده، گونه گیاهی، گلدان و افکت‌های خاص بخر!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-black">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{toPersianDigits(gardenGems)} الماس</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('species')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'species'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            🌿 گونه‌های گیاهی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pots')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pots'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            🪴 گلدان‌ها
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auras')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auras'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            ✨ افکت و هاله
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earn')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'earn'
                ? 'bg-amber-500 text-white shadow-xs font-black'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            🎁 کسب الماس
          </button>
        </div>

        {/* Catalog Body */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar py-1">
          {activeTab === 'species' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SPECIES_CATALOG.map((sp) => {
                const isUnlocked = unlockedItems.includes(sp.id);
                const isEquipped = customization.species === sp.id;
                return (
                  <div
                    key={sp.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isEquipped
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {sp.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {sp.desc}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrEquip(sp.id, 'species', sp.price)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-600 text-white font-black'
                          : isUnlocked
                          ? 'bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-emerald-500 hover:text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {isEquipped ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> فعال
                        </span>
                      ) : isUnlocked ? (
                        'استفاده'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {toPersianDigits(sp.price)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'pots' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POTS_CATALOG.map((pot) => {
                const isUnlocked = unlockedItems.includes(pot.id);
                const isEquipped = customization.pot === pot.id;
                return (
                  <div
                    key={pot.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isEquipped
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: pot.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {pot.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                          {pot.desc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrEquip(pot.id, 'pot', pot.price)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-600 text-white font-black'
                          : isUnlocked
                          ? 'bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-emerald-500 hover:text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {isEquipped ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> فعال
                        </span>
                      ) : isUnlocked ? (
                        'استفاده'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {toPersianDigits(pot.price)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'auras' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AURAS_CATALOG.map((aura) => {
                const isUnlocked = unlockedItems.includes(aura.id);
                const isEquipped = customization.aura === aura.id;
                return (
                  <div
                    key={aura.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isEquipped
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {aura.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {aura.desc}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrEquip(aura.id, 'aura', aura.price)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-600 text-white font-black'
                          : isUnlocked
                          ? 'bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-emerald-500 hover:text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {isEquipped ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> فعال
                        </span>
                      ) : isUnlocked ? (
                        'استفاده'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {toPersianDigits(aura.price)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'earn' && (
            <div className="space-y-3">
              {/* Invite Friends Reward */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-500" />
                    <span>دعوت دوستان و همکاران (+۵۰ الماس هدیه)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                    جایزه فوری
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  لینک اختصاصی خود را برای دوستان بفرستید تا با ثبت‌نام آنها بلافاصله ۵۰ الماس دریافت کنید:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    dir="ltr"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-zinc-400 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInvite ? 'کپی شد!' : 'کپی لینک'}</span>
                  </button>
                </div>
              </div>

              {/* Tasks & Focus Gem Rewards info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-black text-slate-800 dark:text-white">انجام هر تسک</div>
                    <div className="text-[10px] text-emerald-600 font-bold">+۱۰ الماس پاداش</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-500/30 flex items-center gap-2.5">
                  <Droplets className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <div className="font-black text-slate-800 dark:text-white">آبیاری روزانه</div>
                    <div className="text-[10px] text-indigo-600 font-bold">+۵ الماس روزانه</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-black text-slate-800 dark:text-white">جلسات تمرکز ۲۵د</div>
                    <div className="text-[10px] text-amber-600 font-bold">+۱۵ الماس تمرکز</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <div className="font-black text-slate-800 dark:text-white">چالش‌های قبیله</div>
                    <div className="text-[10px] text-rose-600 font-bold">تا ۲۵۰+ الماس هفته</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
