import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api/base';

interface UserDetail {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch<UserDetail>(`/api/v1/admin/users/${id}`);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(response.message || 'Failed to load user');
        }
      } catch {
        setError('Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  if (isLoading) return <div style={{ padding: 32, color: 'var(--admin-text-muted)' }}>Loading...</div>;
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
  if (!user) return <div style={{ padding: 32, color: 'var(--admin-text-muted)' }}>User not found</div>;

  const fields = [
    { label: 'Email', value: user.email },
    { label: 'Username', value: user.username },
    user.phone ? { label: 'Phone', value: user.phone } : null,
    {
      label: 'Status',
      value: user.isActive ? 'Active' : 'Inactive',
      color: user.isActive ? 'var(--admin-emerald)' : 'var(--admin-red)',
    },
    {
      label: 'Email Verified',
      value: user.emailVerified ? 'Yes' : 'No',
      color: user.emailVerified ? 'var(--admin-emerald)' : 'var(--admin-amber)',
    },
    { label: 'Created', value: new Date(user.createdAt).toLocaleDateString() },
    user.lastLoginAt
      ? { label: 'Last Login', value: new Date(user.lastLoginAt).toLocaleDateString() }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; color?: string }>;

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
        }}
      >
        &larr; Back to Users
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'white' }}>
        {user.displayName || user.username}
      </h1>
      <div
        style={{
          background: 'var(--admin-bg)',
          border: '1px solid var(--admin-surface)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {fields.map((f) => (
            <div key={f.label}>
              <label style={{ fontSize: 12, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                {f.label}
              </label>
              <p style={{ color: f.color || 'white', marginTop: 4 }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
