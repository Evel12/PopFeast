const CACHE_NAME = "popfeast-cache-v2";
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/logo.png',
  '/profile.png'
];

// Install - precache only fixed assets (not js/css)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - delete old cache keys automatically
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler (enhanced offline support)
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // SPA navigation requests: cache-first for app shell to ensure offline works
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('/index.html');
      if (cached) {
        // Try to update cache in background but return shell immediately
        fetch('/index.html', { cache: 'no-store' })
          .then(res => caches.open(CACHE_NAME).then(c => c.put('/index.html', res.clone())))
          .catch(()=>{});
        return cached;
      }
      try {
        const fresh = await fetch('/index.html');
        const cache = await caches.open(CACHE_NAME);
        cache.put('/index.html', fresh.clone());
        return fresh;
      } catch {
        return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // API requests: network-first for GET; avoid caching non-GET; graceful offline for POST
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          if (request.method === 'GET') {
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
          }
          // For non-GET (e.g., POST to favorites), return controlled offline response
          return new Response(JSON.stringify({ error: 'offline', queued: true }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        })
    );
    return;
  }

  // For assets: cache-first for scripts/styles so offline works; update cache when online
  event.respondWith(
    (async () => {
      const dest = request.destination;
      if (dest === 'script' || dest === 'style' || dest === 'document') {
        const cached = await caches.match(request);
        if (cached) {
          // Update in background
          fetch(request).then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }).catch(()=>{});
          return cached;
        }
        try {
          const res = await fetch(request);
          const clone = res.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, clone);
          return res;
        } catch {
          // Fallback to app shell if document
          if (dest === 'document') return caches.match('/index.html');
          return caches.match(request);
        }
      }
      // Others: cache-first with network fallback and runtime caching
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        const clone = res.clone();
        if (request.method === 'GET' && url.origin === location.origin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, clone);
        }
        return res;
      } catch {
        if (request.destination === 'document') return caches.match('/index.html');
      }
    })()
  );
});
