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
import { Star, Play, ArrowLeft, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

function CelebrityDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    analytics.pageView('lifestyle-celebrity-detail');
  }, []);

  const {
    data: celebrity,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['celebrity', id],
    queryFn: async (): Promise<ContentItem | null> => {
      try {
        const res = await api.content.getContent(id);
        if (res.success && res.data) return res.data as ContentItem;
      } catch {
        // Fallback to direct request
      }
      const direct = await api.request<ContentItem>(`/api/v1/content/${id}`);
      return (direct.success ? direct.data : null) as ContentItem | null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Celebrities', href: '/lifestyle/celebrities' },
              { label: celebrity?.title || 'Celebrity Spotlight' },
            ]}
          />
          <Link
            href="/lifestyle/celebrities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Celebrities
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
              title="Failed to Load Celebrity"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : celebrity ? (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="relative aspect-[21/9] sm:h-[420px] w-full rounded-3xl overflow-hidden border border-az-glass-border bg-az-glass-fill shadow-2xl">
                <OptimizedImage
                  src={celebrity.thumbnail}
                  alt={celebrity.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 az-scrim--hero" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[var(--color-az-flame)] border border-[var(--color-az-flame)]/30 text-xs font-mono font-bold uppercase">
                    {celebrity.contentType || 'A-List Icon'}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <h1 className="az-headline text-2xl sm:text-4xl font-extrabold text-az-ink">
                    {celebrity.title}
                  </h1>
                  <p className="text-sm text-az-ink/70 max-w-2xl line-clamp-2 leading-relaxed">
                    {celebrity.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="az-glass p-8 border border-az-glass-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-az-ink flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-az-flame)]" />
                  Stream Exclusive Spotlight Feature
                </h3>
                <p className="text-xs text-az-ink/50">
                  Watch full 4K interview and red-carpet behind-the-scenes footage
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/watch/${celebrity.id}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-az-ink bg-[var(--color-az-flame)] hover:bg-[var(--color-az-flame)]/90 transition-all shadow-lg shadow-[var(--color-az-flame)]/25"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Video Feature
                </Link>
                <Link
                  href="/lifestyle/celebrities"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-az-ink/80 hover:text-az-ink az-glass hover:bg-az-glass-card transition-all border border-az-glass-border"
                >
                  More Profiles
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="az-glass p-16 text-center border border-az-glass-border max-w-md mx-auto">
            <Star className="w-12 h-12 text-az-ink/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">Profile Not Found</h3>
            <p className="text-xs text-az-ink/50">
              The requested celebrity spotlight could not be loaded.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyCelebrityDetail = lazy(() => Promise.resolve({ default: CelebrityDetailContent }));

export default function CelebrityDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyCelebrityDetail />
    </Suspense>
  );
}
