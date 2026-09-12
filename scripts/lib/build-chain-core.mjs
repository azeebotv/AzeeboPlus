/**
 * Core of the Docker build-chain check — parameterized by the repo `root` and
 * a Dockerfile path so it can be unit-tested against fixture trees (see
 * scripts/__tests__/build-chain.test.mjs).
 *
 * The problem this prevents is the failure class the container build hit
 * twice: the build chain inside Dockerfile.all-in-one is hand-maintained, and
 * nothing connected it to the real workspace dependency graph. That produced
 * (1) an ordering violation — feature-flags built AFTER shared-services,
 * which imports it, which only worked on dev hosts because stale dist/ dirs
 * persist locally (the container excludes dist/) — and (2) flag-metrics and
 * queue-policy missing from the chain entirely while seven services import
 * them. Each failure cost a ~15-minute build cycle to discover.
 *
 * Model: the Dockerfile's `pnpm --filter <name> run build` occurrences, in
 * order, define the global build sequence inside the image. A workspace whose
 * package.json exports compiled output (main/types pointing into dist/) must
 * have its dist built BEFORE any later chain entry that depends on it. A
 * workspace that exports SOURCE (main/types pointing into src/, e.g.
 * packages/auth) is compiled in-place by its consumers' tsc and legitimately
 * needs no chain entry — exempting it avoids false positives on the real,
 * working apps/admin → @azeebo/auth case.
 *
 * Rules enforced (Dockerfile.all-in-one):
 *   1. Every --filter target in the chain must exist as a workspace with a
 *      build script (a renamed/deleted package breaks the image build).
 *   2. No duplicate chain entries (deterministic, minimal builds).
 *   3. Every dist-export internal dependency of a chain entry must appear
 *      EARLIER in the chain — else ORDER_VIOLATION (in chain, later) or
 *      MISSING_FROM_CHAIN (not in chain at all).
 *   4. No dependency cycles among chain members' dist-export deps (they
 *      would make any order wrong).
 *
 * Per-service Dockerfiles (checkServiceDockerfiles): each services/<group>/<svc>
 * Dockerfile must build the service by ROUTING THROUGH THE WORKSPACE BUILD
 * SCRIPT — `pnpm --filter <svc> run build` from /app, or `WORKDIR .../<svc>` +
 * bare `pnpm run build` — never a hand-rolled `nest build`/`tsc` line, and
 * never with the workspace build script itself drift off the shared runner
 * (scripts/build-service.sh). Hand-rolled image builds bypass the runner's
 * prisma-generate + dist-mirror contract, so an image can ship while its
 * embedded client is stale — the exact failure the runner consolidation
 * eliminated everywhere else.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { EXPECTED_BUILD } from './dev-wiring-core.mjs';

const FILTER_RE = /pnpm\s+--filter\s+(@azeebo\/[A-Za-z0-9-]+)\s+run\s+build/g;

/** Extract the ordered, deduplicated chain of --filter build targets. */
export function parseBuildChain(dockerfilePath) {
  const src = readFileSync(dockerfilePath, 'utf8');
  const chain = [];
  const seen = new Set();
  for (const m of src.matchAll(FILTER_RE)) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      chain.push(name);
    }
  }
  return chain;
}

/** Collect every workspace (packages/*, apps/*, services/<group>/*) that
 *  declares a build script. */
