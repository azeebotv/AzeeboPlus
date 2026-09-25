import { NextResponse } from 'next/server';
import { AUTH_COOKIE, LEGACY_AUTH_CLEAR_HEADER } from '@/lib/cookie-names';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
  response.cookies.set(AUTH_COOKIE, '', { maxAge: 0, path: '/' });
  // Also sweep the legacy/foreign bare `auth` cookie on logout.
  response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);

  return response;
}
