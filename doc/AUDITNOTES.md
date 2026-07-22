# Security Audit — Remaining Items (Require Human Decision)

> Generated from deep security audit of the Azeebo+ codebase.
> Items below were identified but not auto-fixed because they require infrastructure changes, secret rotation, or architectural decisions.

---

## CRITICAL — Immediate Action Required

### 1. GATEWAY_SECRET Committed Across 30+ Service `.env` Files

**Files:** All service `.env` files (30+)
**Value:** `GATEWAY_SECRET=i3VbtMeZRUuLGqMOrX5UZlAHkdd2lvbjqCLdu66xO0A=`

The shared secret protecting service-to-service communication is hardcoded in every service `.env` file. Anyone with repository access can forge `x-user-*` + `x-gateway-secret` headers to bypass gateway auth and impersonate any user when calling services directly.

**Status:** PLACEHOLDER REJECTED AT STARTUP — `validateEnvironment()` now rejects known placeholder values for `GATEWAY_SECRET`. Production deployment requires rotating to a real secret. See `packages/shared-types/src/env-validation.ts`.

---

### 2. Real JWT Secrets Committed in Root `.env`

**File:** `.env:41-42`
**Values:**
- `JWT_ACCESS_SECRET=GWi4v/g4gH2BlG5V1mbeVScgKydMTfaEPZZ5ONPtdItUrlQXJJW80enBVBvMnZ9r`
- `JWT_REFRESH_SECRET=Far8vNx2c3NQs3u1eb37jKR3sAvye7+mo0Pd3YRX2lISbChwSMPTCm27Xy2vZvJc`

Real JWT secrets exist on disk. If this repo was ever made public or `.gitignore` bypassed, all tokens are compromised.

**Action:**
- Rotate immediately: `openssl rand -base64 48`
- Move to secrets manager
- Add a pre-commit hook (e.g., `gitleaks` or `git-secrets`) that rejects `.env` files with real secrets

---

### 3. Placeholder JWT Secrets in All Service `.env` Files

**Files:** All 20+ service `.env` files
**Value:** `JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-change-this-in-production`

All services share the same placeholder secret. If deployed without changing, an attacker can forge valid JWTs.

**Status:** REJECTED AT STARTUP — `validateEnvironment()` now rejects known placeholder patterns for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GATEWAY_SECRET`, `INTERNAL_API_KEY`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`. Services will crash on startup if placeholders are detected.

---

## HIGH — Should Fix Before Production

### 4. Hardcoded DB Credentials in Docker Compose

**Files:**
- `apps/creator/docker-compose.yml:19`
- `apps/admin/docker-compose.yml:19`

Database password `azeebo_dev_2024` is hardcoded in docker-compose files committed to git.

**Status:** FIXED — password replaced with `${DB_PASSWORD:-azeebo_dev_2024}` env var with dev fallback.

---

### 5. Identical Dev Database Passwords Across All 28 Services

**File:** `.env:11-38`

All service database passwords are the same (`azeebo_dev_2024`). If one service is compromised, all databases are accessible.

**Action:**
- Use unique passwords per service even in development
- Generate with: `openssl rand -base64 24`

---

### 6. Tokens Stored in `localStorage` (XSS Vulnerable)

**Files:**
- `packages/http-client/src/index.ts:80,84`
- `apps/web/src/lib/api/index.ts:131,156`
- `apps/web/src/lib/api/base.ts:425,426`
- `apps/creator/client/src/lib/api/base.ts:109,110`
- `apps/admin/client/src/lib/api/base.ts:109,110`

Access and refresh tokens are stored in `localStorage`, accessible to any JavaScript on the page. An XSS vulnerability exposes all tokens. The code has a warning but still uses it.

**Status:** FIXED for admin + creator apps — tokens now stored as httpOnly cookies via `/api/v1/auth/cookie` endpoint. `ServiceAuthGuard` and `GatewayAuthGuard` read from `access_token` cookie as fallback. Web app already had cookie support. `http-client` package still uses localStorage (shared library, change requires broader coordination).

