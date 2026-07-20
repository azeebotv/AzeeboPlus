# Admin Portal — Standalone Full-Stack Implementation Plan

> **Goal**: Turn `apps/admin` (currently a headless NestJS API on port **4016**) into a **standalone full-stack admin dashboard application** by adding a server-rendered UI, extracting the admin screens currently embedded in `apps/web/src/app/admin/*`, and reusing the existing gateway-issued JWT + RBAC model.
>
> **Decision baseline** (confirmed with stakeholders):
> - Full-stack **on the existing NestJS app** (`apps/admin`), not a new Next.js app.
> - UI is **extracted from `apps/web`** and moved into `apps/admin`.
> - Authentication **reuses the existing gateway JWT / `ServiceAuthGuard` / role-based access** — no new auth system.
>
> **Audience**: engineers executing the work. Tasks are code-level, prioritized, dependency-tracked, with explicit acceptance criteria and validation checkpoints.

---

## 0. Audit Summary (current state — verified against source)

### 0.1 What already exists in `apps/admin` (backend, complete)
NestJS 11 + Prisma 6, port `4016`, dedicated DB `azeebo_admin`. Bootstraps with URI versioning (`/api/v1`), Helmet CSP, `cookie-parser`, global `ValidationPipe`, `GlobalExceptionFilter`, CORS via `configureCors`.

Registered modules ([apps/admin/src/app.module.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/app.module.ts)):
`AuthModule`, `DatabaseModule`, `UserManagementModule`, `ContentManagementModule`, `ModerationModule`, `DashboardModule`, `AuditModule`, `UniverseManagementModule`, `SystemSettingsModule`, `WalletManagementModule`, `ContentReviewModule`, `EngagementAdminModule`, `NotificationAdminModule`, `ReportsAdminModule`, `HealthModule`, plus `platform-overview` service present on disk.

Controllers are mounted under `admin/*` (e.g. `@Controller('admin/users')`), guarded by `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`, and additionally by the global `ServiceAuthGuard` (`APP_GUARD`). CSRF via double-submit cookie ([apps/admin/src/common/csrf.middleware.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/common/csrf.middleware.ts)).

