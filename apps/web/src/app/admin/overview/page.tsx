'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

export default function AdminOverviewPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const {
    data: stats = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'platform-overview'],
    queryFn: async () => {
      const response = await api.admin.getPlatformOverview();
      if (response.success && response.data)
        return response.data as unknown as Record<string, number | string>;
      return {};
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Platform Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Detailed platform statistics and metrics</p>

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <Skeleton width="60%" height="12px" className="mb-2" />
              <Skeleton width="40%" height="22px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load overview"
          description="Please try again later"
          onButtonPress={() => router.refresh()}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <p
                style={{
                  fontSize: 12,
                  color: '#9A8A7A',
                  marginBottom: 8,
                  textTransform: 'capitalize',
                }}
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E8420A' }}>
                {typeof value === 'number' ? value.toLocaleString() : String(value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
