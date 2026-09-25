'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import GuestHomepage from '../components/homepage/GuestHomepage';
import analytics from '@/lib/analytics';
import { webLogger } from '@/lib/logger';

/**
 * Root homepage (/) — Legacy homepage for guest (unauthenticated) users.
 *
 * Server-side guard: middleware redirects authenticated users to /home
 * when they visit / (see middleware.ts).
 * Client-side guard: if auth state resolves to authenticated, redirect
 * to /home. This handles cases where the cookie exists but the user
 * just logged in and the middleware hasn't caught it yet.
 *
 * The legacy homepage shows a public-facing experience with trending
 * content previews, category browsing, and sign-up CTAs.
 */
export default function Home(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Log homepage access
  useEffect(() => {
    if (!isLoading) {
      webLogger.log('[Homepage] Legacy homepage accessed', {
        isAuthenticated,
        path: '/',
      });
      analytics.homepageAccessed('/', isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  // Client-side guard: redirect authenticated users to redesigned homepage
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      webLogger.log('[Homepage] Authenticated user on / — redirecting to /home', {
        path: '/',
      });
      analytics.homepageRedirected('/', '/home', 'authenticated_user_on_legacy');
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state: minimal skeleton to avoid layout shift
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--hp-bg)' }}>
        <div
          className="w-full flex items-center justify-center"
          style={{
            minHeight: 'min(70vh, 600px)',
            background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <div
              className="w-12 h-12 border-2 border-white/20 border-t-[var(--brand-orange)] rounded-full animate-spin"
              role="status"
              aria-label="Loading homepage"
            />
          </div>
        </div>
      </div>
    );
  }

  // Authenticated users should not see this page — show nothing while redirecting
  if (isAuthenticated) {
    return <></>;
  }

  return <GuestHomepage />;
}
