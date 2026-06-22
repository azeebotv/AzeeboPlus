# Comprehensive End-to-End Project Audit & Remediation Prompt

> **Purpose:** A single, self-contained, executable prompt that drives a full-scope audit of the `azeebo+` monorepo, identifies every meaningful issue across code, frontend↔backend contracts, and deployment infrastructure, and produces a production-grade remediation report aligned to **FABLE 5** (2024) standards.
>
> **Scope boundary:** No limit. Every directory, file, dependency, configuration asset, runtime environment, and CI/CD pipeline is in scope. Surface-level fixes are explicitly forbidden — every Critical or High issue must end with a root-cause statement.
>
> **Audience:** Senior platform engineers, SREs, security leads, and tech leads consuming the output.
>
> **Execution model:** Run the prompt end-to-end in a single session (or break at phase boundaries if context budget requires). All findings, code snippets, and commands must be **verified against the current working tree** at the moment of writing — no assumptions from memory.

---

## 0. Pre-Flight — Project Context & Tooling Snapshot

Before any analysis begins, capture a **frozen snapshot** of the project under audit. Do not skip this step.

```bash
# 0.1 Working-tree state
git rev-parse HEAD
git status --porcelain
git log --oneline -n 20

# 0.2 Node / package manager
node -v
pnpm -v           # pnpm is the workspace manager (see pnpm-workspace.yaml)
cat .nvmrc

# 0.3 Language & framework versions (extract from package.json files)
find . -maxdepth 4 -name "package.json" -not -path "*/node_modules/*" \
  -exec sh -c 'echo "--- $1 ---"; node -e "const p=require(\"$1\"); console.log({name:p.name, version:p.version, engines:p.engines, deps:Object.keys(p.dependencies||{}).length, devDeps:Object.keys(p.devDependencies||{}).length})"' _ {} \;

# 0.4 Container & cluster tooling
docker --version
kubectl version --client=true --output=yaml 2>/dev/null || echo "no kubectl"
terraform -version
helm version --short 2>/dev/null || true

# 0.5 Inventory snapshot
find . -type d -name node_modules -prune -o -type f -print | wc -l   # total source files
find . -type d -name node_modules -prune -o -name "*.ts" -print | wc -l
find . -type d -name node_modules -prune -o -name "*.tsx" -print | wc -l
```

**Stack inventory discovered (treat as authoritative):**

| Layer            | Components                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend — Web   | `apps/web` — Next.js 14 (App Router), React 18, TanStack Query, Tailwind, Playwright E2E                |
| Frontend — Admin | `apps/admin` — NestJS 10, Prisma, JWT, Jest                                                             |
| Frontend — Portal| `apps/creator-portal` — NestJS 10, Prisma                                                               |
| Frontend — Mobile| `apps/mobile` — Expo (React Native), Expo Router, Detox E2E, biometric/cert-pinning utilities           |
| Backend services | `services/core/*`, `services/universes/*`, `services/engagement/*`, `services/operations/*`, `services/gateway/api-gateway` — all NestJS |
| Shared packages  | `packages/{api-client, auth, error-handling, feature-flags, internal-clients, logger, observability, opentelemetry, security, shared-services, shared-types, test-utils, ui, utils, validation, analytics-sdk, design-tokens}` |
| Data             | PostgreSQL (HA via Zalando operator), Redis, Prisma multi-schema, pgbouncer, blue/green migrations      |
| Infra            | Kubernetes manifests under `infra/k8s/`, Terraform (EKS/RDS/Redis/secrets) under `infra/terraform/`, Istio-style ingress, Prometheus + Grafana, External Secrets |
| CI/CD            | GitHub Actions under `.github/workflows/` (ci, cd, pr-checks, security-scan, terraform, rollback, secret-rotation, deployment-approval, database-backup) |
| Quality gates    | ESLint flat config, Prettier, Jest, Playwright, Detox, ZAP, secret scanning, hardcoded-value scanning   |

> **Rule:** any tool, framework, or runtime below must be referenced with its **exact pinned version** in the final report (extracted from `package.json`, `pnpm-lock.yaml`, container tags, or chart versions). No "latest", no "recent".

---

## 1. PHASE 1 — Full-Scope Codebase Audit

### 1.1 Mission

