'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockGames = [
  {
    id: '1',
    title: 'African Quest',
    description: 'An adventure puzzle game exploring African landmarks',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=adventure%20puzzle%20game%20african%20landmarks%20colorful&image_size=landscape_16_9',
    players: '1-4',
    rating: 4.8,
    isPremium: true,
    genre: 'Puzzle',
  },
  {
    id: '2',
    title: 'Naija Street Race',
    description: 'High-speed racing through the streets of Lagos',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=street%20racing%20game%20lagos%20nigeria%20high%20speed&image_size=landscape_16_9',
    players: '1-8',
    rating: 4.6,
    isPremium: false,
    genre: 'Racing',
  },
  {
    id: '3',
    title: 'Savanna Safari',
    description: 'A wildlife simulation game set in the African savanna',
    thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=safari%20wildlife%20simulation%20game%20african%20savanna%20animals&image_size=landscape_16_9',
    players: '1',
    rating: 4.7,
    isPremium: false,
    genre: 'Simulation',
  },
];

const mockLeaderboard = [
  { id: '1', name: 'GameMaster', score: 245800, level: 45, avatar: 'GM' },
  { id: '2', name: 'ProPlayer', score: 218500, level: 42, avatar: 'PP' },
  { id: '3', name: 'NaijaGamer', score: 198200, level: 38, avatar: 'NG' },
  { id: '4', name: 'LagosKing', score: 187400, level: 36, avatar: 'LK' },
  { id: '5', name: 'ZaraPlays', score: 176300, level: 35, avatar: 'ZP' },
];

export default function GamesPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [games, setGames] = useState(mockGames);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.games.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Games'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Games' ? '/games' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Games' ? universeColors.games.primary : colors.text.secondary }}
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

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" className="w-full" />
        ) : (
          <div className="relative h-[500px]">
            <img
              src={games[0].thumbnail}
              alt={games[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                {games[0].isPremium && <Badge variant="success">Premium</Badge>}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: `${universeColors.games.primary}30`, color: universeColors.games.primary }}>
                  {games[0].genre}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">{games[0].title}</h2>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl">{games[0].description}</p>
              <div className="flex items-center gap-4">
                <Button size="lg" style={{ backgroundColor: universeColors.games.primary }}>
                  <span>🎮</span> Play Now
                </Button>
                <Button size="lg" variant="secondary">
                  <span>📊</span> Leaderboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Featured Games
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Play and earn rewards
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
              <div className="relative">
                <img src={game.thumbnail} alt={game.title} className="w-full h-48 object-cover" />
                {game.isPremium && (
                  <Badge variant="success" className="absolute top-2 right-2">
                    Premium
                  </Badge>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="outline" className="mb-2">{game.genre}</Badge>
                  <h3 className="text-xl font-bold text-white">{game.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-3">{game.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>👥 {game.players} players</span>
                  <span>⭐ {game.rating}</span>
                </div>
                <Button variant="primary" className="w-full" style={{ backgroundColor: universeColors.games.primary }}>
                  Play Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Top Players
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Compete and climb the ranks
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <Card padding="md">
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <div key={player.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: index < 3 ? `${universeColors.games.primary}20` : 'transparent' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.bg.tertiary, color: index < 3 ? '#000' : colors.text.primary }}>
                      {index + 1}
                    </span>
                    <Avatar size="medium" fallback={player.avatar} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: colors.text.primary }}>{player.name}</span>
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        Lvl {player.level}
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: universeColors.games.primary }}>
                      {player.score.toLocaleString()} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
