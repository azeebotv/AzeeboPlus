'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Flame, Clock, Shield, Users, Vote, Play, ChevronRight } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface Contestant {
  id: string;
  name: string;
  tribe: 'Ikenga' | 'Odugwu';
  avatar: string;
  role: string;
  status: 'Immunity Winner' | 'Eviction Risk' | 'Safe';
  voteShare: number;
  votes: number;
}

const CONTESTANTS: Contestant[] = [
  {
    id: 'c1',
    name: 'Chukwudi "The Titan" Eze',
    tribe: 'Ikenga',
    avatar: '🦁',
    role: 'Fitness Coach, Enugu',
    status: 'Immunity Winner',
    voteShare: 42,
    votes: 382400,
  },
  {
    id: 'c2',
    name: 'Amaka Bello',
    tribe: 'Odugwu',
    avatar: '🐆',
    role: 'Marine Biologist, Lagos',
    status: 'Safe',
    voteShare: 29,
    votes: 264100,
  },
  {
    id: 'c3',
    name: 'Tunde Bakare',
    tribe: 'Ikenga',
    avatar: '🦅',
    role: 'Tactical Strategist, Ibadan',
    status: 'Eviction Risk',
    voteShare: 16,
    votes: 145800,
  },
  {
    id: 'c4',
    name: 'Zainab Mohammed',
    tribe: 'Odugwu',
    avatar: '👑',
    role: 'Survivalist, Kano',
    status: 'Eviction Risk',
    voteShare: 13,
    votes: 118300,
  },
];

