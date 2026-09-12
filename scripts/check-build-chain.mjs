#!/usr/bin/env node
/**
 * Docker build-chain consistency check — CLI entry point.
 *
 * All rule logic lives in `scripts/lib/build-chain-core.mjs` so it can be
 * unit-tested against fixture trees (see scripts/__tests__/build-chain.test.mjs).
 * This file only resolves the repo root + Dockerfile, prints problems, and
 * sets the exit code.
 *
 * Two rule sets, one exit code:
 *
 * 1. All-in-one chain: the Dockerfile.all-in-one build chain must
 *    topologically match the real workspace dependency graph — every built
 *    workspace built AFTER its dist-exporting internal dependencies, nothing
 *    missing, nothing stale. This is the drift class that cost two
 *    ~15-minute container build cycles (feature-flags ordered after
 *    shared-services; flag-metrics/queue-policy missing entirely).
 *
 * 2. Per-service Dockerfiles (checkServiceDockerfiles): every
 *    services/<group>/<svc>/Dockerfile must build via the workspace build
 *    script (`pnpm --filter <svc> run build`, or WORKDIR + bare
 *    `pnpm run build`) — never a hand-rolled `nest build`/`tsc` — and that
 *    script must still be the shared runner (scripts/build-service.sh).
 *    Hand-rolled image builds skip prisma generate and the dist mirror, so
 *    an image can ship a stale client even when the host build is correct.
 *
 * Run: `node scripts/check-build-chain.mjs`
 *
 * Optional `--root <dir>` and `--dockerfile <path>` override the defaults
 * (used by the unit tests).
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkBuildChain, checkServiceDockerfiles } from './lib/build-chain-core.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const dockerfileArg = argValue('--dockerfile');
const dockerfile = path.resolve(root, dockerfileArg ?? 'Dockerfile.all-in-one');
if (!existsSync(dockerfile)) {
  console.error(`Dockerfile not found: ${path.relative(root, dockerfile)}`);
  process.exit(2);
}

const chainResult = checkBuildChain(root, dockerfile);
const svcResult = checkServiceDockerfiles(root);
const problems = [...chainResult.problems, ...svcResult.problems];

if (problems.length > 0) {
  console.error(`Docker build-chain violations (${problems.length}):`);
  for (const p of problems) {
    console.error(`  - [${p.code}] ${p.message}`);
    console.error(`      fix: ${p.fix}`);
  }
  console.error('');
  console.error('The image build resolves workspace imports from dist/ (stale local dists are excluded by .dockerignore),');
  console.error('so the chain order IS the build correctness — a wrong order or a missing entry breaks the image.');
  console.error('Per-service images must likewise route through the workspace build script (the shared runner),');
  console.error('never a hand-rolled nest/tsc line that skips prisma generate + the dist/prisma/client mirror.');
  process.exit(1);
}

console.log(
  `Docker build chain OK (${chainResult.stats.chainLength} chained builds, topologically consistent across ${chainResult.stats.workspaces} workspaces).`,
);
console.log(
  `Per-service Dockerfiles OK (${svcResult.stats.routed}/${svcResult.stats.services} services route through the workspace build script).`,
);
