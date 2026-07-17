const VERSION = '1.5.0';
const CACHE = `sky-lens-pwa-v${VERSION}`;
const INDEX_URL = './index.html';
const ASSETS = [
  './',
  INDEX_URL,
  './styles-v1.3.css',
  './app-v1.3.js',
  './enhancements-v1.4.css',
  './enhancements-v1.4.js',
  './update-manager.js',
  './version.json',
  './manifest.webmanifest',
  './icon.svg',
  './src/astronomy.js',
  './src/catalog.js',
  './src/simbad.js',
  './src/constellations.js',
  './src/solar-system.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'SW_ACTIVATED', version: VERSION });
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'SW_VERSION', version: VERSION });
  }
});

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, INDEX_URL));
    return;
  }

  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match('./version.json')));
    return;
  }

  event.respondWith(networkFirst(request));
});
