import { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/site-url';
import { UNIVERSE_SLUGS, universeEnabledKey } from '../lib/flags';

// AUD-65: enumerate per-type content lists instead of only /featured, page
// through each source, and degrade to the static set when the gateway is
// unreachable at build time.
const PAGE_SIZE = 100;
const MAX_PAGES_PER_SOURCE = 5;
const MAX_TOTAL_DYNAMIC = 20000; // Google's cap is 50k URLs per sitemap file
const REVALIDATE = 3600;

const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3013';

interface SitemapItem {
  id?: string;
  slug?: string;
  updatedAt?: string;
}

/** Fetch a list endpoint; returns [] on any failure so the sitemap degrades gracefully. */
async function fetchList(path: string): Promise<SitemapItem[]> {
  try {
    const res = await fetch(`${gatewayUrl}${path}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: SitemapItem[] | { items?: SitemapItem[] } | { events?: SitemapItem[] };
    };
    const data = body?.data as
      | SitemapItem[]
      | { items?: SitemapItem[]; events?: SitemapItem[] }
      | undefined;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.events)) return data.events;
    return [];
  } catch {
    return [];
  }
}

/** Fetch up to MAX_PAGES_PER_SOURCE pages of a paginated collection. */
async function fetchPaged(buildPath: (page: number) => string): Promise<SitemapItem[]> {
  const out: SitemapItem[] = [];
  for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
    const items = await fetchList(buildPath(page));
    if (items.length === 0) break;
    out.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return out;
}

function entry(
  baseUrl: string,
  path: string,
  item: SitemapItem,
  priority: number
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}${path}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority,
  };
}

/** Universe landing segments → canonical slug, for sentinel visibility. */
const UNIVERSE_LANDING_SEGMENTS: Record<string, string> = {
  music: 'music',
  movies: 'movie',
  lifestyle: 'lifestyle',
  comedy: 'comedy',
  reality: 'reality',
  sports: 'sports',
  games: 'games',
  vertical: 'vertical',
};

/**
 * Slugs the admin has disabled (`universe.<slug>.enabled` sentinels from the
 * gateway bootstrap). A fetch failure returns an empty set — over-inclusion
 * is harmless for a sitemap, while failing the whole feed is not.
 */
async function fetchDisabledUniverseSlugs(): Promise<Set<string>> {
  try {
    const res = await fetch(`${gatewayUrl}/api/v1/feature-flags/bootstrap`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return new Set();
    const body = (await res.json()) as {
      data?: { flags?: Array<{ key: string; enabled: boolean }> };
    };
    const flags = body?.data?.flags;
    if (!Array.isArray(flags)) return new Set();
    const byKey = new Map(flags.map((f) => [f.key, f]));
    return new Set(
      UNIVERSE_SLUGS.filter((slug) => byKey.get(universeEnabledKey(slug))?.enabled === false)
    );
  } catch {
    return new Set();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/creators`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${baseUrl}/music`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    {
      url: `${baseUrl}/lifestyle`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: `${baseUrl}/comedy`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    {
      url: `${baseUrl}/reality`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    { url: `${baseUrl}/sports`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/games`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    {
      url: `${baseUrl}/vertical`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    { url: `${baseUrl}/live`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    {
      url: `${baseUrl}/premium`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [disabledSlugs, movies, music, comedy, reality, sports, games, events] = await Promise.all([
    fetchDisabledUniverseSlugs(),
    fetchPaged((p) => `/api/v1/content?universe=movie&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/content?universe=music&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/content?universe=comedy&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/content?universe=reality&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/content?universe=sports&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/content?universe=games&page=${p}&limit=${PAGE_SIZE}`),
    fetchPaged((p) => `/api/v1/lifestyle/events?page=${p}&limit=${PAGE_SIZE}`),
  ]);

  const dynamicPages: MetadataRoute.Sitemap = [];
  const push = (items: SitemapItem[], pathOf: (item: SitemapItem) => string, priority: number) => {
    for (const item of items) {
      const key = item.id ?? item.slug;
      if (!key || dynamicPages.length >= MAX_TOTAL_DYNAMIC) return;
      dynamicPages.push(entry(baseUrl, pathOf({ ...item, id: key }), item, priority));
    }
  };

  // Disabled universes surface no content URLs either; the fetch above may
  // still have returned rows (feed caches), so gate at the push.
  if (!disabledSlugs.has('movie')) push(movies, (i) => `/movies/${i.id}`, 0.7);
  for (const [slug, universe] of [
    ['music', music],
    ['comedy', comedy],
    ['reality', reality],
    ['sports', sports],
    ['games', games],
  ] as const) {
    if (!disabledSlugs.has(slug)) push(universe, (i) => `/watch/${i.id}`, 0.7);
  }
  if (!disabledSlugs.has('lifestyle')) push(events, (i) => `/lifestyle/events/${i.id}`, 0.6);

  // Drop landing pages for universes the admin has hidden.
  const disabledLandings = new Set(
    Object.entries(UNIVERSE_LANDING_SEGMENTS)
      .filter(([, slug]) => disabledSlugs.has(slug))
      .map(([segment]) => `${baseUrl}/${segment}`)
  );

  return [...staticPages.filter((page) => !disabledLandings.has(page.url)), ...dynamicPages];
}
