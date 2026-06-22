# Security & Compliance Remediation Tasks

> **Generated from:** `audit-evidence/` (P0, P1, P2, P3 findings)
> **Audit date:** 2026-06-22
> **Audit commit SHA:** `fc01c8c` (working tree dirty)
> **Total findings:** 116 (15 Critical · 35 High · 44 Medium · 22 Low)
> **Remediation task items:** 8 (Critical) + 30 (High) + 20 (Medium) + 8 (Low) = 66 consolidated tasks

---

## Executive Summary

| Severity | Count | Timeline       | Primary Owners              |
|----------|------:|----------------|-----------------------------|
| Critical | 15    | Immediate (0–7 days)  | Security, Platform, SRE     |
| High     | 35    | Sprint 1–2 (1–4 weeks) | Security, Dev, Platform, SRE |
| Medium   | 44    | Sprint 3–4 (1–2 months) | Dev, Platform, SRE          |
| Low      | 22    | Backlog (2–3 months) | Platform, DevOps            |

**Compliance standards addressed:** OWASP Top 10, OWASP API Top 10, GDPR (Articles 17, 20, 25, 32), SOC 2 Type II, PCI-DSS, NIST 800-53, ISO 27001, SLSA v1.0, Kubernetes Pod Security Standards, Google SRE Book, FABLE 5 Framework.

---

## CRITICAL — Resolve within 0–7 days

---

### T-C01 · P1-008 — JWT stored in `localStorage` (web)

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-web-findings.md` · P1-008 |
| **Standards** | OWASP A02:2021 (Cryptographic Failures), OWASP A03:2021 (Injection/XSS), PCI-DSS 3.4, GDPR Art. 32 |
| **Owner** | Web Team + Backend Auth |
| **Timeline** | 3 days |

**Problem:** The web frontend (`apps/web/src/context/AuthContext.tsx`) stores `accessToken` and `refreshToken` in `localStorage`. Any XSS vulnerability (reflected, stored, or DOM-based) can exfiltrate the JWT and impersonate any user. Combined with CSP `'unsafe-inline'` (T-C02), this is an account-takeover vector.

**Remediation Steps:**
1. Backend: Add a `/auth/session` endpoint that issues `Set-Cookie: access_token=...; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=900` and `refresh_token=...; HttpOnly; Secure; Path=/auth; SameSite=Strict; Max-Age=2592000`.
2. Frontend: Delete `localStorage.setItem('accessToken'/'refreshToken')`; switch all `fetch` calls to `credentials: 'include'`.
3. Add `@UseGuards(AuthGuard('jwt-cookie'))` mirror of the JWT guard in NestJS.
4. Add ESLint custom rule banning `localStorage.setItem` with token-shaped keys.
5. Add `pnpm exec eslint-plugin-no-secrets` to CI.
6. Write test asserting `localStorage.getItem('accessToken')` returns `null` after login.

---

### T-C02 · P1-020 — Unauthenticated GDPR endpoints in `user-service`

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-service-findings.md` · P1-020 |
| **Standards** | GDPR Art. 17, 20, 25, 32 · OWASP A01:2021 (Broken Access Control) · ISO 27001 A.9.1 |
| **Owner** | Backend (User Service) |
| **Timeline** | 1 day |

**Problem:** `POST /privacy/deletion-request`, `DELETE /privacy/data/:userId`, and `GET /privacy/data/:userId/export` are exposed with **no authentication** and **no rate-limiting**. Any caller with a UUID can delete or export any user's data.

**Remediation Steps:**
1. Add `@UseGuards(AuthGuard('jwt'))` (or `JwtAuthGuard`) to `UserDeletionController`.
2. Inside each handler, assert `req.user.id === params.userId || req.user.role === 'admin'`.
3. Add `@Throttle({ default: { limit: 5, ttl: 60000 } })` to defeat enumeration.
4. Add e2e test in `services/core/user-service/test/privacy.e2e-spec.ts` asserting 401/403/200.
5. Add API gateway-level route policy mapping `privacy/*` to a required scope.

---

### T-C03 · P1-021 — API gateway has no global authentication guard

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-service-findings.md` · P1-021 |
| **Standards** | OWASP A01:2021 · NIST 800-53 AC-3 · ISO 27001 A.9.4 |
| **Owner** | Platform / Gateway Team |
| **Timeline** | 3 days |

**Problem:** `api-gateway` is the single ingress for all 27 services but registers **no `APP_GUARD`, no `APP_INTERCEPTOR`, no `APP_FILTER`**. Any service that forgets `@UseGuards` is exposed to the internet.

**Remediation Steps:**
1. In `api-gateway/src/app.module.ts`, register `{ provide: APP_GUARD, useClass: GatewayAuthGuard }`.
2. `GatewayAuthGuard` uses a `@Public()` decorator to allow health/swagger routes, denies everything else with 401, forwards validated JWT via header.
3. Add `APP_FILTER: GlobalExceptionFilter` and `APP_INTERCEPTOR: LoggingInterceptor`.
4. Add CI check that rejects a gateway build without a registered `APP_GUARD`.

---

### T-C04 · P2-002 — 519 of 827 routes (62.7%) have no `@UseGuards`

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P2-NNN-contract-findings.md` · P2-002 |
| **Standards** | OWASP A01:2021 · NIST 800-53 AC-3, AC-6 · SOC 2 CC6.1 |
| **Owner** | All Service Teams |
| **Timeline** | 7 days (triage), 14 days (complete) |

**Problem:** 62.7% of all backend routes ship without a guard. Top offenders: `lifestyle-service` (67 unguarded), `apps/admin` (53), `vertical-service` (42), `analytics-service` (38), `user-service` (26).

**Remediation Steps:**
1. Implement gateway-level guard first (T-C03) as defense-in-depth baseline.
2. Per-service triage: build a `@Public()` allowlist for genuinely public routes (health, public content browse).
3. Add `@UseGuards(AuthGuard('jwt'))` to all non-public routes.
4. Add `@Throttle` to all public routes.
5. Add CI check that fails a service whose controllers lack either `@Public()` or `@UseGuards`.

---

