'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';
import { Gift, CheckCircle2 } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'badge' | 'points' | 'voucher' | 'physical';
  icon: string;
  pointsCost: number;
  userPoints: number;
  available: number;
  totalSupply: number;
  expiresAt?: string;
  requirements: string[];
  claimed: boolean;
}

function RewardDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const [claimed, setClaimed] = useState(false);
  useEffect(() => {
    analytics.pageView('reward-detail');
  }, []);

  const query = useQuery({
    queryKey: ['reward', id],
    queryFn: async () => {
      const res = await api.request<Reward>(`/api/v1/rewards/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Reward not found');
    },
    enabled: !!id,
  });

  const claimMutation = useMutation({
    // Reward-service exposes POST /rewards/redeem { rewardId } — there is no
    // per-reward /claim route.
    mutationFn: async () =>
      api.request(`/api/v1/rewards/redeem`, {
        method: 'POST',
        body: JSON.stringify({ rewardId: id }),
      }),
    onSuccess: () => setClaimed(true),
  });

  const reward = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppHeader logoVariant="light" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !reward)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppHeader logoVariant="light" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState title="Reward not found" />
        </div>
      </div>
    );

  const canAfford = reward.userPoints >= reward.pointsCost;
  const inStock = reward.available > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader logoVariant="light" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-8 border border-white/10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Gift size={40} />
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: 'rgba(232,66,10,0.15)', color: 'var(--brand-orange)' }}
            >
              {reward.type}
            </span>
            <h1 className="text-3xl font-bold text-white mt-3 mb-2">{reward.title}</h1>
            <p className="text-white/60 max-w-xl mx-auto">{reward.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div
              className="text-center p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <p className="text-2xl font-bold text-white">₦{reward.pointsCost.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Points Required</p>
            </div>
            <div
              className="text-center p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <p className="text-2xl font-bold text-white">{reward.userPoints.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Your Points</p>
            </div>
            <div
              className="text-center p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <p className="text-2xl font-bold text-white">
                {reward.available}/{reward.totalSupply}
              </p>
              <p className="text-xs text-white/40 mt-1">Available</p>
            </div>
          </div>

          {reward.requirements.length > 0 && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-semibold text-white mb-2">Requirements</h3>
              <ul className="space-y-1">
                {reward.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reward.expiresAt && (
            <p className="text-xs text-white/40 text-center mb-4">
              Expires{' '}
              {new Date(reward.expiresAt).toLocaleDateString('en-NG', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}

          {claimed || reward.claimed ? (
            <div className="w-full text-center py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-emerald-400 font-semibold inline-flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>Claimed Successfully!</span>
              </p>
            </div>
          ) : !canAfford ? (
            <div
              className="w-full text-center py-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <p className="text-red-400 font-semibold">
                Insufficient points (need {reward.pointsCost - reward.userPoints} more)
              </p>
            </div>
          ) : !inStock ? (
            <div
              className="w-full text-center py-4 rounded-xl"
              style={{ backgroundColor: 'rgba(107,114,128,0.1)' }}
            >
              <p className="text-white/50 font-semibold">Out of stock</p>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full az-btn-primary text-lg py-4 inline-flex items-center justify-center gap-2"
            >
              <Gift size={20} />
              <span>{claimMutation.isPending ? 'Claiming...' : 'Claim Reward'}</span>
            </motion.button>
          )}
        </motion.div>
      </section>
      <AppFooter logoVariant="light" />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: RewardDetailContent }));
export default function RewardDetailPage() {
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
