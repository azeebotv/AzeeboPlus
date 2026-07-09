'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface Announcement {
  id?: string;
  title?: string;
  content?: string;
  message?: string;
  isActive?: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export default function AdminAnnouncementsPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const response = await api.admin.getNotificationTemplates();
      if (response.success && response.data) {
        const data = response.data as Announcement[] | { items?: Announcement[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Announcements</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Manage platform announcements</p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton width="50%" height="18px" />
                <Skeleton width="60px" height="20px" borderRadius="999px" />
              </div>
              <Skeleton width="100%" height="14px" className="mb-2" />
              <Skeleton width="30%" height="12px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load announcements" description="Please try again later" onButtonPress={() => router.refresh()} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a, i) => (
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
          {announcements.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No announcements yet</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
