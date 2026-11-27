'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
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
    <PageShell activeNav="Rewards">
      <PageHero title="Redeem Points" description="Convert your earned points into real rewards" />

      <div className="pb-16">
        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="az-glass p-6 text-center">
            <p className="az-heading text-az-ink">{wallet.points.toLocaleString()}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Available Points</p>
          </div>
          <div className="az-glass p-6 text-center">
            <p className="az-heading text-az-ink">{wallet.totalEarned.toLocaleString()}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Total Earned</p>
          </div>
          <div className="az-glass p-6 text-center">
            <p className="az-heading text-az-ink">{wallet.totalRedeemed.toLocaleString()}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Total Redeemed</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const canAfford = wallet.points >= item.pointsCost;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="az-glass flex flex-col p-6"
                >
                  <div className="mb-4 text-center">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-az-card border border-az-flame/20 bg-az-flame/10 text-az-flame">
                      <Gift size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-az-ink">{item.title}</h3>
                    <p className="az-body mt-1 text-az-ink-muted">{item.description}</p>
                  </div>
                  <div className="mt-auto">
                    <div className="mb-3 flex items-center justify-between az-caption">
                      <span className="text-az-ink-muted">Cost</span>
                      <span className="az-body-strong text-az-ink">
                        {item.pointsCost.toLocaleString()} pts
                      </span>
                    </div>
                    {item.available ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!canAfford}
                        className="az-btn-primary"
                      >
                        {canAfford ? 'Redeem' : `Need ${item.pointsCost - wallet.points} more`}
                      </motion.button>
                    ) : (
                      <div className="az-body w-full rounded-az-card bg-az-ink/5 py-3 text-center text-az-ink-dim">
                        Out of stock
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: RedemptionContent }));
export default function RedemptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
