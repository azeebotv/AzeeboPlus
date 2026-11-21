'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Flame, Clock, Shield, Users, Vote, Play, ChevronRight, TrendingUp } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface Contestant {
  id: string;
  name: string;
  tribe: string;
  votes: number;
  voteShare: number;
  risk: string;
  rank: number;
  image: string;
  bio: string;
}

interface RealityShowData {
  id: string;
  showSlug: string;
  title: string;
  description: string;
  thumbnail: string;
  currentEpisode: number;
  totalEpisodes: number;
  tribes: string[];
  nextEviction: string;
  contestants: Contestant[];
}

export default function DynamicRealityShowPage() {
  const params = useParams();
  const showNameParam = (params?.showName as string) || 'survivor';

  const [showData, setShowData] = useState<RealityShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTribe, setSelectedTribe] = useState('all');
  const [votedContestants, setVotedContestants] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadShow() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reality-show?name=${encodeURIComponent(showNameParam)}`);
        const json = await res.json();
        if (json.success && isMounted) {
          setShowData(json.data);
        }
      } catch (err) {
        console.error('Failed to load reality show data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadShow();
    return () => {
      isMounted = false;
    };
  }, [showNameParam]);

  const handleVote = (id: string) => {
    setVotedContestants((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const contestants = showData?.contestants || [];
  const tribes = showData?.tribes || [];
  const filteredContestants = contestants.filter((c) => {
    if (selectedTribe === 'all') return true;
    return c.tribe.toLowerCase().includes(selectedTribe.toLowerCase());
  });

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-20 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Dynamic Reality Show Hero Banner */}
        <ScrollReveal>
          <div className="relative rounded-2xl overflow-hidden border border-az-glass-border mb-8 bg-gradient-to-r from-az-surface-panel to-black">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url('${
                  showData?.thumbnail ||
                  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80'
                }')`,
              }}
            />
            <div className="relative p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-az-flame text-xs sm:text-sm font-bold tracking-widest uppercase mb-3">
                  <Flame className="h-4 w-4" />
                  <span>Reality Universe Hub • Live Season</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                  {showData?.title || decodeURIComponent(showNameParam).replace(/-/g, ' ')}
                </h1>
                <p className="text-az-ink-muted mt-3 text-sm sm:text-base leading-relaxed">
                  {showData?.description ||
                    'High stakes competition, public voting, and dramatic evictions in the Azeebo Reality Universe.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <Link
                    href={`/reality/voting?show=${encodeURIComponent(showData?.id || showNameParam)}`}
                    className="px-6 py-3 rounded-xl bg-az-flame text-az-surface-root font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
                  >
                    <Vote className="h-4 w-4" />
                    Enter Eviction Voting Arena
                  </Link>
                  <Link
                    href={`/reality/episodes?show=${encodeURIComponent(showData?.id || showNameParam)}`}
                    className="px-5 py-3 rounded-xl bg-az-surface-panel/80 border border-az-glass-border text-white font-medium text-sm hover:bg-az-surface-panel transition-colors flex items-center gap-2"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Latest Episode ({showData?.currentEpisode || 3})
                  </Link>
                </div>
              </div>

              {/* Live Council / Eviction Countdown Box */}
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-5 border border-az-glass-border text-center md:min-w-[240px]">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-az-warning-400 uppercase tracking-wider mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Next Eviction Ceremony</span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white my-1">
                  01d 14h 22m
                </div>
                <p className="text-[11px] text-az-ink-muted mt-1">
                  Live Broadcast & Super-Vote Lock
                </p>
                <div className="mt-3 pt-3 border-t border-az-glass-border/60 flex items-center justify-center gap-1 text-xs text-az-flame font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Voting Gate Open</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tribal / Group Alliances Overview */}
        {tribes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {tribes.map((tribe, idx) => (
              <div
                key={tribe}
                className="p-5 rounded-xl bg-az-surface-panel/40 border border-az-glass-border flex items-center justify-between"
              >
                <div>
                  <div
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                      idx === 0 ? 'text-az-flame' : 'text-az-warning-400'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{tribe}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Alliance Camp • Active</h3>
                  <p className="text-xs text-az-ink-muted mt-0.5">
                    Live telemetry tracked directly from PostgreSQL reality DB.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTribe(tribe.toLowerCase())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selectedTribe === tribe.toLowerCase()
                      ? 'bg-az-flame text-az-surface-root border-az-flame'
                      : 'border-az-glass-border text-az-ink-muted hover:text-white'
                  }`}
                >
                  Filter Camp
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contestants Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-az-flame" />
              Live Eviction Radar & Vote Share
            </h2>
            <p className="text-xs sm:text-sm text-az-ink-muted mt-1">
              Data fetched live for <strong className="text-white">{showData?.title}</strong>. Cast
              votes to save your favourites.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTribe('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTribe === 'all'
                  ? 'bg-az-flame text-az-surface-root font-semibold'
                  : 'bg-az-surface-panel text-az-ink-muted border border-az-glass-border'
              }`}
            >
              All Contestants
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border"
              />
            ))}
          </div>
        ) : filteredContestants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-az-glass-border p-12 text-center">
            <Users className="h-10 w-10 text-az-ink-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold text-white">No contestants listed yet</h3>
            <p className="text-sm text-az-ink-muted mt-1">
              Contestant profiles for this show are currently being audited in the reality database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredContestants.map((c) => {
              const personalVotes = (votedContestants[c.id] || 0) * 10;
              const totalVotes = c.votes + personalVotes;
              return (
                <GlowCard key={c.id}>
                  <div className="p-4 flex flex-col justify-between h-full">
                    <div>
                      {/* Avatar & Tribe Badge */}
                      <div className="relative rounded-xl overflow-hidden aspect-square mb-3 border border-az-glass-border">
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-sm border border-az-glass-border">
                          {c.tribe}
                        </div>
                        {c.risk === 'danger' && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-az-error-500/80 text-white backdrop-blur-sm animate-pulse">
                            Eviction Risk
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-white text-base">{c.name}</h3>
                      <p className="text-xs text-az-ink-muted mt-0.5 line-clamp-2">{c.bio}</p>

                      {/* Vote Share Meter */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-az-ink-muted mb-1">
                          <span>Vote Share</span>
                          <span className="font-semibold text-white">{c.voteShare}%</span>
                        </div>
                        <div className="w-full bg-az-surface-panel rounded-full h-1.5 overflow-hidden border border-az-glass-border/40">
                          <div
                            className="bg-az-flame h-full rounded-full transition-all duration-500"
                            style={{ width: `${c.voteShare}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-az-ink-muted mt-1.5 text-right font-mono">
                          {totalVotes.toLocaleString()} Votes
                        </div>
                      </div>
                    </div>

                    {/* Action: Vote Button */}
                    <div className="mt-4 pt-3 border-t border-az-glass-border">
                      <button
                        onClick={() => handleVote(c.id)}
                        className="w-full py-2 rounded-lg bg-az-flame text-az-surface-root font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <Vote className="h-3.5 w-3.5" />
                        Cast 10 Quick Votes
                      </button>
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}

        {/* Video Confessional Diaries */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-az-flame fill-current" />
              Confessional Video Diaries
            </h2>
            <Link
              href="/reality/episodes"
              className="text-xs font-semibold text-az-flame hover:underline flex items-center gap-1"
            >
              Browse All Episodes <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((ep) => (
              <div
                key={ep}
                className="rounded-xl border border-az-glass-border bg-az-surface-panel/40 p-4 hover:border-az-flame/50 transition-colors"
              >
                <div className="aspect-video rounded-lg bg-black/60 mb-3 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <Play className="h-8 w-8 text-az-flame group-hover:scale-110 transition-transform fill-current" />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/80 text-white font-mono">
                    08:45
                  </span>
                </div>
                <div className="text-xs font-bold text-az-flame uppercase">Episode {ep}</div>
                <h4 className="font-semibold text-white text-sm mt-0.5">
                  {ep === 1
                    ? 'Arrival & Camp Settlement'
                    : ep === 2
                      ? 'The Immunity Showdown'
                      : 'The Midnight Eviction Strategy'}
                </h4>
                <p className="text-xs text-az-ink-muted mt-1">
                  Raw confessions recorded in the diary booth.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
