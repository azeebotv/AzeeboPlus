/**
 * Core of the flag conventions check — parameterized by the repo `root` so it
 * can be unit-tested against fixture trees (see scripts/__tests__).
 *
 * Part 1 — registry keys (`packages/feature-flags/src/registries.ts`):
 *  - keys not matching `^[a-z][a-z0-9_]*$` (snake_case, service-prefixed)
 *  - registries with no leading service segment on any key (e.g. `mobile_`)
 *  - duplicated flag keys across registries
 *  - keys whose literal string differs from the property name (kebab/mixed)
 *
 * Part 2 — universe sentinels (canonical slugs in
 * `packages/shared-types/src/universe.ts`):
 *  - `UNIVERSE_SLUGS` itself: snake_case slugs, no duplicates
 *  - every `universe.<slug>.enabled` sentinel KEY literal anywhere in the repo
 *    (src, tests, docs) must use a canonical slug — catches drift back to
 *    `universe.creators.enabled` / `universe.movies.enabled`
 *  - every literal first argument to `universeEnabledKey(...)` /
 *    `universeFlagKey(...)` must be a canonical slug
 *  - bare nav-config `flag: 'x'` values in client universe grids must be a
 *    canonical slug or an explicitly allowlisted non-universe surface
 *    (NAV_FLAG_ALLOWLIST, e.g. `cinemaxis`)
 *  - the gateway must derive its sentinels from `UNIVERSE_SLUGS` (not a
 *    hand-maintained list that can silently drop slugs like `music`)
 *
 * Part 3 — shared dynamic-module registration hygiene:
 *  - no deployable workspace (apps/<name> or services/<group>/<name>) may call
 *    a client/instance-creating dynamic module (see DYNAMIC_MODULE_RULES) more
 *    than once across its production source — each call news its own service
 *    instance and often its own Redis client, so duplicates leak connections
 *    and orphan state (A-3 regression guard)
 *
 * Part 4 — FeatureFlagGuard ↔ @FeatureFlag pairing (A-8 hardening):
 *  - any @UseGuards(...FeatureFlagGuard...) must sit on a class/method that
 *    also carries @FeatureFlag (or a class whose methods do); without the
 *    legacy x-feature-flag header fallback a bare guard now gates nothing, so
 *    it is dead code that reads like protection
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Normalize reported relative paths to forward slashes so violations read the
 *  same on every platform (Windows `path.relative` emits backslashes). */
const toPosix = (p) => p.split(path.sep).join('/');

/** Directories that never contain source sentinel keys. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  'coverage',
  'generated',
  'build',
  '.git',
]);

/**
 * Intentional non-universe surfaces that gate on their OWN bootstrap flag
 * (not a `universe.<name>.enabled` sentinel) and are therefore allowed in
 * client nav configs alongside canonical universe slugs. Add here only when
 * the surface is deliberately outside the universe sentinel system.
 */
export const NAV_FLAG_ALLOWLIST = new Set(['cinemaxis']);

/**
 * Dynamic modules that news a service instance (and often a Redis client) per
 * call. A deployable workspace must call each at most once — the app-level
 * registration is the single instance; feature modules just inject.
 */
