'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Users, Play, ArrowLeft, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

function InfluencerDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    analytics.pageView('lifestyle-influencer-detail');
  }, []);

  const {
    data: influencer,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['influencer', id],
    queryFn: async (): Promise<ContentItem | null> => {
      const res = await api.request<ContentItem>(`/api/v1/content/${id}`);
      return (res.success ? res.data : null) as ContentItem | null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Influencers', href: '/lifestyle/influencers' },
              { label: influencer?.title || 'Creator Profile' },
            ]}
          />
          <Link
            href="/lifestyle/influencers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Influencers
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-[360px] w-full rounded-3xl" />
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="Failed to Load Creator"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : influencer ? (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="relative aspect-[21/9] sm:h-[420px] w-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                <OptimizedImage
                  src={influencer.thumbnail}
                  alt={influencer.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-black/40 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--brand-orange)] border border-[var(--brand-orange)]/30 text-xs font-mono font-bold uppercase">
                    {influencer.contentType || 'Featured Creator'}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {influencer.title}
                  </h1>
                  <p className="text-sm text-white/70 max-w-2xl line-clamp-2 leading-relaxed">
                    {influencer.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="az-glass p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--brand-orange)]" />
                  Creator Feature & Vlogs
                </h3>
                <p className="text-xs text-white/50">
                  Follow their lifestyle episodes, day-in-the-life vlogs, and brand edits
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/watch/${influencer.id}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 transition-all shadow-lg shadow-[var(--brand-orange)]/25"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Content
                </Link>
                <Link
                  href="/lifestyle/influencers"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-white/80 hover:text-white az-glass hover:bg-white/10 transition-all border border-white/10"
                >
                  More Creators
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="az-glass p-16 text-center rounded-3xl border border-white/10 max-w-md mx-auto">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Creator Not Found</h3>
            <p className="text-xs text-white/50">
              The requested creator profile could not be loaded.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyInfluencerDetail = lazy(() => Promise.resolve({ default: InfluencerDetailContent }));

export default function InfluencerDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyInfluencerDetail />
    </Suspense>
  );
}
