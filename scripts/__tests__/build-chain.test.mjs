/**
 * Unit tests for the Docker build-chain check
 * (scripts/lib/build-chain-core.mjs).
 *
 * Each test builds a fixture repo tree (workspace package.jsons with real
 * main/types pointers and dependency sections) plus a fixture Dockerfile,
 * then runs the real rules via checkBuildChain — the same way the dev-wiring
 * and stale-client checks are tested.
 *
 * Run: `node --test scripts/__tests__/build-chain.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  checkBuildChain,
  checkServiceDockerfiles,
  parseBuildChain,
  exportsDist,
} from '../lib/build-chain-core.mjs';

const DOCKERFILE_NAME = 'Dockerfile.fixture';

function makeRoot(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'build-chain-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

/**
 * pkg spec: { name, main?, types?, deps?: string[], devDeps?: string[], dir? }
 * dir defaults to packages/<basename> — pass e.g. 'services/core/x' or 'apps/web'.
 */
function workspace(root, spec) {
  const base = spec.name.replace('@azeebo/', '');
  const dir = spec.dir ? path.join(root, spec.dir) : path.join(root, 'packages', base);
  mkdirSync(dir, { recursive: true });
  const pkg = {
    name: spec.name,
    scripts: { build: 'tsc -p tsconfig.json' },
  };
  if (spec.main) pkg.main = spec.main;
  if (spec.types) pkg.types = spec.types;
  if (spec.deps) pkg.dependencies = Object.fromEntries(spec.deps.map((d) => [d, '*']));
  if (spec.devDeps) pkg.devDependencies = Object.fromEntries(spec.devDeps.map((d) => [d, '*']));
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
}

function dockerfile(root, chain) {
  const steps = chain.map(
    (name, i) =>
      `RUN echo "==> [T${i}] ..." && \\\n    pnpm --filter ${name} run build && \\\n    echo "==> [T${i}] Complete"`
  );
  writeFileSync(path.join(root, DOCKERFILE_NAME), `FROM node:22\n${steps.join('\n')}\n`);
}

const codes = (root) =>
  checkBuildChain(root, path.join(root, DOCKERFILE_NAME)).problems.map((p) => p.code);

test('parseBuildChain: ordered, deduplicated, tier comments ignored', (t) => {
  const root = makeRoot(t);
  dockerfile(root, ['@azeebo/a', '@azeebo/b', '@azeebo/a', '@azeebo/c']);
  assert.deepEqual(parseBuildChain(path.join(root, DOCKERFILE_NAME)), [
    '@azeebo/a',
    '@azeebo/b',
    '@azeebo/c',
  ]);
});

test('exportsDist: dist pointers true, src pointers false, no pointers conservative-true', () => {
  assert.equal(exportsDist({ main: 'dist/index.js', types: 'dist/index.d.ts' }), true);
  assert.equal(exportsDist({ main: 'src/index.ts', types: 'src/index.ts' }), false);
  assert.equal(exportsDist({ main: 'dist/index.js' }), true);
  assert.equal(exportsDist({}), true);
});

test('conforming chain: dist-export dep built earlier passes', (t) => {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/shared-types',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
  });
  workspace(root, {
    name: '@azeebo/security',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/shared-types'],
  });
  dockerfile(root, ['@azeebo/shared-types', '@azeebo/security']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(r.problems, []);
  assert.equal(r.stats.chainLength, 2);
});

test('ORDER_VIOLATION: dist-export dep built after its consumer', (t) => {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/shared-services',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/feature-flags'],
  });
  workspace(root, {
    name: '@azeebo/feature-flags',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
  });
  // feature-flags AFTER shared-services — the real bug the container caught.
  dockerfile(root, ['@azeebo/shared-services', '@azeebo/feature-flags']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['ORDER_VIOLATION']
  );
  assert.ok(
    r.problems[0].message.includes('before its dependency "@azeebo/feature-flags"'),
    r.problems[0].message
  );
  assert.ok(
    r.problems[0].fix.includes('Move "pnpm --filter @azeebo/feature-flags run build" above'),
    r.problems[0].fix
  );
});

test('MISSING_FROM_CHAIN: consumed dist-export package never built (the flag-metrics bug)', (t) => {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/api-gateway',
    dir: 'services/gateway/api-gateway',
    main: 'dist/main.js',
    types: 'dist/main.d.ts',
    deps: ['@azeebo/flag-metrics'],
  });
  workspace(root, {
    name: '@azeebo/flag-metrics',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
  });
  dockerfile(root, ['@azeebo/api-gateway']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['MISSING_FROM_CHAIN']
  );
  assert.match(r.problems[0].fix, /Add "pnpm --filter @azeebo\/flag-metrics run build" before/);
});

