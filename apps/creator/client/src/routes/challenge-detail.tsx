import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { ChallengeLeaderboard, statusColor, statusText } from '@/components/ChallengeLeaderboard';
import ChallengeSubmitDialog from '@/components/ChallengeSubmitDialog';
import BoardQrModal from '@/components/BoardQrModal';
import { formatNgn } from '@/lib/ui';
import type { Challenge } from '@/lib/creator-types';

/**
 * Shareable challenge detail: /challenges/:challengeId renders this specific
 * challenge's leaderboard at a stable URL, so boards can be bookmarked and
 * passed around (the header block enriches from the challenges list cache).
 * The header carries the Submit Entry action so creators can enter straight
 * from a shared/board URL without detouring through the challenges grid.
 */
export default function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const [showSubmit, setShowSubmit] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const { data: challenges } = useQuery({
    queryKey: ['creator', 'challenges'],
    queryFn: async () => {
      const res = await creatorApi.getChallenges();
      return res.success ? (res.data as Challenge[]) : [];
    },
  });
  const challenge = (challenges ?? []).find((c) => c.id === challengeId);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Challenge</h1>
      {challenge && (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>{challenge.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                {challenge.description}
              </p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--creator-text-muted)', flexWrap: 'wrap' }}>
                <span>
                  Prize: <strong style={{ color: 'var(--creator-orange)' }}>{formatNgn(challenge.prize)}</strong>
                </span>
                <span>Submissions: {challenge.submissionsCount}</span>
                <span>Ends: {new Date(challenge.deadline).toLocaleDateString()}</span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: statusColor[challenge.status],
                  color: statusText[challenge.status],
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {challenge.status}
              </span>
              {challenge.status === 'active' && (
                <button
                  onClick={() => setShowSubmit(true)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Submit Entry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ChallengeLeaderboard challengeId={challengeId ?? null} variant="page" />
      {challenge && (
        <a
          href={`/boards/${challenge.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 16,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--creator-border)',
            color: 'var(--creator-text)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
          title="Public, shareable leaderboard link — works for logged-out viewers"
        >
          🔗 Share public board
        </a>
      )}
      {challenge && (
        <button
          onClick={() => setShowQr(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--creator-border)',
            background: 'transparent',
            color: 'var(--creator-text)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Generate a QR code for the public board — great for events and flyers"
        >
          ▦ Board QR code
        </button>
      )}
      {challenge && showQr && challengeId && (
        <BoardQrModal
          challengeId={challengeId}
          challengeTitle={challenge.title}
          onClose={() => setShowQr(false)}
        />
      )}
      {challenge && showSubmit && (
        <ChallengeSubmitDialog challenge={challenge} onClose={() => setShowSubmit(false)} />
      )}
    </div>
  );
}
