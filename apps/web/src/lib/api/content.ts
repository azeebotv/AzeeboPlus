// Content domain methods

import type {
  ApiResponse,
  Category,
  ContentItem,
  PaginatedResponse,
  RequestClient,
  SearchFilters,
} from './base';

export function createContentMethods(client: RequestClient) {
  return {
    getContent: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return client.request<ContentItem>(`/api/v1/content/${contentId}`);
    },

    getFeaturedContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/featured?limit=${limit}`);
    },

    getTrendingContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/trending?limit=${limit}`);
    },

    getContentByUniverse: async (
      universeId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/universe/${universeId}?page=${page}&limit=${limit}`
      );
    },

    getContentByCategory: async (
      categoryId: string,
      page = 1,
      limit = 20
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/category/${categoryId}?page=${page}&limit=${limit}`
      );
    },

    searchContent: async (
      filters: SearchFilters
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.universeId) params.append('universe', filters.universeId);
      if (filters.categoryId) params.append('category', filters.categoryId);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.yearFrom) params.append('yearFrom', filters.yearFrom.toString());
      if (filters.yearTo) params.append('yearTo', filters.yearTo.toString());
      if (filters.sortBy) params.append('sort', filters.sortBy);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/search?${params.toString()}`
      );
    },

    getSignedUrl: async (
      contentId: string
    ): Promise<ApiResponse<{ signedUrl: string; expiresIn: number; mediaAssetId: string }>> => {
      return client.request<{ signedUrl: string; expiresIn: number; mediaAssetId: string }>(
        `/api/v1/content/${contentId}/media/signed-url`
      );
    },

    createContent: async (data: FormData): Promise<ApiResponse<ContentItem>> => {
      // Convert FormData to appropriate format for API
      const formData = new FormData();
      const dataObj = data as unknown as Record<string, unknown>;
      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== undefined && dataObj[key] !== null) {
          if (typeof dataObj[key] === 'object' && !(dataObj[key] instanceof File)) {
            formData.append(key, JSON.stringify(dataObj[key]));
          } else {
            formData.append(key, dataObj[key] as string | Blob);
          }
        }
      });

      return client.request<ContentItem>('/api/v1/content', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type for FormData, let browser set it
      });
    },

    updateContent: async (contentId: string, data: FormData): Promise<ApiResponse<ContentItem>> => {
      // Convert FormData to appropriate format for API
      const formData = new FormData();
      const dataObj = data as unknown as Record<string, unknown>;
      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== undefined && dataObj[key] !== null) {
          if (typeof dataObj[key] === 'object' && !(dataObj[key] instanceof File)) {
            formData.append(key, JSON.stringify(dataObj[key]));
          } else {
            formData.append(key, dataObj[key] as string | Blob);
          }
        }
      });

      return client.request<ContentItem>(`/api/v1/content/${contentId}`, {
        method: 'PATCH',
        body: formData,
        // Don't set Content-Type for FormData, let browser set it
      });
    },

    deleteContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
      return client.request<{ message: string }>(`/api/v1/content/${contentId}`, {
        method: 'DELETE',
      });
    },

    getCategories: async (): Promise<ApiResponse<Category[]>> => {
      return client.request<Category[]>('/api/v1/content/categories');
    },

    getContentById: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
      return client.request<ContentItem>(`/api/v1/content/${contentId}`);
    },

    getRelatedContent: async (
      contentId: string,
      limit = 4
    ): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/${contentId}/related?limit=${limit}`);
    },

    getContentByCreator: async (
      creatorId: string,
      limit = 3
    ): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/creator/${creatorId}?limit=${limit}`);
    },

    getMyContent: async (
      params: {
        limit?: number;
        offset?: number;
        contentType?: string;
        status?: string;
        sort?: 'newest' | 'oldest' | 'popular' | 'trending';
      } = {}
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.contentType) searchParams.append('contentType', params.contentType);
      if (params.status) searchParams.append('status', params.status);
      if (params.sort) searchParams.append('sort', params.sort);

      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content/me?${searchParams.toString()}`
      );
    },

    getFeaturedSlides: async (limit = 5): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/featured-slides?limit=${limit}`);
    },

    getContentList: async (
      params: { page?: number; limit?: number } = {}
    ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      return client.request<PaginatedResponse<ContentItem>>(
        `/api/v1/content?${searchParams.toString()}`
      );
    },

    getNewReleases: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/new-releases?limit=${limit}`);
    },

    getPopularInRegion: async (limit = 12): Promise<ApiResponse<ContentItem[]>> => {
      return client.request<ContentItem[]>(`/api/v1/content/popular-region?limit=${limit}`);
    },

    getHomeFeed: async (): Promise<
      ApiResponse<{ trending: ContentItem[]; recommended: ContentItem[]; latest: ContentItem[] }>
    > => {
      return client.request<{
        trending: ContentItem[];
        recommended: ContentItem[];
        latest: ContentItem[];
      }>('/api/v1/content/home');
    },
  };
}