Produce an exhaustive, evidence-backed inventory of every issue in the codebase, ranked by severity and type, with root cause stated for every Critical and High finding.

### 1.2 Scope of inspection (mandatory coverage)

For each item below, **enumerate every match** with file path, line range, and a 1–2 sentence justification of why it is (or is not) an issue.

1. **Workspace configuration**
   - `pnpm-workspace.yaml`, `package.json`, `tsconfig*.json`, `eslint.config.js`, `.eslintrc.json`, `.prettierrc`, `.npmrc`, `.nvmrc`, `.pnpmrc`, `next.config.js`, `tailwind.config.js`
   - Verify single source of truth for TS, ESLint, Prettier — no shadowing across packages.

2. **Application code (per app/service/package)**
   - `apps/web/src/app/**` — Next.js App Router routes, RSC vs client boundary misuse, missing `'use client'`/`'use server'`, server-only leaks, `metadata` exports, route handlers (`route.ts`).
   - `apps/web/src/middleware.ts` — auth gating, redirect loops, header injection.
   - `apps/mobile/app/**` — Expo Router typed routes, deep links, error boundaries, offline/maintenance routes.
   - `apps/admin/src/**`, `apps/creator-portal/src/**` — NestJS modules, guards (`jwt-auth.guard.ts`), services, Prisma usage.
   - `services/**/src/**` — every NestJS service: `app.module.ts`, `main.ts`, controllers, DTOs, validators, interceptors, exception filters, guards, Prisma transactions.
   - `packages/**/src/**` — every shared library, especially `api-client`, `internal-clients`, `validation`, `error-handling`, `security`, `auth`, `logger`, `observability`, `opentelemetry`.

3. **Database**
   - Every `**/prisma/schema.prisma` — model relations, indexes, soft-delete fields, multi-schema mappings, generated client drift.
   - `prisma/seed/**` — re-entrancy, idempotency, secrets in seed data.
   - `scripts/database/**` — migration safety, transactional discipline.

4. **Tests**
   - `apps/web/e2e/**` (Playwright), `apps/mobile/e2e/**` (Detox), `apps/mobile/src/api/*.spec.ts`, `packages/api-client/src/*.spec.ts`, `packages/observability/src/*.spec.ts`, `packages/analytics-sdk/src/*.spec.ts`, `packages/error-handling/src/*.spec.ts`, every service's `*.spec.ts` and `*.e2e-spec.ts`.
   - Coverage thresholds, test isolation, flakiness indicators (timing-based assertions, missing `await`).

5. **Static analysis & secrets**
   - Run `pnpm lint`, `pnpm typecheck`, `pnpm test` at workspace root; capture failure transcripts.
   - Run `bash ci/scripts/scan-hardcoded-values.sh` and `bash ci/scripts/secret-verification.sh`; capture every finding.
   - Grep for: `process.env.*SAMPLE`, `console.log`, `debugger`, `TODO`, `FIXME`, `XXX`, `HACK`, `any\b`, `as any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `// nosec`, `password=`, `secret=`, `BEGIN PRIVATE KEY`, AWS access key patterns.

6. **Configuration & runtime**
   - `.env*`, `*.env.example`, `secrets.example.yaml`, `pgbouncer.ini`, `redis.conf`, `eas.json`, `playwright.config.*`, `detox.setup.ts`, `next.config.js`, `docker-compose*.yml`.

