'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockRewards = [
  {
    id: '1',
    title: 'Free Movie Rental',
    description: 'Watch any premium movie for free',
    points: 500,
    image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=movie%20ticket%20reward%20voucher%20premium&image_size=square',
  },
  {
    id: '2',
    title: 'Premium Content Pass',
    description: '3 days of unlimited premium access',
    points: 1000,
    image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=premium%20pass%20reward%20golden%20ticket&image_size=square',
  },
  {
    id: '3',
    title: 'Creator Merchandise',
    description: 'Exclusive creator merchandise',
    points: 2000,
    image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=merchandise%20tshirt%20reward%20exclusive&image_size=square',
  },
];

const mockAchievements = [
  { id: '1', name: 'First Vote', description: 'Cast your first vote', unlocked: true, icon: '✅' },
  { id: '2', name: '7 Day Streak', description: 'Active for 7 consecutive days', unlocked: true, icon: '🔥' },
  { id: '3', name: 'Game Master', description: 'Complete 10 games', unlocked: false, icon: '🎮' },
  { id: '4', name: 'Top Predictor', description: 'Win 5 predictions in a row', unlocked: false, icon: '🎯' },
];

const mockLeaderboard = [
  { id: '1', name: 'RewardsKing', points: 54800, avatar: 'RK' },
  { id: '2', name: 'PointCollector', points: 48200, avatar: 'PC' },
  { id: '3', name: 'LoyalUser', points: 42100, avatar: 'LU' },
];

export default function RewardsPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [rewards, setRewards] = useState(mockRewards);
  const [achievements, setAchievements] = useState(mockAchievements);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [userPoints, setUserPoints] = useState(2450);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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
                  <Avatar size="medium" fallback={user?.name?.charAt(0) || 'U'} />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} padding="none" className="overflow-hidden">
              <div className="relative">
                <img src={reward.image} alt={reward.title} className="w-full h-48 object-cover" />
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
      </section>

      {/* Achievements & Leaderboard */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
                Achievements
              </h2>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} padding="md" className={`flex items-center gap-4 ${achievement.unlocked ? '' : 'opacity-50'}`}>
                    <span className="text-4xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold" style={{ color: colors.text.primary }}>{achievement.name}</h3>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>{achievement.description}</p>
                    </div>
                    {achievement.unlocked ? (
                      <Badge variant="success">Unlocked</Badge>
                    ) : (
                      <Badge variant="outline">Locked</Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
                Top Earners
              </h2>
              <Card padding="md">
                <div className="space-y-4">
                  {leaderboard.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.bg.tertiary, color: index < 3 ? '#000' : colors.text.primary }}>
                        {index + 1}
                      </span>
                      <Avatar size="medium" fallback={player.avatar} />
                      <div className="flex-1">
                        <span className="font-medium" style={{ color: colors.text.primary }}>{player.name}</span>
                      </div>
                      <span className="font-bold" style={{ color: colors.primary[500] }}>
                        {player.points.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
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
