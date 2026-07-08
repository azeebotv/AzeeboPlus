'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface AdminRealityShowItem {
  id: string;
  title: string;
  thumbnail?: string;
  contestantCount: number;
  season: number;
  isActive: boolean;
}

export default function AdminRealityPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const { data: shows = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'reality-shows'],
    queryFn: async () => {
      const response = await api.admin.getRealityShows();
      if (response.success && response.data) {
        const data = response.data as unknown as AdminRealityShowItem[] | { items: AdminRealityShowItem[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reality Shows</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{shows.length} shows</p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16 }}>
              <Skeleton width="120px" height="68px" borderRadius="8px" />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="16px" className="mb-2" />
                <Skeleton width="40%" height="13px" />
              </div>
              <Skeleton width="60px" height="20px" borderRadius="999px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load reality shows" description="Please try again later" onButtonPress={() => router.refresh()} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shows.map((show) => (
            <div key={show.id} className="az-glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16 }}>
              {show.thumbnail && (
                <img src={show.thumbnail} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{show.title}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>{show.contestantCount || 0} contestants · Season {show.season || 1}</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: show.isActive ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)', color: show.isActive ? '#0D3B2E' : '#9A8A7A' }}>
                {show.isActive ? 'Active' : 'Ended'}
              </span>
            </div>
          ))}
          {shows.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No reality shows found</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