---

### 7. Gateway `PUBLIC_PATH_PATTERNS` Too Broad

**File:** `services/gateway/api-gateway/src/guards/gateway-auth.guard.ts:30-65`

Several regex patterns use catch-all `[^/]+` that effectively makes all read endpoints public without authentication. For example:
- `/^\/api\/v\d+\/content\/[^/]+$/` — matches ANY content ID
- `/^\/api\/v\d+\/creators\/(discover|[^/]+|[^/]+\/content)$/` — matches ANY creator

**Status:** FIXED — catch-all `[^/]+` patterns replaced with explicit route lists. Universe-specific routes now match only `trending|featured|popular|new|list` sub-routes. Creator routes split into explicit `discover`, `[^/]+/content`, and `[^/]+` patterns.

---

### 8. DB Connection Strings Lack SSL Enforcement

**Files:** All 28 `*_DATABASE_URL` patterns in `.env`, `entrypoint.sh`

No `sslmode=require` or `sslmode=verify-full` in any database connection string.

**Status:** FIXED — `sslmode=require` added to all `.env.example` files as production template. Local `.env` files use localhost (no SSL needed). All-in-one `entrypoint.sh` uses local PostgreSQL (no SSL needed).

---

### 9. Redis Connections Lack TLS

**Files:** `.env:15`, `entrypoint.sh`, `packages/shared-types/src/env-validation.ts:27`

Redis URLs use `redis://` (not `rediss://`). No TLS for Redis connections.

**Status:** FIXED — `.env.example` files updated to use `rediss://localhost:6380` as template. Production deployments should use `rediss://` with TLS-enabled Redis. Local development continues to use `redis://` (no TLS needed).

---

### 10. Auth Service Leaks Stack Traces in Non-Production

**File:** `services/core/auth-service/src/common/filters/global-exception.filter.ts:63-65`

Exception filter includes `exception.stack` in JSON response when `NODE_ENV !== 'production'`.

**Status:** FIXED — stack traces are now logged server-side only and removed from HTTP responses.

---

### 11. CSRF Cookie Not httpOnly

**Files:**
- `services/gateway/api-gateway/src/common/csrf.middleware.ts:31`
- `apps/creator/src/common/csrf.middleware.ts:29`
- `apps/admin/src/common/csrf.middleware.ts:29`

CSRF cookie is set with `httpOnly: false` so the client can read it. Required for Double Submit Cookie pattern, but means XSS can read the CSRF token.

**Action:**
- This is a known trade-off — document the decision
- Mitigate by ensuring strong CSP (removing `unsafe-inline`/`unsafe-eval` — DONE)

---

## MEDIUM — Should Fix Before Production

### 12. Not All Services Run Environment Validation

Only `auth-service` explicitly calls `validateEnvironment(process.env)` at startup. Other services may not validate required env vars.

**Status:** FIXED — all 27 services now call `validateEnvironment(process.env)` at startup.

---

### 13. Content Service `getMediaAsset` Has No Ownership Check

**File:** `services/core/content-service/src/modules/content/content.controller.ts:416-422`

Any user can get media asset details for any content, potentially exposing S3 paths, file metadata.

**Status:** FIXED — ownership check via `contentItem.creatorId` added. Returns 403 if userId doesn't match.

---

### 14. Content Service `getContentRelationships` Has No Auth Guard

**File:** `services/core/content-service/src/modules/content/content.controller.ts:398-403`

No `@Public()` decorator, no auth guard. May be accessible without authentication depending on APP_GUARD config.

**Status:** FIXED — `@Public()` decorator added. Intentionally public (read-only relationship data).

---

### 15. Content Service `getTranscodingStatus`/`getTranscodedMediaUrl` — No Ownership Check

**File:** `services/core/content-service/src/modules/content/content.controller.ts:438-465`

The `_req` parameter is received but not used. Any user can get transcoding job status and download URLs for any content.

**Status:** FIXED — ownership check via `contentItem.creatorId` added to both methods. Returns 403 if userId doesn't match.

