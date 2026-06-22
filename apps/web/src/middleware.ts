import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware
 * Implements OWASP recommended security headers
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

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
