'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminEngagementPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [engagement, setEngagement] = useState({
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0,
    averageSessionDuration: 0,
    retentionRate: 0,
    bounceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadEngagement();
  }, [authLoading, isAuthenticated, user]);

  const loadEngagement = async () => {
    try {
      const response = await api.admin.getEngagementMetrics();
      if (response.success && response.data) setEngagement(response.data as typeof engagement);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Engagement</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>User engagement metrics and activity</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: 'Daily Active Users',
                value: engagement.dailyActiveUsers.toLocaleString(),
                color: '#E8420A',
              },
              {
                label: 'Monthly Active Users',
                value: engagement.monthlyActiveUsers.toLocaleString(),
                color: '#0D3B2E',
              },
              {
                label: 'Avg Session',
                value: `${Math.floor(engagement.averageSessionDuration / 60)}m`,
                color: '#F59E0B',
              },
              { label: 'Retention Rate', value: `${engagement.retentionRate}%`, color: '#CC1C1C' },
            ].map((stat, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <p style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>{stat.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
