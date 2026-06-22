// Recommendation domain methods

import type { ApiResponse, RecommendationItem, RequestClient } from './base';

export function createRecommendationMethods(client: RequestClient) {
  return {
    getForYou: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return client.request<RecommendationItem[]>(`/api/v1/recommendation/content?limit=${limit}`);
    },

    getTrending: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return client.request<RecommendationItem[]>(`/api/v1/recommendation/trending?limit=${limit}`);
    },

    getCreators: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return client.request<RecommendationItem[]>(`/api/v1/recommendation/creators?limit=${limit}`);
    },

    getCrossUniverse: async (limit = 10): Promise<ApiResponse<RecommendationItem[]>> => {
      return client.request<RecommendationItem[]>(
        `/api/v1/recommendation/cross-universe?limit=${limit}`,
      );
    },
  };
}
