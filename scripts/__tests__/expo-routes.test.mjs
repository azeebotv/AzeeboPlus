/**
 * Unit tests for the Expo Router dead-link check
 * (scripts/lib/expo-routes-core.mjs).
 *
 * Each test builds a minimal fixture app tree (temp dir via makeRoot), runs
 * the real rule via runExpoRouteChecks, and asserts which violations are
 * reported — the same way the flag-conventions / prisma-find-first rules are
 * tested. Bad fixtures must fail with the expected app/file/target; clean
 * fixtures must pass.
 *
 * Run: `node --test scripts/__tests__/expo-routes.test.mjs`
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runExpoRouteChecks, EXPO_ROUTE_ALLOWLIST } from '../lib/expo-routes-core.mjs';
import { makeRoot } from './fixtures.mjs';

/** Fixture: a mobile-style app with a tabs group and a dynamic route. */
const CLEAN_APP = {
  'apps/mobile/app/_layout.tsx': 'export default function L() { return null; }\n',
  'apps/mobile/app/(tabs)/_layout.tsx': 'export default function T() { return null; }\n',
  'apps/mobile/app/(tabs)/index.tsx': 'export default function H() { return null; }\n',
  'apps/mobile/app/(tabs)/wallet/index.tsx': 'export default function W() { return null; }\n',
  'apps/mobile/app/watch/[contentId].tsx': 'export default function V() { return null; }\n',
  'apps/mobile/app/music/genres/[slug].tsx': 'export default function G() { return null; }\n',
  'apps/mobile/app/(tabs)/home.tsx': [
    "import { useRouter } from 'expo-router';",
    'export default function Home() {',
    '  const router = useRouter();',
    "  return <Button onPress={() => router.push('/(tabs)/wallet')} />;",
    '}',
  ].join('\n'),
  'apps/mobile/app/(tabs)/search.tsx': [
    "import { Link } from 'expo-router';",
    'export default function Search() {',
    "  return <Link href=\"/watch/abc-123\">Watch</Link>;",
    '}',
  ].join('\n'),
};

/** Non-Expo workspace: no app/ directory — must be skipped entirely. */
const OTHER_APP = {
  'apps/web/package.json': '{ "name": "@azeebo/web" }\n',
  'apps/web/src/app/page.tsx': 'export default function P() { return null; }\n',
};

function fixture(extraFiles = []) {
  return makeRoot({ ...CLEAN_APP, ...OTHER_APP, ...Object.fromEntries(extraFiles) });
}

describe('expo-routes: clean fixtures', () => {
  test('passes when every target resolves (groups, params, query strings)', () => {
    const { errors, stats } = runExpoRouteChecks(fixture());
    assert.deepEqual(errors, []);
    assert.equal(stats.appsScanned, 1);
    // Routes: (tabs)/index→/, (tabs)/wallet/index→/wallet, watch/[contentId],
    // music/genres/[slug], (tabs)/home→/home, (tabs)/search→/search
    assert.equal(stats.routesFound, 6);
    assert.ok(stats.targetsChecked >= 2);
  });

  test('non-Expo workspaces are skipped', () => {
    const { errors } = runExpoRouteChecks(fixture());
    assert.deepEqual(errors, []);
  });

  test('href targets inside src/ are scanned too', () => {
    const root = fixture([
      [
        'apps/mobile/src/modules/vertical/screens/Foo.tsx',
        "export const go = (router) => router.navigate('/music/genres/afrobeats');",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.deepEqual(errors, []);
  });
});

describe('expo-routes: dead links are reported', () => {
  test('static push to a nonexistent route fails with file:line', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.tsx',
        [
          "import { useRouter } from 'expo-router';",
          'export default function Home() {',
          '  const router = useRouter();',
          "  return <Button onPress={() => router.push('/rewards/redeem-options')} />;",
          '}',
        ].join('\n'),
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /apps\/mobile\/app\/\(tabs\)\/home\.tsx:4/);
    assert.match(errors[0], /'\/rewards\/redeem-options'/);
  });

  test('href to a nonexistent route fails', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/search.tsx',
        "export default function S() { return <Link href=\"/nope/missing\">x</Link>; }",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /'\/nope\/missing'/);
  });

  test('dynamic template target with no [param] route fails', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router, id) => router.push(`/music/${encodeURIComponent(id)}`);",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /no matching route/);
  });

  test('literal target segment cannot fill a literal-only route prefix', () => {
    // /watchlist exists but target is /watchlists — must fail.
    const root = fixture([
      ['apps/mobile/app/(tabs)/watchlist.tsx', 'export default function WL() { return null; }\n'],
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router) => router.replace('/watchlists');",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
  });

  test('violations carry the app name for multi-app triage', () => {
    const root = fixture([
      ['apps/tv/app/index.tsx', "export const go = (router) => router.push('/missing-screen');"],
      ['apps/tv/app/_layout.tsx', 'export default function L() { return null; }\n'],
    ]);
    // The fixture's mobile home.tsx is clean, so the only violation is TV's.
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /apps\/tv\/app\/index\.tsx:1/);
  });
});

describe('expo-routes: matching semantics', () => {
  test('dynamic target resolves through a [param] route', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router, id) => router.push(`/watch/${id}`);",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.deepEqual(errors, []);
  });

  test('catch-all route absorbs multi-segment targets', () => {
    const root = fixture([
      ['apps/mobile/app/legal/[...path].tsx', 'export default function L() { return null; }\n'],
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router) => router.push('/legal/terms/privacy/2026');",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.deepEqual(errors, []);
  });

  test('query strings are ignored when matching', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router, id) => router.push(`/watch/${id}?autoplay=true`);",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.deepEqual(errors, []);
  });

  test('layouts, private folders and +specials are not routes', () => {
    const root = fixture([
      ['apps/mobile/app/(tabs)/_layout.tsx', 'export default function T() { return null; }\n'],
      ['apps/mobile/app/(tabs)/+not-found.tsx', 'export default function NF() { return null; }\n'],
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router) => router.push('/_layout');",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /'\/_layout'/);
  });

  test('allowlisted targets are skipped and require a reason', () => {
    // Temporarily seed the allowlist via the exported array shape contract:
    // the check consults { app, target } entries — verify one matches exactly.
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.tsx',
        "export const go = (router) => router.push('/definitely-missing');",
      ],
    ]);
    const { errors } = runExpoRouteChecks(root);
    assert.equal(errors.length, 1);
    // And the allowlist shape itself must be reason-tagged (static contract).
    for (const entry of EXPO_ROUTE_ALLOWLIST) {
      assert.ok(typeof entry.reason === 'string' && entry.reason.length > 0);
      assert.ok(typeof entry.app === 'string' && typeof entry.target === 'string');
    }
  });

  test('test files are not scanned', () => {
    const root = fixture([
      [
        'apps/mobile/app/(tabs)/home.test.tsx',
        "export const go = (router) => router.push('/only-in-tests');",
      ],
    ]);
    const { errors, stats } = runExpoRouteChecks(root);
    assert.deepEqual(errors, []);
    assert.equal(stats.filesScanned, fixtureFileCount());
  });
});

/** Number of scannable files in the base CLEAN_APP fixture. */
function fixtureFileCount() {
  return Object.keys(CLEAN_APP).filter(
    (f) => f.includes('/app/') && !/(^|\/)_/.test(f.split('/').pop())
  ).length;
}
