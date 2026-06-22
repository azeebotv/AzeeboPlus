# T-P1-007 Findings — Static Analysis, Secrets, Dependencies (read-only subset)

**Evidence dir:** [audit-evidence/P1/lint-grep/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/lint-grep/) + [audit-evidence/P1/secrets/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/secrets/)

---

## Summary of scans run

| Scan                                       | Result                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `ci/scripts/scan-hardcoded-values.sh`      | **283 localhost URLs** · **34 default secret issues** · **36 provider key issues** · **293 console.log** · **5 placeholder images** · **102 Math.random()** · **4 hardcoded prices** |
| `ci/scripts/secret-verification.sh`        | **NOT EXECUTABLE** (`-rw-r--r--`); CI never runs it                 |
| `rg 'as any'`                              | 30+ hits, concentrated in `report-builder.service.ts`              |
| `rg '@ts-ignore'`                          | 0 hits                                                            |
| `rg 'eslint-disable'`                      | 35+ hits across 17 files                                          |
| `rg 'TODO\|FIXME\|XXX\|HACK'`              | 1 hit (`apps/mobile/app/(tabs)/create.tsx`)                         |
| `rg 'console.log'` (excl. scripts)         | 6 hits (all in logger/observability packages)                     |

---

## P1-036 — `ci/scripts/secret-verification.sh` is not executable (High · security)

**File:** [ci/scripts/secret-verification.sh](file:///Users/deprof/www/azeebo+/ci/scripts/secret-verification.sh)

**Observation:** Permissions `-rw-r--r--` (verified via `ls -la ci/scripts`). The CI workflow cannot invoke it because it lacks the executable bit.

**RCA:**
1. **Symptom:** even though the script exists and contains real patterns (AWS keys, JWT secrets, Stripe keys), it never runs.
2. **Trigger:** `ci.yml` invokes `bash ci/scripts/secret-verification.sh` → fails immediately or skips silently.
3. **Proximate cause:** file mode `644` instead of `755`.
4. **Root cause:** `git` does not preserve executable bits on some workflows unless explicitly set; nobody ran `chmod +x` after commit.
5. **Blast radius:** every PR that introduces a hard-coded secret.
6. **Detection gap:** no CI step that asserts script executability.

**Remediation:** `chmod +x ci/scripts/secret-verification.sh && git add ci/scripts && git commit -m "ci: make secret-verification executable"`. Add a CI check `find ci/scripts -name "*.sh" ! -perm -u+x -print` to fail the build.

---

## P1-037 — `.env` contains real placeholder secrets, committed pattern reveals service topology (High · security)

**File:** [.env](file:///Users/deprof/www/azeebo+/.env)

**Observation:** the local `.env` is correctly `.gitignore`d (verified), but the file contains the **complete list of every service's DB password placeholder** (28 services enumerated). The structure reveals the entire microservice topology.

While this is a development convenience and the values are `change_me_*`, the *pattern* itself is a reconnaissance asset: anyone with the repo (e.g. via a leaked commit history of an older `.env`) immediately knows there are 28 DBs and which services own them.

**Remediation:** Replace with `services/core/*/.env.example` per-service. Move placeholder secrets to `.env.example` files only, never a single root `.env`. Add a CI rule: `git ls-files .env` must be empty.

---

## P1-038 — `intelligence/analytics-service/src/modules/report-builder/report-builder.service.ts` uses `as any` 14+ times (High · maintainability · type-safety)

**File:** [services/intelligence/analytics-service/src/modules/report-builder/report-builder.service.ts](file:///Users/deprof/www/azeebo+/services/intelligence/analytics-service/src/modules/report-builder/report-builder.service.ts)

**Observation:** the file disables `@typescript-eslint/no-explicit-any` inline and uses `as any` to coerce `metrics`, `dimensions`, `filters`, `groupByFields`, `select` etc. into Prisma's `groupBy` signature.

**RCA:**
1. **Symptom:** refactoring Prisma's `groupBy` signature would not be caught by the type checker.
2. **Trigger:** Prisma major upgrade.
3. **Proximate cause:** the file's groupBy wrapper has a `Record<string, any>` input that is cast rather than typed.
4. **Root cause:** no generic constraint `K extends keyof Prisma.ProductEventScalarFieldEnum`; the wrapper accepts arbitrary strings.
5. **Blast radius:** the entire report-builder feature — admin dashboards, executive reports.
6. **Detection gap:** `as any` is not blocked by CI lint.

**Remediation:** Replace `as any` with proper generic constraints and a typed builder. Add `eslint-plugin-typed-conditions` or `@typescript-eslint/no-explicit-any: 'error'` in CI.

---

## P1-039 — File-level `eslint-disable @typescript-eslint/explicit-function-return-type` in 8 files (Medium · maintainability)

**Files:** all in `services/engagement/notification-service/src/modules/**` (6 files) + `services/core/content-service/src/modules/content/content.service.ts`.

**Observation:** every function in those files is exempted from the return-type rule. The rule is what makes "missing return type" a CI failure.

**Remediation:** remove the file-level disable; add explicit return types to each exported function (one-time refactor).

---

## P1-040 — `Math.random()` used for OTel sampling (Medium · observability)

**File:** [packages/opentelemetry/src/index.ts](file:///Users/deprof/www/azeebo+/packages/opentelemetry/src/index.ts) + [packages/observability/src/tracing.service.ts](file:///Users/deprof/www/azeebo+/packages/observability/src/tracing.service.ts)

**Observation:** `if (Math.random() < finalConfig.samplingRatio!)` and `return Math.random() < this.config.sampleRate;`. `Math.random()` is not seedable; on a 1% sample, runs are not reproducible; tail-based sampling decisions cannot replay.

**Remediation:** Use OTel's built-in `ParentBased(TraceIdRatioBased(sampler))` rather than hand-rolling with `Math.random`.

---

## P1-041 — `docker-compose.services.yml` hardcodes `localhost:4000` for NEXT_PUBLIC_API_URL (Medium · functionality)

**File:** [docker-compose.services.yml](file:///Users/deprof/www/azeebo+/docker-compose.services.yml) — hit by `scan-hardcoded-values.sh`.

**RCA:** Inside a docker-compose service, `localhost` resolves to the container, not the host. Any service that uses `NEXT_PUBLIC_API_URL=http://localhost:4000` from a docker-compose stack will fail to reach the API gateway running on the host. Per FABLE 5 pillar **B**, container builds must use service-discovery or host DNS, not localhost.

**Remediation:** replace `localhost` with the compose service name (e.g. `http://api-gateway:3000`).

---

## Summary

| ID     | Sev      | Title                                                                  |
| ------ | -------- | ---------------------------------------------------------------------- |
| P1-036 | High     | `ci/scripts/secret-verification.sh` not executable                     |
| P1-037 | High     | `.env` template reveals 28-service topology                            |
| P1-038 | High     | `report-builder.service.ts` uses `as any` 14+ times                    |
| P1-039 | Medium   | 8 files disable `explicit-function-return-type` at file level           |
| P1-040 | Medium   | `Math.random()` for OTel sampling (non-reproducible)                   |
| P1-041 | Medium   | `docker-compose.services.yml` uses `localhost` for inter-service URLs  |

**Verification status:**
- [x] All read-only scans executed (`scan-hardcoded-values.sh`, ripgrep greps).
- [x] `secret-verification.sh` existence + permission check captured (NOT EXECUTABLE).
- [ ] `pnpm install` + `pnpm audit` + `trivy fs` + `pnpm lint` → **NOT SATISFIED — deferred (no `node_modules`, no `trivy` binary installed; `pnpm lint` requires install).**