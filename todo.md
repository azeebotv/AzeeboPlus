# Azeebo+ — Frontend ↔ Backend Audit & Fix List

> **Audit date:** 2026-08-18 · **Branch:** `Major-Upgrade`
> **Scope:** deep frontend↔backend consistency check — 4 apps, API gateway, 28 services,
> deployment config. Methodology: typecheck/lint baselines, route-call extraction across all
> frontends, comparison against actual NestJS controller routes per service, gateway
> path-strategy analysis, and container env verification. Each finding below was verified
> against code (not just grep).
>
> **Status key:** ⬜ open · 🔧 in progress · ✅ fixed

---

## Phase 1 — Critical gateway / container bugs (fix order 1–4)

### 1. ✅ FIXED — Gateway drops every GET response body on cache miss
`services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts`
`forwardRequest()` returns JSON data for GETs without writing it to `res`; the refactored
`proxyRequest()` only caches the return value. Old code called `res.json(response)` after
caching (verified in git `40eb9e02`); the unified refactor lost it. With
`gateway_response_cache` default ON, the first GET to every endpoint returns an empty
body/hang; only repeat requests within the 5-min TTL work.
**Fix:** send the response after caching + add a regression test asserting the proxied GET
body is delivered.

### 2. 🔧 IN PROGRESS — Gateway CSRF (default ON) blocks mobile + refresh/signup
`common/csrf.middleware.ts` + `app.module.ts`
- Mobile client never sends `X-CSRF-Token` and RN has no cookie jar → no `_csrf` cookie →
  every mobile POST/PUT/PATCH/DELETE → 403.
