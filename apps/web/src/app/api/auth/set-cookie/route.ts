import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, LEGACY_AUTH_CLEAR_HEADER } from '@/lib/cookie-names';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, refresh_token: refreshToken } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ success: false, error: 'Invalid token format' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // HttpOnly cookie — not accessible via JavaScript (prevents XSS theft)
    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    // HttpOnly refresh token (7 days) — cookie-first auth in lib/api/base.ts
    // recovers expired sessions by POSTing /auth/refresh with no body; the
    // gateway auth-service falls back to this cookie and the gateway forwards
    // the rotated Set-Cookie pair back. Without it, apiFetch-based pages can
    // never recover a 401 and every header-only retry fails.
    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    // Non-HttpOnly namespaced marker for the middleware auth check. The
    // bare `auth` name is deliberately avoided: it is host-scoped, so other
    // localhost apps / tooling could clobber it (email-valued `auth` cookies
    // have been observed planting themselves into the shared dev jar).
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      response.cookies.set(AUTH_COOKIE, payload.sub || payload.userId || '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60,
      });
    } catch {
      response.cookies.set(AUTH_COOKIE, 'authenticated', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    // Self-heal: expire any legacy/foreign bare `auth` cookie riding along
    // in the shared localhost jar so it can't masquerade as a session.
    response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to set cookie' }, { status: 500 });
  }
}
