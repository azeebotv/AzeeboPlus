# Backend Audit Report — Admin & Creator-Portal Apps + Shared Packages

**Date:** 2026-07-14  
**Scope:** `apps/admin/`, `apps/creator-portal/`, `packages/*` (backend-relevant)  
**Auditor:** Claude (opencode)

---

## Executive Summary

The admin and creator-portal backend apps share significant duplicated infrastructure (CSRF middleware, auth modules, JWT strategies, guards, database modules) and lack rate limiting entirely. The creator-portal's API clients use raw Node.js `http`/`https` instead of the shared `@azeebo/http-client` package. Several services fetch entire tables into memory for aggregation instead of using SQL `GROUP BY`. The `@azeebo/observability` package defines a complete observability module that neither app imports or uses.

---

## 1. Unfinished / Incomplete Code

### 1.1 `engagement-admin.service.ts` — Duplicate Query
- **File:** `apps/admin/src/modules/engagement-admin/engagement-admin.service.ts:18-19`
- **Issue:** `activeUsers` and `newUsersThisWeek` run the identical Prisma query (`createdAt: { gte: weekAgo }`). The field names suggest `activeUsers` should measure active/in-use accounts (e.g., recent logins or transactions), not just new registrations.
- **Impact:** Dashboard shows misleading data; one query is wasted.
- **Fix:** Query a different signal for `activeUsers` (e.g., users with recent `WalletTransaction` or `lastLoginAt`).

### 1.2 `content-review.service.ts` — No Existence Check on Approve/Reject
- **File:** `apps/admin/src/modules/content-review/content-review.service.ts:33-45`
- **Issue:** `approveContent` and `rejectContent` call `prisma.contentItem.update` without first checking if the record exists. A non-existent ID will throw a raw `PrismaClientKnownRequestError` (P2025) with no user-friendly message.
- **Impact:** Raw database error exposed to API consumers.
- **Fix:** Check `findUnique` first and throw `NotFoundException` if missing, or wrap the update in a try/catch.

### 1.3 `creator.service.ts` — Unused `analyticsClient` Field
- **File:** `apps/creator-portal/src/creator/creator.service.ts:54-59`
- **Issue:** The class does not inject `AnalyticsClientService`, but `getAnalytics()` at line 294 returns hardcoded placeholder values: `avgWatchTime: '0m 0s'`, `newSubscribers: 0`, `demographics: []`.
- **Impact:** Creator analytics dashboard shows incomplete data.
- **Fix:** Inject `AnalyticsClientService` and call it for real data, or mark methods as `@TODO` with a clear plan.

### 1.4 `creator.service.ts` — `subscribersChange` Always Zero
- **File:** `apps/creator-portal/src/creator/creator.service.ts:157`
- **Issue:** `subscribersChange` is hardcoded to `0` regardless of actual data.
- **Impact:** Change metric is always wrong.
- **Fix:** Compute previous-period subscriber count and diff.

### 1.5 `creator.service.ts` — `analyticsClient` Declared But Never Injected
- **File:** `apps/creator-portal/src/creator/creator.service.ts` (constructor lines 56-59)
- **Issue:** The constructor only injects `PrismaService` and `WalletClientService`. The `AnalyticsClientService` referenced in the API clients is never injected into this service, so analytics methods return static data.
- **Impact:** Analytics endpoint returns no real data.
- **Fix:** Add `@Inject(AnalyticsClientService)` to constructor.

### 1.6 `observability` Module Not Registered in Any App
- **File:** `packages/observability/src/observability.module.ts` (exports `MetricsService`, `TracingService`, `HealthCheckService`)
- **Issue:** Neither `admin/src/app.module.ts` nor `creator-portal/src/app.module.ts` imports `ObservabilityModule`. The entire observability package is unused at runtime.
- **Impact:** No health checks, metrics, or tracing are actually running.
- **Fix:** Register `ObservabilityModule` in both apps' root modules.

### 1.7 `opentelemetry` Package — Dead Code in Backend
- **File:** `packages/opentelemetry/src/index.ts`
- **Issue:** The `initializeOpenTelemetry()` function is exported but never called by any backend app. No app imports this package.
- **Impact:** OpenTelemetry SDK never starts; no distributed tracing is collected.
- **Fix:** Call `initializeOpenTelemetry()` in each app's `main.ts` before bootstrap.

