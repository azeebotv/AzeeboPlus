# Full-Stack Repository Audit Report

**Date:** October 5, 2026
**Repository Primary Stack:** TypeScript 5.8 (strict) · Node.js ≥22 · pnpm 10.33 monorepo · NestJS 11 microservices (29 services + 1 API gateway, Express 5) · Next.js 15 App Router + React 19 (web) · Vite + React 19 (admin, creator) · Expo / React Native (mobile, TV) · PostgreSQL 16 + Prisma 6.19 (33 service schemas + combined schema, database-per-service) · Redis 7 (BullMQ, throttling, caching, idempotency, event bus) · PgBouncer · Docker (35 Dockerfiles) / Kubernetes (two trees) / Terraform (S3+DynamoDB backend) · GitHub Actions (21 workflows) · Prometheus/Grafana/Loki stack · Paystack/Flutterwave payments, Twilio, SendGrid, AWS S3
**Overall System Health Rating:** Moderate — no critical exploitable auth/IDOR/SQLi paths remain, but active HIGH-severity financial-integrity, destructive-migration-recovery, and privacy-compliance defects must be cleared before unrestricted production exposure

> This report supersedes the 2026-10-02 audit found at this path. All P0 items from that report were re-verified against the current working tree: knowledge-service now registers `ServiceAuthGuard` as `APP_GUARD` (`services/core/knowledge-service/src/app.module.ts:25-26`), `docker-compose.prod.yml` publishes only gateway/web/admin/creator ports, dependency override floors were raised, and secret-bearing files are no longer tracked (only `.env.example` files are in git). New findings below were derived from a fresh full-tree audit.

---

## 1. Executive Summary

Architecturally, Azeebo+ is a mature, heavily instrumented enterprise monorepo: 29 NestJS microservices behind a single gateway with deny-by-default GET caching, strip-and-reinject identity headers, timing-safe gateway secrets, and fail-closed Redis throttling; 5 client apps sharing React Query v5 and one of the strictest TypeScript/ESLint baselines this auditor has seen (~300K lines of TS, only 19 `: any`, zero-warning lint ratchet at 56 workspaces); 70% coverage floors enforced in 28/29 services; a shadow-DB migration drift gate; and a CI estate with gitleaks, Trivy, CodeQL, supply-chain provenance attestation, and an `audit-gate` blocking on high/critical vulnerabilities. The prior audit's P0 remediations are genuinely landed and verifiable in code.

The highest-risk findings now concentrate in three places. **First, money-path integrity:** wallet withdraw and transfer synthesize idempotency keys server-side from `Date.now()`, so a client retry after timeout produces a fresh key and a duplicate debit — a double-spend window on the platform's core financial primitive (`services/core/wallet-service/src/modules/wallet/wallet.service.ts:566,670`), compounded by a fully-built `IdempotencyGuard` that is wired nowhere and an `Idempotency-Key` header the gateway strips from its own allowlist. **Second, destructive self-healing in deploy/entrypoint.sh:** the P3018 recovery path can run `DROP SCHEMA public CASCADE` in a production-classified all-in-one deploy, and the P3005 path marks every migration `--applied` without executing its SQL, while the stuck-migration pre-pass queries a misspelled `_prisma_migrations` table (missing underscore) so it silently never works. **Third, privacy/compliance:** analytics `POST /events` ingests client-supplied payloads (including web-vitals metadata passed through verbatim) with no authentication and no server-side consent enforcement against a 3-year PII store, DSAR erasure leaves `phone`, `payment_methods`, messages, and S3 objects behind, and the retention enforcement script is dry-run-by-default, scheduled only via a macOS LaunchAgent, and hardcodes dev DB credentials.

The strongest patterns worth preserving: the gateway trust boundary (client `x-user-*` stripped before routing, re-injected only from a verified JWT, downstream services failing closed on missing/timing-safe-verified `x-gateway-secret`); raw-body HMAC + replay-window + idempotency webhook security; `SELECT … FOR UPDATE` pessimistic locking in every wallet mutation inside interactive transactions; parameterized-only raw SQL (including `Prisma.join` batching); per-workspace lint-warning ratchets that can only move down; and a Lighthouse CI budget that fails the build on performance regressions. With the P0/P1 remediations below, this platform is on a credible path to Production Ready.

---

## 2. Findings Matrix

**Severity key:** Critical = data loss / financial loss / compliance breach; High = exploitable or systemic defect; Medium = contained risk or degraded guarantees; Low / Info = hygiene.

