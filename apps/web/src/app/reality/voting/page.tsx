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
import { Clock, Flame, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
  bio?: string;
  rank?: number;
}

interface WalletBalance {
  balance: number;
  currency: string;
}

interface VotePack {
  id: string;
  label: string;
  votes: number;
  coins: number;
  price: number;
  currency?: string;
  popular?: boolean;
}

interface RecentVote {
  id: string;
  user: string;
  votes: number;
  contestant: string;
  show: string;
  time: string;
}

const DEFAULT_VOTE_PACKS: VotePack[] = [
  { id: 'vp-10', votes: 10, coins: 1, label: '10 Votes', price: 100 },
  { id: 'vp-50', votes: 50, coins: 5, label: '50 Votes', price: 450 },
  { id: 'vp-100', votes: 100, coins: 10, label: '100 Votes', price: 900 },
  { id: 'vp-500', votes: 500, coins: 50, label: '500 Votes', price: 4000 },
  { id: 'vp-1000', votes: 1000, coins: 100, label: '1,000 Votes (VIP)', price: 8000 },
];

function VotingPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(1); // default 50 votes
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('reality-voting');
  }, []);

  const votePacksQuery = useQuery({
    queryKey: ['reality-vote-packs'],
    queryFn: async () => {
      const res = await fetch('/api/reality/vote-packages');
      const json = await res.json();
      if (json.success && json.data?.length > 0) return json.data as VotePack[];
      return DEFAULT_VOTE_PACKS;
    },
    staleTime: 60000,
  });

  const recentVotesQuery = useQuery({
    queryKey: ['reality-recent-votes'],
    queryFn: async () => {
      const res = await fetch('/api/reality/recent-votes');
      const json = await res.json();
      if (json.success && json.data) return json.data as RecentVote[];
      return [];
    },
    refetchInterval: 15000,
  });

  const votePacks = votePacksQuery.data || DEFAULT_VOTE_PACKS;
  const recentVotes = recentVotesQuery.data || [];

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

  const currentPack = votePacks[selectedPackIndex] || votePacks[0];

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
      setVoteSuccess(`Successfully submitted ${currentPack.votes.toLocaleString()} votes!`);
      setTimeout(() => setVoteSuccess(null), 4000);
      setSelectedContestant(null);
    },
  });

  const contestants: Contestant[] = (contestantsQuery.data ?? []).sort((a, b) => b.votes - a.votes);
  const wallet = walletQuery.data ?? { balance: 1250, currency: 'Coins' };
  const maxVotes = Math.max(1, ...contestants.map((c) => c.votes));
  const totalVotesCast = contestants.reduce((acc, c) => acc + c.votes, 0);

  const selectedCandidate = contestants.find((c) => c.id === selectedContestant);

  const handleVote = useCallback(() => {
    if (!selectedContestant) return;
    voteMutation.mutate({ contestantId: selectedContestant, quantity: currentPack.votes });
  }, [selectedContestant, currentPack.votes, voteMutation]);

  return (
    <PageShell activeNav="Reality" maxWidth="7xl">
      <PageHero
        eyebrow="SURVIVOR : ISLAND TITANS • SEASON 3"
        eyebrowColor="var(--color-az-flame)"
        title="Live Eviction Voting Hub"
        subtitle="Your votes decide who stays on the island and who gets eliminated at Tribal Council."
        glowColor="color-mix(in srgb, var(--color-az-flame) 18%, transparent)"
      >
        {/* Figma Countdown Timer & Vote Stat Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 rounded-az-pill border border-az-error-500/40 bg-az-surface-panel px-4 py-1.5 text-xs font-bold text-az-error-300">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Voting Closes: 02 Days 04 Hours 15 Mins</span>
          </div>
          <div className="flex items-center gap-2 rounded-az-pill border border-az-glass-border bg-az-glass-card px-4 py-1.5 text-xs font-semibold text-az-ink">
            <Flame className="h-4 w-4 text-az-flame" />
            <span>Total Cast: {totalVotesCast.toLocaleString()} votes</span>
          </div>
        </div>
      </PageHero>

      {/* Live Toast */}
      <AnimatePresence>
        {voteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-3 rounded-az-card border border-az-success-500/40 bg-az-surface-panel p-4 text-az-success-200 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="h-5 w-5 text-az-success-400" />
            <span className="text-sm font-semibold">{voteSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Contestants List (2 Cols on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <ScrollReveal>
            <div className="flex items-center justify-between">
              <h2 className="az-section-title text-az-ink">Contestants Roster</h2>
              <span className="text-xs text-az-ink-muted">Tap to select contestant</span>
            </div>
          </ScrollReveal>

          {contestantsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="az-glass p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton width="60px" height="60px" borderRadius="50%" />
                    <div className="flex-1 space-y-2">
                      <Skeleton height="20px" width="50%" />
                      <Skeleton height="12px" width="30%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contestantsQuery.error ? (
            <ErrorState
              title="Failed to load contestants"
              description={contestantsQuery.error.message}
              onButtonPress={() => contestantsQuery.refetch()}
            />
          ) : (
            <div className="space-y-4">
              {contestants.map((contestant, index) => {
                const percentage = maxVotes > 0 ? (contestant.votes / maxVotes) * 100 : 0;
                const isSelected = selectedContestant === contestant.id;
                const isEliminated = contestant.status === 'eliminated';
                const isDanger = contestant.status === 'danger';
                const rank = index + 1;

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
                        isSelected
                          ? 'border-az-flame ring-2 ring-az-flame/30 bg-az-glass-card'
                          : 'hover:border-az-glass-border-hover'
                      } ${isEliminated ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => !isEliminated && setSelectedContestant(contestant.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Figma Rank Badge */}
                        <div className="flex flex-col items-center justify-center shrink-0 w-8">
                          {rank === 1 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-az-warning-400 text-black font-black text-xs shadow-md">
                              #1
                            </span>
                          ) : rank === 2 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-az-ink-dim text-black font-black text-xs">
                              #2
                            </span>
                          ) : rank === 3 ? (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-az-warning-700 text-white font-black text-xs">
                              #3
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-az-ink-muted">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <OptimizedImage
                            src={contestant.avatar}
                            alt={contestant.name}
                            width={64}
                            height={64}
                            className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16 border-2 border-az-glass-border"
                          />
                          {isDanger && (
                            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-az-error-600 text-xs font-bold text-white shadow">
                              !
                            </span>
                          )}
                        </div>

                        {/* Info & Progress Meter */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-bold text-az-ink truncate text-sm sm:text-base">
                              {contestant.name}
                            </h3>
                            {isDanger ? (
                              <span className="rounded-az-pill border border-az-error-500/30 bg-az-error-500/15 px-2 py-0.5 text-[10px] font-bold text-az-error-300">
                                Nominated (Danger)
                              </span>
                            ) : (
                              <span className="rounded-az-pill border border-az-success-500/30 bg-az-success-500/15 px-2 py-0.5 text-[10px] font-bold text-az-success-300">
                                Safe
                              </span>
                            )}
                          </div>

                          <p className="az-caption text-az-ink-muted">
                            {contestant.votes.toLocaleString()} fan votes ({percentage.toFixed(1)}%)
                          </p>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-az-surface-root">
                            <motion.div
                              className={`h-full rounded-full ${
                                rank === 1
                                  ? 'bg-gradient-to-r from-az-warning-400 to-az-flame'
                                  : 'bg-gradient-to-r from-az-flame to-az-scarlet'
                              }`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                          </div>
                        </div>

                        {/* Select Action Button */}
                        <button
                          type="button"
                          className={`rounded-az-pill px-4 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-az-flame text-az-surface-root shadow-md'
                              : 'border border-az-glass-border bg-az-surface-root text-az-ink hover:border-az-flame/50'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Vote'}
                        </button>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Live Activity Ticker */}
          <div className="rounded-az-control border border-az-glass-border bg-az-glass-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-az-ink-muted mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-az-warning-300" />
              Live Fan Voting Activity Feed
            </h4>
            <div className="space-y-2">
              {recentVotes.length > 0 ? (
                recentVotes.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-xs py-1 text-az-ink"
                  >
                    <span>
                      <strong className="text-az-flame">{v.user}</strong> cast{' '}
                      <strong>+{v.votes} votes</strong> for {v.contestant}
                    </span>
                    <span className="text-[10px] text-az-ink-muted">{v.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-az-ink-muted italic">
                  No recent votes recorded yet. Be the first to vote!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Voting Drawer & Balance (1 Col on Desktop) */}
        <div className="lg:col-span-1">
          <ScrollReveal direction="right">
            <div className="sticky top-24 space-y-6">
              {/* Wallet Balance Card */}
              <GlowCard className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="az-subtitle text-az-ink font-bold">Coin Balance</h3>
                  <Coins className="h-5 w-5 text-az-warning-400" />
                </div>
                <div className="rounded-az-control bg-gradient-to-br from-az-surface-root to-az-surface-panel border border-az-glass-border p-4 mb-3">
                  <p className="text-3xl font-black text-az-warning-300">
                    🪙 {wallet.balance.toLocaleString()}
                  </p>
                  <p className="text-xs text-az-ink-muted mt-0.5">Azeebo Voting Coins</p>
                </div>
                <p className="text-[11px] text-az-ink-muted">
                  Multiplier: <strong>1 Coin = 10 Fan Votes</strong>
                </p>
              </GlowCard>

              {/* Vote Pack Selection & Submit Drawer */}
              <GlowCard className="p-6">
                <h3 className="az-subtitle text-az-ink font-bold mb-3">
                  {selectedCandidate ? `Vote for ${selectedCandidate.name}` : 'Select a Contestant'}
                </h3>

                {selectedCandidate ? (
                  <div className="space-y-4">
                    <p className="text-xs text-az-ink-muted">Select voting power pack:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {votePacks.map((pack, i) => (
                        <button
                          key={pack.id || i}
                          type="button"
                          onClick={() => setSelectedPackIndex(i)}
                          className={`flex items-center justify-between rounded-az-control border p-3 text-xs font-semibold transition-all ${
                            selectedPackIndex === i
                              ? 'border-az-flame bg-az-flame/15 text-white shadow-sm'
                              : 'border-az-glass-border bg-az-surface-root text-az-ink hover:border-az-flame/40'
                          }`}
                        >
                          <span className="font-bold">{pack.label}</span>
                          <span className="text-az-warning-300 font-extrabold">
                            🪙 {pack.coins} Coins
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-az-control bg-az-surface-root p-3.5 border border-az-glass-border space-y-1.5 text-xs">
                      <div className="flex justify-between text-az-ink-muted">
                        <span>Contestant:</span>
                        <span className="font-bold text-az-ink">{selectedCandidate.name}</span>
                      </div>
                      <div className="flex justify-between text-az-ink-muted">
                        <span>Votes to Add:</span>
                        <span className="font-bold text-az-success-400">
                          +{currentPack.votes.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-az-glass-border pt-1.5 text-az-ink">
                        <span className="font-bold">Total Cost:</span>
                        <span className="font-extrabold text-az-warning-300">
                          🪙 {currentPack.coins} Coins
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVote}
                      disabled={voteMutation.isPending || wallet.balance < currentPack.coins}
                      className="w-full rounded-az-pill bg-az-flame py-3 text-xs font-bold text-az-surface-root shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {voteMutation.isPending
                        ? 'Casting Votes...'
                        : `Cast ${currentPack.votes.toLocaleString()} Votes Now`}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-az-control border border-dashed border-az-glass-border p-6 text-center">
                    <p className="text-xs text-az-ink-muted">
                      Select any contestant from the roster on the left to activate the vote pack
                      slider.
                    </p>
                  </div>
                )}
              </GlowCard>
            </div>
          </ScrollReveal>
        </div>
      </div>
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
