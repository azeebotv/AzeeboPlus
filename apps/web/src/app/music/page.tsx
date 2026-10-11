'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import MusicTrackList, { Track } from '@/components/music/MusicTrackList';
import { extractGenres, extractTracks } from '@/lib/music';
import { Flame, Music } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

function MusicPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music');
  }, []);

  const musicQuery = useQuery({
    queryKey: ['music-tracks'],
    queryFn: async () => {
      const res = await api.request<unknown>('/api/v1/lifestyle/music');
      if (res.success && res.data) return extractTracks(res.data);
      throw new Error(res.message || 'Failed to load music');
    },
    staleTime: 60000,
  });

  const genresQuery = useQuery({
    queryKey: ['music', 'genres'],
    queryFn: async () => {
      const res = await api.request<unknown>('/api/v1/lifestyle/music/genres');
      if (res.success && res.data) return extractGenres(res.data);
      return [];
    },
    staleTime: 300000,
  });

  const tracks: Track[] = musicQuery.data ?? [];
  const genres: Genre[] = genresQuery.data ?? [];

  return (
    <PageShell activeNav="Music">
      <PageHero
        eyebrow="Music"
        title="Music"
        subtitle="Stream the latest hits, live performances, and exclusive drops"
        accentColor="var(--color-az-universe-lifestyle)"
        actions={
          <>
            <Link
              href="/music/trending"
              className="az-body-strong inline-flex items-center gap-2 rounded-az-pill bg-az-flame px-5 py-2.5 text-az-surface-root shadow-az-glow transition-all hover:scale-105 active:scale-95"
            >
              <Flame size={16} aria-hidden="true" />
              Trending
            </Link>
            <Link
              href="/music/genres"
              className="az-body-strong inline-flex items-center gap-2 rounded-az-pill border border-az-ink/20 bg-az-ink/5 px-5 py-2.5 text-az-ink transition-all hover:bg-az-glass-card active:scale-95"
            >
              <Music size={16} aria-hidden="true" />
              Genres
            </Link>
          </>
        }
      />

      {/* Genre Quick Links */}
      {genres.length > 0 && (
        <section className="py-8">
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {genres.slice(0, 8).map((genre) => (
              <Link
                key={genre.id}
                href={`/music/genres/${genre.slug || genre.id}`}
                className="az-body-strong flex items-center gap-2 whitespace-nowrap rounded-az-pill bg-az-ink/5 px-4 py-2 text-az-ink transition-all hover:bg-az-ink/10"
              >
                <span>{genre.icon || 'Music'}</span>
                {genre.name}
              </Link>
            ))}
            <Link
              href="/music/genres"
              className="az-body-strong whitespace-nowrap rounded-az-pill px-4 py-2 text-az-flame transition-colors hover:text-az-scarlet"
            >
              View All →
            </Link>
          </div>
        </section>
      )}

      <MusicTrackList
        tracks={tracks}
        isLoading={musicQuery.isLoading}
        error={musicQuery.error?.message}
        onRetry={() => musicQuery.refetch()}
      />
    </PageShell>
  );
}

export default MusicPageContent;
