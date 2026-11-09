#!/usr/bin/env node
// ============================================================================
// generate-cdn-config.mjs — derive every hostname in deploy/cdn-config.json
// from the platform domain registry
// (packages/shared-types/src/platform-domains.json).
//
// The config carries hostnames in four places that used to be hand-edited:
//   1. cloudfront.origins[api-origin].domainName
//   2. cloudfront.distribution.aliases.items          (cdn + media)
//   3. cors.allowOrigins                              (root, www, admin, api)
//   4. security.headers.contentSecurityPolicy         (connect-src)
// A domain change that misses one of them splits CORS origins, the CSP and
// the CDN aliases across two hosts, which only fails at runtime.
//
// Only those host sites are rewritten, so the rest of the file stays exactly
// as reviewed. CDN_BASE_URL still wins for cdn/media when set, so a local or
// preview environment can point at a different edge.
//
// Usage:
//   node scripts/generate-cdn-config.mjs           # rewrite the file
//   node scripts/generate-cdn-config.mjs --check   # fail if it is stale
//   ... --root <dir>                               # operate on another checkout
// Exit codes: 0 = written / up to date, 1 = stale (--check) or invalid input.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONFIG_RELATIVE_PATH = 'deploy/cdn-config.json';
export const REGISTRY_RELATIVE_PATH = 'packages/shared-types/src/platform-domains.json';

const ORIGIN_RE = /("id": "api-origin",\s*"domainName": ")([^"]*)(")/;
const ALIASES_RE = /("aliases": \{\s*"quantity": )\d+(,\s*"items": )\[[^\]]*\](?=\s*\})/;
const ALLOW_ORIGINS_RE = /("allowOrigins":\s*\[)([^\]]*)(\])/;

/** Returns the registry's staging hostnames. Throws on an incomplete registry. */
export function stagingHosts(registry) {
  const base = registry?.baseDomain;
  if (typeof base !== 'string' || !base) {
    throw new Error(`registry is missing baseDomain (${REGISTRY_RELATIVE_PATH})`);
  }
  const subs = registry.subdomains ?? {};
  const staging = registry.stagingSubdomains ?? {};
  if (!subs.stagingRoot) throw new Error('registry is missing subdomains.stagingRoot');
  if (!subs.stagingApi) throw new Error('registry is missing subdomains.stagingApi');

  const root = `${subs.stagingRoot}.${base}`;
  const sub = (key) => {
    const label = staging[key];
    if (!label) throw new Error(`registry is missing stagingSubdomains.${key}`);
    return `${label}.${root}`;
  };

  return {
    root,
    api: `${subs.stagingApi}.${base}`,
    app: sub('app'),
    www: sub('www'),
    admin: sub('admin'),
    creator: sub('creator'),
    cdn: sub('cdn'),
    media: sub('media'),
    stream: sub('stream'),
  };
}

/** Returns the CDN hostname from CDN_BASE_URL, or null when it is not set. */
export function cdnHostFromBaseUrl(cdnBaseUrl) {
  if (!cdnBaseUrl) return null;
  let url;
  try {
    url = new URL(cdnBaseUrl);
  } catch {
    throw new Error(`CDN_BASE_URL is not a valid URL: ${cdnBaseUrl}`);
  }
  if (url.protocol !== 'https:') throw new Error(`CDN_BASE_URL must use https: ${cdnBaseUrl}`);
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`CDN_BASE_URL must be an origin with no path, query or hash: ${cdnBaseUrl}`);
  }
  return url.hostname;
}

/**
 * Returns the config text with every registry-owned hostname replaced.
 * Idempotent: re-running on its own output is a no-op.
 */
export function applyHosts(configText, hosts) {
  for (const [name, re] of [
    ['api origin', ORIGIN_RE],
    ['aliases', ALIASES_RE],
    ['cors.allowOrigins', ALLOW_ORIGINS_RE],
  ]) {
    if (!re.test(configText)) {
      throw new Error(`${name} block not found in ${CONFIG_RELATIVE_PATH}`);
    }
  }
  JSON.parse(configText); // refuse to write into a file that is not valid JSON

  const previousApi = configText.match(ORIGIN_RE)[2];

  // 1. connect-src in the CSP still names the old API host by scheme.
  let next = configText
    .split(`https://${previousApi}`)
    .join(`https://${hosts.api}`)
    .split(`wss://${previousApi}`)
    .join(`wss://${hosts.api}`);

  // 2. The API origin.
  next = next.replace(ORIGIN_RE, (_m, head, _old, tail) => `${head}${hosts.api}${tail}`);

  // 3. CloudFront aliases — the CDN and its media twin.
  next = next.replace(ALIASES_RE, (_m, head, mid) => {
    const items = [hosts.cdn, hosts.media];
    return `${head}${items.length}${mid}[${items.map((h) => `"${h}"`).join(', ')}]`;
  });

  // 4. CORS allowlist, one origin per line to match the file's own layout.
  next = next.replace(ALLOW_ORIGINS_RE, (_m, open, _body, close) => {
    const origins = [hosts.root, hosts.www, hosts.admin, hosts.api].map((h) => `https://${h}`);
    const lines = origins.map((o) => `      "${o}"`).join(',\n');
    return `${open}\n${lines}\n    ${close}`;
  });

  JSON.parse(next); // never emit invalid JSON
  return next;
}

/** Reads the registry and returns the hosts the config should carry. */
export function resolveHosts(root, registry, env = process.env) {
  const hosts = stagingHosts(registry);
  const override = cdnHostFromBaseUrl(env.CDN_BASE_URL);
  if (override) {
    hosts.cdn = override;
    const mediaSuffix = override.replace(/^cdn\./, '');
    if (mediaSuffix !== override) hosts.media = `media.${mediaSuffix}`;
  }
  return hosts;
}

function main() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root =
    rootIdx >= 0
      ? path.resolve(args[rootIdx + 1])
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const checkOnly = args.includes('--check');
  const target = path.join(root, CONFIG_RELATIVE_PATH);
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRY_RELATIVE_PATH), 'utf8'));
    const hosts = resolveHosts(root, registry);
    const current = fs.readFileSync(target, 'utf8');
    const next = applyHosts(current, hosts);

    if (checkOnly) {
      if (current !== next) {
        console.error(
          `✗ ${CONFIG_RELATIVE_PATH} hostnames are stale. Run: node scripts/generate-cdn-config.mjs`
        );
        process.exit(1);
      }
      console.log(`${CONFIG_RELATIVE_PATH} hostnames match the registry.`);
      return;
    }

    if (current === next) {
      console.log(`${CONFIG_RELATIVE_PATH} already matches the registry.`);
      return;
    }
    fs.writeFileSync(target, next);
    console.log(`Wrote registry hostnames (api ${hosts.api}) to ${CONFIG_RELATIVE_PATH}`);
  } catch (err) {
    console.error(`✗ generate-cdn-config: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
