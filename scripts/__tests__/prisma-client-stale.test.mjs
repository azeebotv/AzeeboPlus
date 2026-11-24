/**
 * Unit tests for the stale-Prisma-client check
 * (scripts/lib/prisma-client-stale-core.mjs).
 *
 * Each test builds a minimal fixture tree (temp dir) with a canonical
 * `prisma/schema.prisma` and a generated-client output dir containing the
 * schema copy `prisma generate` embeds, then runs the real rule via
 * runStaleClientChecks and asserts the reported statuses — the same way the
 * find-first and flag-conventions checks are tested.
 *
 * Run: `node --test scripts/__tests__/prisma-client-stale.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { runStaleClientChecks, checkWorkspace, resolveClientOutputDir, resolveDefaultEmbeddedSchema, tokenizeSchema, schemaTokensMatch, STATUSES } from '../lib/prisma-client-stale-core.mjs';
import { makeRoot } from './fixtures.mjs';

const SOURCE_SCHEMA = `generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Widget {
  id       String @id @default(uuid())
  universeId String // Links to universe
  metadata Json?
}`;
// What Prisma's formatter writes into the output dir: re-aligned columns,
// comments pulled next to the value, same tokens.
const FORMATTED_SAME = `generator client {
  provider      = "prisma-client-js"
  output        = "../src/prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Widget {
  id         String @id @default(uuid())
  universeId String // Links to universe
  metadata   Json?
}`;
// One real change: a field is added — must be detected as stale.
const FORMATTED_STALE = `generator client {
  provider      = "prisma-client-js"
  output        = "../src/prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Widget {
  id         String @id @default(uuid())
  universeId String // Links to universe
  title      String
  metadata   Json?
}`;

function writeClient(root, relOutputDir, embeddedText) {
  const abs = `${root}/${relOutputDir}`;
  mkdirSync(abs, { recursive: true });
  writeFileSync(`${abs}/schema.prisma`, embeddedText);
}

test('tokenizeSchema drops whitespace and comments, keeps tokens', () => {
  const a = tokenizeSchema('model Widget {\n  id    String   @id // hi\n}');
  const b = tokenizeSchema('model Widget { id String @id }');
  assert.deepEqual(a, b);
});

test('schemaTokensMatch ignores whitespace-only differences', () => {
  assert.equal(schemaTokensMatch(SOURCE_SCHEMA, FORMATTED_SAME), true);
});

test('schemaTokensMatch detects a real change (added field)', () => {
  assert.equal(schemaTokensMatch(SOURCE_SCHEMA, FORMATTED_STALE), false);
});

test('resolveClientOutputDir resolves relative output against the schema dir', () => {
  const dir = resolveClientOutputDir('/fake/ws/prisma/schema.prisma', SOURCE_SCHEMA);
  assert.ok(dir.endsWith('/fake/ws/src/prisma/client'.split('/').join('/')));
});

test('resolveClientOutputDir returns null for default-location generator', () => {
  const noOutput = SOURCE_SCHEMA.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, '');
  assert.equal(resolveClientOutputDir('/fake/ws/prisma/schema.prisma', noOutput), null);
});

test('fresh client (embedded copy matches modulo whitespace) passes', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeClient(root, 'services/core/demo/src/prisma/client', FORMATTED_SAME);
  const { results, stale, missing, unverified } = runStaleClientChecks(root);
  assert.deepEqual(stale, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(unverified, []);
  assert.equal(results[0].status, STATUSES.FRESH);
});

test('stale client (schema edited after generate) is reported', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeClient(root, 'services/core/demo/src/prisma/client', FORMATTED_STALE);
  const { stale } = runStaleClientChecks(root);
  assert.deepEqual(stale, ['services/core/demo']);
});

test('real drift hidden by attribute reordering is still detected as stale', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // Embedded: field attributes reordered (freedom) AND a real change
  // (universeId gained @unique — not in source). Must NOT pass.
  const drifted = FORMATTED_STALE.replace(
    'universeId String // Links to universe',
    'universeId String @unique // Links to universe'
  );
  writeClient(root, 'services/core/demo/src/prisma/client', drifted);
  const { stale } = runStaleClientChecks(root);
  assert.deepEqual(stale, ['services/core/demo']);
});

test('attribute moved BETWEEN fields is detected as stale (not absorbed by sorting)', (t) => {
  const source = `generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma/client"
}

model Widget {
  id    String @id @default(uuid())
  count Int    @default(0) @unique
}`;
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': source,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // Embedded: @default(0) jumped from count to id — semantics changed.
  const embedded = `generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma/client"
}

model Widget {
  id    String @default(0) @id @unique
  count Int
}`;
  writeClient(root, 'services/core/demo/src/prisma/client', embedded);
  const { stale, unverified } = runStaleClientChecks(root);
  assert.deepEqual(unverified, []);
  assert.deepEqual(stale, ['services/core/demo']);
});;

test('reordered fields in the embedded copy are detected as stale', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const reordered = FORMATTED_SAME.replace(
    /  id         String @id @default\(uuid\(\)\)\n  universeId String \/\/ Links to universe\n/,
    '  universeId String // Links to universe\n  id         String @id @default(uuid())\n'
  );
  assert.notEqual(reordered, FORMATTED_SAME);
  writeClient(root, 'services/core/demo/src/prisma/client', reordered);
  const { stale } = runStaleClientChecks(root);
  assert.deepEqual(stale, ['services/core/demo']);
});

test('missing generated client (no output dir) is reported as MISSING', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { missing } = runStaleClientChecks(root);
  assert.deepEqual(missing, ['services/core/demo']);
});

test('output dir exists but is empty is MISSING, not a crash', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(`${root}/services/core/demo/src/prisma/client`, { recursive: true });
  const { missing } = runStaleClientChecks(root);
  assert.deepEqual(missing, ['services/core/demo']);
});

test('default-location generator is UNVERIFIED even when a local copy exists (shared location policy)', (t) => {
  const noOutput = SOURCE_SCHEMA.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, '');
  const root = makeRoot({
    'packages/shared-demo/prisma/schema.prisma': noOutput,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeClient(root, 'packages/shared-demo/node_modules/.prisma/client', FORMATTED_SAME.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, ''));
  const { results, unverified, stale, missing } = runStaleClientChecks(root);
  assert.deepEqual(stale, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(unverified, ['packages/shared-demo']);
  assert.equal(results[0].status, STATUSES.UNVERIFIED);
  // The detail tells the user how to make the workspace verifiable.
  assert.ok(results[0].detail.includes('output'), results[0].detail);
});

test('default-location generator with no client is UNVERIFIED, not failing', (t) => {
  const noOutput = SOURCE_SCHEMA.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, '');
  const root = makeRoot({
    'packages/shared-demo/prisma/schema.prisma': noOutput,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { unverified, stale, missing } = runStaleClientChecks(root);
  assert.deepEqual(stale, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(unverified, ['packages/shared-demo']);
});

test('apps workspaces (2-level root, e.g. apps/<app>) are discovered too', (t) => {
  const root = makeRoot({
    'apps/demo/prisma/schema.prisma': SOURCE_SCHEMA.replace('"../src/prisma/client"', '"../src/generated/prisma"'),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeClient(root, 'apps/demo/src/generated/prisma', FORMATTED_SAME.replace('"../src/prisma/client"', '"../src/generated/prisma"'));
  const { stale, missing, unverified } = runStaleClientChecks(root);
  assert.deepEqual(stale, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(unverified, []);
});

test('checkWorkspace tolerates a workspace path on any platform style', (t) => {
  const root = makeRoot({
    'services/core/demo/prisma/schema.prisma': SOURCE_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeClient(root, 'services/core/demo/src/prisma/client', FORMATTED_SAME);
  const r = checkWorkspace(`${root}/services/core/demo`, `${root}/services/core/demo/prisma/schema.prisma`);
  assert.equal(r.status, STATUSES.FRESH);
  // Workspace rel path uses forward slashes regardless of host OS.
  assert.ok(!r.workspace.includes('\\'));
});

/** Minimal fake @prisma/client install so the default-location resolver has something to resolve. */
function writeFakePrismaClient(root, relNodeModules, embeddedText) {
  const nm = `${root}/${relNodeModules}`;
  mkdirSync(`${nm}/@prisma/client`, { recursive: true });
  writeFileSync(`${nm}/@prisma/client/package.json`, JSON.stringify({ name: '@prisma/client', version: '6.0.0-fake' }));
  mkdirSync(`${nm}/.prisma/client`, { recursive: true });
  writeFileSync(`${nm}/.prisma/client/schema.prisma`, embeddedText);
  return `${nm}/.prisma/client/schema.prisma`;
}

