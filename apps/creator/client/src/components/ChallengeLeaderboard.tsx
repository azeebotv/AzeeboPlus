import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { creatorApi } from '@/lib/api/creator';
import { useAuth } from '@/context/AuthContext';
import { formatNgn, errorTextStyle } from '@/lib/ui';
import { pollingIntervals } from '@azeebo/design-tokens';

/** One ranked row on a challenge's leaderboard (winner-first, position is 1-based). */
export interface LeaderboardEntry {
  position: number;
  entryId: string;
  userId: string;
  displayName: string;
  status: string;
  submittedAt: string;
  /** True when this row belongs to the requesting viewer (public board). */
  isOwn?: boolean;
}

interface LeaderboardData {
  challenge: { id: string; title: string; prize?: number; endDate?: string };
  totalEntries: number;
  entries: LeaderboardEntry[];
}

/**
 * How often the board re-polls for new winners/review results. Deliberately
 * modest — the board is a spectator surface, not an operations dashboard.
 */
const LEADERBOARD_REFRESH_MS = pollingIntervals.standard;

/**
 * Challenge leaderboard, rendered two ways:
 *  - "page": the /challenges/:challengeId detail route — deep-linkable and
 *    shareable, so the URL always resolves to this specific board.
 *  - "panel": the inline tab on the challenges page (legacy in-page view).
 *
 * Live: polls every LEADERBOARD_REFRESH_MS (paused when the tab is hidden,
 * matching React Query's default behavior) and refetches when the window
 * regains focus, so freshly-reviewed winners appear without a reload. The
 * app's global query client disables refetchOnWindowFocus; the board opts
 * back in because a spectator glancing back at a shared URL is exactly the
 * case that needs it.
 */
export function ChallengeLeaderboard({
  challengeId,
  variant = 'panel',
}: {
  challengeId: string | null;
  variant?: 'panel' | 'page';
}) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { data, isLoading, isError, error, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['creator', 'challenge-leaderboard', challengeId],
    enabled: !!challengeId,
    refetchInterval: LEADERBOARD_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await creatorApi.getChallengeLeaderboard(challengeId!);
      return creatorApi.assertSuccess<LeaderboardData>(res);
    },
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — no-op; the URL
      // bar still shows the shareable path.
    }
  };

  if (!challengeId) {
    return (
      <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
        {variant === 'page' ? 'Challenge not found' : 'Pick a challenge and hit “View Board” to see its leaderboard'}
      </p>
    );
  }
  if (isLoading) {
    return <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>;
  }
  if (isError) {
    return <p style={errorTextStyle()}>{creatorApi.errorMessage(error)}</p>;
  }

  const board = data;
  const entries = board?.entries ?? [];
  return (
    <div>
      {variant === 'page' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/challenges"
            style={{ color: 'var(--creator-text-muted)', fontSize: 13, textDecoration: 'none' }}
          >
            ← All challenges
          </Link>
          <button
            onClick={copyLink}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--creator-border)',
              background: 'transparent',
              color: 'var(--creator-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Copy the URL of this leaderboard"
          >
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      )}
      {board && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{board.challenge.title}</h2>
          <span style={{ fontSize: 13, color: 'var(--creator-text-muted)' }}>
            {board.totalEntries} {board.totalEntries === 1 ? 'entry' : 'entries'}
            {board.challenge.prize ? (
              <>
                {' '}
                · Prize <strong style={{ color: 'var(--creator-orange)' }}>{formatNgn(board.challenge.prize)}</strong>
              </>
            ) : null}
          </span>
          <LiveBadge isFetching={isFetching} updatedAt={dataUpdatedAt} />
        </div>
      )}
      {entries.length === 0 ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No entries on this leaderboard yet
        </p>
      ) : (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--creator-border)' }}>
                {['#', 'Participant', 'Status', 'Submitted'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: 'var(--creator-text-muted)',
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const isOwn = e.isOwn === true || (!!user?.id && e.userId === user.id);
                return (
                  <tr
                    key={e.entryId}
                    style={{
                      borderBottom: '1px solid var(--creator-border-light)',
                      backgroundColor: isOwn ? 'rgba(232,66,10,0.10)' : 'transparent',
                      boxShadow: isOwn ? 'inset 3px 0 0 var(--creator-orange)' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 700,
                        color: e.position === 1 ? 'var(--creator-orange)' : 'var(--creator-text-muted)',
                      }}
                    >
                      #{e.position}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {e.displayName}
                      {isOwn && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            color: 'var(--creator-orange)',
                            border: '1px solid var(--creator-orange)',
                            verticalAlign: 'middle',
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: statusColor[e.status],
                          color: statusText[e.status],
                          textTransform: 'capitalize',
                          letterSpacing: 0.5,
                        }}
                      >
                        {e.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--creator-text-muted)', fontSize: 13 }}>
                      {new Date(e.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Pulsing dot + "Live" when a fetch is in flight, otherwise a muted
 * "Updated <time>" so spectators can trust what they're looking at.
 */
function LiveBadge({ isFetching, updatedAt }: { isFetching: boolean; updatedAt: number }) {
  const [tick, setTick] = useState(0);
  // Re-render once a minute so the "Updated Xm ago" label stays honest even
  // when no refetch happens (e.g. hidden tab that never refocuses).
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  void tick;

  if (isFetching) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--creator-green)',
          letterSpacing: 0.5,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: 'var(--creator-green)',
            animation: 'creatorLivePulse 1.4s ease-in-out infinite',
          }}
        />
        LIVE
      </span>
    );
  }
  if (!updatedAt) return null;
  const secs = Math.max(0, Math.round((Date.now() - updatedAt) / 1000));
  const label =
    secs < 60 ? `${secs}s ago` : secs < 3600 ? `${Math.round(secs / 60)}m ago` : `${Math.round(secs / 3600)}h ago`;
  return (
    <span style={{ fontSize: 11, color: 'var(--creator-text-muted)', letterSpacing: 0.5 }}>Updated {label}</span>
  );
}

export const statusColor: Record<string, string> = {
  active: 'rgba(13,59,46,0.2)',
  upcoming: 'rgba(59,130,246,0.2)',
  ended: 'rgba(154,138,122,0.2)',
  submitted: 'rgba(59,130,246,0.2)',
  under_review: 'rgba(245,158,11,0.2)',
  winner: 'rgba(13,59,46,0.2)',
  rejected: 'rgba(204,28,28,0.2)',
};
export const statusText: Record<string, string> = {
  active: 'var(--creator-green)',
  upcoming: 'var(--creator-blue, #3b82f6)',
  ended: 'var(--creator-text-muted)',
  submitted: 'var(--creator-blue, #3b82f6)',
  under_review: 'var(--creator-amber, #f59e0b)',
  winner: 'var(--creator-green)',
  rejected: 'var(--creator-red)',
};
