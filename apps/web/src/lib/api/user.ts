// User domain methods

import type {
  ApiResponse,
  ContentItem,
  PaginatedResponse,
  RequestClient,
  RetryOptions,
  User,
} from './base';

export function createUserMethods(client: RequestClient) {
  return {
    getProfile: async (retryOptions?: RetryOptions): Promise<ApiResponse<User>> => {
      return client.request<User>('/api/v1/users/me', {}, retryOptions);
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      return client.request<User>('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    completeProfileSetup: async (data: {
      displayName: string;
      bio?: string;
      interests?: string[];
    }): Promise<ApiResponse<User>> => {
      return client.request<User>('/api/v1/users/me/complete-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getWatchHistory: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/users/me/history?page=${page}&limit=${limit}`
      );
    },

    addToWatchHistory: async (
      contentId: string,
      progress = 0
    ): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/users/me/history', {
        method: 'POST',
        body: JSON.stringify({ contentId, progress }),
      });
    },

    getPreferences: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/preferences');
    },

    updatePreferences: async (
      preferences: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },

    getPrivacySettings: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/privacy-settings');
    },

    updatePrivacySettings: async (
      settings: Record<string, unknown>
    ): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/privacy-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    exportUserData: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/export');
    },

    getDeletionStatus: async (): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me/deletion-status');
    },

    requestAccountDeletion: async (
      reason?: string
    ): Promise<ApiResponse<Record<string, unknown>>> => {
      return client.request<Record<string, unknown>>('/api/v1/users/me', {
        method: 'DELETE',
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      });
    },

    getSavedItems: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<{
        items: Array<{
          id: string;
          contentId: string;
          title: string;
          thumbnail: string;
          savedAt: string;
          type: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    > => {
      return client.request<{
        items: Array<{
          id: string;
          contentId: string;
          title: string;
          thumbnail: string;
          savedAt: string;
          type: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/v1/users/me/saved?page=${page}&limit=${limit}`);
    },

    saveItem: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>('/api/v1/users/me/saved', {
        method: 'POST',
        body: JSON.stringify({ contentId }),
      });
    },

    unsaveItem: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/users/me/saved/${contentId}`, {
        method: 'DELETE',
      });
    },
  };
}
