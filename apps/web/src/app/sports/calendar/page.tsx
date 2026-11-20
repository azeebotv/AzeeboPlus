'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tv,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface FixtureMatch {
  id: string;
  homeTeam: string;
  homeBadge: string;
  awayTeam: string;
  awayBadge: string;
  league: string;
  time: string;
  date: string;
  venue: string;
  broadcaster: string;
  status: 'upcoming' | 'live' | 'completed';
  score?: [number, number];
  odds?: { home: number; draw: number; away: number };
}

const LEAGUES = [
  { id: 'all', name: 'All Leagues' },
  { id: 'npfl', name: 'NPFL (Nigeria)' },
  { id: 'epl', name: 'Premier League' },
  { id: 'caf', name: 'CAF Champions' },
  { id: 'laliga', name: 'La Liga' },
];

const FIXTURES: FixtureMatch[] = [
  {
    id: 'fix-1',
    homeTeam: 'Enyimba FC',
    homeBadge: '🐘',
    awayTeam: 'Rivers United',
    awayBadge: '🌊',
    league: 'NPFL (Nigeria)',
    date: 'Saturday, 21 Nov 2026',
    time: '16:00 WAT',
    venue: 'Enyimba Stadium, Aba',
    broadcaster: 'Azeebo+ Live',
    status: 'upcoming',
    odds: { home: 1.95, draw: 3.2, away: 3.8 },
  },
  {
    id: 'fix-2',
    homeTeam: 'Arsenal',
    homeBadge: '🔴',
    awayTeam: 'Chelsea',
    awayBadge: '🔵',
    league: 'Premier League',
    date: 'Saturday, 21 Nov 2026',
    time: '18:30 WAT',
    venue: 'Emirates Stadium, London',
    broadcaster: 'SuperSport & Azeebo+',
    status: 'upcoming',
    odds: { home: 2.1, draw: 3.4, away: 3.25 },
  },
  {
    id: 'fix-3',
    homeTeam: 'Al Ahly',
    homeBadge: '🦅',
    awayTeam: 'Mamelodi Sundowns',
    awayBadge: '☀️',
    league: 'CAF Champions',
    date: 'Sunday, 22 Nov 2026',
    time: '19:00 WAT',
    venue: 'Cairo International Stadium',
    broadcaster: 'Azeebo+ Sports 1',
    status: 'upcoming',
    odds: { home: 1.85, draw: 3.3, away: 4.0 },
  },
  {
    id: 'fix-4',
    homeTeam: 'Remo Stars',
    homeBadge: '⭐',
    awayTeam: 'Kano Pillars',
    awayBadge: '🟡',
    league: 'NPFL (Nigeria)',
    date: 'Sunday, 22 Nov 2026',
    time: '16:00 WAT',
    venue: 'Remo Stadium, Ikenne',
    broadcaster: 'Azeebo+ Live',
    status: 'upcoming',
    odds: { home: 1.75, draw: 3.4, away: 4.5 },
  },
  {
    id: 'fix-5',
    homeTeam: 'Real Madrid',
    homeBadge: '👑',
    awayTeam: 'Barcelona',
    awayBadge: '🔵🔴',
    league: 'La Liga',
    date: 'Sunday, 22 Nov 2026',
    time: '21:00 WAT',
    venue: 'Santiago Bernabéu, Madrid',
    broadcaster: 'Azeebo+ 4K Live',
    status: 'upcoming',
    odds: { home: 2.2, draw: 3.5, away: 2.9 },
  },
];

