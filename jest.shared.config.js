/**
 * Shared Jest moduleNameMapper rules. Every Jest config in the monorepo spreads
 * `sharedModuleNameMapper` into its own `moduleNameMapper`, so `@azeebo/*`
 * imports resolve the same way everywhere.
 *
 * Paths are absolute (built from this file's location) so they resolve no
 * matter which package's `rootDir` a config uses.
 *
 * Order matters: Jest uses the first matching pattern. Subpath imports
 * (`@azeebo/security/log-redaction`) must come before the package catch-all,
 * otherwise they resolve to a nonexistent `packages/security/log-redaction/src`.
 */
const path = require('path');

const REPO_ROOT = __dirname;
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

const sharedModuleNameMapper = {
  // Strip the `.js` extension from relative ESM-style imports (TS source).
  '^(\\.{1,2}/.*)\\.js$': '$1',
  // Subpath imports, e.g. `@azeebo/security/log-redaction` -> `packages/security/src/log-redaction`.
  '^@azeebo/([^/]+)/(.+)$': path.join(PACKAGES_DIR, '$1', 'src', '$2'),
  // Package root, e.g. `@azeebo/logger` -> `packages/logger/src`.
  '^@azeebo/([^/]+)$': path.join(PACKAGES_DIR, '$1', 'src'),
};

module.exports = { sharedModuleNameMapper };
