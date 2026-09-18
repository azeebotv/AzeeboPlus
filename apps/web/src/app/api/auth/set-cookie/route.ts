import { NextRequest, NextResponse } from 'next/server';

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

    // Non-HttpOnly cookie for middleware auth check
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      response.cookies.set('auth', payload.sub || payload.userId || '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60,
      });
    } catch {
      response.cookies.set('auth', 'authenticated', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to set cookie' }, { status: 500 });
  }
}
