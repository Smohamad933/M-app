import React from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string | null;
  /** tailwind size classes, e.g. 'w-11 h-11 text-sm' */
  size?: string;
  className?: string;
}

/**
 * عکس پروفایل کاربر: اگر عکس آپلود شده باشد نمایشش می‌دهد،
 * در غیر این صورت حرف اول نام داخل قاب رنگی.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ name, avatar, size = 'w-11 h-11 text-sm', className = '' }) => {
  const firstChar = (name || '?').trim().charAt(0);
  if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image/')) {
    return (
      <img
        src={avatar}
        alt={name || 'عکس پروفایل'}
        className={`${size} rounded-2xl object-cover border border-zinc-700/60 flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-2xl bg-zinc-800 border border-zinc-700/60 text-white font-bold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {firstChar}
    </div>
  );
};
