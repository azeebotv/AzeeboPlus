// Creator domain methods

import type {
  ApiResponse,
  ContentItem,
  PaginatedResponse,
  RequestClient,
  User,
} from './base';

export function createCreatorMethods(client: RequestClient) {
  return {
    getCreators: async (
      page = 1,
      limit = 20,
    ): Promise<
      ApiResponse<PaginatedResponse<User & { contentCount: number; subscriberCount: number }>>
    > => {
      return client.request<
        PaginatedResponse<User & { contentCount: number; subscriberCount: number }>
      >(`/api/v1/creators?page=${page}&limit=${limit}`);
    },

    getCreator: async (
      creatorId: string,
    ): Promise<ApiResponse<User & { contentCount: number; subscriberCount: number }>> => {
      return client.request<User & { contentCount: number; subscriberCount: number }>(
        `/api/v1/creators/${creatorId}`,
      );
    },

    getCreatorContent: async (
      creatorId: string,
      page = 1,
      limit = 20,
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/creators/${creatorId}/content?page=${page}&limit=${limit}`,
      );
    },

    getAnalytics: async (params?: { range?: string }): Promise<ApiResponse<unknown>> => {
      const searchParams = new URLSearchParams();
      if (params?.range) searchParams.append('range', params.range);
      return client.request<unknown>(`/api/v1/creators/analytics?${searchParams.toString()}`);
    },

    getSettings: async (): Promise<
      ApiResponse<{
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        marketingNotifications: boolean;
        profileVisibility: string;
        showEarnings: boolean;
        allowMessages: boolean;
      }>
    > => {
      return client.request<{
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
        marketingNotifications: boolean;
        profileVisibility: string;
        showEarnings: boolean;
        allowMessages: boolean;
      }>('/api/v1/creators/settings');
    },

    updateSettings: async (data: {
      notifications?: { email?: boolean; push?: boolean; sms?: boolean; marketing?: boolean };
      privacy?: { profileVisibility?: string; showEarnings?: boolean; allowMessages?: boolean };
    }): Promise<ApiResponse<unknown>> => {
      return client.request<unknown>('/api/v1/creators/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getStats: async (): Promise<
      ApiResponse<{
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        followerCount: number;
        contentCount: number;
        totalEarnings: number;
        pendingEarnings: number;
        viewsChangePercentage: number;
        avgEngagementRate: number;
        totalFollowers: number;
        viewsChange: number;
        likesChange: number;
        commentsChange: number;
        followersChange: number;
      }>
    > => {
      return client.request<{
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        followerCount: number;
        contentCount: number;
        totalEarnings: number;
        pendingEarnings: number;
        viewsChangePercentage: number;
        avgEngagementRate: number;
        totalFollowers: number;
        viewsChange: number;
        likesChange: number;
        commentsChange: number;
        followersChange: number;
      }>('/api/v1/creators/stats');
    },
  };
}
