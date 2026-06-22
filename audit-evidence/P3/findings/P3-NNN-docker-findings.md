# Phase 3 — Container Image Hardening — Findings (P3-008..P3-013)

> **Owner:** DevOps/SRE
> **Captured at:** 2026-06-22 · SHA `fc01c8c`
> **Evidence on disk:**
> • [audit-evidence/P3/docker/_scan.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/docker/_scan.txt)
> • [audit-evidence/P3/docker/_base-images.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/docker/_base-images.txt)
> • [audit-evidence/P3/docker/_healthcheck.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/docker/_healthcheck.txt)
> • [audit-evidence/P3/docker/_dockerignore.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P3/docker/_dockerignore.txt)
> • [audit-evidence/P3/findings/P3-NNN-docker-findings.md](file:///Users/deprof/www/azeebo+/audit-evidence/P3/findings/P3-NNN-docker-findings.md) (this file)

---

## P3-008 — 🔴 P0 Critical — Base images pinned to mutable tag `node:20.11.1-alpine3.19`

**Symptom.** All 31 Dockerfiles begin with `FROM node:20.11.1-alpine3.19`. The `3.19` Alpine release branch receives security patches in-place; `20.11.1` is itself a feature release, not an LTS pin. Two reproducibility hazards stacked.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — silent CVE regressions possible
                            L (Latency)               — image rebuilds vary across time
```

**Resolution steps.**
1. Resolve digest: `docker pull node:20.11.1-alpine3.19 && docker inspect --format='{{index .RepoDigests 0}}' node:20.11.1-alpine3.19`.
2. Pin to `@sha256:<digest>` in every FROM.
3. Add Renovate rule to bump digest when upstream pushes a rebuild.
4. Maintain a `Dockerfile.base` shared via `COPY --from=azeebo/base:<digest> /usr/local/bin/pnpm /usr/local/bin/pnpm` to centralise the toolchain.

**Snippet.**
```diff
- FROM node:20.11.1-alpine3.19 AS builder
+ FROM node@sha256:9c0c4b1d3c8b7c6e9c0c4b1d3c8b7c6e9c0c4b1d3c8b7c6e9c0c4b1d3c8b7c6e AS builder
```

**Verification checklist.**
- [ ] Every `FROM` includes `@sha256:…`.
- [ ] `docker build --pull` produces identical image digest across two runs.
- [ ] Renovate raises a digest-bump PR within 24h of upstream rebuild.

---

## P3-009 — 🟠 P1 High — Zero `.dockerignore` files

**Symptom.** `find . -name '.dockerignore'` returns 0. Every `COPY .` invocation in any Dockerfile can include `.git`, `.env*`, `.npmrc`, `.pnpm-debug.log*`, test fixtures.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — secret exfiltration via context
                            L (Latency)               — context bloat slows builds
```

**Resolution steps.**
1. Create `/Users/deprof/www/azeebo+/.dockerignore` at repo root.
2. Reference via `docker build -f services/<svc>/Dockerfile .` which uses the root `.dockerignore`.

**Snippet.**
```dockerignore
# .dockerignore (root)
.git
.gitignore
.github
.env
.env.*
*.log
*.md
!services/**/README.md
!packages/**/README.md
docs/
audit-evidence/
node_modules/
**/node_modules/
**/dist/
**/.next/
**/__tests__/
**/*.spec.ts
**/*.test.ts
ci/
scripts/
infra/
.claude/
.trae/
.idea/
.vscode/
```

**Verification checklist.**
- [ ] `docker build --no-cache` context < 50 MB.
- [ ] `docker run --rm -it azeebo/auth-service:latest ls -a /` does not show `.git`.
- [ ] `.env` files are excluded from the build context.

---

## P3-010 — 🟠 P1 High — `apk add curl` in every Dockerfile; no `apk --no-cache` cleanup

**Symptom.** Every Dockerfile installs `curl` but never deletes the apk cache. Image size grows by ~2 MB per service.

**Root-cause framing.**
```
FABLE 5 pillars violated:  L (Latency) — image pull + cold-start latency
                            B (Brevity) — minor but recurring waste
```

**Resolution steps.**
1. Switch `apk add --no-cache curl`.
2. For multi-stage builds, move toolchain install to `builder` stage only.

**Snippet.**
```diff
- RUN apk add --no-cache curl && \
+ RUN apk add --no-cache curl
```

**Verification checklist.**
- [ ] `docker history azeebo/auth-service:latest` shows zero `apk add` layers in runner stage.

---

## P3-011 — 🟡 P2 Medium — No `USER` UID 65532 (distroless-style); uses UID 1001

**Symptom.** Every Dockerfile creates a `nodejs` user/group with UID/GID 1001. UID 1001 collides with host users on some orchestrators and with non-distroless PodSecurityStandards expectations.

**Root-cause framing.**
```
FABLE 5 pillars violated:  F (Foundational Security) — namespace UID predictability
                            E (Engineering Quality)   — non-canonical UID
```

**Resolution steps.**
1. Switch to UID/GID 65532 (the distroless `nonroot` convention).
2. Update Kubernetes manifests (`runAsUser: 65532`, `runAsGroup: 65532`, `fsGroup: 65532`).

**Snippet.**
```diff
- RUN addgroup -g 1001 -S nodejs && \
-     adduser -S nodejs -u 1001
+ RUN addgroup -g 65532 -S nodejs && \
+     adduser -S nodejs -u 65532 -G nodejs
```

**Verification checklist.**
- [ ] All K8s manifests updated to 65532.
- [ ] Pods start with `SecurityContext:` UID 65532.

---

## P3-012 — 🟡 P2 Medium — HEALTHCHECK path inconsistent

**Symptom.** `apps/web/Dockerfile` HEALTHCHECK against `http://localhost:3000` (root), services against `/health`. Some services expose `/health`, others `/ready`, others `/live`. K8s probes must align.

**Root-cause framing.**
```
FABLE 5 pillars violated:  A (Architecture) — probe contract drift
                            L (Latency)      — false-positive pod restarts
```

**Resolution steps.**
1. Standardize on three endpoints: `/live` (process-alive), `/ready` (deps-ready), `/health` (composite for Docker).
2. Each NestJS service registers a `TerminusModule` (`@nestjs/terminus`) with all three indicators.

**Snippet.**
```typescript
// services/<svc>/src/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private db: TypeOrmHealthIndicator) {}
  @Get() check() { return this.health.check([async () => this.db.pingCheck('database')]); }
  @Get('live') live() { return { status: 'ok' }; }
  @Get('ready') ready() { return this.health.check([…]); }
}
```

**Verification checklist.**
- [ ] Every Dockerfile HEALTHCHECK points at `/health`.
- [ ] Every K8s manifest points livenessProbe at `/live`, readinessProbe at `/ready`.

---

## P3-013 — 🟢 P3 Low — No `tini` or `dumb-init` for PID 1 signal handling

**Symptom.** `CMD ["node", …]` runs as PID 1 directly. Node handles SIGTERM correctly only in v15+, but signal forwarding to child workers is undefined.

**Root-cause framing.**
```
FABLE 5 pillars violated:  B (Brevity) — graceful-shutdown latency
                            L (Latency) — rolling deploys lose in-flight requests
```

**Resolution steps.**
1. Install `tini` in the runner stage.
2. Wrap CMD: `CMD ["/sbin/tini", "--", "node", "…"]`.

**Snippet.**
```diff
- CMD ["node", "services/core/auth-service/dist/services/core/auth-service/src/main.js"]
+ RUN apk add --no-cache tini
+ ENTRYPOINT ["/sbin/tini", "--"]
+ CMD ["node", "services/core/auth-service/dist/services/core/auth-service/src/main.js"]
```

**Verification checklist.**
- [ ] `docker exec <pid> kill -TERM 1` triggers graceful NestJS shutdown.
- [ ] `kubectl delete pod` reaches `Ready=False` within 30 s.

---

## Cross-cutting verification

| Item | Status |
|------|--------|
| All Dockerfiles digest-pinned | ❌ → P3-008 |
| Root `.dockerignore` present | ❌ → P3-009 |
| apk cache absent from runner | ❌ → P3-010 |
| UID 65532 convention | ❌ → P3-011 |
| Probe-path standardisation | ❌ → P3-012 |
| tini as PID 1 | ❌ → P3-013 |
| Multi-stage builds present | ✅ |
| Non-root user in runner | ✅ |
| `readOnlyRootFilesystem` enforced via K8s | ✅ |
| `capabilities.drop: ALL` enforced via K8s | ✅ |
| `HEALTHCHECK` defined | ✅ |