'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
}

interface WalletBalance {
  balance: number;
  currency: string;
}

const VOTE_QUANTITIES = [1, 5, 10, 25, 50, 100];

function VotingPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [voteQuantity, setVoteQuantity] = useState(1);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    analytics.pageView('reality-voting');
  }, []);

  const contestantsQuery = useQuery({
    queryKey: ['reality-contestants'],
    queryFn: async () => {
      const res = await api.reality.getContestants('current');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load contestants');
    },
    staleTime: 15000,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet', 'balance:object'],
    queryFn: async () => {
      const res = await api.request<WalletBalance>('/api/v1/wallet/balance');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load balance');
    },
    staleTime: 30000,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ contestantId, quantity }: { contestantId: string; quantity: number }) => {
      const res = await api.request('/api/v1/reality/votes/quantity', {
        method: 'POST',
        body: JSON.stringify({ contestantId, quantity }),
      });
      if (!res.success) throw new Error(res.message || 'Failed to submit vote');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reality-contestants'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance:object'] });
      setVoteSuccess(true);
      setTimeout(() => setVoteSuccess(false), 3000);
      setSelectedContestant(null);
      setVoteQuantity(1);
    },
  });

  const contestants: Contestant[] = contestantsQuery.data ?? [];
  const wallet = walletQuery.data ?? { balance: 0, currency: 'pts' };
  const maxVotes = Math.max(0, ...contestants.map((c) => c.votes));
  const isLoading = contestantsQuery.isLoading || walletQuery.isLoading;
  const error = contestantsQuery.error?.message;

  const handleVote = useCallback(() => {
    if (!selectedContestant) return;
    voteMutation.mutate({ contestantId: selectedContestant, quantity: voteQuantity });
  }, [selectedContestant, voteQuantity, voteMutation]);

  const getContestantVotes = (contestant: Contestant) => {
    const percentage = maxVotes > 0 ? (contestant.votes / maxVotes) * 100 : 0;
    return { percentage };
  };

  return (
    <PageShell activeNav="Reality">
      <PageHero title="Vote Now" subtitle="Support your favorite contestants and help them win" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScrollReveal>
            <h2 className="az-section-title mb-6 text-az-ink">Contestants</h2>
          </ScrollReveal>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="az-glass p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton width="60px" height="60px" borderRadius="50%" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height="20px" width="50%" />
                      <Skeleton height="12px" width="30%" />
                    </div>
                    <Skeleton width="80px" height="36px" borderRadius="20px" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load contestants"
              description={error}
              onButtonPress={() => contestantsQuery.refetch()}
            />
          ) : (
            <div className="space-y-4">
              {contestants.map((contestant, index) => {
                const { percentage } = getContestantVotes(contestant);
                const isSelected = selectedContestant === contestant.id;
                const isEliminated = contestant.status === 'eliminated';

                return (
                  <motion.div
                    key={contestant.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlowCard
                      universe="reality"
                      className={`p-4 cursor-pointer transition-all ${
                        isEliminated ? 'opacity-50' : ''
                      }`}
                      onClick={() => !isEliminated && setSelectedContestant(contestant.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <OptimizedImage
                            src={contestant.avatar}
                            alt={contestant.name}
                            width={60}
                            height={60}
                            className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
                          />
                          {contestant.status === 'danger' && (
                            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-az-error-500 text-xs text-az-ink">
                              !
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-bold text-az-ink truncate">{contestant.name}</h3>
                            {contestant.status === 'danger' && (
                              <span className="az-micro-label rounded-az-pill bg-az-error-500/20 px-2 py-0.5 text-az-error-500">
                                At Risk
                              </span>
                            )}
                          </div>
                          <p className="az-body text-az-ink-muted">
                            {contestant.votes.toLocaleString()} votes ({percentage.toFixed(1)}%)
                          </p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-az-ink/10">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-az-flame to-az-scarlet"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          aria-pressed={isSelected}
                          disabled={isEliminated}
                          className={`az-body-strong rounded-full px-4 py-2 transition-all disabled:opacity-50 ${
                            isSelected
                              ? 'bg-gradient-to-br from-az-success-500 to-az-success-600 text-az-ink'
                              : 'bg-az-ink/10 text-az-ink/70'
                          }`}
                          whileHover={{ scale: isEliminated ? 1 : 1.05 }}
                          whileTap={{ scale: isEliminated ? 1 : 0.95 }}
                        >
                          {isEliminated ? 'Out' : isSelected ? 'Selected' : 'Vote'}
                        </motion.button>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <ScrollReveal direction="right">
            <div className="sticky top-24 space-y-6">
              <GlowCard className="p-6">
                <h3 className="az-title mb-4 text-az-ink">Your Balance</h3>
                <div className="mb-4 rounded-az-panel bg-gradient-to-br from-az-flame to-az-scarlet p-4 text-az-ink">
                  <p className="text-3xl font-bold">{wallet.balance.toLocaleString()}</p>
                  <p className="az-body text-az-ink/80">{wallet.currency}</p>
                </div>
                <p className="az-caption text-az-ink/40">Vote costs: 1 point per vote</p>
              </GlowCard>

              {selectedContestant && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GlowCard className="p-6">
                    <h3 className="az-title mb-4 text-az-ink">Cast Your Vote</h3>
                    <p className="az-body mb-4 text-az-ink-muted">Select vote quantity:</p>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {VOTE_QUANTITIES.map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          aria-pressed={voteQuantity === qty}
                          onClick={() => setVoteQuantity(qty)}
                          className={`az-body-strong rounded-az-control border py-2 transition-all ${
                            voteQuantity === qty
                              ? 'border-az-scarlet/30 bg-az-scarlet/20 text-az-flame'
                              : 'border-az-ink/10 bg-az-ink/5 text-az-ink/70'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                    <div className="mb-4 flex items-center justify-between rounded-az-control bg-az-ink/5 p-3">
                      <span className="az-body text-az-ink-muted">Total Cost:</span>
                      <span className="font-bold text-az-ink">{voteQuantity} pts</span>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleVote}
                      disabled={voteMutation.isPending || wallet.balance < voteQuantity}
                      className="az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                    </motion.button>
                  </GlowCard>
                </motion.div>
              )}

              <GlowCard className="p-6">
                <h3 className="az-title mb-4 text-az-ink">How Voting Works</h3>
                <div className="space-y-3">
                  {[
                    { icon: '1', title: 'Select a contestant', desc: 'Choose who to vote for' },
                    { icon: '2', title: 'Choose quantity', desc: 'Pick how many votes to cast' },
                    { icon: '3', title: 'Submit vote', desc: 'Confirm your vote submission' },
                  ].map((step) => (
                    <div key={step.title} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-az-scarlet/20 text-xs font-bold text-az-flame">
                        {step.icon}
                      </span>
                      <div>
                        <p className="az-body-strong text-az-ink">{step.title}</p>
                        <p className="az-caption text-az-ink/40">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <AnimatePresence>
        {voteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-az-success-500 px-6 py-3 shadow-lg"
            role="status"
          >
            <p className="az-body-strong text-az-ink">Vote submitted successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

const LazyVotingPage = lazy(() => Promise.resolve({ default: VotingPageContent }));

export default function VotingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="bg-az-surface-root flex min-h-screen items-center justify-center">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyVotingPage />
    </Suspense>
  );
}
