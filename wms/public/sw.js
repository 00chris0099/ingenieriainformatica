const CACHE_NAME = 'wms-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        self.clients.claim(),
        ...cacheNames.map((cacheName) => caches.delete(cacheName)),
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL FIX: NEVER intercept HTML document page navigations, non-GET requests, or API routes.
  // Letting the browser handle page navigations directly eliminates Chrome/Android ERR_FAILED redirect errors.
  if (
    event.request.mode === 'navigate' ||
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/login')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
