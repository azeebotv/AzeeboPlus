'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import analytics from '@/lib/analytics';
import { Gift } from 'lucide-react';

interface RedemptionItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  available: boolean;
  icon: string;
}

interface WalletData {
  points: number;
  totalEarned: number;
  totalRedeemed: number;
}

function RedemptionContent() {
  useEffect(() => {
    analytics.pageView('rewards-redemption');
  }, []);

  const walletQuery = useQuery({
    queryKey: ['rewards-wallet'],
    queryFn: async () => {
      const res = await api.request<WalletData>('/api/v1/rewards/balance');
      if (res.success && res.data) return res.data;
      return { points: 0, totalEarned: 0, totalRedeemed: 0 };
    },
  });

  const itemsQuery = useQuery({
    queryKey: ['redemption-items'],
    queryFn: async () => {
      const res = await api.request<RedemptionItem[]>('/api/v1/rewards/redeem-options');
      if (res.success && res.data) return res.data;
      return [];
    },
  });

  const wallet = walletQuery.data ?? { points: 0, totalEarned: 0, totalRedeemed: 0 };
  const items = itemsQuery.data ?? [];
  const isLoading = walletQuery.isLoading || itemsQuery.isLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader active="Rewards" logoVariant="light" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center border border-orange-500/20">
              <Gift size={22} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Redeem Points</h1>
          </div>
          <p className="text-white/50 text-lg mb-8">Convert your earned points into real rewards</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="az-glass p-6 text-center border border-white/10">
            <p className="text-3xl font-bold text-white">{wallet.points.toLocaleString()}</p>
            <p className="text-sm text-white/40 mt-1">Available Points</p>
          </div>
          <div className="az-glass p-6 text-center border border-white/10">
            <p className="text-3xl font-bold text-white">{wallet.totalEarned.toLocaleString()}</p>
            <p className="text-sm text-white/40 mt-1">Total Earned</p>
          </div>
          <div className="az-glass p-6 text-center border border-white/10">
            <p className="text-3xl font-bold text-white">{wallet.totalRedeemed.toLocaleString()}</p>
            <p className="text-sm text-white/40 mt-1">Total Redeemed</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton height="120px" borderRadius="12" />
              </div>
            ))}
          </div>
        ) : itemsQuery.error ? (
          <ErrorState
            title="Failed to load"
            description={itemsQuery.error.message}
            onButtonPress={() => itemsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="gift"
            title="No redemption items available yet"
            description="Check back later for new items to redeem"
            dark
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => {
              const canAfford = wallet.points >= item.pointsCost;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="az-glass p-6 flex flex-col border border-white/10"
                >
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center mx-auto mb-3 border border-orange-500/20">
                      <Gift size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-white/50 mt-1">{item.description}</p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-white/40">Cost</span>
                      <span className="font-bold text-white">
                        {item.pointsCost.toLocaleString()} pts
                      </span>
                    </div>
                    {item.available ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!canAfford}
                        className={`w-full py-3 rounded-xl font-semibold text-sm ${canAfford ? 'az-btn-primary' : 'opacity-50 cursor-not-allowed'}`}
                        style={
                          !canAfford
                            ? {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.3)',
                              }
                            : {}
                        }
                      >
                        {canAfford ? 'Redeem' : `Need ${item.pointsCost - wallet.points} more`}
                      </motion.button>
                    ) : (
                      <div
                        className="w-full py-3 rounded-xl text-center text-sm text-white/30"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      >
                        Out of stock
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
      <AppFooter logoVariant="light" />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: RedemptionContent }));
export default function RedemptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
