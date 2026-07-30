'use client';
import { useQuery } from '@tanstack/react-query';

export const metadata = {
  title: 'Rewards Center | Azeebo',
  description: 'Earn points, complete missions, and unlock amazing rewards on Azeebo.',
  openGraph: {
    title: 'Rewards Center | Azeebo',
    description: 'Earn points, complete missions, and unlock amazing rewards on Azeebo.',
  },
};
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '@/lib/api';

import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { useToast } from '@/components/ToastProvider';

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
          icon: String(b.icon || '🏅'),
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
    } catch (err) {
      toast.showToast('Failed to claim reward', 'error');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Rewards" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Rewards Center</h1>
          <p className="text-white/50 text-lg mb-6">Earn points and unlock amazing rewards</p>
          <div className="az-glass inline-block px-8 py-4">
            <p className="text-sm text-white/50 mb-1">Your Points</p>
            <p className="text-4xl font-bold" style={{ color: 'var(--brand-orange)' }}>
              {userPoints.toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
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
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Rewards</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="az-glass h-64">
                  <Skeleton height="100%" borderRadius="0" />
                </div>
              ))}
            </div>
          ) : rewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="az-glass overflow-hidden transition-all hover:scale-[1.02]"
                  style={
                    !reward.isAvailable
                      ? { opacity: 0.5 }
                      : { boxShadow: '0 0 20px rgba(255,255,255,0.05)' }
                  }
                >
                  {reward.image && (
                    <OptimizedImage
                      src={reward.image}
                      alt={reward.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full mb-2 inline-block"
                      style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: 'var(--brand-orange)' }}
                    >
                      {reward.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2">{reward.title}</h3>
                    <p className="text-white/50 text-sm mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: 'var(--brand-orange)' }}>
                        {reward.points.toLocaleString()} pts
                      </span>
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
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${reward.isAvailable && userPoints >= reward.points ? 'az-btn-primary' : ''}`}
                        style={
                          !reward.isAvailable || userPoints < reward.points
                            ? {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.3)',
                                cursor: 'not-allowed',
                              }
                            : undefined
                        }
                      >
                        {!reward.isAvailable
                          ? 'Claimed'
                          : userPoints < reward.points
                            ? 'Not Enough'
                            : 'Claim'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="az-glass p-12 text-center">
              <p className="text-white/50 text-lg">No rewards available yet</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Achievements">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                role="listitem"
                className={`az-glass p-4 flex items-center gap-4 transition-all ${achievement.unlocked ? '' : 'opacity-60'}`}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: achievement.unlocked
                      ? 'rgba(232,66,10,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{achievement.name}</h3>
                  <p className="text-xs text-white/40 mb-2">{achievement.description}</p>
                  {!achievement.unlocked && (
                    <div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(achievement.progress / achievement.target) * 100}%`,
                          backgroundColor: 'var(--brand-orange)',
                        }}
                      />
                    </div>
                  )}
                  {achievement.unlocked && (
                    <span className="text-xs font-medium" style={{ color: 'var(--color-success-500)' }}>
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
