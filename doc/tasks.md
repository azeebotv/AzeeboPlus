# Azeebo+ — Task Checklist

> Generated: 2026-07-06
> Source: issues-todo.md
> Total Tasks: 52

---

## Phase 1 — Critical Runtime Fixes

- [ ] **C01 — Install Missing Mobile Dependencies**
  - **Description:** `react-i18next`, `expo-updates`, `@expo/vector-icons`, `expo-linear-gradient` are imported but not installed
  - **Files:** `apps/mobile/package.json`
  - **Fix:** Run in `apps/mobile/`:
    ```bash
    pnpm add react-i18next expo-updates @expo/vector-icons expo-linear-gradient
    ```
  - **Verify:** `pnpm install` succeeds; homepage screens render without crash

- [ ] **C02 — Create Storyworlds Controller**
  - **Description:** `StoryworldsModule` has 6 providers but zero controllers. All Agbala API endpoints are unimplemented
  - **Files:**
    - `services/universes/vertical-service/src/modules/storyworlds/storyworlds.module.ts`
    - NEW: `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts`
  - **Fix:** Create controller with all endpoints from `docs/agbala-api.md`:
    - `GET /v1/vertical/storyworlds` — List storyworlds
    - `GET /v1/vertical/storyworlds/:slug` — Get by slug
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
  - **Verify:** All endpoints respond to HTTP requests

- [ ] **C03 — Register RoomService and TheoryService**
  - **Description:** `RoomService` and `TheoryService` exist as injectable classes but are NOT in the providers array
  - **Files:** `services/universes/vertical-service/src/modules/storyworlds/storyworlds.module.ts`
  - **Fix:** Add imports and register both services:
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
  - **Verify:** `RoomService` and `TheoryService` injectable in other modules

- [ ] **C04 — Fix `colors.warning[500]` Undefined Access**
  - **Description:** `colors.warning` is a string (`'#F59E0B'`), not an object. Accessing `[500]` returns `undefined`
  - **Files:**
    - `apps/mobile/src/components/PasswordStrengthMeter.tsx` — lines 44, 51, 138
    - `apps/mobile/app/vote.tsx` — lines 620, 719, 819
    - `apps/mobile/app/prediction.tsx` — lines 567, 707
  - **Fix:** Change `apps/mobile/src/theme.ts` to make `warning` and `success` objects:
    ```typescript
    warning: { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
               400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
               800: '#92400E', 900: '#78350F' },
    success: { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
               400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
               800: '#166534', 900: '#14532D' },
    ```
    OR fix all 9 references to use `colors.warning` directly without `[500]`
  - **Verify:** Password strength meter and vote/prediction accent colors render correctly

---

## Phase 2 — High Priority Fixes

- [ ] **H01 — Fix SafeAreaView Imports**
  - **Description:** Imports `SafeAreaView` from `react-native` instead of `react-native-safe-area-context`
  - **Files:**
    - `apps/mobile/app/(tabs)/transactions.tsx` — line 11
    - `apps/mobile/app/city-guide.tsx` — line 9
  - **Fix:** Change import to:
    ```typescript
    import { SafeAreaView } from 'react-native-safe-area-context';
    ```
  - **Verify:** Content renders below notch/status bar on Android and notched iPhones

- [ ] **H02 — Fix Controller Route Prefixes**
  - **Description:** 4 controllers missing `v1/vertical/` prefix
  - **Files:**
    - `services/universes/vertical-service/src/modules/characters/characters.controller.ts`
    - `services/universes/vertical-service/src/modules/timeline/timeline.controller.ts`
    - `services/universes/vertical-service/src/modules/crossovers/crossovers.controller.ts`
    - `services/universes/vertical-service/src/modules/admin/admin.controller.ts`
  - **Fix:** Update decorator:
    ```typescript
    @Controller('v1/vertical/characters')  // was: @Controller('characters')
    @Controller('v1/vertical/timeline')   // was: @Controller('timeline')
    @Controller('v1/vertical/crossovers') // was: @Controller('crossovers')
    @Controller('v1/vertical/admin')      // was: @Controller('admin')
    ```
  - **Verify:** Endpoints accessible at `/v1/vertical/characters`, etc.

