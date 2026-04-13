/**
 * sw.js — Service Worker (Cache-First Strategy)
 * Must live at repo root for correct scope
 */
const CACHE_NAME  = 'jobradar-v1';
const ANTHROPIC   = 'api.anthropic.com';

// All static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/ats.css',
  '/css/radar.css',
  '/css/voice.css',
  '/css/kanban.css',
  '/js/db.js',
  '/js/api.js',
  '/js/ats.js',
  '/js/radar.js',
  '/js/voice.js',
  '/js/kanban.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: pre-cache all app shell assets ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache error:', err))
  );
});

// ── Activate: remove old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k  => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for shell; network-only for API ───────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache Anthropic API calls
  if (url.includes(ANTHROPIC)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache successful same-origin responses
          if (response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
