import React from 'react';

/**
 * High-fidelity 3D Memoji style illustrated avatars
 * matching the Dribbble reference shot (Kim So Men, Michie, and team members)
 */

export const AvatarMichie: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`rounded-full flex-shrink-0 ${className}`}>
    <circle cx="50" cy="50" r="50" fill="#FFE0B2" />
    {/* Hair */}
    <path d="M22 45 C20 22 36 12 50 12 C64 12 80 22 78 45 C78 50 72 34 50 34 C28 34 22 50 22 45 Z" fill="#4A2810" />
    {/* Face */}
    <ellipse cx="50" cy="56" rx="28" ry="32" fill="#FCD5B5" />
    {/* Eyes */}
    <ellipse cx="38" cy="54" rx="4" ry="5" fill="#2D1A0E" />
    <ellipse cx="62" cy="54" rx="4" ry="5" fill="#2D1A0E" />
    <circle cx="39.5" cy="52.5" r="1.5" fill="#FFFFFF" />
    <circle cx="63.5" cy="52.5" r="1.5" fill="#FFFFFF" />
    {/* Eyebrows */}
    <path d="M33 46 Q39 42 44 45" stroke="#4A2810" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M56 45 Q61 42 67 46" stroke="#4A2810" strokeWidth="2.5" strokeLinecap="round" />
    {/* Smile */}
    <path d="M43 68 Q50 74 57 68" stroke="#D32F2F" strokeWidth="3" fill="#E57373" strokeLinecap="round" />
    {/* Blush */}
    <circle cx="32" cy="62" r="5" fill="#FF8A80" opacity="0.4" />
    <circle cx="68" cy="62" r="5" fill="#FF8A80" opacity="0.4" />
  </svg>
);

export const AvatarDesigner: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`rounded-full flex-shrink-0 ${className}`}>
    <circle cx="50" cy="50" r="50" fill="#E1F5FE" />
    {/* Hair - Reddish Pompadour */}
    <path d="M20 40 C22 10 78 8 80 40 C75 22 62 18 50 18 C38 18 25 22 20 40 Z" fill="#E65100" />
    {/* Face */}
    <ellipse cx="50" cy="56" rx="27" ry="30" fill="#FFE0B2" />
    {/* Glasses */}
    <rect x="28" y="48" width="18" height="14" rx="4" fill="none" stroke="#263238" strokeWidth="2.5" />
    <rect x="54" y="48" width="18" height="14" rx="4" fill="none" stroke="#263238" strokeWidth="2.5" />
    <line x1="46" y1="54" x2="54" y2="54" stroke="#263238" strokeWidth="2.5" />
    {/* Eyes */}
    <circle cx="37" cy="55" r="3" fill="#212121" />
    <circle cx="63" cy="55" r="3" fill="#212121" />
    {/* Smile */}
    <path d="M42 70 Q50 75 58 70" stroke="#BF360C" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const AvatarDeveloper: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`rounded-full flex-shrink-0 ${className}`}>
    <circle cx="50" cy="50" r="50" fill="#E8F5E9" />
    {/* Hair Curly Dark */}
    <path d="M22 36 C18 18 82 18 78 36 C82 46 76 30 50 30 C24 30 18 46 22 36 Z" fill="#212121" />
    {/* Face */}
    <ellipse cx="50" cy="56" rx="28" ry="32" fill="#D7CCC8" />
    {/* Eyes */}
    <ellipse cx="38" cy="54" rx="4" ry="5" fill="#212121" />
    <ellipse cx="62" cy="54" rx="4" ry="5" fill="#212121" />
    {/* Smile */}
    <path d="M42 69 Q50 75 58 69" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const AvatarProductManager: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`rounded-full flex-shrink-0 ${className}`}>
    <circle cx="50" cy="50" r="50" fill="#FFF3E0" />
    {/* Hair Blonde Bob */}
    <path d="M24 48 C20 18 80 18 76 48 C76 65 72 40 50 35 C28 40 24 65 24 48 Z" fill="#FDD835" />
    {/* Face */}
    <ellipse cx="50" cy="56" rx="27" ry="31" fill="#FFECB3" />
    {/* Eyes */}
    <circle cx="38" cy="54" r="3.5" fill="#37474F" />
    <circle cx="62" cy="54" r="3.5" fill="#37474F" />
    {/* Smile */}
    <path d="M43 69 Q50 74 57 69" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
