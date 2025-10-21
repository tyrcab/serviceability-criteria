// List of files to cache (static assets)
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./trains.json",
  "./comeng.json",
  "./siemens.json",
  "./xtrapolis.json",
  "./hcmt.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Base cache name
const CACHE_BASE = "scg-cache";

// Install SW: cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(`${CACHE_BASE}-temp`).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate SW: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith(CACHE_BASE + "-temp")) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return caches.rename(`${CACHE_BASE}-temp`, CACHE_BASE);
    })
  );
  self.clients.claim();
});

// Fetch: network-first for JSONs, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // JSON files: network-first
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_BASE).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other static files: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_BASE).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    })
  );
});
