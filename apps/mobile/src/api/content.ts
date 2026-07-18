import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Contestant } from '../types/api';

export type { PaginatedResponse, Contestant } from '../types/api';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  duration?: number;
  contentType?: string;
  status: 'draft' | 'processing' | 'published' | 'archived';
  isPremium?: boolean;
  mediaAsset?: {
    thumbnailUrl?: string;
    mediaUrl?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  universe?: {
    id: string;
    name: string;
    icon?: string;
  };
  categories?: {
    id: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  videoUrl?: string;
  thumbnail?: string;
  subtitles?: Array<{ language: string; url: string }>;
  releaseDate: string;
  isLocked: boolean;
  contentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  contestantId: string;
  episodeId: string;
  isSuperVote: boolean;
  voteCount: number;
  createdAt: string;
}

export interface VoteResult {
  id?: string;
  contestantId: string;
  contestantName?: string;
  totalVotes?: number;
  percentage?: number;
  rank?: number;
}

export interface CreatorContent {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  thumbnail?: string;
  mediaUrl?: string;
  contentType: string;
  universe: string;
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topContent: CreatorContent[];
  viewsOverTime: { date: string; views: number }[];
}

export interface CreatorEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  currency: string;
  earningsHistory: { date: string; amount: number; type: string }[];
}

export interface MonetizationSettings {
  isMonetizationEnabled?: boolean;
  isSubscriptionEnabled?: boolean;
  subscriptionPrice?: number;
  isTipEnabled?: boolean;
  minimumTip?: number;
  isAdEnabled?: boolean;
  adRevenueShare?: number;
  payoutMethod?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isMonetized?: boolean;
  monetizationTier?: string;
  subscriptionRevenueShare?: number;
  minimumPayout?: number;
  payoutAccount?: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  category: string;
  contentType: string;
  socialLinks?: Record<string, string>;
  followers: number;
  following: number;
  totalContent: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'content' | 'creator' | 'universe';
  reason: string;
  score: number;
}

