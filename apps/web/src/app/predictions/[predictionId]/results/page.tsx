'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader logoVariant="light" />
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
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #18151e',
                borderTopColor: 'var(--brand-orange, #E8420A)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : !results ? (
          <div
            className="az-glass"
            style={{
              padding: 48,
              borderRadius: 20,
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} />
            </div>
            <h3 style={{ fontSize: 18, color: 'white', fontWeight: 600 }}>
              Results not available yet
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
              Check back after the prediction closes
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'white' }}>
              {results.title || 'Prediction Results'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
              {results.description || ''}
            </p>

            {results.correctAnswer && (
              <div
                className="az-glass"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  marginBottom: 20,
                  border: '1px solid rgba(16,185,129,0.3)',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>
                  Correct Answer
                </p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#34D399' }}>
                  {results.correctAnswer}
                </p>
              </div>
            )}

            {results.options && (
              <div
                className="az-glass"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  marginBottom: 20,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'white' }}>
                  Results Breakdown
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              color: isCorrect ? '#34D399' : 'white',
                            }}
                          >
                            {opt.text}{' '}
                            {isCorrect && <Check size={14} className="text-emerald-400" />}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                            {pct}% ({opt.votes} votes)
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'var(--bg-tertiary)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: 4,
                              background: isCorrect
                                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                                : 'linear-gradient(135deg, var(--brand-orange, #E8420A) 0%, var(--brand-red, #CC1C1C) 100%)',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    marginTop: 16,
                    textAlign: 'center',
                  }}
                >
                  Total votes: {results.totalVotes}
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
