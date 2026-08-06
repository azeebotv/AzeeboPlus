import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { creatorApi } from '@/lib/api/creator';
import type { DashboardStats } from '@/lib/creator-types';

const statCard = (label: string, value: string | number, change: string, icon: string) => (
  <div
    key={label}
    style={{
      padding: 20,
      borderRadius: 12,
      border: '1px solid #2A1A1A',
      backgroundColor: 'rgba(26,10,10,0.5)',
      flex: 1,
      minWidth: 200,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 13, color: '#9A8A7A' }}>{label}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <span style={{ fontSize: 12, color: change.startsWith('+') ? '#0D3B2E' : '#CC1C1C' }}>
      {change}
    </span>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: async () => {
      const res = await creatorApi.getDashboard();
      return res.success ? (res.data as DashboardStats) : null;
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Here's your creator dashboard</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            {statCard('Total Views', data.totalViews, data.viewsChange, '👁️')}
            {statCard('Subscribers', data.subscribers, data.subscribersChange, '👥')}
            {statCard(
              'Earnings',
              `$${data.totalEarnings.toLocaleString()}`,
              data.earningsChange,
              '💰'
            )}
            {statCard('Content', data.contentCount, data.contentChange, '🎬')}
          </div>
        </>
      ) : (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No data available</p>
      )}
    </div>
  );
}
