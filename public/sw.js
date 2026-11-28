const CACHE_NAME = 'paper-glimmer-static-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.png?v=2',
];

function shouldBypassCache(request) {
  if (request.method !== 'GET') {
    return true;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return true;
  }

  // Never intercept or cache non-HTTP(S) schemes (e.g. chrome-extension://)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return true;
  }

  // Never intercept Vite dev server / HMR / unbundled source paths
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return true;
  }

  // Never cache Supabase Auth, REST, Realtime, Storage, or Edge Functions
  if (
    url.hostname.endsWith('.supabase.co') ||
    url.hostname.endsWith('.supabase.in')
  ) {
    return true;
  }

  // Never cache dynamic API or auth paths, or requests carrying auth headers
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/realtime/') ||
    url.pathname.startsWith('/storage/') ||
    request.headers.has('Authorization') ||
    request.headers.has('apikey')
  ) {
    return true;
  }

  // Do not cache cross-origin third-party requests
  if (url.origin !== self.location.origin) {
    return true;
  }

  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const {request} = event;

  if (shouldBypassCache(request)) {
    return;
  }

  // Navigation requests: network-first with offline fallback to index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || Response.error();
        }),
    );
    return;
  }

  // Same-origin static assets: cache-first with background refresh
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.ok &&
            networkResponse.type === 'basic'
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkFetch;
    }),
  );
});
