import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'node:child_process';
// import Redis from 'ioredis';
import { SearchAvailabilityService } from './search-availability.service.js';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Dockerized search availability e2e: REAL Postgres (search schema via
 * `prisma db push`) — no in-process fakes.
 *
 * Scenario: seed content items with various statuses, types, universes, and
 * categories, then verify that availability filtering correctly includes/excludes
 * content based on filter criteria.
 *
 * Content seeded:
 *   - c1: published, video, reality, [entertainment, comedy]
 *   - c2: draft, video, reality, [entertainment]         → excluded (draft)
 *   - c3: published, podcast, lifestyle, [food, travel]  → excluded (wrong type for video filter)
 *   - c4: published, video, movies, [action]             → excluded (wrong universe for reality filter)
 *   - c5: published, video, reality, [news]              → excluded (wrong category for entertainment filter)
 *   - c6: archived, video, reality, [entertainment]      → excluded (archived status)
 *
 * Infra (see docker-compose.test.yml at the repo root):
 *   docker compose -f docker-compose.test.yml up -d --wait postgres-test
 *   pnpm --filter @azeebo/search-service test:e2e:availability
 *
 * Opt-in: skipped unless RUN_SEARCH_AVAILABILITY_E2E=1 or SEARCH_TEST_DATABASE_URL
 * is set, so the default `pnpm test` run never depends on docker.
 */

const RUN =
  process.env.RUN_SEARCH_AVAILABILITY_E2E === '1' || !!process.env.SEARCH_TEST_DATABASE_URL;

const DB_URL =
  process.env.SEARCH_TEST_DATABASE_URL ??
  'postgresql://azeebo_test:azeebo_test@localhost:5433/azeebo_search_test?schema=public';

const SEED_IDS = [
  'avail-e2e-c1',
  'avail-e2e-c2',
  'avail-e2e-c3',
  'avail-e2e-c4',
  'avail-e2e-c5',
  'avail-e2e-c6',
];

jest.setTimeout(120_000);

if (!RUN) {
  // eslint-disable-next-line azeebo-custom/no-console-log -- opt-in skip guidance for ops
  console.log(
    `[search.availability.e2e] Skipping — opt-in. Boot docker infra with \`docker compose ` +
      `-f docker-compose.test.yml up -d --wait postgres-test\` then run \`pnpm ` +
      `--filter @azeebo/search-service test:e2e:availability\`.`
  );
}

const liveDescribe = RUN ? describe : describe.skip;

