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

    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    // Keep the httpOnly refresh cookie (7 days) in sync with rotation so the
    // cookie-first recovery path in lib/api/base.ts keeps working.
    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    // Namespaced middleware marker (host-scoped cookie safety — see
    // lib/cookie-names.ts for why the bare `auth` name must not be used).
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

    // Self-heal: expire any legacy/foreign bare `auth` cookie in the jar.
    response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to refresh cookie' },
      { status: 500 }
    );
  }
}
