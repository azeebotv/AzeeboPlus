# Azeebo+ Monorepo Code Quality Refactoring

## Context
The Azeebo+ monorepo (~27 services, 16 packages, 4 apps) has accumulated significant technical debt: ~1,090 committed build artifacts (~765MB), duplicated infrastructure code across services (25 copies of PrismaService, 8 copies of RolesGuard, etc.), 280 `any` type usages, inconsistent error handling, 8 services with zero logging, and 3 services with zero tests. This plan addresses code quality and patterns without restructuring the directory hierarchy of services/apps/packages.

---

## Task 1: Git & Infrastructure Cleanup

### 1a. Fix root `.gitignore`
**File**: `.gitignore`
- Add: `.next/`, `**/prisma/client/`, `**/generated/prisma/`, `*.tsbuildinfo`, `coverage/`

### 1b. Remove committed artifacts from git index
```bash
git rm -r --cached apps/web/.next/
git rm -r --cached '*/prisma/client/'   # ~560 files across 26 services
git rm --cached apps/web/tsconfig.tsbuildinfo
```

### 1c. Add missing service-level `.gitignore` files (11 services)
Create standard `.gitignore` in: media-service, engagement-service, messaging-service, referral-service, subscription-service, analytics-service, queue-service, support-service, lifestyle-service, vertical-service, api-gateway

### 1d. Merge `infrastructure/` into `infra/`
- Move 4 unique files:
  - `infrastructure/monitoring/alerts/payment-alerts.yml` → `infra/k8s/monitoring/payment-alerts.yml`
  - `infrastructure/monitoring/alerts/rate-limit-alerts.yml` → `infra/k8s/monitoring/rate-limit-alerts.yml`
  - `infrastructure/security/zap-config.yaml` → `infra/security/zap-config.yaml`
  - `infrastructure/kubernetes/blue-green-config.yaml` → `infra/k8s/blue-green-config.yaml`
- Delete: `infrastructure/kubernetes/ingress.yaml` (empty), `infrastructure/load-tests/api-load-test.js` (lighter duplicate)
- Remove empty dirs: `infra/terraform/`, `infra/ci-cd/`, `infra/kubernetes/`
- Delete entire `infrastructure/` directory

### 1e. Update CI/CD references
- `.github/workflows/security-scan.yml`: Update `infrastructure/security/` → `infra/security/`
- `.github/dependabot.yml`: Remove empty terraform block

**Verification**: `grep -rn "infrastructure/" .github/` returns zero results

---

## Task 2: Deduplicate Shared Infrastructure

### 2a. Create barrel export for `@azeebo/shared-services`
**File to create**: `packages/shared-services/src/index.ts`
- Export PrismaService, PrismaModule, RedisService, RedisModule, cache, middleware, pagination, sanitize, analytics, api-versioning, audit modules

### 2b. Add shared auth decorators/guards
**Files to create** in `packages/shared-services/src/auth/`:
- `roles.decorator.ts` — based on the canonical 4-line version
- `roles.guard.ts` — based on auth-service's 36-line version
- `jwt.strategy.ts` — based on auth-service's 50-line version
- `index.ts` — barrel export

### 2c. Migrate services to shared PrismaService (25 → 1)
For each service: update imports to use `@azeebo/shared-services`, delete local `prisma.service.ts`
- 17 services have identical 13-line copies (straightforward delete)
- 7 services have 30-49 line variants (review for custom logic first, merge extras into shared version)

**Note**: Each service still needs its own `PrismaModule` configured with its specific generated Prisma client. Only the `PrismaService` class is shared.

### 2d. Migrate services to shared RedisService (7 → 1)
- 5 services have ~50-line copies (likely identical, straightforward)
- content-service has 91-line version (extract custom pub/sub into wrapper)

### 2e. Migrate roles.decorator + roles.guard (8 copies each → 1)
Update imports in 8 services, delete local copies. Keep `apps/admin` variant (different logic).

