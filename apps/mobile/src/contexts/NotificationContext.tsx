import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationApi, type Notification } from '@azeebo/react-data';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { useFlags } from '@azeebo/react-data/contexts/FlagsContext';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { logger } from '@azeebo/react-data/utils/logger';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  getNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: _user, isAuthenticated } = useAuth();
  const { isEnabled } = useFlags();
  // mobile_push_enabled (on by default): skips push-token registration when
  // disabled, so no device tokens are collected until ops flips the flag on.
  const pushEnabled = isEnabled('mobile_push_enabled');

  const getNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.getNotifications(1, 50);
      if (response.success && response.data) {
        setNotifications(response.data.items);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message || 'Failed to get notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      logger.warn('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push token for push notification!');
        return;
      }

      interface ExpoConstants {
        expoConfig?: { extra?: { eas?: { projectId?: string } } };
        easConfig?: { projectId?: string };
      }
      const c = Constants as unknown as ExpoConstants;
      const projectId = c.expoConfig?.extra?.eas?.projectId ?? c.easConfig?.projectId;
      if (!projectId) {
        logger.warn('Project ID not found, skipping push token registration');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      const response = await notificationApi.registerPushToken(token);
      if (!response.success) {
        logger.warn('Failed to register push token with backend');
      }
    } catch (error: unknown) {
      logger.error('Error registering for push notifications', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getNotifications();
      if (pushEnabled) {
        registerForPushNotifications();
      }
    }
  }, [isAuthenticated, getNotifications, registerForPushNotifications, pushEnabled]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      getNotifications();
    });

    return () => subscription.remove();
  }, [getNotifications]);

  const markAsRead = async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message || 'Failed to mark notification as read');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message || 'Failed to mark all notifications as read');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message || 'Failed to delete notification');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        getNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        registerForPushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
