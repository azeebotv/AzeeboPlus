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
### 2. ✅ FIXED — Gateway CSRF blocks mobile + refresh/signup
### 3. ✅ FIXED — Gateway rejects ALL uploads (multipart → 400)
### 4. ✅ FIXED — All-in-one container: admin 502 + creator wrong target

---

## Phase 2 — Route/name mismatches (fix order 5–15)

### 5. ✅ FIXED — Gateway `/movie` singular vs movie-service `/movies` plural
### 6. ✅ FIXED — Mobile subscription screen uses plural `/subscriptions`
### 7. ✅ FIXED — Auth MFA/OTP paths never reach auth-service
### 8. ✅ FIXED — Admin Agbala prefix mismatch (`admin/vertical/agbala` → `admin/agbala`)
### 9. ✅ FIXED — `/recommendation/personalized` → `/recommendation/personalized-feed` (mobile + web)
### 10. ✅ FIXED — Web games trivia/tournament routes aligned to service
- `/games/trivia/categories` → `/games/trivia`
- `/games/trivia/start` → `/games/sessions`
- `/games/trivia/answer` → `/games/sessions/:sessionId/submit`
- `/games/tournaments/:id/register` → `/games/tournaments/:id/enter`

### 11. ✅ FIXED — Mobile engagement bet path (`/predictions/bet` → `/predictions`)
### 12. ✅ FIXED — Smoke-test health names (`/payment/health` → `/payments/health`, `/verticals/health` → `/vertical/health`)
### 13. ✅ FIXED — Lint red in 16 packages (ran `eslint --fix`)
### 14. ✅ FIXED — Mobile typecheck: 60 errors resolved
- Added `createLogger` export to `src/utils/logger.ts`
- Added `id`/`type` fields to `moviePricing` shape
- Fixed `dtColors.gray[X]` → `colors.light[X]` in wallet.tsx
- Fixed `dtColors.text.muted` → `colors.text.muted` in tipping.tsx
- Fixed `colors.accent.platinum` fallback in TippingModal.tsx
- Fixed `moviePassPrice.label` → `moviePassPrice.toLocaleString()` in movies/index.tsx
- Fixed `verticalSubscription` → `comedySubscription.monthly` in vertical.tsx
- Removed local `VotePackage` interface in super-vote.tsx, used imported type
- Removed unused imports (useEffect in premium.tsx, colors in leaderboard.tsx, dtColors in tipping.tsx)
- Added `colors` import to settings/devices.tsx
- Fixed `logger.warn` type errors with `String(e)` casts in prices.ts
- Fixed `typography.fontSize['2xl']` → `typography.fontSize.xxl` in tipping.tsx
- Fixed `Redirect` → `router.replace()` in tipping redirect page
- Fixed `toString()` calls on strings in devices.tsx
- Fixed `rentPrice` import in movies/index.tsx
### 15. ✅ FIXED — Admin/creator dev proxy pointed at gateway (3013)

---

## Phase 3 — Feature gaps (backend endpoints)

### 16. ✅ FIXED — Mobile content endpoints re-pointed to reality-service
- `/content/episodes/:id` → `/reality/episodes/:episodeId`
- `/content/:id/episodes` → `/reality/shows/:showId/episodes`
- `/content/contestants/:id` → `/reality/contestants/:contestantId`
- `/content/vote` → `/reality/votes`
- `/content/super-vote` → `/reality/supervotes`
- `/content/:id/results` → `/reality/predictions/:showId`
- `/content/recommendations` → `/recommendation/content`

### 17. ✅ FIXED — Creator-app missing routes added
- `GET /creator/drafts` (filter by status=draft)
- `GET /creator/published` (filter by status=published)
- `GET /creator/scheduled` (filter by status=scheduled)
- `POST /creator/content/:id/publish`
- `GET /creator/monetization`
- `PUT /creator/monetization`
- `GET /creator/profile/:id`
- `GET /creator/subscribers`
- `GET /creator/subscribers/stats`
- `GET /creator/challenges`
- `POST /creator/challenges/:challengeId/participate`

### 18. ✅ FIXED — `/challenges` gateway route added (→ creator-service)
### 19. ✅ FIXED — Reality viewers endpoint added (`GET /reality/shows/:showId/viewers`)
### 20. ✅ FIXED — Lifestyle event attendees endpoint added (`GET /lifestyle/events/:id/attendees`)
### 21. ✅ FIXED — Admin backend missing modules (all implemented with real Prisma queries)

- `PaymentGatewaysModule` — real stats from `PaymentIntent` table, gateway toggle/mode endpoints
- `RealityShowsModule` — queries `ContentItem` in the reality universe, status updates with validation
- `NotificationAdminController` — POST/PUT for notification templates, backed by `Notification` model
- `ReportsAdminController` — full CRUD for reports, backed by `Report` model with execute/delete
- `WalletManagementController` — wallet status updates logged as `WalletTransaction` records
- Search admin — real query stats from `SearchQueryLog`, GIN index repair via raw SQL
- Media admin — CDN purge via real `CdnPurgeService` (CloudFront invalidation)

### 22. ✅ FIXED — Search/media admin prefix mismatch
- Added `GET /search/admin/stats`, `GET /search/admin/queries`, `POST /search/admin/indexes/repair` to search-service
- Added `POST /media/admin/cdn/purge` to media-service

### 23. ✅ FIXED — Route-contract CI check script
Created `scripts/check-route-contracts.mjs` — extracts client API calls and compares
against gateway SERVICE_CONFIGS. Run: `node scripts/check-route-contracts.mjs`

---

## Verification gates

- [x] `pnpm typecheck` (root) — clean

- [x] `pnpm -r lint` — clean
- [x] gateway: `pnpm --filter @azeebo/api-gateway test` (34/34) — clean
- [x] auth-service, games-service, engagement-service suites — clean
- [x] `node scripts/check-route-contracts.mjs` — identifies remaining mismatches
