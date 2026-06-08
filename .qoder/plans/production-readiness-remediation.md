# Azeebo+ Production Readiness Remediation Plan

## Context

Comprehensive analysis identified 250+ production readiness issues across the Azeebo+ monorepo. This plan addresses all issues in priority order: security critical fixes, API route alignment, admin endpoint implementation, code quality, and infrastructure hardening. The frontend API routes are wrong and will be fixed to match backend services.

---

## Architecture Reference

**API Gateway** (`@Controller('api')`, port 3013):
- Proxies 6 services via `/api/{version}/{service}/*`: auth, users, wallet, content, recommendation, rewards
- Path strategies: `auth-service-strategy`, `includes-prefix`, `no-prefix`

**Service Route Patterns:**
| Pattern | Services |
|---------|----------|
| `setGlobalPrefix('v1')` + controller | auth-service |
| `setGlobalPrefix('v1/users')` + controller | user-service |
| `setGlobalPrefix('v1/wallet')` + controller | wallet-service |
| `setGlobalPrefix('v1/recommendation')` + controller | recommendation-service |
| `@Controller('v1/...')` inline | subscription, analytics, report-builder, creators, reality |
| No `/v1` prefix | payment, search, notification, content, moderation |

**Frontend routing:** `NEXT_PUBLIC_API_BASE_URL` → API gateway (port 3013). Frontend calls must use `/api/` prefix for gateway-proxied services.

---

## Task 1: Security — Hardcoded Fallback Secrets (P0)

**Goal:** Remove all silent fallback secrets that would be used if env vars are missing.

### 1.1 Support-service JWT fallback
- **File:** `services/support-service/src/common/common.module.ts` line 10
- **Current:** `secret: process.env.JWT_SECRET || 'development-secret'`
- **Fix:** Inject ConfigService, use `configService.getOrThrow<string>('JWT_SECRET')`

### 1.2 User-service admin JWT fallback
- **File:** `services/user-service/src/modules/admin/admin.module.ts` line 16
- **Current:** `configService.get<string>('JWT_SECRET')` (returns undefined if missing)
- **Fix:** `configService.getOrThrow<string>('JWT_SECRET')`

### 1.3 Referral-service CORS wildcard
- **File:** `services/referral-service/src/main.ts` line 13
- **Current:** `origin: process.env.CORS_ORIGIN || '*'`
- **Fix:** Require `CORS_ORIGIN` env var, fail if missing

### 1.4 All service main.ts — remove CORS localhost fallbacks
- **13 files:** auth, user, wallet, content, movie, search, analytics, games, reality, vertical, lifestyle, queue, sports, moderation, payment, referral
- **Fix:** Replace `|| ['http://localhost:3000']` with `process.env.ALLOWED_ORIGINS!.split(',')` or fail fast

---

## Task 2: Security — Math.random() in Crypto Contexts (P0)

### 2.1 OTP generation
- **File:** `services/auth-service/src/modules/auth/otp/otp.service.ts` line 12
- **Fix:** `import { randomInt } from 'crypto'; randomInt(100000, 999999).toString()`

### 2.2 MFA backup codes
- **File:** `services/auth-service/src/modules/auth/mfa/mfa.service.ts` line 75
- **Fix:** `import { randomBytes } from 'crypto'; randomBytes(4).toString('hex').toUpperCase()`

### 2.3 Moderation mock risk scoring
- **File:** `services/moderation-service/src/modules/moderation/safety-scanning.service.ts` lines 395, 424, 434, 462, 469
- **Fix:** Replace Math.random() with deterministic scoring or remove mock data entirely

### 2.4 Media service mock durations
- **File:** `services/media-service/src/modules/upload/s3.service.ts` lines 210, 214
- **Fix:** Return null or throw error instead of generating random durations

---

## Task 3: Security — Scan Script Fix (P0)

- **File:** `ci/scripts/scan-hardcoded-values.sh`
- **Fix 1:** Remove line 26 `| grep -v "localhost"` (overly broad, defeats the entire localhost scan)
- **Fix 2:** Remove line 115 `| grep -v "console.log("` (excludes actual console.log calls)
- **Fix 3:** Add `--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist` to all grep commands