---

## 2. Technical Debt

### 2.1 Massive Code Duplication Between Apps
- **Files:**
  - `apps/admin/src/common/csrf.middleware.ts` ↔ `apps/creator-portal/src/common/csrf.middleware.ts`
  - `apps/admin/src/modules/auth/` ↔ `apps/creator-portal/src/auth/` (module, guards, strategy, decorators)
  - `apps/admin/src/database/database.module.ts` ↔ `apps/creator-portal/src/database/database.module.ts`
  - `apps/admin/src/database/prisma.service.ts` ↔ `apps/creator-portal/src/database/prisma.service.ts`
- **Issue:** Identical files are copy-pasted across both apps instead of being shared via `@azeebo/shared-services` or a new `@azeebo/backend-shared` package.
- **Impact:** Every bug fix or security patch must be applied twice. Divergence risk is high.
- **Fix:** Extract common backend infrastructure into a shared package (e.g., `@azeebo/nestjs-shared`).

### 2.2 Creator-Portal API Clients Use Raw `http`/`https`
- **Files:**
  - `apps/creator-portal/src/api/clients/analytics-client.service.ts:3-4,62-115`
  - `apps/creator-portal/src/api/clients/content-client.service.ts:3-4,57-110`
  - `apps/creator-portal/src/api/clients/wallet-client.service.ts:3-4,58-120`
- **Issue:** All three API clients implement raw `http.request`/`https.request` with manual JSON parsing, manual error handling, and no retry logic. The project has a full-featured `@azeebo/http-client` package with `ServiceClient` (retry, idempotency, backoff) that is never used.
- **Impact:** No retry on transient failures, no idempotency keys, no connection pooling, inconsistent error handling.
- **Fix:** Refactor all three clients to extend `ServiceClient` from `@azeebo/http-client`.

### 2.3 `@azeebo/api-client` and `@azeebo/internal-clients` Are Deprecated Shims
- **Files:**
  - `packages/api-client/src/index.ts` — re-exports from `@azeebo/http-client`
  - `packages/internal-clients/src/index.ts` — re-exports from `@azeebo/http-client`
- **Issue:** These packages are thin wrappers that add no value. All consumers should import directly from `@azeebo/http-client`.
- **Impact:** Confusion about which package to import; unnecessary dependency chain.
- **Fix:** Mark packages as deprecated, migrate all imports to `@azeebo/http-client`.

### 2.4 `PrismaService` `any` Types in Shared Services
- **File:** `packages/shared-services/src/prisma/prisma.service.ts:19,67,72,81`
- **Issue:** `PrismaService` exposes `_client: any`, `auditLog: any`, `[Symbol.iterator]: any`, and `PrismaServiceLike` type with `Record<string, any>`. This defeats TypeScript's purpose.
- **Impact:** Type safety lost for all Prisma consumers; runtime errors not caught at compile time.
- **Fix:** Use generics or `PrismaClient` type parameter; avoid `any` in public API.

---

## 3. Performance Problems

### 3.1 `reports-admin.service.ts` — Full Table Scan for Aggregation
- **File:** `apps/admin/src/modules/reports-admin/reports-admin.service.ts:13-34`
- **Issue:** `getReports()` calls `findMany` on `user`, `contentItem`, `walletTransaction`, and `report` tables, loading ALL matching rows into Node.js memory, then aggregates by date in JavaScript. For a 90-day range with thousands of transactions, this creates massive memory pressure.
- **Impact:** O(n) memory usage per query; slow responses; potential OOM on large datasets.
- **Fix:** Use Prisma `groupBy` or raw SQL `GROUP BY DATE_TRUNC('day', "createdAt")` for server-side aggregation.

### 3.2 `dashboard.service.ts` — `getRevenueData` and `getContentTrend` In-Memory Aggregation
- **File:** `apps/admin/src/modules/dashboard/dashboard.service.ts:95-116,123-153`
- **Issue:** Same pattern as 3.1: loads all rows into memory and groups by date in JS.
- **Impact:** Same memory/performance concerns.
- **Fix:** Use SQL `GROUP BY` with `DATE_TRUNC`.

