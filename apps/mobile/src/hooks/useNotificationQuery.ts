import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type Notification, type NotificationPreferences } from '../api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, limit: number) =>
    [...notificationKeys.all, 'list', { page, limit }] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: async () => {
      const response = await notificationApi.getNotifications(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
      return response.data as {
        items: Notification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      const response = await notificationApi.getPreferences();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notification preferences');
      }
      return response.data as NotificationPreferences;
    },
    staleTime: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await notificationApi.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationApi.markAllAsRead();
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await notificationApi.updatePreferences(preferences);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update notification preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
