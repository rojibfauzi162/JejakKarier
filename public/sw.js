const CACHE_NAME = 'fokuskarir-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Abaikan request ke API internal atau eksternal
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // Network First strategy for HTML and root requests
  if (event.request.mode === 'navigate' || 
      event.request.url.endsWith('/') || 
      event.request.url.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the response is a 404 (not found), it might be an SPA route
          // Serve /index.html from cache instead
          if (response.status === 404) {
            return caches.match('/') || caches.match('/index.html') || response;
          }
          // Update cache with the new response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to /index.html from cache if network fails
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch((error) => {
          console.error('Fetch failed:', error);
          return null;
        });

        return response || fetchPromise.then(res => res || new Response('Network error', { status: 408 }));
      })
  );
});