export function collectWorkspaces(root) {
  const out = new Map(); // name → { dir, pkg }
  const addIfWorkspace = (pkgPath) => {
    if (!existsSync(pkgPath)) return;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch {
      return;
    }
    if (pkg.name && pkg.scripts?.build) {
      out.set(pkg.name, { dir: path.dirname(pkgPath), pkg });
    }
  };
  for (const group of ['packages', 'apps']) {
    const groupDir = path.join(root, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      addIfWorkspace(path.join(groupDir, entry.name, 'package.json'));
    }
  }
  const servicesDir = path.join(root, 'services');
  if (existsSync(servicesDir)) {
    for (const group of readdirSync(servicesDir, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      const groupDir = path.join(servicesDir, group.name);
      for (const svc of readdirSync(groupDir, { withFileTypes: true })) {
        if (!svc.isDirectory()) continue;
        addIfWorkspace(path.join(groupDir, svc.name, 'package.json'));
      }
    }
  }
  return out;
}

/**
 * True when the workspace exports compiled output that consumers resolve at
 * build time (main/types pointing into dist/). Source-exporting workspaces
 * (main: src/index.ts) are compiled by consumers directly and need no chain
 * entry.
 */
export function exportsDist(pkg) {
  const pointers = [pkg.main, pkg.types].filter(Boolean);
  if (pointers.length === 0) return true; // conservative default: needs a build
  return pointers.some((p) => p.split('/').includes('dist'));
}

/** Internal @azeebo/* deps across all dependency sections. */
export function internalDeps(pkg) {
  const names = new Set();
  for (const section of ['dependencies', 'peerDependencies', 'devDependencies']) {
    for (const dep of Object.keys(pkg[section] ?? {})) {
      if (dep.startsWith('@azeebo/')) names.add(dep);
    }
  }
  return [...names];
}

/**
 * Run the build-chain check. Returns { chain, problems, stats } where
 * problems carry { code, message, fix }.
 */
export function checkBuildChain(root, dockerfilePath) {
  const problems = [];
  const chain = parseBuildChain(dockerfilePath);
  const workspaces = collectWorkspaces(root);

  if (chain.length === 0) {
    problems.push({
      code: 'EMPTY_CHAIN',
      message: `no "pnpm --filter <name> run build" steps found in ${path.relative(root, dockerfilePath)}`,
      fix: 'Restore the tiered build chain (T0 shared packages → services/apps) in the Dockerfile.',
    });
    return { chain, problems, stats: { chainLength: 0, workspaces: workspaces.size } };
  }

  const position = new Map(chain.map((name, i) => [name, i]));

  // Rule 1: chain targets must exist as buildable workspaces.
  for (const name of chain) {
    if (!workspaces.has(name)) {
      problems.push({
        code: 'UNKNOWN_PACKAGE',
        message: `chain builds "${name}" but no packages/* or apps/* workspace with that name and a build script exists`,
        fix: 'Remove the stale --filter step or restore the workspace.',
      });
    }
  }

  // Rule 2: duplicates (parse dedupes; a repeat would have been silently
  // dropped, so re-scan raw occurrences to catch them).
  const raw = [...readFileSync(dockerfilePath, 'utf8').matchAll(FILTER_RE)].map((m) => m[1]);
  const dupes = raw.filter((n, i) => raw.indexOf(n) !== i);
  for (const d of new Set(dupes)) {
    problems.push({
      code: 'DUPLICATE_BUILD',
      message: `"${d}" is built more than once in the chain (wasted build time, ambiguous intent)`,
      fix: `Keep a single "pnpm --filter ${d} run build" step.`,
    });
  }

  // Dist-export graph among known workspaces, for cycle detection.
  const distDeps = new Map(); // name → Set(dist-export internal dep names)
  for (const [name, { pkg }] of workspaces) {
    if (!exportsDist(pkg)) continue;
    distDeps.set(
      name,
      new Set(
        internalDeps(pkg).filter((d) => {
          const dep = workspaces.get(d);
          return dep && exportsDist(dep.pkg);
        }),
      ),
    );
  }

  // Rule 4: cycles among chain members.
  const color = new Map(); // 0=white 1=gray 2=black
  const stack = [];
  const cycles = [];
  const dfs = (node) => {
    color.set(node, 1);
    stack.push(node);
    for (const dep of distDeps.get(node) ?? []) {
      if (!position.has(dep)) continue; // cycles only matter within the chain
      const c = color.get(dep) ?? 0;
      if (c === 1) cycles.push([...stack.slice(stack.indexOf(dep)), dep]);
      else if (c === 0) dfs(dep);
    }
    stack.pop();
    color.set(node, 2);
  };
  for (const name of chain) {
    if (!color.has(name)) dfs(name);
  }
  for (const cyc of cycles) {
    problems.push({
      code: 'CYCLE',
      message: `dependency cycle in the chain: ${cyc.join(' → ')}`,
      fix: 'Break the cycle by extracting the shared code into a lower-level package.',
    });
  }

  // Rule 3: every dist-export internal dep of a chain entry must be built earlier.
  for (const name of chain) {
    const ws = workspaces.get(name);
    if (!ws) continue; // already reported as UNKNOWN_PACKAGE
    for (const dep of internalDeps(ws.pkg)) {
      const depWs = workspaces.get(dep);
      if (!depWs || !exportsDist(depWs.pkg)) continue; // src-export or external: no constraint
      if (!position.has(dep)) {
        problems.push({
          code: 'MISSING_FROM_CHAIN',
          message: `"${name}" (built at position ${position.get(name) + 1}) depends on "${dep}", which is never built in the chain — its dist/ will not exist inside the image`,
          fix: `Add "pnpm --filter ${dep} run build" before the "${name}" step (T0 shared packages).`,
        });
      } else if (position.get(dep) > position.get(name)) {
        problems.push({
          code: 'ORDER_VIOLATION',
          message: `"${name}" (position ${position.get(name) + 1}) is built before its dependency "${dep}" (position ${position.get(dep) + 1}) — the image build resolves ${dep} from a dist/ that does not exist yet`,
          fix: `Move "pnpm --filter ${dep} run build" above the "${name}" step.`,
        });
      }
    }
  }

  return {
    chain,
    problems,
    stats: { chainLength: chain.length, workspaces: workspaces.size },
  };
}

// ---------------------------------------------------------------------------
// Per-service Dockerfile wiring
// ---------------------------------------------------------------------------

const SERVICE_FILTER_BUILD_RE = /pnpm\s+--filter\s+(@azeebo\/[A-Za-z0-9-]+)\s+run\s+build/g;
const HAND_ROLLED_BUILD_RE = /^RUN\b[^\n]*\b(nest build|tsc)\b/m;

/**
 * Verify every services/<group>/<svc>/Dockerfile builds its service through
 * the workspace build script (which check:dev-wiring pins to the shared
 * runner scripts/build-service.sh). Returns { files, problems, stats }.
 */
export function checkServiceDockerfiles(root) {
  const problems = [];
  const files = [];
  const servicesDir = path.join(root, 'services');
  if (!existsSync(servicesDir)) {
    return { files, problems, stats: { services: 0, routed: 0 } };
  }

  let services = 0;
  let routed = 0;

  for (const group of readdirSync(servicesDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const svc of readdirSync(path.join(servicesDir, group.name), { withFileTypes: true })) {
      if (!svc.isDirectory()) continue;
      const svcDir = path.join(servicesDir, group.name, svc.name);
      const pkgPath = path.join(svcDir, 'package.json');
      if (!existsSync(pkgPath)) continue;

      let pkg;
      try {
        pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      } catch {
        continue; // malformed package.json is dev-wiring's domain
      }
      if (!pkg.name || !pkg.scripts?.build) continue;
      services += 1;

      const dockerfilePath = path.join(svcDir, 'Dockerfile');
      const rel = path.relative(root, svcDir);
      if (!existsSync(dockerfilePath)) {
        problems.push({
          code: 'NO_DOCKERFILE',
          message: `${rel} has a build script but no Dockerfile (referenced by CI/e2e flows that build per-service images)`,
          fix: `Add ${rel}/Dockerfile following the sibling template — build with "pnpm --filter ${pkg.name} run build".`,
        });
        continue;
      }

      const src = readFileSync(dockerfilePath, 'utf8');
      files.push(path.relative(root, dockerfilePath));

      // The build must route through the workspace's build script: either the
      // explicit form from /app or the WORKDIR + bare `pnpm run build` form.
      const filterBuilds = [...src.matchAll(SERVICE_FILTER_BUILD_RE)].map((m) => m[1]);
      const workdirs = [...src.matchAll(/^WORKDIR\s+(\S+)/gm)].map((m) => m[1].replace(/\/+$/, ''));
      const relSvcDir = path.relative(root, svcDir);
      const bareForm =
        /^RUN\s+pnpm run build\b/m.test(src) &&
        workdirs.some((w) => w.endsWith(`/${relSvcDir}`));

      // No hand-rolled compile lines, checked independently of routing: they
      // bypass the runner's contract whether or not a routed step also exists.
      const handRolled = src.match(HAND_ROLLED_BUILD_RE);
      if (handRolled) {
        problems.push({
          code: 'DIRECT_BUILD_PROHIBITED',
          message: `${rel}/Dockerfile compiles directly ("${handRolled[0].trim().slice(0, 80)}") instead of routing through the workspace build script`,
          fix: `Use "RUN pnpm --filter ${pkg.name} run build" — a hand-rolled nest/tsc skips prisma generate and the dist/prisma/client mirror, so the image can ship a stale client.`,
        });
      }

      if (!filterBuilds.includes(pkg.name) && !bareForm) {
        problems.push({
          code: 'NO_BUILD_STEP',
          message: `${rel}/Dockerfile never runs "pnpm --filter ${pkg.name} run build" (or WORKDIR ${relSvcDir} + "pnpm run build") — the image build does not use the workspace build script`,
          fix: `Build with "RUN pnpm --filter ${pkg.name} run build" from /app so the image gets the shared runner's generate + tsc + dist-mirror contract.`,
        });
        continue;
      }
      routed += 1;

      // Cross-check with the dev-wiring convention: the routed script must BE
      // the shared runner, or the Dockerfile faithfully executes a drift.
      if (pkg.scripts.build !== EXPECTED_BUILD) {
        problems.push({
          code: 'RUNNER_NOT_ROUTED',
          message: `${rel}/Dockerfile routes through the workspace build script, but ${pkg.name}'s build is "${pkg.scripts.build}" — not the shared runner`,
          fix: `Set the package.json build to exactly "${EXPECTED_BUILD}" (check:dev-wiring enforces the same value).`,
        });
      }
    }
  }

  return { files, problems, stats: { services, routed } };
}
