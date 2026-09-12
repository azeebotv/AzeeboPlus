/**
 * Unit tests for the dev-script wiring check
 * (scripts/lib/dev-wiring-core.mjs).
 *
 * Each test builds a minimal fixture tree (temp dir) with services/<group>/
 * <svc>/ package.json layouts, runs the real rule via runDevWiringChecks,
 * and asserts the reported violations — the same way the find-first and
 * stale-client checks are tested.
 *
 * Run: `node --test scripts/__tests__/dev-wiring.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { runDevWiringChecks, runAppWiringChecks, runPackageWiringChecks, EXPECTED_START_DEV, EXPECTED_BUILD, EXPECTED_APP_START_DEV, EXPECTED_PACKAGE_BUILD, SHARED_RUNNER, SHARED_BUILD_RUNNER, SHARED_APP_RUNNER, SHARED_PACKAGE_BUILD_RUNNER } from '../lib/dev-wiring-core.mjs';
import { makeRoot } from './fixtures.mjs';

function service(root, rel, { startDev, build, withSchema = false, withLegacyScript = false, withRunner = true, withBuildRunner = true } = {}) {
  const dir = `${root}/${rel}`;
  mkdirSync(dir, { recursive: true });
  // undefined → conforming default; null → no script at all (explicit
  // undefined cannot opt out of a destructuring default).
  const wiring = startDev === undefined ? EXPECTED_START_DEV : startDev;
  const buildWiring = build === undefined ? EXPECTED_BUILD : build;
  const scripts = {
    ...(wiring === null ? {} : { 'start:dev': wiring }),
    ...(buildWiring === null ? {} : { build: buildWiring }),
  };
  writeFileSync(`${dir}/package.json`, JSON.stringify({ name: rel, scripts }));
  if (withSchema) {
    mkdirSync(`${dir}/prisma`, { recursive: true });
    writeFileSync(`${dir}/prisma/schema.prisma`, 'generator client { provider = "prisma-client-js" }');
  }
  if (withLegacyScript) writeFileSync(`${dir}/start-dev.sh`, '#!/bin/bash\n');
  if (withRunner || withBuildRunner) {
    mkdirSync(`${root}/scripts`, { recursive: true });
    if (withRunner) writeFileSync(`${root}/${SHARED_RUNNER}`, '#!/usr/bin/env bash\n');
    if (withBuildRunner) writeFileSync(`${root}/${SHARED_BUILD_RUNNER}`, '#!/usr/bin/env bash\n');
  }
}

/** Fixture: an app workspace at apps/<name> with its own runner class. */
function app(root, rel, { startDev, withSchema = false, withAppRunner = true } = {}) {
  const dir = `${root}/${rel}`;
  mkdirSync(dir, { recursive: true });
  const wiring = startDev === undefined ? EXPECTED_APP_START_DEV : startDev;
  const scripts = wiring === null ? {} : { 'start:dev': wiring };
  writeFileSync(`${dir}/package.json`, JSON.stringify({ name: rel, scripts }));
  if (withSchema) {
    mkdirSync(`${dir}/prisma`, { recursive: true });
    writeFileSync(`${dir}/prisma/schema.prisma`, 'generator client { provider = "prisma-client-js" }');
  }
  if (withAppRunner) {
    mkdirSync(`${root}/scripts`, { recursive: true });
    writeFileSync(`${root}/${SHARED_APP_RUNNER}`, '#!/usr/bin/env bash\n');
  }
}

/** Fixture: a package workspace at packages/<name> (compile-only build class). */
function pkg(root, rel, { build, withPkgRunner = true } = {}) {
  const dir = `${root}/${rel}`;
  mkdirSync(dir, { recursive: true });
  const buildWiring = build === undefined ? EXPECTED_PACKAGE_BUILD : build;
  const scripts = buildWiring === null ? {} : { build: buildWiring };
  writeFileSync(`${dir}/package.json`, JSON.stringify({ name: rel, scripts }));
  if (withPkgRunner) {
    mkdirSync(`${root}/scripts`, { recursive: true });
    writeFileSync(`${root}/${SHARED_PACKAGE_BUILD_RUNNER}`, '#!/usr/bin/env bash\n');
  }
}

