'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface SurvivorShowData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  currentEpisode: number;
  totalEpisodes: number;
  tribes: string[];
  nextEviction: string;
  contestants: Contestant[];
}

export default function RealitySurvivorHubPage() {
  const [showData, setShowData] = useState<SurvivorShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTribe, setSelectedTribe] = useState('all');
  const [votedContestants, setVotedContestants] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadSurvivorData() {
      try {
        const res = await fetch('/api/reality/survivor');
        const json = await res.json();
        if (json.success && isMounted) {
          setShowData(json.data);
        }
      } catch (err) {
        console.error('Failed to load survivor show data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSurvivorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVote = (id: string) => {
    setVotedContestants((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const contestants = showData?.contestants || [];
  const filteredContestants = contestants.filter((c) => {
    if (selectedTribe === 'all') return true;
    return c.tribe.toLowerCase().includes(selectedTribe.toLowerCase());
  });

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-20 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Flagship Show Hero Banner */}
        <ScrollReveal>
          <div className="relative rounded-2xl overflow-hidden border border-az-glass-border mb-8 bg-gradient-to-r from-az-surface-panel to-black">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80')]" />
            <div className="relative p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-az-flame text-xs sm:text-sm font-bold tracking-widest uppercase mb-3">
                  <Flame className="h-4 w-4" />
                  <span>Flagship Reality Experience • Season 1</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                  {showData?.title || 'SURVIVOR : ISLAND TITANS'}
                </h1>
                <p className="text-az-ink-muted mt-3 text-sm sm:text-base leading-relaxed">
                  {showData?.description ||
                    '16 castaways marooned on Snake Island fighting the elements, tribal alliances, and dramatic evictions for 100 Million Naira.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-6">
                  <Link
                    href="/reality/voting"
                    className="px-6 py-3 rounded-xl bg-az-flame text-az-surface-root font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
                  >
                    <Vote className="h-4 w-4" />
                    Enter Eviction Voting Arena
                  </Link>
                  <Link
                    href="/watch/survivor-ep3"
                    className="px-5 py-3 rounded-xl bg-az-surface-panel/80 border border-az-glass-border text-white font-medium text-sm hover:bg-az-surface-panel transition-colors flex items-center gap-2"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Latest Episode ({showData?.currentEpisode || 3})
                  </Link>
                </div>
              </div>

              {/* Live Tribal Council Countdown Box */}
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-5 border border-az-glass-border text-center md:min-w-[240px]">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-az-warning-400 uppercase tracking-wider mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Tribal Council Countdown</span>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white my-1">
                  01d 14h 22m
                </div>
                <p className="text-[11px] text-az-ink-muted mt-1">Next Eviction Ceremony</p>
                <div className="mt-3 pt-3 border-t border-az-glass-border/60 flex items-center justify-center gap-1 text-xs text-az-flame font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Voting Gate Open</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Tribal Alliances Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-az-surface-panel/40 border border-az-glass-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-az-flame text-xs font-bold uppercase tracking-wider">
                <Shield className="h-4 w-4" />
                <span>Ikenga Tribe</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Warrior Camp • Coastline</h3>
              <p className="text-xs text-az-ink-muted mt-0.5">
                8 Castaways Active • Won Immunity Challenge
              </p>
            </div>
            <button
              onClick={() => setSelectedTribe('ikenga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                selectedTribe === 'ikenga'
                  ? 'bg-az-flame text-az-surface-root border-az-flame'
                  : 'border-az-glass-border text-az-ink-muted hover:text-white'
              }`}
            >
              Filter Camp
            </button>
          </div>

          <div className="p-5 rounded-xl bg-az-surface-panel/40 border border-az-glass-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-az-warning-400 text-xs font-bold uppercase tracking-wider">
                <Shield className="h-4 w-4" />
                <span>Odugwu Tribe</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Ridge Camp • Highlands</h3>
              <p className="text-xs text-az-ink-muted mt-0.5">
                8 Castaways Active • Facing Eviction Radar
              </p>
            </div>
            <button
              onClick={() => setSelectedTribe('odugwu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                selectedTribe === 'odugwu'
                  ? 'bg-az-flame text-az-surface-root border-az-flame'
                  : 'border-az-glass-border text-az-ink-muted hover:text-white'
              }`}
            >
              Filter Camp
            </button>
          </div>
        </div>

        {/* Contestants Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-az-flame" />
              Live Eviction Radar & Vote Share
            </h2>
            <p className="text-xs sm:text-sm text-az-ink-muted mt-1">
              Data fetched live from Azeebo Reality DB. Cast votes to save your favourites.
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
              All Castaways
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

        {/* Camp Video Diaries */}
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
                    ? 'Arrival on Snake Island'
                    : ep === 2
                      ? 'The Fire Challenge'
                      : 'Midnight Betrayal'}
                </h4>
                <p className="text-xs text-az-ink-muted mt-1">
                  Raw confessions recorded in the secret diary booth.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
