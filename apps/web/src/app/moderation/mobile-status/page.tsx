'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending: { bg: 'rgba(245,158,11,0.2)', text: 'var(--color-warning-500)', label: 'Pending', icon: '⏳' },
  reviewing: { bg: 'rgba(59,130,246,0.2)', text: 'var(--color-secondary-400)', label: 'Under Review', icon: '🔍' },
  resolved: { bg: 'rgba(34,197,94,0.2)', text: 'var(--color-success-500)', label: 'Resolved', icon: '✓' },
  dismissed: { bg: 'rgba(156,163,175,0.2)', text: '#9CA3AF', label: 'Dismissed', icon: '✕' },
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
    refetchInterval: 60000,
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
      <AppHeader />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Reports</h1>
          <p className="text-white/50 text-sm">Track the status of your content reports</p>
        </motion.div>

        <ScrollReveal>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'rgba(255,255,255,0.1)' },
              { label: 'Pending', value: stats.pending, color: 'rgba(245,158,11,0.15)' },
              { label: 'Reviewing', value: stats.reviewing, color: 'rgba(59,130,246,0.15)' },
              { label: 'Resolved', value: stats.resolved, color: 'rgba(34,197,94,0.15)' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: stat.color }}
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
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
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        <span>{statusStyle.icon}</span>
                        {statusStyle.label}
                      </span>
                      <span className="text-xs text-white/40">{formatDate(report.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1 capitalize">
                      {report.reason.replace(/-/g, ' ')}
                    </h3>
                    {report.contentPreview && (
                      <p className="text-xs text-white/50 line-clamp-2 mb-2">
                        &quot;{report.contentPreview}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span className="capitalize">{report.contentType}</span>
                      <span>•</span>
                      <span>ID: {report.contentId.slice(0, 8)}...</span>
                    </div>
                    {report.resolution && (
                      <div
                        className="mt-3 p-2 rounded-lg text-xs"
                        style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--color-success-500)' }}
                      >
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
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <p className="text-white/50 mb-2">No reports yet</p>
              <p className="text-sm text-white/30">When you report content, it will appear here</p>
            </GlowCard>
          </ScrollReveal>
        )}

        {reports.length > 0 && (
          <ScrollReveal className="mt-8">
            <GlowCard className="p-5">
              <h3 className="text-lg font-bold text-white mb-4">Top Report Reasons</h3>
              <div className="space-y-3">
                {getStatusCountsByReason().map(([reason, count]) => (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white capitalize">
                          {reason.replace(/-/g, ' ')}
                        </span>
                        <span className="text-sm text-white/50">{count}</span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #E8420A, #CC1C1C)' }}
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
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <p className="text-xs text-white/30">
              Reports are reviewed within 24 hours. You&apos;ll receive a notification when your
              report is processed.
            </p>
          </div>
        </ScrollReveal>
      </div>

      <AppFooter />
    </div>
  );
}

const LazyMobileStatusPage = lazy(() => Promise.resolve({ default: MobileStatusPageContent }));

export default function MobileStatusPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMobileStatusPage />
    </Suspense>
  );
}
