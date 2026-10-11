/* BagTime Service Worker — Always Network-First to ensure instant updates */
const CACHE = 'bagtime-v' + Date.now();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Always fetch fresh from network for everything to prevent stale UI
  event.respondWith(
    fetch(req)
      .then((res) => {
        return res;
      })
      .catch(() => caches.match(req))
  );
});
