# Azeebo+ Comprehensive Codebase Analysis & Fixes Plan

## Context

The Azeebo+ monorepo has accumulated technical debt across security vulnerabilities, missing features, code quality issues, and incomplete implementations. This plan addresses all identified issues in a sequenced, dependency-aware order -- starting with critical security fixes, progressing through code quality and missing features, and ending with documentation updates.

**Total issues identified:** 60+ across mobile, web, backend, and shared packages.

---

## Phase 1: Critical Security Fixes

### 1.1 Replace ProtectedRoute Mock Auth with Real JWT Validation
- **File:** `packages/auth/src/web/ProtectedRoute.tsx`
- **Issue:** Lines 27-33 use `setTimeout(500ms)` + `localStorage.getItem('azeebo_user')` mock instead of real JWT validation
- **Fix:** Remove setTimeout; use React context injection to access AuthContext's `isAuthenticated`, `user`, and `isLoading` states
- **Effort:** Small (1-2 hours)

### 1.2 Fix Hardcoded JWT Secret Fallback
- **File:** `services/user-service/src/modules/admin/admin.module.ts` (line 12)
- **Issue:** `secret: process.env.JWT_SECRET || 'secret'` -- insecure fallback
- **Fix:** Replace with `JwtModule.registerAsync()` + `ConfigService.getOrThrow<string>('JWT_SECRET')` matching pattern used by all other services
- **Effort:** Small (30 min)

### 1.3 Implement Analytics SDK processQueue()
- **File:** `packages/analytics-sdk/src/index.ts` (lines 37-40)
- **Issue:** Events queued but never sent to backend
- **Fix:** Implement batch HTTP POST to `POST /v1/analytics/track-batch` with configurable flush interval (30s default) and batch threshold (10 events)
- **Effort:** Medium (2-3 hours)

---

## Phase 2: Code Quality Cleanup

### 2.1 Delete 48 Stale .js Files from Web App
- **Directory:** `apps/web/src/` -- 48 `.js` files with `.ts/.tsx` counterparts
- **Fix:** Delete all stale `.js` artifacts; add `src/**/*.js` to `apps/web/.gitignore`
- **Effort:** Small (30 min)

### 2.2 Fix CORS Wildcard Fallback
- **File:** `services/referral-service/src/main.ts` (line 13)
- **Issue:** `origin: process.env.CORS_ORIGIN || '*'` allows all origins
- **Fix:** Replace with `configService.getOrThrow<string>('CORS_ORIGIN').split(',')`
- **Effort:** Small (15 min)

### 2.3 Fix Hardcoded Version String (Mobile)
- **File:** `apps/mobile/app/(tabs)/settings.tsx` (line 396)
- **Issue:** Version hardcoded as `"1.0.0"`
- **Fix:** Read from `expo-constants`: `Constants.expoConfig?.version ?? '1.0.0'`
- **Effort:** Small (15 min)

---

## Phase 3: Missing Pages -- Role Selection

### 3.1 Create Mobile Role Selection Screen
- **File to create:** `apps/mobile/app/(auth)/role-selection.tsx`
- **Evidence:** Route already registered in `_layout.tsx` line 18 but file is missing
- **Pattern:** Follow `profile-setup.tsx` -- SafeAreaView, #111827 bg, #8B5CF6 primary, StyleSheet.create()
- **Components:** 3 role cards (User, Creator, Both), Continue button, Skip option
- **Flow:** Register -> Role Selection -> Profile Setup -> Home
- **API:** Add `selectRole(role: string)` to `authApi` in `apps/mobile/src/api/auth.ts`
- **Effort:** Medium (2-3 hours)

### 3.2 Create Web Role Selection Page
- **File to create:** `apps/web/src/app/auth/role-selection/page.tsx`
- **Pattern:** Follow `auth/profile-setup/page.tsx` -- 'use client', Tailwind, useAuth()
- **Components:** 3 role cards with selection state, Continue/Skip buttons
- **API:** POST to `/auth/role` endpoint via fetch()
- **Effort:** Medium (2-3 hours)

