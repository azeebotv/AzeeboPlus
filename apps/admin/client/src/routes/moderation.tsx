import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

interface ModReport {
  id: string;
  type: string;
  reason: string;
  status: string;
  resolutionAction?: string | null;
  resolutionReason?: string | null;
  createdAt: string;
  reportingUser?: { displayName?: string; email?: string } | null;
  reportedUser?: { displayName?: string; email?: string } | null;
  contentId?: string | null;
}

interface ModStats {
  pendingReports: number;
  inReviewReports: number;
  resolvedReports: number;
  totalReports: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: 'var(--admin-amber)' },
  in_review: { bg: 'rgba(59,130,246,0.15)', color: 'var(--admin-blue)' },
  resolved: { bg: 'rgba(16,185,129,0.15)', color: 'var(--admin-emerald)' },
  dismissed: { bg: 'rgba(120,120,120,0.2)', color: 'var(--admin-text-muted)' },
};

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeReport, setActiveReport] = useState<ModReport | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const statsQ = useQuery({
    queryKey: ['admin', 'moderation', 'stats'],
    queryFn: async () => {
      const res = await adminApi.getModerationStats();
      return res.success ? (res.data as ModStats) : null;
    },
    refetchInterval: 30_000,
  });

  const reportsQ = useQuery({
    queryKey: ['admin', 'moderation', 'reports', page, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getModerationReports({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      if (!res.success) throw new Error(res.message || 'Failed to load reports');
      return res.data as { reports: ModReport[]; total: number; totalPages: number };
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason: string }) =>
      adminApi.resolveModerationReport(id, action, reason),
    onSuccess: () => {
      setActionError(null);
      setActiveReport(null);
      setActionReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
    },
    onError: (e) => setActionError((e as Error).message || 'Action failed'),
  });

  const dismissMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.dismissModerationReport(id, reason),
    onSuccess: () => {
      setActionError(null);
      setActiveReport(null);
      setActionReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
    },
    onError: (e) => setActionError((e as Error).message || 'Action failed'),
  });

  const busy = resolveMutation.isPending || dismissMutation.isPending;
  const reports = reportsQ.data?.reports ?? [];
  const totalPages = reportsQ.data?.totalPages ?? 0;
  const stats = statsQ.data;

  const act = (action: 'resolve' | 'dismiss') => {
    if (!activeReport) return;
    if (!actionReason.trim()) {
      setActionError('A reason is required');
      return;
    }
    if (action === 'resolve') {
      resolveMutation.mutate({
        id: activeReport.id,
        action: 'content_removed',
        reason: actionReason.trim(),
      });
    } else {
      dismissMutation.mutate({ id: activeReport.id, reason: actionReason.trim() });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="shield" size={28} color="var(--admin-orange)" />
          <span>Moderation</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          User reports queue — resolve (take action) or dismiss (no action) with an audited reason.
        </p>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Pending', value: stats.pendingReports, color: 'var(--admin-amber)' },
            { label: 'In review', value: stats.inReviewReports, color: 'var(--admin-blue)' },
            { label: 'Resolved', value: stats.resolvedReports, color: 'var(--admin-emerald)' },
            { label: 'Total', value: stats.totalReports, color: 'var(--admin-text)' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: '1 1 160px',
                border: '1px solid var(--admin-card)',
                borderRadius: 12,
                backgroundColor: 'var(--admin-surface)',
                padding: '14px 18px',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['all', 'pending', 'in_review', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: statusFilter === s ? 'none' : '1px solid var(--admin-surface)',
              background: statusFilter === s ? 'var(--admin-orange)' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {reportsQ.isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load reports.</strong> {(reportsQ.error as Error)?.message}
        </div>
      ) : reportsQ.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-card)' }}>
                  {['Type', 'Reason', 'Reporter', 'Reported user', 'Status', 'Created', ''].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 14px',
                          textAlign: 'left',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 11,
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const st = STATUS_STYLE[r.status] ?? {
                    bg: 'rgba(245,158,11,0.15)',
                    color: 'var(--admin-amber)',
                  };
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.type}</td>
                      <td
                        style={{
                          padding: '11px 14px',
                          color: 'var(--admin-text-muted)',
                          maxWidth: 260,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={r.reason}
                      >
                        {r.reason}
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--admin-text-muted)' }}>
                        {r.reportingUser?.displayName || r.reportingUser?.email || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--admin-text-muted)' }}>
                        {r.reportedUser?.displayName || r.reportedUser?.email || '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: st.bg,
                            color: st.color,
                            textTransform: 'capitalize',
                          }}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--admin-text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {r.status === 'pending' || r.status === 'in_review' ? (
                          <button
                            onClick={() => {
                              setActiveReport(r);
                              setActionError(null);
                              setActionReason('');
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              border: '1px solid var(--admin-surface)',
                              background: 'transparent',
                              color: 'var(--admin-orange)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            {r.resolutionAction ?? '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}
                    >
                      No reports in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderTop: '1px solid var(--admin-bg)',
              }}
            >
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Prev
              </button>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={() => setActiveReport(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
              padding: 24,
              maxWidth: 460,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {activeReport.type} report
            </h2>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 14 }}>
              {activeReport.reason}
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Resolution reason (required, audit-logged)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
                marginBottom: 12,
                resize: 'vertical',
              }}
            />
            {actionError && (
              <p style={{ color: 'var(--admin-red)', fontSize: 12, marginBottom: 10 }}>
                {actionError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => act('resolve')}
                disabled={busy || !actionReason.trim()}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--admin-red)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                Resolve (action taken)
              </button>
              <button
                onClick={() => act('dismiss')}
                disabled={busy || !actionReason.trim()}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
