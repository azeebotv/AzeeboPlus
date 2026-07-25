'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ContentItem as BaseContentItem } from '@/lib/api';

interface ContentItem extends BaseContentItem {
  views: number;
  viewCount?: number;
  earnings: number;
  type: 'video' | 'image' | 'audio';
}

export default function ContentManagerPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const {
    data: content = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'content'],
    queryFn: async () => {
      const result = await apiFetch<ContentItem[] | { items?: ContentItem[] }>('/v1/content/me');
      if (result.success && result.data) {
        const items: ContentItem[] = Array.isArray(result.data)
          ? result.data
          : (result.data as { items?: ContentItem[] }).items || [];
        return items.map((item: ContentItem) => ({
          id: String(item.id),
          title: String(item.title || ''),
          description: String(item.description || ''),
          thumbnail: String(item.thumbnail || ''),
          status: String(item.status || 'draft') as ContentItem['status'],
          universeId: String(item.universeId || ''),
          createdAt: String(item.createdAt || ''),
          updatedAt: String(item.updatedAt || ''),
          creator: item.creator || { id: '', name: '' },
          universe: item.universe || { id: '', name: '' },
          views: Number(item.viewCount ?? item.views ?? 0),
          earnings: Number(item.earnings ?? 0),
          type: String(item.contentType || item.type || 'video') as ContentItem['type'],
        }));
      }
      return [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/content/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/content/${id}/publish`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }),
  });

  const getStatusStyle = (status: string): { color: string } => {
    switch (status) {
      case 'draft':
        return { color: 'rgba(255,255,255,0.4)' };
      case 'processing':
        return { color: '#EAB308' };
      case 'published':
        return { color: '#22C55E' };
      case 'archived':
        return { color: '#EF4444' };
      default:
        return { color: 'rgba(255,255,255,0.4)' };
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'image':
        return '📷';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const filteredContent =
    filter === 'all' ? content : content.filter((item: ContentItem) => item.status === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton width="120px" height="20px" className="mb-2" />
              <Skeleton width="180px" height="32px" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden flex">
                <Skeleton width="160px" height="160px" />
                <div className="flex-1 p-4">
                  <Skeleton width="60%" height="20px" className="mb-2" />
                  <Skeleton width="40%" height="14px" className="mb-4" />
                  <Skeleton width="80px" height="14px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load content"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-white/50 hover:text-white mb-2 flex items-center gap-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-white">Content Manager</h1>
          </div>
          <button
            onClick={() => router.push('/creator/drafts')}
            className="az-btn-primary"
            style={{ width: 'auto', paddingInline: '1.5rem' }}
          >
            + Create Content
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2" role="group" aria-label="Content filters">
            {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f ? 'az-btn-primary' : ''}`}
                style={
                  filter !== f
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                      }
                    : undefined
                }
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 az-glass p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'list' ? 'text-white' : 'text-white/50'}`}
              style={viewMode === 'list' ? { backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-white/50'}`}
              style={viewMode === 'grid' ? { backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
            >
              ⊞
            </button>
          </div>
        </div>

        {filteredContent.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-2">No content yet</h2>
            <p className="text-white/50 mb-6">Start creating amazing content for your audience</p>
            <button
              onClick={() => router.push('/creator/drafts')}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '1.5rem' }}
            >
              Create Content
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item: ContentItem) => (
              <div
                key={item.id}
                onClick={() => router.push('/creator/content-manager')}
                className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="relative">
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.title}
                    width={400}
                    height={160}
                    className="w-full h-40 object-cover"
                  />
                  <div
                    className="absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <span>{getTypeIcon(item.type)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={getStatusStyle(item.status)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <span className="text-sm text-white/50">
                      {(item.views ?? 0).toLocaleString()} views
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item: ContentItem) => (
              <div key={item.id} className="az-glass overflow-hidden flex">
                <OptimizedImage
                  src={item.thumbnail}
                  alt={item.title}
                  width={160}
                  height={160}
                  className="w-40 h-40 object-cover"
                />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-white/50 line-clamp-2">{item.description}</p>
                    </div>
                    <span className="text-2xl ml-2">{getTypeIcon(item.type)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium" style={getStatusStyle(item.status)}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className="text-sm text-white/50">{formatDate(item.createdAt)}</span>
                      <span className="text-sm text-white/50">
                        {item.views.toLocaleString()} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'draft' && (
                        <button
                          onClick={() => publishMutation.mutate(item.id)}
                          className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                          style={{ backgroundColor: '#22C55E' }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => router.push('/creator/content-manager')}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Delete Content',
                            message: 'Are you sure you want to delete this content?',
                            destructive: true,
                            onConfirm: () => {
                              setConfirmDialog((prev) => ({ ...prev, open: false }));
                              deleteMutation.mutate(item.id);
                            },
                          });
                        }}
                        className="px-3 py-2 rounded-full text-sm transition-colors"
                        style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AppFooter />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
