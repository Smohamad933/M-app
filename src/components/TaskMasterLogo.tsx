import React from 'react';

export const TaskMasterHexagon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      {/* Faceted 3D Hexagon matching TaskMaster icon in Dribbble ref */}
      {/* Top segment: Cyan to Blue */}
      <path d="M50 12 L85 32 L50 52 L15 32 Z" fill="url(#hexTopGrad)" />
      {/* Bottom-left segment: Emerald to Teal */}
      <path d="M15 32 L50 52 L50 92 L15 72 Z" fill="url(#hexLeftGrad)" />
      {/* Bottom-right segment: Coral Orange to Rose */}
      <path d="M50 52 L85 32 L85 72 L50 92 Z" fill="url(#hexRightGrad)" />
      
      {/* Center inner dark ring */}
      <circle cx="50" cy="52" r="14" fill="#090d16" />
      <circle cx="50" cy="52" r="8" fill="#00E676" />
      <circle cx="50" cy="52" r="4.5" fill="#090d16" />

      <defs>
        <linearGradient id="hexTopGrad" x1="15" y1="20" x2="85" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B0FF" />
          <stop offset="1" stopColor="#2979FF" />
        </linearGradient>
        <linearGradient id="hexLeftGrad" x1="15" y1="40" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E676" />
          <stop offset="1" stopColor="#00B884" />
        </linearGradient>
        <linearGradient id="hexRightGrad" x1="50" y1="52" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6D00" />
          <stop offset="1" stopColor="#F4511E" />
        </linearGradient>
      </defs>
    </svg>
  );
};
