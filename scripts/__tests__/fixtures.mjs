/**
 * Shared fixture helpers for the flag-conventions tests. Not a test file
 * itself (no `.test.` in the name) — just builders both suites import.
 */

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Minimal registries.ts that satisfies Part 1 (one prefixed snake_case key). */
export const CLEAN_REGISTRIES = `export const demoFlags = {
  featureEnabled: 'demo_feature_enabled',
};
`;

/** Minimal universe slug list — canonical slugs used across the fixtures. */
export const CLEAN_UNIVERSE = `export const UNIVERSE_SLUGS = ['movie', 'creator'] as const;
`;

/** Minimal gateway app.module.ts that derives its sentinels from UNIVERSE_SLUGS. */
export const CLEAN_GATEWAY = `import { UNIVERSE_SLUGS, universeEnabledKey } from '@azeebo/shared-types';
import { FeatureFlagModule } from '@azeebo/feature-flags';
const defaults = Object.fromEntries(
  UNIVERSE_SLUGS.map(universeEnabledKey).map((key) => [key, true])
);
export const meta = { imports: [FeatureFlagModule.register({ global: true, defaultFlags: defaults })] };
`;

/** Mobile-style nav config with a canonical slug + an allowlisted surface. */
export const CLEAN_NAV = `const EXPLORE = [
  { name: 'Movie', href: '/movies', flag: 'movie' },
  { name: 'Cinemaxis', href: '/cinemaxis', flag: 'cinemaxis' },
];
`;

/** A clean fixture: everything valid, one apps workspace with a package.json. */
export function cleanFiles() {
  return {
    'packages/feature-flags/src/registries.ts': CLEAN_REGISTRIES,
    'packages/shared-types/src/universe.ts': CLEAN_UNIVERSE,
    'services/gateway/api-gateway/src/app.module.ts': CLEAN_GATEWAY,
    'apps/demo/package.json': '{"name":"demo"}',
    'apps/demo/src/nav.ts': CLEAN_NAV,
  };
}

/** Create a temp fixture root with the given files ({relpath: content}). */
export function makeRoot(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'flag-conventions-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}
