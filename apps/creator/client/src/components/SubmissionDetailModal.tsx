import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { statusColor, statusText } from '@/components/ChallengeLeaderboard';
import type { SubmissionDetail, SubmissionReviewEvent } from '@/lib/creator-types';
import { formatNgn, errorTextStyle } from '@/lib/ui';
import { pollingIntervals } from '@azeebo/design-tokens';

/** Human label per review status. */
function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

/** Payout chip colors per derived prize-payout state. */
const payoutChip: Record<string, { bg: string; fg: string }> = {
  paid: { bg: 'rgba(13,59,46,0.25)', fg: 'var(--creator-green)' },
  partially_paid: { bg: 'rgba(245,158,11,0.2)', fg: 'var(--creator-orange)' },
  awaiting_payout: { bg: 'rgba(59,130,246,0.2)', fg: 'var(--creator-blue, #3b82f6)' },
  none: { bg: 'rgba(154,138,122,0.2)', fg: 'var(--creator-text-muted)' },
};

/**
 * The submission's review history as a vertical timeline, oldest first.
 * Each node shows the transition, when it happened, and who judged it.
 */
function HistoryTimeline({ events }: { events: SubmissionReviewEvent[] }) {
  if (events.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>No history recorded yet.</p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((e, i) => {
        const isLast = i === events.length - 1;
        return (
          <div key={e.id} style={{ display: 'flex', gap: 12 }}>
            {/* Rail: dot + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  marginTop: 5,
                  backgroundColor: statusColor[e.toStatus] ?? 'rgba(154,138,122,0.2)',
                  border: `2px solid ${statusText[e.toStatus] ?? 'var(--creator-text-muted)'}`,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <span
                  style={{ width: 2, flex: 1, minHeight: 26, backgroundColor: 'var(--creator-border)' }}
                />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{statusLabel(e.toStatus)}</span>
                {e.fromStatus && (
                  <span style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                    ← {statusLabel(e.fromStatus)}
                  </span>
                )}
                {e.reviewedByName && (
                  <span style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                    by {e.reviewedByName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--creator-text-muted)', marginTop: 2 }}>
                {new Date(e.reviewedAt ?? e.createdAt).toLocaleString()}
              </div>
              {e.note && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--creator-text)',
                    background: 'var(--creator-surface, rgba(154,138,122,0.08))',
                    border: '1px solid var(--creator-border)',
                    borderRadius: 6,
                    padding: '6px 10px',
                  }}
                >
                  {e.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Attached content preview: video player / audio player / document card. */
function ContentPreview({ detail }: { detail: SubmissionDetail }) {
  const c = detail.content;
  if (!c) {
    return (
      <p style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>
        Title-only entry — no upload attached.
      </p>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 11,
            backgroundColor: 'rgba(154,138,122,0.2)',
            color: 'var(--creator-text-muted)',
            textTransform: 'capitalize',
          }}
        >
          {c.type}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 11,
            backgroundColor: 'rgba(154,138,122,0.2)',
            color: 'var(--creator-text-muted)',
            textTransform: 'capitalize',
          }}
        >
          {c.status}
        </span>
      </div>
      {c.playbackUrl ? (
        c.type === 'video' ? (
          <video
            controls
            src={c.playbackUrl}
            style={{ width: '100%', maxHeight: 260, borderRadius: 8, backgroundColor: '#000' }}
          />
        ) : c.type === 'audio' ? (
          <audio controls src={c.playbackUrl} style={{ width: '100%' }} />
        ) : (
          <a
            href={c.playbackUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: 'var(--creator-orange)' }}
          >
            Open {c.type} ↗
          </a>
        )
      ) : (
        <p style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>
          {c.playbackError ?? 'Preview unavailable.'}
        </p>
      )}
      {c.playbackUrl && (
        <p style={{ fontSize: 11, color: 'var(--creator-text-muted)', marginTop: 6 }}>
          Signed preview link · expires in {c.expiresIn ?? 600}s
        </p>
      )}
    </div>
  );
}

/**
 * Submission detail modal: full review history timeline, attached-content
 * preview (signed playback through the media pipeline), and the challenge's
 * prize payout state. Opened from the submissions table's "Details" action.
 */
export default function SubmissionDetailModal({
  submissionId,
  onClose,
}: {
  submissionId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['creator', 'challenge-submission-detail', submissionId],
    queryFn: async () => {
      const res = await creatorApi.getChallengeSubmissionDetail(submissionId);
      return creatorApi.assertSuccess<SubmissionDetail>(res);
    },
    refetchInterval: pollingIntervals.standard, // review transitions land while the modal is open
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 640,
          maxWidth: '92%',
          maxHeight: '86vh',
          overflowY: 'auto',
          backgroundColor: 'var(--creator-bg)',
          border: '1px solid var(--creator-border)',
          borderRadius: 16,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
            Loading submission…
          </p>
        ) : isError || !data ? (
          <p style={errorTextStyle()}>{creatorApi.errorMessage(error)}</p>
        ) : (
          <>
            {/* Header: title + current status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{data.submission.title}</h3>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: statusColor[data.submission.status],
                  color: statusText[data.submission.status],
                  textTransform: 'capitalize',
                  letterSpacing: 0.5,
                  height: 'fit-content',
                }}
              >
                {statusLabel(data.submission.status)}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 20 }}>
              {data.challenge ? (
                <>
                  Challenge: <strong style={{ color: 'var(--creator-text)' }}>{data.challenge.title}</strong>
                  {data.challenge.prize ? (
                    <> · Prize {formatNgn(data.challenge.prize)}</>
                  ) : null}
                  {data.challenge.ended ? ' · ended' : ''}
                </>
              ) : (
                <>Challenge details unavailable right now.</>
              )}
            </p>

            {/* Review history */}
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--creator-text-muted)', margin: '0 0 12px' }}>
              Review history
            </h4>
            <div style={{ marginBottom: 24 }}>
              <HistoryTimeline events={data.history} />
            </div>

            {/* Content preview */}
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--creator-text-muted)', margin: '0 0 12px' }}>
              Entry content
            </h4>
            <div
              style={{
                border: '1px solid var(--creator-border)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <ContentPreview detail={data} />
            </div>

            {/* Prize payout state */}
            {data.prizePayout && (
              <>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--creator-text-muted)', margin: '0 0 12px' }}>
                  Prize payout
                </h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    border: '1px solid var(--creator-border)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: payoutChip[data.prizePayout.status]?.bg,
                      color: payoutChip[data.prizePayout.status]?.fg,
                    }}
                  >
                    {data.prizePayout.label}
                  </span>
                  {data.prizePayout.prize ? (
                    <span style={{ fontSize: 13 }}>
                      Prize: <strong style={{ color: 'var(--creator-orange)' }}>{formatNgn(data.prizePayout.prize)}</strong>
                    </span>
                  ) : null}
                  {data.prizePayout.totalPaid > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                      {formatNgn(data.prizePayout.totalPaid)} paid
                      {data.prizePayout.payoutIds.length > 1
                        ? ` across ${data.prizePayout.payoutIds.length} payouts`
                        : ''}
                    </span>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--creator-border)',
                  background: 'transparent',
                  color: 'var(--creator-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
