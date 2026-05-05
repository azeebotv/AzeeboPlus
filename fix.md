# Azeebo+ Production Readiness Fix Guide

This document provides detailed, step-by-step instructions for completing all tasks specified in the production readiness checklist.

---

## Table of Contents

- [Phase 0: Repository Baseline and Hygiene](#phase-0--repository-baseline-and-hygiene)
- [Phase 1: Make The Workspace Build, Lint, And Test](#phase-1--make-the-workspace-build-lint-and-test)
- [Phase 2: Fix API Contract Drift](#phase-2--fix-api-contract-drift)
- [Phase 3: Data Model And Persistence](#phase-3--data-model-and-persistence)
- [Phase 4: Security And Compliance](#phase-4--security-and-compliance)
- [Phase 5: Service Completeness](#phase-5--service-completeness)
- [Phase 6: Frontend And Mobile Readiness](#phase-6--frontend-and-mobile-readiness)
- [Phase 7: Observability And Operations](#phase-7--observability-and-operations)
- [Phase 8: Infrastructure And Deployment](#phase-8--infrastructure-and-deployment)
- [Phase 9: Testing Strategy](#phase-9--testing-strategy)
- [Phase 10: Product And Compliance Finishing](#phase-10--product-and-compliance-finishing)

---

## Phase 0: Repository Baseline and Hygiene

### Task 1: Convert to Real Git Repository

**Objective:** Establish proper version control for production-ready workflows.

**Action Items:**
1. Check current git status:
   ```bash
   git status --short
   ```
2. If `fatal: not a git repository` error occurs, initialize git:
   ```bash
   git init
   ```
3. If this folder should be part of an existing repository, clone that repository and move contents.

**Verification Steps:**
- `git status --short` returns clean or shows expected untracked files
- `git log` shows commits
- `git branch` shows branches

---

### Task 2: Remove Committed Generated Artifacts

**Objective:** Clean source control of generated files that should be built locally.

**Action Items:**
1. Remove problematic directories:
   ```bash
   rm -rf node_modules dist .next *.tsbuildinfo
   rm -rf src/prisma/client src/generated/prisma
   ```
2. Update `.gitignore` with comprehensive generated paths including node_modules/, dist/, .next/, *.tsbuildinfo, src/prisma/client/, src/generated/prisma/, .env files, coverage/, etc.
3. Remove artifacts from git tracking:
   ```bash
   git rm -r --cached node_modules dist .next *.tsbuildinfo src/prisma/client src/generated/prisma 2>/dev/null || true
   ```

**Verification Steps:**
- `git status` shows no generated artifacts
- `.gitignore` covers all generated paths
- Build commands regenerate necessary files

---

### Task 3: Normalize Workspace Package Ownership

**Objective:** Clarify which packages are deployable services, shared packages, or legacy duplicates.

**Action Items:**
1. List all workspace packages:
   ```bash
   pnpm list --depth -1 --json | grep '"path"' | head -50
   ```
2. Identify duplicates: `services/vertical-service` vs `modules/vertical-service` and `services/lifestyle-service` vs `modules/lifestyle-service`
3. For each duplicate, decide: keep in `services/` if deployable, keep in `modules/` if shared library, remove if legacy
4. Update `pnpm-workspace.yaml` to reflect correct structure
5. Ensure each retained package has README.md, package.json with scripts, clear owner, and release/deploy status

**Verification Steps:**
- `pnpm list` shows no duplicates
- Each package has README
- All packages have proper scripts

---

### Task 4: Add Root README.md

**Objective:** Create concise bootstrap documentation for local development.

**Action Items:**
Create `/README.md` with sections covering:
- Prerequisites (Node.js 20+, pnpm 8+, Docker)
- Installation: `pnpm install`
- Environment setup: `cp .env.example .env`
- Database setup: Prisma generate, migrate, seed
- Build: `pnpm build`
- Test: `pnpm test`, `pnpm lint`
- Run services
- API base URL and gateway route format

**Verification Steps:**
- `/README.md` exists with all required sections

---

### Task 5: Add Canonical .env.example Contract

**Objective:** Establish environment variable standards across all services.

**Action Items:**
1. Create root `.env.example` with DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, API_BASE_URL, GATEWAY_PORT, and service URLs
2. Add missing `.env.example` to `services/analytics-service/`
3. Audit existing `.env` files for secrets and rotate if needed

**Verification Steps:**
- Root `.env.example` exists
- All services have `.env.example` files
- No `.env` files committed

---

## Phase 1: Make The Workspace Build, Lint, And Test

### Task 6: Fix Admin Build Failures

**Objective:** Get `apps/admin` building successfully.

**Action Items:**
1. Fix missing `helmet` dependency: `pnpm add helmet` or remove the import
2. Fix bad Prisma imports - replace `from '../../database/prisma.service'` with `from '@prisma/client'` or `from '@/lib/prisma'`
3. Fix UserManagementService schema mismatch - remove references to non-existent `status` field or add it to schema
4. Rebuild: `pnpm --filter @azeebo/admin build`

**Verification Steps:**
- `pnpm --filter @azeebo/admin build` succeeds
- No TypeScript errors related to imports or schema

---

### Task 7: Fix Invalid Jest Scripts

**Objective:** Enable test execution across the workspace.

**Action Items:**
1. Identify invalid scripts: `grep -r "jest --run" */package.json`
2. Replace `"test": "jest --run"` with `"test": "jest"` or `"test": "jest --runInBand"`
3. Run tests: `pnpm -r test`

**Verification Steps:**
- `pnpm -r test` runs without immediate failures

---

### Task 8: Fix Root Lint Execution

**Objective:** Get `pnpm -r lint` passing across all packages.

**Action Items:**
1. Fix unused state in `apps/web/src/app/page.tsx` - use or remove `error` state
2. Fix console usage - replace with project logger or guarded development-only logging
3. Format files with Prettier: `npx prettier --write apps/web/src/context/AuthContext.tsx apps/web/src/lib/api.ts`

**Verification Steps:**
- `pnpm -r lint` completes without errors in apps/web

---

### Task 9: Add Missing Scripts to Workspace Packages

**Objective:** Ensure all workspace packages support standard contract.

**Action Items:**
1. Add scripts to `services/search-service/package.json`: dev, build, start, lint, test
2. Complete `services/shared/queue/package.json` with proper scripts and dependencies
3. Add test script to `services/media-service/package.json`
4. Verify all packages have required scripts

**Verification Steps:**
- All deployable packages have build, lint, test scripts
- `pnpm -r build`, `pnpm -r lint`, `pnpm -r test` all run

---

### Task 10: Add CI Pipeline

**Objective:** Automate quality gates that match local development.

**Action Items:**
Create `.github/workflows/ci.yml` with:
- pnpm setup
- Install with `pnpm install --frozen-lockfile`
- Prisma generate
- Build: `pnpm -r build`
- Lint: `pnpm -r lint`
- Unit tests: `pnpm -r test`
- Web build
- Docker build smoke test
- Security audit: `pnpm audit --audit-level=high`
- Check for committed generated artifacts

**Verification Steps:**
- CI workflow exists in `.github/workflows/`
- All gates run on PR

---

## Phase 2: Fix API Contract Drift

### Task 11: Define Canonical API Route Map

**Objective:** Establish one consistent public API contract.

**Action Items:**
1. Adopt `/api/v1/:service/:resource` format:
   - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh-token`, etc.
2. Update gateway routes to match
3. Update all clients (web, mobile, service-to-service)
4. Update API documentation

**Verification Steps:**
- Gateway routes match client expectations
- Contract tests pass for all routes

---

### Task 12: Standardize Auth Response Shapes

**Objective:** Consistent token naming across auth flows.

**Action Items:**
Use snake_case for API responses:
```json
{
  "access_token": "jwt-token",
  "refresh_token": "uuid-token"
}
```
Update AuthService and client expectations to match.

**Verification Steps:**
- All auth endpoints return `access_token` and `refresh_token`
- No mixed usage of `token` vs `access_token`

---

### Task 13: Fix Refresh Token Generation and Persistence

**Objective:** Secure and reliable token refresh mechanism.

**Action Items:**
1. Choose approach: signed JWTs or opaque random tokens
2. Fix missing `await` on `authRepository.createSession()`
3. Implement proper token verification

**Verification Steps:**
- Refresh tokens persist to database
- No race conditions in session creation

---

### Task 14: Align Frontend Registration DTOs

**Objective:** Consistent field names across registration flows.

**Action Items:**
Standardize on `displayName` field - update client to send `displayName` instead of `name` if server expects `displayName`.

**Verification Steps:**
- Registration POST contains correct field name
- Server accepts registration with matching DTO

---

### Task 15: Fix Gateway Service Port and Path Mapping

**Objective:** Consistent service routing configuration.

**Action Items:**
1. Compare docker-compose.yml ports with ProxyController defaults
2. Update ProxyController to match docker-compose for mismatched services (content, notification, moderation, recommendation)
3. Add contract tests for all routes

**Verification Steps:**
- Gateway routes match service ports
- Contract tests pass for all routes

---

### Task 16: Harden Gateway Proxy Behavior

**Objective:** Production-grade proxy reliability and security.

**Action Items:**
1. Preserve response integrity - status codes, non-JSON responses
2. Implement caching rules - don't cache authenticated GETs
3. Add request ID forwarding
4. Add timeouts and circuit breaker
5. Implement retry logic for idempotent requests

**Verification Steps:**
- Non-JSON responses preserved
- Authenticated requests not cached
- Circuit breaker activates on failures

---

## Phase 3: Data Model And Persistence

### Task 17: Decide Database Architecture

**Objective:** Clear ownership of data models per service.

**Action Items:**
1. Audit all schema definitions for overlapping models
2. Document model ownership (User → Auth, Wallet → Wallet, ContentItem → Content, PaymentIntent → Wallet)
3. Choose: single shared schema or service-owned schemas
4. Implement decision with clear `@ignore` directives

**Verification Steps:**
- No duplicate model definitions
- Clear ownership documented

---

### Task 18: Replace Float with Decimal for Money

**Objective:** Safe monetary calculations.

**Action Items:**
1. Update Prisma schema: `Float` → `Decimal @db.Numeric(19, 4)` for all money fields
2. Update service code to handle Decimal type
3. Add rounding rules

**Verification Steps:**
- All money fields use Decimal
- Calculations maintain precision

---

### Task 19: Add Idempotency for Money Operations

**Objective:** Prevent double-charging from duplicate webhooks.

**Action Items:**
1. Add `idempotencyKey String @unique` to PaymentIntent, WalletTransaction, CreditLog
2. Implement idempotency check before processing
3. Add unique constraint on provider reference

**Verification Steps:**
- Duplicate webhooks don't double-credit
- Idempotency keys are unique

---

### Task 20: Make Wallet Operations Fully Transactional

**Objective:** Atomic wallet operations with correct balance reporting.

**Action Items:**
1. Wrap all wallet operations in `prisma.$transaction()`
2. Implement row-level locking for debit operations
3. Return actual new balances from operations

**Verification Steps:**
- All wallet operations wrapped in transactions
- Row-level locking prevents race conditions

---

### Task 21: Add Migration Discipline

**Objective:** Version-controlled, repeatable database changes.

**Action Items:**
1. Replace `pnpm prisma db push` with `pnpm prisma migrate dev`
2. Create idempotent seed scripts
3. Add migration check in CI

**Verification Steps:**
- `pnpm prisma migrate status` shows no pending migrations
- Seeds are idempotent

---

### Task 22: Remove Hard-Coded Seed Credentials

**Objective:** Secure production bootstrap.

**Action Items:**
1. Find hard-coded credentials: `grep -r "admin123\|password\|secret" prisma/seed/`
2. Create secure bootstrap flow with generated passwords
3. Remove seed SQL with passwords

**Verification Steps:**
- No hard-coded passwords in seed files
- Admin credentials generated dynamically

---

## Phase 4: Security And Compliance

### Task 23: Centralize Environment Validation

**Objective:** Fail fast on missing or invalid configuration.

**Action Items:**
1. Create Zod validation schema for environment variables
2. Call validation at service startup
3. Add production checks for JWT_SECRET strength and localhost database

**Verification Steps:**
- Service fails to start with missing/wrong env vars

---

### Task 24: Lock Down CORS and Swagger

**Objective:** Production-appropriate access controls.

**Action Items:**
1. Implement environment-aware CORS
2. Disable or protect Swagger in production
3. Use explicit ALLOWED_ORIGINS in production

**Verification Steps:**
- Production CORS rejects unknown origins
- Swagger not exposed in production

---

### Task 25: Fix Webhook Signature Verification

**Objective:** Secure webhook processing from payment providers.

**Action Items:**
1. Use raw body for signature calculation
2. Use constant-time comparison
3. Add replay protection with event timestamps

**Verification Steps:**
- Valid signatures pass verification
- Invalid signatures rejected
- Replay attacks blocked

---

### Task 26: Secure Token Storage

**Objective:** Production-grade token management.

**Action Items:**
1. Implement HTTP-only secure cookies for web
2. Use SecureStore with biometrics for mobile
3. Don't store tokens in localStorage

**Verification Steps:**
- Tokens in HTTP-only cookies
- Mobile uses secure storage

---

### Task 27: Finish Rate Limiting

**Objective:** Comprehensive abuse protection.

**Action Items:**
1. Ensure RateLimitGuard uses Redis store
2. Apply per-endpoint limits:
   - Login: 5/15min
   - Register: 3/hour
   - OTP: 3/minute
   - Payment init: 10/minute

**Verification Steps:**
- RateLimitGuard uses Redis
- Auth endpoints have strict limits

---

### Task 28: Remove Sensitive Logging

**Objective:** Prevent PII/sensitive data exposure.

**Action Items:**
1. Audit logs: `grep -r "console\." services/`
2. Replace console with structured logger
3. Create redaction utility for sensitive fields
4. Never log OTP values, passwords, or full tokens

**Verification Steps:**
- No OTP/password/token values in logs
- Structured logging implemented

---

### Task 29: Add Authorization Tests

**Objective:** Comprehensive access control validation.

**Action Items:**
Create authorization test suite with:
- Negative tests for unauthenticated access
- Role-based access tests (admin, creator, user)
- Tests for accessing other users' resources

**Verification Steps:**
- All privileged routes have authorization tests
- Negative tests included

---

### Task 30: Add Content Security and Upload Controls

**Objective:** Safe file handling and content moderation.

**Action Items:**
1. Implement file validation (MIME type, extension, size)
2. Integrate malware scanning
3. Serve uploads via signed CDN URLs
4. Enforce moderation status before publishing

**Verification Steps:**
- Invalid files rejected
- Malware detected and rejected
- Content requires moderation approval

---

## Phase 5: Service Completeness

### Task 31: Replace Placeholder Payment Providers

**Objective:** Production payment integration.

**Action Items:**
1. Implement Paystack event handling (charge.success, transfer.success/failed, refund.created)
2. Add verification with provider API
3. Implement retry logic with exponential backoff
4. Add reconciliation job

**Verification Steps:**
- Webhook processing works end-to-end
- Reconciliation finds discrepancies

---

### Task 32: Finish Media Processing

**Objective:** Production media handling.

**Action Items:**
1. Implement transcoding queue with Bull
2. Add thumbnail generation
3. Implement failed job recovery
4. Serve media via signed CDN URLs

**Verification Steps:**
- Video uploads trigger transcoding
- Failed jobs recovered and retried

---

### Task 33: Make Moderation Real and Auditable

**Objective:** Production moderation system.

**Action Items:**
1. Define ModerationCase, AuditLog models
2. Implement case lifecycle (create, assign, review, decision)
3. Add appeal flow
4. Create audit logs for all actions

**Verification Steps:**
- Cases created for flagged content
- Decisions create audit logs

---

### Task 34: Complete Search and Recommendation Services

**Objective:** Functional search and recommendation.

**Action Items:**
1. Implement search with Elasticsearch (filters, pagination, ranking)
2. Add reindex job
3. Implement recommendation with fallback to trending
4. Add explainability to recommendations

**Verification Steps:**
- Search returns relevant results
- Recommendations have explainability

---

### Task 35: Clarify Vertical/Module Services

**Objective:** Clear ownership of vertical services.

**Action Items:**
1. Audit duplicate services
2. Create service registry documenting ownership
3. Remove or consolidate duplicates

**Verification Steps:**
- No duplicate service directories
- Service registry documented

---

### Task 36: Add Notification Delivery Reliability

**Objective:** Production notification system.

**Action Items:**
1. Implement notification queue for email/SMS/push
2. Add bounce handling and suppression lists
3. Implement provider failover

**Verification Steps:**
- Notifications queued properly
- Provider failover works

---

## Phase 6: Frontend And Mobile Readiness

### Task 37: Align Web App Routes with Backend Contracts

**Objective:** Consistent API integration.

**Action Items:**
1. Audit web app API calls
2. Create typed API client with route contracts
3. Add contract tests

**Verification Steps:**
- All API calls match backend routes
- Contract tests pass

---

### Task 38: Implement Real Authenticated Route Handling

**Objective:** Complete authentication UX.

**Action Items:**
1. Create AuthGuard and AdminGuard components
2. Handle expired sessions with refresh flow
3. Handle logout everywhere

**Verification Steps:**
- Unauthenticated users redirected to login
- Expired sessions trigger refresh

---

### Task 39: Improve Web App Error, Empty, and Loading States

**Objective:** Complete UX states.

**Action Items:**
1. Create reusable state components (LoadingState, ErrorState, EmptyState)
2. Fix home page to render error state
3. Add empty states for: no content, no wallet, no transactions, failed video, failed payment

**Verification Steps:**
- Loading states shown during data fetching
- Error and empty states shown appropriately

---

### Task 40: Complete Mobile API Integration

**Objective:** Production mobile API integration.

**Action Items:**
1. Fix API base URL for devices (not localhost)
2. Configure environment-specific URLs
3. Implement secure token storage with biometrics
4. Implement refresh flow
5. Handle offline mode
6. Handle push token registration

**Verification Steps:**
- Mobile works with production API
- Tokens stored securely

---

### Task 41: Add Accessibility and UX Checks

**Objective:** Validate accessibility and UX best practices.

**Action Items:**
1. Validate keyboard navigation
2. Check focus states
3. Verify contrast ratios
4. Test reduced-motion behavior
5. Check form labels and error messages
6. Test screen reader semantics

**Verification Steps:**
- Keyboard navigation works
- Focus states visible
- Color contrast accessible

---

### Task 42: Add Real Media Playback Testing

**Objective:** Verify protected video playback.

**Action Items:**
1. Test protected video playback
2. Verify signed URL expiry
3. Test resume progress
4. Verify watch history
5. Test comments
6. Check device/browser compatibility

**Verification Steps:**
- Videos play on supported devices
- Progress saves correctly

---

## Phase 7: Observability And Operations

### Task 43: Standardize Structured Logging

**Objective:** Consistent logging across services.

**Action Items:**
1. Choose one logger package for all services
2. Include: request ID, user ID (when safe), service name, route, latency, status, trace IDs
3. Implement redaction for sensitive fields

**Verification Steps:**
- All services use same logger format
- Request IDs propagated through gateway

---

### Task 44: Add Metrics and Tracing

**Objective:** Full observability.

**Action Items:**
1. Expose Prometheus metrics:
   - HTTP latency and errors
   - Queue depth
   - Payment events
   - Wallet ledger failures
   - Media processing
   - Search latency
   - Database health
2. Add OpenTelemetry tracing through gateway, services, queues, and external providers

**Verification Steps:**
- Metrics available at `/metrics`
- Traces linked across services

---

### Task 45: Strengthen Health Checks

**Objective:** Proper liveness and readiness probes.

**Action Items:**
1. Separate liveness and readiness endpoints
2. Readiness should verify:
   - Database connectivity
   - Redis connectivity
   - Queue connectivity
   - External provider configuration
   - Required migrations

**Verification Steps:**
- Liveness returns 200 if process is running
- Readiness returns 200 if all dependencies healthy

---

### Task 46: Add Audit Logs for Sensitive Actions

**Objective:** Tamper-resistant audit records.

**Action Items:**
Log these sensitive actions to tamper-resistant store:
- Auth changes (password, 2FA)
- Admin changes
- Wallet movements
- Payment callbacks
- Refunds
- Content publication
- Moderation decisions
- User role changes

**Verification Steps:**
- All sensitive actions logged
- Logs are tamper-resistant

---

### Task 47: Add Backup, Restore, and Disaster Recovery

**Objective:** Tested backup and restore procedures.

**Action Items:**
1. Document tested restore steps
2. Define RPO/RTO targets
3. Document encryption and retention policy
4. Test backup/restore quarterly

**Verification Steps:**
- Restore tested and documented
- RPO/RTO documented

---

## Phase 8: Infrastructure And Deployment

### Task 48: Fix Docker Compose Correctness

**Objective:** Verified Docker Compose configuration.

**Action Items:**
1. Verify every build context exists
2. Verify every healthcheck hits actual internal port
3. Fix queue-service healthcheck (currently points to wrong port)
4. Fix web NEXT_PUBLIC_API_BASE_URL to use gateway

**Verification Steps:**
- `docker-compose ps` shows healthy services
- Healthchecks passing

---

### Task 49: Add Dockerfiles for All Deployables

**Objective:** All deployable packages containerized.

**Action Items:**
1. Identify all deployable packages
2. Add Dockerfiles for each
3. Document which packages are not deployables (modules)

**Verification Steps:**
- All deployable services have Dockerfiles
- Non-deployables documented

---

### Task 50: Fix Kubernetes Manifests

**Objective:** Consistent Kubernetes configuration.

**Action Items:**
1. Fix secret key casing consistency (DATABASE_URL vs database-url)
2. Add resource requests/limits
3. Add liveness/readiness probes
4. Add pod disruption budgets
5. Add network policies
6. Configure TLS
7. Set up ingress routing
8. Create environment overlays

**Verification Steps:**
- `kubectl apply --dry-run` passes
- All resources have proper resource limits

---

### Task 51: Add Production Image Hardening

**Objective:** Secure container images.

**Action Items:**
1. Use multi-stage builds
2. Use non-root users
3. Use minimal runtime images
4. Use deterministic installs
5. Prisma generation in build
6. Add vulnerability scanning (Trivy)

**Verification Steps:**
- Images pass vulnerability scan
- No root user in final image

---

### Task 52: Add Release Environments

**Objective:** Defined environments and promotion flow.

**Action Items:**
1. Define local, test, staging, production env files/secrets
2. Add promotion flow: local → test → staging → production
3. Add smoke tests in promotion
4. Document rollback strategy
5. Add database migration approval in promotion

**Verification Steps:**
- All environments documented
- Promotion flow tested

---

## Phase 9: Testing Strategy

### Task 53: Expand Unit Tests for High-Risk Domains

**Objective:** Test coverage for critical paths.

**Action Items:**
Add unit tests for:
- Auth token rotation
- Rate limits
- OTP generation/verification
- Password reset
- Wallet ledger (credit/debit)
- Payment verification
- Webhook idempotency
- Content publish flow
- Moderation decisions
- Gateway proxying

**Verification Steps:**
- High-risk domains have unit tests
- Tests pass

---

### Task 54: Add Real Integration Tests

**Objective:** Tests with real databases.

**Action Items:**
1. Use isolated Postgres/Redis test containers
2. Run migrations before tests
3. Don't mock Prisma for integration tests

**Verification Steps:**
- Integration tests use real databases
- Tests are isolated per suite

---

### Task 55: Add Contract Tests

**Objective:** Validate client/service contracts.

**Action Items:**
1. Generate or validate OpenAPI specs
2. Ensure frontend/mobile clients can't drift from service routes
3. Test response shapes

**Verification Steps:**
- OpenAPI specs validated
- Contract tests in CI

---

### Task 56: Add E2E Tests for Critical Journeys

**Objective:** Test critical user flows.

**Action Items:**
Add E2E tests for:
- Signup
- Login
- Browse content
- Watch video
- Save content
- Fund wallet
- Payment callback
- Creator upload
- Admin moderation
- Search
- Logout

**Verification Steps:**
- Critical journeys tested
- E2E tests pass

---

### Task 57: Add Load and Resilience Tests

**Objective:** Verify performance under load.

**Action Items:**
1. Extend load test script for:
   - Authenticated flows
   - Media URLs
   - Payment-safe dry runs
   - Search
   - Gateway fanout
2. Add failure injection:
   - Redis failure
   - Database latency
   - Provider timeout
   - Queue retry storms

**Verification Steps:**
- Load tests complete successfully
- Failure scenarios handled gracefully

---

## Phase 10: Product And Compliance Finishing

### Task 58: Define Production Privacy and Legal Requirements

**Objective:** Legal compliance.

**Action Items:**
1. Terms of service
2. Privacy policy
3. Cookie consent
4. Data retention policy
5. Account deletion/export (GDPR)
6. Age gating if required
7. Creator payout terms
8. Content rights records

**Verification Steps:**
- Legal documents published
- User data export works
- Account deletion works

---

### Task 59: Add Support and Admin Operations Workflows

**Objective:** Operational procedures for support team.

**Action Items:**
Document workflows for:
- User suspension
- Refund handling
- Chargeback handling
- Content takedown
- Creator verification
- Payout review
- Incident notes
- Manual ledger adjustments

**Verification Steps:**
- All workflows documented
- Support team trained

---

### Task 60: Add Analytics Governance

**Objective:** Proper analytics handling.

**Action Items:**
1. Define analytics event schema
2. Implement consent handling
3. Add PII redaction
4. Set retention policy
5. Assign dashboard ownership

**Verification Steps:**
- Analytics events validated
- Consent respected

---

### Task 61: Complete Documentation for Operators

**Objective:** Runbooks for operations.

**Action Items:**
Create runbooks for:
- Deploys
- Migrations
- Incident response
- Provider outages (Paystack, Flutterwave)
- Failed payments
- Queue backlog
- Media processing failures
- Database restore

**Verification Steps:**
- All runbooks documented
- Incident response tested

---

### Task 62: Run Final Production Gate

**Objective:** Final production readiness checklist.

**Action Items:**
Run all gates:
1. `pnpm install --frozen-lockfile`
2. `pnpm -r build`
3. `pnpm -r lint`
4. `pnpm -r test`
5. Prisma migration check
6. Docker Compose smoke test
7. Kubernetes dry-run validation
8. Web E2E suite
9. Mobile build/export check
10. Dependency/license/security audit
11. Load test against staging

**Verification Steps:**
- All gates pass
- Production ready

---

## Quick Reference: Critical Paths

### Phase 0-1 (Must Complete First)
1. Initialize Git repository
2. Remove generated artifacts
3. Fix admin build
4. Fix Jest scripts
5. Get `pnpm -r build` passing
6. Get `pnpm -r lint` passing
7. Get `pnpm -r test` passing

### Phase 2 (Critical for Integration)
1. Define canonical API routes
2. Standardize auth response shapes
3. Fix gateway routing

### Phase 3-4 (Critical for Security)
1. Fix money types (Float → Decimal)
2. Add idempotency
3. Fix webhook signatures
4. Implement token security

### Phase 5-10 (Completion)
Complete service implementations, frontend/mobile readiness, observability, infrastructure, testing, and compliance requirements.

---

## Appendix: Common Commands

```bash
# Workspace
pnpm install
pnpm -r build
pnpm -r lint
pnpm -r test

# Database
pnpm prisma generate
pnpm prisma migrate dev --name <migration_name>
pnpm prisma migrate deploy
pnpm prisma db push  # Only for local development!

# Docker
docker-compose up
docker-compose ps
docker build -f services/<service>/Dockerfile .

# Kubernetes
kubectl apply -f k8s/
kubectl get pods
kubectl logs <pod-name>

# CI
pnpm audit --audit-level=high
git diff --name-only | grep -E "(node_modules|dist|\.next)"  # Check for artifacts
```
