'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, ContentItem } from '../../lib/api';
import { webLogger } from '../../lib/logger';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';
import { useUniverses, useSettings } from '@/hooks/useDatabase';

export default function RealityPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const { isUniverseEnabled, hasFeature, isLoading: universesLoading } = useUniverses();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');
  const [shows, setShows] = useState<ContentItem[]>([]);
  const [selectedShow, setSelectedShow] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const maxVotes = Math.max(0, ...contestants.map((c) => c.votes));

  interface Contestant {
    id: string;
    name: string;
    avatar: string;
    votes: number;
    status: 'safe' | 'danger' | 'eliminated';
  }

  const isRealityEnabled = isUniverseEnabled('reality');

  useEffect(() => {
    let cancelled = false;

    async function fetchShows() {
      if (!isRealityEnabled) {
        setError('Reality universe is currently unavailable');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.content.getContentByUniverse('reality');
        if (cancelled) return;
        if (response.success && response.data) {
          const items = response.data.items || [];
          setShows(items);
          if (items.length > 0) setSelectedShow(items[0]);
        } else {
          setError(response.message || 'Failed to load reality shows');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load reality shows', { error: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchShows();
    return () => { cancelled = true; };
  }, [isRealityEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function fetchContestants() {
      if (!selectedShow) {
        setContestants([]);
        return;
      }

      try {
        const response = await api.reality.getContestants(selectedShow.id);
        if (cancelled) return;
        if (response.success && response.data) {
          setContestants(response.data);
        } else {
          setError(response.message || 'Failed to load contestants');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load contestants', { error: message });
      }
    }

    fetchContestants();
    return () => { cancelled = true; };
  }, [selectedShow]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: gradients.brand }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>{siteName}</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Reality'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Reality' ? '/reality' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Reality' ? colors.primary[500] : colors.text.secondary }}
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
        ) : selectedShow ? (
          <div className="relative h-[500px]">
            <img
              src={selectedShow.thumbnail}
              alt={selectedShow.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-2">{selectedShow.title}</h2>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl">{selectedShow.description}</p>
              <div className="flex items-center gap-4">
                <Button size="lg" variant="primary">
                  <span>🎬</span> Watch Live
                </Button>
                <Button size="lg" variant="secondary">
                  <span>📊</span> Vote Now
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Reality Shows
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Watch and vote for your favorite contestants
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <Card key={show.id} padding="none" className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
              <div className="relative">
                <img src={show.thumbnail} alt={show.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="mb-2">{show.contentType || 'Reality'}</Badge>
                  <h3 className="text-xl font-bold text-white">{show.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-3">{show.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">🎬 {show.duration || 0} min</span>
                  <span className="text-gray-400">📅 {new Date(show.createdAt).toLocaleDateString()}</span>
                </div>
                <Button variant="primary" className="w-full mt-4">
                  Watch Now
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
                Vote Leaderboard
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                See who's leading the competition
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
                {selectedShow?.title || 'Show'} - Current Vote Count
              </h3>
              <div className="space-y-4">
                {contestants.map((contestant, index) => (
                  <div key={contestant.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold" style={{ color: colors.text.primary }}>
                        {index + 1}
                      </span>
                      <Avatar size="md" fallback={contestant.avatar} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: colors.text.primary }}>{contestant.name}</span>
                        <span className="text-sm" style={{ color: colors.text.secondary }}>
                          {contestant.votes.toLocaleString()} votes
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(contestant.votes / (maxVotes || 1)) * 100}%`,
                            backgroundColor: contestant.status === 'safe' ? colors.success[500] : contestant.status === 'danger' ? colors.error[500] : colors.text.tertiary,
                          }}
                        />
                      </div>
                    </div>
                    {contestant.status === 'danger' && (
                      <Badge variant="error">Danger</Badge>
                    )}
                    {contestant.status === 'eliminated' && (
                      <Badge variant="secondary">Eliminated</Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="primary" className="w-full mt-6">
                Vote Now
              </Button>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Vote & Win Rewards!</h3>
                <p className="text-white/80 mb-4">
                  Every vote you cast earns you reward points that can be redeemed for exclusive content and prizes.
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{selectedShow?.pointsEarned ?? 0}</p>
                    <p className="text-sm text-white/70">Points Earned</p>
                  </div>
                  <div className="w-px h-12 bg-white/30" />
                  <div className="text-center">
                    <p className="text-3xl font-bold">{selectedShow?.votesToday ?? 0}</p>
                    <p className="text-sm text-white/70">Votes Today</p>
                  </div>
                </div>
              </div>

              <Card padding="none">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-bold" style={{ color: colors.text.primary }}>Vote Tips</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: colors.text.primary }}>Supervote Power</p>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>Use supervotes to multiply your impact</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: colors.text.primary }}>Daily Rewards</p>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>Vote daily to earn bonus points</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: colors.text.primary }}>Leaderboard Bonus</p>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>Top voters get exclusive perks</p>
                    </div>
                  </div>
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
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>{siteName}</h4>
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
            <p>© 2026 {siteName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