---

## Task 4: Hardcoded URLs — Localhost Fallbacks (P0)

### 4.1 Database URL fallbacks (5 prisma.service.ts files)
- auth, user, wallet, payment, content service
- **Fix:** Replace `process.env.DATABASE_URL || 'postgresql://localhost:5432/azeebo'` with `configService.getOrThrow('DATABASE_URL')`

### 4.2 Redis URL fallbacks (7 redis.service.ts files)
- shared, auth, comedy, reality, payment, media, api-gateway
- **Fix:** Replace `process.env.REDIS_URL || 'redis://localhost:6379'` with `configService.getOrThrow('REDIS_URL')`

### 4.3 Service-to-service URL fallbacks
- **Fix:** Replace all `|| 'http://localhost:XXXX'` with `configService.getOrThrow()` in:
  - sports-service (analytics + wallet URLs)
  - games-service (analytics URL)
  - reality-service (wallet + analytics URLs)
  - creator-service (wallet + media + analytics URLs)
  - payment-service (analytics + wallet URLs)
  - comedy-service (analytics URL)
  - support-service (payment + wallet + moderation + content + notification + user URLs)
  - content-service (internal self-reference URL)

---

## Task 5: API Route Alignment — Frontend Fixes (P1)

### 5.1 Fix `apps/web/src/lib/api.ts` routes

The API gateway is at `@Controller('api')`, so frontend must prefix all gateway-proxied calls with `/api/`.

| API Group | Current Route | Correct Route | Service |
|-----------|---------------|---------------|---------|
| auth.* | `/auth/login` | `/api/v1/auth/login` | Gateway → auth-service |
| auth.* | `/auth/signup` | `/api/v1/auth/signup` | Gateway → auth-service |
| user.getProfile | `/v1/users/me` | `/api/v1/users/me` | Gateway → user-service |
| user.getWatchHistory | `/users/me/history` | `/api/v1/users/me/history` | Gateway → user-service |
| content.* | `/content/*` | `/api/v1/content/*` | Gateway → content-service |
| wallet.* | `/wallet/*` | `/api/v1/wallet/*` | Gateway → wallet-service |
| recommendation.* | `/v1/recommendation/*` | `/api/v1/recommendation/*` | Gateway → recommendation |
| universe.* | `/v1/universes/*` | Verify service | Check vertical-service or content-service |
| creator.* | `/v1/creators/*` | `/v1/creators/*` | Direct (no gateway) |
| payment.* | `/payments/*` | `/payments/*` | Direct to payment-service |
| admin.* | `/v1/admin/*` | Depends on service | Per-endpoint mapping needed |
| moderation.reportContent | `/content/${id}/comments` | `/v1/moderation/reports` | Direct to moderation-service |

### 5.2 Migrate 15+ pages from raw fetch() to api client

Replace direct `fetch()` calls in these files with the centralized `api` client:
- `apps/web/src/app/reality/episodes/page.tsx`
- `apps/web/src/app/reality/episode/page.tsx`
- `apps/web/src/app/reality/results/page.tsx`
- `apps/web/src/app/reality/super-vote/page.tsx`
- `apps/web/src/app/reality/contestant/page.tsx`
- `apps/web/src/app/settings/devices/page.tsx`
- `apps/web/src/app/premium/page.tsx`
- `apps/web/src/app/onboarding/page.tsx`
- `apps/web/src/app/wallet/subscription-plans/page.tsx`
- `apps/web/src/app/auth/role-selection/page.tsx`
- `apps/web/src/app/auth/profile-setup/page.tsx`
- `apps/web/src/app/auth/reset-password/page.tsx`
- `apps/web/src/app/admin/announcements/page.tsx`
- `apps/web/src/app/admin/audit-logs/page.tsx`
- `apps/web/src/app/admin/financial/page.tsx`

---

## Task 6: Backend Route Standardization (P1)

