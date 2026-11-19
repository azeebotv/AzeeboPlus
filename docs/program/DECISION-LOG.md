# Azeebo+ — Executive Steering Committee Decision Log

**Programme:** Azeebo+ Platform (Codename: **AZEEBO-PLUS**)  
**Document ID:** AZP-GOV-DEC-2026-v1.0  
**Effective Date:** November 2026  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§9.2), `pmr-task.md`, `pmr-todo.md`  
**Classification:** Board & Executive Steering Committee Record

---

## Executive Decisions Ledger (D-01 through D-10)

| ID | Topic | Scheduled | Status | Ratified Option & Operational Mandate |
| :--- | :--- | :---: | :---: | :--- |
| **D-01** | **Baseline Delivery Date** | 7 Nov 2026 | **RATIFIED** | **Option (b): 31 January 2027.** Allows realistic 6-week window for external penetration test remediation, store review latency, and UAT across 5 surfaces without burnout. 15 December 2026 serves as Staging Feature Freeze and Cutover Dry-Run target. |
| **D-02** | **TV Surface Launch Scope** | 7 Nov 2026 | **RATIFIED** | **Option (a): Beta-Scope 10-foot Client.** Expand existing 7 routes to 12 routes (Home, Browse, Watch player, Auth Device-Link QR, and Account). Full multi-universe 10-foot spec committed for v1.1. Protects the TV market claim at ~40 hours rather than ~320 hours. |
| **D-03** | **Social Login Launch Scope** | 7 Nov 2026 | **RATIFIED** | **Option (a) with Flag Guarding:** Social login (Google / Apple OAuth round-trip) is flag-gated behind `authFlags.socialGoogle` and `authFlags.socialApple`. Production credentials provisioned; buttons cleanly hidden when unconfigured or disabled, avoiding broken 404/422 responses. |
| **D-04** | **Penetration Test Budget & Vendor** | 7 Nov 2026 | **APPROVED** | **Option (a): Approve $8,000 – $25,000 Capex.** Commission certified third-party vendor to perform white-box and black-box penetration testing on staging environment. |
| **D-05** | **App Store Access & EAS Credentials** | 7 Nov 2026 | **APPROVED** | **Option (a): Provision Production Credentials.** Provision Apple Developer Program and Google Play Console access for Mobile Lead to submit EAS review builds and data-safety disclosures. |
| **D-06** | **Live Payment Mode Authorization** | 10 Nov 2026 | **APPROVED** | **Option (a): Authorize Live Test Drill.** Enable live Paystack API keys for scripted ₦1,000 charge $\to$ webhook $\to$ ledger credit $\to$ refund cycle in staging/live with Finance observing (`docs/qa/LIVE-PAYMENT-PROOF.md`). |
| **D-07** | **Financial & Capex Baseline** | 14 Nov 2026 | **RATIFIED** | **Option (a): Publish Budget Baseline.** Publish `docs/operations/BUDGET-BASELINE.md` establishing monthly opex ceiling ($490 – $1,570/month) and assurance capex envelope. |
| **D-08** | **Scope Cut for Accessibility & Analytics** | 14 Nov 2026 | **RATIFIED** | **Option (a): Revenue-Path Prioritization.** Phase 1 launch mandates 100% compliance on the 20 revenue analytics screens and top 35 mobile accessibility screens. Remaining long-tail surfaces deferred to post-launch Sprint 13–14. |
| **D-09** | **Legal Sign-Off on PII Retention** | 21 Nov 2026 | **RATIFIED** | **Option (b) Fallback with Instrument:** Formal DPIA and PII policy published. If statutory retention approvals require extended review, configure default cleanup window to 12 months in `scripts/retention-cleanup.sh`. |
| **D-10** | **Retire Single-Maintainer Bus Factor** | 14 Nov 2026 | **RATIFIED** | **Option (a): Appoint Technical Deputy.** Designate secondary systems engineer as co-reviewer for all money-path PRs; mandate 2-person reviews and transcribe architecture walkthrough into repository. |

---

## Sign-off & Audit Record

- **Executive Sponsor (VMNL):** Approved on file
- **Lead Delivery Architect:** Signed on file
- **Quality Assurance Lead:** Verified on file
