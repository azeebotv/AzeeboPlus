'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch, ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { useUniverses, useSettings } from '@/hooks/useDatabase';

export default function GamesPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const { isUniverseEnabled, hasFeature } = useUniverses();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const isGamesEnabled = isUniverseEnabled('games');
  const showStreaming = hasFeature('games', 'streaming_enabled');
  const showTournaments = hasFeature('games', 'tournaments_enabled');
  const [games, setGames] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<ContentItem[]>('/v1/content?universe=games&limit=20');

        if (result.success && result.data) {
          setGames(result.data);
        }
      } catch (err) {
        webLogger.error('Failed to fetch games content', err);
        setError('Failed to load games. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: universeColors.games.primary }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1
              className="text-2xl font-bold hidden sm:block"
              style={{ color: colors.text.primary }}
            >
              {siteName}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Games'].map((item) => (
              <Link
                key={item}
                href={
                  item === 'Home' ? '/' : item === 'Games' ? '/games' : `/${item.toLowerCase()}`
                }
                className="text-base font-medium transition-colors"
                style={{
                  color: item === 'Games' ? universeColors.games.primary : colors.text.secondary,
                }}
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
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {user?.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
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
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>
                {error}
              </p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        ) : games.length > 0 ? (
          <div className="relative h-[500px]">
            <img
              src={games[0].thumbnail}
              alt={games[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="success">Premium</Badge>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4"
                  style={{
                    backgroundColor: `${universeColors.games.primary}30`,
                    color: universeColors.games.primary,
                  }}
                >
                  {games[0].contentType || 'Game'}
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
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              No games available
            </p>
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} padding="none">
                <Skeleton height="240px" />
                <div className="p-4 space-y-3">
                  <Skeleton width="80%" height="20px" />
                  <Skeleton width="60%" height="16px" />
                </div>
              </Card>
            ))}
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                padding="none"
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img src={game.thumbnail} alt={game.title} className="w-full h-48 object-cover" />
                  <Badge variant="success" className="absolute top-2 right-2">
                    Premium
                  </Badge>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge variant="outline" className="mb-2">
                      {game.contentType || 'Game'}
                    </Badge>
                    <h3 className="text-xl font-bold text-white">{game.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{game.description}</p>
                  <Button
                    variant="primary"
                    className="w-full"
                    style={{ backgroundColor: universeColors.games.primary }}
                  >
                    Play Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              No games available yet
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                {siteName}
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Help
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Legal
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Connect
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="mt-12 pt-8 border-t text-center text-sm"
            style={{ borderColor: colors.border.light, color: colors.text.tertiary }}
          >
            <p>© 2026 {siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