7. **Documentation drift**
   - Compare `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `TASKS.md`, `issues.md`, `infra/INFRA_ISSUES_AND_FIXES.md`, `EXPO_ENVIRONMENT.md`, package-level `README.md` files against current code. List every contradicted statement.

8. **Dependencies**
   - `pnpm audit --prod --json`; classify CVEs by severity.
   - Check for duplicated/locked versions of the same package across the workspace (`pnpm why <pkg>`).
   - Identify any dependency pinned to a `^` or `~` range in production paths (apps/services); flag any `latest` tag.
   - Check `engines.node` consistency between root and every package.

### 1.3 Issue classification scheme

Every issue MUST be classified on **two orthogonal axes**.

**Axis A — Severity (use the exact wording):**

| Severity | Definition                                                                                            | SLA for fix |
| -------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| Critical | Production outage imminent, data loss/corruption, hard-coded secrets, unauthenticated admin endpoints | ≤ 24 h      |
| High     | Security exposure (medium CVE, weak crypto, missing auth on internal route), correctness bug, SLO breach risk | ≤ 1 week |
| Medium   | Performance degradation under load, missing observability, brittle validation, dead code             | ≤ 1 month   |
| Low      | Style/lint violations, documentation drift, minor DX, non-blocking warnings                            | next sprint |

**Axis B — Type (multi-tag allowed):**

- `security` · `performance` · `maintainability` · `functionality` · `compliance` · `observability` · `reliability` · `cost` · `dx` · `a11y` · `i18n`

### 1.4 Root cause analysis (RCA) protocol — for every Critical / High

For each, produce **all six** items below. Do not abbreviate.

1. **Symptom** — what the user/operator observes (with reproducible steps or log excerpt).
2. **Trigger** — the specific input, configuration, race, or event that activates the bug.
3. **Proximate cause** — the file:line where the defect physically lives.
4. **Root cause** — the systemic reason the defect was introduced (missing test, missing review gate, missing design constraint, missing observability). Must answer "why was it possible to merge?".
5. **Blast radius** — which users, services, regions, or data are affected. Quantify.
6. **Detection gap** — why existing CI/CD, monitoring, or tests did not catch it.

### 1.5 Phase 1 output

Emit a **single `## Phase 1 — Codebase Audit Findings`** section containing:
- An executive summary table (`Severity × Type`).
- A numbered issue list where each item includes: ID (`P1-NNN`), title, severity, types, files (with `file://` links and line ranges), RCA (when applicable), and a one-line remediation pointer.
- A separate subsection **"False positives explicitly considered and dismissed"** for issues that a quick scan might flag but are intentional/justified (with citation).

---

## 2. PHASE 2 — Frontend ↔ Backend API Mismatch Analysis

### 2.1 Mission

Prove that every UI surface in `apps/web`, `apps/mobile`, `apps/admin`, and `apps/creator-portal` is wired to **the current** backend contract. Find mismatches in shape, type, path, auth, error semantics, and lifecycle.

### 2.2 Discovery procedure (do not skip steps)

1. **Build a canonical backend contract index.**
   - Crawl every NestJS controller in `services/**` and `apps/admin`, `apps/creator-portal` for `@Controller`, `@Get/@Post/@Put/@Patch/@Delete/@Options/@Head` decorators.
   - For each route, extract: HTTP method, path (with `:param` and wildcard), request DTO class (every `@Body`, `@Query`, `@Param`, `@Headers`, `@Ip`, `@Req`), response type or status code, auth guard(s), rate limit decorator, Swagger/OpenAPI metadata if present.
   - Cross-check with `packages/api-client/src/index.ts` and `packages/internal-clients/src/index.ts` — these are the typed facades the rest of the system trusts.

2. **Build a canonical frontend call index.**
   - For every file in `apps/web/src/**` that imports from `@azeebo/api-client` (or path-aliased equivalent), `apps/web/src/lib/api.ts`, `apps/mobile/src/api/*`, `apps/admin/src/**`, `apps/creator-portal/src/**`:
     - Extract: function name, method, URL template, request payload type, response handling, error branch.
   - For ad-hoc `fetch`/`axios`/`useApi.ts`/`useApi` calls, do the same manually.

3. **For every endpoint used by the UI, resolve to a contract row** of the form:

   ```
   ID  | Method | Path                       | Auth guard       | Req DTO            | Resp DTO           | Used by (files) | Last changed
   ```

4. **Authentication flow trace.**
   - Walk `apps/mobile/src/contexts/AuthContext.tsx`, `apps/web/src/context/AuthContext.tsx`, `packages/auth/src/index.ts`, every `jwt-auth.guard.ts`, every `@UseGuards(AuthGuard('jwt'))`, the `login`/`refresh`/`logout` paths in `services/core/auth-service`, the password/biometric/OTP routes in `apps/mobile/app/(auth)/*`.
   - Verify: token storage (Keychain/AsyncStorage vs `localStorage`), refresh-token rotation, clock skew handling, token revocation propagation, multi-device session invalidation, `httpOnly` cookie usage, CSRF strategy for cookie auth, OAuth/social providers' state/PKCE.

