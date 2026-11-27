'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { Check, ArrowLeft, BarChart3 } from 'lucide-react';

export default function PredictionResultsPage(): React.JSX.Element {
  const { predictionId } = useParams();
  const router = useRouter();
  interface PredictionResults {
    title?: string;
    description?: string;
    correctAnswer?: string;
    options?: Array<{ text: string; votes: number }>;
    totalVotes?: number;
  }

  const [results, setResults] = useState<PredictionResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [predictionId]);

  const loadResults = async () => {
    try {
      const response = await apiFetch<PredictionResults>(
        `/engagement/predictions/${predictionId}/results`
      );
      if (response.success && response.data) setResults(response.data);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell maxWidth="sm">
      <button
        type="button"
        onClick={() => router.back()}
        className="az-body mb-5 inline-flex items-center gap-2 text-az-ink-muted transition-colors hover:text-az-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="size-10 animate-spin rounded-full border-[3px] border-az-ink/20 border-t-az-flame"
            role="status"
            aria-label="Loading results"
          />
        </div>
      ) : !results ? (
        <div className="az-glass px-6 py-12 text-center">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-az-card bg-az-flame/10 text-az-flame">
            <BarChart3 size={32} />
          </span>
          <h3 className="az-subtitle text-az-ink">Results not available yet</h3>
          <p className="az-body text-az-ink-muted mt-2">Check back after the prediction closes</p>
        </div>
      ) : (
        <>
          <h1 className="az-headline text-az-heading text-az-ink mb-2">
            {results.title || 'Prediction Results'}
          </h1>
          {results.description && (
            <p className="az-body text-az-ink-muted mb-8">{results.description}</p>
          )}

          {results.correctAnswer && (
            <div className="mb-5 rounded-az-feature border border-az-success-400/30 bg-az-success-400/10 px-6 py-6 text-center backdrop-blur-az-glass">
              <p className="az-body text-az-ink-muted mb-2">Correct Answer</p>
              <p className="az-section-title text-az-success-400 font-bold">
                {results.correctAnswer}
              </p>
            </div>
          )}

          {results.options && (
            <div className="az-glass mb-5 p-6">
              <h2 className="az-subtitle text-az-ink mb-4">Results Breakdown</h2>
              <div className="flex flex-col gap-3.5">
                {results.options.map((opt, i) => {
                  const pct =
                    results.totalVotes && results.totalVotes > 0
                      ? Math.round((opt.votes / results.totalVotes) * 100)
                      : 0;
                  const isCorrect = opt.text === results.correctAnswer;
                  return (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={`az-body inline-flex items-center gap-1.5 ${
                            isCorrect ? 'text-az-success-400 font-bold' : 'text-az-ink'
                          }`}
                        >
                          {opt.text}{' '}
                          {isCorrect && <Check size={14} className="text-az-success-400" />}
                        </span>
                        <span className="az-caption text-az-ink-muted">
                          {pct}% ({opt.votes} votes)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-az-chip bg-az-surface-edge">
                        <div
                          className="h-full rounded-az-chip transition-[width] duration-500"
                          style={{
                            width: `${pct}%`,
                            background: isCorrect
                              ? 'linear-gradient(135deg, var(--color-az-success-500), var(--color-az-success-400))'
                              : 'var(--gradient-az-cta)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="az-caption text-az-ink-dim mt-4 text-center">
                Total votes: {results.totalVotes}
              </p>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
