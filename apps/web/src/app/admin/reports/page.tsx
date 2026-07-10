'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface AdminReport {
  id?: string;
  title?: string;
  name?: string;
  createdAt?: string;
}

export default function AdminReportsPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const response = await api.admin.getReports();
      if (response.success && response.data) {
        const data = response.data as AdminReport[] | { items?: AdminReport[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
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
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Generated reports and analytics</p>
        </div>
        <a
          href="/admin/reports/builder"
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          + Build Report
        </a>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="az-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <Skeleton width="48px" height="48px" borderRadius="12px" />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="16px" className="mb-2" />
                <Skeleton width="40%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load reports"
          description="Please try again later"
          onButtonPress={() => router.refresh()}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r, i) => (
            <div
              key={r.id || i}
              className="az-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#2A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                📊
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {r.title || r.name}
                </h3>
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                  Generated {new Date(r.createdAt ?? '').toLocaleDateString()}
                </p>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(13,59,46,0.2)',
                  color: '#0D3B2E',
                }}
              >
                Ready
              </span>
            </div>
          ))}
          {reports.length === 0 && (
            <div
              className="az-glass"
              style={{ padding: 40, borderRadius: 20, textAlign: 'center' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>No reports yet</h3>
              <p style={{ color: '#9A8A7A' }}>Create your first report using the report builder</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
