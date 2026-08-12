import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'node:child_process';
import Redis from 'ioredis';
import { SearchService } from './search.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService, searchFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../metrics/metrics.service.js';

/**
 * Dockerized pg_trgm fuzzy-search e2e: REAL Postgres (search schema + pg_trgm
 * extension + GIN indexes via `prisma migrate deploy`) and REAL Redis (the
 * search_typo_tolerance flag through FeatureFlagService) — no in-process fakes.
 *
 * Scenario: seed content items, creator profiles, and universes, enable
 * search_typo_tolerance in real Redis, and prove the trigram path serves
 * scored results on ALL THREE surfaces for typo'd queries ('avngers' →
 * Avengers content, 'chris evns' → Chris Evans creator, 'marvl' → Marvel
 * universe, each with fuzzyScore/trigramScore and exact SQL totals), then
 * that disabling the flag falls back to the exact path (which cannot surface
 * the typos on any surface).
 *
 * Infra (see docker-compose.test.yml at the repo root):
 *   docker compose -f docker-compose.test.yml up -d --wait redis-test postgres-test
 *   pnpm --filter @azeebo/search-service test:e2e:pgtrgm
 *   (or one shot: `pnpm test:e2e:pgtrgm` — boots the stack, runs, tears down)
 *
 * Opt-in: skipped unless RUN_SEARCH_PGTRGM_E2E=1 or SEARCH_TEST_DATABASE_URL
 * is set, so the default `pnpm test` run never depends on docker. The schema
 * is applied schema-first (`prisma db push`, idempotent) and the pg_trgm
 * extension + six GIN trigram indexes are applied as idempotent raw SQL
 * (mirroring 20260810000001_pg_trgm_fuzzy_search, which migrate deploy can't
 * run on a fresh DB — its ALTER targets content_items, which only exists
 * after db push creates the schema) before the module boots; the spec's data
 * lives under the `search_e2e:` Redis prefix and is cleaned up in afterAll.
 */

const RUN = process.env.RUN_SEARCH_PGTRGM_E2E === '1' || !!process.env.SEARCH_TEST_DATABASE_URL;
const DB_URL =
  process.env.SEARCH_TEST_DATABASE_URL ??
  'postgresql://azeebo_test:azeebo_test@localhost:5433/azeebo_search_test?schema=public';
const REDIS_URL = process.env.REDIS_TEST_URL ?? 'redis://localhost:6380';
const PREFIX = 'search_e2e:';

const SEED_IDS = ['e2e-av1', 'e2e-av2', 'e2e-av3', 'e2e-dark'];
const CREATOR_SEED_IDS = ['e2e-cr1', 'e2e-cr2'];
const UNIVERSE_SEED_IDS = ['e2e-mcu', 'e2e-dc'];

jest.setTimeout(120_000);

if (!RUN) {
  console.log(
    `[search.pgtrgm.e2e] Skipping — opt-in. Boot docker infra with \`docker compose ` +
      `-f docker-compose.test.yml up -d --wait redis-test postgres-test\` then run \`pnpm ` +
      `--filter @azeebo/search-service test:e2e:pgtrgm\` (or one shot: \`pnpm test:e2e:pgtrgm\`).`
  );
}

const liveDescribe = RUN ? describe : describe.skip;

