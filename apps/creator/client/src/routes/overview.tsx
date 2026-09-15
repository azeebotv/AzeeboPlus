import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { formatNgn, isPositiveChange, cardStyle } from '@/lib/ui';

export default function OverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: async () => creatorApi.assertSuccess(await creatorApi.getDashboard()),
  });

  const stat = (label: string, value: string | number, change?: string) => (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>{label}</h3>
      <p style={{ fontSize: 32, fontWeight: 700 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {change && (
        <p
          style={{
            fontSize: 13,
            color: isPositiveChange(change) ? 'var(--creator-green)' : 'var(--creator-red)',
            marginTop: 4,
          }}
        >
          {change}
        </p>
      )}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Overview</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Your creator performance at a glance
      </p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <p style={{ color: 'var(--creator-red)', textAlign: 'center', padding: 40 }}>
          {creatorApi.errorMessage(error)}
        </p>
      ) : data ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {stat('Views This Month', data.totalViews, data.viewsChange)}
          {stat('Earnings', formatNgn(data.totalEarnings), data.earningsChange)}
          {stat('Subscribers', data.subscribers, data.subscribersChange)}
          {stat('Content', data.contentCount, data.contentChange)}
        </div>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No data available
        </p>
      )}
    </div>
  );
}
