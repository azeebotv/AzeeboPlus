'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

interface ResultData {
  id: string;
  title: string;
  type: 'poll' | 'quiz';
  totalVotes: number;
  totalParticipants: number;
  options: { id: string; label: string; votes: number; percentage: number; isCorrect?: boolean }[];
  correctAnswer?: string;
  userAnswer?: string;
  userCorrect?: boolean;
  pointsEarned?: number;
}

function ParticipationResultContent(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('participation-result');
  }, []);

  const query = useQuery({
    queryKey: ['participation', 'result', id],
    queryFn: async () => {
      const res = await api.request<ResultData>(`/api/v1/participation/${id}/result`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Result not found');
    },
    enabled: Boolean(id),
  });

  const result = query.data;

  if (query.isLoading) {
    return (
      <PageShell activeNav="Reality">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton height="36px" width="200px" />
          <Skeleton height="360px" borderRadius="24px" />
        </div>
      </PageShell>
    );
  }

  if (query.error || !result) {
    return (
      <PageShell activeNav="Reality">
        <ErrorState
          title="Result Not Found"
          description={query.error?.message || 'Could not load community poll or quiz results.'}
          buttonText="Return to Community"
          onButtonPress={() => query.refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Reality" glowColor="rgba(227, 30, 36, 0.2)">
      <div className="mb-6">
        <Link
          href="/vote"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink/60 hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Voting & Trivia
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <PageHero
          eyebrow={`FINAL ${result.type.toUpperCase()} RESULTS`}
          eyebrowColor={result.type === 'quiz' ? 'var(--brand-purple)' : 'var(--color-az-flame)'}
          badge={`${result.totalParticipants.toLocaleString()} PARTICIPANTS`}
          title={result.title}
          subtitle="Official verified consensus and score metrics from the Azeebo+ audience."
          glowColor="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
        />

        {/* User outcome banner */}
        {result.userAnswer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-3xl mb-8 flex items-center justify-between gap-4 border ${
              result.userCorrect
                ? 'bg-az-success-500/15 border-az-success-500/30'
                : 'bg-az-error-500/15 border-az-error-500/30'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {result.userCorrect ? (
                <CheckCircle2 className="w-8 h-8 text-az-success-400 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-az-error-400 shrink-0" />
              )}
              <div>
                <p
                  className={`text-lg font-bold ${
                    result.userCorrect ? 'text-az-success-400' : 'text-az-error-300'
                  }`}
                >
                  {result.userCorrect ? 'Correct Submission!' : 'Incorrect Answer'}
                </p>
                <p className="text-xs sm:text-sm text-az-ink/60">
                  {result.userCorrect
                    ? 'Your answer aligned with the verified answer key.'
                    : 'Better luck next time! Review the breakdown below.'}
                </p>
              </div>
            </div>

            {result.pointsEarned !== undefined && result.pointsEarned > 0 && (
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-az-warning-500/20 text-az-warning-400 font-extrabold text-sm border border-az-warning-500/30">
                  <Sparkles className="w-4 h-4 text-az-warning-400" />+{result.pointsEarned} Pts
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Options Breakdown */}
        <div className="space-y-4">
          {result.options.map((option, index) => {
            const isUserAnswer = option.id === result.userAnswer;
            const isCorrectAnswer = Boolean(option.isCorrect);

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`az-glass p-5 sm:p-6 border transition-all ${
                  isCorrectAnswer ? '' : isUserAnswer ? '' : 'border-az-glass-border'
                }`}
              >
                <div className="flex justify-between items-center mb-2 gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-az-ink font-bold text-base">{option.label}</span>
                    {isCorrectAnswer && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-az-success-500/20 text-az-success-400 border border-az-success-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Correct Key
                      </span>
                    )}
                    {isUserAnswer && !isCorrectAnswer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-az-error-500/20 text-az-error-400 border border-az-error-500/30">
                        Your Choice
                      </span>
                    )}
                  </div>

                  <span className="text-az-ink/80 font-bold text-sm">
                    {option.percentage}%{' '}
                    <span className="text-az-ink/40 text-xs font-normal">
                      ({option.votes.toLocaleString()} votes)
                    </span>
                  </span>
                </div>

                {/* Meter */}
                <div className="w-full bg-az-glass-card rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${option.percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: isCorrectAnswer
                        ? 'linear-gradient(90deg, var(--brand-emerald) 0%, #059669 100%)'
                        : isUserAnswer
                          ? 'linear-gradient(90deg, var(--color-az-error-500) 0%, #b91c1c 100%)'
                          : 'linear-gradient(90deg, var(--color-az-flame) 0%, var(--color-az-scarlet) 100%)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ParticipationResultContent }));
export default function ParticipationResultPage(): React.JSX.Element {
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
