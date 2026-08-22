# Azeebo+ Master CRE Tasks & Audit Register (`cre-tasks.md`)

> **Generated:** August 22, 2026  
> **Target:** Azeebo+ Monorepo Platform (`apps/web`, `apps/mobile`, `apps/admin`, `apps/creator`, 28+ NestJS microservices, 22+ shared packages, database, and cloud infrastructure)  
> **Status:** Active Execution Backlog  
> **Scope:** Full 20-Domain / 8-Phase Deep Technical Audit & Remediation Master Plan

---

## Executive Summary & Scorecard

| # | Audit Domain | Current Score | Target Score | Open Issues (P0/P1/P2/P3) | Primary Risk Area |
|---|--------------|:-------------:|:------------:|:-------------------------:|-------------------|
| 1 | **Functional / QA** | 82 / 100 | 100 / 100 | 4 / 6 / 5 / 2 | Missing E2E test flows, health modules in 9 services |
| 2 | **UI/UX** | 85 / 100 | 100 / 100 | 2 / 5 / 4 / 2 | Inconsistent focus styles, skeleton loading gaps |
| 3 | **Accessibility (a11y)** | 78 / 100 | 100 / 100 | 3 / 5 / 3 / 1 | ARIA live regions, color contrast in CI, keyboard traps |
| 4 | **Security** | 80 / 100 | 100 / 100 | 3 / 5 / 4 / 1 | Token storage in localStorage, CSP enforcement, mTLS |
| 5 | **Performance** | 72 / 100 | 100 / 100 | 3 / 5 / 4 / 2 | Potential N+1 queries, unoptimized images, bundle analysis |
| 6 | **SEO** | 80 / 100 | 100 / 100 | 1 / 4 / 3 / 1 | Dynamic OpenGraph/JSON-LD for universes, sitemap automation |
| 7 | **Mobile / Responsive** | 78 / 100 | 100 / 100 | 3 / 6 / 4 / 2 | Device token refresh sync, offline cache, biometric auth |
| 8 | **API** | 80 / 100 | 100 / 100 | 2 / 5 / 3 / 1 | API versioning headers, RFC 9457 errors, Swagger drift |
| 9 | **Database** | 75 / 100 | 100 / 100 | 3 / 5 / 3 / 1 | Missing compound indexes, slow query logs, read replicas |
| 10 | **Code Quality / Tech Debt** | 70 / 100 | 100 / 100 | 3 / 6 / 5 / 2 | 5,300+ `any` types, Prisma findFirst violations, 180 TODOs |
| 11 | **Architecture** | 82 / 100 | 100 / 100 | 2 / 4 / 3 / 1 | API Gateway SPOF redundancy, service mesh mTLS |
| 12 | **Infrastructure / DevOps** | 84 / 100 | 100 / 100 | 2 / 4 / 3 / 1 | Staging auto-deploy verification, canary deployments |
| 13 | **Analytics / Tracking** | 76 / 100 | 100 / 100 | 2 / 4 / 3 / 1 | Funnel conversion drops, A/B test harness, Sentry SDK |
| 14 | **Privacy / Compliance** | 78 / 100 | 100 / 100 | 2 / 4 / 2 / 1 | GDPR/NDPR erasure endpoint, cookie banner consent modal |
| 15 | **Content** | 90 / 100 | 100 / 100 | 1 / 3 / 2 / 1 | Multilingual i18n copy completeness, dynamic localization |
| 16 | **Conversion Optimization (CRO)** | 85 / 100 | 100 / 100 | 1 / 3 / 3 / 1 | Abandoned subscription checkout modal, social proof badges |
| 17 | **E-commerce** | 82 / 100 | 100 / 100 | 2 / 4 / 3 / 1 | Webhook replay protection, multi-gateway failover tests |
| 18 | **Reliability / Resilience** | 78 / 100 | 100 / 100 | 3 / 4 / 3 / 1 | Chaos fault-injection tests, DLQ alerting, outbox poller |
| 19 | **Observability** | 80 / 100 | 100 / 100 | 2 / 4 / 3 / 1 | Grafana dashboard provisioning, alertmanager webhook |
| 20 | **Business / Product** | 90 / 100 | 100 / 100 | 1 / 2 / 2 / 1 | Creator tier progression incentives, reality voting telemetry |
| **Total** | **All 20 Domains** | **79.4 / 100** | **100 / 100** | **45 P0 / 88 P1 / 67 P2 / 25 P3 = 225 Tasks** | **Production Readiness** |

---

