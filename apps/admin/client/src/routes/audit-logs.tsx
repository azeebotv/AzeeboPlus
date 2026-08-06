import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AuditLogEntry } from '@/lib/api/admin';

export default function AuditLogsPage() {
  const [category, setCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', category],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({
        category: category === 'all' ? undefined : category,
        limit: 50,
      });
      return res.success
        ? (res.data as { items: AuditLogEntry[]; total: number })
        : { items: [], total: 0 };
    },
  });

  const logs = data?.items || [];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Audit Logs</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{data?.total || 0} total entries</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'auth', 'content', 'wallet', 'admin'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: category === cat ? 'none' : '1px solid #2A1A1A',
              background:
                category === cat
                  ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                  : 'transparent',
              color: category === cat ? '#fff' : '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #2A1A1A',
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
                        fontSize: 12,
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
                  <tr key={log.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#9A8A7A',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{log.actorId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'rgba(232,66,10,0.2)',
                          color: '#E8420A',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: '#9A8A7A',
                        fontSize: 13,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.targetType}
                      {log.targetId ? `: ${log.targetId}` : ''}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
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
    </div>
  );
}
