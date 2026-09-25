import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

interface UserDetail {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  isSuspended?: boolean;
  suspensionReason?: string | null;
  isVerified?: boolean;
  createdAt: string;
  wallet?: { balance?: number; currency?: string } | null;
  contentCount?: number;
  notificationCount?: number;
}

const ROLES = ['user', 'creator', 'moderator', 'admin', 'super_admin'];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [newRole, setNewRole] = useState('');

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch<UserDetail>(`/api/v1/admin/users/${id}`);
      if (response.success && response.data) {
        setUser(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load user');
      }
    } catch (e) {
      setError((e as Error).message || 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchUser();
  }, [id, fetchUser]);

  /**
   * Mutations are always shown; the backend enforces role rules (delete is
   * superadmin-only) and failures surface in the action banner below.
   */
  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      await fetchUser();
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setActionError(successMsg);
    } catch (e) {
      const err = e as { message?: string; data?: { message?: string } };
      setActionError(err.data?.message || err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading)
    return <div style={{ padding: 32, color: 'var(--admin-text-muted)' }}>Loading...</div>;
  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: 'var(--admin-red)' }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--admin-surface)',
            background: 'transparent',
            color: 'var(--admin-orange)',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }
  if (!user)
    return <div style={{ padding: 32, color: 'var(--admin-text-muted)' }}>User not found</div>;

  const suspended = user.isSuspended === true;

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 24,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--admin-surface)',
          background: 'transparent',
          color: 'var(--admin-orange)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.15s ease',
        }}
      >
        <Icon name="arrowLeft" size={16} />
        <span>Back to Users</span>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)' }}>
          {user.displayName || user.email}
        </h1>
        <span
          style={{
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: suspended ? 'var(--admin-red)' : 'var(--admin-emerald)',
            background: suspended ? 'rgba(204,28,28,0.15)' : 'rgba(16,185,129,0.15)',
          }}
        >
          {suspended ? 'Suspended' : 'Active'}
        </span>
        <span
          style={{
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--admin-orange)',
            background: 'rgba(249,115,22,0.15)',
          }}
        >
          {user.role}
        </span>
      </div>

      {actionError && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            color: /failed|error|not /i.test(actionError)
              ? 'var(--admin-red)'
              : 'var(--admin-emerald)',
            background: /failed|error|not /i.test(actionError)
              ? 'rgba(204,28,28,0.1)'
              : 'rgba(16,185,129,0.1)',
          }}
        >
          {actionError}
        </div>
      )}

      <div
        style={{
          background: 'var(--admin-bg)',
          border: '1px solid var(--admin-surface)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role },
            suspended
              ? {
                  label: 'Suspension reason',
                  value: user.suspensionReason || '—',
                  color: 'var(--admin-red)',
                }
              : null,
            { label: 'Verified', value: user.isVerified ? 'Yes' : 'No' },
            {
              label: 'Wallet balance',
              value: user.wallet
                ? `${user.wallet.balance ?? 0} ${user.wallet.currency ?? ''}`
                : '—',
            },
            { label: 'Content items', value: String(user.contentCount ?? 0) },
            { label: 'Created', value: new Date(user.createdAt).toLocaleString() },
          ]
            .filter(Boolean)
            .map((f) => {
              const field = f as { label: string; value: string; color?: string };
              return (
                <div key={field.label}>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {field.label}
                  </label>
                  <p style={{ color: field.color || 'white', marginTop: 4 }}>{field.value}</p>
                </div>
              );
            })}
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--admin-surface)',
          borderRadius: 12,
          padding: 20,
          background: 'var(--admin-surface)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Actions</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!suspended ? (
            <button
              onClick={() => {
                setShowSuspend(!showSuspend);
                setRevokeReason('');
              }}
              disabled={busy}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--admin-red)',
                color: 'white',
                fontWeight: 600,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Suspend user…
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Revoke reason"
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'white',
                  fontSize: 13,
                }}
              />
              <button
                onClick={() => {
                  if (!revokeReason.trim()) return;
                  void runAction(
                    () => adminApi.revokeSuspension(user.id, revokeReason.trim()),
                    'Suspension revoked'
                  );
                }}
                disabled={busy || !revokeReason.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--admin-emerald)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: busy || !revokeReason.trim() ? 'wait' : 'pointer',
                }}
              >
                Revoke suspension
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setShowRole(!showRole);
              setNewRole(user.role);
            }}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              background: 'transparent',
              color: 'var(--admin-orange)',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Change role…
          </button>
          <button
            onClick={() => setShowDelete(!showDelete)}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--admin-red)',
              background: 'transparent',
              color: 'var(--admin-red)',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            Delete user
          </button>
        </div>

        {showSuspend && !suspended && (
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason (required)"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'transparent',
                color: 'white',
                fontSize: 13,
                minWidth: 220,
              }}
            />
            <input
              value={suspendDays}
              onChange={(e) => setSuspendDays(e.target.value.replace(/\D/g, ''))}
              placeholder="Days (empty = indefinite)"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'transparent',
                color: 'white',
                fontSize: 13,
                width: 170,
              }}
            />
            <button
              onClick={() => {
                if (!suspendReason.trim()) return;
                void runAction(
                  () =>
                    adminApi.suspendUser(
                      user.id,
                      suspendReason.trim(),
                      suspendDays ? Number(suspendDays) : undefined
                    ),
                  'User suspended'
                );
                setShowSuspend(false);
              }}
              disabled={busy || !suspendReason.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--admin-red)',
                color: 'white',
                fontWeight: 600,
                cursor: busy || !suspendReason.trim() ? 'wait' : 'pointer',
              }}
            >
              Confirm suspension
            </button>
          </div>
        )}

        {showRole && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'var(--admin-bg)',
                color: 'white',
                fontSize: 13,
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (newRole && newRole !== user.role) {
                  void runAction(
                    () => adminApi.updateUserRole(user.id, newRole),
                    `Role changed to ${newRole}`
                  );
                }
                setShowRole(false);
              }}
              disabled={busy || !newRole || newRole === user.role}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--admin-orange)',
                color: 'white',
                fontWeight: 600,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        )}

        {showDelete && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--admin-red)', fontSize: 13 }}>
              Permanently delete {user.email}? This cannot be undone.
            </span>
            <button
              onClick={() => {
                setShowDelete(false);
                void runAction(async () => {
                  await adminApi.deleteUser(user.id);
                  navigate('/users');
                }, 'User deleted');
              }}
              disabled={busy}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--admin-red)',
                color: 'white',
                fontWeight: 600,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Yes, delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
