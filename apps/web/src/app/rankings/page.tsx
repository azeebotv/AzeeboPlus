'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Trophy, Film, Gamepad2, Tv, Music, Award, ArrowUp, ArrowDown } from 'lucide-react';

function renderCatIcon(icon?: string): React.JSX.Element {
  if (!icon) return <Trophy className="w-4 h-4" />;
  const lower = icon.toLowerCase();
  if (lower.includes('film') || lower.includes('movie')) return <Film className="w-4 h-4" />;
  if (lower.includes('game')) return <Gamepad2 className="w-4 h-4" />;
  if (lower.includes('tv') || lower.includes('show')) return <Tv className="w-4 h-4" />;
  if (lower.includes('music')) return <Music className="w-4 h-4" />;
  if (lower.includes('star') || lower.includes('award')) return <Award className="w-4 h-4" />;
  return <Trophy className="w-4 h-4" />;
}

interface RankingEntry {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  rank: number;
  change: number;
  level: number;
}

interface RankingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function RankingsPage(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('overall');

  const categoriesQuery = useQuery({
    queryKey: ['rankings', 'categories'],
    queryFn: async () => {
      const res = await apiFetch<RankingCategory[]>('/engagement/rankings');
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : [];
      }
      return [];
    },
    staleTime: 300000,
  });

  const rankingsQuery = useQuery({
    queryKey: ['rankings', selectedCategory],
    queryFn: async () => {
      const res = await apiFetch<
        | RankingEntry[]
        | { items?: RankingEntry[]; totalParticipants?: number; lastUpdated?: string }
      >(`/engagement/leaderboard?timePeriod=weekly&category=${selectedCategory}`);
      if (res.success && res.data) {
        const data = res.data;
        const entries = Array.isArray(data) ? data : data.items || [];
        return {
          category: selectedCategory,
          entries: entries.map((e) => ({
            userId: String(e.userId),
            displayName: String(
              e.displayName ||
                (e as unknown as { user?: { displayName?: string } }).user?.displayName ||
                'Unknown'
            ),
            avatar: String(e.avatar || ''),
            score: Number(e.score || 0),
            rank: Number(e.rank || 0),
            change: Number(e.change || 0),
            level: Number(e.level || 0),
          })),
          totalParticipants: Number(
            ('totalParticipants' in data ? data.totalParticipants : undefined) || entries.length
          ),
          lastUpdated: String(
            ('lastUpdated' in data ? data.lastUpdated : undefined) || new Date().toISOString()
          ),
        };
      }
      return null;
    },
    staleTime: 30000,
  });

  const categories = categoriesQuery.data ?? [];
  const rankingData = rankingsQuery.data ?? null;
  const isLoading = categoriesQuery.isLoading || rankingsQuery.isLoading;
  const error = categoriesQuery.error?.message || rankingsQuery.error?.message || null;

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      case 2:
        return (
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      case 3:
        return (
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'var(--color-warning-400, #f59e0b)';
      case 2:
        return 'var(--brand-silver, #cbd5e1)';
      case 3:
        return 'var(--brand-amber, #d97706)';
      default:
        return 'rgba(255,255,255,0.4)';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Rankings" logoVariant="light" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Rankings</h1>
          <p className="text-white/50 text-lg">See who&apos;s on top across different categories</p>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-4 mb-8"
          role="listbox"
          aria-label="Ranking categories"
        >
          <button
            onClick={() => setSelectedCategory('overall')}
            role="option"
            aria-selected={selectedCategory === 'overall'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'overall' ? 'az-btn-primary' : ''}`}
            style={
              selectedCategory !== 'overall'
                ? {
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--brand-white)',
                  }
                : undefined
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            Overall
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              role="option"
              aria-selected={selectedCategory === cat.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'az-btn-primary' : ''}`}
              style={
                selectedCategory !== cat.id
                  ? {
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'var(--brand-white)',
                    }
                  : undefined
              }
            >
              {renderCatIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="az-glass h-20">
                <Skeleton height="100%" borderRadius="16px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load rankings"
            description={error}
            buttonText="Retry"
            onButtonPress={() => rankingsQuery.refetch()}
          />
        ) : (
          rankingData && (
            <>
              {rankingData.entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[1, 0, 2].map((idx) => {
                    const entry = rankingData.entries[idx];
                    if (!entry) return null;
                    const color = getRankColor(entry.rank);
                    return (
                      <div
                        key={entry.userId}
                        className={`az-glass p-6 text-center ${idx === 0 ? 'col-start-2' : ''}`}
                        style={
                          idx === 0 ? { boxShadow: '0 0 30px rgba(234,179,8,0.2)' } : undefined
                        }
                      >
                        {renderRankBadge(entry.rank)}
                        <div
                          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                          }}
                        >
                          {entry.avatar ? (
                            <OptimizedImage
                              src={entry.avatar}
                              alt={entry.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            entry.displayName.charAt(0)
                          )}
                        </div>
                        <h3 className="font-bold text-white">{entry.displayName}</h3>
                        <p
                          className="text-xl font-bold mt-1"
                          style={{ color: 'var(--brand-orange)' }}
                        >
                          {entry.score.toLocaleString()}
                        </p>
                        {entry.change !== 0 && (
                          <p
                            className={`text-sm mt-1 font-medium`}
                            style={{
                              color:
                                entry.change > 0
                                  ? 'var(--color-success-500)'
                                  : 'var(--color-error-500)',
                            }}
                          >
                            {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="az-glass overflow-hidden">
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {rankingData.entries
                    .slice(rankingData.entries.length >= 3 ? 3 : 0)
                    .map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                      >
                        <span
                          className="w-8 text-center font-bold"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          #{entry.rank}
                        </span>
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                        >
                          {entry.avatar ? (
                            <OptimizedImage
                              src={entry.avatar}
                              alt={entry.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            entry.displayName.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{entry.displayName}</h3>
                          <p className="text-sm text-white/50">Level {entry.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: 'var(--brand-orange)' }}>
                            {entry.score.toLocaleString()}
                          </p>
                          {entry.change !== 0 && (
                            <p
                              className="text-sm font-medium"
                              style={{
                                color:
                                  entry.change > 0
                                    ? 'var(--color-success-500)'
                                    : 'var(--color-error-500)',
                              }}
                            >
                              <span className="inline-flex items-center gap-0.5">
                                {entry.change > 0 ? (
                                  <ArrowUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5" />
                                )}
                                {Math.abs(entry.change)}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <p className="text-center text-sm text-white/30 mt-6">
                Updated: {new Date(rankingData.lastUpdated).toLocaleString()}
              </p>
            </>
          )
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
