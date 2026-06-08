'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  points: number;
  level: number;
  streak: number;
  predictionsCorrect: number;
  badges: string[];
  isCurrentUser: boolean;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
type Category = 'overall' | 'predictions' | 'voting' | 'engagement';

export default function LeaderboardPage(): JSX.Element {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [category, setCategory] = useState<Category>('overall');

  useEffect(() => {
    loadLeaderboard();
  }, [timePeriod, category]);

  const loadLeaderboard = async (): Promise<void> => {
    try {
      const result = await apiFetch<LeaderboardEntry[]>(
        `/v1/engagement/leaderboard?timePeriod=${timePeriod}&category=${category}`
      );

      if (result.success && result.data) {
        setEntries(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load leaderboard', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top performers this {timePeriod === 'alltime' ? 'all time' : timePeriod}</p>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['daily', 'weekly', 'monthly', 'alltime'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                timePeriod === period
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {period === 'alltime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(['overall', 'predictions', 'voting', 'engagement'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {entries.slice(0, 3).map((entry) => (
            <div
              key={entry.userId}
              className={`bg-card rounded-xl border-2 p-6 text-center ${
                entry.rank === 1
                  ? 'border-yellow-500'
                  : entry.rank === 2
                  ? 'border-gray-400'
                  : 'border-orange-600'
              }`}
            >
              <span className="text-4xl">{getRankIcon(entry.rank)}</span>
              <img
                src={entry.avatar}
                alt={entry.displayName}
                className="w-20 h-20 rounded-full mx-auto my-4 border-4 border-primary"
              />
              <h3 className="text-lg font-semibold text-foreground mb-1">{entry.displayName}</h3>
              <p className="text-xl font-bold text-primary">{entry.points.toLocaleString()} pts</p>
              <p className="text-sm text-muted-foreground mt-2">
                Lvl {entry.level} • {entry.streak}🔥 • {entry.predictionsCorrect}✓
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Streak</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Correct</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.slice(3).map((entry) => (
                <tr
                  key={entry.userId}
                  className={`hover:bg-accent/50 cursor-pointer ${
                    entry.isCurrentUser ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => router.push(`/profile/${entry.userId}`)}
                >
                  <td className={`px-6 py-4 font-bold ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.avatar}
                        alt={entry.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="font-medium text-foreground">{entry.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">Lvl {entry.level}</td>
                  <td className="px-6 py-4 text-foreground">{entry.streak}🔥</td>
                  <td className="px-6 py-4 text-foreground">{entry.predictionsCorrect}✓</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">
                    {entry.points.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