5. **Error-handling contract trace.**
   - Backend: `HttpExceptionFilter` in each service, default NestJS exception, RFC 7807 `ProblemDetails` usage, validation pipe error shape (`ValidationPipe({ exceptionFactory })`).
   - Frontend: `apps/web/src/lib/apiError.ts`, `apps/mobile/src/api/client.ts`, every `catch` branch.
   - Compare error envelope `{ code, message, details, traceId }` shape and field types. Flag any place where the UI assumes a field the backend never sends, or vice versa.

6. **Serialization & deserialization edge cases.**
   - BigInt / Decimal / Date ISO round-trips — verify Prisma `@db.Decimal` is JSON-safe; `BigInt` must not be serialized with default `JSON.stringify`.
   - Nullable vs optional: backend `null` vs missing property — confirm `exactOptionalPropertyTypes` posture and frontend handling.
   - Enums: verify numeric/string union parity (Prisma string enums vs TS numeric enums).
   - Arrays vs Sets, `Map` → object lossiness, `Buffer`/binary (`Uint8Array` ↔ `string`).
   - Pagination contract: cursor vs offset consistency across services.

7. **Versioning & gateway routing.**
   - `packages/shared-types/src/api-versioning.ts` and `infra/k8s/api-gateway.yaml` / `infra/k8s/ingress.yaml`. Verify header (`X-API-Version`, `Accept: application/vnd.azeebo.v2+json`) vs URL-path versioning parity, and that gateway strips/forwards correctly.

8. **State synchronization.**
   - TanStack Query keys (`apps/web/src/providers/QueryProvider.tsx`, every `useQuery`), `AuthContext`, `WalletContext`, `ContentContext`, push notification handlers in `apps/web/src/lib/pushNotifications.ts` and `apps/mobile` equivalents.
   - Find optimistic updates without rollback, missing invalidations on mutation, and races where two queries can produce inconsistent UI (e.g. wallet balance + transaction list).

### 2.3 Mismatch taxonomy

Every mismatch in Phase 2 must be tagged with one or more of:

- `path-drift` — endpoint moved/renamed/removed on backend, frontend still points to old.
- `schema-drift` — payload field added/removed/renamed/retyped.
- `type-drift` — TS type and runtime type disagree (e.g. `string` vs `number`, `Date` vs `string`).
- `auth-drift` — auth scheme/header/scope changed but UI sends old.
- `error-drift` — error envelope changed but UI parses old.
- `lifecycle-drift` — websocket/SSE/polling/push lifecycle mismatch.
- `contract-test-gap` — no Pact/contract test exists for this pair; this is the cause, not the symptom.
- `versioning-drift` — gateway/header version mismatch.

### 2.4 Required deliverables — Phase 2

- `## Phase 2 — API Contract Index` (one table per surface: web, mobile, admin, portal).
- `## Phase 2 — Mismatches` (numbered list, ID `P2-NNN`), each with: severity, type, contract row, both sides (file:line with `file://` links), reproduction, RCA, proposed fix.
- A **`## Phase 2 — Auth & Error Envelope Diff`** subsection showing backend and frontend truth side-by-side (code blocks).
- A **`## Phase 2 — State Sync Risks`** subsection enumerating every race, stale-cache, and missing-invalidation case.

---

## 3. PHASE 3 — Deployment, Infrastructure & Runtime Audit

### 3.1 Mission

Verify the system is **deployable, observable, scalable, recoverable, and parity-clean** between staging and production. No "looks fine in dev" may survive this phase.

### 3.2 Mandatory inspection surface

1. **GitHub Actions workflows** (`.github/workflows/*.yml`):
   - `ci.yml`, `cd.yml`, `pr-checks.yml`, `security-scan.yml`, `terraform.yml`, `deployment-approval.yml`, `rollback.yml`, `secret-rotation.yml`, `database-backup.yml`, plus `dependabot.yml`.
   - For each: trigger, runners, pinned action SHAs (reject `@main` / `@v1` mutable refs), secret usage, OIDC vs long-lived keys, concurrency groups, environment protections, approval gates, timeout/retention, SBOM/artifact attestation steps, matrix explosion risk, cache poisoning risk (`actions/cache` keys), and any path where a failure does not block deploy.

