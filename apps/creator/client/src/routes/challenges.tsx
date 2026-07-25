import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { Challenge, ChallengeSubmission } from '@/lib/creator-types';

const statusColor: Record<string, string> = {
  active: 'rgba(13,59,46,0.2)',
  upcoming: 'rgba(59,130,246,0.2)',
  ended: 'rgba(154,138,122,0.2)',
  submitted: 'rgba(59,130,246,0.2)',
  under_review: 'rgba(245,158,11,0.2)',
  winner: 'rgba(13,59,46,0.2)',
  rejected: 'rgba(204,28,28,0.2)',
};
const statusText: Record<string, string> = {
  active: '#0D3B2E',
  upcoming: '#3B82F6',
  ended: '#9A8A7A',
  submitted: '#3B82F6',
  under_review: '#F59E0B',
  winner: '#0D3B2E',
  rejected: '#CC1C1C',
};

export default function ChallengesPage() {
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submitTitle, setSubmitTitle] = useState('');
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

  const submitMutation = useMutation({
    mutationFn: (challengeId: string) => creatorApi.submitChallenge(challengeId, submitTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'challenge-submissions'] });
      setSelectedChallenge(null);
      setSubmitTitle('');
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Challenges</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
        Participate in community challenges and win prizes
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['active', 'submissions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid #2A1A1A',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? '#fff' : '#9A8A7A',
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
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
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
                      border: '1px solid #2A1A1A',
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
                      style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 12, lineHeight: 1.5 }}
                    >
                      {challenge.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 12,
                        color: '#9A8A7A',
                        marginBottom: 12,
                      }}
                    >
                      <span>
                        Prize: <strong style={{ color: '#E8420A' }}>${challenge.prize}</strong>
                      </span>
                      <span>Submissions: {challenge.submissionsCount}</span>
                      <span>Ends: {new Date(challenge.deadline).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => setSelectedChallenge(challenge)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid #E8420A',
                        background: 'transparent',
                        color: '#E8420A',
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      Submit Entry
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
              No active challenges right now
            </p>
          )}
        </>
      )}

      {tab === 'submissions' && (
        <>
          {submissionsLoading ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : submissions && submissions.length > 0 ? (
            <div
              style={{
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                    {['Title', 'Status', 'Submitted'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#9A8A7A',
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
                    <tr key={s.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
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
                            textTransform: 'replace',
                            letterSpacing: 0.5,
                          }}
                        >
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No submissions yet</p>
          )}
        </>
      )}

      {selectedChallenge && (
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
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            style={{
              width: 480,
              maxWidth: '90%',
              backgroundColor: '#1A0A0A',
              border: '1px solid #2A1A1A',
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Submit to: {selectedChallenge.title}
            </h3>
            <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 16 }}>
              Prize: ${selectedChallenge.prize}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Entry Title
              </label>
              <input
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                placeholder="Name your submission"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => submitTitle && submitMutation.mutate(selectedChallenge.id)}
                disabled={!submitTitle || submitMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </button>
              <button
                onClick={() => setSelectedChallenge(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
            {submitMutation.isSuccess && (
              <p style={{ color: '#0D3B2E', fontSize: 13, marginTop: 8 }}>Submission successful!</p>
            )}
            {submitMutation.isError && (
              <p style={{ color: '#CC1C1C', fontSize: 13, marginTop: 8 }}>Submission failed</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
