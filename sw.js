// Service worker de Soundcheck.
// - cache-first para estáticos (la app abre en modo avión)
// - network-only para /api/* y para todo lo de googleapis.com
//   (Firestore maneja su propio offline; nunca lo cacheamos aquí)

const CACHE = 'soundcheck-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './js/content.js',
  './js/normalize.js',
  './js/lcs.js',
  './js/leitner.js',
  './js/weakspots.js',
  './js/audio.js',
  './js/store.js',
  './js/firebaseConfig.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.filter((v, i, a) => a.indexOf(v) === i)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST /api/chat etc. pasan directo a la red

  const url = new URL(req.url);

  // network-only para API propia y para cualquier googleapis.com (Firestore/Auth).
  if (url.pathname.startsWith('/api/') || url.hostname.endsWith('googleapis.com')) {
    return; // deja pasar a la red por defecto; Firestore maneja su offline
  }

  // cache-first para el resto (estáticos).
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          // Cachea respuestas propias válidas para el próximo arranque offline.
          if (res && res.ok && (url.origin === self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