- [ ] **H03 — Fix API Gateway README Service URLs**
  - **Description:** Multiple wrong port references in gateway README
  - **Files:** `services/gateway/api-gateway/README.md`
  - **Fix:** Correct ports:
    - `GAMES_SERVICE_URL=http://localhost:3012` → `3014`
    - `COMEDY_SERVICE_URL=http://localhost:3013` → `3012`
    - `SPORTS_SERVICE_URL=http://localhost:3014` → `3021`
  - **Verify:** Port numbers match canonical mapping in root README.md

- [ ] **H04 — Fix 16 Service README Port Numbers**
  - **Description:** Each service README documents wrong port
  - **Files:** 16 service `README.md` files
  - **Fix:** Update to correct ports:

    | Service | Wrong → Correct |
    |---------|----------------|
    | auth-service | 3010 → 3000 |
    | wallet-service | 3011 → 3002 |
    | payment-service | 3014 → 3003 |
    | content-service | 3015 → 3004 |
    | reality-service | 3014 → 3010 |
    | comedy-service | 3019 → 3012 |
    | games-service | 3018 → 3014 |
    | sports-service | 3017 → 3021 |
    | creator-service | 3006 → 3018 |
    | notification-service | 3020 → 3006 |
    | reward-service | 3012 → 3007 |
    | engagement-service | 3012 → 3023 |
    | messaging-service | 3011 → 3024 |
    | subscription-service | 3013 → 3026 |
    | analytics-service | 3012 → 3008 |
    | moderation-service | 3021 → 3022 |
  - **Verify:** All ports match root README.md canonical mapping

- [ ] **H05 — Fix 5 Service README Database Names**
  - **Description:** Database names missing `azeebo_` prefix
  - **Files:**
    - `services/core/auth-service/README.md` — `auth` → `azeebo_auth`
    - `services/core/wallet-service/README.md` — `wallet` → `azeebo_wallet`
    - `services/core/payment-service/README.md` — `payments` → `azeebo_payment`
    - `services/core/content-service/README.md` — `content` → `azeebo_content`
    - `services/core/analytics-service/README.md` — `analytics` → `azeebo_analytics`
  - **Fix:** Update all `DATABASE_URL` examples to use `azeebo_` prefix
  - **Verify:** Database names consistent with actual schemas

- [ ] **H06 — Create Missing Route Group Layouts**
  - **Description:** 4 route groups missing `_layout.tsx`
  - **Files:** Create `apps/mobile/app/(...)/_layout.tsx` in:
    - `(reality)/` — 5 screens
    - `(creator)/` — 8 screens
    - `(tabs)/wallet/` — 3 sub-routes
    - `(tabs)/profile/` — 2 sub-routes
  - **Fix:** Create appropriate Stack/Tab navigator layouts for each group
  - **Verify:** Screens render with correct navigation structure

- [ ] **H07 — Fix Web Agbala Empty Scaffold**
  - **Description:** `apps/web/src/modules/vertical/agbala/` has empty directories
  - **Files:** `apps/web/src/modules/vertical/agbala/` (`api/`, `components/`, `hooks/`, `pages/`, `types/`)
  - **Fix:** Either implement all Agbala web components or remove the empty scaffold
  - **Verify:** No empty directories remain; if implemented, pages are functional

- [ ] **H08 — Fix Duplicate useUniverses Hooks**
  - **Description:** Two different `useUniverses` implementations with incompatible return types
  - **Files:**
    - `apps/web/src/hooks/useDatabase.ts` — `useUniverses()` with `{ universes, isLoading, error, getUniverse, isUniverseEnabled, hasFeature }`
    - `apps/web/src/hooks/useUniverses.ts` — `useUniverses()` with `{ universes, selected, isLoading, error, select, refetch }`
  - **Fix:** Consolidate into single hook; update all consumers to use one import
  - **Verify:** Only one `useUniverses` export exists; no duplicate imports

---

## Phase 3 — Documentation Fixes

- [ ] **M01 — Create CLAUDE.md**
  - **Description:** `README.md` line 220 references `CLAUDE.md` but file doesn't exist
  - **Files:** NEW: `CLAUDE.md`
  - **Fix:** Create file with project guidelines for AI assistants
  - **Verify:** `CLAUDE.md` exists and is referenced correctly

