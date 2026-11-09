import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookie-response';

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

    // HttpOnly cookies — not accessible via JavaScript (prevents XSS theft).
    // `strict` is right here: this runs from a same-site XHR on the login page.
    if (!applyAuthCookies(response, { token, refreshToken })) {
      return NextResponse.json({ success: false, error: 'Invalid token format' }, { status: 400 });
    }

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to set cookie' }, { status: 500 });
  }
}
