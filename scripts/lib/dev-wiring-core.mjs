/**
 * Core of the dev-script wiring check — parameterized by the repo `root` so it
 * can be unit-tested against fixture trees (see
 * scripts/__tests__/dev-wiring.test.mjs).
 *
 * The problem this prevents is exactly the drift the start-dev consolidation
 * fixed: 28 per-service start-dev.sh copies drifted independently
 * (live-event-service guarded a phantom `generated/` dir; knowledge-service's
 * package.json bypassed its own script entirely), and every fix had to be
 * applied by hand across 29 files. The convention is now: every NestJS
 * service under services/* runs `pnpm start:dev` through the ONE shared
 * runner (scripts/start-dev-service.sh), which owns generation, dist
 * mirroring, and watch startup.
 *
 * Rules enforced for every workspace under services/*:
 *   1. `start:dev` must be exactly `bash ../../scripts/start-dev-service.sh`
 *      — no per-service wrappers, no direct `nest start`, no bypasses.
 *   2. No per-service `start-dev.sh` may exist (the shared runner replaced
 *      them; a reintroduced copy is how the original drift began).
 *   3. When a dev wrapper shell script is declared by package.json, it must
 *      be tracked (existence is checked relative to the workspace) — a
 *      missing wrapper means `pnpm start:dev` fails instantly.
 *   4. Workspaces with a schema but no `start:dev` are reported so the gap
 *      stays visible (e.g. a new service scaffolded without wiring).
 *   5. `build` must be exactly `bash ../../../scripts/build-service.sh` —
 *      the shared build runner owns prisma generate + tsc + client
 *      mirroring; 28 inline copies of that chain were the second drift
 *      surface (invisible until the container build proved it).
 *   6. The build runner must exist and each build wiring must resolve to
 *      it (same relative-path arithmetic guard as start:dev).
 *
 * Exit semantics live in the CLI wrapper (scripts/check-dev-wiring.mjs);
 * this module returns a structured result.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** The one expected wiring for every services/* workspace. Three levels up:
 *  services/<group>/<svc> → repo root. (A two-up variant resolves into
 *  services/scripts/ — the exact bug this check exists to catch.) */
export const EXPECTED_START_DEV = 'bash ../../../scripts/start-dev-service.sh';

/** The one expected build wiring for every services/* workspace (same
 *  three-levels-up arithmetic; validated by the same self-test below). */
export const EXPECTED_BUILD = 'bash ../../../scripts/build-service.sh';

/** The one expected start:dev wiring for schema-owning apps (apps/<name> →
 *  repo root is TWO levels up). apps/admin and apps/creator run their
 *  NestJS side via tsx watch — a different runtime model from services —
 *  but they own prisma schemas and previously booted with NO generation. */
export const EXPECTED_APP_START_DEV = 'bash ../../scripts/start-dev-app.sh';

/** Shared dev runner for schema-owning apps. */
export const SHARED_APP_RUNNER = 'scripts/start-dev-app.sh';

/** The one expected build wiring for every packages/* workspace (two levels
 *  up: packages/<name> → repo root). Package builds are compile-only —
 *  the shared runner replaces four textual variants of the same tsc call. */
export const EXPECTED_PACKAGE_BUILD = 'bash ../../scripts/build-package.sh';

/** Shared build runner for packages/* workspaces. */
export const SHARED_PACKAGE_BUILD_RUNNER = 'scripts/build-package.sh';

/**
 * The service-runner path contract, in one place. `start-dev-service.sh` and
 * `build-service.sh` each implement the same generate/mirror contract and
 * must agree on these paths — runner-parity.test.mjs extracts the values
 * from both scripts and asserts they match these constants, so a path edit
 * in one runner without the other (or without this constant) fails CI
 * instead of silently forking the contract.
 */
export const SERVICE_SCHEMA_PATH = 'prisma/schema.prisma';
export const SERVICE_CLIENT_DIR = 'src/prisma/client';
export const SERVICE_DIST_CLIENT_DIR = 'dist/prisma/client';

/** The runner path the expected wiring resolves to, relative to the repo root. */
export const RESOLVED_RUNNER_FROM_SERVICE = 'scripts/start-dev-service.sh';

