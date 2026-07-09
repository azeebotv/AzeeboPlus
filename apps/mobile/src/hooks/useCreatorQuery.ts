import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  creatorApi,
  type CreatorProfile,
  type CreatorDashboard,
  type CreatorEarnings,
  type CreatorContentItem,
  type CreatorAnalytics,
} from '../api/creator';

export const creatorKeys = {
  all: ['creator'] as const,
  profile: () => [...creatorKeys.all, 'profile'] as const,
  dashboard: () => [...creatorKeys.all, 'dashboard'] as const,
  content: (page: number, limit: number) =>
    [...creatorKeys.all, 'content', { page, limit }] as const,
  analytics: () => [...creatorKeys.all, 'analytics'] as const,
  earnings: () => [...creatorKeys.all, 'earnings'] as const,
};

export function useCreatorProfile() {
  return useQuery({
    queryKey: creatorKeys.profile(),
    queryFn: async () => {
      const response = await creatorApi.getProfile();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch creator profile');
      }
      return response.data as CreatorProfile;
    },
    staleTime: 60_000,
    retry: 2,
  });
}

export function useCreatorDashboard() {
  return useQuery({
    queryKey: creatorKeys.dashboard(),
    queryFn: async () => {
      const response = await creatorApi.getDashboard();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch creator dashboard');
      }
      return response.data as CreatorDashboard;
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreatorContent(page = 1, limit = 20) {
  return useQuery({
    queryKey: creatorKeys.content(page, limit),
    queryFn: async () => {
      const response = await creatorApi.getContent(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch creator content');
      }
      return response.data as {
        items: CreatorContentItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    staleTime: 30_000,
  });
}

export function useCreatorAnalytics() {
  return useQuery({
    queryKey: creatorKeys.analytics(),
    queryFn: async () => {
      const response = await creatorApi.getAnalytics();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch creator analytics');
      }
      return response.data as CreatorAnalytics;
    },
    staleTime: 30_000,
  });
}

export function useCreatorEarnings() {
  return useQuery({
    queryKey: creatorKeys.earnings(),
    queryFn: async () => {
      const response = await creatorApi.getEarnings();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch creator earnings');
      }
      return response.data as CreatorEarnings;
    },
    staleTime: 30_000,
  });
}

export function useUpdateCreatorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreatorProfile>) => {
      const response = await creatorApi.updateProfile(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update creator profile');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorKeys.all });
    },
  });
}