2. **Container images** (every `Dockerfile` under `apps/`, `services/`, `infra/`):
   - Base image pin (digest preferred over tag), multi-stage usage, non-root user, read-only root filesystem, drop capabilities, `HEALTHCHECK`, image size, layer caching, `.dockerignore` coverage, distroless vs alpine vs debian-slim trade-offs.
   - Confirm `EXPO_ENVIRONMENT.md` and `eas.json` are aligned with the build matrix.

3. **Kubernetes manifests** (`infra/k8s/**`):
   - `kustomization.yaml` overlays for `base/`, `staging/`, `production/` — diff to detect drift.
   - Per service: `Deployment`/`StatefulSet` (replicas, strategy, anti-affinity), `Service`/`Ingress` (TLS, host, class, annotations), `HPA` (min/max, target metrics), `PodDisruptionBudget`, `NetworkPolicy`, `ServiceAccount` + `RBAC`, resource `requests`/`limits`/`probes`, `priorityClassName`, `terminationGracePeriodSeconds`, `securityContext`, `seccompProfile`, `imagePullPolicy`, `PodSecurityStandards` (restricted/baseline) compliance, sidecar/init container footprint.
   - `pgbouncer.yaml`, `postgres-ha.yaml`, `redis.yaml`, `queue-service.yaml`, `external-secrets.yaml`, `blue-green-config.yaml` — same checks + leader-election, backup cadence, restore drill evidence.
   - `monitoring/prometheus*.yml`, `monitoring/grafana*.yml`, `monitoring/*-alerts.yml` — SLO definitions, burn-rate alerts, on-call routing, recording rules, retention, dashboard coverage per service.

4. **Terraform** (`infra/terraform/*.tf`):
   - `eks.tf`, `rds.tf`, `redis.tf`, `secrets.tf`, `main.tf`, `variables.tf`, `outputs.tf`.
   - State backend, locking, workspaces, sensitive variable handling, IAM least-privilege, encryption-at-rest (KMS), encryption-in-transit, logging (CloudTrail, VPC flow logs), backup retention, deletion protection, multi-AZ posture, version pinning (`required_version`, `required_providers`), `checkov`/`tfsec`/`tflint` results.

5. **Environment parity**:
   - Diff `infra/k8s/staging/**` vs `infra/k8s/production/**` and `infra/k8s/base/**`. List every intentional and unintentional diff. Reject silent drift.
   - Validate `secrets.example.yaml` reflects the **full** secret surface used by both environments.

6. **Observability stack**:
   - OTel (`packages/opentelemetry/src/index.ts`), logger (`packages/logger/src/index.ts`), correlation IDs across services, RED metrics, structured logs, trace sampling, PII redaction, log retention, dashboard coverage, alert fatigue analysis, on-call runbooks.

7. **Reliability engineering**:
   - Circuit breakers (`packages/shared-types/src/circuit-breaker.ts`), retries with jitter, bulkheads, timeouts (per dependency), idempotency keys (`packages/api-client/src/idempotency.spec.ts` references), rate limiting (`monitoring/rate-limit-alerts.yml`).
   - SLOs: latency p50/p95/p99, error rate, saturation, availability budget.
   - Disaster recovery: RTO/RPO, backup verification drills, `scripts/restore-pitr.sh`, `scripts/encrypted-db-backup.sh`, `scripts/data-retention-enforcement.ts`, `scripts/blue-green-deploy.sh` — review for safety, idempotency, blast radius.

8. **Security posture (deployment-relevant)**:
   - `infra/security/zap-config.yaml`, OWASP dependency-check, Trivy/Grype in CI, image signing (cosign), admission controllers (Kyverno/OPA), runtime threat detection.
   - Secret rotation cadence (`scripts/rotate-secrets.sh`, `scripts/secret-rotation.sh`, `secret-rotation.yml` workflow).
   - Network: zero-trust posture, mTLS service mesh, egress filtering.

### 3.3 Phase 3 deliverables

- `## Phase 3 — Pipeline Inventory` table.
- `## Phase 3 — Deployment Issues` (ID `P3-NNN`), each with severity, type, RCA, blast radius, fix.
- `## Phase 3 — Environment Parity Diff` (literal unified diff between staging/production overlays, with annotations).
- `## Phase 3 — SLO & Observability Gaps` (per service).
- `## Phase 3 — Single Points of Failure & Bottlenecks`.

---

