const CACHE_NAME = 'wms-v3';

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

// ── Notifications (impersonation expiry alert) ──────────────────────────────
// The ImpersonationBanner shows a Web Notification when a support session is
// about to expire. Clicking it (or its actions) lands here; we focus the
// dashboard tab and forward the chosen action so the page can renew or close
// the session. `renew`/`close` only run in a controlled tab — the server-side
// record is the source of truth and self-expires anyway.
self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'default';
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        try {
          if ('focus' in client) {
            await client.focus();
            break;
          }
        } catch (e) {
          // Ignore — the tab may have been closed.
        }
      }
      for (const client of clientList) {
        try {
          client.postMessage({ type: 'imp-action', action });
        } catch (e) {
          // Ignore — no client available.
        }
      }
    })()
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
