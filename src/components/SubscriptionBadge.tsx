import React from 'react';
import type { User, UserSubscription } from '../types';

export type PlanKey = 'free' | 'plus' | 'pro' | 'ultra';

export interface PlanMetadata {
  plan: PlanKey;
  label: string;
  symbol: string;
  isPremium: boolean;
  bgClass: string;
  textClass: string;
  borderClass: string;
  pillClass: string;
  cornerBadgeClass: string;
}

export function getPlanMetadata(
  subscription?: UserSubscription | { plan?: string; planType?: string } | null,
  role?: string
): PlanMetadata {
  if (role === 'admin') {
    return {
      plan: 'pro',
      label: 'مدیر سیستم',
      symbol: '🛡️',
      isPremium: true,
      bgClass: 'bg-purple-50 dark:bg-purple-950/40',
      textClass: 'text-purple-700 dark:text-purple-300',
      borderClass: 'border-purple-300 dark:border-purple-800',
      pillClass: 'bg-purple-50 text-purple-700 border-purple-200',
      cornerBadgeClass: 'bg-purple-600 text-white shadow-purple-500/30',
    };
  }

  const planStr = (subscription?.plan || '').toLowerCase();
  const planType = (subscription?.planType || '').toLowerCase();

  // 1. Ultra (6 months)
  if (planStr === 'ultra' || planType === '6_months') {
    return {
      plan: 'ultra',
      label: 'اولترا (Ultra)',
      symbol: '💎',
      isPremium: true,
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
      textClass: 'text-cyan-800 dark:text-cyan-300',
      borderClass: 'border-cyan-300 dark:border-cyan-800',
      pillClass: 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800 border-cyan-200 shadow-2xs',
      cornerBadgeClass: 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-cyan-500/40',
    };
  }

  // 2. Pro (3 months)
  if (planStr === 'pro' || planType === '3_months') {
    return {
      plan: 'pro',
      label: 'پرو (Pro)',
      symbol: '⭐',
      isPremium: true,
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      textClass: 'text-amber-800 dark:text-amber-300',
      borderClass: 'border-amber-300 dark:border-amber-800',
      pillClass: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border-amber-200 shadow-2xs',
      cornerBadgeClass: 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-amber-500/40',
    };
  }

  // 3. Plus (1 month)
  if (planStr === 'plus' || planType === '1_month') {
    return {
      plan: 'plus',
      label: 'پلاس (Plus)',
      symbol: '➕',
      isPremium: true,
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      textClass: 'text-emerald-800 dark:text-emerald-300',
      borderClass: 'border-emerald-300 dark:border-emerald-800',
      pillClass: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-200 shadow-2xs',
      cornerBadgeClass: 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/40',
    };
  }

  // Free
  return {
    plan: 'free',
    label: 'رایگان',
    symbol: '',
    isPremium: false,
    bgClass: 'bg-slate-50 dark:bg-zinc-800',
    textClass: 'text-slate-500 dark:text-zinc-400',
    borderClass: 'border-slate-200 dark:border-zinc-700',
    pillClass: 'bg-slate-100 text-slate-600 border-slate-200',
    cornerBadgeClass: 'bg-slate-400 text-white',
  };
}

interface SubscriptionBadgeProps {
  user?: Partial<User> | null;
  subscription?: UserSubscription | null;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  showSymbolOnly?: boolean;
  className?: string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  user,
  subscription = user?.subscription,
  role = user?.role,
  size = 'md',
  showSymbolOnly = false,
  className = '',
}) => {
  const meta = getPlanMetadata(subscription, role);

  if (!meta.isPremium) return null;

  if (showSymbolOnly) {
    return (
      <span
        title={meta.label}
        className={`inline-flex items-center justify-center font-bold select-none cursor-default ${className}`}
      >
        {meta.symbol}
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs sm:text-sm px-3 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-black border transition-all select-none ${meta.pillClass} ${sizeClasses} ${className}`}
      title={`اشتراک ویژه: ${meta.label}`}
    >
      <span className="text-sm leading-none">{meta.symbol}</span>
      <span>{meta.label}</span>
    </span>
  );
};