liveDescribe('search availability filtering (real Postgres)', () => {
  let service: SearchAvailabilityService;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL;
    process.env.ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://127.0.0.1:1';

    // Schema-first: db push creates the full search schema — idempotent.
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'pipe',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchAvailabilityService, PrismaService],
    }).compile();

    service = module.get<SearchAvailabilityService>(SearchAvailabilityService);
    prisma = module.get<PrismaService>(PrismaService);

    // Seed content items with diverse attributes
    const seedData = [
      {
        id: 'avail-e2e-c1',
        title: 'Reality Comedy Show S1',
        description: 'A hilarious reality competition',
        thumbnail: 'https://example.com/c1.jpg',
        universeId: 'avail-e2e-universe-reality',
        universe: 'reality',
        contentType: 'video',
        status: 'published',
        viewCount: 1000,
        categories: ['entertainment', 'comedy'],
        creatorId: 'avail-e2e-creator-1',
        creatorName: 'Comedy King',
        metadata: {},
      },
      {
        id: 'avail-e2e-c2',
        title: 'Draft Reality Show',
        description: 'This is still in draft',
        thumbnail: 'https://example.com/c2.jpg',
        universeId: 'avail-e2e-universe-reality',
        universe: 'reality',
        contentType: 'video',
        status: 'draft',
        viewCount: 0,
        categories: ['entertainment'],
        creatorId: 'avail-e2e-creator-1',
        creatorName: 'Comedy King',
        metadata: {},
      },
      {
        id: 'avail-e2e-c3',
        title: 'Lifestyle Food Podcast',
        description: 'Cooking tips and food culture',
        thumbnail: 'https://example.com/c3.jpg',
        universeId: 'avail-e2e-universe-lifestyle',
        universe: 'lifestyle',
        contentType: 'podcast',
        status: 'published',
        viewCount: 500,
        categories: ['food', 'travel'],
        creatorId: 'avail-e2e-creator-2',
        creatorName: 'Chef Alice',
        metadata: {},
      },
      {
        id: 'avail-e2e-c4',
        title: 'Action Movie Trailer',
        description: 'Explosive action film',
        thumbnail: 'https://example.com/c4.jpg',
        universeId: 'avail-e2e-universe-movies',
        universe: 'movies',
        contentType: 'video',
        status: 'published',
        viewCount: 5000,
        categories: ['action'],
        creatorId: 'avail-e2e-creator-3',
        creatorName: 'Director Bob',
        metadata: {},
      },
      {
        id: 'avail-e2e-c5',
        title: 'Reality News Segment',
        description: 'Breaking news in reality TV',
        thumbnail: 'https://example.com/c5.jpg',
        universeId: 'avail-e2e-universe-reality',
        universe: 'reality',
        contentType: 'video',
        status: 'published',
        viewCount: 200,
        categories: ['news'],
        creatorId: 'avail-e2e-creator-4',
        creatorName: 'Reporter Carol',
        metadata: {},
      },
      {
        id: 'avail-e2e-c6',
        title: 'Archived Reality Show',
        description: 'This show was archived',
        thumbnail: 'https://example.com/c6.jpg',
        universeId: 'avail-e2e-universe-reality',
        universe: 'reality',
        contentType: 'video',
        status: 'archived',
        viewCount: 3000,
        categories: ['entertainment'],
        creatorId: 'avail-e2e-creator-1',
        creatorName: 'Comedy King',
        metadata: {},
      },
    ];

    for (const item of seedData) {
      await prisma.contentItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
  });

  afterAll(async () => {
    // Clean up seeded data
    for (const id of SEED_IDS) {
      await prisma.contentItem.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // ==========================================================================
  // checkContentAvailability — individual item checks
  // ==========================================================================

  describe('checkContentAvailability', () => {
    it('should return available for published video in reality', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c1', {});
      expect(result.available).toBe(true);
    });

    it('should return unavailable for draft content', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c2', {});
      expect(result.available).toBe(false);
      expect(result.reason).toContain('status');
    });

    it('should return unavailable for non-existent content', async () => {
      const result = await service.checkContentAvailability('nonexistent-id', {});
      expect(result.available).toBe(false);
      expect(result.reason).toBe('Content not found');
    });

    it('should return unavailable for archived content', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c6', {});
      expect(result.available).toBe(false);
      expect(result.reason).toContain('status');
    });

    it('should allow draft content with custom status filter', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c2', {
        statuses: ['draft', 'published'],
      });
      expect(result.available).toBe(true);
    });

    it('should filter by content type — reject podcast when video required', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c3', {
        contentTypes: ['video'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Content type');
    });

    it('should filter by content type — accept video', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c1', {
        contentTypes: ['video'],
      });
      expect(result.available).toBe(true);
    });

    it('should filter by universe — reject movies when reality required', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c4', {
        universes: ['reality'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('universe');
    });

    it('should filter by universe — accept reality', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c1', {
        universes: ['reality'],
      });
      expect(result.available).toBe(true);
    });

    it('should filter by categories — reject news when entertainment required', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c5', {
        categories: ['entertainment'],
      });
      expect(result.available).toBe(false);
      expect(result.reason).toContain('categories');
    });

    it('should filter by categories — accept when matching', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c1', {
        categories: ['entertainment'],
      });
      expect(result.available).toBe(true);
    });

    it('should accept content matching multiple filter criteria', async () => {
      const result = await service.checkContentAvailability('avail-e2e-c1', {
        statuses: ['published'],
        contentTypes: ['video'],
        universes: ['reality'],
        categories: ['entertainment', 'comedy'],
      });
      expect(result.available).toBe(true);
    });

    it('should reject when any single filter does not match', async () => {
      // c1 is published, video, reality — but we filter for podcast
      const result = await service.checkContentAvailability('avail-e2e-c1', {
        contentTypes: ['podcast'],
      });
      expect(result.available).toBe(false);
    });
  });

  // ==========================================================================
  // filterAvailableContent — batch filtering
  // ==========================================================================

  describe('filterAvailableContent', () => {
    it('should filter batch: only published content passes', async () => {
      const allIds = SEED_IDS;
      const result = await service.filterAvailableContent(allIds, {});

      // c1 (published), c3 (published), c4 (published), c5 (published) pass
      // c2 (draft), c6 (archived) are excluded
      expect(result).toContain('avail-e2e-c1');
      expect(result).toContain('avail-e2e-c3');
      expect(result).toContain('avail-e2e-c4');
      expect(result).toContain('avail-e2e-c5');
      expect(result).not.toContain('avail-e2e-c2');
      expect(result).not.toContain('avail-e2e-c6');
      expect(result).toHaveLength(4);
    });

    it('should filter by content type — only videos pass', async () => {
      const result = await service.filterAvailableContent(SEED_IDS, {
        contentTypes: ['video'],
      });

      // c1 (video), c4 (video), c5 (video) pass
      // c2 (draft), c3 (podcast), c6 (archived) excluded
      expect(result).toContain('avail-e2e-c1');
      expect(result).toContain('avail-e2e-c4');
      expect(result).toContain('avail-e2e-c5');
      expect(result).not.toContain('avail-e2e-c2');
      expect(result).not.toContain('avail-e2e-c3');
      expect(result).not.toContain('avail-e2e-c6');
      expect(result).toHaveLength(3);
    });

    it('should filter by universe — only reality passes', async () => {
      const result = await service.filterAvailableContent(SEED_IDS, {
        universes: ['reality'],
      });

      // c1 (reality, published), c5 (reality, published) pass
      // c2 (reality, draft), c3 (lifestyle), c4 (movies), c6 (reality, archived) excluded
      expect(result).toContain('avail-e2e-c1');
      expect(result).toContain('avail-e2e-c5');
      expect(result).not.toContain('avail-e2e-c2');
      expect(result).not.toContain('avail-e2e-c3');
      expect(result).not.toContain('avail-e2e-c4');
      expect(result).not.toContain('avail-e2e-c6');
      expect(result).toHaveLength(2);
    });

    it('should filter by categories — only entertainment passes', async () => {
      const result = await service.filterAvailableContent(SEED_IDS, {
        categories: ['entertainment'],
      });

      // c1 (entertainment, published) passes
      // c2 (entertainment, draft), c3 (food/travel), c4 (action), c5 (news), c6 (entertainment, archived) excluded
      expect(result).toContain('avail-e2e-c1');
      expect(result).not.toContain('avail-e2e-c2');
      expect(result).not.toContain('avail-e2e-c3');
      expect(result).not.toContain('avail-e2e-c4');
      expect(result).not.toContain('avail-e2e-c5');
      expect(result).not.toContain('avail-e2e-c6');
      expect(result).toHaveLength(1);
    });

    it('should apply combined filters — published videos in reality with entertainment', async () => {
      const result = await service.filterAvailableContent(SEED_IDS, {
        statuses: ['published'],
        contentTypes: ['video'],
        universes: ['reality'],
        categories: ['entertainment'],
      });

      // Only c1 matches all criteria
      expect(result).toEqual(['avail-e2e-c1']);
    });

    it('should return empty when no content matches combined filters', async () => {
      const result = await service.filterAvailableContent(SEED_IDS, {
        contentTypes: ['podcast'],
        universes: ['reality'],
      });

      // No published podcasts in reality universe
      expect(result).toHaveLength(0);
    });

    it('should return empty for non-existent IDs', async () => {
      const result = await service.filterAvailableContent(['nonexistent-1', 'nonexistent-2'], {});
      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // generateSuggestions
  // ==========================================================================

  describe('generateSuggestions', () => {
    it('should suggest content by partial title match', async () => {
      const suggestions = await service.generateSuggestions('Reality');
      expect(suggestions.length).toBeGreaterThan(0);
      // Should include titles containing "Reality"
      expect(suggestions.some((s) => s.toLowerCase().includes('reality'))).toBe(true);
    });

    it('should suggest content by word match', async () => {
      const suggestions = await service.generateSuggestions('Comedy Show');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty for completely unmatched query', async () => {
      const suggestions = await service.generateSuggestions('xyzzy12345');
      expect(suggestions).toHaveLength(0);
    });
  });

  // ==========================================================================
  // measureSearchLatency
  // ==========================================================================

  describe('measureSearchLatency', () => {
    it('should measure latency and return filtered result count', async () => {
      const result = await service.measureSearchLatency('Reality', {
        contentTypes: ['video'],
        universes: ['reality'],
      });

      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.resultCount).toBeGreaterThanOrEqual(1);
    });

    it('should return zero results when filters exclude everything', async () => {
      const result = await service.measureSearchLatency('Reality', {
        contentTypes: ['podcast'],
      });

      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.resultCount).toBe(0);
    });
  });

  // ==========================================================================
  // trackZeroResult
  // ==========================================================================

  describe('trackZeroResult', () => {
    it('should log zero-result telemetry without throwing', async () => {
      await expect(
        service.trackZeroResult({
          query: 'nonexistent-query',
          userId: 'test-user',
          timestamp: new Date(),
          universeId: 'reality',
          filters: { contentTypes: ['podcast'], universes: ['reality'] },
          resultCount: 0,
          suggestions: [],
        })
      ).resolves.toBeUndefined();
    });
  });
});
