/**
 * LASS Brand Clothes — Production PWA Service Worker (v5)
 * Cross-platform offline asset caching, network-first document navigation,
 * and strict direct-network bypass for PayFast live payment APIs.
 */

const CACHE_NAME = 'lass-brand-cache-v5';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Non-fatal precache item skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: purge legacy caches immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: smart cross-platform caching policy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. CRITICAL: Never intercept or cache API routes, live payment endpoints, or cloudflare worker routes
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('payfast.co.za') ||
    url.pathname.includes('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.startsWith('/src')
  ) {
    return;
  }

  // 2. Navigation Requests (HTML / Page Routes): Network-First
  // Guarantees fresh content and script bundles are always delivered when online,
  // while seamlessly falling back to cached app shell when offline on subway/airplane.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response, cache a clone for offline use
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static Assets (Images, Clothes Catalog, Web Fonts, Styles, Bundles):
  // Cache-First with background network update (Stale-While-Revalidate / Cache-First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Only cache static images, clothing photos, fonts, and hashed build assets
        const path = url.pathname;
        if (
          path.startsWith('/assets/') ||
          path.startsWith('/clothes/') ||
          path.endsWith('.svg') ||
          path.endsWith('.png') ||
          path.endsWith('.jpg') ||
          path.endsWith('.webp') ||
          path.endsWith('.woff2')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Return 1x1 transparent pixel or empty response on image network failure
        return cachedResponse || Promise.reject(err);
      });
    })
  );
});
