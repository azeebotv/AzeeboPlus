'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ShieldCheck } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Report {
  id: string;
  contentId: string;
  contentTitle?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  pending: {
    pill: 'bg-az-warning-500/20 text-az-warning-400',
    label: 'Pending',
  },
  reviewing: {
    pill: 'bg-az-secondary-500/20 text-az-secondary-400',
    label: 'Reviewing',
  },
  resolved: {
    pill: 'bg-az-success-500/20 text-az-success-400',
    label: 'Resolved',
  },
  dismissed: { pill: 'bg-az-ink/10 text-az-ink-muted', label: 'Dismissed' },
};

function ModerationStatusPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('moderation-status');
  }, []);

  const reportsQuery = useQuery({
    queryKey: ['moderation-reports'],
    queryFn: async () => {
      const res = await api.request<Report[]>('/api/v1/moderation/reports');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load reports');
    },
    staleTime: 30000,
  });

  const reports: Report[] = reportsQuery.data ?? [];
  const isLoading = reportsQuery.isLoading;
  const error = reportsQuery.error?.message;

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewingCount = reports.filter((r) => r.status === 'reviewing').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <PageShell maxWidth="md">
      <PageHero
        title="Report Status"
        description="Track your submitted reports and their status"
        eyebrow="Moderation"
      />

      <div className="-mt-6 pb-16">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="az-glass p-4 text-center">
            <p className="az-title text-az-warning-500">{pendingCount}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Pending</p>
          </div>
          <div className="az-glass p-4 text-center">
            <p className="az-title text-az-secondary-400">{reviewingCount}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Reviewing</p>
          </div>
          <div className="az-glass p-4 text-center">
            <p className="az-title text-az-success-500">{resolvedCount}</p>
            <p className="az-caption mt-1 text-az-ink-muted">Resolved</p>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton height="18px" width="60%" />
                    <Skeleton height="14px" width="40%" />
                  </div>
                  <Skeleton width="80px" height="24px" borderRadius="999px" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load reports"
            description={error}
            onButtonPress={() => reportsQuery.refetch()}
          />
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report, index) => {
              const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.pending;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="az-glass p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-az-pill px-2.5 py-0.5 text-xs font-semibold ${statusStyle.pill}`}
                        >
                          {statusStyle.label}
                        </span>
                        <span className="az-caption text-az-ink-muted">
                          {new Date(report.createdAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {report.contentTitle && (
                        <p className="az-body-strong mt-1 truncate text-az-ink">
                          {report.contentTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="az-caption mb-2 text-az-ink-muted">
                    <span className="az-body-strong text-az-ink">Reason:</span> {report.reason}
                  </div>

                  {report.description && (
                    <p className="az-caption mb-2 line-clamp-2 text-az-ink-muted">
                      {report.description}
                    </p>
                  )}

                  {report.resolution && (
                    <div className="az-caption mt-3 rounded-az-card border border-az-success-500/15 bg-az-success-500/10 p-3">
                      <p className="az-body-strong mb-1 text-az-success-400">Resolution:</p>
                      <p className="text-az-ink-muted">{report.resolution}</p>
                    </div>
                  )}

                  <div className="az-caption mt-3 flex items-center justify-between text-az-ink/40">
                    <span>ID: {report.id.slice(0, 8)}...</span>
                    <span>
                      Updated:{' '}
                      {new Date(report.updatedAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <ShieldCheck className="mx-auto mb-4 size-10 text-az-flame" aria-hidden />
            <h2 className="az-subtitle mb-2 text-az-ink">No reports yet</h2>
            <p className="az-body text-az-ink-muted">
              When you report content, you&apos;ll be able to track the status here.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyModerationStatusPage = lazy(() =>
  Promise.resolve({ default: ModerationStatusPageContent })
);

export default function ModerationStatusPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyModerationStatusPage />
    </Suspense>
  );
}