export default function SurvivorIslandTitansPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'roster' | 'camp' | 'episodes'>('roster');

  return (
    <PageShell maxWidth="full" activeNav="Reality">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-az-flame/15 via-az-surface-root to-az-surface-root pt-10 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-az-pill bg-az-flame/20 px-3 py-1 text-xs font-black text-az-flame uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    Survivor Series • Season 3
                  </span>
                  <span className="rounded-az-pill bg-az-surface-panel px-3 py-1 text-xs font-bold text-az-warning-400">
                    🏆 ₦100,000,000 Grand Prize
                  </span>
                </div>
                <h1 className="az-display text-az-ink font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                  SURVIVOR : <span className="text-az-flame">ISLAND TITANS</span>
                </h1>
                <p className="az-lead text-az-ink-muted mt-3 max-w-xl">
                  18 castaways stranded on the remote shores of Snake Island, Badagry. Outwit,
                  Outplay, Outlast. You hold their eviction fate in your hands.
                </p>

                {/* Eviction Timer & CTAs */}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="rounded-az-control border border-az-flame/40 bg-az-surface-root p-3 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-az-flame" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-az-ink-muted block">
                        Tribal Council Closes In
                      </span>
                      <span className="text-sm font-extrabold text-az-ink">
                        01d : 14h : 22m : 45s
                      </span>
                    </div>
                  </div>

                  <Link href="/reality/voting">
                    <motion.button
                      type="button"
                      className="rounded-az-pill bg-az-flame px-7 py-3 text-xs font-bold text-az-surface-root shadow-lg flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Vote className="h-4 w-4" />
                      Vote to Save Now
                    </motion.button>
                  </Link>

                  <Link href="/reality/episodes">
                    <button
                      type="button"
                      className="rounded-az-pill border border-az-glass-border px-5 py-3 text-xs font-bold text-az-ink hover:bg-az-surface-panel transition-colors flex items-center gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Watch Episodes
                    </button>
                  </Link>
                </div>
              </div>

              {/* Island Stats Card */}
              <div className="w-full lg:w-80 rounded-az-card border border-az-glass-border bg-az-surface-root p-6 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-az-flame mb-4">
                  Island Camp Intel
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-az-glass-border">
                    <span className="text-az-ink-muted">Location</span>
                    <span className="font-bold text-az-ink">Snake Island, Lagos</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-az-glass-border">
                    <span className="text-az-ink-muted">Remaining Castaways</span>
                    <span className="font-bold text-az-ink">8 of 18 Remaining</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-az-glass-border">
                    <span className="text-az-ink-muted">Active Tribes</span>
                    <span className="font-bold text-az-ink">Ikenga vs Odugwu</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-az-ink-muted">Next Eviction</span>
                    <span className="font-bold text-az-error-400">Double Elimination</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tabs Switcher */}
      <div className="border-b border-az-glass-border bg-az-surface-root">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'border-az-flame text-az-flame'
                : 'border-transparent text-az-ink-muted hover:text-az-ink'
            }`}
          >
            <Users className="h-4 w-4" />
            Contestants & Power Rankings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camp')}
            className={`py-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'camp'
                ? 'border-az-flame text-az-flame'
                : 'border-transparent text-az-ink-muted hover:text-az-ink'
            }`}
          >
            <Shield className="h-4 w-4" />
            Tribal Alliances & Camp Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('episodes')}
            className={`py-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'episodes'
                ? 'border-az-flame text-az-flame'
                : 'border-transparent text-az-ink-muted hover:text-az-ink'
            }`}
          >
            <Play className="h-4 w-4" />
            Camp Diariez & Highlights
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="az-title text-az-ink font-bold">Live Eviction Radar</h2>
                <p className="az-caption text-az-ink-muted">
                  Audience votes determine who survives the upcoming Tribal Council.
                </p>
              </div>
              <Link
                href="/reality/voting"
                className="text-xs font-bold text-az-flame hover:underline flex items-center gap-1"
              >
                Full Voting Terminal <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTESTANTS.map((c, idx) => (
                <GlowCard key={c.id} universe="reality" className="p-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{c.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-az-ink-muted">
                          Rank #{idx + 1} • {c.tribe} Tribe
                        </span>
                        <span
                          className={`rounded-az-pill px-2.5 py-0.5 text-[10px] font-bold ${
                            c.status === 'Immunity Winner'
                              ? 'bg-az-success-500/20 text-az-success-400'
                              : c.status === 'Eviction Risk'
                                ? 'bg-az-error-500/20 text-az-error-400'
                                : 'bg-az-surface-panel text-az-ink-dim'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h3 className="az-title text-az-ink font-bold truncate mt-0.5">{c.name}</h3>
                      <p className="az-caption text-az-ink-muted">{c.role}</p>

                      {/* Vote Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-az-ink-dim font-bold">
                            {c.votes.toLocaleString()} Votes
                          </span>
                          <span className="font-extrabold text-az-flame">{c.voteShare}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-az-surface-root overflow-hidden">
                          <div
                            style={{ width: `${c.voteShare}%` }}
                            className="h-full rounded-full bg-az-flame transition-all duration-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'camp' && (
          <div className="rounded-az-card border border-az-glass-border bg-az-surface-root p-8 text-center space-y-4">
            <Shield className="h-12 w-12 text-az-flame mx-auto" />
            <h3 className="az-title text-az-ink font-bold">Interactive Island Territory Map</h3>
            <p className="az-caption text-az-ink-muted max-w-lg mx-auto">
              Inspect Ikenga Camp on North Shore vs Odugwu Camp on the Mangrove Bay, food supply
              caches, and hidden immunity idol locations.
            </p>
          </div>
        )}

        {activeTab === 'episodes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((ep) => (
              <GlowCard key={ep} universe="reality" className="p-4 space-y-3">
                <div className="aspect-video w-full rounded-az-control bg-az-surface-panel flex items-center justify-center relative group">
                  <Play className="h-10 w-10 text-az-flame group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    44:12
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-az-flame uppercase">
                    Episode {ep}
                  </span>
                  <h4 className="az-subtitle text-az-ink font-bold mt-0.5">
                    {ep === 1
                      ? 'Arrival on Snake Island'
                      : ep === 2
                        ? 'The Fire Challenge'
                        : 'Betrayal at Tribal Council'}
                  </h4>
                  <p className="az-caption text-az-ink-muted mt-1">
                    Tensions boil over as food rations run low between the tribes.
                  </p>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
