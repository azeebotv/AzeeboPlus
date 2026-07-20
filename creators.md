# Creator Portal — Standalone Full-Stack Implementation Plan

> **Goal**: Turn `apps/creator-portal` (currently a headless NestJS API on port **4014**) into a **standalone full-stack creator dashboard application** by adding a server-rendered/SPA UI, extracting the creator screens currently embedded in `apps/web/src/app/creators/dashboard/*`, and reusing the existing gateway-issued JWT + RBAC model.
>
> **Decision baseline** (confirmed with stakeholders):
> - Full-stack **on the existing NestJS app** (`apps/creator-portal`), not a new Next.js app.
> - UI is **extracted from `apps/web`** and moved into `apps/creator-portal`.
> - Authentication **reuses the existing gateway JWT / `ServiceAuthGuard` / role-based access** (`@Roles('creator')`) — no new auth system.
>
> **Audience**: engineers executing the work. Tasks are code-level, prioritized, dependency-tracked, with explicit acceptance criteria and validation checkpoints.

---

## 0. Audit Summary (current state — verified against source)

### 0.1 What already exists in `apps/creator-portal` (backend, complete)
NestJS 11 + Prisma 6, port `4014`, dedicated DB `azeebo_creator_portal`. Bootstraps with URI versioning (`/api/v1`), Helmet CSP, `cookie-parser`, global `ValidationPipe`, `GlobalExceptionFilter`, CORS via `configureCors`, and **Swagger at `/api/docs`** (non-prod).

Registered modules ([apps/creator-portal/src/app.module.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/app.module.ts)):
`DatabaseModule`, `AuthModule`, `ApiModule` (inter-service clients), `CreatorModule`, `HealthModule`. Global providers: `ResponseWrapperInterceptor` (`APP_INTERCEPTOR`) and `ServiceAuthGuard` (`APP_GUARD`). CSRF via double-submit cookie ([apps/creator-portal/src/common/csrf.middleware.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/common/csrf.middleware.ts)).

`CreatorController` ([apps/creator-portal/src/creator/creator.controller.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.controller.ts)) is mounted at `@Controller('creator')`, guarded by `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('creator')`, and exposes:
`GET creator/dashboard`, `GET/POST creator/content`, `PATCH/DELETE creator/content/:id`, `GET creator/analytics`, `GET creator/earnings`, `POST creator/payouts/request`, `PUT creator/payouts/settings`.

`CreatorService` ([apps/creator-portal/src/creator/creator.service.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.service.ts)) computes dashboard stats, content lists, and earnings against its own Prisma schema, and uses `WalletClientService`. `ApiModule` provides `ContentClientService`, `WalletClientService`, `AnalyticsClientService`, all calling the **API gateway** (`API_GATEWAY_URL`, default `:3013`) over raw `http`/`https`.