## 4. FABLE 5 Remediation Framework

> **FABLE 5** is the evaluation yardstick. The following is the canonical interpretation used by this audit. Every remediation **MUST** be mapped to at least one of the five pillars; every finding **MUST** cite the pillars it violates.

### 4.1 The five pillars

| Pillar | Question it answers                                                                    | 2024 minimum bar                                                                                  |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **F — Foundational Security**     | Is the system safe to expose?                                                | Secrets out of source, all inputs validated at the edge, OWASP ASVS L2, SBOM produced per build, signed images, mTLS in cluster, default-deny NetworkPolicy, encrypted-at-rest and in-transit. |
| **A — Architectural Integrity**  | Is the design correct for the domain?                                        | Explicit service boundaries, typed contracts, idempotent writes, eventual-consistency documented, no shared mutable state across services, no cyclic dependencies in the package graph, observability is a first-class cross-cutting concern. |
| **B — Build & Deploy Reliability**| Can we ship safely, repeatedly, and recover quickly?                          | Reproducible builds, immutable artifacts, progressive delivery (blue/green or canary), automated rollback, drift detection between envs, no manual deploy steps, versioned infra, deploy SLA documented. |
| **L — Lifecycle & Operability**   | Will it run well in production for its whole life?                            | SLOs defined and measured, on-call runbook per service, dashboards exist and are used, capacity tested, deprecation policy, log/trace retention meets compliance, cost guardrails. |
| **E — Engineering Quality**       | Can a new engineer change it safely next week?                               | Tests at unit/integration/contract/E2E levels, lint+typecheck+secret-scan on PR, code owners enforced, ADRs for non-obvious choices, dead code deleted, dependencies current and pinned, a11y/i18n/rSEO covered for user-facing surfaces. |

### 4.2 Remediation card — required structure

For **every** issue (P1, P2, P3), produce a remediation card with **all** the following blocks. Do not omit any.

```
### [P1-007] Example title
**Severity:** Critical   **Types:** security, reliability
**FABLE 5 pillars violated:** F, B, L
**Files / locations:** [apps/web/src/middleware.ts#L1-L120](file:///Users/deprof/www/azeebo+/apps/web/src/middleware.ts), ...
**Symptom (observed):** …
**Root cause:** …
**Business impact:** …  (revenue, trust, compliance, blast radius)
**Technical impact:** …  (latency, data integrity, blast radius)
**Remediation — production-grade, version-pinned, FABLE 5 aligned:**

1. … (step, with exact tool, version, command, file path, code snippet)
2. …
3. …

**Validation plan:**
- Unit: …
- Integration: …
- Contract: …
- E2E: …
- Production telemetry: … (metric name, threshold)
- Rollback: …
**Effort:** XS/S/M/L/XL   **Risk of fix:** low/med/high   **Owner suggestion:** platform/web
**Standards referenced:** OWASP ASVS 4.0.3 §…, NIST SP 800-204D, CNCF TAG App Delivery, CIS Benchmark 1.8 §…
```

### 4.3 Non-negotiables for any fix

- **Pinned versions everywhere.** Every library, image, action, chart, provider must be quoted with an exact version + checksum/digest where the ecosystem supports it. No floating ranges in production code paths.
- **Code must compile and test in CI** before the issue is marked "Resolved". Include the exact CI command (`pnpm -w -r --filter=@azeebo/web build`, etc.).
- **No speculative refactors** — only the minimum change to close the root cause, plus the test that proves it stays closed.
- **Backward compatibility is a product decision, not an implementation default.** If a contract must change, propose versioning (header or path) and a deprecation window.

### 4.4 Per-stack defaults (when not otherwise specified)

These are the **2024** defaults the report must default to unless it justifies otherwise.

