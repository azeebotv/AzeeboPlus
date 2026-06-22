# T-P1-006 Findings — Test Inventory & Coverage Matrix

**Evidence dir:** [audit-evidence/P1/tests/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/tests/)

---

## Coverage matrix (per package)

### Apps

| Package             | spec | e2e | jest.config | coverageThreshold |
| ------------------- | ---: | --: | :---------: | :---------------: |
| apps/admin          |    5 |   0 | ✅          | **NONE**          |
| apps/creator-portal |    0 |   0 | ✅          | **NONE**          |
| apps/mobile         |    5 |   3 | ✅          | (not in sample)   |
| apps/web            |    5 |   4 | —           | —                 |

### Services

| Service                                       | spec | e2e | coverageThreshold |
| --------------------------------------------- | ---: | --: | :---------------: |
| core/auth-service                             |    8 |   0 | 70/70/70/70       |
| core/content-service                          |    5 |   0 | 70/70/70/70       |
| core/media-service                            |    1 |   0 | 70/70/70/70       |
| core/payment-service                          |    6 |   0 | 70/70/70/70       |
| core/search-service                           |    3 |   0 | 70/70/70/70       |
| core/user-service                             |    5 |   0 | 70/70/70/70       |
| core/wallet-service                           |    6 |   0 | 70/70/70/70       |
| engagement/engagement-service                 |  **0** | 0 | 70/70/70/70       |
| engagement/messaging-service                  |  **0** | 0 | 70/70/70/70       |
| engagement/notification-service               |    4 |   0 | 70/70/70/70       |
| engagement/referral-service                   |  **0** | 0 | 70/70/70/70       |
| engagement/reward-service                     |    2 |   0 | 70/70/70/70       |
| engagement/subscription-service               |    2 |   0 | 70/70/70/70       |
| gateway/api-gateway                           |    3 |   0 | 70/70/70/70       |
| intelligence/analytics-service                |    3 |   0 | 70/70/70/70       |
| intelligence/recommendation-service           |    2 |   0 | 70/70/70/70       |
| operations/moderation-service                 |    3 |   0 | 70/70/70/70       |
| operations/queue-service                      |    1 |   0 | 70/70/70/70       |
| operations/support-service                    |   13 |   0 | 70/70/70/70       |
| universes/comedy-service                      |    3 |   0 | 70/70/70/70       |
| universes/creator-service                     |    3 |   0 | 70/70/70/70       |
| universes/games-service                       |    5 |   0 | 70/70/70/70       |
| universes/lifestyle-service                   |    7 |   0 | 70/70/70/70       |
| universes/movie-service                       |    3 |   0 | 70/70/70/70       |
| universes/reality-service                     |    4 |   0 | 70/70/70/70       |
| universes/sports-service                      |    8 |   0 | 70/70/70/70       |
| universes/vertical-service                    |    4 |   0 | 70/70/70/70       |

### Shared packages

| Package                | spec | jest.config |
| ---------------------- | ---: | :---------: |
| analytics-sdk          |    1 | ✅          |
| api-client             |    1 | ✅          |
| auth                   |  **0** | —           |
| design-tokens          |  **0** | —           |
| error-handling         |    1 | —           |
| feature-flags          |  **0** | —           |
| internal-clients       |  **0** | —           |
| logger                 |  **0** | —           |
| observability          |  **0** | ✅          |
| opentelemetry          |  **0** | —           |
| security               |    2 | —           |
| shared-services        |    2 | ✅          |
| shared-types           |    3 | ✅          |
| test-utils             |  **0** | —           |
| ui                     |  **0** | —           |
| utils                  |  **0** | —           |
| validation             |    2 | —           |

**Mutation testing:** **0 `stryker.config*` files** found anywhere.

---

## P1-031 — `apps/admin` `passWithNoTests: true` and zero coverage threshold (Critical · reliability)

**File:** [apps/admin/jest.config.js](file:///Users/deprof/www/azeebo+/apps/admin/jest.config.js)

**RCA:**
1. **Symptom:** any commit to `apps/admin/src/**` ships without coverage enforcement. Removing every spec file still passes CI.
2. **Trigger:** an admin refactor that drops tests.
3. **Proximate cause:** `passWithNoTests: true`, no `coverageThreshold`.
4. **Root cause:** the admin NestJS app was scaffolded before the coverage policy was decided.
5. **Blast radius:** admin functionality (financial, audit, users, content review, wallets).
6. **Detection gap:** CI doesn't enforce threshold.

**Remediation:** Set `passWithNoTests: false` and add `coverageThreshold.global = { branches: 80, functions: 80, lines: 80, statements: 80 }`.

---

## P1-032 — 3 services with zero spec files (High · reliability)

**Files:**
- [services/engagement/engagement-service](file:///Users/deprof/www/azeebo+/services/engagement/engagement-service/) (no `*.spec.ts`)
- [services/engagement/messaging-service](file:///Users/deprof/www/azeebo+/services/engagement/messaging-service/) (no `*.spec.ts`)
- [services/engagement/referral-service](file:///Users/deprof/www/azeebo+/services/engagement/referral-service/) (no `*.spec.ts`)

**RCA:** These services have controllers, modules, and `package.json` (verified via `find`), but no tests. The 70% threshold is set in jest.config but with no test files, the threshold is vacuously satisfied.

**Remediation:** Add at least one integration spec per controller; set `passWithNoTests: false` everywhere.

---

## P1-033 — 10 packages with zero test files (Medium · reliability)

**Files:** see table above — `auth`, `design-tokens`, `feature-flags`, `internal-clients`, `logger`, `observability`, `opentelemetry`, `test-utils`, `ui`, `utils`.

**RCA:** The shared package contract layer (which the entire app relies on) has no tests. The most dangerous are:
- `packages/auth` — the shared auth facade. **Critical.**
- `packages/logger` — every service depends on this. **High.**
- `packages/observability` + `opentelemetry` — production telemetry. **High.**
- `packages/internal-clients` — inter-service clients (used by every service). **Critical.**

**Remediation:** Add minimum 1 spec per exported function; enforce in CI.

---

## P1-034 — No mutation testing on Critical paths (High · reliability)

**Observation:** no `stryker.config*` anywhere. Critical paths (auth, payment, wallet) are tested by line coverage only — mutants that delete an `if` branch would still produce passing tests.

**Remediation:** Add `@stryker-mutator/typescript-checker` + `@stryker-mutator/jest-runner` to `auth-service`, `payment-service`, `wallet-service`. Set `mutationThreshold: 60` initially.

---

## P1-035 — 70% threshold is below industry bar for Critical paths (Medium · reliability)

**Observation:** All services use a flat 70% threshold. For auth/payment/wallet, this is too low (industry standard 80–90%).

**Remediation:** Per-service tiered thresholds: `auth-service`, `payment-service`, `wallet-service` at 85% lines/80% branches; everything else 75%.

---

## Summary

| ID     | Sev      | Title                                                       |
| ------ | -------- | ----------------------------------------------------------- |
| P1-031 | Critical | `apps/admin` jest allows zero tests + no coverage threshold |
| P1-032 | High     | 3 services with zero spec files                             |
| P1-033 | High     | 10 packages with zero tests (incl. `auth`, `logger`)        |
| P1-034 | High     | No mutation testing on Critical paths                        |
| P1-035 | Medium   | 70% threshold below industry bar for Critical paths         |

**Verification status:**
- [x] All test files reviewed (counts above).
- [x] Coverage gaps filed as findings.
- [ ] Live coverage % per service → **NOT SATISFIED — `pnpm install` not run; deferred.**