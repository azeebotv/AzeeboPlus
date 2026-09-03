'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Title {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  banner?: string;
  genre?: string;
  rating?: number;
  releaseYear?: number;
  totalEpisodes?: number;
  status?: 'ongoing' | 'completed' | 'upcoming';
}

interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  thumbnail: string;
  duration: number;
  description: string;
  releaseDate: string;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
  role?: 'main' | 'supporting' | 'guest';
}

function TitleDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'episodes' | 'characters'>('episodes');

  useEffect(() => {
    analytics.pageView('vertical-title-detail');
  }, []);

  const titleQuery = useQuery({
    queryKey: ['vertical-title', id],
    queryFn: async () => {
      const res = await api.request<Title>(`/api/v1/vertical/titles/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load title');
    },
    enabled: !!id,
    staleTime: 30000,
  });

  const episodesQuery = useQuery({
    queryKey: ['vertical-title-episodes', id],
    queryFn: async () => {
      const res = await api.request<Episode[]>(`/api/v1/vertical/titles/${id}/episodes`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load episodes');
    },
    enabled: !!id,
    staleTime: 60000,
  });

  const charactersQuery = useQuery({
    queryKey: ['vertical-title-characters', id],
    queryFn: async () => {
      const res = await api.request<Character[]>(`/api/v1/vertical/titles/${id}/characters`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load characters');
    },
    enabled: !!id,
    staleTime: 60000,
  });

  const relatedQuery = useQuery({
    queryKey: ['vertical-title-related', id],
    queryFn: async () => {
      const res = await api.request<Title[]>(`/api/v1/vertical/titles/${id}/related`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load related content');
    },
    enabled: !!id,
    staleTime: 60000,
  });

  const title: Title | undefined = titleQuery.data;
  const episodes: Episode[] = episodesQuery.data ?? [];
  const characters: Character[] = charactersQuery.data ?? [];
  const relatedTitles: Title[] = relatedQuery.data ?? [];
  const isLoading = titleQuery.isLoading;
  const error = titleQuery.error?.message;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'ongoing':
        return { bg: 'rgba(74,222,128,0.2)', text: 'var(--color-success-400)', label: 'Ongoing' };
      case 'completed':
        return { bg: 'rgba(156,163,175,0.2)', text: 'var(--brand-grey)', label: 'Completed' };
      case 'upcoming':
        return { bg: 'rgba(245,158,11,0.2)', text: 'var(--color-warning-500)', label: 'Upcoming' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)', label: 'N/A' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Skeleton height="350px" borderRadius="0" className="mb-6" />
          <Skeleton height="40px" width="50%" className="mb-4" />
          <Skeleton height="20px" width="30%" className="mb-6" />
          <Skeleton height="200px" />
        </div>
      ) : error ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorState
            title="Failed to load title"
            description={error}
            onButtonPress={() => titleQuery.refetch()}
          />
        </div>
      ) : title ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <ScrollReveal>
            <div className="relative h-[300px] sm:h-[400px] mb-6 rounded-xl overflow-hidden">
              {title.banner ? (
                <OptimizedImage
                  src={title.banner}
                  alt={title.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <OptimizedImage
                  src={title.thumbnail}
                  alt={title.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-[var(--brand-near-black)]/30 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                {title.genre && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.9)', color: 'var(--brand-white)' }}
                  >
                    {title.genre}
                  </span>
                )}
                {title.status && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: getStatusStyle(title.status).bg,
                      color: getStatusStyle(title.status).text,
                    }}
                  >
                    {getStatusStyle(title.status).label}
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">{title.name}</h1>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  {title.releaseYear && <span>{title.releaseYear}</span>}
                  {title.totalEpisodes && <span>{title.totalEpisodes} episodes</span>}
                  {title.rating && (
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {title.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="az-glass p-6 rounded-xl mb-6">
              <h2 className="text-lg font-bold text-white mb-3">About</h2>
              <p className="text-white/70 leading-relaxed">{title.description}</p>
            </div>
          </ScrollReveal>

          <div className="flex gap-2 mb-6">
            {(['episodes', 'characters'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                style={{
                  backgroundColor:
                    activeTab === tab ? 'rgba(232,66,10,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab ? 'var(--brand-orange)' : 'rgba(255,255,255,0.6)',
                  border:
                    activeTab === tab ? '1px solid rgba(232,66,10,0.3)' : '1px solid transparent',
                }}
              >
                {tab} ({tab === 'episodes' ? episodes.length : characters.length})
              </button>
            ))}
          </div>

          {activeTab === 'episodes' && (
            <ScrollReveal>
              <div className="space-y-4">
                {episodesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="az-glass p-4 rounded-xl flex gap-4">
                      <Skeleton width="120px" height="70px" borderRadius="8px" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="16px" width="60%" />
                        <Skeleton height="12px" width="40%" />
                        <Skeleton height="12px" width="80%" />
                      </div>
                    </div>
                  ))
                ) : episodes.length > 0 ? (
                  episodes.map((episode, index) => (
                    <motion.div
                      key={episode.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GlowCard universe="vertical" className="p-4 flex gap-4 cursor-pointer">
                        <div className="relative flex-shrink-0">
                          <OptimizedImage
                            src={episode.thumbnail}
                            alt={episode.title}
                            width={120}
                            height={70}
                            className="w-[120px] h-[70px] rounded-lg object-cover"
                          />
                          <span
                            className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'var(--brand-white)',
                            }}
                          >
                            {formatDuration(episode.duration)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--brand-orange)] mb-1">
                            Episode {episode.episodeNumber}
                          </p>
                          <h3 className="font-semibold text-white truncate">{episode.title}</h3>
                          <p className="text-xs text-white/50 mt-1 line-clamp-2">
                            {episode.description}
                          </p>
                          <p className="text-xs text-white/30 mt-2">
                            {new Date(episode.releaseDate).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </GlowCard>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-white/50 py-8">No episodes available</p>
                )}
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'characters' && (
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {charactersQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="az-glass p-4 rounded-xl flex items-center gap-3">
                      <Skeleton width="60px" height="60px" borderRadius="50%" />
                      <div className="flex-1 space-y-2">
                        <Skeleton height="16px" width="60%" />
                        <Skeleton height="12px" width="40%" />
                      </div>
                    </div>
                  ))
                ) : characters.length > 0 ? (
                  characters.map((character, index) => (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GlowCard universe="vertical" className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <OptimizedImage
                            src={character.avatar}
                            alt={character.name}
                            width={60}
                            height={60}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-white">{character.name}</h3>
                            {character.role && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full capitalize"
                                style={{
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.6)',
                                }}
                              >
                                {character.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-white/50 line-clamp-2">
                          {character.description}
                        </p>
                      </GlowCard>
                    </motion.div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-white/50 py-8">
                    No characters available
                  </p>
                )}
              </div>
            </ScrollReveal>
          )}

          {relatedTitles.length > 0 && (
            <ScrollReveal className="mt-10">
              <h2 className="text-2xl font-bold text-white mb-6">Related Titles</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedTitles.map((related, index) => (
                  <motion.div
                    key={related.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/vertical/titles/${related.id}`}>
                      <GlowCard universe="vertical" className="overflow-hidden">
                        <OptimizedImage
                          src={related.thumbnail}
                          alt={related.name}
                          width={200}
                          height={120}
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-3">
                          <h3 className="font-semibold text-white text-sm truncate">
                            {related.name}
                          </h3>
                          {related.genre && (
                            <p className="text-xs text-white/50 mt-1">{related.genre}</p>
                          )}
                        </div>
                      </GlowCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          )}

          <div className="mt-8">
            <Link href="/vertical/lore">
              <motion.button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Titles
              </motion.button>
            </Link>
          </div>
        </div>
      ) : null}

      <AppFooter />
    </div>
  );
}

const LazyTitleDetailPage = lazy(() => Promise.resolve({ default: TitleDetailPageContent }));

export default function TitleDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyTitleDetailPage />
    </Suspense>
  );
}
