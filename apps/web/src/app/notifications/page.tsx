'use client';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@/components/Skeleton';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export default function NotificationsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');

  useEffect(() => {
    const fetchNotifications = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFetch<any>('/notifications');
        if (response.success && response.data) {
          const notificationsData = Array.isArray(response.data) ? response.data : [];
          setNotifications(notificationsData.map((n: any) => ({
            id: String(n.id), type: String(n.type || 'system'), title: String(n.title || ''),
            message: String(n.message || ''), timestamp: String(n.timestamp || n.createdAt || ''),
            read: Boolean(n.read), metadata: n.metadata,
          })));
        }
      } catch (err) {
        setError('Failed to load notifications');
      } finally { setIsLoading(false); }
    };
    fetchNotifications();
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiFetch<any>(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) { /* intentionally minimal */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch<any>('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) { /* intentionally minimal */ }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return { icon: '&#x1F44D;', color: '#4CAF50' };
      case 'comment': return { icon: '&#x1F4AC;', color: '#2196F3' };
      case 'follow': return { icon: '&#x1F464;', color: '#FF9800' };
      case 'mention': return { icon: '&#x2026;', color: '#9C27B0' };
      case 'system': return { icon: '&#x2699;&#xFE0F;', color: '#607D8B' };
      default: return { icon: '&#x1F514;', color: '#757575' };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'mentions') return n.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="az-headline text-white text-3xl sm:text-4xl">Notifications</h1>
            <p className="text-white/50 text-sm mt-1">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="az-btn-primary" style={{ width: 'auto', paddingInline: '1.25rem', fontSize: '0.8rem' }}>Mark all read</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6" role="tablist" aria-label="Notification filters">
          {(['all', 'unread', 'mentions'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' } : { border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {tab} {tab === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="az-glass p-4">
                <div className="flex items-start gap-3">
                  <Skeleton width="40px" height="40px" borderRadius="50%" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height="16px" />
                    <Skeleton width="80%" height="14px" />
                    <Skeleton width="30%" height="12px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="az-glass p-8 text-center">
            <span className="text-4xl mb-4 block">&#x26A0;&#xFE0F;</span>
            <h3 className="text-lg font-bold text-white mb-2">Error</h3>
            <p className="text-white/50 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="az-btn-primary mt-4" style={{ width: 'auto', paddingInline: '1.5rem' }}>Try Again</button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="az-glass p-12 text-center">
            <span className="text-5xl mb-4 block">&#x1F514;</span>
            <h3 className="text-lg font-bold text-white mb-2">No notifications</h3>
            <p className="text-white/50 text-sm">
              {activeTab === 'unread' ? "You're all caught up!" : activeTab === 'mentions' ? 'No mentions yet' : 'No notifications to show'}
            </p>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Notifications">
            {filteredNotifications.map((notification) => {
              const { icon, color } = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  role="listitem"
                  onClick={() => markAsRead(notification.id)}
                  className={`az-glass p-4 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors ${!notification.read ? 'border-l-2' : ''}`}
                  style={!notification.read ? { borderLeftColor: color } : {}}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                    <span className="text-lg" dangerouslySetInnerHTML={{ __html: icon }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-white/70'}`}>{notification.title}</h4>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-white/30 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#E8420A' }} />
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
