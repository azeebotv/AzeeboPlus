'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', text: 'var(--color-warning-500)', label: 'Pending' },
  reviewing: {
    bg: 'rgba(59,130,246,0.15)',
    text: 'var(--color-secondary-400)',
    label: 'Reviewing',
  },
  resolved: { bg: 'rgba(34,197,94,0.15)', text: 'var(--color-success-500)', label: 'Resolved' },
  dismissed: { bg: 'rgba(156,163,175,0.15)', text: 'var(--brand-grey)', label: 'Dismissed' },
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
      <AppHeader />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Report Status</h1>
            <p className="text-white/50">Track your submitted reports and their status</p>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="az-glass p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-[#F59E0B]">{pendingCount}</p>
            <p className="text-xs text-white/50 mt-1">Pending</p>
          </div>
          <div className="az-glass p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-[#60A5FA]">{reviewingCount}</p>
            <p className="text-xs text-white/50 mt-1">Reviewing</p>
          </div>
          <div className="az-glass p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-[var(--brand-green)]">{resolvedCount}</p>
            <p className="text-xs text-white/50 mt-1">Resolved</p>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
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
                  className="az-glass p-5 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.label}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(report.createdAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {report.contentTitle && (
                        <p className="text-sm font-medium text-white truncate mt-1">
                          {report.contentTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-white/50 mb-2">
                    <span className="font-medium text-white/70">Reason:</span> {report.reason}
                  </div>

                  {report.description && (
                    <p className="text-xs text-white/40 mb-2 line-clamp-2">{report.description}</p>
                  )}

                  {report.resolution && (
                    <div
                      className="mt-3 p-3 rounded-lg text-xs"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}
                    >
                      <p className="font-medium text-[var(--brand-green)] mb-1">Resolution:</p>
                      <p className="text-white/60">{report.resolution}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 text-xs text-white/30">
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
          <div className="text-center py-16">
            <p className="text-4xl mb-4"></p>
            <h2 className="text-xl font-bold text-white mb-2">No reports yet</h2>
            <p className="text-white/50">
              When you report content, you&apos;ll be able to track the status here.
            </p>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

const LazyModerationStatusPage = lazy(() =>
  Promise.resolve({ default: ModerationStatusPageContent })
);

export default function ModerationStatusPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyModerationStatusPage />
    </Suspense>
  );
}
