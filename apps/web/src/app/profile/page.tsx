'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHero } from '../../components/layout/PageHero';
import { PageShell } from '../../components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

interface UserProfileData {
  profile?: UserProfile;
  preferences?: {
    darkMode?: boolean;
    notifications?: Record<string, boolean>;
  };
}

export default function ProfilePage(): React.JSX.Element {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfileData | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const [profileRes, prefsRes] = await Promise.all([
        api.user.getProfile(),
        api.user.getPreferences(),
      ]);
      return {
        profile:
          profileRes.success && profileRes.data
            ? {
                id: profileRes.data.id,
                email: profileRes.data.email,
                displayName: profileRes.data.displayName ?? '',
                avatar: profileRes.data.avatar ?? '',
                role: profileRes.data.role,
                createdAt: profileRes.data.createdAt ?? '',
              }
            : undefined,
        preferences:
          prefsRes.success && prefsRes.data
            ? {
                darkMode: (prefsRes.data as { darkMode?: boolean }).darkMode,
                notifications: (prefsRes.data as { notifications?: Record<string, boolean> })
                  .notifications,
              }
            : undefined,
      };
    },
    staleTime: 60000,
  });

  return (
    <PageShell maxWidth="lg" className="pb-16">
      <PageHero title="Your Profile" eyebrow="Account" />

      {isLoading ? (
        <div className="az-glass p-6 space-y-4">
          <Skeleton height="80px" borderRadius="0.75rem" />
          <Skeleton height="24px" width="60%" />
          <Skeleton height="20px" width="40%" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load profile"
          description="Please try again later."
          buttonText="Retry"
          onButtonPress={() => window.location.reload()}
        />
      ) : profile ? (
        <motion.div
          className="az-glass p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {profile.profile?.avatar ? (
              <OptimizedImage
                src={profile.profile.avatar}
                alt={profile.profile.displayName}
                className="size-20 rounded-full object-cover sm:size-24"
              />
            ) : (
              <div className="az-title flex size-20 items-center justify-center rounded-full bg-[image:var(--gradient-az-cta)] text-az-ink sm:size-24">
                {profile.profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1">
              <h2 className="az-title mb-1 text-az-ink">
                {profile.profile?.displayName || 'User'}
              </h2>
              <p className="az-body mb-3 text-az-ink-muted">{profile.profile?.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className="az-micro-label rounded-az-pill bg-az-scarlet/15 px-3 py-1 text-az-flame">
                  {profile.profile?.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-az-glass-border pt-6">
            <h3 className="az-subtitle mb-4 text-az-ink">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="az-body text-az-ink/70">Dark Mode</span>
                <span className="az-body-strong text-az-ink-dim">
                  {profile.preferences?.darkMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="az-body text-az-ink/70">Email Notifications</span>
                <span className="az-body-strong text-az-ink-dim">
                  {profile.preferences?.notifications?.email ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="az-body text-az-ink/70">Push Notifications</span>
                <span className="az-body-strong text-az-ink-dim">
                  {profile.preferences?.notifications?.push ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <ErrorState
          title="Profile unavailable"
          description="Unable to load profile data. Please try again later."
        />
      )}
    </PageShell>
  );
}
