import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { ContentReviewItem } from '@/lib/admin-types';
import { assertSuccess, requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import QueryErrorBanner from '@/components/QueryErrorBanner';

export default function ContentReviewPage() {
  const queryClient = useQueryClient();
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: queue = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'content-review'],
    queryFn: async () => {
      const res = await adminApi.getContentReviewQueue();
      // "All caught up!" is the most damaging possible lie on this page: a
      // failed read used to render it, so moderators stopped reviewing.
      return unwrapList<ContentReviewItem>(requireData(res, null)).items;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.approveContent(id)),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] });
    },
    onError: (e: Error) => setActionError(e.message || 'Failed to approve item'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      assertSuccess(await adminApi.rejectContent(id, reason)),
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-review'] });
      setActiveRejectId(null);
    },
    onError: (e: Error) => setActionError(e.message || 'Failed to reject item'),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="checkCircle" size={28} color="var(--admin-orange)" />
          <span>Content Review Queue</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          {isError ? 'Review queue unavailable' : `${queue.length} items pending review`}
        </p>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid rgba(204,28,28,0.4)',
            backgroundColor: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : isError ? (
        <QueryErrorBanner
          title="Review queue unavailable."
          body="Nothing here is confirmed reviewed — approve and reject actions are unreliable until the queue loads again."
          detail={error?.message}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : queue.length === 0 ? (
        <div
          style={{
            padding: 60,
            borderRadius: 20,
            textAlign: 'center',
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="checkCircle" size={32} color="var(--admin-emerald)" />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 4 }}>All caught up!</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>No content pending review</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: 'var(--admin-text)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    by <span style={{ color: 'var(--admin-text)' }}>{item.creatorName || 'Unknown'}</span> ·{' '}
                    {new Date(item.submittedAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 20px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    <Icon name="check" size={14} color="#fff" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveRejectId(activeRejectId === item.id ? null : item.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      borderRadius: 10,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--admin-red)',
                      fontWeight: 500,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {activeRejectId === item.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--admin-card)', display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Enter reason for rejection (required)…"
                    value={rejectReasons[item.id] || ''}
                    onChange={(e) =>
                      setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      const reason = (rejectReasons[item.id] || '').trim();
                      if (!reason) return;
                      rejectMutation.mutate({ id: item.id, reason });
                    }}
                    disabled={rejectMutation.isPending || !(rejectReasons[item.id] || '').trim()}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      backgroundColor: 'var(--admin-red)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: !(rejectReasons[item.id] || '').trim() ? 0.5 : 1,
                    }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
