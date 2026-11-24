#!/usr/bin/env node
/**
 * Minimal deterministic mock of the API gateway's public endpoints, for
 * Performance Budget CI only.
 *
 * The problem it fixes: the Lighthouse job runs `next start` with no backend,
 * so every page's data fetch fails (500s surfacing in the console), the browse
 * page renders its empty state, and LCP/TTI measure spinner waits instead of
 * the UI. Those failures are environment artifacts, not regressions.
 *
 * Serve with:  node scripts/build-mock-api.mjs  (listens on PORT, default 3013)
 * Then start the web app with API_GATEWAY_URL=http://localhost:$PORT.
 *
 * Envelope shape matches the real API's ApiResponse<T>: { success, data }.
 * Responses are byte-identical across runs (fixed arrays, no timestamps) so
 * Lighthouse results are comparable.
 */
import http from 'node:http';

const port = Number(process.env.PORT || 3013);

const img = (seed, w, h) => `https://placehold.co/${w}x${h}/E8420A/FFF7ED.png?text=${seed}`;
const item = (i) => ({
  id: `mock-content-${String(i).padStart(2, '0')}`,
  title: `Featured Title ${i}`,
  description: 'Deterministic mock synopsis for performance measurement.',
  type: ['movie', 'series', 'comedy'][i % 3],
  posterUrl: img(`T${i}`, 400, 600),
  backdropUrl: img(`B${i}`, 1200, 400),
  thumbnailUrl: img(`T${i}`, 400, 300),
  genres: ['Action', 'Drama'],
  rating: 7 + (i % 3) * 0.5,
  releaseYear: 2024 + (i % 2),
  universe: ['movies', 'comedy', 'reality'][i % 3],
});

const DB = {
  '/api/v1/public/settings': {
    siteName: 'Azeebo+',
    tagline: 'One platform. Every universe.',
    logoUrl: '/images/logo-white.png',
    theme: { primary: '#E8420A', background: '#0b090e' },
  },
  '/api/v1/public/universes': [
    { id: 'movies', name: 'Movies', slug: 'movies', isActive: true },
    { id: 'comedy', name: 'Comedy', slug: 'comedy', isActive: true },
    { id: 'reality', name: 'Reality', slug: 'reality', isActive: true },
    { id: 'music', name: 'Music', slug: 'music', isActive: true },
  ],
  '/api/v1/content/categories': [
    { id: 'trending', name: 'Trending', slug: 'trending' },
    { id: 'new-releases', name: 'New Releases', slug: 'new-releases' },
    { id: 'editor-picks', name: 'Editor Picks', slug: 'editor-picks' },
  ],
  '/api/v1/content/featured': Array.from({ length: 10 }, (_, i) => item(i + 1)),
  '/api/v1/content/trending': Array.from({ length: 12 }, (_, i) => item(i + 1)),
};

// A body for any /api/v1/content/* path not listed above (list endpoints).
const fallbackList = Array.from({ length: 8 }, (_, i) => item(i + 1));

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  let body;
  if (Object.prototype.hasOwnProperty.call(DB, path)) {
    body = DB[path];
  } else if (path.startsWith('/api/v1/content/')) {
    body = fallbackList;
  } else if (path.startsWith('/api/') || path.startsWith('/feature-flags/')) {
    body = {};
  } else {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'not found' }));
    return;
  }
  const payload = JSON.stringify({ success: true, data: body });
  res.writeHead(200, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  });
  res.end(payload);
});

server.listen(port, () => {
  console.log(`[mock-api] listening on http://localhost:${port}`);
});
