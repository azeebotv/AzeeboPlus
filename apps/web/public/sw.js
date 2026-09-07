/* eslint-disable no-restricted-globals */
// Azeebo+ Service Worker v1.0
// Provides offline caching, background sync, and stale-while-revalidate strategies

const CACHE_VERSION = 'azeebo-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/home',
  '/browse',
  '/auth/login',
  '/auth/register',
  '/offline',
  '/icon-192x192.png',
  '/apple-touch-icon.png',
];

// Cache duration limits
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const DYNAMIC_CACHE_MAX_ENTRIES = 100;
const IMAGE_CACHE_MAX_ENTRIES = 200;

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use allSettled so one missing URL does not break the entire precache
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            // Optional precache fail - non-fatal
            console.debug('[SW] Optional precache skipped for', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch Strategies ──────────────────────────────────────────────────────

// Network-first for API calls
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.method === 'GET') {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache-first for static assets
async function cacheFirstWithNetwork(request) {
  if (request.method === 'GET') {
    const cached = await caches.match(request);
    if (cached) return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 504 });
  }
}

// Stale-while-revalidate for images
async function staleWhileRevalidate(request) {
  if (request.method !== 'GET') {
    return fetch(request);
  }
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && request.method === 'GET') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Network-only for mutations (POST/PUT/DELETE) with offline queue
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    // Queue mutation for background sync
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      await queueMutation(request);
      return new Response(
        JSON.stringify({ queued: true, message: 'Request queued for sync when online' }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response('Offline', { status: 503 });
  }
}

// ─── Offline Queue ──────────────────────────────────────────────────────────

async function queueMutation(request) {
  const db = await openDB();
  const tx = db.transaction('mutations', 'readwrite');
  const store = tx.objectStore('mutations');

  const body = await request.text();
  const entry = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
    retryCount: 0,
  };

  store.add(entry);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      // Notify client that a mutation was queued
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'MUTATION_QUEUED', entry });
        });
      });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function processQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    const request = store.getAll();

    const entries = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const entry of entries) {
      try {
        await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        });
        store.delete(entry.id);
      } catch {
        entry.retryCount += 1;
        if (entry.retryCount > 3) {
          store.delete(entry.id); // Give up after 3 retries
        } else {
          store.put(entry);
        }
      }
    }

    // Notify clients that queue was processed
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'QUEUE_PROCESSED' });
      });
    });
  } catch (err) {
    console.warn('[SW] Queue processing failed:', err);
  }
}

// IndexedDB for offline queue persistence
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('azeebo-offline-queue', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Background Sync ────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'process-mutations') {
    event.waitUntil(processQueue());
  }
});

// ─── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Azeebo+', body: 'New notification' };

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/home';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existingClient = clients.find((c) => c.url.includes(self.location.origin));
      if (existingClient) {
        existingClient.focus();
        existingClient.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});

// ─── Fetch Event Router ─────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS schemes (ignore chrome-extension:, ws:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Bypass service worker completely for Next.js internal assets, chunks, and HMR
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // Mutations (POST, PUT, DELETE, PATCH) → network only (with offline queue)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Skip any other non-GET methods
  if (request.method !== 'GET') {
    return;
  }

  // API calls → network-first with cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Feature flags → network-first
  if (url.pathname.startsWith('/feature-flags/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Images → stale-while-revalidate
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static assets → cache-first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // Navigation → network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && request.method === 'GET') {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Offline fallback page
          const offlinePage = await caches.match('/offline');
          return offlinePage || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Default → cache-first
  event.respondWith(cacheFirstWithNetwork(request));
});

// ─── Message Handler ────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'PROCESS_QUEUE') {
    processQueue();
  }
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
