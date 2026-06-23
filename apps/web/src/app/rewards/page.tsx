'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
  isAvailable: boolean;
  category: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
  progress: number;
  target: number;
}

export default function RewardsPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setIsLoading(true);
        const [rewardsRes, achievementsRes, balanceRes] = await Promise.all([
          apiFetch<Reward[]>('/v1/rewards'),
          apiFetch<Achievement[]>('/v1/rewards/achievements'),
          apiFetch<{ balance: number }>('/v1/wallet/balance'),
        ]);
        if (rewardsRes.success && rewardsRes.data) setRewards(rewardsRes.data);
        if (achievementsRes.success && achievementsRes.data) setAchievements(achievementsRes.data);
        if (balanceRes.success && balanceRes.data) setUserPoints(balanceRes.data.balance);
      } catch (err) {
        webLogger.error('Failed to fetch rewards', err);
        setError('Failed to load rewards. Please try again.');
      } finally { setIsLoading(false); }
    };
    fetchRewards();
  }, []);

  const handleClaimReward = async (rewardId: string): Promise<void> => {
    try {
      const result = await apiFetch(`/v1/rewards/${rewardId}/claim`, { method: 'POST' });
      if (result.success) {
        alert('Reward claimed successfully!');
        setRewards((prev) => prev.map((r) => r.id === rewardId ? { ...r, isAvailable: false } : r));
      }
    } catch (err) { alert('Failed to claim reward'); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Rewards" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Rewards Center</h1>
          <p className="text-white/50 text-lg mb-6">Earn points and unlock amazing rewards</p>
          <div className="az-glass inline-block px-8 py-4">
            <p className="text-sm text-white/50 mb-1">Your Points</p>
            <p className="text-4xl font-bold" style={{ color: '#E8420A' }}>{userPoints.toLocaleString()}</p>
          </div>
        </div>

        {error && <div className="az-glass p-4 mb-6 text-center text-white/60">{error}</div>}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Rewards</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="az-glass h-64 animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />)}
            </div>
          ) : rewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="az-glass overflow-hidden transition-all hover:scale-[1.02]"
                  style={!reward.isAvailable ? { opacity: 0.5 } : { boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}>
                  {reward.image && <img src={reward.image} alt={reward.title} className="w-full h-40 object-cover" />}
                  <div className="p-6">
                    <span className="text-xs font-medium px-2 py-1 rounded-full mb-2 inline-block" style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}>{reward.category}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{reward.title}</h3>
                    <p className="text-white/50 text-sm mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: '#E8420A' }}>{reward.points.toLocaleString()} pts</span>
                      <button onClick={() => handleClaimReward(reward.id)} disabled={!reward.isAvailable || userPoints < reward.points}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${reward.isAvailable && userPoints >= reward.points ? 'az-btn-primary' : ''}`}
                        style={!reward.isAvailable || userPoints < reward.points ? { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' } : undefined}
                      >{!reward.isAvailable ? 'Claimed' : userPoints < reward.points ? 'Not Enough' : 'Claim'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="az-glass p-12 text-center"><p className="text-white/50 text-lg">No rewards available yet</p></div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`az-glass p-4 flex items-center gap-4 transition-all ${achievement.unlocked ? '' : 'opacity-60'}`}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: achievement.unlocked ? 'rgba(232,66,10,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{achievement.name}</h3>
                  <p className="text-xs text-white/40 mb-2">{achievement.description}</p>
                  {!achievement.unlocked && (
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(achievement.progress / achievement.target) * 100}%`, backgroundColor: '#E8420A' }} />
                    </div>
                  )}
                  {achievement.unlocked && <span className="text-xs font-medium" style={{ color: '#22C55E' }}>✓ Unlocked</span>}
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
