const CACHE_NAME = 'train-app-v2';
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
  '/style.css' // add your CSS if exists
];

// Install event — cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // optional: immediately activate SW
});

// Activate event — cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // take control of all pages
});

// Fetch event — serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

// Listen for messages from page
self.addEventListener('message', event => {
  if (event.data === 'checkForUpdate') {
    // Notify client if a new service worker is waiting
    if (self.registration.waiting) {
      sendMessageToClients({ type: 'NEW_VERSION' });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // activate new SW immediately
  }
});

// Helper: send message to all clients
function sendMessageToClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}
