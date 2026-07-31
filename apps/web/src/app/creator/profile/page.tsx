'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';

interface CreatorProfile {
  displayName: string;
  bio: string;
  avatar: string;
  socialLinks: { youtube: string; twitter: string; instagram: string };
}

export default function CreatorProfilePage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['creator', 'profile'],
    queryFn: async () => {
      const response = await apiFetch<CreatorProfile>('/v1/creators/me');
      if (response.success && response.data) {
        return response.data;
      }
      return {
        displayName: '',
        bio: '',
        avatar: '',
        socialLinks: { youtube: '', twitter: '', instagram: '' },
      };
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreatorProfile>) =>
      apiFetch('/v1/creators/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'profile'] });
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
      >
        <AppHeader active="Creator" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-12 w-32" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Creator" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Creator Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Manage your creator profile
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            {profile?.avatar && (
              <OptimizedImage
                src={profile.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 4,
                display: 'block',
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={profile?.displayName || ''}
              onChange={(e) => updateMutation.mutate({ displayName: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 4,
                display: 'block',
              }}
            >
              Bio
            </label>
            <textarea
              value={profile?.bio || ''}
              onChange={(e) => updateMutation.mutate({ bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 4,
                display: 'block',
              }}
            >
              YouTube URL
            </label>
            <input
              type="url"
              value={profile?.socialLinks?.youtube || ''}
              onChange={(e) =>
                updateMutation.mutate({
                  socialLinks: {
                    youtube: e.target.value,
                    twitter: profile?.socialLinks?.twitter ?? '',
                    instagram: profile?.socialLinks?.instagram ?? '',
                  },
                })
              }
              placeholder="https://youtube.com/..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 4,
                display: 'block',
              }}
            >
              Twitter URL
            </label>
            <input
              type="url"
              value={profile?.socialLinks?.twitter ?? ''}
              onChange={(e) =>
                updateMutation.mutate({
                  socialLinks: {
                    youtube: profile?.socialLinks?.youtube ?? '',
                    twitter: e.target.value,
                    instagram: profile?.socialLinks?.instagram ?? '',
                  },
                })
              }
              placeholder="https://twitter.com/..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                marginBottom: 4,
                display: 'block',
              }}
            >
              Instagram URL
            </label>
            <input
              type="url"
              value={profile?.socialLinks?.instagram ?? ''}
              onChange={(e) =>
                updateMutation.mutate({
                  socialLinks: {
                    youtube: profile?.socialLinks?.youtube ?? '',
                    twitter: profile?.socialLinks?.twitter ?? '',
                    instagram: e.target.value,
                  },
                })
              }
              placeholder="https://instagram.com/..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          {saved && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(10,165,232,0.2)',
                border: '1px solid var(--color-secondary-400)',
                borderRadius: 8,
              }}
            >
              <p style={{ color: 'var(--color-secondary-400)', fontSize: 14, margin: 0 }}>
                Profile saved successfully!
              </p>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
