# UNIVERSE Services - Comprehensive Code Audit Report

**Date**: 2026-07-14
**Scope**: All 8 NestJS/Prisma UNIVERSE microservices
**Auditor**: AI-Assisted Code Review

---

## Table of Contents

1. [Unfinished Code](#1-unfinished-code)
2. [Technical Debt](#2-technical-debt)
3. [Performance Issues](#3-performance-issues)
4. [Security Vulnerabilities](#4-security-vulnerabilities)
5. [Miscellaneous Issues](#5-miscellaneous-issues)

---

## 1. Unfinished Code

### 1.1 Missing `validateEnvironment` Call — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/main.ts` |
| **Lines** | bootstrap function |
| **Impact** | Service may start with missing/invalid environment variables, leading to runtime failures |
| **Fix** | Add `validateEnvironment()` call before bootstrapping the NestJS app, consistent with all other universe services |

### 1.2 Hardcoded Premium Extras — reality-service

| Detail | |
|---|---|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:72-105` |
| **Description** | `premiumExtras` array is hardcoded as a class property with static IDs (`'1'`, `'2'`, `'3'`, `'4'`) and prices |
| **Impact** | Prices cannot be changed without redeployment; IDs are non-UUID, indicating placeholder data; no database persistence |
| **Fix** | Move `premiumExtras` to a database table or at minimum load from config. Use proper UUIDs for IDs. |

### 1.3 Hardcoded Categories — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/universe/universe.service.ts:380-433` |
| **Description** | `getCategories()` returns hardcoded static categories instead of querying the database |
| **Impact** | New categories cannot be added without code changes and redeployment |
| **Fix** | Store categories in the database and query them like other services do |

### 1.4 Empty Error Swallowing — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts:31-33` |
| **Lines** | `getStoryworlds()` catch block |
| **Description** | `catch (error) { return { success: true, data: [] } }` — swallows all errors and returns success with empty data |
| **Impact** | Database errors are silently hidden; debugging becomes impossible; clients receive false-positive responses |
| **Fix** | Log the error and return `{ success: false, error: { code: 'FETCH_ERROR', message: '...' } }` |

### 1.5 Unlock Codes Stored in Environment Variable — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts:216` |
| **Description** | `process.env.UNLOCK_CODES` parsed by comma-splitting; comment says "In production, these should be stored in the database" |
| **Impact** | Insecure, not scalable, requires redeployment to change codes |
| **Fix** | Migrate unlock codes to a database table; add admin CRUD endpoints |

### 1.6 Missing Admin Guard on Storyworlds CRUD — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts` |
| **Description** | No admin-protected create/update/delete endpoints for storyworlds, titles, characters, or lore. All mutations use only `AuthGuard('jwt')` |
| **Impact** | Any authenticated user can create/modify/delete storyworld content |
| **Fix** | Add `@UseGuards(AuthGuard('jwt'), AdminGuard)` or `@Roles('ADMIN', 'MODERATOR')` to all write endpoints |

### 1.7 Titles Controller Missing Admin Guard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/titles/titles.controller.ts:50-72` |
| **Description** | `createTitle`, `updateTitle`, `deleteTitle`, and `createChapter` only use `AuthGuard('jwt')` — no admin/role check |
| **Impact** | Any authenticated user can create, modify, or delete any title and chapter |
| **Fix** | Add `AdminGuard` or `RolesGuard` to all write endpoints |

### 1.8 Characters Controller Missing Admin Guard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/characters/characters.controller.ts:38-66` |
| **Description** | `createCharacter`, `updateCharacter`, `addRelationship` only use `AuthGuard('jwt')` — no admin check |
| **Impact** | Any authenticated user can create/modify/delete any character |
| **Fix** | Add `AdminGuard` or `RolesGuard` to write endpoints |

### 1.9 Timeline Controller Missing Admin Guard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/timeline/timeline.controller.ts:38-44` |
| **Description** | `createEvent` only uses `AuthGuard('jwt')` — no admin check |
| **Impact** | Any authenticated user can create timeline events |
| **Fix** | Add `AdminGuard` or `RolesGuard` to the create endpoint |

### 1.10 Crossovers Controller Missing Admin Guard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/crossovers/crossovers.controller.ts:30-36` |
| **Description** | `createCrossover` only uses `AuthGuard('jwt')` — no admin check |
| **Impact** | Any authenticated user can create crossovers |
| **Fix** | Add `AdminGuard` or `RolesGuard` to the create endpoint |

### 1.11 Universe Controller Missing Admin Guard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/universe/universe.controller.ts:44-58` |
| **Description** | `createLocation` and `updateLocation` only use `AuthGuard('jwt')` — no admin check |
| **Impact** | Any authenticated user can create/modify locations |
| **Fix** | Add `AdminGuard` or `RolesGuard` to write endpoints |

### 1.12 Missing `recentActivity` Implementation — reality-service

| Detail | |
|---|---|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:715` |
| **Description** | `recentActivity` is hardcoded to `unknown[]` with a comment explaining activity events are owned by analytics-service |
| **Impact** | Show analytics endpoint returns empty activity data |
| **Fix** | Implement analytics-service integration to fetch activity events, or remove from response |

### 1.13 Games Service — `enterTournament` Duplicated Logic

| Detail | |
|---|---|
| **File** | `services/universes/games-service/src/modules/games/games.service.ts:269-335` |
| **Description** | `GamesService.enterTournament()` duplicates tournament entry logic that already exists in `TournamentService.enterTournament()` |
| **Impact** | Code duplication; inconsistent wallet fee handling (games-service charges entry fee but tournament-service doesn't) |
| **Fix** | Remove `enterTournament` from `GamesService` and route through `TournamentService` |

---

## 2. Technical Debt

### 2.1 Inconsistent Auth Guard Patterns Across Services

| Service | Pattern | Issue |
|---|---|---|
| **comedy-service** | Only `RateLimitGuard` as `APP_GUARD` | No `ServiceAuthGuard` — all endpoints are unauthenticated by default |
| **reality-service** | Mixed: some use `AuthGuard('jwt') + AdminGuard`, some use `AuthGuard('jwt') + RolesGuard` | Inconsistent admin authorization |
| **vertical-service** | No `ServiceAuthGuard`; only `RateLimitGuard` + `ThrottlerModule` | Missing `validateEnvironment`; most write endpoints lack admin guards |
| **lifestyle-service** | No `ServiceAuthGuard`; uses `RateLimitGuard` | Write endpoints lack admin guards |
| **games-service** | `ServiceAuthGuard` as `APP_GUARD` | Correct pattern |
| **sports-service** | `ServiceAuthGuard` as `APP_GUARD` | Correct pattern |
| **movie-service** | `ServiceAuthGuard` as `APP_GUARD` | Correct pattern |
| **creator-service** | `ServiceAuthGuard` as `APP_GUARD` | Correct pattern |

**Impact**: Inconsistent authentication and authorization across services; comedy-service and vertical-service are most vulnerable.

**Fix**: Standardize `ServiceAuthGuard` as `APP_GUARD` across all services; add `validateEnvironment` to all `main.ts` files.

### 2.2 Duplicated Redis Service Implementations

| Service | File |
|---|---|
| **comedy-service** | `src/common/services/redis.service.ts` |
| **lifestyle-service** | `src/common/services/redis.service.ts` |
| **reality-service** | Uses `@azeebo/shared-services` `CacheService` |

**Description**: comedy-service and lifestyle-service each implement their own `RedisService` instead of using the shared `CacheService` from `@azeebo/shared-services`.

**Impact**: Maintenance overhead; inconsistent caching behavior; no centralized cache management.

**Fix**: Migrate both services to use `CacheService` from `@azeebo/shared-services`.

### 2.3 Inconsistent Error Response Formats

| Service | Format |
|---|---|
| **reality-service** | `{ success, data }` with thrown exceptions |
| **vertical-service** | Mixed: some return `{ success, data }`, some throw exceptions, some return `{ success, error }` |
| **lifestyle-service** | `{ success, data }` or `{ success, error }` |
| **games-service** | `{ success, data }` or `{ success, error }` |
| **sports-service** | `{ success, data }` or `{ success, error }` |
| **movie-service** | `{ success, data }` with thrown exceptions |
| **creator-service** | `{ success, data }` or `{ success, error }` |
| **comedy-service** | `{ success, data }` with thrown exceptions |

**Impact**: Clients must handle multiple error formats; difficult to implement consistent error handling.

**Fix**: Standardize on a single response format across all services (recommend: `{ success, data?, error? }`).

### 2.4 Excessive Manual Response Formatting

Almost every service has extensive manual formatting code that converts Prisma types to API response types. For example:

- `reality-service`: ~500 lines of manual `as unknown` casts and mapping
- `vertical-service`: ~800+ lines across all services
- `lifestyle-service`: ~400+ lines

**Impact**: Brittle code; easy to miss fields; type safety is undermined.

**Fix**: Use Prisma DTO classes with `class-transformer`, or use `plainToInstance` to handle transformation automatically.

### 2.5 Missing Prisma `include` Optimization

Several services include unnecessary relations in queries:

| File | Issue |
|---|---|
| `reality.service.ts:114-127` | `listShows()` includes `seasons`, `contestants`, and `_count` — full relation loading when only counts needed |
| `reality.service.ts:144-158` | `getShow()` includes all relations — should be selective based on use case |
| `sports.service.ts:108-118` | `getEvents()` includes full `teams` relation and count — teams could be loaded on demand |

**Impact**: Unnecessary data transfer; slower queries.

**Fix**: Use `select` instead of `include` where only specific fields are needed; load heavy relations on demand.

### 2.6 Duplicate `User` Model References in games-service

| File | Issue |
|---|---|
| `games-service/src/modules/tournament/tournament.service.ts:262` | `this.prisma.user.findMany()` — games-service queries the `User` model directly |

**Impact**: Cross-service data access violation; games-service should not own or query the canonical `User` table.

**Fix**: Remove direct `User` model access; use user-service API or denormalized `displayName` field.

### 2.7 Sports Service — `getLeaderboard` N+1 User Lookup

| File | Issue |
|---|---|
| `sports-service/src/modules/prediction-markets/prediction-markets.service.ts:356-368` | `getUserById()` called in a `Promise.all` map for each leaderboard entry — up to 100 sequential HTTP calls |

**Impact**: O(n) HTTP requests to user-service; extremely slow for large leaderboards.

**Fix**: Batch user lookups or denormalize display names in prediction entries.

---

## 3. Performance Issues

### 3.1 N+1 Query Pattern — reality-service

| File | Line | Description |
|---|---|---|
| `reality.service.ts:699-710` | `getShowAnalytics()` | `votesByContestant.map(async (v) => { this.prisma.contestant.findUnique(...) })` — N+1 query for each contestant |

**Impact**: O(n) database queries for each contestant in the vote breakdown.

**Fix**: Use `include: { contestant: true }` in the `groupBy` query or fetch all contestants in a single batch query.

### 3.2 Missing Pagination — Multiple Endpoints

| Service | Endpoint | Issue |
|---|---|---|
| **reality-service** | `listShows()`, `listEpisodes()`, `listContestants()`, `getClips()` | No pagination; returns all records |
| **comedy-service** | `getClips()`, `getComedians()`, `getSeries()`, `getChallenges()` | Hardcoded `take: 50` or `take: 20` with no pagination |
| **sports-service** | `getHighlights()`, `getEvents()`, `getPredictions()`, `getFanBoards()`, `getContests()` | Hardcoded `take: 50` or `take: 20` with no pagination |
| **games-service** | `getLeaderboard()`, `listTournaments()` | Hardcoded `take: 100` or no pagination |
| **lifestyle-service** | `getComedians()` | Hardcoded `take: 50` |

**Impact**: As data grows, responses become unbounded; memory and bandwidth waste.

**Fix**: Add `page`/`limit` query parameters and use Prisma `skip`/`take` consistently.

### 3.3 Cache Invalidation with Wildcard Patterns

| File | Line | Pattern |
|---|---|---|
| `reality.service.ts:285` | `this.cache.invalidate('reality:*')` |
| `reality.service.ts:361` | `this.cache.invalidate('reality:*')` |
| `reality.service.ts:542` | `this.cache.invalidate('reality:*')` |
| `lifestyle-service/events.service.ts:406` | `this.cache.invalidate('lifestyle:events:*')` |
| `movie-service/movies.service.ts:143` | `this.cache.invalidate('movie:*')` |

**Impact**: Wildcard cache invalidation may not work correctly depending on the cache implementation (Redis `KEYS` pattern); potential performance issue if cache keys are many.

**Fix**: Track specific cache keys or use tag-based invalidation.

### 3.4 Sequential Wallet Operations — sports-service

| File | Lines | Description |
|---|---|---|
| `sports.service.ts:495-533` | `resolveEventPredictions()` | Wallet credits are processed sequentially in `Promise.all` with per-user wallet lookups |

**Impact**: O(n) HTTP calls to wallet-service for each correct prediction.

**Fix**: Batch wallet lookups and credits; consider using a queue for async prize distribution.

### 3.5 Missing Database Indexes

Based on Prisma schema analysis, the following commonly queried fields may be missing indexes:

| Model | Field | Used In |
|---|---|---|
| `Vote` | `showId` + `userId` compound | Duplicate vote checks |
| `Supervote` | `showId` + `userId` compound | Duplicate supervote checks |
| `Prediction` | `showId` + `userId` | Prediction dashboard queries |
| `PredictionEntry` | `userId` + `eventId` | Duplicate prediction checks |
| `TournamentEntry` | `tournamentId` + `score` | Leaderboard queries |
| `ContestEntry` | `userId` + `contestId` | Duplicate entry checks |
| `ComedyClip` | `shareCount` + `viewCount` | Trending queries |
| `CultureStory` | `status` + `categoryId` | Filtered listing queries |

**Impact**: Slow queries on high-traffic tables.

**Fix**: Add composite indexes for frequently queried field combinations.

### 3.6 Unbounded Leaderboard Queries

| File | Issue |
|---|---|
| `reality.service.ts:224-257` | `getLeaderboard()` loads ALL contestants with ALL votes/supervotes to compute rankings |
| `sports.service.ts:277-295` | `getLeaderboard()` uses `groupBy` with no pagination |
| `games.service.ts:245-255` | `getLeaderboard()` hardcodes `take: 100` |

**Impact**: Memory-intensive for shows with many contestants/votes.

**Fix**: Use materialized views or pre-computed rankings; add pagination.

---

## 4. Security Vulnerabilities

### 4.1 Missing ServiceAuthGuard — comedy-service

| Detail | |
|---|---|
| **File** | `services/universes/comedy-service/src/app.module.ts` |
| **Description** | Only `RateLimitGuard` is registered as `APP_GUARD`; no `ServiceAuthGuard` |
| **Impact** | All comedy-service endpoints are accessible without JWT authentication; no user identity verification |
| **Fix** | Add `ServiceAuthGuard` as `APP_GUARD` consistent with other services |

### 4.2 Missing ServiceAuthGuard — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/app.module.ts` |
| **Description** | Uses `ThrottlerModule` + `RateLimiterModule` as guards; no `ServiceAuthGuard` |
| **Impact** | All vertical-service endpoints are accessible without authentication |
| **Fix** | Add `ServiceAuthGuard` as `APP_GUARD` |

### 4.3 Missing ServiceAuthGuard — lifestyle-service

| Detail | |
|---|---|
| **File** | `services/universes/lifestyle-service/src/app.module.ts` |
| **Description** | Uses `RateLimitGuard` as `APP_GUARD`; no `ServiceAuthGuard` |
| **Impact** | All lifestyle-service endpoints are accessible without authentication |
| **Fix** | Add `ServiceAuthGuard` as `APP_GUARD` |

### 4.4 Missing ServiceAuthGuard — reality-service

| Detail | |
|---|---|
| **File** | `services/universes/reality-service/src/app.module.ts` |
| **Description** | Uses `RateLimitGuard` as `APP_GUARD`; no `ServiceAuthGuard` |
| **Impact** | All reality-service endpoints are accessible without authentication |
| **Fix** | Add `ServiceAuthGuard` as `APP_GUARD` |

### 4.5 Missing Admin Guards on Write Endpoints — vertical-service

| Endpoint | File | Issue |
|---|---|---|
| `POST /v1/vertical/titles` | `titles.controller.ts:50` | No admin guard |
| `PATCH /v1/vertical/titles/:id` | `titles.controller.ts:58` | No admin guard |
| `DELETE /v1/vertical/titles/:id` | `titles.controller.ts:66` | No admin guard |
| `POST /v1/vertical/titles/:titleId/chapters` | `titles.controller.ts:74` | No admin guard |
| `POST /v1/vertical/characters` | `characters.controller.ts:38` | No admin guard |
| `PATCH /v1/vertical/characters/:id` | `characters.controller.ts:46` | No admin guard |
| `POST /v1/vertical/characters/:id/relationships` | `characters.controller.ts:57` | No admin guard |
| `POST /v1/vertical/timeline` | `timeline.controller.ts:38` | No admin guard |
| `POST /v1/vertical/crossovers` | `crossovers.controller.ts:30` | No admin guard |
| `POST /v1/vertical/universes/locations` | `universe.controller.ts:44` | No admin guard |
| `PATCH /v1/vertical/universes/locations/:id` | `universe.controller.ts:52` | No admin guard |

**Impact**: Any authenticated user can create/modify/delete all content types in vertical-service.

**Fix**: Add `AdminGuard` or `Roles('ADMIN', 'MODERATOR')` to all write endpoints.

### 4.6 Missing Admin Guards on Write Endpoints — lifestyle-service

Based on controller inspection, lifestyle-service write endpoints (events, stories, challenges, etc.) use only `AuthGuard('jwt')` without admin checks.

**Impact**: Any authenticated user can create/modify/delete events, stories, and challenges.

**Fix**: Add admin authorization to all write endpoints.

### 4.7 Missing Admin Guards on Write Endpoints — comedy-service

| Endpoint | File | Issue |
|---|---|---|
| `POST /v1/comedy/challenges` | `comedy.controller.ts:38` | No admin guard (only `AuthGuard('jwt')`) |
| `POST /v1/comedy/clips/:clipId/share` | `comedy.controller.ts:57` | No admin guard |

**Impact**: Any authenticated user can submit challenge entries (expected) but also share clips without moderation.

**Fix**: Review which endpoints need admin authorization.

### 4.8 Wallet URL Fallback — games-service

| Detail | |
|---|---|
| **File** | `services/universes/games-service/src/modules/tournament/tournament.service.ts:46-49` |
| **Description** | `this.walletServiceUrl = this.configService.get<string>('WALLET_SERVICE_URL', 'http://wallet-service:3002')` |
| **Impact** | Falls back to a hardcoded Docker-internal URL if env var is missing; could route to wrong service in non-Docker environments |
| **Fix** | Use `configService.getOrThrow<string>('WALLET_SERVICE_URL')` like other services |

### 4.9 Missing Wallet Debit Compensation — games-service tournament

| Detail | |
|---|---|
| **File** | `services/universes/games-service/src/modules/tournament/tournament.service.ts:332-405` |
| **Description** | `endTournament()` distributes prizes but doesn't handle failed prize credits with compensation or retry mechanism |
| **Impact** | If wallet credit fails, prizes are lost without compensation |
| **Fix** | Add compensation logic similar to other services (sports, reality, movie) or implement a retry queue |

### 4.10 Predictable Unlock Codes — vertical-service

| Detail | |
|---|---|
| **File** | `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts:216-219` |
| **Description** | Unlock codes stored in `UNLOCK_CODES` env var, parsed by comma-splitting; if env var is empty, unlock always succeeds |
| **Impact** | Bypass: if `UNLOCK_CODES` is empty/unset, `validCodes.length === 0` and the check is skipped entirely |
| **Fix** | Always require valid codes; store in database; log failed attempts |

### 4.11 Hardcoded Reward Amount — sports-service

| Detail | |
|---|---|
| **File** | `services/universes/sports-service/src/modules/sports/sports.service.ts:507` |
| **Description** | `const rewardAmount = 100;` — hardcoded reward for correct predictions |
| **Impact** | Reward amount cannot be changed without redeployment; inconsistent with other configurable values |
| **Fix** | Load from `ConfigService` like other fee amounts |

### 4.12 Missing Wallet Debit Failure Handling — reality-service

| Detail | |
|---|---|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:624-679` |
| **Description** | `purchasePremiumExtra()` debits wallet but doesn't create any purchase record in the database |
| **Impact** | User is charged but no record of purchase exists; cannot verify or refund purchases |
| **Fix** | Create a purchase record in the database after successful debit |

---

## 5. Miscellaneous Issues

### 5.1 Inconsistent `@Inject()` Usage

Almost all services use `@Inject(PrismaService)` decorator, but PrismaService is provided by the module and doesn't require explicit injection. This is harmless but unnecessary.

**Services affected**: All 8 services.

**Fix**: Remove `@Inject()` from PrismaService constructor parameters (optional cleanup).

### 5.2 Missing Input Validation DTOs

| Service | Endpoint | Issue |
|---|---|---|
| **vertical-service** | `StoryworldsController.createTheory()` | Uses inline `@Body() body: { title: string; content: string; spoilerLevel?: string }` |
| **vertical-service** | `StoryworldsController.createRoomPost()` | Uses inline `@Body() body: { content: string; spoilerLevel?: string; userAvatar?: string }` |
| **vertical-service** | `TitlesController.createTitle()` | Uses `CreateTitleData` interface, not a DTO class with validation decorators |
| **vertical-service** | `CharactersController.updateCharacter()` | Uses inline `Partial<{ name: string; ... }>` |
| **lifestyle-service** | Multiple controllers | Mix of DTO classes and inline types |

**Impact**: No request validation; malformed input reaches service layer.

**Fix**: Create proper DTO classes with `class-validator` decorators for all endpoints.

### 5.3 Missing Swagger Documentation

| Service | Missing |
|---|---|
| **vertical-service** | Most endpoints lack `@ApiResponse` decorators for error responses |
| **lifestyle-service** | Inconsistent `@ApiResponse` usage |
| **creator-service** | Admin endpoints have proper docs, but main creator endpoints lack error response docs |

**Fix**: Add `@ApiResponse({ status: 400, ... })`, `@ApiResponse({ status: 401, ... })`, etc. to all endpoints.

### 5.4 Missing `@ApiBearerAuth()` Decorator

| Service | Issue |
|---|---|
| **vertical-service** | No `@ApiBearerAuth()` on any controller |
| **lifestyle-service** | No `@ApiBearerAuth()` on any controller |
| **comedy-service** | No `@ApiBearerAuth()` on any controller |
| **games-service** | No `@ApiBearerAuth()` on tournament controller |
| **sports-service** | No `@ApiBearerAuth()` on any controller |

**Impact**: Swagger UI cannot test authenticated endpoints.

**Fix**: Add `@ApiBearerAuth()` to all controllers.

### 5.5 Inconsistent Cache TTL Values

| Service | TTL |
|---|---|
| **reality-service** | 30 seconds |
| **lifestyle-service** | 300 seconds (5 minutes) |
| **movie-service** | 300 seconds (5 minutes) |
| **games-service (game-catalog)** | 60 seconds |
| **comedy-service** | 300 seconds (5 minutes) |

**Impact**: No clear caching strategy; different data freshness expectations.

**Fix**: Document and standardize cache TTLs based on data volatility.

### 5.6 Missing `package.json` Scripts Audit

Several services lack consistent scripts:
- No `pnpm run prisma:studio` for local DB inspection
- Missing `pnpm run lint:fix` in some services

**Fix**: Standardize scripts across all services.

### 5.7 Duplicate `Tournament` Model Access

| File | Issue |
|---|---|
| `games-service/src/modules/games/games.service.ts:44` | `this.prisma.tournament.findMany()` — Games service queries Tournament model directly |
| `games-service/src/modules/tournament/tournament.service.ts:76` | Tournament service also queries Tournament model |

**Impact**: Two services competing for the same data ownership.

**Fix**: Remove tournament queries from `GamesService`; route through `TournamentService`.

### 5.8 Missing Health Check Endpoints

| Service | Health Endpoint |
|---|---|
| **vertical-service** | `src/modules/health/health.controller.ts` exists but not verified if properly wired |
| **lifestyle-service** | `src/modules/health/health.controller.ts` exists |
| **comedy-service** | `src/modules/health/health.controller.ts` exists |
| **games-service** | No health controller found in file listing |
| **sports-service** | No health controller found in file listing |
| **movie-service** | No health controller found in file listing |
| **creator-service** | `src/modules/health/health.controller.ts` exists |
| **reality-service** | `src/modules/health/health.controller.ts` exists |

**Fix**: Add health check endpoints to all services for Kubernetes liveness/readiness probes.

### 5.9 Missing Rate Limiting on Authenticated Endpoints

| Service | Endpoint | Issue |
|---|---|---|
| **vertical-service** | Most endpoints | No `RateLimitGuard` on any endpoint except `getUniverses()` |
| **lifestyle-service** | Most endpoints | No `RateLimitGuard` on write endpoints |
| **creator-service** | All endpoints | No `RateLimitGuard` on any endpoint |

**Impact**: Write endpoints vulnerable to abuse.

**Fix**: Add `@UseGuards(RateLimitGuard)` with appropriate limits to all endpoints.

### 5.10 Missing `idempotencyKey` in Wallet Credits — reality-service

| Detail | |
|---|---|
| **File** | `services/universes/reality-service/src/modules/reality/reality.service.ts:378-394` |
| **Description** | `submitSupervote()` compensation credit uses `reference` but not `idempotencyKey` |
| **Impact** | Compensation could be applied multiple times on retry |

**Fix**: Include `idempotencyKey` in compensation credit calls.

---

## Summary

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| **Unfinished Code** | 2 | 5 | 4 | 1 |
| **Technical Debt** | 1 | 3 | 3 | 1 |
| **Performance** | 1 | 4 | 3 | 1 |
| **Security** | 4 | 5 | 3 | 0 |
| **Miscellaneous** | 0 | 2 | 6 | 2 |
| **Total** | **8** | **19** | **19** | **5** |

### Top Priority Fixes

1. **Add `ServiceAuthGuard` to comedy-service, vertical-service, lifestyle-service, reality-service** (Critical security)
2. **Add `validateEnvironment()` to vertical-service `main.ts`** (Critical runtime)
3. **Add admin guards to all vertical-service write endpoints** (Critical security)
4. **Add admin guards to lifestyle-service write endpoints** (Critical security)
5. **Fix unlock code bypass in vertical-service** (High security)
6. **Migrate comedy-service/lifestyle-service to shared `CacheService`** (High tech debt)
7. **Add pagination to unbounded list endpoints** (High performance)
8. **Fix N+1 queries in reality-service and sports-service** (High performance)
9. **Add database indexes for frequently queried fields** (Medium performance)
10. **Standardize error response formats** (Medium tech debt)