### 2f. Migrate jwt.strategy.ts (2 → 1)
Replace creator-service copy with shared import. Evaluate admin/creator-portal app copies separately.

**Verification**: `pnpm build` succeeds for all affected services. Existing tests pass.

---

## Task 3: Code Quality Fixes

### 3a. Fix `any` types (280 total, target top offenders)
Priority files:
1. `services/intelligence/analytics-service/src/modules/report-builder/report-builder.service.ts` (23) — Create typed interfaces for Prisma groupBy results
2. `apps/mobile/src/contexts/ContentContext.tsx` (11) — Type context value interface
3. `apps/mobile/src/contexts/WalletContext.tsx` (5), `SettingsContext.tsx` (5), `NotificationContext.tsx` (5) — Type state interfaces
4. `apps/web/src/app/creators/dashboard/content/page.tsx` (6) — Type content data
5. Test files with `any` mocks — Use `jest.Mocked<T>` or typed mock factories

### 3b. Standardize error handling
Replace raw `throw new Error()` with NestJS HttpException subclasses in:
- `wallet-service/wallet.repository.ts` (11 instances) → `NotFoundException`, `BadRequestException`, etc.
- `payment-service/paystack.provider.ts` (7 instances) → `BadRequestException`, `ServiceUnavailableException`
- `moderation-service/moderation.service.ts` (7 instances) → `NotFoundException`, `BadRequestException`
- `media-service/s3.service.ts` (5 catch-and-rethrow) → Wrap in `InternalServerErrorException`

### 3c. Add logging to 8 silent services
Add NestJS `Logger` to business logic in: search-service, referral-service, reward-service, subscription-service, analytics-service, recommendation-service, movie-service, vertical-service

### 3d. Replace console.log in shared-types
**File**: `packages/shared-types/src/secret-validation.ts` (9 console.log)
→ Use `@azeebo/logger`

### 3e. Replace raw fetch() with typed clients
- `content.service.ts` (L693, L728) → Use or create `ModerationClient` in `@azeebo/internal-clients`
- `apps/mobile/src/api/media.ts` (3 calls) → Route through app's API abstraction
- `apps/mobile/src/utils/appleGooglePay.ts` → Route through app's API client

**Verification**: `pnpm typecheck` passes. Service-specific tests pass.

---

## Task 4: Test Infrastructure

### 4a. Add jest configs to packages with existing tests
Create `jest.config.js` for: `packages/security`, `packages/validation`, `packages/error-handling`

### 4b. Write tests for 3 untested services
Create basic service spec files:
- `services/engagement/engagement-service/src/modules/engagement/engagement.service.spec.ts`
- `services/engagement/messaging-service/src/modules/messaging/messaging.service.spec.ts`
- `services/engagement/referral-service/src/modules/referral/referral.service.spec.ts`

### 4c. Add tests for apps/creator-portal (0 tests)
Create: `apps/creator-portal/src/auth/auth.service.spec.ts`, `apps/creator-portal/src/creator/creator.service.spec.ts`

### 4d. Add jest config + basic tests for apps/web
Create `apps/web/jest.config.js` (using `next/jest`) and basic unit tests for API client and context providers.

### 4e. Add jest configs to remaining 8 packages
Create standard `jest.config.js` for: auth, design-tokens, feature-flags, internal-clients, logger, ui (jsdom), utils

**Verification**: `pnpm -r test` passes across all workspaces.

---

## Execution Order
```
Task 1 (Git/Infra) → Task 2 (Dedup) → Task 3 (Quality) + Task 4 (Tests) in parallel
```

## Risk Mitigation
- Run `pnpm build` and `pnpm test` after each phase
- Services must run `npx prisma generate` after removing committed Prisma clients
- Split into separate PRs per task for reviewability
- Do NOT delete files with custom logic — extract into wrappers first
