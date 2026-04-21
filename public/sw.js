const CACHE_NAME = 'arcade-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'games/neon-drift.html',
  'games/cyber-defender.html',
  'games/grid-lock.html',
  'games/dino-run.html',
  'games/unit-defender.html',
  'games/neon-leap.html',
  'games/retro-2048.html',
  'games/bit-eater.html',
  'games/color-match.html',
  'games/bit-bounce.html',
  'games/retro-path.html',
  'games/cyber-bounce.html',
  'games/stack-tower.html',
  'games/cyber-jumper.html',
  'games/galaxy-overlord.html',
  'games/tic-tac-toe.html',
  'games/snake.html'
];

// Install event - Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened arcade cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Serve from cache if available, else fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache the new resource for future use if it's a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Fallback for when both cache and network fail (offline and not cached)
      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }
    })
  );
});
