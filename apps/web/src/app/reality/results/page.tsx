'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Trophy, DoorOpen, Crown, UserX } from 'lucide-react';

interface ContestantResult {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  isEvicted: boolean;
}

interface EpisodeResult {
  id: string;
  episodeNumber: number;
  title: string;
  date: string;
  winner: ContestantResult | null;
  evicted: ContestantResult | null;
  contestants: ContestantResult[];
}

export default function ResultsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId') || '';
  const [results, setResults] = useState<EpisodeResult[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!contentId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiFetch<EpisodeResult[]>(`/v1/content/${contentId}/results`);
        if (result.success && result.data) {
          const items = Array.isArray(result.data) ? result.data : [];
          setResults(items);
          if (items.length > 0) setSelectedEpisode(items[0].id);
        }
      } catch (error) {
        webLogger.error('Failed to load results', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [contentId]);

  const selectedResult = results.find((r) => r.id === selectedEpisode);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--brand-orange)',
              }}
            />
            <p className="mt-4 text-white/60">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-4 flex items-center gap-2 transition-colors"
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
          <h1 className="text-3xl font-bold text-white">Results</h1>
          <p className="text-white/50 mt-1">Episode Rankings</p>
        </div>

        <div className="mb-8">
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            role="listbox"
            aria-label="Episode selector"
          >
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => setSelectedEpisode(result.id)}
                role="option"
                aria-selected={selectedEpisode === result.id}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedEpisode === result.id ? 'az-btn-primary' : ''
                }`}
                style={
                  selectedEpisode !== result.id
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: 'var(--brand-white)',
                      }
                    : undefined
                }
              >
                E{result.episodeNumber}
              </button>
            ))}
          </div>
        </div>

        {selectedResult && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">{selectedResult.title}</h2>
              <p className="text-white/50 mt-1">
                {new Date(selectedResult.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {selectedResult.winner && (
              <div
                className="az-glass p-6 mb-6"
                style={{ border: '2px solid rgba(234,179,8,0.5)' }}
              >
                <div className="flex items-center gap-2 mb-4 text-amber-400 font-bold text-lg">
                  <Trophy size={20} />
                  <span>Episode Winner</span>
                </div>
                <div className="flex items-center gap-4">
                  <OptimizedImage
                    src={selectedResult.winner.avatar}
                    alt={selectedResult.winner.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-white">
                      {selectedResult.winner.name}
                    </h4>
                    <p className="text-white/50">
                      {selectedResult.winner.votes.toLocaleString()} votes (
                      {selectedResult.winner.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedResult.evicted && (
              <div
                className="az-glass p-6 mb-6"
                style={{ border: '2px solid rgba(239,68,68,0.5)' }}
              >
                <div className="flex items-center gap-2 mb-4 text-rose-400 font-bold text-lg">
                  <DoorOpen size={20} />
                  <span>Evicted Contestant</span>
                </div>
                <div className="flex items-center gap-4 opacity-70">
                  <OptimizedImage
                    src={selectedResult.evicted.avatar}
                    alt={selectedResult.evicted.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-white">
                      {selectedResult.evicted.name}
                    </h4>
                    <p className="text-white/50">
                      {selectedResult.evicted.votes.toLocaleString()} votes (
                      {selectedResult.evicted.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Full Rankings</h3>
              <div className="space-y-3">
                {[...selectedResult.contestants]
                  .sort((a, b) => a.rank - b.rank)
                  .map((contestant) => (
                    <div
                      key={contestant.id}
                      className={`az-glass flex items-center gap-4 p-4 ${
                        contestant.isWinner
                          ? 'ring-2 ring-yellow-500'
                          : contestant.isEvicted
                            ? 'opacity-70'
                            : ''
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <span className="text-white font-bold">#{contestant.rank}</span>
                      </div>
                      <OptimizedImage
                        src={contestant.avatar}
                        alt={contestant.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white">{contestant.name}</h4>
                        <p className="text-sm text-white/50">
                          {contestant.votes.toLocaleString()} votes ({contestant.percentage}%)
                        </p>
                      </div>
                      {contestant.isWinner && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
                          <Crown size={15} className="text-amber-400" />
                          <span>Winner</span>
                        </div>
                      )}
                      {contestant.isEvicted && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                          <UserX size={15} className="text-rose-400" />
                          <span>Evicted</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
