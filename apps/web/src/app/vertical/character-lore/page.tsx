'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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

function CharacterLorePageContent(): React.JSX.Element {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'lore' | 'relationships' | 'timeline'>(
    'profile'
  );

  useEffect(() => {
    analytics.pageView('vertical-character-lore');
  }, []);

  const charactersQuery = useQuery({
    queryKey: ['vertical-characters'],
    queryFn: async () => {
      const res = await api.request<Character[]>('/api/v1/vertical/characters');
      if (res.success && res.data) return res.data;
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

  const getImportanceStyle = (importance: string) => {
    switch (importance) {
      case 'critical':
        return { bg: 'rgba(239,68,68,0.2)', text: '#EF4444' };
      case 'major':
        return { bg: 'rgba(245,158,11,0.2)', text: '#F59E0B' };
      default:
        return { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Vertical" />

      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Character Lore
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Explore the rich backstories and relationships of your favorite characters
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ScrollReveal>
              <h2 className="text-xl font-bold text-white mb-4">Characters</h2>
            </ScrollReveal>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="az-glass p-3 rounded-xl flex items-center gap-3">
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
                {characters.map((char) => (
                  <motion.button
                    key={char.id}
                    type="button"
                    onClick={() => {
                      setSelectedCharacter(char.id);
                      setActiveTab('profile');
                    }}
                    className="w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor:
                        selectedCharacter === char.id
                          ? 'rgba(232,66,10,0.15)'
                          : 'rgba(255,255,255,0.03)',
                      border:
                        selectedCharacter === char.id
                          ? '1px solid rgba(232,66,10,0.3)'
                          : '1px solid rgba(255,255,255,0.06)',
                    }}
                    whileHover={{ x: 4 }}
                  >
                    <OptimizedImage
                      src={char.avatar}
                      alt={char.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{char.name}</p>
                      <p className="text-xs text-white/50 truncate">{char.title}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {!selectedCharacter ? (
              <div className="az-glass p-12 text-center rounded-xl">
                <p className="text-white/50 text-lg">Select a character to explore their lore</p>
              </div>
            ) : characterDetailQuery.isLoading ? (
              <div className="az-glass p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-6">
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
                <div className="flex items-center gap-4 mb-6">
                  <OptimizedImage
                    src={character.avatar}
                    alt={character.name}
                    width={100}
                    height={100}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{character.name}</h2>
                    <p className="text-[#E8420A]">{character.title}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {(['profile', 'lore', 'relationships', 'timeline'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize whitespace-nowrap"
                      style={{
                        backgroundColor:
                          activeTab === tab ? 'rgba(232,66,10,0.2)' : 'rgba(255,255,255,0.05)',
                        color: activeTab === tab ? '#E8420A' : 'rgba(255,255,255,0.6)',
                        border:
                          activeTab === tab
                            ? '1px solid rgba(232,66,10,0.3)'
                            : '1px solid transparent',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'profile' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">About</h3>
                      <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                        {character.description}
                      </p>
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'lore' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Lore Entries</h3>
                      {character.loreEntries && character.loreEntries.length > 0 ? (
                        <div className="space-y-4">
                          {character.loreEntries.map((entry) => {
                            const style = getImportanceStyle(entry.importance);
                            return (
                              <div
                                key={entry.id}
                                className="p-4 rounded-lg"
                                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-white">{entry.title}</h4>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                                    style={{ backgroundColor: style.bg, color: style.text }}
                                  >
                                    {entry.importance}
                                  </span>
                                </div>
                                <p className="text-sm text-white/70 mb-2">{entry.content}</p>
                                <p className="text-xs text-white/40">Source: {entry.source}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-white/50 text-center py-8">No lore entries available</p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'relationships' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Relationships</h3>
                      {character.relationships && character.relationships.length > 0 ? (
                        <div className="space-y-3">
                          {character.relationships.map((rel) => (
                            <div
                              key={rel.id}
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                            >
                              <OptimizedImage
                                src={rel.characterAvatar}
                                alt={rel.characterName}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white">{rel.characterName}</p>
                                <p className="text-xs text-[#E8420A]">{rel.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-center py-8">No relationships available</p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}

                {activeTab === 'timeline' && (
                  <ScrollReveal>
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Timeline</h3>
                      {character.timeline && character.timeline.length > 0 ? (
                        <div className="relative pl-6">
                          <div
                            className="absolute left-2 top-0 bottom-0 w-0.5"
                            style={{ backgroundColor: 'rgba(232,66,10,0.3)' }}
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
                                className="absolute -left-4 top-1 w-3 h-3 rounded-full"
                                style={{ backgroundColor: 'var(--brand-orange)' }}
                              />
                              <div className="pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-[#E8420A] font-semibold">
                                    {event.date}
                                  </span>
                                  {event.era && (
                                    <span className="text-xs text-white/40">• {event.era}</span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-white mb-1">{event.event}</h4>
                                <p className="text-sm text-white/60">{event.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-center py-8">
                          No timeline events available
                        </p>
                      )}
                    </GlowCard>
                  </ScrollReveal>
                )}
              </div>
            ) : (
              <div className="az-glass p-12 text-center rounded-xl">
                <p className="text-white/50">Character not found</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}

const LazyCharacterLorePage = lazy(() => Promise.resolve({ default: CharacterLorePageContent }));

export default function CharacterLorePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyCharacterLorePage />
    </Suspense>
  );
}