### 3.3 `engagement-admin.service.ts` — `getEngagementTrends` Full Table Scan
- **File:** `apps/admin/src/modules/engagement-admin/engagement-admin.service.ts:39-78`
- **Issue:** Loads all user and content records created in the date range into memory for JS-side grouping.
- **Impact:** Scales poorly with data growth.
- **Fix:** Use `GROUP BY` SQL.

### 3.4 `dashboard.service.ts` — `getTopCreators` Loads All Content for View Count
- **File:** `apps/admin/src/modules/dashboard/dashboard.service.ts:176-196`
- **Issue:** `include: { contentItems: { select: { viewCount: true } } }` loads all published content items per creator into memory, then sums with `reduce`. Should use SQL `SUM`.
- **Impact:** N+1 query pattern; high memory for creators with many items.
- **Fix:** Use a raw SQL query or Prisma `$queryRaw` to sum `viewCount` in the database.

### 3.5 `dashboard.service.ts` — Mutating Shared `Date` Object
- **File:** `apps/admin/src/modules/dashboard/dashboard.service.ts:67-68`
- **Issue:** `today.setHours(0, 0, 0, 0)` mutates the `Date` object returned by `new Date()`. While this particular case doesn't cause a bug (it's used immediately), the same pattern at line 244 is shared across `Promise.all` — the `today` variable is mutated before being used in parallel queries, which is safe only because the queries don't depend on the mutation order. However, this is fragile.
- **Impact:** Low (currently safe), but risky if code is refactored.
- **Fix:** Use `new Date(now.getFullYear(), now.getMonth(), now.getDate())` to create a clean date (already done in `platform-overview.service.ts:14`).

### 3.6 `observability/src/metrics.service.ts` — Histogram Bucket Computation Is O(n*buckets)
- **File:** `packages/observability/src/metrics.service.ts:304-305`
- **Issue:** `histValues.filter((v) => v <= bucket).length` runs on every export (10s) for every bucket. With 10,000 values and 10 buckets, that's 100,000 comparisons per flush.
- **Impact:** Moderate CPU overhead at scale.
- **Fix:** Pre-sort histogram values and use binary search, or maintain running bucket counts.

---

## 4. Security Vulnerabilities

### 4.1 No Rate Limiting on Either App
- **Files:** `apps/admin/src/main.ts`, `apps/creator-portal/src/main.ts`
- **Issue:** Neither app registers `RateLimiterModule` or applies any rate limiting middleware. The `@azeebo/security` package provides `RateLimiterModule` and `RateLimiterGuard`, but neither app imports them.
- **Impact:** Brute-force attacks, credential stuffing, and API abuse are unrestricted.
- **Fix:** Import and register `RateLimiterModule` from `@azeebo/security` in both apps.

### 4.2 Hardcoded Fallback URLs in Production Code
- **Files:**
  - `apps/admin/src/modules/platform-overview/platform-overview.service.ts:7-8` — `http://localhost:3026`
  - `apps/admin/src/modules/moderation/moderation.service.ts:212` — `http://localhost:3022`
  - `apps/admin/src/main.ts:56` — `http://localhost:4016`
  - `apps/creator-portal/src/api/clients/analytics-client.service.ts:59` — `http://localhost:3013`
  - `apps/creator-portal/src/api/clients/content-client.service.ts:54` — `http://localhost:3013`
  - `apps/creator-portal/src/api/clients/wallet-client.service.ts:55` — `http://localhost:3013`
- **Issue:** If the corresponding env var is not set, the app silently falls back to `localhost` URLs. In production, this means requests go to the wrong service (or fail silently).
- **Impact:** Silent misconfiguration; data leaks to wrong service; silent failures.
- **Fix:** Throw an error in production if required env vars are missing (as `content-client.service.ts:51-53` already does).

### 4.3 `content-client.service.ts` — Production Guard Only on One Client
- **File:** `apps/creator-portal/src/api/clients/content-client.service.ts:51-53`
- **Issue:** Only `ContentClientService` throws in production if `API_GATEWAY_URL` is missing. The other two clients (`AnalyticsClientService`, `WalletClientService`) silently fall back to localhost.
- **Impact:** Inconsistent enforcement; two services will fail silently in production.
- **Fix:** Apply the same production guard to all three clients.

