'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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

function PredictionsPageContent(): React.JSX.Element {
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
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

  const handlePredict = (marketId: string, choice: string) => {
    setSelectedBet(`${marketId}-${choice}`);
  };

  return (
    <PageShell activeNav="Sports" maxWidth="7xl">
      <PageHero
        eyebrow="Azeebo Sports Arena"
        eyebrowColor="var(--color-az-success-400)"
        title="Match Predictions"
        subtitle="Predict match outcomes and win rewards"
        glowColor="color-mix(in srgb, var(--color-az-success-500) 16%, transparent)"
      >
        <div className="flex items-center justify-center gap-4 az-caption text-az-ink/60">
          <span>{markets.filter((m) => m.status === 'open').length} active markets</span>
          <span aria-hidden="true">|</span>
          <span>Place predictions before deadline</span>
        </div>
      </PageHero>

      {/* Prediction Markets */}
      <section className="max-w-5xl mx-auto py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="az-section-title text-az-ink mb-6 sm:mb-8">Active Markets</h2>
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
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`rounded-az-pill px-2.5 py-0.5 text-xs font-semibold ${
                              isUrgent
                                ? 'border border-az-error-500/30 bg-az-error-500/20 text-az-error-400'
                                : 'border border-az-success-500/25 bg-az-success-500/15 text-az-success-400'
                            }`}
                          >
                            {isUrgent ? 'Ending Soon' : 'Open'}
                          </span>
                          {market.totalPredictions != null && (
                            <span className="text-xs text-az-ink/40">
                              {market.totalPredictions} predictions
                            </span>
                          )}
                        </div>

                        <h3 className="az-subtitle text-az-ink mb-1">{market.title}</h3>
                        <p className="az-caption mb-4 text-az-ink/50">{market.description}</p>

                        {/* Matchup */}
                        <div className="flex items-center justify-between p-3 rounded-az-control mb-4 bg-az-ink/5">
                          <div className="text-center flex-1">
                            <p className="az-body-strong text-az-ink">{market.homeTeam}</p>
                            <p className="text-xs text-az-success-400 mt-1">
                              {market.homeOdds.toFixed(1)}x
                            </p>
                          </div>
                          <div className="px-4">
                            <span className="text-az-ink/30 text-xs">VS</span>
                          </div>
                          <div className="text-center flex-1">
                            <p className="az-body-strong text-az-ink">{market.awayTeam}</p>
                            <p className="text-xs text-az-success-400 mt-1">
                              {market.awayOdds.toFixed(1)}x
                            </p>
                          </div>
                        </div>

                        {/* Prediction Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <button
                            type="button"
                            onClick={() => handlePredict(market.id, 'home')}
                            className={`rounded-az-control py-2.5 text-xs font-semibold transition-all ${
                              selectedBet === `${market.id}-home`
                                ? 'bg-az-success-400 text-az-surface-root'
                                : 'bg-az-ink/10 text-az-ink'
                            }`}
                          >
                            {market.homeTeam}
                          </button>
                          {market.drawOdds && (
                            <button
                              type="button"
                              onClick={() => handlePredict(market.id, 'draw')}
                              className={`rounded-az-control py-2.5 text-xs font-semibold transition-all ${
                                selectedBet === `${market.id}-draw`
                                  ? 'bg-az-success-400 text-az-surface-root'
                                  : 'bg-az-ink/10 text-az-ink'
                              }`}
                            >
                              Draw
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePredict(market.id, 'away')}
                            className={`rounded-az-control py-2.5 text-xs font-semibold transition-all ${
                              selectedBet === `${market.id}-away`
                                ? 'bg-az-success-400 text-az-surface-root'
                                : 'bg-az-ink/10 text-az-ink'
                            }`}
                          >
                            {market.awayTeam}
                          </button>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center justify-between text-xs text-az-ink/40">
                          <span>
                            Deadline:{' '}
                            {new Date(market.deadline).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {market.prizePool != null && (
                            <span>Prize: {market.prizePool.toLocaleString()} pts</span>
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
            <p className="az-lead text-az-ink/50">No active prediction markets</p>
          </div>
        )}
      </section>
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
