'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Eye, Heart, MessageSquare, ArrowLeft, Edit3 } from 'lucide-react';
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
  const router = useRouter();
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

  if (query.isLoading) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <div className="max-w-4xl mx-auto py-20 px-4 space-y-6">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-10 w-2/3 rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (query.error || !content) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.12)">
        <div className="max-w-md mx-auto py-20 px-4">
          <ErrorState
            title="Content asset not found"
            description="The requested media title could not be located in your studio catalog."
            onButtonPress={() => router.push('/creator/content-manager')}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Asset Intelligence"
        title={content.title}
        description={`Audit telemetry and metadata configuration for this ${content.type} asset.`}
        actions={
          <motion.button
            type="button"
            onClick={() => router.push(`/creator/upload?edit=${content.id}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="az-btn-primary px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Metadata
          </motion.button>
        }
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <button
          type="button"
          onClick={() => router.push('/creator/content-manager')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Content Manager
        </button>

        <ScrollReveal>
          <div className="space-y-6">
            {content.thumbnail && (
              <div className="relative aspect-video rounded-3xl overflow-hidden az-glass border border-white/10">
                <OptimizedImage
                  src={content.thumbnail}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                  content.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {content.status}
              </span>
              {content.universe && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)]/30 text-[var(--brand-orange)]">
                  {content.universe}
                </span>
              )}
              {content.type && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  {content.type}
                </span>
              )}
            </div>

            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Synopsis</h2>
              <p className="text-sm text-white/70 leading-relaxed">{content.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="az-glass p-5 rounded-2xl border border-white/10 text-center">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-2 text-blue-400">
                  <Eye className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-white tracking-tight">
                  {content.viewCount.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-0.5">
                  Verified Views
                </p>
              </div>

              <div className="az-glass p-5 rounded-2xl border border-white/10 text-center">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-2 text-pink-400">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <p className="text-2xl font-extrabold text-white tracking-tight">
                  {content.likeCount.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-0.5">
                  Likes
                </p>
              </div>

              <div className="az-glass p-5 rounded-2xl border border-white/10 text-center">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-2 text-purple-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-white tracking-tight">
                  {content.commentCount.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-0.5">
                  Comments
                </p>
              </div>
            </div>

            <div className="az-glass p-5 rounded-2xl border border-white/10 text-xs text-white/40 flex flex-wrap items-center justify-between gap-2">
              <span>Created: {new Date(content.createdAt).toLocaleString('en-NG')}</span>
              {content.publishedAt && (
                <span>Published: {new Date(content.publishedAt).toLocaleString('en-NG')}</span>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
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