- **Node:** 20.x LTS (matches `.nvmrc` if present; otherwise recommend 20.18.0).
- **pnpm:** 9.12.x.
- **TypeScript:** 5.5.x, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **Next.js:** 14.2.x with `output: 'standalone'` for container builds; `experimental.serverActions` off unless an explicit ADR exists.
- **NestJS:** 10.4.x; `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` on every bootstrap; `helmet`, `compression`, `cookie-parser` ordered correctly; `reflect-metadata` once globally.
- **Prisma:** 5.20.x; `previewFeatures = ["fullTextSearchPostgres"]` only if used; `prisma generate` checked into CI; `engineType = "library"` for serverless surfaces.
- **Expo:** SDK 51; EAS Build profile parity between preview/production.
- **PostgreSQL:** 16.x; `pgBouncer` in transaction mode; `statement_timeout` set per role; row-level security on multi-tenant tables.
- **Redis:** 7.2.x with TLS, AOF + RDB, ACLs (no default user).
- **Kubernetes:** 1.30; `PodSecurityStandards: restricted`; `topologySpreadConstraints` for HA; `priorityClassName` for critical workloads.
- **Terraform:** 1.9.x; `required_version = "~> 1.9"`; Sentinel/Conftest policies in CI.
- **GitHub Actions:** pin every action to a 40-char SHA; least-privilege `permissions:` block; OIDC to cloud; artifact attestations enabled.
- **OpenTelemetry:** SDK 1.25.x, collector 0.108.x; OTLP/HTTP; tail-based sampling for production.

---

## 5. Prioritized Implementation Roadmap

Sequence fixes so the highest leverage lands first with the lowest risk. Use a **3-horizon** plan and a **RICE**-style score (Reach × Impact × Confidence / Effort) for cross-issue prioritization.

### 5.1 Three horizons

| Horizon   | Window    | Selection rule                                                              |
| --------- | --------- | --------------------------------------------------------------------------- |
| H1 — Stop the bleeding | 0–7 days   | All Critical + High-severity issues whose fix is XS/S effort and Risk=low.  |
| H2 — Stabilize         | 1–6 weeks  | Remaining High + Medium issues grouped by service to minimize context switching. |
| H3 — Harden & modernize| 6–12 weeks | Low + Medium issues, technical-debt clusters, deprecations, scalability work. |

### 5.2 Required roadmap content

- One **Gantt-style table** per horizon: week × team × deliverable.
- A **dependency graph** of remediations (textual is fine) — e.g. "P1-007 must precede P1-012 because it removes the auth bypass that the second fix relies on".
- A **blast-radius-vs-effort matrix** that visually groups quick wins, big rocks, time sinks, and money pits.
- A **feature-flag plan**: every change that touches a public API, schema, or shared UI must ship behind a flag (e.g. via `packages/feature-flags`) with a documented kill switch and a rollback drill.

### 5.3 Sequencing heuristics (must apply)

- Fix **auth/session** issues before **UI error-display** issues, because the second is meaningless without the first.
- Fix **schema migrations** before **code that depends on the new schema**.
- Fix **observability gaps** in the same PR as the **bug they would have caught** — otherwise the lesson is lost.
- Cluster by **service owner** to keep context switching cost bounded; one team at a time per PR chain.

---

## 6. Validation Framework

Every remediation card's "Validation plan" must be testable in ≤ 30 minutes. Each plan **MUST** include the four layers below with named tools and exact commands.

### 6.1 The four-layer validation

1. **Static** — `pnpm -w -r typecheck`, `pnpm -w -r lint`, `bash ci/scripts/scan-hardcoded-values.sh`, `bash ci/scripts/secret-verification.sh`, `trivy fs --scanners vuln,secret,config .`, `gitleaks detect --no-banner`.
2. **Unit** — `pnpm -F <package> test -- --coverage`; coverage threshold enforced in CI; mutation testing (`stryker`) for critical paths (auth, payment, wallet).
3. **Integration / contract** — Prisma migrations against a real Postgres; contract tests (Pact or in-repo fixture assertions) for every public endpoint; idempotency test for every mutating route (`packages/api-client/src/idempotency.spec.ts` style).
4. **E2E + production telemetry** — Playwright (`apps/web/e2e/*`) and Detox (`apps/mobile/e2e/*`) suites run against a staging environment that mirrors production manifests; OTel traces and Prometheus metrics must show the new error/latency/throughput signals **before** the change is closed.

### 6.2 Success metrics (must be defined per card)

For each remediation card, define **at least** one of each:

- **Functional metric:** e.g. "login flow success rate ≥ 99.5% over 24h in staging".
- **Security metric:** e.g. "0 secrets detected by `secret-verification.sh`; 0 High CVEs in `pnpm audit`".
- **Reliability metric:** e.g. "p95 latency of `POST /v2/payments/charge` < 350ms for 30 minutes at 2× peak load (`infra/load-testing/load-test.js`)".
- **Operability metric:** e.g. "dashboard panel `wallet-service-error-rate` shows < 0.5% over 7 days, alert `payment-alerts.yml` not firing".

