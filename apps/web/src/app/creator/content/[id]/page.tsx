'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

interface ContentDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  universe: string;
  type: string;
  thumbnail?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt?: string;
}

function ContentDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('creator-content-detail');
  }, []);
  const query = useQuery({
    queryKey: ['creator', 'content', id],
    queryFn: async () => {
      const res = await api.request<ContentDetail>(`/api/v1/creators/content/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const content = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !content)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState title="Content not found" />
        </div>
      </div>
    );
  const statusColor =
    content.status === 'published'
      ? 'var(--brand-green)'
      : content.status === 'draft'
        ? 'var(--brand-amber)'
        : content.status === 'review'
          ? 'var(--brand-blue)'
          : 'var(--brand-grey)';
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Creator" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {content.thumbnail && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
              <OptimizedImage
                src={content.thumbnail}
                alt={content.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {content.status}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: 'rgba(232,66,10,0.15)', color: 'var(--brand-orange)' }}
            >
              {content.universe}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--brand-purple)' }}
            >
              {content.type}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{content.title}</h1>
          <p className="text-white/60 mb-6">{content.description}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="az-glass p-4 text-center">
              <p className="text-xl font-bold text-white">{content.viewCount.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Views</p>
            </div>
            <div className="az-glass p-4 text-center">
              <p className="text-xl font-bold text-white">{content.likeCount.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Likes</p>
            </div>
            <div className="az-glass p-4 text-center">
              <p className="text-xl font-bold text-white">
                {content.commentCount.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">Comments</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-white/40">
            <p>Created: {new Date(content.createdAt).toLocaleString('en-NG')}</p>
            {content.publishedAt && (
              <p>Published: {new Date(content.publishedAt).toLocaleString('en-NG')}</p>
            )}
          </div>
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: ContentDetailContent }));
export default function ContentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
