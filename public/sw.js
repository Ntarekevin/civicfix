const CACHE_NAME = 'civicfix-pwa-v3';
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/explore',
  '/track',
  '/mentions',
  '/report',
  '/settings',
  '/notifications',
  '/admin/dashboard',
  '/admin/login',
  '/manifest.json',
  '/globe.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => 
          fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
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
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Only intercept GET requests from our origin
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests; let api.js handle its own localStorage caching
  if (e.request.url.includes('/api/') || e.request.url.includes('supabase.co') || e.request.url.includes('chrome-extension')) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const networkResponse = await fetch(e.request);
        // Ensure we only cache valid 200 responses to avoid caching 307 redirects or errors
        if (networkResponse.ok && networkResponse.status === 200 && networkResponse.type === 'basic') {
          cache.put(e.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        // Try strict match
        let cachedResponse = await cache.match(e.request);
        if (cachedResponse) return cachedResponse;
        
        // Try ignore search (for Next.js ?_rsc= or URL params)
        cachedResponse = await cache.match(e.request, { ignoreSearch: true });
        if (cachedResponse) return cachedResponse;
        
        // Final fallback: If it's a navigation request and absolutely nothing matched,
        // we assume the precache failed. We return the root '/' but this may cause Next.js routing bugs.
        // Returning Response.error() is safer so the browser shows the dinosaur, but we'll try '/' for SPA feel.
        if (e.request.mode === 'navigate') {
          return cache.match('/');
        }
        throw err;
      }
    })
  );
});
