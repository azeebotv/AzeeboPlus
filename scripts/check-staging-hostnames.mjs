#!/usr/bin/env node
// ============================================================================
// check-staging-hostnames.mjs — staging host domain gate
//
// Every staging hostname in tracked deploy/ and .github/workflows/ files must
// sit under the canonical platform domain (azeeboplus.com). A staging host on
// any other domain (for example staging.azeebo.ng) splits CORS origins, OAuth
// redirect URIs and CDN config across two domains.
//
// Only public-style hostnames are matched (staging.<label>.<tld>). Internal
// service DNS such as analytics-service.staging.internal is not affected.
//
// Usage: node scripts/check-staging-hostnames.mjs
// Exit codes: 0 = green, 1 = foreign staging hostnames found, 2 = could not run.
// CI wiring: .github/workflows/pr-checks.yml
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_DOMAIN = 'azeeboplus.com';
export const SCAN_PATHS = ['deploy', '.github/workflows'];

// Third-party hosts that happen to contain a "staging" label (S3 buckets,
// Firebase projects). They are not staging hostnames under our control.
export const THIRD_PARTY_SUFFIXES = ['.amazonaws.com', '.firebaseapp.com', '.sentry.io'];

// Matches the full dotted host that contains a "staging" label, e.g.
// staging.azeebo.ng, api.staging.azeeboplus.com, bucket-staging.s3.amazonaws.com
const STAGING_HOST_RE = /\b(?:[a-z0-9-]+\.)*staging(?:\.[a-z0-9-]+)+\b/gi;

// Internal service DNS (e.g. analytics-service.staging.internal) is not public.
export const INTERNAL_SUFFIXES = ['.internal'];

export function isCanonicalHost(host) {
  const h = host.toLowerCase();
  return h === CANONICAL_DOMAIN || h.endsWith(`.${CANONICAL_DOMAIN}`);
}

export function isThirdPartyHost(host) {
  const h = host.toLowerCase();
  return [...THIRD_PARTY_SUFFIXES, ...INTERNAL_SUFFIXES].some((suffix) => h.endsWith(suffix));
}

/** Returns [{ file, line, host }] for every foreign staging hostname. */
export function findForeignStagingHosts(root, files) {
  const violations = [];
  for (const file of files) {
    const abs = path.join(root, file);
    const lines = fs.readFileSync(abs, 'utf8').split('\n');
    lines.forEach((text, i) => {
      for (const match of text.matchAll(STAGING_HOST_RE)) {
        // A real hostname has at least three labels; two-label matches such as
        // `staging.env` are filenames.
        if (match[0].split('.').length < 3) continue;
        if (!isCanonicalHost(match[0]) && !isThirdPartyHost(match[0])) {
          violations.push({ file, line: i + 1, host: match[0] });
        }
      }
    });
  }
  return violations;
}

/** Tracked files under SCAN_PATHS (git ls-files, so local-only files are skipped). */
export function listTrackedFiles(root) {
  const out = execFileSync('git', ['ls-files', '--', ...SCAN_PATHS], {
    cwd: root,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  let files;
  try {
    files = listTrackedFiles(root);
  } catch (err) {
    console.error(`✗ could not list tracked files: ${err.message}`);
    process.exit(2);
  }

  const violations = findForeignStagingHosts(root, files);
  if (violations.length > 0) {
    console.error(`✗ staging hostnames outside ${CANONICAL_DOMAIN} (${violations.length}):`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  ${v.host}`);
    }
    console.error(`fix: use a staging.${CANONICAL_DOMAIN} host (see deploy/staging.env.example).`);
    process.exit(1);
  }
  console.log(`Staging hostnames OK (all under ${CANONICAL_DOMAIN}).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
