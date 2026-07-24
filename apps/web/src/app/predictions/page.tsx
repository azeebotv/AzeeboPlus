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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Predictions</h1>
            <p className="text-white/50 text-sm mt-1">{pagination.total} total predictions</p>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'resolved'].map((f) => (
              <button
                key={f}
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
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Skeleton width="60%" height="16px" />
                <Skeleton width="40%" height="12px" className="mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-4">&#x1F52E;</span>
            <h3 className="text-lg font-bold text-white mb-2">No predictions yet</h3>
            <p className="text-white/50 text-sm">Start predicting to earn points!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((pred) => (
                <div
                  key={pred.id}
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(26,10,10,0.5)',
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{pred.prediction}</span>
                      {pred.category && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px]"
                          style={{ background: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
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
                              ? '#4ADE80'
                              : '#F87171'
                            : '#F59E0B',
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
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#F5F0EB' }}
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
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#F5F0EB' }}
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