const DEFAULT_OUTPUT_SCHEMA = SOURCE_SCHEMA.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, '');
const DEFAULT_OUTPUT_EMBEDDED = FORMATTED_SAME.replace(/  output\s*=\s*"\.\.\/src\/prisma\/client"\n/, '');

test('sole default-output workspace is verified against the @prisma/client-resolved default location (fresh)', (t) => {
  const root = makeRoot({
    'packages/shared-demo/prisma/schema.prisma': DEFAULT_OUTPUT_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const embedded = writeFakePrismaClient(root, 'packages/shared-demo/node_modules', DEFAULT_OUTPUT_EMBEDDED);
  assert.equal(resolveDefaultEmbeddedSchema(`${root}/packages/shared-demo`), realpathSync(embedded));
  const { stale, missing, unverified, results } = runStaleClientChecks(root);
  assert.deepEqual(stale, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(unverified, []);
  assert.equal(results[0].status, STATUSES.FRESH);
});

test('sole default-output workspace with a stale default client is STALE', (t) => {
  const root = makeRoot({
    'packages/shared-demo/prisma/schema.prisma': DEFAULT_OUTPUT_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFakePrismaClient(root, 'packages/shared-demo/node_modules', DEFAULT_OUTPUT_EMBEDDED + '\nmodel Extra { id String @id }\n');
  const { stale, unverified } = runStaleClientChecks(root);
  assert.deepEqual(stale, ['packages/shared-demo']);
  assert.deepEqual(unverified, []);
});

test('two default-output workspaces stay UNVERIFIED (owner ambiguity preserved)', (t) => {
  const root = makeRoot({
    'packages/shared-demo/prisma/schema.prisma': DEFAULT_OUTPUT_SCHEMA,
    'packages/other-demo/prisma/schema.prisma': DEFAULT_OUTPUT_SCHEMA,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFakePrismaClient(root, 'node_modules', DEFAULT_OUTPUT_EMBEDDED);
  const { results, unverified } = runStaleClientChecks(root);
  // Order of UNVERIFIED entries follows discovery order, not a contract — compare as sets.
  assert.deepEqual([...unverified].sort(), ['packages/other-demo', 'packages/shared-demo']);
  assert.ok(results.every((r) => r.detail.includes('attributed')));
});
