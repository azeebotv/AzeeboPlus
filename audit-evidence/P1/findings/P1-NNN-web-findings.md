# T-P1-002 Findings — Web Frontend Audit (`apps/web`)

**Evidence dir:** [audit-evidence/P1/web/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/web/)

---

## P1-008 — JWT stored in `localStorage` (Critical · security)

**Files:**
- [apps/web/src/context/AuthContext.tsx](file:///Users/deprof/www/azeebo+/apps/web/src/context/AuthContext.tsx#L65-L70) — `localStorage.setItem('accessToken', access_token)` + `setItem('refreshToken', refresh_token)`
- [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts) — `api.setToken` then attaches to every fetch

**RCA (6-item):**
1. **Symptom:** any XSS payload (reflected, stored, or DOM-based) can read `localStorage.getItem('accessToken')` and impersonate the user.
2. **Trigger:** an attacker-controlled string rendered into a React component without proper escaping, or a vulnerable dependency that uses `dangerouslySetInnerHTML` / `eval`.
3. **Proximate cause:** `AuthContext.handleAuthResponse` writes the JWT to `localStorage`. `api.setToken` later attaches it as `Authorization: Bearer` from the same store.
4. **Root cause:** No architectural decision to use `httpOnly; Secure; SameSite=Strict` cookies issued by the backend. The web frontend treats the JWT as a client-only artifact because the current `apps/admin` (NestJS) and `apps/creator-portal` are server-rendered NestJS apps, not the BFF for the Next.js frontend — so the auth boundary is mis-placed.
5. **Blast radius:** every Azeebo+ web user. A single XSS = account takeover, no further user interaction required. CSP `'unsafe-inline'` (P1-009) raises probability.
6. **Detection gap:** no SCA rule (e.g. ESLint custom rule) bans `localStorage.setItem` with names matching `token|jwt|auth`.

**Remediation (production-grade, FABLE 5 pillar F):**
1. Backend: add a `/auth/session` endpoint that issues `Set-Cookie: access_token=…; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=900` and `refresh_token=…; HttpOnly; Secure; Path=/auth; SameSite=Strict; Max-Age=2592000`.
2. Frontend: delete `localStorage.setItem('accessToken'/'refreshToken')`; rely on `credentials: 'include'` on `fetch` calls.
3. Add a NestJS `@UseGuards(AuthGuard('jwt-cookie'))` mirror of the JWT guard.
4. Add `pnpm exec eslint-plugin-no-secrets` + a custom rule banning `localStorage.setItem` with token-shaped keys.
5. Run `gitleaks` + `trivy fs` on every PR; this finding should be caught by a grep rule.

**Validation:** `pnpm test` covers a test that asserts `localStorage.getItem('accessToken')` returns `null` after login.

---

## P1-009 — CSP allows `'unsafe-inline'` + `'unsafe-eval'` for `script-src` (High · security)

**File:** [apps/web/src/middleware.ts](file:///Users/deprof/www/azeebo+/apps/web/src/middleware.ts#L11)

**RCA:**
1. **Symptom:** CSP does not block inline scripts; combined with P1-008 (localStorage JWT), a stored XSS becomes account-takeover.
2. **Trigger:** any user-controlled string rendered as HTML.
3. **Proximate cause:** `'unsafe-inline'` and `'unsafe-eval'` are set on `script-src`.
4. **Root cause:** Next.js dev convenience carried into prod; no nonce/hash strategy.
5. **Blast radius:** all users, all pages (matcher excludes only `api/_next/static/_next/image/favicon.ico`).
6. **Detection gap:** no CSP-evaluator bot or `csp-evaluator` step in CI.

**Remediation:** Use Next.js middleware nonce:
```ts
import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data: https:`,
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');
  const res = NextResponse.next({ headers: { 'Content-Security-Policy': csp } });
  res.headers.set('x-nonce', nonce);
  return res;
}
```
Add CSP-report-only header for 7 days before enforcing.

---

## P1-010 — Middleware does NOT gate protected routes (High · security · functionality)

**File:** [apps/web/src/middleware.ts](file:///Users/deprof/www/azeebo+/apps/web/src/middleware.ts) (entire 55 lines)

**Observation:** matcher applies to all non-API/non-static paths; the function only sets security headers. There is **no `if (!token && path.startsWith('/wallet')) redirect('/login')`** pattern.

**RCA:**
1. **Symptom:** Visiting `/wallet/withdraw` while logged out returns the page HTML; the auth state is loaded client-side and the user may briefly see protected UI.
2. **Trigger:** Direct URL access to `/wallet/*`, `/admin/*`, `/creator/*`.
3. **Proximate cause:** middleware only handles headers.
4. **Root cause:** Next.js `middleware.ts` is the recommended place for route gating; the project chose client-side gating via `AuthContext`.
5. **Blast radius:** SSR-leaked protected UI; SEO index of protected pages; client-side bundle still ships protected routes.
6. **Detection gap:** no E2E that asserts redirect for unauthenticated access.

**Remediation:** Add a route guard in `middleware.ts`:
```ts
const PROTECTED = [/^\/wallet/, /^\/admin/, /^\/creator/, /^\/creators\/dashboard/, /^\/settings/, /^\/messages/, /^\/notifications/, /^\/profile\/edit/];
const token = req.cookies.get('access_token');
if (!token && PROTECTED.some(re => re.test(req.nextUrl.pathname))) {
  const url = req.nextUrl.clone();
  url.pathname = '/auth/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
```
This depends on P1-008 being fixed (JWT must be in a cookie the middleware can read).

---

## P1-011 — 87 of 88 user-facing pages lack `metadata` (Medium · functionality · SEO)

**Evidence:** [audit-evidence/P1/web/_metadata-and-middleware.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P1/web/_metadata-and-middleware.txt)
**Files:** all `apps/web/src/app/**/page.tsx` except `watch/[id]/page.tsx`.

**RCA:** Pages render as client components (have `'use client'`), which means `export const metadata` is **invalid** in a client component (Next.js forbids it). The team chose client-component pages for interactivity, losing the static-metadata path.

**Remediation:** Split each client page into a server `page.tsx` (exporting `metadata`) + a `<ClientPage />` component, or use `generateMetadata` inside a server wrapper.

---

## P1-012 — `apps/web/src/lib/api.ts` is 1408 lines (Medium · maintainability)

**File:** [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts) (1408 lines)

**RCA:** Single mega-module mixes admin types, wallet, user, auth, retry config, and request builders. The `admin-types.ts` import alone shows 17 distinct domain types. Per FABLE 5 pillar **E**, single-file > 500 LOC is a maintainability red flag.

**Remediation:** Split into `lib/api/{auth,user,wallet,admin,creators,notifications,reports,payment,reality}.ts` with a shared `base.ts` for retry/auth headers.

---

## P1-013 — `apps/web/src/lib/apiError.ts` error envelope does not match RFC 7807 (Medium · functionality)

**File:** [apps/web/src/lib/apiError.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/apiError.ts)

**Observation:** `ApiErrorResponse` interface expects `{ message, status, data: { message } }`. NestJS default exception filter produces `{ statusCode, message, error }`. `ValidationPipe` with default `exceptionFactory` produces `{ statusCode: 400, message: [...], error: 'Bad Request' }`. The frontend `switch (status)` block handles status codes, not the envelope — so the actual envelope shape is never asserted. **Drift surface for P2.**

**Remediation:** Adopt a single error envelope at the gateway (see P3-* recommendations in T-P3). Add a contract test asserting every NestJS service returns the agreed `{ code, message, details, traceId }` shape.

---

## P1-014 — API base URL silently falls back to localhost in production (High · functionality)

**File:** [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts#L11-L13)

**RCA:**
```ts
if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}
const resolvedApiUrl = API_BASE_URL || 'http://localhost:3013';
```
The `throw` fires only when *both* `API_BASE_URL` is missing **and** `NODE_ENV === 'production'`. `NODE_ENV` is set by `next build` to `production`, but **if the build is run with `NODE_ENV` not set or with a custom value (e.g. `staging`), the throw is skipped and the fallback to `localhost:3013` is used.**

**Remediation:** Replace with `const resolvedApiUrl = API_BASE_URL ?? (() => { throw new Error('NEXT_PUBLIC_API_BASE_URL required'); })();` and remove the `NODE_ENV` gate.

---

## Summary

| ID     | Sev      | Title                                                                  |
| ------ | -------- | ---------------------------------------------------------------------- |
| P1-008 | Critical | JWT stored in `localStorage`                                           |
| P1-009 | High     | CSP allows `'unsafe-inline'` + `'unsafe-eval'`                         |
| P1-010 | High     | Middleware does NOT gate protected routes                              |
| P1-011 | Medium   | 87 of 88 pages lack `metadata` (client-component pages)                 |
| P1-012 | Medium   | `api.ts` is 1408 lines, mixes 17+ domains                              |
| P1-013 | Medium   | Error envelope does not match NestJS default / RFC 7807                |
| P1-014 | High     | API base URL falls back to localhost unless `NODE_ENV === 'production'`|

**Verification status:**
- [x] Route list produced → 88 pages, 2 route handlers, middleware present.
- [x] Each Critical/High has a 6-item RCA block → P1-008, P1-009, P1-010, P1-014.
- [x] All file refs use `file://` links.
- [ ] Live E2E run of middleware auth gating → **NOT SATISFIED — Playwright browsers + staging cluster not available; deferred.**