import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    newContent: boolean;
    comments: boolean;
    likes: boolean;
    followers: boolean;
    system: boolean;
    payments: boolean;
  };
}

export const notificationApi = {
  getNotifications: async (
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: Notification[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    return apiClient.get<
      ApiResponse<{
        items: Notification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/notifications?page=${page}&limit=${limit}`);
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>(
      `/notifications/${notificationId}/read`
    );
  },

  markAllAsRead: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/notifications/${notificationId}`);
  },

  registerPushToken: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/notifications/register-token', {
      token,
    });
  },

  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    return apiClient.get<ApiResponse<NotificationPreferences>>('/notifications/preferences');
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> => {
    return apiClient.patch<ApiResponse<NotificationPreferences>>(
      '/notifications/preferences',
      preferences
    );
  },
};
