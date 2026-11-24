'use client';

import { useState, useEffect, useMemo } from 'react';
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
  homeLogo?: string;
  homeBadge?: string;
  awayTeam: string;
  awayLogo?: string;
  awayBadge?: string;
  league: string;
  leagueName?: string;
  time: string;
  date: string;
  venue: string;
  broadcast?: string;
  broadcaster?: string;
  status: string;
  score?: string;
  odds?: { home: number; draw: number; away: number };
}

export default function SportsCalendarPage() {
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2026-11-21');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const leagues = useMemo(() => {
    const fromFixtures = Array.from(
      new Set(fixtures.map((f) => f.league).filter((l): l is string => Boolean(l)))
    );
    const standard = ['NPFL', 'EPL', 'CAF', 'LA LIGA'];
    const merged = Array.from(new Set([...fromFixtures, ...standard]));
    return [{ id: 'all', name: 'All Leagues' }, ...merged.map((l) => ({ id: l, name: l }))];
  }, [fixtures]);

  useEffect(() => {
    let isMounted = true;
    async function loadFixtures() {
      try {
        const res = await fetch('/api/sports/fixtures');
        const json = await res.json();
        if (json.success && isMounted) {
          setFixtures(json.data);
          if (json.data[0]?.date) {
            setSelectedDate(json.data[0].date);
          }
        }
      } catch (err) {
        console.error('Failed to load sports fixtures:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFixtures();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleReminder = (id: string) => {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFixtures = fixtures.filter((f) => {
    const matchesLeague =
      selectedLeague === 'all' ||
      f.league.toUpperCase() === selectedLeague.toUpperCase() ||
      f.leagueName?.toUpperCase().includes(selectedLeague.toUpperCase());
    return matchesLeague;
  });

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-20 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-az-glass-border pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-az-flame text-sm font-semibold tracking-wider uppercase mb-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Sports Universe & Fan Zone</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Match Fixtures & League Calendar
              </h1>
              <p className="text-az-ink-muted mt-2 text-sm sm:text-base max-w-2xl">
                Real-time schedules, NPFL derbies, Continental showdowns, and live odds powered by
                Azeebo Sports.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sports"
                className="rounded-lg px-4 py-2 text-sm font-medium border border-az-glass-border hover:bg-az-surface-panel transition-colors"
              >
                Back to Sports Hub
              </Link>
              <Link
                href="/predictions"
                className="rounded-lg px-4 py-2 text-sm font-semibold bg-az-flame text-az-surface-root hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <TrendingUp className="h-4 w-4" />
                Predict & Win
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* League Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                selectedLeague === league.id
                  ? 'bg-az-flame text-az-surface-root font-semibold'
                  : 'bg-az-surface-panel/60 text-az-ink-muted hover:text-white border border-az-glass-border'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>

        {/* Date Selector Navigation Strip */}
        <div className="bg-az-surface-panel/40 rounded-xl p-3 border border-az-glass-border flex items-center justify-between mb-8">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-az-surface-panel text-az-ink-muted hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 text-sm font-medium text-white">
            <CalendarIcon className="h-4 w-4 text-az-flame" />
            <span>Active Match Day: {selectedDate}</span>
          </div>

          <button
            type="button"
            className="p-2 rounded-lg hover:bg-az-surface-panel text-az-ink-muted hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Fixtures List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border"
              />
            ))}
          </div>
        ) : filteredFixtures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-az-glass-border p-12 text-center">
            <CalendarIcon className="h-10 w-10 text-az-ink-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold text-white">
              No fixtures found for this selection
            </h3>
            <p className="text-sm text-az-ink-muted mt-1">
              Check back later or select All Leagues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFixtures.map((fixture) => {
              const isReminded = !!reminders[fixture.id];
              return (
                <GlowCard key={fixture.id}>
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: League & Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-az-surface-panel text-az-flame border border-az-glass-border">
                          {fixture.leagueName || fixture.league}
                        </span>
                        <span className="text-xs text-az-ink-muted flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {fixture.time}
                        </span>
                        {fixture.status === 'LIVE' && (
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-az-error-500/20 text-az-error-400 border border-az-error-500/30 animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>

                      {/* Teams Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {fixture.homeLogo ? (
                              <img
                                src={fixture.homeLogo}
                                alt={fixture.homeTeam}
                                className="w-6 h-6 rounded-full inline"
                              />
                            ) : (
                              '⚽'
                            )}
                          </span>
                          <span className="font-bold text-white text-base sm:text-lg">
                            {fixture.homeTeam}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {fixture.awayLogo ? (
                              <img
                                src={fixture.awayLogo}
                                alt={fixture.awayTeam}
                                className="w-6 h-6 rounded-full inline"
                              />
                            ) : (
                              '⚽'
                            )}
                          </span>
                          <span className="font-bold text-white text-base sm:text-lg">
                            {fixture.awayTeam}
                          </span>
                        </div>
                      </div>

                      {/* Metadata: Venue & Broadcaster */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-az-ink-muted mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-az-ink-muted" />
                          {fixture.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tv className="h-3 w-3 text-az-flame" />
                          {fixture.broadcast || fixture.broadcaster}
                        </span>
                      </div>
                    </div>

                    {/* Right: Odds & Action Controls */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 border-az-glass-border pt-3 md:pt-0">
                      {fixture.odds && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="px-2.5 py-1 rounded bg-az-surface-panel border border-az-glass-border text-center">
                            <span className="text-[10px] text-az-ink-muted block">1</span>
                            <span className="font-semibold text-white">{fixture.odds.home}</span>
                          </div>
                          <div className="px-2.5 py-1 rounded bg-az-surface-panel border border-az-glass-border text-center">
                            <span className="text-[10px] text-az-ink-muted block">X</span>
                            <span className="font-semibold text-white">{fixture.odds.draw}</span>
                          </div>
                          <div className="px-2.5 py-1 rounded bg-az-surface-panel border border-az-glass-border text-center">
                            <span className="text-[10px] text-az-ink-muted block">2</span>
                            <span className="font-semibold text-white">{fixture.odds.away}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleReminder(fixture.id)}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                            isReminded
                              ? 'bg-az-flame/20 border-az-flame text-az-flame'
                              : 'bg-az-surface-panel border-az-glass-border text-az-ink-muted hover:text-white'
                          }`}
                          title="Set Match Reminder"
                        >
                          <Bell className={`h-4 w-4 ${isReminded ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">
                            {isReminded ? 'Reminder Set' : 'Remind'}
                          </span>
                        </button>

                        <Link
                          href={`/predictions?fixture=${fixture.id}`}
                          className="px-3 py-2 rounded-lg bg-az-flame text-az-surface-root text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          Predict Outcome
                        </Link>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
