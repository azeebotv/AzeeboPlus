import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { EngagementMetrics } from '@/lib/admin-types';

export default function EngagementPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'engagement'],
    queryFn: async () => {
      const res = await adminApi.getEngagementMetrics();
      return res.success ? (res.data as EngagementMetrics) : null;
    },
  });

  const cards = metrics
    ? [
        {
          label: 'Daily Active Users',
          value: metrics.dailyActiveUsers?.toLocaleString() || '0',
          color: 'var(--admin-orange)',
        },
        {
          label: 'Monthly Active Users',
          value: metrics.monthlyActiveUsers?.toLocaleString() || '0',
          color: 'var(--admin-green)',
        },
        {
          label: 'Avg Session Duration',
          value: `${Math.round((metrics.averageSessionDuration || 0) / 60)}m`,
          color: 'var(--admin-amber)',
        },
        {
          label: 'Retention Rate',
          value: `${(metrics.retentionRate || 0).toFixed(1)}%`,
          color: 'var(--admin-red)',
        },
      ]
    : [];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Engagement</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 32 }}>User engagement metrics and trends</p>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{c.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
