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
          <div className="az-glass p-8 rounded-3xl border border-white/10">
            <Skeleton height="360px" borderRadius="20px" />
          </div>
        </div>
      </PageShell>
    );

  if (query.error || !reward)
    return (
      <PageShell activeNav="Rewards">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <ErrorState title="Reward not found" buttonText="Return to Rewards" onButtonPress={() => window.location.assign('/rewards')} />
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
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Rewards Center</span>
        </Link>
      </div>

      <PageHero
        badge={`Perk Tier: ${reward.type}`}
        title={reward.title}
        subtitle={reward.description}
        accentColor="orange"
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4 border border-orange-500/30 shadow-lg shadow-orange-500/10">
              <Gift size={38} />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-orange-500/15 text-orange-400 border border-orange-500/30">
              {reward.type} Reward
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="az-glass p-4 rounded-2xl text-center border border-white/5">
              <p className="text-2xl font-black text-orange-400">₦{reward.pointsCost.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mt-1">Points Required</p>
            </div>
            <div className="az-glass p-4 rounded-2xl text-center border border-white/5">
              <p className="text-2xl font-black text-white">{reward.userPoints.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mt-1">Your Points</p>
            </div>
            <div className="az-glass p-4 rounded-2xl text-center border border-white/5">
              <p className="text-2xl font-black text-emerald-400">
                {reward.available}/{reward.totalSupply}
              </p>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mt-1">Remaining Supply</p>
            </div>
          </div>

          {reward.requirements && reward.requirements.length > 0 && (
            <div className="mb-8 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-orange-400" />
                <span>Unlock Criteria</span>
              </h3>
              <ul className="space-y-2">
                {reward.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-white/60 flex items-start gap-2.5">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reward.expiresAt && (
            <p className="text-xs text-white/40 text-center mb-6 flex items-center justify-center gap-1.5">
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
            <div className="w-full text-center py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-emerald-400 font-bold inline-flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>Perk Claimed Successfully!</span>
              </p>
            </div>
          ) : !canAfford ? (
            <div className="w-full text-center py-4 rounded-2xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 font-semibold text-sm">
                Insufficient points — you need {(reward.pointsCost - reward.userPoints).toLocaleString()} more PTS
              </p>
            </div>
          ) : !inStock ? (
            <div className="w-full text-center py-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/50 font-semibold text-sm">Out of stock for this cycle</p>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full az-btn-primary text-base font-bold py-4 inline-flex items-center justify-center gap-2 shadow-xl shadow-orange-600/25"
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
        <div className="min-h-screen flex items-center justify-center bg-[#0b090e]">
          <p className="text-white/50 text-sm">Loading perk details...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}