### 0.2 What exists in `apps/web` (UI to extract)
[apps/web/src/app/admin/](file:///Users/deprof/www/azeebo+/apps/web/src/app/admin) contains `'use client'` React pages wrapped in [AdminLayout.tsx](file:///Users/deprof/www/azeebo+/apps/web/src/components/layout/AdminLayout.tsx). Routes (from `ADMIN_NAV`): `/admin`, `overview`, `users` (+ `users/[id]`), `content`, `content-review`, `creators`, `reality`, `universes`, `wallets`, `financial`, `payment-gateways`, `engagement`, `notifications`, `announcements`, `audit-logs`, `reports` (+ `reports/builder`), `settings`.

These pages call the **API gateway** (`:3013`) via the web API client ([apps/web/src/lib/api/admin.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api/admin.ts)) at paths like `/api/v1/admin/dashboard/stats` — **not** the `apps/admin` backend. This is the core architectural gap the extraction closes.

### 0.3 Known gaps / defects found during audit (fix as part of this plan)
- **`req.user.id` inconsistency**: `JwtStrategy.validate` returns `{ sub, email, role }` (no `id`), but user/content/moderation/content-review controllers read `req.user.id`. Works only when `ServiceAuthGuard` populates `req.user` (sets both `id` and `sub`). Standardize on `req.user.id ?? req.user.sub`.
- **`superadmin` locked out**: every controller uses `@Roles('admin')` only; a `superadmin` token is denied by `RolesGuard`. Web `AdminLayout` allows both `admin` and `superadmin`. Align backend to accept both.
- **Health route/versioning**: Dockerfile healthcheck hits `/health` but the controller is versioned; verify route resolves unversioned or update the healthcheck.
- **Web admin partial screens** (carry over as backlog, not blockers): `financial` has hardcoded `pendingPayouts/totalPayouts = 0`; `users` search/filter is client-side over page 1 only; `creators`/`reality` are read-only (no status actions wired though endpoints exist); reports "builder" metrics are hardcoded; root dashboard fetches `recentActivity` but never renders it.

### 0.4 Reusable shared packages (do not reinvent)
`@azeebo/security` (`ServiceAuthGuard`, `configureCors`, `RateLimiterModule`, `AdminGuard`, `PermissionsGuard`), `@azeebo/error-handling` (`GlobalExceptionFilter`, typed errors), `@azeebo/logger` (`ResponseWrapperInterceptor`, `StructuredLogger`), `@azeebo/auth` (`AuthClient`, `ProtectedRoute`), `@azeebo/ui`, `@azeebo/design-tokens`, `@azeebo/shared-types` (`ROLE_PERMISSIONS`, API envelope types).

---

## 1. Target Architecture

```
apps/admin/                         # standalone full-stack admin dashboard, port 4016
├── src/
│   ├── main.ts                     # + static asset serving + view engine / SPA host
│   ├── app.module.ts               # + WebModule (UI host) + ServeStaticModule
│   ├── modules/…                   # EXISTING API modules (unchanged contracts)
│   ├── web/                        # NEW — UI hosting layer
│   │   ├── web.module.ts
│   │   ├── web.controller.ts       # serves the SPA shell / SSR entry
│   │   └── bff/                    # optional Backend-For-Frontend aggregation
│   └── generated/prisma
├── client/                         # NEW — extracted admin SPA (Vite + React 19)
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── routes/                 # pages extracted from apps/web/src/app/admin/*
│   │   ├── components/             # AdminLayout + shared UI
│   │   ├── lib/api/                # admin API client (points to /api/v1/admin/*)
│   │   └── context/AuthContext.tsx # reused gateway-JWT auth
│   └── vite.config.ts
└── package.json                    # + build:client, dev:client scripts
```

**Auth flow (reused, unchanged):** Browser → admin SPA → `/api/v1/*` requests carry the gateway-issued JWT (cookie or `Authorization: Bearer`). In production the SPA is served behind the same gateway/nginx so the gateway sets `x-user-*` headers and the admin backend's `ServiceAuthGuard` trusts them via `x-gateway-secret`. In local/dev, the SPA calls the admin backend directly with `Authorization: Bearer <token>` (verified by `ServiceAuthGuard`'s JWT fallback + `RolesGuard`).

**Serving model:** Vite builds the SPA to `client/dist`; NestJS serves it via `@nestjs/serve-static` with an SPA fallback to `index.html`, while `/api/*` and `/health` remain owned by the API controllers.

---

## 2. Phased Task Plan

Each task: **ID · Description · Files · Acceptance Criteria (AC) · Depends-on**. Validation checkpoints (VC) close each phase.

### Phase A — Environment & Scaffolding Setup

