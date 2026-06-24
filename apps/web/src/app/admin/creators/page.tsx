'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminCreatorsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadCreators();
  }, [isAuthenticated, user]);

  const loadCreators = async () => {
    try {
      const response = await api.admin.getCreators();
      if (response.success && response.data) {
        const data = response.data as any;
        setCreators(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Creators</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{creators.length} registered creators</p>

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {creators.map((creator) => (
            <div key={creator.id} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #E8420A',
                  }}
                >
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#2A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#E8420A',
                      }}
                    >
                      {creator.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{creator.username}</p>
                  <p style={{ color: '#9A8A7A', fontSize: 12 }}>{creator.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#9A8A7A' }}>
                <span>{creator.contentCount || 0} videos</span>
                <span>{creator.subscriberCount || 0} subs</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: creator.isApproved
                      ? 'rgba(13,59,46,0.2)'
                      : 'rgba(245,158,11,0.2)',
                    color: creator.isApproved ? '#0D3B2E' : '#F59E0B',
                  }}
                >
                  {creator.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
          {creators.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>
              No creators found
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
