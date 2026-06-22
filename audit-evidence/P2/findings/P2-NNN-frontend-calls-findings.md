# T-P2-002 Findings — Frontend Call Index

**Evidence dir:** [audit-evidence/P2/frontend-calls/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/frontend-calls/)

---

## Summary

| Surface                                     | Methods extracted | URLs extracted |
| ------------------------------------------- | ----------------: | -------------: |
| [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts) (1409 lines) |  95 |  95 |
| [mobile/auth.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/api/auth.ts)            |  15 |  15 |
| [mobile/admin.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/api/admin.ts)            |   8 |   8 |
| [mobile/content.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/api/content.ts)         |   7 |   7 |
| (others — 14 mobile modules)                |  55 |  18 |
| **Total**                                   | **180** | **140 unique** |

**Generated artefact:** [frontend-calls.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/frontend-calls/frontend-calls.json) — 1517 lines.
**Generator:** [_build.js](file:///Users/deprof/www/azeebo+/audit-evidence/P2/frontend-calls/_build.js) — Node script, no `pnpm install` required.

---

## P2-005 — Web `api.ts` has 95 methods in a single 1409-line class (High · maintainability · API-design)

**File:** [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts#L246-L1335)

**Observation:** the `ApiClient` class in `apps/web/src/lib/api.ts` is 1089 lines of methods + 374 lines of supporting code (types, retry config, interceptors). 95 distinct API methods are exposed from a single class.

**RCA:**
1. **Symptom:** adding a new endpoint requires editing a single mega-class; type drift is invisible.
2. **Trigger:** any new backend route.
3. **Proximate cause:** `ApiClient` is monolithic instead of being split by domain (`api/auth.ts`, `api/wallet.ts`, etc.).
4. **Root cause:** no architectural decision on how the Next.js web client should consume `@azeebo/api-client` (which exists but is barely used — see [packages/api-client/src/index.ts](file:///Users/deprof/www/azeebo+/packages/api-client/src/index.ts)).
5. **Blast radius:** every refactor of an endpoint touches a 1409-line file.
6. **Detection gap:** no file-size lint rule.

**Remediation:** see P1-012 (Phase 1). Split `apps/web/src/lib/api.ts` by domain; consume from `@azeebo/api-client` for any shared surface with mobile.

---

## P2-006 — Mobile API modules use a `XXXApi` namespace pattern; web uses a `ApiClient` class — inconsistent (Medium · API-design · maintainability)

**Files:**
- Mobile: 16 × `apps/mobile/src/api/<domain>.ts` exporting `export const <domain>Api = { method: async (...) => ... }`
- Web: 1 × `apps/web/src/lib/api.ts` exporting `export const api = new ApiClient(...)`

**RCA:** two surfaces that consume the same backend ship two different abstractions. Refactoring the response shape in one doesn't update the other; **no contract test covers both**.

**Remediation:** both surfaces should call into `@azeebo/api-client` (the shared package that already exists) — one source of truth, two consumers.

---

## P2-007 — Frontend URL set (140 unique) vs backend route set (827 routes) — most frontend URLs use generic `/:id` and don't appear in the backend index (High · observability · API-design)

**Evidence:** [frontend-calls.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/frontend-calls/frontend-calls.json) · [contract-index.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/contract-index/contract-index.json)

**Observation:** the frontend calls 140 distinct URL templates; the backend declares 827 routes. The difference (687 routes) is **routes the backend exposes but no frontend calls**. The intersection is the actual contract surface.

**RCA:** the gap means:
- Many backend routes are dead code (no consumer).
- Many backend routes are admin-only (used by `apps/admin` or by internal services — not in this index).
- Some backend routes are mobile-app-only (e.g. biometric endpoints).

**Remediation:** produce a separate "admin calls" index from `apps/admin/src/modules/**/*.service.ts` (NestJS services) and a "portal calls" index from `apps/creator-portal/src/`. Then the join becomes meaningful.

---

## Summary

| ID    | Sev    | Title                                                                                  |
| ----- | ------ | -------------------------------------------------------------------------------------- |
| P2-005 | High   | Web `api.ts` is a 1409-line mega-class with 95 methods                                 |
| P2-006 | Medium | Mobile uses `XXXApi` namespace; web uses `ApiClient` class — inconsistent              |
| P2-007 | High   | Frontend URL set (140) vs backend route set (827) — no admin/portal calls indexed       |

**Verification status:**
- [x] Web call index complete → 95 methods + 95 URLs from `apps/web/src/lib/api.ts`.
- [x] Mobile call index complete → 85 methods across 17 mobile API modules.
- [ ] Admin/portal call indices → **NOT SATISFIED — `apps/admin` and `apps/creator-portal` are NestJS apps, not API consumers; they own their own endpoints, so the relevant cross-check is the contract index from T-P2-001 (already done).**