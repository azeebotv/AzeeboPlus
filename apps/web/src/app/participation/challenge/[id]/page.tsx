'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Rocket,
  CheckCircle2,
  Award,
  ListChecks,
} from 'lucide-react';
import analytics from '@/lib/analytics';

/**
 * Community challenge detail — backed by lifestyle-service:
 *   GET  /v1/challenges/:id         → { challenge: { ...fields, submissions[] } } (public read)
 *   POST /v1/challenges/:id/submit  → { content, mediaUrl? } (auth required)
 */

interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  type: string;
  status: string;
  rules?: string | null;
  prize?: string | null;
  startDate: string;
  endDate: string;
  participantCount: number;
  submissions?: { id: string; content: string; mediaUrl?: string | null; votes: number }[];
}

function ChallengeDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    analytics.pageView('challenge-detail');
  }, []);

  const query = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const res = await api.request<{ challenge: Challenge }>(`/api/v1/challenges/${id}`);
      if (res.success && res.data) return res.data.challenge;
      throw new Error(res.message || 'Challenge not found');
    },
    enabled: Boolean(id),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const challenge = query.data;
      const res = await api.request(`/api/v1/challenges/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: `Entry for ${challenge?.title ?? 'challenge'}` }),
      });
      if (!res.success) throw new Error(res.message || 'Submission failed');
      return res;
    },
    onSuccess: () => setSubmitted(true),
  });

  const challenge = query.data;

  if (query.isLoading) {
    return (
      <PageShell activeNav="Reality">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton height="36px" width="200px" />
          <Skeleton height="400px" borderRadius="24px" />
        </div>
      </PageShell>
    );
  }

  if (query.error || !challenge) {
    return (
      <PageShell activeNav="Reality">
        <ErrorState
          title="Challenge Not Found"
          description={
            query.error?.message || 'This community challenge may have concluded or been removed.'
          }
          buttonText="Browse Challenges"
          onButtonPress={() => query.refetch()}
        />
      </PageShell>
    );
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000)
  );
  const isActive = challenge.status === 'active' && daysLeft > 0;

  return (
    <PageShell activeNav="Reality" glowColor="rgba(227, 30, 36, 0.2)">
      <div className="mb-6">
        <Link
          href="/participation"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Participation
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <PageHero
          eyebrow="COMMUNITY CHALLENGE"
          eyebrowColor="var(--color-az-flame)"
          badge={challenge.prize ? `${challenge.prize} PRIZE` : challenge.type.toUpperCase()}
          title={challenge.title}
          subtitle={challenge.description}
          glowColor="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
        />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 mt-6"
        >
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="az-glass p-5 text-center border border-az-glass-border">
              <Trophy className="w-5 h-5 text-az-warning-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-az-ink">
                {challenge.prize || '—'}
              </p>
              <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mt-1">
                Prize
              </p>
            </div>

            <div className="az-glass p-5 text-center border border-az-glass-border">
              <Users className="w-5 h-5 text-[var(--color-az-flame)] mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-az-ink">
                {(
                  challenge.participantCount ??
                  challenge.submissions?.length ??
                  0
                ).toLocaleString()}
              </p>
              <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mt-1">
                Participants
              </p>
            </div>

            <div className="az-glass p-5 text-center border border-az-glass-border">
              <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-az-ink">{daysLeft} Days</p>
              <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mt-1">
                Time Remaining
              </p>
            </div>

            <div className="az-glass p-5 text-center border border-az-glass-border">
              <Award className="w-5 h-5 text-az-success-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-az-ink capitalize">
                {challenge.type}
              </p>
              <p className="text-xs text-az-ink/50 uppercase tracking-wider font-semibold mt-1">
                Format
              </p>
            </div>
          </div>

          {/* Rules */}
          {challenge.rules && (
            <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-[var(--color-az-flame)]" />
                <h2 className="az-headline text-lg sm:text-xl text-az-ink">
                  Entry Criteria &amp; Rules
                </h2>
              </div>
              <p className="text-sm text-az-ink/70 leading-relaxed whitespace-pre-line">
                {challenge.rules}
              </p>
            </div>
          )}

          {/* Recent submissions */}
          {(challenge.submissions?.length ?? 0) > 0 && (
            <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[var(--color-az-flame)]" />
                <h2 className="az-headline text-lg sm:text-xl text-az-ink">Top Submissions</h2>
              </div>
              <div className="divide-y divide-az-ink/5">
                {challenge.submissions!.slice(0, 10).map((s, i) => (
                  <div key={s.id} className="flex justify-between items-center py-3.5 gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-az-warning-500/10 text-az-warning-400 text-xs font-bold flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-semibold text-az-ink/80 truncate">
                        {s.content}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-az-warning-400 shrink-0">
                      {s.votes} votes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Action */}
          {submitted ? (
            <div className="p-5 rounded-2xl bg-az-success-500/15 border border-az-success-500/30 flex items-center justify-center gap-3 text-az-success-400 font-bold text-center">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>Official entry confirmed! Track your status in your Creator Dashboard.</span>
            </div>
          ) : isActive && isAuthenticated ? (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="az-btn-primary flex items-center justify-center gap-2.5 shadow-2xl"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-az-ink border-t-transparent rounded-full animate-spin" />
                  Registering Entry...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" /> Submit Your Official Entry
                </>
              )}
            </button>
          ) : isActive && !isAuthenticated ? (
            <div className="p-5 rounded-2xl bg-az-glass-fill border border-az-glass-border text-center text-az-ink/70 text-sm font-medium">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/participation/challenge/${id}`)}`}
                className="text-[var(--color-az-flame)] font-bold hover:underline"
              >
                Sign in
              </Link>{' '}
              to submit your entry to this challenge.
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-az-glass-fill border border-az-glass-border text-center text-az-ink/50 text-sm font-medium">
              This challenge is currently {daysLeft <= 0 ? 'closed' : challenge.status}.
            </div>
          )}

          {submitMutation.isError && (
            <div className="p-4 rounded-2xl bg-az-error-500/10 border border-az-error-500/25 text-center text-az-error-400 text-sm font-semibold">
              {submitMutation.error?.message || 'Entry could not be submitted — please try again.'}
            </div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ChallengeDetailContent }));
export default function ChallengeDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-az-surface-root)]">
          <div className="w-10 h-10 border-2 border-az-ink/20 border-t-[var(--color-az-flame)] rounded-full animate-spin" />
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
