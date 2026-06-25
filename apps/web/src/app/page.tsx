'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '@/hooks/useDatabase';
import GuestHomepage from '../components/homepage/GuestHomepage';
import AuthenticatedHomepage from '../components/homepage/AuthenticatedHomepage';
import analytics from '@/lib/analytics';

/**
 * Root homepage — serves distinct experiences based on authentication status.
 *
 * While the auth session is loading (`isLoading === true`), we render a minimal
 * skeleton to avoid layout shift. Once resolved, we render the appropriate
 * homepage variant. When the user logs in or out, the AuthContext state changes
 * and this component re-renders with the new variant — no full page reload needed.
 */
export default function Home(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');

  // Track which version is served
  useEffect(() => {
    if (!isLoading) {
      analytics.homepageVersionServed(isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  // Loading state: minimal skeleton to avoid layout shift
  if (isLoading) {
    return (
      <div className="min-h-screen az-nollywood-bg">
        <div
          className="w-full"
          style={{ minHeight: 'min(70vh, 600px)', background: '#0D3B2E' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <div
              className="w-12 h-12 border-2 border-white/30 border-t-[var(--brand-orange)] rounded-full animate-spin"
              role="status"
              aria-label="Loading homepage"
            />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomepage siteName={siteName} />;
  }

  return <GuestHomepage />;
}