/** The runner script every service must route through (checked for existence once, at repo level). */
export const SHARED_RUNNER = 'scripts/start-dev-service.sh';

/** The shared build runner every service's `build` must route through. */
export const SHARED_BUILD_RUNNER = 'scripts/build-service.sh';

/** Collect every service workspace directory: services/<group>/<svc>. */
export function collectServiceWorkspaces(root) {
  const servicesDir = path.join(root, 'services');
  const out = [];
  if (!existsSync(servicesDir)) return out;
  for (const group of readdirSync(servicesDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    const groupDir = path.join(servicesDir, group.name);
    for (const svc of readdirSync(groupDir, { withFileTypes: true })) {
      if (!svc.isDirectory()) continue;
      const svcDir = path.join(groupDir, svc.name);
      if (existsSync(path.join(svcDir, 'package.json'))) {
        out.push(svcDir);
      }
    }
  }
  return out;
}

/** Collect every app workspace directory: apps/<name> with a package.json. */
export function collectAppWorkspaces(root) {
  const appsDir = path.join(root, 'apps');
  const out = [];
  if (!existsSync(appsDir)) return out;
  for (const app of readdirSync(appsDir, { withFileTypes: true })) {
    if (!app.isDirectory()) continue;
    const appDir = path.join(appsDir, app.name);
    if (existsSync(path.join(appDir, 'package.json'))) {
      out.push(appDir);
    }
  }
  return out;
}

const toPosix = (p) => p.split(path.sep).join('/');

/** The start:dev value from a workspace package.json, or undefined. */
export function readStartDev(workspace) {
  const pkgPath = path.join(workspace, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.scripts?.['start:dev'];
  } catch {
    return undefined;
  }
}

/** The build value from a workspace package.json, or undefined. */
export function readBuild(workspace) {
  const pkgPath = path.join(workspace, 'package.json');
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.scripts?.build;
  } catch {
    return undefined;
  }
}

/** A stale per-service dev wrapper that must not exist anymore. */
export function hasLegacyStartDevScript(workspace) {
  return existsSync(path.join(workspace, 'start-dev.sh'));
}

/**
 * Run the wiring check across every services/* workspace.
 * @returns {{
 *   workspaces: number,
 *   errors: string[],
 *   bypasses: string[],
 *   legacyScripts: string[],
 *   unwired: string[],
 *   runnerPresent: boolean,
 * }}
 */
