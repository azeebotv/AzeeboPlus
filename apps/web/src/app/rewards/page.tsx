'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  avatar?: string;
}

export default function RewardsPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setIsLoading(true);
        const [rewardsRes, balanceRes] = await Promise.all([
          apiFetch<Reward[]>('/v1/rewards'),
          apiFetch<{ balance: number }>('/v1/wallet/balance'),
        ]);

        if (rewardsRes.success && rewardsRes.data) {
          setRewards(rewardsRes.data);
        }
        if (balanceRes.success && balanceRes.data) {
          setUserPoints(balanceRes.data.balance);
        }
      } catch (err) {
        webLogger.error('Failed to fetch rewards', err);
        setError('Failed to load rewards. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: gradients.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Rewards'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Rewards' ? '/rewards' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Rewards' ? colors.primary[500] : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{user?.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Points Section */}
      <section className="py-12" style={{ background: gradients.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {isLoading ? (
            <Skeleton height="200px" className="w-full" />
          ) : (
            <div>
              <p className="text-white/80 mb-2">Your Points Balance</p>
              <h2 className="text-6xl font-bold text-white mb-4">{userPoints.toLocaleString()}</h2>
              <p className="text-white/70 mb-6">Keep earning points by watching, voting, and playing!</p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" style={{ backgroundColor: 'white', color: colors.primary[600] }}>
                  Redeem Points
                </Button>
                <Button size="lg" variant="outline" style={{ borderColor: 'white', color: 'white' }}>
                  How to Earn
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Rewards Shop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Rewards Shop
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Exchange your points for awesome rewards
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} padding="none">
                <Skeleton height="200px" />
                <div className="p-4 space-y-3">
                  <Skeleton width="80%" height="20px" />
                  <Skeleton width="60%" height="16px" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : rewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} padding="none" className="overflow-hidden">
                <div className="relative">
                  {reward.image && (
                    <img src={reward.image} alt={reward.title} className="w-full h-48 object-cover" />
                  )}
                  <Badge variant="success" className="absolute top-2 right-2">
                    {reward.points} pts
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>{reward.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{reward.description}</p>
                  <Button variant="primary" className="w-full" disabled={userPoints < reward.points}>
                    {userPoints >= reward.points ? 'Redeem' : 'Not enough points'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.text.secondary }}>No rewards available yet</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Azeebo+</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Help</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Legal</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Connect</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm" style={{ borderColor: colors.border.light, color: colors.text.tertiary }}>
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
