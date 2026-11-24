'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Trophy, DoorOpen, Crown, UserX, ChevronLeft } from 'lucide-react';

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
      <PageShell activeNav="Reality" maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-az-ink/10 border-t-az-flame" />
            <p className="mt-4 text-az-ink/60">Loading results...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Reality" maxWidth="lg">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-az-ink/50 hover:text-az-ink mb-4 flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          Back
        </button>
        <PageHero title="Results" subtitle="Episode Rankings" />
      </div>

      <div className="mb-8">
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="listbox"
          aria-label="Episode selector"
        >
          {results.map((result) => {
            const selected = selectedEpisode === result.id;
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => setSelectedEpisode(result.id)}
                role="option"
                aria-selected={selected}
                className={`az-body-strong shrink-0 whitespace-nowrap rounded-az-pill border px-4 py-2 transition-all ${
                  selected
                    ? 'border-az-flame bg-az-scarlet/20 text-az-ink'
                    : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
                }`}
              >
                E{result.episodeNumber}
              </button>
            );
          })}
        </div>
      </div>

      {selectedResult && (
        <>
          <div className="mb-6">
            <h2 className="az-subtitle text-az-ink">{selectedResult.title}</h2>
            <p className="az-caption mt-1 text-az-ink/50">
              {new Date(selectedResult.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {selectedResult.winner && (
            <div className="az-glass outline-2 outline-az-warning-400/50 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4 text-az-warning-400 text-lg font-bold">
                <Trophy size={20} aria-hidden="true" />
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
                  <h4 className="az-subtitle text-az-ink">{selectedResult.winner.name}</h4>
                  <p className="az-body text-az-ink/50">
                    {selectedResult.winner.votes.toLocaleString()} votes (
                    {selectedResult.winner.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedResult.evicted && (
            <div className="az-glass outline-2 outline-az-error-500/50 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4 text-az-error-400 text-lg font-bold">
                <DoorOpen size={20} aria-hidden="true" />
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
                  <h4 className="az-subtitle text-az-ink">{selectedResult.evicted.name}</h4>
                  <p className="az-body text-az-ink/50">
                    {selectedResult.evicted.votes.toLocaleString()} votes (
                    {selectedResult.evicted.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="az-subtitle text-az-ink mb-4">Full Rankings</h3>
            <div className="space-y-3">
              {[...selectedResult.contestants]
                .sort((a, b) => a.rank - b.rank)
                .map((contestant) => (
                  <div
                    key={contestant.id}
                    className={`az-glass flex items-center gap-4 p-4 ${
                      contestant.isWinner
                        ? 'outline-2 outline-az-accent-gold'
                        : contestant.isEvicted
                          ? 'opacity-70'
                          : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-az-ink/10">
                      <span className="text-az-ink font-bold">#{contestant.rank}</span>
                    </div>
                    <OptimizedImage
                      src={contestant.avatar}
                      alt={contestant.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="az-subtitle text-az-ink">{contestant.name}</h4>
                      <p className="az-caption text-az-ink/50">
                        {contestant.votes.toLocaleString()} votes ({contestant.percentage}%)
                      </p>
                    </div>
                    {contestant.isWinner && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-az-pill bg-az-warning-500/15 border border-az-warning-500/30 text-az-warning-400 text-xs font-bold shadow-lg shadow-az-warning-500/10">
                        <Crown size={15} aria-hidden="true" className="text-az-warning-400" />
                        <span>Winner</span>
                      </div>
                    )}
                    {contestant.isEvicted && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-az-pill bg-az-error-500/15 border border-az-error-500/30 text-az-error-400 text-xs font-bold">
                        <UserX size={15} aria-hidden="true" className="text-az-error-400" />
                        <span>Evicted</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
