import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, Package, Tag, Check, X, Flame } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  onOpenDrops?: () => void;
  onOpenTracking?: (orderNumber?: string) => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-drop-live',
    title: 'Drop Live: Winter Warmth & Cashmere Fleeces',
    message: 'The Winter 2026 Collection is now live with 150 heavyweight combed cotton pieces.',
    type: 'drop',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionUrl: '#drops',
  },
  {
    id: 'notif-winter-prep',
    title: 'Winter 2026 Collection Coming Soon',
    message: 'Heavyweight beanies and fleece back-prints scheduled to launch this week.',
    type: 'drop',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
    actionUrl: '#drops',
  },
  {
    id: 'notif-paxi-info',
    title: 'PAXI PEP Store Nationwide Pickup',
    message: 'Select your nearest PEP Store counter for safe, trackable collection.',
    type: 'system',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    read: true,
  },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onOpenDrops,
  onOpenTracking,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('lass_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });
  const [filter, setFilter] = useState<'all' | 'order' | 'drop' | 'promo'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lass_notifications', JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'drop':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'order':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notification center"
        className="relative min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 p-2 bg-zinc-900/60 border-b border-zinc-800/80 text-[11px] font-bold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'drop', label: 'Drops' },
                { id: 'order', label: 'Orders' },
                { id: 'promo', label: 'Promos' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === t.id
                    ? 'bg-zinc-800 text-white font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No notifications in this tab
              </div>
            ) : (
              filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markSingleAsRead(notif.id);
                    if (notif.type === 'drop' && onOpenDrops) {
                      setIsOpen(false);
                      onOpenDrops();
                    } else if (notif.type === 'order' && onOpenTracking) {
                      setIsOpen(false);
                      onOpenTracking(notif.orderNumber);
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 hover:bg-zinc-900/80 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-zinc-900/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.read ? 'font-black text-white' : 'font-medium text-zinc-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-zinc-600 font-mono block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
