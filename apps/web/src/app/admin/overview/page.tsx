'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminOverviewPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadStats();
  }, [isAuthenticated, user]);

  const loadStats = async () => {
    try {
      const response = await api.admin.getPlatformOverview();
      if (response.success && response.data) setStats(response.data);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Platform Overview</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Detailed platform statistics and metrics</p>

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {Object.entries(stats).map(([key, value]: [string, any]) => (
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
