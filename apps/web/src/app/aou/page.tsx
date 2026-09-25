'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { GlowCard } from '@/components/motion/GlowCard';
import { Sparkles, BookOpen, Clock, Shield, ArrowRight } from 'lucide-react';

interface AOUCharacter {
  id: string;
  name: string;
  role: string;
  image?: string;
}

interface AOUTimeline {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface AOUKnowledge {
  totalUnits: number;
  unlockedUnits: number;
  progress: number;
}

export default function AOUHubPage(): React.JSX.Element {
  const {
    data: characters,
    isLoading: loadingCharacters,
    error: errorCharacters,
    refetch: refetchCharacters,
  } = useQuery({
    queryKey: ['aou', 'characters'],
    queryFn: async () => {
      const res = await apiFetch<AOUCharacter[]>('/v1/knowledge/characters');
      return res.success && res.data ? res.data : null;
    },
  });

  const {
    data: timeline,
    isLoading: loadingTimeline,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['aou', 'timeline'],
    queryFn: async () => {
      const res = await apiFetch<AOUTimeline[]>('/v1/knowledge/timeline');
      return res.success && res.data ? res.data : null;
    },
  });

  const {
    data: knowledge,
    isLoading: loadingKnowledge,
    refetch: refetchKnowledge,
  } = useQuery({
    queryKey: ['aou', 'knowledge'],
    queryFn: async () => {
      const res = await apiFetch<AOUKnowledge>('/v1/knowledge/summary');
      return res.success && res.data ? res.data : null;
    },
  });

  if (errorCharacters) {
    return (
      <PageShell activeNav="Vertical">
        <ErrorState
          title="Failed to load Storyworld"
          description="Could not load Agbalá Olódùmarè lore. Please check your connection."
          buttonText="Retry"
          onButtonPress={() => {
            refetchCharacters();
            refetchTimeline();
            refetchKnowledge();
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Vertical" glowColor="rgba(245, 158, 11, 0.22)">
      {/* Hero Header */}
      <PageHero
        eyebrow="AFRICAN ORIGINAL UNIVERSE"
        eyebrowColor="var(--brand-gold)"
        badge="LORE VAULT"
        title="Agbalá Olódùmarè"
        subtitle="Something to care about. Step into our epic mythological storyworld, discover legendary characters, and unravel the sacred chronicles of the cosmos."
        glowColor="rgba(245, 158, 11, 0.25)"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/aou/what-you-know"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 4px 20px rgba(217, 119, 6, 0.35)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              What You Know
            </Link>
            <Link
              href="/vertical/timeline"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white/90 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              Timeline
            </Link>
          </div>
        }
      />

      {/* Knowledge Progress Card */}
      <section className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="az-glass p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(24, 21, 30, 0.85) 0%, rgba(35, 25, 18, 0.6) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Your Lore Mastery</h2>
                <p className="text-xs sm:text-sm text-white/60">
                  Track unlocked mythological lore and secret codexes
                </p>
              </div>
            </div>

            {loadingKnowledge ? (
              <Skeleton width="80px" height="28px" />
            ) : knowledge ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-400">
                  {knowledge.unlockedUnits}
                </span>
                <span className="text-sm text-white/50">/ {knowledge.totalUnits} Units</span>
              </div>
            ) : null}
          </div>

          {loadingKnowledge ? (
            <Skeleton className="h-3 w-full rounded-full" />
          ) : knowledge ? (
            <div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${knowledge.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #f59e0b 0%, #e8420a 100%)',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-white/50">
                <span>Novice Explorer</span>
                <span className="text-amber-400 font-semibold">{knowledge.progress}% Codex Complete</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/50">Begin reading lore to track your progress.</p>
          )}
        </motion.div>
      </section>

      {/* Characters Section */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="az-label">Dramatis Personae</span>
            <h2 className="az-headline text-2xl sm:text-3xl font-bold text-white">
              Legendary Characters
            </h2>
          </div>
          <Link
            href="/vertical/characters"
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 group"
          >
            <span>View All Characters</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loadingCharacters ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="az-glass h-72 rounded-2xl">
                <Skeleton height="100%" borderRadius="16px" />
              </div>
            ))}
          </div>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {characters.map((char, index) => (
              <Link key={char.id} href={`/aou/characters/${char.id}`}>
                <GlowCard universe="vertical" delay={index * 0.05} className="h-full group">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-white/5">
                    {char.image ? (
                      <img
                        src={char.image}
                        alt={char.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-900/40 via-purple-950/50 to-black flex items-center justify-center text-4xl font-extrabold text-amber-400/80">
                        {char.name[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18151e] via-transparent to-transparent opacity-90" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 border border-white/10 backdrop-blur-md text-amber-300">
                      {char.role}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                      {char.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-1">{char.role}</p>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        ) : (
          <div className="az-glass p-10 text-center rounded-2xl">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-white/60">No characters discovered yet. Check back soon.</p>
          </div>
        )}
      </section>

      {/* Timeline Highlights */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="az-label">Historical Chronicles</span>
            <h2 className="az-headline text-2xl sm:text-3xl font-bold text-white">Chronological Epochs</h2>
          </div>
          <Link
            href="/vertical/timeline"
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 group"
          >
            <span>Full Timeline Codex</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loadingTimeline ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : timeline && timeline.length > 0 ? (
          <div className="space-y-4 relative">
            {/* Connecting luminous thread */}
            <div className="absolute top-6 bottom-6 left-6 w-0.5 bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-transparent hidden sm:block" />

            {timeline.slice(0, 4).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="az-glass p-5 sm:p-6 rounded-2xl flex items-start gap-4 sm:gap-6 relative hover:border-amber-500/30 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-amber-500 mt-1 shrink-0 ring-4 ring-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="font-bold text-white text-base sm:text-lg">{event.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                      {event.date}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