test('src-exporting dependency is exempt (the packages/auth case)', (t) => {
  const root = makeRoot(t);
  workspace(root, { name: '@azeebo/auth', main: 'src/index.ts', types: 'src/index.ts' });
  workspace(root, {
    name: '@azeebo/admin',
    dir: 'apps/admin',
    main: 'dist/main.js',
    types: 'dist/main.d.ts',
    deps: ['@azeebo/auth'],
  });
  dockerfile(root, ['@azeebo/admin']);
  assert.deepEqual(codes(root), []);
});

test('devDependencies impose the same ordering constraint', (t) => {
  const root = makeRoot(t);
  workspace(root, { name: '@azeebo/a', main: 'dist/index.js', types: 'dist/index.d.ts' });
  workspace(root, {
    name: '@azeebo/b',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    devDeps: ['@azeebo/a'],
  });
  dockerfile(root, ['@azeebo/b', '@azeebo/a']);
  assert.deepEqual(codes(root), ['ORDER_VIOLATION']);
});

test('UNKNOWN_PACKAGE: chain entry with no workspace (renamed/deleted package)', (t) => {
  const root = makeRoot(t);
  workspace(root, { name: '@azeebo/real', main: 'dist/index.js', types: 'dist/index.d.ts' });
  dockerfile(root, ['@azeebo/ghost', '@azeebo/real']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['UNKNOWN_PACKAGE']
  );
});

test('DUPLICATE_BUILD: a repeated --filter step is flagged', (t) => {
  const root = makeRoot(t);
  workspace(root, { name: '@azeebo/a', main: 'dist/index.js', types: 'dist/index.d.ts' });
  const body = 'RUN pnpm --filter @azeebo/a run build\nRUN pnpm --filter @azeebo/a run build\n';
  writeFileSync(path.join(root, DOCKERFILE_NAME), `FROM node:22\n${body}`);
  assert.deepEqual(codes(root), ['DUPLICATE_BUILD']);
});

test('transitive deps are enforced through the chain (a → b → c, c last = violation at both hops)', (t) => {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/a',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/b'],
  });
  workspace(root, {
    name: '@azeebo/b',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/c'],
  });
  workspace(root, { name: '@azeebo/c', main: 'dist/index.js', types: 'dist/index.d.ts' });
  dockerfile(root, ['@azeebo/a', '@azeebo/b', '@azeebo/c']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['ORDER_VIOLATION', 'ORDER_VIOLATION']
  );
});

test('dependency cycle among chain members is flagged', (t) => {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/x',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/y'],
  });
  workspace(root, {
    name: '@azeebo/y',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    deps: ['@azeebo/x'],
  });
  dockerfile(root, ['@azeebo/x', '@azeebo/y']);
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  // A cycle also necessarily produces at least one ORDER_VIOLATION (the
  // later member violates rule 3) — CYCLE is the root-cause finding.
  assert.ok(r.problems.some((p) => p.code === 'CYCLE'));
  assert.ok(
    r.problems.some((p) => p.code === 'CYCLE' && p.message.includes('@azeebo/x → @azeebo/y')) ||
      r.problems.some((p) => p.code === 'CYCLE' && p.message.includes('@azeebo/y → @azeebo/x'))
  );
});

test('empty chain (no --filter build steps) is a loud error, not a vacuous pass', (t) => {
  const root = makeRoot(t);
  writeFileSync(path.join(root, DOCKERFILE_NAME), 'FROM node:22\nRUN echo hi\n');
  const r = checkBuildChain(root, path.join(root, DOCKERFILE_NAME));
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['EMPTY_CHAIN']
  );
});

// ---------------------------------------------------------------------------
// Per-service Dockerfile wiring (checkServiceDockerfiles)
// ---------------------------------------------------------------------------

