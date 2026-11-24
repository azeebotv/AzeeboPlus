import { resolvePoolTrackingIssueUrl } from '../ops.service';

/**
 * Unit tests for the pool-health tracking-issue URL resolver behind the
 * Ops Health card's sustained-row links (foreignPersistence.trackingIssueUrl).
 *
 * Resolution order (see resolvePoolTrackingIssueUrl): env override → GitHub
 * marker search (cached 10 min on success) → cached URL on failure. Every
 * failure degrades to null/cached — the resolver can never throw into the
 * health payload.
 *
 * Run: cd apps/admin && npx jest pool-tracking-link
 */

const CACHE = '/tmp/azeebo-admin-pool-tracking-link.test.json';

const clean = () => {
  try {
    require('node:fs').unlinkSync(CACHE);
  } catch {
    /* absent */
  }
};

const env = (over: Record<string, string | undefined>) => ({
  GITHUB_REPOSITORY: 'azeebotv/AzeeboPlus',
  GITHUB_API_BASE_URL: 'http://127.0.0.1:9', // unreachable — exercises failure paths
  ...over,
});

describe('resolvePoolTrackingIssueUrl', () => {
  beforeEach(clean);
  afterEach(clean);

  it('env override wins and never touches the network or cache', async () => {
    const url = await resolvePoolTrackingIssueUrl(
      { POOL_TRACKING_ISSUE_URL: 'https://github.com/azeebotv/AzeeboPlus/issues/7' },
      Date.now(),
      CACHE
    );
    expect(url).toBe('https://github.com/azeebotv/AzeeboPlus/issues/7');
  });

  it('no repo / no token → cached value (or null), never a fetch', async () => {
    expect(
      await resolvePoolTrackingIssueUrl({ GITHUB_REPOSITORY: undefined }, Date.now(), CACHE)
    ).toBeNull();
    // Seed the cache, then verify it is returned even without creds.
    require('node:fs').writeFileSync(
      CACHE,
      JSON.stringify({ url: 'https://github.com/azeebotv/AzeeboPlus/issues/9', at: Date.now() }),
      'utf8'
    );
    expect(
      await resolvePoolTrackingIssueUrl({ GITHUB_REPOSITORY: undefined }, Date.now(), CACHE)
    ).toBe('https://github.com/azeebotv/AzeeboPlus/issues/9');
  });

  it('search failure degrades to the cached URL (or null)', async () => {
    require('node:fs').writeFileSync(
      CACHE,
      JSON.stringify({ url: 'https://github.com/azeebotv/AzeeboPlus/issues/11', at: Date.now() }),
      'utf8'
    );
    const url = await resolvePoolTrackingIssueUrl(
      env({ POOL_TRACKING_GITHUB_TOKEN: 't' }),
      Date.now(),
      CACHE
    );
    expect(url).toBe('https://github.com/azeebotv/AzeeboPlus/issues/11');
  });

  it('search failure with no cache → null', async () => {
    const url = await resolvePoolTrackingIssueUrl(
      env({ POOL_TRACKING_GITHUB_TOKEN: 't' }),
      Date.now(),
      CACHE
    );
    expect(url).toBeNull();
  });

  it('garbage in the cache file is ignored (not returned)', async () => {
    require('node:fs').writeFileSync(CACHE, 'not json', 'utf8');
    expect(
      await resolvePoolTrackingIssueUrl({ GITHUB_REPOSITORY: undefined }, Date.now(), CACHE)
    ).toBeNull();
    // A cache entry that is not an https URL is also rejected.
    require('node:fs').writeFileSync(
      CACHE,
      JSON.stringify({ url: 'javascript:alert(1)', at: Date.now() }),
      'utf8'
    );
    expect(
      await resolvePoolTrackingIssueUrl({ GITHUB_REPOSITORY: undefined }, Date.now(), CACHE)
    ).toBeNull();
  });
});
