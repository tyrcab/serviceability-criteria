// ✅ Current app version (auto-bumped by GitHub Action)
const APP_VERSION = "v1.0.11"; // will be updated automatically by bump-version.js

// Static assets to cache (no SW or version.json!)
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

const CACHE_NAME = `scg-cache-${APP_VERSION}`;

// --- Install: cache static assets ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// --- Activate: clear old caches ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith("scg-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// --- Fetch handler ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't cache the service worker itself or version.json
  if (url.pathname.endsWith("service-worker.js") || url.pathname.endsWith("version.json")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // JSON: network-first
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
      );
    })
  );
});

// --- Bonus: check for updates manually ---
self.addEventListener("message", (event) => {
  if (event.data === "checkForUpdate") {
    fetch("./version.json")
      .then((r) => r.json())
      .then((data) => {
        if (data.version && data.version !== APP_VERSION) {
          // New version detected
          event.source.postMessage({ type: "NEW_VERSION" });
        }
      })
      .catch(() => console.log("No version update available."));
  }
});
