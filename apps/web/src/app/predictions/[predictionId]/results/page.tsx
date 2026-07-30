'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 700,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>←</span> Back
        </button>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #2A1A1A',
                borderTopColor: '#E8420A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : !results ? (
          <div className="az-glass" style={{ padding: 40, borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 18 }}>Results not available yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Check back after the prediction closes</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              {results.title || 'Prediction Results'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{results.description || ''}</p>

            {results.correctAnswer && (
              <div
                className="az-glass"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  marginBottom: 20,
                  border: '1px solid #0D3B2E',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>Correct Answer</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#0D3B2E' }}>
                  {results.correctAnswer}
                </p>
              </div>
            )}

            {results.options && (
              <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  Results Breakdown
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {results.options.map((opt, i) => {
                    const pct =
                      results.totalVotes && results.totalVotes > 0
                        ? Math.round((opt.votes / results.totalVotes) * 100)
                        : 0;
                    const isCorrect = opt.text === results.correctAnswer;
                    return (
                      <div key={i}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: isCorrect ? '#0D3B2E' : '#F5F0EB',
                            }}
                          >
                            {opt.text} {isCorrect && '✓'}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {pct}% ({opt.votes} votes)
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#2A1A1A',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: 4,
                              background: isCorrect
                                ? 'linear-gradient(135deg, #0D3B2E 0%, #1A5E45 100%)'
                                : 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
                  Total votes: {results.totalVotes}
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
