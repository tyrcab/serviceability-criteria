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
  '/style.css'
];

let currentVersion = null;

// --- Install event: cache assets ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// --- Activate event: cleanup old caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  self.clients.claim();
});

// --- Fetch event: serve from cache first ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// --- Listen for messages from page ---
self.addEventListener('message', async event => {
  if (!event.data) return;

  if (event.data === 'checkForUpdate') {
    try {
      // Fetch latest version.json
      const response = await fetch('/version.json?t=' + Date.now());
      const versionData = await response.json();
      const newVersion = versionData.version;

      // Only notify if the version changed
      if (currentVersion && newVersion !== currentVersion) {
        sendMessageToClients({ type: 'NEW_VERSION' });
      }

      // Update the current version in SW memory
      currentVersion = newVersion;

      // Also trigger SW update
      await self.registration.update();

    } catch (err) {
      console.error('Error checking for update:', err);
    }

  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- Helper: send message to all clients ---
function sendMessageToClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}
