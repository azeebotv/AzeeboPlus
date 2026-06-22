'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWA } from '../hooks/usePWA';
import { api, ContentItem } from '../lib/api';
import { Button, Card, ContentCard, HeroCard, Skeleton, Divider, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { useSettings } from '@/hooks/useDatabase';

export default function Home(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { isOnline, isInstalled, install } = usePWA();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [featuredRes, trendingRes] = await Promise.all([
          api.content.getFeaturedContent(6),
          api.content.getTrendingContent(4),
        ]);

        if (featuredRes.success && featuredRes.data) {
          setFeaturedContent(featuredRes.data);
        }

        if (trendingRes.success && trendingRes.data) {
          setTrendingContent(trendingRes.data);
        }
      } catch {
        // Error handling is intentionally minimal - content will show as empty
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (!isInstalled && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setShowInstallPrompt(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {!isOnline && (
        <div className="bg-yellow-500 text-black text-center py-2 px-4 text-sm font-medium sticky top-0 z-50">
          ⚠️ You are offline. Some features may not be available.
        </div>
      )}

      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-card border border-border rounded-xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Install {siteName}</p>
              <p className="text-sm text-muted-foreground">Get the app experience on your device</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowInstallPrompt(false)}>
                Later
              </Button>
              <Button variant="primary" size="sm" onClick={handleInstall}>
                Install
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: gradients.brand }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">{siteName}</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="text-base font-medium hover:text-gray-200 transition-colors"
                style={{ color: colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {user?.name}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign Out
                </Button>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Hero Section */}
        <section>
          {isLoading ? (
            <Skeleton height="400px" borderRadius="24px" />
          ) : featuredContent.length > 0 ? (
            <HeroCard
              title={featuredContent[0].title}
              subtitle={`${featuredContent[0].universe.name.charAt(0).toUpperCase()}${featuredContent[0].universe.name.slice(1)} Original`}
              description={featuredContent[0].description}
              thumbnail={featuredContent[0].thumbnail}
              universe={
                featuredContent[0].universe.name as
                  | 'creator'
                  | 'brand'
                  | 'reality'
                  | 'lifestyle'
                  | 'vertical'
                  | 'movie'
                  | 'games'
                  | 'comedy'
                  | 'sports'
                  | 'premium'
              }
              isLive={false}
              isPremium={true}
              onPlay={() => {}}
            />
          ) : (
            <Skeleton height="400px" borderRadius="24px" />
          )}
        </section>

        {/* Featured Content Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Featured Content
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                Handpicked for you to discover.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} padding="none">
                    <Skeleton height="200px" borderRadius="0px" />
                    <div className="p-5 space-y-3">
                      <Skeleton width="80%" height="20px" />
                      <Skeleton width="60%" height="16px" />
                    </div>
                  </Card>
                ))
              : featuredContent.map((content) => (
                  <ContentCard
                    key={content.id}
                    title={content.title}
                    description={content.description}
                    thumbnail={content.thumbnail}
                    universe={
                      content.universe.name as
                        | 'creator'
                        | 'brand'
                        | 'reality'
                        | 'lifestyle'
                        | 'vertical'
                        | 'movie'
                        | 'games'
                        | 'comedy'
                        | 'sports'
                        | 'premium'
                    }
                    isPremium={true}
                    onClick={() => {}}
                  />
                ))}
          </div>
        </section>

        <Divider />

        {/* Trending Now Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Trending Now
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                What everyone is watching right now.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} padding="none">
                    <Skeleton height="140px" borderRadius="0px" />
                    <div className="p-4 space-y-2">
                      <Skeleton width="75%" height="18px" />
                    </div>
                  </Card>
                ))
              : trendingContent.map((content) => (
                  <ContentCard
                    key={content.id}
                    title={content.title}
                    thumbnail={content.thumbnail}
                    universe={
                      content.universe.name as
                        | 'creator'
                        | 'brand'
                        | 'reality'
                        | 'lifestyle'
                        | 'vertical'
                        | 'movie'
                        | 'games'
                        | 'comedy'
                        | 'sports'
                        | 'premium'
                    }
                    isPremium={true}
                    onClick={() => {}}
                  />
                ))}
          </div>
        </section>

        {/* Rewards & Call to Action */}
        <section
          className="py-12 rounded-3xl"
          style={{ background: gradients.brand, boxShadow: '0 20px 50px rgba(99,102,241,0.3)' }}
        >
          <div className="max-w-3xl mx-auto text-center px-6">
            <Badge variant="success">Earn While Watching</Badge>
            <h3 className="text-3xl sm:text-4xl font-bold mt-4 text-white mb-4">
              Unlock Exclusive Rewards
            </h3>
            <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
              Join {siteName} today and get rewarded for every show you watch, every vote you cast,
              and every share you make.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" leftIcon={<span>🔥</span>}>
                Start Earning Now
              </Button>
              <Button
                size="lg"
                variant="ghost"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', borderWidth: '1px' }}
              >
                Explore Rewards
              </Button>
            </div>
          </div>
        </section>
      </main>

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
