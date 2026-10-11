'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface CharacterDetail {
  id: string;
  name: string;
  description: string;
  bio: string;
  avatar: string;
  universe?: string;
  storyworld?: string;
  firstAppearance?: string;
  appearances?: ContentItem[];
}

function CharacterDetailContent(): React.JSX.Element {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    analytics.pageView('vertical-character-detail');
  }, []);

  const characterQuery = useQuery({
    queryKey: ['vertical-character', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Character slug is required');
      const res = await api.request<CharacterDetail>(`/api/v1/vertical/characters/${slug}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load character');
    },
    enabled: !!slug,
    staleTime: 60000,
  });

  const character = characterQuery.data;
  const isLoading = characterQuery.isLoading;
  const error = characterQuery.error?.message;

  return (
    <PageShell activeNav="Vertical" maxWidth="2xl">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load character"
            description={error}
            onButtonPress={() => characterQuery.refetch()}
          />
        </div>
      ) : character ? (
        <section className="relative">
          <div className="relative mb-6 h-[400px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[500px]">
            <OptimizedImage
              src={character.avatar}
              alt={character.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 az-scrim--hero" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Link href="/vertical" className="az-caption text-az-flame hover:underline">
                    Vertical
                  </Link>
                  {character.storyworld && (
                    <>
                      <span className="az-caption text-az-ink/30">/</span>
                      <span className="az-caption text-az-ink/60">{character.storyworld}</span>
                    </>
                  )}
                </div>
                <h1 className="az-heading mb-3 text-az-ink sm:az-display">{character.name}</h1>
                {character.universe && (
                  <span className="az-overline rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                    {character.universe}
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {character && (
        <section className="mx-auto max-w-4xl py-2 sm:py-4">
          <ScrollReveal>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <h2 className="az-section-title mb-4 text-az-ink">About</h2>
                <p className="az-lead leading-relaxed text-az-ink/70">{character.description}</p>
                <div className="az-lead mt-6 leading-relaxed whitespace-pre-wrap text-az-ink/60">
                  {character.bio}
                </div>
              </div>
              <div>
                <GlowCard universe="vertical">
                  <div className="space-y-4 p-5">
                    <h3 className="az-overline text-az-ink-muted">Details</h3>
                    {character.storyworld && (
                      <div>
                        <p className="az-micro-label text-az-ink/40">Storyworld</p>
                        <p className="az-body text-az-ink">{character.storyworld}</p>
                      </div>
                    )}
                    {character.firstAppearance && (
                      <div>
                        <p className="az-micro-label text-az-ink/40">First Appearance</p>
                        <p className="az-body text-az-ink">{character.firstAppearance}</p>
                      </div>
                    )}
                  </div>
                </GlowCard>
              </div>
            </div>
          </ScrollReveal>

          {character.appearances && character.appearances.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="az-section-title mb-6 text-az-ink">Appearances</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {character.appearances.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="vertical" className="overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <h3 className="az-body-strong truncate text-az-ink">{item.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

const LazyCharacterDetail = lazy(() => Promise.resolve({ default: CharacterDetailContent }));

export default function CharacterDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyCharacterDetail />
    </Suspense>
  );
}
