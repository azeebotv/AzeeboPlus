# Azeebo+ Milestone Release Gates & Evidence Registry (REL-01 to REL-04)

**Controlling Authority:** Product Management & Technical Architecture Authority  
**Status:** M0/M1 Ready; M2 Launch Criteria Defined

---

## 1. M0: Experience Proof Evidence (REL-01)

| Requirement / Scope | Target Surface | Implementation Status | Evidence Reference |
|---|---|:---:|---|
| **Core Media Playback** | Mobile & TV | **VERIFIED** | Shared `useAzeeboVideoPlayer` and Expo `VideoView` integrated with pause, seek, and real event listeners. Simulated timers eliminated. |
| **Information Architecture** | Web / Mobile / TV | **VERIFIED** | Clean navigation hierarchies; orphaned `/live/venues` removed. Route contracts pass with 399/399 valid endpoints. |
| **Universe Gating** | Reality / Games | **VERIFIED** | `reality_voting_enabled` and universe-specific flags gate unapproved features safely without exposing broken controls. |
| **Sign-off Artifact** | Design & UX | **APPROVED** | Consistent design tokens and complete state matrices (loading, empty, error, active) implemented. |

---

## 2. M1: Closed-Beta Exit Criteria (REL-02)

| Requirement / Gate | Minimum Threshold | Verified State | Evidence Link |
|---|:---:|:---:|---|
| **Build Integrity** | Clean compilation | **100% PASS** | `pnpm run typecheck` passes with exit code 0 across monorepo. |
| **API Contract Stability** | Zero route mismatch | **100% PASS** | `pnpm run check:route-contracts` exits 0 (399/399 client calls match gateway). |
| **Watch History & Resume** | Accurate persistence | **VERIFIED** | `useAzeeboVideoPlayer` flushes watch progress on pause, blur, and unmount to Content Service. |
| **User Onboarding & Auth** | JWT + Role Guard | **VERIFIED** | Auth service JWT validation and `@Public()` / `@Roles()` security decorators enforced. |
| **Observability** | Deduplicated Alerting | **VERIFIED** | `AlertingService` with channel adapters, retries, and deduplication verified in unit tests. |

---

## 3. M2: Public Commercial Launch Readiness (REL-03)

| Requirement / Gate | Safety Mandate | Verified Implementation | Evidence Link |
|---|---|---|---|
| **Payment Ledger Integrity** | Double-spend protection | Verified optimistic concurrency and distributed locking. | `payment-intent.optimistic-lock.spec.ts` & `wallet.service.spec.ts` (59 tests pass). |
| **Native Wallet Safeguard** | No uncertified charges | Apple/Google Pay skeleton cleanly disabled with honest user status until merchant certification. | `apps/mobile/src/utils/appleGooglePay.ts`. |
| **Deployment Hardening** | Immutable artifacts & fail-closed | GitHub Actions CD workflow validates secrets, verifies commit SHA on health check, and aborts on HTTP errors. | `.github/workflows/cd.yml` & `deployment-workflow.spec.ts`. |
| **Database Safety** | Zero data-loss migrations | Removed unsafe `db push --accept-data-loss`; safe migration and PITR restore drill in place. | `scripts/verify-backup-restore.sh` & `docs/DEPLOYMENT-CHECKLIST.md`. |

---

## 4. Content Delivery Package, Rights & Provenance (REL-04)

| Control | Specification | Implementation & Verification |
|---|---|---|
| **Build Provenance** | Cryptographic attestation | GitHub Actions SLSA build provenance attestation job configured in `.github/workflows/supply-chain-security.yml`. |
| **Software Bill of Materials** | CycloneDX / SPDX SBOM | SBOM generation is a required, non-suppressed build step (`supply-chain-security.yml`). |
| **Media Rights Authorization** | Signed URLs | Content service generates short-lived signed URLs with tenant rights validation; 403 paywall error states handled in client. |
| **Media Master Verification** | Transcoded HLS / DASH | Bitrate renditions and thumbnail tracks mapped in media storage. |
