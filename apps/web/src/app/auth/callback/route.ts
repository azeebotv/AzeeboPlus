import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookie-response';
import { safeRedirectTarget } from '@/lib/first-party-redirect';
import type { SocialAuthErrorCode } from '@/lib/social-auth-errors';

/**
 * OAuth browser return point (AUD-80 / prd-social-login.md FR-2).
 *
 * Both providers land here, but not the same way:
 *   - Google  → `GET /auth/callback?code=…&state=…`
 *   - Apple   → `POST /auth/callback` with a form-urlencoded body
 *               (`response_mode=form_post`), which is why this file exports POST
 *               as well as GET. A page component could not receive it.
 *
 * This route takes precedence over the `/auth/:path*` rewrite in
 * next.config.js because filesystem routes are resolved before rewrites.
 *
 * Responsibilities, in order: exchange the code with the auth service, write the
 * same httpOnly jar the password login writes, then navigate. Every failure
 * path goes back to the login page with a mapped message — never raw JSON.
 */

const LOGIN_PATH = '/auth/login';

function gatewayBaseUrl(): string {
  // Same default as the next.config.js rewrite, so a dev box without the env
  // var still points at the same place the proxy does.
  return (process.env.API_GATEWAY_URL || 'http://localhost:3013').replace(/\/+$/, '');
}

function toLogin(request: NextRequest, code: SocialAuthErrorCode): NextResponse {
  const url = new URL(LOGIN_PATH, request.nextUrl.origin);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url, 303);
}

/** Maps a provider `error` value to one of our fixed codes. */
function providerErrorCode(error: string): SocialAuthErrorCode {
  return error === 'access_denied' || error === 'user_cancelled_authorize'
    ? 'cancelled'
    : 'exchange_failed';
}

/** Maps an auth-service HTTP status to one of our fixed codes. */
function statusErrorCode(status: number): SocialAuthErrorCode {
  switch (status) {
    case 400:
      return 'state_invalid';
    case 409:
      return 'account_conflict';
    case 503:
      return 'unavailable';
    default:
      return 'exchange_failed';
  }
}

interface CallbackPayload {
  success?: boolean;
  data?: { access_token?: string; refresh_token?: string };
  redirect?: string;
}

async function completeLogin(request: NextRequest, params: URLSearchParams): Promise<NextResponse> {
  const providerError = params.get('error');
  if (providerError) {
    return toLogin(request, providerErrorCode(providerError));
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) {
    return toLogin(request, 'state_invalid');
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${gatewayBaseUrl()}/api/v1/auth/social/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
      cache: 'no-store',
    });
  } catch {
    // Network/DNS failure — the provider outage case, not a user error.
    return toLogin(request, 'unavailable');
  }

  if (!upstream.ok) {
    return toLogin(request, statusErrorCode(upstream.status));
  }

  let payload: CallbackPayload;
  try {
    payload = (await upstream.json()) as CallbackPayload;
  } catch {
    return toLogin(request, 'exchange_failed');
  }

  const token = payload.data?.access_token;
  if (!token) {
    return toLogin(request, 'exchange_failed');
  }

  // The return target came from the server-side state record, but re-validating
  // here keeps the allowlist in exactly one place (lib/first-party-redirect).
  const target = safeRedirectTarget(payload.redirect ?? null);
  const response = NextResponse.redirect(new URL(target, request.nextUrl.origin), 303);

  // `lax`, not the default `strict`: this response is reached through a
  // cross-site redirect chain, and strict cookies would be withheld on the
  // first navigation back into the app.
  const applied = applyAuthCookies(
    response,
    { token, refreshToken: payload.data?.refresh_token },
    { sameSite: 'lax' }
  );

  return applied ? response : toLogin(request, 'exchange_failed');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return completeLogin(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let form: FormData;
  try {
    // The runtime object is a fetch FormData; the annotation pins the DOM lib
    // type so iteration type-checks under both the Node and DOM declarations.
    form = (await request.formData()) as unknown as FormData;
  } catch {
    return toLogin(request, 'state_invalid');
  }

  // Flatten to the same shape GET receives so one implementation serves both.
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') {
      params.set(key, value);
    }
  }

  return completeLogin(request, params);
}
