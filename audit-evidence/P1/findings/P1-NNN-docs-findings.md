# T-P1-008 Findings — Documentation Drift Audit

**Evidence dir:** [audit-evidence/P1/docs-drift/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/docs-drift/)

---

## Inventory

| File                                          | Size    | Status                                                  |
| --------------------------------------------- | ------- | ------------------------------------------------------- |
| [CLAUDE.md](file:///Users/deprof/www/azeebo+/CLAUDE.md)                  | 537 lines | substantial, but **predates the new `services/intelligence/**` and `services/engagement/{engagement,messaging}-service/` additions (committed since `fc01c8c` dirty tree)** — drift |
| [CONTRIBUTING.md](file:///Users/deprof/www/azeebo+/CONTRIBUTING.md)      | 185 lines | OK                                                      |
| [README.md](file:///Users/deprof/www/azeebo+/README.md)                  | 182 lines | **outdated repo tree**: lists 4 `services/*` but real layout has `core/engagement/gateway/intelligence/operations/universes` (6) |
| TASKS.md                                      | —       | **DOES NOT EXIST** at root despite [todo.md](file:///Users/deprof/www/azeebo+/todo.md) Phase 0 referencing it |
| issues.md                                     | —       | **DOES NOT EXIST** at root despite same reference       |
| [apps/mobile/EXPO_ENVIRONMENT.md](file:///Users/deprof/www/azeebo+/apps/mobile/EXPO_ENVIRONMENT.md) | 88 lines | OK                                                      |
| [infra/INFRA_ISSUES_AND_FIXES.md](file:///Users/deprof/www/azeebo+/infra/INFRA_ISSUES_AND_FIXES.md) | 408 lines | substantial runbook, script references verified |
| [docs/](file:///Users/deprof/www/azeebo+/docs/)                          | 24 files | comprehensive set: API-REFERENCE, DISASTER-RECOVERY-PLAN, SECURITY-BEST-PRACTICES, etc. |
| [docx/](file:///Users/deprof/www/azeebo+/docx/)                          | empty dir | **stale empty directory**                            |

---

## P1-042 — Root README repo tree is out of date (Medium · maintainability)

**File:** [README.md](file:///Users/deprof/www/azeebo+/README.md)

**Observation:** the README's architecture diagram lists `services/{core,universes,engagement,operations,gateway}` — 5 categories. The actual layout (per T-P0-003 inventory) has **6**: `core, engagement, gateway, intelligence, operations, universes`. `services/intelligence/` was added in a recent commit (visible in the dirty tree).

**RCA:** The README has not been updated for the new service category. FABLE 5 pillar **E** violation: stale onboarding material misleads new engineers.

**Remediation:** Add `intelligence/` to the tree; add the new services (`engagement/engagement-service`, `engagement/messaging-service`) which the README's older tree may also be missing.

---

## P1-043 — Empty `/docx/` directory in repo (Low · maintainability)

**Observation:** `/docx/` exists at the root but is empty. Likely a renamed leftover from when docs were in `.docx` format.

**Remediation:** `rmdir docx` and commit. Add a CI check that finds empty top-level directories and fails.

---

## P1-044 — `CLAUDE.md` predates `services/intelligence/`, `services/engagement/{engagement,messaging}-service/` (Medium · maintainability)

**File:** [CLAUDE.md](file:///Users/deprof/www/azeebo+/CLAUDE.md)

**Observation:** CLAUDE.md's repo-structure section enumerates only the older 7 `services/core/*` services and the standard `universes/*` set. The 4 new services added to the dirty tree (`intelligence/{analytics,recommendation}-service`, `engagement/engagement-service`, `engagement/messaging-service`) are not described. The file is 537 lines but its architecture section is stale.

**Remediation:** Add a section enumerating the 6 service categories and all 27 services; add an ADR for the boundary between `core/`, `engagement/`, `intelligence/`, etc.

---

## P1-045 — `todo.md` references non-existent `TASKS.md` and `issues.md` (Medium · maintainability)

**Observation:** [todo.md](file:///Users/deprof/www/azeebo+/todo.md) was written by me earlier in this session and references `TASKS.md` and `issues.md` as if they exist. They don't (verified by `ls`). This is **a documentation drift introduced by the audit workflow itself**.

**RCA:** I authored `todo.md` without verifying the referenced files. Pillar **E** of FABLE 5 demands evidence-bound claims; a doc that references non-existent files is itself a finding.

**Remediation:** either create stub `TASKS.md` and `issues.md` to back-fill, or remove the references from `todo.md`. Preferred: remove, since neither file is needed by the audit.

---

## Summary

| ID     | Sev    | Title                                                                          |
| ------ | ------ | ------------------------------------------------------------------------------ |
| P1-042 | Medium | Root README repo tree out of date (missing `intelligence/`)                    |
| P1-043 | Low    | Empty `/docx/` directory                                                        |
| P1-044 | Medium | `CLAUDE.md` predates 4 new services                                             |
| P1-045 | Medium | `todo.md` references non-existent `TASKS.md` + `issues.md`                      |

**Verification status:**
- [x] All docs reviewed.
- [x] Drift documented (4 findings).