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

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await adminApi.getUsers();
      if (res.success && res.data) {
        const d = res.data as unknown as UserItem[] | { users: UserItem[] };
        return Array.isArray(d) ? d : d.users || [];
      }
      return [];
    },
  });

  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    }),
    [users, search, roleFilter]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Users</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>{users.length} total users</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          aria-label="Search users"
          style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'user', 'creator', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{ padding: '8px 16px', borderRadius: 999, border: roleFilter === role ? 'none' : '1px solid #2A1A1A', background: roleFilter === role ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: roleFilter === role ? '#fff' : '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid #CC1C1C', backgroundColor: 'rgba(204,28,28,0.1)' }}>
          <p style={{ color: '#CC1C1C', fontWeight: 600 }}>Failed to load users</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['User', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#9A8A7A', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600 }}>{u.username}</p>
                      <p style={{ color: '#9A8A7A', fontSize: 12 }}>{u.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', backgroundColor: u.role === 'admin' ? 'rgba(232,66,10,0.2)' : u.role === 'creator' ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)', color: u.role === 'admin' ? '#E8420A' : u.role === 'creator' ? '#0D3B2E' : '#9A8A7A' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', backgroundColor: u.isActive ? '#0D3B2E' : '#CC1C1C', marginRight: 6 }} />
                      <span style={{ fontSize: 13, color: '#9A8A7A' }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => navigate(`/users/${u.id}`)} style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontSize: 12, cursor: 'pointer' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No users found</p>}
        </div>
      )}
    </div>
  );
}