---

## Phase 4: Console.log Replacement (~100+ instances)

### 4.1 Backend Services (~10 instances)
- **Pattern:** Replace `console.log/error` with `new StructuredLogger('ServiceName')` from `@azeebo/logger`
- **Key files:** `referral-service/src/main.ts`, `subscription-service/src/main.ts`, shared packages
- **Effort:** Medium (1-2 hours)

### 4.2 Mobile App (~50 instances)
- **Create:** `apps/mobile/src/utils/logger.ts` wrapper using `createLogger('MobileApp')`
- **Replace in:** All `app/**/*.tsx` and `src/**/*.ts` files with console statements
- **Key files:** 25+ screens and utilities listed in research findings
- **Effort:** Medium (3-4 hours)

### 4.3 Web App (~43 instances in 38 files)
- **Pattern:** Replace with `createLogger('WebApp')` instance
- **Key files:** All admin pages, creator pages, context files, lib files
- **Effort:** Medium (2-3 hours)

---

## Phase 5: Connect Mock Data to Real APIs

### 5.1 Web Pages with 100% Mock Data (11 pages)
**Pages to fix:**
- `reality/page.tsx`, `vertical/page.tsx`, `lifestyle/page.tsx`, `comedy/page.tsx`
- `sports/page.tsx`, `games/page.tsx`, `rewards/page.tsx`, `notifications/page.tsx`
- `search/page.tsx`, `support/page.tsx`, `creators/dashboard/page.tsx`

**Transformation pattern:**
1. Remove mock data arrays and `setTimeout` fake loading
2. Use `api` client from `@/lib/api.ts` with real endpoints
3. Add loading state with Skeleton component
4. Add error state with retry button
5. Add empty state for no-data scenarios

**API mappings:**
- Universe pages: `api.content.getContentByUniverse(universeId)`
- Creator Dashboard: Creator analytics endpoints
- Rewards: `api.wallet.getBalance()`, `api.wallet.getTransactions()`
- Search: `api.content.searchContent(filters)`

**Effort:** Large (1-2 days)

### 5.2 Mobile Screens with No API Integration (7 screens)
**Screens to fix:**
- `watch/reality-show.tsx` -- hardcoded contestants, local wallet
- `prediction.tsx` -- hardcoded options, local points
- `vote.tsx` -- hardcoded contestants, local wallet
- `(reality)/episodes.tsx` -- ignores API response
- `(tabs)/create.tsx` -- fake upload with setTimeout
- `support.tsx` -- no API submission
- `creators/signup.tsx` -- simulated submission

**API modules already available:** `contentApi`, `walletApi`, `engagementApi`, `realityApi`, `mediaApi`

**Effort:** Large (1-2 days)

---

## Phase 6: Missing Creator Dashboard Sub-routes (Web)

### 6.1 Create 5 Dashboard Sub-route Pages
**Files to create:**
- `apps/web/src/app/creators/dashboard/overview/page.tsx`
- `apps/web/src/app/creators/dashboard/content/page.tsx`
- `apps/web/src/app/creators/dashboard/analytics/page.tsx`
- `apps/web/src/app/creators/dashboard/earnings/page.tsx`
- `apps/web/src/app/creators/dashboard/settings/page.tsx`

**Evidence:** Parent page nav links (lines 50-58) reference these routes but no files exist
**Pattern:** Follow parent dashboard page; use api.client methods
**Effort:** Medium (4-6 hours)

---

## Phase 7: Error Handling & UX Improvements

### 7.1 Add Error State UI to Mobile Screens (10+ screens)
**Pattern:** Replace silent `console.error` in catch blocks with visible error UI + retry button
**Key files:** profile.tsx, settings.tsx, referral.tsx, messages.tsx, leaderboard.tsx, rankings.tsx, recommendations.tsx, devices.tsx, live-chat.tsx
**Effort:** Medium (3-4 hours)