### 6.3 Rollback discipline

Every card that touches infrastructure, a migration, a shared package, or a public API must include an explicit **rollback** line: the exact command or workflow (`gh workflow run rollback.yml -f service=<svc> -f revision=<sha>`) and the data-recovery steps if any.

### 6.4 Definition of Done (DoD) checklist

An issue is **closed** only when **all** of the following are true:

- [ ] Code merged behind a feature flag (if user-facing).
- [ ] Static, unit, integration, and E2E suites pass in CI.
- [ ] OTel trace + Prometheus metric prove the fix in a staging soak.
- [ ] Runbook updated; on-call has been notified.
- [ ] FABLE 5 pillar(s) previously violated are demonstrably satisfied.
- [ ] Rollback drill executed at least once for infra/schema changes.
- [ ] No new `TODO`/`FIXME`/lint suppression introduced.

---

## 7. Output Specification (the deliverable contract)

The final Markdown file (this audit's output) **MUST** contain, in this order:

1. **Cover & metadata** — repo SHA, run date, auditor, tool versions, scan duration, total issues by severity.
2. **Executive summary** — 1-paragraph plain-English brief for leadership + a 1-page dashboard (text-only is fine).
3. **Phase 1 — Codebase Audit Findings** (per §1.5).
4. **Phase 2 — API Contract Index & Mismatches** (per §2.4).
5. **Phase 3 — Deployment, Infrastructure & Runtime Audit** (per §3.3).
6. **Consolidated FABLE 5 remediation cards** (per §4.2) — one section per phase, but cross-referenced by issue ID.
7. **Prioritized implementation roadmap** (per §5).
8. **Validation framework summary & DoD** (per §6).
9. **Appendix A — Tools & versions used**, with exact commands and tool versions.
10. **Appendix B — Evidence index** — every file/line referenced must be linked with a `file://` URL and a line range.
11. **Appendix C — Open questions / data needed from the team** — anything the auditor could not determine from the repo alone.

### 7.1 Hard formatting rules

- Every code reference: `[label](file:///absolute/path/file.ts#L10-L20)`.
- Every code block: language-tagged (`ts`, `tsx`, `yaml`, `bash`, `json`, `hcl`, `dockerfile`, `prisma`).
- Every command: copy-paste-runnable on a clean clone after `pnpm install` (or `terraform init` / `kubectl apply` as appropriate).
- Every version: pinned, never floating.
- Every recommendation: ties back to a specific FABLE 5 pillar, an industry standard, and a measurable success metric.
- No marketing language, no hedging ("might", "could potentially"), no LLM-fluff ("it's important to note that…"). Direct, evidence-bound, actionable prose.

### 7.2 Quality gates on the output itself

Before declaring the audit complete, re-read the document and confirm:

- [ ] Every Critical and High has a root-cause block.
- [ ] Every issue has a FABLE 5 mapping.
- [ ] Every recommendation has a version pin and a code snippet or runnable command.
- [ ] Every card has a validation plan with four layers and at least one success metric.
- [ ] No section is empty; if a phase found nothing, that is itself a finding ("Phase N: 0 issues found — confidence: high/medium/low because …").
- [ ] Appendix B is complete and every link resolves.
- [ ] The roadmap respects the sequencing heuristics in §5.3.

---

## 8. Execution Discipline

- **Evidence first.** If a claim cannot be traced to a file/line/command output in this repo, do not write it.
- **Determinism.** Re-running the same prompt against the same `git rev-parse HEAD` must produce the same report modulo date stamps.
- **Bounded context.** If context budget is hit, stop at the end of the current phase, emit a checkpoint (what was done, what remains, exact resume instructions), and continue from there — never silently truncate.
- **No invented facts.** When the auditor does not know, say so in Appendix C; never fabricate a version, a CVE ID, or a tool name.
- **Tooling reality check.** Before recommending a tool, verify it exists at a stable version in 2024, is actively maintained, and is compatible with the project's pinned runtime.

---

*End of prompt. Begin execution at §0 Pre-Flight.*