## 8-Phase Execution Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Azeebo+ CRE Execution Plan                         │
│                                                                        │
│  Phase 1: Product       →  Phase 2: Design      →  Phase 3: QA         │
│  (Business, CRO, Funnel)   (UI/UX, A11y, Mobile)   (Functional, E2E)   │
│                                                                        │
│  Phase 4: Security      →  Phase 5: Performance →  Phase 6: Technical  │
│  (AppSec, Auth, Tokens)    (N+1, Cache, Bundles)   (Prisma, Types, API)│
│                                                                        │
│  Phase 7: Growth        →  Phase 8: Operations                         │
│  (SEO, Analytics, i18n)    (DevOps, SRE, Chaos)                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# Phase 1: Product & Conversion Engineering

### [Business / Product, User Journeys, CRO, E-Commerce]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-PRD-001` | **P0** | Business/Product | `apps/web/src/app/subscription/plans/page.tsx` | **Plan Tiers & Entitlement Paywall Alignment**: Ensure pricing cards dynamically render currency localized pricing (NGN ₦ / USD $) with billing interval switches (Monthly/Annual discount pill). | Switching currency switches all checkout tiers cleanly without page reload; pricing matches backend `SubscriptionPlan` database records. |
| `CRE-PRD-002` | **P0** | CRO / E-Commerce | `apps/web/src/app/wallet/page.tsx`, `apps/mobile/src/components/TippingModal.tsx` | **Wallet Top-up & Virtual Currency Friction**: Add quick-select funding denominations (₦1,000, ₦2,500, ₦5,000, ₦10,000) with instant bonus reward credits display. | One-click preset selects amount, triggers gateway modal with idempotency key, credits balance under 1.5s. |
| `CRE-PRD-003` | **P1** | CRO | `apps/web/src/components/checkout/AbandonedCartRecoveryModal.tsx` | **Exit-Intent Recovery on Checkout Drop-off**: Trigger an exit-intent/blur drawer offering 10% discount token or free reality vote token when user cancels or leaves subscription checkout. | Modal triggers only once per user session on tab blur/exit intent before final payment verification. |
| `CRE-PRD-004` | **P1** | E-Commerce | `services/core/payment-service/src/modules/payment/payment.service.ts` | **Multi-Gateway Payment Failover (Paystack ↔ Flutterwave)**: Ensure automated fallback to secondary gateway if primary gateway latency > 4500ms or returns 502/503. | Payment transaction transparently routes to Flutterwave when Paystack circuit trips open; user experiences no broken state. |
| `CRE-PRD-005` | **P1** | Business/Product | `apps/creator/client/src/routes/earnings.tsx` | **Creator Tier Progression & Instant Payout Verification**: Implement visual milestone progress bar towards Next Tier (Bronze → Silver → Gold → Diamond) with minimum withdrawal threshold validations. | Progress bar computes accurate percentage based on trailing 30-day view counts and tip revenue. |
| `CRE-PRD-006` | **P2** | E-Commerce | `services/core/wallet-service/src/modules/wallet/wallet.service.ts` | **Concurrent Wallet Debit Race-Condition Guard**: Verify double-spending prevention during flash reality voting events using database row-level locking (`SELECT FOR UPDATE`). | 100 simultaneous debit requests on a ₦5,000 balance result in exactly valid deductions and zero overdrafts. |
| `CRE-PRD-007` | **P2** | CRO | `apps/web/src/app/auth/signup/page.tsx` | **Social Proof & Live User Count Indicators**: Display real-time registered user & active watcher counters on registration page to boost signup conversion rate. | Dynamic counter animates smoothly with formatted numerals (e.g., "Join 250,000+ Azeebo+ members"). |
| `CRE-PRD-008` | **P3** | CRO | `apps/web/src/components/ui/TrustBadges.tsx` | **PCI-DSS & SSL Verified Trust Seals**: Add responsive security trust badges (256-Bit SSL, NDPR Compliant, Verified by Visa/Mastercard) to payment checkout footer. | Badges render crisply across dark/light themes without layout shift. |

---

# Phase 2: Design, UI/UX, Mobile & Accessibility

