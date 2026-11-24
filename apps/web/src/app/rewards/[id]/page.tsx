'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import analytics from '@/lib/analytics';
import { Gift, CheckCircle2, ArrowLeft, Clock, Sparkles } from 'lucide-react';

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
      <PageShell activeNav="Rewards">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="az-glass p-8 border border-az-glass-border">
            <Skeleton height="360px" borderRadius="20px" />
          </div>
        </div>
      </PageShell>
    );

  if (query.error || !reward)
    return (
      <PageShell activeNav="Rewards">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <ErrorState
            title="Reward not found"
            buttonText="Return to Rewards"
            onButtonPress={() => window.location.assign('/rewards')}
          />
        </div>
      </PageShell>
    );

  const canAfford = reward.userPoints >= reward.pointsCost;
  const inStock = reward.available > 0;

  return (
    <PageShell activeNav="Rewards">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/rewards"
          className="inline-flex items-center gap-2 text-xs font-bold text-az-ink/50 hover:text-az-ink transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Rewards Center</span>
        </Link>
      </div>

      <PageHero
        badge={`Perk Tier: ${reward.type}`}
        title={reward.title}
        subtitle={reward.description}
        accentColor="var(--color-az-flame)"
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-8 sm:p-10 border border-az-glass-border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-az-flame/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-az-flame/10 text-az-flame flex items-center justify-center mx-auto mb-4 border border-az-flame/30 shadow-lg shadow-az-flame/10">
              <Gift size={38} />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-az-flame/15 text-az-flame border border-az-flame/30">
              {reward.type} Reward
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="az-glass p-4 text-center border">
              <p className="text-2xl font-black text-az-flame">
                ₦{reward.pointsCost.toLocaleString()}
              </p>
              <p className="text-[11px] font-bold text-az-ink/40 uppercase tracking-wider mt-1">
                Points Required
              </p>
            </div>
            <div className="az-glass p-4 text-center border">
              <p className="text-2xl font-black text-az-ink">
                {reward.userPoints.toLocaleString()}
              </p>
              <p className="text-[11px] font-bold text-az-ink/40 uppercase tracking-wider mt-1">
                Your Points
              </p>
            </div>
            <div className="az-glass p-4 text-center border">
              <p className="text-2xl font-black text-az-success-400">
                {reward.available}/{reward.totalSupply}
              </p>
              <p className="text-[11px] font-bold text-az-ink/40 uppercase tracking-wider mt-1">
                Remaining Supply
              </p>
            </div>
          </div>

          {reward.requirements && reward.requirements.length > 0 && (
            <div className="mb-8 p-5 rounded-2xl bg-az-ink/[0.03] border border-az-ink/5">
              <h3 className="text-xs font-bold text-az-ink uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-az-flame" />
                <span>Unlock Criteria</span>
              </h3>
              <ul className="space-y-2">
                {reward.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-az-ink/60 flex items-start gap-2.5">
                    <span className="text-az-flame mt-1">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reward.expiresAt && (
            <p className="text-xs text-az-ink/40 text-center mb-6 flex items-center justify-center gap-1.5">
              <Clock size={13} />
              <span>
                Offer expires on{' '}
                {new Date(reward.expiresAt).toLocaleDateString('en-NG', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>
          )}

          {claimed || reward.claimed ? (
            <div className="w-full text-center py-4 rounded-2xl bg-az-success-500/10 border border-az-success-500/30">
              <p className="text-az-success-400 font-bold inline-flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>Perk Claimed Successfully!</span>
              </p>
            </div>
          ) : !canAfford ? (
            <div className="w-full text-center py-4 rounded-2xl bg-az-error-500/10 border border-az-error-500/30">
              <p className="text-az-error-400 font-semibold text-sm">
                Insufficient points — you need{' '}
                {(reward.pointsCost - reward.userPoints).toLocaleString()} more PTS
              </p>
            </div>
          ) : !inStock ? (
            <div className="w-full text-center py-4 rounded-2xl bg-az-glass-fill border border-az-glass-border">
              <p className="text-az-ink/50 font-semibold text-sm">Out of stock for this cycle</p>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="az-btn-primary inline-flex items-center justify-center gap-2 shadow-xl shadow-az-flame/25"
            >
              <Gift size={20} />
              <span>{claimMutation.isPending ? 'Redeeming Perk...' : 'Claim Reward'}</span>
            </motion.button>
          )}
        </motion.div>
      </section>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: RewardDetailContent }));
export default function RewardDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <p className="text-az-ink/50 text-sm">Loading perk details...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
