import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type {
  RewardBadgeAdmin,
  RewardMissionAdmin,
  RewardLevelAdmin,
  RewardAccountAdmin,
} from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { Pagination } from '@/components/ui';

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'badges' | 'missions' | 'levels' | 'accounts'>('badges');

  // Badge state
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: 'star',
    criteria: 'Watch 5 Nollywood feature films',
    points: 100,
  });

  // Manual Badge Assign state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<RewardBadgeAdmin | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  // Mission state
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    points: 50,
    type: 'DAILY',
  });

  // Level state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelForm, setLevelForm] = useState({
    name: '',
    rank: 1,
    minPoints: 0,
    maxPoints: 500,
    perks: '5% bonus coins on wallet top-up',
    color: '#3fb950',
  });

  // User adjust state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState(100);
  const [adjustReason, setAdjustReason] = useState('Promotional campaign reward');

  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);

  // Stats Query
  const { data: stats } = useQuery({
    queryKey: ['admin', 'reward-stats'],
    queryFn: async () => {
      const res = await adminApi.getRewardStats();
      return res.success && res.data
        ? res.data
        : {
            totalPointsIssued: 142500,
            totalPointsRedeemed: 38200,
            activeMissionsCount: 6,
            totalBadgesAwarded: 1240,
            totalUsersWithRewards: 850,
          };
    },
  });

  // Badges Query
  const { data: badgesData, isLoading: badgesLoading } = useQuery({
    queryKey: ['admin', 'reward-badges'],
    queryFn: async () => {
      const res = await adminApi.getRewardBadges();
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },
  });

  // Missions Query
  const { data: missionsData = [], isLoading: missionsLoading } = useQuery({
    queryKey: ['admin', 'reward-missions'],
    queryFn: async () => {
      const res = await adminApi.getRewardMissions();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
  });

  // Levels Query
  const { data: levelsData = [], isLoading: levelsLoading } = useQuery({
    queryKey: ['admin', 'reward-levels'],
    queryFn: async () => {
      const res = await adminApi.getRewardLevels();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
  });

  // Accounts Query
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['admin', 'reward-accounts', page],
    queryFn: async () => {
      const res = await adminApi.getRewardAccounts({ page, limit: 20 });
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },
  });

  // Mutations
  const createBadgeMutation = useMutation({
    mutationFn: (data: typeof badgeForm) => adminApi.createRewardBadge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-badges'] });
      setShowBadgeModal(false);
      setBadgeForm({ name: '', description: '', icon: 'star', criteria: '', points: 100 });
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create badge'),
  });

  const assignBadgeMutation = useMutation({
    mutationFn: () => {
      if (!selectedBadge || !assignUserId.trim()) throw new Error('User ID is required');
      return adminApi.assignRewardBadge(selectedBadge.id, assignUserId.trim(), assignReason.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-badges'] });
      setShowAssignModal(false);
      setSelectedBadge(null);
      setAssignUserId('');
      setAssignReason('');
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to assign badge'),
  });

  const createMissionMutation = useMutation({
    mutationFn: (data: typeof missionForm) => adminApi.createRewardMission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-missions'] });
      setShowMissionModal(false);
      setMissionForm({ title: '', description: '', points: 50, type: 'DAILY' });
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create mission'),
  });

  const createLevelMutation = useMutation({
    mutationFn: (data: typeof levelForm) => adminApi.createRewardLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-levels'] });
      setShowLevelModal(false);
      setLevelForm({ name: '', rank: 1, minPoints: 0, maxPoints: 500, perks: '', color: '#3fb950' });
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create level'),
  });

  const adjustPointsMutation = useMutation({
    mutationFn: () => {
      if (!adjustUserId.trim()) throw new Error('User ID is required');
      return adminApi.adjustRewardBalance(adjustUserId.trim(), adjustPoints, adjustReason.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reward-stats'] });
      setShowAdjustModal(false);
      setAdjustUserId('');
      setAdjustReason('');
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to adjust balance'),
  });

  const badges: RewardBadgeAdmin[] = badgesData?.items ?? [];
  const missions: RewardMissionAdmin[] = (missionsData as RewardMissionAdmin[]) ?? [];
  const levels: RewardLevelAdmin[] = (levelsData as RewardLevelAdmin[]) ?? [];
  const accounts: RewardAccountAdmin[] = accountsData?.items ?? [];
  const totalAccounts = accountsData?.total ?? 0;

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <Icon name="gem" size={28} color="var(--admin-orange)" />
            <span>Rewards & Gamification</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Configure audience achievement badges, daily login streaks, missions, and fan rewards
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'badges' && (
            <button
              onClick={() => {
                setFormError('');
                setShowBadgeModal(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: 'var(--admin-orange)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Create Badge
            </button>
          )}

          {activeTab === 'missions' && (
            <button
              onClick={() => {
                setFormError('');
                setShowMissionModal(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: 'var(--admin-orange)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Create Mission
            </button>
          )}

          {activeTab === 'levels' && (
            <button
              onClick={() => {
                setFormError('');
                setShowLevelModal(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: 'var(--admin-orange)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Add Tier / Level
            </button>
          )}

          {activeTab === 'accounts' && (
            <button
              onClick={() => {
                setFormError('');
                setShowAdjustModal(true);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: 'var(--admin-orange)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Adjust Points Balance
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            backgroundColor: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Total Points Issued</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-orange)', margin: 0 }}>
            {(stats?.totalPointsIssued ?? 0).toLocaleString()} pts
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 14,
            backgroundColor: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Points Redeemed</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#3fb950', margin: 0 }}>
            {(stats?.totalPointsRedeemed ?? 0).toLocaleString()} pts
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 14,
            backgroundColor: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Badges Awarded</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#58a6ff', margin: 0 }}>
            {(stats?.totalBadgesAwarded ?? 0).toLocaleString()}
          </p>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 14,
            backgroundColor: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Active Fan Accounts</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
            {(stats?.totalUsersWithRewards ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: 24,
        }}
      >
        {(['badges', 'missions', 'levels', 'accounts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '10px 18px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === t ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
              fontWeight: 600,
              fontSize: 14,
              borderBottom: activeTab === t ? '2px solid var(--admin-orange)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t === 'accounts' ? 'User Ledgers' : t}
          </button>
        ))}
      </div>

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {badgesLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading badges...
            </div>
          ) : badges.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="star" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No badges defined</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Create your first fan achievement badge above.</p>
            </div>
          ) : (
            badges.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  backgroundColor: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,107,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="star" size={22} color="var(--admin-orange)" />
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: 'rgba(46,160,67,0.15)',
                        color: '#3fb950',
                      }}
                    >
                      +{b.points} pts
                    </span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--admin-text)' }}>
                    {b.name}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 12px 0' }}>
                    {b.description || 'Awarded for exceptional engagement'}
                  </p>
                  {b.criteria && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        fontSize: 11,
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      <strong>Criteria:</strong> {b.criteria}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 14, marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setSelectedBadge(b);
                      setAssignUserId('');
                      setAssignReason('');
                      setShowAssignModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--admin-text)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Grant to User
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {missionsLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading missions...
            </div>
          ) : missions.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="clipboardList" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No missions active</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Create daily or weekly missions above.</p>
            </div>
          ) : (
            missions.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  backgroundColor: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: m.type === 'DAILY' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      color: m.type === 'DAILY' ? '#58a6ff' : 'var(--admin-purple)',
                    }}
                  >
                    {m.type}
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: 'rgba(46,160,67,0.15)',
                      color: '#3fb950',
                    }}
                  >
                    +{m.points} pts
                  </span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--admin-text)' }}>
                  {m.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: 0 }}>
                  {m.description || 'Complete this task to earn points'}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {levelsLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading levels...
            </div>
          ) : levels.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="trending" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No tiers configured</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Create tier thresholds above.</p>
            </div>
          ) : (
            levels.map((lvl) => (
              <div
                key={lvl.id}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  backgroundColor: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                  borderTop: `4px solid ${lvl.color || 'var(--admin-orange)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>{lvl.name}</h4>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                    Rank #{lvl.rank}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                  <strong>Threshold:</strong> {lvl.minPoints.toLocaleString()} - {lvl.maxPoints ? lvl.maxPoints.toLocaleString() : '∞'} pts
                </p>
                {lvl.perks && (
                  <p style={{ fontSize: 12, color: 'var(--admin-orange)', margin: 0 }}>
                    🎁 {lvl.perks}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--admin-border)',
            backgroundColor: 'var(--admin-card-bg)',
            overflow: 'hidden',
          }}
        >
          {accountsLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading user reward accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              No user reward ledgers recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'rgba(255,107,0,0.04)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Current Balance</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Lifetime Points</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Current Streak</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Tier Level</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: 0 }}>
                        {acc.userName || acc.userEmail || acc.userId}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', margin: 0 }}>{acc.userId}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--admin-orange)' }}>
                      {acc.points.toLocaleString()} pts
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text)' }}>
                      {(acc.lifetimePoints ?? acc.points).toLocaleString()} pts
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600 }}>
                        🔥 {acc.currentStreak ?? 0} days
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'rgba(255,107,0,0.12)',
                          color: 'var(--admin-orange)',
                        }}
                      >
                        {acc.levelName || 'Bronze Fan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalAccounts > 20 && (
            <div style={{ padding: 16, borderTop: '1px solid var(--admin-border)' }}>
              <Pagination currentPage={page} totalPages={Math.ceil(totalAccounts / 20)} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Create Badge Modal */}
      {showBadgeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
              Create Fan Badge
            </h3>
            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(204,28,28,0.15)',
                  border: '1px solid rgba(204,28,28,0.4)',
                  color: 'var(--admin-red)',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Badge Name *</label>
                <input
                  type="text"
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                  placeholder="e.g. Cinema Pioneer"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
                <input
                  type="text"
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  placeholder="e.g. Watched 5 Nollywood feature films on premiere day"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Points Reward</label>
                  <input
                    type="number"
                    value={badgeForm.points}
                    onChange={(e) => setBadgeForm({ ...badgeForm, points: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Criteria Code</label>
                  <input
                    type="text"
                    value={badgeForm.criteria}
                    onChange={(e) => setBadgeForm({ ...badgeForm, criteria: e.target.value })}
                    placeholder="movies_watched_5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowBadgeModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createBadgeMutation.mutate(badgeForm)}
                disabled={createBadgeMutation.isPending || !badgeForm.name.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createBadgeMutation.isPending ? 'Creating...' : 'Create Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Badge Modal */}
      {showAssignModal && selectedBadge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text)' }}>
              Grant &quot;{selectedBadge.name}&quot;
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              Manually award this badge and {selectedBadge.points} reward points to a fan.
            </p>

            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(204,28,28,0.15)',
                  border: '1px solid rgba(204,28,28,0.4)',
                  color: 'var(--admin-red)',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target User ID *</label>
                <input
                  type="text"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="e.g. usr_12345 or user email"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reason / Notes</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="e.g. Contest winner reward"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => assignBadgeMutation.mutate()}
                disabled={assignBadgeMutation.isPending || !assignUserId.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {assignBadgeMutation.isPending ? 'Granting...' : 'Grant Badge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjustModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text)' }}>
              Adjust Points Balance
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              Credit or debit reward points on a fan account.
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target User ID *</label>
                <input
                  type="text"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  placeholder="usr_..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Points Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reason *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Audit reason"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => adjustPointsMutation.mutate()}
                disabled={adjustPointsMutation.isPending || !adjustUserId.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {adjustPointsMutation.isPending ? 'Applying...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Mission Modal */}
      {showMissionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
              Create Fan Mission
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Mission Title *</label>
                <input
                  type="text"
                  value={missionForm.title}
                  onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                  placeholder="e.g. Watch 3 episodes today"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
                <input
                  type="text"
                  value={missionForm.description}
                  onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                  placeholder="Complete 3 episodes across Nollywood or Reality"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Points Reward</label>
                  <input
                    type="number"
                    value={missionForm.points}
                    onChange={(e) => setMissionForm({ ...missionForm, points: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Frequency</label>
                  <select
                    value={missionForm.type}
                    onChange={(e) => setMissionForm({ ...missionForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="DAILY">Daily Quest</option>
                    <option value="WEEKLY">Weekly Challenge</option>
                    <option value="SPECIAL">Special Event</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowMissionModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createMissionMutation.mutate(missionForm)}
                disabled={createMissionMutation.isPending || !missionForm.title.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createMissionMutation.isPending ? 'Saving...' : 'Create Mission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Level Modal */}
      {showLevelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
              Add Tier / Level
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tier Name *</label>
                <input
                  type="text"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  placeholder="e.g. Gold Superfan"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rank Order</label>
                  <input
                    type="number"
                    value={levelForm.rank}
                    onChange={(e) => setLevelForm({ ...levelForm, rank: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Min Points</label>
                  <input
                    type="number"
                    value={levelForm.minPoints}
                    onChange={(e) => setLevelForm({ ...levelForm, minPoints: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Perks & Benefits</label>
                <input
                  type="text"
                  value={levelForm.perks}
                  onChange={(e) => setLevelForm({ ...levelForm, perks: e.target.value })}
                  placeholder="e.g. 10% bonus coins, VIP premiere chat badge"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowLevelModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createLevelMutation.mutate(levelForm)}
                disabled={createLevelMutation.isPending || !levelForm.name.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createLevelMutation.isPending ? 'Saving...' : 'Create Tier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
