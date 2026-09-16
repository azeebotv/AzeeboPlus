import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  isVerified?: boolean;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, roleFilter, search],
    queryFn: async () => {
      const res = await adminApi.getUsers(
        page,
        20,
        roleFilter === 'all' ? undefined : roleFilter,
        search || undefined
      );
      if (res.success && res.data) {
        const d = res.data as unknown as
          | UserItem[]
          | { users: UserItem[]; total?: number; totalPages?: number };
        const users = Array.isArray(d) ? d : d.users || [];
        return {
          users,
          total: (d as { total?: number })?.total || users.length,
          totalPages: (d as { totalPages?: number })?.totalPages || 1,
        };
      }
      return { users: [], total: 0, totalPages: 1 };
    },
  });

  const bulkSuspendMutation = useMutation({
    mutationFn: () =>
      adminApi.bulkSuspendUsers(
        selectedIds,
        suspendReason || 'Bulk suspended by operator',
        Number(suspendDays) || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedIds([]);
      setShowSuspendModal(false);
      setSuspendReason('');
    },
  });

  /** Row-level verify/unverify (backend: POST :id/verify | :id/unverify). */
  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      verified ? adminApi.verifyCreator(id) : adminApi.unverifyCreator(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  /** Row-level suspend for a single user (same contract as bulk). */
  const suspendOneMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id, 'Suspended from users directory', 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user'] });
    },
  });

  const exportCSV = () => {
    const listToExport =
      selectedIds.length > 0 ? users.filter((u) => selectedIds.includes(u.id)) : users;

    if (listToExport.length === 0) return;

    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Joined'];
    const rows = listToExport.map((u) => [
      `"${u.id}"`,
      `"${u.username.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.isActive ? 'Active' : 'Inactive'}"`,
      `"${new Date(u.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `azeebo_users_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const users = data?.users || [];
  const total = data?.total ?? users.length;
  const totalPages = data?.totalPages ?? 1;

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Users</h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
            {total.toLocaleString()} total users
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowSuspendModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid var(--admin-red)',
                backgroundColor: 'rgba(204,28,28,0.15)',
                color: 'var(--admin-red)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Icon name="shield" size={14} />
              <span>Suspend Selected ({selectedIds.length})</span>
            </button>
          )}
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Icon name="download" size={14} />
            <span>
              {selectedIds.length > 0 ? `Export (${selectedIds.length}) CSV` : 'Export CSV'}
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          aria-label="Search users"
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-dark)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'user', 'creator', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: roleFilter === role ? 'none' : '1px solid var(--admin-surface)',
                background:
                  roleFilter === role
                    ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                    : 'transparent',
                color: roleFilter === role ? 'white' : 'var(--admin-text-muted)',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Loading...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.1)',
          }}
        >
          <p style={{ color: 'var(--admin-red)', fontWeight: 600 }}>Failed to load users</p>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  <th style={{ width: 40, padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {['User', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
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
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
                    <td style={{ width: 40, padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600 }}>{u.username}</p>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{u.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          backgroundColor:
                            u.role === 'admin'
                              ? 'rgba(232,66,10,0.2)'
                              : u.role === 'creator'
                                ? 'rgba(13,59,46,0.2)'
                                : 'rgba(154,138,122,0.2)',
                          color:
                            u.role === 'admin'
                              ? 'var(--admin-orange)'
                              : u.role === 'creator'
                                ? 'var(--admin-green)'
                                : 'var(--admin-text-muted)',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--admin-text-muted)',
                        fontSize: 13,
                      }}
                    >
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          display: 'inline-block',
                          backgroundColor: u.isActive ? 'var(--admin-green)' : 'var(--admin-red)',
                          marginRight: 6,
                        }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => navigate(`/users/${u.id}`)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 999,
                            border: '1px solid var(--admin-surface)',
                            background: 'transparent',
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        {u.role === 'creator' && (
                          <button
                            onClick={() =>
                              verifyMutation.mutate({ id: u.id, verified: !u.isVerified })
                            }
                            disabled={verifyMutation.isPending}
                            title="Toggle creator verification (POST :id/verify | :id/unverify)"
                            style={{
                              padding: '6px 14px',
                              borderRadius: 999,
                              border: '1px solid var(--admin-surface)',
                              background: 'transparent',
                              color: 'var(--admin-green)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            {u.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                        )}
                        {u.isActive && (
                          <button
                            onClick={() => {
                              if (suspendOneMutation.isPending) return;
                              suspendOneMutation.mutate(u.id);
                            }}
                            disabled={suspendOneMutation.isPending}
                            title="Suspend for 7 days (PUT :id/suspend)"
                            style={{
                              padding: '6px 14px',
                              borderRadius: 999,
                              border: '1px solid var(--admin-surface)',
                              background: 'transparent',
                              color: 'var(--admin-red)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No users found
            </p>
          )}

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderTop: '1px solid var(--admin-border)',
                fontSize: 13,
                color: 'var(--admin-text-muted)',
              }}
            >
              <span>
                Page {page} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: 'transparent',
                    color: page <= 1 ? 'var(--admin-text-dim)' : 'var(--admin-text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Icon name="arrowLeft" size={14} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    background: 'transparent',
                    color: page >= totalPages ? 'var(--admin-text-dim)' : 'var(--admin-text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>Next</span>
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-dark)',
              border: '1px solid var(--admin-card)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 440,
            }}
          >
            <h3
              style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--admin-red)' }}
            >
              Bulk Suspend {selectedIds.length} Users
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Suspended users will immediately lose access to their accounts and be logged out of
              active sessions.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Duration
              </label>
              <select
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="0">Indefinite</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Reason
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Reason for suspension..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => bulkSuspendMutation.mutate()}
                disabled={bulkSuspendMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--admin-red)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {bulkSuspendMutation.isPending ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
