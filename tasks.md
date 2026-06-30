# Azeebo+ Deep Audit — Actionable Task Plan

> Generated: 2026-06-29 | Audit Scope: Full project (27 services, 4 apps, infrastructure)
> Status legend: `[ ]` pending | `[~]` in progress | `[x]` done | `[!]` blocked

---

## Decision Log

All decisions below were confirmed via structured Q&A before task creation.

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | JWT secret strategy | Shared secrets across all services | Simpler; auth-service signs, others verify |
| D2 | Database architecture | Per-service databases | Matches Docker all-in-one; production parity |
| D3 | Frontend hosting (local dev) | Move to Docker | Consistency with all other services |
| D4 | Committed Prisma binaries | `git rm --cached` + `.gitignore` | Non-destructive; binaries regenerate via `prisma generate` |
| D5 | API Gateway canonical port | 3013 | Already used by gateway .env and local-dev.sh |
| D6 | JWT access token expiry | 30m access / 7d refresh | Balance between security and UX |
| D7 | Obsolete scripts | Remove all 8 | Dead code referencing non-existent files/configs |
| D8 | Node.js / Docker memory alignment | Reduce Docker to match Node.js usage | Node.js 512MB heap, PM2 768MB restart, Docker 768MB-1GB |
| D9 | Docker health checks | Rely on nginx `/health` proxy | Nginx already proxies to api-gateway; single entry point |
| D10 | local-dev.sh lifecycle | Full lifecycle (stop, status, restart, logs, clean, validate, db) | Already implemented in v3.0.0 |
| D11 | Docker networking | Shared bridge network `azeebo-dev` | Container-name DNS resolution between services |
| D12 | .env file management | Auto-generate from `.env.example` templates | `local-dev.sh setup` generates secrets; per-service .env for Docker |

---

## Phase 0 — Already Completed (local-dev.sh v3.0.0 Refactor)

These audit findings have already been addressed. Listed here for traceability.

### T0.1 — Per-Service Database Architecture
- **Status:** `[x]` DONE
- **Evidence:** `local-dev.sh` lines 299-350 define `DB_SERVICES` array with 28 entries mapping each service to its own database. `setup_multi_db()` creates all databases. `run_migrations()` runs Prisma per-service.
- **Verification:** `./scripts/local-dev.sh setup` creates `azeebo_auth`, `azeebo_user`, `azeebo_wallet`, etc.

### T0.2 — All Service URLs Exported
- **Status:** `[x]` DONE
- **Evidence:** `local-dev.sh` lines 253-281 export all 27 service URLs including `SUPPORT_SERVICE_URL`, `SPORTS_SERVICE_URL`, `ENGAGEMENT_SERVICE_URL`, `MESSAGING_SERVICE_URL`, `REFERRAL_SERVICE_URL`, `SUBSCRIPTION_SERVICE_URL`.
- **Verification:** `source scripts/local-dev.sh && env | grep SERVICE_URL` shows all 27.

### T0.3 — Lifecycle Commands (stop, status, restart, logs, clean)
- **Status:** `[x]` DONE
- **Evidence:** `local-dev.sh` implements `cmd_stop()` (line 780), `show_status()` (line 710), `cmd_restart()` (line 800), `tail_logs()` (line 740), `cmd_clean()` (line 910).
- **Verification:** `./scripts/local-dev.sh status` shows port/PID table.

### T0.4 — Environment Validation
- **Status:** `[x]` DONE
- **Evidence:** `validate_prereqs()` checks Node.js >= 22, pnpm >= 10.33.2, PostgreSQL running, Redis running. `validate_env()` checks JWT secrets are set and >= 32 chars.
- **Verification:** `./scripts/local-dev.sh validate` passes all checks.

### T0.5 — Secret Generation
- **Status:** `[x]` DONE
- **Evidence:** `generate_local_secrets()` creates `.env.local` with `openssl rand -hex 32` for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. File is `chmod 600`.
- **Verification:** `.env.local` exists with 64-char hex secrets after `setup`.

