'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Vertical" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
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
          <div className="relative h-[500px]">
            <OptimizedImage
              src={character.avatar}
              alt={character.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Link href="/vertical" className="text-sm text-[#E8420A] hover:underline">
                    Vertical
                  </Link>
                  {character.storyworld && (
                    <>
                      <span className="text-white/30">/</span>
                      <span className="text-sm text-white/60">{character.storyworld}</span>
                    </>
                  )}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{character.name}</h1>
                {character.universe && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                  >
                    {character.universe}
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {character && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                <p className="text-white/70 leading-relaxed">{character.description}</p>
                <div className="mt-6 text-white/60 leading-relaxed whitespace-pre-wrap">
                  {character.bio}
                </div>
              </div>
              <div>
                <GlowCard universe="vertical">
                  <div className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                      Details
                    </h3>
                    {character.storyworld && (
                      <div>
                        <p className="text-xs text-white/40">Storyworld</p>
                        <p className="text-sm text-white">{character.storyworld}</p>
                      </div>
                    )}
                    {character.firstAppearance && (
                      <div>
                        <p className="text-xs text-white/40">First Appearance</p>
                        <p className="text-sm text-white">{character.firstAppearance}</p>
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
                <h2 className="text-2xl font-bold text-white mb-6">Appearances</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {character.appearances.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="vertical" className="overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <AppFooter />
    </div>
  );
}

const LazyCharacterDetail = lazy(() => Promise.resolve({ default: CharacterDetailContent }));

export default function CharacterDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyCharacterDetail />
    </Suspense>
  );
}
