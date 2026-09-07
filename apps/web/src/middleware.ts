import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/content',
  '/payment',
];
const adminRoutes = ['/admin'];

// Standalone app hosts (set via env vars in production)
const ADMIN_HOST = process.env.ADMIN_APP_URL || 'http://localhost:4100';
const CREATOR_HOST = process.env.CREATOR_APP_URL || 'http://localhost:4104';

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

  // Content-Security-Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http://localhost:*",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://localhost:* ws://localhost:* ws: wss: https: https://*.azeeboplus.com https://api.stripe.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src 'self' https: blob: data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  securityHeaders['Content-Security-Policy'] = cspDirectives;

  // Helper to add security headers to response
  const addSecurityHeaders = (response: NextResponse): NextResponse => {
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
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
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico'
  ) {
    return addSecurityHeaders(NextResponse.next());
  }
  // Check if the user is authenticated using the 'auth' cookie.
  // The cookie contains the user ID set by AuthContext on login.
  // Validate the cookie has a non-empty value to prevent bypass via empty cookies.
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = Boolean(authCookie?.value && authCookie.value.length > 0);

  // --- Homepage routing guards ---
  if (pathname === '/') {
    // Authenticated users should see the redesigned homepage
    if (isAuthenticated) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/home', request.url)));
    }
    // Guest users see the legacy homepage — no redirect
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname === '/home') {
    // Unauthenticated users should see the legacy homepage
    if (!isAuthenticated) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
    }
    // Authenticated users see the redesigned homepage — no redirect
    return addSecurityHeaders(NextResponse.next());
  }

  // --- Admin route redirect to standalone app ---
  // Redirect admin pages to the standalone admin portal
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Preserve the path when redirecting to the standalone admin app
    const adminUrl = new URL(pathname, ADMIN_HOST);
    return addSecurityHeaders(NextResponse.redirect(adminUrl));
  }

  // --- Creator portal redirect to standalone app ---
  // Redirect creator portal pages (/creator or /creators/dashboard) to standalone app,
  // while preserving public /creators discovery directory in web app.
  if (
    pathname === '/creator' ||
    pathname.startsWith('/creator/') ||
    pathname.startsWith('/creators/dashboard')
  ) {
    // Preserve the path when redirecting to the standalone creator app
    const creatorUrl = new URL(pathname, CREATOR_HOST);
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
  return addSecurityHeaders(NextResponse.next());
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
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