### Services missing `/v1` prefix:
| Service | Controller | Fix |
|---------|-----------|-----|
| payment-service | `@Controller('payments')` | `@Controller('v1/payments')` |
| search-service | `@Controller('search')` | `@Controller('v1/search')` |
| notification-service | `@Controller('notifications')` | `@Controller('v1/notifications')` |
| content-service | `@Controller('content')` | `@Controller('v1/content')` |
| moderation-service | `@Controller('moderation')` | `@Controller('v1/moderation')` |

### Gateway updates needed after standardization:
- content-service: change gateway strategy from `no-prefix` to `includes-prefix` (or `default`)
- Verify all gateway path strategies still work after backend route changes

### Services already correctly using `/v1`:
- subscription, analytics, reports, creators, reality, auth, user, wallet, recommendation

---

## Task 7: Admin Endpoint Implementation (P1)

### Existing admin endpoints:
- user-service: `@Controller('admin')` at `/v1/users/admin`

### Missing admin endpoints (need implementation):

#### 7.1 Vertical-service admin — Universes management
- File: `services/vertical-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: CRUD universes, toggle, feature-flags CRUD, check feature-flag, admin settings CRUD
- Schema: Already has Universe model in vertical-service prisma schema

#### 7.2 Analytics-service admin
- File: `services/analytics-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: platform-overview, engagement/metrics, engagement/trends, notification-templates CRUD, notification-stats, reports, announcements CRUD, audit-logs, financial-metrics
- Note: Some may already exist via analytics-controller at `/v1/analytics/*`

#### 7.3 Wallet-service admin
- File: `services/wallet-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: GET /admin/wallets, PUT /admin/wallets/:id/status
- Reuse existing wallet service logic with admin guards

#### 7.4 Creator-service admin
- File: `services/creator-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: GET /admin/creators, PUT /admin/creators/:id/status, POST /admin/creators/:id/verify

#### 7.5 Payment-service admin
- File: `services/payment-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: GET/PUT payment-gateways, toggle, mode

#### 7.6 Reality-service admin
- File: `services/reality-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: GET /admin/reality-shows, PUT /admin/reality-shows/:id/status

