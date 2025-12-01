const CACHE_NAME = "popfeast-cache-v5";
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
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      // Warm common API endpoints if online
      const apiToWarm = [
        '/api/movies',
        '/api/series',
        '/api/meta/genres',
        '/api/favorites'
      ];
      await Promise.all(apiToWarm.map(async (u) => {
        try {
          const res = await fetch(u, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
          const ct = res.headers.get('content-type') || '';
          if (res && res.ok && ct.includes('application/json')) {
            await cache.put(u, res.clone());
          }
        } catch {}
      }));
    })()
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
  const bypass = url.searchParams.has('__bypass') || request.headers.get('x-bypass-cache') === '1';

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

  // API requests: cache-first for GET with background refresh; graceful offline for non-GET
  if (url.pathname.startsWith("/api/")) {
    event.respondWith((async () => {
      if (request.method === 'GET') {
        const isDetail = /^\/api\/(movies|series)\/[0-9a-fA-F-]+$/.test(url.pathname);
        const isFavorites = url.pathname === '/api/favorites';
        // Detail endpoints or explicit bypass: network-first to reflect DB immediately
        if (bypass || isDetail) {
          try {
            const res = await fetch(request);
            const ct = res.headers.get('content-type') || '';
            if (isDetail && res.ok && ct.includes('application/json')) {
              // Cache successful detail JSON for offline revisit
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, res.clone());
            }
            return res;
          } catch {
            return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
          }
        }

        // Favorites and other GETs: cache-first with background refresh (offline friendly)
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        fetch(request).then(res => {
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) cache.put(request, res.clone());
        }).catch(()=>{});
        if (cached) return cached;
        try {
          const res = await fetch(request);
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) cache.put(request, res.clone());
          return res;
        } catch {
          return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
      } else {
        // Non-GET: attempt network, else report offline/queued
        try {
          return await fetch(request);
        } catch {
          return new Response(JSON.stringify({ error: 'offline', queued: true }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
      }
    })());
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