export function runDevWiringChecks(root) {
  const errors = [];
  const bypasses = [];
  const legacyScripts = [];
  const unwired = [];
  const buildBypasses = [];

  const workspaces = collectServiceWorkspaces(root);

  // The shared runner itself must exist — if someone moves/deletes it, every
  // service is broken, and that deserves one loud error, not 29.
  const runnerPath = path.join(root, SHARED_RUNNER);
  const runnerPresent = existsSync(runnerPath);
  if (!runnerPresent) {
    errors.push(`shared dev runner missing: ${SHARED_RUNNER} (all services route through it)`);
  }
  // The expected wiring's `../` count must actually reach SHARED_RUNNER from a
  // services/<group>/<svc> workspace — self-test the constant so a future edit
  // to either cannot silently diverge.
  const probeWs = path.join(root, 'services', 'group', 'svc');
  if (path.resolve(probeWs, EXPECTED_START_DEV.replace(/^bash\s+/, '')) !== runnerPath) {
    errors.push(`EXPECTED_START_DEV (${EXPECTED_START_DEV}) does not resolve ${SHARED_RUNNER} from services/<group>/<svc> — fix the constant`);
  }

  // Same existence + constant self-test for the shared build runner.
  const buildRunnerPath = path.join(root, SHARED_BUILD_RUNNER);
  const buildRunnerPresent = existsSync(buildRunnerPath);
  if (!buildRunnerPresent) {
    errors.push(`shared build runner missing: ${SHARED_BUILD_RUNNER} (all services route through it)`);
  }
  if (path.resolve(probeWs, EXPECTED_BUILD.replace(/^bash\s+/, '')) !== buildRunnerPath) {
    errors.push(`EXPECTED_BUILD (${EXPECTED_BUILD}) does not resolve ${SHARED_BUILD_RUNNER} from services/<group>/<svc> — fix the constant`);
  }

  for (const ws of workspaces) {
    const rel = toPosix(path.relative(root, ws));
    const startDev = readStartDev(ws);

    if (startDev === undefined) {
      // No start:dev at all. Only interesting when the workspace owns a
      // Prisma schema (i.e. it is a real data-touching service that needs
      // the generation the runner performs). Pure proxies (api-gateway) may
      // legitimately choose other wiring; report those too, but as info the
      // CLI can soften.
      const hasSchema = existsSync(path.join(ws, 'prisma', 'schema.prisma'));
      if (hasSchema) {
        errors.push(`${rel}: has prisma/schema.prisma but no start:dev script — add "start:dev": "${EXPECTED_START_DEV}"`);
      } else {
        unwired.push(rel);
      }
      continue;
    }

    if (startDev !== EXPECTED_START_DEV) {
      bypasses.push(`${rel}: start:dev is "${startDev}" — must be exactly "${EXPECTED_START_DEV}"`);
      continue;
    }

    // Resolve the relative path in the wiring from THIS workspace's depth and
    // verify it lands on the real runner — a wrong number of `../` segments
    // (e.g. two instead of three) silently breaks every service's start:dev.
    const relRunner = startDev.replace(/^bash\s+/, '');
    const resolved = path.resolve(ws, relRunner);
    if (!existsSync(resolved)) {
      errors.push(`${rel}: start:dev points at a missing runner (resolved: ${toPosix(path.relative(root, resolved))})`);
    }

    if (hasLegacyStartDevScript(ws)) {
      legacyScripts.push(`${rel}: start-dev.sh exists — delete it; the shared runner replaced per-service wrappers`);
    }

    // Build wiring (rules 5/6): every service's `build` routes through the
    // shared build runner, and the wiring's relative path must resolve.
    const build = readBuild(ws);
    if (build === undefined) {
      errors.push(`${rel}: has no build script — add "build": "${EXPECTED_BUILD}"`);
    } else if (build !== EXPECTED_BUILD) {
      buildBypasses.push(`${rel}: build is "${build}" — must be exactly "${EXPECTED_BUILD}"`);
    } else {
      const relBuildRunner = build.replace(/^bash\s+/, '');
      const resolvedBuild = path.resolve(ws, relBuildRunner);
      if (!existsSync(resolvedBuild)) {
        errors.push(`${rel}: build points at a missing runner (resolved: ${toPosix(path.relative(root, resolvedBuild))})`);
      }
    }
  }

  return { workspaces: workspaces.length, errors, bypasses, legacyScripts, unwired, runnerPresent, buildBypasses, buildRunnerPresent };
}

/**
 * Wiring check for apps/* workspaces (apps/<name>, two levels deep).
 *
 * Rules: schema-owning apps (apps/admin, apps/creator) must route start:dev
 * through the shared app runner — exact string, resolving from their
 * two-level depth. Schema-less apps (web, mobile) have different runtime
 * models (next dev / expo) and are reported informationally only.
 */
