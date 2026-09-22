import React, { useState } from 'react';
import { toPersianDigits } from '../utils/persianDate';
import {
  Bell,
  Check,
  CheckSquare,
  Users,
  Megaphone,
  X,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'friend' | 'broadcast' | 'info';
  timestamp: string;
  read: boolean;
  taskId?: string;
  userId?: string;
  userName?: string;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: AppNotification[];
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onNotificationClick?: (n: AppNotification) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenChat?: (userId: string, userName: string) => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'پیام از طرف Michie ✌️',
    message: '«امروز وارد فاز طراحی وایرفریم داشبورد تسک‌روز می‌شیم...»',
    type: 'friend',
    timestamp: '۱۲:۴۹',
    read: false,
    userId: 'michie-lead',
    userName: 'Michie ✌️',
  },
  {
    id: 'notif-2',
    title: 'تسک با اولویت بالا',
    message: 'کیت اپلیکیشن تیمی (Delivery App Kit) تا ساعت ۱۶:۰۰ زمان‌بندی شده است.',
    type: 'task',
    timestamp: '۱۰:۳۰',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'پیام سراسری سازمان',
    message: '«هدف این هفته: بهینه‌سازی جریان کار، تکمیل تعهدات اسپرینت و بازخورد سریع به تیم.»',
    type: 'broadcast',
    timestamp: 'دیروز',
    read: true,
  },
];

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications: externalNotifications,
  onMarkAllAsRead: externalMarkAllAsRead,
  onClearAll: externalClearAll,
  onNotificationClick,
  onOpenTask,
  onOpenChat,
}) => {
  const [internalList, setInternalList] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('taskrooz_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  if (!isOpen) return null;

  const currentList = externalNotifications || internalList;
  const unreadCount = currentList.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (externalMarkAllAsRead) {
      externalMarkAllAsRead();
    } else {
      const updated = internalList.map((n) => ({ ...n, read: true }));
      setInternalList(updated);
      try {
        localStorage.setItem('taskrooz_notifications', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleClearAll = () => {
    if (externalClearAll) {
      externalClearAll();
    } else {
      setInternalList([]);
      try {
        localStorage.setItem('taskrooz_notifications', JSON.stringify([]));
      } catch {}
    }
  };

  const handleClickItem = (n: AppNotification) => {
    // Mark as read internally
    if (!n.read) {
      const updated = internalList.map((item) => (item.id === n.id ? { ...item, read: true } : item));
      setInternalList(updated);
      try {
        localStorage.setItem('taskrooz_notifications', JSON.stringify(updated));
      } catch {}
    }

    if (onNotificationClick) {
      onNotificationClick(n);
    } else {
      if (n.type === 'friend' && n.userId && onOpenChat) {
        onOpenChat(n.userId, n.userName || 'همکار');
        onClose();
      } else if (n.type === 'task' && onOpenTask) {
        onOpenTask(n.taskId || '');
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end sm:p-6 p-3 pt-16 bg-slate-900/40 backdrop-blur-xs animate-in fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#121212] text-white flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#00b884]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">
                مرکز اعلان‌ها (Notifications)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                {toPersianDigits(unreadCount)} پیام خوانده‌نشده
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-slate-500 hover:text-black px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="علامت خوانده شده برای همه"
              >
                خواندن همه
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {currentList.map((n) => {
            let Icon = CheckSquare;
            let iconColor = 'text-indigo-600 bg-indigo-50';
            if (n.type === 'friend') {
              Icon = Users;
              iconColor = 'text-[#00895f] bg-emerald-50';
            } else if (n.type === 'broadcast') {
              Icon = Megaphone;
              iconColor = 'text-amber-600 bg-amber-50';
            }

            return (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 pt-3 ${
                  !n.read
                    ? 'bg-slate-50/90 border border-slate-200/80 shadow-2xs'
                    : 'hover:bg-slate-50/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-black text-xs text-slate-900 truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold flex-shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                    {n.message}
                  </p>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-[#f95738] flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}

          {currentList.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Check className="w-8 h-8 text-[#00b884] mx-auto" />
              <p className="text-xs font-bold">اعلان جدیدی وجود ندارد.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentList.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-center">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              پاک کردن تاریخچه اعلان‌ها
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
