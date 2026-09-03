'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface DownloadItem {
  id: string;
  contentId: string;
  userId: string;
  quality: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';
  progress: number;
  fileSize: number;
  downloadedAt: string;
  expiresAt: string;
  url?: string;
  contentTitle?: string;
  contentThumbnail?: string;
}

export interface StorageInfo {
  totalUsed: number;
  totalAvailable: number;
  items: number;
  breakdown: { quality: string; count: number; size: number }[];
}

export function useDownloads() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const downloadsQuery = useQuery({
    queryKey: ['downloads'],
    queryFn: async () => {
      const response = await apiFetch<DownloadItem[]>('/content/downloads');
      return response.success ? (response.data || []) : [];
    },
    enabled: isAuthenticated,
    staleTime: 10000,
  });

  const storageQuery = useQuery({
    queryKey: ['downloads', 'storage'],
    queryFn: async () => {
      const response = await apiFetch<StorageInfo>('/content/downloads/storage');
      return response.success ? response.data : null;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const requestDownloadMutation = useMutation({
    mutationFn: async (params: { contentId: string; quality: string }) => {
      return apiFetch('/content/downloads', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      queryClient.invalidateQueries({ queryKey: ['downloads', 'storage'] });
    },
  });

  const deleteDownloadMutation = useMutation({
    mutationFn: async (downloadId: string) => {
      return apiFetch(`/content/downloads/${downloadId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      queryClient.invalidateQueries({ queryKey: ['downloads', 'storage'] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/content/downloads', { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      queryClient.invalidateQueries({ queryKey: ['downloads', 'storage'] });
    },
  });

  return {
    downloads: downloadsQuery.data ?? [],
    storage: storageQuery.data ?? null,
    isLoading: downloadsQuery.isLoading,
    requestDownload: requestDownloadMutation.mutate,
    deleteDownload: deleteDownloadMutation.mutate,
    deleteAll: deleteAllMutation.mutate,
    isRequesting: requestDownloadMutation.isPending,
    isDeleting: deleteDownloadMutation.isPending,
    requestError: requestDownloadMutation.error,
  };
}
