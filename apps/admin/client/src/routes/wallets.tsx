import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminWallet } from '@/lib/admin-types';

function getStatusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case 'active':
      return { bg: 'rgba(13,59,46,0.2)', color: 'var(--admin-green)' };
    case 'frozen':
      return { bg: 'rgba(56,132,255,0.2)', color: 'var(--admin-blue)' };
    case 'suspended':
      return { bg: 'rgba(204,28,28,0.2)', color: 'var(--admin-red)' };
    default:
      return { bg: 'rgba(13,59,46,0.2)', color: 'var(--admin-green)' };
  }
}

export default function WalletsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionTarget, setActionTarget] = useState<AdminWallet | null>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit' | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');

  const { data: walletsData, isLoading } = useQuery({
    queryKey: ['admin', 'wallets', page],
    queryFn: async () => {
      const res = await adminApi.getWallets(page, 20);
      if (res.success && res.data) {
        const d = res.data as AdminWallet[] | { items: AdminWallet[]; total: number };
        if (Array.isArray(d))
          return { items: d as AdminWallet[], total: (d as AdminWallet[]).length };
        return d as { items: AdminWallet[]; total: number };
      }
      return { items: [], total: 0 };
    },
  });

  const wallets = walletsData?.items || [];
  const total = walletsData?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateWalletStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    },
  });

  function openAction(wallet: AdminWallet, type: 'credit' | 'debit') {
    setActionTarget(wallet);
    setActionType(type);
    setActionAmount('');
    setActionReason('');
  }

  function closeAction() {
    setActionTarget(null);
    setActionType(null);
    setActionAmount('');
    setActionReason('');
  }

  function handleAction() {
    if (!actionTarget || !actionType || !actionAmount) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const endpoint =
      actionType === 'credit'
        ? `/api/v1/admin/wallets/${actionTarget.id}/credit`
        : `/api/v1/admin/wallets/${actionTarget.id}/debit`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, reason: actionReason || `${actionType} by admin` }),
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
        closeAction();
      })
      .catch(() => {
        closeAction();
      });
  }

  function nextStatus(current: string): { next: string; label: string; color: string } {
    if (current === 'active')
      return { next: 'frozen', label: 'Freeze', color: 'var(--admin-blue)' };
    if (current === 'frozen')
      return { next: 'active', label: 'Activate', color: 'var(--admin-green)' };
    return { next: 'active', label: 'Reactivate', color: 'var(--admin-green)' };
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>User Wallets</h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>{total} wallets</p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  {['User', 'Balance', 'Currency', 'Status', 'Created', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--admin-text-muted)',
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
                {wallets.map((w) => {
                  const statusStyle = getStatusStyle(w.status);
                  const { next, label, color: btnColor } = nextStatus(w.status);
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>
                          {w.user?.displayName || w.user?.email || w.userId}
                        </p>
                        {w.user?.email && w.user.displayName && (
                          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            {w.user.email}
                          </p>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontWeight: 700,
                          color: 'var(--admin-orange)',
                        }}
                      >
                        ₦{w.balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        {w.currency}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            textTransform: 'capitalize',
                          }}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontSize: 13,
                        }}
                      >
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openAction(w, 'credit')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(13,59,46,0.3)',
                              background: 'transparent',
                              color: 'var(--admin-green)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Credit
                          </button>
                          <button
                            onClick={() => openAction(w, 'debit')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(232,66,10,0.3)',
                              background: 'transparent',
                              color: 'var(--admin-orange)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Debit
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: w.id, status: next })}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: `1px solid ${btnColor}33`,
                              background: 'transparent',
                              color: btnColor,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {wallets.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No wallets found
            </p>
          )}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderTop: '1px solid var(--admin-bg)',
              }}
            >
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: page <= 1 ? 'var(--admin-bg)' : 'transparent',
                  color: page <= 1 ? 'var(--admin-grey)' : 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Prev
              </button>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: page >= totalPages ? 'var(--admin-bg)' : 'transparent',
                  color: page >= totalPages ? 'var(--admin-grey)' : 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {actionTarget && actionType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={closeAction}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
              padding: 24,
              maxWidth: 400,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {actionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
            </h2>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 20 }}>
              User: {actionTarget.userId} &mdash; Current balance: ₦
              {actionTarget.balance.toLocaleString()}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Amount (NGN)
              </label>
              <input
                type="number"
                min="1"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
                placeholder="0"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Reason
              </label>
              <input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
                placeholder="Optional reason"
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleAction}
                disabled={!actionAmount || parseFloat(actionAmount) <= 0}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    !actionAmount || parseFloat(actionAmount) <= 0
                      ? 'var(--admin-surface)'
                      : actionType === 'credit'
                        ? 'linear-gradient(135deg, #0D3B2E 0%, #1A5E45 100%)'
                        : 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color:
                    !actionAmount || parseFloat(actionAmount) <= 0 ? 'var(--admin-grey)' : 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor:
                    !actionAmount || parseFloat(actionAmount) <= 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {actionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
              </button>
              <button
                onClick={closeAction}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