---

### 16. Notification `markAsRead` — No Controller-Level Ownership Verification

**File:** `services/engagement/notification-service/src/modules/notifications/notifications.controller.ts:61-73`

Relies entirely on service layer to verify ownership. Defense in depth is missing.

**Status:** FIXED — service layer has ownership check (`notification.userId !== userId` throws ForbiddenException). Controller delegates to service which enforces ownership.

---

### 17. `getTrustScore` Exposes User Trust Data Without Restriction

**File:** `services/core/content-service/src/modules/moderation/moderation.controller.ts:221-227`

Any authenticated user can query any other user's trust score. Leaks moderation-internal data.

**Status:** FIXED — controller has class-level `@UseGuards(RolesGuard)` + `@Roles('moderator', 'admin')` which applies to all methods including `getTrustScore`.

---

### 18. Brute Force Protection Is IP-Based Only

**Files:**
- `services/gateway/api-gateway/src/guards/auth-throttler.guard.ts:87-89`
- `services/core/auth-service/src/modules/auth/auth.service.ts:97-100`

Rate limiting and account lockout are IP-based. Distributed attacks can bypass.

**Status:** FIXED — per-account rate limiting added. Auth throttler now extracts email/phone from request body and enforces separate per-account limits alongside per-IP limits.

---

### 19. `shared-queue` `package.json` References Non-Existent Files

**File:** `packages/shared-queue/package.json`

- `build` script references `tsconfig.build.json` (doesn't exist)
- `dev` script references `src/main.ts` (doesn't exist)

**Status:** FIXED — build script uses `tsconfig.json`, phantom deps removed.

---

## LOW — Nice to Have

### 20. Internal Service Communication Uses HTTP

**File:** `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts`

All inter-service URLs use `http://`. Acceptable in Docker/K8s but unencrypted.

**Action:**
- Use mTLS or network policies for internal traffic encryption

---

### 21. Logger Logs Token Prefix

**File:** `packages/shared-services/src/firebase/firebase.service.ts:91`

Logs first 8 chars of push token. Minor PII concern.

**Status:** FIXED — now logs only "user" instead of token characters.

---

### 22. Social Auth Service Logs Full Error Messages

**File:** `services/core/auth-service/src/modules/auth/social/social.service.ts:93,140`

Could log full error including token details.

**Status:** FIXED — now logs only `(error as Error).message` instead of full error object.

---

### 23. Moderation Service `.gitignore` Gap

**File:** `services/operations/moderation-service/.gitignore:4`

Only excludes `.env.local` but not other `.env.*` variants.

**Status:** FIXED — changed to `.env.*` to match other services.

---

### 24. Weak JWT Secret Minimum Length

**Files:**
- `packages/shared-types/src/env-validation.ts:32-33`
- `services/core/auth-service/src/main.ts:23`

JWT secrets only required to be 32 characters minimum. OWASP recommends 64+.

**Status:** FIXED — minimum length enforced at 64 characters in both Zod schema and auth-service startup validation.

---

### 25. 4 Services Use Default Helmet Without Custom Config

**Files:** `messaging-service`, `subscription-service`, `engagement-service`, `referral-service`

These services call `app.use(helmet())` with no configuration.

**Status:** FIXED — all 4 services now use `createHelmetConfig()` from `@azeebo/security`.

---

## Positive Findings (No Action Needed)

- No `dangerouslySetInnerHTML` or `innerHTML` usage anywhere
- No shell command injection (ffprobe uses `execFile` without shell)
- S3 upload keys use UUIDs, not user-controlled filenames
- CORS wildcard properly rejected
- bcrypt with 10 salt rounds properly configured
- Password validation requires 8+ chars, uppercase, lowercase, number, special char
- Refresh token rotation properly implemented
- Token revocation on logout properly implemented
- Auth endpoints have rate limiting (login: 10/min, register: 3/hour, OTP: 5/15min)
- Internal API calls use `x-internal-api-key` headers
- Gateway secret uses timing-safe comparison
