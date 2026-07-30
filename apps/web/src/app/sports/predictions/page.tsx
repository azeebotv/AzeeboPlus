'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Sports" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #0D3B2E, #1A0A0A)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Predictions
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Predict match outcomes and win rewards
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-4 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span>{markets.filter((m) => m.status === 'open').length} active markets</span>
            <span>|</span>
            <span>Place predictions before deadline</span>
          </motion.div>
        </div>
      </section>

      {/* Prediction Markets */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Active Markets</h2>
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
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: isUrgent
                                ? 'rgba(239,68,68,0.2)'
                                : 'rgba(13,59,46,0.3)',
                              color: isUrgent ? '#EF4444' : '#4ADE80',
                            }}
                          >
                            {isUrgent ? 'Ending Soon' : 'Open'}
                          </span>
                          {market.totalPredictions != null && (
                            <span className="text-xs text-white/40">
                              {market.totalPredictions} predictions
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-white text-lg mb-1">{market.title}</h3>
                        <p className="text-sm text-white/50 mb-4">{market.description}</p>

                        {/* Matchup */}
                        <div
                          className="flex items-center justify-between p-3 rounded-lg mb-4"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        >
                          <div className="text-center flex-1">
                            <p className="font-semibold text-white text-sm">{market.homeTeam}</p>
                            <p className="text-xs text-[#4ADE80] mt-1">
                              {market.homeOdds.toFixed(1)}x
                            </p>
                          </div>
                          <div className="px-4">
                            <span className="text-white/30 text-xs">VS</span>
                          </div>
                          <div className="text-center flex-1">
                            <p className="font-semibold text-white text-sm">{market.awayTeam}</p>
                            <p className="text-xs text-[#4ADE80] mt-1">
                              {market.awayOdds.toFixed(1)}x
                            </p>
                          </div>
                        </div>

                        {/* Prediction Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <button
                            type="button"
                            onClick={() => handlePredict(market.id, 'home')}
                            className="py-2.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                selectedBet === `${market.id}-home`
                                  ? '#4ADE80'
                                  : 'rgba(255,255,255,0.1)',
                              color: selectedBet === `${market.id}-home` ? '#0D3B2E' : '#fff',
                            }}
                          >
                            {market.homeTeam}
                          </button>
                          {market.drawOdds && (
                            <button
                              type="button"
                              onClick={() => handlePredict(market.id, 'draw')}
                              className="py-2.5 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                backgroundColor:
                                  selectedBet === `${market.id}-draw`
                                    ? '#4ADE80'
                                    : 'rgba(255,255,255,0.1)',
                                color: selectedBet === `${market.id}-draw` ? '#0D3B2E' : '#fff',
                              }}
                            >
                              Draw
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePredict(market.id, 'away')}
                            className="py-2.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              backgroundColor:
                                selectedBet === `${market.id}-away`
                                  ? '#4ADE80'
                                  : 'rgba(255,255,255,0.1)',
                              color: selectedBet === `${market.id}-away` ? '#0D3B2E' : '#fff',
                            }}
                          >
                            {market.awayTeam}
                          </button>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center justify-between text-xs text-white/40">
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
            <p className="text-lg text-white/50">No active prediction markets</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyPredictionsPage = lazy(() => Promise.resolve({ default: PredictionsPageContent }));

export const metadata = {
  title: 'Predictions | Azeebo',
  description: 'Predict match outcomes and win rewards on active prediction markets.',
  openGraph: {
    title: 'Predictions | Azeebo',
    description: 'Predict match outcomes and win rewards on active prediction markets.',
  },
};

export default function PredictionsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyPredictionsPage />
    </Suspense>
  );
}
