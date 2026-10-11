'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import MusicTrackList, { Track } from '@/components/music/MusicTrackList';
import { extractTracks } from '@/lib/music';
import { ArrowLeft, Music, Headphones } from 'lucide-react';
import analytics from '@/lib/analytics';

function MusicPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('lifestyle-music');
  }, []);

  const musicQuery = useQuery({
    queryKey: ['lifestyle-music'],
    queryFn: async () => {
      const res = await api.request<unknown>('/api/v1/lifestyle/music');
      if (res.success && res.data) return extractTracks(res.data);
      throw new Error(res.message || 'Failed to load music');
    },
    staleTime: 60000,
  });

  const tracks: Track[] = musicQuery.data ?? [];

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <PageHero
        badge="Afrobeats & Soundscapes"
        title="Lifestyle Music"
        description="Trending Afrobeats, Amapiano, Highlife, and curated sonic vibes soundtracking modern African luxury and culture."
      />

      <div className="max-w-7xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/lifestyle"
            className="inline-flex items-center gap-2 text-xs font-semibold text-az-ink/50 hover:text-az-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Lifestyle Hub
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-az-ink/40">
            <Headphones className="w-3.5 h-3.5 text-[var(--color-az-flame)]" />
            <span>Curated Soundtracks</span>
          </div>
        </div>

        <div className="az-glass p-6 border border-az-glass-border">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-az-ink/5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-az-flame)]/15 flex items-center justify-center text-[var(--color-az-flame)]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-az-ink">Afro-Sonic Playlist</h2>
              <p className="text-xs text-az-ink/40">
                Stream official soundtrack releases & top-charting records
              </p>
            </div>
          </div>

          <MusicTrackList
            tracks={tracks}
            isLoading={musicQuery.isLoading}
            error={musicQuery.error?.message}
            onRetry={() => musicQuery.refetch()}
          />
        </div>
      </div>
    </PageShell>
  );
}

const LazyMusicPage = lazy(() => Promise.resolve({ default: MusicPageContent }));

export default function MusicPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMusicPage />
    </Suspense>
  );
}