### 4.4 Empty `catch` Blocks Silently Swallow Errors
- **Files:**
  - `apps/admin/src/modules/moderation/moderation.service.ts:222`
  - `apps/creator-portal/src/creator/creator.service.ts:147`
- **Issue:** `catch { }` blocks silently discard errors with no logging. The moderation `getReportTypes` falls back to hardcoded defaults; the creator `getDashboardStats` returns 0 subscribers.
- **Impact:** Failures are invisible; debugging is impossible; fallback data may be stale or wrong.
- **Fix:** Log the error (at minimum `logger.warn`) before falling back.

### 4.5 Admin App — No Health Check Endpoint
- **File:** `apps/admin/src/main.ts` (no `/health` or `/api/health` route)
- **Issue:** The CSRF middleware excludes `api/health` (line 55), but no health controller exists. The admin app has no liveness/readiness probe.
- **Impact:** Kubernetes/container orchestrators cannot check if the service is alive.
- **Fix:** Add a health endpoint using `HealthCheckService` from `@azeebo/observability`.

### 4.6 Creator-Portal App — No Health Check Endpoint
- **File:** `apps/creator-portal/src/main.ts` (no health route)
- **Issue:** Same as 4.5 — CSRF excludes `api/health` but no health endpoint exists.
- **Impact:** Same as 4.5.
- **Fix:** Same as 4.5.

### 4.7 CORS Allows `null` Origin (Both Apps)
- **Files:** `apps/admin/src/main.ts:64`, `apps/creator-portal/src/main.ts:57`
- **Issue:** `if (!origin || allowedOrigins.includes(origin))` — when `origin` is `undefined` (e.g., same-origin requests, server-to-server, or `null` origin from sandboxed iframes), the request is allowed.
- **Impact:** Potential CSRF from sandboxed iframes or server-side requests.
- **Fix:** Explicitly reject `null` origin; only allow known origins or use a callback that validates properly.

---

## 5. Miscellaneous Issues

### 5.1 `console.log` / `console.warn` / `console.error` in Production Code
- **Files:**
  - `packages/http-client/src/index.ts:203` — `console.warn` (ApiClient localStorage warning)
  - `packages/analytics-sdk/src/index.ts:139,158` — `console.log` (event tracking debug logs)
  - `packages/auth/src/auth-client.ts:395,399` — `console.error`/`console.debug`
  - `packages/observability/src/metrics.service.ts:330` — `console.error`
  - `packages/observability/src/tracing.service.ts:135` — `console.error`
  - `packages/shared-types/src/secret-validation.ts:5-7` — `console.error`/`console.warn`/`console.log`
  - `packages/test-utils/src/integration-test-utils.ts:34,38` — `console.log`
- **Issue:** Should use the `@azeebo/logger` package for structured logging in production. Raw `console.*` calls bypass log levels, structured formatting, and correlation IDs.
- **Impact:** Logs are unstructured; harder to filter/parse in production log aggregators.
- **Fix:** Replace with `Logger` from `@nestjs/common` or `@azeebo/logger`.

### 5.2 `MetricsService` Histogram — Labels Not Used in `observeHistogram`
- **File:** `packages/observability/src/metrics.service.ts:173`
- **Issue:** `observeHistogram(name, value, _labels)` — the `_labels` parameter is prefixed with underscore and never used. Histogram observations are not labeled, so per-label histogram analysis is impossible.
- **Impact:** All histogram observations are aggregated without labels.
- **Fix:** Store values by label key (similar to counter/gauge) or document that histograms are label-free.

### 5.3 `TracingService` — `enterWith` Is Deprecated
- **File:** `packages/observability/src/tracing.service.ts:105`
- **Issue:** `asyncLocalStorage.enterWith(...)` is deprecated in Node.js 22+. Use `asyncLocalStorage.run(...)` instead.
- **Impact:** Will break on future Node.js versions; produces deprecation warnings.
- **Fix:** Refactor to use `run()` with a callback pattern.

