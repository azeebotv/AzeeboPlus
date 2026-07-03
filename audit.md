# AZEEBO+ COMPREHENSIVE CODEBASE AUDIT

## EXECUTIVE SUMMARY

**Azeebo+** is a modular digital entertainment platform — a shared operating system for multiple content "universes" (reality TV, movies, comedy, games, sports, lifestyle, vertical video, creators). It's a **pnpm monorepo** with **27 microservices**, **4 client applications**, **18 shared packages**, and a **10-workflow CI/CD pipeline**.

**Scale:** ~1000+ source files, ~410 Prisma models across 28 databases, ~500+ API endpoints, ~90 rate-limited routes.

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Mobile  │ │   Web    │ │  Admin   │ │  Creator    │ │
│  │ (Expo)  │ │ (Next.js)│ │ (NestJS) │ │  Portal     │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       └───────────┴────────────┴───────────────┘         │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP
┌─────────────────────────┴───────────────────────────────┐
│                   API GATEWAY (3013)                      │
│  JWT Auth │ CSRF │ Rate Limit │ Circuit Breaker │ Proxy  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP (x-user-* headers)
┌─────────────────────────┴───────────────────────────────┐
│               MICROSERVICES (27 services)                 │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌─────────┐ │
│  │   Core   │ │ Engagement│ │ Intelligence│ │Operations│ │
│  │ 7 svcs   │ │  6 svcs   │ │   2 svcs   │ │  3 svcs │ │
│  └──────────┘ └───────────┘ └────────────┘ └─────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Universe Services (8 services)            │ │
│  │ reality│movie│comedy│games│sports│lifestyle│vert│cre│ │
│  └────────────────────────────────────────────────────┘ │
└──────┬──────────────────────┬──────────────────────┬────┘
       │                      │                      │
