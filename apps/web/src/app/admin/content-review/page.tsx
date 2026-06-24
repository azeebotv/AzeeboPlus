'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminContentReviewPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadQueue();
  }, [isAuthenticated, user]);

  const loadQueue = async () => {
    try {
      const response = await api.admin.getContentReviewQueue();
      if (response.success && response.data) {
        const data = response.data as any;
        setQueue(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await api.admin.approveContent(id);
      else await api.admin.rejectContent(id, 'Rejected by admin');
      setQueue(queue.filter((q) => q.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Review Queue</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{queue.length} items pending review</p>

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
      ) : queue.length === 0 ? (
        <div className="az-glass" style={{ padding: 40, borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18 }}>All caught up!</h3>
          <p style={{ color: '#9A8A7A', marginTop: 8 }}>No content pending review</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.map((item) => (
            <div
              key={item.id}
              className="az-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
              }}
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  style={{
                    width: 120,
                    height: 68,
                    objectFit: 'cover',
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                  by {item.creatorName || 'Unknown'} ·{' '}
                  {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleAction(item.id, 'approve')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #0D3B2E 0%, #1A5E45 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(item.id, 'reject')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 999,
                    border: '1px solid #CC1C1C',
                    background: 'transparent',
                    color: '#CC1C1C',
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
