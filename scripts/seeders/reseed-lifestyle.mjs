#!/usr/bin/env node
/**
 * Reseed helper for the lifestyle seeder with post-seed URL verification.
 *
 * Runs the real `seedLifestyleService()` (idempotent upserts by slug), then
 * reads every seeded MusicEntry's image URL back from the database and probes
 * it — because a seeder emitting a URL the image optimizer can't fetch (the
 * cdn.azeebo.test cover-art incident) only breaks at render time, never at
 * seed time.
 *
 * What counts as a failure:
 *   - HTTP error status (404/410/5xx) on an IMAGE URL;
 *   - DNS failure / connection refused on an IMAGE URL;
 *   - Audio URLs (cdn.azeebo.test — the dev-only test TLD) are resolved only
 *     when `--strict` is passed: they are <audio> src, not image-optimizer
 *     input, and dev machines outside the test-TLD environment legitimately
 *     cannot resolve them.
 *
 * Usage:
 *   pnpm exec tsx scripts/seeders/reseed-lifestyle.mjs            # reseed + verify (audio ignored)
 *   pnpm exec tsx scripts/seeders/reseed-lifestyle.mjs --strict   # audio URLs must resolve too
 *   pnpm exec tsx scripts/seeders/reseed-lifestyle.mjs --skip-seed
 *   pnpm exec tsx scripts/seeders/reseed-lifestyle.mjs --dry-run  # seeder dry-run, then verify DB rows
 *
 * Exit codes: 0 = all image URLs resolve; 1 = seed failed or URLs broken.
 */
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const SKIP_SEED = args.includes('--skip-seed');
const DRY_RUN = args.includes('--dry-run');

/** Slim DB handle reusing the seeder's own client resolution order. */
async function getClient() {
  let PrismaClient;
  try {
    const mod = await import(
      pathToFileURL(
        path.join(repoRoot, 'services/universes/lifestyle-service/src/prisma/client/index.js')
      )
    );
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new PrismaClient();
}

/**
 * HEAD (fallback GET) probe. Placeholder CDNs (picsum) can be slow — their
 * seeded-image path 302-redirects to origin and can take >10s on a cold
 * cache — so each attempt gets 20s and TRANSIENT failures (timeout, network
 * error, 5xx, 429) are retried once. Decisive failures (404/410/403) return
 * immediately: retrying cannot fix a missing resource.
 */
async function probe(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await probeOnce(url);
    const transient = result.error !== undefined || result.status >= 500 || result.status === 429;
    if (result.ok || !transient || attempt === 2) return result;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return probeOnce(url); // unreachable
}

async function probeOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    // Some CDNs 405 on HEAD — retry once with GET.
    if (res.status === 405) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      // Consume the body so the socket is released.
      await res.arrayBuffer().catch(() => {});
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err?.cause?.code ?? err?.name ?? String(err) };
  } finally {
    clearTimeout(timer);
  }
}

/** Hosts that are <audio> media rather than image-optimizer input. */
const AUDIO_HOSTS = new Set(['cdn.azeebo.test']);

async function main() {
  if (!SKIP_SEED) {
    console.log(`— running lifestyle seeder${DRY_RUN ? ' (dry run)' : ''} …`);
    const mod = await import(
      pathToFileURL(path.join(repoRoot, 'scripts/seeders/lifestyle-seeder.ts'))
    );
    const count = await mod.seedLifestyleService(DRY_RUN);
    console.log(`  seeder touched ${count} music rows`);
  }

  const prisma = await getClient();
  try {
    const rows = await prisma.musicEntry.findMany({
      select: { slug: true, coverImage: true, trackUrl: true },
    });
    console.log(`— verifying ${rows.length} seeded rows' URLs …`);

    const failures = [];
    let checked = 0;
    for (const row of rows) {
      // Image URLs always verified; audio URLs (<audio> src, not optimizer
      // input) only under --strict, since the dev-only test TLD legitimately
      // does not resolve everywhere.
      const targets = STRICT
        ? [
            ['image', row.coverImage],
            ['audio', row.trackUrl],
          ]
        : [['image', row.coverImage]];
      for (const [kind, url] of targets) {
        if (!url) continue;
        let host;
        try {
          host = new URL(url).host;
        } catch {
          failures.push({ slug: row.slug, url, reason: 'unparseable URL' });
          continue;
        }
        if (kind === 'image' && !STRICT && AUDIO_HOSTS.has(host)) continue;
        checked++;
        const { ok, status, error } = await probe(url);
        if (!ok) {
          failures.push({
            slug: row.slug,
            url,
            reason: `${kind}: ${error ? `${error} (no HTTP response)` : `HTTP ${status}`}`,
          });
        }
      }
    }

    if (failures.length > 0) {
      console.error(`\n✗ ${failures.length} seeded image URL(s) failed to resolve:`);
      for (const f of failures) {
        console.error(`  ✗ ${f.slug}: ${f.url} — ${f.reason}`);
      }
      console.error(
        '\nFix: point the seeder at a resolvable, allowlisted host ' +
          '(scripts/seeders/seed-image-hosts.ts → seedImages builders) and re-run.'
      );
      process.exit(1);
    }

    console.log(
      `✓ all ${checked} image URL(s) resolve${STRICT ? ' (strict: audio checked too)' : ''}` +
        (checked === 0 ? ' — nothing to verify (DB empty or URLs filtered)' : '')
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('✗ reseed-lifestyle failed:', err?.message ?? err);
  process.exit(1);
});
