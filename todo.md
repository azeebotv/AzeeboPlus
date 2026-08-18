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
### 14. 🔧 IN PROGRESS — Mobile typecheck: 58 errors (stale refactors)
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
### 21. 🔧 IN PROGRESS — Admin backend missing modules (many routes still need implementation)
The admin backend (4016) needs new controller methods for: creators/verify|unverify,
live-events, subscriptions, reports, wallets/credit|debit, notification-templates,
payment-gateways, reality-shows. Gateway endpoints are documented but backend is missing.

### 22. ✅ FIXED — Search/media admin prefix mismatch
- Added `GET /search/admin/stats`, `GET /search/admin/queries`, `POST /search/admin/indexes/repair` to search-service
- Added `POST /media/admin/cdn/purge` to media-service

### 23. ✅ FIXED — Route-contract CI check script
Created `scripts/check-route-contracts.mjs` — extracts client API calls and compares
against gateway SERVICE_CONFIGS. Run: `node scripts/check-route-contracts.mjs`

---

## Verification gates

- [x] `pnpm typecheck` (root) — clean
- [ ] `cd apps/mobile && tsc --noEmit` — clean
- [x] `pnpm -r lint` — clean
- [x] gateway: `pnpm --filter @azeebo/api-gateway test` (34/34) — clean
- [x] auth-service, games-service, engagement-service suites — clean
- [x] `node scripts/check-route-contracts.mjs` — identifies remaining mismatches
