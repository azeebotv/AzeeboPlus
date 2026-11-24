'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Skeleton } from '@azeebo/ui/web';
import { Zap } from 'lucide-react';

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

const FILTERS = ['all', 'active', 'resolved'];

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

  const filterChips = FILTERS.map((f) => {
    const selected = filter === f;
    return (
      <button
        key={f}
        type="button"
        aria-pressed={selected}
        onClick={() => {
          setFilter(f);
          setPage(1);
        }}
        className={`az-body-strong rounded-az-pill border px-4 py-2 transition-colors ${
          selected
            ? 'border-az-flame bg-az-scarlet/20 text-az-ink'
            : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:border-az-glass-border-hover'
        }`}
      >
        {f.charAt(0).toUpperCase() + f.slice(1)}
      </button>
    );
  });

  if (authLoading) return <></>;
  if (!isAuthenticated) {
    return (
      <PageShell maxWidth="lg">
        <PageHero
          eyebrow="Predictions"
          title="My Predictions"
          subtitle="Track your prediction history and accuracy"
        />
        <div className="az-glass p-8 text-center">
          <h2 className="az-title mb-2 text-az-ink">Sign in to view predictions</h2>
          <p className="az-body text-az-ink-muted">
            Track your prediction history and accuracy once you are signed in
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      <PageHero
        eyebrow="Predictions"
        title="My Predictions"
        subtitle={`${pagination.total} total predictions`}
        actions={
          <div role="group" aria-label="Prediction filters" className="flex gap-2">
            {filterChips}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="az-glass p-4">
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="12px" className="mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="az-glass py-16 text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-az-glass-border bg-az-scarlet/20 text-az-flame"
          >
            <Zap size={28} />
          </span>
          <h3 className="az-title mb-2 text-az-ink">No predictions yet</h3>
          <p className="az-body text-az-ink-muted">Start predicting to earn points!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((pred) => {
              const statusLabel =
                pred.status === 'resolved' ? (pred.isCorrect ? 'Correct' : 'Wrong') : 'Pending';
              const statusTone =
                pred.status === 'resolved'
                  ? pred.isCorrect
                    ? 'text-az-success-400'
                    : 'text-az-error-400'
                  : 'text-az-warning-400';
              return (
                <div key={pred.id} className="az-glass flex items-center justify-between gap-4 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="az-body-strong text-az-ink">{pred.prediction}</span>
                      {pred.category && (
                        <span className="az-micro-label rounded-az-pill bg-az-scarlet/20 px-2 py-0.5 text-az-flame">
                          {pred.category}
                        </span>
                      )}
                    </div>
                    <p className="az-caption mt-1 text-az-ink-muted">
                      Content: {pred.contentId} · {new Date(pred.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`az-caption ${statusTone}`}>{statusLabel}</span>
                    <span className="az-caption text-az-ink-muted">+{pred.points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="az-body-strong rounded-az-pill border border-az-glass-border bg-az-glass-fill px-4 py-2 text-az-ink transition-colors hover:border-az-glass-border-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="az-body-strong px-3 py-1 text-az-ink-muted">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="az-body-strong rounded-az-pill border border-az-glass-border bg-az-glass-fill px-4 py-2 text-az-ink transition-colors hover:border-az-glass-border-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
