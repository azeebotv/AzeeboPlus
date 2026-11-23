import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, LEGACY_AUTH_COOKIE, isAuthMarkerValid } from './lib/cookie-names';

/**
 * Middleware: Homepage Routing + Role-Based Access Control + Auth Guard.
 *
 * Homepage routing:
 *   - / (legacy homepage) → redirect authenticated users to /home
 *   - /home (redesigned homepage) → redirect unauthenticated users to /
 *
 * SECURITY: Uses Next.js `auth` cookie to check authentication status.
 * This cookie is set/cleared by AuthContext on login/logout and survives
 * page refreshes because it's a persistent cookie (not httpOnly).
 *
 * Protected routes redirect to /auth/login only if the user is not authenticated.
 * Role checks are handled client-side in AuthContext (SSR role not yet assigned at middleware time).
 *
 * 2FA redirect is handled client-side by AuthContext to avoid redirect loops
 * on page refresh (middleware runs before client-side token refresh completes).
 */

const protectedRoutes = [
  '/dashboard',
  '/rewards',
  '/subscriptions',
  '/notifications',
  '/messaging',
  '/messages',
  '/settings',
  '/wallet',
  // Public /borrow stays anonymous; only the signed-in account view is gated.
  '/borrow/account',
  '/content',
  '/payment',
  '/referral',
  '/library',
  '/downloads',
];
const adminRoutes = ['/admin'];

// Standalone app hosts (set via env vars in production)
const ADMIN_HOST = process.env.ADMIN_APP_URL || 'http://localhost:5173';
const CREATOR_HOST = process.env.CREATOR_APP_URL || 'http://localhost:5174';

/**
 * The standalone portals are mounted at their own origin root (admin Vite
 * routes are `/overview`, `/users`, …), while this app owns the `/admin` and
 * `/creator` prefixes. Redirecting with the prefix intact lands on a path the
 * portal has no route for, which renders an empty document — so strip it.
 */