export function runAppWiringChecks(root) {
  const errors = [];
  const appBypasses = [];
  const appUnwired = [];

  const workspaces = collectAppWorkspaces(root);

  const appRunnerPath = path.join(root, SHARED_APP_RUNNER);
  const appRunnerPresent = existsSync(appRunnerPath);
  if (!appRunnerPresent) {
    errors.push(`shared app dev runner missing: ${SHARED_APP_RUNNER}`);
  }
  // Self-test the TWO-level arithmetic for apps/<name>.
  const probeApp = path.join(root, 'apps', 'name');
  if (path.resolve(probeApp, EXPECTED_APP_START_DEV.replace(/^bash\s+/, '')) !== appRunnerPath) {
    errors.push(`EXPECTED_APP_START_DEV (${EXPECTED_APP_START_DEV}) does not resolve ${SHARED_APP_RUNNER} from apps/<name> — fix the constant`);
  }

  for (const ws of workspaces) {
    const rel = toPosix(path.relative(root, ws));
    const startDev = readStartDev(ws);
    const hasSchema = existsSync(path.join(ws, 'prisma', 'schema.prisma'));

    if (startDev === undefined) {
      if (hasSchema) {
        errors.push(`${rel}: has prisma/schema.prisma but no start:dev script — add "start:dev": "${EXPECTED_APP_START_DEV}"`);
      } else {
        appUnwired.push(rel);
      }
      continue;
    }

    if (!hasSchema) {
      // Schema-less apps keep their own dev model; a non-runner start:dev is
      // fine (next dev, expo start). Only a runner wiring on a schema-less
      // app would be a mistake worth flagging.
      if (startDev === EXPECTED_APP_START_DEV) {
        errors.push(`${rel}: schema-less app must not route start:dev through ${SHARED_APP_RUNNER}`);
      }
      continue;
    }

    if (startDev !== EXPECTED_APP_START_DEV) {
      appBypasses.push(`${rel}: start:dev is "${startDev}" — must be exactly "${EXPECTED_APP_START_DEV}" (the runner owns first-run prisma generation)`);
      continue;
    }

    const relRunner = startDev.replace(/^bash\s+/, '');
    const resolved = path.resolve(ws, relRunner);
    if (!existsSync(resolved)) {
      errors.push(`${rel}: start:dev points at a missing runner (resolved: ${toPosix(path.relative(root, resolved))})`);
    }
  }

  return { workspaces: workspaces.length, errors, appBypasses, appUnwired, appRunnerPresent };
}

/**
 * Build-wiring check for packages/* workspaces (two levels deep).
 *
 * Rule: every package's `build` routes through the shared package build
 * runner (compile-only tsc). Four textual variants of the same command
 * (`tsc` vs `tsc -p tsconfig.json`, with/without `./` in main) were pure
 * drift surface; the runner also gives packages the same fail-loud tsc
 * framing services already had.
 */
export function runPackageWiringChecks(root) {
  const errors = [];
  const packageBuildBypasses = [];

  const packagesDir = path.join(root, 'packages');
  const workspaces = [];
  if (existsSync(packagesDir)) {
    for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (existsSync(path.join(packagesDir, entry.name, 'package.json'))) {
        workspaces.push(path.join(packagesDir, entry.name));
      }
    }
  }

  const pkgRunnerPath = path.join(root, SHARED_PACKAGE_BUILD_RUNNER);
  const pkgRunnerPresent = existsSync(pkgRunnerPath);
  if (!pkgRunnerPresent) {
    errors.push(`shared package build runner missing: ${SHARED_PACKAGE_BUILD_RUNNER}`);
  }
  // Self-test the TWO-level arithmetic for packages/<name>.
  const probePkg = path.join(root, 'packages', 'name');
  if (path.resolve(probePkg, EXPECTED_PACKAGE_BUILD.replace(/^bash\s+/, '')) !== pkgRunnerPath) {
    errors.push(`EXPECTED_PACKAGE_BUILD (${EXPECTED_PACKAGE_BUILD}) does not resolve ${SHARED_PACKAGE_BUILD_RUNNER} from packages/<name> — fix the constant`);
  }

  for (const ws of workspaces) {
    const rel = toPosix(path.relative(root, ws));
    const build = readBuild(ws);
    if (build === undefined) {
      errors.push(`${rel}: has no build script — add "build": "${EXPECTED_PACKAGE_BUILD}"`);
    } else if (build !== EXPECTED_PACKAGE_BUILD) {
      packageBuildBypasses.push(`${rel}: build is "${build}" — must be exactly "${EXPECTED_PACKAGE_BUILD}"`);
    } else if (!pkgRunnerPresent) {
      // String matches but the runner file is gone: one repo-level error was
      // already emitted above; avoid per-package noise.
      continue;
    } else {
      const resolved = path.resolve(ws, build.replace(/^bash\s+/, ''));
      if (!existsSync(resolved)) {
        errors.push(`${rel}: build points at a missing runner (resolved: ${toPosix(path.relative(root, resolved))})`);
      }
    }
  }

  return { workspaces: workspaces.length, errors, packageBuildBypasses, pkgRunnerPresent };
}
