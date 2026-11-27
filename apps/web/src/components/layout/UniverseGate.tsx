'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlags } from '../../context/FlagsContext';
import { UNIVERSE_SLUGS } from '../../lib/flags';

/**
 * Web route segment → canonical universe slug (`UNIVERSE_SLUGS`). `/movies`
 * serves the `movie` universe; `/creator` and `/creators` are excluded on
 * purpose — creator is a role surface, not a browsable universe, and the
 * gateway universe gate keeps those APIs reachable regardless.
 */
const ROUTE_SLUGS: Record<string, string> = {
  reality: 'reality',
  comedy: 'comedy',
  sports: 'sports',
  vertical: 'vertical',
  movies: 'movie',
  games: 'games',
  lifestyle: 'lifestyle',
  music: 'music',
};

/**
 * Server-driven universe visibility: when the `universe.<slug>.enabled`
 * sentinel for the current segment evaluates disabled (admin toggle via
 * /feature-flags/bootstrap), redirect the visitor to the home page instead
 * of rendering a universe that is supposed to be hidden. Like MaintenanceGate
 * it stays invisible until bootstrap is ready — `universeEnabled` is false
 * both for "disabled" and "not loaded yet", so `ready` gates the redirect.
 */
export function UniverseGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { ready, universeEnabled } = useFlags();
  const pathname = usePathname();
  const router = useRouter();
  const redirectedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const segment = pathname.split('/')[1] ?? '';
    const slug = ROUTE_SLUGS[segment];
    if (!slug || !UNIVERSE_SLUGS.includes(slug as (typeof UNIVERSE_SLUGS)[number])) return;
    if (universeEnabled(slug)) return;
    if (redirectedPath.current === pathname) return;
    redirectedPath.current = pathname;
    router.replace('/');
  }, [ready, universeEnabled, pathname, router]);

  return <>{children}</>;
}
