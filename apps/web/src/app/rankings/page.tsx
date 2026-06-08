'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface RankingCategory {
  id: string;
  name: string;
  icon: string;
  entries: Array<{
    rank: number;
    userId: string;
    displayName: string;
    avatar: string;
    score: number;
    change: number;
  }>;
}

export default function RankingsPage(): JSX.Element {
  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('overall');

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async (): Promise<void> => {
    try {
      const result = await apiFetch<RankingCategory[]>('/v1/engagement/rankings');

      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load rankings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedData = categories.find((c) => c.id === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rankings</h1>
          <p className="text-muted-foreground">Extended leaderboard across categories</p>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              <span>{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        {selectedData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedData.entries.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`bg-card rounded-xl p-6 text-center border-2 ${
                    index === 0
                      ? 'border-yellow-500'
                      : index === 1
                      ? 'border-gray-400'
                      : 'border-orange-600'
                  }`}
                >
                  <div className="text-5xl mb-4">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <img
                    src={entry.avatar}
                    alt={entry.displayName}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary"
                  />
                  <h3 className="text-xl font-bold text-foreground mb-2">{entry.displayName}</h3>
                  <p className="text-3xl font-bold text-primary">{entry.score.toLocaleString()}</p>
                  {entry.change !== 0 && (
                    <p className={`text-sm mt-2 font-semibold ${entry.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)} positions
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">User</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Score</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.entries.slice(3).map((entry) => (
                    <tr key={entry.userId} className="border-t border-border hover:bg-accent/50">
                      <td className="px-6 py-4 text-lg font-bold text-muted-foreground">#{entry.rank}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={entry.avatar} alt={entry.displayName} className="w-10 h-10 rounded-full" />
                          <span className="font-semibold text-foreground">{entry.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-primary">{entry.score.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        {entry.change !== 0 && (
                          <span className={`font-semibold ${entry.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
