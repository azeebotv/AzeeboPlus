import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import type { DualControlRequest } from '@/lib/admin-types';
import { asRecord } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Dual-control queue (TAA §55) — drill-down target for the dashboard's
 * governance card. ?status=awaiting lands pre-filtered to everything awaiting
 * a decision (the "Awaiting Approval" tile); any status chip click takes over
 * from the URL param.
 */

const STATUS_CHIPS: { value: string; label: string }[] = [
  { value: 'awaiting', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved, Not Executed' },
  { value: 'pending', label: 'Pending' },
  { value: 'first_approved', label: 'Awaiting 2nd Approval' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'executed', label: 'Executed' },
  { value: 'all', label: 'All' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: 'var(--admin-amber)' },
  first_approved: { bg: 'rgba(232,66,10,0.15)', color: 'var(--admin-orange)' },
  approved: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  rejected: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
  executed: { bg: 'rgba(154,138,122,0.15)', color: 'var(--admin-text-muted)' },
};

const ACTION_LABELS: Record<string, string> = {
  large_refund: 'Large Refund',
  manual_entitlement: 'Manual Entitlement',
  bulk_operation: 'Bulk Operation',
  data_export: 'Data Export',
  account_modification: 'Account Modification',
};

function ActionCard({ action }: { action: DualControlRequest }) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const decide = useMutation({
    mutationFn: (input: { decision: 'approve' | 'reject'; reason?: string }) =>
      adminApi.decideDualControl(action.id, input.decision, input.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dual-control'] });
      setRejecting(false);
    },
  });

  const style = STATUS_STYLES[action.status] ?? STATUS_STYLES.executed;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>
              {ACTION_LABELS[action.actionType] ?? action.actionType}
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
              {action.status.replace('_', ' ')}
            </span>
          </div>
          <p style={{ color: 'var(--admin-text)', fontSize: 14, margin: '0 0 4px' }}>
            {action.description}
          </p>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
            Requested by {action.requestedByName || action.requestedBy} ·{' '}
            {new Date(action.createdAt).toLocaleString()}
          </p>
        </div>
        {action.amount && (
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
              {action.currency ?? ''} {Number(action.amount).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Two-person progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          fontSize: 12,
          color: 'var(--admin-text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon
            name={action.firstApprover ? 'checkCircle' : 'clock'}
            size={14}
            color={action.firstApprover ? 'var(--admin-emerald)' : 'var(--admin-text-muted)'}
          />
          1st: {action.firstApproverName || '—'}
        </span>
        <span style={{ flex: 1, height: 1, backgroundColor: 'var(--admin-border)' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon
            name={action.secondApprover ? 'checkCircle' : 'clock'}
            size={14}
            color={action.secondApprover ? 'var(--admin-emerald)' : 'var(--admin-text-muted)'}
          />
          2nd: {action.secondApproverName || '—'}
        </span>
      </div>

      {action.rejectionReason && (
        <p style={{ color: 'var(--admin-red)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          Rejected: {action.rejectionReason}
        </p>
      )}

      {(action.status === 'pending' || action.status === 'first_approved') && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {!rejecting ? (
            <>
              <button
                type="button"
                onClick={() => decide.mutate({ decision: 'approve' })}
                disabled={decide.isPending}
                style={{
                  backgroundColor: 'var(--admin-emerald)',
                  color: '#04140d',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {action.status === 'pending' ? 'First Approval' : 'Final Approval'}
              </button>
              <button
                type="button"
                onClick={() => setRejecting(true)}
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
          ) : (
            <>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rejection reason (required)"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={() => reason.trim() && decide.mutate({ decision: 'reject', reason: reason.trim() })}
                disabled={decide.isPending || !reason.trim()}
                style={{
                  backgroundColor: 'var(--admin-red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: reason.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => setRejecting(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--admin-text-muted)',
                  border: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DualControlPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');
  const [status, setStatus] = useState(urlStatus ?? 'awaiting');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dual-control', status],
    queryFn: async () => {
      const res = await adminApi.getDualControlRequests(status);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load');
      const d = asRecord(res.data);
      const actions = Array.isArray(d.actions) ? (d.actions as DualControlRequest[]) : [];
      return actions;
    },
  });

  const actions = data ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
          Dual-Control Queue
        </h1>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 20 }}>
        High-risk operations requiring two distinct approvers — the requesting admin can never
        approve their own request.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => {
              setStatus(chip.value);
              setSearchParams(chip.value === 'awaiting' ? { status: chip.value } : {});
            }}
            style={{
              backgroundColor: status === chip.value ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: status === chip.value ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
              border: '1px solid',
              borderColor: status === chip.value ? 'var(--admin-orange)' : 'var(--admin-border)',
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
          Loading requests…
        </p>
      ) : error ? (
        <p style={{ color: 'var(--admin-red)', padding: '40px 0', textAlign: 'center' }}>
          {(error as Error).message}
        </p>
      ) : actions.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', padding: '40px 0', textAlign: 'center' }}>
          No dual-control requests match this filter.
        </p>
      ) : (
        actions.map((a) => <ActionCard key={a.id} action={a} />)
      )}
    </div>
  );
}
