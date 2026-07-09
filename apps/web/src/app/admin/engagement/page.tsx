'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

export default function AdminEngagementPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const { data: engagement, isLoading, error } = useQuery({
    queryKey: ['admin', 'engagement'],
    queryFn: async () => {
      const response = await api.admin.getEngagementMetrics();
      if (response.success && response.data) return response.data as { dailyActiveUsers: number; monthlyActiveUsers: number; averageSessionDuration: number; retentionRate: number; bounceRate: number };
      return { dailyActiveUsers: 0, monthlyActiveUsers: 0, averageSessionDuration: 0, retentionRate: 0, bounceRate: 0 };
    },
    enabled: isEnabled,
  });

  const eng = engagement || { dailyActiveUsers: 0, monthlyActiveUsers: 0, averageSessionDuration: 0, retentionRate: 0, bounceRate: 0 };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Engagement</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>User engagement metrics and activity</p>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <Skeleton width="60%" height="12px" className="mb-2" />
              <Skeleton width="40%" height="22px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load engagement data" description="Please try again later" onButtonPress={() => router.refresh()} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Daily Active Users', value: eng.dailyActiveUsers.toLocaleString(), color: '#E8420A' },
            { label: 'Monthly Active Users', value: eng.monthlyActiveUsers.toLocaleString(), color: '#0D3B2E' },
            { label: 'Avg Session', value: `${Math.floor(eng.averageSessionDuration / 60)}m`, color: '#F59E0B' },
            { label: 'Retention Rate', value: `${eng.retentionRate}%`, color: '#CC1C1C' },
          ].map((stat, i) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
