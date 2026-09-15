import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import type { SavedAdminReport } from '@/lib/api/admin';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';
import { Icon } from '@/components/Icons';

const RANGES = ['7d', '30d', '90d', 'all'] as const;
type Range = (typeof RANGES)[number];

/** Date-keyed activity map → total over the window. */
const totalOf = (m: Record<string, number> | undefined) =>
  Object.values(m ?? {}).reduce((a, b) => a + b, 0);

export default function ReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isEnabled } = useAdminFlags();
  const [range, setRange] = useState<Range>('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reports', range],
    queryFn: async () => {
      const res = await adminApi.getReports(range);
      if (!res.success) throw new Error('Failed to load reports');
      return res.data;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
  };

  const runMutation = useMutation({
    mutationFn: (id: string) => adminApi.executeReport(id),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReport(id),
    onSuccess: invalidate,
  });

  const reports: SavedAdminReport[] = Array.isArray(data?.reports) ? data.reports : [];
  const summary = data?.summary;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
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
            <Icon name="barChart" size={28} color="var(--admin-orange)" />
            <span>Reports</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            {reports.length} saved report{reports.length === 1 ? '' : 's'} · activity over {range}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: range === r ? 'none' : '1px solid var(--admin-surface)',
                background: range === r ? 'var(--admin-orange)' : 'transparent',
                color: range === r ? 'white' : 'var(--admin-text-muted)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
          {isEnabled(ADMIN_FLAG_KEYS.reportBuilder) && (
            <button
              onClick={() => navigate('/reports/builder')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={16} />
              <span>Build Report</span>
            </button>
          )}
        </div>
      </div>

      {isError && (
        <p
          style={{
            color: 'var(--admin-red-light)',
            background: 'rgba(204,28,28,0.12)',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          Could not load reports — is the backend up? Try again shortly.
        </p>
      )}

      {/* Activity summary for the selected window */}
      {summary && (
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          {[
            { label: 'New users', value: totalOf(summary.userGrowth), icon: 'users' },
            { label: 'Content published', value: totalOf(summary.contentPublished), icon: 'film' },
            {
              label: 'Revenue credited',
              value: totalOf(summary.revenue).toLocaleString(),
              icon: 'wallet',
            },
            {
              label: 'Moderation reports',
              value: `${summary.reports.pending} pending / ${summary.reports.resolved} resolved`,
              icon: 'shield',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: '1 1 200px',
                minWidth: 200,
                border: '1px solid var(--admin-card)',
                borderRadius: 14,
                backgroundColor: 'var(--admin-surface)',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  color: 'var(--admin-text-muted)',
                  fontSize: 12,
                }}
              >
                <Icon name={s.icon} size={14} color="var(--admin-orange)" />
                <span>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{r.name}</h3>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    {r.category} · {r.dateRange} · {r.format.toUpperCase()}
                    {r.lastRunAt
                      ? ` · last run ${new Date(r.lastRunAt).toLocaleString()}`
                      : ' · never run'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => runMutation.mutate(r.id)}
                    disabled={runMutation.isPending}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      background: 'transparent',
                      color: 'var(--admin-emerald)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: runMutation.isPending ? 'wait' : 'pointer',
                    }}
                  >
                    Run
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete report "${r.name}"?`)) {
                        deleteMutation.mutate(r.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      background: 'transparent',
                      color: 'var(--admin-red-light)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: deleteMutation.isPending ? 'wait' : 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No saved reports yet. Build your first report!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
