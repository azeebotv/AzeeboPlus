# Azeebo+ — Programme Scope Change Ledger

**Document ID:** AZP-PRG-SCL-2026-v1.0  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§5.2, §5.3), `pmr-task.md`, `pmr-todo.md`  
**Classification:** Programme Governance Record

---

## Historical Scope Variation Ledger (SC-01 through SC-15)

This ledger retroactively documents, justifies, and records approval status for the 15 scope variations absorbed during development, resolving PMR finding §5.2.

| # | Item / Requested Change | Source | Date | Effort (Est.) | Schedule Impact | Approval | Strategic Justification |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **SC-01** | Split Admin & Creator into standalone Vite+Nest apps | Architecture | Aug 2026 | ~600 h | +0 d | **Decided** | Eliminates consumer bundle bloat; isolates administrative and creator capabilities from public Next.js bundle. |
| **SC-02** | Agbala storyworld vertical (20 models, lore, quiz, crossover) | Product | Sep 2026 | ~400 h | +0 d | **Approved** | Key cultural IP differentiator for West African African-mythology cinematic storyworlds. |
| **SC-03** | AOU interactive narrative (`/aou/*`, knowledge-locked states) | Product | Sep 2026 | ~120 h | +0 d | **Approved** | Interactive narrative engagement test for multi-branching story arcs. |
| **SC-04** | Cinemaxis distribution / DBO theatrical ticketing surface | Commercial | Sep 2026 | ~90 h | +0 d | **Approved** | Day-and-date digital premiere and theatrical ticketing revenue line. |
| **SC-05** | Expo SDK 56 → 57 upgrade (Mobile and TV) | Security | Oct 2026 | ~32 h | +0 d | **Decided** | Closed critical dependency vulnerability (AUD-84); aligned React Native 0.86 across platforms. |
| **SC-06** | Retire `'both'` role; `creator` role subsumes viewer permissions | Product | Oct 2026 | ~8 h | +0 d | **Decided** | Simplified role selection matrix and eliminated confusing multi-role state UI. |
| **SC-07** | Withdraw “Private” / “Unlisted” upload toggles | Compliance | Sep 2026 | -10 h | +0 d | **Decided** | Withdrew client controls that the backend could not enforce without row-level ACLs. |
| **SC-08** | Gate creator cash payouts under Creator Lite | Legal / Finance | Sep 2026 | -20 h | +0 d | **Decided** | Enforced Nigerian banking compliance; payouts disabled until settlement banking rails are established. |
| **SC-09** | Vanta Black design system overhaul | Creative | Sep 2026 | ~200 h | +10 d | **Approved (Phased)** | Phase 1 (Tokens & Utilities) in launch scope; Phase 2 (full screen repaint) scheduled for v1.1. |
| **SC-10** | Social login (Google / Apple OAuth round-trip) | Product | Oct 2026 | ~80 h | +0 d | **Decided (Flagged)** | Flag-gated behind `authFlags.socialGoogle`/`socialApple`; buttons safely hidden if unconfigured. |
| **SC-11** | TV 10-foot client build-out | Product | Nov 2026 | ~40 h | +0 d | **Decided (Beta)** | Beta-scope 12 routes (Home, Browse, Watch, Device-Link, Profile) approved for launch cutover. |
| **SC-12** | Git history purge of committed secrets | Security | Oct 2026 | ~24 h | +1 d | **Decided** | Purged `staging.env` and keystores from git history; all maintainers signed off. |
| **SC-13** | Local frontends moved from Docker to host processes | Engineering | Nov 2026 | ~40 h | +0 d | **Decided** | 10x faster inner development loop; container topology verified via all-in-one CI smoke test. |
| **SC-14** | Accept 91 live-drift statements as baseline ceiling | Engineering | Nov 2026 | ~24 h | +0 d | **Decided** | Quarantined `azeebo_creator` co-tenancy drift in `drift-live-baseline.json` as an immutable ceiling. |
| **SC-15** | Enable `gateway_endpoint_enforcement` in staging & prod | Security | Nov 2026 | ~8 h | +0 d | **Decided** | Activates deny-by-default endpoint enforcement across 408 verified client route contracts. |

---

## Scope Change Control Process (Post-Freeze Protocol)

Any proposed change following the staging feature freeze must submit a formal Change Request (CR) evaluating:
1. Business/Commercial Justification
2. Impact on Security & Penetration Testing
3. Risk of Regressions on Existing Verified Invariant Gates
4. Mandatory Dual-Approval by Program Director and Technical Deputy
