import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { statusColor, statusText } from '@/components/ChallengeLeaderboard';
import SubmissionDetailModal from '@/components/SubmissionDetailModal';
import ChallengeSubmitDialog from '@/components/ChallengeSubmitDialog';
import type { Challenge, ChallengeSubmission } from '@/lib/creator-types';
import { formatNgn } from '@/lib/ui';

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailSubmissionId, setDetailSubmissionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'submissions'>('active');

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ['creator', 'challenges'],
    queryFn: async () => {
      const res = await creatorApi.getChallenges();
      return res.success ? (res.data as Challenge[]) : [];
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['creator', 'challenge-submissions'],
    queryFn: async () => {
      const res = await creatorApi.getChallengeSubmissions();
      return res.success ? (res.data as ChallengeSubmission[]) : [];
    },
  });

  // Winner banner: celebrate any winning entry with a prize callout. Prize
  // comes from the challenges list; if the challenge has scrolled out of the
  // proxy window the line still renders, just without an amount.
  const winners = (submissions ?? []).filter((s) => s.status === 'winner');
  const totalPrize = winners.reduce((sum, s) => {
    const prize = challenges?.find((c) => c.id === s.challengeId)?.prize;
    return sum + (typeof prize === 'number' ? prize : 0);
  }, 0);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Challenges</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Participate in community challenges and win prizes
      </p>

      {winners.length > 0 && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            padding: '16px 20px',
            marginBottom: 24,
            borderRadius: 12,
            border: '1px solid rgba(232,178,10,0.45)',
            background:
              'linear-gradient(135deg, rgba(232,66,10,0.14) 0%, rgba(204,28,28,0.10) 55%, rgba(232,178,10,0.10) 100%)',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }} aria-hidden>🏆</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Congratulations — you won{winners.length > 1 ? ` ${winners.length} challenges` : ''}!
            </div>
            <div style={{ fontSize: 13, color: 'var(--creator-text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {winners.map((w) => {
                const prize = challenges?.find((c) => c.id === w.challengeId)?.prize;
                return (
                  <span key={w.id}>
                    {w.title}
                    {typeof prize === 'number' && (
                      <strong style={{ color: 'var(--creator-orange)', marginLeft: 6 }}>
                        Prize: {formatNgn(prize)}
                      </strong>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
          {totalPrize > 0 && (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(232,66,10,0.15)',
                border: '1px solid rgba(232,66,10,0.35)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--creator-text-muted)' }}>
                Total prizes
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--creator-orange)' }}>
                {formatNgn(totalPrize)}
              </div>
            </div>
          )}
          <button
            onClick={() => setTab('submissions')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--creator-border)',
              background: 'transparent',
              color: 'var(--creator-orange)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View submissions
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['active', 'submissions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid var(--creator-border)',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? 'white' : 'var(--creator-text-muted)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <>
          {challengesLoading ? (
            <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : challenges && challenges.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {challenges
                .filter((c) => c.status === 'active')
                .map((challenge) => (
                  <div
                    key={challenge.id}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      border: '1px solid var(--creator-border)',
                      backgroundColor: 'rgba(26,10,10,0.5)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{challenge.title}</h3>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: statusColor[challenge.status],
                          color: statusText[challenge.status],
                          textTransform: 'capitalize',
                        }}
                      >
                        {challenge.status}
                      </span>
                    </div>
                    <p
                      style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 12, lineHeight: 1.5 }}
                    >
                      {challenge.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 12,
                        color: 'var(--creator-text-muted)',
                        marginBottom: 12,
                      }}
                    >
                      <span>
                        Prize: <strong style={{ color: 'var(--creator-orange)' }}>{formatNgn(challenge.prize)}</strong>
                      </span>
                      <span>Submissions: {challenge.submissionsCount}</span>
                      <span>Ends: {new Date(challenge.deadline).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setSelectedChallenge(challenge)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--creator-orange)',
                          background: 'transparent',
                          color: 'var(--creator-orange)',
                          fontWeight: 500,
                          fontSize: 13,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        Submit Entry
                      </button>
                      <button
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--creator-border)',
                          background: 'transparent',
                          color: 'var(--creator-text-muted)',
                          fontWeight: 500,
                          fontSize: 13,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        View Board
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
              No active challenges right now
            </p>
          )}
        </>
      )}

      {tab === 'submissions' && (
        <>
          {submissionsLoading ? (
            <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : submissions && submissions.length > 0 ? (
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
                    {['Title', 'Status', 'Submitted', 'Reviewed', ''].map((h) => (
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
                  {submissions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--creator-border-light)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{s.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                          backgroundColor: statusColor[s.status],
                          color: statusText[s.status],
                          textTransform: 'capitalize',
                          letterSpacing: 0.5,
                          }}
                        >
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--creator-text-muted)', fontSize: 13 }}>
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {s.reviewedAt ? (
                          <span style={{ color: 'var(--creator-text)' }}>
                            {new Date(s.reviewedAt).toLocaleDateString()}
                            {s.reviewedByName && (
                              <span style={{ color: 'var(--creator-text-muted)' }}> by {s.reviewedByName}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--creator-text-muted)' }}>—</span>
                        )}
                        {s.reviewNote && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              lineHeight: 1.5,
                              color: s.status === 'rejected' ? 'var(--creator-text)' : 'var(--creator-text-muted)',
                              background: 'var(--creator-surface, rgba(154,138,122,0.08))',
                              border: '1px solid var(--creator-border)',
                              borderRadius: 6,
                              padding: '6px 10px',
                              maxWidth: 360,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--creator-orange)' }}>
                              {s.status === 'rejected' ? 'Reason: ' : 'Note: '}
                            </span>
                            {s.reviewNote}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setDetailSubmissionId(s.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--creator-border)',
                            background: 'transparent',
                            color: 'var(--creator-orange)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>No submissions yet</p>
          )}
        </>
      )}

      {detailSubmissionId && (
        <SubmissionDetailModal
          submissionId={detailSubmissionId}
          onClose={() => setDetailSubmissionId(null)}
        />
      )}

      {selectedChallenge && (
        <ChallengeSubmitDialog challenge={selectedChallenge} onClose={() => setSelectedChallenge(null)} />
      )}
    </div>
  );
}
