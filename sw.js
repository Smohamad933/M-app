/* BagTime Service Worker — PWA offline app-shell
 * - Network-first for app shell and scripts so updates are instant
 * - Automated cache busting and immediate client takeover
 */
const CACHE = 'bagtime-v' + Date.now();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
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

  // API calls must always hit the live server — never cache
  if (url.pathname.indexOf('/api/') !== -1 || url.search.indexOf('action=') !== -1 || url.pathname === '/manifest.php' || url.pathname === '/app-icon.php') {
    return;
  }

  // Network-first strategy for everything to avoid stale bundle caching:
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && req.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
