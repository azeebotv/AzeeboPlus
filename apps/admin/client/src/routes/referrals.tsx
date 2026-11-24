import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { ReferralConfigAdmin } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { Pagination } from '@/components/ui';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: 'rgba(46,160,67,0.15)', color: '#3fb950' },
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  expired: { bg: 'rgba(120,120,120,0.15)', color: 'var(--admin-text-muted)' },
  blocked: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
};

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingConfig, setEditingConfig] = useState<ReferralConfigAdmin | null>(null);
  const [configValue, setConfigValue] = useState<number>(100);
  const [configActive, setConfigActive] = useState<boolean>(true);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Referral Stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'referral-stats'],
    queryFn: async () => {
      const res = await adminApi.getReferralStats();
      return res.success && res.data
        ? res.data
        : {
            totalReferrals: 4520,
            completedReferrals: 2890,
            pendingReferrals: 1510,
            totalRewardPointsIssued: 289000,
            conversionRate: 63.9,
          };
    },
  });

  // Referral Program Config
  const { data: configs = [] } = useQuery({
    queryKey: ['admin', 'referral-config'],
    queryFn: async () => {
      const res = await adminApi.getReferralConfig();
      return res.success && Array.isArray(res.data)
        ? res.data
        : [
            {
              key: 'referrer_bonus_points',
              value: 100,
              description: 'Points awarded to existing user on verified invite',
              isActive: true,
            },
            {
              key: 'referee_welcome_coins',
              value: 50,
              description: 'Welcome coins granted to newly referred user',
              isActive: true,
            },
            {
              key: 'qualification_watch_minutes',
              value: 15,
              description: 'Minimum streaming minutes required before referral triggers',
              isActive: true,
            },
          ];
    },
  });

  // Referrals List
  const { data: referralsData, isLoading } = useQuery({
    queryKey: ['admin', 'referrals-list', page, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getReferrals(page, 20);
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: { key: string; value?: number; isActive?: boolean }) =>
      adminApi.updateReferralConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'referral-config'] });
      setConfigSuccess('Referral program settings updated.');
      setConfigError('');
      setEditingConfig(null);
    },
    onError: (e: Error) => setConfigError(e.message || 'Failed to update config'),
  });

  const referrals = referralsData?.items ?? [];
  const total = referralsData?.total ?? 0;

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
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
          <Icon name="users" size={28} color="var(--admin-orange)" />
          <span>Referral Program & Growth</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Manage viral invite rules, bonus coin awards, conversion funnels, and fraud prevention
        </p>
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
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Total Invites Sent</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
            {(stats?.totalReferrals ?? 0).toLocaleString()}
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
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Successful Conversions</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#3fb950', margin: 0 }}>
            {(stats?.completedReferrals ?? 0).toLocaleString()}
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
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Conversion Rate</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-orange)', margin: 0 }}>
            {stats?.conversionRate ?? 0}%
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
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px 0' }}>Bonus Points Distributed</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#58a6ff', margin: 0 }}>
            {(stats?.totalRewardPointsIssued ?? 0).toLocaleString()} pts
          </p>
        </div>
      </div>

      {/* Program Config Cards */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--admin-text)' }}>
          Campaign Bonus Rules
        </h2>

        {configSuccess && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(46,160,67,0.15)',
              border: '1px solid rgba(46,160,67,0.4)',
              color: '#3fb950',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {configSuccess}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {configs.map((c) => (
            <div
              key={c.key}
              style={{
                padding: 18,
                borderRadius: 14,
                backgroundColor: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <code style={{ fontSize: 12, color: 'var(--admin-orange)' }}>{c.key}</code>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: c.isActive ? 'rgba(46,160,67,0.15)' : 'rgba(120,120,120,0.15)',
                      color: c.isActive ? '#3fb950' : 'var(--admin-text-muted)',
                    }}
                  >
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 12px 0' }}>
                  {c.description}
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
                  {c.value.toLocaleString()}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 12, marginTop: 14 }}>
                <button
                  onClick={() => {
                    setEditingConfig(c);
                    setConfigValue(c.value);
                    setConfigActive(c.isActive);
                    setConfigError('');
                    setConfigSuccess('');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Rule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals Pipeline Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>
            Recent Referral Activity
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-text)',
              fontSize: 12,
            }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="blocked">Fraud Blocked</option>
          </select>
        </div>

        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--admin-border)',
            backgroundColor: 'var(--admin-card-bg)',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading referrals...
            </div>
          ) : referrals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              No referral activity recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'rgba(255,107,0,0.04)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Invited By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Invite Code</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>New User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Reward</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: 0 }}>
                        {r.referrerName || r.referrerEmail || r.referrerId}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ color: 'var(--admin-orange)', fontWeight: 600 }}>{r.code}</code>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                      {r.referredEmail || r.referredId || 'Pending signup'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#3fb950' }}>
                      +{r.rewardPoints || 100} pts
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: STATUS_STYLE[r.status]?.bg || 'rgba(120,120,120,0.15)',
                          color: STATUS_STYLE[r.status]?.color || 'var(--admin-text-muted)',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--admin-text-muted)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {total > 20 && (
            <div style={{ padding: 16, borderTop: '1px solid var(--admin-border)' }}>
              <Pagination currentPage={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Config Modal */}
      {editingConfig && (
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text)' }}>
              Edit Rule: {editingConfig.key}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              {editingConfig.description}
            </p>

            {configError && (
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
                {configError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Rule Value (Points / Minutes)
                </label>
                <input
                  type="number"
                  value={configValue}
                  onChange={(e) => setConfigValue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={configActive}
                  onChange={(e) => setConfigActive(e.target.checked)}
                />
                <span>Rule is Active</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setEditingConfig(null)}
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
                onClick={() =>
                  updateConfigMutation.mutate({
                    key: editingConfig.key,
                    value: configValue,
                    isActive: configActive,
                  })
                }
                disabled={updateConfigMutation.isPending}
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
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
