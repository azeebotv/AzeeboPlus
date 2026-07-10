'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface ContentReviewItem {
  id: string;
  title?: string;
  thumbnail?: string;
  creatorName?: string;
  submittedAt?: string;
  createdAt?: string;
}

export default function AdminContentReviewPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const {
    data: queue = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'content-review'],
    queryFn: async () => {
      const response = await api.admin.getContentReviewQueue();
      if (response.success && response.data) {
        const data = response.data as ContentReviewItem[] | { items?: ContentReviewItem[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.admin.approveContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.admin.rejectContent(id, 'Rejected by admin'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] }),
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Review Queue</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{queue.length} items pending review</p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="az-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <Skeleton width="120px" height="68px" borderRadius="8px" />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="16px" className="mb-2" />
                <Skeleton width="40%" height="12px" />
              </div>
              <Skeleton width="80px" height="32px" borderRadius="999px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load review queue"
          description="Please try again later"
          onButtonPress={() => router.refresh()}
        />
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
                  {new Date(item.submittedAt || item.createdAt || '').toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => approveMutation.mutate(item.id)}
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
                  onClick={() => rejectMutation.mutate(item.id)}
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
