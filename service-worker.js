const CACHE_NAME = 'train-app-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/trains.json',
  '/comeng.json',
  '/siemens.json',
  '/Xtrapolis.json',
  '/hcmt.json',
  '/version.json',
  '/style.css'
];

// --- Install event ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  // Don't call skipWaiting() here — wait for user confirmation
});

// --- Activate event ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

// --- Fetch event ---
self.addEventListener('fetch', event => {
  // Serve normally for version.json from network to avoid cache issues
  if (event.request.url.includes('version.json')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// --- Listen for messages from page ---
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // only activate when user clicks update
  }
});

// --- Helper: send message to clients ---
function sendMessageToClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}
