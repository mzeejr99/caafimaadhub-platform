const CACHE_NAME = 'caafimaadhub-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-512x512.png',
  '/apple-touch-icon.png'
];

// ── Install: pre-cache static shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Do NOT call self.skipWaiting() here.
  // skipWaiting is triggered only after the user clicks "Refresh" in the
  // update banner (via postMessage { type: 'SKIP_WAITING' }).
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ── Message: allow the update banner to trigger skipWaiting ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] skipWaiting triggered by user action');
    self.skipWaiting();
  }
});

// ── Fetch: Network-first for navigation, Cache-first + SWR for assets ──
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Always bypass SW for API calls
  if (url.pathname.startsWith('/api/')) return;

  // Navigation (HTML pages) → Network-first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Static assets: Cache-first with Stale-While-Revalidate background refresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background refresh
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const accept = event.request.headers?.get('accept') || '';
          if (accept.includes('text/html')) {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
          }
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});
