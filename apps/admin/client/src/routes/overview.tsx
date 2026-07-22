import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { data: stats = {}, isLoading, error } = useQuery({
    queryKey: ['admin', 'platform-overview'],
    queryFn: async () => {
      const res = await adminApi.getPlatformOverview();
      return res.success ? (res.data as Record<string, number | string>) : {};
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Platform Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Detailed platform statistics and metrics</p>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: 20, borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)' }}>
              <div style={{ width: '60%', height: 12, backgroundColor: '#2A1A1A', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '40%', height: 22, backgroundColor: '#2A1A1A', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid #CC1C1C', backgroundColor: 'rgba(204,28,28,0.1)' }}>
          <p style={{ color: '#CC1C1C', fontWeight: 600 }}>Failed to load overview</p>
          <button onClick={() => navigate(0)} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: '#E8420A', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={{ padding: 20, borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)' }}>
              <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E8420A' }}>{typeof value === 'number' ? value.toLocaleString() : String(value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
