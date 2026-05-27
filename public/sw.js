const CACHE_NAME = 'football-stream-hub-v3';
const IMAGE_CACHE_NAME = 'football-stream-images-v2';

function isAppShellRequest(url, request) {
  return (
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/manifest.webmanifest'
  );
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== IMAGE_CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }

        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  if (isAppShellRequest(url, event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.mode === 'navigate') {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          if (event.request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) {
              return fallback;
            }
          }
          return Response.error();
        }),
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
