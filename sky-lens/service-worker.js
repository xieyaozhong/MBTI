const VERSION = '1.7.0';
const CACHE = `sky-lens-pwa-v${VERSION}`;
const INDEX_URL = './index.html';
const ASSETS = [
  './', INDEX_URL,
  './performance-preload-v1.6.js',
  './styles-v1.3.css', './enhancements-v1.4.css', './performance-v1.6.css',
  './app-v1.3.js', './features-v1.7.js', './update-manager.js',
  './version.json', './manifest.webmanifest', './icon.svg', './recovery.html',
  './src/astronomy.js', './src/catalog.js', './src/simbad.js',
  './src/constellations.js', './src/solar-system.js',
];

async function cacheCoreAssets() {
  const cache = await caches.open(CACHE);
  await Promise.allSettled(ASSETS.map(async url => {
    const response = await fetch(url, { cache: 'reload' });
    if (response.ok) await cache.put(url, response);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(cacheCoreAssets().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('sky-lens-pwa-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'SW_ACTIVATED', version: VERSION });
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.source?.postMessage({ type: 'SW_VERSION', version: VERSION });
});

function fetchWithTimeout(request, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { cache: 'no-store', signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function navigationResponse(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetchWithTimeout(request, 5000);
    if (response.ok) await cache.put(INDEX_URL, response.clone());
    return response;
  } catch {
    return (await cache.match(INDEX_URL, { ignoreSearch: true })) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const update = fetch(request, { cache: 'no-cache' }).then(async response => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  if (cached) {
    update.catch(() => {});
    return cached;
  }
  return (await update) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(request, { ignoreSearch: true })));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
