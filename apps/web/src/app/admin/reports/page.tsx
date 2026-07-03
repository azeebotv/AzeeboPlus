'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminReportsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadReports();
  }, [authLoading, isAuthenticated, user]);

  const loadReports = async () => {
    try {
      const response = await api.admin.getReports();
      if (response.success && response.data) {
        const data = response.data as any;
        setReports(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r: any, i: number) => (
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
                  Generated {new Date(r.createdAt).toLocaleDateString()}
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
