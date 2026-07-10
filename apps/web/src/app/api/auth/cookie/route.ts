import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token, maxAge } = await request.json();

  const response = NextResponse.json({ success: true });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `auth=${encodeURIComponent(token)}`,
    'path=/',
    `max-age=${maxAge || 1800}`,
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
    isProduction ? 'HttpOnly' : '',
  ]
    .filter(Boolean)
    .join('; ');

  response.headers.append('Set-Cookie', cookieOptions);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', 'auth=; path=/; max-age=0; SameSite=Lax');
  return response;
}