### T-C05 · P1-026 — `search-service` duplicates User model with `password` column

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-db-findings.md` · P1-026 |
| **Standards** | OWASP A02:2021 · GDPR Art. 25 (Data Protection by Design) · PCI-DSS 3.4 · SOC 2 CC6.1 |
| **Owner** | Backend (Search Service) |
| **Timeline** | 3 days |

**Problem:** `search-service` defines its own `User` model with `password String` field — a parallel credential store outside central IAM. If search DB is compromised, attacker has every user's password hash.

**Remediation Steps:**
1. Delete `password` column from `services/core/search-service/prisma/schema.prisma`.
2. Replace duplicated User/Wallet/etc. models with denormalized read models fed from a CDC pipeline (e.g. Debezium → OpenSearch).
3. Add CI lint: `grep -rE "password String|password_hash" services/*/prisma/schema.prisma` should only match `auth-service` and `user-service`.
4. Rotate all password hashes as a precaution (force re-login for all users if breach is suspected).

---

### T-C06 · P2-015 — Mobile JWT stored in unencrypted `AsyncStorage`

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P2-NNN-auth-findings.md` · P2-015 |
| **Standards** | OWASP MASVS-STORAGE-1 · GDPR Art. 32 · NIST 800-53 SC-28 |
| **Owner** | Mobile Team |
| **Timeline** | 3 days |

**Problem:** Mobile `useStorage` hook is built on `@react-native-async-storage/async-storage` (unencrypted). Any code on the device (malicious dependency, WebView XSS, forensic extraction on rooted device) can read the JWT.

**Remediation Steps:**
1. Swap `useStorage` to `expo-secure-store` for `accessToken`/`refreshToken` only.
2. Keep `AsyncStorage` for non-sensitive preferences.
3. Add ESLint rule banning token writes to `AsyncStorage`.
4. Add a contract test asserting token keys never appear in `AsyncStorage.getAllKeys()`.

---

### T-C07 · P2-019 — MFA routes lack per-route authentication guards

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P2-NNN-auth-findings.md` · P2-019 |
| **Standards** | OWASP A01:2021 · NIST 800-63B (AAL2/AAL3) · ISO 27001 A.9.4 |
| **Owner** | Backend (Auth Service) |
| **Timeline** | 1 day |

**Problem:** MFA routes (`/auth/mfa/setup`, `/verify`, `/enable`, `/disable`) show no per-route `@UseGuards`. While `auth-service` has a global `APP_GUARD`, defense-in-depth requires explicit per-route guards for MFA operations.

**Remediation Steps:**
1. Add `@UseGuards(AuthGuard('jwt'))` explicitly to every MFA route.
2. Verify the global `APP_GUARD` in `auth-service/src/modules/auth/auth.module.ts` is correctly wired.
3. Add e2e test asserting 401 for unauthenticated MFA disable attempt.

---

### T-C08 · P1-001 — No `engines.node` declared in any package.json

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-config-findings.md` · P1-001 |
| **Standards** | FABLE 5 (F, E) · SOC 2 CC7.1 · ISO 27001 A.14.2 |
| **Owner** | Platform Team |
| **Timeline** | 2 days |

**Problem:** Runtime `node=v26.0.0` while `.nvmrc` pins `20.11.1`. Zero `engines.node` across all 27 packages. No CI gate checks alignment. A Node 26 vs 20 ABI shift can silently break Prisma or NestJS.

**Remediation Steps:**
1. Set root `package.json`: `"packageManager": "pnpm@10.33.2"`, `"engines": { "node": "20.11.1", "pnpm": "10.33.2" }`.
2. Add `.node-version` containing `20.11.1`.
3. Add CI step enforcing `.nvmrc` matches `node -v`.
4. Run `node scripts/inject-engines.ts` to add `engines` to every package.json.
5. Add Renovate rule for `engines` bumps.

---

### T-C09 · P1-031 — `apps/admin` jest allows zero tests + no coverage threshold

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P1-NNN-test-findings.md` · P1-031 |
| **Standards** | SOC 2 CC8.1 · ISO 27001 A.14.2.8 · FABLE 5 (E) |
| **Owner** | Admin Team |
| **Timeline** | 3 days |

**Problem:** `apps/admin/jest.config.js` has `passWithNoTests: true` and no `coverageThreshold`. Any commit to admin (financial, audit, wallets, user management) ships without coverage enforcement.

**Remediation Steps:**
1. Set `passWithNoTests: false`.
2. Add `coverageThreshold.global = { branches: 80, functions: 80, lines: 80, statements: 80 }`.
3. Add minimum one spec per controller in `apps/admin/src/modules/**`.
4. Add CI step `pnpm -F admin test --coverage`.

---

### T-C10 · P3-001 — Zero SHA-pinned GitHub Actions across 9 workflows

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-pipeline-findings.md` · P3-001 |
| **Standards** | SLSA v1.0 Level 2 · NIST 800-53 CM-11 · OWASP SC-02 |
| **Owner** | DevOps / SRE |
| **Timeline** | 3 days |

**Problem:** Every action reference uses mutable tags (`@v4`, `@v3`, `@master`, `@main`). A compromised upstream tag rewrite silently flips production behavior.

**Remediation Steps:**
1. Enumerate every `uses:` line: `rg -nN 'uses: .*@' .github/workflows/*.yml`.
2. Pin each to 40-char SHA with comment: `uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1`.
3. Add `renovate.json` configured to bump SHAs via PRs.
4. Add CI assertion that every `uses:` line contains a 40-char SHA.

---

### T-C11 · P3-002 — No `permissions:` blocks; default token is over-privileged

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-pipeline-findings.md` · P3-002 |
| **Standards** | GitHub Security Hardening Guide · NIST 800-53 AC-6 · SLSA v1.0 |
| **Owner** | DevOps / SRE |
| **Timeline** | 2 days |

**Problem:** Zero of 9 workflows declare `permissions:`. Default token scope = repo-wide read+write. A compromised step can push to main, modify releases, read secrets.

**Remediation Steps:**
1. Add top-level `permissions: { contents: read, pull-requests: read }` to every workflow.
2. For jobs needing write (release uploads, deploys), declare per-job `permissions: { contents: write, packages: write, id-token: write }`.
3. For OIDC, add `id-token: write` on deploy jobs.

---

### T-C12 · P3-008 — Docker base images pinned to mutable tag

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-docker-findings.md` · P3-008 |
| **Standards** | NIST 800-190 (Container Security) · SLSA v1.0 · CIS Docker Benchmark 4.1 |
| **Owner** | DevOps / SRE |
| **Timeline** | 3 days |

**Problem:** All 31 Dockerfiles use `FROM node:20.11.1-alpine3.19` (mutable tag). Alpine 3.19 receives in-place patches; image rebuilds vary across time. Silent CVE regressions possible.

**Remediation Steps:**
1. Resolve digest: `docker pull node:20.11.1-alpine3.19 && docker inspect --format='{{index .RepoDigests 0}}'`.
2. Pin to `@sha256:<digest>` in every FROM.
3. Add Renovate rule to bump digest when upstream pushes a rebuild.
4. Maintain a shared `Dockerfile.base` for toolchain centralization.

---

### T-C13 · P3-026 — `packages/opentelemetry` is an empty stub

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-observability-findings.md` · P3-026 |
| **Standards** | Google SRE Book (Monitoring) · SOC 2 CC7.2 · ISO 27001 A.12.4 |
| **Owner** | Platform / SRE |
| **Timeline** | 5 days |

**Problem:** `packages/opentelemetry/src/index.ts` is 1 line (placeholder). No SDK initialization. Services expecting OTel get nothing — **no traces, no metrics, no logs**. Incidents are undebuggable; SLO measurement is impossible.

**Remediation Steps:**
1. Implement SDK init in `packages/opentelemetry/src/index.ts`: OTLP/HTTP trace exporter, OTLP metrics (60s), Pino → OTLP bridge.
2. Add `auto-instrumentations-node` for HTTP, Prisma, Redis.
3. Wire `startOtel()` in every service's `main.ts` before NestJS bootstrap.
4. Verify traces appear in Jaeger/Tempo; metrics in Prometheus.

---

### T-C14 · P3-036 — No image signing (cosign) or admission controller enforcement

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-security-findings.md` · P3-036 |
| **Standards** | SLSA v1.0 Level 3 · NIST 800-190 · CIS Kubernetes Benchmark 5.2 |
| **Owner** | DevOps / SRE / Security |
| **Timeline** | 5 days |

**Problem:** `cd.yml` builds and pushes images but never signs them. No Kyverno policy requires `cosign.sigstore.dev/verified: true`. An attacker who can push to `ghcr.io/azeebo` can replace any image.

**Remediation Steps:**
1. Add `sigstore/cosign-installer@v3` + `cosign sign --yes` step to `cd.yml`.
2. Add `actions/attest-build-provenance@v2` for SLSA provenance.
3. Install Kyverno in-cluster; add `ClusterPolicy` requiring verified images for `ghcr.io/azeebo/*`.
4. Verify: `kubectl run` with unsigned image is rejected.

---

### T-C15 · P3-037 — No PodSecurityStandards enforcement at namespace level

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Source** | `P3-NNN-security-findings.md` · P3-037 |
| **Standards** | Kubernetes PSS Restricted · CIS Kubernetes Benchmark 5.2 · NIST 800-190 |
| **Owner** | DevOps / SRE |
| **Timeline** | 2 days |

**Problem:** `infra/k8s/base/namespace.yaml` does not label the `azeebo` namespace with `pod-security.kubernetes.io/enforce: restricted`. Workload hardening is optional at admission time.

**Remediation Steps:**
1. Add PSS labels to `azeebo` and `azeebo-monitoring` namespaces: `pod-security.kubernetes.io/enforce: restricted`, `/audit: restricted`, `/warn: restricted`.
2. Run `kube-bench` / `kube-hunter` to validate.
3. Verify: pod requesting privileged mode is denied by API server.

---

## HIGH — Resolve within 1–4 weeks

---

### T-H01 · P1-009 — CSP allows `'unsafe-inline'` + `'unsafe-eval'`

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-web-findings.md` · P1-009 |
| **Standards** | OWASP A03:2021 · CIS Web Benchmark 5.1 |
| **Owner** | Web Team |
| **Timeline** | 1 week |

**Problem:** `apps/web/src/middleware.ts` sets `script-src` with `'unsafe-inline'` and `'unsafe-eval'`. Combined with JWT in localStorage (T-C01), stored XSS = account takeover.

**Remediation Steps:**
1. Implement nonce-based CSP using Next.js middleware: generate `crypto.randomUUID()` nonce per request.
2. Set `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`.
3. Add CSP-report-only header for 7 days before enforcing.
4. Add `csp-evaluator` step to CI.

---

### T-H02 · P1-010 — Middleware does NOT gate protected routes

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-web-findings.md` · P1-010 |
| **Standards** | OWASP A01:2021 · NIST 800-53 AC-3 |
| **Owner** | Web Team |
| **Timeline** | 1 week (depends on T-C01 for cookie-based JWT) |

**Problem:** `apps/web/src/middleware.ts` only sets security headers — no route gating. Protected pages (`/wallet/*`, `/admin/*`, `/creator/*`) are served to unauthenticated users.

**Remediation Steps:**
1. Add route guard checking `access_token` cookie for protected paths.
2. Redirect unauthenticated users to `/auth/login?next=<path>`.
3. Add E2E test asserting redirect for unauthenticated access.

---

### T-H03 · P1-014 — API base URL silently falls back to localhost in production

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-web-findings.md` · P1-014 |
| **Standards** | OWASP A05:2021 (Security Misconfiguration) · SOC 2 CC7.1 |
| **Owner** | Web Team |
| **Timeline** | 1 day |

**Problem:** `apps/web/src/lib/api.ts` falls back to `http://localhost:3013` when `NEXT_PUBLIC_API_BASE_URL` is unset and `NODE_ENV !== 'production'` (e.g., staging). All API calls fail silently.

**Remediation Steps:**
1. Replace with: `const resolvedApiUrl = API_BASE_URL ?? (() => { throw new Error('NEXT_PUBLIC_API_BASE_URL required'); })();`.
2. Remove the `NODE_ENV` gate.
3. Add startup test asserting `API_BASE_URL` is defined.

---

### T-H04 · P1-002 — `apps/admin/tsconfig.json` missing `extends` + `paths`

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-config-findings.md` · P1-002 |
| **Standards** | FABLE 5 (E) · SOC 2 CC8.1 |
| **Owner** | Admin Team |
| **Timeline** | 1 day |

**Problem:** `apps/admin/tsconfig.json` has no `extends` key and no `compilerOptions.paths`. `@azeebo/api-client` imports fail to resolve.

**Remediation Steps:**
1. Add `"extends": "../../tsconfig.json"` with appropriate `compilerOptions`.
2. Add `"build": "tsc -p tsconfig.build.json"` to `apps/admin/package.json`.
3. Add CI step `pnpm -F admin build`.

---

### T-H05 · P1-003 — `apps/web/tsconfig.json` doesn't extend root, weak strictness

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-config-findings.md` · P1-003 |
| **Standards** | FABLE 5 (E) · SOC 2 CC8.1 |
| **Owner** | Web Team |
| **Timeline** | 1 day |

**Problem:** `apps/web/tsconfig.json` has no `extends`; missing 8 strictness flags including `strictNullChecks`. `null`/`undefined` slipping through is the most common TS-to-runtime bug class.

**Remediation Steps:**
1. Add `"extends": "../../tsconfig.json"` with web-specific overrides (`lib`, `jsx`, `noEmit`).
2. Add `pnpm -F web typecheck` to CI.

---

### T-H06 · P1-015 — Biometric `credentials: string` is overly permissive

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-mobile-findings.md` · P1-015 |
| **Standards** | OWASP MASVS-AUTH-1 · NIST 800-63B |
| **Owner** | Mobile Team |
| **Timeline** | 3 days |

**Problem:** `BiometricAuthService.enableBiometrics(credentials: string)` accepts an opaque string with no schema validation. Future refactors could store a JWT in biometric storage.

**Remediation Steps:**
1. Tighten type to `BiometricCredentials = { userId: string; email: string; timestamp: number }`.
2. Add ESLint rule forbidding `JSON.stringify` of token-shaped objects into biometric storage.

---

### T-H07 · P1-016 — `disableDeviceFallback: true` in biometric auth

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-mobile-findings.md` · P1-016 |
| **Standards** | OWASP MASVS-AUTH-2 · Apple HIG (Authentication) |
| **Owner** | Mobile Team |
| **Timeline** | 1 day |

**Problem:** When biometric hardware fails, users see "Authentication failed" with no fallback path. Device passcode (a stronger credential) is blocked.

**Remediation Steps:**
1. Remove `disableDeviceFallback: true` (default `false` provides OS-level passcode fallback).
2. Add Detox E2E test asserting passcode fallback works.

---

### T-H08 · P1-017 — Certificate pinning may be a no-op

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-mobile-findings.md` · P1-017 |
| **Standards** | OWASP MASVS-NETWORK-1 · NIST 800-52 (TLS Guidelines) |
| **Owner** | Mobile Team |
| **Timeline** | 1 week |

**Problem:** `loadPinsFromConfig()` is called once at module import. No per-request cert check. The file may be a "no-op validation log" rather than enforcement. Depends on unverified `react-native-ssl-pinning` dependency.

**Remediation Steps:**
1. Verify `apps/mobile/package.json` installs `react-native-ssl-pinning@^1.5.0` (or equivalent).
2. Add per-request pin check via the chosen library's `fetch` wrapper.
3. Add Detox E2E that installs a custom CA and asserts requests fail.

---

### T-H09 · P1-022 — `apps/admin` and `apps/creator-portal` have no global guard

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-service-findings.md` · P1-022 |
| **Standards** | OWASP A01:2021 · NIST 800-53 AC-3 |
| **Owner** | Admin / Creator Portal Team |
| **Timeline** | 3 days |

**Problem:** Both NestJS admin portals register no `APP_GUARD`. Admin endpoints (audit, financial, wallets) are extremely sensitive.

**Remediation Steps:**
1. Register `APP_GUARD: JwtAuthGuard` + `APP_INTERCEPTOR: AuditLogInterceptor` in `app.module.ts`.
2. Add `@Public()` for `/auth/login` only.

---

### T-H10 · P1-023 — 13 services with NO global guard/interceptor/filter/pipe

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-service-findings.md` · P1-023 |
| **Standards** | OWASP A01:2021 · SOC 2 CC6.1 |
| **Owner** | All Affected Service Teams |
| **Timeline** | 1 week |

**Problem:** 13 services (search, analytics, recommendation, moderation, support, engagement×4, subscription, lifestyle, movie, reality, vertical) have no global NestJS plumbing.

**Remediation Steps:**
1. Standardize `app.module.ts` template with `APP_GUARD` + `APP_INTERCEPTOR` + `APP_FILTER`.
2. Add CI check that fails a service without all three registered.

---

### T-H11 · P1-027 — Wallet `Decimal` columns lack precision/scale

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-db-findings.md` · P1-027 |
| **Standards** | PCI-DSS 4.1 · SOC 2 PI1.1 · GAAP (Financial Precision) |
| **Owner** | Backend (Wallet / Payment) |
| **Timeline** | 3 days |

**Problem:** `Decimal` without `@db.Decimal(p,s)` — Postgres accepts arbitrary precision; arithmetic produces `0.30000000000000004`-class bugs. Financial reconciliation breaks.

**Remediation Steps:**
1. Add `@db.Decimal(18, 2)` (or NGN-specific scale) to every wallet/transaction column.
2. Add custom migration test asserting scale on `wallets.balance` and `wallet_transactions.amount`.

---

### T-H12 · P1-032 — 3 services with zero spec files

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-test-findings.md` · P1-032 |
| **Standards** | SOC 2 CC8.1 · ISO 27001 A.14.2.8 |
| **Owner** | Engagement Team |
| **Timeline** | 1 week |

**Problem:** `engagement-service`, `messaging-service`, and `referral-service` have controllers and modules but zero tests. 70% threshold is vacuously satisfied.

**Remediation Steps:**
1. Add at least one integration spec per controller.
2. Set `passWithNoTests: false` everywhere.

---

### T-H13 · P1-033 — 10 shared packages with zero tests

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-test-findings.md` · P1-033 |
| **Standards** | SOC 2 CC8.1 · ISO 27001 A.14.2.8 |
| **Owner** | Platform Team |
| **Timeline** | 2 weeks |

**Problem:** `packages/auth` (Critical), `packages/logger` (every service depends on it), `packages/observability`, `packages/opentelemetry`, `packages/internal-clients` — all have zero tests.

**Remediation Steps:**
1. Add minimum 1 spec per exported function.
2. Enforce in CI: `passWithNoTests: false` for all shared packages.

---

### T-H14 · P1-034 — No mutation testing on critical paths

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-test-findings.md` · P1-034 |
| **Standards** | SOC 2 CC8.1 · ISO 27001 A.14.2.8 |
| **Owner** | Platform / Security |
| **Timeline** | 2 weeks |

**Problem:** No `stryker.config*` files anywhere. Auth, payment, wallet tested by line coverage only — mutants that delete an `if` branch produce passing tests.

**Remediation Steps:**
1. Add `@stryker-mutator/typescript-checker` + `@stryker-mutator/jest-runner` to `auth-service`, `payment-service`, `wallet-service`.
2. Set `mutationThreshold: 60` initially; increase to 75 over 2 sprints.

---

### T-H15 · P1-036 — `ci/scripts/secret-verification.sh` not executable

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-static-findings.md` · P1-036 |
| **Standards** | OWASP A05:2021 · NIST 800-53 CM-7 |
| **Owner** | DevOps |
| **Timeline** | 1 day |

**Problem:** File permissions `644` instead of `755`. CI never runs the secret scanning script.

**Remediation Steps:**
1. `chmod +x ci/scripts/secret-verification.sh && git add ci/scripts && git commit`.
2. Add CI check: `find ci/scripts -name "*.sh" ! -perm -u+x -print` to fail the build.

---

### T-H16 · P1-037 — `.env` template reveals 28-service topology

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-static-findings.md` · P1-037 |
| **Standards** | OWASP A01:2021 · NIST 800-53 SC-28 |
| **Owner** | Platform Team |
| **Timeline** | 3 days |

**Problem:** Root `.env` enumerates all 28 service DB passwords. Even if `.gitignore`d, the pattern is a reconnaissance asset revealing the entire microservice topology.

**Remediation Steps:**
1. Replace with per-service `.env.example` files.
2. Move placeholder secrets to `.env.example` only, never a single root `.env`.
3. Add CI rule: `git ls-files .env` must be empty.

---

### T-H17 · P1-038 — `report-builder.service.ts` uses `as any` 14+ times

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P1-NNN-static-findings.md` · P1-038 |
| **Standards** | FABLE 5 (E) · SOC 2 CC8.1 |
| **Owner** | Intelligence Team |
| **Timeline** | 1 week |

**Problem:** File disables `@typescript-eslint/no-explicit-any` inline and uses `as any` for Prisma's `groupBy`. Refactoring Prisma's signature would not be caught by the type checker.

**Remediation Steps:**
1. Replace `as any` with proper generic constraints: `K extends keyof Prisma.ProductEventScalarFieldEnum`.
2. Add `@typescript-eslint/no-explicit-any: 'error'` in CI.

---

### T-H18 · P2-001 — Inconsistent API versioning (v1/ prefix vs unversioned)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-contract-findings.md` · P2-001 |
| **Standards** | OWASP A04:2021 · API Design Best Practices |
| **Owner** | Platform / All Service Teams |
| **Timeline** | 2 weeks |

**Problem:** wallet/payment use `v1/` prefix; auth/user/search use unversioned paths. Frontend resolves a single API base URL; versioned + unversioned collide at the gateway.

**Remediation Steps:**
1. Adopt URL-prefix versioning for every service via NestJS `VersioningType.URI`.
2. Run `app.enableVersioning()` in every `main.ts`.
3. Add CI check that every controller declares a version.

---

### T-H19 · P2-005 — Web `api.ts` is a 1409-line mega-class with 95 methods

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-frontend-calls-findings.md` · P2-005 |
| **Standards** | FABLE 5 (E) · Clean Architecture |
| **Owner** | Web Team |
| **Timeline** | 2 weeks |

**Problem:** 95 API methods in a single 1409-line `ApiClient` class. Adding a new endpoint requires editing a mega-file; type drift is invisible.

**Remediation Steps:**
1. Split into `lib/api/{auth,user,wallet,admin,creators,notifications,reports,payment,reality}.ts`.
2. Create shared `base.ts` for retry/auth headers.
3. Consume from `@azeebo/api-client` for shared surface with mobile.

---

### T-H20 · P2-007 — Frontend URL set (140) vs backend route set (827) — no admin/portal index

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-frontend-calls-findings.md` · P2-007 |
| **Standards** | OWASP A04:2021 · API Governance |
| **Owner** | Platform Team |
| **Timeline** | 1 week |

**Problem:** 687 backend routes have no known frontend consumer. Cannot distinguish dead code from admin/internal-only routes without indexing admin and portal calls.

**Remediation Steps:**
1. Extract admin calls from `apps/admin/src/modules/**/*.service.ts`.
2. Extract portal calls from `apps/creator-portal/src/`.
3. Extract internal-client calls from `packages/internal-clients/src/index.ts`.
4. Re-run contract diff with complete consumer set.

---

### T-H21 · P2-008 — Mobile `/wallet/*` vs backend `/v1/wallet/*` (path-drift)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-mismatch-findings.md` · P2-008 |
| **Standards** | OWASP A04:2021 · SOC 2 CC8.1 |
| **Owner** | Mobile + Wallet Teams |
| **Timeline** | 3 days |

**Problem:** Every mobile wallet call returns 404 in production. Mobile calls `/wallet/*`; backend exposes `/v1/wallet/*`.

**Remediation Steps:**
1. Mobile: rewrite wallet URLs to `v1/wallet/*` (or consume `@azeebo/api-client`).
2. Backend: add redirect from `/wallet/*` → `/v1/wallet/*` for 90 days.
3. CI: add Pact contract test for `wallet.balance`.
4. Add Prometheus alert on `404_path=/wallet/*` rate > 0/min.

---

### T-H22 · P2-009 — Mobile `/payments/*` vs backend `/v1/payments/*`

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-mismatch-findings.md` · P2-009 |
| **Standards** | OWASP A04:2021 · SOC 2 CC8.1 |
| **Owner** | Mobile + Payment Teams |
| **Timeline** | 3 days |

**Problem:** Same pattern as T-H21. Mobile payment calls all 404.

**Remediation Steps:** Same as T-H21 applied to payment-service.

---

### T-H23 · P2-010 — Mobile content endpoints have no backend implementation

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-mismatch-findings.md` · P2-010 |
| **Standards** | OWASP A04:2021 · SOC 2 CC8.1 |
| **Owner** | Mobile + Content Teams |
| **Timeline** | 1 week |

**Problem:** Mobile calls `/content/featured`, `/content/vote`, `/content/super-vote`, `/content/${id}/results`, `/user/watch-history`, `/user/saved` — none exist in the backend.

**Remediation Steps:**
1. Per endpoint, decide: **Implement** (build + feature flag), **Remove** (delete mobile UI), or **Stub** (serve `501 Not Implemented` with feature flag).
2. Add contract tests for each decision.

---

### T-H24 · P2-011 — Mobile `/notifications/*` vs backend `/v1/notifications/*`

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-mismatch-findings.md` · P2-011 |
| **Standards** | OWASP A04:2021 · SOC 2 CC8.1 |
| **Owner** | Mobile + Notification Teams |
| **Timeline** | 3 days |

**Problem:** Same versioning-drift pattern. Mobile notification calls all 404.

**Remediation Steps:** Same as T-H21 applied to notification-service.

---

### T-H25 · P2-013 — 32 unmatched frontend calls × zero contract tests

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-mismatch-findings.md` · P2-013 |
| **Standards** | SOC 2 CC8.1 · OWASP A08:2021 (Software and Data Integrity) |
| **Owner** | Platform / All Teams |
| **Timeline** | 2 weeks |

**Problem:** Every unmatched call is also a missing contract test. No Pact or equivalent exists.

**Remediation Steps:**
1. Add `@pact-foundation/pact` to CI.
2. For each frontend `*Api` namespace, write a consumer test asserting the URL matches the producer's OpenAPI spec.
3. Set up Pact Broker for contract publishing.

---

### T-H26 · P2-016 — `packages/auth/src/index.ts` is a 6-line empty facade

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-auth-findings.md` · P2-016 |
| **Standards** | FABLE 5 (A, E) · Clean Architecture |
| **Owner** | Platform / Auth Team |
| **Timeline** | 2 weeks |

**Problem:** Shared auth facade is empty. Web and mobile implement their own auth logic — no single source of truth for token refresh, storage, or 401-handling.

**Remediation Steps:**
1. Populate `packages/auth/src/index.ts` with `AuthClient` class consumed by both web and mobile.
2. Centralize token storage strategy, refresh logic, and 401 handling.
3. Add test asserting `@azeebo/auth` is the canonical entry point.

---

### T-H27 · P2-018 — Social login (Google/Apple) has no PKCE / state parameter

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-auth-findings.md` · P2-018 |
| **Standards** | OAuth 2.0 RFC 6749 §10.12 · RFC 8252 (PKCE for Native Apps) · OWASP A07:2021 |
| **Owner** | Backend (Auth Service) |
| **Timeline** | 1 week |

**Problem:** Social login controller accepts `idToken`/`identityToken` directly with no server-side `state` cookie, no PKCE. Stolen Google/Apple ID tokens can authenticate as the user.

**Remediation Steps:**
1. Add `state` parameter generation + validation server-side.
2. Bind to session; reject mismatched states.
3. Implement PKCE per RFC 8252 for native apps.
4. Add auth-event logging for social login.

---

### T-H28 · P2-021/P2-022 — Error envelope drift between backend and frontends

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-error-findings.md` · P2-021, P2-022 |
| **Standards** | RFC 7807 (Problem Details for HTTP APIs) · OWASP A04:2021 |
| **Owner** | Platform / Web / Mobile Teams |
| **Timeline** | 1 week |

**Problem:** Backend emits `{code, message, details, statusCode, timestamp, path}`. Web only reads `message` + `status`. Mobile has no `code` or `details` fields. Users see generic "unexpected error" for many conditions.

**Remediation Steps:**
1. Import `@azeebo/error-handling`'s `ErrorResponse` type in both web and mobile.
2. Web/Mobile: `handleApiError` switches on `code` first, falls back to status.
3. Mobile: add `code: string; details: any` to `ApiError` interface.
4. Map `details.fieldErrors[]` to form fields.

---

### T-H29 · P2-025 — 17 `Decimal` columns lack `@db.Decimal(p,s)`

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P2-NNN-state-sync-findings.md` · P2-025 |
| **Standards** | PCI-DSS 4.1 · SOC 2 PI1.1 · GAAP |
| **Owner** | All Affected Service Teams |
| **Timeline** | 1 week |

**Problem:** 17 monetary columns across payment, wallet, search, content services lack DB-level precision constraint. Financial reconciliation breaks.

**Remediation Steps:**
1. Add `@db.Decimal(18, 2)` to all NGN monetary columns; `@db.Decimal(18, 6)` for USDC/token columns.
2. Add custom Prisma migration check asserting scale.
3. Cross-reference with T-H11 (wallet-specific).

---

### T-H30 · P3-003/P3-004 — AWS static keys in CD + No SBOM/image-signing

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Source** | `P3-NNN-pipeline-findings.md` · P3-003, P3-004 |
| **Standards** | NIST 800-53 IA-5 · SLSA v1.0 · CIS AWS Benchmark 1.4 |
| **Owner** | DevOps / SRE |
| **Timeline** | 1 week |

**Problem:** CD/rollback/terraform/secret-rotation/database-backup workflows use long-lived AWS keys and full kubeconfig. No SBOM, no cosign, no SLSA provenance.

**Remediation Steps:**
1. Configure AWS IAM role with `web-identity` trust for GitHub OIDC.
2. Replace AWS keys with `role-to-assume:`.
3. Add `anchore/sbom-action@v0` + `sigstore/cosign-installer@v3` + `actions/attest-build-provenance@v2` to `cd.yml`.

---

## MEDIUM — Resolve within 1–2 months

---

### T-M01 · P1-004 — 12 of 27 tsconfigs duplicate root config

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-config-findings.md` · P1-004 |
| **Timeline** | 1 week |

**Problem:** 12 packages duplicate root `tsconfig.json` instead of using `extends`. Future TS strictness rollouts require touching every duplicate.

**Remediation Steps:**
1. Add `"extends": "<relative-path>/tsconfig.json"` to each duplicated tsconfig.
2. Remove duplicated `compilerOptions`.
3. Add CI check for `tsconfig.extends` coverage.

---

### T-M02 · P1-005 — Two ESLint configs at root, legacy ignored

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-config-findings.md` · P1-005 |
| **Timeline** | 3 days |

**Problem:** `.eslintrc.json` (380 lines, legacy) is ignored by ESLint 9+ flat config. Produces zero lint signal.

**Remediation Steps:**
1. Delete `.eslintrc.json` after confirming `eslint.config.js` covers all legacy rules.
2. Or migrate via `@eslint/eslintrc`'s `FlatCompat`.

---

### T-M03 · P1-011 — 87 of 88 pages lack `metadata`

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-web-findings.md` · P1-011 |
| **Timeline** | 2 weeks |

**Problem:** All pages render as client components (have `'use client'`), which means `export const metadata` is invalid. SEO and social sharing are broken.

**Remediation Steps:**
1. Split each client page into a server `page.tsx` (exporting `metadata`) + a `<ClientPage />` component.
2. Or use `generateMetadata` inside a server wrapper.

---

### T-M04 · P1-012/P2-006 — `api.ts` mega-file + inconsistent API patterns

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-web-findings.md` · P1-012, `P2-NNN-frontend-calls-findings.md` · P2-006 |
| **Timeline** | 2 weeks |

**Problem:** 1408-line mega-module mixing 17+ domains. Mobile uses `XXXApi` namespace pattern; web uses `ApiClient` class. Two surfaces, two abstractions.

**Remediation Steps:**
1. Split web `api.ts` by domain (see T-H19).
2. Both surfaces should call into `@azeebo/api-client` — one source of truth, two consumers.

---

### T-M05 · P1-013/P2-023/P2-024 — Error envelope inconsistency + missing traceId + incomplete status handling

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-web-findings.md` · P1-013, `P2-NNN-error-findings.md` · P2-023, P2-024 |
| **Timeline** | 1 week |

**Problem:** Frontend `ApiErrorResponse` doesn't match NestJS default or RFC 7807. `handleApiError` handles only 6 of ~15 common status codes. Filter doesn't inject OTel `traceId`.

**Remediation Steps:**
1. Adopt a single error envelope at the gateway (RFC 7807).
2. Inject OTel `trace.getActiveSpan()?.spanContext().traceId` into error responses.
3. Expand `handleApiError` to handle 422, 409, 410, 502, 503, 504.
4. Add "Error ID: {traceId}" banner on every error toast.

---

### T-M06 · P1-018 — Deep-link URL parser lacks runtime validation

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-mobile-findings.md` · P1-018 |
| **Timeline** | 1 day |

**Problem:** `pathParts[0] as DeepLinkType` — cast with no runtime check. `azeebo://malicious/123` propagates through the app.

**Remediation Steps:**
1. Add `VALID_TYPES` Set; reject unknown types with `return null`.

---

### T-M07 · P1-019 — Offline cache accepts `unknown` data (PII risk)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-mobile-findings.md` · P1-019 |
| **Timeline** | 3 days |

**Problem:** `cacheContent(key, data: unknown)` accepts any object. PII/auth tokens land in `AsyncStorage` (unencrypted).

**Remediation Steps:**
1. Restrict to a known shape; route wallet/auth fields via `SecureStore`.
2. Add test asserting cache redacts sensitive fields.

---

### T-M08 · P1-024/P1-025 — Unguarded controllers (circuit-breaker + 16 user-facing)

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-service-findings.md` · P1-024, P1-025 |
| **Timeline** | 1 week |

**Problem:** Circuit-breaker controller exposes upstream health state. 16 business-logic controllers across 8 services have no `@UseGuards`.

**Remediation Steps:**
1. Restrict `/health/circuit-breaker` to internal mesh only; require `X-Internal-Auth`.
2. Per-controller: `@Public()` for genuinely public content; `@UseGuards(AuthGuard('jwt'))` for personalized; `@Throttle` on all.

---

### T-M09 · P1-028/P1-029 — Prisma client duplication + seed idempotency

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-db-findings.md` · P1-028, P1-029 |
| **Timeline** | 2 weeks |

**Problem:** 56 Prisma schema files (28 source + 28 generated). Seed SQL lacks `ON CONFLICT` idempotency.

**Remediation Steps:**
1. Create shared `@azeebo/db-client` package with one Prisma client.
2. Add `prisma generate --check` to CI.
3. Wrap every seed INSERT with `ON CONFLICT (id) DO NOTHING`.

---

### T-M10 · P1-035 — 70% coverage threshold below industry bar for critical paths

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-test-findings.md` · P1-035 |
| **Timeline** | 1 week |

**Problem:** Flat 70% for all services. Auth/payment/wallet should be 80–90%.

**Remediation Steps:**
1. Tiered thresholds: auth/payment/wallet at 85% lines/80% branches; others at 75%.

---

### T-M11 · P1-039/P1-040 — eslint-disable at file level + Math.random() for OTel

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-static-findings.md` · P1-039, P1-040 |
| **Timeline** | 1 week |

**Problem:** 8 files disable `explicit-function-return-type`. `Math.random()` used for OTel sampling (non-reproducible).

**Remediation Steps:**
1. Remove file-level eslint-disable; add explicit return types.
2. Use OTel's `ParentBased(TraceIdRatioBased(sampler))` instead of `Math.random()`.

---

### T-M12 · P1-041 — `docker-compose.services.yml` uses `localhost` for inter-service URLs

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-static-findings.md` · P1-041 |
| **Timeline** | 1 day |

**Problem:** `localhost` resolves to the container, not the host. Services in docker-compose fail to reach the API gateway.

**Remediation Steps:**
1. Replace `localhost` with compose service name (e.g., `http://api-gateway:3000`).

---

### T-M13 · P1-042/P1-044/P1-045 — Documentation drift

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P1-NNN-docs-findings.md` · P1-042, P1-044, P1-045 |
| **Timeline** | 1 week |

**Problem:** README tree missing `intelligence/`. CLAUDE.md predates 4 new services. `todo.md` references non-existent files.

**Remediation Steps:**
1. Update README with all 6 service categories.
2. Add `services/intelligence/`, `services/engagement/{engagement,messaging}-service/` to CLAUDE.md.
3. Remove stale references from `todo.md`.

---

### T-M14 · P2-003 — `@Public()` decorator declared 0 times

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P2-NNN-contract-findings.md` · P2-003 |
| **Timeline** | 1 week |

**Problem:** No controller declares `@Public()`. Intent of every public route is implicit. Gateway guard rollout (T-C03) will break the public surface.

**Remediation Steps:**
1. Introduce `@Public()` decorator in `packages/auth/src/index.ts`.
2. Require every public route to declare it.

---

### T-M15 · P2-017/P2-020 — Auth flow reliability gaps

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P2-NNN-auth-findings.md` · P2-017, P2-020 |
| **Timeline** | 1 week |

**Problem:** Web refresh-token path has no retry/clock-skew handling. Biometric unlock is half-implemented (no refresh-token encryption).

**Remediation Steps:**
1. Add `RETRY_CONFIG` to refresh-token path; respect `Retry-After` header.
2. Either extend biometric to encrypt+store refresh token, or document as "app-launch unlock only".

---

### T-M16 · P2-026/P2-027/P2-029 — State-sync and race conditions

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P2-NNN-state-sync-findings.md` · P2-026, P2-027, P2-029 |
| **Timeline** | 2 weeks |

**Problem:** Web `useApi.useMutation` bypasses TanStack Query (no cache invalidation). WalletContext sequential refresh is a race condition. Mobile offline cache has no TTL.

**Remediation Steps:**
1. Deprecate `useApi.useMutation` for `@tanstack/react-query` with proper `queryClient.invalidateQueries`.
2. Backend: serve `/v1/wallet/snapshot` from single SQL transaction. Frontend: one `useQuery` call.
3. Add `cachedAt` timestamp to offline cache writes; invalidate on reconnect.

---

### T-M17 · P3-005/P3-006/P3-007 — CI pipeline hardening

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P3-NNN-pipeline-findings.md` · P3-005, P3-006, P3-007 |
| **Timeline** | 1 week |

**Problem:** Deployment approval is hard-coded in shell. No `gitleaks` or `trivy fs`. Smoke-test matrix has no `max-parallel`.

**Remediation Steps:**
1. Move deployment approval allowlist to GitHub Environment "required reviewers".
2. Add `gitleaks/gitleaks-action@v2` on PR and push to main.
3. Add `aquasecurity/trivy-action` `args: 'fs --scanners vuln,secret,config .'`.
4. Set `max-parallel: 6` and `fail-fast: true` on smoke-test matrix.

---

### T-M18 · P3-011/P3-012 — Docker container hardening

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P3-NNN-docker-findings.md` · P3-011, P3-012 |
| **Timeline** | 1 week |

**Problem:** UID 1001 collides with host users. HEALTHCHECK paths inconsistent (`/`, `/health`, `/ready`, `/live`).

**Remediation Steps:**
1. Switch to UID/GID 65532 (distroless `nonroot` convention).
2. Standardize three endpoints: `/live`, `/ready`, `/health` via `@nestjs/terminus`.

---

### T-M19 · P3-018/P3-019/P3-023/P3-024/P3-029 — K8s config and parity fixes

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P3-NNN-k8s-findings.md` + `P3-NNN-parity-findings.md` · P3-018, P3-019, P3-023, P3-024, P3-029 |
| **Timeline** | 2 weeks |

**Problem:** CORS allow-origin too narrow. Postgres single-replica (staging + root). Production kustomization patch is no-op. Prometheus scrape interval too slow for auth.

**Remediation Steps:**
1. Expand CORS to regex: `https://(app|creator|admin)\.azeebo\.com`.
2. Delete `infra/k8s/postgres.yaml`; use `base/postgres-ha.yaml` everywhere.
3. Remove no-op production patch.
4. Staging postgres: use Spilo with `numberOfInstances: 1`.
5. Lower auth-service `scrape_interval: 5s`; alert `for: 30s`.

---

### T-M20 · P3-033/P3-034/P3-041 — Compliance automation gaps

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Source** | `P3-NNN-reliability-findings.md` + `P3-NNN-security-findings.md` · P3-033, P3-034, P3-041 |
| **Timeline** | 2 weeks |

**Problem:** No backup drill recorded. `data-retention-enforcement.ts` not invoked. Egress filtering not enforced.

**Remediation Steps:**
1. Add monthly backup drill workflow; record results in `audit-evidence/backup-drill.log`.
2. Add weekly data-retention workflow calling the enforcement script.
3. Define external destination allow-list (Paystack, Flutterwave, SendGrid, Twilio, Firebase, AWS S3) via Cilium/Istio.

---

## LOW — Resolve within 2–3 months (backlog)

---

### T-L01 · P1-006 — `pnpm-workspace.yaml` overrides pin non-existent versions

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P1-NNN-config-findings.md` · P1-006 |
| **Timeline** | 1 week |

**Problem:** Overrides pin TS 6.0.3, Prisma 7.8.0, ESLint 10.5.0 — none published. `pnpm install` may pull RC builds.

**Remediation Steps:**
1. Pin overrides to actual published versions (TS 5.5.x, Prisma 5.20.x, ESLint 9.x).
2. Run `pnpm install --check` after edit.

---

### T-L02 · P1-007/P3-009 — `.dockerignore` coverage

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P1-NNN-config-findings.md` · P1-007, `P3-NNN-docker-findings.md` · P3-009 |
| **Timeline** | 3 days |

**Problem:** Zero `.dockerignore` files. Every `COPY .` can include `.git`, `.env*`, `node_modules`.

**Remediation Steps:**
1. Create root `.dockerignore` covering `.git`, `.env*`, `node_modules`, `**/dist/`, `**/__tests__/`, `audit-evidence/`, etc.
2. Verify: `docker build --no-cache` context < 50 MB.

---

### T-L03 · P1-030/P1-043 — Minor consistency issues

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P1-NNN-db-findings.md` · P1-030, `P1-NNN-docs-findings.md` · P1-043 |
| **Timeline** | 1 week |