- [ ] **M02 — Fix Node Version Mismatch**
  - **Description:** `.nvmrc` says `22.16.0`, `.node-version` says `20.16.0`
  - **Files:**
    - `.nvmrc`
    - `.node-version`
  - **Fix:** Align both to `22.16.0`
  - **Verify:** Both files contain identical version

- [ ] **M03 — Update NestJS Version in 5 READMEs**
  - **Description:** READMEs say `NestJS 10.x` but actual version is `^11.1.27`
  - **Files:**
    - `services/core/auth-service/README.md`
    - `services/core/wallet-service/README.md`
    - `services/core/payment-service/README.md`
    - `services/core/content-service/README.md`
    - `services/core/analytics-service/README.md`
  - **Fix:** Update all to `NestJS 11.x`
  - **Verify:** No `NestJS 10.x` references remain

- [ ] **M04 — Update Node.js Version in 5 READMEs**
  - **Description:** READMEs say `Node.js 20+` or `Node.js 18+` but should be `22+`
  - **Files:**
    - `services/core/auth-service/README.md`
    - `services/core/wallet-service/README.md`
    - `services/core/payment-service/README.md`
    - `services/core/analytics-service/README.md`
    - `services/universes/vertical-service/README.md`
  - **Fix:** Update all to `Node.js 22+`
  - **Verify:** No `Node.js 18+` or `Node.js 20+` references remain

- [ ] **M05 — Replace npm with pnpm in READMEs**
  - **Description:** READMEs use `npm install`, `npm run` — project uses pnpm
  - **Files:**
    - `services/core/auth-service/README.md`
    - `services/core/wallet-service/README.md`
    - `services/core/payment-service/README.md`
    - `services/core/content-service/README.md`
    - `services/core/analytics-service/README.md`
    - `services/core/referral-service/README.md`
  - **Fix:** Replace all `npm` with `pnpm` in documentation
  - **Verify:** No `npm` command references remain in these files

- [ ] **M06 — Fix Auth Service README JWT Config**
  - **Description:** References `JWT_SECRET` instead of `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`
  - **Files:** `services/core/auth-service/README.md`
  - **Fix:** Update to show:
    - `JWT_ACCESS_SECRET` (not `JWT_SECRET`)
    - `JWT_REFRESH_SECRET`
    - `JWT_EXPIRES_IN=30m` (not `15m`)
  - **Verify:** JWT config matches actual service implementation

- [ ] **M07 — Fix Wallet/Reality README JWT Config**
  - **Description:** Reference `JWT_SECRET` instead of `JWT_ACCESS_SECRET`
  - **Files:**
    - `services/core/wallet-service/README.md`
    - `services/core/reality-service/README.md`
  - **Fix:** Update to `JWT_ACCESS_SECRET`
  - **Verify:** JWT config matches actual service implementation

- [ ] **M08 — Fix Support Service README Moderation URL**
  - **Description:** `MODERATION_SERVICE_URL=http://localhost:3006` should be `3022`
  - **Files:** `services/operations/support-service/README.md` — line 23
  - **Fix:** Change port to `3022`
  - **Verify:** Port matches canonical mapping

- [ ] **M09 — Fix Coolify Env Guide DB Naming**
  - **Description:** Uses `{service}_db` naming instead of `azeebo_{service}`
  - **Files:** `coolify-env-guide.md`
  - **Fix:** Update all database references:
    - `auth_db` → `azeebo_auth`
    - `wallet_db` → `azeebo_wallet`
    - etc.
  - **Verify:** All DB names use `azeebo_` prefix

- [ ] **M10 — Fix SQL README Database Reference**
  - **Description:** References `azeebo_plus_dev` shared database
  - **Files:** `scripts/sql/README.md`
  - **Fix:** Update to reflect per-service database model
  - **Verify:** No shared database references remain

- [ ] **M11 — Verify vertical-service docs/agbala-api.md**
  - **Description:** `services/universes/vertical-service/README.md` references `docs/agbala-api.md`
  - **Files:** `services/universes/vertical-service/docs/agbala-api.md`
  - **Fix:** Verify file exists and is complete
  - **Verify:** File contains all documented endpoints

