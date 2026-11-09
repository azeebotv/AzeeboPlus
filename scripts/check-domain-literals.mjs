#!/usr/bin/env node
// ============================================================================
// check-domain-literals.mjs — hardcoded-host gate
//
// Compose files, CD workflows, Dockerfiles, .env.example templates and the
// tracked deploy/ tree must read platform hostnames from the domain registry
// (packages/shared-types/src/platform-domains.json, exported to
// deploy/domains.env) instead of hardcoding them. A literal host means a domain
// change silently misses that file.
//
// This gate is domain-agnostic: a host on ANY domain is a violation, not just
// one under the registry's base domain. That is how `api.staging.azeebo.ng`
// survived a rename — it was not a registry host, so a registry-only check
// could not see it.
//
// Surfaces (SCAN_GLOBS):
//   - docker compose files
//   - GitHub workflow files
//   - Dockerfiles (the all-in-one image bakes client build args at build time)
//   - tracked *.env.example templates
//   - everything under deploy/ (entrypoint, nginx, supervisord, bake file,
//     canary config, base compose …)
//
// Two surfaces are deliberately out of scope (see isScannedSurface):
//   - Markdown: docs quote hostnames verbatim on purpose, and
//     scripts/check-docs-consistency.mjs owns them.
//   - generated artifacts (deploy/domains.env, deploy/cdn-config.json): they
//     ARE the registry export, so every host in them is a registry host by
//     construction. Their freshness is checked by generate-domain-env.mjs
//     --check / generate-cdn-config.mjs --check; scanning them would only
//     re-assert the generator's output.
//
// .env.example templates get one narrow concession: dotenv cannot interpolate
// deploy/domains.env, so a literal copy of a *current* registry host is allowed
// on a key that scripts/sync-env-example-hosts.mjs generates (and --check
// verifies). A registry literal on any other key is an unmanaged-template-host.
// Deploy scripts do not get that concession at all (they can source
// scripts/lib/domain-env.sh). Everything else fails as before — an invented
// subdomain (auth.<env>.<base-domain>) or a host on a foreign domain (the old
// brand domain) is drift whether or not it currently resolves.
//
// What counts as a host (context-anchored, so filenames and GitHub expression
// paths are never mistaken for hosts):
//   1. the host of a URL                 https://api.example.com/v1
//   2. the value of a host-ish key       APP_HOST: api.example.com
//                                        domainName: "api.example.com"
//                                        hostname=api.example.com
//   3. a Host: header                    -H 'Host: api.example.com'
//
// Ignored without needing an allowlist entry: single-label service DNS
// (api-gateway, redis), loopback, and the RFC-reserved/internal suffixes
// (.internal, .local, .localhost, .test, .invalid, example.com et al).
// Legitimate third-party hosts are declared, with a reason, in
// scripts/domain-literal-allowlist.json.
//
// Usage: node scripts/check-domain-literals.mjs [--root <dir>]
// Exit codes: 0 = clean, 1 = hardcoded hosts found, 2 = could not run.
// CI wiring: .github/workflows/pr-checks.yml
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY_RELATIVE_PATH } from './generate-domain-env.mjs';
import { lineKey, managedKeysFor } from './sync-env-example-hosts.mjs';

export const SCAN_GLOBS = [
  'docker-compose*.yml',
  'deploy/docker-compose*.yml',
  '.github/workflows/*.yml',
  // git pathspec `*` matches across `/`, so this covers every service Dockerfile.
  '*Dockerfile*',
  '*.env.example',
  // The whole deploy tree — entrypoint, nginx.conf, supervisord, bake file,
  // canary config, staging.env.example. Local-only deploy/*.env files are
  // gitignored, so this stays a tracked-files surface.
  'deploy/*',
];

/** Machine-generated from the registry; their own --check gates diff them. */
export const GENERATED_FILES = new Set(['deploy/domains.env', 'deploy/cdn-config.json']);

/** Prose quotes hostnames deliberately; docs consistency has its own gate. */
export const DOCUMENTATION_SUFFIXES = ['.md', '.mdx'];

/** False for files that are scanned by a different gate (or generated). */
export function isScannedSurface(file) {
  if (GENERATED_FILES.has(file)) return false;
  return !DOCUMENTATION_SUFFIXES.some((suffix) => file.endsWith(suffix));
}

