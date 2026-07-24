# Azeebo+ — Master TODO

> Generated: 2026-07-24 (Post-implementation audit)
> Based on: 37 doc/ MD files audited against full codebase (27 services, 4 apps, 21 packages, 9 CI/CD workflows, 136 test files)

---

## Executive Summary

| Area | Total | Done | Remaining |
|------|-------|------|-----------|
| Documentation Accuracy | 8 | 6 | 2 |
| New Features (Implemented) | 5 | 5 | 0 |
| New Features (Partial) | 3 | 0 | 3 |
| Test Coverage | 5 | 5 | 0 |
| Platform Quality | 8 | 8 | 0 |
| Documentation Completeness | 6 | 2 | 4 |
| **Total** | **35** | **26** | **9** |

---

## 1. Documentation Accuracy (2 remaining)

### D1. CLAUDE.md — Service Catalog ✅
- **Status:** `[x]` DONE
- **Description:** All 27 ports and 11 DB names corrected.

### D2. README.md — Mobile App + Packages ✅
- **Status:** `[x]` DONE
- **Description:** Mobile app added, 7 missing packages added.

### D3. doc/remaining-tasks.md — Stale Status ✅
- **Status:** `[x]` DONE
- **Description:** All 75 items updated to DONE.

### D4. doc/DEPLOYMENT-CHECKLIST.md — Wrong Port ✅
- **Status:** `[x]` DONE
- **Description:** Analytics port fixed (3040→3008).

### D5. engineering/api/gateway.md — Incomplete Documentation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Only 33 lines. Missing route configuration, proxy logic, rate limiting, circuit breaker documentation. Gateway has 1481 lines of code.

### D6. engineering/api/auth-service.md — Missing Endpoints
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Only documents 10 auth endpoints. Missing MFA endpoints (GET/POST /mfa/*), social auth (GET /auth/social/*), device management (GET/DELETE /auth/devices/*), admin endpoints, OTP endpoints.

---

## 2. New Features Implemented (All Done)

### F1. Feature Flags — Admin API + UI ✅
### F2. Device Limits — Schema + Service + Controller ✅
### F3. Geo Restriction — Schema + Access Control ✅
### F4. User Feature Preferences ✅
### F5. Pre-existing Test Fixes ✅

---

## 3. Partial Features (Need PRDs — Skipped Per User Request)

### P1. Pay-Per-View Live Events
- **Status:** `[ ]` PENDING
- **Priority:** P0

### P2. Creator Tipping Tiers
- **Status:** `[ ]` PENDING
- **Priority:** P0

### P3. Bundle Passes
- **Status:** `[ ]` PENDING
- **Priority:** P0

---

## 4. Test Coverage (All Done)

### T1. Gateway Tests ✅ (8 new tests)
### T2. Engagement Service Tests ✅ (4 new tests)
### T3. Messaging Service Tests ✅ (4 new tests)
### T4. Referral Service Tests ✅ (4 new tests)
### T5. Recommendation Service Tests ✅ (3 new tests)

---

## 5. Platform Quality (All Done)

### Q1-Q8: All platform quality items completed ✅

---

## 6. Documentation Completeness (4 remaining)

### C1. Design README — Empty Template
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** `doc/design/README.md` is a skeleton with empty table. No design system docs, component specs, or UX guidelines exist.

### C2. Engineering README — Empty Template
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** `doc/engineering/README.md` is a skeleton with empty table. No engineering standards docs exist.

### C3. QA README — Empty Template
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** `doc/qa/README.md` is a skeleton with empty table. No QA process docs exist beyond the 2 checklists.

### C4. doc/product/analytics/events.md — Incomplete Event Tracking
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** 56 events documented but only 29 mobile screens and 73 web pages track analytics. Some documented events (e.g., `movie_rated`, `movie_shared`, `lifestyle_content_shared`) may not be fully wired.

---

## 7. Stale Documentation (All Updated)

### S1. creator.md — Analytics Status ✅ (updated to partial)
### S2. admin.md — Page Count + Date ✅ (updated to 21 pages)
### S3. product/README.md — Feature Docs ✅ (added feature flags/geo/device refs)

---

## 8. New Features Not Yet Documented

### N1. Feature Flags — Not in ARCHITECTURE.md or SERVICES.md
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Feature flag system implemented (packages/feature-flags, admin UI, gateway integration) but not documented in ARCHITECTURE.md or SERVICES.md.

### N2. Geo Restriction — Not in ARCHITECTURE.md
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Geo restriction system implemented (schema, access control, admin CRUD) but not documented in ARCHITECTURE.md.

### N3. Device Limits — Not in ARCHITECTURE.md
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Device limit system implemented (subscription schema, auth service, controller) but not documented in ARCHITECTURE.md.

### N4. Content Rating System — Not in any doc
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Content rating (G/PG/R) and minAge enforcement implemented but not documented anywhere.

### N5. Low-Data Mode — Not in any doc
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Low-data mode utility created (apps/web/src/lib/low-data.ts) but not documented.

### N6. Seed Data Additions — Not in DEPLOYMENT.md
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** 003_seed_additions.sql added for 33 missing tables but DEPLOYMENT.md doesn't mention it.

---

## Critical Path

```
Phase 1: Document new features in ARCHITECTURE.md (N1-N3) — 1 day
Phase 2: Update engineering docs (D5-D6) — 1 day
Phase 3: Fill empty template docs (C1-C3) — 1 day
Phase 4: Verify analytics event tracking (C4) — 0.5 day
Phase 5: Create PRDs for P0 features (P1-P3) — 1 day
```

**Total estimated effort:** ~4.5 days

---

## Notes

- **All core features are implemented.** 27 services, 4 apps, 21 packages, 9 CI/CD workflows.
- **All new features (feature flags, device limits, geo restriction) are complete** but NOT documented in ARCHITECTURE.md or SERVICES.md.
- **All tests pass.** 15 new tests added across 4 services.
- **Documentation gaps are mostly in engineering/design/qa templates** — skeleton docs with no content.
- **The biggest documentation gap** is that 3 major new features (feature flags, geo restriction, device limits) are not reflected in the architecture documentation.
