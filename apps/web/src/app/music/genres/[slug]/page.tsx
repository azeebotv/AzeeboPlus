'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import MusicTrackList from '@/components/music/MusicTrackList';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { extractTracks } from '@/lib/music';
import { Music, ArrowLeft } from 'lucide-react';
import analytics from '@/lib/analytics';

interface GenreInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export default function GenreDetailPage(): React.JSX.Element {
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    analytics.pageView('music-genre-detail');
  }, [slug]);

  const genreQuery = useQuery({
    queryKey: ['music', 'genre', slug],
    queryFn: async () => {
      const res = await api.request<GenreInfo>(`/api/v1/lifestyle/music/genres/${slug}`);
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 300000,
    enabled: !!slug,
  });

  const tracksQuery = useQuery({
    queryKey: ['music', 'genre', slug, 'tracks'],
    queryFn: async () => {
      const res = await api.request<unknown>(`/api/v1/lifestyle/music?genre=${slug}`);
      if (res.success && res.data) return extractTracks(res.data);
      return [];
    },
    staleTime: 60000,
    enabled: !!slug,
  });

  const genre = genreQuery.data;
  const tracks = tracksQuery.data ?? [];

  return (
    <PageShell activeNav="Music">
      <Link
        href="/music/genres"
        className="az-overline group mb-6 inline-flex items-center gap-1.5 text-az-ink-muted transition-colors hover:text-az-ink"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Genres</span>
      </Link>

      <PageHero
        eyebrow="Music"
        title={genre?.name || slug}
        subtitle={genre?.description}
        accentColor="var(--color-az-universe-lifestyle)"
        rightElement={
          <div className="az-glass flex size-16 items-center justify-center text-az-ink sm:size-20">
            <Music size={32} strokeWidth={1.75} aria-hidden="true" />
          </div>
        }
      >
        <p className="az-body text-az-ink-muted">
          {tracks.length} track{tracks.length !== 1 ? 's' : ''}
        </p>
      </PageHero>

      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <MusicTrackList
            tracks={tracks}
            isLoading={tracksQuery.isLoading}
            error={tracksQuery.error?.message}
            onRetry={() => tracksQuery.refetch()}
          />
        </ScrollReveal>
      </section>
    </PageShell>
  );
}
