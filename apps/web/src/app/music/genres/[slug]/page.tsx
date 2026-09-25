'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, var(--music-purple) 0%, #E8420A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/music/genres"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Genres</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-5 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl flex-shrink-0">
                <Music size={32} strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{genre?.name || slug}</h1>
                {genre?.description && (
                  <p className="text-base sm:text-lg text-white/80 mt-1 max-w-2xl">{genre.description}</p>
                )}
              </div>
            </div>
            <p className="text-white/50">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <MusicTrackList
            tracks={tracks}
            isLoading={tracksQuery.isLoading}
            error={tracksQuery.error?.message}
            onRetry={() => tracksQuery.refetch()}
          />
        </ScrollReveal>
      </div>

      <AppFooter />
    </div>
  );
}
