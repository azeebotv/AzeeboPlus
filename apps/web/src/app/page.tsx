'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import analytics from '@/lib/analytics';
import { webLogger } from '@/lib/logger';

/** Shown while the guest homepage chunk loads and while auth resolves. */
function HomepageLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-az-surface-root">
      <div className="flex min-h-[min(70vh,600px)] w-full items-center justify-center bg-gradient-to-b from-az-surface-panel to-az-surface-root">
        <div className="flex h-full w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div
            className="size-12 animate-spin rounded-full border-2 border-az-ink/20 border-t-az-flame"
            role="status"
            aria-label="Loading homepage"
          />
        </div>
      </div>
    </div>
  );
}

const GuestHomepage = dynamic(() => import('../components/homepage/GuestHomepage'), {
  loading: HomepageLoadingSkeleton,
});

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
    return <HomepageLoadingSkeleton />;
  }

  // Authenticated users should not see this page — show nothing while redirecting
  if (isAuthenticated) {
    return <></>;
  }

  return <GuestHomepage />;
}
