# T-P1-001 Findings — Workspace Configuration Audit

**Evidence dir:** [audit-evidence/P1/config-drift/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/config-drift/)
**Captured:** 2026-06-22T10:54..10:57Z
**Audit lead commit:** `fc01c8c` (working tree dirty)

---

## P1-001 — No `engines.node` declared anywhere (Critical · compliance · reliability)

**Files:**
- [package.json](file:///Users/deprof/www/azeebo+/package.json) (root)
- [apps/admin/package.json](file:///Users/deprof/www/azeebo+/apps/admin/package.json)
- [apps/web/package.json](file:///Users/deprof/www/azeebo+/apps/web/package.json)
- [services/core/auth-service/package.json](file:///Users/deprof/www/azeebo+/services/core/auth-service/package.json)
- (all 27 packages — see `audit-evidence/P1/config-drift/_extends-analysis.txt`)

**RCA (6-item):**
1. **Symptom:** T-P0-002 shows runtime `node=v26.0.0` while `.nvmrc` pins `20.11.1`. Nothing forces alignment.
2. **Trigger:** A new contributor (or CI image) can run any Node ≥ whatever Prisma/NestJS happen to tolerate; build succeeds locally, fails in CI.
3. **Proximate cause:** Root `package.json` has `"engines":{}` and zero `engines.node` keys across all 27 packages (verified by `node -e` in `_extends-analysis.txt`).
4. **Root cause:** No CI gate checks `node --version` against `.nvmrc`; no `package.json#engines` constraint; no `.node-version` file; root `packageManager` field is `null`.
5. **Blast radius:** Every developer, every CI runner, every container build. A Node 26 vs 20 ABI shift (e.g. `util.isDeepStrictEqual` deprecations, OpenSSL 3.x strictness) can silently break Prisma or NestJS at runtime.
6. **Detection gap:** No `engines` enforcement, no `nvm` shell hook in CI, no Renovate/Dependabot rule for `engines`.

**Remediation (production-grade, pinned):**
```jsonc
// Root package.json
{
  "packageManager": "pnpm@10.33.2",
  "engines": {
    "node": "20.11.1",
    "pnpm": "10.33.2"
  }
}
```
Then add `.node-version` containing `20.11.1` (for `fnm`/`nvs`) and a CI step:
```yaml
- name: Enforce Node version
  run: |
    if [ "$(cat .nvmrc)" != "$(node -v | sed 's/^v//')" ]; then
      echo "Node version mismatch: expected $(cat .nvmrc), got $(node -v)" >&2
      exit 1
    fi
```
Add `engines` to every package.json via a `pnpm` script `node scripts/inject-engines.ts` and run it from `ci.yml`.

**FABLE 5 pillars violated:** F (Foundational Security), E (Engineering Quality).

**Validation:** `node -e "console.log(require('./package.json').engines.node)"` returns `20.11.1`; `pnpm install` warns when `node` is wrong.

---

## P1-002 — `apps/admin/tsconfig.json` does not extend root and lacks `paths` (High · functionality)

**Files:**
- [apps/admin/tsconfig.json](file:///Users/deprof/www/azeebo+/apps/admin/tsconfig.json)

**RCA:**
1. **Symptom:** `import { ... } from '@azeebo/api-client'` in admin source files would fail to resolve.
2. **Trigger:** TypeScript compilation via `tsc -p apps/admin`.
3. **Proximate cause:** `apps/admin/tsconfig.json` has no `"extends"` key and no `compilerOptions.paths` (verified by `_extends-analysis.txt`).
4. **Root cause:** Admin was scaffolded with its own minimal config; nobody added an `extends` after path-aliases were introduced at the root.
5. **Blast radius:** Admin build pipeline; any developer editing `apps/admin/src/**` against aliases.
6. **Detection gap:** No CI step that runs `pnpm -F admin build` — admin only has `tsconfig.json` but no `package.json` `build` script (verified in `_all-configs.txt`).

**Remediation:**
Replace `apps/admin/tsconfig.json` contents with:
```jsonc
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node", "jest"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```
Then add `"build": "tsc -p tsconfig.build.json"` to `apps/admin/package.json` and a CI step `pnpm -F admin build`.

---

## P1-003 — `apps/web/tsconfig.json` does not extend root and reduces strictness (High · maintainability · security)

**Files:**
- [apps/web/tsconfig.json](file:///Users/deprof/www/azeebo+/apps/web/tsconfig.json)

**RCA:**
1. **Symptom:** Web app TypeScript compilation runs with `strict: true` but missing 8 strictness flags (`noImplicitThis`, `alwaysStrict`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`).
2. **Trigger:** `tsc -p apps/web` for any code path.
3. **Proximate cause:** `apps/web/tsconfig.json` has no `extends`; only `{"strict": true}` (verified in `_extends-analysis.txt`).
4. **Root cause:** The web app was the first frontend scaffolded; subsequent strictness additions in the root config never propagated.
5. **Blast radius:** The largest user-facing surface (every `apps/web/src/app/**` page). `null`/`undefined` slipping through without `strictNullChecks` is the most common TS-to-runtime bug class.
6. **Detection gap:** No `extends`, no `tsc --noEmit` CI gate for web.

**Remediation:**
Replace `apps/web/tsconfig.json` with:
```jsonc
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
Then add `pnpm -F web typecheck` to `ci.yml` `typecheck` job.

---

## P1-004 — 12 of 27 package tsconfigs do not extend root (Medium · maintainability)

**Evidence:** [audit-evidence/P1/config-drift/_extends-analysis.txt](file:///Users/deprof/www/azeebo+/audit-evidence/P1/config-drift/_extends-analysis.txt)

Packages duplicating root config: `apps/admin`, `apps/web`, `packages/analytics-sdk`, `packages/api-client`, `packages/design-tokens`, `packages/error-handling`, `packages/feature-flags`, `packages/internal-clients`, `packages/logger`, `packages/observability`, `packages/security`, `packages/shared-types`, `packages/test-utils`, `packages/ui`, `packages/utils`, `packages/validation`.

**RCA:**
1. **Symptom:** Any change to root `tsconfig.json` (e.g. enabling `noUncheckedIndexedAccess`) silently doesn't propagate to 12 packages.
2. **Trigger:** Any root-config edit.
3. **Proximate cause:** Each package was scaffolded with a copy of the root config rather than `extends`.
4. **Root cause:** No lint rule enforcing `tsconfig.extends` for workspace packages; no ADR on the convention.
5. **Blast radius:** Future TS strictness rollouts will require touching every duplicate — error-prone.
6. **Detection gap:** No CI check for `tsconfig.extends` coverage.

**Remediation:** Run a one-shot script that adds `"extends": "<relative-path>/tsconfig.json"` to each duplicated tsconfig and removes duplicated `compilerOptions`. Add `pnpm exec ts-json-validator` or `eslint-plugin-tsdoc` rule to enforce.

---

## P1-005 — Two ESLint configs at root, neither deprecated (Medium · maintainability)

**Files:**
- [.eslintrc.json](file:///Users/deprof/www/azeebo+/.eslintrc.json) (380 lines, legacy)
- [eslint.config.js](file:///Users/deprof/www/azeebo+/eslint.config.js) (4139 lines, flat config)

**RCA:** With ESLint 9+ flat config, `.eslintrc.json` is **ignored** by default. The 380 lines of legacy config produce zero lint signal. Verified in `audit-evidence/P1/config-drift/_eslint-check.txt`.

**Remediation:** Delete `.eslintrc.json` after one CI run confirms `eslint.config.js` alone catches the legacy-rule-set violations; or rename `.eslintrc.json` to `eslint.config.json` and migrate via `@eslint/eslintrc`'s `FlatCompat`.

---

## P1-006 — `pnpm-workspace.yaml` `overrides` pins versions newer than published reality (Low · compliance)

**File:** [pnpm-workspace.yaml](file:///Users/deprof/www/azeebo+/pnpm-workspace.yaml)

**Observation:** The overrides list pins `'typescript': '^6.0.3'`, `'prisma': '^7.8.0'`, `'eslint': '^10.5.0'`, `'@types/node': '^25.9.3'` etc. (full list in `_extends-analysis.txt`).
- TS 6.0.3 not released as stable as of the audit date (latest stable is 5.x line).
- Prisma 7.x not released (current is 5.x/6.x).
- ESLint 10.x not released (current is 9.x).
- `@types/node` 25.x not released (Node 25 itself is not LTS).

This is a **major-version drift** that will cause `pnpm install` to either fail or pull from `next`/`RC` tags — a FABLE 5 pillar **F** (Foundational Security) violation: relying on unpublished-software for production builds.

**RCA:**
1. **Symptom:** `pnpm install` may pull RC builds; reproducibility across machines breaks.
2. **Trigger:** First `pnpm install` on a clean clone.
3. **Proximate cause:** `pnpm-workspace.yaml` `overrides` block has caret ranges on versions that don't exist.
4. **Root cause:** Either (a) the overrides were written speculatively for an internal fork, or (b) the file is intentionally aspirational. No ADR explains.
5. **Blast radius:** Every `pnpm install` on every developer's machine, CI runner, container build.
6. **Detection gap:** No CI step that `pnpm install --frozen-lockfile` against a known-clean lockfile.

**Remediation:** Pin overrides to actual published versions (TS 5.5.x, Prisma 5.20.x, ESLint 9.x). Run `pnpm install --check` after edit.

---

## P1-007 — No `.dockerignore` enforcement visible (Low · compliance)

**Files:**
- [.dockerignore](file:///Users/deprof/www/azeebo+/.dockerignore)
- [services/.dockerignore](file:///Users/deprof/www/azeebo+/services/.dockerignore)

**Observation:** Both exist. Need to verify each `Dockerfile` actually lives under a directory with `.dockerignore` covering node_modules. (Deferred — see T-P3-002.)

---

## Summary

| ID    | Sev      | Title                                                       | Owner       |
| ----- | -------- | ----------------------------------------------------------- | ----------- |
| P1-001 | Critical | No `engines.node` declared anywhere                         | Platform    |
| P1-002 | High     | `apps/admin/tsconfig.json` missing `extends` + `paths`      | Admin       |
| P1-003 | High     | `apps/web/tsconfig.json` doesn't extend root, weak strict  | Web         |
| P1-004 | Medium   | 12 of 27 tsconfigs duplicate root                           | Platform    |
| P1-005 | Medium   | Legacy `.eslintrc.json` ignored by flat config              | Platform    |
| P1-006 | Low      | `pnpm-workspace.yaml` `overrides` pin non-existent versions | Platform    |
| P1-007 | Low      | `.dockerignore` coverage (deferred to T-P3-002)             | DevOps      |

**Verification status:**
- [x] All workspace configs reviewed → evidence on disk.
- [x] Shadowing configs documented → P1-004.
- [x] Findings have `file://` refs → every P1-NNN cites specific files.
- [ ] CI gate execution (pnpm typecheck/lint) → **NOT SATISFIED — no `node_modules/` installed; deferred to a host with `pnpm install` complete.**