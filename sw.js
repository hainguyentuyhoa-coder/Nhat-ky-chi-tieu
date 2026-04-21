const CACHE_NAME = 'nhat-ky-chi-tieu-v1.0.5';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './store.js',
  './manifest.json',
  './IMG_2208.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;

        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || (fetchResponse.status !== 200 && fetchResponse.status !== 0)) {
            return fetchResponse;
          }

          let responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      }).catch(() => {
        // Ignore fetch errors (e.g. offline and no cache match)
      })
  );
});
