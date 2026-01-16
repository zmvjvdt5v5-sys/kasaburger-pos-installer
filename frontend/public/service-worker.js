const CACHE_NAME = 'kasaburger-v4';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache error:', err);
      })
  );
});

// Fetch event - network first strategy, skip caching for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for API requests and POST/PUT/DELETE methods
  if (url.pathname.startsWith('/api') || 
      event.request.method !== 'GET' ||
      url.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    fetch(event.request.clone())
      .then((response) => {
        // Only cache successful GET requests for static assets
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request.clone(), responseToCache);
            })
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Only use cache as fallback when offline
        return caches.match(event.request);
      })
  );
});

// Activate event - clear all old caches
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
  self.clients.claim();
});

// Listen for messages to force update
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
