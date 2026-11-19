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
//   4. a bare hostname token             - api.example.com   (YAML list item)
//                                        hosts: api.example.com
//
// (4) is the shape a URL/key/header match misses: an nginx server_name, an
// Istio VirtualService host, a bare value in a list. It is gated hard so that
// ordinary dotted identifiers are not mistaken for hosts: the last label must
// be a known TLD (github.sha and steps.meta.outputs.tags are not), the token
// must not sit inside a ${{ }} expression, on a comment line, or inside a
// path/ref/port/filename. Comment lines are excluded only for shape (4): an
// explicit URL in prose is a deliberate statement, a bare word that merely
// looks like a host in prose is not. Shapes (1)-(3) still apply in comments.
//
// Ignored without needing an allowlist entry: single-label service DNS
// (api-gateway, redis), loopback, and the RFC-reserved/internal suffixes
// (.internal, .local, .localhost, .test, .invalid, example.com et al).
// Legitimate third-party hosts are declared, with a reason, in
// scripts/domain-literal-allowlist.json. An entry is an exception, not a
// parking space: the gate also fails when a declared host is no longer
// mentioned by any tracked file, because an exception nothing needs is drift
// too — it outlives the reference it was written for and keeps the next
// hardcoded copy of that host from being noticed. Evidence is deliberately
// loose (case-insensitive substring across every tracked file, so a mention in
// a test or a runbook counts, and `smtp.<host>` covers `<host>`); the
// allowlist file does not count as evidence for itself.
//
// Usage: node scripts/check-domain-literals.mjs [--root <dir>]
// Exit codes: 0 = clean, 1 = hardcoded hosts or stale allowlist entries found,
//             2 = could not run.
// CI wiring: .github/workflows/pr-checks.yml
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY_RELATIVE_PATH } from './generate-domain-env.mjs';
import { lineKey, managedKeysFor } from './sync-env-example-hosts.mjs';
import { findDeadEntries, listTrackedPaths } from './lib/dead-entries.mjs';

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
 * A bare dotted token. The trailing `[a-z]{2,24}` is only a shape gate; the real
 * gate is KNOWN_TLDS, because `github.sha` and `steps.meta.outputs.tags` have
 * exactly this shape and are identifiers, not hosts.
 */
const BARE_HOST_RE =
  /(?<![\w./@$%-])((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24})(?![\w-])/gi;

/**
 * TLDs this platform's infrastructure and its third parties actually use. A
 * curated list, not the public suffix list: an unknown TLD is far more likely
 * to be an identifier fragment (`report.host`, `router.push`) than a host, and
 * adding a TLD is a one-line change when a real one appears.
 */
export const KNOWN_TLDS = new Set(
  (
    'com ng org net io dev app ai co tv cloud site online info biz me uk us ca de fr ke za gd ' +
    'tools run page link live world store media news tech pro xyz ltd africa agency ' +
    'blog club design email global group life money network one plus space studio systems ' +
    'today top website zone'
  ).split(' ')
);

/** Filenames are not hosts: `deploy/domains.env`, `nginx.conf`, `release.json`. */
const FILE_SUFFIX_RE =
  /\.(?:yml|yaml|json|conf|env|js|mjs|cjs|ts|tsx|sh|md|txt|lock|log|pem|key|crt|css|html|xml|toml|ini|service|plist|sock|pid)$/i;

/** True when `index` in `line` sits inside a `${{ ... }}` GitHub expression. */
function inGitHubExpression(line, index) {
  const before = line.slice(0, index);
  const open = before.lastIndexOf('${{');
  if (open === -1) return false;
  return before.indexOf('}}', open) === -1;
}

