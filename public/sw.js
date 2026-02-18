const CACHE_NAME = 'agent-dashboard-v3';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First for API, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Skip WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') return;

  // Always fetch HTML navigation requests fresh (never cache the shell)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network First for API routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Always network-first for JS/CSS assets (Vite hash-busts them already)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache First for other static assets (icons, manifest, etc.)
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', message: 'No cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // For navigation requests, return cached index.html (SPA fallback)
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/index.html');
      if (cachedIndex) return cachedIndex;
    }
    return new Response('Offline', { status: 503 });
  }
}
