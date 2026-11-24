import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import type { RightsClearance } from '@/lib/admin-types';

/**
 * Talent & rights clearances — drill-down target for the dashboard's
 * governance card. ?expiry=expiring lands pre-filtered to the "Expiring ≤ 30
 * Days" tile, ?expiry=expired to "Expired Unresolved"; chip clicks take over
 * from the URL param.
 */

const STATUS_CHIPS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expiring', label: 'Expiring ≤ 30 Days' },
  { value: 'expired', label: 'Expired Unresolved' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: 'var(--admin-amber)' },
  approved: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  rejected: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
  expired: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
};

const TYPE_LABELS: Record<string, string> = {
  talent: 'Talent',
  music: 'Music',
  likeness: 'Likeness',
  voice: 'Voice',
};

function isExpiringChip(value: string) {
  return value === 'expiring' || value === 'expired';
}

function ClearanceCard({ clearance }: { clearance: RightsClearance }) {
  const queryClient = useQueryClient();

  const decide = useMutation({
    mutationFn: (status: 'approved' | 'rejected') =>
      adminApi.decideRightsClearance(clearance.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rights-clearances'] }),
  });

  const style = STATUS_STYLES[clearance.status] ?? STATUS_STYLES['pending']!;
  const expiringSoon =
    clearance.expiryDate &&
    clearance.status !== 'rejected' &&
    new Date(clearance.expiryDate).getTime() > Date.now() &&
    new Date(clearance.expiryDate).getTime() - Date.now() < 30 * 86400000;

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        border: '1px solid var(--admin-border)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
              {clearance.talentName}
            </span>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
              {TYPE_LABELS[clearance.type] ?? clearance.type}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 999,
                backgroundColor: style.bg,
                color: style.color,
              }}
            >
              {clearance.status}
            </span>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: '0 0 4px' }}>
            {clearance.contentTitle} · {clearance.universe}
          </p>
          {clearance.expiryDate && (
            <p
              style={{
                color: expiringSoon ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                fontSize: 12,
                margin: 0,
              }}
            >
              Expires {new Date(clearance.expiryDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {(clearance.status === 'pending' || clearance.status === 'approved') && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', whiteSpace: 'nowrap' }}>
            {clearance.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => decide.mutate('approved')}
                  disabled={decide.isPending}
                  style={{
                    backgroundColor: 'var(--admin-emerald)',
                    color: 'var(--admin-dark)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide.mutate('rejected')}
                  disabled={decide.isPending}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--admin-red)',
                    border: '1px solid var(--admin-red)',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TalentClearancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('expiry');
  const [filter, setFilter] = useState(urlFilter && isExpiringChip(urlFilter) ? urlFilter : 'all');

  // 'expiring'/'expired' are server-side virtual filters; plain statuses go
  // through the status param.
  const isVirtual = isExpiringChip(filter);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'rights-clearances', filter],
    queryFn: async () => {
      const res = await adminApi.getRightsClearances(
        isVirtual ? { expiry: filter } : { status: filter }
      );
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load');
      return Array.isArray(res.data) ? (res.data as RightsClearance[]) : [];
    },
  });

  const items = data ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: '0 0 6px' }}>
        Talent & Rights Clearances
      </h1>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 20 }}>
        Talent, music, likeness, and voice clearances with expiry tracking — expired rows still
        pending or approved are flagged here.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => {
              setFilter(chip.value);
              setSearchParams(isExpiringChip(chip.value) ? { expiry: chip.value } : {});
            }}
            style={{
              backgroundColor: filter === chip.value ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: filter === chip.value ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
              border: '1px solid',
              borderColor: filter === chip.value ? 'var(--admin-orange)' : 'var(--admin-border)',
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', padding: '40px 0', textAlign: 'center' }}>
          Loading clearances…
        </p>
      ) : error ? (
        <p style={{ color: 'var(--admin-red)', padding: '40px 0', textAlign: 'center' }}>
          {(error as Error).message}
        </p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', padding: '40px 0', textAlign: 'center' }}>
          No clearances match this filter.
        </p>
      ) : (
        items.map((c) => <ClearanceCard key={c.id} clearance={c} />)
      )}
    </div>
  );
}
