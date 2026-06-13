// sw.js — Service Worker for Shadows Over Camelot PWA
// Cache-first for assets, network-first for HTML.
// Bump CACHE_NAME (and APP_VERSION in index.html) to invalidate cache on updates.

const CACHE_NAME = 'shadows-v90';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  './assets/knight-arthur.svg',
  './assets/knight-galahad.svg',
  './assets/knight-gawain.svg',
  './assets/knight-kay.svg',
  './assets/knight-palamedes.svg',
  './assets/knight-percival.svg',
  './assets/knight-tristan.svg',
  './assets/sword-white.svg',
  './assets/sword-black.svg',
  './assets/siege-engine.svg',
  './assets/excalibur.svg',
  './assets/holy-grail.svg',
  './assets/lancelot-armor.svg',
  './assets/card-back-white.svg',
  './assets/card-back-black.svg',
];

// ── Install: pre-cache all assets ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ── Activate: delete stale caches from previous versions ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Skip external API calls (Firebase, etc.) — let the browser handle them directly
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first for HTML navigation — always serve the latest index.html when online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for all other assets (icons, SVGs, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
