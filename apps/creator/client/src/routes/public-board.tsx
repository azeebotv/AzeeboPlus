import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { formatNgn, errorTextStyle } from '@/lib/ui';
import { statusColor, statusText } from '@/components/ChallengeLeaderboard';
import { pollingIntervals } from '@azeebo/design-tokens';

/**
 * Public read-only challenge board at /boards/:challengeId.
 *
 * The shareable surface for leaderboards: works logged-out (the data endpoint
 * is public at the gateway), never shows user identifiers (display names only),
 * and links creators into the portal to participate. Visual language matches
 * the in-app leaderboard so the brand carries across the share boundary.
 *
 * This page's HTML is served with OG meta tags injected server-side by the
 * backend's /boards/:challengeId route (challenge title, prize, top entry), so
 * shared links unfurl a preview card in chat apps and social platforms.
 */

const PUBLIC_BOARD_REFRESH_MS = pollingIntervals.standard;

interface PublicBoard {
  challenge: { id: string; title: string; prize?: number | string; endDate?: string };
  totalEntries: number;
  entries: {
    position: number;
    displayName: string;
    status: string;
    submittedAt: string;
    /** Server-computed: this row belongs to the requesting viewer's session. */
    isOwn?: boolean;
  }[];
}

export default function PublicBoardPage() {
  const { challengeId } = useParams<{ challengeId: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-board', challengeId],
    enabled: !!challengeId,
    refetchInterval: PUBLIC_BOARD_REFRESH_MS,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const res = await creatorApi.getPublicBoard(challengeId!);
      return creatorApi.assertSuccess<PublicBoard>(res);
    },
  });

  const board = data;
  const entries = board?.entries ?? [];
  // Prisma Decimal serializes to string ("100") — parse defensively.
  const prizeValue = Number(board?.challenge.prize);
  const prize =
    board && Number.isFinite(prizeValue) && prizeValue > 0 ? prizeValue : null;

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: '100vh',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>azeebo+</span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            color: 'var(--creator-orange)',
            border: '1px solid var(--creator-border)',
          }}
        >
          CREATOR
        </span>
        <span style={{ flex: 1 }} />
        <Link
          to="/login"
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid var(--creator-border)',
            color: 'var(--creator-text)',
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Sign in to compete
        </Link>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 60 }}>
          Loading leaderboard...
        </p>
      ) : isError ? (
        <p style={errorTextStyle()}>
          {creatorApi.errorMessage(error)}
        </p>
      ) : !board ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 60 }}>
          Challenge not found
        </p>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
            {board.challenge.title}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'baseline',
              marginBottom: 24,
              flexWrap: 'wrap',
              fontSize: 14,
              color: 'var(--creator-text-muted)',
            }}
          >
            <span>
              {board.totalEntries} {board.totalEntries === 1 ? 'entry' : 'entries'}
            </span>
            {prize ? (
              <span>
                Prize{' '}
                <strong style={{ color: 'var(--creator-orange)' }}>{formatNgn(prize)}</strong>
              </span>
            ) : null}
            <span style={{ fontSize: 12 }}>Live — updates every 15s</span>
          </div>

          {entries.length === 0 ? (
            <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 48 }}>
              No entries yet — be the first to compete
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
                    const isOwn = e.isOwn === true;
                    return (
                      <tr
                        key={e.position}
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
                            color:
                              e.position === 1 ? 'var(--creator-orange)' : 'var(--creator-text-muted)',
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
                            backgroundColor: statusColor[e.status] ?? 'rgba(154,138,122,0.2)',
                            color: statusText[e.status] ?? 'var(--creator-text-muted)',
                            textTransform: 'capitalize',
                            letterSpacing: 0.5,
                          }}
                        >
                          {e.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--creator-text-muted)',
                          fontSize: 13,
                        }}
                      >
                        {new Date(e.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              marginTop: 28,
              fontSize: 13,
              color: 'var(--creator-text-muted)',
              textAlign: 'center',
            }}
          >
            Think you can beat them?{' '}
            <Link to="/login" style={{ color: 'var(--creator-orange)', fontWeight: 600 }}>
              Join the challenge
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