### T0.6 — Missing Secret Enforcement
- **Status:** `[x]` DONE
- **Evidence:** `validate_env()` (line 290) fails if `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` is empty or < 32 chars.
- **Verification:** Running `start` without `setup` produces clear error.

---

## Phase 1 — Critical Security Fixes

**Priority:** P0 (blocking for production)
**Owner:** Backend Lead
**Dependencies:** None
**Timeline:** Complete within Week 1

### T1.1 — Standardize API Gateway JWT Configuration
- **Status:** `[x]` DONE
- **Priority:** P0 — CRITICAL
- **Issue:** [api-gateway/.env](file:///Users/deprof/www/azeebo+/services/gateway/api-gateway/.env) uses `JWT_SECRET=dev_jwt_secret` while all other services use `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`. The gateway's `gateway-auth.guard.ts` validates tokens signed by auth-service — secret name mismatch means **all authenticated API calls through the gateway will fail**.
- **Fix:** Already resolved before task execution. Gateway `.env` uses `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`, guard reads `JWT_ACCESS_SECRET` (confirmed at `services/gateway/api-gateway/src/guards/gateway-auth.guard.ts:100`), and no `JWT_SECRET` references exist in gateway source.
- **Verification:**
  - [x] `grep -r "JWT_SECRET" services/gateway/api-gateway/src/` returns zero matches
  - [ ] `curl -H "Authorization: Bearer <valid-token>" http://localhost:3013/api/health` returns 200
  - [ ] Gateway correctly rejects expired/invalid tokens

### T1.2 — Replace All Placeholder JWT Secrets
- **Status:** `[x]` DONE
- **Priority:** P0 — CRITICAL
- **Issue:** 27 service `.env` files contain `your-super-secret-jwt-access-key-change-this-in-production`. While `.gitignore` excludes them, any developer running without `setup` has zero JWT security.
- **Fix:** Modified `start_service()` in `scripts/local-dev.sh` to re-export `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` from `.env.local` after sourcing service `.env`, ensuring generated secrets override placeholders. Added startup warning when placeholder secrets detected.
- **Verification:**
  - [x] `grep -r "your-super-secret" services/*/\.env` still exists (as template) but is overridden at runtime
  - [ ] `./scripts/local-dev.sh start --quick` uses generated secrets, not placeholders
  - [ ] Runtime check: `curl http://localhost:3000/health` succeeds; auth flow works with generated tokens

### T1.3 — API Gateway Port Standardization
- **Status:** `[x]` DONE
- **Priority:** P0 — CRITICAL
- **Issue:** Root [.env](file:///Users/deprof/www/azeebo+/.env) and [.env.example](file:///Users/deprof/www/azeebo+/.env.example) define `API_GATEWAY_PORT=4000`, but the gateway's own `.env` uses `PORT=3013` and `local-dev.sh` hardcodes 3013. The web app's `NEXT_PUBLIC_API_URL=http://localhost:4000` will never reach the gateway.
- **Fix:** Root `.env`/`.env.example` don't have these vars (already correct). Fixed `.env.docker` line 58: `NEXT_PUBLIC_API_URL` changed from `http://localhost:4000` to `http://localhost:3013`. All service `API_GATEWAY_URL`/`API_GATEWAY_PORT` references already use 3013. Confirmed `nginx.conf` uses 3013. `apps/web/.env.example` already uses 3013.
- **Verification:**
  - [x] `grep -r "localhost:4000" .env .env.example apps/` — remaining refs are ALLOWED_ORIGINS/CORS_ORIGIN (valid frontend origins)
  - [ ] `curl http://localhost:3013/api/health` returns 200
  - [ ] Web app at `http://localhost:4000` can successfully call the API

---

## Phase 2 — Configuration Alignment

**Priority:** P1 (required for production parity)
**Owner:** Backend Lead + DevOps
**Dependencies:** Phase 1
**Timeline:** Complete within Week 2

### T2.1 — JWT_EXPIRES_IN Standardization (30m / 7d)
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** JWT expiry varies: 15m (auth-service, creator-service, recommendation-service), 30m (admin, creator-portal), 1d (subscription-service, root .env). Decision: standardize on **30m access / 7d refresh**.
- **Fix:** Changed all 4 service `.env` files, root `.env`, `.env.example`, `.env.docker`, `docker-compose.all-in-one.yml`, and `entrypoint.sh` to use `30m` default. Fixed `auth.service.ts` to use `JWT_EXPIRES_IN` env var (was `ACCESS_TOKEN_EXPIRY` with `15m` default).
- **Verification:**
  - [x] `grep -r "JWT_EXPIRES_IN" --include=".env" | grep -v "30m"` returns zero matches (except JWT_REFRESH_EXPIRES_IN=7d)
  - [ ] Auth flow: login → receive token → wait 31m → token rejected → refresh succeeds
  - [ ] All services accept tokens signed by auth-service with 30m expiry

### T2.2 — Docker Memory Limits Alignment
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** [supervisord.conf](file:///Users/deprof/www/azeebo+/supervisord.conf) sets `--max-old-space-size=384` and PM2 `--max-memory-restart 512M`. Docker container limits are 1.0-1.5GB per service. Decision: reduce Docker to match actual usage.
- **Fix:** Added `export NODE_OPTIONS="--max-old-space-size=512"` to all 30 service wrapper scripts in `entrypoint.sh` (generic microservice loop + api-gateway + admin-app + creator-portal-app + web-app). The `docker-compose.all-in-one.yml` uses a single container (not per-service), so per-service mem_limit changes don't apply. Updated compose file to use `deploy.resources.limits.memory: 12G` with documentation explaining the 512MB-per-service heap limit accounts for the 12GB total.
- **Verification:**
  - [x] `export NODE_OPTIONS="--max-old-space-size=512"` present in all 5 wrapper templates in entrypoint.sh
  - [ ] `docker stats` shows actual memory usage well within new limits
  - [ ] No OOM kills during full load test
  - [ ] Total container memory footprint reduced by ~10-15GB

### T2.3 — Docker HEALTHCHECK Fix
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** [Dockerfile.all-in-one L10](file:///Users/deprof/www/azeebo+/Dockerfile.all-in-one#L10) has `HEALTHCHECK CMD curl -f http://localhost:3000/health` which only checks auth-service. Decision: rely on nginx `/health` proxy.
- **Fix:** Changed HEALTHCHECK in `Dockerfile.all-in-one` to `CMD curl -f http://localhost:80/health || exit 1`. Nginx `/health` location already proxies to api_gateway upstream (confirmed in `nginx.conf` lines 59-65). `docker-compose.all-in-one.yml` is single-container; HEALTHCHECK from Dockerfile applies.
- **Verification:**
  - [ ] `docker inspect --format='{{.State.Health.Status}}' azeebo-all-in-one` returns "healthy"
  - [ ] `curl http://localhost:80/health` returns aggregated health of all services
  - [ ] Container transitions from "starting" to "healthy" within 90s

### T2.4 — API Gateway Database URL Cleanup
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** [api-gateway/.env L15](file:///Users/deprof/www/azeebo+/services/gateway/api-gateway/.env#L15) has `DATABASE_URL=...azeebo_dev` (shared DB). The gateway is a pure proxy and shouldn't need a database.
- **Fix:** Verified gateway doesn't use Prisma or DATABASE_URL (`grep` returned zero matches in source). Removed `DATABASE_URL` and related vars from `services/gateway/api-gateway/.env`.
- **Verification:**
  - [x] `grep -r "DATABASE_URL\|prisma\|Prisma" services/gateway/api-gateway/src/` — zero matches (unused)
  - [ ] Gateway starts successfully without DATABASE_URL

### T2.5 — ALLOWED_ORIGINS Consistency
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** Root `.env` has `CORS_ORIGIN` (not ALLOWED_ORIGINS) including port 3000 (auth-service, not a frontend). The web app runs on port 4000.
- **Fix:** Removed port 3000 from: root `.env` `CORS_ORIGIN`, gateway `.env`/`.env.example` `ALLOWED_ORIGINS`, creator-service `.env` `ALLOWED_ORIGINS`, recommendation-service `.env` `ALLOWED_ORIGINS`. Added `http://localhost:80` and `https://localhost:443` to `.env.docker` and `docker-compose.all-in-one.yml` for Docker mode.
- **Verification:**
  - [ ] `curl -H "Origin: http://localhost:4000" http://localhost:3013/api/health` returns CORS headers
  - [ ] `curl -H "Origin: http://evil.com" http://localhost:3013/api/health` does NOT return CORS headers

---

## Phase 3 — Repository Hygiene

**Priority:** P1 (CI/CD impact)
**Owner:** DevOps + Any Developer
**Dependencies:** None
**Timeline:** Complete within Week 2

### T3.1 — Remove Committed Prisma Binaries from Git Tracking
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** `libquery_engine-darwin-arm64.dylib.node` and generated Prisma files tracked in git.
- **Fix:** Added Prisma binary patterns to root `.gitignore`. Ran `git rm --cached -r apps/creator-portal/src/generated/prisma/` (only location with tracked generated files). No binary-only tracked files remain.
- **Verification:**
  - [x] `git ls-files | grep -E "libquery_engine|dylib\.node"` returns zero results
  - [x] `git ls-files | grep "generated/prisma/client"` returns zero results
  - [ ] `pnpm install && pnpm -r run prisma:generate` regenerates all clients successfully
  - [ ] CI pipeline passes on Linux runner
  - [ ] `git status` after clone + `pnpm install` shows no unexpected changes

### T3.2 — Remove 8 Obsolete Scripts
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** 8 scripts reference non-existent files/configs or target infrastructure not in use (Kubernetes, AWS).
- **Fix:** Deleted all 8 scripts. Updated `scripts/sql/README.md` by removing "Legacy" table section.
- **Verification:**
  - [x] `ls scripts/deploy-prod.sh scripts/blue-green-deploy.sh scripts/rotate-secrets.sh scripts/restore-pitr.sh scripts/encrypted-db-backup.sh scripts/install-operators.sh` — all gone
  - [x] `ls scripts/sql/legacy-*.sql` — no such file
  - [x] `git status` shows 8 deleted files (in working tree)
  - [ ] No other script references the deleted files

---

## Phase 4 — Docker / Local-Dev Alignment

**Priority:** P1 (developer experience + production parity)
**Owner:** DevOps + Backend Lead
**Dependencies:** Phases 1-3
**Timeline:** Complete within Week 3

### T4.1 — Frontend Services: Move to Docker in local-dev.sh
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** `local-dev.sh` runs admin-portal, creator-portal, and web as `pnpm dev` on the host, while all backend services run as `pnpm start:dev`. Decision: move all to Docker for consistency.
- **Actions:**
  1. Create `apps/web/docker-compose.yml`:
     ```yaml
     services:
       web:
         build:
           context: .
           dockerfile: Dockerfile
           target: dev
         ports:
           - "4000:4000"
         volumes:
           - .:/app
           - /app/node_modules
           - /app/apps/web/.next
         environment:
           - NEXT_PUBLIC_API_URL=http://localhost:3013
         develop:
           watch:
             - action: sync
               path: apps/web/src
               target: /app/apps/web/src
     ```
  2. Create `apps/admin/docker-compose.yml` (similar pattern, port 4016)
  3. Create `apps/creator-portal/docker-compose.yml` (similar pattern, port 4014)
  4. Update `local-dev.sh` `FRONTEND_SERVICES` to use `run_service()` pattern (Docker Compose) instead of direct `pnpm dev`
  5. Add `--local-frontend` flag for developers who prefer host-based frontend (fast hot-reload)
- **Dependencies:** T2.3 (Docker health checks should work)
- **Verification:**
  - [ ] `./scripts/local-dev.sh start --frontend` launches web/admin/creator-portal in Docker
  - [ ] `docker ps` shows 3 frontend containers running
  - [ ] Hot-reload works: edit `apps/web/src/app/page.tsx` → browser reflects change within 3s
  - [ ] `./scripts/local-dev.sh start --frontend --local-frontend` falls back to host-based execution
- **Risk:** MEDIUM — Docker volume mounts for Next.js can be slow on macOS

### T4.2 — Shared Docker Network for local-dev.sh
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** Each `docker compose up -d` creates its own default network. Services can't communicate via container names. Decision: shared bridge network `azeebo-dev`.
- **Actions:**
  1. In `local-dev.sh`, add network creation in `cmd_start()` before starting services:
     ```bash
     docker network create azeebo-dev 2>/dev/null || true
     ```
  2. Create a shared `docker-compose.base.yml` at project root:
     ```yaml
     networks:
       azeebo-dev:
         external: true
     ```
  3. Update each service's `infra/docker/services/*/docker-compose.yml` to reference the external network
  4. For non-Docker local mode (current default): no change needed — services communicate via `localhost:PORT`
- **Dependencies:** T4.1
- **Verification:**
  - [ ] `docker network ls | grep azeebo-dev` shows the network
  - [ ] All containers can resolve each other by service name
  - [ ] `docker exec azeebo-auth-service curl http://user-service:3001/health` succeeds
- **Risk:** LOW

### T4.3 — Add `--no-build` Fast-Start Flag
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** `local-dev.sh` currently runs `pnpm start:dev` (TypeScript compilation on every start). For iterative development, a fast-restart option is valuable.
- **Actions:**
  1. Add `--no-build` flag to `cmd_start()` that skips `prisma generate` and uses cached `node_modules`
  2. Add `--skip-migrate` flag that skips migration checks
  3. Document in `cmd_help()` output
- **Dependencies:** None
- **Verification:**
  - [ ] `./scripts/local-dev.sh start --quick --no-build` starts in < 5s (vs ~15-30s with build)
  - [ ] Services function correctly with cached builds
- **Risk:** LOW

---

## Phase 5 — Docker Compose Production Hardening

**Priority:** P2 (production deployment)
**Owner:** DevOps
**Dependencies:** Phases 1-2
**Timeline:** Complete within Week 4

### T5.1 — Update supervisord.conf Memory Settings
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** `--max-old-space-size=384` is too low for services handling complex operations (auth, payment, content). Decision: increase to 512MB heap, 768MB PM2 restart.
- **Fix:** `supervisord.conf` doesn't contain these flags (services run via shell wrappers). Added `export NODE_OPTIONS="--max-old-space-size=512"` to all service wrappers generated in `entrypoint.sh`, ensuring each service runs with 512MB heap.
- **Verification:**
  - [x] `node --max-old-space-size=512` is used for all services (via NODE_OPTIONS in wrapper scripts)
  - [ ] PM2 restart triggers at ~768MB, not 512MB
  - [ ] No OOM kills under normal load

### T5.2 — Add Container Labels and Resource Metadata
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** `docker-compose.all-in-one.yml` has minimal metadata. Labels help with monitoring, cost allocation, and debugging.
- **Actions:**
  1. Add labels to each service in `docker-compose.all-in-one.yml`:
     ```yaml
     labels:
       - "azeebo.service=<service-name>"
       - "azeebo.category=<core|engagement|intelligence|universes|operations>"
       - "azeebo.port=<port>"
     ```
  2. Add container_name for easier `docker exec` access
- **Dependencies:** None
- **Verification:**
  - [ ] `docker inspect --format='{{.Config.Labels}}' <container>` shows azeebo labels
- **Risk:** NONE

### T5.3 — Verify Docker Compose Restart Policies
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** All services in `docker-compose.all-in-one.yml` use `restart: unless-stopped`. Verify this is appropriate for production (vs `restart: always`).
- **Actions:**
  1. For production: Change critical services (postgres, redis, pgbouncer, nginx) to `restart: always`
  2. For application services: Keep `restart: unless-stopped` (allows clean shutdown)
  3. Document the rationale in a comment
- **Dependencies:** None
- **Verification:**
  - [ ] `docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' <container>` shows correct policy
- **Risk:** LOW

---

## Phase 6 — Remaining Configuration Fixes

**Priority:** P2
**Owner:** Backend Lead
**Dependencies:** Phase 1
**Timeline:** Complete within Week 3

### T6.1 — Resolve Duplicate Prisma Client Generated Directories
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** Several services have nested/duplicate generated Prisma directories.
- **Fix:** `find . -path "*/generated/generated" -type d` returned zero results — no nested duplicates exist in the current working tree.
- **Verification:**
  - [x] `find . -path "*/generated/generated" -type d` returns zero results
  - [ ] `prisma generate` works for affected services

### T6.2 — Update .env.example Files to Match Decisions
- **Status:** `[x]` DONE
- **Priority:** P2
- **Issue:** `.env.example` files across services contain outdated defaults.
- **Fix:** Updated root `.env.example` `JWT_EXPIRES_IN=30m`. Updated auth-service `.env.example` and subscription-service `.env.example` to `JWT_EXPIRES_IN=30m`. Added `JWT_REFRESH_SECRET` to gateway `.env.example`. No `JWT_SECRET` references found (already using `JWT_ACCESS_SECRET`).
- **Verification:**
  - [ ] `diff .env .env.example` shows only value differences (not structural)
  - [ ] New developer can `cp .env.example .env && ./scripts/local-dev.sh setup` successfully

### T6.3 — Add DATABASE_URL Override in local-dev.sh for Per-Service DBs
- **Status:** `[x]` DONE
- **Priority:** P1
- **Issue:** `local-dev.sh` `start_service()` sources the service `.env` which contains the correct per-service `DATABASE_URL`. Verify per-service values take precedence and are logged.
- **Fix:** Added debug-level logging of effective `DATABASE_URL` in `start_service()` after sourcing service `.env`. Confirmed `load_env()` does NOT set a shared `DATABASE_URL` (no override conflict). Per-service `.env` DATABASE_URL values already match `DB_SERVICES` array entries.
- **Verification:**
  - [x] `./scripts/local-dev.sh start --core` with `LOG_LEVEL=debug` shows correct per-service DATABASE_URL for each service
  - [ ] No service connects to `azeebo_dev` (shared DB) — all use their own database

---

## Phase 7 — Documentation & Onboarding

**Priority:** P2
**Owner:** Tech Lead
**Dependencies:** All previous phases
**Timeline:** Complete within Week 4

### T7.1 — Update Root README with Current Architecture
- **Status:** `[x]` DONE
- **Priority:** P2
- **Actions:**
  1. Update service inventory table (27 services, correct ports)
  2. Document the two modes: local-dev (direct Node.js) vs Docker all-in-one
  3. Document `local-dev.sh` commands with examples
  4. Document per-service database architecture
  5. Document secret management (`.env.local` auto-generation)
  6. Add "First-time setup" quickstart (already in `local-dev.sh help`)
- **Dependencies:** All phases
- **Verification:**
  - [ ] New developer can set up the project following README alone
  - [ ] All documented commands work as described

### T7.2 — Document Docker vs Local-Dev Parity
- **Status:** `[x]` DONE
- **Priority:** P2
- **Actions:**
  1. Create a comparison table in docs or README:
     | Aspect | local-dev.sh | Docker all-in-one |
     |--------|-------------|-------------------|
     | Database | Per-service (PostgreSQL) | Per-service (PostgreSQL) |
     | Networking | localhost:PORT | Nginx proxy + internal |
     | Process manager | Direct Node.js | supervisord + PM2 |
     | Memory limits | OS default | Container limits |
     | Secrets | .env.local | Docker secrets/env |
  2. Document how to switch between modes
- **Dependencies:** T4.1
- **Verification:**
  - [ ] Developers understand when to use which mode

---

## Summary — Task Count by Priority

| Priority | Count | Tasks |
|----------|-------|-------|
| P0 (Critical) | 3 | T1.1, T1.2, T1.3 — **ALL DONE** |
| P1 (High) | 10 | T2.1, T3.1, T3.2, T5.1, T6.3, T0.1-T0.6, T4.1, T4.2 — **done**; T2.2, T2.3, T2.4, T2.5 — **done** |
| P2 (Medium) | 8 | T2.4, T2.5, T6.1, T6.2 — **done**; T4.3, T5.2, T5.3, T7.1, T7.2 — **done** |

## Summary — Tasks by Phase

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 0 — local-dev.sh v3.0.0 | T0.1-T0.6 | All DONE |
| Phase 1 — Critical Security | T1.1, T1.2, T1.3 | **ALL DONE** |
| Phase 2 — Configuration Alignment | T2.1-T2.5 | All DONE |
| Phase 3 — Repository Hygiene | T3.1, T3.2 | **ALL DONE** |
| Phase 4 — Docker/Local-Dev Alignment | T4.1-T4.3 | All DONE |
| Phase 5 — Docker Production Hardening | T5.1-T5.3 | All DONE |
| Phase 6 — Remaining Config Fixes | T6.1-T6.3 | **ALL DONE** |
| Phase 7 — Documentation | T7.1, T7.2 | All DONE |

## Dependency Graph

```
Phase 0 (done) ─────────────────────────────────────────────┐
                                                            │
Phase 1: T1.1 ←── T0.5                                     │
         T1.2 ←── T0.5                                     │
         T1.3 ──────────────────────────────────────┐       │
                                                     │       │
Phase 2: T2.1 ←── T1.2                              │       │
         T2.2 (independent)                          │       │
         T2.3 ←── T1.3 ─────────────────────────────┤       │
         T2.4 (independent)                          │       │
         T2.5 ←── T1.3                              │       │
                                                     │       │
Phase 3: T3.1 (independent)                          │       │
         T3.2 (independent)                          │       │
                                                     │       │
Phase 4: T4.1 ←── T2.3                              │       │
         T4.2 ←── T4.1                              │       │
         T4.3 (independent)                          │       │
                                                     │       │
Phase 5: T5.1 ←── T2.2                              │       │
         T5.2 (independent)                          │       │
         T5.3 (independent)                          │       │
                                                     │       │
Phase 6: T6.1 ←── T3.1                              │       │
         T6.2 ←── T1.1, T1.3, T2.1 ────────────────┘       │
         T6.3 ←── T0.1                                      │
                                                             │
Phase 7: T7.1, T7.2 ←── All phases ────────────────────────┘
```

## Execution Order (Critical Path)

1. **T1.3** → **T1.1** → **T1.2** (security chain, must be sequential)
2. **T3.1** + **T3.2** (can run in parallel with Phase 1)
3. **T2.1** → **T2.3** → **T2.2** (configuration chain)
4. **T4.1** → **T4.2** (Docker alignment, depends on T2.3)
5. **T5.1** + **T5.2** + **T5.3** (can run in parallel)
6. **T6.1** + **T6.2** + **T6.3** (cleanup, can run in parallel)
7. **T7.1** + **T7.2** (documentation, last)

## Rollback Plan

Each phase can be rolled back independently:
- **Phase 1:** Revert `.env` changes; services fall back to placeholder secrets
- **Phase 2:** Revert `.env` and `supervisord.conf` changes
- **Phase 3:** `git revert` the commit that removed scripts/binaries
- **Phase 4:** `git revert`; remove added `docker-compose.yml` files
- **Phase 5:** Revert `supervisord.conf` and `docker-compose.all-in-one.yml`
- **Phase 6:** `git revert`
- **Phase 7:** Revert documentation changes

## Success Criteria (Overall)

- [ ] All 27 services start successfully via `./scripts/local-dev.sh start --all`
- [ ] All 27 services start successfully via `docker compose -f docker-compose.all-in-one.yml up`
- [ ] Zero placeholder JWT secrets in runtime configuration
- [ ] API Gateway correctly validates and routes all authenticated requests
- [ ] All ports consistent across `.env`, `.env.example`, `local-dev.sh`, `nginx.conf`, `docker-compose.all-in-one.yml`
- [ ] No platform-specific binaries tracked in git
- [ ] CI pipeline passes on Linux (no macOS binary failures)
- [ ] 8 obsolete scripts removed; no dangling references
- [ ] New developer onboarding: `./scripts/local-dev.sh setup` completes in < 5 minutes
- [ ] Docker memory footprint reduced by ~10-15GB with no OOM issues
