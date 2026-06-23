'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminUniversesPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [universes, setUniverses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadUniverses();
  }, [isAuthenticated, user]);

  const loadUniverses = async () => {
    try {
      const response = await api.admin.getAllUniverses();
      if (response.success && response.data) {
        const data = response.data as any;
        setUniverses(Array.isArray(data) ? data : data.items || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Universes</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{universes.length} universes</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {universes.map(u => (
            <div key={u.id} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{u.icon || '🌍'}</span>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{u.name}</h3>
              </div>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 12 }}>{u.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9A8A7A' }}>
                <span>{u.contentCount || 0} items</span>
                <span>{u.subscriberCount || 0} subs</span>
              </div>
            </div>
          ))}
          {universes.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>No universes found</p>}
        </div>
      )}
    </AdminLayout>
  );
}
