'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, Vote, ListChecks, Trophy, Clock, Users } from 'lucide-react';
import analytics from '@/lib/analytics';

/**
 * Community Participation hub — aggregates everything a fan can take part in:
 *   GET /v1/polls       → lifestyle-service polls (public read)
 *   GET /v1/quizzes     → lifestyle-service quizzes (public read)
 *   GET /v1/challenges  → lifestyle-service challenges (public read)
 */

interface Paginated<T> {
  success: boolean;
  data: { polls?: T[]; quizzes?: T[]; challenges?: T[] };
}

interface PollRow {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  totalVotes: number;
  expiresAt?: string | null;
}

interface QuizRow {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string;
  playCount: number;
}

interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  prize?: string | null;
  endDate: string;
  participantCount: number;
}

function SectionCard({
  href,
  icon,
  title,
  subtitle,
  meta,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
  meta: React.ReactNode;
  accent: string;
}) {
  return (
    <Link href={href} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="az-glass p-5 border border-az-glass-border transition-all h-full flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
          >
            {icon}
          </div>
          {meta}
        </div>
        <div>
          <h3 className="text-base font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-az-ink/50 mt-1 line-clamp-2 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function ParticipationHubPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('participation-hub');
  }, []);

  const pollsQuery = useQuery({
    queryKey: ['participation', 'polls'],
    queryFn: async () => {
      const res = await fetch('/api/v1/polls?limit=6');
      const json = (await res.json()) as Paginated<PollRow>;
      return json.success ? (json.data.polls ?? []) : [];
    },
  });

  const quizzesQuery = useQuery({
    queryKey: ['participation', 'quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/quizzes?limit=6');
      const json = (await res.json()) as Paginated<QuizRow>;
      return json.success ? (json.data.quizzes ?? []) : [];
    },
  });

  const challengesQuery = useQuery({
    queryKey: ['participation', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/v1/challenges?limit=6&status=active');
      const json = (await res.json()) as Paginated<ChallengeRow>;
      return json.success ? (json.data.challenges ?? []) : [];
    },
  });

  const loading = pollsQuery.isLoading || quizzesQuery.isLoading || challengesQuery.isLoading;
  const errored = pollsQuery.error && quizzesQuery.error && challengesQuery.error;

  return (
    <PageShell activeNav="Reality" glowColor="rgba(227, 30, 36, 0.2)">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <PageHero
        eyebrow="COMMUNITY PARTICIPATION"
        eyebrowColor="var(--color-az-flame)"
        title="Vote, Play & Compete"
        subtitle="Shape the platform with your votes, prove your knowledge in trivia, and win prizes in community challenges."
        glowColor="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
      />

      <div className="max-w-5xl mx-auto mt-10 space-y-12">
        {errored ? (
          <ErrorState
            title="Couldn't load community activities"
            description="Something went wrong reaching the community service. Please try again."
            buttonText="Retry"
            onButtonPress={() => {
              pollsQuery.refetch();
              quizzesQuery.refetch();
              challengesQuery.refetch();
            }}
          />
        ) : loading ? (
          <div className="space-y-8">
            <Skeleton height="32px" width="180px" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height="150px" borderRadius="16px" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Active Challenges */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <Trophy className="w-5 h-5 text-az-warning-400" />
                <h2 className="az-headline text-xl sm:text-2xl font-extrabold text-az-ink">
                  Community Challenges
                </h2>
                <span className="text-xs font-bold text-az-warning-400 bg-az-warning-500/10 border border-az-warning-500/25 rounded-full px-3 py-1">
                  Win Prizes
                </span>
              </div>
              {challengesQuery.data && challengesQuery.data.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challengesQuery.data.map((c) => {
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000)
                    );
                    return (
                      <SectionCard
                        key={c.id}
                        href={`/participation/challenge/${c.id}`}
                        icon={<Trophy className="w-5 h-5 text-az-warning-400" />}
                        accent="bg-az-warning-500/10 border border-az-warning-500/25"
                        title={c.title}
                        subtitle={c.description}
                        meta={
                          <span className="text-[11px] font-bold text-az-warning-400 bg-az-warning-500/10 rounded-full px-2.5 py-1 whitespace-nowrap">
                            {c.prize || c.type.toUpperCase()} · {daysLeft}d left
                          </span>
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-az-ink/40 text-sm">
                  No active challenges right now — check back soon.
                </p>
              )}
            </section>

            {/* Quizzes */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <ListChecks className="w-5 h-5 text-az-category-violet-light" />
                <h2 className="az-headline text-xl sm:text-2xl font-extrabold text-az-ink">
                  Trivia &amp; Quizzes
                </h2>
                <span className="text-xs font-bold text-az-category-violet-light bg-az-category-violet/10 border border-az-category-violet/25 rounded-full px-3 py-1">
                  Earn Points
                </span>
              </div>
              {quizzesQuery.data && quizzesQuery.data.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzesQuery.data.map((q) => (
                    <SectionCard
                      key={q.id}
                      href={`/participation/quiz/${q.id}`}
                      icon={<ListChecks className="w-5 h-5 text-az-category-violet-light" />}
                      accent="bg-az-category-violet/10 border border-az-category-violet/25"
                      title={q.title}
                      subtitle={q.description}
                      meta={
                        <span className="text-[11px] font-bold text-az-category-violet-light bg-az-category-violet/10 rounded-full px-2.5 py-1 whitespace-nowrap capitalize">
                          {q.difficulty} · {q.playCount} plays
                        </span>
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-az-ink/40 text-sm">
                  No quizzes published yet — check back soon.
                </p>
              )}
            </section>

            {/* Polls */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <Vote className="w-5 h-5 text-[var(--color-az-flame)]" />
                <h2 className="az-headline text-xl sm:text-2xl font-extrabold text-az-ink">
                  Fan Polls
                </h2>
                <span className="text-xs font-bold text-az-flame bg-az-flame/10 border border-az-flame/25 rounded-full px-3 py-1">
                  Make Your Voice Heard
                </span>
              </div>
              {pollsQuery.data && pollsQuery.data.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pollsQuery.data.map((p) => {
                    const expired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
                    return (
                      <SectionCard
                        key={p.id}
                        href={`/participation/poll/${p.id}`}
                        icon={<Vote className="w-5 h-5 text-[var(--color-az-flame)]" />}
                        accent="bg-az-flame/10 border border-az-flame/25"
                        title={p.title}
                        subtitle={p.description}
                        meta={
                          <span className="text-[11px] font-bold text-az-flame bg-az-flame/10 rounded-full px-2.5 py-1 whitespace-nowrap inline-flex items-center gap-1">
                            <Users className="w-3 h-3" /> {p.totalVotes} votes
                            {!expired && p.expiresAt ? (
                              <>
                                {' '}
                                · <Clock className="w-3 h-3" /> live
                              </>
                            ) : null}
                          </span>
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-az-ink/40 text-sm">No live polls right now — check back soon.</p>
              )}
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
