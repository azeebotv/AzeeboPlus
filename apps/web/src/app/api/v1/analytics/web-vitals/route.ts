import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    // Optional forward to analytics-service if configured
    const analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';
    try {
      await fetch(`${analyticsUrl}/v1/analytics/web-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {
        // Analytics upstream offline or best-effort
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ success: true, received: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 }); // Best-effort vitals never fail client
  }
}