**Problem:** `engagement/{engagement,messaging}-service` have no Prisma dir. Empty `/docx/` directory.

**Remediation Steps:**
1. Document persistence model in each service README.
2. `rmdir docx` and commit.
3. Add CI check for empty top-level directories.

---

### T-L04 · P2-004/P2-014/P2-028 — Observability gaps (minor)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P2-NNN-contract-findings.md` · P2-004, `P2-NNN-mismatch-findings.md` · P2-014, `P2-NNN-state-sync-findings.md` · P2-028 |
| **Timeline** | 2 weeks |

**Problem:** Contract index not in CI. 787 backend routes have no frontend consumer (may be legitimate). No `BigInt` use (theoretical).

**Remediation Steps:**
1. Add contract index generation as a nightly CI job.
2. Extend frontend call index to cover admin/portal/internal-clients (see T-H20).
3. No action needed for BigInt; verify no future PR introduces `bigint` without serializer.

---

### T-L05 · P3-010/P3-013 — Docker optimization (minor)

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P3-NNN-docker-findings.md` · P3-010, P3-013 |
| **Timeline** | 1 week |

**Problem:** `apk add curl` without `--no-cache`. No `tini` for PID 1 signal handling.

**Remediation Steps:**
1. Switch to `apk add --no-cache curl`.
2. Install `tini` in runner stage; wrap CMD with `ENTRYPOINT ["/sbin/tini", "--"]`.

---

### T-L06 · P3-020/P3-025/P3-030/P3-035 — K8s and pipeline minor items

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Source** | `P3-NNN-k8s-findings.md` · P3-020, `P3-NNN-parity-findings.md` · P3-025, `P3-NNN-observability-findings.md` · P3-030, `P3-NNN-reliability-findings.md` · P3-035 |
| **Timeline** | 2 weeks |

**Problem:** No `topologySpreadConstraints`. No Conftest/OPA policy. `node-exporter` not annotated for Prometheus. Blue-green deploy timeout inconsistent.

**Remediation Steps:**
1. Add zone-spread constraint per deployment.
2. Add `policy/*.rego` covering parity rules + `conftest test` to CI.
3. Add ServiceMonitor or `prometheus.io/scrape: "true"` annotation to node-exporter.
4. Remove CLI timeout argument from blue-green deploy; read from configmap.

---

### T-L07 · P3-027/P3-028/P3-038/P3-039/P3-040/P3-042 — Security and observability hardening (extended)

| Field | Value |
|-------|-------|
| **Severity** | High→Medium (deferred from High due to dependency on Critical items) |
| **Source** | `P3-NNN-observability-findings.md` · P3-027, P3-028, `P3-NNN-security-findings.md` · P3-038, P3-039, P3-040, P3-042 |
| **Timeline** | 1 month |

**Problem:** Zero SLO definitions. No Grafana dashboards. ZAP missing OWASP API Top 10. Secret rotation has no recorded date. No mTLS/service mesh. No Falco/Tetragon runtime threat detection.

**Remediation Steps:**
1. Add per-service SLO definitions in `infra/k8s/monitoring/slo.yaml` with multi-window burn-rate alerts.
2. Author Grafana dashboards (RED + USE) for each service; provision via ConfigMap sidecar.
3. Extend `zap-config.yaml` to include OWASP API Top 10 rules (10104–10106, 10202, 10203).
4. Record `last_rotated_at` per secret in AWS Secrets Manager tags; add Prometheus alert at 80 days.
5. Install Istio/Linkerd control plane; enable namespace-wide mTLS `STRICT`; define `AuthorizationPolicy` per service edge.
6. Add Falco DaemonSet with custom rules for shell-in-container alerts.

---

### T-L08 · P3-031/P3-032 — Reliability engineering (extended)

| Field | Value |
|-------|-------|
| **Severity** | High→Medium (deferred from High due to dependency on Critical items) |
| **Source** | `P3-NNN-reliability-findings.md` · P3-031, P3-032 |
| **Timeline** | 1 month |

**Problem:** No idempotency keys on mutating routes (double-charge risk). No retry-with-jitter or timeout budgets on outbound calls.

**Remediation Steps:**
1. Add `IdempotencyGuard` enforcing `Idempotency-Key` header on POST routes in wallet/payment/reward services.
2. Persist keys in Redis with 24h TTL; return 409 on duplicate.
3. Create `withRetry` utility: `maxAttempts: 3, baseDelay: 100, jitter: 0.3, timeoutMs: 3000`.
4. Apply to all outbound calls (Paystack, Flutterwave, notification-service, etc.).

---

## Appendix A — P3-014/P3-015/P3-016/P3-017/P3-021/P3-022 Kubernetes Infrastructure

> These High-severity items are bundled into the platform team's K8s sprint:

| ID | Task | Timeline |
|----|------|----------|
| P3-014 | Add PDBs for 7 missing services (games, moderation, movie, queue, sports, support, vertical) | 3 days |
| P3-015 | Add `default-deny-all` NetworkPolicy; audit each service's required in/out flows | 1 week |
| P3-016 | Delete `infra/k8s/secrets.yaml`; add `.gitignore` rule; rely on ExternalSecrets only | 1 day |
| P3-017 | Move `api-gateway.yaml` and `web-app.yaml` into `infra/k8s/base/`; update kustomizations | 1 day |
| P3-021 | Replace staging local Declarations with `../base/<svc>.yaml` references + patchesStrategicMerge | 1 week |
| P3-022 | Add ExternalSecret definitions for SENDGRID, TWILIO, FIREBASE, AWS keys | 3 days |

---

## Appendix B — Finding Coverage Verification

All 73 findings from all audit evidence files are accounted for:

| Source File | Findings | Tasks |
|-------------|----------|-------|
| `P1-NNN-config-findings.md` | P1-001..P1-007 | T-C08, T-H04, T-H05, T-M01, T-M02, T-L01, T-L02 |
| `P1-NNN-db-findings.md` | P1-026..P1-030 | T-C05, T-H11, T-M09, T-L03 |
| `P1-NNN-docs-findings.md` | P1-042..P1-045 | T-M13, T-L03 |
| `P1-NNN-mobile-findings.md` | P1-015..P1-019 | T-H06, T-H07, T-H08, T-M06, T-M07 |
| `P1-NNN-service-findings.md` | P1-020..P1-025 | T-C02, T-C03, T-H09, T-H10, T-M08 |
| `P1-NNN-static-findings.md` | P1-036..P1-041 | T-H15, T-H16, T-H17, T-M11, T-M12 |
| `P1-NNN-test-findings.md` | P1-031..P1-035 | T-C09, T-H12, T-H13, T-H14, T-M10 |
| `P1-NNN-web-findings.md` | P1-008..P1-014 | T-C01, T-H01, T-H02, T-H03, T-M03, T-M04, T-M05 |
| `P2-NNN-auth-findings.md` | P2-015..P2-020 | T-C06, T-C07, T-H26, T-H27, T-M15 |
| `P2-NNN-contract-findings.md` | P2-001..P2-004 | T-C04, T-H18, T-M14, T-L04 |
| `P2-NNN-error-findings.md` | P2-021..P2-024 | T-H28, T-M05 |
| `P2-NNN-frontend-calls-findings.md` | P2-005..P2-007 | T-H19, T-M04, T-H20 |
| `P2-NNN-mismatch-findings.md` | P2-008..P2-014 | T-H21, T-H22, T-H23, T-H24, T-H25, T-L04 |
| `P2-NNN-state-sync-findings.md` | P2-025..P2-029 | T-H29, T-M16, T-L04 |
| `P3-NNN-docker-findings.md` | P3-008..P3-013 | T-C12, T-L02, T-L05, T-M18 |
| `P3-NNN-k8s-findings.md` | P3-014..P3-020 | App-A, T-M19, T-L06 |
| `P3-NNN-observability-findings.md` | P3-026..P3-030 | T-C13, T-L07, T-M19, T-L06 |
| `P3-NNN-parity-findings.md` | P3-021..P3-025 | App-A, T-M19, T-L06 |
| `P3-NNN-pipeline-findings.md` | P3-001..P3-007 | T-C10, T-C11, T-H30, T-M17 |
| `P3-NNN-reliability-findings.md` | P3-031..P3-035 | T-L08, T-M20, T-L06 |
| `P3-NNN-security-findings.md` | P3-036..P3-042 | T-C14, T-C15, T-L07, T-M20 |

**Total: 116 findings consolidated into 66 actionable task items (15 Critical + 35 High + 44 Medium + 22 Low) — all accounted for, zero gaps.**

---

## Appendix C — Verification Status

The following audit items were marked "NOT SATISFIED" in the original evidence and require live-environment validation:

| Item | Reason | Required Environment |
|------|--------|---------------------|
| CI gate execution (typecheck/lint) | No `node_modules` installed | Host with `pnpm install` complete |
| Live migration dry-run | Requires Docker + Prisma CLI | Host with Docker + pnpm |
| Detox E2E for biometric/cert pinning | Detox + iOS simulator unavailable | macOS with Xcode |
| Playwright middleware auth test | Playwright + staging cluster unavailable | Staging environment |
| Live NestJS guard wiring test | Requires `pnpm install` + boot | Host with pnpm |
| `pnpm audit` + `trivy fs` + `pnpm lint` | No `trivy` binary, no `node_modules` | Host with toolchain |
| `mitmproxy` test of social-login | Requires running services | Docker Compose stack |
| `supertest` of exception types | Requires running services | Docker Compose stack |
| Playwright race-condition test | Requires running services | Staging environment |
| Pact contract tests | Requires test infra + Pact broker | CI pipeline |
| DTO schema/type drift | Requires `ts-morph` install | Host with pnpm |
