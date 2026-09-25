import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { ChallengeEntryReviewItem } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

type ReviewAction = 'under_review' | 'winner' | 'rejected';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'winner', label: 'Winners' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.15)', fg: '#eab308' },
  under_review: { bg: 'rgba(59, 130, 246, 0.15)', fg: '#3b82f6' },
  winner: { bg: 'rgba(34, 197, 94, 0.15)', fg: '#22c55e' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', fg: '#ef4444' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: 'rgba(113,113,122,0.15)', fg: '#71717a' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ChallengeEntriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  // Rejection note: which entry's note input is open, and its draft text.
  const [noteEntryId, setNoteEntryId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'challenge-entries', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getChallengeEntryQueue(
        statusFilter ? { status: statusFilter } : {}
      );
      if (res.success && res.data) {
        return (res.data as { items?: ChallengeEntryReviewItem[] }).items ?? [];
      }
      throw new Error(res.message || res.error || 'Failed to load entries');
    },
    retry: 1,
  });

  const reviewMutation = useMutation({
    // apiFetch resolves with an ApiError object instead of throwing, so a 403
    // (CSRF drift, IP ban) would otherwise land in onSuccess and show a false
    // "applied" banner. Assert success so failures hit onError with the
    // server's message.
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: string;
      action: ReviewAction;
      note?: string;
    }) => {
      const res = await adminApi.reviewChallengeEntry(id, action, note);
      if (!res.success) {
        throw new Error(res.message || res.error || 'Review action failed');
      }
      return res.data;
    },
    onSuccess: (_data, vars) => {
      setActionError(null);
      setLastAction(`${vars.action} applied${vars.note ? ' with note' : ''}`);
      setNoteEntryId(null);
      setNoteDraft('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'challenge-entries'] });
    },
    onError: (err) => {
      setLastAction(null);
      setActionError(err instanceof Error ? err.message : 'Review action failed');
    },
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="checkCircle" size={28} color="var(--admin-orange)" />
          <span>Challenge Entry Review</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          {pendingCount} pending · {items.length} shown — set under review, winner,
          or rejected
        </p>
      </div>

      {/* Status filter row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: active
                  ? '1px solid var(--admin-orange)'
                  : '1px solid var(--admin-border, #3f3f46)',
                background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: active ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {actionError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)',
            color: '#ef4444',
            padding: '10px 16px',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}
      {lastAction && !actionError && (
        <div
          style={{
            background: 'rgba(34,197,94,0.12)',
            color: '#22c55e',
            padding: '10px 16px',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ✓ {lastAction}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <div
          style={{
            padding: 60,
            borderRadius: 20,
            textAlign: 'center',
            border: '1px dashed var(--admin-border, #3f3f46)',
            color: '#ef4444',
          }}
        >
          Could not load the review queue — is creator-service running?
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: 60,
            borderRadius: 20,
            textAlign: 'center',
            border: '1px dashed var(--admin-border, #3f3f46)',
          }}
        >
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>
            No challenge entries{statusFilter ? ` with status "${statusFilter}"` : ''}.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 18px',
                borderRadius: 14,
                border: '1px solid var(--admin-border, #3f3f46)',
                background: 'var(--admin-card, rgba(255,255,255,0.03))',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{entry.participantName}</strong>
                  <StatusBadge status={entry.status} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.challengeTitle}
                  {entry.prize ? ` · Prize ${entry.prize}` : ''} · submitted{' '}
                  {new Date(entry.createdAt).toLocaleDateString()} ·{' '}
                  <span title={entry.contentUrl}>{entry.contentUrl}</span>
                </div>
                {entry.reviewedAt && (
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    reviewed {new Date(entry.reviewedAt).toLocaleString()}
                  </div>
                )}
                {entry.reviewNote && (
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 6,
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: 'var(--admin-text, #e4e4e7)',
                    }}
                  >
                    Note: {entry.reviewNote}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  disabled={reviewMutation.isPending || entry.status === 'under_review'}
                  onClick={() => {
                    setLastAction(null);
                    reviewMutation.mutate({ id: entry.id, action: 'under_review' });
                  }}
                  title="Move to under review"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #3b82f6',
                    background: entry.status === 'under_review' ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: '#3b82f6',
                    cursor: entry.status === 'under_review' ? 'default' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Under Review
                </button>
                <button
                  disabled={reviewMutation.isPending || entry.status === 'winner'}
                  onClick={() => {
                    setLastAction(null);
                    reviewMutation.mutate({ id: entry.id, action: 'winner' });
                  }}
                  title="Mark as winner"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #22c55e',
                    background: entry.status === 'winner' ? 'rgba(34,197,94,0.2)' : 'transparent',
                    color: '#22c55e',
                    cursor: entry.status === 'winner' ? 'default' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Winner
                </button>
                <button
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    setLastAction(null);
                    setActionError(null);
                    // Rejection always opens the note composer first — the
                    // note is the creator's explanation of WHY.
                    setNoteEntryId(noteEntryId === entry.id ? null : entry.id);
                    setNoteDraft(entry.reviewNote ?? '');
                  }}
                  title="Reject entry (with optional note to the creator)"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #ef4444',
                    background: entry.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'transparent',
                    color: '#ef4444',
                    cursor: reviewMutation.isPending ? 'default' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Rejected
                </button>
              </div>

              {noteEntryId === entry.id && (
                <div
                  style={{
                    flexBasis: '100%',
                    marginTop: 4,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.05)',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Note to the creator (sent with the rejection — optional, max 1000 chars)
                  </label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g. Audio quality needs improvement — re-record and resubmit to the next challenge"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border, #3f3f46)',
                      background: 'var(--admin-card, rgba(255,255,255,0.03))',
                      color: 'var(--admin-text, #e4e4e7)',
                      fontSize: 13,
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={() => {
                        setNoteEntryId(null);
                        setNoteDraft('');
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-border, #3f3f46)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={reviewMutation.isPending}
                      onClick={() => {
                        setLastAction(null);
                        reviewMutation.mutate({
                          id: entry.id,
                          action: 'rejected',
                          note: noteDraft.trim() || undefined,
                        });
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        fontWeight: 600,
                        cursor: reviewMutation.isPending ? 'default' : 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {reviewMutation.isPending ? 'Rejecting…' : 'Reject with note'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
