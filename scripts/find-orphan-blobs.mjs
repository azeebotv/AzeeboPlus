#!/usr/bin/env node
// ============================================================================
// find-orphan-blobs.mjs — blob objects with no matching DB row
//
// Uploads that die between "object written to blob storage" and "row
// committed" (crash, OOM, failed scan callback) leave unreferenced objects
// in the bucket that nothing will ever clean up. This script lists every
// object in the bucket and checks it against every place the platform
// records a reference:
//
//   Sources checked (all defensive — an unreachable source is reported and
//   skipped, it never silently turns a referenced object into an "orphan"):
//     1. Creator portal DB(s)  — content_items.metadata->'media'->>'key',
//        content_items."mediaUrl"     (PORTAL_DATABASE_URLS, comma-separated)
//     2. Media-service DB      — media_uploads.key / "cdnUrl" / "fileName" /
//        "originalName"               (MEDIA_DATABASE_URL)
//
//   Matching is by the object's UUID stem (videos/<uuid>.mp4 → <uuid>)
//   against every reference string collected from those columns, so a
//   match counts whether the row stored the bare key, a signed CDN URL,
//   or the public object URL. Keys without a UUID fall back to a plain
//   substring match on the full key.
//
// Exit codes: 0 = no orphans found
//             1 = orphans found (list only — nothing is deleted without --delete)
//             2 = operational error (no bucket credentials, no reachable DB)
//
// Usage:
//   node scripts/find-orphan-blobs.mjs
//   node scripts/find-orphan-blobs.mjs --delete          # actually delete orphans
//   node scripts/find-orphan-blobs.mjs --bucket other    # override bucket
//
// Options / env:
//   AWS_S3_BUCKET        bucket to scan (default azeebo-media)
//   S3_ENDPOINT          S3-compatible endpoint (default http://127.0.0.1:9000)
//   AWS_REGION           (default us-east-1)
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
//   PORTAL_DATABASE_URLS comma-separated creator-portal Postgres URLs
//   MEDIA_DATABASE_URL   media-service Postgres URL
//
//   When creds/URLs are not exported, the script falls back to reading
//   services/core/media-service/.env (plaintext keys only — encrypted
//   dotenvx values are skipped) and, on macOS, the com.azeebo.media
//   launchd plist EnvironmentVariables, mirroring how the services
//   themselves are configured on dev machines.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const doDelete = args.includes('--delete');
const bucketArgIdx = args.indexOf('--bucket');
const BUCKET = bucketArgIdx >= 0 ? args[bucketArgIdx + 1] : process.env.AWS_S3_BUCKET || 'azeebo-media';
const ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
const REGION = process.env.AWS_REGION || 'us-east-1';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── env resolution: process.env → media-service .env → launchd plist ────────

function readPlaintextEnv(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      // dotenvx-encrypted values start with 'encrypted:' — useless to us
      if (m && !m[2].startsWith('encrypted:')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* missing file is fine */
  }
  return out;
}

function readLaunchdPlist(label) {
  if (process.platform !== 'darwin') return {};
  try {
    const out = execFileSync('plutil', ['-p', `${process.env.HOME}/Library/LaunchAgents/${label}.plist`], {
      encoding: 'utf8',
    });
    const env = {};
    for (const m of out.matchAll(/"([A-Z0-9_]+)"\s+=>\s+"([^"]*)"/g)) env[m[1]] = m[2];
    return env;
  } catch {
    return {};
  }
}

const fileEnv = readPlaintextEnv(path.join(ROOT, 'services/core/media-service/.env'));
const portalEnv = readPlaintextEnv(path.join(ROOT, 'apps/creator/.env'));
const plistEnv = readLaunchdPlist('com.azeebo.media');

// The media-service .env is dotenvx-encrypted in dev: its plaintext-looking
// AWS_* values can be stale placeholders, while the launchd plist holds the
// credentials the running service actually uses. Precedence:
// explicit env → plist → .env.
const envOf = (key) => process.env[key] ?? plistEnv[key] ?? fileEnv[key];

const ACCESS_KEY = envOf('AWS_ACCESS_KEY_ID');
const SECRET_KEY = envOf('AWS_SECRET_ACCESS_KEY');
if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('No S3 credentials: export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or keep the media-service .env / launchd plist fallbacks).');
  process.exit(2);
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── collect reference strings from the DBs ──────────────────────────────────

