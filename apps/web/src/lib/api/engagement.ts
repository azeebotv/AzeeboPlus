// Engagement domain methods — homepage support APIs

import type {
  ApiResponse,
  ContentItem,
  PaginatedResponse,
  RequestClient,
} from './base';

export interface EngagementHistoryItem {
  contentId: string;
  progress: number;
  lastWatchedAt: string;
  content: ContentItem;
}

export interface UserUniverseEngagement {
  universeId: string;
  universeName: string;
  universeIcon?: string;
  engagementCount: number;
  lastEngagedAt: string;
}

export interface RecommendationGroup {
  title: string;
  reason: string;
  items: ContentItem[];
}

export function createEngagementMethods(client: RequestClient) {
  return {
    getRecentlyWatched: async (
      limit = 10,
      offset = 0
    ): Promise<ApiResponse<PaginatedResponse<EngagementHistoryItem>>> => {
      return client.request<PaginatedResponse<EngagementHistoryItem>>(
        `/api/v1/users/me/history?limit=${limit}&offset=${offset}`
      );
    },

    getUniverseEngagement: async (): Promise<ApiResponse<UserUniverseEngagement[]>> => {
      return client.request<UserUniverseEngagement[]>('/api/v1/users/me/universes');
    },

    getContentByUniverse: async (
      universeId: string,
      limit = 12
    ): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(
        `/api/v1/content/universe/${universeId}?limit=${limit}&sort=trending`
      );
    },

    getNewReleases: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/new-releases?limit=${limit}`);
    },

    getContinueWatching: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/users/me/continue-watching?limit=${limit}`);
    },

    getPopularInRegion: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/popular-region?limit=${limit}`);
    },

    getPersonalizedRecommendations: async (): Promise<ApiResponse<RecommendationGroup[]>> => {
      return client.request<RecommendationGroup[]>('/api/v1/recommendation/personalized');
    },

    getFeaturedSlides: async (limit = 5): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/featured-slides?limit=${limit}`);
    },
  };
}
