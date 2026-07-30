'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Challenge, ChallengeSubmission } from '@/lib/api/creator';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

type FilterTab = 'all' | 'active' | 'upcoming' | 'completed';
type ViewTab = 'challenges' | 'submissions';

export default function CreatorChallengesPage(): React.JSX.Element {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [view, setView] = useState<ViewTab>('challenges');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');

  const challengesQuery = useQuery({
    queryKey: ['creator-challenges', filter],
    queryFn: async () => {
      const res = await api.creator.getChallenges(1, 50);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load challenges');
      return res.data.items;
    },
    staleTime: 30000,
  });

  const submissionsQuery = useQuery({
    queryKey: ['creator-challenge-submissions'],
    queryFn: async () => {
      const res = await api.creator.getMyChallengeSubmissions(1, 50);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load submissions');
      return res.data.items;
    },
    staleTime: 30000,
    enabled: view === 'submissions',
  });

  const challenges: Challenge[] = challengesQuery.data ?? [];
  const submissions: ChallengeSubmission[] = submissionsQuery.data ?? [];
  const isLoading = challengesQuery.isLoading;
  const isSubmissionsLoading = submissionsQuery.isLoading;
  const error = challengesQuery.error?.message || null;

  const filtered = filter === 'all' ? challenges : challenges.filter((c) => c.status === filter);

  const handleSubmit = async (challenge: Challenge) => {
    if (!submitUrl.trim()) return;
    setSubmittingId(challenge.id);
    try {
      const res = await api.creator.submitChallengeEntry({
        challengeId: challenge.id,
        contentUrl: submitUrl.trim(),
        description: submitDesc.trim(),
      });
      if (res.success) {
        setShowSubmit(false);
        setSubmitUrl('');
        setSubmitDesc('');
        submissionsQuery.refetch();
      } else {
        throw new Error(res.message || 'Submission failed');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <AppHeader active="Creator" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Challenges</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Participate in platform challenges and earn rewards
        </p>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['challenges', 'submissions'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: view === v ? 'var(--brand-orange)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: view === v ? 600 : 400,
              }}
            >
              {v === 'challenges' ? 'Active Challenges' : 'My Submissions'}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        {view === 'challenges' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['all', 'active', 'upcoming', 'completed'] as FilterTab[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border-default)',
                  background: filter === f ? 'rgba(232,66,10,0.2)' : 'transparent',
                  color: filter === f ? 'var(--brand-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {view === 'challenges' ? (
          isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Skeleton height="20px" width="200px" />
                  <div style={{ marginTop: 8 }}>
                    <Skeleton height="14px" width="300px" />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Skeleton height="14px" width="250px" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load challenges"
              description={error}
              onButtonPress={() => challengesQuery.refetch()}
            />
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              No challenges found
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((challenge) => (
                <div
                  key={challenge.id}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border-default)',
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
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                        {challenge.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        {challenge.description}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        marginLeft: 12,
                        backgroundColor:
                          challenge.status === 'active'
                            ? 'rgba(74,222,128,0.15)'
                            : challenge.status === 'upcoming'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(154,138,122,0.15)',
                        color:
                          challenge.status === 'active'
                            ? 'var(--color-success-400)'
                            : challenge.status === 'upcoming'
                              ? 'var(--color-warning-500)'
                              : 'var(--text-secondary)',
                      }}
                    >
                      {challenge.status}
                    </span>
                  </div>
                  {challenge.rules && challenge.rules.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p
                        style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}
                      >
                        Rules:
                      </p>
                      {(challenge.rules ?? []).slice(0, 2).map((rule: string, i: number) => (
                        <p key={i} style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                          • {rule}
                        </p>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 24,
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      alignItems: 'center',
                    }}
                  >
                    <span>{challenge.participantCount.toLocaleString()} participants</span>
                    <span>Reward: {challenge.rewardPoints} pts</span>
                    {challenge.maxParticipants && (
                      <span>
                        Spots: {challenge.participantCount}/{challenge.maxParticipants}
                      </span>
                    )}
                    {challenge.status === 'active' && (
                      <button
                        onClick={() => {
                          setShowSubmit(true);
                          setSubmittingId(challenge.id);
                        }}
                        style={{
                          marginLeft: 'auto',
                          padding: '6px 16px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: 'var(--brand-orange)',
                          color: 'var(--brand-white)',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Submit Entry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : isSubmissionsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{ padding: 20, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <Skeleton height="20px" width="180px" />
                <div style={{ marginTop: 8 }}>
                  <Skeleton height="14px" width="250px" />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No submissions yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{sub.challengeTitle}</h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor:
                        sub.status === 'approved'
                          ? 'rgba(74,222,128,0.15)'
                          : sub.status === 'rejected'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(245,158,11,0.15)',
                      color:
                        sub.status === 'approved'
                          ? 'var(--color-success-400)'
                          : sub.status === 'rejected'
                            ? 'var(--color-error-500)'
                            : 'var(--color-warning-500)',
                    }}
                  >
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>
                {sub.reviewerNote && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                    Note: {sub.reviewerNote}
                  </p>
                )}
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                  Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Submit Modal */}
      {showSubmit &&
        submittingId &&
        (() => {
          const challenge = challenges.find((c) => c.id === submittingId);
          if (!challenge) return null;
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: 24,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--brand-near-black)',
                  borderRadius: 16,
                  padding: 24,
                  maxWidth: 480,
                  width: '100%',
                  border: '1px solid var(--border-default)',
                }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  Submit to Challenge
                </h2>
                <p style={{ color: 'var(--brand-orange)', fontSize: 14, marginBottom: 20 }}>
                  {challenge.title}
                </p>
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  Content URL
                </label>
                <input
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder="https://example.com/your-content"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    marginBottom: 16,
                    boxSizing: 'border-box',
                  }}
                />
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  Description (optional)
                </label>
                <textarea
                  value={submitDesc}
                  onChange={(e) => setSubmitDesc(e.target.value)}
                  placeholder="Tell us about your entry..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    marginBottom: 20,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => {
                      setShowSubmit(false);
                      setSubmittingId(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(challenge)}
                    disabled={!submitUrl.trim()}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'var(--brand-orange)',
                      color: 'var(--brand-white)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: !submitUrl.trim() ? 0.5 : 1,
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <AppFooter />
    </div>
  );
}
