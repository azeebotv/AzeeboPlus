'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, type User } from '@/lib/api';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export const metadata = {
  title: 'Edit Profile | Azeebo',
  description: 'Update your display name, username, email, bio, and profile photo.',
  openGraph: {
    title: 'Edit Profile | Azeebo',
    description: 'Update your display name, username, email, bio, and profile photo.',
  },
};

export default function ProfileEditPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    displayName: '',
    bio: '',
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    setProfile({
      username: user.name || '',
      email: user.email || '',
      displayName: user.name || '',
      bio: (user as User & { bio?: string }).bio || '',
      avatar: user.avatar || '',
    });
  }, [authLoading, isAuthenticated, user, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await api.user.updateProfile({
        name: profile.username,
        displayName: profile.displayName,
        email: profile.email,
        avatar: profile.avatar,
      } as { name: string; displayName: string; email: string; avatar: string; bio?: string });
      if (result.success) {
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      /* ignore */
    }
    setIsSaving(false);
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 600,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A8A7A',
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              overflow: 'hidden',
              margin: '0 auto 12px',
              border: '3px solid #E8420A',
            }}
          >
            {profile.avatar ? (
              <OptimizedImage
                src={profile.avatar}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#2A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#E8420A',
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: '1px solid #2A1A1A',
              background: 'transparent',
              color: '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Change Photo
          </button>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { key: 'displayName', label: 'Display Name', type: 'text' },
              { key: 'username', label: 'Username', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
            ].map((field) => (
              <div key={field.key}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#9A8A7A',
                  }}
                >
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={(profile as Record<string, string>)[field.key]}
                  onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 15,
                  }}
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: '#9A8A7A',
                }}
              >
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 15,
                  resize: 'vertical',
                }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="az-btn-primary"
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {saved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
