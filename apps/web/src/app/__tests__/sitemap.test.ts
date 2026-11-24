import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sitemap from '../sitemap';

const BASE = 'https://azeeboplus.com';

interface StubOptions {
  disabledSlugs?: string[];
  bootstrapFails?: boolean;
}

function stubFetch({ disabledSlugs = [], bootstrapFails = false }: StubOptions) {
  const content = (universe: string) =>
    JSON.stringify({
      data: { items: [{ id: `${universe}-1`, updatedAt: '2026-01-01T00:00:00Z' }] },
    });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (bootstrapFails && url.includes('/feature-flags/bootstrap')) {
        throw new Error('gateway down');
      }
      if (url.includes('/feature-flags/bootstrap')) {
        const flags = [
          'reality',
          'comedy',
          'sports',
          'games',
          'music',
          'movie',
          'lifestyle',
          'vertical',
        ].map((slug) => ({
          key: `universe.${slug}.enabled`,
          enabled: !disabledSlugs.includes(slug),
        }));
        return { ok: true, json: async () => ({ data: { flags } }) };
      }
      if (url.includes('/lifestyle/events'))
        return { ok: true, json: async () => ({ data: { events: [{ id: 'event-1' }] } }) };
      if (url.includes('/api/v1/content')) {
        const universe = new URL(url).searchParams.get('universe') ?? 'x';
        return { ok: true, json: async () => JSON.parse(content(universe)) };
      }
      return { ok: false, json: async () => ({}) };
    })
  );
}

describe('sitemap universe visibility', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = BASE;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('drops landing and content URLs for universes disabled via sentinel', async () => {
    stubFetch({ disabledSlugs: ['comedy'] });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).not.toContain(`${BASE}/comedy`);
    expect(urls).not.toContain(`${BASE}/watch/comedy-1`);
    // untouched universes stay published
    expect(urls).toContain(`${BASE}/reality`);
    expect(urls).toContain(`${BASE}/watch/reality-1`);
  });

  it('maps the movie slug to the /movies landing', async () => {
    stubFetch({ disabledSlugs: ['movie'] });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).not.toContain(`${BASE}/movies`);
    expect(urls).not.toContain(`${BASE}/movies/movie-1`);
  });

  it('gates the /lifestyle landing and event pages with the lifestyle sentinel', async () => {
    stubFetch({ disabledSlugs: ['lifestyle'] });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).not.toContain(`${BASE}/lifestyle`);
    expect(urls).not.toContain(`${BASE}/lifestyle/events/event-1`);
  });

  it('fails open (includes everything) when the bootstrap fetch fails', async () => {
    stubFetch({ bootstrapFails: true });
    const urls = (await sitemap()).map((e) => e.url);
    for (const seg of [
      'music',
      'movies',
      'lifestyle',
      'comedy',
      'reality',
      'sports',
      'games',
      'vertical',
    ]) {
      expect(urls).toContain(`${BASE}/${seg}`);
    }
  });

  it('keeps non-universe static pages regardless of sentinels', async () => {
    stubFetch({
      disabledSlugs: [
        'comedy',
        'reality',
        'sports',
        'games',
        'music',
        'movie',
        'lifestyle',
        'vertical',
      ],
    });
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(BASE);
    expect(urls).toContain(`${BASE}/browse`);
    expect(urls).toContain(`${BASE}/live`);
  });
});
