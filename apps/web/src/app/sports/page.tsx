'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch, ContentItem } from '@/lib/api';
import { webLogger } from '@/lib/logger';

export default function SportsPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [matches, setMatches] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<ContentItem[]>('/v1/content?universe=sports&limit=20');

        if (result.success && result.data) {
          setMatches(result.data);
        }
      } catch (err) {
        webLogger.error('Failed to fetch sports content', err);
        setError('Failed to load sports content. Please try again.');
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: universeColors.sports.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Sports'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Sports' ? '/sports' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Sports' ? universeColors.sports.primary : colors.text.secondary }}
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

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="500px" className="w-full" />
        ) : error ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>{error}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        ) : matches.length > 0 ? (
          <div className="relative h-[500px]" style={{ background: `linear-gradient(135deg, ${universeColors.sports.primary}, ${universeColors.sports.secondary})` }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl font-bold">⚽</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">{matches[0].title}</h2>
                <p className="text-white/80 text-lg mb-6 max-w-2xl">{matches[0].description}</p>
                <div className="flex items-center justify-center gap-4">
                  <Button size="lg" variant="secondary">
                    <span>▶️</span> Watch Live
                  </Button>
                  <Button size="lg" style={{ backgroundColor: 'white', color: universeColors.sports.primary }}>
                    <span>🎯</span> Make Prediction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <p className="text-lg" style={{ color: colors.text.secondary }}>No sports content available</p>
          </div>
        )}
      </section>

      {/* Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Featured Sports Content
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Don&apos;t miss the action
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
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card key={match.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img src={match.thumbnail} alt={match.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge variant="outline" className="mb-2">{match.contentType || 'Sport'}</Badge>
                    <h3 className="text-xl font-bold text-white">{match.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{match.description}</p>
                  <Button variant="primary" className="w-full" style={{ backgroundColor: universeColors.sports.primary }}>
                    Watch Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.text.secondary }}>No sports content available yet</p>
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
