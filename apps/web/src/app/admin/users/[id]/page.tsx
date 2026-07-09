'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await api.request<UserDetail>(`/v1/admin/users/${id}`);
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
    fetchUser();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: '#9A8A7A' }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: '#CC1C1C' }}>{error}</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2A1A1A',
            background: 'transparent',
            color: '#E8420A',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 32, color: '#9A8A7A' }}>User not found</div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 24,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #2A1A1A',
          background: 'transparent',
          color: '#E8420A',
          cursor: 'pointer',
        }}
      >
        &larr; Back to Users
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#fff' }}>
        {user.displayName || user.username}
      </h1>

      <div
        style={{
          background: '#1A0A0A',
          border: '1px solid #2A1A1A',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Email</label>
            <p style={{ color: '#fff', marginTop: 4 }}>{user.email}</p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Username</label>
            <p style={{ color: '#fff', marginTop: 4 }}>{user.username}</p>
          </div>
          {user.phone && (
            <div>
              <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Phone</label>
              <p style={{ color: '#fff', marginTop: 4 }}>{user.phone}</p>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Status</label>
            <p style={{ color: user.isActive ? '#22C55E' : '#CC1C1C', marginTop: 4 }}>
              {user.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Email Verified</label>
            <p style={{ color: user.emailVerified ? '#22C55E' : '#F59E0B', marginTop: 4 }}>
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Created</label>
            <p style={{ color: '#fff', marginTop: 4 }}>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          {user.lastLoginAt && (
            <div>
              <label style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase' }}>Last Login</label>
              <p style={{ color: '#fff', marginTop: 4 }}>{new Date(user.lastLoginAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