### 0.2 What exists in `apps/web` (UI to extract)
[apps/web/src/app/creators/dashboard/](file:///Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard) contains `'use client'` React pages: `dashboard` (root), `overview`, `content`, `analytics`, `earnings`, `settings` (each with `loading.tsx`/`error.tsx`). There is also the public `creators/` landing + signup and `creators/dashboard/page.tsx`.

These pages call the **API gateway** (`:3013`) via the web API client ([apps/web/src/lib/api/creator.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api/creator.ts)) at paths like `/api/v1/creators/stats`, `/api/v1/creators/analytics`, `/api/v1/creators/settings` — **not** the `apps/creator-portal` backend. This is the core architectural gap the extraction closes.

### 0.3 Contract mismatch found during audit (must reconcile in Phase C)
The web creator client and the creator-portal backend do **not** share the same route surface today:

| Concern | Web client ([creator.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api/creator.ts)) | creator-portal backend ([creator.controller.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.controller.ts)) |
|--------|--------|--------|
| Base path | `/api/v1/creators/*` (plural) | `creator/*` (singular) |
| Dashboard stats | `getStats()` → `/creators/stats` (rich shape: likes/comments/followers/changes) | `GET creator/dashboard` → `DashboardStats` (views/subscribers/earnings/contentCount + change strings) |
| Analytics | `getAnalytics({range})` → `/creators/analytics` | `GET creator/analytics?period=` |
| Settings | `getSettings()/updateSettings()` → `/creators/settings` | **no settings endpoint** in creator-portal |
| Content | (web reads via `content.getMyContent()`) | `GET/POST/PATCH/DELETE creator/content` |
| Earnings/Payouts | (not in web client) | `GET creator/earnings`, `POST creator/payouts/request`, `PUT creator/payouts/settings` |

**Action**: standardize the portal's own client on the backend's actual routes, and **add the missing `settings` endpoints** to the backend (C-BFF). Do not point the extracted SPA at the gateway `/creators/*` routes.

### 0.4 Backend gaps found during audit (fix as part of this plan)
- **Subscriber count is best-effort**: `getDashboardStats` runs `$queryRawUnsafe` against a `following` table that "may not exist in this database" and swallows the error (returns 0). Make this deterministic (see D/C-BFF): source followers from the correct service/table or a client call.
- **`subscribersChange` is stubbed** to `+0` regardless of data.
- **`req.user.id` reliance**: `CreatorController` reads `req.user.id`; `JwtStrategy.validate` returns `{ sub, email, role }` (no `id`). Works only when `ServiceAuthGuard` populates `req.user`. Standardize on `req.user.id ?? req.user.sub`.
- **`updateContent`/`deleteContent` return `success:false` with 200** on not-found instead of a 404 — align with the RFC-7807 error envelope.
- **Payout/earnings** paths are thin; validate against `WalletClientService` responses.

### 0.5 Reusable shared packages (do not reinvent)
`@azeebo/security` (`ServiceAuthGuard`, `configureCors`, `RateLimiterModule`), `@azeebo/error-handling` (`GlobalExceptionFilter`, typed errors incl. `NotFoundError`), `@azeebo/logger` (`ResponseWrapperInterceptor`, `StructuredLogger`), `@azeebo/auth` (`AuthClient`, `ProtectedRoute`), `@azeebo/ui`, `@azeebo/design-tokens`, `@azeebo/shared-types`.

---

## 1. Target Architecture

```
apps/creator-portal/                 # standalone full-stack creator dashboard, port 4014
├── src/
│   ├── main.ts                     # + static asset serving + SPA host
│   ├── app.module.ts               # + WebModule (UI host) + ServeStaticModule
│   ├── creator/                    # EXISTING API (contracts reconciled in C)
│   ├── api/                        # EXISTING inter-service clients (unchanged)
│   ├── web/                        # NEW — UI hosting layer
│   │   └── web.module.ts
│   └── generated/prisma
├── client/                         # NEW — extracted creator SPA (Vite + React 19)
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── routes/                 # pages extracted from apps/web/src/app/creators/dashboard/*
│   │   ├── components/             # CreatorLayout + shared UI
│   │   ├── lib/api/                # creator API client (points to /api/v1/creator/*)
│   │   └── context/AuthContext.tsx # reused gateway-JWT auth
│   └── vite.config.ts
└── package.json                    # + build:client, dev:client scripts
```

**Auth flow (reused, unchanged):** Browser → creator SPA → `/api/v1/*` requests carry the gateway-issued JWT (cookie or `Authorization: Bearer`). In production the SPA is served behind the gateway/nginx, which sets `x-user-*` headers; the creator backend's `ServiceAuthGuard` trusts them via `x-gateway-secret`. In local/dev, the SPA calls the backend directly with `Authorization: Bearer <token>` (verified by `ServiceAuthGuard`'s JWT fallback + `RolesGuard` → `@Roles('creator')`).

**Serving model:** Vite builds the SPA to `client/dist`; NestJS serves it via `@nestjs/serve-static` with SPA fallback to `index.html`; `/api/*`, `/api/docs`, and `/health` remain owned by the backend.

---

## 2. Phased Task Plan

Each task: **ID · Description · Files · Acceptance Criteria (AC) · Depends-on**. Validation checkpoints (VC) close each phase.

