import { apiClient } from './client';
import type { ApiResponse, Notification } from '../types/api';

export type { Notification } from '../types/api';

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

export type PushDeviceType = 'ios' | 'android' | 'web';

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
    >(`/v1/notifications?page=${page}&limit=${limit}`);
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.patch<ApiResponse<{ message: string }>>(
      `/v1/notifications/${notificationId}/read`
    );
  },

  markAllAsRead: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.patch<ApiResponse<{ message: string }>>('/v1/notifications/read-all');
  },

  deleteNotification: async (notificationId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/v1/notifications/${notificationId}`
    );
  },

  registerPushToken: async (
    token: string,
    deviceType: PushDeviceType
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/v1/notifications/push-tokens', {
      token,
      deviceType,
    });
  },

  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    return apiClient.get<ApiResponse<NotificationPreferences>>('/v1/notifications/settings');
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> => {
    // The server whitelists flat channel flags plus categoryOverrides; the
    // client's per-type `types` map is sent as categoryOverrides.
    const { types, ...channels } = preferences;
    const body = types !== undefined ? { ...channels, categoryOverrides: types } : channels;
    return apiClient.put<ApiResponse<NotificationPreferences>>(
      '/v1/notifications/preferences',
      body
    );
  },
};
