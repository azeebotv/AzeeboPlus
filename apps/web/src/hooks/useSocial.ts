'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface SocialUser {
  id: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'tip' | 'upload';
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId?: string;
  targetType?: string;
  targetTitle?: string;
  message: string;
  timestamp: string;
}

// Follow a user
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(`/social/follow/${userId}`, { method: 'POST' });
      return res;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['social', 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

// Unfollow a user
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(`/social/follow/${userId}`, { method: 'DELETE' });
      return res;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['social', 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}

// Get followers list
export function useFollowers(userId?: string) {
  return useQuery({
    queryKey: ['social', 'followers', userId],
    queryFn: async () => {
      const url = userId ? `/social/followers?userId=${userId}` : '/social/followers';
      const res = await apiFetch<SocialUser[]>(url);
      return res.success ? res.data || [] : [];
    },
  });
}

// Get following list
export function useFollowing(userId?: string) {
  return useQuery({
    queryKey: ['social', 'following', userId],
    queryFn: async () => {
      const url = userId ? `/social/following?userId=${userId}` : '/social/following';
      const res = await apiFetch<SocialUser[]>(url);
      return res.success ? res.data || [] : [];
    },
  });
}

// Get activity feed
export function useActivityFeed(limit: number = 20) {
  return useQuery({
    queryKey: ['social', 'activity', limit],
    queryFn: async () => {
      const res = await apiFetch<ActivityItem[]>(`/social/activity?limit=${limit}`);
      return res.success ? res.data || [] : [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get user profile
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await apiFetch<SocialUser>(`/users/${userId}`);
      return res.success ? res.data : null;
    },
  });
}

// Like content
export function useLikeContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await apiFetch(`/content/${contentId}/like`, { method: 'POST' });
      return res;
    },
    onSuccess: (_, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    },
  });
}

// Unlike content
export function useUnlikeContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await apiFetch(`/content/${contentId}/like`, { method: 'DELETE' });
      return res;
    },
    onSuccess: (_, contentId) => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
    },
  });
}

// Share content
export function useShareContent() {
  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await apiFetch(`/content/${contentId}/share`, { method: 'POST' });
      return res;
    },
  });
}
