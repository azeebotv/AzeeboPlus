import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware
 * Implements OWASP recommended security headers with nonce-based CSP.
 *
 * The CSP nonce is passed to client components via `x-csp-nonce` response header,
 * which can be read by next/head or custom _document to inject into <script> tags.
 *
 * Phase 1: Content-Security-Policy-Report-Only (run for 7 days)
 * Phase 2: Switch to Content-Security-Policy to enforce
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Generate a cryptographically random nonce per request
  const nonce = crypto.randomUUID();

  // Expose nonce to server components and client via response header
  // Next.js layout.tsx can read this via headers() and pass to <Script> components
  response.headers.set('x-csp-nonce', nonce);
  // Also set as a cookie so client components can access it
  response.cookies.set('csp-nonce', nonce, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Content Security Policy (nonce-based, strict-dynamic)
  // Remove 'unsafe-inline' and 'unsafe-eval'; use nonce + strict-dynamic
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `media-src 'self' blob:`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  // Enforce Content-Security-Policy
  response.headers.set('Content-Security-Policy', cspDirectives);

  // Strict Transport Security (HSTS) - 1 year
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // Remove server header
  response.headers.delete('x-powered-by');

  // Route gating: protect authenticated pages
  const protectedPathPrefixes = ['/wallet', '/admin', '/creator', '/settings', '/notifications'];
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedRoute) {
    // Check for access_token cookie (set by HttpOnly cookie flow)
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      // Redirect to login with return path
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
