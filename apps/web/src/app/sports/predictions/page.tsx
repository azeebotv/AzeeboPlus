'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Coins, CheckCircle2, X } from 'lucide-react';
import analytics from '@/lib/analytics';

interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  deadline: string;
  status: 'open' | 'closed' | 'resolved';
  totalPredictions?: number;
  prizePool?: number;
}

interface StakeSelection {
  market: PredictionMarket;
  choice: 'home' | 'draw' | 'away';
  choiceLabel: string;
  odds: number;
}

const PRESET_STAKES = [50, 100, 250, 500, 1000];

function PredictionsPageContent(): React.JSX.Element {
  const [activeStake, setActiveStake] = useState<StakeSelection | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [stakeSuccess, setStakeSuccess] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('sports-predictions');
  }, []);

  const marketsQuery = useQuery({
    queryKey: ['prediction-markets'],
    queryFn: async () => {
      const res = await api.request<PredictionMarket[]>('/api/v1/sports/predictions');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load prediction markets');
    },
    staleTime: 30000,
  });

  const markets: PredictionMarket[] = marketsQuery.data ?? [];
  const isLoading = marketsQuery.isLoading;
  const error = marketsQuery.error?.message;

  const handleOpenStake = (
    market: PredictionMarket,
    choice: 'home' | 'draw' | 'away',
    odds: number
  ) => {
    const choiceLabel =
      choice === 'home' ? market.homeTeam : choice === 'away' ? market.awayTeam : 'Draw';
    setActiveStake({ market, choice, choiceLabel, odds });
    setStakeAmount(100);
  };

  const handleConfirmStake = () => {
    if (!activeStake) return;
    const msg = `Successfully staked ${stakeAmount.toLocaleString()} Coins on ${activeStake.choiceLabel} @ ${activeStake.odds.toFixed(2)}`;
    setStakeSuccess(msg);
    setActiveStake(null);
    setTimeout(() => setStakeSuccess(null), 4000);
  };

  return (
    <PageShell activeNav="Sports" maxWidth="7xl">
      <PageHero
        eyebrow="Azeebo Sports Arena"
        eyebrowColor="var(--color-az-success-400)"
        title="Live Match Predictions"
        subtitle="Stake Azeebo Coins on live odds & compete for the community pool prize"
        glowColor="color-mix(in srgb, var(--color-az-success-500) 16%, transparent)"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 az-caption text-az-ink/60">
          <span className="flex items-center gap-1.5 text-az-warning-300 font-bold">
            <Coins className="h-4 w-4" />
            Active Community Prize Pool: 250,000 Coins
          </span>
          <span aria-hidden="true">|</span>
          <span>{markets.filter((m) => m.status === 'open').length} active markets</span>
        </div>
      </PageHero>

      {/* Toast Notification */}
      <AnimatePresence>
        {stakeSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-3 rounded-az-card border border-az-success-500/40 bg-az-surface-panel p-4 text-az-success-200 shadow-xl backdrop-blur-md"
          >
            <CheckCircle2 className="h-5 w-5 text-az-success-400" />
            <span className="text-sm font-semibold">{stakeSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction Markets */}
      <section className="max-w-5xl mx-auto py-10 sm:py-12 px-4 sm:px-6">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="az-section-title text-az-ink">Featured Fixtures & Live Odds</h2>
            <span className="az-caption text-az-ink-muted">
              Pill Odds: 1 (Home) • X (Draw) • 2 (Away)
            </span>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load predictions"
            description={error}
            onButtonPress={() => marketsQuery.refetch()}
          />
        ) : markets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {markets
              .filter((m) => m.status === 'open')
              .map((market, index) => {
                const timeLeft = new Date(market.deadline).getTime() - Date.now();
                const isUrgent = timeLeft < 3600000 && timeLeft > 0;
                const pool = market.prizePool ?? 250000;

                return (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <GlowCard universe="sports" className="overflow-hidden">
                      <div className="p-5">
                        {/* Header: Urgency + Prize Pool Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`rounded-az-pill px-2.5 py-0.5 text-xs font-semibold ${
                              isUrgent
                                ? 'border border-az-error-500/30 bg-az-error-500/20 text-az-error-400'
                                : 'border border-az-success-500/30 bg-az-success-500/15 text-az-success-400'
                            }`}
                          >
                            {isUrgent ? 'Ending Soon' : '● Live Market'}
                          </span>

                          <div className="flex items-center gap-1.5 rounded-az-pill border border-az-warning-500/40 bg-az-warning-500/10 px-2.5 py-0.5 text-xs font-bold text-az-warning-300">
                            <span>🪙</span>
                            <span>{pool.toLocaleString()} Coins</span>
                          </div>
                        </div>

                        <h3 className="az-subtitle text-az-ink mb-1">{market.title}</h3>
                        <p className="az-caption mb-4 text-az-ink/50">{market.description}</p>

                        {/* Matchup Header */}
                        <div className="flex items-center justify-between p-3 rounded-az-control mb-4 bg-az-surface-root">
                          <div className="text-center flex-1">
                            <p className="az-body-strong text-az-ink">{market.homeTeam}</p>
                            <span className="text-[10px] text-az-ink-muted">Home</span>
                          </div>
                          <div className="px-4">
                            <span className="text-az-ink-muted text-xs font-bold">VS</span>
                          </div>
                          <div className="text-center flex-1">
                            <p className="az-body-strong text-az-ink">{market.awayTeam}</p>
                            <span className="text-[10px] text-az-ink-muted">Away</span>
                          </div>
                        </div>

                        {/* Figma Signature Odds Pills (1, X, 2) */}
                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                          {/* 1 - Home Win (Emerald) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStake(market, 'home', market.homeOdds)}
                            className="flex flex-col items-center justify-center rounded-az-pill border border-az-success-500/40 bg-az-surface-panel py-2.5 px-2 transition-all hover:bg-az-surface-panel hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-az-success-400/50"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-az-success-400">
                              1 (Home)
                            </span>
                            <span className="text-sm font-extrabold text-white">
                              {market.homeOdds.toFixed(2)}
                            </span>
                          </button>

                          {/* X - Draw (Royal Blue) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStake(market, 'draw', market.drawOdds ?? 3.4)}
                            className="flex flex-col items-center justify-center rounded-az-pill border border-az-secondary-500/40 bg-az-surface-panel py-2.5 px-2 transition-all hover:bg-az-surface-panel hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-az-secondary-400/50"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-az-secondary-400">
                              X (Draw)
                            </span>
                            <span className="text-sm font-extrabold text-white">
                              {(market.drawOdds ?? 3.4).toFixed(2)}
                            </span>
                          </button>

                          {/* 2 - Away Win (Magenta/Rose) */}
                          <button
                            type="button"
                            onClick={() => handleOpenStake(market, 'away', market.awayOdds)}
                            className="flex flex-col items-center justify-center rounded-az-pill border border-az-error-500/40 bg-az-surface-panel py-2.5 px-2 transition-all hover:bg-az-surface-panel hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-az-error-400/50"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-az-error-400">
                              2 (Away)
                            </span>
                            <span className="text-sm font-extrabold text-white">
                              {market.awayOdds.toFixed(2)}
                            </span>
                          </button>
                        </div>

                        {/* Deadline & Participants */}
                        <div className="flex items-center justify-between text-xs text-az-ink/40">
                          <span>
                            Closes:{' '}
                            {new Date(market.deadline).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {market.totalPredictions != null && (
                            <span>{market.totalPredictions} predictions placed</span>
                          )}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink/50">No active prediction markets right now</p>
          </div>
        )}
      </section>

      {/* Stake Coins Modal / Drawer */}
      <AnimatePresence>
        {activeStake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-az-card border border-az-glass-border bg-az-glass-card p-6 shadow-2xl"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveStake(null)}
                className="absolute top-4 right-4 text-az-ink-muted hover:text-az-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-2 text-az-warning-300">
                <Coins className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Stake Prediction</span>
              </div>

              <h3 className="az-subtitle text-az-ink font-bold mb-1">{activeStake.market.title}</h3>
              <p className="az-caption text-az-ink-muted mb-4">
                Selection: <strong className="text-az-flame">{activeStake.choiceLabel}</strong> @{' '}
                <strong className="text-white">{activeStake.odds.toFixed(2)}x Odds</strong>
              </p>

              {/* Stake Amount Selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-az-ink mb-2">
                  Select Coins to Stake:
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_STAKES.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStakeAmount(amt)}
                      className={`rounded-az-pill px-3 py-1.5 text-xs font-bold transition-all ${
                        stakeAmount === amt
                          ? 'bg-az-warning-400 text-black shadow-md'
                          : 'border border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
                      }`}
                    >
                      🪙 {amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value) || 0)}
                    className="w-full rounded-az-control border border-az-glass-border bg-az-surface-root px-4 py-2.5 text-sm text-az-ink font-bold focus:border-az-warning-400 focus:outline-none"
                    placeholder="Custom amount"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-az-ink-muted">Coins</span>
                </div>
              </div>

              {/* Potential Return Calculation */}
              <div className="mb-6 rounded-az-control border border-az-warning-500/30 bg-az-surface-panel p-3.5">
                <div className="flex items-center justify-between text-xs text-az-warning-200">
                  <span>Potential Win Return:</span>
                  <span className="text-base font-extrabold text-az-warning-400">
                    🪙 {Math.round(stakeAmount * activeStake.odds).toLocaleString()} Coins
                  </span>
                </div>
                <p className="text-[10px] text-az-warning-300/60 mt-1">
                  Stake ({stakeAmount}) × Odds ({activeStake.odds.toFixed(2)})
                </p>
              </div>

              {/* Confirm CTA */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStake(null)}
                  className="flex-1 rounded-az-pill border border-az-glass-border py-2.5 text-xs font-semibold text-az-ink hover:bg-az-surface-root transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStake}
                  disabled={stakeAmount < 10}
                  className="flex-1 rounded-az-pill bg-az-flame py-2.5 text-xs font-bold text-az-surface-root shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Confirm Stake
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

const LazyPredictionsPage = lazy(() => Promise.resolve({ default: PredictionsPageContent }));

export default function PredictionsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyPredictionsPage />
    </Suspense>
  );
}
