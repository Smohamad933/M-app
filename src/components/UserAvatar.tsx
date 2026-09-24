import React from 'react';
import type { UserSubscription } from '../types';
import { getPlanMetadata } from './SubscriptionBadge';

const PRESET_SIZES: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
};

interface UserAvatarProps {
  user?: { name?: string; avatar?: string | null; role?: string; subscription?: UserSubscription } | null;
  name?: string;
  avatar?: string | null;
  role?: string;
  subscription?: UserSubscription | null;
  showBadge?: boolean;
  /** Admin-set default profile image, shown when the user has no personal photo */
  fallbackImage?: string | null;
  /** tailwind size classes (e.g. 'w-10 h-10 text-sm') or preset name ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') */
  size?: string;
  className?: string;
}

/**
 * عکس پروفایل کاربر: تضمین ابعاد استاندارد با کانتینر ضد سرریز (Overflow-proof) و نماد اشتراک
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  avatar,
  role = user?.role,
  subscription = user?.subscription,
  showBadge = true,
  fallbackImage,
  size = 'md',
  className = '',
}) => {
  const finalName = name || user?.name || '?';
  const finalAvatar = avatar || user?.avatar || null;
  const firstChar = finalName.trim().charAt(0);
  const resolvedSize = PRESET_SIZES[size] || (size.includes('w-') ? size : 'w-11 h-11 text-sm');

  const meta = getPlanMetadata(subscription, role);

  const renderBadge = () => {
    if (!showBadge || !meta.isPremium || !meta.symbol) return null;
    return (
      <span
        title={meta.label}
        className="absolute -bottom-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-[10px] leading-none select-none z-10"
      >
        {meta.symbol}
      </span>
    );
  };

  if (finalAvatar && typeof finalAvatar === 'string' && finalAvatar.startsWith('data:image/')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full ${className}`}>
        <div
          className={`${resolvedSize} rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs flex-shrink-0 relative`}
        >
          <img
            src={finalAvatar}
            alt={finalName}
            className="w-full h-full object-cover block rounded-full"
          />
        </div>
        {renderBadge()}
      </div>
    );
  }

  if (fallbackImage && typeof fallbackImage === 'string' && fallbackImage.startsWith('data:image/')) {
    return (
      <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full ${className}`}>
        <div
          className={`${resolvedSize} rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs flex-shrink-0 relative opacity-95`}
        >
          <img
            src={fallbackImage}
            alt={finalName}
            className="w-full h-full object-cover block rounded-full"
          />
        </div>
        {renderBadge()}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-full ${className}`}>
      <div
        className={`${resolvedSize} rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-white shadow-xs text-white font-bold flex items-center justify-center flex-shrink-0`}
      >
        {firstChar}
      </div>
      {renderBadge()}
    </div>
  );
};
