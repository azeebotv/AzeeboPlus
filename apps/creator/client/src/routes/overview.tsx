import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { DashboardStats } from '@/lib/creator-types';

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'overview'],
    queryFn: async () => {
      const res = await creatorApi.getDashboard();
      return res.success ? (res.data as DashboardStats) : null;
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Overview</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>Your creator performance at a glance</p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : data ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>Views This Month</h3>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{data.totalViews.toLocaleString()}</p>
            <p
              style={{
                fontSize: 13,
                color: data.viewsChange.startsWith('+') ? 'var(--creator-green)' : 'var(--creator-red)',
                marginTop: 4,
              }}
            >
              {data.viewsChange}
            </p>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>Total Earnings</h3>
            <p style={{ fontSize: 32, fontWeight: 700 }}>${data.totalEarnings.toLocaleString()}</p>
            <p
              style={{
                fontSize: 13,
                color: data.earningsChange.startsWith('+') ? 'var(--creator-green)' : 'var(--creator-red)',
                marginTop: 4,
              }}
            >
              {data.earningsChange}
            </p>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>Subscribers</h3>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{data.subscribers.toLocaleString()}</p>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>Published Content</h3>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{data.contentCount}</p>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>No data available</p>
      )}
    </div>
  );
}
