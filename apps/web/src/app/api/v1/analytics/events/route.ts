import { NextResponse, type NextRequest } from 'next/server';

import { CONSENT_COOKIE, CONSENT_VERSION, parseConsentValue } from '@/lib/consent';

/**
 * AUD-45: consent-enforced ingest relay for the analytics SDK. The shared
 * `__Host-azeebo_consent` cookie is authoritative — the consent block in the
 * request body is client-controlled, so it is overwritten with the cookie's
 * truth before forwarding. Batches without a current analytics grant are
 * dropped (204) and never reach the analytics service's PII store.
 */
export async function POST(request: NextRequest) {
  const consent = parseConsentValue(request.cookies.get(CONSENT_COOKIE)?.value);
  if (!consent || consent.version !== CONSENT_VERSION || consent.analytics !== true) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = {
    ...(typeof body === 'object' && body !== null ? body : {}),
    consent: {
      analytics: true,
      marketing: consent.marketing === true,
      personalization: false,
      third_party: false,
    },
    consentVersion: CONSENT_VERSION,
  };

  const analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';
  try {
    await fetch(`${analyticsUrl}/v1/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Analytics upstream offline or best-effort
    });
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true, received: true });
}
