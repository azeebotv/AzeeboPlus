# Azeebo+ — Comprehensive Issues & Fixes

> Generated: 2026-07-06
> Scope: Full project (27 services, 4 apps, 18 packages, documentation)
> Total Issues Found: 87

---

## Table of Contents

1. [Critical — Runtime Failures](#1-critical--runtime-failures)
2. [High — Broken Functionality](#2-high--broken-functionality)
3. [Medium — Incorrect Documentation](#3-medium--incorrect-documentation)
4. [Low — Code Quality & Consistency](#4-low--code-quality--consistency)
5. [Missing Files & Scaffolding](#5-missing-files--scaffolding)
6. [Security Issues](#6-security-issues)
7. [Performance & Build Issues](#7-performance--build-issues)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)

---

## 1. Critical — Runtime Failures

These issues will cause crashes or broken functionality in production.

### C01 — Missing Mobile Dependencies (4 packages)
- **Severity:** CRITICAL
- **Files:** `apps/mobile/package.json`
- **Problem:** `react-i18next`, `expo-updates`, `@expo/vector-icons`, `expo-linear-gradient` are imported in source but NOT in `package.json`
- **Affected Screens:** ALL homepage screens (Guest + Authenticated), HeroCarousel, ContentCard, ContentRow
- **Impact:** Entire homepage crashes at runtime for all users
- **Fix:**
  ```bash
  cd apps/mobile
  pnpm add react-i18next expo-updates @expo/vector-icons expo-linear-gradient
  ```
- **Files to verify after fix:**
  - `apps/mobile/src/components/homepage/GuestHomepage.tsx`
  - `apps/mobile/src/components/homepage/AuthenticatedHomepage.tsx`
  - `apps/mobile/src/components/homepage/HeroCarousel.tsx`
  - `apps/mobile/src/components/homepage/ContentCard.tsx`
  - `apps/mobile/src/components/homepage/ContentRow.tsx`

### C02 — StoryworldsModule Has No Controller
- **Severity:** CRITICAL
- **File:** `services/universes/vertical-service/src/modules/storyworlds/storyworlds.module.ts`
- **Problem:** Module has 6 providers but zero controllers. All documented Agbala API endpoints are unimplemented
- **Impact:** No Agbala storyworld features are accessible via HTTP
- **Fix:** Create `storyworlds.controller.ts` with all endpoints from `docs/agbala-api.md`:
  - `GET /v1/vertical/storyworlds` — List storyworlds
  - `GET /v1/vertical/storyworlds/:slug` — Get storyworld by slug
  - `GET /v1/vertical/storyworlds/:slug/titles` — List titles
  - `GET /v1/vertical/storyworlds/:slug/characters` — List characters
  - `GET /v1/vertical/storyworlds/:slug/realms` — List realms
  - `GET /v1/vertical/storyworlds/:slug/orisa` — List orisa files
  - `GET /v1/vertical/storyworlds/:slug/artifacts` — List artifacts
  - `GET /v1/vertical/storyworlds/:slug/prophecies` — List prophecies
  - `GET /v1/vertical/storyworlds/:slug/maps` — List maps
  - `POST /v1/vertical/storyworlds/:slug/theories` — Submit theory
  - `GET /v1/vertical/storyworlds/:slug/theories` — List theories
  - `POST /v1/vertical/storyworlds/:slug/theories/:id/vote` — Vote on theory
  - `GET /v1/vertical/storyworlds/:slug/rooms` — List rooms
  - `POST /v1/vertical/storyworlds/:slug/rooms/:id/posts` — Create room post
  - `POST /v1/vertical/storyworlds/:slug/unlock` — Validate unlock code

### C03 — RoomService and TheoryService Not Registered
- **Severity:** CRITICAL
- **File:** `services/universes/vertical-service/src/modules/storyworlds/storyworlds.module.ts`
- **Problem:** `RoomService` and `TheoryService` exist as injectable classes but are NOT in the `providers` array
- **Impact:** These services cannot be injected; theories and rooms are completely non-functional
- **Fix:** Add to `StoryworldsModule`:
  ```typescript
  import { RoomService } from './agbala/room.service';
  import { TheoryService } from './agbala/theory.service';

  @Module({
    providers: [
      // ... existing providers
      RoomService,
      TheoryService,
    ],
    exports: [
      // ... existing exports
      RoomService,
      TheoryService,
    ],
  })
  ```

### C04 — Mobile `colors.warning[500]` Undefined Access (9 occurrences)
- **Severity:** CRITICAL
- **Files:**
  - `apps/mobile/src/components/PasswordStrengthMeter.tsx` — lines 44, 51, 138
  - `apps/mobile/app/vote.tsx` — lines 620, 719, 819
  - `apps/mobile/app/prediction.tsx` — lines 567, 707
- **Problem:** `colors.warning` is a string (`'#F59E0B'`), not an object. Accessing `[500]` returns `undefined`
- **Impact:** Password strength meter colors and vote/prediction accent colors render as transparent
- **Fix:** Either change `theme.ts` to make `warning` and `success` objects with shade keys, or fix all access patterns:
  ```typescript
  // Option A: Fix theme.ts
  warning: { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
             400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
             800: '#92400E', 900: '#78350F' },
  success: { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
             400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
             800: '#166534', 900: '#14532D' },
  ```
  Or fix all references to use `colors.warning` directly (without `[500]`).

---

## 2. High — Broken Functionality

### H01 — Wrong SafeAreaView Import (2 files)
- **Severity:** HIGH
- **Files:**
  - `apps/mobile/app/(tabs)/transactions.tsx` — line 11
  - `apps/mobile/app/city-guide.tsx` — line 9
- **Problem:** Imports `SafeAreaView` from `react-native` instead of `react-native-safe-area-context`
- **Impact:** Content renders behind notch/status bar on Android and notched iPhones
- **Fix:**
  ```typescript
  // Change from:
  import { SafeAreaView } from 'react-native';
  // To:
  import { SafeAreaView } from 'react-native-safe-area-context';
  ```

### H02 — Inconsistent Controller Route Prefixes (4 controllers)
- **Severity:** HIGH
- **Files:**
  - `services/universes/vertical-service/src/modules/characters/characters.controller.ts` — `@Controller('characters')`
  - `services/universes/vertical-service/src/modules/timeline/timeline.controller.ts` — `@Controller('timeline')`
  - `services/universes/vertical-service/src/modules/crossovers/crossovers.controller.ts` — `@Controller('crossovers')`
  - `services/universes/vertical-service/src/modules/admin/admin.controller.ts` — `@Controller('admin')`
- **Problem:** 4 controllers missing `v1/vertical/` prefix (unlike universe/titles/lore controllers)
- **Impact:** Endpoints exposed at wrong URLs (`/characters` instead of `/v1/vertical/characters`)
- **Fix:** Add prefix to all 4 controllers:
  ```typescript
  @Controller('v1/vertical/characters')
  @Controller('v1/vertical/timeline')
  @Controller('v1/vertical/crossovers')
  @Controller('v1/vertical/admin')
  ```

### H03 — API Gateway README Has Wrong Service URLs
- **Severity:** HIGH
- **File:** `services/gateway/api-gateway/README.md`
- **Problem:** Multiple wrong port references:
  - `GAMES_SERVICE_URL=http://localhost:3012` → should be `3014`
  - `COMEDY_SERVICE_URL=http://localhost:3013` → should be `3012`
  - `SPORTS_SERVICE_URL=http://localhost:3014` → should be `3021`
- **Impact:** Developers following the README will get connection errors
- **Fix:** Update all port references in the gateway README to match canonical ports

### H04 — 16 Service READMEs Have Wrong Port Numbers
- **Severity:** HIGH
- **Affected Services & Wrong Ports:**

| Service | Wrong Port | Correct Port |
|---------|-----------|-------------|
| auth-service | 3010 | 3000 |
| wallet-service | 3011 | 3002 |
| payment-service | 3014 | 3003 |
| content-service | 3015 | 3004 |
| reality-service | 3014 | 3010 |
| comedy-service | 3019 | 3012 |
| games-service | 3018 | 3014 |
| sports-service | 3017 | 3021 |
| creator-service | 3006 | 3018 |
| notification-service | 3020 | 3006 |
| reward-service | 3012 | 3007 |
| engagement-service | 3012 | 3023 |
| messaging-service | 3011 | 3024 |
| subscription-service | 3013 | 3026 |
| analytics-service | 3012 | 3008 |
| moderation-service | 3021 | 3022 |

- **Fix:** Update each service's README.md to use the correct port from the canonical mapping

### H05 — 5 Service READMEs Have Wrong Database Names
- **Severity:** HIGH
- **Files:**
  - `auth-service/README.md` — `auth` → `azeebo_auth`
  - `wallet-service/README.md` — `wallet` → `azeebo_wallet`
  - `payment-service/README.md` — `payments` → `azeebo_payment`
  - `content-service/README.md` — `content` → `azeebo_content`
  - `analytics-service/README.md` — `analytics` → `azeebo_analytics`
- **Impact:** Developers copy-pasting DATABASE_URL will connect to wrong databases
- **Fix:** Update all DATABASE_URL examples to use `azeebo_` prefix

### H06 — Missing Route Group Layouts (4 directories)
- **Severity:** HIGH
- **Files:** Missing `_layout.tsx` in:
  - `apps/mobile/app/(reality)/` — 5 screens
  - `apps/mobile/app/(creator)/` — 8 screens
  - `apps/mobile/app/(tabs)/wallet/` — 3 sub-routes
  - `apps/mobile/app/(tabs)/profile/` — 2 sub-routes
- **Impact:** Screens render in root Stack with no shared layout/transitions
- **Fix:** Create `_layout.tsx` for each group with appropriate Stack/Tab navigator

### H07 — Web App Agbala Module Is Empty Scaffold
- **Severity:** HIGH
- **File:** `apps/web/src/modules/vertical/agbala/` — all subdirs empty
- **Problem:** `api/`, `components/`, `hooks/`, `pages/`, `types/` directories exist but contain zero files
- **Impact:** No web-side Agbala implementation exists despite directory structure suggesting otherwise
- **Fix:** Implement all web components or remove the empty scaffold to avoid confusion

### H08 — Duplicate `useUniverses` Hooks
- **Severity:** HIGH
- **Files:**
  - `apps/web/src/hooks/useDatabase.ts` — exports `useUniverses()` returning `{ universes, isLoading, error, getUniverse, isUniverseEnabled, hasFeature }`
  - `apps/web/src/hooks/useUniverses.ts` — exports `useUniverses()` returning `{ universes, selected, isLoading, error, select, refetch }`
- **Problem:** Two different implementations with incompatible return types
- **Impact:** Developer confusion, potential bugs when importing from wrong file
- **Fix:** Consolidate into single hook, update all consumers

---

## 3. Medium — Incorrect Documentation

### M01 — No CLAUDE.md File Exists
- **Severity:** MEDIUM
- **File:** `README.md` line 220 references `[CLAUDE.md](./CLAUDE.md)`
- **Problem:** File does not exist anywhere in the project
- **Fix:** Either create `CLAUDE.md` or remove the reference from README

### M02 — Node Version Mismatch
- **Severity:** MEDIUM
- **Files:**
  - `.nvmrc` — `22.16.0`
  - `.node-version` — `20.16.0`
- **Problem:** Two different Node.js version specifications
- **Fix:** Align both to `22.16.0` (or whatever the target is)

### M03 — Multiple READMEs Reference Wrong NestJS Version
- **Severity:** MEDIUM
- **Files:** auth-service, wallet-service, payment-service, content-service, analytics-service READMEs
- **Problem:** All say `NestJS 10.x` — actual version is `^11.1.27`
- **Fix:** Update all READMEs to say `NestJS 11.x`

### M04 — Multiple READMEs Reference Wrong Node.js Version
- **Severity:** MEDIUM
- **Files:** auth-service, wallet-service, payment-service, analytics-service, vertical-service READMEs
- **Problem:** Say `Node.js 20+` or `Node.js 18+` — should be `Node.js 22+`
- **Fix:** Update all to `Node.js 22+`

### M05 — Multiple READMEs Use npm Instead of pnpm
- **Severity:** MEDIUM
- **Files:** auth-service, wallet-service, payment-service, content-service, analytics-service, referral-service READMEs
- **Problem:** All use `npm install`, `npm run` commands — project uses pnpm
- **Fix:** Replace all `npm` with `pnpm` in documentation

### M06 — Auth Service README References Wrong JWT Config
- **Severity:** MEDIUM
- **File:** `services/core/auth-service/README.md`
- **Problem:** References `JWT_SECRET` instead of `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`, and `JWT_EXPIRES_IN=15m` instead of `30m`
- **Fix:** Update to current JWT configuration

### M07 — Wallet/Reality READMEs Reference Wrong JWT Config
- **Severity:** MEDIUM
- **Files:** `wallet-service/README.md`, `reality-service/README.md`
- **Problem:** Reference `JWT_SECRET` instead of `JWT_ACCESS_SECRET`
- **Fix:** Update to current JWT configuration

### M08 — Support Service README Has Wrong Moderation URL
- **Severity:** MEDIUM
- **File:** `services/operations/support-service/README.md` — line 23
- **Problem:** `MODERATION_SERVICE_URL=http://localhost:3006` — should be `http://localhost:3022`
- **Fix:** Update port to 3022

### M09 — Coolify Env Guide Uses Wrong DB Naming Convention
- **Severity:** MEDIUM
- **File:** `coolify-env-guide.md`
- **Problem:** Uses `{service}_db` naming (e.g., `auth_db`) instead of `azeebo_{service}` (e.g., `azeebo_auth`)
- **Fix:** Update all database references to use `azeebo_` prefix

### M10 — SQL README References Shared Database
- **Severity:** MEDIUM
- **File:** `scripts/sql/README.md`
- **Problem:** References `azeebo_plus_dev` shared database — contradicts per-service DB architecture
- **Fix:** Update to reflect per-service database model

### M11 — Vertical Service README References Non-Existent File
- **Severity:** MEDIUM
- **File:** `services/universes/vertical-service/README.md`
- **Problem:** References `docs/agbala-api.md` — file exists but was just created
- **Verify:** Confirm `docs/agbala-api.md` exists and is complete

### M12 — Admin Users Page Links to Non-Existent Route
- **Severity:** MEDIUM
- **File:** `apps/web/src/app/admin/users/page.tsx` — line 198
- **Problem:** `router.push('/admin/users/${u.id}')` — no dynamic `[id]` route exists
- **Impact:** 404 error when clicking user links
- **Fix:** Create `apps/web/src/app/admin/users/[id]/page.tsx` or remove the link

---

## 4. Low — Code Quality & Consistency

### L01 — Duplicate Service Class Names Across Modules
- **Severity:** LOW
- **Files:**
  - `titles/titles.service.ts` — `TitlesService`
  - `agbala/titles.service.ts` — `TitlesService` (different, with caching)
  - `characters/characters.service.ts` — `CharactersService`
  - `agbala/characters.service.ts` — `CharactersService` (different, with caching)
- **Fix:** Rename agbala versions to `AgbalaTitlesService` and `AgbalaCharactersService`

### L02 — Inconsistent API Response Formats
- **Severity:** LOW
- **Problem:** Different services return different shapes:
  - `UniverseService`, `CharactersService`: `{ success, data }`
  - `TitlesService`, `LoreService`: Union types with optional fields
  - `AdminService`: Raw objects without wrapper
- **Fix:** Standardize all services to return `{ success: boolean, data?: T, error?: { code, message } }`

### L03 — `.gitignore` Pattern Ignores `.env.example`
- **Severity:** LOW
- **File:** `services/universes/vertical-service/.gitignore` — line 4
- **Problem:** Pattern `.env.*` matches `.env.example`
- **Fix:** Change to `.env.local` or more specific patterns

### L04 — `next.config.js` Invalid Key
- **Severity:** LOW
- **File:** `apps/web/next.config.js` — line 6
- **Problem:** `outputFileTracingRoot` is not a valid Next.js config option
- **Fix:** Remove the line or use correct key

### L05 — Deprecated `images.domains` in Next.js 15
- **Severity:** LOW
- **File:** `apps/web/next.config.js` — lines 16-19
- **Problem:** `images.domains` is deprecated in Next.js 15
- **Fix:** Migrate to `images.remotePatterns`

### L06 — TypeScript/ESLint Errors Silenced at Build
- **Severity:** LOW
- **File:** `apps/web/next.config.js` — lines 10-14
- **Problem:** `ignoreDuringBuilds: true` masks type errors
- **Fix:** Remove both `ignoreDuringBuilds` flags

### L07 — Unused Workspace Dependencies in Web App
- **Severity:** LOW
- **File:** `apps/web/package.json`
- **Problem:** `@azeebo/ui` and `@azeebo/design-tokens` are dependencies but never imported
- **Fix:** Remove unused dependencies or implement components that use them

### L08 — Unused `transpilePackages` in Next.js Config
- **Severity:** LOW
- **File:** `apps/web/next.config.js` — line 8
- **Problem:** 6 packages listed in `transpilePackages` are never imported
- **Fix:** Remove unused packages from the list

### L09 — Inconsistent Import Style (Mobile)
- **Severity:** LOW
- **Problem:** Mix of `@/` aliases and relative imports
- **Fix:** Standardize on one style (recommend `@/` for new code)

### L10 — Inconsistent Import Style (Web)
- **Severity:** LOW
- **Problem:** Mix of `@/` aliases and relative imports across pages
- **Fix:** Standardize on `@/` for all imports

### L11 — Missing Test Coverage (6 modules)
- **Severity:** LOW
- **Files:** No test files for:
  - `characters/` module
  - `timeline/` module
  - `crossovers/` module
  - `admin/` module
  - `health/` module
  - `database/` module
- **Fix:** Create test files for each module

### L12 — Missing Agbala Test Coverage
- **Severity:** LOW
- **Problem:** No tests for:
  - `RoomService`
  - `TheoryService`
  - `pagination.helper.ts`
  - Agbala `CharactersService`
  - Agbala `TitlesService`
- **Fix:** Create test files following existing patterns

### L13 — Empty Prisma Migration
- **Severity:** LOW
- **File:** `services/universes/vertical-service/prisma/migrations/20240101000000_init/migration.sql`
- **Problem:** Migration contains only `-- This is an empty migration`
- **Fix:** Generate proper migration: `npx prisma migrate dev --name init`

### L14 — Unregistered Tab Route Files (6 files)
- **Severity:** LOW
- **Files:** `search.tsx`, `wallet.tsx`, `payment.tsx`, `referral.tsx`, `library.tsx`, `transactions.tsx` in `app/(tabs)/`
- **Problem:** Files exist but not registered in Tabs layout
- **Fix:** Register in `_layout.tsx` or move to separate route groups

---

## 5. Missing Files & Scaffolding

### F01 — CLAUDE.md
- **Status:** MISSING
- **Referenced by:** `README.md` line 220
- **Fix:** Create `CLAUDE.md` with project guidelines for AI assistants

### F02 — Web Agbala Pages
- **Status:** MISSING
- **Expected:** `apps/web/src/app/vertical/agbala/` with 13 pages
- **Current:** Only `apps/web/src/app/vertical/page.tsx` exists
- **Fix:** Create all Agbala web pages

### F03 — Web Admin Agbala Pages
- **Status:** MISSING
- **Expected:** `apps/web/src/app/admin/vertical/agbala/` with 10 pages
- **Current:** No `vertical/` directory under admin
- **Fix:** Create all admin Agbala pages

### F04 — Mobile Agbala Hooks
- **Status:** MISSING
- **Expected:** `apps/mobile/src/modules/vertical/agbala/hooks/` with 9 hooks
- **Current:** No `hooks/` directory exists
- **Fix:** Create all Agbala hooks

### F05 — Mobile Agbala API Client
- **Status:** MISSING
- **Expected:** `packages/api-client/src/agbala/client.ts`
- **Current:** No `agbala/` directory in api-client
- **Fix:** Create Agbala API client functions

### F06 — OpenTelemetry Package
- **Status:** INCOMPLETE
- **File:** `packages/opentelemetry/src/index.ts` — only file
- **Problem:** No `package.json`, no `tsconfig.json`, no implementation
- **Fix:** Complete the package or remove it

### F07 — Storyworlds Controller
- **Status:** MISSING
- **Expected:** `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts`
- **Current:** No controller exists for the storyworlds module
- **Fix:** Create controller with all documented endpoints

---

## 6. Security Issues

### S01 — .env File Contains Real Credentials
- **Severity:** MEDIUM
- **File:** `services/universes/vertical-service/.env`
- **Problem:** Contains `DATABASE_URL=postgresql://azeebo:azeebo_dev_2024@localhost:5432/azeebo_vertical`
- **Mitigation:** `.gitignore` should prevent commit, but `.env.*` pattern issue (L03) could expose `.env.example`
- **Fix:** Ensure `.env` is never committed; fix `.gitignore` pattern

### S02 — Auth Service README Documents Weak JWT Secret
- **Severity:** MEDIUM
- **File:** `services/core/auth-service/README.md`
- **Problem:** Documents `JWT_SECRET="your-jwt-secret-key"` as example
- **Fix:** Update to show `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with secure generation instructions

---

## 7. Performance & Build Issues

### P01 — Empty Agbala Web Module Scaffold
- **Severity:** MEDIUM
- **File:** `apps/web/src/modules/vertical/agbala/`
- **Problem:** Empty directories suggest implementation exists but nothing is there
- **Fix:** Implement or remove

### P02 — Duplicate Prisma Client Generated Directories
- **Severity:** LOW
- **Note:** Referenced in `tasks.md` as T6.1 — already marked DONE
- **Verify:** Confirm only one `@prisma/client` output directory exists

---

## 8. Cross-Cutting Concerns

### X01 — Folder Naming: `services/universes/` vs `services/universe/`
- **Status:** CONSISTENT
- **Finding:** The actual folder is `services/universes/` (plural). All documentation consistently uses this path. No references to `services/universe/` (singular) found.
- **Note:** User mentioned "all universe should be in services/universe folder" — the current structure uses `universes` (plural). This is consistent across all docs and code.

### X02 — Canonical Port Mapping
- **Status:** DOCUMENTED
- **Authoritative Source:** `README.md` lines 82-109
- **Issue:** 16 individual service READMEs have wrong ports (see H04)
- **Fix:** Update all service READMEs to match canonical mapping

### X03 — Package Manager Consistency
- **Status:** INCONSISTENT
- **Problem:** Root uses pnpm, but 6+ service READMEs document npm commands
- **Fix:** Update all documentation to use pnpm

---

## Fix Priority Order

### Phase 1 — Critical Fixes (Do First)
1. C01 — Install missing mobile dependencies
2. C02 — Create storyworlds controller
3. C03 — Register RoomService and TheoryService
4. C04 — Fix color access patterns in mobile

### Phase 2 — High Priority Fixes
5. H01 — Fix SafeAreaView imports
6. H02 — Fix controller route prefixes
7. H03-H05 — Fix all documentation port/URL/DB errors
8. H06 — Create missing route group layouts
9. H07-H08 — Fix web app agbala implementation

### Phase 3 — Medium Priority Fixes
10. M01-M12 — Fix all documentation errors
11. S01-S02 — Security documentation fixes

### Phase 4 — Low Priority Fixes
12. L01-L14 — Code quality improvements
13. F01-F07 — Create missing files
14. P01-P02 — Performance cleanup

---

## Verification Checklist

After all fixes, verify:
- [ ] `pnpm install` succeeds in all workspaces
- [ ] `npx tsc --noEmit` passes in all services and apps
- [ ] `pnpm test` passes in all services
- [ ] Mobile app starts without crashes
- [ ] Web app builds without errors
- [ ] All API endpoints respond correctly
- [ ] All documentation matches actual implementation
- [ ] No `npm` references remain in documentation
- [ ] All port numbers match canonical mapping
- [ ] All database names use `azeebo_` prefix
