// Command Tower service worker
// Goal: make the app shell installable and openable offline, WITHOUT ever
// caching live game data. Supabase calls and any cross-origin request
// (fonts, etc.) pass straight through untouched.
//
// Everything same-origin is network-first: always try the real network
// response first, and only fall back to a cached copy if the network
// genuinely fails (offline). This intentionally trades a small amount of
// performance for correctness — with icons and app code both liable to
// change during setup/updates, a "cache-first" static-asset strategy
// caused stale icons to get stuck. Network-first avoids that entirely.

const CACHE_NAME = 'command-tower-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only ever intercept same-origin GETs. Supabase, fonts, everything else: pass through.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first for everything same-origin (HTML, manifest, icons alike).
  // Always fetch fresh when online; cache is purely an offline fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