export default function SportsCalendarPage(): React.JSX.Element {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const toggleReminder = (id: string) => {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFixtures = FIXTURES.filter((fix) => {
    if (selectedLeague === 'all') return true;
    const leagueLower = fix.league.toLowerCase();
    return leagueLower.includes(selectedLeague.toLowerCase());
  });

  return (
    <PageShell maxWidth="full" activeNav="Sports">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Title & Date Range */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-az-pill bg-az-flame/15 px-3 py-1 text-xs font-bold text-az-flame uppercase tracking-wider">
                  🏆 Match Fixtures & League Calendar
                </span>
              </div>
              <h1 className="az-heading text-az-ink font-extrabold text-3xl sm:text-4xl">
                Global & African Football Schedule
              </h1>
              <p className="az-caption text-az-ink-muted mt-1">
                Official fixtures, kick-off countdowns, and live broadcast channels in WAT.
              </p>
            </div>

            {/* Week Switcher */}
            <div className="flex items-center gap-3 rounded-az-control border border-az-glass-border bg-az-surface-root p-2">
              <button
                type="button"
                className="rounded p-1.5 text-az-ink-muted hover:bg-az-surface-panel hover:text-az-ink transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 px-2 text-xs font-bold text-az-ink">
                <CalendarIcon className="h-3.5 w-3.5 text-az-flame" />
                <span>Matchweek 14 • Nov 2026</span>
              </div>
              <button
                type="button"
                className="rounded p-1.5 text-az-ink-muted hover:bg-az-surface-panel hover:text-az-ink transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* League Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {LEAGUES.map((league) => (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelectedLeague(league.id)}
              className={`rounded-az-pill px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                selectedLeague === league.id
                  ? 'bg-az-flame text-az-surface-root shadow-sm'
                  : 'border border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>

        {/* Fixtures Matrix */}
        <div className="space-y-4">
          {filteredFixtures.map((fix) => {
            const hasReminder = reminders[fix.id];
            return (
              <GlowCard key={fix.id} universe="sports" className="overflow-hidden">
                <div className="p-5 sm:p-6">
                  {/* Top Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-az-flame">{fix.league}</span>
                      <span className="text-az-ink-muted">•</span>
                      <span className="text-az-ink-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fix.date} @ {fix.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-az-pill bg-az-surface-panel px-2.5 py-0.5 text-[10px] font-semibold text-az-ink-dim flex items-center gap-1">
                        <Tv className="h-3 w-3 text-az-flame" /> {fix.broadcaster}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleReminder(fix.id)}
                        className={`rounded-full p-1.5 transition-colors ${
                          hasReminder
                            ? 'bg-az-flame/20 text-az-flame'
                            : 'text-az-ink-muted hover:bg-az-surface-panel hover:text-az-ink'
                        }`}
                        title={hasReminder ? 'Reminder Set' : 'Set Match Reminder'}
                      >
                        <Bell className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Match Teams Header */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 py-3">
                    {/* Home Team */}
                    <div className="md:col-span-2 flex items-center gap-3">
                      <span className="text-3xl">{fix.homeBadge}</span>
                      <div>
                        <h3 className="az-title text-az-ink font-bold">{fix.homeTeam}</h3>
                        <span className="text-[10px] text-az-ink-muted uppercase">Home</span>
                      </div>
                    </div>

                    {/* VS / Time Badge */}
                    <div className="text-center flex flex-col items-center justify-center">
                      <span className="rounded-az-pill bg-az-surface-root px-3 py-1 text-xs font-black text-az-ink-dim border border-az-glass-border">
                        VS
                      </span>
                      <span className="text-[10px] text-az-ink-muted mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {fix.venue}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="md:col-span-2 flex items-center md:justify-end gap-3">
                      <div className="md:text-right">
                        <h3 className="az-title text-az-ink font-bold">{fix.awayTeam}</h3>
                        <span className="text-[10px] text-az-ink-muted uppercase">Away</span>
                      </div>
                      <span className="text-3xl">{fix.awayBadge}</span>
                    </div>
                  </div>

                  {/* Odds & Predict Action Bar */}
                  {fix.odds && (
                    <div className="mt-4 pt-4 border-t border-az-glass-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-az-ink-muted font-medium">Odds Preview:</span>
                        <span className="rounded bg-az-surface-panel px-2 py-0.5 text-xs font-bold text-az-success-400">
                          1: {fix.odds.home.toFixed(2)}
                        </span>
                        <span className="rounded bg-az-surface-panel px-2 py-0.5 text-xs font-bold text-az-secondary-400">
                          X: {fix.odds.draw.toFixed(2)}
                        </span>
                        <span className="rounded bg-az-surface-panel px-2 py-0.5 text-xs font-bold text-az-error-400">
                          2: {fix.odds.away.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link href={`/sports/fixtures/${fix.id}`}>
                          <button
                            type="button"
                            className="rounded-az-pill border border-az-glass-border px-3.5 py-1.5 text-xs font-semibold text-az-ink hover:bg-az-surface-panel transition-colors"
                          >
                            Lineups & Pitch
                          </button>
                        </Link>
                        <Link href={`/sports/predictions?fixture=${fix.id}`}>
                          <motion.button
                            type="button"
                            className="rounded-az-pill bg-az-flame px-4 py-1.5 text-xs font-bold text-az-surface-root shadow flex items-center gap-1.5"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Predict & Win
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
