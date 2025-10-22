const CACHE_NAME = 'train-app-v3'; // updated version to force cache refresh
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

// --- Install: cache assets ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // activate new SW immediately
});

// --- Activate: clean up old caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim(); // take control immediately
});

// --- Fetch: cache-first strategy ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// --- Listen for messages from page ---
self.addEventListener('message', async event => {
  if (event.data === 'checkForUpdate') {
    // Check for new SW version
    const registration = await self.registration.update();
    if (self.registration.waiting) {
      sendMessageToClients({ type: 'NEW_VERSION' });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // Activate new SW immediately
    self.skipWaiting();
  }
});

// --- Helper: send message to all clients ---
function sendMessageToClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}