test('conforming tree passes (runners + exact wiring + no legacy scripts)', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo');
  service(root, 'services/universes/other');
  const r = runDevWiringChecks(root);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.bypasses, []);
  assert.deepEqual(r.legacyScripts, []);
  assert.deepEqual(r.buildBypasses, []);
  assert.equal(r.workspaces, 2);
});

test('direct nest start:dev is flagged as a bypass', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { startDev: 'nest start --watch' });
  const { bypasses } = runDevWiringChecks(root);
  assert.equal(bypasses.length, 1);
  assert.ok(bypasses[0].includes('services/core/demo'), bypasses[0]);
  assert.ok(bypasses[0].includes(EXPECTED_START_DEV), bypasses[0]);
});

test('a reintroduced per-service start-dev.sh is flagged', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { withLegacyScript: true });
  const { legacyScripts } = runDevWiringChecks(root);
  assert.equal(legacyScripts.length, 1);
  assert.ok(legacyScripts[0].startsWith('services/core/demo'), legacyScripts[0]);
});

test('missing shared runner is a single loud error, not per-service noise', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { withRunner: false });
  service(root, 'services/core/demo2', { withRunner: false });
  const r = runDevWiringChecks(root);
  assert.equal(r.runnerPresent, false);
  assert.equal(r.errors.filter((e) => e.includes('shared dev runner missing')).length, 1);
});

test('missing shared build runner is a single loud error, not per-service noise', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { withBuildRunner: false });
  service(root, 'services/core/demo2', { withBuildRunner: false });
  const r = runDevWiringChecks(root);
  assert.equal(r.buildRunnerPresent, false);
  assert.equal(r.errors.filter((e) => e.includes('shared build runner missing')).length, 1);
  // Dev wiring itself is still conforming.
  assert.deepEqual(r.bypasses, []);
});

test('inline build chain (the old drift surface) is flagged as a build bypass', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', {
    build: 'prisma generate && tsc -p tsconfig.build.json && mkdir -p dist/prisma && rm -rf dist/prisma/client && cp -R src/prisma/client dist/prisma/client',
  });
  const { buildBypasses } = runDevWiringChecks(root);
  assert.equal(buildBypasses.length, 1);
  assert.ok(buildBypasses[0].includes('services/core/demo'), buildBypasses[0]);
  assert.ok(buildBypasses[0].includes(EXPECTED_BUILD), buildBypasses[0]);
});

test('conforming build wiring with a missing runner file is an error (relative-path lie, build edition)', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { withBuildRunner: false });
  const { errors, buildBypasses } = runDevWiringChecks(root);
  assert.deepEqual(buildBypasses, []); // string matches, so not a bypass
  assert.ok(errors.some((e) => e.includes('services/core/demo') && e.includes('build points at a missing runner')), errors.join('\n'));
});

test('build wiring with a wrong ../ count is a bypass (string must be exact)', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { build: 'bash ../../scripts/build-service.sh' });
  const { errors, buildBypasses } = runDevWiringChecks(root);
  assert.equal(buildBypasses.length, 1);
  assert.ok(buildBypasses[0].includes('must be exactly'), buildBypasses[0]);
});

test('workspace with no build script at all is an error', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { build: null });
  const { errors } = runDevWiringChecks(root);
  assert.equal(errors.filter((e) => e.includes('no build script')).length, 1);
});

test('workspace with a schema but no start:dev is an error; without a schema it is informational', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/data-svc', { startDev: null, withSchema: true });
  service(root, 'services/gateway/proxy-svc', { startDev: null });
  const r = runDevWiringChecks(root);
  assert.equal(r.errors.length, 1);
  assert.ok(r.errors[0].includes('services/core/data-svc'), r.errors[0]);
  assert.deepEqual(r.unwired, ['services/gateway/proxy-svc']);
});

test('wiring that resolves to a missing runner is an error (relative-path lie)', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  service(root, 'services/core/demo', { withRunner: false });
  const { errors, bypasses } = runDevWiringChecks(root);
  assert.deepEqual(bypasses, []);
  assert.ok(errors.some((e) => e.includes('services/core/demo') && e.includes('missing runner')), errors.join('\n'));
});

