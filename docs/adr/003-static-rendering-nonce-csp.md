# ADR-003: Re-enabling Static/ISR Rendering Under a Nonce-Based CSP

## Status

Proposed — design record for the AUD-16 remediation. Implementation is a
dedicated follow-up; nothing in this ADR has landed yet.

## Context

`apps/web/src/middleware.ts` mints a fresh CSP nonce per request
(`btoa(crypto.randomUUID())`) and serves a `script-src` policy **without**
`'unsafe-inline'`. Next.js reads the request-side CSP during SSR and stamps the
nonce onto inline script tags. Because prerendered HTML is baked without nonce
attributes, `apps/web/src/app/layout.tsx` sets `export const dynamic =
'force-dynamic'`, which cascades to all ~220 routes: zero SSG/ISR site-wide,
poor TTFB, and uncacheable HTML (AUD-16).

The nonce also means every request is unique, so CDNs cannot cache any HTML
today even when `force-dynamic` were lifted naively.

## Decision

Re-enable static rendering in two stages, keeping `'unsafe-inline'` out of
production `script-src` at every stage.

### Stage 1 — hash-based static CSP for prerendered routes

1. At build time, after `next build`, collect the inline `<script>` blocks of
   each prerendered page (a small post-build script parses
   `.next/server/app/**/*.html`) and compute their SHA-256 hashes.
2. Emit those hashes into a static CSP for prerendered routes:
   `script-src 'self' 'sha256-…' …` served by the middleware only when the
   response is a cached/prerendered document (route is not in the dynamic set).
3. Nonce CSP remains in force for every dynamic route — no behavior change
   there.

### Stage 2 — per-segment opt-in to static/ISR

1. Remove `force-dynamic` from the root layout; instead mark the dynamic
   surface explicitly: auth, wallet, account, and anything reading cookies via
   a shared `export const dynamic = 'force-dynamic'` in the segments that need
   it (most already are `'use client'` pages whose data fetches client-side —
   they can be static shells).
2. Content routes opt into `revalidate` (ISR) — they fetch public gateway data
   only.
3. Middleware skips nonce minting for static hits (Next serves them from
   cache without re-running the page), and the hash-CSP from Stage 1 applies.

### Rollout order

1. Static marketing/universe landing pages (no cookies).
2. Public content detail pages (the AUD-17 server shells already added —
   `movies/[id]`, `lifestyle/events/[id]`, music tracks/artists,
   `reality/contestant/[id]` — fetch with `revalidate` and are safe first).
3. Remaining client-shell pages once their data needs are confirmed public.
4. Never: auth/wallet/session flows.

## Verification

- `next build` output must show `○ ISR`/`● SSG` for the opted-in routes and
  `ƒ Dynamic` only for the explicit set.
- A Playwright check asserts prerendered HTML carries the hash CSP and that
  inline scripts still execute (no console CSP violations).
- Lighthouse TTFB budget check on a sample of landing pages.

## Consequences

- Crawlability/TTFB improve for the SEO-critical surface (AUD-16/AUD-17/AUD-65
  compound).
- Two CSP modes to maintain in middleware (hash vs nonce) — mitigated by
  generating hashes at build time and failing the build if generation fails.
- Cached HTML must never embed user-specific data — enforced by keeping
  auth-touching segments explicitly dynamic.
