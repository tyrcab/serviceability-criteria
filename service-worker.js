const CACHE_NAME = 'train-app-v5'; // bump this on major releases
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

// Install event: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // activate new SW immediately
});

// Activate event: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim(); // take control immediately
});

// Fetch event: cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Listen for messages from the page
self.addEventListener('message', event => {
  if (event.data === 'checkForUpdate') {
    if (self.registration.waiting) {
      sendMessageToClients({ type: 'NEW_VERSION' });
    }
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Send message to all clients
function sendMessageToClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}
