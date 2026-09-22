'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  LayoutGrid,
  List,
  Trash2,
  Edit3,
  Video,
  Camera,
  Music2,
  FileText,
  Plus,
  Eye,
  Film,
} from 'lucide-react';
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
    refetch,
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
    mutationFn: (id: string) => apiFetch(`/v1/creator/content/${id}/publish`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }),
  });

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-[var(--brand-orange)]" />;
      case 'image':
        return <Camera className="w-4 h-4 text-emerald-400" />;
      case 'audio':
        return <Music2 className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
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
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <div className="max-w-6xl mx-auto py-20 px-4 space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.12)">
        <div className="max-w-md mx-auto py-20 px-4">
          <ErrorState
            title="Failed to load content"
            description="Unable to sync media assets from the catalog."
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Asset Catalog"
        title="Content Manager"
        description="Oversee your video masters, published premieres, and draft narratives in one unified hub."
        actions={
          <motion.button
            type="button"
            onClick={() => router.push('/creator/upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="az-btn-primary px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload New Content
          </motion.button>
        }
      />

      <div className="max-w-6xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filter and View Mode Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Content filters">
            {(['all', 'draft', 'published', 'archived'] as const).map((f) => {
              const isSelected = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={isSelected}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-[var(--brand-orange)] text-white shadow-md'
                      : 'text-white/50 hover:text-white/80 az-glass border border-white/10'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl az-glass border border-white/10 self-start sm:self-center">
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Listing */}
        {filteredContent.length === 0 ? (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10">
            <Film className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Titles Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mb-6">
              You do not have any media files matching this filter state.
            </p>
            <button
              type="button"
              onClick={() => router.push('/creator/upload')}
              className="az-btn-primary px-6 py-2.5 rounded-full text-xs font-bold"
            >
              Upload First Asset
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item: ContentItem) => (
              <ScrollReveal key={item.id}>
                <div className="az-glass rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex flex-col group">
                  <div className="relative aspect-video bg-white/5">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      {renderTypeIcon(item.type)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                          item.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'processing'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="flex items-center gap-1 text-white/40">
                        <Eye className="w-3 h-3" />
                        {item.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map((item: ContentItem) => (
              <ScrollReveal key={item.id}>
                <div className="az-glass p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-20 sm:w-24 aspect-video rounded-xl bg-white/5 relative overflow-hidden flex-shrink-0 border border-white/10">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {renderTypeIcon(item.type)}
                        <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                        <span>Created: {formatDate(item.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-white/30" />
                          {item.views.toLocaleString()} views
                        </span>
                        <span>•</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            item.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.status === 'processing'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-white/5 text-white/40 border-white/10'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {item.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => publishMutation.mutate(item.id)}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Edit title"
                      onClick={() => router.push(`/creator/upload?edit=${item.id}`)}
                      className="p-2 rounded-full az-glass border border-white/10 text-white/70 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete title"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: 'Delete Asset',
                          message: 'Are you sure you want to purge this title from your catalog?',
                          destructive: true,
                          onConfirm: () => {
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                            deleteMutation.mutate(item.id);
                          },
                        });
                      }}
                      className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </PageShell>
  );
}
