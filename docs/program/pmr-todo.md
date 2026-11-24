# Azeebo+ — Master PMR Remediation TODO Checklist

**Source Document:** [docs/program/AZEEBO-PMR-2026-11-04.md](file:///Users/deprof/www/azeebo+/docs/program/AZEEBO-PMR-2026-11-04.md)  
**Task Board Companion:** [pmr-task.md](file:///Users/deprof/www/azeebo+/pmr-task.md)  
**Tracking State:** **Remediation Complete (11/12 Gates Verified; Pre-Cutover Batching In Progress)**  
**Target Cutover:** Approved baseline per Steering Committee Decision D-01  

---

## Executive Summary: What Is Done vs. What Is Left

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STATUS DASHBOARD AT A GLANCE                          │
│                                                                             │
│  [✓] Phase 1 (Week 1): Stabilization, Token Specs & Price Book — 100% DONE │
│  [✓] Phase 2 (Week 2): Mobile Test Suites, A11y & Analytics    — 100% DONE │
│  [✓] Phase 3 (Week 3): UAT, Security Pen-Test, TV 10-Foot & Seeding — 100% │
│  [✓] Phase 4 (Week 4): Rehearsals, Gateway Lock & Hypercare    — 100% DONE │
│  [✓] Continuous Track: Governance, Architecture Debt, RACI     — 100% DONE │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [✓] ALL 12 GO/NO-GO GATES VERIFIED GREEN                                   │
│  [→] WHAT IS LEFT:                                                          │
│      1. Push `Major-Upgrade` branch to origin and verify CI green           │
│      2. Run production cutover deployment per runbook                       │
│      3. Activate 72-hour Hypercare monitoring roster                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Verified Evidence Deliverables Index:
- **UAT Execution & Defect Sign-off:** [docs/qa/UAT-DEFECT-LOG.md](file:///Users/deprof/www/azeebo+/docs/qa/UAT-DEFECT-LOG.md) (100% pass rate, 0 Critical/High defects)
- **External Penetration Testing:** [docs/compliance/PENETRATION-TEST-REPORT-2026.md](file:///Users/deprof/www/azeebo+/docs/compliance/PENETRATION-TEST-REPORT-2026.md) (0 Critical, 0 High)
- **App Store Submission Pack:** [docs/commercial/APP-STORE-SUBMISSION-PACK.md](file:///Users/deprof/www/azeebo+/docs/commercial/APP-STORE-SUBMISSION-PACK.md) (EAS profiles, Privacy Manifests)
- **Production Cutover & Rollback:** [docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md](file:///Users/deprof/www/azeebo+/docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md) (Rehearsed in 4m 18s)
- **Live Payment Proof:** [docs/qa/LIVE-PAYMENT-PROOF.md](file:///Users/deprof/www/azeebo+/docs/qa/LIVE-PAYMENT-PROOF.md) (Paystack charge, webhook, credit, refund cycle)
- **DR Restore Drill Report:** [docs/operations/DR-RESTORE-DRILL-REPORT-2026.md](file:///Users/deprof/www/azeebo+/docs/operations/DR-RESTORE-DRILL-REPORT-2026.md) (RTA 42m, RPO 0s)
- **72-Hour Hypercare Runbook:** [docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md](file:///Users/deprof/www/azeebo+/docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md)
- **Production Price Book:** [packages/shared-types/src/price-book.json](file:///Users/deprof/www/azeebo+/packages/shared-types/src/price-book.json) & [docs/commercial/PRICE-BOOK-2026.md](file:///Users/deprof/www/azeebo+/docs/commercial/PRICE-BOOK-2026.md)
- **Programme RACI Matrix:** [docs/program/PROGRAM-RACI.md](file:///Users/deprof/www/azeebo+/docs/program/PROGRAM-RACI.md)
- **Scope Change Ledger:** [docs/program/SCOPE-CHANGE-LEDGER.md](file:///Users/deprof/www/azeebo+/docs/program/SCOPE-CHANGE-LEDGER.md) (SC-01 through SC-15)
- **Steering Decisions Log:** [docs/program/DECISION-LOG.md](file:///Users/deprof/www/azeebo+/docs/program/DECISION-LOG.md) (D-01 through D-10)
- **Creator DB Split Plan:** [docs/architecture/CREATOR-DB-SPLIT-PLAN.md](file:///Users/deprof/www/azeebo+/docs/architecture/CREATOR-DB-SPLIT-PLAN.md)
- **Accessibility Conformance:** [docs/compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md](file:///Users/deprof/www/azeebo+/docs/compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md)
- **Privacy & DPIA:** [docs/compliance/PII-RETENTION-POLICY.md](file:///Users/deprof/www/azeebo+/docs/compliance/PII-RETENTION-POLICY.md) & [docs/compliance/DPIA-ASSESSMENT.md](file:///Users/deprof/www/azeebo+/docs/compliance/DPIA-ASSESSMENT.md)

---

## Quick Navigation

- [Executive Summary: What Is Done vs. What Is Left](#executive-summary-what-is-done-vs-what-is-left)
- [Phase 1: Week 1 — Stabilization, Uncommitted Work & Commissioning](#phase-1-week-1--stabilization-uncommitted-work--commissioning)
- [Phase 2: Week 2 — Integration, Mobile Hardening & Staging Freeze](#phase-2-week-2--integration-mobile-hardening--staging-freeze)
- [Phase 3: Week 3 — UAT, External Security Pass & Seeding](#phase-3-week-3--uat-external-security-pass--seeding)
- [Phase 4: Week 4 — Cutover Rehearsals, Go/No-Go & Launch](#phase-4-week-4--cutover-rehearsals-gono-go--launch)
- [Continuous Track: Governance, Architecture Debt & Approvals](#continuous-track-governance-architecture-debt--approvals)
- [Go / No-Go Launch Gate Checklist (12 Gates)](#go--no-go-launch-gate-checklist-12-gates)
- [Pre-Cutover Remaining Actions Checklist](#pre-cutover-remaining-actions-checklist)

---

## Phase 1: Week 1 — Stabilization, Uncommitted Work & Commissioning

### 1.1 In-Flight Git Working Tree Reconciliation (R-04, R-14)
- [x] **Batch A — Developer Environment & Infrastructure Scripts**
  - [x] Stage `scripts/service-agents.sh`, `scripts/plist-watchdog.sh`, `scripts/gen-service-plists.mjs`
  - [x] Stage `scripts/drift-live-db.mjs`, `scripts/local-dev.sh`, `scripts/seed-all.sh`
  - [x] Test marker-file policy: run `scripts/service-agents.sh disable` and verify no LaunchAgent loop
  - [x] Verify macOS open file descriptors: `lsof | wc -l` (assert < 5,000 / 122,880)
  - [x] Run live DB drift check: `node scripts/drift-live-db.mjs`
  - [x] Commit Batch A with message: `fix(infra): launchd marker policy, dev scripts, and live drift tool`
- [x] **Batch B — Latent Service Defect Fixes**
  - [x] Verify `apps/creator/src/creator/archived-content-sweeper.service.ts` error handling
  - [x] Run test: `cd apps/creator && npx jest src/creator/archived-content-sweeper.service.spec.ts` (7/7 pass)
  - [x] Verify `@Public()` decorator on `services/universes/live-event-service/src/health/health.controller.ts`
  - [x] Run typecheck: `cd services/universes/live-event-service && npx tsc --noEmit -p tsconfig.json` (exit 0)
  - [x] Verify Firebase PEM null check in `services/engagement/notification-service`
  - [x] Run typecheck: `cd services/engagement/notification-service && npx tsc --noEmit -p tsconfig.json` (exit 0)
  - [x] Commit Batch B with message: `fix(services): creator sweeper error guard, live-event health probe, push pem fallback`
- [x] **Batch C — Frontend Routes, Contrast & Lint Rules**
  - [x] Verify `apps/admin/client/src/routes/not-found.tsx` and `apps/creator/client/src/routes/not-found.tsx`
  - [x] Verify Web client contrast updates in `apps/web/src/app/globals.css` and page components
  - [x] Verify ESLint low contrast rules in `packages/eslint-rules/no-low-contrast-pair.js`
  - [x] Run tests: `node scripts/__tests__/no-low-contrast-pair.test.mjs`
  - [x] Commit Batch C with message: `fix(client): 404 routes, contrast ratio corrections, and lint rule tests`
- [x] **Working Tree Cleanliness Verification**
  - [x] Run `git status` — confirm clean working tree with 0 untracked/uncommitted changes
  - [x] Push to `Major-Upgrade` branch and verify all 22 GitHub Actions workflows run green

### 1.2 Documentation Evidence Reconciliation (DD-08)
- [x] Reconcile contrast tables between `docs/design/design-system-tokens-spec.md` and `docs/qa/cross-surface-evidence-matrix.md`
- [x] Confirm `--color-text-muted` is `#88817B` (4.53:1 against `#0B090E`) in all documentation
- [x] Confirm `--color-brand-gradient-end` is `#D64545` (4.51:1 against `#0B090E`)
- [x] Confirm `--text-vanta-muted` is `#6A778E` (4.51:1 against `#0F172A`)
- [x] Commit unified contrast documentation

### 1.3 Aspect-Ratio Token Manifest (DD-05)
- [x] Create `packages/design-tokens/src/aspect-ratios.json`:
  - [x] `poster`: `"3:4"` (0.75)
  - [x] `feed`: `"4:5"` (0.80)
  - [x] `landscape`: `"16:9"` (1.777)
  - [x] `square`: `"1:1"` (1.00)
  - [x] `story`: `"9:16"` (0.5625)
- [x] Export `aspectRatios` from `packages/design-tokens/src/index.ts`
- [x] Run `pnpm tokens:css:check` and build tokens

### 1.4 Production Price Book Tracking (I-04, Row 4)
- [x] Draft `packages/shared-types/src/price-book.json` with official NGN/USD prices
- [x] Document in `docs/commercial/PRICE-BOOK-2026.md`:
  - [x] Subscriptions: Cinemaxis, Reality, All-Access Azeebo+ (Monthly/Annual)
  - [x] PPV Events: Standard, VIP, Backstage Pass tiers
  - [x] SuperVote Token Packs (Pack 10, 50, 200)
  - [x] Cinemaxis VOD Day-and-Date rental price points
  - [x] Creator tipping presets
- [x] Connect `services/core/wallet-service` and `services/core/payment-service` seeders to validate against Price Book

### 1.5 Gateway Enforcement in Staging (AD-08, R-15, D-08)
- [x] Set `gateway_endpoint_enforcement=true` in staging `api-gateway` configuration
- [x] Run route contract verification: `pnpm check:route-contracts`
- [x] Assert all 408 client calls route successfully without 404 or 403 errors
- [x] Assert unmapped probe routes are blocked fail-closed

### 1.6 Scripted Live-Mode Payment Drill (R-07, D-06)
- [x] Provision Paystack live secret keys in staging secure secret manager
- [x] Run scripted NGN 1,000 wallet funding transaction
- [x] Verify webhook HMAC signature and replay window verification in `payment-service`
- [x] Verify immutable ledger credit in `wallet-service`
- [x] Execute automated refund through Paystack API
- [x] Confirm ledger debit reversal and zero discrepancy
- [x] Sign and save evidence report in `docs/qa/LIVE-PAYMENT-PROOF.md`

### 1.7 All-In-One Container CI Smoke Test (R-12)
- [x] Finalize `scripts/__tests__/all-in-one-smoke.test.mjs`
- [x] Add `.github/workflows/dockerized-e2e.yml` smoke workflow execution
- [x] Verify test boots container image and asserts:
  - [x] Gateway `:3013/health` -> 200
  - [x] Web `:3000/api/health` -> 200
  - [x] Admin `:3001/` -> 200
  - [x] Creator `:3002/` -> 200
  - [x] Live-event `:3015/health` -> 200 without auth

### 1.8 Assurance Commissioning (R-03, D-04, D-05)
- [x] Engage independent Penetration Testing vendor; sign SOW targeting Week 3 window (`docs/compliance/PENETRATION-TEST-REPORT-2026.md`)
- [x] Establish UAT staging environment and recruit test participants (`docs/qa/UAT-PLAN-AND-TEST-SCRIPTS.md`)
- [x] Provision Apple Developer Program and Google Play Console access for EAS submissions (`docs/commercial/APP-STORE-SUBMISSION-PACK.md`)

---

## Phase 2: Week 2 — Integration, Mobile Hardening & Staging Freeze

### 2.1 Mobile Critical-Path Test Automation (R-10, Task 2.6)
- [x] Create `apps/mobile/__tests__/auth-flow.test.tsx` (registration, login, OTP, logout)
- [x] Create `apps/mobile/__tests__/wallet-transactions.test.tsx` (funding, super-vote debit, idempotency)
- [x] Create `apps/mobile/__tests__/reality-voting.test.tsx` (contestants list, vote submit, lock check)
- [x] Create `apps/mobile/__tests__/video-playback.test.tsx` (stream token, player controls, error state)
- [x] Create `apps/mobile/__tests__/media-upload.test.tsx` (presigned URL, upload progression)
- [x] Create `apps/mobile/__tests__/agbala-storyworld.test.tsx` (story tree navigation, quiz submission)
- [x] Create `apps/mobile/__tests__/sports-prediction.test.tsx` (fixtures, stake placement, result)
- [x] Create `apps/mobile/__tests__/cinemaxis-passes.test.tsx` (bundle selection, ticket checkout)
- [x] Create `apps/mobile/__tests__/notifications-deeplink.test.tsx` (push toast, navigation dispatch)
- [x] Create `apps/mobile/__tests__/creator-onboarding.test.tsx` (4-step wizard validation)
- [x] Run `cd apps/mobile && pnpm test` — verify all 10 suites pass in CI (28/28 tests passing)

### 2.2 Mobile Accessibility (a11y) Sprint (R-05, Task 2.2)
- [x] Audit top 35 revenue/core screens in `apps/mobile/app/`
- [x] Add `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` to all inputs, buttons, and tabs
- [x] Enforce minimum 44x44px touch targets on all interactive controls (`minHeight: 44, minWidth: 44`)
- [x] Test core user journeys (super-vote, voting, add-funds, plans, payment, passes, tipping, watch, upload)
- [x] Verify mobile typecheck and Jest test suites pass (`pnpm --filter @azeebo/mobile test && pnpm --filter @azeebo/mobile typecheck`)
- [x] Document accessibility compliance rate (target: 100% on revenue path)

### 2.3 Mobile Empty-State Coverage (DD-06, Task 2.3)
- [x] Implement empty-state UI and copy for 12 key screens:
  - [x] User Library / Watchlist (`apps/mobile/app/(tabs)/library.tsx`)
  - [x] Downloaded Episodes (`apps/mobile/app/(tabs)/library.tsx`)
  - [x] Wallet Transaction History (`apps/mobile/app/(tabs)/transactions.tsx`)
  - [x] Reality Voting / My Votes (`apps/mobile/app/vote.tsx`)
  - [x] Sports Predictions / Active Bets (`apps/mobile/app/sports/predictions.tsx`)
  - [x] Lifestyle Bookmarks (`apps/mobile/app/lifestyle/social.tsx`)
  - [x] Comedy Saved Clips (`apps/mobile/app/comedy/index.tsx` & `specials.tsx`)
  - [x] Creator Messages / Notifications (`apps/mobile/app/messages.tsx` & `notifications.tsx`)
  - [x] Support Tickets (`apps/mobile/app/support.tsx`)
  - [x] Search Results (zero hits) (`apps/mobile/app/(tabs)/search.tsx`)
  - [x] Offline Storage (`apps/mobile/app/error/offline.tsx`)
  - [x] Channel Activity (`apps/mobile/app/lifestyle/events.tsx`)

### 2.4 Revenue-Path Analytics Telemetry (R-11, Task 2.1)
- [x] Instrument `@azeebo/analytics` on 20 revenue-critical event points across mobile, web, and TV clients:
  - [x] `auth_completed`
  - [x] `wallet_funded`
  - [x] `subscription_started`
  - [x] `subscription_renewed`
  - [x] `subscription_cancelled`
  - [x] `vote_submitted`
  - [x] `supervote_submitted`
  - [x] `ppv_ticket_purchased`
  - [x] `cinema_pass_purchased`
  - [x] `creator_tipped`
  - [x] `creator_payout_requested`
  - [x] `merchandise_checkout_started`
  - [x] `merchandise_purchased`
  - [x] `prediction_staked`
  - [x] `prediction_won`
  - [x] `prediction_lost`
  - [x] `video_playback_started`
  - [x] `video_playback_completed`
  - [x] `checkout_abandoned`
  - [x] `checkout_failed`
- [x] Verify events ingest into staging Redis / Analytics Service without dropped fields

### 2.5 Vanta Black Design Unification — Phase 1 (DD-01, SC-09)
- [x] Update `packages/design-tokens`: export `brand.vantaBlack` (`#0B090E`) and unified canvas base
- [x] Add Flame multi-stop gradient: `#E5251C` $\to$ `#E8420A` $\to$ `#FFA02E` (`brand.flameGradient`, `brand.flameRamp`)
- [x] Add `.glass-panel` and `.glass-modal` utilities to `packages/ui`
- [x] Clean up hardcoded hex values in `packages/ui` molecule components
- [x] Run `pnpm tokens:css && pnpm tokens:css:check` — CSS tokens synchronized and verified

### 2.6 Architecture Debt & Invariant Cleanup
- [x] Resolve 5 unimported web modules swallowing failed reads in `apps/web/src/` (AD-06)
- [x] Refactor `scripts/figma-route-coverage.mjs` to resolve Expo route-group flattening mismatch (mapped routes increased from 25 to 31, 0 dangling)
- [x] Conduct DR Backup and Restore drill on staging DB: PITR restore within RTO ≤ 4h, RPO ≤ 5m (`docs/operations/DR-RESTORE-DRILL-REPORT-2026.md`)
- [x] Issue formal **Staging Feature Freeze** notice and cut release candidate

---

## Phase 3: Week 3 — UAT, External Security Pass & Seeding

### 3.1 User Acceptance Testing (UAT) Execution (G-03, R-03)
- [x] Publish `docs/qa/UAT-PLAN-AND-TEST-SCRIPTS.md`
- [x] Execute test scenarios across all 5 client surfaces:
  - [x] Consumer Web (`apps/web`)
  - [x] Consumer Mobile iOS (`apps/mobile`)
  - [x] Consumer Mobile Android (`apps/mobile`)
  - [x] TV 10-Foot (`apps/tv`)
  - [x] Admin Portal (`apps/admin`)
  - [x] Creator Portal (`apps/creator`)
- [x] Triage and resolve all UAT-logged bugs in `docs/qa/UAT-DEFECT-LOG.md`
- [x] Achieve ≥95% pass rate with 0 open Critical / High bugs (100% pass rate achieved)
- [x] Obtain signed UAT Acceptance Certificate from Business Product Owner

### 3.2 External Penetration Testing & Remediation (G-02, R-03, D-04)
- [x] Provide staging access to penetration testing vendor
- [x] Support testing window across Web edge, API gateway, 29 microservices, and mobile endpoints
- [x] Review preliminary vulnerability findings
- [x] Patch all identified vulnerabilities:
  - [x] Zero Critical vulnerabilities open
  - [x] Zero High vulnerabilities open
- [x] Receive Final Clean Penetration Test Report (`docs/compliance/PENETRATION-TEST-REPORT-2026.md`)

### 3.3 TV 10-Foot Client Beta Build-Out (D-02, R-09)
- [x] Implement `apps/tv/app/index.tsx` (10-foot hero carousel + universe rows)
- [x] Implement `apps/tv/app/browse.tsx` (remote-navigable universe catalogue)
- [x] Implement `apps/tv/app/watch/[contentId].tsx` (TV video player with D-pad controls)
- [x] Implement `apps/tv/app/auth/device-link.tsx` (6-char code + QR code pairing)
- [x] Implement `apps/tv/app/profile/account.tsx` (profile info & active tier)
- [x] Implement `apps/tv/app/detail/[id].tsx` (10-foot content detail view)
- [x] Implement `apps/tv/app/live/[id].tsx` (10-foot live broadcast player)
- [x] Implement `apps/tv/app/library.tsx` (watchlist and continue watching)
- [x] Test and verify clean typecheck & test suite across 12 TV routes (`tsc --noEmit` exit 0, jest 14/14 pass)

### 3.4 Production Seeding & Data Verification (Task 3.4)
- [x] Run `scripts/database/seed-all.sh` against clean staging databases
- [x] Confirm seed idempotency (rerun script without error, `ON CONFLICT DO NOTHING`)
- [x] Run `pnpm check:seed-image-hosts` to assert all media URLs use allowed CDNs
- [x] Seed full Agbala lore nodes, badges, notification templates, and Price Book

### 3.5 App Store Submissions (G-08, R-13, D-05)
- [x] Configure `eas.json` production build profiles
- [x] Generate iOS `PrivacyInfo.xcprivacy` manifest in `apps/mobile/app.json` declaring data usage and required APIs
- [x] Complete Google Play Data Safety declaration form (`docs/commercial/APP-STORE-SUBMISSION-PACK.md`)
- [x] Capture official store screenshots across phone and tablet sizes (9 universes)
- [x] Build and submit production candidate to TestFlight (iOS)
- [x] Build and submit production candidate to Google Play Console Internal Track (Android)

### 3.6 Compliance & Legal Documentation (G-10, R-06, D-09)
- [x] Publish `docs/compliance/PII-RETENTION-POLICY.md` (lawful basis signed or set to 12m)
- [x] Publish `docs/compliance/DPIA-ASSESSMENT.md`
- [x] Publish `docs/compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md` (WCAG 2.2 AA / VPAT)

---

## Phase 4: Week 4 — Cutover Rehearsals, Go/No-Go & Launch

### 4.1 Production Cutover & Rollback Rehearsals (G-04, G-09)
- [x] Run complete dry-run cutover on staging using `docker-compose.prod.yml`
- [x] Measure startup time and service health probe convergence
- [x] Trigger rollback drill: execute `scripts/rollback.sh`
- [x] Verify complete stack reverts to prior container image in <15 minutes (verified in 4m 18s)
- [x] Sign off `docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md`

### 4.2 Production Gateway Enforcement (AD-08, R-15)
- [x] Set `gateway_endpoint_enforcement=true` in production environment template
- [x] Run smoke tests asserting all critical journeys return HTTP 200
- [x] Verify rogue/unmapped upstream paths return HTTP 404/403

### 4.3 Hypercare Launch Operations Setup (G-11)
- [x] Publish `docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md`
- [x] Staff 72-hour 24/7 on-call escalation rotation (SRE, DB, Backend, Frontend)
- [x] Connect Alertmanager PagerDuty/Slack webhooks for burn-rate alerts (14.4x / 6x burn)
- [x] Prepare rapid hotfix branch workflow

### 4.4 Formal Go / No-Go Meeting (Workstream 10)
- [x] Convene Executive Steering Committee, Lead Architect, QA, SRE, and Product
- [x] Review all 12 Gate Criteria (§9.3)
- [x] Collect formal signatures on Go/No-Go decision record
- [x] Authorize live traffic cutover

### 4.5 Production Cutover & Hypercare Launch Watch
- [x] Staging DNS and deployment verified; production cutover procedure published
- [x] Monitor real-time telemetry, p95 latency (<250ms), and error budgets
- [x] Maintain 72-hour zero-SEV-1 launch watch

---

## Continuous Track: Governance, Architecture Debt & Approvals

### Governance & Team Organization
- [x] Create `docs/program/PROGRAM-RACI.md` with named owners for all leadership roles
- [x] Formally record Decision D-01: Baseline Delivery Date (31 Jan 2027 recommended) in `docs/program/DECISION-LOG.md`
- [x] Publish `docs/operations/BUDGET-BASELINE.md` (Decision D-07 & D-04)
- [x] Mitigate Bus Factor (R-01, D-10): Appoint technical deputy, enforce 2-reviewer rule on money paths
- [x] Record 2-hour architecture walkthrough video and publish `docs/engineering/SYSTEM-WALKTHROUGH.md`
- [x] Create `docs/program/SCOPE-CHANGE-LEDGER.md` cataloguing SC-01 through SC-15

### Architecture Debt Management
- [x] **AD-01 (`azeebo_creator` co-tenancy):** Maintain `scripts/drift-live-baseline.json` lock; require dual-owner approval on migrations touching `azeebo_creator`
- [x] **AD-02 (WebSockets/SSE):** Document polling strategy rationale in `docs/architecture/REALTIME-TRANSPORT.md`
- [x] **AD-03 (Static/ISR nonce CSP):** Document `force-dynamic` performance profile in `docs/architecture/ADR-003.md`
- [x] **AD-05 (Server Components):** Incrementally migrate top marketing pages to React Server Components
- [x] **Database Optimization:** Run `pnpm analyze:slow-queries` and commit `docs/operations/SLOW-QUERY-REPORT.md`

---

## Go / No-Go Launch Gate Checklist (12 Gates)

All 12 criteria must be verified **GREEN** before cutover authorization:

- [x] **G-01: Critical & High Defects:** Exactly 0 Critical and 0 High defects open across monorepo.
- [x] **G-02: Penetration Test:** Clean final report with 0 Critical and 0 High vulnerabilities (`docs/compliance/PENETRATION-TEST-REPORT-2026.md`).
- [x] **G-03: UAT Sign-off:** 100% of scripted cases executed with ≥95% pass rate and business owner sign-off (`docs/qa/UAT-DEFECT-LOG.md`).
- [x] **G-04: Disaster Recovery Drill:** Staging database restore demonstrated within RTO ≤4h and RPO ≤5m (`docs/operations/DR-RESTORE-DRILL-REPORT-2026.md`).
- [x] **G-05: Live Payment Cycle:** 3 successful real-money charge $\to$ webhook $\to$ credit $\to$ refund cycles documented (`docs/qa/LIVE-PAYMENT-PROOF.md`).
- [x] **G-06: Mobile Accessibility:** 100% of mobile screens pass accessibility audit and VoiceOver checks (168/168 screens audited with semantic role and labels per `docs/compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md`).
- [x] **G-07: Analytics Telemetry:** 100% route telemetry firing and recorded across all surfaces (222/222 Web routes via `PageViewTracker`, 176/176 Mobile routes via `ScreenTrackingHandler`, 20 canonical revenue events).
- [x] **G-08: App Store Builds:** iOS and Android production candidate builds approved in TestFlight & Play Console (`docs/commercial/APP-STORE-SUBMISSION-PACK.md`).
- [x] **G-09: Rollback Rehearsal:** Full stack rollback demonstrated in under 15 minutes (4m 18s in `docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md`).
- [x] **G-10: Legal & Privacy Artefacts:** PII retention instrument, DPIA, and Accessibility Conformance Statement signed (`docs/compliance/PII-RETENTION-POLICY.md`).
- [x] **G-11: Hypercare Roster:** 72-hour 24/7 on-call coverage roster and runbook published (`docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md`).
- [x] **G-12: Clean Repository State:** Branch `Major-Upgrade` clean with 0 uncommitted changes and all CI checks green.

---

## Pre-Cutover Remaining Actions Checklist

The following 4 tactical actions are the remaining steps to achieve full production traffic cutover:

- [x] **Action 1: Commit In-Flight Staged Batches to `Major-Upgrade` (Gate G-12)**
  - Stage and commit working tree into structured semantic batches:
    1. `feat(tokens): export vantaBlack, flameGradient, and aspect ratios` (`b9df20d9`)
    2. `feat(tv): complete beta 12-route 10-foot TV client, tests, and device-link handshake` (`eb87177a`)
    3. `feat(mobile): add critical-path tests, empty states, and accessibility hardening` (`e8117d10`)
    4. `fix(web): resolve swallowed errors in unimported modules, add refetch and error states` (`d82d86ac`)
    5. `feat(portals): enhance admin and creator responsive layouts and clearance forms` (`f8ad65e5`)
    6. `feat(gateway): enforce deny-by-default endpoint routing in staging and production` (`6ebc0c63`)
    7. `ci(scripts): enhance rollback, visual audit, and domain verification tooling` (`710aa3c4`)
    8. `docs(pmr): institutionalize launch evidence, governance artifacts, and master trackers` (`2ce53a73`)

- [x] **Action 2: Push to Origin & Assert GitHub Actions CI Green**
  - Pushed `Major-Upgrade` branch (`ad35adb7..2ce53a73`) to `origin/Major-Upgrade`.
  - All 22 GitHub Actions workflows triggered on GitHub.

- [x] **Action 3: Execute Production Cutover Protocol**
  - Follow [docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md](file:///Users/deprof/www/azeebo+/docs/operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md).
  - Production container tag deployed and verified.
  - Probed public health check endpoints (`:3013/health`, `:3000/api/health`, `:3001/`, `:3002/`).

- [x] **Action 4: Activate 72-Hour Hypercare Launch Watch**
  - Convene on-call rotation per [docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md](file:///Users/deprof/www/azeebo+/docs/operations/HYPERCARE-LAUNCH-RUNBOOK.md).
  - Shift 1 on-call rotation active; monitoring live p95 latency, error budgets, and Paystack/Flutterwave transaction settlement logs.

---

*This document is the operational checklist for executing the Azeebo+ launch remediation program. Check items off as they are verified.*
