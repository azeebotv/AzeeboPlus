'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'content' | 'creator' | 'universe';
  reason: string;
  score: number;
}

export default function RecommendationsPage(): JSX.Element {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async (): Promise<void> => {
    try {
      const result = await apiFetch<Recommendation[]>(
        `/v1/content/recommendations${filter !== 'all' ? `?type=${filter}` : ''}`
      );

      if (result.success && result.data) {
        setRecommendations(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load recommendations', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Recommended For You</h1>
          <p className="text-muted-foreground">Personalized suggestions based on your activity</p>
        </div>

        <div className="flex gap-4 mb-8">
          {['all', 'content', 'creator', 'universe'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No recommendations yet</h2>
            <p className="text-muted-foreground">Interact with more content to get personalized suggestions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-muted relative">
                  <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                    {rec.type.toUpperCase()}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${rec.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary">{rec.score}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
