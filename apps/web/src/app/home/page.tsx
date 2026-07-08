'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useDatabase';
import { Spinner } from '@azeebo/ui/web';
import AuthenticatedHomepage from '@/components/homepage/AuthenticatedHomepage';
import LoginPrompt from '@/components/homepage/LoginPrompt';
import analytics from '@/lib/analytics';
import { webLogger } from '@/lib/logger';

/**
 * /home — Redesigned homepage for authenticated users only.
 *
 * Server-side guard: middleware redirects unauthenticated users to /.
 * Client-side guard: if auth state resolves to unauthenticated, show a
 * login prompt overlay and redirect after a short delay. This handles
 * cases where the auth cookie is stale or the session expired.
 */
export default function AuthenticatedHomePage(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const { getSetting } = useSettings();
  const router = useRouter();
  const siteName = getSetting('site_name', 'Azeebo+');

  // Log homepage access
  useEffect(() => {
    if (!isLoading) {
      webLogger.log('[Homepage] Authenticated homepage accessed', {
        isAuthenticated,
        path: '/home',
      });
      analytics.homepageAccessed('/home', isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  // Client-side guard: redirect guests to legacy homepage
  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    webLogger.warn('[Homepage] Unauthenticated user accessed /home — redirecting to /', {
      path: '/home',
    });
    analytics.homepageRedirected('/home', '/', 'unauthenticated_user_on_redesigned');
    const timer = setTimeout(() => {
      router.replace('/');
    }, 4000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen az-nollywood-bg">
        <div className="w-full" style={{ minHeight: 'min(70vh, 600px)', background: '#0D3B2E' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <Spinner size="lg" color="var(--brand-orange)" className="opacity-60" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: show login prompt while redirecting
  if (!isAuthenticated) {
    return (
      <LoginPrompt
        siteName={siteName}
        onLogin={() => router.push('/auth/login?redirect=/home')}
        onGoHome={() => router.replace('/')}
      />
    );
  }

  return <AuthenticatedHomepage siteName={siteName} />;
}