/**
 * Files where a literal copy of a current registry host is tolerated — but only
 * on a key the sync script owns (see sync-env-example-hosts.mjs), so the value
 * is regenerated on a rename instead of being typed by hand.
 */
export const ENV_TEMPLATE_SUFFIX = '.env.example';

export function allowsRegistryLiterals(file) {
  return file.endsWith(ENV_TEMPLATE_SUFFIX);
}

/** True when `file` declares `key` as a generated (registry-owned) value. */
export function isManagedTemplateKey(file, key) {
  return Boolean(key) && allowsRegistryLiterals(file) && managedKeysFor(file).has(key);
}

export const ALLOWLIST_RELATIVE_PATH = 'scripts/domain-literal-allowlist.json';

/** Hosts that never need an allowlist entry because they cannot route publicly. */
export const IGNORED_SUFFIXES = ['.internal', '.local', '.localhost', '.test', '.invalid'];
export const IGNORED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
/** RFC 2606 documentation domains: placeholders, never real infrastructure. */
export const IGNORED_DOMAINS = ['example.com', 'example.net', 'example.org'];

/** URL schemes whose host is checked. */
const URL_RE =
  /\b(?:https?|wss?|grpcs?|ftps?|redis|rediss|postgres(?:ql)?|amqp):\/\/([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)/gi;
/** `SOME_HOST: x`, `domainName: "x"`, `hostname=x`, `API_HOST: x` */
const HOST_KEY_RE =
  /\b[a-z0-9_]*(?:host|hostname|domain)[a-z0-9_]*\s*[:=]\s*["']?([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)/gi;
/** `Host: x` (curl -H 'Host: x', nginx proxy_set_header Host x). */
const HOST_HEADER_RE = /\bhost:\s*["']?([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)/gi;

/**
 * Builds the set of registry hostnames: the base domain, every production
 * subdomain, and every staging subdomain (www.staging.<base>, admin.staging.<base>).
 */
export function registryHosts(registry) {
  const base = registry.baseDomain;
  const hosts = new Set([base]);
  for (const label of Object.values(registry.subdomains ?? {})) {
    if (label) hosts.add(`${label}.${base}`);
  }
  const stagingRoot = registry.subdomains?.stagingRoot;
  if (stagingRoot) {
    for (const label of Object.values(registry.stagingSubdomains ?? {})) {
      if (label) hosts.add(`${label}.${stagingRoot}.${base}`);
    }
  }
  return hosts;
}

/**
 * registry           — an exact registry hostname
 * unregistered-subdomain — on our base domain but the registry does not define it
 * foreign-domain     — anything else
 */
export function classifyHost(host, registryHostSet, baseDomain) {
  const h = host.toLowerCase();
  if (registryHostSet.has(h)) return 'registry';
  if (baseDomain && (h === baseDomain || h.endsWith(`.${baseDomain}`))) {
    return 'unregistered-subdomain';
  }
  return 'foreign-domain';
}

/** Reads the declared third-party allowlist. Throws if an entry has no reason. */
export function loadAllowlist(root) {
  const file = path.join(root, ALLOWLIST_RELATIVE_PATH);
  if (!fs.existsSync(file)) return new Set();
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = Array.isArray(parsed.allowedHosts) ? parsed.allowedHosts : [];
  const hosts = new Set();
  for (const entry of entries) {
    if (typeof entry?.host !== 'string' || !entry.host) {
      throw new Error(`${ALLOWLIST_RELATIVE_PATH}: every entry needs a "host"`);
    }
    if (typeof entry.reason !== 'string' || entry.reason.trim().length < 8) {
      throw new Error(`${ALLOWLIST_RELATIVE_PATH}: "${entry.host}" needs a real "reason"`);
    }
    hosts.add(entry.host.toLowerCase());
  }
  return hosts;
}

export function isIgnoredHost(host, allowlist) {
  const h = host.toLowerCase();
  if (IGNORED_HOSTS.has(h)) return true;
  // Single-label names are service DNS inside the compose network, not domains.
  if (!h.includes('.')) return true;
  if (IGNORED_SUFFIXES.some((suffix) => h.endsWith(suffix))) return true;
  if (IGNORED_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  // An allowlisted host also covers its subdomains (amazonaws.com -> bucket.s3.amazonaws.com).
  for (const allowed of allowlist) {
    if (h === allowed || h.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

/** Extracts candidate hosts from one line, in source order. */
export function extractHosts(line) {
  const seen = new Set();
  const hosts = [];
  for (const re of [URL_RE, HOST_KEY_RE, HOST_HEADER_RE]) {
    re.lastIndex = 0;
    for (const match of line.matchAll(re)) {
      const host = match[1].toLowerCase().replace(/\.$/, '');
      if (seen.has(host)) continue;
      seen.add(host);
      hosts.push(host);
    }
  }
  return hosts;
}

/**
 * Returns [{ file, line, host, kind, registry }] for every hardcoded host.
 * `registry: true` marks a literal copy of a registry host, which has the more
 * specific fix (read it from deploy/domains.env). In .env.example templates a
 * registry literal is permitted only on a managed key, where the sync script
 * regenerates it; anywhere else it is an unmanaged-template-host.
 */
export function findHardcodedHosts(
  root,
  files,
  registryHostSet,
  allowlist = new Set(),
  options = {}
) {
  const { baseDomain } = options;
  const violations = [];
  for (const file of files) {
    if (!isScannedSurface(file)) continue;
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n');
    lines.forEach((text, i) => {
      for (const host of extractHosts(text)) {
        if (isIgnoredHost(host, allowlist)) continue;
        const kind = classifyHost(host, registryHostSet, baseDomain);
        if (kind === 'registry' && isManagedTemplateKey(file, lineKey(text))) continue;
        // Only templates can carry an "unmanaged" host; elsewhere the fix is
        // still to read the registry value.
        const reported =
          kind === 'registry' && allowsRegistryLiterals(file) ? 'unmanaged-template-host' : kind;
        violations.push({
          file,
          line: i + 1,
          host,
          kind: reported,
          registry: kind === 'registry',
        });
      }
    });
  }
  return violations;
}

/** Tracked files matching SCAN_GLOBS (git ls-files, so local-only files are skipped). */
export function listTrackedFiles(root) {
  const out = execFileSync('git', ['ls-files', '--', ...SCAN_GLOBS], {
    cwd: root,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root =
    rootIdx >= 0
      ? path.resolve(args[rootIdx + 1])
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  let files;
  let hosts;
  let allowlist;
  let baseDomain;
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRY_RELATIVE_PATH), 'utf8'));
    hosts = registryHosts(registry);
    baseDomain = registry.baseDomain;
    allowlist = loadAllowlist(root);
    files = listTrackedFiles(root);
  } catch (err) {
    console.error(`✗ check-domain-literals could not run: ${err.message}`);
    process.exit(2);
  }

  const violations = findHardcodedHosts(root, files, hosts, allowlist, { baseDomain });
  if (violations.length > 0) {
    const fromRegistry = violations.filter((v) => v.kind === 'registry');
    const unmanagedTemplate = violations.filter((v) => v.kind === 'unmanaged-template-host');
    const unregistered = violations.filter((v) => v.kind === 'unregistered-subdomain');
    const foreign = violations.filter((v) => v.kind === 'foreign-domain');
    console.error(
      `✗ hardcoded hosts in compose/workflow/Dockerfile/env/deploy files (${violations.length}):`
    );
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.host}  [${v.kind}]`);
    }
    if (fromRegistry.length > 0) {
      console.error(
        '\nregistry hosts: read the value from deploy/domains.env (see scripts/lib/domain-env.sh)\n' +
          'or a ${VAR:-default} built from it.'
      );
    }
    if (unmanagedTemplate.length > 0) {
      console.error(
        '\n.env.example hosts: declare the key in scripts/sync-env-example-hosts.mjs so the value\n' +
          'is generated from the domain registry (run that script to rewrite it), or drop the host.'
      );
    }
    if (unregistered.length > 0) {
      console.error(
        `\nunregistered subdomains: ${baseDomain} does not serve these hosts. Add the subdomain to\n` +
          'packages/shared-types/src/platform-domains.json if it is real, otherwise point at a\n' +
          'registry host (deploy/domains.env).'
      );
    }
    if (foreign.length > 0) {
      console.error(
        '\nforeign hosts: point them at the registry too (deploy/domains.env). If the host is a\n' +
          `legitimate third party, declare it with a reason in ${ALLOWLIST_RELATIVE_PATH}.`
      );
    }
    process.exit(1);
  }
  console.log(
    `No hardcoded hosts in ${files.length} tracked compose/workflow/Dockerfile/env/deploy files.`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
