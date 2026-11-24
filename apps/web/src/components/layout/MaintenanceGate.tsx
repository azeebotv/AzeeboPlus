'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlags } from '../../context/FlagsContext';
import { WEB_FLAG_KEYS } from '../../lib/flags';

/**
 * Renders children normally, but when the server-evaluated
 * `web_maintenance_mode` flag is enabled it replaces the current route with the
 * /maintenance page (which itself stays reachable so users can see the notice).
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { ready, isEnabled } = useFlags();
  const pathname = usePathname();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!ready || redirected.current) return;
    if (pathname === '/maintenance') return;
    if (isEnabled(WEB_FLAG_KEYS.maintenanceMode)) {
      redirected.current = true;
      router.replace('/maintenance');
    }
  }, [ready, isEnabled, pathname, router]);

  return <>{children}</>;
}
