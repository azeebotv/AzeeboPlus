'use client';
import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    queryKey: ['wallet-balance'],
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
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Reality" />

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
            Vote Now
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Support your favorite contestants and help them win
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-white mb-6">Contestants</h2>
            </ScrollReveal>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="az-glass p-4 rounded-xl">
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
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                            />
                            {contestant.status === 'danger' && (
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                                !
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white truncate">{contestant.name}</h3>
                              {contestant.status === 'danger' && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: 'rgba(239,68,68,0.2)',
                                    color: '#EF4444',
                                  }}
                                >
                                  At Risk
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/50">
                              {contestant.votes.toLocaleString()} votes ({percentage.toFixed(1)}%)
                            </p>
                            <div
                              className="h-2 rounded-full overflow-hidden mt-2"
                              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                            >
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, #E8420A, #CC1C1C)',
                                }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${percentage}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              />
                            </div>
                          </div>

                          <motion.button
                            type="button"
                            disabled={isEliminated}
                            className="px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
                            style={{
                              background: isSelected
                                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                                : 'rgba(255,255,255,0.1)',
                              color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                            }}
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
                  <h3 className="text-lg font-bold text-white mb-4">Your Balance</h3>
                  <div
                    className="p-4 rounded-xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                  >
                    <p className="text-3xl font-bold text-white">
                      {wallet.balance.toLocaleString()}
                    </p>
                    <p className="text-sm text-white/80">{wallet.currency}</p>
                  </div>
                  <p className="text-xs text-white/40">Vote costs: 1 point per vote</p>
                </GlowCard>

                {selectedContestant && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <GlowCard className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Cast Your Vote</h3>
                      <p className="text-sm text-white/50 mb-4">Select vote quantity:</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {VOTE_QUANTITIES.map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setVoteQuantity(qty)}
                            className="py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              backgroundColor:
                                voteQuantity === qty
                                  ? 'rgba(232,66,10,0.2)'
                                  : 'rgba(255,255,255,0.05)',
                              border:
                                voteQuantity === qty
                                  ? '1px solid rgba(232,66,10,0.3)'
                                  : '1px solid rgba(255,255,255,0.1)',
                              color: voteQuantity === qty ? '#E8420A' : 'rgba(255,255,255,0.7)',
                            }}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg mb-4"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <span className="text-sm text-white/50">Total Cost:</span>
                        <span className="font-bold text-white">{voteQuantity} pts</span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleVote}
                        disabled={voteMutation.isPending || wallet.balance < voteQuantity}
                        className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                      </motion.button>
                    </GlowCard>
                  </motion.div>
                )}

                <GlowCard className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">How Voting Works</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '1', title: 'Select a contestant', desc: 'Choose who to vote for' },
                      { icon: '2', title: 'Choose quantity', desc: 'Pick how many votes to cast' },
                      { icon: '3', title: 'Submit vote', desc: 'Confirm your vote submission' },
                    ].map((step) => (
                      <div key={step.title} className="flex items-start gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                        >
                          {step.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{step.title}</p>
                          <p className="text-xs text-white/40">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlowCard>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {voteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50"
            style={{ backgroundColor: '#22C55E' }}
          >
            <p className="text-white font-semibold text-sm">Vote submitted successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
}

const LazyVotingPage = lazy(() => Promise.resolve({ default: VotingPageContent }));

export default function VotingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyVotingPage />
    </Suspense>
  );
}
