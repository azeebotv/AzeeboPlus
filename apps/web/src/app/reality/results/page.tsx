'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface ContestantResult {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  percentage: number;
  rank: number;
  isWinner?: boolean;
  isEvicted?: boolean;
}

interface EpisodeResult {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  date: string;
  contestants: ContestantResult[];
  winner?: ContestantResult;
  evicted?: ContestantResult;
}

export default function ResultsPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id') || '';

  const [results, setResults] = useState<EpisodeResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [contentId]);

  const loadResults = async (): Promise<void> => {
    try {
      const result = await apiFetch<EpisodeResult[]>(`/v1/content/${contentId}/results`);

      if (result.success && result.data) {
        setResults(result.data);
        if (result.data.length > 0) {
          setSelectedEpisode(result.data[0].id);
        }
      }
    } catch (error) {
      webLogger.error('Failed to load results', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedResult = results.find((r) => r.id === selectedEpisode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Results</h1>
          <p className="text-muted-foreground mt-1">Episode Rankings</p>
        </div>

        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => setSelectedEpisode(result.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedEpisode === result.id
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground hover:bg-accent'
                }`}
              >
                E{result.episodeNumber}
              </button>
            ))}
          </div>
        </div>

        {selectedResult && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">{selectedResult.title}</h2>
              <p className="text-muted-foreground mt-1">
                {new Date(selectedResult.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {selectedResult.winner && (
              <div className="bg-card border-2 border-yellow-500 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-yellow-500 mb-4">🏆 Winner</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedResult.winner.avatar}
                    alt={selectedResult.winner.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground">
                      {selectedResult.winner.name}
                    </h4>
                    <p className="text-muted-foreground">
                      {selectedResult.winner.votes.toLocaleString()} votes (
                      {selectedResult.winner.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedResult.evicted && (
              <div className="bg-card border-2 border-red-500 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-red-500 mb-4">🚪 Evicted</h3>
                <div className="flex items-center gap-4 opacity-70">
                  <img
                    src={selectedResult.evicted.avatar}
                    alt={selectedResult.evicted.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground">
                      {selectedResult.evicted.name}
                    </h4>
                    <p className="text-muted-foreground">
                      {selectedResult.evicted.votes.toLocaleString()} votes (
                      {selectedResult.evicted.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Full Rankings</h3>
              <div className="space-y-3">
                {selectedResult.contestants
                  .sort((a, b) => a.rank - b.rank)
                  .map((contestant) => (
                    <div
                      key={contestant.id}
                      className={`flex items-center gap-4 bg-card rounded-lg border p-4 ${
                        contestant.isWinner
                          ? 'border-yellow-500'
                          : contestant.isEvicted
                            ? 'border-red-500 opacity-70'
                            : 'border-border'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-foreground font-bold">#{contestant.rank}</span>
                      </div>
                      <img
                        src={contestant.avatar}
                        alt={contestant.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground">{contestant.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {contestant.votes.toLocaleString()} votes ({contestant.percentage}%)
                        </p>
                      </div>
                      {contestant.isWinner && <span className="text-3xl">🏆</span>}
                      {contestant.isEvicted && <span className="text-3xl">🚪</span>}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