/** One service at services/core/svc-a with the given Dockerfile content. */
function singleServiceFixture(
  t,
  { dockerfile: dfContent, build = 'bash ../../../scripts/build-service.sh' } = {}
) {
  const root = makeRoot(t);
  workspace(root, {
    name: '@azeebo/svc-a',
    dir: 'services/core/svc-a',
    main: 'dist/main.js',
    types: 'dist/main.d.ts',
  });
  if (build !== undefined) {
    const pkgPath = path.join(root, 'services/core/svc-a', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.scripts.build = build;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  if (dfContent !== undefined) {
    writeFileSync(path.join(root, 'services/core/svc-a', 'Dockerfile'), `${dfContent}\n`);
  }
  return root;
}

const explicitBuildDf = [
  'FROM node:22 AS builder',
  'WORKDIR /app',
  'RUN pnpm install --frozen-lockfile',
  'RUN bash scripts/generate-prisma-clients.sh',
  'RUN pnpm --filter @azeebo/svc-a run build',
  'COPY --from=builder /app/services/core/svc-a/dist ./services/core/svc-a/dist',
].join('\n');

const bareBuildDf = [
  'FROM node:22 AS builder',
  'WORKDIR /app',
  'RUN pnpm install --frozen-lockfile',
  'WORKDIR /app/services/core/svc-a',
  '# Workspace build script = single source of truth for what "built" means.',
  'RUN pnpm run build',
  'WORKDIR /app',
].join('\n');

test('per-service Dockerfiles: both runner-routed forms pass clean', (t) => {
  for (const df of [explicitBuildDf, bareBuildDf]) {
    const root = singleServiceFixture(t, { dockerfile: df });
    const r = checkServiceDockerfiles(root);
    assert.deepEqual(r.problems, [], JSON.stringify(r.problems));
    assert.deepEqual(r.stats, { services: 1, routed: 1 });
  }
});

const pathFilterDf = [
  'FROM node:22 AS builder',
  'WORKDIR /app',
  'RUN pnpm install --frozen-lockfile',
  'RUN pnpm --filter ./services/core/svc-a run build',
  'COPY --from=builder /app/services/core/svc-a/dist ./services/core/svc-a/dist',
].join('\n');

test('per-service Dockerfiles: the path-filter spelling counts as routed (the form 28/29 Dockerfiles use)', (t) => {
  const root = singleServiceFixture(t, { dockerfile: pathFilterDf });
  const r = checkServiceDockerfiles(root);
  assert.deepEqual(r.problems, [], JSON.stringify(r.problems));
  assert.deepEqual(r.stats, { services: 1, routed: 1 });
});

test('per-service Dockerfiles: a path filter at another workspace is not routed', (t) => {
  const root = singleServiceFixture(t, {
    dockerfile: pathFilterDf.replace('./services/core/svc-a', './services/core/svc-b'),
  });
  const r = checkServiceDockerfiles(root);
  assert.ok(r.problems.some((p) => p.code === 'NO_BUILD_STEP'));
});

test('per-service Dockerfiles: hand-rolled nest build is rejected even when a routed step exists', (t) => {
  const root = singleServiceFixture(t, {
    dockerfile: `${explicitBuildDf}\nRUN cd services/core/svc-a && npx nest build`,
  });
  const r = checkServiceDockerfiles(root);
  const direct = r.problems.filter((p) => p.code === 'DIRECT_BUILD_PROHIBITED');
  assert.equal(direct.length, 1);
  assert.ok(direct[0].message.includes('nest build'));
  assert.ok(direct[0].fix.includes('stale client'));
});

test('per-service Dockerfiles: no build step at all (hand-rolled tsc only) fails with the routing fix', (t) => {
  const root = singleServiceFixture(t, {
    dockerfile: [
      'FROM node:22 AS builder',
      'WORKDIR /app',
      'RUN pnpm install --frozen-lockfile',
      'RUN cd services/core/svc-a && tsc -p tsconfig.build.json',
    ].join('\n'),
  });
  const r = checkServiceDockerfiles(root);
  const codes = r.problems.map((p) => p.code);
  assert.ok(codes.includes('NO_BUILD_STEP'), codes.join(','));
  assert.ok(codes.includes('DIRECT_BUILD_PROHIBITED'), codes.join(','));
  const step = r.problems.find((p) => p.code === 'NO_BUILD_STEP');
  assert.ok(step.fix.includes('pnpm --filter @azeebo/svc-a run build'));
});

test('per-service Dockerfiles: routing through a drifted build script is flagged via dev-wiring constant', (t) => {
  const root = singleServiceFixture(t, {
    dockerfile: explicitBuildDf,
    build: 'tsc -p tsconfig.build.json',
  });
  const r = checkServiceDockerfiles(root);
  // The fixture has no compile line, so DIRECT_BUILD_PROHIBITED cannot fire —
  // the drift finding here is purely the dev-wiring cross-check.
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['RUNNER_NOT_ROUTED']
  );
  assert.ok(r.problems[0].fix.includes('bash ../../../scripts/build-service.sh'));
});

test('per-service Dockerfiles: missing Dockerfile for a buildable service is flagged', (t) => {
  const root = singleServiceFixture(t, { dockerfile: undefined });
  const r = checkServiceDockerfiles(root);
  assert.deepEqual(
    r.problems.map((p) => p.code),
    ['NO_DOCKERFILE']
  );
  assert.ok(r.problems[0].fix.includes('pnpm --filter @azeebo/svc-a run build'));
});

test('per-service Dockerfiles: wrong-service filter or wrong WORKDIR does not count as routed', (t) => {
  const wrongFilter = singleServiceFixture(t, {
    dockerfile: explicitBuildDf.replace('@azeebo/svc-a', '@azeebo/svc-b'),
  });
  assert.ok(checkServiceDockerfiles(wrongFilter).problems.some((p) => p.code === 'NO_BUILD_STEP'));

  const wrongWorkdir = singleServiceFixture(t, {
    dockerfile: bareBuildDf.replace('/app/services/core/svc-a', '/app/services/core/svc-other'),
  });
  assert.ok(checkServiceDockerfiles(wrongWorkdir).problems.some((p) => p.code === 'NO_BUILD_STEP'));
});

test('per-service Dockerfiles: empty repo (no services dir) is vacuously clean', (t) => {
  const root = makeRoot(t);
  const r = checkServiceDockerfiles(root);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.stats, { services: 0, routed: 0 });
});
