# Azeebo+ Backend Issues Report

**Date:** 2026-07-14
**Scope:** Server-side code, databases, backend APIs, server configs, and backend dependencies — 27 microservices (`services/`), 2 backend API apps (`apps/admin`, `apps/creator-portal`), and backend-oriented shared packages (`packages/security`, `packages/shared-services`, `packages/auth`, etc.)
**Method:** Static analysis, repo-wide pattern matching, and manual source review of controllers, services, DTOs, guards, Prisma schemas, `main.ts`/`app.module.ts`, infrastructure configs, and `package.json` files. Cross-cutting findings were spot-verified against source.

Severity legend: **Critical** (exploitable / data loss / financial / compliance), **High** (breaks functionality or major risk), **Medium** (correctness / maintainability), **Low** (cosmetic / minor).

---

## Table of Contents

1. [Dead Code](#1-dead-code)
2. [Unused Code](#2-unused-code)
3. [Duplicate Code](#3-duplicate-code)
4. [Placeholder Code](#4-placeholder-code)
5. [Stub Implementations](#5-stub-implementations)
6. [TODO / FIXME / HACK Annotations](#6-todo--fixme--hack-annotations)
7. [Naming Inconsistencies](#7-naming-inconsistencies)
8. [Logic Inconsistencies](#8-logic-inconsistencies)
9. [Style Inconsistencies](#9-style-inconsistencies)
10. [Architectural Violations](#10-architectural-violations)
11. [Security Issues](#11-security-issues)
12. [Performance Bottlenecks](#12-performance-bottlenecks)
13. [Database Inconsistencies](#13-database-inconsistencies)
14. [API Inconsistencies](#14-api-inconsistencies)
15. [Test Coverage Gaps](#15-test-coverage-gaps)
16. [Documentation Mismatches](#16-documentation-mismatches)
17. [Dependency Issues](#17-dependency-issues)
18. [Configuration Drift](#18-configuration-drift)
19. [Deprecated / Legacy Code](#19-deprecated--legacy-code)
20. [Summary by Severity](#20-summary-by-severity)

---

## 1. Dead Code

### 1.1 Redundant per-route `AuthGuard('jwt')` with no registered strategy
| Field | Detail |
|-------|--------|
| **Files** | `services/universes/reality-service/src/modules/reality/reality.controller.ts:57`, `services/universes/games-service/src/modules/games/games.controller.ts:26`, plus movie, comedy, sports, lifestyle, vertical controllers |
| **Severity** | High |

**Problem:** Seven universe services decorate controllers with `@UseGuards(AuthGuard('jwt'))` but never register a Passport `jwt` strategy (only creator-service registers one). Actual auth is enforced by the global `ServiceAuthGuard` (`APP_GUARD`). The per-route guard is therefore dead/redundant code that, if it ever executes, throws `Unknown authentication strategy "jwt"` (500 instead of 401).

**Fix:** Remove the redundant `@UseGuards(AuthGuard('jwt'))` and rely on the global `ServiceAuthGuard` + `@Public()` for open routes, OR register the shared `JwtStrategy` in each service. Pick one pattern repo-wide.

### 1.2 Dead email-verification token generation
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/src/modules/auth/auth.service.ts:329-346` |
| **Severity** | Medium |

**Problem:** `resendVerification` generates and stores an `email_verification` token in Redis but never sends it (no notification-service call), unlike `forgotPassword`. The generated token is dead — nothing consumes it.

**Fix:** Send the token via the notification service, or remove the dead token generation.

---

## 2. Unused Code

### 2.1 Unused/undefined identity field on `req.user`
| Field | Detail |
|-------|--------|
| **Files** | See [8.1](#81-requserid-vs-requsersub-identity-mismatch) |
| **Severity** | Critical (tracked under Logic Inconsistencies 8.1) |

### 2.2 Imported-but-unregistered `PassportModule` / `JwtModule`
| Field | Detail |
|-------|--------|
| **Files** | `services/universes/reality-service/src/modules/reality/reality.module.ts:14-24`, `services/universes/games-service/src/modules/games/games.module.ts:10-27` (pattern across 7 universe services) |
| **Severity** | Medium |

**Problem:** Modules import `PassportModule` and `JwtModule` but provide no strategy, so the imports do nothing at runtime.

**Fix:** Remove unused module imports or wire up a real strategy provider.

---

## 3. Duplicate Code

### 3.1 Per-service `redis.service.ts` duplicated despite shared package
| Field | Detail |
|-------|--------|
| **Files** | `common/services/redis.service.ts` duplicated in reality, comedy, lifestyle, sports services vs shared `packages/shared-services/src/redis/redis.service.ts` |
| **Severity** | Medium |

**Problem:** A shared Redis module exists but four universe services maintain byte-similar copies, violating the "No Duplication Policy" in CLAUDE.md.

**Fix:** Replace per-service copies with `@azeebo/shared-services` Redis module.

### 3.2 Duplicated JWT strategy
| Field | Detail |
|-------|--------|
| **Files** | `services/universes/creator-service/src/common/strategies/jwt.strategy.ts` vs `packages/shared-services/src/auth/jwt.strategy.ts` |
| **Severity** | Low |

**Fix:** Use the shared strategy.

### 3.3 Duplicated proxy verb handlers in api-gateway
| Field | Detail |
|-------|--------|
| **File** | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:967-1160` |
| **Severity** | High |

**Problem:** Three near-identical families of write handlers (`:version/:service/*path`, `:version/:service`, legacy `:service/*path` — POST/PUT/PATCH/DELETE each) plus four `pathStrategy` variants encoded per route. Large duplicate surface and routing-consistency hazard.

**Fix:** Standardize downstream global-prefix conventions (`/v1/<service>`) so a single path-building strategy suffices; collapse duplicated verb handlers into shared helpers.

---

## 4. Placeholder Code

### 4.1 In-memory analytics buffer (self-documented temporary solution)
| Field | Detail |
|-------|--------|
| **File** | `services/operations/support-service/src/modules/analytics/analytics.service.ts:12-15,49-60` |
| **Severity** | High |

**Problem:** Comment states the in-memory array is "a temporary solution and should be replaced with database persistence." Events push to a process-local array (cap 10000), lost on restart and not shared across replicas.

**Fix:** Persist to the service DB or emit to analytics-service via the event bus.

---

## 5. Stub Implementations

### 5.1 GDPR deletion stubs
| Field | Detail |
|-------|--------|
| **File** | `services/core/user-service/src/modules/users/users.service.ts:696-716` |
| **Severity** | Critical |

**Problem:** `scheduleDataDeletion`, `deleteUserData`, and `getDeletionStatus` return hardcoded responses. GDPR Article 17 deletion requests are silently lost — legal/compliance exposure.

**Fix:** Implement deletion scheduling via queue-service, add a `DataDeletionRequest` Prisma model, implement anonymization preserving referential integrity, and real status tracking.

### 5.2 Stubbed media duration extraction
| Field | Detail |
|-------|--------|
| **File** | `services/core/media-service/src/modules/upload/s3.service.ts:214-219` |
| **Severity** | Critical |

**Problem:** `extractVideoDuration`/`extractAudioDuration` always return hardcoded values (120s / 300s). Duration validation is meaningless; users can upload arbitrarily long media validated as short clips → storage cost abuse.

**Fix:** Use `ffprobe` to extract real duration; fail uploads exceeding limits; cache result on the media record.

### 5.3 Simplified Apple JWK→PEM conversion
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/src/modules/auth/social/social.service.ts:140-155` |
| **Severity** | High |

**Problem:** `convertAppleKeyToPem` is documented as "a simplified implementation" and uses CommonJS `require('crypto')`. Apple token signature verification is security-critical.

**Fix:** Use a vetted JWK→PEM library (e.g. `jose`); replace `require` with a static import.

### 5.4 Hardcoded zero creator stats
| Field | Detail |
|-------|--------|
| **File** | `services/universes/creator-service` (creator stats aggregation) |
| **Severity** | High |

**Problem:** Creator dashboard stats return hardcoded zeros rather than aggregated data.

**Fix:** Implement real aggregation queries against earnings/content tables.

---

## 6. TODO / FIXME / HACK Annotations

Repo-wide scan found 320 annotation occurrences across 80 files (backend + frontend). Backend-relevant hotspots:

| Location | Context |
|----------|---------|
| `packages/security/src/rate-limiter/rate-limit.service.ts:1` | Rate-limiter TODO marker |
| `packages/shared-types/src/secret-validation.ts:14` | Secret validation notes |
| `services/universes/reality-service/src/modules/reality/reality.service.ts` | Inline TODO markers |
| `services/operations/support-service/src/modules/analytics/analytics.service.ts:12` | "temporary solution" SECURITY note |

**Fix:** Triage each annotation into a tracked issue; remove resolved markers. Fail CI on new `FIXME`/`HACK` in `services/` if policy requires.

---

## 7. Naming Inconsistencies

### 7.1 `moderator` role not in Prisma enum
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/src/modules/auth/auth.service.ts:348-365` vs `prisma/schema.prisma:12-17` |
| **Severity** | Medium |

**Problem:** `selectRole` allows `['user','creator','moderator']` but the `UserRole` enum is `{user, creator, admin, super_admin}`. Selecting `moderator` fails at the DB layer.

**Fix:** Reconcile the allowed-roles list with the enum.

### 7.2 Inconsistent controller version prefixes
| Field | Detail |
|-------|--------|
| **Files** | notification/reward/analytics/subscription use `@Controller('v1/...')`; recommendation-admin, reward-admin, notification-admin use bare `@Controller('admin')` |
| **Severity** | Medium (tracked under [14. API Inconsistencies](#14-api-inconsistencies)) |

---

## 8. Logic Inconsistencies

### 8.1 `req.user.id` vs `req.user.sub` identity mismatch (CONFIRMED)
| Field | Detail |
|-------|--------|
| **Guard** | `packages/security/src/guards/service-auth.guard.ts:90-94, 117-121` sets `request.user = { sub, role, email }` (no `id`) |
| **Strategy** | `packages/shared-services/src/auth/jwt.strategy.ts:40-46` returns `{ sub, email, role }` |
| **Broken readers** | wallet `wallet.controller.ts:52,68,86,98,113,129,156,182,237,249,260`; payment `payments.controller.ts:124,186,238`; content `content.controller.ts:498,546,595,608,622`; media `upload.controller.ts:242,329`; search `search.controller.ts:120`; user-service `interactions.controller.ts` (all); reality/creator/games/movie/comedy/sports/lifestyle/vertical controllers |
| **Correct usage** | `user-service/.../users.controller.ts:40` and `lifestyle-service/.../social/social.controller.ts:16-73` use `req.user.sub` |
| **Severity** | Critical |

**Problem:** The guard and strategy attach identity as `sub`, but most controllers read `req.user.id`, which is `undefined`. User-scoped queries run with `userId=undefined` — throwing, returning empty/global data, or (wallet) crediting/creating records keyed on `undefined`.

**Fix:** Standardize the authenticated principal. Either normalize in the guard (`id = sub`) or change all controllers to read `req.user.sub`. Update inline `{ user: { id: string } }` types to `{ sub: string }`. Add a contract test asserting the principal shape.

### 8.2 Uncapped payout distribution
| Field | Detail |
|-------|--------|
| **File** | `services/universes/sports-service/src/modules/sports/sports.service.ts:447-545` |
| **Severity** | Critical |

**Problem:** `resolveEventPredictions` distributes a hardcoded reward (100) to every correct predictor with no cap. A popular event can drain the reward pool.

**Fix:** Add `maxPayoutPool`; make reward proportional (`min(baseReward, totalPool / correctPredictors)`); move amount to config; add pool-depletion alerting.

### 8.3 Unlimited voting (no dedup)
| Field | Detail |
|-------|--------|
| **File** | `services/universes/lifestyle-service/src/modules/challenges/challenge.service.ts:140-155` |
| **Severity** | Critical |

**Problem:** `voteSubmission` accepts `userId` but never dedups; no join table records votes. Users can vote unlimited times.

**Fix:** Add a `ChallengeVote` table with unique `[userId, challengeId]`; check before insert.

### 8.4 Inconsistent vote monetization in reality-service
| Field | Detail |
|-------|--------|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:263-303` |
| **Severity** | Medium |

**Problem:** `submitVote` performs no wallet debit while `submitVotesWithQuantity` and `submitSupervote` charge. Plain `/votes` creates free votes.

**Fix:** Confirm intended monetization; apply cost consistently or document free votes.

---

## 9. Style Inconsistencies

### 9.1 Malformed import formatting (pervasive)
| Field | Detail |
|-------|--------|
| **Files** | `services/core/auth-service/src/modules/auth/auth.service.ts:1`, `services/universes/reality-service/.../reality.service.ts:1`, `services/universes/sports-service/.../sports.service.ts:1`, and most service files |
| **Severity** | Low |

**Problem:** First import lines are malformed (`import {Inject,  Injectable,` / decorators on the same line), indicating Prettier/ESLint was never run.

**Fix:** Run `eslint --fix` / Prettier across all `services/` `src` trees; add a CI format check.

---

## 10. Architectural Violations

### 10.1 Universe services re-implement shared infra
See [3.1](#31-per-service-redisservicets-duplicated-despite-shared-package) and [3.2](#32-duplicated-jwt-strategy). Violates CLAUDE.md "Always reuse shared services and packages."

### 10.2 Dual legacy-route strategies in api-gateway
| Field | Detail |
|-------|--------|
| **Files** | `services/gateway/api-gateway/src/app.module.ts:79-80` (`LegacyRedirectMiddleware`) + `proxy.controller.ts:1082-1160` (legacy passthrough handlers) |
| **Severity** | High |

**Problem:** Unversioned calls are handled two different ways simultaneously (redirect middleware AND proxy passthrough).

**Fix:** Pick one legacy strategy; remove the other.

---

## 11. Security Issues

### 11.1 Real shared `GATEWAY_SECRET` committed in 27+ `.env` files (CONFIRMED)
| Field | Detail |
|-------|--------|
| **Files** | `GATEWAY_SECRET=L6iQ8sDmBUHKP2h8JLLGin/GeqKl3KLyVZdJHGx+pJQ=` present in every service `.env` — auth, wallet, payment, media, search, user, content, api-gateway, and all universe/engagement/ops/intelligence services (55 matching lines) |
| **Severity** | Critical |

**Problem:** A real high-entropy base64 secret is duplicated across 27+ tracked `.env` files. `.gitignore` ignores `.env`, so it bypasses review. Canonical templates hold placeholders (root `.env.example:100` = `<generate-random-secret>`), confirming this is a leaked live value. The same `.env` files also embed `DATABASE_PASSWORD=azeebo_dev_2024`.

**Fix:** Rotate `GATEWAY_SECRET` immediately. Check history (`git log --all -- '**/.env'`) and purge if committed. Remove real `.env` files from the tree; keep only `.env.example`; source runtime config from a secret manager / External Secrets.

### 11.2 OAuth social callback account takeover
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/src/modules/auth/social/social.controller.ts:117-128` |
| **Severity** | Critical |

**Problem:** The callback accepts `email` from the request body without verifying it against the provider, and uses `dto.code` (the authorization code) as the `socialId`. An attacker can log in as any user by supplying their email.

**Fix:** Implement real OAuth code exchange; verify `id_token` signature; extract email + provider ID from the verified token; remove `email` from the request DTO.

### 11.3 Missing authorization on lifestyle write endpoints
| Field | Detail |
|-------|--------|
| **Files** | `services/universes/lifestyle-service/src/modules/*/` — music.controller.ts, celebrity.controller.ts, influencer.controller.ts, social.controller.ts |
| **Severity** | Critical |

**Problem:** Controllers use `AuthGuard('jwt')` but no `RolesGuard`. Any authenticated user can create/update/delete content.

**Fix:** Add `@UseGuards(RolesGuard)` + `@Roles('ADMIN')` (or `'CREATOR','ADMIN'`) on write handlers.

### 11.4 `userId` spoofing on lifestyle social endpoints
| Field | Detail |
|-------|--------|
| **File** | `services/universes/lifestyle-service/src/modules/social/social.controller.ts` (legacy save/unsave DTOs) |
| **Severity** | Critical |

**Problem:** Some handlers accept `userId` from the body rather than the JWT, enabling impersonation. (Note: current `social.controller.ts:16-73` reads `req.user.sub` correctly — verify all handlers.)

**Fix:** Remove `userId` from DTOs; always use `req.user.sub`.

### 11.5 `validatePremiumUrl` has no auth guard
| Field | Detail |
|-------|--------|
| **File** | `services/core/media-service/src/modules/upload/upload.controller.ts` (`validatePremiumUrl`, ~361-376) |
| **Severity** | High |

**Problem:** Unauthenticated endpoint leaks `contentId` and `userId` from URL tokens.

**Fix:** Add `@UseGuards(AuthGuard('jwt'))` (or rely on global guard) and restrict.

### 11.6 Admin controllers with weaker guard stacks
| Field | Detail |
|-------|--------|
| **Files** | `services/intelligence/recommendation-service/src/modules/admin/admin.controller.ts:8` and `services/engagement/notification-service/src/modules/admin/admin.controller.ts:9` use `@UseGuards(AdminGuard)` only |
| **Severity** | High |

**Problem:** Sibling admin controllers (reward-service `admin.controller.ts:9`, analytics-service `admin.controller.ts:10`) use `AuthGuard('jwt') + AdminGuard + RateLimitGuard`. The two above omit JWT and rate-limit guards; notification admin can broadcast system-wide notifications to arbitrary `userIds`.

**Fix:** Align guard stacks; add `AuthGuard('jwt')` and `RateLimitGuard`, or confirm `AdminGuard` independently authenticates.

### 11.7 Rate limiting disabled when NODE_ENV unset
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/src/main.ts` (~40-42) |
| **Severity** | High |

**Problem:** Auth rate limiting is disabled unless `NODE_ENV` is set to a specific value, so a misconfigured prod deploy has no auth throttling.

**Fix:** Default rate limiting to ENABLED; disable only for explicit test env.

### 11.8 Plaintext social provider tokens at rest
| Field | Detail |
|-------|--------|
| **File** | `services/core/auth-service/prisma/schema.prisma:43-60` (`SocialAccount.accessToken/refreshToken` as `String?`) |
| **Severity** | Low |

**Fix:** Encrypt at rest or avoid persisting provider tokens.

### 11.9 Input validation gaps
| Field | Detail |
|-------|--------|
| **Files** | payment-service (no min/max on monetary inputs); 20+ services (no max pagination limit) |
| **Severity** | Medium |

**Fix:** Add `@Min/@Max` on monetary fields; `ParseIntPipe({minValue:1,maxValue:100})` on pagination; `ParseUUIDPipe` on IDs; `@IsEnum` on enum fields.

---

## 12. Performance Bottlenecks

### 12.1 Unbounded queries
| Location | Problem |
|----------|---------|
| `services/engagement/notification-service` (`sendSystemNotification`, ~106) | Unbounded `$transaction` array for all users |
| `services/engagement/subscription-service/src/modules/subscription/subscription.service.ts:33-39` | `getPlans()` `findMany` with no `take` |
| `services/operations/queue-service` | Job queries without LIMIT |
| `services/intelligence/analytics-service` | Funnel queries without time bounds |

**Fix:** Batch notification creation in groups of 100; add mandatory time-range filters on analytics; add pagination limits.

### 12.2 Overly broad cache invalidation
| Field | Detail |
|-------|--------|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:289,365` |
| **Severity** | Low |

**Problem:** Every vote invalidates `reality:*` (all reality cache entries).

**Fix:** Invalidate targeted keys only (`reality:show:<id>`, `reality:contestants:<id>`).

### 12.3 Missing caching layers
| Data | Recommended cache |
|------|-------------------|
| User profiles | Redis, 5min TTL, invalidate on update |
| Content metadata | Redis, 2min TTL, invalidate on edit/publish |
| Leaderboards | Redis sorted sets, 1min TTL, incremental updates |

---

## 13. Database Inconsistencies

### 13.1 Missing indexes (~58 composite indexes)
Highest impact:

| Schema | Table | Missing Index | Query Pattern |
|--------|-------|---------------|---------------|
| queue-service | Job | `[status, priority]` | Queue polling |
| reality-service | Rental | `[status, endTime]` | Expiration check |
| subscription-service | Pass | `[status, endTime]` | Expiration check |
| content-service | ContentItem | `[universeId, status]` | Feed queries |
| wallet-service | WalletTransaction | `[walletId, createdAt]` | History queries |
| auth-service | User | `[email]` | Login lookup |
| sports-service | Prediction | `[eventId, userId]` | Dedup check |
| reward-service | LeaderboardEntry | `[period, score]` | Leaderboard query |
| creator-service | CreatorEarning | `[creatorId, period]` | Earnings query |

**Fix:** Add indexes via Prisma migrations, prioritized: Tier 1 auth/wallet/payment, Tier 2 content/job/rental, Tier 3 analytics/recommendation.

### 13.2 Missing vote-dedup constraint
See [8.3](#83-unlimited-voting-no-dedup). Add unique `[userId, challengeId]` (and `[eventId, userId]` for sports predictions).

### 13.3 Plaintext token columns
See [11.8](#118-plaintext-social-provider-tokens-at-rest).

---

## 14. API Inconsistencies

### 14.1 Inconsistent version prefixing across controllers
| Field | Detail |
|-------|--------|
| **Files** | notification/reward/analytics/subscription use `@Controller('v1/...')`; recommendation-admin, reward-admin, notification-admin use bare `@Controller('admin')` |
| **Severity** | Medium |

**Fix:** Normalize all admin controllers to a versioned prefix.

### 14.2 Gateway path-strategy divergence
See [3.3](#33-duplicated-proxy-verb-handlers-in-api-gateway) — four `pathStrategy` variants because downstream services mount global prefixes differently.

**Fix:** Standardize downstream prefixes to `/v1/<service>`.

---

## 15. Test Coverage Gaps

| Field | Detail |
|-------|--------|
| **Severity** | High |

**Problem:** Critical financial/auth paths lack tests: no test asserts the `req.user` principal shape (would have caught [8.1](#81-requserid-vs-requsersub-identity-mismatch)); no tests for payout capping ([8.2](#82-uncapped-payout-distribution)), vote dedup ([8.3](#83-unlimited-voting-no-dedup)), or OAuth callback verification ([11.2](#112-oauth-social-callback-account-takeover)). CLAUDE.md mandates >80% coverage and integration tests for all endpoints.

**Fix:** Add contract tests for the auth principal shape; integration tests asserting unauthenticated requests → 401; unit tests for payout capping and vote dedup.

---

## 16. Documentation Mismatches

| Field | Detail |
|-------|--------|
| **Severity** | Low |

**Problem:** CLAUDE.md lists 18 shared packages, but the repo contains 21 (`packages/` includes `event-bus`, `http-client`, `shared-queue` not in the doc). Package count/architecture doc is stale.

**Fix:** Update CLAUDE.md package inventory to match `packages/`.

---

## 17. Dependency Issues

| Field | Detail |
|-------|--------|
| **Severity** | Medium (needs follow-up) |

**Problem:** Exhaustive version-diffing across all backend `package.json` files was not completed. Observed: `^` ranges in several services allow drift; multiple Prisma client versions generated per service.

**Fix:** Run `pnpm audit` and `pnpm outdated -r`; pin versions; enforce a single Prisma/NestJS version via workspace catalog.

---

## 18. Configuration Drift

### 18.1 Committed `.env` files diverge from templates
See [11.1](#111-real-shared-gateway_secret-committed-in-27-env-files-confirmed). Real `.env` files carry live secrets and dev DB passwords while `.env.example` holds placeholders — the environments have drifted.

**Fix:** Remove real `.env` from the tree; drive all env from a secret store per environment; add a CI check that `.env` is never committed.

---

## 19. Deprecated / Legacy Code

### 19.1 Legacy unversioned gateway routes
See [10.2](#102-dual-legacy-route-strategies-in-api-gateway). Legacy `:service/*path` passthrough handlers should be sunset once clients migrate to `/v1/`.

### 19.2 CommonJS `require` in ESM codebase
See [5.3](#53-simplified-apple-jwkpem-conversion) — `require('crypto')` in auth-service should be a static import.

---

## 20. Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| **Critical** | 8 | Committed GATEWAY_SECRET (11.1), OAuth takeover (11.2), lifestyle missing authz (11.3), userId spoofing (11.4), `req.user.id` mismatch (8.1), uncapped payouts (8.2), unlimited voting (8.3), GDPR stubs (5.1) |
| **High** | 11 | Media duration stub (5.2), Apple JWK stub (5.3), creator zero stats (5.4), gateway duplicate handlers (3.3), dual legacy routes (10.2), weak admin guards (11.6), rate-limit disable (11.7), validatePremiumUrl (11.5), in-memory analytics (4.1), redundant jwt guard (1.1), test gaps (15) |
| **Medium** | 9 | Redis duplication (3.1), role enum drift (7.1), vote monetization (8.4), version prefixing (14.1), input validation (11.9), unbounded queries (12.1), missing indexes (13.1), dependency drift (17), unused modules (2.2) |
| **Low** | 6 | Import formatting (9.1), plaintext tokens (11.8), broad cache invalidation (12.2), JWT strategy dup (3.2), doc mismatch (16), require vs import (19.2) |

**Top 3 to fix immediately:**
1. Rotate and remove the committed `GATEWAY_SECRET` (11.1)
2. Fix the `req.user.id`/`sub` mismatch platform-wide (8.1)
3. Fix OAuth callback verification + lifestyle authorization (11.2, 11.3)
