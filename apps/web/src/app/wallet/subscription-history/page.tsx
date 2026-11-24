'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Spinner } from '@azeebo/ui/web';
import { History, Calendar, RefreshCw } from 'lucide-react';

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

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  active: {
    bg: 'color-mix(in srgb, var(--color-az-success-500) 10%, transparent)',
    text: 'var(--color-az-success-400)',
    border: 'color-mix(in srgb, var(--color-az-success-500) 20%, transparent)',
  },
  cancelled: {
    bg: 'color-mix(in srgb, var(--color-az-error-500) 10%, transparent)',
    text: 'var(--color-az-error-400)',
    border: 'color-mix(in srgb, var(--color-az-error-500) 20%, transparent)',
  },
  expired: { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', border: 'rgba(156,163,175,0.2)' },
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
        pageSize: number;
      }>(`/v1/subscription/history?page=${pageNum}&pageSize=${PAGE_SIZE}`);

      if (res.success && res.data) {
        const newItems = Array.isArray(res.data.items) ? res.data.items : [];
        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setTotal(res.data.total ?? 0);
        setTotalPages(Math.ceil((res.data.total ?? 0) / PAGE_SIZE) || 1);
        setPage(pageNum);
      } else {
        setError(res.message ?? 'Failed to load subscription history.');
      }
    } catch {
      setError('An error occurred while fetching subscription history.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1, false);
  }, [fetchHistory]);

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchHistory(page + 1, true);
    }
  };

  const hasMore = page < totalPages;

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <PageHero
        badge="Billing Ledger"
        title="Subscription History"
        description="Review historical invoices, plan upgrades, tier transitions, and billing cycles."
      />

      <main className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" color="#EC691F" />
            <p className="mt-4 text-xs text-az-ink/50">Fetching historical billing ledger...</p>
          </div>
        ) : error ? (
          <div className="az-glass p-8 text-center border max-w-md mx-auto">
            <p className="text-az-error-400 text-sm mb-4 leading-relaxed">{error}</p>
            <button type="button" onClick={() => fetchHistory(1, false)} className="az-btn-primary">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="az-glass p-12 text-center border border-az-glass-border max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-az-glass-fill border border-az-glass-border flex items-center justify-center text-az-ink/40 mx-auto mb-4">
              <History className="w-8 h-8 text-az-flame" />
            </div>
            <h3 className="text-lg font-bold text-az-ink mb-2">No subscription history</h3>
            <p className="text-xs text-az-ink/50 leading-relaxed max-w-xs mx-auto">
              Your historical invoices and renewal cycles will appear here once you activate a tier
              pass.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 text-xs text-az-ink/40 font-mono">
              <span>
                {total} {total === 1 ? 'record' : 'records'} logged
              </span>
              <span>
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <div
                    key={item.id}
                    className="az-glass p-5 border border-az-glass-border transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-az-ink font-bold text-base truncate tracking-tight">
                            {item.plan?.name ?? 'Standard Streaming Pass'}
                          </h3>
                          <span
                            className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize border"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.text,
                              borderColor: statusStyle.border,
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-az-ink/50">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-az-ink/40" />
                            Start: {formatDate(item.startDate)}
                          </span>
                          <span>•</span>
                          <span>Expires: {formatDate(item.endDate)}</span>
                          <span>•</span>
                          <span>Purchased: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                        {item.autoRenew ? (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-az-success-500/10 text-az-success-400 border border-az-success-500/20 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Auto-renew Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-az-glass-fill text-az-ink/40 border border-az-glass-border">
                            Single Cycle
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
                  className="px-8 py-3 rounded-full text-xs font-bold text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-all hover:scale-105"
                >
                  {isLoadingMore ? 'Loading more records...' : 'Load Older Invoices'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