export const DYNAMIC_MODULE_RULES = [
  {
    name: 'FeatureFlagModule.register',
    re: /\bFeatureFlagModule\.register\(/g,
  },
  {
    name: 'FlagMetricsModule.register',
    re: /\bFlagMetricsModule\.register\(/g,
  },
  {
    name: 'RateLimiterModule.forRoot/register',
    re: /\bRateLimiterModule\.(?:forRoot|register)\(/g,
  },
  {
    name: 'EventBusModule.forRoot/forRootAsync',
    re: /\bEventBusModule\.forRoot(?:Async)\(/g,
  },
  {
    name: 'SharedFeatureFlagsModule.register/forRoot',
    re: /\bSharedFeatureFlagsModule\.(?:register|forRoot)\(/g,
  },
  {
    name: 'BullModule.forRoot/forRootAsync',
    re: /\bBullModule\.forRoot(?:Async)\(/g,
  },
];

/**
 * Remove // and block comments (string-aware) so the registration count never
 * trips on docs/comments that mention `FeatureFlagModule.register(...)`.
 */
export function stripComments(code) {
  let out = '';
  let i = 0;
  let inString = null; // `'`, `"`, or backtick
  while (i < code.length) {
    const ch = code[i];
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += code[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (ch === inString) inString = null;
      i++;
      continue;
    }
    if (ch === `'` || ch === `"` || ch === '`') {
      inString = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        out += code[i] === '\n' ? '\n' : ' ';
        i++;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Workspaces: apps/<name> and services/<group>/<name> (packages excluded —
 *  they legitimately wrap dynamic modules, e.g. shared-services). */
function collectWorkspaces(root) {
  const workspaces = [];
  const appsDir = path.join(root, 'apps');
  if (existsSync(appsDir)) {
    for (const ws of readdirSync(appsDir, { withFileTypes: true })) {
      if (ws.isDirectory()) workspaces.push(path.join(appsDir, ws.name));
    }
  }
  const servicesDir = path.join(root, 'services');
  if (existsSync(servicesDir)) {
    for (const subgroup of readdirSync(servicesDir, { withFileTypes: true })) {
      if (!subgroup.isDirectory()) continue;
      const wsDir = path.join(servicesDir, subgroup.name);
      for (const ws of readdirSync(wsDir, { withFileTypes: true })) {
        if (ws.isDirectory()) workspaces.push(path.join(wsDir, ws.name));
      }
    }
  }
  return workspaces;
}

/**
 * Run every convention rule against the tree rooted at `root`.
 * @returns {{ errors: string[], uniqueKeys: number, slugCount: number }}
 */
export function runFlagConventionChecks(root) {
  const errors = [];

  /* ───────────────────── Part 1: registry keys ─────────────────────── */

  const registryFile = path.join(root, 'packages/feature-flags/src/registries.ts');
  if (!existsSync(registryFile)) {
    errors.push(`missing packages/feature-flags/src/registries.ts at ${root}`);
    return { errors, uniqueKeys: 0, slugCount: 0 };
  }
  const src = readFileSync(registryFile, 'utf8');

  const KEY_RE = /\b([a-zA-Z][a-zA-Z0-9]*):\s*'((?:[a-z]+_)*[a-z][a-z0-9_]*)'/g;
  const seen = new Map();
  let match;
  while ((match = KEY_RE.exec(src)) !== null) {
    const prop = match[1];
    const key = match[2];
    if (seen.has(key)) {
      errors.push(`duplicate flag key "${key}" (first seen at ${seen.get(key)})`);
      continue;
    }
    seen.set(key, match.index);
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      errors.push(`flag key "${key}" is not snake_case`);
    }
    const segments = key.split('_');
    if (segments.length < 2) {
      errors.push(`flag key "${key}" has no service prefix`);
    }
    // Property is camelCase of the key WITHOUT the domain prefix. Most
    // registries strip one segment (walletFlags.withdrawalsEnabled ↔
    // wallet_withdrawals_enabled); liveEventFlags strips two (ppv ↔
    // live_event_ppv), so accept 1–2 segments.
    const parts = key.split('_');
    const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
    const one = toCamel(parts.slice(1).join('_'));
    const two = toCamel(parts.slice(2).join('_'));
    if (prop !== one && prop !== two) {
      errors.push(
        `flag key "${key}" has mismatched property "${prop}" (expected "${one}" or "${two}")`
      );
    }
  }

  /* ────────────────── Part 2: universe sentinels ────────────────────── */

  const universeFile = path.join(root, 'packages/shared-types/src/universe.ts');
  if (!existsSync(universeFile)) {
    errors.push(`missing packages/shared-types/src/universe.ts at ${root}`);
    return { errors, uniqueKeys: seen.size, slugCount: 0 };
  }
  const universeSrc = readFileSync(universeFile, 'utf8');

  /** Canonical universe slugs — the only values allowed in sentinel keys. */
  let canonicalSlugCount = 0;
  const slugsBlock = /export const UNIVERSE_SLUGS = \[([\s\S]*?)\] as const;/.exec(universeSrc);
  if (!slugsBlock) {
    errors.push('could not find `UNIVERSE_SLUGS` in packages/shared-types/src/universe.ts');
  } else {
    const slugs = [...slugsBlock[1].matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]);
    if (slugs.length === 0) {
      errors.push('UNIVERSE_SLUGS contains no slugs');
    }
    canonicalSlugCount = slugs.length;
    const slugSet = new Set();
    for (const slug of slugs) {
      if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
        errors.push(`universe slug "${slug}" is not snake_case`);
      }
      if (slugSet.has(slug)) {
        errors.push(`duplicate universe slug "${slug}"`);
      }
      slugSet.add(slug);
    }

    const canonical = slugSet;

    const sourceFiles = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
        } else if (/\.(ts|tsx|md)$/.test(entry.name)) {
          sourceFiles.push(path.join(dir, entry.name));
        }
      }
    };
    walk(root);

    /** Sentinel key literal: `universe.<slug>.enabled` (optionally prefixed). */
    const SENTINEL_RE = /\buniverse\.([a-z0-9_]+)\.enabled\b/g;
    /** Builder call sites with literal slugs: `universeEnabledKey('x')`, `universeFlagKey('x', …)`. */
    const BUILDER_RE = /\buniverse(?:Enabled|Flag)Key\(\s*'([a-z0-9_]+)'/g;
    /** Bare nav-config flag field: `flag: 'slug'` / `flag: "slug"` in client
     *  universe grids (e.g. mobile GuestHomepage's explore cards). */
    const NAV_FLAG_RE = /\bflag:\s*['"]([a-z0-9_]+)['"]/g;

    const report = (rel, line, slug, what = 'sentinel') =>
      errors.push(
        `universe ${what} uses non-canonical slug "${slug}" (not in UNIVERSE_SLUGS) — ${rel}:${line}`
      );

    for (const file of sourceFiles) {
      const text = readFileSync(file, 'utf8');
      const check = (re, isValid, what) => {
        let m;
        while ((m = re.exec(text)) !== null) {
          const slug = m[1];
          if (!isValid(slug)) {
            const lineNo = text.slice(0, m.index).split('\n').length;
            report(toPosix(path.relative(root, file)), lineNo, slug, what);
          }
        }
      };
      check(SENTINEL_RE, (s) => canonical.has(s), 'sentinel');
      check(BUILDER_RE, (s) => canonical.has(s), 'builder arg');
      check(NAV_FLAG_RE, (s) => canonical.has(s) || NAV_FLAG_ALLOWLIST.has(s), 'nav flag value');
    }

    // The gateway must serve every canonical slug — derived from the shared
    // list, never a hand-maintained array that can silently drop one.
    const gatewayModule = path.join(root, 'services/gateway/api-gateway/src/app.module.ts');
    if (!existsSync(gatewayModule)) {
      errors.push(`missing services/gateway/api-gateway/src/app.module.ts at ${root}`);
    } else {
      const gatewaySrc = readFileSync(gatewayModule, 'utf8');
      if (!/UNIVERSE_SLUGS\.map\(universeEnabledKey\)/.test(gatewaySrc)) {
        errors.push(
          'gateway app.module.ts no longer derives its universe sentinels from ' +
            '`UNIVERSE_SLUGS.map(universeEnabledKey)` — re-add the derivation so every ' +
            'canonical slug (incl. music) stays registered'
        );
      }
    }
  }

  /* ────────────── Part 3: dynamic-module registration ──────────────── */

  const TEST_FILE_RE = /\.(?:spec|test|e2e-spec)\.(?:ts|tsx)$/;

  for (const ws of collectWorkspaces(root)) {
    if (!existsSync(path.join(ws, 'package.json'))) continue;
    const hitsByModule = new Map();
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
        } else if (/\.tsx?$/.test(entry.name) && !TEST_FILE_RE.test(entry.name)) {
          const file = path.join(dir, entry.name);
          const text = readFileSync(file, 'utf8');
          const clean = stripComments(text);
          for (const rule of DYNAMIC_MODULE_RULES) {
            rule.re.lastIndex = 0;
            let m;
            while ((m = rule.re.exec(clean)) !== null) {
              const lineNo = text.slice(0, m.index).split('\n').length;
              const hits = hitsByModule.get(rule.name) ?? [];
              hits.push(`${toPosix(path.relative(root, file))}:${lineNo}`);
              hitsByModule.set(rule.name, hits);
            }
          }
        }
      }
    };
    walk(ws);
    for (const [name, hits] of hitsByModule) {
      if (hits.length > 1) {
        errors.push(
          `${toPosix(path.relative(root, ws))}: ${hits.length} ${name}() calls — ` +
            `keep exactly one per service (each call news its own service instance + ` +
            `Redis client): ${hits.join(', ')}`
        );
      }
    }
  }

  /* ────────────── Part 4: FeatureFlagGuard ↔ @FeatureFlag ─────────────── */

  // A controller/handler that applies FeatureFlagGuard WITHOUT a matching
  // @FeatureFlag on the same class/method gates nothing (the legacy
  // x-feature-flag header fallback was removed) — dead code that reads like
  // protection, so the pairing is still required.
  {
    const files = [];
    const walkTs = (dir) => {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) walkTs(path.join(dir, entry.name));
        } else if (/\.tsx?$/.test(entry.name) && !TEST_FILE_RE.test(entry.name)) {
          files.push(path.join(dir, entry.name));
        }
      }
    };
    walkTs(root);

    const isDecoratorLine = (line) => /^\s*@/.test(line);

    for (const file of files) {
      const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
      let currentClassHasFeatureFlag = false;
      let i = 0;
      while (i < lines.length) {
        if (!isDecoratorLine(lines[i])) {
          i++;
          continue;
        }
        // Contiguous decorator stack above one class/method declaration.
        const start = i;
        let end = i;
        while (end < lines.length - 1 && isDecoratorLine(lines[end + 1])) end++;
        const stack = lines.slice(start, end + 1).join('\n');

        // Declaration = first non-blank, non-decorator line after the stack.
        let decl = end + 1;
        while (decl < lines.length && lines[decl].trim() === '') decl++;
        const isClass = /\bclass\s+[A-Za-z0-9_]+/.test(lines[decl] ?? '');

        const hasGuard = /@UseGuards\([\s\S]*\bFeatureFlagGuard\b/.test(stack);
        const hasFeatureFlag = /@FeatureFlag\s*\(/.test(stack);

        if (hasGuard) {
          // Methods inherit a class-level @FeatureFlag; a class must have its own.
          const covered = isClass ? hasFeatureFlag : hasFeatureFlag || currentClassHasFeatureFlag;
          if (!covered) {
            errors.push(
              `FeatureFlagGuard applied without a matching @FeatureFlag on the same ` +
                `class/method — ${toPosix(path.relative(root, file))}:${start + 1}`
            );
          }
        }

        if (isClass) currentClassHasFeatureFlag = hasFeatureFlag;
        i = end + 1;
      }
    }
  }

  return { errors, uniqueKeys: seen.size, slugCount: canonicalSlugCount };
}
