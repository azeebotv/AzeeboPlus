/**
 * Unit tests for the Prisma findFirst→findUnique check
 * (scripts/lib/prisma-find-first-core.mjs).
 *
 * Each test builds a minimal fixture tree (temp dir) with a canonical
 * `prisma/schema.prisma` and a few source files, runs the real rule via
 * runPrismaFindFirstChecks, and asserts which violations are reported — the
 * same way the flag-conventions rules are tested. Bad fixtures must fail with
 * the expected message + file:line; clean fixtures must pass.
 *
 * Run: `node --test scripts/__tests__/prisma-find-first.test.mjs`
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { runPrismaFindFirstChecks } from '../lib/prisma-find-first-core.mjs';
import { makeRoot } from './fixtures.mjs';

const SCHEMA = `
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String
}

model Post {
  id     String @id @default(uuid())
  userId String
  slug   String

  @@unique([userId, slug])
}
`;

const clean = () => ({
  'services/core/demo/prisma/schema.prisma': SCHEMA,
  'services/core/demo/src/ok.ts': [
    `this.prisma.user.findUnique({ where: { id: '1' } });`,
    `this.prisma.user.findFirst({ where: { name: 'buffy' } });`,
    `this.prisma.post.findFirst({ where: { userId: 'u', slug: 's', draft: true } });`,
  ].join('\n'),
});

const errors = (root) => runPrismaFindFirstChecks(root).errors;

test('clean fixture passes (no violations)', (t) => {
  const root = makeRoot(clean());
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('findFirst on an @id field is flagged with file:line', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.user.findFirst({ where: { id: '1' } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('`User.findFirst` filters on the unique key(s) `id`') && e.includes('services/core/demo/src/bad.ts:1')),
    errs.join('\n')
  );
});

test('findFirst on a @unique field is flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.user.findFirst({ where: { email } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(errs.some((e) => e.includes("unique key(s) `email`")), errs.join('\n'));
});

test('findFirst on a compound @@unique is flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.post.findFirst({ where: { userId, slug } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('unique key(s) `slug, userId`')),
    errs.join('\n')
  );
});

test('findFirstOrThrow on a unique key is flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.user.findFirstOrThrow({ where: { id } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(errs.some((e) => e.includes('unique key(s) `id`')), errs.join('\n'));
});

test('findFirst with an extra non-unique field is NOT flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/ok2.ts': [
      `this.prisma.user.findFirst({ where: { id, name: 'buffy' } });`,
      `this.prisma.user.findFirst({ where: { email, verified: true } });`,
    ].join('\n'),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('findFirst whose where is a variable is NOT flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/ok3.ts': `this.prisma.user.findFirst(query);\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('findMany on an @id field is flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.user.findMany({ where: { id: '1' } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('`User.findMany` filters on the unique key(s) `id`')),
    errs.join('\n')
  );
});

test('findMany on a compound @@unique is flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/bad.ts': `this.prisma.post.findMany({ where: { userId, slug } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const errs = errors(root);
  assert.ok(
    errs.some((e) => e.includes('unique key(s) `slug, userId`')),
    errs.join('\n')
  );
});

test('findMany with a filter-object value ({ in }) is NOT flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/ok5.ts': [
      `this.prisma.user.findMany({ where: { id: { in: ['1', '2'] } } });`,
      `this.prisma.user.findMany({ where: { email: { contains: 'x' } } });`,
    ].join('\n'),
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('findFirst with a filter-object value ({ in }) is NOT flagged', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/ok6.ts': `this.prisma.user.findFirst({ where: { id: { in: ['1'] } } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});

test('findFirst on a non-model delegate is ignored', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/ok4.ts': `this.prisma.cache.findFirst({ where: { id: '1' } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // `cache` is not a model in the fixture schema, so nothing is reported.
  assert.deepEqual(errors(root), []);
});

test('generated prisma client output is never scanned', (t) => {
  const root = makeRoot({
    ...clean(),
    'services/core/demo/src/prisma/client/index.d.ts': `const x = prisma.user.findFirst({ where: { id: '1' } });\n`,
    'services/core/demo/src/prisma/client/index.js': `prisma.user.findFirst({ where: { id: '1' } });\n`,
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(errors(root), []);
});
