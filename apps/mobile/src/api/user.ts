import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteProfileSetupDto {
  displayName: string;
  bio?: string;
  interests?: string[];
  role?: string;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showOnlineStatus: boolean;
    showWatchHistory: boolean;
  };
  playback: {
    autoplay: boolean;
    quality: 'auto' | 'low' | 'medium' | 'high';
    subtitles: boolean;
    language: string;
  };
  theme: 'light' | 'dark' | 'system';
}

export interface WatchHistoryItem {
  id: string;
  contentId: string;
  title: string;
  thumbnail: string;
  watchedAt: string;
  progress: number;
  duration: number;
}

export interface SavedItem {
  id: string;
  contentId: string;
  title: string;
  thumbnail: string;
  savedAt: string;
  type: 'content' | 'creator' | 'universe';
}

export const userApi = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<UserProfile>('/v1/users/me');
    return { success: true, data: response };
  },

  async updateProfile(
    data: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'bio'>>
  ): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.patch<UserProfile>('/v1/users/me', data);
    return { success: true, data: response };
  },

  async completeProfileSetup(data: CompleteProfileSetupDto): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.post<UserProfile>('/v1/users/me/complete-profile', data);
    return { success: true, data: response };
  },

  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.get<UserPreferences>('/v1/users/me/preferences');
    return { success: true, data: response };
  },

  async updatePreferences(
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.put<UserPreferences>('/v1/users/me/preferences', preferences);
    return { success: true, data: response };
  },

  async getWatchHistory(
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: WatchHistoryItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const response = await apiClient.get<{
      items: WatchHistoryItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/users/me/history?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },

  async getSavedItems(
    page = 1,
    limit = 20
  ): Promise<
    ApiResponse<{
      items: SavedItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const response = await apiClient.get<{
      items: SavedItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/v1/users/me/saved?page=${page}&limit=${limit}`);
    return { success: true, data: response };
  },

  async saveItem(contentId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<{ message: string }>('/v1/users/me/saved', { contentId });
    return { success: true, data: response };
  },

  async unsaveItem(contentId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<{ message: string }>(`/v1/users/me/saved/${contentId}`);
    return { success: true, data: response };
  },
};