export const contentApi = {
  getFeaturedContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/api/v1/content/featured?limit=${limit}`);
  },

  getTrendingContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/api/v1/content/trending?limit=${limit}`);
  },

  getContentById: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
    return apiClient.get<ApiResponse<ContentItem>>(`/api/v1/content/${contentId}`);
  },

  getContentByCategory: async (
    categoryId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/api/v1/content/category/${categoryId}?page=${page}&limit=${limit}`
    );
  },

  searchContent: async (
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/api/v1/content/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  },

  getWatchHistory: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/api/v1/users/me/history?page=${page}&limit=${limit}`
    );
  },

  addToWatchHistory: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/api/v1/users/me/history', {
      contentId,
    });
  },

  getContentList: async (params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/api/v1/content?${searchParams.toString()}`
    );
  },

  getFeaturedSlides: async (limit = 5): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/api/v1/content/featured-slides?limit=${limit}`);
  },

  getNewReleases: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/api/v1/content/new-releases?limit=${limit}`);
  },

  getPopularInRegion: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/api/v1/content/popular-region?limit=${limit}`);
  },

  getSavedContent: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/api/v1/users/me/saved?page=${page}&limit=${limit}`
    );
  },

  saveContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/api/v1/users/me/saved', {
      contentId,
    });
  },

  removeSavedContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/users/me/saved/${contentId}`
    );
  },

  getEpisode: async (episodeId: string): Promise<ApiResponse<Episode>> => {
    return apiClient.get<ApiResponse<Episode>>(`/api/v1/content/episodes/${episodeId}`);
  },

  vote: async (data: {
    episodeId?: string;
    contestantId?: string;
    isSuperVote: boolean;
  }): Promise<ApiResponse<Vote>> => {
    return apiClient.post<ApiResponse<Vote>>('/api/v1/content/vote', data);
  },

  getEpisodes: async (contentId: string): Promise<ApiResponse<Episode[]>> => {
    return apiClient.get<ApiResponse<Episode[]>>(`/api/v1/content/${contentId}/episodes`);
  },

  getContestant: async (contestantId: string): Promise<ApiResponse<Contestant>> => {
    return apiClient.get<ApiResponse<Contestant>>(`/api/v1/content/contestants/${contestantId}`);
  },

  getContestants: async (episodeId: string): Promise<ApiResponse<Contestant[]>> => {
    return apiClient.get<ApiResponse<Contestant[]>>(
      `/api/v1/content/episodes/${episodeId}/contestants`
    );
  },

  superVote: async (data: {
    contestantId: string;
    episodeId: string;
    voteCount: number;
  }): Promise<ApiResponse<Vote>> => {
    return apiClient.post<ApiResponse<Vote>>('/api/v1/content/super-vote', data);
  },

  getResults: async (contentId: string): Promise<ApiResponse<VoteResult[]>> => {
    return apiClient.get<ApiResponse<VoteResult[]>>(`/api/v1/content/${contentId}/results`);
  },

  getCreatorContent: async (): Promise<ApiResponse<CreatorContent[]>> => {
    return apiClient.get<ApiResponse<CreatorContent[]>>('/api/v1/creator/content');
  },

  deleteContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/creator/content/${contentId}`
    );
  },

  publishContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>(
      `/api/v1/creator/content/${contentId}/publish`
    );
  },

  getDrafts: async (): Promise<ApiResponse<CreatorContent[]>> => {
    return apiClient.get<ApiResponse<CreatorContent[]>>('/api/v1/creator/drafts');
  },

  deleteDraft: async (draftId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/creator/drafts/${draftId}`);
  },

  getPublishedContent: async (): Promise<ApiResponse<CreatorContent[]>> => {
    return apiClient.get<ApiResponse<CreatorContent[]>>('/api/v1/creator/published');
  },

  getScheduledPosts: async (): Promise<ApiResponse<CreatorContent[]>> => {
    return apiClient.get<ApiResponse<CreatorContent[]>>('/api/v1/creator/scheduled');
  },

  getCreatorAnalytics: async (): Promise<ApiResponse<CreatorAnalytics>> => {
    return apiClient.get<ApiResponse<CreatorAnalytics>>('/api/v1/creator/analytics');
  },

  getEarnings: async (): Promise<ApiResponse<CreatorEarnings>> => {
    return apiClient.get<ApiResponse<CreatorEarnings>>('/api/v1/creator/earnings');
  },

  getMonetizationSettings: async (): Promise<ApiResponse<MonetizationSettings>> => {
    return apiClient.get<ApiResponse<MonetizationSettings>>('/api/v1/creator/monetization');
  },

  updateMonetizationSettings: async (
    data: Partial<MonetizationSettings>
  ): Promise<ApiResponse<MonetizationSettings>> => {
    return apiClient.put<ApiResponse<MonetizationSettings>>('/api/v1/creator/monetization', data);
  },

  getCreatorProfile: async (creatorId: string): Promise<ApiResponse<CreatorProfile>> => {
    return apiClient.get<ApiResponse<CreatorProfile>>(`/api/v1/creator/profile/${creatorId}`);
  },

  getSignedUrl: async (contentId: string): Promise<ApiResponse<{ signedUrl: string; expiresIn: number; mediaAssetId: string }>> => {
    return apiClient.get<ApiResponse<{ signedUrl: string; expiresIn: number; mediaAssetId: string }>>(
      `/api/v1/content/${contentId}/media/signed-url`
    );
  },

  getRecommendations: async (type?: string): Promise<ApiResponse<Recommendation[]>> => {
    const url = type
      ? `/api/v1/content/recommendations?type=${type}`
      : '/api/v1/content/recommendations';
    return apiClient.get<ApiResponse<Recommendation[]>>(url);
  },

  createContent: async (data: {
    title: string;
    description?: string;
    universe: string;
    contentType: string;
    mediaUrl?: string;
    thumbnail?: string;
    isPremium?: boolean;
  }): Promise<ApiResponse<ContentItem>> => {
    return apiClient.post<ApiResponse<ContentItem>>('/api/v1/content', data);
  },
};
