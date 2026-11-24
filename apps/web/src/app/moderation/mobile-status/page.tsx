'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { Clock, Search, CheckCircle2, XCircle, Flag } from 'lucide-react';
import analytics from '@/lib/analytics';
import { pollingIntervals } from '@azeebo/design-tokens';

function getStatusIcon(status: string): React.JSX.Element {
  switch (status) {
    case 'pending':
      return <Clock className="w-3.5 h-3.5" />;
    case 'reviewing':
      return <Search className="w-3.5 h-3.5" />;
    case 'resolved':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    default:
      return <XCircle className="w-3.5 h-3.5" />;
  }
}

interface Report {
  id: string;
  contentId: string;
  contentType: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  contentPreview?: string;
  moderator?: string;
  resolution?: string;
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  pending: { pill: 'bg-az-warning-500/20 text-az-warning-500', label: 'Pending' },
  reviewing: { pill: 'bg-az-secondary-500/20 text-az-secondary-400', label: 'Under Review' },
  resolved: { pill: 'bg-az-success-500/20 text-az-success-500', label: 'Resolved' },
  dismissed: { pill: 'bg-az-ink/10 text-az-ink-muted', label: 'Dismissed' },
};

function MobileStatusPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('moderation-mobile-status');
  }, []);

  const reportsQuery = useQuery({
    queryKey: ['moderation-reports'],
    queryFn: async () => {
      const res = await api.request<Report[]>('/api/v1/moderation/reports');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load reports');
    },
    staleTime: 30000,
    refetchInterval: pollingIntervals.idle,
  });

  const reports: Report[] = reportsQuery.data ?? [];
  const isLoading = reportsQuery.isLoading;
  const error = reportsQuery.error?.message;

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewing: reports.filter((r) => r.status === 'reviewing').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  const getStatusCountsByReason = () => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.reason] = (counts[r.reason] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  return (
    <PageShell maxWidth="sm">
      <div className="mx-auto max-w-lg">
        <PageHero
          eyebrow="Moderation"
          title="My Reports"
          description="Track the status of your content reports"
        />

        <ScrollReveal>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Total', value: stats.total, tint: 'bg-az-ink/10' },
              { label: 'Pending', value: stats.pending, tint: 'bg-az-warning-500/15' },
              { label: 'Reviewing', value: stats.reviewing, tint: 'bg-az-secondary-500/15' },
              { label: 'Resolved', value: stats.resolved, tint: 'bg-az-success-500/15' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-az-card p-4 text-center ${stat.tint}`}>
                <p className="az-section-title text-az-ink">{stat.value}</p>
                <p className="az-caption text-az-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Skeleton width="80px" height="24px" borderRadius="12px" />
                  <Skeleton width="60px" height="14px" />
                </div>
                <Skeleton height="16px" width="70%" className="mb-2" />
                <Skeleton height="12px" width="50%" />
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
          <div className="space-y-3">
            {reports.map((report, index) => {
              const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlowCard className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.pill}`}
                      >
                        {getStatusIcon(report.status)}
                        {statusStyle.label}
                      </span>
                      <span className="az-caption text-az-ink/40">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                    <h3 className="az-body-strong mb-1 capitalize text-az-ink">
                      {report.reason.replace(/-/g, ' ')}
                    </h3>
                    {report.contentPreview && (
                      <p className="az-caption mb-2 line-clamp-2 text-az-ink-muted">
                        &quot;{report.contentPreview}&quot;
                      </p>
                    )}
                    <div className="az-caption flex items-center gap-2 text-az-ink/30">
                      <span className="capitalize">{report.contentType}</span>
                      <span>•</span>
                      <span>ID: {report.contentId.slice(0, 8)}...</span>
                    </div>
                    {report.resolution && (
                      <div className="az-caption mt-3 rounded-az-control bg-az-success-500/10 p-2 text-az-success-500">
                        {report.resolution}
                      </div>
                    )}
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <ScrollReveal>
            <GlowCard className="p-12 text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-az-ink/5">
                <Flag className="size-8 text-az-ink/30" aria-hidden="true" />
              </div>
              <p className="az-body mb-2 text-az-ink-muted">No reports yet</p>
              <p className="az-caption text-az-ink/30">
                When you report content, it will appear here
              </p>
            </GlowCard>
          </ScrollReveal>
        )}

        {reports.length > 0 && (
          <ScrollReveal className="mt-8">
            <GlowCard className="p-5">
              <h3 className="az-subtitle mb-4 font-bold text-az-ink">Top Report Reasons</h3>
              <div className="space-y-3">
                {getStatusCountsByReason().map(([reason, count]) => (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="az-body capitalize text-az-ink">
                          {reason.replace(/-/g, ' ')}
                        </span>
                        <span className="az-body text-az-ink-muted">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-az-ink/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-az-flame to-az-scarlet"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(count / stats.total) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlowCard>
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-6">
          <div className="rounded-az-card bg-az-ink/3 p-4 text-center">
            <p className="az-caption text-az-ink/30">
              Reports are reviewed within 24 hours. You&apos;ll receive a notification when your
              report is processed.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}

const LazyMobileStatusPage = lazy(() => Promise.resolve({ default: MobileStatusPageContent }));

export default function MobileStatusPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyMobileStatusPage />
    </Suspense>
  );
}
