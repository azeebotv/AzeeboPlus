# Comprehensive Code Quality Remediation Plan

## Context
The Azeebo+ monorepo was previously audited (`tasks-hardcoded.md`) and many critical fixes were already applied (OTP crypto, docker-compose passwords, secret fallbacks, CORS in most services). This plan addresses the **remaining** issues verified against current source code: 6 task groups covering 40+ individual fixes across 30+ files.

---

## Task 1: Fix API Gateway CORS Localhost Fallback [CRITICAL SECURITY]

**File:** `services/api-gateway/src/main.ts` (line 44)

Remove `|| 'http://localhost:3013'` fallback. Throw if neither `ALLOWED_ORIGINS` nor `CORS_ORIGIN` is set (consistent with all other services).

```ts
// Before
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3013')
  .split(',').map((o: string) => o.trim());

// After
const originsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
if (!originsEnv) {
  throw new Error('ALLOWED_ORIGINS or CORS_ORIGIN environment variable is required');
}
const allowedOrigins = originsEnv.split(',').map((o: string) => o.trim());
```

---

## Task 2: Fix Frontend Localhost Fallbacks [CRITICAL SECURITY]

### 2a. Mobile Client
**File:** `apps/mobile/src/api/client.ts` (line 16)

Guard localhost fallback behind `__DEV__`:
```ts
baseURL: Constants.expoConfig?.extra?.apiBaseURL || (__DEV__ ? 'http://localhost:3013' : ''),
```

### 2b. Web Client
**File:** `apps/web/src/lib/api.ts` (line 3)

In production, throw if missing. Use `resolvedApiUrl` in lines 1049/1070:
```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}
const resolvedApiUrl = API_BASE_URL || 'http://localhost:3013';
```

---

## Task 3: Replace Math.random() Usage [MEDIUM SECURITY]

| File | Line | Fix |
|------|------|-----|
| `apps/mobile/app/(tabs)/_layout.tsx` | 50 | Replace `Math.random() > 0.3` with `true` (deterministic mock) |
| `apps/mobile/src/utils/performance.ts` | 35 | Use counter-based ID: `${Date.now()}-${(++counter).toString(36)}` |
| `services/media-service/src/modules/upload/s3.service.ts` | 210, 214 | Return deterministic defaults (120s video, 300s audio) |
| `services/moderation-service/.../safety-scanning.service.ts` | 395,424,434,462,469 | Return `{ result: 'clean' }` from all 3 mock methods |

---

## Task 4: Replace console.error with MobileLogger [CODE QUALITY]

**24 files** in `apps/mobile/` use raw `console.error`/`console.log` instead of the existing `logger` at `apps/mobile/src/utils/logger.ts`.

**Pattern for each file:**
1. Add import: `import { logger } from '<relative>/src/utils/logger';`
2. Replace: `console.error('Msg:', error)` → `logger.error('Msg', error)`

**Files to modify (24):**
- `app/settings/devices.tsx`, `app/predictions/[predictionId]/results.tsx`
- `app/(tabs)/transactions.tsx`, `app/(tabs)/referral.tsx` (2 occurrences), `app/(tabs)/wallet/subscription-plans.tsx`
- `app/(creator)/profile.tsx`, `app/(creator)/content-manager.tsx`, `app/(creator)/analytics.tsx`, `app/(creator)/drafts.tsx`, `app/(creator)/earnings.tsx`, `app/(creator)/monetization.tsx`, `app/(creator)/scheduled.tsx`, `app/(creator)/published.tsx`
- `app/(reality)/episode.tsx`, `app/(reality)/super-vote.tsx`, `app/(reality)/contestant.tsx`, `app/(reality)/results.tsx`
- `app/watch/[contentId].tsx`, `app/reality/[showId]/live-chat.tsx` (2 occurrences), `app/transactions/[transactionId].tsx`
- `src/components/PullToRefresh.tsx`, `src/utils/performance.ts`, `src/utils/appleGooglePay.ts`

---

## Task 5: Fix Hardcoded External URLs [LOW]

### 5a. ByteDance Image URLs
**File:** `apps/mobile/app/watch/movie-detail.tsx` (6 URLs)

Replace with `placehold.co` placeholder constants at top of file.

### 5b. Placeholder Images
**File:** `apps/web/src/app/reality/episodes/page.tsx` (5 occurrences)

Extract to a `PLACEHOLDER_THUMBNAIL` constant.

---

## Task 6: Improve Type Safety in Admin API Client [LOW]

**File:** `apps/web/src/lib/api.ts` (admin section, ~73 `any` usages across 34 methods)

Define interfaces in new file `apps/web/src/lib/admin-types.ts`:
- `PlatformOverview`, `AdminWallet`, `AdminCreator`, `PaymentGateway`
- `RealityShow`, `ContentReviewItem`, `EngagementMetrics`, `EngagementTrend`
- `NotificationTemplate`, `NotificationStats`, `AdminReport`
- `AdminUniverse`, `FeatureFlag`, `SystemSetting`

Replace all `any` in admin methods with proper types. Use `Record<string, unknown>` for dynamic metadata.

---

## Verification

```bash
# No localhost fallbacks in production code
grep -rn "localhost:3013" services/ apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".env" | grep -v "__DEV__"

# No Math.random in service/app code
grep -rn "Math.random" services/ apps/mobile/src/ apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# No raw console in mobile app
grep -rn "console\.\(error\|log\)" apps/mobile/app/ apps/mobile/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# No hardcoded external URLs
grep -rn "bytedance" apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# TypeScript compilation
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

## Priority & Effort

| Task | Priority | Files | Effort |
|------|----------|-------|--------|
| 1. API Gateway CORS | CRITICAL | 1 | 5 min |
| 2. Frontend localhost | CRITICAL | 2 | 15 min |
| 3. Math.random() | MEDIUM | 4 | 20 min |
| 4. console.error → logger | MEDIUM | 24 | 30 min |
| 5. Hardcoded URLs | LOW | 2 | 15 min |
| 6. Type safety | LOW | 2-3 | 2-3 hr |
