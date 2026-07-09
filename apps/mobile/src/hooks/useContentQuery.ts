import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi, type ContentItem, type PaginatedResponse } from '../api';

export const contentKeys = {
  all: ['content'] as const,
  featured: () => [...contentKeys.all, 'featured'] as const,
  trending: () => [...contentKeys.all, 'trending'] as const,
  recent: () => [...contentKeys.all, 'recent'] as const,
  byCategory: (categoryId: string) => [...contentKeys.all, 'category', categoryId] as const,
  detail: (id: string) => [...contentKeys.all, 'detail', id] as const,
  search: (query: string) => [...contentKeys.all, 'search', query] as const,
  saved: () => [...contentKeys.all, 'saved'] as const,
};

export function useFeaturedContent(limit = 10) {
  return useQuery({
    queryKey: [...contentKeys.featured(), limit],
    queryFn: async () => {
      const response = await contentApi.getFeaturedContent(limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch featured content');
      }
      return response.data as ContentItem[];
    },
    staleTime: 60_000,
  });
}

export function useTrendingContent(limit = 8) {
  return useQuery({
    queryKey: [...contentKeys.trending(), limit],
    queryFn: async () => {
      const response = await contentApi.getTrendingContent(limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch trending content');
      }
      return response.data as ContentItem[];
    },
    staleTime: 60_000,
  });
}

export function useRecentContent(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...contentKeys.recent(), { page, limit }],
    queryFn: async () => {
      const response = await contentApi.getWatchHistory(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch recent content');
      }
      return response.data as PaginatedResponse<ContentItem>;
    },
    staleTime: 30_000,
  });
}

export function useContentByCategory(categoryId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...contentKeys.byCategory(categoryId), { page, limit }],
    queryFn: async () => {
      const response = await contentApi.getContentByCategory(categoryId, page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch content by category');
      }
      return response.data as PaginatedResponse<ContentItem>;
    },
    staleTime: 30_000,
    enabled: !!categoryId,
  });
}

export function useContentById(contentId: string) {
  return useQuery({
    queryKey: contentKeys.detail(contentId),
    queryFn: async () => {
      const response = await contentApi.getContentById(contentId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch content');
      }
      return response.data as ContentItem;
    },
    staleTime: 60_000,
    enabled: !!contentId,
  });
}

export function useSearchContent(query: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...contentKeys.search(query), { page, limit }],
    queryFn: async () => {
      const response = await contentApi.searchContent(query, page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search content');
      }
      return response.data as PaginatedResponse<ContentItem>;
    },
    staleTime: 10_000,
    enabled: query.length > 0,
  });
}

export function useSavedContent(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...contentKeys.saved(), { page, limit }],
    queryFn: async () => {
      const response = await contentApi.getSavedContent(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch saved content');
      }
      return response.data as PaginatedResponse<ContentItem>;
    },
    staleTime: 30_000,
  });
}

export function useSaveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await contentApi.saveContent(contentId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save content');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.saved() });
    },
  });
}

export function useRemoveSavedContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await contentApi.removeSavedContent(contentId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove saved content');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.saved() });
    },
  });
}

export function useAddToWatchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await contentApi.addToWatchHistory(contentId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add to watch history');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.recent() });
    },
  });
}
