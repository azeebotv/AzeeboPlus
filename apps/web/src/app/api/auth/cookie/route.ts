import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, LEGACY_AUTH_CLEAR_HEADER } from '@/lib/cookie-names';

function isValidJwt(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    // Verify each part is valid base64url
    for (const part of parts) {
      if (!part) return false;
      // Check it only contains valid base64url characters
      if (!/^[A-Za-z0-9_-]+$/.test(part)) return false;
    }
    // Decode payload to check it's valid JSON with expected fields
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    // Must have exp (expiration) claim
    if (typeof payload.exp !== 'number') return false;
    // Token must not be expired
    if (payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { token, maxAge } = await request.json();

  // Validate token is a properly formatted, non-expired JWT
  if (!isValidJwt(token)) {
    return NextResponse.json({ success: false, error: 'Invalid token format' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${AUTH_COOKIE}=${encodeURIComponent(token)}`,
    'path=/',
    `max-age=${maxAge || 1800}`,
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
    isProduction ? 'HttpOnly' : '',
  ]
    .filter(Boolean)
    .join('; ');

  response.headers.append('Set-Cookie', cookieOptions);
  // Self-heal: expire any legacy/foreign bare `auth` cookie in the jar.
  response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`);
  response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);
  return response;
}