| ID | Category | Severity | File / Location | Issue Description | Recommended Fix |
|:---|:---|:---|:---|:---|:---|
| AUD-01 | Privacy & Compliance | Critical | `services/intelligence/analytics-service/src/modules/analytics/analytics.controller.ts:45,62-74` | `POST /events` and `ingestWebVital` are unauthenticated with no server-side consent check; `ingestWebVital` accepts the entire client body as event metadata. Telemetry (incl. potentially special-category search terms) is persisted to a 3-year store regardless of the consent banner, with no consent ledger to prove lawful basis (GDPR Art.6/7, NDPA). | Require consent version/category fields in the ingest DTO, persist a server-side consent ledger per user/device, reject events without a matching granted record, and whitelist web-vitals fields. |
| AUD-02 | Database & Persistence | Critical | `deploy/entrypoint.sh:349,357-359` | P3018 recovery runs `DROP SCHEMA public CASCADE` whenever `NODE_ENV=production AND ALL_IN_ONE=true` (the guard exempts exactly this combination), destroying all data in a production-classified container. | Never drop when `NODE_ENV=production` regardless of `ALL_IN_ONE`; require an explicit operator-supplied override variable for baseline resets. |
| AUD-03 | Backend / Database | Critical | `services/core/wallet-service/src/modules/wallet/wallet.service.ts:566,670` (+ `dto/withdraw-transfer.dto.ts`) | Withdraw/transfer synthesize `idempotencyKey` as `…-${Date.now()}` server-side; the DTOs have no key field. A retried request generates a new key, bypassing the `@unique` on `WalletTransaction.idempotencyKey` → duplicate withdrawal/transfer (double spend). | Add required client-supplied `idempotencyKey` to both DTOs (as `charge-wallet.dto.ts:30-32` already does) and dedupe on it. |
| AUD-04 | Database & Persistence | High | `deploy/entrypoint.sh:304-312` | On P3005 (non-empty untracked DB) the entrypoint marks **every** migration `--applied` without executing its SQL → the ledger claims applied while the deployed DB is missing its schema. | Use `prisma migrate baseline` or hard-fail and require a human-run baseline. |
| AUD-05 | Database & Persistence | High | `deploy/entrypoint.sh:284-286,338-339` | Stuck-migration pre-pass queries `FROM prisma_migrations`, but the real table is `_prisma_migrations`; the psql error is swallowed (`2>/dev/null`) so P3009 auto-resolve never runs. | Add the leading underscore and stop discarding the error output. |
| AUD-06 | Backend & API | High | `services/gateway/api-gateway/src/common/circuit-breaker-proxy.service.ts:257-258,296-304` | Retry path is dead: the thrown `Error(\`HTTP ${status}\`)` carries no `status` property, so `shouldRetryStatus(undefined)` is always false — `DEFAULT_RETRY_CONFIG.retries=3` never executes and the gateway performs zero retries on transient upstream 5xx/429. | Attach `status` to a typed error class; restrict retries to idempotent methods. |
| AUD-07 | Backend & API | High | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:3816-3838` vs `89-179` | The per-route `endpoints` method/path tables are decorative — nothing reads them (`findRoute` matches only the service prefix), so every upstream controller method/path is gateway-reachable, including future additions. | Enforce the tables in `proxyRequest` (deny-by-default on method+sub-path) or delete them to remove false assurance. |
| AUD-08 | Backend & API | High | `services/gateway/api-gateway/src/main.ts` (absent); `src/guards/auth-throttler.guard.ts:158-161` | `trust proxy` is never set; behind an LB/ingress `request.ip` is the proxy IP → all users share one auth bucket (10/60s), enabling mass lockout and breaking per-IP throttling. | `app.set('trust proxy', <hop count>)` or derive IP from a validated `X-Forwarded-For`. |
| AUD-09 | DevOps & Infrastructure | High | `docker-compose.prod.yml:1064-1160` | The four `ports:` mappings (gateway 3013, web 4000, admin 4016, creator 4014) omit an interface → Docker binds `0.0.0.0`; admin/creator panels are directly internet-reachable, bypassing nginx TLS and edge controls. | Bind `127.0.0.1:PORT:PORT` (or terminate TLS at nginx only) and keep internal services `expose:`-only. |
| AUD-10 | DevOps & Infrastructure | High | `Dockerfile.all-in-one:587-593` + `deploy/supervisord.conf:8,29-56` | All-in-one image never switches to the created `nodejs` user and supervisord runs every program (incl. redis, pgbouncer, nginx) as `user=root`. | Drop privileges per program (gosu/su-exec), run the entrypoint as non-root where feasible, and remove internal ports from `EXPOSE`. |
| AUD-11 | DevOps & Infrastructure | High | `docker/prometheus/prometheus.yml` (no `alerting:` block) | 13 alert rules in `docker/prometheus/alerts.yml` (ServiceDown, PaymentFailureRate, …) are evaluated but never delivered — Prometheus is not wired to the Alertmanager it ships with (`docker/docker-compose.monitoring.yml:60-62`). | Add `alerting.alertmanagers` static targets to prometheus.yml. |
| AUD-12 | DevOps & Infrastructure | High | `docker/prometheus/prometheus.yml:22-57` | Scrape targets use stale ports vs compose: content `:3002` (actual 3004), wallet `:3004` (actual 3002), media `:3005` (actual 3019), search `:3006` (actual 3005), knowledge `:3007` (actual 3020), messaging `:3010` (actual 3024) — several services cross-scraped or dead. | Generate targets from compose labels or correct the static list; add a CI check that scrapes return 200. |
| AUD-13 | Privacy & Compliance | High | `services/core/user-service/src/modules/user/data-deletion.service.ts:44-51` | DSAR erasure only anonymizes email/displayName/avatar. `phone` survives verbatim (unique, joinable identifier), `payment_methods` rows are never purged, messages only soft-deleted, per-universe DBs untouched, and no S3 object deletion exists for user media. | Null/hash phone, fan out a `user.erasure.requested` event to all service DBs, batch-delete S3 objects by user prefix, emit a signed completion record. |
| AUD-14 | Privacy & Compliance | High | `scripts/data-retention-enforcement.ts:48,54-56,102,135,159-189` | Retention job is dry-run by default (`APPLY` flag), soft-deletes messages only, covers just analytics+messaging DBs, is scheduled via a **macOS LaunchAgent** (never runs in docker/k8s prod), and hardcodes dev DB credentials as fallbacks. | Move to a prod cron/BullMQ recurring job, expand DB coverage, replace message soft-delete with content nulling, delete credential fallbacks. |
| AUD-15 | Privacy & Compliance | High | `services/core/auth-service/src/modules/auth/otp/otp.service.ts:77`; `services/operations/queue-service/src/processors/email.processor.ts:73`; `apps/admin/src/modules/system-settings/system-settings.controller.ts:429` | Full E.164 phone numbers and emails are logged plaintext; `LogRedactionService` (`packages/security/src/log-redaction/log-redaction.service.ts:71`) knows how to mask these but has **zero consumers** — redaction is dead capability. | Bind LogRedactionService into `packages/logger`'s interceptor/logger service; log keyed hash/last-4 only; add an ESLint rule blocking template literals containing `email|phone`. |
| AUD-16 | Frontend / SEO | High | `apps/web/src/app/layout.tsx:30` | `export const dynamic = 'force-dynamic'` cascades to all ~220 routes — zero SSG/ISR site-wide, killing cacheability, TTFB, and crawl efficiency. | Inject CSP nonces via edge middleware and re-enable static/ISR rendering for content routes; opt into dynamic per-segment. |
| AUD-17 | SEO | High | `apps/web/src/app/movies/[id]/page.tsx:1`, `apps/web/src/app/lifestyle/events/[id]/page.tsx:1` | Only 1 of ~220 routes exports `generateMetadata` (`watch/[id]/page.tsx`); other detail pages are `'use client'` and ship default site title/description — dynamic content pages are invisible to SERPs. | Convert detail routes to server components with `generateMetadata`; push client interactivity into leaf components. |
| AUD-18 | Frontend | High | `apps/admin/client/src/App.tsx`, `apps/creator/client/src/App.tsx:1-18` | Zero route-level code splitting in either Vite app (54 static admin imports); recharts imported top-level in `apps/creator/client/src/routes/analytics.tsx:12`, `subscribers.tsx:11` → one giant initial chunk. No `manualChunks` in either `vite.config.ts`. | `React.lazy` per route + Suspense; manualChunks for react-vendor/charts/ui. |
| AUD-19 | Privacy & Compliance | High | `packages/analytics-sdk/src/index.ts:312-320` vs `apps/web/src/lib/analytics.ts:42` | `setUser()` emits `user_identified` (userId, plan, platform) classified as `ConsentCategory.ESSENTIAL`, bypassing the banner gate → identity events are collected for opted-out visitors. | Reclassify identity events as ANALYTICS/PERSONALIZATION and re-check consent inside `track()` for those categories. |
| AUD-20 | Backend & API | Medium | `services/gateway/api-gateway/src/app.module.ts:150-153` + `proxy.controller.ts:3497` | `AuthThrottlerGuard` registered both as `APP_GUARD` and via `@UseGuards` on ProxyController → runs twice per request, halving the effective 10/60s auth limit and double-consuming the default bucket. | Remove the controller-level `@UseGuards`. |
| AUD-21 | Backend & API | Medium | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:4145-4160`; `packages/http-client/src/index.ts:229-231` | Gateway `ALLOWED_HEADERS` omits `idempotency-key` while the browser client auto-sends it and CORS advertises it — header-driven idempotency is broken end-to-end. | Add `idempotency-key` to the gateway allowlist. |
| AUD-22 | Backend & API | Medium | `packages/security/src/guards/idempotency.guard.ts` | A complete Redis-NX 24h idempotency guard exists but is imported by zero services — dead defensive layer. | Wire onto wallet fund/withdraw/transfer + payment mutations, or delete. |
| AUD-23 | Backend & API | Medium | `services/gateway/api-gateway/src/guards/auth-throttler.guard.ts:50-55` | Strict auth-throttle regex covers login/signup/otp/forgot/reset only; `/auth/magic-link/*`, `/auth/mfa/verify-login`, `/auth/device/link*` fall to the generic 1000/60s bucket. | Extend patterns to OTP/magic-link/MFA/device-link. |
| AUD-24 | Backend & API | Medium | `services/gateway/api-gateway/src/app.module.ts:53-66` | `CacheModule` and `ThrottlerModule` have no Redis store → with >1 gateway replica the 5-min proxy cache and non-auth rate limits diverge per instance; in-memory cache silently caps at 100 entries. | Use Redis-backed storage for both. |
| AUD-25 | Backend & API | Medium | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:3668 vs 3792` | `@Get(':service/*path')` is registered before `@Get('routes')`; Express 5 wildcard matches zero segments, so the AdminGuard-protected route-inspection endpoint is shadowed by the catch-all. | Move `getRoutes` above the catch-alls. |
| AUD-26 | Backend & API | Medium | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:4228-4233` | Status allowlist rewrites any upstream status not in the fixed list (206, 3xx, 410, 413, 451…) to **200 OK**. | Forward the real status; map only known exceptions. |
| AUD-27 | Backend & API | Medium | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts:1745,1803` | Two identical `path: '/creators'` route entries; the second (onboarding/tips/payouts endpoints) is dead — table drift. | Merge endpoint lists. |
| AUD-28 | Backend & API | Medium | `proxy.controller.ts:1093-1095,1671-1672` | `/admin` → `localhost:4016`, `/creator` → `localhost:4014` fallbacks with no `ADMIN_SERVICE_URL`/`CREATOR_APP_URL` in compose → 502 in the compose topology (valid only in all-in-one). | Per-deployment env defaults with real DNS names; fail registration when env missing. |
| AUD-29 | Backend & API | Medium | `services/core/user-service/src/modules/users/users.controller.ts:211,372`; `.../admin/admin.controller.ts:198`; `services/engagement/notification-service/.../admin.controller.ts:95`; `services/intelligence/analytics-service/.../analytics.controller.ts:67`; `services/core/content-service/.../content.controller.ts:1023` | DTO-less `@Body()` endpoints (plain objects/`Record<string,unknown>`) — ValidationPipe whitelist/forbidNonWhitelisted is inert, arbitrary keys flow into services/Prisma. | Define real DTO classes for each. |
| AUD-30 | Backend & API | Medium | `services/core/knowledge-service/src/main.ts` | Only service (1 of 29) without `useGlobalFilters(new GlobalExceptionFilter())` → default Nest error shape, no internal-URL sanitization. | Register the shared filter. |
| AUD-31 | Backend & API | Medium | `packages/queue-policy/src/index.ts:39-49`; `services/operations/queue-service/src/app.module.ts:21-49` | BullMQ queues set attempts/removeOnComplete but no `lockDuration`/job `timeout`/`stalledInterval` — long payment jobs exceeding the 30s default lock are stalled and re-run (interacts with AUD-03). | Raise lockDuration or extendLock on payment/notification processors; enforce idempotency there. |
| AUD-32 | Database & Persistence | Medium | `services/core/wallet-service/prisma/schema.prisma:92` | `WalletLedger.idempotencyKey String?` has no `@unique` despite the model comment declaring reconciliation-grade append-only semantics. | Add a partial unique index (`WHERE NOT NULL`). |
| AUD-33 | Database & Persistence | Medium | `services/core/wallet-service/src/modules/wallet/wallet.service.ts:676-691` | Transfer locks sender-then-recipient wallet in fixed order → concurrent A→B / B→A deadlocks; no retry wrapper. | Lock in deterministic (sorted userId) order or use `pg_advisory_xact_lock`. |
| AUD-34 | Database & Persistence | Medium | `scripts/lib/prisma-migrations-core.mjs:23`; `packages/event-bus`, `packages/security`, `packages/shared-services` prisma schemas | Package-owned schemas (outbox, audit_logs, dual-control) have no migrations folders; their tables are created inside *other* services' migrations — drift the gate cannot see. | Give each package schema an owning service's migrations or remove package schemas. |
| AUD-35 | Database & Persistence | Medium | `services/core/search-service/prisma/migrations-legacy/20260810000001_pg_trgm_fuzzy_search/` (also content-service, vertical-service) | `pg_trgm` extension + GIN trigram indexes exist only in `migrations-legacy/`, never in active migrations; the repair service refuses to create extensions → fresh deploys have permanently degraded fuzzy search. | Re-land the extension and indexes as active migrations. |
| AUD-36 | Database & Persistence | Medium | `services/core/payment-service/src/modules/payment/payment-reconciliation.service.ts:112-124` | `paymentIntent.findMany` for a full day with no `take`/cursor — unbounded memory growth as volume grows. | Cursor-paginate in batches. |
| AUD-37 | Database & Persistence | Low | All 33 schemas; e.g. `services/core/wallet-service/prisma/schema.prisma:7-9` | Datasources lack `directUrl`; runtime URLs point at PgBouncer (6432), so any `prisma migrate` run from a service env breaks on the pooler (currently avoided only by hand-built URLs in entrypoint.sh:300). | Add `directUrl = env("DIRECT_DATABASE_URL")` to every datasource. |
| AUD-38 | Database & Persistence | Low | `services/universes/sports-service/src/modules/sports/sports.service.ts:494-536`; `services/engagement/engagement-service/.../engagement.service.ts:152-161` | N+1 fan-out: per-roster wallet credits via sequential axios calls; per-row user-profile enrichment in leaderboards. | Chunked concurrency or batch endpoints. |
| AUD-39 | Database & Persistence | Low | `services/universes/reality-service/src/modules/reality/vote-fraud-detection.service.ts:119-124`; `reality/prisma/schema.prisma:117-119` | `$queryRawUnsafe` (safe today, footgun API); hot vote predicate `(showId, contestantId, createdAt)` served only by three single-column indexes. | Use `$queryRaw` tagged template; add composite `@@index`. |
| AUD-40 | Code Quality | Medium | `tsconfig.json` (root exclude list); no workspace sets `exactOptionalPropertyTypes` | Root typecheck excludes `apps/mobile/src`, `apps/admin/client/src`, `apps/creator/client/src` — the 2,107-line `ops.tsx` and 1,884-line `subscriptions.tsx` are outside typecheck; 33 tsconfigs re-declare partial strict flag subsets instead of inheriting. | Single `strict` inheritance everywhere; bring admin/creator clients into a typecheck project. |
| AUD-41 | Code Quality | Medium | `services/core/knowledge-service/jest.config.js`; all 27 `packages/*/jest.config.js` | knowledge-service is the only service without `coverageThreshold` (28/29 enforce 70/70/70/70); zero packages enforce any floor (incl. security/auth/validation). | Add the 70% floor to knowledge-service and thresholds to security-critical packages. |
| AUD-42 | Code Quality | Medium | `services/core/content-service/src/common/guards/roles.guard.ts`; `services/core/auth-service/src/common/guards/roles.guard.ts`; `services/operations/support-service/src/common/guards/auth.guard.ts:11` | Local `RolesGuard` duplicates (shared package exports no RolesGuard) and a bespoke JWT AuthGuard hand-rolling Bearer parsing in 7 files — bypasses the hardened shared guard stack. | Publish canonical RolesGuard in `@azeebo/security`; migrate support-service to shared guards. |
| AUD-43 | Code Quality / Structure | Medium | `proxy.controller.ts` (4,270 lines); `apps/admin/src/modules/ops/ops.service.ts` (3,141); `apps/creator/src/creator/creator.service.ts` (2,360); `creators.service.ts` (2,201); `wallet.service.ts` (2,037); 19 files >1,200 lines total | God-file hotspots; the 4,270-line gateway controller holds a ~3,400-line hand-maintained route table whose lack of enforcement (AUD-07) and duplication (AUD-27) are direct consequences. | Externalize route table to config/codegen; split controller; add max-lines lint budget for new files. |
| AUD-44 | Security & AppSec | Medium | `apps/creator/client/src/components/BoardQrModal.tsx:79-83` | `document.write()` interpolates unescaped `challengeTitle` into the popup HTML → XSS via `</title><img onerror=…>` in a same-origin popup. | Build DOM via `createElement`/`textContent` or escape entities. |
| AUD-45 | Privacy & Compliance | Medium | `apps/web/src/lib/consent.ts:34,48`; `packages/analytics-sdk/src/index.ts:66` | Consent lives only in localStorage under two different keys (app + SDK) — invisible to SSR/edge, invisible to other subdomains, and revocation cannot purge already-collected data. | First-party `__Host-` cookie as single source; server-side gating; purge on revocation. |
| AUD-46 | Privacy & Compliance | Medium | `apps/web/src/lib/analytics.ts:137,153,157,249-284`; `analytics-service/.../analytics.module.ts:12` | Client payloads carry raw free-text search `query` (potential GDPR Art.9 special-category data) and payment attributes (amount, transactionId); the existing `PIIMinimizationService` is never registered in the analytics module. | Register and invoke the minimizer on ingest; hash/length-cap query; drop transactionId from client telemetry. |
| AUD-47 | Privacy & Compliance | Medium | `apps/creator/client/src/context/AuthContext.tsx:76`; `apps/web/src/context/AuthContext.tsx:146,317` | Access/refresh tokens stored in localStorage even though a hardened httpOnly-cookie path exists (`auth-cookie.controller.ts:9-13`) — dual storage makes the XSS-exfiltratable channel authoritative. | Delete localStorage branches; rely on the cookie exchange; shorten refresh maxAge. |
| AUD-48 | Privacy & Compliance | Medium | `packages/security/prisma/schema.prisma:16-34` (27-28 `ipAddress`, `userAgent`) | Append-only hash-chained audit log retains IP+UA indefinitely and is exempt from erasure, while the user-service copy is deleted — two audit tables under two rules makes right-to-erasure provably incomplete. | Document a legal-basis carve-out and implement pseudonymizing compaction that preserves chain integrity. |
| AUD-49 | DevOps & Infrastructure | Medium | `k8s/base/secrets.yaml:10-30` | Committed Opaque Secret with base64 `change-me…` values for JWT_SECRET, Paystack/Flutterwave keys, SMTP/S3 creds, included by `k8s/kustomization.yaml`. | Remove from repo; use SealedSecrets/ExternalSecrets. |
| AUD-50 | DevOps & Infrastructure | Medium | `k8s/` vs `infra/k8s/` | Two divergent Kubernetes trees: `k8s/` manifests have zero `securityContext` (and its generator emits none) while `infra/k8s/base` is hardened; neither tree is referenced by any workflow → manual, drift-prone deploys. | Consolidate on `infra/k8s`, wire into CD, delete or archive `k8s/`. |
| AUD-51 | DevOps & Infrastructure | Medium | `terraform/modules/iam/main.tf:240` | GitHub OIDC trust allows `"repo:vmnl/azeebo+:*"` — any branch/ref can assume the AWS role, not just protected environments. | Restrict sub condition to `ref:refs/heads/main` / `environment:production`. |
| AUD-52 | DevOps & Infrastructure | Medium | `.github/workflows/*` (~120 `uses:` entries) | Most actions float on tags (`actions/checkout@v4` ×59, `pnpm/action-setup@v4` ×37, `docker/build-push-action@v6`) while security-critical ones are SHA-pinned — inconsistent supply-chain posture; no `dependency-review-action`. | Repo-wide SHA pinning + Dependabot actions updates. |
| AUD-53 | DevOps & Infrastructure | Medium | `.github/workflows/cd.yml:2-4,318` | Production deploy gates only on `health-check-staging`; approval enforcement relies entirely on repo-level environment config that is invisible in code. | Add an explicit approval job/`needs` chain visible in the workflow. |
| AUD-54 | DevOps & Infrastructure | Medium | `.github/workflows/database-backup.yml:4`; `scripts/verify-backup-restore.sh` | Daily pg backups are scheduled but restore is never tested — the verify script exists and is referenced by nothing. | Weekly scheduled restore-drill job invoking the script into `azeebo_restore_test`. |
| AUD-55 | DevOps & Infrastructure | Medium | `docker/docker-compose.monitoring.yml:29-30,8-9,26-27,46-47`; `docker-compose.dev.yml:23-24,37-38` | Grafana ships hardcoded `GF_SECURITY_ADMIN_PASSWORD=azeebo-grafana`; Prometheus/Grafana/Loki and dev Postgres/Redis bind `0.0.0.0` unauthenticated. | Secret-manage the password; bind to 127.0.0.1 or internal networks. |
| AUD-56 | DevOps & Infrastructure | Medium | `deploy/nginx.conf:57-77,151-157` | `listen 80` actively proxies `/api/` and apps over cleartext (no HTTPS redirect); weak cipher string (`HIGH:!aNULL:!MD5`); zero `limit_req`/`limit_conn` zones. | 80→443 redirect (except ACME), explicit server_name, modern ciphers, limit zones on auth/webhook paths. |
| AUD-57 | Security & AppSec | Low | `packages/security/src/guards/service-auth.guard.ts:113,142` | Direct-Bearer/cookie `jwtService.verify()` does not pin `algorithms` (gateway and auth-service both pin HS256) — alg-confusion risk if asymmetric keys are ever configured. | Pass `{ algorithms: ['HS256'] }`. |
| AUD-58 | Security & AppSec | Low | `services/gateway/api-gateway/src/guards/gateway-auth.guard.ts:122` | `/docs` internal-key check uses `!==` (non-constant-time) unlike every other secret comparison in the repo. | Use `timingSafeEqual`. |
| AUD-59 | Security & AppSec | Low | `apps/web/src/components/seo/JsonLd.tsx:28,62,110,134` | `dangerouslySetInnerHTML` with unescaped `JSON.stringify` → `</script>` breakout if fed creator-authored titles; currently latent (component unreferenced from pages). | Escape `<`/`&`/line separators before injection. |
| AUD-60 | Security & AppSec | Low | `packages/security/src/cors.config.ts:11,33-42` | `allowMissingOrigin` defaults true alongside `credentials:true`; browser risk mitigated by SameSite cookies, but server-to-server requests get full CORS treatment. | Default `allowMissingOrigin:false` on cookie-authenticated services. |
| AUD-61 | Frontend | Low | `apps/web/src/lib/api/base.ts`; `apps/admin/client/src/lib/api/base.ts:1-50`; `apps/creator/client/src/lib/api/` | Three duplicated bespoke fetch layers while `packages/api-client` has 3 consumers repo-wide and `packages/http-client` zero app consumers. | Consolidate on the shared clients; delete per-app bases. |
| AUD-62 | Frontend | Low | `apps/web/src/context/OfflineContext.tsx:17`; `components/ui/OfflineIndicator.tsx:21`; `components/NetworkStatus.tsx:12` | Three parallel network/offline contexts with duplicate `navigator.onLine` listeners. | Collapse to one provider. |
| AUD-63 | Frontend | Low | `apps/web/src/app/layout.tsx:3-17`; `context/AuthContext.tsx:56` | Root layout stacks ~13 providers; auth/user state is React context + `setInterval` token refresh (14 min) duplicating React Query's server-state role. | Move auth/wallet data into React Query hooks; group providers. |
| AUD-64 | Frontend | Low | `apps/web/src/app/reality/live-chat/page.tsx:47` (3s poll); 40 `refetchInterval` sites; `useNotificationsSocket.ts` | Real-time strategy split between WS (notifications only) and polling elsewhere; mobile/TV have no socket at all. | Route live data through the socket/SSE; centralize polling defaults. |
| AUD-65 | Frontend | Low | `apps/web/src/app/sitemap.ts:40-58` | Sitemap enumerates only `/featured` results; movies/creators/events detail pages absent; degrades to 5 static URLs if gateway is down. | Query per-type content lists; paginate into `sitemap/index.ts`. |
| AUD-66 | Frontend | Low | `apps/tv/package.json`; `packages/ui/package.json:47`; `apps/web/src/app/test-route/page.tsx`; `next.config.js:44-52` | TV declares `@azeebo/api-client` with 0 imports and lacks `@azeebo/ui`; zustand is a runtime dep of `@azeebo/ui` used by one file; a `/test-route` page and placeholder image hosts (`picsum.photos`, `placehold.co`) are configured in prod builds. | Prune dead deps, make zustand a peer dep, gate test routes, drop placeholder hosts. |
| AUD-67 | Code Quality | Low | `audit.md` (this file's predecessor, untracked at root); root `*.md` sprawl | Dated audit report squats at repo root and had already drifted from reality (claimed knowledge-service unguarded). | Move audit artifacts to `docs/audits/` or `_archive/dated-audits/`. |
| AUD-68 | Code Quality | Low | Repo-wide | No unused-export/dead-module checker for TS source (orphan-blob checks exist only for blobs); `services/engagement/live-event-service/dist/` contains a leaked whole-monorepo build (gitignored, pollutes non-git-aware tooling). | Add a knip/ts-prune-style gate; fix that service's tsconfig outDir. |
| AUD-69 | Accessibility | Medium | `packages/ui/src/DataDisplay.tsx` (4 buttons, 1 aria); `apps/web/src/app/vote/page.tsx` (8 buttons, 0 aria) | Interactive grids and voting controls rely on visual state with sparse `aria-*`; otherwise a11y is strong (modal focus traps, wired labels, axe + Storybook a11y in CI, Lighthouse a11y gate at warn 0.9). | Add `aria-pressed`/`aria-selected` + live regions to grid/vote controls. |
| AUD-70 | Privacy & Compliance | Low | `services/core/auth-service/src/modules/auth/social/social.service.ts:77,351`; `packages/shared-types/prisma/user.prisma:12` | bcrypt cost 10 (hardcoded default, incl. shadow accounts); `phone` stored plaintext with no field-level encryption anywhere except media-service. | Raise cost to ≥12 with rehash-on-login; HMAC/encrypt `phone` at rest. |
| AUD-71 | Privacy & Compliance | Low | `LICENSE:1-4`; prod license report | Proprietary root license vs prod tree containing `Unknown`/`Unlicense`/GPL-dual entries (`node-forge`, `pause`, `big-integer`, `stream-buffers`, `argparse`); no CI license gate. | Add `pnpm licenses list --prod` gate with allowlist + attribution file. |
| AUD-72 | Privacy & Compliance | Low | `services/core/user-service/src/modules/users/users.controller.ts:391,400` | DSAR endpoints (`me/export`, `me/deletion-status`) exist but no client anywhere calls them; no `/cookies` page or DPO contact route (only `/privacy`, `/terms`). | Build a Privacy & Data screen wired to the endpoints; add cookie policy page. |
| AUD-73 | Security & AppSec | Medium | Git history (commits `1495b371`, `121db5dc`, `3699d416`) | `deploy/staging.env` (placeholder values, verified) and `apps/mobile/android/app/debug.keystore` were recoverable in history; the purge plan at `docs/GIT-HISTORY-PURGE-PLAN.md` was unexecuted **at audit time**. | Executed 2026-10-06 with maintainer sign-off; the two residual local anchors were cleared 2026-10-07. Final status and outstanding operator actions: §5. |
| AUD-74 | Performance | Low | `brand/assets/*.jpg/png`; `apps/web/public/images/poster_*.jpg` | Multiple 300KB+ assets committed (brand heroes, posters) served as static files. | Compress/convert to WebP/AVIF; move hero media to CDN. |
| AUD-75 | Backend & API | Low | `packages/error-handling/src/global-exception.filter.ts:69,82,88,95,131` | `details` objects pass unsanitized into client envelopes (only message/detail are URL-stripped); the second `instanceof Error` branch is unreachable dead code. | Sanitize `details` or gate behind NODE_ENV; reorder branches. |
| AUD-76 | DevOps & Infrastructure | Low | 33 service Dockerfiles; `services/core/auth-service/Dockerfile:4` | Images pinned by version tag but not digest; no `COPY --chown`; 30 near-identical Dockerfile clones drift independently. | Digest-pin + shared parameterized Dockerfile. |
| AUD-77 | Frontend | High | `apps/web/src/lib/api/base.ts` + 13 web routes; `apps/admin/client/src/lib/payload.ts` + 30 route files; `apps/creator/client/src/lib/api` + 19 route files | **Silent-failure class (one defect, three clients):** every app's fetch layer *resolves* a failed read as `{success:false, statusCode, message}`, and every `queryFn` then returned `[]`/`null`/computed zeros. React Query therefore sat in `status:'success'`, so all `isError` branches were unreachable and an outage rendered as a legitimate empty state — or worse, as a computed figure (`₦0` exposure, `0 rows`, `— minutes streamed`, "Venue Not Found"). Consolidated fix: throw inside `queryFn` via the shared guards (`requireData`/`requireArray`/`assertSuccess`), make the error surface reachable, and withhold quantitative claims instead of computing them. | See §6 — fixed and test-locked in all three clients. |
| AUD-78 | Code Quality | Medium | `knip.json` `workspaces["apps/admin"]` / `["apps/creator"]` (no `entry` key) | The dead-export ratchet (AUD-68) was blind to both Vite SPAs: without an explicit entry list, knip reported each SPA's *entire* file graph as unused (55 false "unused file" findings in `apps/admin` alone), so the ratchet floor was an artifact rather than a measurement — and growth in real dead code would have been invisible inside it. | Declare `entry` per SPA workspace and re-measure the pinned baseline. |

---

## 3. Detailed Audit by Category

### 3.1 Frontend & Client Architecture
**Status:** Needs Attention

**Strengths**
- React Query v5 is the single data-cache across all five apps (every app pins `^5.101.0`), with tuned defaults (`apps/web/src/providers/QueryProvider.tsx:12-19`) and shared `@azeebo/react-data` hooks consumed by 25 mobile files.
- Type safety is genuinely tight: 13 `any` in web, 1 in admin, 0 in creator, 2 in mobile, 0 in TV; 5 `@ts-ignore` in app code — across ~300K lines of TS.
- Real a11y tooling (axe Playwright, Storybook a11y addon) and a documented CSP/prerender tradeoff in `layout.tsx:26-29`.

**Vulnerabilities & Anti-Patterns**
- `force-dynamic` site-wide (AUD-16), zero code-splitting in Vite apps (AUD-18), three duplicated fetch layers (AUD-61), three offline contexts (AUD-62), ~13 stacked providers with `setInterval` token refresh (AUD-63), 58% `'use client'` files with only 2 `next/dynamic` call sites, and mobile/TV state containers drifted from `@azeebo/ui` (both apps carry local copies).
- The scripted loading/error convention (`scripts/add-error-loading.sh`) was never applied: 1 `loading.tsx` + 1 `error.tsx` vs 220 pages, with recovery hand-rolled in 78 scattered `<Suspense>` blocks (e.g. `apps/web/src/app/rewards/[id]/page.tsx:216`).

**Concrete snippet — route splitting (admin/creator):**
```tsx
// Before: apps/creator/client/src/App.tsx (all routes eager, recharts in main chunk)
import Analytics from './routes/analytics';   // pulls recharts (~400KB) eagerly
<Route path="/analytics" element={<Analytics />} />

// After
import { lazy, Suspense } from 'react';
const Analytics = lazy(() => import('./routes/analytics'));
<Route path="/analytics" element={<Suspense fallback={<PageSpinner />}><Analytics /></Suspense />} />
```

### 3.2 Backend & API Architecture
**Status:** Needs Attention

**Strengths**
- Deny-by-default proxy GET cache with authenticated-request exclusion, SHA-256 token partitioning, and error-body poisoning guards (`proxy.controller.ts:4005-4068`).
- Uniform hardening across 29 services: `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` in every `main.ts`, `enableShutdownHooks()` everywhere, shared `GlobalExceptionFilter` in 28/29.
- Coherent timeout discipline: gateway `UPSTREAM_TIMEOUT` (5000ms default) matching `packages/http-client` `DEFAULT_HTTP_TIMEOUT_MS`, per-attempt `AbortSignal.timeout`, per-service circuit breakers with a feature-flag kill switch.

**Vulnerabilities & Anti-Patterns**
- Dead retry path in the circuit breaker (AUD-06), decorative endpoint tables (AUD-07), no `trust proxy` (AUD-08), double-registered throttler (AUD-20), stripped `Idempotency-Key` (AUD-21), unwired `IdempotencyGuard` (AUD-22), status allowlist rewriting unknown codes to 200 (AUD-26), DTO-less bodies bypassing whitelist (AUD-29), no BullMQ lock durations (AUD-31).
- Two response envelope dialects: gateway errors return bare `{message}` while services return RFC 9457 envelopes; `@Res()`-based proxy handlers bypass `ResponseWrapperInterceptor`.

**Concrete snippet — wallet idempotency (AUD-03, also the money-path fix):**
```ts
// Before: services/core/wallet-service/src/modules/wallet/wallet.service.ts:566
const idempotencyKey = `withdraw-${userId}-${amount}-${Date.now()}`;
// client retry → new key → duplicate debit

// After: dto/withdraw-transfer.dto.ts
export class WithdrawWalletDto {
  @IsString() @IsNotEmpty()
  idempotencyKey!: string;   // client-generated, stable across retries
  // ...existing fields
}
// wallet.service.ts
const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
if (existing) return this.mapTransaction(existing);
```

### 3.3 Database & Persistence
**Status:** Needs Attention

**Strengths**
- Best-in-class migration tooling: shadow-DB replay gate, deploy-then-diff schema lock, live-DB drift sweep, nightly schema-lock workflow, tombstone-reconcile script with dry-run/backup/undo.
- Query hygiene enforced and green: `check-prisma-find-first.mjs` at 284 models / 595 finders / 0 violations; zero bare `findMany()` in sampled hot services; all raw SQL parameterized (incl. `Prisma.join` batching).
- Money-path integrity: 15+ `SELECT … FOR UPDATE` locks in interactive transactions, `Decimal(18,2)` throughout, append-only `WalletLedger` + `BalanceSnapshot`, `@unique(provider, providerRef)` webhook dedup.
- PgBouncer with per-service `connection_limit=2–6&pgbouncer=true`; seed data dev-safe (invalid bcrypt hash guarded by a dev flag, no PII).

**Vulnerabilities & Anti-Patterns**
- The destructive self-healing entrypoint (AUD-02, AUD-04, AUD-05) is the most dangerous code in the repo precisely because it runs automatically on boot.
- Ledger uniqueness gap (AUD-32), transfer deadlock ordering (AUD-33), package schemas outside the drift gate (AUD-34), `pg_trgm` stranded in legacy migrations (AUD-35), unbounded reconciliation query (AUD-36).

**Concrete snippet — entrypoint fix (AUD-05):**
```bash
# Before: deploy/entrypoint.sh:284
APPLIED_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM prisma_migrations" 2>/dev/null || echo "")

# After
APPLIED_COUNT=$(psql "$DIRECT_DATABASE_URL" -tAc "SELECT COUNT(*) FROM _prisma_migrations" 2>/dev/null || echo "0")
if [ "$APPLIED_COUNT" = "0" ]; then
  echo "FATAL: cannot read _prisma_migrations — refusing auto-resolve" >&2
  exit 1
fi
```

### 3.4 Security & AppSec
**Status:** Pass (with hardening items)

**Strengths**
- Gateway trust boundary: client `x-user-id/email/role/x-gateway-secret` deleted before any route logic (`gateway-auth.guard.ts:104-107`); identity re-injected only from `req.user` (`proxy.controller.ts:4163-4178`); downstream fails closed without a timing-safe secret match (`service-auth.guard.ts:70-91`); JWT alg pinned HS256 with issuer/audience (`gateway-auth.guard.ts:209-217`).
- Webhook security is textbook: Paystack HMAC-SHA512 / Flutterwave HMAC-SHA256 over raw body, constant-time compare, replay window, Redis idempotency, 400 when secret unconfigured.
- All 28 non-gateway services register `ServiceAuthGuard` as `APP_GUARD`; only health endpoints are `@Public()`. Zero `console.log` in service code (custom ESLint rule + zero-warning ratchet).
- IDOR spot-checks clean: wallet endpoints derive identity from `req` only; cross-user mutations require `AdminGuard`; public user projection is minimal (no email/phone).
- Secrets hygiene clean in the tree: only `.env.example` files tracked; `deploy/staging.env` untracked with `<set-via-secrets-manager>` placeholders; gitleaks/trufflehog in CI.

**Vulnerabilities & Anti-Patterns**
- `pnpm audit --prod`: 8 vulnerabilities (4 high: `node-forge ≤1.4.0` via `@expo/cli`, `@fastify/busboy 3.2.0` via `firebase-admin`, `braces 3.0.3` via `chokidar`; 4 moderate incl. `file-type <21.3.1` on the upload-validation path). Lockfile paths: `pnpm-lock.yaml:30621,27819,25791`.
- Remaining hardening: JWT `algorithms` pin (AUD-57), non-constant-time `/docs` compare (AUD-58), latent JsonLd breakout (AUD-59), `allowMissingOrigin` default (AUD-60), QR-modal XSS (AUD-44).
- Generated Prisma clients committed under `services/core/media-service/src/prisma/client/`, `apps/admin/src/generated/`, `apps/creator/src/generated/` — review-surface noise.

### 3.5 Performance & Core Web Vitals
**Status:** Needs Attention

**Strengths**
- Lighthouse CI enforced as build-breaking gates: performance ≥0.8 (error), FCP ≤1800ms, LCP ≤2500ms, CLS ≤0.1, TBT ≤300ms, TTI ≤3800ms (`lighthouserc.json`), run against a mock gateway that serves byte-identical envelopes for stable measurement (`.github/workflows/performance-budget.yml`).
- `next/font` (Inter/Montserrat, `layout.tsx:20-25`), resource-hints lib, AVIF/WebP with 30-day `minimumCacheTTL`, `next/image` quality/device-size budgets.
- Hot list endpoints consistently pair `findMany` with `skip/take`/`_count`; slow-query analyzer tooling exists (`scripts/analyze-slow-queries.ts`).
- Gateway GET cache (5-min TTL, `CACHE_TTL_MS` at `proxy.controller.ts:31`) with mutation-aware invalidation comments at 3905-4067.

**Vulnerabilities & Anti-Patterns**
- `force-dynamic` nullifies all of the above caching (AUD-16); gateway cache is in-memory only with `max: 100` and no Redis store — multi-replica divergence and tiny capacity (AUD-24).
- Eager recharts + no manualChunks (AUD-18); 13 raw `<img>` usages bypass the image pipeline (e.g. `apps/web/src/app/cinemaxis/film/[id]/page.tsx:72`); N+1 fan-outs in sports credits and leaderboard enrichment (AUD-38); unbounded reconciliation query (AUD-36).

### 3.6 DevOps & Infrastructure
**Status:** Needs Attention

**Strengths**
- Per-service container hygiene: all 33 service Dockerfiles are multi-stage, version-pinned `node:22.16.0-alpine`, non-root `USER nodejs`, with `HEALTHCHECK` — verified none missing; hadolint in CI.
- Compose prod architecture is sound for internal services: `expose:`-only on an `internal: true` network, per-service memory/CPU limits, healthcheck-gated `depends_on`, `restart: unless-stopped`.
- Security toolchain depth: mandatory `audit-gate.mjs --severity=high` in 4 pipelines, gitleaks + trufflehog + trivy + snyk + CodeQL, build-provenance attestation, monthly secret-rotation, manual rollback workflow, encrypted S3 Terraform backend with DynamoDB locking.
- `infra/k8s/base` is properly hardened (runAsNonRoot, readOnlyRootFilesystem, no privilege escalation, NetworkPolicy, PDBs, 7 HPAs).

**Vulnerabilities & Anti-Patterns**
- Published admin/creator ports (AUD-09), root-running all-in-one container (AUD-10), alerts that never reach Alertmanager (AUD-11) against stale scrape targets (AUD-12), k8s tree split with committed `change-me` secrets (AUD-49/AUD-50), broad OIDC trust (AUD-51), floating action pins (AUD-52), invisible prod-approval gating (AUD-53), untested backup restores (AUD-54), plaintext secrets as env vars with zero `cap_drop`/`no-new-privileges`/`read_only` across all compose files, cleartext HTTP proxying in nginx (AUD-56).

**Concrete snippet — port binding (AUD-09):**
```yaml
# Before: docker-compose.prod.yml:1131
    ports:
      - "${ADMIN_PORT:-4016}:4016"

# After
    ports:
      - "127.0.0.1:${ADMIN_PORT:-4016}:4016"   # terminate TLS at nginx only
```

### 3.7 Code Quality & Maintainability
**Status:** Needs Attention (excellent baseline, real gaps)

**Strengths**
- Exceptional typing discipline: root `strict` + `noUnusedLocals/Parameters/noImplicitReturns/noFallthroughCasesInSwitch`, zero workspaces disabling strict, 19 `: any` / 9 suppressions in ~192K hand-written lines.
- Industrial lint ratchet: custom rules (no-console-log, no-hex-colors, require-map-and-throw), per-workspace baselines that can only ratchet down, `total: 0` canary across 56 workspaces, rule-promotion tripwire.
- Docs-vs-reality integrity: every command referenced in CLAUDE.md exists in package.json; 459 spec files / ~107K test lines (~36% of TS); e2e pyramids per app (Playwright ×3, Detox) plus DB-backed service e2e.

**Vulnerabilities & Anti-Patterns**
- God files (AUD-43); root typecheck excludes admin/creator client trees (AUD-40); coverage floors missing in knowledge-service and all packages (AUD-41); local guard duplicates (AUD-42); no dead-export checker (AUD-68); `skipLibCheck` + dist-based package resolution means typecheck depends on prebuilt dists (mitigated only for Prisma by `check-prisma-client-stale.mjs`).

### 3.8 Accessibility (a11y)
**Status:** Pass (with targeted gaps)

**Strengths**
- Sampled components show real depth: modals implement focus trap + restore + `role="dialog"`/`aria-modal` (`apps/web/src/components/ui/Modal.tsx:19-60`, `packages/ui/src/Modal.tsx:37-77`); `Input.tsx` wires label associations; AppHeader carries 31 aria attributes; zero non-semantic `<div onClick>` handlers found in web/ui sources.
- Tooling is wired, not aspirational: axe in Playwright, Storybook a11y addon, Lighthouse a11y gate (warn at 0.9).

**Vulnerabilities & Anti-Patterns**
- Sparse-aria interactive surfaces: `packages/ui/src/DataDisplay.tsx` (4 buttons, 1 aria) and `apps/web/src/app/vote/page.tsx` (8 buttons, 0 aria — AUD-69); a handful of pages lean on visual-only state.

**Concrete snippet:**
```tsx
// Before: apps/web/src/app/vote/page.tsx
<button onClick={() => vote(contestant.id)} className={selected ? 'ring-2' : ''}>…</button>

// After
<button
  onClick={() => vote(contestant.id)}
  aria-pressed={selected}
  aria-label={`Vote for ${contestant.name}`}
  className={selected ? 'ring-2' : ''}
>…</button>
```

### 3.9 SEO & Crawlability
**Status:** Fail

**Strengths**
- Solid root metadata: `metadataBase`, title template, OpenGraph + Twitter cards (`layout.tsx:74`), `robots.ts` referencing the sitemap, viewport config, manifest, PWA icons, og-image.

**Vulnerabilities & Anti-Patterns**
- The combination is fatal for SERPs: `force-dynamic` (AUD-16) + only one `generateMetadata` in 220 routes (AUD-17) + shallow sitemap limited to `/featured` watch links (AUD-65) + no canonical URLs (one `alternates` use in `developers/changelog/page.tsx`) + JSON-LD wrapper (`JsonLd.tsx`) essentially unwired into content pages. Detail pages for movies, creators, and events ship the default site title/description.

### 3.10 Privacy & Compliance
**Status:** Fail

**Strengths**
- Card data tokenized end-to-end: `payment_methods` stores only `providerToken/brand/last4/expiry` with an explicit provider-side note (`payment-service/prisma/schema.prisma:122-138`); no PAN/CVV fields anywhere.
- Client consent defaults are deny-by-default and versioned (`apps/web/src/lib/consent.ts:23-29,66-71`); auth cookies are `httpOnly`, `secure` in prod, `sameSite: lax`/`strict` (`auth-cookie.controller.ts:9-13,69-82`); response-level PII masking exists with tests (`packages/logger/src/response-sanitizer.interceptor.ts`).
- ACDP-style content age-rating validation and an 18+ ToS assertion.

**Vulnerabilities & Anti-Patterns**
- Server-side consent enforcement does not exist (AUD-01, AUD-19, AUD-45, AUD-46); erasure is incomplete across the data estate (AUD-13); retention enforcement never actually runs in prod (AUD-14); PII in logs with dead redaction capability (AUD-15); indefinite IP/UA audit retention vs erasure (AUD-48); tokens in localStorage (AUD-47); DSAR endpoints unreachable from any client (AUD-72); bcrypt cost 10 and plaintext `phone` (AUD-70); `Unknown`/`Unlicense` deps without a license gate (AUD-71).

---

## 4. Prioritized Remediation Roadmap

### Phase 1 — Immediate P0 Blockers (within 24 hours)
1. **AUD-03** — Require client-supplied idempotency keys on wallet withdraw/transfer; reject synthesized `Date.now()` keys. *(Financial integrity.)*
2. **AUD-02** — Remove the `ALL_IN_ONE` exemption from the P3018 `DROP SCHEMA public CASCADE` guard in `deploy/entrypoint.sh`. *(Catastrophic data-loss path.)*
3. **AUD-09** — Bind admin/creator/web/gateway compose ports to `127.0.0.1` (or remove `ports:` in favor of nginx-only exposure). *(Edge-bypass exposure.)*
4. **AUD-01** — Gate analytics ingest on server-side consent validation and whitelist `ingestWebVital` fields. *(Compliance breach; ~1 day of DTO + ledger work for the minimal version.)*
5. **AUD-04 + AUD-05** — Fix the `_prisma_migrations` underscore and replace the P3005 mark-all-applied shortcut with `prisma migrate baseline` or a hard failure.

### Phase 2 — Short-Term P1 Improvements (next sprint)
6. **AUD-06/AUD-07/AUD-08/AUD-20** — Gateway correctness bundle: fix the dead retry path, enforce or delete the endpoint tables, set `trust proxy`, de-duplicate the throttler registration.
7. **AUD-21/AUD-22/AUD-31** — Idempotency end-to-end: allowlist `Idempotency-Key`, wire `IdempotencyGuard` onto money mutations, set BullMQ lock durations.
8. **AUD-13/AUD-14/AUD-15** — Privacy runtime: complete DSAR erasure (phone, payment_methods, messages, S3), move retention enforcement into prod scheduling with expanded DB coverage, bind LogRedactionService into the logger.
9. **AUD-10/AUD-11/AUD-12** — Infra: drop privileges in the all-in-one image, wire Prometheus → Alertmanager, regenerate scrape targets.
10. **AUD-49/AUD-51/AUD-54** — Remove committed k8s secrets, restrict OIDC trust, schedule restore drills.

### Phase 3 — Medium-Term P2 Hardening (tech-debt backlog)
11. **AUD-16/AUD-17/AUD-65** — Re-enable static/ISR rendering via middleware CSP injection; convert detail routes to server components with `generateMetadata`; expand the sitemap.
12. **AUD-18** — Route-level lazy loading + manualChunks in admin/creator.
13. **AUD-40/AUD-41** — Typecheck the excluded client trees; add coverage thresholds to knowledge-service and security-critical packages.
14. **AUD-29/AUD-30/AUD-75** — DTO-ize the six unvalidated bodies, register the shared exception filter in knowledge-service, sanitize error `details`.
15. **AUD-33/AUD-34/AUD-35/AUD-36/AUD-37** — DB hardening: deterministic lock ordering, package-schema migration ownership, re-land `pg_trgm`, paginate reconciliation, add `directUrl`.
16. **AUD-44/AUD-57/AUD-58/AUD-59/AUD-60** — Security hardening batch (XSS escape, alg pinning, timing-safe compare, JsonLd escaping, CORS default).
17. **AUD-43/AUD-61/AUD-62/AUD-63** — Decompose god files, consolidate fetch/offline/provider layers.
18. **AUD-69/AUD-70/AUD-72** — a11y attributes on grid/vote controls, bcrypt ≥12 + phone encryption, client Privacy & Data screen.

### Phase 4 — Long-Term P3 Architecture
19. **AUD-73** — ~~Execute the git-history purge per `docs/GIT-HISTORY-PURGE-PLAN.md`~~ **executed 2026-10-06; local-side anchors cleared 2026-10-07 (§5)**. Remaining items are GitHub-side operator actions, not code work: repository GC ticket, fork audit/re-sync, close+reopen the Dependabot PRs, Firebase SHA-1 re-registration, team re-clone.
20. **AUD-50/AUD-52/AUD-53/AUD-56** — Consolidate Kubernetes onto the hardened tree and wire it into CD; SHA-pin all actions; make production approval explicit in code; modernize nginx TLS + rate zones.
21. **AUD-24/AUD-26/AUD-28** — Redis-backed gateway cache/throttle stores, real status forwarding, per-deployment service URL defaults.
22. **AUD-64/AUD-66/AUD-67/AUD-68/AUD-71/AUD-74/AUD-75/AUD-76** — Real-time strategy unification, dep/test-route pruning, audit-artifact relocation, dead-export gate, license gate, asset compression, shared Dockerfile.

---

*Methodology note: every finding above was verified against the current working tree on 2026-10-05 by direct file inspection, targeted greps, `pnpm audit --prod`, and cross-referencing compose/workflow/config files. Line numbers refer to the working tree as of commit `bc265c1c` plus uncommitted changes.*

---

## 5. Remediation Status (updated 2026-10-06, final)

All 76 findings were triaged and worked in dependency order (P0 → P3). Final disposition: **71 fixed**, **3 partially fixed with documented scope**, **2 dispositioned without code change**, **0 remaining** (the history purge was executed with explicit maintainer sign-off, and its residual local ref anchors were cleared on 2026-10-07).

A subsequent local-dev verification pass (2026-10-07) surfaced **two further findings**, logged as **AUD-77** (High, silent-failure class across all three web clients) and **AUD-78** (Medium, the dead-code ratchet was unmeasurable for both Vite SPAs). Both are fixed and test-locked — details in §6.

### Fixed (verified by tests, typechecks, and builds)

- **P0/Critical:** AUD-01, AUD-02, AUD-03, AUD-09 (analytics consent gate, `DROP SCHEMA` guard, wallet idempotency keys, loopback port binds).
- **P1 bundles:** AUD-04, AUD-05, AUD-06, AUD-07, AUD-08, AUD-10, AUD-11, AUD-12, AUD-13, AUD-14, AUD-15, AUD-18, AUD-19, AUD-20, AUD-21, AUD-22, AUD-23, AUD-31.
  - AUD-12 went beyond the six cited ports: every scrape target was re-derived from the `PORT` env each service receives in `docker-compose.prod.yml` (~20 corrections, `live-event-service` added, nonexistent `music-service` job removed).
  - AUD-15 is delivered via the central redaction binding (`packages/logger` now routes every message through `LogRedactionService`).
- **Database:** AUD-32, AUD-33, AUD-34, AUD-35, AUD-36, AUD-37, AUD-38, AUD-39.
- **Privacy:** AUD-45, AUD-46, AUD-47, AUD-48; **a11y:** AUD-69.
- **DevOps:** AUD-49, AUD-50, AUD-51, AUD-52, AUD-53, AUD-54, AUD-55, AUD-56.
  - AUD-49 scope correction: the k8s `Secret` was **never committed** (`**/secrets.yaml` is gitignored; the file contained only placeholders). The remediation archived the legacy tree, added an External Secrets Operator manifest, and repointed the kustomization.
  - AUD-50 was executed as a reversible archive (`git mv k8s archive/k8s-legacy`, uncommitted local edits preserved). Wiring `infra/k8s/` into CD remains operator work — it needs cluster/registry details outside this repo's scope.
  - AUD-52: every GitHub Action is SHA-pinned; `.github/dependabot.yml` already covered the `github-actions` ecosystem.
- **Gateway correctness:** AUD-24 (Keyv/ioredis-backed cache + throttle stores), AUD-25 (`@Get('routes')` declared ahead of the wildcard), AUD-26 (upstream statuses forwarded verbatim), AUD-27 (dead `/creators` table entry removed), AUD-28 (compose-name fallbacks `admin-app`/`creator-app` with proper env keys).
- **Code quality / security:** AUD-29, AUD-30, AUD-40, AUD-41, AUD-42, AUD-44, AUD-57, AUD-58, AUD-59, AUD-60, AUD-75.
  - AUD-40: admin/creator clients were already strict-clean; the gap was that nothing typechecked them. `typecheck:client` scripts were added and chained into the root `typecheck` (root `tsc --noEmit` + both clients now pass).
  - AUD-41: knowledge-service gained real tests (coverage now 94/89/92/94, above the enforced 70/70/70/70 floor). security/auth/validation got regression-ratchet thresholds at their measured levels with the intent to ratchet toward 70; generated Prisma runtime is excluded from the coverage denominator.
  - AUD-42: canonical `RolesGuard` + `Roles()` decorator now live in `@azeebo/security`; content-service and auth-service consume the shared guard (local copies deleted; specs repointed), and support-service's hand-rolled JWT guard was replaced by the shared `ServiceAuthGuard` (deleted with all call sites migrated, including the kill-switch spec's barrel mock).
  - AUD-60 implemented safely: origin-less requests no longer receive `Access-Control-*` headers (default `allowMissingOrigin: false`), but are not hard-500'd — health probes and same-origin GETs legitimately omit `Origin`, and CORS is browser-enforced anyway.
- **Frontend:** AUD-62 (offline contexts collapsed), AUD-65 (sitemap), AUD-66 (`/test-route` removed, TV dep pruned, zustand peer-scoped), AUD-67 (dated audit artifacts moved to `_archive/`).

### Fixed in the follow-up pass (2026-10-06, same day)

- **AUD-43 (god files):** `apps/admin` `ops.tsx` 2,108 → 462 lines plus 8 modules under `routes/ops/` (constants, foreign grouping, transport banner/trend cards, pgbouncer card, run views, check card); `subscriptions.tsx` 1,884 → 615 lines plus 5 modules under `routes/subscriptions/` (plans panel, promos panel, plan modal, promo modal, shared formatters). Both verified with `tsc` (root `noUnusedLocals` on) and a green `vite build`; route-level code-split chunks intact.
- **AUD-64 (polling defaults):** all 40 hard-coded poll intervals across the four clients now come from `pollingIntervals` in `@azeebo/design-tokens` (values match production 1:1, incl. the mobile chat battery-saving 5s); the existing WS-first pattern (`useNotificationsSocket`: backoff + REST fallback) stands as the reference for future live features. No server-side WebSocket/SSE transport exists in any service, so client sockets for chat/mobile/TV would be dead code — that half remains a documented follow-up when a transport lands.
- **AUD-68 (dead-code gate):** knip-based per-workspace ratchet (`scripts/check-dead-exports.mjs` + `scripts/dead-exports-baseline.json`, 669 pre-existing findings pinned; growth fails CI with `::error` annotations; `--update` to re-baseline). Wired into `lint.yml` + `pr-checks.yml`. Also fixed the `live-event-service` `dist/` leak (service tsconfig now scopes `include` to `src/**` — the dist had been emitting the whole monorepo tree).
- **AUD-71 (license gate):** verified already-complete from the earlier pass — `scripts/check-licenses.mjs` (`pnpm ops:licenses`, fails on non-permissive prod licenses outside the allowlist), regenerated `THIRD_PARTY_NOTICES.md`, and the `license-gate` CI job.
- **AUD-72 (privacy surface):** verified already-complete — `/cookies` policy page with consent-reset, the auth-gated `profile/privacy-security` screen wired to `updatePrivacySettings`/`exportUserData`/`getDeletionStatus`/`requestAccountDeletion`, and the shared user API client.
- **AUD-74 (asset bloat):** 10 committed logo PNGs recompressed in place (largest 815 KB → 9.5 KB), homepage/hero/auth JPEGs converted to WebP (~575 KB saved), brand design docs recompressed q82, and 4 timestamped byte-identical duplicates removed — each deletion proven byte-identical against `git show HEAD:` before `git rm`. All references updated.
- **AUD-76 (Docker hardening):** every `FROM` line across all 33 Dockerfiles (32 service/app images + `Dockerfile.all-in-one` + the single-stage gateway) digest-pinned via the Docker Hub registry API; every final-stage `COPY` runs with `--chown=nodejs:nodejs`. Added the canonical parameterized template `deploy/Dockerfile.service` plus `scripts/check-dockerfile-drift.mjs` (CI-enforced in `security-scanning.yml`) so service images can be regenerated instead of drifting; `api-gateway` is deliberately excluded from the template (it is intentionally single-stage — cross-stage COPY of built packages has proven unreliable).

### Executed with sign-off (2026-10-06)

- **AUD-73 (git-history purge):** executed per `docs/GIT-HISTORY-PURGE-PLAN.md` with explicit maintainer authorization. `git filter-repo --invert-paths` on a fresh mirror clone removed `deploy/staging.env`, `apps/mobile/android/app/debug.keystore` (plus `*.keystore`/`*.env` glob hardening — `.env.example` files unaffected); all 10 branches + the `v1.0.0` tag force-pushed (677 commits, new SHAs from `3699d416` onward); fresh-clone validation confirms both paths absent from all logs and the object database. The old debug keystore was moved out of the tree (`/tmp/debug.keystore.abandoned-2026-10-06`); the replacement must be generated with the `keytool` command in the plan (no JVM on this machine).
  - **Local-side completion (2026-10-07).** The initial local re-point (`git reset --mixed origin/Major-Upgrade`) preserved all 677 uncommitted work-tree entries but left **two** refs anchoring the purged blobs, so `git gc` could not release them: (1) the annotated tag `refs/tags/v1.0.0`, still targeting the pre-purge tag object `956844ed` — a `git fetch` does not overwrite an existing local tag; repointed to the remote's rewritten `422a5f31` → `707da85d`; (2) `refs/stash`, a GitHub Desktop stash (`26936fed`, 2026-07-06, 182 files / +32,781 lines of the early Agbala storyworlds WIP) whose **own tree** carried `apps/mobile/android/app/debug.keystore`. The stash was not dropped — the WIP was preserved: a new two-parent stash commit (`a2df08bc`) was rebuilt on the rewritten base `6763ec85` with the identical 182-file diff, with only the keystore path removed from the tree and index parent, then installed via `git stash store`. Text content was additionally exported to `/tmp/agbala-stash-26936fed.patch` (34,366 lines, verified to contain **zero** secret paths, since the diff never touched them). The Agbala vertical landed independently in restructured form (`apps/web/src/modules/vertical/agbala`, `apps/admin/src/modules/vertical/agbala`, `apps/mobile/src/modules/vertical/agbala`), so the stash is a superseded snapshot kept only for evidence.
  - **Post-purge verification (2026-10-07):** after `git reflog expire --expire=now --expire-unreachable=now --all && git gc --prune=now`, all three secret blobs (`364e105e`, `82c03e54`, `3121c154`) are unreachable from **every** ref (per-ref `git rev-list --objects` scan) and are gone from the object database (`git cat-file -e` fails); `git fsck --full` is clean; `git rev-list --objects --all | grep -c 'staging.env|debug.keystore'` = 0; branches, HEAD (`ed16ec62`), the rewritten tag, and the 677-entry work tree are unchanged.
  - **Retention caveat:** the pre-rewrite backup bundle is **not present on this machine** — it was produced in the throwaway mirror workspace and did not survive. Because history is now rewritten with force-push completed, no equivalent backup can be re-created. If the organization requires a pre-purge archive, it must come from GitHub's own support-side GC window. **Outstanding operator actions (GitHub-side, cannot be done from a clone):** support ticket for repository GC of unreachable objects, fork audit/re-sync, close+reopen the 4 Dependabot PRs, re-register the new debug SHA-1 in Firebase if used, and re-clone instructions for the team (§7 of the plan). `deploy/staging.env` still exists on local disk as a gitignored file containing only `<set-via-secrets-manager>` placeholders.

### Partially fixed (documented scope)

- **AUD-16** — `force-dynamic` on `apps/web/src/app/layout.tsx` is load-bearing for the nonce-based CSP: prerendered HTML would bake script tags without a valid nonce and silently blank every page. Re-enabling static/ISR requires build-time inline-script hashing (or meta-CSP layering) — a dedicated follow-up, not a one-line change.
- **AUD-17** — the two cited detail routes (`movies/[id]`, `lifestyle/events/[id]`) are now server components with `generateMetadata`; the remaining ~220 client routes need the same treatment incrementally.
- **AUD-70** — bcrypt cost raised to 12; the `phone`-at-rest encryption half is moot — no service schema currently stores a phone column.

### Dispositioned (no change warranted)

- **AUD-61** — the three per-app fetch layers encode app-specific cookie/CSRF semantics; consolidating on `@azeebo/api-client` is a multi-week refactor with real regression risk and is deferred.
- **AUD-63** — the ~13-provider root layout and context-based auth are not idiomatic but are correct; moving auth into React Query is an architecture decision, not a fix.

### Verification summary (2026-10-06, final)

- Root `pnpm typecheck`: clean — now also covers `apps/admin/client` and `apps/creator/client` (AUD-40).
- Gateway: `tsc --noEmit` clean, 84/84 tests pass; `packages/security`: 197 tests pass under enforced thresholds; `packages/error-handling`: 15/15, rebuilt; `packages/auth` + `packages/validation`: thresholds enforced.
- Services touched by the hardening pass: support-service 14 suites / 80 tests, auth-service 54 guard tests, content-service 14 moderation tests, knowledge-service 133 tests (94/89/92/94 coverage) — all green.
- `apps/creator/client`: `tsc` clean and `vite build` green with the code-split chunk layout intact (charts 297.8 kB / 81.7 kB gzip isolated).
- `apps/admin/client` (AUD-43): `tsc` clean after both decompositions and `vite build` green — `ops` (39.9 kB / 9.9 kB gzip) and `subscriptions` (33.3 kB / 6.7 kB gzip) still code-split per route.
- DevOps artifacts: 13 YAML files parse, `nginx -t` syntax pass, `bash -n` clean on the backup/restore/entrypoint scripts.
- Two pre-existing suite failures surfaced during verification were also fixed: the support-service barrel mock stubbed only `AdminGuard` (now also stubs `ServiceAuthGuard`), and `@azeebo/security/log-redaction` had no tsconfig path (explicit mapping added at root and in support-service).
- History purge (AUD-73): post-rewrite fresh clone shows both target paths absent from `git log --all`, `git rev-list --objects --all`, and `git fsck --full` clean; gitleaks full-history scan of the rewritten history attached at `/tmp/gitleaks-post-purge.json` (redacted).

---

## 6. Follow-up pass (2026-10-07) — AUD-77 and AUD-78

Both surfaced while running the platform end-to-end on the local dev stack (gateway `:3013`, web `:4000`, admin `:4100/4016`, creator `:4101/4014`) and stopping a service to observe real outage behaviour, rather than by reading code.

### 6.1 AUD-77 — the silent-failure class (High)

**Root cause (one defect, replicated in three clients).** None of the app fetch layers reject on a failed read. `apiFetch` resolves non-2xx and network failures as an envelope — `apps/web/src/lib/api/base.ts:610,642,661,675,702,724` all `return { success: false, … }`. Every `queryFn` then did the "defensive" thing:

```ts
// Before — the outage is laundered into a successful empty result
queryFn: async () => {
  const res = await apiFetch<T[]>('/v1/commerce/counterparty');
  return res.success ? res.data : [];      // ← react-query sees status:'success'
}
```

Consequences were worse than an ugly error state:
- `isError`, `error`, and every hand-written error branch in these components were **unreachable code** — a reviewer reading the file would believe the page handled failures.
- Headline figures were *computed* from the fallback, so a 503 rendered as an assertion about the business: `Total Exposure ₦0`, `0 refunds`, `0 rows`, `0m streamed`, and on detail routes a full **404-shaped** "Venue Not Found" / "Film not found" page for a service that was merely restarting.
- No retry affordance, since the component thought it had succeeded.

**Fix contract (applied uniformly, three clients).**
1. **Throw in `queryFn`** through shared guards so react-query actually transitions to `status:'error'`: `requireData`/`requireArray`/`messageOf` in `apps/web/src/lib/payload.ts`, `assertSuccess`/`requireData`/`asArray`/`unwrapList` in `apps/admin/client/src/lib/payload.ts:33-104`, `assertSuccess`/`errorMessage` in `apps/creator/client/src/lib/api/creator.ts:40`.
2. **Make the error surface reachable** — `ErrorState` (`packages/ui/src/web-components.tsx:617`) with the server's own message and a working `Retry` → `refetch()`.
3. **Withhold quantitative claims instead of computing them.** A failed dashboard read renders `—` in every stat, never `0`/`₦0`.
4. **Outage ≠ not-found.** Detail routes got a third branch: `isError` → "unavailable + Retry", `!data` → the genuine not-found page. Previously both collapsed into not-found.

**Surface area closed:** 13 web route files (commerce counterparty / revenue-classes / telco-reconciliation / refund-status, creator analytics-dashboard, lifestyle places + tonight + influencers, live event, cinemaxis film + ticket, admin process-mining + capacity-ledger, movies watchlist), 30 admin SPA files, 19 creator SPA files. One deliberate nuance on partial failure: `apps/web/src/app/movies/watchlist/page.tsx` throws only when *every* title lookup fails — one missing title stays a partial result, all missing is an outage and must not read as an empty watchlist.

**Verification.** Behaviour is locked by in-project tests, not ad-hoc scripts — each suite drives the envelope `{success:false, status:503, message:'…'}` through the real component and asserts the withheld figure, the message, and recovery after `Retry`:
- `apps/web`: 41 files / **458 tests** green, incl. `src/app/__tests__/commerce-failed-reads.test.tsx`, `detail-pages-failed-reads.test.tsx`, `ops-failed-reads.test.tsx` (asserts 4× `—`, `queryAllByText('₦0')` empty, then `1,234` / `₦5,000` after retry).
- `apps/admin/client`: 16 files / **140 tests** green. `apps/creator/client`: 7 files / **44 tests** green.
- Live-stack half of the contract: stopping a core service makes the gateway return a real **502** `{"message":"Failed to reach upstream service", …}` — never a 200-with-empty-data, so the client-side fix has a server-side error to key off. (Service boot here also required the repo-managed pooler: `node scripts/database/start-pgbouncer.mjs`, and a stale `:3002` process was replaced via `scripts/database/restart-service.mjs`.)

**Residual (documented, not fixed):** five *unimported* web modules still swallow failed reads (`useSocial`, `useComments`, `recommendations.ts`, `OneClickCheckout`, `AdvancedSearch`). They have no user-facing defect because nothing renders them, and editing files a concurrent session is working on carried more risk than the fix was worth. They must be converted the same way if they are ever wired up.

### 6.2 AUD-78 — the dead-code ratchet could not see either Vite SPA (Medium)

AUD-68's ratchet measures knip findings per workspace and only allows the count to fall. Both SPA workspaces declared **no `entry`**, so knip treated every file reachable only from `client/index.html` as unused: `apps/admin` reported 55 "unused file" findings — its whole route graph — which had been pinned into the baseline as if it were real debt. The floor was an artifact, not a measurement, and genuine new dead code could hide inside it.

Fixed by declaring the real entry graphs in `knip.json`:

```json
"apps/admin":   { "entry": ["src/main.ts","client/index.html","client/src/main.tsx","client/vite.config.ts","client/vitest.setup.ts","client/playwright.config.ts"] },
"apps/creator": { "entry": ["src/main.ts","client/index.html","client/src/main.tsx","client/vite.config.ts","client/playwright.config.ts"] }
```

Re-measured floors: `apps/admin` **files 55 → 0** (exports 13, duplicates 1), `apps/creator` files 1, `apps/web` files 59 / exports 34 / types 31 / duplicates 6. Three genuine dead exports were removed alongside: `PlanFormState` and `PromoFormState` are no longer exported (zero external importers verified), and `dual-control.service.ts` now narrows with `as DualControlActionType` instead of `as never`. `UserWithStats`, `AuditEntry`, and `SupportTicketItem` were **left** in place — they document API shapes rather than being dead.

Two things a reader must not take on faith:
- The re-measure **loosened one category**: `apps/admin` types moved 31 → 33 because the accurate entry graph surfaced two more unused type exports than the old blind baseline pinned. It is reported, not hidden; it is the first thing that should be driven back down.
- Enforcement is only real once the three gate files are committed. `knip.json`, `scripts/check-dead-exports.mjs`, and `scripts/dead-exports-baseline.json` are currently **untracked** (not gitignored), and the `check:dead-exports` line in root `package.json` is an uncommitted edit — while `.github/workflows/lint.yml:102` already invokes it. A fresh CI clone therefore fails that step until this branch's work is committed. Locally, `node scripts/check-dead-exports.mjs` reports ✅ Dead-code ratchet holds.

---

## 7. Follow-up pass (2026-10-08) — AUD-79 and AUD-78 residuals

### 7.1 AUD-79 — the panels collected credentials they never needed (Medium)

**Request.** Both the admin Console and the Creator Studio must sign in through the main web app.

**What was actually wrong.** No new session mechanism was needed — the platform already has one. The web app mints `access_token` (15 min) and `refresh_token` (24 h) as httpOnly cookies (`apps/web/src/app/api/auth/set-cookie/route.ts`); the gateway falls back to `request.cookies.access_token` (`gateway-auth.guard.ts:168`) and `/auth/cookie` is public (`gateway-auth.guard.ts:40-44`); cookies are host-scoped, not port-scoped, so one browser jar on `localhost` covers web `:4000`, admin `:5173/4016` and creator `:5174/4014`, and in production the gateway serves `/admin` and `/creator` on the same registrable domain. The defects were at the edges:

- **Creator had no cookie session at all.** `apps/creator/client/src/context/AuthContext.tsx` restored a session by reading a **localStorage user blob plus a readable token**, so a reload of a cookie-authenticated creator logged out — the same class of bug as AUD-77's silent failures, in the auth path.
- **Both panels kept a password form** (`routes/login.tsx`) that posted `/auth/login`, then mirrored tokens into `setAuthCookies`/localStorage. Two credential surfaces for one platform, and the only way to reach the panel was to re-enter the password.
- **The web login's own redirect guard was open at the edges.** The previous inline check accepted same-origin paths but had no notion of a *cross-origin* first-party target, which the hand-off now requires.

**Fix.**

1. `apps/web/src/lib/first-party-redirect.ts` (new) — `safeRedirectTarget(raw, fallback, allowedOrigins)` keeps same-origin paths, and accepts an absolute URL only when it is http(s), has no userinfo, and its `URL.origin` is an **exact** member of `NEXT_PUBLIC_PANEL_ORIGINS` (comma-separated, trailing slashes normalised). Everything else collapses to the fallback. `isSafeSameOriginPath` rejects `//host` and `\host` because browsers normalise the latter to the former, and rejects `://` so `javascript:` and scheme tricks cannot pass. Matching on `URL.origin` rather than a string prefix is what stops `https://admin.azeebo.com.evil.com`, `https://evil.com/?next=https://admin.azeebo.com/` and `http://admin.azeebo.com@evil.com/`.
2. `apps/web/src/app/auth/login/page.tsx` — resolves `?redirect=` through that helper; absolute targets navigate with `window.location.assign` because `router.push` cannot leave the origin, same-origin targets keep `router.push`.
3. `apps/{admin,creator}/client/src/lib/web-auth.ts` (new, near-identical) — `webLoginUrl(next)` builds `${WEB_APP_URL}/auth/login?redirect=<absolute same-app URL>` where the return path is filtered by `safePath` (rejects `//` and backslash), and `goToWebLogin` uses `location.replace` so the hand-off page is never a back-history entry. `VITE_WEB_APP_URL` overrides the `http://localhost:4000` default. Creator's copy adds `webRoleSelectionUrl()` for the "not a creator yet" path.
4. Both `AuthContext.tsx` — the credential `login()` is gone; the provider now **probes** `GET /api/v1/auth/me?_t=…` through `apiFetch` (which carries the cookies and rotates an expired access token first, so a *readable* token is deliberately not part of the test) and sets `roleDenied` when the session is live but the role is not this panel's. `logout()` clears the shared session and hands back to the web login. Creator's `ALLOWED_ROLES` stays exactly `{'creator'}`; admin's keeps its six admin/superadmin spellings.
5. Both `routes/login.tsx` — the forms are replaced by a branded hand-off card that auto-hands-off and still offers a click-through anchor (needed, because `location.replace` is blocked in some embeds). **Loop guard:** an unauthenticated visitor is handed to the web app, but a `roleDenied` visitor is not — sending a signed-in non-admin to the web login returns them here with the same session, forever. The denied branch offers "Sign in with an admin account" / "Apply for creator access" / "Back to Azeebo+".
6. `AdminLayout.tsx` and `CreatorLayout.tsx` — the guard now navigates to `/login?next=<pathname+search>` with `replace: true`, so the page the user actually wanted survives the round trip. `?next` is only ever consumed through `safePath`.

**Config.** `NEXT_PUBLIC_PANEL_ORIGINS` is required for the return leg and **defaults to an empty allowlist** — unset means no absolute target survives, which fails closed rather than open. Dev origins come from `scripts/launchd/service-manifest.mjs:79-80` (admin-vite 5173, creator-vite 5174, backends 4016/4014).

**Tests.** `apps/web/src/lib/__tests__/first-party-redirect.test.ts` (5) pins the allowlist: same-origin kept, `//evil.com/x`, `/
evil.com/x`, `/a://b`, `javascript:`, unlisted origin, subdomain-suffix, nested-allowlist-origin and userinfo forms all collapse to `/home`, while `http://localhost:5173/wallets?tab=open` is preserved. `apps/{admin,creator}/client/src/routes/login.test.tsx` (4 each) render the real hand-off screens with the auth hook stubbed and `goToWebLogin` spied: anonymous → handed off with the exact absolute return URL and a matching anchor `href`; authenticated → lands on the intended page; `//evil.example/…` `?next` → stays on the overview; `roleDenied` → **no** hand-off call, plus the explanation and role-specific link.

**Verification.** Web suite 42 files / 463 tests pass (includes the new redirect suite). Admin client 17 files / 144 tests pass; creator client 8 files / 48 tests pass. `typecheck:client` clean in both SPAs, which required adding `client/src/vite-env.d.ts` (`/// <reference types="vite/client" />`) to each — neither SPA tsconfig listed `vite/client`, so `import.meta.env` had no type and both typechecks failed on the first draft of `web-auth.ts`.

**Known limitations, reported not hidden.**
- Social login cannot complete the hand-off because **it does not work at all** — verified on the dev stack rather than inferred, and worse than the "loses `?redirect=`" wording I first used. Both buttons do `window.location.href = /api/v1/auth/social/{google,apple}` (`apps/web/src/app/auth/login/page.tsx:173,202`); `next.config.js:120-129` rewrites `/api/*` to the gateway, and those paths are declared **POST-only** in the proxy registry (`proxy.controller.ts:101,107`), so the GET navigation returns `404` — `curl http://localhost:3013/api/v1/auth/social/google` → 404, and the user is left on a raw problem-details JSON page. Three more gaps sit behind it: the usable entry point is `GET /social/{p}/authorize`, which **requires authentication** (probe → 401 `Authentication required`, so a signed-out user cannot start the flow) and returns `{ state, authorizeUrl }` as JSON instead of redirecting, so nothing navigates the browser; `buildAuthorizeUrl` sends the provider to `${BASE_URL}/auth/social/callback` — the **auth-service's own** origin, not the web app (`social.service.ts:274-275`) — and that route is `@Post('callback')`, so the provider's GET/redirect back has no handler; and `apps/web/src/app/auth/` has **no callback route** to receive a code, set the shared cookies, or read a return target. Carrying `?redirect=` through the round trip is therefore moot: there is no round trip to carry it through. Shipping the panels onto web login made this page the front door for all three apps, so the two visible buttons now fail in front of panel users too. Fixing it is an OAuth feature (public authorize, a web `/auth/callback` page, GET/Form-Post callback handling, cookie hand-off, provider credentials + console redirect-URI registration), not a patch — deliberately **not** half-built here, and it needs its own AUD item. Password login is the only path that round-trips, and it is the path the panels document.
- Signing out of a panel signs the user out of Azeebo+ everywhere; that is inherent to one shared cookie session, not a bug, but it is a behaviour change for anyone who expected panel-local logout.
- `NEXT_PUBLIC_PANEL_ORIGINS` is currently recorded only in the gitignored `apps/web/.env.local`. The three `.env.example` insertions were reverted, so no tracked file mentions the variable; whoever owns env documentation should decide where it belongs. Until it is set somewhere, a fresh clone fails the return leg closed (the panel lands on the web login but is never sent back). `VITE_WEB_APP_URL` has the same status in both SPAs, and is benign when unset because it defaults to `http://localhost:4000`.
- The live round trip **was** run on the dev stack, and the chain holds: signing out of the Console cleared the shared session and landed on `http://localhost:4000/auth/login?redirect=http%3A%2F%2Flocalhost%3A5173%2F`; signing in there returned the browser to `:5173` (so `NEXT_PUBLIC_PANEL_ORIGINS` was honoured — an unlisted origin would have collapsed it to `/home`); the Creator Studio, given an admin-role web session, rendered "This account can't open the Studio" with the correct absolute action links instead of a form, and instead of bouncing into the web login (the loop guard). A normally-provisioned admin session rendered the full Console dashboard authenticated **only** by the shared cookies.
- **Finding surfaced by that run, and the first diagnosis of it was wrong — corrected here.** For a freshly promoted account the **Bearer** token reported `role: admin` while the **cookie** for the same user id reported `role: user`. I first wrote this up as `auth-service.users` and `user-service.users` disagreeing; that is not what happens. `role` is a **JWT claim** (`generateTokens` embeds `role: user.role`, `services/core/auth-service/src/modules/auth/auth.service.ts:1200`) and `JwtStrategy.validate` returns `payload.role` without any DB read (`strategies/jwt.strategy.ts:38-49`), so `/auth/me` echoes whatever the token was minted with. The gateway treats the two session shapes identically — `gateway-auth.guard.ts:166-170` takes the Bearer or the cookie and hands the same token to the same verifier, so the two readings can only differ because they were **two different tokens**: the cookie still held the pre-promotion access token. `refreshToken` re-reads the user (`auth.service.ts:475`) and re-mints with the current role, so the skew self-corrects at the next refresh or by token expiry (15 min). The accurate statement of the behaviour: **a role change does not take effect until the access token is re-minted**, and the panels gate on `/auth/me`, so a just-promoted admin can be shown "this account can't open the Console" for up to one TTL. Whether that window is acceptable is a product call, not a data-integrity bug; no cross-service divergence exists and nothing here needs chasing.


### 7.2 AUD-78 residuals cleared

- **Six unreferenced `apps/web` modules deleted** after confirming zero importers repo-wide (the watch page implements comments inline in `WatchPageClient.tsx`, `/recommendations` fetches its own way, and no route renders the other three): `components/Comments.tsx`, `hooks/useComments.ts`, `hooks/useSocial.ts`, `lib/recommendations.ts`, `components/AdvancedSearch.tsx`, `components/OneClickCheckout.tsx`. `apps/web` dead **files 59 → 53**. Converting these to the AUD-77 throw-on-failure contract was rejected as dead-code churn; the user chose deletion. `useSocial.ts` carried 2 uncommitted lines, so every file was copied to `/tmp/azeebo-dead-modules/` (plus `uncommitted.diff`) before `git rm -f`.
- **`apps/admin` dead types driven back 33 → 32** by removing the `export type { AuthContextType }` re-export from `client/src/context/AuthContext.tsx` — a zero-importer compat shim. The `export { useAuth }` line next to it **is** reachable (four importers use `@/context/AuthContext`) and stays; an over-broad first edit that deleted it was caught by `typecheck:client`.
- `scripts/dead-exports-baseline.json` re-measured with `--update`; `node scripts/check-dead-exports.mjs` reports ✅ Dead-code ratchet holds. The `apps/web` file floor (59) is now one measurement above actual (53) and can be lowered by the next `--update` run; that run was killed under machine load rather than left to compound it.

