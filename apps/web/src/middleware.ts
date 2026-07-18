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
  '/creator',
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
const creatorRoutes = ['/creator-portal'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    return NextResponse.next();
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
      return NextResponse.redirect(new URL('/home', request.url));
    }
    // Guest users see the legacy homepage — no redirect
    return NextResponse.next();
  }

  if (pathname === '/home') {
    // Unauthenticated users should see the legacy homepage
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Authenticated users see the redesigned homepage — no redirect
    return NextResponse.next();
  }

  // --- Admin route guards ---
  // SECURITY: Do NOT decode JWT client-side. Role checks are handled server-side.
  // The auth cookie presence is sufficient for routing; server-side APIs verify JWT signatures.
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Role check delegated to server-side API gateway
  }

  // --- Creator portal route guards ---
  if (creatorRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Role check delegated to server-side API gateway
  }

  // --- Protected route guards ---
  if (!isAuthenticated) {
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
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