┌──────┴──────┐  ┌────────────┴──────────┐  ┌───────┴──────┐
│ PostgreSQL  │  │        Redis          │  │   AWS S3     │
│ 28 databases│  │ Cache│Queue│Sessions  │  │ Media Storage│
│ PgBouncer   │  │                         │  │              │
└─────────────┘  └────────────────────────┘  └──────────────┘
```

### Monorepo Structure

- **Workspace:** `pnpm-workspace.yaml` with globs `services/*/*`, `apps/*`, `packages/*`
- **Package Manager:** pnpm 10.33.2 with `shamefully-hoist=true`
- **Node:** 22.16.0 (.nvmrc) / 20.16.0 (.node-version) — **mismatch noted**
- **TypeScript:** 5.8.4, strict mode, ES2022 target, Node16 module resolution

---

## 2. TECHNOLOGY STACK

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | NestJS | ^11.1.27 |
| ORM | Prisma | ^6.19.3 |
| Auth | Passport + JWT | ^11.0.5 |
| Validation | class-validator + Zod | — |
| Queue | BullMQ + Redis | — |
| API Docs | Swagger | ^11.4.4 |
| Health | Terminus | ^11.0.0 |
| Events | EventEmitter | ^3.1.0 |
| Cron | Schedule | ^6.1.3 |
| Cache | cache-manager | ^3.0.0 |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Web | Next.js (App Router) | ^15.0.0 |
| React | React | ^19.2.7 |
| Mobile | React Native / Expo | 0.86.0 / ~56.0.12 |
| State | Zustand + React Query | ^5.0.14 / ^5.101.0 |
| Styling | Tailwind CSS | ^4.3.1 |
| Animation | Framer Motion | ^12.41.0 |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL 15 (28 instances) |
| Cache | Redis 7+ |
| Connection Pool | PgBouncer |
| Container | Docker (multi-stage) |
| Process Mgr | Supervisord (9 phases) |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions (10 workflows) |
| PaaS | Coolify / Nixpacks |
| IaC | Terraform |
| Monitoring | OpenTelemetry |

---

## 3. SERVICE ARCHITECTURE (27 Services)

### Core Services (7)

| Service | Port | Database | Key Features |
|---------|------|----------|--------------|
| auth-service | 3000 | azeebo_auth | JWT, MFA (TOTP), OTP, Social auth (Google/Apple), Device management, Account lockout |
| user-service | 3001 | azeebo_user | Profile CRUD, Preferences, Watch history, Saved items, Following, Universe affinity |
| wallet-service | 3002 | azeebo_wallet | Triple-balance (main/bonus/promo), Transfers, Withdrawals, Balance snapshots, Idempotent operations |
| payment-service | 3003 | azeebo_payment | Paystack + Flutterwave, Webhooks (HMAC verification), Refunds, Retry queue, Distributed locks |
| content-service | 3004 | azeebo_content | Content CRUD, Multi-tier access (basic/standard/premium), Rentals, Passes, Screenings, Transcoding |
| search-service | 3005 | azeebo_search | Universal search, Faceted filtering, Autocomplete, Trending searches, Ranking rules |
| media-service | 3019 | azeebo_media | S3 upload, MIME validation, Presigned URLs, Transcoding, CDN support, Premium content URLs |

### Engagement Services (6)

| Service | Port | Key Features |
|---------|------|--------------|
| notification-service | 3006 | Multi-channel (Push/Email/SMS), Firebase, SendGrid, Twilio, Templates, Campaigns |
| reward-service | 3007 | Points system, Streaks, Daily check-in, Levels, Badges, Missions, Redemption |
| engagement-service | 3023 | Leaderboard, Rankings, Predictions |
| messaging-service | 3024 | Direct/Group conversations, Read tracking |
| referral-service | 3025 | Referral codes (AZB-XXXXXXXX), Completion tracking, Config-driven rewards |
| subscription-service | 3026 | Plans, Subscriptions, Auto-renew |

### Intelligence Services (2)

| Service | Port | Key Features |
|---------|------|--------------|
| analytics-service | 3008 | Event ingestion (68+ event types), Funnels, Cohorts, A/B experiments, Churn prediction, Fraud detection, Custom reports, Prometheus metrics |
| recommendation-service | 3009 | Content scoring, Cross-universe diversity, User segments, Creator tiers, Monetization insights, Personalized feeds |

### Universe Services (8)

| Service | Port | Key Features |
|---------|------|--------------|
| reality-service | 3010 | Shows/Episodes/Contestants, Voting (free/paid/supervote), Premium extras, Fraud detection |
| movie-service | 3011 | Movie catalog, Viewing windows, Cinema passes, Filmmaker crowdfunding, Rentals |
| comedy-service | 3012 | Clips, Comedians, Series, Challenges, Trending |
| games-service | 3014 | Game catalog, Tournaments, Game sessions, Questions/Answers |
| lifestyle-service | 3016 | Celebrity/Influencer profiles, Music, City guides, Nightlife, Quizzes, Polls, Challenges |
| vertical-service | 3017 | Universe maps, Characters, Timelines, Crossovers, Lore, Chapters, Recaps |
| creator-service | 3018 | Creator profiles, Earnings, Payouts, Verification, Tipping, Subscriptions |
| sports-service | 3021 | Fixtures, Fan boards, Contests, Prediction markets, Highlights |

### Operations Services (3)

| Service | Port | Key Features |
|---------|------|--------------|
| queue-service | 3015 | BullMQ workers (notifications, payments, emails), Job ledger, Dead letter queue |
| support-service | 3020 | Tickets, Refunds, Chargebacks, Appeals, Takedowns, Payout disputes, Suspensions |
| moderation-service | 3022 | Reports, Safety scanning, Trust scores, Appeals, Reviewer assignment, Audit trail |

### Gateway (1)

| Service | Port | Key Features |
|---------|------|--------------|
| api-gateway | 3013 | JWT extraction, CSRF (Double Submit Cookie), Circuit breaker (5 failures/60s reset), Rate limiting (1000/60s global, 10/60s auth), Proxy to 26+ routes |

---

## 4. SHARED PACKAGES (18)

| Package | Purpose |
|---------|---------|
| `@azeebo/shared-types` | 704-line type definitions: 50+ interfaces, ApiResponse\<T\>, CircuitBreaker, API versioning, Pricing defaults, Environment validation (Zod), GDPR data classification |
| `@azeebo/shared-services` | 7 NestJS modules: PrismaModule, RedisModule, CacheModule, AuditModule, AnalyticsModule, SanitizeModule, PaginationModule, AuthModule, ApiVersioningModule, Middleware |
| `@azeebo/security` | 5 guards (Admin, ServiceAuth, Permissions, Idempotency, RateLimit), CORS config, Helmet config, Request ID middleware |
| `@azeebo/validation` | 5 validators (@IsStrongPassword, @IsValidEmail, @IsValidPhone, @IsValidUsername, @IsValidUrl), HTML sanitization interceptor |
| `@azeebo/error-handling` | RFC 7807 error responses, GlobalExceptionFilter, 8 custom error types |
| `@azeebo/logger` | StructuredLogger, LoggingInterceptor, ResponseWrapperInterceptor, ResponseSanitizationInterceptor, DistributedTracingInterceptor |
| `@azeebo/api-client` | Axios wrapper with idempotency, retry (exponential backoff+jitter), token management |
| `@azeebo/internal-clients` | 7 inter-service HTTP clients with retry, idempotency |
| `@azeebo/utils` | Currency formatting, HTML sanitization, debounce/throttle, retry, JWT parsing |
| `@azeebo/observability` | Metrics (Prometheus-like), Health checks (DB/Redis/External), Tracing, Anomaly detection (8 rules), SRE error budgets (5 SLIs) |
| `@azeebo/opentelemetry` | NodeSDK setup, HTTP/Express/Prisma instrumentations, OTLP exporter |
| `@azeebo/feature-flags` | Redis-backed feature flags with percentage rollout, user targeting |
| `@azeebo/analytics-sdk` | Client-side event batching, 30+ pre-built event methods |
| `@azeebo/auth` | Centralized auth client with auto-refresh, deduplication, pluggable storage |
| `@azeebo/design-tokens` | Colors (8 universe colors), Spacing, Typography, Shadows, Animations, Dark/Light themes, CSS variable generation |
| `@azeebo/ui` | React + React Native components, 12+ hooks, State components |
| `@azeebo/contract-tests` | Pact V4 contract tests (Wallet API) |
| `@azeebo/test-utils` | Test database, Mock services, JWT generators, Integration test environment |

---

## 5. DATABASE ARCHITECTURE

### Per-Service Isolation

Each of the 27 services has its own PostgreSQL database, Prisma schema, and database user. This enforces service boundary isolation — no cross-service database queries.

**28 Databases:**

`azeebo_auth`, `azeebo_user`, `azeebo_wallet`, `azeebo_payment`, `azeebo_content`, `azeebo_search`, `azeebo_media`, `azeebo_notification`, `azeebo_reward`, `azeebo_analytics`, `azeebo_recommendation`, `azeebo_reality`, `azeebo_movie`, `azeebo_comedy`, `azeebo_games`, `azeebo_sports`, `azeebo_lifestyle`, `azeebo_vertical`, `azeebo_creator`, `azeebo_queue`, `azeebo_support`, `azeebo_moderation`, `azeebo_engagement`, `azeebo_messaging`, `azeebo_referral`, `azeebo_subscription`, `azeebo_admin`, `azeebo_creator_portal`

### Model Counts

| Category | Services | Total Models |
|----------|----------|-------------|
| Core | auth, user, content, payment, wallet, search | 67 |
| Engagement | messaging, subscription, engagement, reward, notification, referral | 36 |
| Intelligence | analytics, recommendation | 53 |
| Operations | queue, moderation, support | 41 |
| Universes | sports, reality, comedy, movie, games, creator, vertical, lifestyle | 189 |
| Shared | shared-services | 1 |
| Apps | admin, creator-portal | 31 |
| **Total** | | **~418** |

### Key Schema Patterns

- **CUIDs** for payment IDs, UUIDs elsewhere
- **Soft deletes** via status fields (content, moderation)
- **Idempotency keys** on financial operations
- **Composite unique constraints** for deduplication
- **JSON metadata fields** for flexible data
- **Audit trails** in every service

---

## 6. DATA FLOW

### Authentication Flow

```
Client -> API Gateway (JWT validation, CSRF check)
       -> Auth Service (bcrypt compare, token generation)
       -> Redis (session storage, JTI blacklist)
       -> Downstream services receive x-user-id/email/role headers
```

### Payment Flow

```
Client -> Gateway -> Payment Service -> Paystack/Flutterwave API
      -> Webhook -> Payment Service (HMAC verify, idempotent processing)
      -> Wallet Service (HTTP debit/credit, atomic transaction)
      -> Analytics Service (event tracking)
```

### Content Publishing Flow

```
Creator -> Gateway -> Content Service (create/update)
      -> Media Service (S3 upload, transcoding)
      -> Moderation Service (safety scan)
      -> Analytics Service (event tracking)
```

### Notification Flow

```
Service -> Queue Service (BullMQ job)
      -> Notification Service -> Firebase (push) / SendGrid (email) / Twilio (SMS)
      -> Delivery attempts logged to database
```

---

## 7. SECURITY ANALYSIS

### Strengths

- **JWT validation** at gateway + service level
- **CSRF protection** (Double Submit Cookie pattern)
- **Rate limiting** on 91+ endpoints with IP blocking (10 violations = 1hr block)
- **CORS** explicitly blocks wildcard origins
- **HMAC webhook verification** (HMAC-SHA512 Paystack, HMAC-SHA256 Flutterwave)
- **Idempotency keys** on all financial operations
- **Distributed locks** (Redis setIfNotExists) preventing double-crediting
- **Circuit breakers** on all external integrations
- **Input validation** (whitelist, forbidNonWhitelisted, transform)
- **SQL injection prevention** (Prisma parameterized queries)
- **No eval()/Function()** usage
- **.env files properly gitignored**
- **CI security scanning** (gitleaks, Trivy, OWASP ZAP, pnpm audit)
- **Response sanitization** (passwords, tokens, secrets stripped from responses)
- **HTML sanitization** (stripAllHtml, sanitizeHtml for XSS prevention)

### Issues Found

| Severity | Issue | Location |
|----------|-------|----------|
| **CRITICAL** | Placeholder JWT secrets in service `.env` files | All 27 service `.env` files |
| **HIGH** | `logs.txt` tracked by git (contains SQL queries, route mappings) | Root `logs.txt` |
| **MEDIUM** | Node version mismatch: `.nvmrc` (22.16.0) vs `.node-version` (20.16.0) | Root config files |
| **MEDIUM** | 18 deprecated transitive dependencies (glob, rimraf, uuid, abab) | `pnpm-lock.yaml` |
| **LOW** | 1 TODO in wallet withdraw (missing bank verification API) | `apps/mobile/app/(tabs)/wallet/withdraw.tsx:94` |
| **LOW** | Analytics SDK logs full event payloads to console | `packages/analytics-sdk/src/index.ts:49` |

---

## 8. DEPLOYMENT ARCHITECTURE

### Two Deployment Modes

**1. Local Development (`local-dev.sh`)**

- Direct Node.js processes with hot-reload
- Per-service PostgreSQL databases
- Interactive menu (setup/start/stop/restart/status/logs/db)
- `--quick` mode: core + gateway + web only

**2. Docker All-in-One**

- Single container (12GB RAM, 4 CPUs)
- Supervisord managing 30+ processes in 9 priority phases:

| Phase | Priority | Services |
|-------|----------|----------|
| 1 | 10 | PostgreSQL, Redis, PgBouncer, Nginx |
| 2 | 20 | auth, user |
| 3 | 30 | wallet, payment, content, search, media |
| 4 | 40 | notification, reward, engagement, messaging, referral, subscription |
| 5 | 42 | analytics, recommendation |
| 6 | 44 | reality, movie, comedy, games, sports, lifestyle, vertical, creator |
| 7 | 46 | queue, support, moderation |
| 8 | 50 | api-gateway |
| 9 | 60 | web, admin, creator-portal |

### CI/CD Pipeline (10 Workflows)

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Full CI: lint, typecheck, unit/integration tests, build, Docker smoke tests, security audit, migration validation |
| `cd.yml` | K8s deployment: Docker build, cosign signing, SBOM, SLSA provenance, staging -> production with approval gates |
| `cd-all-in-one.yml` | All-in-one container build + push to GHCR |
| `pr-checks.yml` | PR validation: semantic title, lint, test, security scans (gitleaks + Trivy) |
| `database-backup.yml` | Daily encrypted backups to S3 with 30-day retention |
| `deployment-approval.yml` | Manual approval gates with audit trail |
| `rollback.yml` | Service rollback to specific Docker tags |
| `secret-rotation.yml` | Monthly AWS Secrets Manager rotation |
| `security-scan.yml` | Dependency audit, OWASP ZAP, Docker image scan |
| `terraform.yml` | Infrastructure as code (plan on PR, apply on merge) |

---

## 9. TECHNICAL DEBT INVENTORY

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Placeholder JWT secrets in service `.env` files | Critical | Security risk if deployed without env override |
| 2 | `logs.txt` tracked in git | High | Leaks SQL queries, route mappings |
| 3 | Node version mismatch (.nvmrc 22.16.0 vs .node-version 20.16.0) | Medium | Potential runtime inconsistency |
| 4 | 18 deprecated transitive dependencies | Medium | Security/compatibility risk |
| 5 | Missing bank verification API in wallet withdraw | Low | Incomplete feature |
| 6 | Analytics SDK verbose console logging | Low | Performance/log noise |
| 7 | 7 `eslint-disable` directives (legitimate) | Low | Acceptable |

---

## 10. PERFORMANCE CHARACTERISTICS

### Caching Strategy

- **Redis** for sessions, feature flags, rate limiting, analytics event buffers
- **CacheModule** with configurable TTL (default 300s) + pattern invalidation
- **@Cache() decorator** for controller-level response caching
- **Per-route TTLs:** Featured (600s), Home feed (300s), Recommended (1800s)

### Database Performance

- **PgBouncer** transaction pooling (1000 max clients, 20 pool size)
- **Indexes** on all query-heavy columns (userId, contentId, status, timestamps)
- **Composite unique constraints** for deduplication without separate indexes
- **Connection pooling** via Prisma's built-in pool + PgBouncer

### API Performance

- **Circuit breakers:** 5 failure threshold, 60s reset, exponential backoff retry
- **Rate limiting:** 1000 req/60s global, 10 req/60s auth-specific
- **Compression:** Nginx gzip enabled
- **Response caching:** Redis-backed with 60-1800s TTLs

---

## 11. TESTING STRATEGY

| Type | Framework | Coverage |
|------|-----------|----------|
| Unit Tests | Jest ^30.4.2 | Per-service `*.spec.ts` files |
| Integration Tests | Jest + Prisma + Redis | `*.integration.spec.ts` |
| Contract Tests | Pact V4 | `packages/contract-tests/` |
| E2E Tests (Web) | Playwright | `apps/web/e2e/` |
| E2E Tests (Mobile) | Detox | `apps/mobile/e2e/` |
| Accessibility | @axe-core/playwright | `apps/web/e2e/accessibility.spec.ts` |
| Mutation Testing | Stryker | auth, payment, wallet services |
| API Tests (Web) | Vitest | `apps/web/src/lib/api/__tests__/` (18 files) |

---

## 12. KEY FILE REFERENCE

| File | Path | Purpose |
|------|------|---------|
| Root package.json | `/package.json` | Monorepo scripts, dependencies |
| Workspace config | `/pnpm-workspace.yaml` | Workspace globs, version overrides |
| TypeScript config | `/tsconfig.json` | Path aliases, compiler options |
| ESLint config | `/eslint.config.js` | Flat config, naming conventions |
| Environment template | `/.env.example` | All required env vars |
| Docker all-in-one | `/Dockerfile.all-in-one` | Two-stage Docker build |
| Supervisord | `/supervisord.conf` | 9-phase process management |
| Nginx | `/nginx.conf` | Reverse proxy, SSL, WebSocket |
| Entrypoint | `/entrypoint.sh` | Container initialization |
| Local dev script | `/scripts/local-dev.sh` | Development runner |
| Build script | `/scripts/build-all.sh` | Full build pipeline |
| Coolify init SQL | `/coolify-init.sql` | 28 database creation |
| Gateway routes | `/services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts` | 26+ route definitions |
| Auth service | `/services/core/auth-service/src/modules/auth/auth.service.ts` | JWT, MFA, OTP, Social |
| Wallet service | `/services/core/wallet-service/src/modules/wallet/wallet.service.ts` | Triple-balance, transfers |
| Payment service | `/services/core/payment-service/src/modules/payments/payments.service.ts` | Paystack/Flutterwave |
| Content service | `/services/core/content-service/src/modules/content/content.service.ts` | Content CRUD, access control |
| Analytics service | `/services/intelligence/analytics-service/src/` | Event processing, funnels, cohorts |
| Shared types | `/packages/shared-types/src/index.ts` | All interfaces and enums |