function portalPath(pathname: string, prefix: string): string {
  const stripped = pathname.slice(prefix.length);
  if (!stripped) return '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProd = process.env.NODE_ENV === 'production';

  // Security headers applied to all responses
  const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    'X-DNS-Prefetch-Control': 'on',
  };

  if (isProd) {
    securityHeaders['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  // AUD-06: fresh per-request CSP nonce. Production `script-src` no longer
  // contains 'unsafe-inline' — inline scripts execute only with this nonce.
  // Next.js parses the nonce from the *request-side* CSP during SSR and stamps
  // it on its framework/inline <script> tags, so the policy is forwarded on
  // the request as well (see passThrough below); the response copy is what the
  // browser enforces. Nonces require per-request rendering: the root layout
  // sets `export const dynamic = 'force-dynamic'`, otherwise prerendered HTML
  // is baked without nonce attributes and every script would be blocked.
  // (docs: nextjs.org/docs/app/guides/content-security-policy)
  const nonce = btoa(crypto.randomUUID());

  // Content-Security-Policy
  const cspDirectives = [
    "default-src 'self'",
    // AUD-06: nonce gates inline scripts ('unsafe-inline' removed). The host
    // allow-list stays for legacy nonce-incapable browsers; dev keeps
    // 'unsafe-eval' because React's debug tooling requires it (prod does not).
    `script-src 'self' 'nonce-${nonce}'${isProd ? '' : " 'unsafe-eval'"} https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.azeeboplus.com https://*.cloudfront.net https://*.ytimg.com https://images.unsplash.com http://localhost:*",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* ws://localhost:* ws: wss: https://*.azeeboplus.com https://api.stripe.com https://api.paystack.co https://api.flutterwave.com https://www.google-analytics.com https://*.amazonaws.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    // AUD-06: was an open `https:` wildcard (arbitrary remote media). Playback
    // only comes from our CDN domains, S3 presigned URLs (same origins already
    // trusted in connect-src) and localhost in development (img-src parity).
    "media-src 'self' data: blob: https://*.azeeboplus.com https://*.cloudfront.net https://*.amazonaws.com http://localhost:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  securityHeaders['Content-Security-Policy'] = cspDirectives;

  // Request-side copy: Next.js extracts 'nonce-…' from the CSP on the
  // incoming request to nonce the scripts it renders (x-nonce also exposes it
  // to app code via headers(), e.g. for next/script or JSON-LD tags).
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('Content-Security-Policy', cspDirectives);
  forwardedHeaders.set('x-nonce', nonce);

  // Document pass-throughs must carry the request-side policy so the nonces
  // SSR stamps on <script> tags match the CSP the browser enforces. Redirects
  // render no HTML, so they only need the response headers.
  const passThrough = (): NextResponse =>
    NextResponse.next({ request: { headers: forwardedHeaders } });

  // Check if the user is authenticated using the namespaced auth marker
  // cookie (host-scoped cookie safety — see lib/cookie-names.ts). The bare
  // `auth` name is shared by every localhost app and foreign tooling has
  // planted email-valued `auth` cookies that clobbered real sessions.
  const authCookie = request.cookies.get(AUTH_COOKIE);
  // The marker lives 15 minutes and the access cookie with it, but the httpOnly
  // refresh cookie outlives both — and middleware sees httpOnly cookies. A page
  // load carrying any token cookie is a recoverable session: bounce it to login
  // and the user is locked out of a session the client probe would happily
  // restore. Marker-only evidence was what made every reload look logged out.
  const isAuthenticated =
    isAuthMarkerValid(authCookie?.value) ||
    request.cookies.has('access_token') ||
    request.cookies.has('refresh_token');

  // A legacy/foreign bare `auth` cookie must never count as a session. When
  // present alongside an unauthenticated request, sweep it out of the jar on
  // every response so it stops surviving page loads. Applied inside
  // addSecurityHeaders because every return path flows through it.
  const sweepLegacyAuthCookie = request.cookies.has(LEGACY_AUTH_COOKIE) && !isAuthenticated;

  // Helper to add security & edge caching headers to response
  const addSecurityHeaders = (response: NextResponse): NextResponse => {
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    if (sweepLegacyAuthCookie) {
      response.cookies.set(LEGACY_AUTH_COOKIE, '', {
        maxAge: 0,
        path: '/',
      });
    }

    // Edge CDN & Browser Caching Policy
    const isPublicCatalog =
      !isAuthenticated &&
      (pathname === '/' ||
        pathname.startsWith('/movies') ||
        pathname.startsWith('/comedy') ||
        pathname.startsWith('/reality') ||
        pathname.startsWith('/sports') ||
        pathname.startsWith('/lifestyle') ||
        pathname.startsWith('/games') ||
        pathname.startsWith('/creators') ||
        pathname.startsWith('/live-events'));

    if (isPublicCatalog) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      );
      response.headers.set('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    } else if (isAuthenticated) {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }

    return response;
  };

  // Allow public routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'
  ) {
    return addSecurityHeaders(passThrough());
  }

  // --- Homepage routing guards ---
  if (pathname === '/') {
    // Authenticated users should see the redesigned homepage
    if (isAuthenticated) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/home', request.url)));
    }
    // Guest users see the legacy homepage — no redirect
    return addSecurityHeaders(passThrough());
  }

  if (pathname === '/home') {
    // Unauthenticated users should see the legacy homepage
    if (!isAuthenticated) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
    }
    // Authenticated users see the redesigned homepage — no redirect
    return addSecurityHeaders(passThrough());
  }

  // --- Admin route redirect to standalone app ---
  // Redirect admin pages to the standalone admin portal
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Preserve the path *below* /admin; the portal routes from its own root.
    const adminUrl = new URL(portalPath(pathname, '/admin'), ADMIN_HOST);
    return addSecurityHeaders(NextResponse.redirect(adminUrl));
  }

  // --- Creator portal redirect to standalone app ---
  // Redirect creator portal pages (/creator or /creators/dashboard) to standalone app,
  // while preserving public /creators discovery directory in web app.
  if (
    pathname === '/creator' ||
    pathname.startsWith('/creator/') ||
    pathname.startsWith('/creators/dashboard') ||
    pathname.startsWith('/creators/earnings') ||
    pathname.startsWith('/creators/monetization') ||
    pathname.startsWith('/creators/upload')
  ) {
    // Preserve the path below /creator (or /creators/dashboard) — the portal
    // routes from its own root, where the dashboard is the index route.
    const creatorUrl = pathname.startsWith('/creators/dashboard')
      ? new URL('/', CREATOR_HOST)
      : pathname.startsWith('/creators/')
        ? new URL(portalPath(pathname, '/creators'), CREATOR_HOST)
        : new URL(portalPath(pathname, '/creator'), CREATOR_HOST);
    return addSecurityHeaders(NextResponse.redirect(creatorUrl));
  }

  // --- Protected route guards ---
  if (!isAuthenticated) {
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }
  return addSecurityHeaders(passThrough());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|sw.js).*)',
  ],
};
