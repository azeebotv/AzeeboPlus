# Azeebo+ — Master TODO

> Generated: 2026-07-24
> Based on: Full codebase audit — 110 MD files, 27 services, 4 apps, 21 packages, 9 CI/CD workflows

---

## Executive Summary

| Area | Total | Done | Remaining |
|------|-------|------|-----------|
| Documentation Accuracy | 12 | 8 | 4 |
| New Features (Implemented) | 5 | 5 | 0 |
| New Features (Partial) | 3 | 0 | 3 |
| Missing PRDs | 3 | 0 | 3 |
| Test Coverage Gaps | 5 | 0 | 5 |
| Platform Quality | 8 | 0 | 8 |
| **Total** | **33** | **13** | **20** |

---

## 1. Documentation Accuracy (4 remaining)

### D1. CLAUDE.md — Service Catalog Ports Mismatch
- **Status:** `[x]` DONE
- **Spec:** CLAUDE.md line 91-119
- **Description:** All 27 service port numbers were wrong (shifted by +1). Fixed to match actual code.
- **Fixed:** 2026-07-24

### D2. README.md — Missing Mobile App + Packages
- **Status:** `[x]` DONE
- **Spec:** README.md lines 81-87, 190-207
- **Description:** Mobile app not listed in frontend apps table, 7 packages missing from shared packages list.
- **Fixed:** 2026-07-24

### D3. doc/remaining-tasks.md — Stale Status
- **Status:** `[x]` DONE
- **Spec:** doc/remaining-tasks.md
- **Description:** 75 items marked PENDING that todo.md audit verified as DONE. All updated.
- **Fixed:** 2026-07-24

### D4. doc/DEPLOYMENT-CHECKLIST.md — Wrong Analytics Port
- **Status:** `[x]` DONE
- **Spec:** doc/DEPLOYMENT-CHECKLIST.md line 16
- **Description:** Analytics service port listed as 3040, actual is 3008.
- **Fixed:** 2026-07-24

---

## 2. New Features Implemented (All Done)

### F1. Feature Flags — Admin API + UI
- **Status:** `[x]` DONE
- **Files:** content-service admin.controller.ts, admin.service.ts, feature-flags.tsx, App.tsx, AdminLayout.tsx
- **Description:** Full CRUD API for feature flags, admin dashboard UI with create/toggle/delete, gateway routes.

### F2. Device Limits — Schema + Service + Controller
- **Status:** `[x]` DONE
- **Files:** subscription-service schema (maxDevices/maxStreams), auth-service schema (RegisteredDevice), DeviceLimitService, DeviceController, DeviceModule
- **Description:** Subscription plan device limits, device registration, limit checking, device management endpoints.

### F3. Geo Restriction — Schema + Access Control
- **Status:** `[x]` DONE
- **Files:** content-service schema (allowedCountries/blockedCountries/contentRating/minAge, GeoRestriction table), AccessControlService.checkGeoAccess(), admin CRUD endpoints
- **Description:** Service-level geo enforcement, admin geo management, content rating system.

### F4. User Feature Preferences
- **Status:** `[x]` DONE
- **Files:** user-service schema (featurePreferences JSON field)
- **Description:** Users can toggle universes and features via existing preferences endpoint.

### F5. Pre-existing Test Fixes
- **Status:** `[x]` DONE
- **Files:** wallet.service.spec.ts, feed.service.spec.ts, content.integration.spec.ts, subscription integration/service specs
- **Description:** Fixed missing mocks, type errors, unused imports, paymentMethod types.

---

## 3. Partial Features (Need Completion)

### P1. Pay-Per-View Live Events
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Live ticketed events with real-time streaming. PRD planned but not implemented.
- **Dependencies:** WebSocket infrastructure, streaming service, wallet-service

### P2. Creator Tipping Tiers
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Tiered tipping with leaderboards. PRD planned but not implemented.
- **Dependencies:** wallet-service, creator-service, notification-service

### P3. Bundle Passes
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Discounted multi-universe passes. PRD planned but not implemented.
- **Dependencies:** subscription-service, payment-service, content-service

---

## 4. Missing PRDs (Need Creation)

### PRD1. Pay-Per-View Live Events
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Create detailed PRD with database schema, API endpoints, streaming integration, success metrics.

### PRD2. Creator Tipping Tiers
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Create detailed PRD with tipping tiers, leaderboard system, badge display, exclusive content.

### PRD3. Bundle Passes
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Description:** Create detailed PRD with bundle configurations, pricing, comparison UI, renewal logic.

---

## 5. Test Coverage Gaps

### T1. Gateway Tests
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Description:** api-gateway has only 1 test file. Needs contract tests for route proxying, rate limiting, JWT validation.

### T2. Engagement Service Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** engagement-service has only 2 test files. Needs more unit and integration tests.

### T3. Messaging Service Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** messaging-service has only 2 test files. Needs WebSocket/messaging tests.

### T4. Referral Service Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** referral-service has only 2 test files. Needs referral flow tests.

### T5. Recommendation Service Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** recommendation-service has only 2 test files. Needs recommendation algorithm tests.

---

## 6. Platform Quality

### Q1. Admin Portal — Hardcoded Financial Data
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Description:** Financial page has hardcoded `pendingPayouts/totalPayouts = 0`. Reports builder metrics are hardcoded.

### Q2. Admin Portal — User Search Limitation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** User search/filter is client-side over page 1 only. Needs server-side search.

### Q3. Admin Portal — Read-Only Sections
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Creators/Reality sections are read-only. No status actions wired to endpoints.

### Q4. Creator Portal — Settings Contract Mismatch
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Web client uses `/creators/settings` but backend has `creator/settings`. Routes need alignment.

### Q5. Real-Time Messaging Verification
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** WebSocket messaging with messaging-service needs end-to-end verification.

### Q6. Content Rating Enforcement
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** `minAge` field added to schema but not enforced in access control or age verification flow.

### Q7. A/B Test Hooks
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Feature flags exist but no A/B test framework integrated. No experiment tracking.

### Q8. Low-Data Mode Detection
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** `featurePreferences.lowDataMode` field exists but no `Save-Data` header detection or image quality reduction.

---

## 7. Stale Documentation Updates Needed

### S1. doc/product/universe-specs/creator.md — Analytics Status
- **Status:** `[ ]` PENDING
- **Description:** Line 67 says "Analytics events — NOT implemented". Should be updated to reflect current state.

### S2. doc/admin.md — Implementation Status
- **Status:** `[ ]` PENDING
- **Description:** Admin portal status says "Implementation complete" but some features are still hardcoded placeholders.

### S3. doc/product/README.md — PRD References
- **Status:** `[ ]` PENDING
- **Description:** References PRDs that don't exist yet (Pay-Per-View, Tipping Tiers, Bundle Passes).

---

## Critical Path

```
Phase 1: Create PRDs (PRD1-PRD3) → 1 day
   ↓
Phase 2: Fix test gaps (T1-T5) → 3 days
   ↓
Phase 3: Platform quality fixes (Q1-Q4) → 2 days
   ↓
Phase 4: Implement P0 features (P1-P3) → 5 days
   ↓
Phase 5: Platform polish (Q5-Q8, S1-S3) → 2 days
```

---

## Notes

- **All core features are implemented.** 27 services, 4 apps, 21 packages, 9 CI/CD workflows.
- **New features (feature flags, device limits, geo restriction) are complete** with admin UI, API, and schema.
- **Remaining work is quality:** test coverage, hardcoded placeholders, contract mismatches.
- **P0 features need PRDs first** before implementation can start.
- **Documentation is mostly accurate** after the 2026-07-24 audit fixes.