/** @type {{ name: string, refs: Set<string> }[]} */
const sources = [];
/** @type {string[]} */
const skippedSources = [];

async function collectPortalRefs(url, idx) {
  const client = new Client({ connectionString: url });
  const name = `creator-portal #${idx + 1}`;
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT COALESCE(metadata->'media'->>'key', '') AS key, COALESCE("mediaUrl", '') AS url FROM content_items`
    );
    const refs = new Set();
    for (const r of rows) {
      if (r.key) refs.add(r.key);
      if (r.url) refs.add(r.url);
    }
    sources.push({ name, refs });
  } catch (err) {
    skippedSources.push(`${name}: ${err.message.split('\n')[0]}`);
  } finally {
    await client.end().catch(() => {});
  }
}

async function collectMediaRefs(url) {
  const client = new Client({ connectionString: url });
  const name = 'media-service';
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT COALESCE(key, '') AS key, COALESCE("cdnUrl", '') AS cdn,
              COALESCE("fileName", '') AS file, COALESCE("originalName", '') AS orig
       FROM media_uploads`
    );
    const refs = new Set();
    for (const r of rows) {
      for (const v of [r.key, r.cdn, r.file, r.orig]) if (v) refs.add(v);
    }
    sources.push({ name, refs });
  } catch (err) {
    skippedSources.push(`${name}: ${err.message.split('\n')[0]}`);
  } finally {
    await client.end().catch(() => {});
  }
}

const portalUrls = (process.env.PORTAL_DATABASE_URLS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (portalUrls.length === 0 && /^postgres(ql)?:\/\//.test(portalEnv.DATABASE_URL || '')) {
  // default: the creator portal's own .env
  portalUrls.push(portalEnv.DATABASE_URL);
}

for (const [i, url] of portalUrls.entries()) await collectPortalRefs(url, i);
if (process.env.MEDIA_DATABASE_URL || fileEnv.DATABASE_URL) {
  const candidate = process.env.MEDIA_DATABASE_URL || fileEnv.DATABASE_URL;
  if (/^postgres(ql)?:\/\//.test(candidate)) await collectMediaRefs(candidate);
}

if (sources.length === 0) {
  console.error('No reference source reachable — refusing to report orphans (every object would look unreferenced).');
  for (const s of skippedSources) console.error(`  skipped: ${s}`);
  process.exit(2);
}

// ── scan the bucket ──────────────────────────────────────────────────────────

async function listAllObjects() {
  const objects = [];
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token }));
    objects.push(...(page.Contents ?? []));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects;
}

function isReferenced(key, refs) {
  const base = path.posix.basename(key);
  const stem = base.replace(/\.[^.]+$/, '');
  const needle = UUID_RE.test(stem) ? stem : key;
  for (const ref of refs) if (ref.includes(needle)) return true;
  return false;
}

let objects;
try {
  objects = await listAllObjects();
} catch (err) {
  console.error(`Failed to list bucket "${BUCKET}" at ${ENDPOINT}: ${err.message}`);
  process.exit(2);
}

const orphans = objects.filter((o) => o.Key && !isReferenced(o.Key, new Set([...sources.flatMap((s) => [...s.refs])])));
const orphansBySize = orphans.reduce((a, o) => a + Number(o.Size ?? 0), 0);

// ── report ──────────────────────────────────────────────────────────────────

console.log(`Bucket: ${BUCKET} (${ENDPOINT})`);
for (const s of sources) console.log(`  references from ${s.name}: ${s.refs.size}`);
for (const s of skippedSources) console.log(`  ⚠ skipped ${s} — orphans may be false positives`);

if (objects.length === 0) {
  console.log('Bucket is empty.');
} else if (orphans.length === 0) {
  console.log(`${objects.length} object(s), all referenced. No orphans.`);
} else {
  console.log(`\n${orphans.length} orphan(s) of ${objects.length} object(s), ${orphansBySize} bytes unreferenced:`);
  for (const o of orphans) console.log(`  ${o.Key}  (${o.Size} B, modified ${o.LastModified?.toISOString?.() ?? o.LastModified})`);
}

if (orphans.length > 0 && doDelete) {
  console.log('\nDeleting orphans…');
  for (const o of orphans) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: o.Key }));
      console.log(`  deleted ${o.Key}`);
    } catch (err) {
      console.error(`  FAILED ${o.Key}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

process.exit(process.exitCode ?? (orphans.length > 0 ? 1 : 0));
