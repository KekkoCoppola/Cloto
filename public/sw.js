const CACHE_NAME = 'cloto-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICA-05 fix: never serve API calls or cross-origin requests from cache.
  // API calls must always reach the network to get a fresh response.
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for local static assets only.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