/** Prose lines: their hostnames are documentation, not configuration. */
export function isCommentLine(line) {
  return /^\s*(#|\/\/)/.test(line);
}

/**
 * Extracts bare hostname tokens from one line (shape 4 in the header).
 * Deliberately conservative: a false negative here is cheaper than wallpapering
 * the repo with allowlist entries for `github.sha`.
 */
export function extractBareHosts(line) {
  if (isCommentLine(line)) return [];
  const hosts = [];
  for (const match of line.matchAll(BARE_HOST_RE)) {
    const token = match[1].toLowerCase().replace(/\.$/, '');
    const tld = token.slice(token.lastIndexOf('.') + 1);
    if (!KNOWN_TLDS.has(tld)) continue;
    if (FILE_SUFFIX_RE.test(token)) continue;
    if (inGitHubExpression(line, match.index)) continue;
    const before = line.slice(0, match.index);
    const after = line.slice(match.index + match[1].length);
    // Part of a URL/ref/path (`https://api.example.com/x`, `istio.io/v1beta1`).
    // A trailing `:port` is still a host, so `:` is not excluded here.
    if (/[$@/\\_-]$/.test(before) || after.startsWith('/')) continue;
    hosts.push(token);
  }
  return hosts;
}

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
  const add = (host) => {
    if (seen.has(host)) return;
    seen.add(host);
    hosts.push(host);
  };
  for (const re of [URL_RE, HOST_KEY_RE, HOST_HEADER_RE]) {
    re.lastIndex = 0;
    for (const match of line.matchAll(re)) {
      add(match[1].toLowerCase().replace(/\.$/, ''));
    }
  }
  for (const host of extractBareHosts(line)) add(host);
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

/**
 * Every tracked file — the evidence set for "is this allowlist entry still
 * describing something real?". Wider than the scan surface on purpose: a host
 * named only in a test, a runbook or a service is still in use, and pruning it
 * would be wrong.
 */
export const listRepositoryFiles = listTrackedPaths;

/**
 * Allowlist hosts that no tracked file mentions.
 *
 * Matching is a case-insensitive substring test, not `extractHosts`: the
 * question here is "does the repo still talk about this host at all?", and a
 * reference that the host detector would not classify (prose in a comment, a
 * URL fragment in a test) is still a reason to keep the entry. A subdomain
 * counts for its allowlisted parent (`smtp.gmail.com` → `gmail.com`), which is
 * how the allowlist itself is applied. The allowlist file is excluded from the
 * evidence — otherwise every entry would reference itself.
 *
 * One regex pass over the whole repo, not one pass per host: the repo is ~30 MB
 * of tracked files, and a per-host `includes` would multiply that by the
 * number of entries. A matched token also credits every allowlisted host it
 * contains, so nesting (`s3.amazonaws.com`) keeps plain substring semantics.
 */
export function findStaleAllowlistEntries(root, files, allowlist, options = {}) {
  const ignore = new Set(options.ignore ?? [ALLOWLIST_RELATIVE_PATH]);
  const hosts = [...allowlist].map((host) => host.toLowerCase());
  const referenced = new Set();
  if (hosts.length === 0) return [];
  const pattern = new RegExp(
    hosts
      .slice()
      .sort((a, b) => b.length - a.length)
      .map((host) => host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|'),
    'gi'
  );

  for (const file of files) {
    if (ignore.has(file)) continue;
    let text;
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const token = match[0].toLowerCase();
      for (const host of hosts) {
        if (token.includes(host)) referenced.add(host);
      }
      if (referenced.size === hosts.length) break;
    }
    if (referenced.size === hosts.length) break;
  }
  // Shared semantics with the other suppression gates: an entry nothing points
  // at is dead. (See scripts/lib/dead-entries.mjs.)
  return findDeadEntries(hosts, (host) => referenced.has(host)).sort();
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
  let stale;
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRY_RELATIVE_PATH), 'utf8'));
    hosts = registryHosts(registry);
    baseDomain = registry.baseDomain;
    allowlist = loadAllowlist(root);
    files = listTrackedFiles(root);
    stale = findStaleAllowlistEntries(root, listRepositoryFiles(root), allowlist);
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
  if (stale.length > 0) {
    console.error(
      `✗ stale allowlist entries (${stale.length}): no tracked file mentions these hosts, so the\n` +
        'exception protects nothing and would hide the next hardcoded use of it:'
    );
    for (const host of stale) console.error(`  ${host}`);
    console.error(
      `\nremove them from ${ALLOWLIST_RELATIVE_PATH}, or add the entry back with the file that\n` +
        'needs it. Evidence is any tracked file, so a host used only by a test or a runbook\n' +
        'still counts.'
    );
    process.exit(1);
  }
  console.log(
    `No hardcoded hosts in ${files.length} tracked compose/workflow/Dockerfile/env/deploy files.`
  );
  console.log(`All ${allowlist.size} allowlisted hosts are still referenced by a tracked file.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
