const CACHE = 'medibilan-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Installation : mise en cache des ressources de base
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch : cache-first pour les ressources locales, réseau pour le reste
self.addEventListener('fetch', function(e) {
  // On ne intercepte que les requêtes GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // On met en cache les ressources locales réussies
        if (response.ok && e.request.url.startsWith(self.location.origin)) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        // Hors ligne et pas en cache : renvoie le HTML principal en fallback
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
