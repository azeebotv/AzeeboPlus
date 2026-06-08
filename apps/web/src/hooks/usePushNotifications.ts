'use client';

import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService, PushSubscriptionData } from '../lib/pushNotifications';

interface UsePushNotificationsState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<UsePushNotificationsState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initialize = async () => {
      const supported = PushNotificationService.isSupported();
      
      if (!supported) {
        setState({
          isSupported: false,
          permission: 'denied',
          isSubscribed: false,
          isLoading: false,
          error: 'Push notifications are not supported in this browser',
        });
        return;
      }

      const permission = await PushNotificationService.getPermissionStatus();
      const subscription = await PushNotificationService.getSubscription();

      setState({
        isSupported: true,
        permission,
        isSubscribed: !!subscription,
        isLoading: false,
        error: null,
      });
    };

    initialize();
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscriptionData | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await PushNotificationService.subscribe();
      
      setState({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
      });

      return subscription;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await PushNotificationService.unsubscribe();
      
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unsubscribe';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
