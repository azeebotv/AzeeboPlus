'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function CreatorProfilePage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({ displayName: '', bio: '', avatar: '', socialLinks: { youtube: '', twitter: '', instagram: '' } });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadProfile();
  }, [isAuthenticated, user, router]);

  const loadProfile = async () => {
    try {
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        const d = response.data as any;
        setProfile({ displayName: d.displayName || d.name || '', bio: d.bio || '', avatar: d.avatar || '', socialLinks: d.socialLinks || { youtube: '', twitter: '', instagram: '' } });
      }
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.user.updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 700, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9A8A7A', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Creator Profile</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Manage how your profile appears to viewers</p>
        </div>

        <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#9A8A7A' }}>Display Name</label>
              <input value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#9A8A7A' }}>Bio</label>
              <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 15, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#9A8A7A' }}>YouTube</label>
              <input value={profile.socialLinks.youtube} onChange={e => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, youtube: e.target.value } })} placeholder="https://youtube.com/@..." style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#9A8A7A' }}>Twitter</label>
              <input value={profile.socialLinks.twitter} onChange={e => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })} placeholder="https://twitter.com/..." style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#9A8A7A' }}>Instagram</label>
              <input value={profile.socialLinks.instagram} onChange={e => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 15 }} />
            </div>
            <button onClick={handleSave} disabled={isSaving} className="az-btn-primary" style={{ width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
              {saved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