#### 7.7 Content-service admin
- File: `services/content-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: GET /admin/content-review, POST approve, POST reject

#### 7.8 Auth-service admin
- File: `services/auth-service/src/modules/admin/admin.controller.ts` (create)
- Endpoints: POST /v1/auth/role

#### 7.9 User-service admin — complete-profile
- File: `services/user-service/src/modules/users/users.controller.ts` (modify)
- Endpoint: POST /v1/users/me/complete-profile

---

## Task 8: Console.log Cleanup (P2)

### Backend (2 files):
- `services/referral-service/src/main.ts` line 40 → `Logger.log()`
- `services/subscription-service/src/main.ts` line 24 → `Logger.log()`

### Mobile app (20+ files):
Replace all `console.error` in catch blocks with `logger.error()` using existing `src/utils/logger.ts`

### Web app (25+ files):
Replace all `console.error/log/warn` with `logger.error/log/warn()` using existing `src/lib/logger.ts`

---

## Task 9: Hardcoded Prices Externalization (P2)

### Approach:
1. Add `PricingPlan` model to content-service or vertical-service prisma schema
2. Create pricing API endpoints: `GET /v1/pricing/:universe`, `GET /v1/pricing/wallet`
3. Seed default prices via migration
4. Create admin CRUD for pricing
5. Replace hardcoded prices in 15+ mobile/web files with API calls

### Fallback: Shared constants file
- Create `packages/shared-types/src/pricing.ts` with default prices
- Import in mobile/web as temporary measure

---

## Task 10: ByteDance Image URL Externalization (P2)

### Files affected: 25+ files across web and mobile

### Changes:
1. Add `NEXT_PUBLIC_IMAGE_API_URL` to env config
2. Replace all `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` with env-based URL
3. Add fallback images in `/public/images/` directory
4. Long-term: implement server-side image proxy/generation service

---

## Task 11: Port Conflict Resolution (P2)

Assign unique ports per service and document:
| Service | Port |
|---------|------|
| api-gateway | 3000 |
| auth-service | 3001 |
| user-service | 3002 |
| wallet-service | 3003 |
| payment-service | 3004 |
| content-service | 3005 |
| search-service | 3006 |
| notification-service | 3007 |
| analytics-service | 3008 |
| recommendation-service | 3009 |
| reward-service | 3010 |
| moderation-service | 3011 |
| referral-service | 3012 |
| reality-service | 3014 |
| queue-service | 3015 |
| lifestyle-service | 3016 |
| vertical-service | 3017 |
| movie-service | 3018 |
| games-service | 3019 |
| comedy-service | 3020 |
| media-service | 3021 |
| creator-service | 3022 |
| sports-service | 3023 |
| support-service | 3024 |
| subscription-service | 3025 |
| messaging-service | 3026 |
| engagement-service | 3027 |

---

## Task 12: Docker Compose Password Defaults (P2)

### File: `docker-compose.yml` lines 21-42
Replace all `${VAR:-default_password}` with `${VAR:?VAR must be set}` for all 22 service database passwords.

---

## Task 13: Email Domain Standardization (P2)

### File: `services/notification-service/src/modules/email/email.service.ts` lines 120, 149
Change `no-reply@azeebo.com` → `no-reply@azeebo.plus` (match queue-service)

---

## Task 14: Missing Security Hardening (P2)

### Add helmet middleware:
- `services/subscription-service/src/main.ts`
- `services/referral-service/src/main.ts`

### Fix wide-open CORS:
- `services/engagement-service/src/main.ts` — replace `app.enableCors()` with configured origins
- `services/messaging-service/src/main.ts` — same

---

## Task 15: Remove Mock Data from Production Code (P2)

### Frontend mock data:
- `apps/web/src/app/creators/page.tsx` line 51 — remove Math.random() view counts
- `apps/web/src/app/library/page.tsx` line 40 — remove Math.random() progress
- `apps/web/src/app/creators/dashboard/analytics/page.tsx` line 108 — remove Math.random() analytics
- `apps/mobile/app/(tabs)/_layout.tsx` line 50 — remove Math.random() live status

### Mobile app TODOs (4 files):
- `apps/mobile/app/vote.tsx` line 93 — implement actual vote API call via reality-service
- `apps/mobile/app/watch/reality-show.tsx` line 64 — same
- `apps/mobile/app/prediction.tsx` line 74 — implement actual bet API call via sports-service
- `apps/mobile/app/(tabs)/create.tsx` line 46 — implement file picker and upload via media-service

---

## Task 16: Placeholder Image Cleanup (P2)

### Files:
- `apps/web/src/app/reality/episodes/page.tsx` — 5 occurrences of `via.placeholder.com`
- Replace with actual images or local placeholder assets

---

## Task 17: PgBouncer Userlist Security (P2)

### File: `infra/config/pgbouncer_userlist.txt`
- Add to `.gitignore` if not already
- Generate from environment variables during deployment
- Replace placeholder `CHANGE_ME_*` passwords with actual values from secrets manager

---

## Execution Order

| Phase | Tasks | Timeline | Dependencies |
|-------|-------|----------|-------------|
| Phase A | 1, 2, 3, 4 | Days 1-2 | None |
| Phase B | 5, 6 | Days 3-4 | Phase A (routing needs clean env) |
| Phase C | 7 | Days 5-8 | Phase B (admin routes depend on standardization) |
| Phase D | 8, 9, 10, 11, 12, 13, 14 | Days 9-12 | None (can parallelize) |
| Phase E | 15, 16, 17 | Days 13-14 | None |

---

## Verification

1. Run `bash ci/scripts/scan-hardcoded-values.sh` — all scans should pass
2. Run `grep -r "localhost" --include="*.ts" services/*/src/main.ts` — zero matches (except health checks)
3. Run `grep -r "Math.random()" --include="*.ts" services/ --exclude-dir=node_modules --exclude-dir=prisma` — zero matches in non-test files
4. Run `pnpm test` across all services — all pass
5. Start API gateway + all services, test routing:
   - `curl http://localhost:3013/api/v1/auth/login` → auth-service responds
   - `curl http://localhost:3013/api/v1/wallet` → wallet-service responds
   - `curl http://localhost:3004/v1/payments/providers` → payment-service responds
6. Test frontend pages load without 404 errors on API calls
7. Test admin dashboard loads all data correctly