test('schema-owning app routed through the shared app runner passes; schema-less app is informational', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  app(root, 'apps/admin', { withSchema: true });
  // startDev: null → no start:dev at all; schema-less apps may keep their own
  // dev model, so this is informational, not an error.
  app(root, 'apps/web', { startDev: null });
  const r = runAppWiringChecks(root);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.appBypasses, []);
  assert.deepEqual(r.appUnwired, ['apps/web']);
  assert.equal(r.workspaces, 2);
});

test('schema-owning app still booting via tsx watch (the old gap) is flagged', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  app(root, 'apps/creator', { withSchema: true, startDev: 'tsx watch src/main.ts' });
  const { appBypasses } = runAppWiringChecks(root);
  assert.equal(appBypasses.length, 1);
  assert.ok(appBypasses[0].includes('apps/creator'), appBypasses[0]);
  assert.ok(appBypasses[0].includes(EXPECTED_APP_START_DEV), appBypasses[0]);
});

test('schema-owning app with no start:dev at all is an error', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  app(root, 'apps/admin', { withSchema: true, startDev: null });
  const { errors } = runAppWiringChecks(root);
  assert.equal(errors.filter((e) => e.includes('apps/admin') && e.includes('no start:dev')).length, 1);
});

test('app runner wiring with a wrong ../ count resolves into apps/scripts — caught by resolution check', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // String differs from the constant → bypass (exact-string rule fires first).
  app(root, 'apps/admin', { withSchema: true, startDev: 'bash ../../scripts/start-dev-service.sh' });
  const { appBypasses, errors } = runAppWiringChecks(root);
  assert.equal(appBypasses.length, 1);
  assert.deepEqual(errors, []);
});

test('missing shared app runner is a single loud error', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  app(root, 'apps/admin', { withSchema: true, withAppRunner: false });
  app(root, 'apps/creator', { withSchema: true, withAppRunner: false });
  const r = runAppWiringChecks(root);
  assert.equal(r.appRunnerPresent, false);
  assert.equal(r.errors.filter((e) => e.includes('shared app dev runner missing')).length, 1);
});

test('schema-less app routed through the app runner is flagged as a mistake', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  app(root, 'apps/web', { startDev: EXPECTED_APP_START_DEV }); // web has no schema
  const { errors } = runAppWiringChecks(root);
  assert.equal(errors.filter((e) => e.includes('apps/web') && e.includes('schema-less')).length, 1);
});

test('package build wired through the shared compile-only runner passes', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  pkg(root, 'packages/shared-types');
  pkg(root, 'packages/auth'); // src-exporting package builds too — same rule
  const r = runPackageWiringChecks(root);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.packageBuildBypasses, []);
  assert.equal(r.workspaces, 2);
});

test('inline tsc chain in a package (the old drift surface) is flagged as a bypass', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  pkg(root, 'packages/utils', { build: 'tsc' });
  const { packageBuildBypasses } = runPackageWiringChecks(root);
  assert.equal(packageBuildBypasses.length, 1);
  assert.ok(packageBuildBypasses[0].includes('packages/utils'), packageBuildBypasses[0]);
  assert.ok(packageBuildBypasses[0].includes(EXPECTED_PACKAGE_BUILD), packageBuildBypasses[0]);
});

test('package build with a wrong ../ count is a bypass (string must be exact)', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  pkg(root, 'packages/utils', { build: 'bash ../../../scripts/build-package.sh' });
  const { packageBuildBypasses, errors } = runPackageWiringChecks(root);
  assert.equal(packageBuildBypasses.length, 1);
  assert.deepEqual(errors, []);
});

test('package with no build script at all is an error', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  pkg(root, 'packages/utils', { build: null });
  const { errors } = runPackageWiringChecks(root);
  assert.equal(errors.filter((e) => e.includes('packages/utils') && e.includes('no build script')).length, 1);
});

test('missing shared package build runner is a single loud error', (t) => {
  const root = makeRoot({});
  t.after(() => rmSync(root, { recursive: true, force: true }));
  pkg(root, 'packages/utils', { withPkgRunner: false });
  pkg(root, 'packages/ui', { withPkgRunner: false });
  const r = runPackageWiringChecks(root);
  assert.equal(r.pkgRunnerPresent, false);
  assert.equal(r.errors.filter((e) => e.includes('shared package build runner missing')).length, 1);
  // No per-package noise for the missing file.
  assert.equal(r.errors.filter((e) => e.includes('missing runner (resolved')).length, 0);
});
