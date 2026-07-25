'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import Link from 'next/link';

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
  isActive: boolean;
  type: string;
  progress?: number;
  total?: number;
  isCompleted?: boolean;
  completedAt?: string;
}

export default function MissionsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const missionsQuery = useQuery({
    queryKey: ['rewards', 'missions'],
    queryFn: async () => {
      const res = await apiFetch<{ missions: Mission[] } | Mission[]>('/rewards/missions');
      if (res.success && res.data) {
        const missions = Array.isArray(res.data)
          ? res.data
          : (res.data as { missions: Mission[] }).missions || [];
        return missions.map((m: Mission) => ({
          id: String(m.id),
          title: String(m.title || ''),
          description: String(m.description || ''),
          points: Number(m.points || 0),
          image: m.image,
          isAvailable: Boolean(m.isActive),
          category: String(m.type || 'mission'),
          progress: Number(m.progress ?? 0),
          total: Number(m.total ?? 100),
          isCompleted: Boolean(m.isCompleted),
        }));
      }
      return [];
    },
    staleTime: 60000,
  });

  const missions = missionsQuery.data ?? [];
  const activeMissions = missions.filter((m) => !m.isCompleted);
  const completedMissions = missions.filter((m) => m.isCompleted);
  const isLoading = authLoading || missionsQuery.isLoading;
  const error = missionsQuery.error?.message || null;

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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Missions</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Complete missions to earn points</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="az-glass h-48">
                <Skeleton height="100%" borderRadius="0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load missions"
            description={error}
            buttonText="Retry"
            onButtonPress={() => missionsQuery.refetch()}
          />
        ) : (
          <>
            {/* Active missions */}
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                Active Missions ({activeMissions.length})
              </h2>
              {activeMissions.length === 0 ? (
                <div
                  className="az-glass"
                  style={{ padding: 48, borderRadius: 20, textAlign: 'center' }}
                >
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🎯</p>
                  <p style={{ color: '#9A8A7A' }}>No active missions right now</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className="az-glass overflow-hidden"
                      style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
                    >
                      {mission.image && (
                        <img
                          src={mission.image}
                          alt={mission.title}
                          className="w-full h-36 object-cover"
                        />
                      )}
                      <div style={{ padding: 20 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 999,
                            backgroundColor: 'rgba(232,66,10,0.15)',
                            color: '#E8420A',
                            textTransform: 'capitalize',
                          }}
                        >
                          {mission.category}
                        </span>
                        <h3
                          style={{ fontSize: 16, fontWeight: 700, marginTop: 8, marginBottom: 6 }}
                        >
                          {mission.title}
                        </h3>
                        <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 16 }}>
                          {mission.description}
                        </p>

                        {/* Progress bar */}
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: '#9A8A7A',
                              marginBottom: 6,
                            }}
                          >
                            <span>Progress</span>
                            <span>
                              {mission.progress}/{mission.total}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #E8420A, #CC1C1C)',
                                width: `${Math.min((mission.progress / mission.total) * 100, 100)}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#E8420A' }}>
                            {mission.points.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed missions */}
            {completedMissions.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Completed ({completedMissions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className="az-glass"
                      style={{ padding: 16, borderRadius: 16, opacity: 0.7 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 600 }}>{mission.title}</h3>
                          <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 2 }}>
                            {mission.description}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 999,
                              backgroundColor: 'rgba(34,197,94,0.15)',
                              color: '#22C55E',
                            }}
                          >
                            ✓ Done
                          </span>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#22C55E',
                              marginTop: 4,
                            }}
                          >
                            +{mission.points.toLocaleString()} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
