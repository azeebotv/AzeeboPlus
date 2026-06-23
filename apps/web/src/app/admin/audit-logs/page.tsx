'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminAuditLogsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadLogs();
  }, [isAuthenticated, user, filter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('category', filter);
      const response = await apiFetch<any>(`/admin/audit-logs?${params.toString()}`);
      if (response.success && response.data) {
        const data = response.data as any;
        setLogs(Array.isArray(data) ? data : data.items || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Audit Logs</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>System activity and security logs</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {['all', 'auth', 'content', 'wallet', 'admin'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 999, border: filter === f ? 'none' : '1px solid #2A1A1A', background: filter === f ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: filter === f ? '#fff' : '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['Timestamp', 'User', 'Action', 'Details', 'IP'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#9A8A7A', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td style={{ padding: '10px 16px', color: '#6B5A4A', whiteSpace: 'nowrap' }}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{log.username || log.userId}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(232,66,10,0.1)', color: '#E8420A' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#9A8A7A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#6B5A4A', fontFamily: 'monospace', fontSize: 12 }}>{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No audit logs found</p>}
        </div>
      )}
    </AdminLayout>
  );
}
