import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { ContentReviewItem } from '@/lib/admin-types';

export default function ContentReviewPage() {
  const queryClient = useQueryClient();
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['admin', 'content-review'],
    queryFn: async () => {
      const res = await adminApi.getContentReviewQueue();
      if (res.success && res.data) {
        const d = res.data as ContentReviewItem[] | { items?: ContentReviewItem[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectContent(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Review Queue</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{queue.length} items pending review</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : queue.length === 0 ? (
        <div
          style={{
            padding: 40,
            borderRadius: 20,
            textAlign: 'center',
            border: '1px solid #2A1A1A',
            backgroundColor: 'rgba(26,10,10,0.5)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18 }}>All caught up!</h3>
          <p style={{ color: '#9A8A7A', marginTop: 8 }}>No content pending review</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 16,
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                    by {item.creatorName || 'Unknown'} ·{' '}
                    {new Date(item.submittedAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending}
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
                    onClick={() => {
                      const reason = (rejectReasons[item.id] || '').trim();
                      if (!reason) return;
                      rejectMutation.mutate({ id: item.id, reason });
                    }}
                    disabled={rejectMutation.isPending || !(rejectReasons[item.id] || '').trim()}
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
              <input
                type="text"
                placeholder="Rejection reason (required)"
                value={rejectReasons[item.id] || ''}
                onChange={(e) =>
                  setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: '1px solid #2A1A1A',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                  color: '#E8D5C4',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
