'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';

interface CreatorProfile {
  displayName: string;
  bio: string;
  avatar: string;
  socialLinks: { youtube: string; twitter: string; instagram: string };
}

export default function CreatorProfilePage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator', 'profile'],
    queryFn: async () => {
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        const d = response.data as {
          displayName?: string;
          name?: string;
          bio?: string;
          avatar?: string;
          socialLinks?: { youtube?: string; twitter?: string; instagram?: string };
        };
        return {
          displayName: d.displayName || d.name || '',
          bio: d.bio || '',
          avatar: d.avatar || '',
          socialLinks: d.socialLinks || { youtube: '', twitter: '', instagram: '' },
        } as CreatorProfile;
      }
      return {
        displayName: '',
        bio: '',
        avatar: '',
        socialLinks: { youtube: '', twitter: '', instagram: '' },
      } as CreatorProfile;
    },
    enabled: isEnabled,
  });

  const [editProfile, setEditProfile] = useState<CreatorProfile | null>(null);
  const form = editProfile ||
    profile || {
      displayName: '',
      bio: '',
      avatar: '',
      socialLinks: { youtube: '', twitter: '', instagram: '' },
    };

  const saveMutation = useMutation({
    mutationFn: (data: CreatorProfile) => api.user.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
        <AppHeader />
        <main
          style={{
            paddingTop: 100,
            paddingBottom: 60,
            maxWidth: 700,
            margin: '0 auto',
            padding: '100px 24px 60px',
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <Skeleton width="120px" height="20px" className="mb-4" />
            <Skeleton width="200px" height="32px" />
          </div>
          <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <Skeleton width="100px" height="14px" className="mb-2" />
                <Skeleton width="100%" height="44px" borderRadius="12px" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 700,
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Creator Profile</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            Manage how your profile appears to viewers
          </p>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                Display Name
              </label>
              <input
                value={form.displayName}
                onChange={(e) =>
                  setEditProfile({ ...(editProfile || profile!), displayName: e.target.value })
                }
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
                value={form.bio}
                onChange={(e) =>
                  setEditProfile({ ...(editProfile || profile!), bio: e.target.value })
                }
                rows={4}
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
                YouTube
              </label>
              <input
                value={form.socialLinks.youtube}
                onChange={(e) =>
                  setEditProfile({
                    ...(editProfile || profile!),
                    socialLinks: {
                      ...(editProfile || profile!).socialLinks,
                      youtube: e.target.value,
                    },
                  })
                }
                placeholder="https://youtube.com/@..."
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
                Twitter
              </label>
              <input
                value={form.socialLinks.twitter}
                onChange={(e) =>
                  setEditProfile({
                    ...(editProfile || profile!),
                    socialLinks: {
                      ...(editProfile || profile!).socialLinks,
                      twitter: e.target.value,
                    },
                  })
                }
                placeholder="https://twitter.com/..."
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
                Instagram
              </label>
              <input
                value={form.socialLinks.instagram}
                onChange={(e) =>
                  setEditProfile({
                    ...(editProfile || profile!),
                    socialLinks: {
                      ...(editProfile || profile!).socialLinks,
                      instagram: e.target.value,
                    },
                  })
                }
                placeholder="https://instagram.com/..."
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
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
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
                opacity: saveMutation.isPending ? 0.6 : 1,
              }}
            >
              {saved ? '✓ Saved!' : saveMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
