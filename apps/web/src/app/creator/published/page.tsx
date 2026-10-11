'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { CheckCircle2, Eye, Heart, Film, Plus } from 'lucide-react';

interface PublishedContent {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
  contentType?: string;
  duration?: number;
  views: number;
  viewCount?: number;
  likes: number;
  likeCount?: number;
  publishedAt: string;
  createdAt: string;
  status: string;
}

export default function PublishedPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: content = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['creator', 'published'],
    queryFn: async () => {
      const response = await apiFetch<PublishedContent[] | { items?: PublishedContent[] }>(
        '/v1/content/me?status=published'
      );
      if (response.success && response.data) {
        const items: PublishedContent[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { items?: PublishedContent[] }).items || [];
        return items.map((item: PublishedContent) => ({
          id: String(item.id),
          title: String(item.title || ''),
          description: String(item.description || ''),
          thumbnail: String(item.thumbnail || ''),
          type: String(item.contentType || item.type || 'video'),
          duration: Number(item.duration || 0),
          views: Number(item.viewCount ?? item.views ?? 0),
          likes: Number(item.likeCount ?? item.likes ?? 0),
          publishedAt: String(item.publishedAt || item.createdAt || ''),
          createdAt: String(item.createdAt || ''),
          status: String(item.status || 'published'),
        }));
      }
      return [];
    },
    enabled: isEnabled,
  });

  if (authLoading || (!isAuthenticated && !user)) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Live Broadcasts"
        title="Published Catalog"
        description="Publicly available titles streaming live to audience members globally across all Azeebo+ platforms."
        actions={
          <motion.button
            type="button"
            onClick={() => router.push('/creator/upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="az-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Premiere
          </motion.button>
        }
      />

      <div className="max-w-6xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden space-y-3 p-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load published catalog"
              description="Unable to sync public streaming assets."
              onButtonPress={() => refetch()}
            />
          </div>
        ) : content.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border">
            <CheckCircle2 className="w-12 h-12 text-az-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Live Premieres</h3>
            <p className="text-xs text-az-ink/50 max-w-sm mx-auto mb-6">
              You do not have any published media in the public streaming catalog yet.
            </p>
            <button
              type="button"
              onClick={() => router.push('/creator/upload')}
              className="az-btn-primary"
            >
              Publish First Title
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item: PublishedContent) => (
              <ScrollReveal key={item.id}>
                <div className="az-glass overflow-hidden border border-az-glass-border transition-all flex flex-col group">
                  <div className="relative aspect-video bg-az-glass-fill">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-az-ink/30">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-az-success-500/20 border border-az-success-500/30 text-az-success-400 text-[10px] font-mono font-bold uppercase backdrop-blur-sm">
                      Live
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-az-ink truncate">{item.title}</h3>
                      <p className="text-xs text-az-ink/40 mt-1">
                        Aired {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-az-ink/5 text-xs text-az-ink/50">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-az-ink/40" />
                        {(item.views || 0).toLocaleString()} streams
                      </span>
                      <span className="flex items-center gap-1.5 text-pink-400">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        {(item.likes || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
