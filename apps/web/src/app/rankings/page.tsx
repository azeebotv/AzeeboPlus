'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import {
  Trophy,
  Medal,
  Award,
  Film,
  Gamepad2,
  Tv,
  Music,
  Star,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

function renderCatIcon(icon?: string): React.JSX.Element {
  if (!icon) return <Trophy className="w-4 h-4" />;
  const lower = icon.toLowerCase();
  if (lower.includes('film') || lower.includes('movie')) return <Film className="w-4 h-4" />;
  if (lower.includes('game')) return <Gamepad2 className="w-4 h-4" />;
  if (lower.includes('tv') || lower.includes('show')) return <Tv className="w-4 h-4" />;
  if (lower.includes('music')) return <Music className="w-4 h-4" />;
  if (lower.includes('star') || lower.includes('award')) return <Star className="w-4 h-4" />;
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

/* Podium places are reward ranks, not statuses, so they keep the categorical
   metallic ramp instead of the semantic colour set. */
const MEDALS: Record<number, { ring: string; tone: string; icon: typeof Trophy }> = {
  1: { ring: 'border-[var(--brand-gold)]', tone: 'text-[var(--brand-gold)]', icon: Trophy },
  2: {
    ring: 'border-[var(--color-az-accent-silver)]',
    tone: 'text-[var(--color-az-accent-silver)]',
    icon: Medal,
  },
  3: {
    ring: 'border-[var(--color-az-accent-bronze)]',
    tone: 'text-[var(--color-az-accent-bronze)]',
    icon: Award,
  },
};

function chipClasses(isActive: boolean): string {
  return [
    'az-body-strong inline-flex items-center gap-2 whitespace-nowrap rounded-az-pill border px-4 py-2 transition-all',
    isActive
      ? 'border-transparent bg-gradient-to-br from-az-scarlet to-az-flame text-az-ink shadow-az-glow'
      : 'border-az-ink/20 bg-az-ink/8 text-az-ink hover:border-az-glass-border-hover hover:bg-az-glass-fill',
  ].join(' ');
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

  const categoryChips = (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="listbox"
      aria-label="Ranking categories"
    >
      <button
        type="button"
        onClick={() => setSelectedCategory('overall')}
        role="option"
        aria-selected={selectedCategory === 'overall'}
        className={chipClasses(selectedCategory === 'overall')}
      >
        <BarChart3 className="w-4 h-4" aria-hidden="true" />
        Overall
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setSelectedCategory(cat.id)}
          role="option"
          aria-selected={selectedCategory === cat.id}
          className={chipClasses(selectedCategory === cat.id)}
        >
          {renderCatIcon(cat.icon)}
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <PageShell
      activeNav="Rankings"
      maxWidth="lg"
      glowColor="color-mix(in srgb, var(--color-az-warning-500) 18%, transparent)"
    >
      <PageHero
        title="Rankings"
        description="See who's on top across different categories"
        actions={categoryChips}
      />

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
              <div className="mb-8 grid grid-cols-3 gap-4">
                {[1, 0, 2].map((idx) => {
                  const entry = rankingData.entries[idx];
                  if (!entry) return null;
                  const medal = MEDALS[entry.rank] ?? MEDALS[1];
                  const RankIcon = medal.icon;
                  return (
                    <div
                      key={entry.userId}
                      className={`az-glass p-6 text-center ${idx === 0 ? 'col-start-2 az-glass--glow' : ''}`}
                    >
                      <RankIcon
                        className={`mx-auto mb-2 size-6 ${medal.tone}`}
                        aria-hidden="true"
                      />
                      <div
                        className={`mx-auto mb-3 flex size-20 items-center justify-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-az-flame to-az-scarlet az-title font-bold text-az-ink ${medal.ring}`}
                      >
                        {entry.avatar ? (
                          <OptimizedImage
                            src={entry.avatar}
                            alt={entry.displayName}
                            className="size-full rounded-full object-cover"
                          />
                        ) : (
                          entry.displayName.charAt(0)
                        )}
                      </div>
                      <h3 className="az-body-strong text-az-ink">{entry.displayName}</h3>
                      <p className={`az-subtitle mt-1 font-bold ${medal.tone}`}>
                        {entry.score.toLocaleString()}
                      </p>
                      {entry.change !== 0 && (
                        <p
                          className={`az-caption mt-1 inline-flex items-center gap-0.5 font-medium ${
                            entry.change > 0 ? 'text-az-success-500' : 'text-az-error-500'
                          }`}
                        >
                          {entry.change > 0 ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )}
                          {Math.abs(entry.change)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="az-glass overflow-hidden">
              <div className="divide-y divide-az-ink/8">
                {rankingData.entries.slice(rankingData.entries.length >= 3 ? 3 : 0).map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-az-glass-fill"
                  >
                    <span className="az-body-strong w-8 text-center text-az-ink/40">
                      #{entry.rank}
                    </span>
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-az-flame to-az-scarlet az-title font-bold text-az-ink">
                      {entry.avatar ? (
                        <OptimizedImage
                          src={entry.avatar}
                          alt={entry.displayName}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        entry.displayName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="az-body-strong truncate text-az-ink">{entry.displayName}</h3>
                      <p className="az-caption text-az-ink/50">Level {entry.level}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="az-lead font-bold text-az-ink-dim">
                        {entry.score.toLocaleString()}
                      </p>
                      {entry.change !== 0 && (
                        <p
                          className={`az-caption inline-flex items-center justify-end gap-0.5 font-medium ${
                            entry.change > 0 ? 'text-az-success-500' : 'text-az-error-500'
                          }`}
                        >
                          {entry.change > 0 ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )}
                          {Math.abs(entry.change)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="az-caption mt-6 text-center text-az-ink/30">
              Updated: {new Date(rankingData.lastUpdated).toLocaleString()}
            </p>
          </>
        )
      )}
    </PageShell>
  );
}
