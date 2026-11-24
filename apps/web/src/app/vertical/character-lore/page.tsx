'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Character {
  id: string;
  name: string;
  avatar: string;
  title: string;
  description: string;
  relationships?: Relationship[];
  timeline?: TimelineEvent[];
  loreEntries?: LoreEntry[];
}

interface Relationship {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  type: string;
  description: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  description: string;
  era?: string;
}

interface LoreEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  importance: 'minor' | 'major' | 'critical';
}

/* Lore weight is a severity signal, so it rides the semantic status ramp: the
   token class carries both the tinted fill and the matching text colour. */
const IMPORTANCE_CLASSES: Record<LoreEntry['importance'], string> = {
  critical: 'bg-az-error-500/20 text-az-error-400',
  major: 'bg-az-warning-500/20 text-az-warning-400',
  minor: 'bg-az-ink/10 text-az-ink/60',
};

const TABS = ['profile', 'lore', 'relationships', 'timeline'] as const;
type LoreTab = (typeof TABS)[number];

function CharacterLorePageContent(): React.JSX.Element {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LoreTab>('profile');

  useEffect(() => {
    analytics.pageView('vertical-character-lore');
  }, []);

  const charactersQuery = useQuery({
    queryKey: ['vertical-characters'],
    queryFn: async () => {
      const res = await api.request<Character[] | { items?: Character[] }>(
        '/api/v1/vertical/characters'
      );
      if (res.success && res.data) {
        const d = res.data;
        return Array.isArray(d) ? d : d.items || [];
      }
      throw new Error(res.message || 'Failed to load characters');
    },
    staleTime: 60000,
  });

  const characterDetailQuery = useQuery({
    queryKey: ['vertical-character-detail', selectedCharacter],
    queryFn: async () => {
      const res = await api.request<Character>(`/api/v1/vertical/characters/${selectedCharacter}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load character');
    },
    enabled: !!selectedCharacter,
    staleTime: 30000,
  });

  const characters: Character[] = charactersQuery.data ?? [];
  const character: Character | undefined = characterDetailQuery.data;
  const isLoading = charactersQuery.isLoading;
  const error = charactersQuery.error?.message;

  const getImportanceClass = (importance: LoreEntry['importance']) =>
    IMPORTANCE_CLASSES[importance] ?? IMPORTANCE_CLASSES.minor;

  return (
    <PageShell
      activeNav="Vertical"
      glowColor="color-mix(in srgb, var(--color-az-flame) 18%, transparent)"
    >
      <PageHero
        eyebrow="Vertical"
        title="Character Lore"
        subtitle="Explore the rich backstories and relationships of your favorite characters"
        glowColor="color-mix(in srgb, var(--color-az-scarlet) 22%, transparent)"
      />

      <section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <ScrollReveal>
              <h2 className="az-title mb-4 text-az-ink">Characters</h2>
            </ScrollReveal>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`character-skeleton-${i}`}
                    className="az-glass flex items-center gap-3 p-3"
                  >
                    <Skeleton width="48px" height="48px" borderRadius="50%" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height="14px" width="70%" />
                      <Skeleton height="10px" width="50%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to load characters"
                description={error}
                onButtonPress={() => charactersQuery.refetch()}
              />
            ) : (
              <div className="space-y-2">
                {characters.map((char) => {
                  const isSelected = selectedCharacter === char.id;
                  return (
                    <motion.button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSelectedCharacter(char.id);
                        setActiveTab('profile');
                      }}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-az-card border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-az-scarlet/30 bg-az-scarlet/15'
                          : 'border-az-glass-border bg-az-glass-fill hover:border-az-glass-border-hover'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <OptimizedImage
                        src={char.avatar}
                        alt={char.name}
                        width={48}
                        height={48}
                        className="size-12 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="az-body-strong truncate text-az-ink">{char.name}</p>
                        <p className="az-caption truncate text-az-ink/50">{char.title}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {!selectedCharacter ? (
              <div className="az-glass p-12 text-center">
                <p className="az-lead text-az-ink/50">Select a character to explore their lore</p>
              </div>
            ) : characterDetailQuery.isLoading ? (
              <div className="az-glass p-6">
                <div className="mb-6 flex items-center gap-4">
                  <Skeleton width="100px" height="100px" borderRadius="50%" />
                  <div className="space-y-2">
                    <Skeleton height="28px" width="200px" />
                    <Skeleton height="16px" width="150px" />
                  </div>
                </div>
                <Skeleton height="150px" />
              </div>
            ) : character ? (
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <OptimizedImage
                    src={character.avatar}
                    alt={character.name}
                    width={100}
                    height={100}
                    className="size-20 rounded-full object-cover sm:size-24"
                  />
                  <div>
                    <h2 className="az-section-title text-az-ink sm:az-heading">{character.name}</h2>
                    <p className="az-body text-az-flame">{character.title}</p>
                  </div>
                </div>

                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        aria-pressed={isActive}
                        className={`az-body-strong shrink-0 whitespace-nowrap rounded-az-pill border px-4 py-2 capitalize transition-all ${
                          isActive
                            ? 'border-az-scarlet/30 bg-az-scarlet/20 text-az-flame'
                            : 'border-transparent bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {activeTab === 'profile' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="az-subtitle mb-4 text-az-ink">About</h3>
                      <p className="az-lead whitespace-pre-wrap text-az-ink/70">
                        {character.description}
                      </p>
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'lore' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="az-subtitle mb-4 text-az-ink">Lore Entries</h3>
                      {character.loreEntries && character.loreEntries.length > 0 ? (
                        <div className="space-y-4">
                          {character.loreEntries.map((entry) => (
                            <div key={entry.id} className="rounded-az-card bg-az-ink/5 p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <h4 className="az-body-strong text-az-ink">{entry.title}</h4>
                                <span
                                  className={`az-micro-label rounded-az-pill px-2 py-0.5 ${getImportanceClass(
                                    entry.importance
                                  )}`}
                                >
                                  {entry.importance}
                                </span>
                              </div>
                              <p className="az-body mb-2 text-az-ink/70">{entry.content}</p>
                              <p className="az-caption text-az-ink/40">Source: {entry.source}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="az-body py-8 text-center text-az-ink/50">
                          No lore entries available
                        </p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'relationships' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="az-subtitle mb-4 text-az-ink">Relationships</h3>
                      {character.relationships && character.relationships.length > 0 ? (
                        <div className="space-y-3">
                          {character.relationships.map((rel) => (
                            <div
                              key={rel.id}
                              className="flex items-center gap-3 rounded-az-card bg-az-ink/5 p-3"
                            >
                              <OptimizedImage
                                src={rel.characterAvatar}
                                alt={rel.characterName}
                                width={48}
                                height={48}
                                className="size-12 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="az-body-strong text-az-ink">{rel.characterName}</p>
                                <p className="az-caption text-az-flame">{rel.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="az-body py-8 text-center text-az-ink/50">
                          No relationships available
                        </p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'timeline' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="az-subtitle mb-4 text-az-ink">Timeline</h3>
                      {character.timeline && character.timeline.length > 0 ? (
                        <div className="relative pl-6">
                          <div
                            className="absolute top-0 bottom-0 left-2 w-0.5 bg-az-scarlet/30"
                            aria-hidden="true"
                          />
                          {character.timeline.map((event, index) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.1 }}
                              className="relative mb-6 last:mb-0"
                            >
                              <div
                                className="absolute top-1 -left-4 size-3 rounded-full bg-az-flame"
                                aria-hidden="true"
                              />
                              <div className="pl-4">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="az-caption text-az-flame">{event.date}</span>
                                  {event.era && (
                                    <span className="az-caption text-az-ink/40">• {event.era}</span>
                                  )}
                                </div>
                                <h4 className="az-body-strong mb-1 text-az-ink">{event.event}</h4>
                                <p className="az-body text-az-ink/60">{event.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="az-body py-8 text-center text-az-ink/50">
                          No timeline events available
                        </p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}
              </div>
            ) : (
              <div className="az-glass p-12 text-center">
                <p className="az-body text-az-ink/50">Character not found</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const LazyCharacterLorePage = lazy(() => Promise.resolve({ default: CharacterLorePageContent }));

export default function CharacterLorePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyCharacterLorePage />
    </Suspense>
  );
}
