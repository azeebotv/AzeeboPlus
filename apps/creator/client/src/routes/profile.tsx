import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { useAuth } from '@/context/AuthContext';
import type { CreatorProfile } from '@/lib/creator-types';

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatar: '',
    website: '',
    twitter: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  });

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['creator', 'profile'],
    queryFn: async () => {
      const res = await creatorApi.getProfile();
      if (res.success && res.data) return res.data as CreatorProfile;
      return {
        id: user?.id || '',
        displayName: user?.displayName || user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        bio: '',
        website: '',
        socialLinks: {},
      };
    },
  });

  useEffect(() => {
    if (profile) {
      const p = profile as CreatorProfile;
      setFormData({
        displayName: p.displayName || user?.displayName || '',
        bio: p.bio || '',
        avatar: p.avatar || user?.avatar || '',
        website: p.website || p.socialLinks?.website || '',
        twitter: p.socialLinks?.twitter || '',
        instagram: p.socialLinks?.instagram || '',
        youtube: p.socialLinks?.youtube || '',
        tiktok: p.socialLinks?.tiktok || '',
      });
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await creatorApi.updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar,
        website: formData.website,
        socialLinks: {
          twitter: formData.twitter,
          instagram: formData.instagram,
          youtube: formData.youtube,
          tiktok: formData.tiktok,
        },
      });
      return creatorApi.assertSuccess<CreatorProfile>(res);
    },
    onSuccess: () => {
      setSavedMessage('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['creator', 'profile'] });
      setTimeout(() => setSavedMessage(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'white' }}>
        Creator Profile
      </h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 28 }}>
        Customize your creator identity, bio, and social presence across Azeebo+.
      </p>

      {savedMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid var(--creator-green)',
            color: 'var(--creator-green)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          ✓ {savedMessage}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)' }}>Loading profile...</p>
      ) : isError ? (
        <p style={{ color: 'var(--creator-red)', fontSize: 13 }}>
          {creatorApi.errorMessage(error)}
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar Preview */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'rgba(232, 66, 10, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--creator-orange)',
                border: '2px solid rgba(232, 66, 10, 0.5)',
              }}
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (formData.displayName || 'C').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
                Avatar Image URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Basic Info */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>
              Basic Information
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
                Creator Bio
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell your fans about yourself and the universes you create in..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://mychannel.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Social Links */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>
              Social Media Channels
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 4 }}
                >
                  Twitter / X
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="@handle"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 4 }}
                >
                  Instagram
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@handle"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 4 }}
                >
                  YouTube Channel
                </label>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  placeholder="channel link"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 4 }}
                >
                  TikTok
                </label>
                <input
                  type="text"
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@handle"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            style={{
              padding: '14px 28px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
              marginTop: 10,
              alignSelf: 'flex-start',
              opacity: updateMutation.isPending ? 0.6 : 1,
            }}
          >
            {updateMutation.isPending ? 'Saving Changes...' : 'Save Profile'}
          </button>
          {updateMutation.isError && (
            <p style={{ color: 'var(--creator-red)', fontSize: 13 }}>
              {creatorApi.errorMessage(updateMutation.error)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
