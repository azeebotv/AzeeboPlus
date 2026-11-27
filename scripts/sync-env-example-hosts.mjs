#!/usr/bin/env node
// ============================================================================
// sync-env-example-hosts.mjs — keep registry hostnames inside .env.example
// templates generated instead of hand-written.
//
// .env.example is copied to .env by humans and by local-dev scripts, and dotenv
// cannot interpolate (a `${APP_HOST}` inside a value only expands if the
// consumer happens to enable expansion, so the template would be broken in some
// loaders and literal in others). The values therefore have to be real hosts —
// which is exactly the place a domain rename goes stale.
//
// This script owns those values: the manifest below declares which (file, key)
// pairs carry a platform host and what that host is expressed as, in registry
// tokens. A rename edits packages/shared-types/src/platform-domains.json and
// reruns this; --check fails CI when a template disagrees with the registry.
//
// Commands that consume these keys read the same registry at runtime, so the
// template is a convenience default, not the source of truth.
//
// Usage:
//   node scripts/sync-env-example-hosts.mjs          # rewrite templates
//   node scripts/sync-env-example-hosts.mjs --check  # fail if any value is stale
//   add `--root <dir>` to operate on another checkout (tests use this)
// Exit codes: 0 = written / up to date, 1 = stale or invalid registry,
//             2 = a managed key is missing from its template.
// CI wiring: .github/workflows/pr-checks.yml (next to generate-domain-env).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY_RELATIVE_PATH } from './generate-domain-env.mjs';

/** Registry token -> hostname. `{app}`, `{stagingApi}`, `{wwwStaging}`, ... */
export function registryTokens(registry) {
  const base = registry?.baseDomain;
  if (typeof base !== 'string' || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(base)) {
    throw new Error(`invalid baseDomain in ${REGISTRY_RELATIVE_PATH}: ${base}`);
  }
  const tokens = { baseDomain: base };
  for (const [key, label] of Object.entries(registry.subdomains ?? {})) {
    tokens[key] = label ? `${label}.${base}` : base;
  }
  const stagingRoot = registry.subdomains?.stagingRoot;
  if (stagingRoot) {
    for (const [key, label] of Object.entries(registry.stagingSubdomains ?? {})) {
      tokens[`${key}Staging`] = `${label}.${stagingRoot}.${base}`;
    }
  }
  return tokens;
}

/**
 * Every (file, key) whose value is a platform host. `template` may be a comma
 * list, in which case the rendered value joins with no spaces (env list style).
 */
export const MANAGED_VALUES = [
  {
    file: '.env.example',
    key: 'CDN_BASE_URL',
    commented: true,
    template: 'https://{cdn}',
  },
  {
    file: 'apps/tv/.env.example',
    key: 'EXPO_PUBLIC_ACTIVATION_URL',
    template: 'https://{app}/link',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'GOOGLE_REDIRECT_URI',
    template: 'https://{stagingRoot}/auth/callback',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'APPLE_REDIRECT_URI',
    template: 'https://{stagingRoot}/auth/callback',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'CORS_ORIGIN',
    template: ['https://{stagingRoot}', 'https://{wwwStaging}', 'https://{adminStaging}'],
  },
  {
    file: 'deploy/staging.env.example',
    key: 'ALLOWED_ORIGINS',
    template: ['https://{stagingRoot}', 'https://{wwwStaging}', 'https://{adminStaging}'],
  },
  {
    file: 'deploy/staging.env.example',
    key: 'NEXT_PUBLIC_API_URL',
    template: 'https://{stagingApi}',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'NEXT_PUBLIC_BASE_URL',
    template: 'https://{stagingRoot}',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'NEXT_PUBLIC_AUTH_URL',
    template: 'https://{stagingApi}',
  },
  {
    file: 'deploy/staging.env.example',
    key: 'SSL_DOMAIN',
    template: '{stagingRoot}',
  },
];

/** Keys managed for one template — the gate uses this to reject stray literals. */
export function managedKeysFor(file) {
  return new Set(MANAGED_VALUES.filter((entry) => entry.file === file).map((entry) => entry.key));
}

/** Renders one manifest template (string or list) into its concrete value. */
export function renderValue(template, tokens) {
  const parts = Array.isArray(template) ? template : [template];
  return parts
    .map((part) =>
      part.replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, token) => {
        if (!(token in tokens)) throw new Error(`unknown registry token in template: ${whole}`);
        return tokens[token];
      })
    )
    .join(',');
}

const KEY_LINE_RE = (key) => new RegExp(`^(\\s*)#?\\s*${key}=`);

/**
 * Rewrites every managed value in `text`. Throws when a declared key has no
 * line in the file, so a renamed or deleted key cannot silently stop syncing.
 */
export function applyManagedValues(text, entries, tokens) {
  const lines = text.split('\n');
  for (const entry of entries) {
    const value = renderValue(entry.template, tokens);
    const re = KEY_LINE_RE(entry.key);
    const idx = lines.findIndex((line) => re.test(line));
    if (idx === -1) {
      throw new Error(`${entry.file}: no "${entry.key}=" line to manage`);
    }
    const indent = lines[idx].match(re)[1];
    const prefix = entry.commented ? '# ' : '';
    lines[idx] = `${indent}${prefix}${entry.key}=${value}`;
  }
  return lines.join('\n');
}

/** Parses the env key on a line, active or commented out. */
export function lineKey(line) {
  const match = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/);
  return match ? match[1] : null;
}

/** Groups the manifest by file, preserving declaration order. */
export function manifestByFile() {
  const byFile = new Map();
  for (const entry of MANAGED_VALUES) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, []);
    byFile.get(entry.file).push(entry);
  }
  return byFile;
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root =
    rootIdx >= 0
      ? path.resolve(args[rootIdx + 1])
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const checkOnly = args.includes('--check');
  let tokens;
  let byFile;
  try {
    tokens = registryTokens(
      JSON.parse(fs.readFileSync(path.join(root, REGISTRY_RELATIVE_PATH), 'utf8'))
    );
    byFile = manifestByFile();
  } catch (err) {
    console.error(`✗ sync-env-example-hosts could not run: ${err.message}`);
    process.exit(1);
  }

  const stale = [];
  try {
    for (const [file, entries] of byFile) {
      const abs = path.join(root, file);
      const current = fs.readFileSync(abs, 'utf8');
      const next = applyManagedValues(current, entries, tokens);
      if (next === current) continue;
      if (checkOnly) {
        const before = current.split('\n');
        const after = next.split('\n');
        after.forEach((line, i) => {
          if (line !== before[i]) stale.push(`${file}:${i + 1}  ${line.trim()}`);
        });
        continue;
      }
      fs.writeFileSync(abs, next);
      console.log(`Updated ${file}`);
    }
  } catch (err) {
    console.error(`✗ sync-env-example-hosts: ${err.message}`);
    process.exit(2);
  }

  if (checkOnly && stale.length > 0) {
    console.error(`✗ stale registry hosts in .env.example templates (${stale.length}):`);
    for (const line of stale) console.error(`  ${line}`);
    console.error('\nRun: node scripts/sync-env-example-hosts.mjs');
    process.exit(1);
  }
  console.log(
    checkOnly
      ? `${[...byFile.keys()].length} templates match the domain registry.`
      : `Synced ${[...byFile.keys()].length} templates.`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
