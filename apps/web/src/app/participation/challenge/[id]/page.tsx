'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, Trophy, Calendar, Users, Rocket, CheckCircle2, Award, ListChecks } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Challenge {
  id: string;
  title: string;
  description: string;
  universe: string;
  type: 'creative' | 'quiz' | 'prediction' | 'trivia';
  reward: number;
  deadline: string;
  participants: number;
  maxParticipants?: number;
  status: 'active' | 'ended' | 'upcoming';
  requirements: string[];
  prizes: { place: number; reward: number; label: string }[];
}

function ChallengeDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    analytics.pageView('challenge-detail');
  }, []);

  const query = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const res = await api.request<Challenge>(`/api/v1/challenges/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Challenge not found');
    },
    enabled: Boolean(id),
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      api.request(`/api/v1/challenges/${id}/submit`, { method: 'POST' }),
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
          description={query.error?.message || 'This community challenge may have concluded or been removed.'}
          buttonText="Browse Challenges"
          onButtonPress={() => query.refetch()}
        />
      </PageShell>
    );
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / 86400000)
  );

  return (
    <PageShell activeNav="Reality" glowColor="rgba(232, 66, 10, 0.2)">
      <div className="mb-6">
        <Link
          href="/creator/challenges"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Creator & Community Challenges
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <PageHero
          eyebrow={`${challenge.universe.toUpperCase()} CHALLENGE`}
          eyebrowColor="var(--brand-orange)"
          badge={`₦${challenge.reward.toLocaleString()} POOL`}
          title={challenge.title}
          subtitle={challenge.description}
          glowColor="rgba(232, 66, 10, 0.25)"
        />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                ₦{challenge.reward.toLocaleString()}
              </p>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">
                Grand Prize
              </p>
            </div>

            <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
              <Users className="w-5 h-5 text-[var(--brand-orange)] mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-white">
                {challenge.participants.toLocaleString()}
              </p>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">
                Participants
              </p>
            </div>

            <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
              <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-white">{daysLeft} Days</p>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">
                Time Remaining
              </p>
            </div>

            <div className="az-glass p-5 rounded-2xl text-center border border-white/10">
              <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-xl sm:text-2xl font-extrabold text-white capitalize">
                {challenge.type}
              </p>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mt-1">
                Format
              </p>
            </div>
          </div>

          {/* Requirements */}
          {challenge.requirements.length > 0 && (
            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-[var(--brand-orange)]" />
                <h2 className="az-headline text-lg sm:text-xl font-bold text-white">
                  Entry Criteria & Rules
                </h2>
              </div>
              <ul className="space-y-3">
                {challenge.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prize Breakdown */}
          {challenge.prizes.length > 0 && (
            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="az-headline text-lg sm:text-xl font-bold text-white">
                  Prize Distribution
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {challenge.prizes.map((p) => (
                  <div key={p.place} className="flex justify-between items-center py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">
                        #{p.place}
                      </span>
                      <span className="text-sm font-semibold text-white/80">{p.label}</span>
                    </div>
                    <span className="text-base font-extrabold text-amber-400">
                      ₦{p.reward.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Action */}
          {challenge.status === 'active' && !submitted ? (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full az-btn-primary py-4 text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-2xl"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering Entry...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" /> Submit Your Official Entry
                </>
              )}
            </button>
          ) : submitted ? (
            <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center gap-3 text-emerald-400 font-bold text-center">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>Official entry confirmed! Track your status in your Creator Dashboard.</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-white/50 text-sm font-medium">
              This challenge is currently {challenge.status}.
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--hp-bg)]">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--brand-orange)] rounded-full animate-spin" />
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