- Exclusion list excludes `/auth/register` (doesn't exist) instead of `/auth/signup`; refresh
  isn't excluded.
**Fix:** skip CSRF validation when the request carries `Authorization: Bearer` (CSRF only
protects cookie-authenticated flows); correct the exclusion list (add `signup`, `refresh`,
`logout`, `mfa/*`?).

### 3. 🔧 IN PROGRESS — Gateway rejects ALL uploads (multipart → 400)
`common/content-type-validation.middleware.ts`
Requires `application/json` on every POST/PUT/PATCH; web/mobile media uploads and FormData
content creation send `multipart/form-data` → 400 before reaching the service.
**Fix:** allow `multipart/form-data` and `application/x-www-form-urlencoded`.

### 4. 🔧 IN PROGRESS — All-in-one container: admin 502 + creator wrong target
`deploy/entrypoint.sh` + `proxy.controller.ts`
- `ADMIN_SERVICE_URL` never exported → fallback `http://admin-service:4016` unresolvable →
  every `/api/v1/admin/*` → 502.
- `/creator` (creator app :4014) and `/creators` (microservice :3018) share envKey
  `CREATOR_SERVICE_URL`; container sets it to 3018 → `/api/v1/creator/*` hits the wrong
  service.
**Fix:** export `ADMIN_SERVICE_URL=http://localhost:4016` and `CREATOR_APP_URL=
http://localhost:4014`; give the `/creator` route its own `CREATOR_APP_URL` envKey.

---

## Phase 2 — Route/name mismatches (fix order 5–15)

### 5. 🔧 IN PROGRESS — Gateway `/movie` singular vs movie-service `/movies` plural
`proxy.controller.ts` + `guards/gateway-auth.guard.ts`
movie-service controllers are `@Controller('movies')` (URI-versioned). Gateway registers
`/movie` → all web movie pages (`/api/v1/movies/*`) → 404. Smoke test already uses the
correct `/api/v1/movies/health`.
**Fix:** rename gateway route to `/movies`; update auth-guard public patterns.

### 6. 🔧 IN PROGRESS — Mobile subscription screen uses plural `/subscriptions`
`apps/mobile/app/subscription/plans.tsx`
Calls `/api/v1/subscriptions/plans` + `/current`; gateway route is `/subscription` (singular).
**Fix:** use the singular paths (as `src/api/subscription.ts` already does).

### 7. 🔧 IN PROGRESS — Auth MFA/OTP paths never reach auth-service
`services/core/auth-service/src/modules/auth/mfa/mfa.controller.ts` + `otp/otp.controller.ts`
Gateway (and its docs/guards) expect `/v1/auth/mfa/*` and `/v1/auth/otp/*`; controllers are
`@Controller('mfa')` / `@Controller('otp')` → 404. Web `verifyMFA` dead; OTP dead.
**Fix:** prefix controllers `auth/mfa`, `auth/otp` (guards/docs already agree).

### 8. 🔧 IN PROGRESS — Admin Agbala prefix mismatch
`apps/admin/src/modules/vertical/agbala/agbala.controller.ts` (`admin/vertical/agbala`) vs
client `/api/v1/admin/agbala/*` → 404 on every Agbala page.
**Fix:** align controller prefix to `admin/agbala` (client is the only consumer).

### 9. 🔧 IN PROGRESS — `/recommendation/personalized` doesn't exist
`apps/web/src/lib/api/engagement.ts` + `apps/mobile/src/api/engagement.ts`
Service + gateway serve `/personalized-feed`; clients call `/personalized` → 404.
**Fix:** point clients at `/personalized-feed`.

### 10. 🔧 IN PROGRESS — Web games trivia/tournament route drift
`apps/web/src/app/games/trivia/page.tsx`, `apps/web/src/app/games/tournaments/[id]/page.tsx`
Service routes are `/games/categories`, `/games/answer`, `/games/tournaments/:id/enter`;
web calls `/games/trivia/categories`, `/games/trivia/answer`, `/games/tournaments/:id/register`.
**Fix:** align client calls to the service routes (verify request/response shapes).

### 11. 🔧 IN PROGRESS — Mobile engagement bet path
`apps/mobile/src/api/engagement.ts` calls `POST /engagement/predictions/bet`; service has
`POST /predictions`.
**Fix:** point client at `/predictions` (verify DTO).

### 12. 🔧 IN PROGRESS — Smoke-test health names
`scripts/docker-smoke-tests.sh` uses `/api/v1/payment/health` (route `/payments`),
`/api/v1/verticals/health` (route `/vertical`).
**Fix:** correct names (movies is fixed by #5).

### 13. 🔧 IN PROGRESS — Lint red in 16 packages (51 prettier errors)
`pnpm -r lint` fails on flag-metrics, auth, content, referral, reward, analytics, games,
movie, sports, vertical, wallet, payment, comedy (+ smoke-test files).
**Fix:** run `eslint --fix` per package (all prettier-only).

### 14. 🔧 IN PROGRESS — Mobile typecheck: 58 errors (stale refactors)
`cd apps/mobile && tsc --noEmit` fails: `createLogger` (should be `createMobileLogger`) in 5
files, removed price constants (`votePackages`, `paymentPresetAmounts`, `walletLimits`,
`moviePassPrice`, …) in ~10 screens, deleted `src/theme/design-tokens`, `Redirect` from
expo-router, undefined `colors` in `devices.tsx`, missing `platinum` tier color.
**Fix:** update imports to the new APIs; wire mobile into CI typecheck.

### 15. 🔧 IN PROGRESS — Admin/creator dev proxy + cookie auth flow
`apps/admin/client/vite.config.ts` / `apps/creator/client/vite.config.ts` proxy `/api` to the
app's own backend (4016/4014) instead of the gateway (3013); client cookie endpoints
(`/api/v1/auth/cookie`, `/csrf`, `/refresh`) don't exist on the gateway/auth-service.
**Fix:** point dev proxies at the gateway; provide the cookie/csrf/refresh routes the
admin/creator clients call (or fall back to bearer tokens from localStorage).

---

## Phase 3 — Feature gaps (backend endpoints never implemented — need feature work)

### 16. ⬜ Mobile content endpoints missing in content-service (episodes/vote/contestants)
`apps/mobile/src/api/content.ts` calls `/content/episodes/:id`, `/content/:id/episodes`,
`/content/contestants/:id`, `/content/episodes/:id/contestants`, `/content/:id/results`,
`/content/vote`, `/content/super-vote`, `/content/recommendations`. content-service has no
Episode/Contestant/Vote models — these look like mis-targeted reality-service calls.
**Fix (design decision needed):** implement in content-service, or re-point mobile at
reality-service endpoints.

### 17. ⬜ Creator endpoints missing in creator app (drafts/published/monetization/profile/publish)
`apps/mobile/src/api/content.ts` + `apps/web/src/lib/api/creator.ts` call
`/creator/drafts`, `/creator/published`, `/creator/scheduled`, `/creator/monetization`,
`/creator/profile/:id`, `/creator/content/:id/publish`, `/creator/subscribers(/:stats)` —
creator app (4014) has none of these.

### 18. ⬜ Web challenges endpoints missing (no gateway `/challenges` route)
`apps/web/src/lib/api/creator.ts`: `/challenges/active`, `/challenges/my-submissions`,
`/challenges/submit`. creator-service has `/creators/challenges` + `/participate` only.

### 19. ⬜ Reality viewers / prediction results missing
`apps/mobile/src/api/engagement.ts`: `/reality/shows/:id/viewers` (no route), 
`/reality/predictions/:id/results` (service has `predictions/:showId`, no `/results`).

### 20. ⬜ Lifestyle event attendees missing
`apps/web/src/app/lifestyle/events/[id]/page.tsx`: `/lifestyle/events/:id/attendees`
(service has `:id/rsvp` only).

### 21. ⬜ Admin backend missing modules (all → 404)
`apps/admin/client/src/lib/api/admin.ts` calls with no admin-backend route:
`/admin/creators/:id/verify|unverify`, `/admin/live-events*`, `/admin/subscriptions*`,
`/admin/reports/:id` + `/reports/:id/execute`, `/admin/wallets/:id/credit|debit`,
`/admin/notification-templates/:id` (PUT), `/admin/payment-gateways*`, `/admin/reality-shows*`.

### 22. ⬜ Service-prefix mismatches for admin-dashboard routes
`/api/v1/search/admin/stats` → search-service serves `/admin/stats` (404);
`/api/v1/media/admin/cdn/purge` → media-service serves `/admin/cdn/purge` (404).
**Fix:** align controller prefixes (`search/admin`, `media/admin`) or client paths.

### 23. ⬜ Gateway `endpoints` lists are documentation-only (no enforcement)
All of Phase 2/3 drift was invisible to CI because the proxy forwards unmatched paths.
**Fix:** add a route-contract check comparing client calls vs controller routes (script
exists in spirit — `check-swagger-consistency.mjs` — extend to cover clients).

---

## Verification gates (run after fixes)

- [ ] `pnpm typecheck` (root) — clean
- [ ] `cd apps/mobile && tsc --noEmit` — clean
- [ ] `pnpm -r lint` — clean
- [ ] gateway: `pnpm --filter @azeebo/api-gateway test` — clean
- [ ] auth-service, movie-service, games-service, recommendation-service suites — clean
- [ ] `node /tmp/audit-routes3.mjs` — unmatched count drops (target: only Phase 3 items)
