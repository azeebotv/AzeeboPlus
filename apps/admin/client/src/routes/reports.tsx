import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';
import type { AdminReport } from '@/lib/admin-types';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { isEnabled } = useAdminFlags();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const res = await adminApi.getReports();
      return res.success ? (res.data as AdminReport[]) : [];
    },
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Reports</h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>{reports.length} reports</p>
        </div>
        {isEnabled(ADMIN_FLAG_KEYS.reportBuilder) && (
          <button
            onClick={() => navigate('/reports/builder')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Build Report
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{r.name}</h3>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    {r.category} · {r.dateRange}
                  </p>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: 'rgba(13,59,46,0.2)',
                    color: 'var(--admin-green)',
                  }}
                >
                  {r.metrics?.length || 0} metrics
                </span>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No reports yet. Build your first report!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
