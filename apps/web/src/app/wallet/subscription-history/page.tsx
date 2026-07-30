'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner } from '@azeebo/ui/web';

interface SubscriptionHistoryItem {
  id: string;
  planId: string;
  plan?: { name: string };
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  expired: { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.expired;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const metadata = {
  title: 'Subscription History | Azeebo',
  description: 'View your past and current subscriptions and billing history.',
  openGraph: {
    title: 'Subscription History | Azeebo',
    description: 'View your past and current subscriptions and billing history.',
  },
};

export default function SubscriptionHistoryPage(): React.JSX.Element {
  const [items, setItems] = useState<SubscriptionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await apiFetch<{
        items: SubscriptionHistoryItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/v1/subscription/history?page=${pageNum}&limit=${PAGE_SIZE}`);

      if (res.success && res.data) {
        const data = res.data;
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        setError('Failed to load subscription history.');
      }
    } catch {
      setError('Failed to load subscription history.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1, false);
  }, [fetchHistory]);

  const loadMore = () => {
    if (page >= totalPages || isLoadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchHistory(next, true);
  };

  const hasMore = page < totalPages;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription History</h1>
          <p className="text-white/50">View your past and current subscriptions</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" color="#E8420A" />
              <p className="mt-4 text-white/60">Loading subscription history...</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="az-glass p-8 text-center rounded-2xl"
            style={{ border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <p className="text-red-400 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchHistory(1, false)}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
              }}
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="az-glass p-12 text-center rounded-2xl">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-white font-semibold mb-1">No subscriptions yet</p>
            <p className="text-white/50 text-sm">
              Your subscription history will appear here once you subscribe.
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-sm mb-6">
              {total} {total === 1 ? 'subscription' : 'subscriptions'} total
            </p>

            <div className="space-y-4">
              {items.map((item) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <div
                    key={item.id}
                    className="az-glass p-5 rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold truncate">
                            {item.plan?.name ?? 'Unknown Plan'}
                          </h3>
                          <span
                            className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 capitalize"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-white/50">
                          <span>Start: {formatDate(item.startDate)}</span>
                          <span className="hidden sm:inline">|</span>
                          <span>End: {formatDate(item.endDate)}</span>
                          <span className="hidden sm:inline">|</span>
                          <span>Subscribed: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.autoRenew && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(34,197,94,0.1)',
                              color: '#22C55E',
                              border: '1px solid rgba(34,197,94,0.2)',
                            }}
                          >
                            Auto-renew
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
