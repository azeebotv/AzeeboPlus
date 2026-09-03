import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, _setPage] = useState(1);

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

  const users = data?.users || [];
  const filtered = useMemo(() => users, [users]);

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
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>{users.length} total users</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              onClick={() => setRoleFilter(role)}
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
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid #CC1C1C',
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
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
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
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
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
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', fontSize: 13 }}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
