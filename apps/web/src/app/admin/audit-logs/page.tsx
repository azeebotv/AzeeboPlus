'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface AuditLog {
  id?: string;
  timestamp?: string;
  createdAt?: string;
  userId?: string;
  username?: string;
  action?: string;
  details?: string;
  ipAddress?: string;
}

export default function AdminAuditLogsPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState('all');
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'audit-logs', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('category', filter);
      const response = await apiFetch<{
        success: boolean;
        data: AuditLog[] | { items?: AuditLog[] };
      }>(`/admin/audit-logs?${params.toString()}`);
      if (response.success && response.data) {
        const data = response.data as AuditLog[] | { items?: AuditLog[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Audit Logs</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>System activity and security logs</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {['all', 'auth', 'content', 'wallet', 'admin'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            role="radio"
            aria-checked={filter === f}
            aria-label={`Filter by ${f} category`}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: filter === f ? 'none' : '1px solid #2A1A1A',
              background:
                filter === f ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: filter === f ? '#fff' : '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid #1A0A0A',
                }}
              >
                <Skeleton width="120px" height="14px" />
                <Skeleton width="80px" height="14px" />
                <Skeleton width="100px" height="14px" />
                <Skeleton width="140px" height="14px" />
                <Skeleton width="80px" height="14px" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load audit logs"
          description="Please try again later"
          onButtonPress={() => router.refresh()}
        />
      ) : (
        <div className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['Timestamp', 'User', 'Action', 'Details', 'IP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: '#9A8A7A',
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id || `${log.timestamp}-${log.userId}-${log.action}`}
                    style={{ borderBottom: '1px solid #1A0A0A' }}
                  >
                    <td style={{ padding: '10px 16px', color: '#6B5A4A', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp || log.createdAt || '').toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                      {log.username || log.userId}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'rgba(232,66,10,0.1)',
                          color: '#E8420A',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        color: '#9A8A7A',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.details || '-'}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        color: '#6B5A4A',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
              No audit logs found
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
