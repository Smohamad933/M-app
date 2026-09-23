import React from 'react';

interface UserAvatarProps {
  user?: { name?: string; avatar?: string | null } | null;
  name?: string;
  avatar?: string | null;
  /** Admin-set default profile image, shown when the user has no personal photo */
  fallbackImage?: string | null;
  /** tailwind size classes, e.g. 'w-10 h-10 text-sm' */
  size?: string;
  className?: string;
}

/**
 * عکس پروفایل کاربر: اگر عکس آپلود شده باشد نمایشش می‌دهد،
 * در غیر این صورت عکس پیش‌فرض ادمین یا حرف اول نام داخل قاب گرد زیبا.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  avatar,
  fallbackImage,
  size = 'w-10 h-10 text-sm',
  className = '',
}) => {
  const finalName = name || user?.name || '?';
  const finalAvatar = avatar || user?.avatar || null;
  const firstChar = finalName.trim().charAt(0);
  const roundedClass = className.includes('rounded-') ? '' : 'rounded-full';

  if (finalAvatar && typeof finalAvatar === 'string' && finalAvatar.startsWith('data:image/')) {
    return (
      <img
        src={finalAvatar}
        alt={finalName}
        className={`${size} ${roundedClass} object-cover border-2 border-[#00b884] shadow-xs flex-shrink-0 ${className}`}
      />
    );
  }
  if (fallbackImage && typeof fallbackImage === 'string' && fallbackImage.startsWith('data:image/')) {
    return (
      <img
        src={fallbackImage}
        alt={finalName}
        className={`${size} ${roundedClass} object-cover border-2 border-[#00b884] shadow-xs flex-shrink-0 opacity-95 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${size} ${roundedClass} bg-gradient-to-tr from-[#00b884] to-emerald-600 border-2 border-white shadow-xs text-white font-bold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {firstChar}
    </div>
  );
};
