'use client';

import React from 'react';
import Link from 'next/link';
import {
  Film,
  Tv,
  Laugh,
  Trophy,
  Gamepad2,
  Smartphone,
  Compass,
  Radio,
  ChevronRight,
} from 'lucide-react';

export interface ExploreUniversesDockProps {
  currentUniverse?: string;
  className?: string;
}

interface UniverseDockItem {
  id: string;
  name: string;
  tagline: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>;
  color: string;
  glow: string;
}

const UNIVERSES: UniverseDockItem[] = [
  {
    id: 'reality',
    name: 'Reality TV',
    tagline: 'Live Voting & Dramas',
    href: '/reality',
    icon: Tv,
    color: 'var(--color-az-universe-reality)',
    glow: 'rgba(255, 107, 107, 0.25)',
  },
  {
    id: 'movies',
    name: 'Movies & Series',
    tagline: 'Blockbusters & Cinema Passes',
    href: '/movies',
    icon: Film,
    color: 'var(--color-az-universe-movies)',
    glow: 'rgba(255, 234, 167, 0.25)',
  },
  {
    id: 'comedy',
    name: 'Comedy Hub',
    tagline: 'Stand-up & Viral Roasts',
    href: '/comedy',
    icon: Laugh,
    color: 'var(--color-az-universe-comedy)',
    glow: 'rgba(243, 156, 18, 0.25)',
  },
  {
    id: 'sports',
    name: 'Sports & Odds',
    tagline: 'Fan Engagement & Predictions',
    href: '/sports',
    icon: Trophy,
    color: 'var(--color-az-universe-sports)',
    glow: 'rgba(231, 76, 60, 0.25)',
  },
  {
    id: 'games',
    name: 'Games & Esports',
    tagline: 'Tournaments & Trivia',
    href: '/games',
    icon: Gamepad2,
    color: 'var(--color-az-universe-games)',
    glow: 'rgba(221, 160, 221, 0.25)',
  },
  {
    id: 'vertical',
    name: 'Vertical Series',
    tagline: 'Fast-paced 9:16 Shorts',
    href: '/vertical',
    icon: Smartphone,
    color: 'var(--color-az-universe-vertical)',
    glow: 'rgba(150, 206, 180, 0.25)',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Nightlife',
    tagline: 'Guides, Culture & Apparel',
    href: '/lifestyle',
    icon: Compass,
    color: 'var(--color-az-universe-lifestyle)',
    glow: 'rgba(69, 183, 209, 0.25)',
  },
  {
    id: 'live',
    name: 'Live Screenings',
    tagline: 'Broadcasts & Premiere Drops',
    href: '/live',
    icon: Radio,
    color: 'var(--color-az-scarlet)',
    glow: 'rgba(229, 9, 20, 0.35)',
  },
];

export function ExploreUniversesDock({
  currentUniverse,
  className = '',
}: ExploreUniversesDockProps): React.JSX.Element {
  const normalizedCurrent = currentUniverse?.toLowerCase() || '';

  return (
    <section
      aria-label="Explore Azeebo Universes"
      className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--color-az-flame)' }}
            />
            <span
              className="text-xs uppercase font-bold tracking-widest"
              style={{ color: 'var(--color-az-flame)' }}
            >
              Universal Portal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Explore Azeebo+
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5">
            Seamlessly hop into any specialized entertainment universe
          </p>
        </div>
        <Link
          href="/browse"
          className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          View All Universes
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {UNIVERSES.map((universe) => {
          const isActive =
            normalizedCurrent.includes(universe.id) ||
            universe.name.toLowerCase().includes(normalizedCurrent);
          const Icon = universe.icon;

          return (
            <Link
              key={universe.id}
              href={universe.href}
              className="group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl transition-all duration-300"
              style={{
                backgroundColor: isActive
                  ? 'rgba(255, 91, 0, 0.12)'
                  : 'var(--color-az-surface-panel)',
                border: isActive
                  ? '1px solid var(--color-az-flame)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 20px rgba(255, 91, 0, 0.25)' : 'none',
              }}
            >
              {isActive && (
                <span
                  className="absolute -top-1.5 px-2 py-0.2 rounded-full text-[9px] font-bold tracking-wider uppercase text-white"
                  style={{ backgroundColor: 'var(--color-az-flame)' }}
                >
                  Active
                </span>
              )}

              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: `0 0 15px ${universe.glow}`,
                }}
              >
                <Icon size={22} className="transition-colors" style={{ color: universe.color }} />
              </div>

              <span
                className="text-xs font-semibold text-white transition-colors line-clamp-1"
                style={{ color: isActive ? 'var(--color-az-flame)' : undefined }}
              >
                {universe.name}
              </span>
              <span className="text-[10px] text-white/40 mt-0.5 line-clamp-1 group-hover:text-white/60 transition-colors">
                {universe.tagline}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ExploreUniversesDock;
