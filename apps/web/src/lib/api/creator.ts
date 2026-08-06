// Creator domain methods

import type { ApiResponse, ContentItem, PaginatedResponse, RequestClient, User } from './base';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string[];
  rewardPoints: number;
  participantCount: number;
  maxParticipants?: number;
  status: 'active' | 'upcoming' | 'ended';
  startDate: string;
  endDate: string;
  creator: { id: string; name: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  contentUrl: string;
  description: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  subscribedAt: string;
  plan?: string;
  isGifted?: boolean;
}

export interface SubscriberStats {
  totalSubscribers: number;
  newThisWeek: number;
  newThisMonth: number;
  churnRate: number;
  demographics: {
    ageGroups: { range: string; count: number; percentage: number }[];
    topRegions: { region: string; count: number; percentage: number }[];
  };
}

export function createCreatorMethods(client: RequestClient) {
  return {
    getCreators: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<PaginatedResponse<User & { contentCount: number; subscriberCount: number }>>
    > => {
      return client.request<
        PaginatedResponse<User & { contentCount: number; subscriberCount: number }>
      >(`/api/v1/creators/discover?page=${page}&limit=${limit}`);
    },

    getCreator: async (
      creatorId: string
    ): Promise<ApiResponse<User & { contentCount: number; subscriberCount: number }>> => {
      return client.request<User & { contentCount: number; subscriberCount: number }>(
        `/api/v1/creators/${creatorId}`
      );
    },

    getCreatorContent: async (
      creatorId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/creators/${creatorId}/content?page=${page}&limit=${limit}`
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

    getChallenges: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<{
        items: Challenge[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    > => {
      return client.request<{
        items: Challenge[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/v1/challenges/active?page=${page}&limit=${limit}`);
    },

    getMyChallengeSubmissions: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<{
        items: ChallengeSubmission[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    > => {
      return client.request<{
        items: ChallengeSubmission[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/v1/challenges/my-submissions?page=${page}&limit=${limit}`);
    },

    submitChallengeEntry: async (data: {
      challengeId: string;
      contentUrl: string;
      description: string;
    }): Promise<ApiResponse<ChallengeSubmission>> => {
      return client.request<ChallengeSubmission>('/api/v1/challenges/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getSubscribers: async (
      page = 1,
      limit = 20
    ): Promise<ApiResponse<{ stats: SubscriberStats; subscribers: Subscriber[] }>> => {
      return client.request<{ stats: SubscriberStats; subscribers: Subscriber[] }>(
        `/api/v1/creator/subscribers?page=${page}&limit=${limit}`
      );
    },

    getSubscriberStats: async (): Promise<ApiResponse<SubscriberStats>> => {
      return client.request<SubscriberStats>('/api/v1/creator/subscribers/stats');
    },

    sendTip: async (
      creatorId: string,
      amount: number,
      message?: string
    ): Promise<
      ApiResponse<{
        tipId: string;
        amount: number;
        tier: string | null;
        balance: number;
        message: string;
      }>
    > => {
      return client.request<{
        tipId: string;
        amount: number;
        tier: string | null;
        balance: number;
        message: string;
      }>(`/api/v1/creators/tips/${creatorId}`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      });
    },

    getTipLeaderboard: async (
      creatorId: string,
      period = 'all'
    ): Promise<
      ApiResponse<{
        entries: Array<{ userId: string; totalAmount: number; tier: string }>;
        period: string;
      }>
    > => {
      return client.request<{
        entries: Array<{ userId: string; totalAmount: number; tier: string }>;
        period: string;
      }>(`/api/v1/creators/tips/leaderboard/${creatorId}?period=${period}`);
    },

    getTipStats: async (
      creatorId: string
    ): Promise<ApiResponse<{ totalTips: number; totalAmount: number; topTier: string | null }>> => {
      return client.request<{ totalTips: number; totalAmount: number; topTier: string | null }>(
        `/api/v1/creators/tips/stats/${creatorId}`
      );
    },

    getMyTips: async (
      page = 1,
      limit = 20
    ): Promise<
      ApiResponse<{
        items: Array<{
          id: string;
          creatorId: string;
          amount: number;
          tier: string | null;
          message: string | null;
          createdAt: string;
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
          creatorId: string;
          amount: number;
          tier: string | null;
          message: string | null;
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/v1/creators/users/me/tips?page=${page}&limit=${limit}`);
    },
  };
}