liveDescribe('search pg_trgm fuzzy search (real Postgres + real Redis)', () => {
  let service: SearchService;
  let prisma: PrismaService;
  let flagRedis: Redis;
  let flagService: FeatureFlagService;

  beforeAll(async () => {
    // PrismaClient reads env("DATABASE_URL") at construction; the migrate
    // deploy uses the same URL. Point analytics at a dead port so any
    // fire-and-forget tracking never reaches a real service.
    process.env.DATABASE_URL = DB_URL;
    process.env.ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://127.0.0.1:1';

    // Schema-first: db push creates the full search schema (all models are in
    // schema.prisma — content_items incl. thumbnail/duration/categories/
    // creatorName, suggestions, ranking_rules, search_typo_corrections) —
    // idempotent. --accept-data-loss is safe here (owned test DB, nothing to
    // lose) and makes re-runs against an existing test DB deterministic.
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'pipe',
    });

    flagRedis = new Redis(REDIS_URL, { retryStrategy: () => null });
    flagService = new FeatureFlagService({
      redis: flagRedis,
      prefix: PREFIX,
      cacheTtlMs: 0, // always read Redis: the tests toggle the flag live
      listCacheTtlMs: 0,
      defaultFlags: {},
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        // In-memory cache stand-in: never hits, never stores — the real
        // caching behavior is not under test here.
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), delete: jest.fn() } },
        { provide: FeatureFlagService, useValue: flagService },
        { provide: MetricsService, useValue: { setFuzzyStatus: jest.fn() } },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    service = module.get(SearchService);

    // pg_trgm extension + the six GIN trigram indexes, idempotent (same DDL
    // as 20260810000001_pg_trgm_fuzzy_search). These are what make the fuzzy
    // path index-backed instead of an in-process pool.
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS content_items_title_trgm_idx ON content_items USING gin (title gin_trgm_ops)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS content_items_description_trgm_idx ON content_items USING gin (description gin_trgm_ops)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS creator_profiles_displayName_trgm_idx ON creator_profiles USING gin ("displayName" gin_trgm_ops)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS creator_profiles_bio_trgm_idx ON creator_profiles USING gin (bio gin_trgm_ops)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS universes_name_trgm_idx ON universes USING gin (name gin_trgm_ops)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS universes_displayName_trgm_idx ON universes USING gin ("displayName" gin_trgm_ops)',
    );

    // Seed creator profiles + universes so the fuzzy creators/universes
    // surfaces have real trigram candidates too (typos 'chris evns' and
    // 'marvl'). Universe ids match the seeded content's universeId for a
    // coherent fixture; there is no FK from content_items, so they are
    // independent rows.
    await prisma.creatorProfile.createMany({
      data: [
        {
          id: 'e2e-cr1',
          userId: 'e2e-user-cr1',
          displayName: 'Chris Evans',
          bio: 'Captain America actor',
          email: 'chris@example.com',
        },
        {
          id: 'e2e-cr2',
          userId: 'e2e-user-cr2',
          displayName: 'Robert Downey Jr',
          bio: 'Tony Stark',
          email: 'rdj@example.com',
        },
      ],
    });
    await prisma.universe.createMany({
      data: [
        {
          id: 'e2e-mcu',
          name: 'marvel',
          displayName: 'Marvel Cinematic Universe',
        },
        {
          id: 'e2e-dc',
          name: 'dc',
          displayName: 'DC Universe',
        },
      ],
    });

    // Seed content so the typo 'avngers' has real trigram candidates.
    await prisma.contentItem.createMany({
      data: [
        {
          id: 'e2e-av1',
          title: 'Avengers: Endgame',
          description: 'The Avengers assemble for a final battle against Thanos',
          universeId: 'e2e-mcu',
          universe: 'Marvel',
          contentType: 'movie',
          status: 'published',
          categories: ['action'],
        },
        {
          id: 'e2e-av2',
          title: 'Avengers: Infinity War',
          description: 'Thanos collects the infinity stones across the galaxy',
          universeId: 'e2e-mcu',
          universe: 'Marvel',
          contentType: 'movie',
          status: 'published',
          categories: ['action'],
        },
        {
          id: 'e2e-av3',
          title: 'Avengers Assemble',
          description: 'The animated series about the Earth mightiest heroes',
          universeId: 'e2e-mcu',
          universe: 'Marvel',
          contentType: 'series',
          status: 'published',
          categories: ['animation'],
        },
        {
          id: 'e2e-dark',
          title: 'The Dark Knight',
          description: 'Batman faces the Joker in Gotham',
          universeId: 'e2e-dc',
          universe: 'DC',
          contentType: 'movie',
          status: 'published',
          categories: ['action'],
        },
      ],
    });

    // Enable fuzzy search in real Redis and warm the pg_trgm probe.
    await flagService.setFlag({ key: searchFlags.typoTolerance, enabled: true });
    await service.refreshFuzzyProbe();
  });

  it('sees pg_trgm available with the migration indexes present', async () => {
    const status = await service.getFuzzyStatus();
    expect(status.enabled).toBe(true);
    expect(status.pgTrgm).toBe('available');
    expect(status.indexes).toBe('present');
    expect(status.degraded).toBe(false);
  });

  it('serves the trigram path for a typo: scored Avengers results, no exact fallback', async () => {
    const res = await service.search('avngers');
    const content = res.data?.results?.content ?? [];

    // 'avngers' contains-matches nothing, so ANY result proves the fuzzy path
    // ran (and that pg_trgm is genuinely backing it).
    expect(content.length).toBeGreaterThan(0);
    const titles = content.map((r) => r.title);
    expect(titles.some((t) => t.includes('Avengers'))).toBe(true);

    // Every fuzzy result carries the explainable score components.
    for (const item of content) {
      expect(typeof item.score).toBe('number');
      expect(typeof item.fuzzyScore).toBe('number');
      expect(typeof item.trigramScore).toBe('number');
      expect(item.score!).toBeGreaterThanOrEqual(0);
      expect(item.score!).toBeLessThanOrEqual(1);
      expect(item.fuzzyScore!).toBeGreaterThan(0);
      expect(item.trigramScore!).toBeGreaterThan(0);
    }
  });

  it('serves fuzzy creator matches with explainable scores and exact totals', async () => {
    const res = await service.search('chris evns');
    const creators = res.data?.results?.creators ?? [];

    // 'chris evns' is a typo of 'Chris Evans' — only the trigram path can
    // surface it, and it must come from creator_profiles, not content.
    expect(creators.length).toBeGreaterThan(0);
    expect(creators.some((c) => c.user.username === 'Chris Evans')).toBe(true);
    expect(res.data?.results?.content ?? []).toHaveLength(0);

    // Every fuzzy creator carries the explainable score components.
    for (const creator of creators) {
      expect(typeof creator.score).toBe('number');
      expect(typeof creator.fuzzyScore).toBe('number');
      expect(typeof creator.trigramScore).toBe('number');
      expect(creator.score!).toBeGreaterThanOrEqual(0);
      expect(creator.score!).toBeLessThanOrEqual(1);
      expect(creator.fuzzyScore!).toBeGreaterThan(0);
      expect(creator.trigramScore!).toBeGreaterThan(0);
    }

    // Exact SQL count over the SAME trigram predicate: 'Robert Downey Jr'
    // shares no trigrams with 'chris evns', so the total is exactly 1.
    expect(res.data?.creatorsPagination?.total).toBe(1);
  });

  it('serves fuzzy universe matches with explainable scores and exact totals', async () => {
    const res = await service.search('marvl');
    const universes = res.data?.results?.universes ?? [];

    // 'marvl' is a typo of 'marvel' — only the trigram path can surface it,
    // and it must come from universes, not content or creators.
    expect(universes.length).toBeGreaterThan(0);
    expect(universes.some((u) => u.displayName === 'Marvel Cinematic Universe')).toBe(true);
    expect(res.data?.results?.content ?? []).toHaveLength(0);
    expect(res.data?.results?.creators ?? []).toHaveLength(0);

    for (const uni of universes) {
      expect(typeof uni.score).toBe('number');
      expect(typeof uni.fuzzyScore).toBe('number');
      expect(typeof uni.trigramScore).toBe('number');
      expect(uni.score!).toBeGreaterThanOrEqual(0);
      expect(uni.score!).toBeLessThanOrEqual(1);
      expect(uni.fuzzyScore!).toBeGreaterThan(0);
      expect(uni.trigramScore!).toBeGreaterThan(0);
    }

    // Exact SQL count over the same trigram predicate: only 'marvel' matches.
    expect(res.data?.universesPagination?.total).toBe(1);
  });

  it('falls back to the exact path when the flag is disabled (typo returns nothing)', async () => {
    await flagService.setFlag({ key: searchFlags.typoTolerance, enabled: false });
    await service.refreshFuzzyProbe();

    const status = await service.getFuzzyStatus();
    expect(status.enabled).toBe(false);

    const res = await service.search('avngers');
    expect(res.data?.results?.content ?? []).toHaveLength(0);
  });

  it('exact search still matches real substrings with the flag off', async () => {
    const res = await service.search('dark');
    const titles = (res.data?.results?.content ?? []).map((r) => r.title);
    expect(titles).toContain('The Dark Knight');
  });

  it('fuzzy creators/universes surfaces are empty with the flag off (exact path only)', async () => {
    // 'chris evns' is not a substring of any seeded name, so the exact path
    // cannot surface it on any surface — proving the flag-off fallback serves
    // creators/universes from the exact (contains) path, not the trigram one.
    const res = await service.search('chris evns');
    expect(res.data?.results?.creators ?? []).toHaveLength(0);
    expect(res.data?.results?.universes ?? []).toHaveLength(0);
    expect(res.data?.results?.content ?? []).toHaveLength(0);
  });

  afterAll(async () => {
    await prisma.contentItem.deleteMany({ where: { id: { in: SEED_IDS } } });
    await prisma.creatorProfile.deleteMany({ where: { id: { in: CREATOR_SEED_IDS } } });
    await prisma.universe.deleteMany({ where: { id: { in: UNIVERSE_SEED_IDS } } });

    // Remove the e2e flag keys from Redis (scan + del under the prefix).
    let cursor = '0';
    do {
      const [next, keys] = await flagRedis.scan(cursor, 'MATCH', `${PREFIX}*`, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await flagRedis.del(...keys);
    } while (cursor !== '0');

    await prisma.$disconnect();
    // Await the redis close so jest exits cleanly (no lingering sockets).
    await flagRedis.quit();
  });
});
