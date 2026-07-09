'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import OptimizedImage from '@/components/OptimizedImage';

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
  const { data: profile, isLoading, error } = useQuery<UserProfileData | null>({
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
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#E8420A' }}
          >
            Account
          </p>
          <h1 className="az-headline text-white text-3xl sm:text-4xl">Your Profile</h1>
        </motion.div>

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
          />
        ) : profile ? (
          <motion.div
            className="az-glass p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {profile.profile?.avatar ? (
                <OptimizedImage
                  src={profile.profile.avatar}
                  alt={profile.profile.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                  }}
                >
                  {profile.profile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {profile.profile?.displayName || 'User'}
                </h2>
                <p className="text-white/50 mb-3">{profile.profile?.email}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background: 'rgba(232,66,10,0.15)',
                      color: '#E8420A',
                    }}
                  >
                    {profile.profile?.role || 'user'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/70">Dark Mode</span>
                  <span className="text-white/40 text-sm">
                    {profile.preferences?.darkMode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/70">Email Notifications</span>
                  <span className="text-white/40 text-sm">
                    {profile.preferences?.notifications?.email ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/70">Push Notifications</span>
                  <span className="text-white/40 text-sm">
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
      </main>

      <AppFooter />
    </div>
  );
}
