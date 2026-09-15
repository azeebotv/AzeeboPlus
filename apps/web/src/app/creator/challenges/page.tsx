'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Challenge, ChallengeSubmission } from '@/lib/api/creator';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, Award, ArrowRight, X, Send } from 'lucide-react';

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
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader active="Creator" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>
          Challenges
        </h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 24 }}>
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
                border:
                  view === v ? '1px solid rgba(232,66,10,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: view === v ? 'var(--brand-orange, #E8420A)' : '#18151e',
                color: view === v ? '#FFFFFF' : 'var(--text-muted, #9A8A7A)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: view === v ? 600 : 400,
                transition: 'all 0.2s ease',
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
                  border:
                    filter === f
                      ? '1px solid rgba(232,66,10,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: filter === f ? 'rgba(232,66,10,0.15)' : '#18151e',
                  color:
                    filter === f ? 'var(--brand-orange, #E8420A)' : 'var(--text-muted, #9A8A7A)',
                  cursor: 'pointer',
                  fontSize: 12,
                  textTransform: 'capitalize',
                  fontWeight: filter === f ? 600 : 400,
                  transition: 'all 0.2s ease',
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
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
            <EmptyState
              icon="Trophy"
              title="No challenges found"
              description="No challenges match your current filter"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((challenge) => (
                <div
                  key={challenge.id}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-tertiary)',
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
                      <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#FFFFFF' }}>
                        {challenge.title}
                      </h3>
                      <p
                        style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginTop: 4 }}
                      >
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
                            ? 'rgba(16,185,129,0.15)'
                            : challenge.status === 'upcoming'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(255,255,255,0.06)',
                        color:
                          challenge.status === 'active'
                            ? '#10B981'
                            : challenge.status === 'upcoming'
                              ? '#F59E0B'
                              : 'var(--text-muted, #9A8A7A)',
                        border: `1px solid ${
                          challenge.status === 'active'
                            ? 'rgba(16,185,129,0.3)'
                            : challenge.status === 'upcoming'
                              ? 'rgba(245,158,11,0.3)'
                              : 'rgba(255,255,255,0.1)'
                        }`,
                      }}
                    >
                      {challenge.status}
                    </span>
                  </div>
                  {challenge.rules && challenge.rules.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p
                        style={{
                          color: 'var(--text-muted, #9A8A7A)',
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Rules:
                      </p>
                      {(challenge.rules ?? []).slice(0, 2).map((rule: string, i: number) => (
                        <p
                          key={i}
                          style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}
                        >
                          • {rule}
                        </p>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 20,
                      color: 'var(--text-muted, #9A8A7A)',
                      fontSize: 13,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color="#9A8A7A" />
                      {challenge.participantCount.toLocaleString()} participants
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={14} color="#E8420A" />
                      Reward: {challenge.rewardPoints} pts
                    </span>
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
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: 'var(--brand-orange, #E8420A)',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Submit Entry
                        <ArrowRight size={14} />
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
                style={{
                  padding: 20,
                  borderRadius: 16,
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Skeleton height="20px" width="180px" />
                <div style={{ marginTop: 8 }}>
                  <Skeleton height="14px" width="250px" />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon="trophy"
            title="No submissions yet"
            description="Participate in challenges to see your submissions here"
            dark
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'var(--bg-tertiary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#FFFFFF' }}>
                    {sub.challengeTitle}
                  </h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor:
                        sub.status === 'approved'
                          ? 'rgba(16,185,129,0.15)'
                          : sub.status === 'rejected'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(245,158,11,0.15)',
                      color:
                        sub.status === 'approved'
                          ? '#10B981'
                          : sub.status === 'rejected'
                            ? '#EF4444'
                            : '#F59E0B',
                      border: `1px solid ${
                        sub.status === 'approved'
                          ? 'rgba(16,185,129,0.3)'
                          : sub.status === 'rejected'
                            ? 'rgba(239,68,68,0.3)'
                            : 'rgba(245,158,11,0.3)'
                      }`,
                    }}
                  >
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>
                {sub.reviewerNote && (
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, marginTop: 4 }}>
                    Note: {sub.reviewerNote}
                  </p>
                )}
                <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, marginTop: 4 }}>
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
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: 24,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 20,
                  padding: 28,
                  maxWidth: 480,
                  width: '100%',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                    Submit to Challenge
                  </h2>
                  <button
                    onClick={() => {
                      setShowSubmit(false);
                      setSubmittingId(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9A8A7A',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <p
                  style={{
                    color: 'var(--brand-orange, #E8420A)',
                    fontSize: 14,
                    marginBottom: 20,
                    fontWeight: 500,
                  }}
                >
                  {challenge.title}
                </p>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-muted, #9A8A7A)',
                    marginBottom: 6,
                  }}
                >
                  Content URL
                </label>
                <input
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  placeholder="https://example.com/your-content"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    marginBottom: 16,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--text-muted, #9A8A7A)',
                    marginBottom: 6,
                  }}
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
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    marginBottom: 20,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outline: 'none',
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
                      padding: '12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted, #9A8A7A)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(challenge)}
                    disabled={!submitUrl.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: 'var(--brand-orange, #E8420A)',
                      color: '#FFFFFF',
                      cursor: !submitUrl.trim() ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: !submitUrl.trim() ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Send size={15} />
                    Submit
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      <AppFooter logoVariant="light" />
    </div>
  );
}
