'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import MusicTrackList from '@/components/music/MusicTrackList';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { extractTracks } from '@/lib/music';
import { Mic } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  genre?: string;
  trackCount?: number;
  followerCount?: number;
  socialLinks?: { platform: string; url: string }[];
}

export default function ArtistDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('music-artist');
  }, [id]);

  const artistQuery = useQuery({
    queryKey: ['music', 'artist', id],
    queryFn: async () => {
      const res = await api.request<Artist>(`/api/v1/lifestyle/music/artists/${id}`);
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const tracksQuery = useQuery({
    queryKey: ['music', 'artist', id, 'tracks'],
    queryFn: async () => {
      const res = await api.request<unknown>(`/api/v1/lifestyle/music?artistId=${id}`);
      if (res.success && res.data) return extractTracks(res.data);
      return [];
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const artist = artistQuery.data;
  const tracks = tracksQuery.data ?? [];

  return (
    <PageShell activeNav="Music">
      <PageHero
        eyebrow="Music"
        title={artist?.name || 'Artist'}
        subtitle={artist?.bio}
        accentColor="var(--color-az-universe-lifestyle)"
        rightElement={
          artist?.avatar ? (
            <OptimizedImage
              src={artist.avatar}
              alt={artist?.name || 'Artist'}
              width={160}
              height={160}
              className="size-32 rounded-full object-cover sm:size-40"
            />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full bg-az-flame/15 text-az-flame sm:size-40">
              <Mic size={48} strokeWidth={1.5} aria-hidden="true" />
            </div>
          )
        }
      >
        <div className="flex flex-col gap-2">
          {artist?.genre && <p className="az-subtitle text-az-ink-muted">{artist.genre}</p>}
          <div className="az-caption flex gap-6 text-az-ink-muted">
            {artist?.trackCount != null && <span>{artist.trackCount} tracks</span>}
            {artist?.followerCount != null && (
              <span>{artist.followerCount.toLocaleString()} followers</span>
            )}
          </div>
          <Link
            href="/music"
            className="az-caption inline-block text-az-ink-muted transition-colors hover:text-az-ink"
          >
            ← Back to Music
          </Link>
        </div>
      </PageHero>

      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink">Tracks</h2>
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
