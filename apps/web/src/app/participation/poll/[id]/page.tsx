'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, CheckCircle2, Vote, Clock, Users } from 'lucide-react';
import analytics from '@/lib/analytics';

/**
 * Community fan poll — backed by lifestyle-service:
 *   GET  /v1/polls/:id        → { poll: { id, title, description, status, totalVotes, expiresAt, options[] } }
 *   POST /v1/polls/:id/vote   → { optionId } (auth required)
 * `apiFetch` normalizes to /api/v1/... which the Next rewrite forwards to the gateway.
 */

interface PollOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  voteCount: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  totalVotes: number;
  expiresAt?: string | null;
  options: PollOption[];
}

export default function PollDetailPage(): React.JSX.Element {
  const params = useParams();
  const pollId = params.id as string;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('participation-poll');
  }, []);

  const {
    data: poll,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: async () => {
      const res = await apiFetch<{ poll: Poll }>(`/v1/polls/${pollId}`);
      return res.success && res.data ? res.data.poll : null;
    },
    enabled: Boolean(pollId),
  });

  const voteMutation = useMutation({
    mutationFn: (optionId: string) =>
      apiFetch(`/v1/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poll', pollId] }),
  });

  if (error) {
    return (
      <PageShell activeNav="Reality">
        <ErrorState
          title="Failed to load poll"
          description="Could not load the requested fan poll. Please try again."
          buttonText="Retry"
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  const isExpired = poll ? Boolean(poll.expiresAt && new Date(poll.expiresAt) < new Date()) || poll.status === 'closed' : false;
  const hasVoted = voteMutation.isSuccess;

  return (
    <PageShell activeNav="Reality" glowColor="rgba(232, 66, 10, 0.2)">
      <div className="mb-6">
        <Link
          href="/participation"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Participation
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="36px" width="200px" />
            <Skeleton height="280px" borderRadius="24px" />
          </div>
        ) : !poll ? (
          <ErrorState
            title="Poll Not Found"
            description="This poll may have concluded or been removed."
            buttonText="Browse Community Activities"
            onButtonPress={() => refetch()}
          />
        ) : (
          <>
            <PageHero
              eyebrow="COMMUNITY INTERACTION"
              eyebrowColor="var(--brand-orange)"
              badge={hasVoted ? 'VOTE RECORDED' : isExpired ? 'ENDED' : 'LIVE POLL'}
              title={poll.title}
              subtitle={poll.description || 'Cast your vote and see real-time audience opinions.'}
              glowColor="rgba(232, 66, 10, 0.25)"
            />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(24, 21, 30, 0.9) 0%, rgba(35, 18, 14, 0.4) 100%)',
              }}
            >
              {/* Poll stats metadata */}
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/10 mb-6 text-xs sm:text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--brand-orange)]" />
                  <span className="font-semibold text-white">{poll.totalVotes.toLocaleString()}</span>{' '}
                  verified votes
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span>
                    {isExpired
                      ? 'Voting concluded'
                      : poll.expiresAt
                        ? `Closes ${new Date(poll.expiresAt).toLocaleDateString()}`
                        : 'No end date'}
                  </span>
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-3.5">
                {poll.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const pct =
                    poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
                  return (
                    <button
                      key={option.id}
                      disabled={hasVoted || isExpired || !isAuthenticated}
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-lg'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      {/* Live Fill bar behind option */}
                      {hasVoted && (
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--brand-orange)]/20 to-transparent transition-all duration-700 pointer-events-none"
                          style={{ width: `${pct}%` }}
                        />
                      )}

                      <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]'
                                : 'border-white/30 group-hover:border-white/60'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="font-semibold text-white text-sm sm:text-base">
                            {option.text}
                          </span>
                        </div>

                        {hasVoted && (
                          <span className="text-sm font-bold text-white/90 shrink-0">{pct}%</span>
                        )}
                      </div>

                      {hasVoted && (
                        <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden relative z-10">
                          <div
                            className="bg-gradient-to-r from-[var(--brand-orange)] to-[#cc1c1c] h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action State */}
              {isAuthenticated && !hasVoted && !isExpired && (
                <button
                  onClick={() => selectedOption && voteMutation.mutate(selectedOption)}
                  disabled={voteMutation.isPending || !selectedOption}
                  className="w-full mt-6 az-btn-primary flex items-center justify-center gap-2 shadow-xl"
                >
                  {voteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Vote...
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      Confirm &amp; Submit Vote
                    </>
                  )}
                </button>
              )}

              {voteMutation.isError && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm font-semibold text-center">
                  Your vote could not be recorded — please try again.
                </div>
              )}

              {hasVoted && (
                <div className="mt-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Your vote has been recorded.
                </div>
              )}

              {!isAuthenticated && (
                <div className="az-glass p-4 rounded-xl text-center mt-6 border border-white/10">
                  <p className="text-white/60 text-sm">
                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(`/participation/poll/${pollId}`)}`}
                      className="text-[var(--brand-orange)] font-bold hover:underline"
                    >
                      Sign in to your account
                    </Link>{' '}
                    to participate in this community poll.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </PageShell>
  );
}
