'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';
import { useState } from 'react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked?: boolean;
  progress?: number;
  target?: number;
  earnedAt?: string;
}

export default function BadgesPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const badgesQuery = useQuery({
    queryKey: ['rewards', 'badges'],
    queryFn: async () => {
      const res = await apiFetch<{ badges: Badge[] } | Badge[]>('/rewards/badges');
      if (res.success && res.data) {
        const badges = Array.isArray(res.data)
          ? res.data
          : (res.data as { badges: Badge[] }).badges || [];
        return badges.map((b: Badge) => ({
          id: String(b.id),
          name: String(b.name || ''),
          description: String(b.description || ''),
          icon: String(b.icon || '🏅'),
          points: Number(b.points || 0),
          unlocked: Boolean(b.unlocked ?? true),
          progress: Number(b.progress ?? 0),
          target: Number(b.target ?? b.points ?? 1),
          earnedAt: b.earnedAt,
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const badges = badgesQuery.data ?? [];
  const earnedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const isLoading = authLoading || badgesQuery.isLoading;
  const error = badgesQuery.error?.message || null;

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/rewards" style={{ color: '#9A8A7A', fontSize: 14, textDecoration: 'none' }}>
            &larr; Back to Rewards
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Badges</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            {earnedBadges.length} of {badges.length} earned
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="az-glass h-44">
                <Skeleton height="100%" borderRadius="0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load badges"
            description={error}
            buttonText="Retry"
            onButtonPress={() => badgesQuery.refetch()}
          />
        ) : (
          <>
            {/* Earned badges */}
            {earnedBadges.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Earned ({earnedBadges.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="az-glass"
                      style={{
                        padding: 20,
                        borderRadius: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      onClick={() => setSelectedBadge(badge)}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, rgba(232,66,10,0.2), rgba(204,28,28,0.15))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          fontSize: 32,
                        }}
                      >
                        {badge.icon}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{badge.name}</p>
                      <p style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>✓ Earned</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Locked badges */}
            {lockedBadges.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Locked ({lockedBadges.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {lockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="az-glass"
                      style={{
                        padding: 20,
                        borderRadius: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        opacity: 0.5,
                        transition: 'transform 0.2s',
                      }}
                      onClick={() => setSelectedBadge(badge)}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          fontSize: 32,
                          filter: 'grayscale(100%)',
                        }}
                      >
                        {badge.icon}
                      </div>
                      <p
                        style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#6B5B4B' }}
                      >
                        {badge.name}
                      </p>
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 2,
                              backgroundColor: '#E8420A',
                              width: `${Math.min(((badge.progress ?? 0) / (badge.target ?? 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p style={{ fontSize: 11, color: '#6B5B4B', marginTop: 4 }}>
                          {badge.progress ?? 0}/{badge.target ?? 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {badges.length === 0 && (
              <div
                className="az-glass"
                style={{ padding: 48, borderRadius: 20, textAlign: 'center' }}
              >
                <p style={{ fontSize: 32, marginBottom: 12 }}>🏅</p>
                <p style={{ color: '#9A8A7A' }}>No badges available yet</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="az-glass"
            style={{
              maxWidth: 400,
              width: '100%',
              padding: 32,
              borderRadius: 24,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: selectedBadge.unlocked
                  ? 'linear-gradient(135deg, rgba(232,66,10,0.25), rgba(204,28,28,0.15))'
                  : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 40,
                filter: selectedBadge.unlocked ? 'none' : 'grayscale(100%)',
              }}
            >
              {selectedBadge.icon}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{selectedBadge.name}</h2>
            <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 16 }}>
              {selectedBadge.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: '#9A8A7A' }}>Points</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#E8420A' }}>
                  {selectedBadge.points}
                </p>
              </div>
              {selectedBadge.unlocked && selectedBadge.earnedAt && (
                <div>
                  <p style={{ fontSize: 12, color: '#9A8A7A' }}>Earned</p>
                  <p style={{ fontSize: 14, color: '#22C55E' }}>
                    {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                padding: '10px 32px',
                borderRadius: 999,
                border: '1px solid #2A1A1A',
                background: 'transparent',
                color: '#9A8A7A',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
