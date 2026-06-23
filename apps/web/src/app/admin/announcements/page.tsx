'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminAnnouncementsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadAnnouncements();
  }, [isAuthenticated, user]);

  const loadAnnouncements = async () => {
    try {
      const response = await api.admin.getNotificationTemplates();
      if (response.success && response.data) {
        const data = response.data as any;
        setAnnouncements(Array.isArray(data) ? data : data.items || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Announcements</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Manage platform announcements</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a: any, i: number) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</h3>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: a.isActive ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)', color: a.isActive ? '#0D3B2E' : '#9A8A7A' }}>
                  {a.isActive ? 'Active' : 'Draft'}
                </span>
              </div>
              <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 12 }}>{a.content || a.message}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6B5A4A' }}>
                <span>Created {new Date(a.createdAt).toLocaleDateString()}</span>
                {a.expiresAt && <span>Expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No announcements yet</p>}
        </div>
      )}
    </AdminLayout>
  );
}
