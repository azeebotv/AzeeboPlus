# T-P2-001 Findings — Backend Contract Index

**Evidence dir:** [audit-evidence/P2/contract-index/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/)

---

## Index summary

| Stat                                                       | Value                  |
| ---------------------------------------------------------- | ---------------------- |
| Services indexed                                           | **29** (27 + admin + portal) |
| Controllers indexed                                        | **128**                |
| Routes indexed                                             | **827**                |
| Routes with `@Public()` declared                           | **0**                  |
| Routes with **NO** `@UseGuards`                            | **519** (62.7%)        |
| Routes with `@UseGuards`                                   | **308** (37.3%)        |
| Routes with both `@UseGuards` + `@Throttle`                | varies                 |

**Generated artefact:** [audit-evidence/P2/contract-index/contract-index.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/contract-index.json) — 7594 lines, machine-readable.
**Generator:** [audit-evidence/P2/contract-index/_build.js](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/_build.js) — Node script, no `pnpm install` required.

---

## Unguarded routes per service (top 15)

```
  67  services/universes/lifestyle-service
  53  apps/admin
  42  services/universes/vertical-service
  38  services/intelligence/analytics-service
  26  services/core/user-service
  24  services/operations/support-service
  24  services/universes/sports-service
  23  services/universes/movie-service
  22  services/core/content-service
  22  services/core/media-service
  20  services/universes/games-service
  18  services/universes/comedy-service
  15  services/intelligence/recommendation-service
  13  services/core/auth-service
  12  services/universes/creator-service
```

---

## P2-001 — `wallet.controller.ts` uses `@Controller('v1/wallet')` but auth + most services use unversioned paths (High · API-design · functionality)

**File:** [services/core/wallet-service/src/modules/wallet/wallet.controller.ts](file:///Users/deprof/www/azeebo+/services/core/wallet-service/src/modules/wallet/wallet.controller.ts#L36)

**Observation:** wallet-service prefixes its routes with `v1/`, payment-service also uses `v1/`, but auth-service, user-service, search-service use unprefixed paths. The frontend `apps/web/src/lib/api.ts#L13` resolves `API_BASE_URL` to a single host; if the gateway routes by path-prefix, versioned + unversioned services collide.

**RCA:**
1. **Symptom:** calls to `/v1/wallet/transactions` succeed, calls to `/auth/login` succeed (if the gateway happens to route correctly), but a future `/v2/payments` would 404.
2. **Trigger:** any frontend call to a wallet/payment endpoint vs an auth endpoint, against a gateway that expects consistency.
3. **Proximate cause:** no enforced versioning policy; the doc at [docs/VERSIONING-POLICY.md](file:///Users/deprof/www/azeebo+/docs/VERSIONING-POLICY.md) (from Phase 1 evidence) has not been enforced at the framework level.
4. **Root cause:** no ADR on API versioning; different teams chose different conventions.
5. **Blast radius:** every wallet + payment route + any future `v2` surface.
6. **Detection gap:** no contract test asserting gateway routes by version.

**Remediation:** adopt URL-prefix versioning for **every** service (e.g. `@Controller({ path: 'wallet', version: '1' })` via NestJS `VersioningType.URI`) and run with `app.enableVersioning()` in every `main.ts`. Add a CI check that every controller declares a version.

---

## P2-002 — 519 of 827 routes have no `@UseGuards` (Critical · security)

**Evidence:** [audit-evidence/P2/contract-index/_stats.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/_stats.txt)

**Observation:** 62.7% of routes ship without a guard. Some of these are genuinely public (health, public content); others (e.g. admin, support, search, user-deletion) are not.

**RCA:** Per-service breakdown:
- `lifestyle-service`: 67 unguarded (likely most are public content — needs triage)
- `apps/admin`: 53 unguarded (these are admin endpoints; **most should be guarded**)
- `vertical-service`: 42 (mix of universes browse + admin)
- `analytics-service`: 38 (most are admin-only)
- `user-service`: 26 — including the GDPR endpoints (P1-020)

**Remediation:** see P1-021 (gateway-level guard) + per-service triage. Build a per-service allowlist of `@Public()`-marked routes; everything else must have `@UseGuards`.

---

## P2-003 — `@Public()` is declared 0 times across 827 routes (Medium · API-design)

**Evidence:** `_stats.txt`

**Observation:** no controller declares `@Public()` to mark intentionally-public routes. The intent of every public route is implicit, scattered across file comments and inconsistent `@UseGuards` patterns.

**RCA:** Without a `@Public()` decorator, every refactor that adds `@UseGuards` globally (per P1-021) will break the public surface. The team relies on a comment in `app.module.ts` ("don't add guards globally") instead of an explicit allowlist.

**Remediation:** introduce a `@Public()` decorator in `packages/auth/src/index.ts` and require every public route to declare it.

---

## P2-004 — Contract index reproducible from commit SHA `fc01c8c` (Low · observability)

**Evidence:** [audit-evidence/P2/contract-index/_build.js](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/_build.js) · generated artefact includes `commit` field.

**Remediation:** Add the same script to `ci.yml` as a nightly job: `node scripts/build-contract-index.ts > audit-evidence/contract-index.json` and store it as a CI artefact. Then any drift between two CI runs surfaces as a diff.

---

## Summary

| ID    | Sev      | Title                                                                |
| ----- | -------- | -------------------------------------------------------------------- |
| P2-001 | High     | wallet/payment use `v1/`-prefixed paths; auth/user do not            |
| P2-002 | Critical | 519 of 827 routes have no `@UseGuards`                               |
| P2-003 | Medium   | `@Public()` decorator is declared 0 times (no explicit allowlist)    |
| P2-004 | Low      | Contract index reproducible from SHA, but not in CI                  |

**Verification status:**
- [x] Index covers every controller (29 services, 128 controllers, 827 routes).
- [x] Schema includes all 7 fields per §2.2 of the prompt (file, ctrl_path, method, sub_path, full_path, guards, public).
- [x] Index is reproducible from the recorded SHA — running `_build.js` again on `fc01c8c` (dirty) reproduces the JSON.
- [ ] DTO class reflection (request/response shape) → **NOT SATISFIED — requires `ts-morph` install; deferred to a host with `pnpm install` complete.**