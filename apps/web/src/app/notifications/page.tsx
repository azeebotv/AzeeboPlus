'use client';
import { useState, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

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

  const { isConnected: _isConnected } = useNotificationsSocket({
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
        // Update unread count query if it exists
        queryClient.setQueryData(['notifications', 'unread-count'], { count });
      },
      [queryClient]
    ),
    onAllRead: useCallback(() => {
      // Mark all as read in cache
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
  } = useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiFetch<NotificationListResponse | Notification[]>('/notifications');
      if (response.success && response.data) {
        const notificationsData = Array.isArray(response.data)
          ? response.data
          : (response.data as NotificationListResponse).notifications || [];
        return notificationsData.map((n: RawNotification) => ({
          id: String(n.id),
          type: String(n.type || 'system'),
          title: String(n.title || ''),
          message: String(n.message || ''),
          timestamp: String(n.timestamp || n.createdAt || ''),
          readAt: n.readAt ?? null,
          metadata: n.metadata,
        }));
      }
      throw new Error('Failed to load notifications');
    },
    staleTime: 60000,
  });

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await apiFetch<MarkReadResult>(`/notifications/${notificationId}/read`, {
          method: 'PATCH',
        });
        queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
          old?.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch (err) {
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
    } catch (err) {
      /* intentionally minimal */
    }
  }, [queryClient]);

  const renderNotificationIcon = (type: string) => {
    const cls = 'w-5 h-5';
    switch (type) {
      case 'like':
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25M6.633 10.5c-.806 0-1.533.446-2.031 1.08A9.043 9.043 0 011.74 14.5c-.266.558.107 1.282.725 1.282h3.126M6.633 10.5V19.5"
            />
          </svg>
        );
      case 'comment':
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 0012 20.25z"
            />
          </svg>
        );
      case 'follow':
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-1.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
            />
          </svg>
        );
      case 'mention':
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
            />
          </svg>
        );
      case 'system':
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className={cls}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'var(--brand-green, #22c55e)';
      case 'comment':
        return 'var(--brand-blue, #3b82f6)';
      case 'follow':
        return 'var(--brand-amber, #f59e0b)';
      case 'mention':
        return 'var(--brand-purple, #a855f7)';
      case 'system':
        return 'var(--brand-grey, #9ca3af)';
      default:
        return 'var(--brand-orange, #E8420A)';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.readAt;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="az-headline text-white text-3xl sm:text-4xl">Notifications</h1>
            <p className="text-white/50 text-sm mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              aria-label="Mark all notifications as read"
              onClick={markAllAsRead}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.8rem' }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-6 border-b border-white/10 pb-4"
          role="tablist"
          aria-label="Notification filters"
        >
          {(['all', 'unread', 'mentions'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-orange-500/20 text-[var(--brand-orange)] border border-orange-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="az-glass p-4 rounded-xl">
                <Skeleton height="24px" width="50%" />
                <Skeleton height="16px" width="80%" className="mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load notifications"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : filteredNotifications.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No notifications</h3>
            <p className="text-white/50 text-sm">
              {activeTab === 'unread'
                ? "You're all caught up!"
                : activeTab === 'mentions'
                  ? 'No mentions yet'
                  : 'No notifications to show'}
            </p>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Notifications">
            {filteredNotifications.map((notification) => {
              const color = getNotificationColor(notification.type);
              return (
                <div
                  key={notification.id}
                  role="listitem"
                  onClick={() => markAsRead(notification.id)}
                  className={`az-glass p-4 rounded-xl flex items-start gap-3.5 cursor-pointer hover:bg-white/[0.07] transition-all ${
                    !notification.readAt ? 'border-l-2' : ''
                  }`}
                  style={!notification.readAt ? { borderLeftColor: color } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    {renderNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium ${!notification.readAt ? 'text-white' : 'text-white/70'}`}
                    >
                      {notification.title}
                    </h4>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ background: 'var(--brand-orange, #E8420A)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