### 5.4 `opentelemetry` — `as never` Type Casts
- **File:** `packages/opentelemetry/src/index.ts:58,64`
- **Issue:** `new HttpInstrumentation({...} as never)` and `new ExpressInstrumentation({...} as never)` — casting to `never` bypasses all type checking on the configuration object.
- **Impact:** Configuration errors are not caught at compile time.
- **Fix:** Use correct types from OpenTelemetry packages or adjust config shape.

### 5.5 `contract-tests` — Test Password in Source
- **File:** `packages/contract-tests/src/auth.pact.spec.ts:5`
- **Issue:** `const TEST_PASSWORD = 'ValidPassword123!';` is hardcoded in source. While this is a test-only dummy value, it's a code smell.
- **Impact:** Low (it's a test fixture), but could be misused as an example.
- **Fix:** Use environment variable or fixture file.

### 5.6 `test-utils` — `cleanDatabase` Hardcoded Table Names
- **File:** `packages/test-utils/src/index.ts:40-48`
- **Issue:** `cleanDatabase()` has a hardcoded list of 8 tables. Any new table added to a service's schema must be manually added here.
- **Impact:** Tests may leave stale data in new tables.
- **Fix:** Query `information_schema.tables` dynamically or accept table list as parameter.

### 5.7 `test-utils` — `TransactionManager` Does Not Actually Run SQL
- **File:** `packages/test-utils/src/integration-test-utils.ts:77-108`
- **Issue:** `beginTransaction()`, `commit()`, and `rollback()` only manage an in-memory Map. They do not issue `BEGIN`, `COMMIT`, or `ROLLBACK` SQL statements. `TransactionManager` is misleadingly named.
- **Impact:** Tests using this manager get no actual transaction isolation.
- **Fix:** Either implement real SQL transactions or rename to `TestTransactionTracker` to clarify it's only for tracking.

### 5.8 `design-tokens` — `spacing` and `spacingNative` Are Identical
- **File:** `packages/design-tokens/src/index.ts:154-174`
- **Issue:** `spacing` and `spacingNative` have identical values. One is redundant.
- **Impact:** Maintenance burden; confusion about which to use.
- **Fix:** Remove `spacingNative` or differentiate it for React Native-specific needs.

### 5.9 `design-tokens` — `fontSizeNative` and `typography.fontSizes` Are Identical
- **File:** `packages/design-tokens/src/index.ts:177-217`
- **Issue:** Same duplication as 5.8.
- **Impact:** Same as 5.8.
- **Fix:** Same as 5.8.

### 5.10 No TODO/FIXME/HACK Comments Found
- **Scope:** `apps/admin/src/`, `apps/creator-portal/src/`, `packages/`
- **Finding:** Zero TODO, FIXME, HACK, or XXX comments exist in the backend codebase. This is unusual for a project of this size and suggests either very disciplined code or incomplete technical debt tracking.

---

## Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| **Critical** | 2 | No rate limiting (4.1), hardcoded localhost fallbacks in production (4.2, 4.3) |
| **High** | 5 | No existence checks on approve/reject (1.2), full-table-scan aggregations (3.1-3.4), raw `http` clients without retry (2.2) |
| **Medium** | 8 | Code duplication (2.1), `any` types in PrismaService (2.4), silent error swallowing (4.4), no health endpoints (4.5, 4.6), deprecated `enterWith` (5.3) |
| **Low** | 7 | `console.log` in packages (5.1), hardcoded test password (5.5), identical design tokens (5.8, 5.9), histogram labels ignored (5.2) |

---

## Recommended Priority Actions

1. **Add rate limiting** to both apps using `@azeebo/security`'s `RateLimiterModule`
2. **Add production env var guards** to `AnalyticsClientService` and `WalletClientService` (match `ContentClientService`)
3. **Refactor creator-portal API clients** to use `ServiceClient` from `@azeebo/http-client`
4. **Replace in-memory aggregations** with SQL `GROUP BY` in dashboard, reports, and engagement services
5. **Extract shared backend infrastructure** (CSRF, auth, database, guards) into a shared package
6. **Register `ObservabilityModule`** in both apps and add health endpoints
7. **Fix empty `catch` blocks** to log errors before falling back
8. **Fix `activeUsers` query** to measure actual activity, not just new registrations
