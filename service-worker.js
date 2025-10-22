// Increment this version whenever you deploy new code
const APP_VERSION = "v1.0.5"; // <-- bump this to force update

// Cache name includes version
const CACHE_NAME = `scg-cache-${APP_VERSION}`;

// Files to cache
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./trains.json",
  "./comeng.json",
  "./siemens.json",
  "./Xtrapolis.json",
  "./hcmt.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("scg-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy: network-first for JSON, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle only same-origin requests
  if (url.origin !== self.location.origin) return;

  // JSON: network-first
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      );
    })
  );
});

// 🔄 Notify clients when a new version is available
self.addEventListener("message", (event) => {
  if (event.data === "checkForUpdate") {
    fetch("version.json")
      .then((r) => r.json())
      .then((latest) => {
        if (latest.version !== APP_VERSION) {
          // Tell all tabs to reload
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => client.postMessage({ type: "NEW_VERSION" }));
          });
        }
      })
      .catch(() => {});
  }
});
