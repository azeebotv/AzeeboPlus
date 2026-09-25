'use client';
import { useQuery } from '@tanstack/react-query';

import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '@/lib/api';

import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useToast } from '@/components/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Gift, Flame, Award, Target, ShoppingBag, CheckCircle2, ChevronRight } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
  isActive: boolean;
  type: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface RewardsBalance {
  balance?: number;
  points?: number;
}

interface RedeemResult {
  success: boolean;
}

const REWARDS_NAV = [
  { label: 'Overview', href: '/rewards', icon: Gift, active: true },
  { label: 'Daily Streak', href: '/rewards/streak', icon: Flame, active: false },
  { label: 'Badges', href: '/rewards/badges', icon: Award, active: false },
  { label: 'Missions', href: '/rewards/missions', icon: Target, active: false },
  { label: 'Redemption', href: '/rewards/redemption', icon: ShoppingBag, active: false },
];

export default function RewardsPage(): React.JSX.Element {
  const { isAuthenticated: _isAuthenticated } = useAuth();
  const toast = useToast();

  const missionsQuery = useQuery({
    queryKey: ['rewards', 'missions'],
    queryFn: async () => {
      const res = await apiFetch<{ missions: Mission[] } | Mission[]>('/rewards/missions');
      if (res.success && res.data) {
        const missions = Array.isArray(res.data)
          ? res.data
          : (res.data as { missions: Mission[] }).missions || [];
        return missions.map((m: Mission) => ({
          id: String(m.id),
          title: String(m.title || ''),
          description: String(m.description || ''),
          points: Number(m.points || 0),
          image: m.image,
          isAvailable: Boolean(m.isActive),
          category: String(m.type || 'mission'),
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const badgesQuery = useQuery({
    queryKey: ['rewards', 'badges'],
    queryFn: async () => {
      const res = await apiFetch<{ badges: Badge[] } | Badge[]>('/rewards/badges');
      if (res.success && res.data) {
        const badges = Array.isArray(res.data)
          ? res.data
          : (res.data as { badges: Badge[] }).badges || [];
        return badges.map((b: Badge) => ({
          id: String(b.id),
          name: String(b.name || ''),
          description: String(b.description || ''),
          unlocked: true,
          icon: String(b.icon || 'Medal'),
          progress: Number(b.points || 0),
          target: Number(b.points || 1),
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const balanceQuery = useQuery({
    queryKey: ['rewards', 'balance'],
    queryFn: async () => {
      const res = await apiFetch<RewardsBalance>('/rewards/balance');
      if (res.success && res.data) return Number(res.data.balance || res.data.points || 0);
      return 0;
    },
    staleTime: 60000,
  });

  const rewards = missionsQuery.data ?? [];
  const achievements = badgesQuery.data ?? [];
  const userPoints = balanceQuery.data ?? 0;
  const isLoading = missionsQuery.isLoading || badgesQuery.isLoading || balanceQuery.isLoading;
  const error =
    missionsQuery.error?.message ||
    badgesQuery.error?.message ||
    balanceQuery.error?.message ||
    null;

  const handleClaimReward = async (rewardId: string): Promise<void> => {
    try {
      const result = await apiFetch<RedeemResult>('/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      });
      if (result.success) {
        toast.showToast('Reward claimed successfully!', 'success');
        missionsQuery.refetch();
      }
    } catch {
      toast.showToast('Failed to claim reward', 'error');
    }
  };

  return (
    <PageShell activeNav="Rewards">
      <PageHero
        badge="Loyalty & Gamification"
        title="Rewards Center"
        subtitle="Earn Azeebo loyalty coins, build unstoppable watch streaks, and unlock exclusive VIP perks."
        accentColor="orange"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <div className="az-glass inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
            <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Your Balance:</span>
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
              {userPoints.toLocaleString()} PTS
            </span>
          </div>
          <Link
            href="/rewards/redemption"
            className="az-btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-orange-600/20"
          >
            <ShoppingBag size={16} />
            <span>Redeem Store</span>
          </Link>
        </div>
      </PageHero>

      {/* Universe Rewards Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {REWARDS_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  item.active
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm shadow-orange-500/10'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {error && (
          <div className="mb-8">
            <ErrorState
              title="Failed to load rewards"
              description={error}
              buttonText="Retry"
              onButtonPress={() => {
                missionsQuery.refetch();
                badgesQuery.refetch();
                balanceQuery.refetch();
              }}
            />
          </div>
        )}

        {/* Available Rewards Grid */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Featured Bounties & Perks</h2>
              <p className="text-xs sm:text-sm text-white/50">Complete universe challenges or cash in points directly</p>
            </div>
            <Link
              href="/rewards/missions"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Missions</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="az-glass h-64 rounded-2xl p-4">
                  <Skeleton height="100%" borderRadius="16px" />
                </div>
              ))}
            </div>
          ) : rewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="az-glass rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-white/10 hover:border-orange-500/30 group"
                  style={
                    !reward.isAvailable
                      ? { opacity: 0.55 }
                      : { boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }
                  }
                >
                  {reward.image ? (
                    <div className="relative h-44 overflow-hidden">
                      <OptimizedImage
                        src={reward.image}
                        alt={reward.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b090e] via-transparent to-transparent" />
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-orange-400 border border-orange-500/30 uppercase tracking-widest">
                        {reward.category}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-orange-950/40 to-black/60 flex items-center justify-between px-6 border-b border-white/5">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                        <Gift size={24} />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-orange-400 border border-white/10 uppercase tracking-widest">
                        {reward.category}
                      </span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {reward.title}
                    </h3>
                    <p className="text-white/50 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        <span className="text-xs text-white/40 block">Cost</span>
                        <span className="text-lg font-black text-orange-400">
                          {reward.points.toLocaleString()} PTS
                        </span>
                      </div>
                      <button
                        aria-label={
                          !reward.isAvailable
                            ? `Reward ${reward.title} already claimed`
                            : userPoints < reward.points
                              ? `Not enough points to claim ${reward.title}`
                              : `Claim ${reward.title} for ${reward.points} points`
                        }
                        onClick={() => handleClaimReward(reward.id)}
                        disabled={!reward.isAvailable || userPoints < reward.points}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                          reward.isAvailable && userPoints >= reward.points
                            ? 'az-btn-primary shadow-lg shadow-orange-600/20'
                            : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {!reward.isAvailable
                          ? 'Claimed'
                          : userPoints < reward.points
                            ? 'Insufficient Pts'
                            : 'Claim Bounty'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="az-glass rounded-2xl p-8 border border-white/10">
              <EmptyState
                icon="gift"
                title="No rewards available yet"
                description="Check back shortly or complete daily missions to unlock fresh bounties."
                dark
              />
            </div>
          )}
        </section>

        {/* Achievements / Badges Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Recent Achievements</h2>
              <p className="text-xs sm:text-sm text-white/50">Your hall of fame badges and milestone trophies</p>
            </div>
            <Link
              href="/rewards/badges"
              className="text-xs font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View Badge Showcase</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Achievements"
          >
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                role="listitem"
                className={`az-glass rounded-2xl p-5 flex items-center gap-4 transition-all border border-white/10 hover:border-white/20 ${
                  achievement.unlocked ? 'bg-gradient-to-r from-orange-950/20 to-transparent' : 'opacity-60'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border"
                  style={{
                    backgroundColor: achievement.unlocked
                      ? 'rgba(232,66,10,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    borderColor: achievement.unlocked
                      ? 'rgba(232,66,10,0.3)'
                      : 'rgba(255,255,255,0.1)',
                    color: achievement.unlocked ? 'var(--brand-orange)' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Award size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{achievement.name}</h3>
                  <p className="text-xs text-white/40 mb-2 truncate">{achievement.description}</p>
                  {!achievement.unlocked ? (
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%`,
                          backgroundColor: 'var(--brand-orange)',
                        }}
                      />
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 size={13} />
                      <span>Unlocked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

