/**
 * Unit tests for the require-map-and-throw ESLint rule
 * (packages/eslint-rules/require-map-and-throw.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * Each case runs the real rule through the ESLint Linter API and asserts the
 * exact number of reports — flagging hardcoded 4xx HttpExceptions inside
 * catch blocks while letting rethrows, mapAndThrow, and non-catch throws pass.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Linter } = require('eslint');
const rule = require('../../packages/eslint-rules/require-map-and-throw.js');

const linter = new Linter();

function run(code, options = []) {
  return linter.verify(code, {
    plugins: {
      'azeebo-custom': { rules: { 'require-map-and-throw': rule } },
    },
    rules: {
      'azeebo-custom/require-map-and-throw': ['error', ...options],
    },
  });
}

function expectReports(code, expectedCount, options) {
  const messages = run(code, options);
  assert.equal(
    messages.length,
    expectedCount,
    `expected ${expectedCount} report(s), got ${messages.length}: ${JSON.stringify(messages.map((m) => m.message))}`
  );
}

test('flags hardcoded 4xx HttpExceptions inside catch blocks', () => {
  expectReports(
    `async function f() {
  try { await g(); } catch (error) {
    if (x) throw new NotFoundException('nope');
  }
}`,
    1
  );
});

test('flags every flagged NestJS 4xx class inside a catch block', () => {
  const classes = [
    'BadRequestException',
    'UnauthorizedException',
    'ForbiddenException',
    'NotFoundException',
    'ConflictException',
    'GoneException',
    'PayloadTooLargeException',
    'UnsupportedMediaTypeException',
    'UnprocessableEntityException',
    'TooManyRequestsException',
    'NotAcceptableException',
    'RequestTimeoutException',
    'MethodNotAllowedException',
    'PaymentRequiredException',
  ];
  for (const ctor of classes) {
    expectReports(`try { g(); } catch (error) { throw new ${ctor}('x'); }`, 1);
  }
});

test('flags generic HttpException with a hardcoded 4xx status literal', () => {
  expectReports(`try { g(); } catch (e) { throw new HttpException('msg', 422); }`, 1);
  expectReports(`try { g(); } catch (e) { throw new HttpException('msg', 400); }`, 1);
});

test('does not flag generic HttpException with a 5xx status', () => {
  expectReports(`try { g(); } catch (error) { throw new HttpException('msg', 500); }`, 0);
});

test('does not flag 5xx NestJS exceptions inside catch blocks', () => {
  expectReports(
    `try { g(); } catch (error) {
  throw new InternalServerErrorException('boom');
}`,
    0
  );
});

test('does not flag rethrowing the caught error (the correct preservation pattern)', () => {
  expectReports(
    `try { g(); } catch (error) {
  if (error instanceof NotFoundException) throw error;
}`,
    0
  );
});

test('does not flag mapAndThrow — the required form', () => {
  expectReports(
    `try { g(); } catch (error) {
  mapAndThrow(error, 'doing the thing');
}`,
    0
  );
});

test('does not flag throws outside any catch block', () => {
  expectReports(`function f() { if (!x) throw new NotFoundException('nope'); return x; }`, 0);
});

test('does not flag throwing a different in-scope value from a nested catch', () => {
  expectReports(
    `try {
  g();
} catch (error) {
  let parsed;
  try { parsed = JSON.parse(s); } catch (e) { parsed = null; }
  if (!parsed) throw new BadRequestException('bad json');
}`,
    1
  );
});

test('reports the caught parameter name in the message', () => {
  const messages = run(`try { g(); } catch (err) { throw new NotFoundException('x'); }`);
  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /mapAndThrow\(err, '<context>'\)/);
});

test('handles catch clauses without a parameter', () => {
  expectReports(`try { g(); } catch { throw new NotFoundException('x'); }`, 1);
});

test('does not flag plain Error throws by default', () => {
  expectReports(`try { g(); } catch (error) { throw new Error('boom'); }`, 0);
  expectReports(`try { g(); } catch (error) { throw new TypeError('nope'); }`, 0);
});

test('flags plain Error throws when banPlainErrors is enabled', () => {
  expectReports(`try { g(); } catch (error) { throw new Error('boom'); }`, 1, [
    { banPlainErrors: true },
  ]);
  expectReports(`try { g(); } catch (error) { throw new TypeError('nope'); }`, 1, [
    { banPlainErrors: true },
  ]);
});

test('respects the allowed-fabricated-4xx suppression comment inside the catch block', () => {
  expectReports(
    `try { g(); } catch (error) {
  // allowed-fabricated-4xx: DTO already validated upstream
  throw new NotFoundException('nope');
}`,
    0
  );
});

test('flags throws nested inside conditionals within the catch block', () => {
  expectReports(
    `try { g(); } catch (error) {
  if (a) { if (b) { throw new ForbiddenException('no'); } }
}`,
    1
  );
});

test('flags each throw site separately in one catch block', () => {
  expectReports(
    `try { g(); } catch (error) {
  if (a) throw new NotFoundException('x');
  if (b) throw new ConflictException('y');
  throw error;
}`,
    2
  );
});
