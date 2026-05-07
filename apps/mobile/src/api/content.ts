import { apiClient } from './client';
import type { ApiResponse } from './auth';

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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const contentApi = {
  getFeaturedContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/content/featured?limit=${limit}`);
  },

  getTrendingContent: async (limit = 10): Promise<ApiResponse<ContentItem[]>> => {
    return apiClient.get<ApiResponse<ContentItem[]>>(`/content/trending?limit=${limit}`);
  },

  getContentById: async (contentId: string): Promise<ApiResponse<ContentItem>> => {
    return apiClient.get<ApiResponse<ContentItem>>(`/content/${contentId}`);
  },

  getContentByCategory: async (
    categoryId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/content/category/${categoryId}?page=${page}&limit=${limit}`
    );
  },

  searchContent: async (
    query: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/content/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  },

  getWatchHistory: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/user/watch-history?page=${page}&limit=${limit}`
    );
  },

  addToWatchHistory: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/user/watch-history', { contentId });
  },

  getSavedContent: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<ContentItem>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<ContentItem>>>(
      `/user/saved?page=${page}&limit=${limit}`
    );
  },

  saveContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>('/user/saved', { contentId });
  },

  removeSavedContent: async (contentId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/user/saved/${contentId}`);
  },
};
