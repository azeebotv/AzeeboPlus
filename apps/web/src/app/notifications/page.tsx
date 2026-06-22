'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Avatar } from '@azeebo/ui';

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
}

export default function NotificationsPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<Notification[]>('/v1/notifications');

        if (result.success && result.data) {
          setNotifications(result.data);
        }
      } catch (err) {
        webLogger.error('Failed to fetch notifications', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      webLogger.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/v1/notifications/read-all', { method: 'PUT' });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      webLogger.error('Failed to mark all notifications as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: gradients.primary }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1
              className="text-2xl font-bold hidden sm:block"
              style={{ color: colors.text.primary }}
            >
              Azeebo+
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Notifications'].map((item) => (
              <Link
                key={item}
                href={
                  item === 'Home'
                    ? '/'
                    : item === 'Notifications'
                      ? '/notifications'
                      : `/${item.toLowerCase()}`
                }
                className="text-base font-medium transition-colors"
                style={{
                  color: item === 'Notifications' ? colors.primary[500] : colors.text.secondary,
                }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {user?.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Notifications
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="80px" className="w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>
              {error}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`cursor-pointer transition-all border-l-4 ${!notification.read ? 'border-l-primary-500' : 'border-l-transparent'} p-4 bg-white rounded-lg shadow-sm`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'reward' ? 'bg-success-500/20' : notification.type === 'content' ? 'bg-primary-500/20' : notification.type === 'reminder' ? 'bg-warning-500/20' : 'bg-blue-500/20'}`}
                  >
                    <span className="text-2xl">
                      {notification.type === 'reward'
                        ? '🎁'
                        : notification.type === 'content'
                          ? '🎬'
                          : notification.type === 'reminder'
                            ? '⏰'
                            : '💰'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-primary-500"></span>
                      )}
                    </div>
                    <p className="text-sm mb-2 text-gray-600">{notification.description}</p>
                    <p className="text-xs text-gray-400">{notification.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              No notifications yet
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Azeebo+
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Help
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Legal
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Connect
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="mt-12 pt-8 border-t text-center text-sm"
            style={{ borderColor: colors.border.light, color: colors.text.tertiary }}
          >
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
