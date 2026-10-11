'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
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

/* Release status is a semantic state, so each badge ships one token class that
   carries both the tinted fill and the matching text colour. */
const STATUS_META: Record<string, { className: string; label: string }> = {
  ongoing: { className: 'bg-az-success-500/20 text-az-success-400', label: 'Ongoing' },
  completed: { className: 'bg-az-ink/15 text-az-ink-muted', label: 'Completed' },
  upcoming: { className: 'bg-az-warning-500/20 text-az-warning-400', label: 'Upcoming' },
};

const TABS = ['episodes', 'characters'] as const;
type TitleTab = (typeof TABS)[number];

function TitleDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TitleTab>('episodes');

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

  const getStatusMeta = (status?: string) =>
    STATUS_META[status ?? ''] ?? { className: 'bg-az-ink/10 text-az-ink/60', label: 'N/A' };

  return (
    <PageShell activeNav="Vertical" maxWidth="2xl">
      {isLoading ? (
        <div className="py-6 sm:py-10">
          <Skeleton height="350px" borderRadius="16px" className="mb-6" />
          <Skeleton height="40px" width="50%" className="mb-4" />
          <Skeleton height="20px" width="30%" className="mb-6" />
          <Skeleton height="200px" />
        </div>
      ) : error ? (
        <div className="py-6 sm:py-10">
          <ErrorState
            title="Failed to load title"
            description={error}
            onButtonPress={() => titleQuery.refetch()}
          />
        </div>
      ) : title ? (
        <div className="py-4 sm:py-6">
          <ScrollReveal>
            <div className="relative mb-6 h-[300px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[400px]">
              {title.banner ? (
                <OptimizedImage
                  src={title.banner}
                  alt={title.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <OptimizedImage
                  src={title.thumbnail}
                  alt={title.name}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 az-scrim--hero" aria-hidden="true" />
              <div className="absolute top-4 left-4 flex gap-2">
                {title.genre && (
                  <span className="az-overline rounded-az-pill bg-az-scarlet/90 px-3 py-1 text-az-ink">
                    {title.genre}
                  </span>
                )}
                {title.status && (
                  <span
                    className={`az-overline rounded-az-pill px-3 py-1 ${getStatusMeta(title.status).className}`}
                  >
                    {getStatusMeta(title.status).label}
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="az-heading mb-2 text-az-ink sm:az-display">{title.name}</h1>
                <div className="az-body flex items-center gap-4 text-az-ink/70">
                  {title.releaseYear && <span>{title.releaseYear}</span>}
                  {title.totalEpisodes && <span>{title.totalEpisodes} episodes</span>}
                  {title.rating && (
                    <span className="flex items-center gap-1">
                      <Star
                        size={14}
                        className="fill-current text-[var(--brand-gold)]"
                        aria-hidden="true"
                      />
                      {title.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="az-glass mb-6 p-6">
              <h2 className="az-subtitle mb-3 text-az-ink">About</h2>
              <p className="az-lead text-az-ink/70">{title.description}</p>
            </div>
          </ScrollReveal>

          <div className="mb-6 flex gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={isActive}
                  className={`az-body-strong rounded-az-pill border px-4 py-2 capitalize transition-all ${
                    isActive
                      ? 'border-az-scarlet/30 bg-az-scarlet/20 text-az-flame'
                      : 'border-transparent bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
                  }`}
                >
                  {tab} ({tab === 'episodes' ? episodes.length : characters.length})
                </button>
              );
            })}
          </div>

          {activeTab === 'episodes' && (
            <ScrollReveal>
              <div className="space-y-4">
                {episodesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`episode-skeleton-${i}`} className="az-glass flex gap-4 p-4">
                      <Skeleton width="120px" height="70px" borderRadius="12px" />
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
                      <GlowCard universe="vertical" className="flex cursor-pointer gap-4 p-4">
                        <div className="relative shrink-0">
                          <OptimizedImage
                            src={episode.thumbnail}
                            alt={episode.title}
                            width={120}
                            height={70}
                            className="h-[70px] w-[120px] rounded-az-card object-cover"
                          />
                          <span className="az-micro-label absolute right-1 bottom-1 rounded-az-control bg-az-surface-root/80 px-1.5 py-0.5 text-az-ink">
                            {formatDuration(episode.duration)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="az-caption mb-1 text-az-flame">
                            Episode {episode.episodeNumber}
                          </p>
                          <h3 className="az-body-strong truncate text-az-ink">{episode.title}</h3>
                          <p className="az-caption mt-1 line-clamp-2 text-az-ink/50">
                            {episode.description}
                          </p>
                          <p className="az-caption mt-2 text-az-ink/30">
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
                  <p className="az-body py-8 text-center text-az-ink/50">No episodes available</p>
                )}
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'characters' && (
            <ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {charactersQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`title-character-skeleton-${i}`}
                      className="az-glass flex items-center gap-3 p-4"
                    >
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
                        <div className="mb-3 flex items-center gap-3">
                          <OptimizedImage
                            src={character.avatar}
                            alt={character.name}
                            width={60}
                            height={60}
                            className="size-14 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="az-body-strong text-az-ink">{character.name}</h3>
                            {character.role && (
                              <span className="az-caption mt-1 inline-block rounded-az-pill bg-az-ink/10 px-2 py-0.5 capitalize text-az-ink/60">
                                {character.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="az-body line-clamp-2 text-az-ink/50">
                          {character.description}
                        </p>
                      </GlowCard>
                    </motion.div>
                  ))
                ) : (
                  <p className="az-body col-span-full py-8 text-center text-az-ink/50">
                    No characters available
                  </p>
                )}
              </div>
            </ScrollReveal>
          )}

          {relatedTitles.length > 0 && (
            <ScrollReveal className="mt-10">
              <h2 className="az-section-title mb-6 text-az-ink">Related Titles</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                          className="h-28 w-full object-cover"
                        />
                        <div className="p-3">
                          <h3 className="az-body-strong truncate text-az-ink">{related.name}</h3>
                          {related.genre && (
                            <p className="az-caption mt-1 text-az-ink/50">{related.genre}</p>
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
                className="az-chip az-body-strong px-6 py-3 text-az-ink transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Titles
              </motion.button>
            </Link>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

const LazyTitleDetailPage = lazy(() => Promise.resolve({ default: TitleDetailPageContent }));

export default function TitleDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyTitleDetailPage />
    </Suspense>
  );
}
