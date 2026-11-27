'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, type User } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import {
  ArrowLeft,
  CheckCircle2,
  User as UserIcon,
  Mail,
  AtSign,
  FileText,
  Save,
} from 'lucide-react';

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      /* ignore */
    }
    setIsSaving(false);
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell activeNav="Profile">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-az-ink/50 hover:text-az-ink transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Settings</span>
        </Link>
      </div>

      <PageHero
        badge="Account Identity"
        title="Edit Profile"
        subtitle="Manage your Azeebo VIP profile, public display handle, and custom avatar."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Showcase */}
          <div className="az-glass p-8 border border-az-glass-border text-center">
            <div className="inline-block p-1.5 rounded-full bg-gradient-to-tr from-az-flame via-az-scarlet to-az-warning-400 mb-3 shadow-lg shadow-az-flame/20">
              <AvatarUpload
                currentAvatar={profile.avatar}
                displayName={profile.displayName || profile.username}
                onAvatarUpdate={(url) => setProfile((prev) => ({ ...prev, avatar: url }))}
                size={96}
              />
            </div>
            <h3 className="text-az-ink font-bold text-base mt-2">Profile Portrait</h3>
            <p className="text-az-ink/40 text-xs mt-0.5">Click the image to upload a new avatar</p>
          </div>

          {/* Form Fields */}
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border space-y-5">
            <div>
              <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon size={14} className="text-az-flame" />
                <span>Display Name</span>
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="w-full px-4 py-3.5 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm font-medium"
                placeholder="Your full or screen name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AtSign size={14} className="text-az-flame" />
                <span>Username Handle</span>
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full px-4 py-3.5 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm font-medium"
                placeholder="@username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail size={14} className="text-az-flame" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3.5 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm font-medium"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-az-flame" />
                <span>Bio / Personal Tagline</span>
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3.5 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm font-medium resize-none"
                placeholder="Tell the Azeebo community what shows, movies, and lore you are following..."
              />
            </div>
          </div>

          {saved && (
            <div className="px-4 py-3 rounded-2xl bg-az-success-500/15 border border-az-success-500/30 text-az-success-400 text-center text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="transition-all az-btn-primary shadow-xl shadow-az-flame/25 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
