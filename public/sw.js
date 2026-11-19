// SisaBerkah Field Logistics Service Worker (PWA Offline)
const CACHE_NAME = 'sisaberkah-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/distribusi',
  '/makanan/masuk',
  '/manifest.json',
  '/favicon.ico',
];

// Install: Pre-cache critical offline views
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn('[SW] Offline cache pre-fetch error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for dynamic navigation, falling back to cached response
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle navigation & page requests
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid responses for offline access
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline), attempt to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request, return root cached page
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/dashboard') || caches.match('/');
          }
        });
      })
  );
});
