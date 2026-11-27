'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import {
  Heart,
  MessageSquare,
  UserPlus,
  AtSign,
  Bell,
  CheckCheck,
  Shield,
  Clock,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  readAt: string | null;
  metadata?: Record<string, unknown>;
}

interface RawNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp?: string;
  createdAt?: string;
  readAt: string | null;
  metadata?: Record<string, unknown>;
}

interface NotificationListResponse {
  notifications?: RawNotification[];
}

interface MarkReadResult {
  success: boolean;
}

export default function NotificationsPage(): React.JSX.Element {
  useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');

  // Real-time WebSocket connection for instant notifications
  useNotificationsSocket({
    onNewNotification: useCallback(
      (notification: {
        id: string;
        type: string;
        title: string;
        message?: string;
        body?: string;
        timestamp?: string;
        createdAt?: string;
        readAt: string | null;
        metadata?: Record<string, unknown>;
      }) => {
        // Prepend new notification to the cache
        queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
          const exists = old?.some((n) => n.id === notification.id);
          if (exists) return old;
          return [
            {
              id: String(notification.id),
              type: String(notification.type || 'system'),
              title: String(notification.title || ''),
              message: String(notification.message || notification.body || ''),
              timestamp: String(notification.timestamp || notification.createdAt || ''),
              readAt: notification.readAt ?? null,
              metadata: notification.metadata,
            },
            ...(old || []),
          ];
        });
      },
      [queryClient]
    ),
    onUnreadCount: useCallback(
      (count: number) => {
        queryClient.setQueryData(['notifications', 'unread-count'], { count });
      },
      [queryClient]
    ),
    onAllRead: useCallback(() => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    }, [queryClient]),
  });

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiFetch<RawNotification[] | NotificationListResponse>(
        '/notifications'
      );
      if (response.success && response.data) {
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data.notifications || [];
        return raw.map((n: RawNotification) => ({
          id: String(n.id),
          type: String(n.type || 'system'),
          title: String(n.title || ''),
          message: String(n.message || ''),
          timestamp: String(n.timestamp || n.createdAt || ''),
          readAt: n.readAt ?? null,
          metadata: n.metadata,
        }));
      }
      return [];
    },
    staleTime: 15000,
  });

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await apiFetch<MarkReadResult>(`/notifications/${id}/read`, { method: 'PATCH' });
        queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
          old?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
      } catch {
        /* intentionally minimal */
      }
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch<MarkReadResult>('/notifications/read-all', { method: 'PATCH' });
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch {
      /* intentionally minimal */
    }
  }, [queryClient]);

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-az-error-400 fill-az-error-400/20" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-az-secondary-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-az-success-400" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-az-category-violet-light" />;
      case 'system':
        return <Shield className="w-4 h-4 text-az-warning-400" />;
      default:
        return <Bell className="w-4 h-4 text-az-flame" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.readAt;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <PageHero
        badge="Activity Stream"
        title="Notifications"
        description={
          unreadCount > 0
            ? `You have ${unreadCount} unread update${unreadCount !== 1 ? 's' : ''} across creator drops, live votes, and wallet alerts.`
            : 'You are completely caught up across all universes, community interactions, and passes.'
        }
        rightElement={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-all hover:scale-105"
            >
              <CheckCheck className="w-4 h-4 text-az-flame" />
              Mark All As Read
            </button>
          ) : undefined
        }
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-4">
        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-2 mb-6 border-b border-az-glass-border pb-4 overflow-x-auto">
          {(
            [
              ['all', 'All Activity', notifications.length],
              ['unread', 'Unread', unreadCount],
              ['mentions', 'Mentions', notifications.filter((n) => n.type === 'mention').length],
            ] as const
          ).map(([tab, label, count]) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                  // 12px label: the gradient's flame stop holds white at only
                  // 3.18:1, so the active tab is solid flame with deep ink.
                  active
                    ? 'bg-az-flame text-az-surface-root shadow-az-glow'
                    : 'bg-az-glass-fill hover:bg-az-glass-card text-az-ink/60 hover:text-az-ink border border-az-ink/5'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    active
                      ? 'bg-az-surface-root/20 text-az-surface-root'
                      : 'bg-az-glass-fill text-az-ink/40'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="az-glass p-5 border border-az-glass-border animate-pulse">
                <Skeleton height="20px" width="40%" />
                <Skeleton height="14px" width="70%" className="mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="az-glass p-8 border border-az-glass-border text-center">
            <ErrorState
              title="Failed to load notifications"
              description={error.message}
              buttonText="Retry"
              onButtonPress={() => refetch()}
            />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="az-glass p-12 sm:p-16 text-center border border-az-glass-border max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-az-glass-fill border border-az-glass-border flex items-center justify-center text-az-ink/40">
              <Bell className="w-8 h-8 text-az-flame/60" />
            </div>
            <h3 className="text-lg font-bold text-az-ink mb-2">No notifications found</h3>
            <p className="text-xs text-az-ink/50 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'unread'
                ? "You're all caught up! Check back soon for new premiere releases and contest alerts."
                : 'Stay tuned for creator challenges, ticket purchases, and reward milestones.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5" role="list" aria-label="Notifications">
            {filteredNotifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <div
                  key={notification.id}
                  role="listitem"
                  onClick={() => markAsRead(notification.id)}
                  className={`az-glass p-4 sm:p-5 border transition-all duration-200 flex items-start gap-4 cursor-pointer ${
                    isUnread ? '' : ''
                  }`}
                >
                  {/* Category Icon Badge */}
                  <div className="w-10 h-10 rounded-xl bg-az-glass-fill border border-az-glass-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    {renderNotificationIcon(notification.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm font-bold truncate tracking-tight ${
                          isUnread ? 'text-az-ink' : 'text-az-ink/80'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-[11px] text-az-ink/40 flex items-center gap-1 font-mono flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.timestamp).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-az-ink/60 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Pulsing unread beacon */}
                  {isUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-az-scarlet to-az-flame shadow-az-glow mt-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
}