**A1. Add frontend toolchain to `apps/admin`**
- Files: [apps/admin/package.json](file:///Users/deprof/www/azeebo+/apps/admin/package.json)
- Add deps: `@nestjs/serve-static`, and client-side `react@^19.2`, `react-dom@^19.2`, `react-router-dom@^7`, `@tanstack/react-query@^5.101`, `recharts@^3.8`, `lucide-react`, `@azeebo/ui`, `@azeebo/design-tokens`, `@azeebo/shared-types`. Dev: `vite@^6`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@playwright/test`.
- Add scripts: `"dev:client": "vite --config client/vite.config.ts"`, `"build:client": "vite build --config client/vite.config.ts"`, `"build": "pnpm build:client && prisma generate && tsc -p tsconfig.build.json"`, `"test:client": "vitest run --root client"`, `"test:e2e": "playwright test"`.
- **AC**: `pnpm --filter @azeebo/admin install` succeeds; `pnpm --filter @azeebo/admin build:client` produces `client/dist/index.html`.
- Depends-on: —

**A2. Create Vite client scaffold**
- Files: `apps/admin/client/index.html`, `apps/admin/client/vite.config.ts`, `apps/admin/client/src/main.tsx`, `apps/admin/client/tsconfig.json`
- `vite.config.ts`: `base: '/'`, `build.outDir: 'dist'`, dev `server.proxy` mapping `/api` and `/health` → `http://localhost:4016`, `server.port: 4100`.
- **AC**: `pnpm dev:client` serves a "Hello Admin" page at `:4100` and proxies `/health` to the backend.
- Depends-on: A1

**A3. Serve the SPA from NestJS**
- Files: new `apps/admin/src/web/web.module.ts`; edit [apps/admin/src/app.module.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/app.module.ts), [apps/admin/src/main.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/main.ts)
- Register `ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'client', 'dist'), exclude: ['/api/{*path}', '/health'], serveRoot: '/' })`. Ensure SPA fallback serves `index.html` for unknown non-API GET routes.
- **CSP update**: current Helmet CSP is `scriptSrc: ["'self'"]`. Vite output is fine with `'self'`, but add `styleSrc: ["'self'", "'unsafe-inline'"]` only if a CSS-in-JS lib injects inline styles; prefer hashed styles. Document any CSP relaxation.
- **AC**: `GET /` returns the SPA shell; `GET /api/v1/admin/dashboard/stats` still returns JSON; `GET /admin/anything` (client route) returns `index.html`.
- Depends-on: A2

**A4. Dockerfile + compose updates**
- Files: [apps/admin/Dockerfile](file:///Users/deprof/www/azeebo+/apps/admin/Dockerfile), [apps/admin/docker-compose.yml](file:///Users/deprof/www/azeebo+/apps/admin/docker-compose.yml)
- Builder stage runs `build:client` before `tsc`; runner copies `client/dist`. Fix healthcheck to a definitely-resolvable path (`/health` unversioned — see B1).
- **AC**: `docker build` succeeds; container serves UI + API on 4016; healthcheck passes.
- Depends-on: A3, B1

> **VC-A (Checkpoint)**: `pnpm --filter @azeebo/admin build && pnpm --filter @azeebo/admin start` boots one process serving both UI (`/`) and API (`/api/v1/admin/*`); Docker image healthy. No `apps/web` changes yet.

---

### Phase B — Auth, RBAC & Security Hardening (do before feature extraction)

**B1. Normalize health + versioning**
- Files: [apps/admin/src/modules/health/health.controller.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/modules/health/health.controller.ts)
- Expose both `/health` (unversioned, `@Public()`, for Docker/k8s) and keep `/api/v1/health`. Confirm `main.ts` versioning does not shadow `/health`.
- **AC**: `curl localhost:4016/health` → `200` without auth; Docker healthcheck green.
- Depends-on: —

**B2. Standardize actor identity resolution**
- Files: [apps/admin/src/modules/user-management/user-management.controller.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/modules/user-management/user-management.controller.ts), content-management, moderation, content-review controllers
- Introduce a small helper/decorator `@ActorId()` (or `resolveActorId(req)`) returning `req.user.id ?? req.user.sub`. Replace direct `req.user.id` reads in audit logging.
- **AC**: Audit log `actorId` is non-null under both auth paths (gateway header + direct Bearer). Unit test both.
- Depends-on: —

**B3. Admit `superadmin` where appropriate**
- Files: all admin controllers using `@Roles('admin')`; [apps/admin/src/modules/auth/decorators/roles.decorator.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/modules/auth/guards/roles.guard.ts)
- Change to `@Roles('admin', 'superadmin')` to match web `AdminLayout` gating. Optionally adopt `@azeebo/security` `PermissionsGuard` + `ROLE_PERMISSIONS` for fine-grained control (backlog).
- **AC**: `superadmin` JWT reaches all admin endpoints; `user`/`creator` still `403`.
- Depends-on: —

**B4. Client auth context (reused model)**
- Files: `apps/admin/client/src/context/AuthContext.tsx`, `apps/admin/client/src/lib/api/base.ts`
- Port the web `AuthContext` + `@azeebo/auth` `AuthClient` (token refresh dedup, `credentials: 'include'`, RFC-7807 envelope handling). SPA route guard requires `role ∈ {admin, superadmin}`, else redirect to gateway login (`/auth/login`) with return URL.
- **CSRF**: SPA must issue one `GET` before mutations to obtain `_csrf` cookie, then send `x-csrf-token` header on POST/PUT/DELETE (matches [csrf.middleware.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/common/csrf.middleware.ts)). Wire an interceptor that reads `_csrf` cookie and attaches the header automatically.
- **AC**: Unauthenticated visit redirects to login; non-admin gets a 403 screen; a mutating request without CSRF header is rejected (403) and with the interceptor succeeds.
- Depends-on: A2

**B5. CORS + origins config**
- Files: [apps/admin/src/main.ts](file:///Users/deprof/www/azeebo+/apps/admin/src/main.ts), `.env`
- Ensure `ADMIN_ALLOWED_ORIGINS` includes the admin host(s). Same-origin serving (Phase A) largely removes CORS needs in prod; keep dev origins (`http://localhost:4100`, `4016`).
- **AC**: No CORS errors in dev (SPA `:4100` → API `:4016`) or prod (same origin).
- Depends-on: A3

> **VC-B (Checkpoint)**: Security test pass — (1) no-auth → redirect/401; (2) wrong role → 403; (3) CSRF enforced on mutations; (4) audit `actorId` populated; (5) `superadmin` allowed. Run `pnpm --filter @azeebo/admin test`.

---

### Phase C — Core Feature Extraction & UI Development

Extraction principle: move each page from `apps/web/src/app/admin/<route>/page.tsx` into `apps/admin/client/src/routes/<route>.tsx`, converting Next App Router pages to React Router routes, and repoint API calls from the web gateway client to the admin client (`/api/v1/admin/*` served by the same origin). Preserve existing visual language (dark theme `#1A0A0A`, `az-glass`, accent `#E8420A`).

**C1. Shared shell: `AdminLayout` + routing + query client**
- Files: `apps/admin/client/src/components/AdminLayout.tsx`, `apps/admin/client/src/main.tsx`, `apps/admin/client/src/routes/index.tsx`
- Port `ADMIN_NAV` (17 items) and sidebar/mobile behavior from [AdminLayout.tsx](file:///Users/deprof/www/azeebo+/apps/web/src/components/layout/AdminLayout.tsx). Set up `react-router-dom` routes + `QueryClientProvider`.
- **AC**: All 17 nav routes render a placeholder within the layout; active-state highlighting works; role guard applied at layout.
- Depends-on: B4

**C2. Admin API client**
- Files: `apps/admin/client/src/lib/api/admin.ts` (+ `base.ts`)
- Recreate the method surface of [apps/web/src/lib/api/admin.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api/admin.ts) but targeting the admin backend's own routes. **Verify each path** against the real controllers (e.g. web client calls `/api/v1/admin/dashboard/stats`; confirm the admin `DashboardController` route and align — adjust one side so they match).
- **AC**: Typed client compiles; a contract test asserts each client path maps to an existing admin controller route (see C-test).
- Depends-on: A1

**C3–C? Page extraction (priority order).** For each: port UI, wire to C2 client, keep AC.

| ID | Route | Source page | Backend module | AC |
|----|-------|-------------|----------------|----|
| C3 | `/` dashboard | admin/page.tsx | dashboard | 6 stat cards load from real stats; **render `recentActivity`** (fixes web gap); quick-action links route within SPA |
| C4 | `users` (+ `[id]`) | admin/users | user-management | **Server-side** pagination + search + role filter (fixes web page-1-only bug); detail page **gated by role** (fixes web ungated detail); role change + suspend/unsuspend wired with confirm + audit |
| C5 | `content` | admin/content | content-management | Full CRUD/bulk/categories/tags parity with web reference impl; move client-side sort to server sort params |
| C6 | `content-review` | admin/content-review | content-review | Approve/reject with **reason input** (fixes hardcoded reason) |
| C7 | `creators` | admin/creators | (creators via gateway) | List + **approve/verify/suspend actions wired** (fixes read-only web gap); search + pagination |
| C8 | `reality` | admin/reality | (reality via gateway) | List + **status actions wired**; empty state |
| C9 | `universes` | admin/universes | universe-management | Enable/disable, feature-flag toggles, sort order, clone/import per DTOs |
| C10 | `wallets` | admin/wallets | wallet-management | List wallets + transactions; server pagination |
| C11 | `financial` | admin/financial | wallet/reports | Replace hardcoded `pendingPayouts/totalPayouts/monthlyRevenue` with real endpoints (add backend aggregation if missing — see C-BFF) |
| C12 | `payment-gateways` | admin/payment-gateways | system-settings | View/configure gateways; test-connection |
| C13 | `engagement` | admin/engagement | engagement-admin | Metrics + trends charts (recharts) |
| C14 | `notifications` | admin/notifications | notification-admin | Templates CRUD + send + stats |
| C15 | `announcements` | admin/announcements | notification-admin | Create/schedule/list announcements |
| C16 | `audit-logs` | admin/audit-logs | audit | Filter by actor/action/date; pagination |
| C17 | `reports` (+ `builder`) | admin/reports | reports-admin | List + builder that **sends `format`** and **configurable metrics/dimensions** (fixes web gaps) |
| C18 | `overview` | admin/overview | platform-overview | Platform-wide KPIs |
| C19 | `settings` | admin/settings | system-settings | 9 tabs parity; persist via bulk update; export/import; test-integration |

- Depends-on (all): C1, C2, plus respective backend module already present.

**C-BFF (as needed). Backend aggregation for missing metrics**
- Files: new endpoints in `dashboard`/`reports-admin`/`wallet-management` services
- Where the UI needs numbers no endpoint supplies (e.g. `pendingPayouts`, `totalPayouts`), add service methods with tests rather than hardcoding.
- **AC**: Financial page shows real figures; unit tests cover aggregation SQL/Prisma.
- Depends-on: relevant module

> **VC-C (Checkpoint)**: Every route in `ADMIN_NAV` renders real data from the admin backend; all previously-identified web gaps (C3/C4/C6/C7/C8/C11/C17) are closed; `pnpm test:client` green.

---

### Phase D — UI/UX & Design System Alignment

**D1. Adopt design tokens** — replace ad-hoc inline styles with `@azeebo/design-tokens` where practical; keep the established palette. **AC**: no hardcoded hex beyond token references in new components (lint rule optional).

**D2. Loading / error / empty states** — standardize skeletons (`@azeebo/ui` `Skeleton`, `ErrorState`) and empty states across all routes (web had duplicated boilerplate). **AC**: each route shows skeleton on load, typed error UI on failure, and empty-state messaging.

**D3. Accessibility** — keyboard nav for sidebar, `aria-current`, focus management on route change, color-contrast AA. **AC**: `@playwright/test` + axe-core a11y suite passes with zero serious violations (mirror `apps/web/e2e/accessibility.spec.ts`).

**D4. Responsive** — verify mobile sidebar toggle and tables collapse. **AC**: usable at 375px width.

> **VC-D**: Manual UX pass + automated a11y suite green.

---

### Phase E — Integration Testing

**E1. Backend unit/integration** — Jest for changed services (B2, C-BFF). **AC**: `pnpm --filter @azeebo/admin test:cov` ≥ existing threshold; new logic covered.

**E2. Route-contract test** — automated check that every client API path (C2) resolves to a real admin controller route (parse controllers or hit a route-list endpoint). **AC**: test fails if a client path has no matching backend route.

**E3. E2E (Playwright)** — auth redirect, role gating, one CRUD flow per major module (users role change, content publish, review approve/reject, settings save), CSRF happy-path. **AC**: E2E suite green in CI headless.

**E4. Cross-service** — validate calls that proxy through the gateway to other services (creators/reality) work with real tokens. **AC**: creators/reality actions succeed against a running gateway or a mocked gateway.

> **VC-E**: CI runs unit + contract + e2e; all green. No regressions in `apps/web` (it still has its own admin pages until Phase G decommission).

---

### Phase F — Deployment Preparation

**F1. CI pipeline** — extend [.github/workflows/ci.yml](file:///Users/deprof/www/azeebo+/.github/workflows/ci.yml) / `cd.yml` to build `client` + backend for `@azeebo/admin`, run tests, build Docker image. **AC**: PR checks include admin client build + tests.

**F2. Env & secrets** — document required env: `JWT_ACCESS_SECRET`, `GATEWAY_SECRET`/`INTERNAL_API_KEY`, `ADMIN_ALLOWED_ORIGINS`, `DATABASE_URL`, `API_GATEWAY_URL`, `NODE_ENV`. Ensure secret-rotation workflow covers admin. **AC**: app refuses to boot without `JWT_ACCESS_SECRET` (already enforced); prod requires origins.

**F3. Gateway/routing** — route `admin.azeeboplus.com` → admin container (`:4016`); ensure gateway forwards `x-user-*` + `x-gateway-secret` to admin so `ServiceAuthGuard` trusts headers. **AC**: prod-like staging serves UI at admin host and API calls authenticate via headers.

**F4. Observability** — wire `@azeebo/logger` structured logs + health/readiness; add dashboards/alerts consistent with other services. **AC**: `/health` monitored; request logs carry `x-request-id`.

> **VC-F**: One-command deploy to staging produces a working admin portal at its own host with green health and no auth bypass.

---

### Phase G — Post-Launch Maintenance & Decommission

**G1. Decommission web admin** — after staging sign-off, remove `apps/web/src/app/admin/*`, `AdminLayout.tsx`, and admin methods from `apps/web/src/lib/api/admin.ts`; redirect `/admin*` on web to the admin host. **AC**: web build passes with admin removed; redirects verified. Depends-on: VC-F sign-off.

**G2. Runbook** — document deploy/rollback (reuse `rollback.yml`), on-call, common failures (CSRF, token expiry, gateway header misconfig). **AC**: runbook merged.

**G3. Backlog** — fine-grained `PermissionsGuard`/`ROLE_PERMISSIONS` rollout; audit-log retention; report scheduling; feature-flag driven module visibility. **AC**: tracked as issues with owners.

**G4. Monitoring cadence** — error-rate/latency SLOs, weekly audit-log review, dependency updates via `dependabot.yml`. **AC**: SLOs defined; alerts firing to the right channel.

---

## 3. Dependency Graph (critical path)

```
A1 → A2 → A3 → A4
A1 → C2
B1 → A4
B2, B3 (parallel, independent)
A2 → B4 → C1
A3 → B5
C1, C2 → C3…C19  (C11/C17 also depend on C-BFF)
C* → E1..E4 → F1..F4 → G1 (decommission) → G2..G4
```

## 4. Global Definition of Done
- All `ADMIN_NAV` routes served from `apps/admin`, backed by the admin API, authenticated via reused gateway JWT + `@Roles('admin','superadmin')` + CSRF.
- All audit-identified defects (§0.3) fixed.
- Unit + contract + e2e + a11y suites green in CI; Docker image healthy; staging deploy validated.
- `apps/web` admin surface decommissioned and redirected.
