import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

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
