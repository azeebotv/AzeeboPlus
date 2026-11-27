/**
 * Unit tests for the require-shared-route-boundary ESLint rule
 * (packages/eslint-rules/require-shared-route-boundary.js).
 *
 * Run via the CI conventions job: `node --test scripts/__tests__/*.test.mjs`
 *
 * apps/web's error and loading boundaries are the two states every route
 * renders before the route exists, and they were generated per folder — 219
 * hand-drawn error cards, 217 hand-drawn spinners. They are converted, so this
 * rule's job is the NEXT route: render the shared component or mark the
 * exception in a comment a reviewer can see.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const rule = require('../../packages/eslint-rules/require-shared-route-boundary.js');
// The repo's real flat config lints .tsx with this parser, so the fixtures below
// can keep their production signatures (`{ reset }: { reset: () => void }`).
const { parser } = require('typescript-eslint');

const ROOT = 'apps/web/src/app';

function lint(code, filename, options = {}) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx'],
        plugins: { 'azeebo-custom': { rules: { 'require-shared-route-boundary': rule } } },
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        rules: { 'azeebo-custom/require-shared-route-boundary': ['error', options] },
      },
    ],
    filename
  );
}

const LOADING_WITH_SHARED = `import RouteLoading from '@/components/ui/RouteLoading';
export default function Loading(): React.JSX.Element {
  return <RouteLoading />;
}`;

const ERROR_WITH_SHARED = `import RouteErrorFallback from '@/components/ui/RouteErrorFallback';
export default function Error({ reset }: { reset: () => void }) {
  return <RouteErrorFallback reset={reset} />;
}`;

test('a loading boundary that renders the shared spinner passes', () => {
  assert.deepEqual(lint(LOADING_WITH_SHARED, `${ROOT}/wallet/loading.tsx`), []);
});

test('a hand-rolled spinner is rejected', () => {
  const messages = lint(
    `export default function Loading() {
  return <div className="animate-spin rounded-full h-8 w-8 border-b-2" />;
}`,
    `${ROOT}/wallet/loading.tsx`
  );
  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /loading\.tsx/);
  assert.match(messages[0].message, /RouteLoading/);
});

test('an error boundary that renders the shared fallback passes', () => {
  assert.deepEqual(
    lint(
      `import RouteErrorFallback from '@/components/ui/RouteErrorFallback';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, [error]);
  return <RouteErrorFallback error={error} reset={reset} />;
}`,
      `${ROOT}/live/[id]/error.tsx`
    ),
    []
  );
});

test('a bespoke error card is rejected', () => {
  const messages = lint(
    `import { AlertTriangle } from 'lucide-react';
export default function Error({ reset }) {
  return <div><AlertTriangle /><button onClick={reset}>Try Again</button></div>;
}`,
    `${ROOT}/downloads/error.tsx`
  );
  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /RouteErrorFallback/);
});

test('global-error.tsx is exempt by name', () => {
  // Next.js bypasses the root layout there; it must render its own html/body.
  assert.deepEqual(
    lint(`export default function GlobalError() { return <html><body>boom</body></html>; }`, `${ROOT}/global-error.tsx`),
    []
  );
});

test('the escape marker lets a genuine exception through', () => {
  const code = `// design-system:custom-boundary the TV surface renders a fullscreen remote-first card
export default function Loading() {
  return <div className="animate-spin" />;
}`;
  assert.deepEqual(lint(code, `${ROOT}/tv/browse/loading.tsx`), []);
});

test('outside the router tree the rule is silent', () => {
  assert.deepEqual(
    lint(`export default function Loading() { return null; }`, 'apps/web/src/components/ui/loading.tsx'),
    []
  );
  assert.deepEqual(
    lint(`export default function Error() { return null; }`, 'services/core/user-service/src/error.tsx'),
    []
  );
});

test('options extend the boundary table', () => {
  const code = `export default function NotFound() { return <div>404</div>; }`;
  assert.deepEqual(lint(code, `${ROOT}/not-found.tsx`), []);
  assert.equal(
    lint(code, `${ROOT}/not-found.tsx`, {
      boundaries: { 'not-found.tsx': '@/components/ui/RouteNotFound' },
    }).length,
    1
  );
});
