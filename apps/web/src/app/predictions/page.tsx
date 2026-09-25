'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';

interface Prediction {
  id: string;
  contentId: string;
  prediction: string;
  points: number;
  isCorrect: boolean | null;
  result: string | null;
  category?: string;
  status: string;
  createdAt: string;
}

interface PredictionHistoryResponse {
  success: boolean;
  data: Prediction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function PredictionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['predictions', 'history', page],
    queryFn: async () => {
      const res = await apiFetch<PredictionHistoryResponse>(
        `/engagement/predictions/history?page=${page}&limit=10`
      );
      return res.success
        ? res.data
        : { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    },
    enabled: isAuthenticated && !authLoading,
  });

  const predictions = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const filtered = filter === 'all' ? predictions : predictions.filter((p) => p.status === filter);

  if (authLoading) return <></>;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="az-glass p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Sign in to view predictions</h2>
            <p className="text-white/50">Track your prediction history and accuracy</p>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Predictions</h1>
            <p className="text-white/50 text-sm mt-1">{pagination.total} total predictions</p>
          </div>
          <div className="flex gap-2" role="tablist" aria-label="Prediction filters">
            {['all', 'active', 'resolved'].map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f ? 'text-white' : 'text-white/50 hover:text-white'
                }`}
                style={{
                  background:
                    filter === f
                      ? 'linear-gradient(135deg, #E8420A, #CC1C1C)'
                      : 'rgba(255,255,255,0.05)',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: 'var(--bg-tertiary)',
                }}
              >
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" className="mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 az-glass rounded-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[var(--brand-orange)]">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No predictions yet</h3>
            <p className="text-white/50 text-sm">Start predicting to earn points!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((pred) => (
                <div
                  key={pred.id}
                  className="p-4 rounded-xl flex items-center justify-between transition-all hover:border-white/20"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-tertiary)',
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{pred.prediction}</span>
                      {pred.category && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px]"
                          style={{
                            background: 'rgba(232,66,10,0.2)',
                            color: 'var(--brand-orange)',
                          }}
                        >
                          {pred.category}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-1">
                      Content: {pred.contentId} · {new Date(pred.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          pred.status === 'resolved'
                            ? pred.isCorrect
                              ? 'var(--color-success-400)'
                              : 'var(--color-error-400)'
                            : 'var(--color-warning-500)',
                      }}
                    >
                      {pred.status === 'resolved'
                        ? pred.isCorrect
                          ? 'Correct'
                          : 'Wrong'
                        : 'Pending'}
                    </span>
                    <span className="text-xs text-white/50">+{pred.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded text-sm disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-white/50">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 rounded text-sm disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
