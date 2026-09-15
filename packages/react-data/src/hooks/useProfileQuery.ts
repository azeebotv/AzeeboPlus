import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  type UserProfile,
  type UserPreferences,
  type WatchHistoryItem,
  type SavedItem,
} from '../api/user';
import { authApi, type User } from '../api/auth';

export const profileKeys = {
  all: ['profile'] as const,
  user: () => [...profileKeys.all, 'user'] as const,
  preferences: () => [...profileKeys.all, 'preferences'] as const,
  watchHistory: (page: number, limit: number) =>
    [...profileKeys.all, 'watchHistory', { page, limit }] as const,
  savedItems: (page: number, limit: number) =>
    [...profileKeys.all, 'savedItems', { page, limit }] as const,
};

export function useUserProfile() {
  return useQuery({
    queryKey: profileKeys.user(),
    queryFn: async () => {
      const response = await userApi.getProfile();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user profile');
      }
      return response.data as UserProfile;
    },
    staleTime: 60_000,
    retry: 2,
  });
}

export function useAuthProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: async () => {
      const response = await authApi.getProfile();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch auth profile');
      }
      return response.data as User;
    },
    staleTime: 60_000,
    retry: 2,
  });
}

export function useUserPreferences() {
  return useQuery({
    queryKey: profileKeys.preferences(),
    queryFn: async () => {
      const response = await userApi.getPreferences();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user preferences');
      }
      return response.data as UserPreferences;
    },
    staleTime: 60_000,
  });
}

export function useWatchHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: profileKeys.watchHistory(page, limit),
    queryFn: async () => {
      const response = await userApi.getWatchHistory(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch watch history');
      }
      return response.data as {
        items: WatchHistoryItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    staleTime: 30_000,
  });
}

export function useSavedItems(page = 1, limit = 20) {
  return useQuery({
    queryKey: profileKeys.savedItems(page, limit),
    queryFn: async () => {
      const response = await userApi.getSavedItems(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch saved items');
      }
      return response.data as {
        items: SavedItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    staleTime: 30_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'bio'>>) => {
      const response = await userApi.updateProfile(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update profile');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await userApi.updatePreferences(preferences);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.preferences() });
    },
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await userApi.saveItem(contentId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save item');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUnsaveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await userApi.unsaveItem(contentId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unsave item');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
