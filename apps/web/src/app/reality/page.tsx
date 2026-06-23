'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { api, ContentItem } from '../../lib/api';
import { webLogger } from '../../lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: 'safe' | 'danger' | 'eliminated';
}

export default function RealityPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [shows, setShows] = useState<ContentItem[]>([]);
  const [selectedShow, setSelectedShow] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const maxVotes = Math.max(0, ...contestants.map((c) => c.votes));

  useEffect(() => {
    let cancelled = false;

    async function fetchShows() {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchContestants() {
      if (!selectedShow) { setContestants([]); return; }
      try {
        const response = await api.reality.getContestants(selectedShow.id);
        if (cancelled) return;
        if (response.success && response.data) {
          setContestants(response.data);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        webLogger.error('Failed to load contestants', { error: message });
      }
    }

    fetchContestants();
    return () => { cancelled = true; };
  }, [selectedShow]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Reality" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <div className="h-[500px] animate-pulse" style={{ backgroundColor: '#2A2A2A' }} />
        ) : selectedShow ? (
          <div className="relative h-[500px]">
            <img src={selectedShow.thumbnail} alt={selectedShow.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-2">{selectedShow.title}</h2>
              <p className="text-white/60 text-lg mb-6 max-w-2xl">{selectedShow.description}</p>
              <div className="flex items-center gap-4">
                <Link href={`/watch/${selectedShow.id}`}>
                  <button type="button" className="az-btn-primary" style={{ width: 'auto', paddingInline: '2rem' }}>
                    Watch Live
                  </button>
                </Link>
                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  Vote Now
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Reality Shows</h2>
            <p className="text-base mt-1 text-white/50">Watch and vote for your favorite contestants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <Link key={show.id} href={`/watch/${show.id}`}>
              <article
                className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
              >
                <div className="relative">
                  <img src={show.thumbnail} alt={show.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                      style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                    >
                      {show.contentType || 'Reality'}
                    </span>
                    <h3 className="text-xl font-bold text-white">{show.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-white/50 mb-3">{show.description}</p>
                  <div className="flex items-center justify-between text-sm text-white/40">
                    <span>{show.duration || 0} min</span>
                    <span>{new Date(show.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button type="button" className="az-btn-primary w-full mt-4">
                    Watch Now
                  </button>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      {contestants.length > 0 && (
        <section className="py-12" style={{ backgroundColor: '#0d0505' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Vote Leaderboard</h2>
                <p className="text-base mt-1 text-white/50">See who&apos;s leading the competition</p>
              </div>
              <Link
                href="/reality/results"
                className="text-sm font-medium text-[#E8420A] hover:text-[#CC1C1C] transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="az-glass p-6">
                <h3 className="text-lg font-bold mb-4 text-white">
                  {selectedShow?.title || 'Show'} - Current Vote Count
                </h3>
                <div className="space-y-4">
                  {contestants.map((contestant, index) => (
                    <div key={contestant.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          {index + 1}
                        </span>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                          style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                        >
                          {contestant.avatar?.charAt(0) || contestant.name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{contestant.name}</span>
                          <span className="text-sm text-white/50">{contestant.votes.toLocaleString()} votes</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(contestant.votes / (maxVotes || 1)) * 100}%`,
                              background: contestant.status === 'safe'
                                ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                                : contestant.status === 'danger'
                                  ? 'linear-gradient(90deg, #EF4444, #F87171)'
                                  : 'rgba(255,255,255,0.3)',
                            }}
                          />
                        </div>
                      </div>
                      {contestant.status === 'danger' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>
                          Danger
                        </span>
                      )}
                      {contestant.status === 'eliminated' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                          Eliminated
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="az-btn-primary w-full mt-6">
                  Vote Now
                </button>
              </div>

              <div className="space-y-6">
                <div
                  className="rounded-xl p-6 text-white"
                  style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                >
                  <h3 className="text-xl font-bold mb-2">Vote & Win Rewards!</h3>
                  <p className="text-white/80 mb-4">
                    Every vote you cast earns you reward points that can be redeemed for exclusive content and prizes.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {(selectedShow as unknown as { pointsEarned?: number })?.pointsEarned ?? 0}
                      </p>
                      <p className="text-sm text-white/70">Points Earned</p>
                    </div>
                    <div className="w-px h-12" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {(selectedShow as unknown as { votesToday?: number })?.votesToday ?? 0}
                      </p>
                      <p className="text-sm text-white/70">Votes Today</p>
                    </div>
                  </div>
                </div>

                <div className="az-glass">
                  <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 className="font-bold text-white">Vote Tips</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { icon: '💡', title: 'Supervote Power', desc: 'Use supervotes to multiply your impact' },
                      { icon: '🎁', title: 'Daily Rewards', desc: 'Vote daily to earn bonus points' },
                      { icon: '🏆', title: 'Leaderboard Bonus', desc: 'Top voters get exclusive perks' },
                    ].map((tip) => (
                      <div key={tip.title} className="flex items-start gap-3">
                        <span className="text-lg">{tip.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-white">{tip.title}</p>
                          <p className="text-xs text-white/50">{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <AppFooter />
    </div>
  );
}