### 7.2 Consolidate Duplicate Creator Signup Routes (Mobile)
- **Delete:** `apps/mobile/app/creator-signup.tsx` (top-level, no API)
- **Keep:** `apps/mobile/app/creators/signup.tsx` (complete 3-step form)
- **Update:** Navigation references pointing to `/creator-signup`
- **Effort:** Small (1 hour)

### 7.3 Clean Up Mobile API Type Safety
- **File:** `apps/mobile/src/api/content.ts`
- **Issue:** 15+ methods return `ApiResponse<any>`
- **Fix:** Define proper interfaces (Episode, Contestant, Vote, etc.) and replace `any`
- **Effort:** Medium (2 hours)

---

## Phase 8: Security Hardening

### 8.1 Replace Hardcoded localhost Fallbacks in Services
- Replace `|| 'http://localhost:XXXX'` with `configService.getOrThrow<string>()`
- Add all service URLs to `.env.example`
- **Effort:** Medium (2-3 hours)

### 8.2 Migrate Admin Pages from Raw fetch() to API Client
- Audit 6 admin pages for raw `fetch()` usage
- Migrate to `api.admin.*` methods from `@/lib/api.ts`
- **Effort:** Medium (2-3 hours)

---

## Phase 9: Documentation Updates

### 9.1 Update Port Documentation
- Document ports for moderation-service, queue-service, referral-service
- **Effort:** Small (30 min)

### 9.2 Update todo.md Status
- Update task statuses to reflect actual implementation state
- Mark incorrectly completed items as in-progress
- **Effort:** Small (30 min)

---

## Dependency Graph

```
Phase 1 (Security) ──── No dependencies, start immediately
  1.1 ProtectedRoute ──> 3.1/3.2 Role Selection
  1.2 JWT Secret ──> (standalone)
  1.3 Analytics SDK ──> 5.1/5.2 (pages need event tracking)

Phase 2 (Code Quality) ──── Can run in parallel with Phase 1
  2.1 Delete .js files ──> (standalone)
  2.2 CORS Fix ──> (standalone)
  2.3 Version fix ──> (standalone)

Phase 3 (Role Selection) ──── After 1.1
  3.1 Mobile role ──> 5.2 (onboarding flow)
  3.2 Web role ──> 5.1 (onboarding flow)

Phase 4-9 ──── After Phase 1-3, can run in parallel
```

---

## Verification Plan

1. **Security fixes:** Run existing E2E tests (`apps/web/e2e/`, `apps/mobile/e2e/`) after ProtectedRoute changes
2. **Code quality:** `git diff --stat` to verify .js deletions; `grep -r "console\." apps/` to verify replacements
3. **Role selection:** Manual testing of onboarding flow: Register -> Role Selection -> Profile Setup -> Home
4. **API integration:** Run `pnpm dev` with all services; verify no mock data remains in pages
5. **Type safety:** Run `tsc --noEmit` on mobile and web apps after type fixes
6. **Build verification:** `pnpm build` across all packages to ensure no compilation errors

---

## Effort Summary

| Phase | Priority | Effort |
|-------|----------|--------|
| Phase 1: Security | CRITICAL | 4-6 hours |
| Phase 2: Code Quality | HIGH | 1-2 hours |
| Phase 3: Role Selection | HIGH | 4-6 hours |
| Phase 4: Logger Migration | MEDIUM | 7-10 hours |
| Phase 5: API Integration | HIGH | 2-4 days |
| Phase 6: Missing Pages | HIGH | 4-6 hours |
| Phase 7: Error Handling | MEDIUM | 4-5 hours |
| Phase 8: Security Hardening | MEDIUM | 4-6 hours |
| Phase 9: Documentation | LOW | 1 hour |

**Total estimated effort:** 8-12 working days (single developer)