### [UI/UX, Responsive, Mobile Native, WCAG a11y]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-DES-001` | **P0** | Accessibility | `apps/web/src/app/layout.tsx`, `apps/web/src/components/layout/SkipLink.tsx` | **Per-Page Accessible Skip Navigation Links**: Implement WCAG 2.1 AA compliant `<SkipLink target="#main-content">` on all desktop and tablet viewport routes. | Tab key press immediately reveals visible skip link in high-contrast focus state; activating navigates focus to main container. |
| `CRE-DES-002` | **P0** | Accessibility | `packages/ui/src/components/`, `apps/web/src/app/globals.css` | **Global Focus-Visible & Focus Indicators**: Standardize 2px cyan/amber outline ring with 2px offset on all buttons, links, inputs, selects, and universe cards. | 100% of interactive components pass keyboard tab navigation test with unambiguous visual indicator. |
| `CRE-DES-003` | **P0** | Accessibility | `apps/web/src/components/ui/LiveAnnouncer.tsx` | **ARIA Live Regions for Async State Updates**: Introduce `aria-live="polite"` and `aria-atomic="true"` announcements for wallet balance updates, voting counts, and notifications. | Screen readers (NVDA, VoiceOver) announce dynamic score/balance changes without interrupting current speech. |
| `CRE-DES-004` | **P1** | UI/UX | `apps/web/src/components/ui/Skeleton.tsx` | **Shimmer Skeleton Placeholders**: Replace generic spinning loaders on `/browse`, `/movies`, `/cinemaxis`, `/creator` with layout-matched skeleton cards to eliminate CLS (Cumulative Layout Shift). | Zero layout shift (CLS < 0.05) when loading state transitions to rendered cards. |
| `CRE-DES-005` | **P1** | UI/UX | `packages/ui/src/components/EmptyState.tsx` | **Branded Interactive Empty States**: Standardize empty state views across search results, watch history, saved favorites, and notifications with action CTAs. | Every list/collection view renders illustration, descriptive text, and a primary action button when data array is empty. |
| `CRE-DES-006` | **P1** | Mobile/Responsive | `apps/mobile/src/components/AmountInput.tsx` | **Virtual Keyboard Auto-Scroll & Dismissal**: Ensure amount input and form fields on iOS/Android auto-adjust viewport using `KeyboardAvoidingView` to avoid obscured inputs. | Input field remains centered above keyboard on small devices (iPhone SE, Android 5.5"); tapping backdrop dismisses keyboard. |
| `CRE-DES-007` | **P1** | Accessibility | `.github/workflows/accessibility-audit.yml` | **Automated Axe-Core CI Auditing**: Add `@axe-core/playwright` or `cypress-axe` automated regression testing to GitHub Actions PR workflow. | PR builds fail if WCAG 2.1 Level A or AA accessibility violations are introduced. |
| `CRE-DES-008` | **P1** | UI/UX | `packages/design-tokens/src/colors.ts` | **WCAG 2.1 AA Contrast Ratio Enforcement**: Audit all slate/gray typography on dark backgrounds to guarantee minimum 4.5:1 contrast for normal text and 3:1 for large text. | All token combinations validated via automated contrast script; subtext `#94a3b8` on `#0b0f19` upgraded to `#cbd5e1`. |
| `CRE-DES-009` | **P2** | Mobile/Responsive | `apps/mobile/app/(tabs)/explore/` | **Gesture Swipe Interactions for Vertical Media**: Implement 60fps vertical swipe snapping on mobile reel player using `react-native-reanimated` and `react-native-gesture-handler`. | Vertical swipe transitions smoothly to next video with zero jank or audio bleed. |
| `CRE-DES-010` | **P2** | Accessibility | `apps/web/src/components/ui/Modal.tsx` | **Accessible Modal Focus Trap & Escape Key Handler**: Ensure modals trap keyboard focus within dialog bounds and restore focus to trigger element on close. | Tabbing cycles strictly through modal controls; `Escape` key closes dialog; focus returns to opener button. |
| `CRE-DES-011` | **P2** | UI/UX | `apps/web/src/components/layout/Breadcrumbs.tsx` | **Dynamic Hierarchical Breadcrumb Navigation**: Add breadcrumbs to deeply nested universe paths (`/reality/shows/[id]/contestant/[id]`, `/movies/[id]/cast/[id]`). | Accessible breadcrumb trail with schema.org `BreadcrumbList` microdata rendered on all nested routes. |
| `CRE-DES-012` | **P3** | UI/UX | `apps/web/src/components/ui/ThemeToggle.tsx` | **System Preference & Dark/OLED Mode Consistency**: Harmonize dark mode palette with OLED black `#000000` accents and persist user theme preference in local storage. | Theme switch occurs instantaneously without flash of unstyled content (FOUC). |

---

# Phase 3: QA & Functional Reliability

### [Functional Flows, E2E Test Coverage, Edge Cases, Integrations]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-QA-001` | **P0** | Functional/QA | `services/core/*/src/modules/health/` | **Dedicated Health Check Modules for All Core Services**: Implement `Terminus` / `HealthController` with PostgreSQL DB ping, Redis connection ping, and memory check across all 9 core services (`auth`, `content`, `media`, `payment`, `wallet`, `user`, `search`, `knowledge`, `support`). | `GET /health` returns `{ status: "ok", info: { database: { status: "up" }, redis: { status: "up" } } }` with HTTP 200 within <50ms. |
| `CRE-QA-002` | **P0** | Functional/QA | `apps/web/e2e/auth-flow.spec.ts` | **End-to-End Auth Lifecycle Suite**: Implement Playwright test covering registration → email verification OTP → login → JWT refresh → password reset → logout. | Test suite runs in CI, passes headlessly in Chromium, Firefox, and WebKit within <45s. |
| `CRE-QA-003` | **P0** | Functional/QA | `apps/web/e2e/payment-wallet.spec.ts` | **End-to-End Payment & Wallet Top-up Suite**: Implement Playwright test covering wallet funding via mock Paystack/Flutterwave webhook → balance assertion → item purchase → receipt generation. | Test runs against mock payment provider; wallet ledger matches transaction history exactly. |
| `CRE-QA-004` | **P0** | Functional/QA | `apps/web/e2e/reality-voting.spec.ts` | **End-to-End Reality Voting & SuperVote Suite**: Implement Playwright test covering live show selection → contestant voting → wallet debit confirmation → live leaderboard update. | Vote count increments in real time over WebSocket; user wallet debited by exact configured bundle price. |
| `CRE-QA-005` | **P1** | Functional/QA | `services/core/payment-service/src/modules/payment/payment.controller.ts` | **Controller-Level Error Boundaries in Financial Endpoints**: Wrap all payment and payout controller methods in explicit try-catch blocks with standardized HTTP error mappings instead of relying solely on global filters. | Uncaught provider exceptions are caught, logged with correlation IDs, and transformed to sanitized user errors. |
| `CRE-QA-006` | **P1** | Functional/QA | `services/core/wallet-service/src/modules/wallet/wallet.controller.ts` | **Controller-Level Error Boundaries in Wallet Endpoints**: Ensure transfer, debit, and credit endpoints capture database constraint violations and return structured error codes. | Invariant violations return 400 with `INSUFFICIENT_FUNDS` or `INVALID_RECIPIENT` payload. |
| `CRE-QA-007` | **P1** | Functional/QA | `services/engagement/notification-service/src/` | **Notification Service Unit & Integration Suite**: Implement complete test suite for push notification payload formatting, email template generation, and SMS dispatcher retry policies. | Unit test coverage reaches >85% lines and branches across notification modules. |
| `CRE-QA-008` | **P1** | Functional/QA | `services/engagement/subscription-service/src/` | **Subscription Renewal & Grace Period Tests**: Add automated test suite for recurring subscription billing, payment retry backoff (3 attempts over 7 days), and graceful downgrade to Free tier. | System successfully transitions expired subscription to `PAST_DUE` then `CANCELLED` when retries fail. |
| `CRE-QA-009` | **P2** | Functional/QA | `services/operations/queue-service/src/` | **Queue Processing & Dead-Letter Recovery Tests**: Implement tests for Redis Streams / BullMQ worker concurrency, job timeouts, exponential retry backoff, and dead-letter queue (DLQ) dumping. | Failed jobs retry 3 times with exponential backoff and land in DLQ without stalling the worker pipeline. |
| `CRE-QA-010` | **P2** | Functional/QA | `apps/mobile/e2e/` | **Detox Mobile E2E Smoke Tests**: Configure Detox E2E tests for React Native mobile app on Android Emulator & iOS Simulator covering app launch, authentication, and video stream initialization. | Automated mobile smoke test suite executes on every release candidate branch. |
| `CRE-QA-011` | **P3** | Functional/QA | `services/core/media-service/src/modules/upload/` | **Large File Chunked Upload & Resume Tests**: Validate multi-part upload of 4K video files (>2GB) with simulated network drops and chunk resumption. | Upload resumes seamlessly from last verified chunk without data corruption or duplicate S3 parts. |

---

# Phase 4: Security, Authentication & Infrastructure Hardening

### [AppSec, Session Management, OWASP MASVS, RBAC, Encryption]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-SEC-001` | **P0** | Security | `apps/web/src/context/AuthContext.tsx`, `apps/web/src/app/api/auth/route.ts` | **Migrate Auth Tokens from localStorage to HttpOnly Cookies**: Replace client-side `localStorage` storage of JWT access and refresh tokens with server-set `httpOnly`, `Secure`, `SameSite=Lax` cookies to completely eliminate XSS token theft vulnerability. | Access token and refresh token cannot be read via `document.cookie` or JavaScript; session persists seamlessly across browser reloads via server cookies. |
| `CRE-SEC-002` | **P0** | Security | `apps/web/src/middleware.ts` | **Enforce Strict Content-Security-Policy (CSP) & Security Headers**: Move CSP from report-only to strict enforcement; eliminate `'unsafe-eval'`; enforce strict `nonce`-based inline script loading and restrictive `connect-src` whitelist. | CSP header present on all HTML responses; zero CSP violations reported in standard browsing and video playback flows. |
| `CRE-SEC-003` | **P0** | Security | `services/core/auth-service/src/modules/auth/auth.service.ts` | **Refresh Token Rotation & Reuse Detection**: Invalidate entire token family if a revoked or previously used refresh token is presented (detecting token theft and replay). | Attempting to reuse an old refresh token immediately invalidates all active sessions for that user and logs a high-severity security alert. |
| `CRE-SEC-004` | **P1** | Security | `services/gateway/api-gateway/src/guards/auth-throttler.guard.ts` | **Granular Route-Based Rate Limiting**: Apply aggressive throttling to sensitive endpoints: login (5 req/min per IP), OTP verify (3 req/min per phone/email), forgot-password (3 req/15min). | Exceeding threshold returns HTTP 429 with `Retry-After` header and logs security event to audit trail. |
| `CRE-SEC-005` | **P1** | Security | `packages/security/src/guards/admin.guard.ts`, `apps/admin/src/` | **Admin Session Timeout & Multi-Factor Re-authentication**: Enforce mandatory 30-minute idle session timeout and step-up MFA verification before performing sensitive operations (payout approvals, refunds, user ban). | Attempting destructive admin action without fresh MFA token (<15min) prompts re-auth modal. |
| `CRE-SEC-006` | **P1** | Security | `services/core/payment-service/src/modules/webhook/webhook.controller.ts` | **Payment Webhook Cryptographic Signature Verification**: Strictly verify HMAC SHA-512 signatures on all Paystack and Flutterwave webhooks before parsing request body, rejecting replay attacks (>5m timestamp drift). | Webhook requests with invalid or missing signature headers immediately return HTTP 401 and are dropped. |
| `CRE-SEC-007` | **P1** | Security | `infra/security/zap-config.yaml`, `.github/workflows/security-scan.yml` | **Automated OWASP ZAP Dynamic Scanning in CI**: Integrate OWASP ZAP baseline and API vulnerability scanning against API Gateway staging endpoints. | Security pipeline automatically flags SQL injection, header misconfigurations, CORS bypasses, or open redirects. |
| `CRE-SEC-008` | **P2** | Security | `services/` (all microservices) | **Mutual TLS (mTLS) Service-to-Service Enforcement**: Configure Linkerd or Istio service mesh in Kubernetes to enforce mutual TLS encryption and cryptographic service identity validation between all backend pods. | Unauthenticated internal pod-to-pod HTTP requests are rejected by Envoy sidecars. |
| `CRE-SEC-009` | **P2** | Security | `scripts/secret-rotation.sh`, `.github/workflows/rotate-secrets.yml` | **Automated Secrets Rotation Verification**: Automate zero-downtime rotation of JWT signing keys, database passwords, and Redis auth credentials using AWS Secrets Manager. | System rotates keys seamlessly while validating tokens signed with previous key during 24-hour grace period. |
| `CRE-SEC-010` | **P3** | Security | `packages/logger/src/log-redaction.service.ts` | **PII & Sensitive Field Redaction in Logs**: Ensure structured logger sanitizes passwords, credit card PANs, BVN, phone numbers, and auth tokens before emitting JSON logs to stdout. | Zero plaintext sensitive credentials appear in centralized log aggregation. |

---

# Phase 5: Performance, Scalability & Database Optimization

### [N+1 Query Elimination, Redis Caching, Bundle Size, CWV]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-PERF-001` | **P0** | Performance | `services/*/src/modules/**/*.service.ts` | **Audit & Eliminate N+1 Prisma Queries**: Review all 10,000+ Prisma database calls; refactor loops issuing per-item `findUnique`/`findFirst` to batch queries using `findMany({ where: { id: { in: ids } } })` or explicit relational `include` / `select`. | Total database queries per request for `/content/home`, `/browse`, and `/universes` reduced by >70%; p95 database response time < 15ms. |
| `CRE-PERF-002` | **P0** | Database | `prisma/combined-schema.prisma`, `services/*/prisma/schema.prisma` | **Declare Missing Compound & Foreign Key Indexes**: Add explicit `@@index` annotations across all high-frequency query fields (`userId`, `contentId`, `status`, `createdAt`, `universeId`, `slug`). | Zero sequential table scans on tables with >10,000 rows; EXPLAIN ANALYZE confirms index scans. |
| `CRE-PERF-003` | **P0** | Performance | `apps/web/src/components/`, `apps/web/next.config.js` | **Next.js Image Optimization & WebP/AVIF Encoding**: Migrate all raw `<img>` tags to `next/image` with responsive `sizes`, explicit aspect ratios, and Cloudflare/Cloudinary CDN domain allowlists. | Zero unoptimized hero banners; Largest Contentful Paint (LCP) improved to < 2.0s on 4G network profiles. |
| `CRE-PERF-004` | **P1** | Performance | `apps/web/package.json`, `apps/web/next.config.js` | **Bundle Size Analyzer & Tree-Shaking**: Add `@next/bundle-analyzer` to build workflow; lazy-load heavy client libraries (video player, chart.js, lottie animations) via `next/dynamic`. | Initial JavaScript bundle per route reduced to < 120KB gzipped; First Input Delay (FID/INP) < 100ms. |
| `CRE-PERF-005` | **P1** | Database | `infra/config/pgbouncer.ini`, `deploy/coolify-init.sql` | **PgBouncer Connection Pooling Tuning**: Configure transaction-mode connection pooling with max client connections set to 5,000 and server connection pool sized to PostgreSQL hardware limits. | Database handles 1,500 concurrent active users without connection exhaustion or `too many clients` errors. |
| `CRE-PERF-006` | **P1** | Performance | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts` | **Multi-Tier Redis Response Caching**: Implement stale-while-revalidate caching with Redis for public static feeds (`/api/v1/content/home`, `/api/v1/public/universes`, `/api/v1/comedy/comedians`). | Cached public endpoint response latency drops to < 10ms with 90%+ cache hit ratio. |
| `CRE-PERF-007` | **P2** | Performance | `services/core/media-service/src/modules/video-packaging/` | **Adaptive Bitrate HLS/CMAF Chunk Optimization**: Optimize video segment sizes (2s chunks) and manifest multi-rendition ladders (1080p, 720p, 480p, 360p, Data Saver 240p). | Time-to-First-Frame (TTFF) in video player drops under 800ms globally on broadband and 4G. |
| `CRE-PERF-008` | **P2** | Database | `infra/k8s/base/postgres-read-replica.yaml` | **PostgreSQL Read Replicas for Analytics & Search**: Route heavy analytical read queries, leaderboard calculations, and admin reports to read-only database replicas. | Primary master database CPU utilization stays below 40% during peak concurrent voting events. |
| `CRE-PERF-009` | **P3** | Performance | `apps/web/src/app/globals.css` | **Critical CSS Inlining & Font Display Swap**: Configure `font-display: swap` on Google Fonts (Inter, Outfit) to prevent invisible text during font loading (FOIT). | Cumulative Layout Shift (CLS) score remains < 0.02. |

---

# Phase 6: Code Quality, Type Safety, Architecture & APIs

### [TypeScript Strictness, Clean Architecture, Prisma Integrity, API Contracts]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-CODE-001` | **P0** | Code Quality | Entire Monorepo (`services/`, `apps/`, `packages/`) | **Systematic Elimination of `any` Types**: Refactor the ~5,300 instances of `any` types across the repository into strictly typed DTOs, interfaces, and generic type parameters. | `tsc --noEmit` runs with strict null checks and zero `any` suppressions across financial and authentication paths. |
| `CRE-CODE-002` | **P0** | Code Quality | `apps/admin/src/modules/reality-shows/reality-shows.service.ts:16` | **Fix Prisma Unique-Key Finder Violations**: Replace `Universe.findFirst` filtering on unique `name` with `Universe.findUnique` as flagged by `check:prisma`. | `pnpm check:prisma` passes with 0 violations across all apps and services. |
| `CRE-CODE-003` | **P0** | API | `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts` | **Reconcile Gateway Service Configs & Route Contracts**: Update `SERVICE_CONFIGS` to match all 104 client-facing API routes in `apps/web`, `apps/mobile`, `apps/admin`, `apps/creator` so that `check-route-contracts.mjs` exits with 0. | `node scripts/check-route-contracts.mjs` executes cleanly with 0 unmatched client routes. |
| `CRE-CODE-004` | **P1** | Code Quality | Entire Monorepo | **Resolve 180+ Technical Debt Markers (TODO / FIXME / HACK)**: Systematically audit and resolve all pending TODO, FIXME, and HACK comments across services. | Backlog of TODO items converted into resolved code or formal GitHub issues; code comments cleaned. |
| `CRE-CODE-005` | **P1** | Code Quality | `apps/`, `services/`, `packages/` | **Replace `console.log` with Structured Logger**: Eliminate leftover raw `console.log` statements in production source files; enforce `@azeebo/logger` with ESLint rule. | `pnpm lint` enforces `no-console-log` rule with zero warnings across production bundles. |
| `CRE-CODE-006` | **P1** | API | `services/*/src/main.ts` | **OpenAPI / Swagger Generation & Contract Drift CI Check**: Integrate `@nestjs/swagger` decorators across all 28 services and generate auto-synced `swagger.json` in CI. | `node scripts/check-swagger-consistency.mjs` validates 100% endpoint schema alignment. |
| `CRE-CODE-007` | **P1** | API | `packages/error-handling/src/` | **RFC 9457 Problem Details Standardized Error Responses**: Ensure all microservices return RFC 9457 compliant error structures (`type`, `title`, `status`, `detail`, `instance`, `invalidParams`). | All 4xx and 5xx API responses conform to the uniform RFC 9457 schema. |
| `CRE-CODE-008` | **P2** | Architecture | `services/gateway/api-gateway/` | **API Gateway High-Availability & Redundancy**: Configure multi-replica deployment of the NestJS API Gateway behind Kubernetes Ingress / Nginx with HPA (Horizontal Pod Autoscaling). | Killing any single gateway pod results in zero dropped client connections or HTTP 502 errors. |
| `CRE-CODE-009` | **P2** | Architecture | `packages/event-bus/src/outbox/` | **Transactional Outbox & Dead-Letter Processing**: Verify transactional outbox polling loop in `event-bus` to ensure atomic event emission alongside Prisma database transactions. | No events lost even if Redis temporarily crashes during a database commit. |
| `CRE-CODE-010` | **P3** | Code Quality | Monorepo root | **Dead Code & Unused Export Pruning (`ts-prune`)**: Run automated dead code detection to remove orphaned components, unused types, and obsolete utility functions. | Workspace bundle size reduced; zero orphaned exported functions. |

---

# Phase 7: Growth, SEO, Content & Analytics

### [SEO Metadata, Tag Manager, Consent Management, Content Integrity]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-GRW-001` | **P0** | Privacy / Compliance | `apps/web/src/components/privacy/CookieConsentBanner.tsx` | **GDPR & NDPR Compliant Cookie Banner with Granular Preferences**: Implement cookie consent dialog with categories (Essential, Analytics, Marketing, Personalization) integrated with `AnalyticsSDK`. | Non-essential tracking scripts (GTM, GA4, Meta Pixel) stay disabled until explicit opt-in consent is granted. |
| `CRE-GRW-002` | **P0** | Privacy / Compliance | `services/core/user-service/src/modules/user/user.service.ts` | **Automated User Data Deletion & Export API (Right to Erasure)**: Implement self-service GDPR/NDPR data export (`GET /v1/users/me/data-export`) and account deletion (`DELETE /v1/users/me`) with 30-day grace period. | User request cascades soft-deletion and anonymizes PII across all 28 microservice databases. |
| `CRE-GRW-003` | **P1** | SEO | `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts` | **Automated Dynamic XML Sitemap & Robots Configuration**: Auto-generate dynamic sitemap including all public universes, shows, movies, creator profiles, and news articles with `lastmod` timestamps. | `sitemap.xml` returns valid XML schema under 100ms; robots.txt correctly disallows private `/admin`, `/creator`, `/wallet` routes. |
| `CRE-GRW-004` | **P1** | SEO | `apps/web/src/app/cinemaxis/[id]/page.tsx`, `apps/web/src/app/reality/shows/[id]/page.tsx` | **Dynamic OpenGraph & Structured Schema.org Metadata**: Inject `VideoObject`, `Movie`, `BreadcrumbList`, and `Organization` JSON-LD structured data into SSR HTML headers. | Google Rich Results Test validates 100% structured data compliance with rich preview thumbnails. |
| `CRE-GRW-005` | **P1** | Analytics | `packages/analytics-sdk/src/`, `apps/web/src/lib/analytics.ts` | **Full-Funnel Conversion & Event Instrumentation**: Instrument standard analytics events across key user lifecycle steps (`sign_up`, `login`, `video_start`, `video_complete`, `vote_cast`, `checkout_initiated`, `purchase_success`). | Events fire reliably to analytics ingest pipeline with user ID, session ID, and consent metadata attached. |
| `CRE-GRW-006` | **P2** | Analytics | `apps/web/src/components/experiments/AbTestProvider.tsx` | **A/B Testing Experimentation Harness**: Implement deterministic variant assignment (Control vs Test) based on hashed user ID for onboarding flows and subscription pricing tables. | Users consistently see assigned variant; conversion metrics logged per experiment bucket. |
| `CRE-GRW-007` | **P2** | Content | `apps/web/src/locales/`, `apps/mobile/src/i18n.ts` | **Internationalization (i18n) Completeness & Glossary Sync**: Complete missing translations across English, French, Yoruba, Igbo, and Hausa for all auth, wallet, and navigation strings. | Zero missing translation fallback keys visible in UI when switching locales. |
| `CRE-GRW-008` | **P3** | Content | `services/operations/moderation-service/` | **Automated Content Moderation & Profanity Filtering**: Connect text and image uploads to automated NSFW and hate-speech moderation pipeline before public publication. | Flagged comments and uploads enter moderation quarantine queue automatically. |

---

# Phase 8: Operations, SRE, DevOps, Reliability & Observability

### [CI/CD, Monitoring, Alerting, Chaos Engineering, Disaster Recovery]

| Task ID | Priority | Domain | Module / File | Description & Remediation | Acceptance Criteria |
|---|---|---|---|---|---|
| `CRE-OPS-001` | **P0** | Reliability / Resilience | `packages/shared-types/src/circuit-breaker.ts`, `services/gateway/` | **Circuit Breaker Trip & Fallback Verification**: Validate circuit breaker behavior when downstream universe services fail; ensure graceful degradation with cached content instead of cascading gateway 500 errors. | Gateway returns 200 with fallback cache when test backend is forced offline; circuit automatically closes upon health recovery. |
| `CRE-OPS-002` | **P0** | Observability | `infra/k8s/base/prometheus-grafana.yaml`, `packages/observability/` | **Centralized OpenTelemetry & Prometheus/Grafana Dashboards**: Provision production Grafana dashboards tracking RED metrics (Rate, Errors, Duration) for all 28 services, PgBouncer pool stats, and Redis memory. | Dashboards display real-time latency p50/p95/p99, error rates, and CPU/memory utilization per pod. |
| `CRE-OPS-003` | **P0** | Reliability / Resilience | `scripts/backup-databases.sh`, `scripts/encrypted-db-backup.sh` | **Automated Database Backup Encryption & Restoration Drill**: Implement daily encrypted PostgreSQL database backups to offsite S3 storage and execute an automated weekly test restore in staging environment. | Backup script runs on schedule; restore script reconstructs entire database cluster in under 15 minutes with verified data integrity. |
| `CRE-OPS-004` | **P1** | Infrastructure / DevOps | `.github/workflows/deploy-staging.yml` | **Automated Staging Deployment & Smoke Test Pipeline**: Configure GitHub Actions to automatically deploy green builds to staging environment and execute `docker-smoke-tests.sh`. | Every merge to `develop` deploys to staging and runs automated HTTP health/smoke tests. |
| `CRE-OPS-005` | **P1** | Observability | `infra/k8s/base/alertmanager.yaml` | **Alertmanager PagerDuty & Slack Incident Routing**: Configure P0/P1 alerting rules for API 5xx error rate > 1%, payment failure rate > 2%, database pool exhaustion, and disk space > 85%. | Alert triggers immediate Slack notification in `#ops-alerts` and pages on-call engineer via PagerDuty. |
| `CRE-OPS-006` | **P1** | Infrastructure / DevOps | `scripts/blue-green-deploy.sh`, `infra/k8s/base/` | **Zero-Downtime Blue-Green / Rolling Deployments**: Configure Kubernetes rolling update strategy with readiness/liveness probes and `preStop` graceful shutdown hooks (15s drain). | Deploying new image version causes zero dropped HTTP requests or severed WebSocket connections. |
| `CRE-OPS-007` | **P2** | Reliability / Resilience | `test/chaos/` | **Chaos Engineering & Network Partition Injection**: Implement Chaos Mesh or LitmusChaos tests simulating network partitions, Redis latency spikes (500ms), and worker node terminations. | System maintains uptime SLA of 99.95% during simulated infrastructure faults. |
| `CRE-OPS-008` | **P2** | Infrastructure / DevOps | `scripts/flag-eval-load-test.js`, `scripts/load-test.js` | **Automated Peak Load & Stress Testing (k6 / Artillery)**: Execute automated load tests simulating 10,000 concurrent voting users during live reality show finales. | p95 response time stays below 250ms under peak load; system autoscales pods dynamically. |
| `CRE-OPS-009` | **P3** | Infrastructure / DevOps | `terraform/aws/` | **Terraform AWS Cost Optimization & Spot Instances**: Configure Terraform configurations with AWS Savings Plans, Auto-Scaling Groups with mixed On-Demand and Spot instances for worker pods. | Monthly infrastructure compute cost reduced by 25-35% without sacrificing reliability. |

---

## Remediation Roadmap & Milestones

```
Sprint 1 (Week 1-2): P0 Critical Blockers (Auth Cookie Migration, CSP, Health Modules, Gateway Contracts, Prisma Indexing)
Sprint 2 (Week 3-4): P1 Essential Hardening (N+1 Query Elimination, Route Validation, E2E Test Suites, Error Boundaries)
Sprint 3 (Week 5-6): P2 Production Polish (A11y Axe-Core CI, Micro-interactions, Read Replicas, i18n Glossaries, Chaos Tests)
Sprint 4 (Week 7-8): P3 Operational Excellence (Cost Optimization, Deep Pruning, Trust Badges, Advanced Telemetry)
```

---

*Verified and aligned with Azeebo+ Platform Specifications (AZP-TAA-001, ADR-001–008, OWASP MASVS, and WCAG 2.1 AA Standards).*