- [ ] **M12 — Fix Admin Users Page Non-Existent Route**
  - **Description:** `router.push('/admin/users/${u.id}')` — no dynamic `[id]` route exists
  - **Files:**
    - `apps/web/src/app/admin/users/page.tsx` — line 198
    - NEW: `apps/web/src/app/admin/users/[id]/page.tsx` (if implementing)
  - **Fix:** Create `apps/web/src/app/admin/users/[id]/page.tsx` or remove the link
  - **Verify:** User detail page is accessible

---

## Phase 4 — Code Quality

- [ ] **L01 — Rename Duplicate Service Class Names**
  - **Description:** Same class names in different modules
  - **Files:**
    - `services/universes/vertical-service/src/modules/titles/titles.service.ts` — `TitlesService`
    - `services/universes/vertical-service/src/modules/agbala/titles.service.ts` — `TitlesService`
    - `services/universes/vertical-service/src/modules/characters/characters.service.ts` — `CharactersService`
    - `services/universes/vertical-service/src/modules/agbala/characters.service.ts` — `CharactersService`
  - **Fix:** Rename agbala versions to `AgbalaTitlesService` and `AgbalaCharactersService`
  - **Verify:** No duplicate class names; all imports updated

- [ ] **L02 — Standardize API Response Formats**
  - **Description:** Inconsistent response shapes across services
  - **Files:** All service response formatters
  - **Fix:** Standardize all services to return `{ success: boolean, data?: T, error?: { code, message } }`
  - **Verify:** All API responses follow same structure

- [ ] **L03 — Fix .gitignore .env.* Pattern**
  - **Description:** `.env.*` pattern matches `.env.example`
  - **Files:** `services/universes/vertical-service/.gitignore` — line 4
  - **Fix:** Change `.env.*` to `.env.local` or more specific patterns
  - **Verify:** `.env.example` is tracked; `.env.local` is ignored

- [ ] **L04 — Fix next.config.js outputFileTracingRoot**
  - **Description:** `outputFileTracingRoot` is not a valid Next.js config option
  - **Files:** `apps/web/next.config.js` — line 6
  - **Fix:** Remove the line or use correct key
  - **Verify:** No invalid config warnings

- [ ] **L05 — Migrate images.domains to remotePatterns**
  - **Description:** `images.domains` is deprecated in Next.js 15
  - **Files:** `apps/web/next.config.js` — lines 16-19
  - **Fix:** Migrate to `images.remotePatterns` format
  - **Verify:** No deprecation warnings

- [ ] **L06 — Remove ignoreDuringBuilds Flags**
  - **Description:** TypeScript/ESLint errors silenced at build
  - **Files:** `apps/web/next.config.js` — lines 10-14
  - **Fix:** Remove both `ignoreDuringBuilds: true` lines
  - **Verify:** Build shows actual errors instead of silencing them

- [ ] **L07 — Remove Unused Workspace Dependencies**
  - **Description:** `@azeebo/ui` and `@azeebo/design-tokens` are dependencies but never imported
  - **Files:** `apps/web/package.json`
  - **Fix:** Remove unused dependencies or implement components that use them
  - **Verify:** `pnpm install` still succeeds; no broken imports

- [ ] **L08 — Clean Up transpilePackages**
  - **Description:** 6 packages in `transpilePackages` are never imported
  - **Files:** `apps/web/next.config.js` — line 8
  - **Fix:** Remove unused packages from the list
  - **Verify:** Build still succeeds with reduced list

- [ ] **L09 — Standardize Mobile Import Style**
  - **Description:** Mix of `@/` aliases and relative imports
  - **Files:** All mobile source files
  - **Fix:** Standardize on `@/` aliases for new code
  - **Verify:** Consistent import style across mobile codebase

- [ ] **L10 — Standardize Web Import Style**
  - **Description:** Mix of `@/` aliases and relative imports
  - **Files:** All web source files
  - **Fix:** Standardize on `@/` for all imports
  - **Verify:** Consistent import style across web codebase