### Phase A — Environment & Scaffolding Setup

**A1. Add frontend toolchain to `apps/creator-portal`**
- Files: [apps/creator-portal/package.json](file:///Users/deprof/www/azeebo+/apps/creator-portal/package.json)
- Add deps: `@nestjs/serve-static`, and client-side `react@^19.2`, `react-dom@^19.2`, `react-router-dom@^7`, `@tanstack/react-query@^5.101`, `recharts@^3.8`, `lucide-react`, `@azeebo/ui`, `@azeebo/design-tokens`, `@azeebo/shared-types`. Dev: `vite@^6`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@playwright/test`.
- Add scripts: `"dev:client": "vite --config client/vite.config.ts"`, `"build:client": "vite build --config client/vite.config.ts"`, `"build": "pnpm build:client && prisma generate && tsc -p tsconfig.build.json"`, `"test:client": "vitest run --root client"`, `"test:e2e": "playwright test"`.
- **AC**: `pnpm --filter @azeebo/creator-portal install` succeeds; `pnpm --filter @azeebo/creator-portal build:client` produces `client/dist/index.html`.
- Depends-on: —

**A2. Create Vite client scaffold**
- Files: `apps/creator-portal/client/index.html`, `.../client/vite.config.ts`, `.../client/src/main.tsx`, `.../client/tsconfig.json`
- `vite.config.ts`: `base: '/'`, `build.outDir: 'dist'`, dev `server.proxy` mapping `/api` and `/health` → `http://localhost:4014`, `server.port: 4101`.
- **AC**: `pnpm dev:client` serves a "Hello Creator" page at `:4101` and proxies `/health` to the backend.
- Depends-on: A1

**A3. Serve the SPA from NestJS**
- Files: new `apps/creator-portal/src/web/web.module.ts`; edit [app.module.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/app.module.ts), [main.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/main.ts)
- Register `ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client', 'dist'), exclude: ['/api/{*path}', '/health'], serveRoot: '/' })` with SPA fallback to `index.html`. Keep Swagger at `/api/docs`.
- **CSP update**: current Helmet CSP is `scriptSrc: ["'self'"]` and lacks `imgSrc`/`connectSrc` tightening — extend to match the admin app's stricter directive set; add `styleSrc: ["'self'", "'unsafe-inline'"]` only if required by the styling approach. Document any relaxation.
- **AC**: `GET /` returns the SPA shell; `GET /api/v1/creator/dashboard` still returns JSON; `GET /dashboard/*` (client route) returns `index.html`; `/api/docs` still loads in non-prod.
- Depends-on: A2

**A4. Dockerfile + compose updates**
- Files: [apps/creator-portal/Dockerfile](file:///Users/deprof/www/azeebo+/apps/creator-portal/Dockerfile), [apps/creator-portal/docker-compose.yml](file:///Users/deprof/www/azeebo+/apps/creator-portal/docker-compose.yml)
- Builder stage runs `build:client` before `tsc`; runner copies `client/dist`. Verify healthcheck path resolves (see B1).
- **AC**: `docker build` succeeds; container serves UI + API on 4014; healthcheck passes.
- Depends-on: A3, B1

> **VC-A (Checkpoint)**: `pnpm --filter @azeebo/creator-portal build && start` boots one process serving both UI (`/`) and API (`/api/v1/creator/*`); Docker image healthy. No `apps/web` changes yet.

---

### Phase B — Auth, RBAC & Security Hardening (do before feature extraction)

**B1. Normalize health + versioning**
- Files: [apps/creator-portal/src/modules/health/health.controller.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/modules/health/health.controller.ts)
- Expose both `/health` (unversioned, `@Public()`, for Docker/k8s) and keep `/api/v1/health`. Confirm versioning does not shadow `/health`.
- **AC**: `curl localhost:4014/health` → `200` without auth; Docker healthcheck green.
- Depends-on: —

**B2. Standardize actor identity resolution**
- Files: [apps/creator-portal/src/creator/creator.controller.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.controller.ts)
- Introduce `resolveActorId(req)` returning `req.user.id ?? req.user.sub`; use it wherever `req.user.id` is read so both auth paths (gateway header + direct Bearer) work.
- **AC**: `creator/dashboard`, `creator/content`, `creator/earnings` return correct per-user data under both auth paths. Unit test both.
- Depends-on: —

**B3. Correct error semantics for content mutations**
- Files: [creator.controller.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.controller.ts), [creator.service.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/creator/creator.service.ts)
- `updateContent`/`deleteContent` should throw `NotFoundError` (from `@azeebo/error-handling`) on missing/owned-by-other content instead of returning `success:false` + 200. Enforce ownership (`creatorId === actorId`).
- **AC**: updating a non-existent or foreign content id returns `404` with RFC-7807 body; owner can update/delete.
- Depends-on: B2

**B4. Client auth context (reused model)**
- Files: `apps/creator-portal/client/src/context/AuthContext.tsx`, `.../client/src/lib/api/base.ts`
- Port the web `AuthContext` + `@azeebo/auth` `AuthClient` (token refresh dedup, `credentials: 'include'`, RFC-7807 handling). SPA route guard requires `role === 'creator'`, else redirect to gateway login (`/auth/login`) with return URL. (Consider allowing `admin` impersonation later — backlog.)
- **CSRF**: SPA issues one `GET` before mutations to obtain `_csrf` cookie, then sends `x-csrf-token` on POST/PUT/PATCH/DELETE (matches [csrf.middleware.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/common/csrf.middleware.ts)); wire an interceptor to attach it automatically.
- **AC**: unauthenticated → redirect to login; non-creator → 403 screen; mutation without CSRF header → 403, with interceptor → success.
- Depends-on: A2

**B5. CORS + origins config**
- Files: [apps/creator-portal/src/main.ts](file:///Users/deprof/www/azeebo+/apps/creator-portal/src/main.ts), `.env`
- Ensure `CREATOR_ALLOWED_ORIGINS` includes the creator host(s); prod already throws if unset. Keep dev origins (`http://localhost:4101`, `4014`). Same-origin serving removes most prod CORS needs.
- **AC**: no CORS errors in dev (`:4101` → `:4014`) or prod (same origin); prod boot fails if origins unset.
- Depends-on: A3

> **VC-B (Checkpoint)**: Security test pass — (1) no-auth → redirect/401; (2) wrong role → 403; (3) CSRF enforced on mutations; (4) per-user data isolation verified; (5) 404 semantics correct. Run `pnpm --filter @azeebo/creator-portal test`.

---

### Phase C — Core Feature Extraction & UI Development

Extraction principle: move each page from `apps/web/src/app/creators/dashboard/<route>/page.tsx` into `apps/creator-portal/client/src/routes/<route>.tsx`, converting Next App Router pages to React Router routes, and repoint API calls from the web gateway client to the creator-portal client (`/api/v1/creator/*`, same origin). Preserve the established visual language (dark theme `#1A0A0A`, `az-glass`, accent `#E8420A`, NGN `₦` formatting).

**C1. Shared shell: `CreatorLayout` + routing + query client**
- Files: `apps/creator-portal/client/src/components/CreatorLayout.tsx`, `.../src/main.tsx`, `.../src/routes/index.tsx`
- Build a creator nav (Dashboard/Overview, Content, Analytics, Earnings, Settings) mirroring the web dashboard's structure; set up `react-router-dom` + `QueryClientProvider`; apply the creator role guard at the layout.
- **AC**: all creator routes render a placeholder within the layout; active-state highlighting works; role guard applied.
- Depends-on: B4

**C2. Creator API client (aligned to backend routes)**
- Files: `apps/creator-portal/client/src/lib/api/creator.ts` (+ `base.ts`)
- Target the **backend's own** routes (singular `creator/*`), not the gateway plural routes: `GET creator/dashboard`, `GET/POST creator/content`, `PATCH/DELETE creator/content/:id`, `GET creator/analytics?period=`, `GET creator/earnings?period=`, `POST creator/payouts/request`, `PUT creator/payouts/settings`, and (new) `GET/PUT creator/settings` after C-BFF.
- **AC**: typed client compiles; a contract test asserts each client path maps to an existing controller route (see E2).
- Depends-on: A1

**C3–C8 Page extraction (priority order).** For each: port UI, wire to C2 client, keep AC.

| ID | Route | Source page | Backend endpoint | AC |
|----|-------|-------------|------------------|----|
| C3 | `/` + `overview` dashboard | creators/dashboard/overview/page.tsx | `GET creator/dashboard` | Stat cards (views, subscribers, earnings ₦, content count) + change indicators load from real data; recent content list renders; quick-action links route within SPA |
| C4 | `content` | creators/dashboard/content/page.tsx | `creator/content` CRUD | List with status filter + pagination; create/edit/delete wired with confirm; **404 handling** from B3 surfaced as toast; ownership enforced |
| C5 | `content` upload | (web `creator/upload`) | `POST creator/content` (+ media-service via gateway) | Upload flow creates content; validates title/type/universe; shows processing state |
| C6 | `analytics` | creators/dashboard/analytics/page.tsx | `GET creator/analytics?period=` | Period selector; views-over-time + demographics + top-content charts (recharts); empty state |
| C7 | `earnings` | creators/dashboard/earnings/page.tsx | `GET creator/earnings`, `POST creator/payouts/request`, `PUT creator/payouts/settings` | Earnings summary (total/pending/lifetime), request-payout action with confirm, payout settings form (method + minimum) |
| C8 | `settings` | creators/dashboard/settings/page.tsx | **`GET/PUT creator/settings`** (new — C-BFF) | Notification + privacy toggles load and persist; matches web `getSettings/updateSettings` shape |

- Depends-on (all): C1, C2; C8 also depends on C-BFF.

**C-BFF. Backend additions for missing/weak data**
- Files: `creator.controller.ts`, `creator.service.ts` (+ possibly a new `settings` sub-module)
- (a) Add `GET/PUT creator/settings` matching the web settings shape (notifications: email/push/sms/marketing; privacy: profileVisibility/showEarnings/allowMessages) — persist on `User.notificationPreferences`/`preferences` JSON or a dedicated table.
- (b) Make **subscriber count deterministic**: replace the swallowed `$queryRawUnsafe` on `following` with a proper source (a client call to the owning service, or a modeled relation), and compute a real `subscribersChange`.
- **AC**: settings round-trip persists; dashboard subscriber count and change are backed by real data with unit tests; no silent catch.
- Depends-on: B2

> **VC-C (Checkpoint)**: Every creator route renders real data from the creator-portal backend; contract mismatch (§0.3) reconciled; subscriber-count gap (§0.4) closed; `pnpm test:client` green.

---

### Phase D — UI/UX & Design System Alignment

**D1. Adopt design tokens** — replace ad-hoc inline styles with `@azeebo/design-tokens` where practical; keep palette + `₦` formatting. **AC**: no hardcoded hex beyond token references in new components.

**D2. Loading / error / empty states** — standardize skeletons (`@azeebo/ui` `Skeleton`, `ErrorState`) and empty states across all routes. **AC**: each route shows skeleton on load, typed error UI on failure, empty-state messaging (e.g. "No content yet. Start creating!").

**D3. Accessibility** — keyboard nav, `aria-current`, focus management on route change, AA contrast, accessible charts (labels/tooltips). **AC**: Playwright + axe-core a11y suite passes with zero serious violations.

**D4. Responsive** — mobile nav + charts/tables collapse gracefully. **AC**: usable at 375px width.

> **VC-D**: Manual UX pass + automated a11y suite green.

---

### Phase E — Integration Testing

**E1. Backend unit/integration** — Jest for changed service logic (B2, B3, C-BFF: settings, subscriber count, payouts). **AC**: `pnpm --filter @azeebo/creator-portal test:cov` ≥ existing threshold; new logic covered including 404/ownership paths.

**E2. Route-contract test** — automated check that every client API path (C2) resolves to a real creator controller route. **AC**: test fails if a client path has no matching backend route.

**E3. E2E (Playwright)** — auth redirect, creator role gating, content create/edit/delete, analytics render, earnings + payout request, settings save, CSRF happy-path. **AC**: E2E suite green in CI headless.

**E4. Cross-service** — validate `ContentClientService`/`WalletClientService`/`AnalyticsClientService` calls that proxy through the gateway work with real tokens (upload → content-service; earnings → wallet-service). **AC**: succeed against a running gateway or a mocked gateway; failures surface as typed errors, not crashes.

> **VC-E**: CI runs unit + contract + e2e; all green. No regressions in `apps/web` (it retains its own creator pages until Phase G).

---

### Phase F — Deployment Preparation

**F1. CI pipeline** — extend [.github/workflows/ci.yml](file:///Users/deprof/www/azeebo+/.github/workflows/ci.yml) / `cd.yml` to build `client` + backend for `@azeebo/creator-portal`, run tests, build Docker image. **AC**: PR checks include creator client build + tests.

**F2. Env & secrets** — document required env: `JWT_ACCESS_SECRET`, `GATEWAY_SECRET`/`INTERNAL_API_KEY`, `CREATOR_ALLOWED_ORIGINS`, `DATABASE_URL`, `API_GATEWAY_URL`, `NODE_ENV`. Ensure secret-rotation workflow covers the creator portal. **AC**: prod requires `CREATOR_ALLOWED_ORIGINS` + `API_GATEWAY_URL` (already enforced); boot fails without them.

**F3. Gateway/routing** — route `creator.azeeboplus.com` → creator-portal container (`:4014`); ensure gateway forwards `x-user-*` + `x-gateway-secret` so `ServiceAuthGuard` trusts headers; ensure gateway `PUBLIC_PATH_PATTERNS` still cover creator discovery/signup as needed. **AC**: prod-like staging serves UI at creator host and API calls authenticate via headers.

**F4. Observability** — wire `@azeebo/logger` structured logs + health/readiness; dashboards/alerts consistent with other services. Disable Swagger in prod (already gated by `NODE_ENV`). **AC**: `/health` monitored; request logs carry `x-request-id`.

> **VC-F**: One-command deploy to staging produces a working creator portal at its own host with green health and no auth bypass.

---

### Phase G — Post-Launch Maintenance & Decommission

**G1. Decommission web creator dashboard** — after staging sign-off, remove `apps/web/src/app/creators/dashboard/*` (keep public `creators/` landing + signup unless also migrated) and creator methods from `apps/web/src/lib/api/creator.ts`; redirect `/creators/dashboard*` on web to the creator host. **AC**: web build passes; redirects verified. Depends-on: VC-F sign-off.

**G2. Runbook** — deploy/rollback (reuse `rollback.yml`), on-call, common failures (CSRF, token expiry, gateway header misconfig, gateway-client timeouts). **AC**: runbook merged.

**G3. Backlog** — creator onboarding/verification flow (ties to `creator-service`), richer payout scheduling, admin impersonation for support, watch-time/engagement analytics depth. **AC**: tracked as issues with owners.

**G4. Monitoring cadence** — error-rate/latency SLOs (incl. gateway-client dependency latency), payout-request auditing, dependency updates via `dependabot.yml`. **AC**: SLOs defined; alerts routed.

---

## 3. Dependency Graph (critical path)

```
A1 → A2 → A3 → A4
A1 → C2
B1 → A4
B2 → B3 → C4
A2 → B4 → C1
A3 → B5
B2 → C-BFF → C8
C1, C2 → C3…C8
C* → E1..E4 → F1..F4 → G1 (decommission) → G2..G4
```

## 4. Global Definition of Done
- All creator dashboard routes served from `apps/creator-portal`, backed by the creator API, authenticated via reused gateway JWT + `@Roles('creator')` + CSRF.
- Web/backend route contract reconciled; `settings` endpoints added; subscriber count deterministic; content mutations return correct 404/ownership semantics.
- Unit + contract + e2e + a11y suites green in CI; Docker image healthy; staging deploy validated.
- `apps/web` creator dashboard decommissioned and redirected.
