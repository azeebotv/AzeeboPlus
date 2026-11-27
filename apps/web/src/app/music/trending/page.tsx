'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import MusicTrackList from '@/components/music/MusicTrackList';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { extractTracks } from '@/lib/music';
import analytics from '@/lib/analytics';

export default function MusicTrendingPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music-trending');
  }, []);

  const trendingQuery = useQuery({
    queryKey: ['music', 'trending'],
    queryFn: async () => {
      const res = await api.request<unknown>('/api/v1/lifestyle/music/trending');
      if (res.success && res.data) return extractTracks(res.data);
      return [];
    },
    staleTime: 60000,
  });

  const tracks = trendingQuery.data ?? [];

  return (
    <PageShell activeNav="Music">
      <PageHero
        eyebrow="Music"
        title="Trending Music"
        subtitle="The hottest tracks right now"
        accentColor="var(--color-az-universe-lifestyle)"
        actions={
          <>
            <Link
              href="/music"
              className="az-body-strong rounded-az-pill border border-az-ink/30 px-4 py-2 text-az-ink transition-colors hover:bg-az-ink/5"
            >
              All Tracks
            </Link>
            <span className="az-body-strong rounded-az-pill bg-az-flame px-4 py-2 text-az-surface-root">
              Trending
            </span>
            <Link
              href="/music/genres"
              className="az-body-strong rounded-az-pill border border-az-ink/30 px-4 py-2 text-az-ink transition-colors hover:bg-az-ink/5"
            >
              Genres
            </Link>
          </>
        }
      />

      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <MusicTrackList
            tracks={tracks}
            isLoading={trendingQuery.isLoading}
            error={trendingQuery.error?.message}
            onRetry={() => trendingQuery.refetch()}
          />
        </ScrollReveal>
      </section>
    </PageShell>
  );
}