- [ ] **L11 — Add Missing Test Coverage (6 modules)**
  - **Description:** No test files for 6 modules
  - **Files:** Create test files for:
    - `characters/` module
    - `timeline/` module
    - `crossovers/` module
    - `admin/` module
    - `health/` module
    - `database/` module
  - **Fix:** Create test files following existing patterns
  - **Verify:** `pnpm test` passes for all 6 modules

- [ ] **L12 — Add Missing Agbala Test Coverage**
  - **Description:** No tests for Agbala services and helpers
  - **Files:** Create test files for:
    - `RoomService`
    - `TheoryService`
    - `pagination.helper.ts`
    - Agbala `CharactersService`
    - Agbala `TitlesService`
  - **Fix:** Create test files following existing patterns
  - **Verify:** `pnpm test` passes for Agbala modules

- [ ] **L13 — Generate Proper Prisma Migration**
  - **Description:** Migration file is empty
  - **Files:** `services/universes/vertical-service/prisma/migrations/20240101000000_init/migration.sql`
  - **Fix:** Generate proper migration:
    ```bash
    cd services/universes/vertical-service
    npx prisma migrate dev --name init
    ```
  - **Verify:** Migration contains actual SQL statements

- [ ] **L14 — Register or Move Unregistered Tab Routes**
  - **Description:** 6 files exist but not registered in Tabs layout
  - **Files:** `apps/mobile/app/(tabs)/`:
    - `search.tsx`
    - `wallet.tsx`
    - `payment.tsx`
    - `referral.tsx`
    - `library.tsx`
    - `transactions.tsx`
  - **Fix:** Register in `_layout.tsx` or move to separate route groups
  - **Verify:** All tab routes are accessible

---

## Phase 5 — Missing Files

- [ ] **F01 — Create CLAUDE.md**
  - **Description:** Referenced by `README.md` line 220 but doesn't exist
  - **Files:** NEW: `CLAUDE.md`
  - **Fix:** Create file with project guidelines for AI assistants
  - **Verify:** File exists and contains appropriate content

- [ ] **F02 — Create Web Agbala Pages (if implementing)**
  - **Description:** Expected `apps/web/src/app/vertical/agbala/` with 13 pages
  - **Files:** NEW: `apps/web/src/app/vertical/agbala/` directory structure
  - **Fix:** Create all Agbala web pages or remove empty scaffold
  - **Verify:** Pages exist and are accessible

- [ ] **F03 — Create Web Admin Agbala Pages (if implementing)**
  - **Description:** Expected `apps/web/src/app/admin/vertical/agbala/` with 10 pages
  - **Files:** NEW: `apps/web/src/app/admin/vertical/agbala/` directory structure
  - **Fix:** Create all admin Agbala pages or remove empty scaffold
  - **Verify:** Pages exist and are accessible

- [ ] **F04 — Create Mobile Agbala Hooks**
  - **Description:** Expected `apps/mobile/src/modules/vertical/agbala/hooks/` with 9 hooks
  - **Files:** NEW: `apps/mobile/src/modules/vertical/agbala/hooks/` directory structure
  - **Fix:** Create all Agbala hooks
  - **Verify:** Hooks exist and are importable

- [ ] **F05 — Create Mobile Agbala API Client**
  - **Description:** Expected `packages/api-client/src/agbala/client.ts`
  - **Files:** NEW: `packages/api-client/src/agbala/` directory structure
  - **Fix:** Create Agbala API client functions
  - **Verify:** Client functions exist and are importable

- [ ] **F06 — Complete or Remove OpenTelemetry Package**
  - **Description:** `packages/opentelemetry/` only has `src/index.ts`
  - **Files:** `packages/opentelemetry/`
  - **Fix:** Either complete the package (add `package.json`, `tsconfig.json`, implementation) or remove it
  - **Verify:** Package is functional or removed entirely

- [ ] **F07 — Create Storyworlds Controller**
  - **Description:** No controller exists for storyworlds module
  - **Files:** NEW: `services/universes/vertical-service/src/modules/storyworlds/storyworlds.controller.ts`
  - **Fix:** Create controller with all documented endpoints
  - **Verify:** Controller responds to HTTP requests

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
