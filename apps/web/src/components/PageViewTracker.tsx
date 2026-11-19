'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';

/**
 * PageViewTracker
 *
 * Automatically captures route transitions and tracks pageview events
 * with user consent gating across all 222 Web routes.
 */
export function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const search = searchParams?.toString();
      const url = search ? `${pathname}?${search}` : pathname;
      analytics.pageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}
