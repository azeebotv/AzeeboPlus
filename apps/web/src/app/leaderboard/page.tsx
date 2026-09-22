'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Trophy, Medal, Award, Flame, Sparkles, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  level: number;
  badges: string[];
}

export default function LeaderboardPage(): React.JSX.Element {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', 'engagement', timeframe],
    queryFn: async () => {
      const response = await apiFetch<LeaderboardEntry[] | { items?: LeaderboardEntry[] }>(
        `/engagement/leaderboard?timePeriod=${timeframe}`
      );
      if (response.success && response.data) {
        const data = response.data;
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    staleTime: 30000,
  });

  const entries = leaderboardQuery.data ?? [];
  const isLoading = leaderboardQuery.isLoading;
  const error = leaderboardQuery.error?.message || null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-black flex items-center justify-center font-black shadow-[0_4px_16px_rgba(234,179,8,0.4)]">
          <Crown className="w-5 h-5 fill-black" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-black flex items-center justify-center font-black shadow-[0_4px_16px_rgba(203,213,225,0.3)]">
          <Medal className="w-5 h-5" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-black shadow-[0_4px_16px_rgba(180,83,9,0.3)]">
          <Award className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-white/60 flex items-center justify-center font-mono font-bold text-sm">
        {rank}
      </div>
    );
  };

  return (
    <PageShell glowColor="rgba(234,179,8,0.12)">
      <PageHero
        badge="Community Honor Roll"
        title="Creator & Fan Leaderboard"
        description="Celebrate the most dedicated African cinema enthusiasts, top live reality voters, trivia champions, and community curators on Azeebo+."
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-4">
        {/* Timeframe Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {(
            [
              ['weekly', 'This Week'],
              ['monthly', 'This Month'],
              ['allTime', 'All Time Legends'],
            ] as const
          ).map(([key, label]) => {
            const active = timeframe === key;
            return (
              <button
                key={key}
                onClick={() => setTimeframe(key)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#e8420a] to-[#cc1c1c] text-white shadow-[0_4px_20px_rgba(232,66,10,0.35)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" color="#E8420A" />
            <p className="text-white/40 text-xs mt-4">Tabulating point standings...</p>
          </div>
        ) : error ? (
          <div className="az-glass p-8 rounded-3xl border border-white/10 text-center">
            <ErrorState
              title="Failed to load leaderboard"
              description={error}
              buttonText="Retry"
              onButtonPress={() => leaderboardQuery.refetch()}
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="az-glass p-12 rounded-3xl border border-white/10 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No leaderboard rankings yet</h3>
            <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
              Participate in reality show votes, trivia quizzes, and streaming challenges to climb to the podium!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isTopThree = entry.rank <= 3;
              return (
                <div
                  key={entry.userId}
                  className={`az-glass p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                    isTopThree
                      ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/[0.04] to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    {getRankBadge(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 relative border-2 border-white/10 shadow-md">
                    {entry.avatar ? (
                      <OptimizedImage
                        src={entry.avatar}
                        alt={entry.displayName}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e8420a] to-[#cc1c1c] text-white flex items-center justify-center font-bold text-sm">
                        {entry.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate tracking-tight">
                        {entry.displayName}
                      </h3>
                      {entry.rank === 1 && (
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] text-white/70">
                        LVL {entry.level}
                      </span>
                      {entry.badges?.length > 0 && (
                        <span>• {entry.badges.length} badges</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-extrabold text-base sm:text-lg text-white font-mono tracking-tight">
                        {(entry.score ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
                      Points
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
}
