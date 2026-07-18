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
    return apiClient.get<ApiResponse<UserProfile>>('/v1/users/me');
  },

  async updateProfile(
    data: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'bio'>>
  ): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<ApiResponse<UserProfile>>('/v1/users/me', data);
  },

  async completeProfileSetup(data: CompleteProfileSetupDto): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<ApiResponse<UserProfile>>('/v1/users/me/complete-profile', data);
  },

  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    return apiClient.get<ApiResponse<UserPreferences>>('/v1/users/me/preferences');
  },

  async updatePreferences(
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    return apiClient.patch<ApiResponse<UserPreferences>>(
      '/v1/users/me/preferences',
      preferences
    );
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
    return apiClient.get<
      ApiResponse<{
        items: WatchHistoryItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/v1/users/me/history?page=${page}&limit=${limit}`);
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
    return apiClient.get<
      ApiResponse<{
        items: SavedItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/v1/users/me/saved?page=${page}&limit=${limit}`);
  },

  async saveItem(contentId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<ApiResponse<{ message: string }>>('/v1/users/me/saved', { contentId });
  },

  async unsaveItem(contentId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/v1/users/me/saved/${contentId}`);
  },
};
